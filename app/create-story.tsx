import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Image, 
  Alert,
  Dimensions,
  StyleSheet,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { storiesApi } from '@/lib/api';
import { uploadMediaToStorage } from '@/lib/supabase';

const { width, height } = Dimensions.get('window');

export default function CreateStoryScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [mediaUri, setMediaUri] = useState<string>('');
  const [caption, setCaption] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const requestPermissions = async () => {
    try {
      const mediaPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      
      return {
        media: mediaPermission.status === 'granted',
        camera: cameraPermission.status === 'granted'
      };
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return { media: false, camera: false };
    }
  };

  const pickFromGallery = async () => {
    try {
      const permissions = await requestPermissions();
      
      if (!permissions.media) {
        Alert.alert(
          'Permission Required', 
          'Please grant access to your photo library to add images to your story.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => console.log('Open app settings') }
          ]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsEditing: true,
        aspect: [9, 16], // Story aspect ratio
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setMediaUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking media:', error);
      Alert.alert('Error', 'Failed to pick media');
    }
  };

  const takePhoto = async () => {
    try {
      const permissions = await requestPermissions();
      
      if (!permissions.camera) {
        Alert.alert(
          'Permission Required', 
          'Please grant camera access to take a photo for your story.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => console.log('Open app settings') }
          ]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [9, 16], // Story aspect ratio
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setMediaUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const handleCreateStory = async () => {
    if (!isAuthenticated) {
      Alert.alert('Authentication Required', 'Please sign in to create a story.');
      router.push('/sign-in');
      return;
    }

    if (!mediaUri) {
      Alert.alert('Media Required', 'Please add a photo or video to your story.');
      return;
    }

    setIsLoading(true);
    try {
      // Determine media type
      const mediaType = mediaUri.toLowerCase().includes('.mp4') || 
                       mediaUri.toLowerCase().includes('.mov') ? 'video' : 'image';
      
      // Upload media to Supabase storage first
      console.log('📤 Uploading story media to storage...');
      const uploadedMediaUrl = await uploadMediaToStorage(mediaUri, 'stories');
      
      if (!uploadedMediaUrl) {
        throw new Error('Failed to upload media to storage');
      }
      
      console.log('✅ Story media uploaded:', uploadedMediaUrl);
      
      // Create the story using the API with uploaded media URL
      const newStory = await storiesApi.createStory(
        uploadedMediaUrl,
        mediaType,
        caption || undefined
      );

      console.log('Story created successfully:', newStory);
      
      Alert.alert('Success', 'Your story has been shared!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error creating story:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create story. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.gradientBackground}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Your Story</Text>
          <TouchableOpacity 
            onPress={handleCreateStory}
            disabled={isLoading || !mediaUri}
            style={[styles.shareButton, { opacity: (isLoading || !mediaUri) ? 0.6 : 1 }]}
          >
            <Text style={styles.shareButtonText}>
              {isLoading ? 'Sharing...' : 'Share'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Story Preview */}
        <View style={styles.storyPreview}>
          {mediaUri ? (
            <View style={styles.mediaContainer}>
              <Image source={{ uri: mediaUri }} style={styles.storyImage} />
              
              {/* Caption Overlay */}
              {caption && (
                <View style={styles.captionOverlay}>
                  <Text style={styles.captionText}>{caption}</Text>
                </View>
              )}
              
              {/* Remove Media Button */}
              <TouchableOpacity 
                style={styles.removeMediaButton}
                onPress={() => setMediaUri('')}
              >
                <Ionicons name="close-circle" size={32} color="white" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.emptyPreview}>
              <Ionicons name="camera" size={80} color="rgba(255,255,255,0.5)" />
              <Text style={styles.emptyText}>Add a photo or video</Text>
              <Text style={styles.emptySubtext}>Share what's happening now</Text>
            </View>
          )}
        </View>

        {/* Caption Input */}
        <View style={styles.captionContainer}>
          <TextInput
            placeholder="Add a caption..."
            placeholderTextColor="rgba(255,255,255,0.7)"
            value={caption}
            onChangeText={setCaption}
            multiline
            style={styles.captionInput}
            maxLength={200}
          />
          <Text style={styles.characterCount}>
            {caption.length}/200
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={pickFromGallery}>
            <LinearGradient
              colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
              style={styles.actionButtonGradient}
            >
              <Ionicons name="image" size={32} color="white" />
            </LinearGradient>
            <Text style={styles.actionButtonText}>Gallery</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={takePhoto}>
            <LinearGradient
              colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
              style={styles.actionButtonGradient}
            >
              <Ionicons name="camera" size={32} color="white" />
            </LinearGradient>
            <Text style={styles.actionButtonText}>Camera</Text>
          </TouchableOpacity>
        </View>
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
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  shareButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  shareButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  storyPreview: {
    flex: 1,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  mediaContainer: {
    flex: 1,
    position: 'relative',
  },
  storyImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  captionOverlay: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 15,
    padding: 15,
  },
  captionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  removeMediaButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
  },
  emptyPreview: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
  },
  emptySubtext: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    marginTop: 10,
  },
  captionContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  captionInput: {
    fontSize: 16,
    color: 'white',
    minHeight: 60,
    textAlignVertical: 'top',
  },
  characterCount: {
    alignSelf: 'flex-end',
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 40,
    paddingBottom: 40,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionButtonGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 10,
  },
});