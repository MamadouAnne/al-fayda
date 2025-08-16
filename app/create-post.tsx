import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Image, 
  ScrollView, 
  FlatList,
  Alert,
  Dimensions,
  StyleSheet,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { postsApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { uploadMedia, testStorageSetup } from '@/lib/supabase';
const { width } = Dimensions.get('window');

interface MediaItem {
  uri: string;
  type: 'photo' | 'video';
}

const HASHTAG_SUGGESTIONS = [
  '#blessed', '#love', '#instagood', '#photooftheday', '#beautiful',
  '#happy', '#follow', '#picoftheday', '#like4like', '#instadaily',
  '#friends', '#repost', '#nature', '#fun', '#style', '#smile',
  '#food', '#instalike', '#family', '#travel', '#fitness', '#life'
];

export default function CreatePostScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [caption, setCaption] = useState('');
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [location, setLocation] = useState<string>('');
  const [showHashtagSuggestions, setShowHashtagSuggestions] = useState(false);
  const [hashtagQuery, setHashtagQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const captionRef = useRef<TextInput>(null);

  useEffect(() => {
    // Don't request permissions on mount - request them when needed
    // This prevents the permission dialog from blocking the UI immediately
  }, []);

  const requestPermissions = async () => {
    try {
      const mediaPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      const locationPermission = await Location.requestForegroundPermissionsAsync();
      
      console.log('Media permission:', mediaPermission.status);
      console.log('Location permission:', locationPermission.status);
      
      return {
        media: mediaPermission.status === 'granted',
        location: locationPermission.status === 'granted'
      };
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return { media: false, location: false };
    }
  };

  const pickMedia = async () => {
    try {
      // Request permission before accessing media
      const permissions = await requestPermissions();
      
      if (!permissions.media) {
        Alert.alert(
          'Permission Required', 
          'Please grant access to your photo library to add images to your post.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => console.log('Open app settings') }
          ]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsMultipleSelection: true,
        selectionLimit: 10,
        quality: 0.8,
        aspect: [1, 1],
        allowsEditing: false,
      });

      if (!result.canceled && result.assets) {
        const newMediaItems: MediaItem[] = result.assets.map(asset => ({
          uri: asset.uri,
          type: asset.type === 'video' ? 'video' : 'photo'
        }));
        setMediaItems([...mediaItems, ...newMediaItems].slice(0, 10));
      }
    } catch (error) {
      console.error('Error picking media:', error);
      Alert.alert('Error', 'Failed to pick media');
    }
  };

  const removeMediaItem = (index: number) => {
    const newItems = mediaItems.filter((_, i) => i !== index);
    setMediaItems(newItems);
    if (currentMediaIndex >= newItems.length && newItems.length > 0) {
      setCurrentMediaIndex(newItems.length - 1);
    }
  };

  const getCurrentLocation = async () => {
    try {
      setIsLoading(true);
      
      // Request permission before accessing location
      const permissions = await requestPermissions();
      
      if (!permissions.location) {
        Alert.alert(
          'Permission Required', 
          'Please grant location access to add your location to the post.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => console.log('Open app settings') }
          ]
        );
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      const [reverseGeocode] = await Location.reverseGeocodeAsync({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      if (reverseGeocode) {
        const locationString = `${reverseGeocode.city}, ${reverseGeocode.region}`;
        setLocation(locationString);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to get location');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCaptionChange = (text: string) => {
    setCaption(text);
    
    const words = text.split(' ');
    const lastWord = words[words.length - 1];
    
    if (lastWord.startsWith('#') && lastWord.length > 1) {
      setHashtagQuery(lastWord.substring(1));
      setShowHashtagSuggestions(true);
    } else {
      setShowHashtagSuggestions(false);
      setHashtagQuery('');
    }
  };

  const insertHashtag = (hashtag: string) => {
    const words = caption.split(' ');
    words[words.length - 1] = hashtag + ' ';
    setCaption(words.join(' '));
    setShowHashtagSuggestions(false);
    captionRef.current?.focus();
  };

  const filteredHashtags = HASHTAG_SUGGESTIONS.filter(tag => 
    tag.toLowerCase().includes(hashtagQuery.toLowerCase())
  );

  const handlePost = async () => {
    if (!isAuthenticated) {
      Alert.alert('Authentication Required', 'Please sign in to create a post.');
      router.push('/sign-in');
      return;
    }

    if (!caption.trim() && mediaItems.length === 0) {
      Alert.alert('Empty Post', 'Please add some content or media to your post.');
      return;
    }

    setIsLoading(true);
    try {
      // Extract hashtags from caption
      const hashtags = caption.match(/#\w+/g) || [];
      
      // Upload images to Supabase storage first
      const imageUris = mediaItems.map(item => item.uri);
      let uploadedImageUrls: string[] = [];
      
      if (imageUris.length > 0) {
        console.log('📤 Uploading images to storage...');
        
        // Test storage setup first
        await testStorageSetup();
        
        uploadedImageUrls = await uploadMedia(imageUris, 'posts');
        console.log('✅ Images uploaded:', uploadedImageUrls);
        
        if (uploadedImageUrls.length === 0) {
          throw new Error('Failed to upload any images');
        }
      }
      
      // Create the post using the API with uploaded image URLs
      const newPost = await postsApi.createPost(
        caption,
        uploadedImageUrls.length > 0 ? uploadedImageUrls : undefined,
        location || undefined,
        hashtags.length > 0 ? hashtags : undefined
      );

      console.log('Post created successfully:', newPost);
      
      Alert.alert('Success', 'Your post has been shared!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error creating post:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create post. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMediaItem = ({ item, index }: { item: MediaItem; index: number }) => (
    <View style={styles.mediaContainer}>
      <Image source={{ uri: item.uri }} style={styles.mediaImage} />
      <TouchableOpacity 
        style={styles.removeMediaButton}
        onPress={() => removeMediaItem(index)}
      >
        <Ionicons name="close-circle" size={24} color="#EF4444" />
      </TouchableOpacity>
      {item.type === 'video' && (
        <View style={styles.videoOverlay}>
          <Ionicons name="play-circle" size={40} color="white" />
        </View>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={['#f8fafc', '#f1f5f9']}
        style={styles.gradientBackground}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.cancelButton}>
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Post</Text>
          <TouchableOpacity 
            onPress={handlePost}
            disabled={isLoading}
            style={[styles.postButton, { opacity: isLoading ? 0.6 : 1 }]}
          >
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.postButtonGradient}
            >
              <Text style={styles.postButtonText}>
                {isLoading ? 'Posting...' : 'Post'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Caption Input */}
          <View style={styles.captionContainer}>
            <TextInput
              ref={captionRef}
              placeholder="What's happening? Share your thoughts..."
              placeholderTextColor="#9CA3AF"
              value={caption}
              onChangeText={handleCaptionChange}
              multiline
              style={styles.captionInput}
              maxLength={2200}
            />
            <Text style={styles.characterCount}>
              {caption.length}/2200
            </Text>
          </View>

          {/* Hashtag Suggestions */}
          {showHashtagSuggestions && (
            <View style={styles.hashtagSuggestions}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {filteredHashtags.map((hashtag, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.hashtagSuggestion}
                    onPress={() => insertHashtag(hashtag)}
                  >
                    <Text style={styles.hashtagText}>{hashtag}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Media Section */}
          {mediaItems.length > 0 && (
            <View style={styles.mediaSection}>
              <FlatList
                data={mediaItems}
                renderItem={renderMediaItem}
                keyExtractor={(_, index) => index.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.mediaList}
              />
            </View>
          )}

          {/* Location */}
          {location ? (
            <View style={styles.locationContainer}>
              <Ionicons name="location" size={18} color="#667eea" />
              <Text style={styles.locationText}>{location}</Text>
              <TouchableOpacity onPress={() => setLocation('')}>
                <Ionicons name="close-circle" size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton} onPress={pickMedia}>
              <Ionicons name="image" size={24} color="#667eea" />
              <Text style={styles.actionButtonText}>Photo/Video</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={getCurrentLocation}
              disabled={isLoading}
            >
              <Ionicons name="location" size={24} color="#667eea" />
              <Text style={styles.actionButtonText}>Location</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="pricetag" size={24} color="#667eea" />
              <Text style={styles.actionButtonText}>Tag People</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cancelButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  postButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  postButtonGradient: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  postButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  captionContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  captionInput: {
    fontSize: 18,
    color: '#1F2937',
    lineHeight: 26,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  characterCount: {
    alignSelf: 'flex-end',
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
  hashtagSuggestions: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  hashtagSuggestion: {
    backgroundColor: '#f0f9ff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e0f2fe',
  },
  hashtagText: {
    color: '#0ea5e9',
    fontSize: 14,
    fontWeight: '500',
  },
  mediaSection: {
    marginBottom: 16,
  },
  mediaList: {
    paddingHorizontal: 4,
  },
  mediaContainer: {
    position: 'relative',
    marginRight: 12,
  },
  mediaImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
  },
  removeMediaButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  locationText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#1F2937',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
  },
  actionButtonText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
});
