import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  Dimensions,
  StyleSheet,
  StatusBar,
  Animated
} from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { storiesApi } from '@/lib/api';

const { width, height } = Dimensions.get('window');

export default function StoryViewerScreen() {
  const router = useRouter();
  const { storyId, userId } = useLocalSearchParams();
  const [stories, setStories] = useState<any[]>([]);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadStoriesForUser();
  }, [userId]);

  useEffect(() => {
    if (stories.length > 0) {
      startProgressAnimation();
      fadeIn();
    }
  }, [currentStoryIndex, stories]);

  const loadStoriesForUser = async () => {
    try {
      setLoading(true);
      const userStories = await storiesApi.getStoriesByUser(userId as string);
      setStories(userStories);
      
      // Find the index of the clicked story
      const clickedStoryIndex = userStories.findIndex(story => story.id === storyId);
      if (clickedStoryIndex !== -1) {
        setCurrentStoryIndex(clickedStoryIndex);
      }
      
      // TODO: Increment views for the current story
      // await storiesApi.incrementViews(userStories[clickedStoryIndex]?.id || userStories[0].id);
    } catch (error) {
      console.error('Error loading stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const startProgressAnimation = () => {
    progressAnim.setValue(0);
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 5000, // 5 seconds per story
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        nextStory();
      }
    });
  };

  const fadeIn = () => {
    opacityAnim.setValue(0);
    Animated.timing(opacityAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const nextStory = () => {
    if (currentStoryIndex < stories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
    } else {
      router.back();
    }
  };

  const previousStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
    } else {
      router.back();
    }
  };

  const handleTapRight = () => {
    progressAnim.stopAnimation();
    nextStory();
  };

  const handleTapLeft = () => {
    progressAnim.stopAnimation();
    previousStory();
  };

  const handleClose = () => {
    progressAnim.stopAnimation();
    router.back();
  };

  if (loading || stories.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="black" />
        <Text style={styles.loadingText}>Loading story...</Text>
      </View>
    );
  }

  const currentStory = stories[currentStoryIndex];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="black" />
      
      {/* Background Image */}
      <Animated.View style={[styles.imageContainer, { opacity: opacityAnim }]}>
        <Image 
          source={{ uri: currentStory.media_url }} 
          style={styles.storyImage}
          resizeMode="contain"
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'transparent', 'rgba(0,0,0,0.4)']}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      {/* Progress Bars */}
      <View style={styles.progressContainer}>
        {stories.map((_, index) => (
          <View key={index} style={styles.progressBarBackground}>
            <Animated.View
              style={[
                styles.progressBar,
                {
                  width: index === currentStoryIndex 
                    ? progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      })
                    : index < currentStoryIndex ? '100%' : '0%'
                }
              ]}
            />
          </View>
        ))}
      </View>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Image 
            source={{ uri: currentStory.user?.avatar_url || `https://i.pravatar.cc/150?u=${currentStory.user?.id}` }} 
            style={styles.userAvatar}
          />
          <View style={styles.userDetails}>
            <Text style={styles.username}>
              {currentStory.user?.username || currentStory.user?.name}
            </Text>
            <Text style={styles.timeAgo}>
              {new Date(currentStory.created_at).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              })}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Ionicons name="close" size={28} color="white" />
        </TouchableOpacity>
      </View>

      {/* Story Content */}
      {currentStory.content && (
        <View style={styles.contentContainer}>
          <Text style={styles.storyContent}>{currentStory.content}</Text>
        </View>
      )}

      {/* Tap Areas for Navigation */}
      <TouchableOpacity 
        style={styles.leftTapArea} 
        onPress={handleTapLeft}
        activeOpacity={1}
      />
      <TouchableOpacity 
        style={styles.rightTapArea} 
        onPress={handleTapRight}
        activeOpacity={1}
      />

      {/* Story Info */}
      <View style={styles.bottomInfo}>
        <Text style={styles.viewsText}>
          👁 {currentStory.views_count} views
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
  },
  imageContainer: {
    position: 'absolute',
    width: width,
    height: height,
    top: 0,
    left: 0,
  },
  storyImage: {
    width: width,
    height: height,
    backgroundColor: 'black',
  },
  progressContainer: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingTop: 60,
    gap: 4,
    zIndex: 10,
  },
  progressBarBackground: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 1.5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    zIndex: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'white',
  },
  userDetails: {
    marginLeft: 12,
    flex: 1,
  },
  username: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  timeAgo: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  closeButton: {
    padding: 8,
  },
  contentContainer: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    zIndex: 10,
  },
  storyContent: {
    color: 'white',
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  leftTapArea: {
    position: 'absolute',
    left: 0,
    top: 120,
    bottom: 0,
    width: width * 0.3,
    zIndex: 5,
  },
  rightTapArea: {
    position: 'absolute',
    right: 0,
    top: 120,
    bottom: 0,
    width: width * 0.7,
    zIndex: 5,
  },
  bottomInfo: {
    position: 'absolute',
    bottom: 40,
    left: 16,
    right: 16,
    zIndex: 10,
  },
  viewsText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
});