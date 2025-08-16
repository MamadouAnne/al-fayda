import { View, Text, Image, TouchableOpacity, StatusBar, StyleSheet, Dimensions, Animated, PanGestureHandler, State } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { usersApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

const { width, height } = Dimensions.get('window');

interface Story {
  id: string;
  image: string;
  timestamp: string;
  duration?: number;
}

export default function StoryViewerScreen() {
  const { userId } = useLocalSearchParams();
  const router = useRouter();
  const { profile: currentUser } = useAuth();
  
  const [user, setUser] = useState<any>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  
  // Mock stories data - replace with real API call
  const mockStories: Story[] = [
    {
      id: '1',
      image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500&q=80',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      duration: 5000
    },
    {
      id: '2', 
      image: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=500&q=80',
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
      duration: 5000
    },
    {
      id: '3',
      image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=500&q=80',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 min ago
      duration: 5000
    }
  ];

  useEffect(() => {
    loadUserAndStories();
  }, [userId]);

  useEffect(() => {
    if (stories.length > 0) {
      startStoryProgress();
    }
  }, [currentStoryIndex, stories]);

  const loadUserAndStories = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const userData = await usersApi.getUserProfile(userId as string);
      setUser(userData);
      
      // For now, use mock stories. Replace with real API call:
      // const userStories = await storiesApi.getUserStories(userId as string);
      setStories(mockStories);
    } catch (error) {
      console.error('Error loading user stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const startStoryProgress = () => {
    progressAnimation.setValue(0);
    
    Animated.timing(progressAnimation, {
      toValue: 1,
      duration: stories[currentStoryIndex]?.duration || 5000,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        nextStory();
      }
    });

    Animated.timing(fadeAnimation, {
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
    }
  };

  const closeStory = () => {
    router.back();
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const storyTime = new Date(timestamp);
    const diffMs = now.getTime() - storyTime.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes}m ago`;
    } else {
      return 'Just now';
    }
  };

  if (loading || !user || stories.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <Text style={styles.loadingText}>Loading story...</Text>
      </View>
    );
  }

  const currentStory = stories[currentStoryIndex];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* Story Background */}
      <Image 
        source={{ uri: currentStory.image }} 
        style={styles.storyImage}
        resizeMode="cover"
      />
      
      {/* Dark Overlay */}
      <View style={styles.overlay} />
      
      {/* Progress Bars */}
      <View style={styles.progressContainer}>
        {stories.map((_, index) => (
          <View key={index} style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground} />
            <Animated.View
              style={[
                styles.progressBar,
                {
                  width: index === currentStoryIndex 
                    ? progressAnimation.interpolate({
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
      <Animated.View style={[styles.header, { opacity: fadeAnimation }]}>
        <View style={styles.userInfo}>
          <LinearGradient
            colors={['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3']}
            style={styles.avatarRing}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Image 
              source={{ uri: user.avatar || `https://i.pravatar.cc/150?u=${user.id}` }} 
              style={styles.avatar}
            />
          </LinearGradient>
          <View style={styles.userDetails}>
            <Text style={styles.username}>{user.name}</Text>
            <Text style={styles.timestamp}>{formatTimeAgo(currentStory.timestamp)}</Text>
          </View>
        </View>
        
        <TouchableOpacity onPress={closeStory} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>
      </Animated.View>

      {/* Touch Areas for Navigation */}
      <TouchableOpacity 
        style={styles.leftTouchArea}
        onPress={previousStory}
        activeOpacity={1}
      />
      
      <TouchableOpacity 
        style={styles.rightTouchArea}
        onPress={nextStory}
        activeOpacity={1}
      />

      {/* Story Content Overlay (for text, stickers, etc.) */}
      <Animated.View style={[styles.contentOverlay, { opacity: fadeAnimation }]}>
        {/* Add story text, stickers, etc. here */}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  storyImage: {
    width: width,
    height: height,
    position: 'absolute',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  progressContainer: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    flexDirection: 'row',
    gap: 4,
    zIndex: 100,
  },
  progressBarContainer: {
    flex: 1,
    height: 3,
    position: 'relative',
  },
  progressBarBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 1.5,
  },
  progressBar: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  header: {
    position: 'absolute',
    top: 70,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 100,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarRing: {
    width: 40,
    height: 40,
    borderRadius: 20,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  userDetails: {
    marginLeft: 12,
  },
  username: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  timestamp: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '500',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftTouchArea: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '40%',
    height: '100%',
    zIndex: 50,
  },
  rightTouchArea: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: '60%',
    height: '100%',
    zIndex: 50,
  },
  contentOverlay: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    zIndex: 100,
  },
});