import { View, FlatList, ScrollView, Text, TouchableOpacity, StatusBar, Animated, StyleSheet, Dimensions, Image, RefreshControl } from 'react-native';
import { TRENDING_TOPICS } from '@/constants/MockData';
import PostCard from '@/components/feed/PostCard';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { postsApi, storiesApi, subscriptions } from '@/lib/api';

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [posts, setPosts] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollY = useRef(new Animated.Value(0)).current;
  const floatingAnimation = useRef(new Animated.Value(0)).current;
  const router = useRouter();

  // Load posts and stories on component mount
  const loadPosts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await postsApi.getPosts(20, 0);
      
      // Transform the data to match the expected format
      const transformedPosts = data.map(post => ({
        id: post.id,
        user: {
          id: post.user.id,
          name: post.user.name,
          username: post.user.username,
          avatar: post.user.avatar_url || `https://i.pravatar.cc/150?u=${post.user.id}`,
          verified: post.user.verified || false,
          location: post.location
        },
        images: post.images || [],
        caption: post.content,
        likes: post.likes?.length || 0,
        timestamp: new Date(post.created_at).toLocaleString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
          day: 'numeric',
          month: 'short'
        }),
        location: post.location,
        tags: post.tags || [],
        comments: []
      }));
      
      setPosts(transformedPosts);
      
      // Load stories
      const storiesData = await storiesApi.getStories();
      setStories(storiesData);
    } catch (error) {
      console.error('Error loading posts:', error);
      // Fallback to empty array if API fails
      setPosts([]);
      setStories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPosts();
    
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    
    // Floating animation for background elements
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatingAnimation, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(floatingAnimation, {
          toValue: 0,
          duration: 4000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Subscribe to real-time post updates
    const postSubscription = subscriptions.subscribeToposts((payload) => {
      console.log('New post received:', payload);
      // Reload posts when new post is created
      loadPosts();
    });

    return () => {
      clearInterval(timer);
      if (postSubscription) {
        postSubscription.unsubscribe();
      }
    };
  }, [loadPosts]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadPosts();
    } catch (error) {
      console.error('Error refreshing posts:', error);
    } finally {
      setRefreshing(false);
    }
  }, [loadPosts]);

  const headerScale = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [1, 0.9],
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [1, 0.95],
    extrapolate: 'clamp',
  });

  const floatingY = floatingAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Dynamic Floating Background */}
      <View style={styles.backgroundContainer}>
        <LinearGradient
          colors={['#667eea', '#764ba2', '#f093fb', '#f5576c']}
          style={StyleSheet.absoluteFillObject}
        />
        <Animated.View 
          style={[
            styles.floatingOrb1,
            { transform: [{ translateY: floatingY }] }
          ]}
        />
        <Animated.View 
          style={[
            styles.floatingOrb2,
            { transform: [{ translateY: floatingAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [10, -5],
            }) }] }
          ]}
        />
        <Animated.View 
          style={[
            styles.floatingOrb3,
            { transform: [{ translateY: floatingAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [-5, 15],
            }) }] }
          ]}
        />
      </View>



      {/* Immersive Story Experience */}
      <View style={[styles.storySection, { paddingTop: 20 }]}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.storiesContent, { paddingTop: 10 }]}
          style={styles.storiesScroll}
        >
          {/* Add Your Story */}
          <TouchableOpacity 
            style={styles.addStoryCard}
            onPress={() => router.push('/create-story')}
          >
            <LinearGradient
              colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.05)']}
              style={styles.addStoryGradient}
            >
              <Ionicons name="add" size={24} color="white" />
              <Text style={styles.addStoryText}>Your Story</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          {/* User Stories */}
          {stories.map((story, index) => (
            <TouchableOpacity 
              key={story.id} 
              style={styles.storyContainer}
              onPress={() => {
                router.push({
                  pathname: '/story-viewer',
                  params: { 
                    storyId: story.id,
                    userId: story.user_id 
                  }
                });
              }}
            >
              <View style={styles.storyCircle}>
                {/* Gradient Border */}
                <LinearGradient
                  colors={['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7']}
                  style={styles.storyGradientBorder}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.storyImageWrapper}>
                    <Image 
                      source={{ uri: story.media_url }} 
                      style={styles.storyCircularImage} 
                    />
                  </View>
                </LinearGradient>
                
                {/* User Avatar Overlay */}
                <View style={styles.storyAvatarOverlay}>
                  <Image 
                    source={{ uri: story.user?.avatar_url || `https://i.pravatar.cc/150?u=${story.user?.id}` }} 
                    style={styles.storyUserAvatar} 
                  />
                </View>
              </View>
              
              <Text style={styles.storyUsername} numberOfLines={1}>
                {story.user?.username || story.user?.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Revolutionary Card Stack Feed */}
      <Animated.FlatList
        data={posts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item, index }) => <PostCard post={item} index={index} />}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="white"
            colors={['#667eea', '#764ba2']}
          />
        }
        contentContainerStyle={styles.feedContainer}
        showsVerticalScrollIndicator={false}
        style={styles.feedList}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No posts yet</Text>
              <Text style={styles.emptySubtext}>Be the first to share something!</Text>
            </View>
          ) : null
        }
      />

      {/* Floating Action Hub */}
      <View style={styles.floatingActionHub}>
        <TouchableOpacity 
          style={styles.createButton}
          onPress={() => router.push('/create-post')}
        >
          <LinearGradient
            colors={['#FF6B6B', '#4ECDC4']}
            style={styles.createButtonGradient}
          >
            <Ionicons name="add" size={24} color="white" />
          </LinearGradient>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.discoverButton}
          onPress={() => router.push('/(tabs)/search')}
        >
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.discoverButtonGradient}
          >
            <Ionicons name="compass" size={20} color="white" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  backgroundContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  floatingOrb1: {
    position: 'absolute',
    top: 60,
    right: 30,
    width: 120,
    height: 120,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 60,
    opacity: 0.8,
  },
  floatingOrb2: {
    position: 'absolute',
    top: 200,
    left: -20,
    width: 80,
    height: 80,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 40,
    opacity: 0.6,
  },
  floatingOrb3: {
    position: 'absolute',
    bottom: 150,
    right: 50,
    width: 100,
    height: 100,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 50,
    opacity: 0.7,
  },
  topHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    paddingTop: 50,
    paddingBottom: 15,
  },
  headerBlur: {
    marginHorizontal: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerLeft: {
    flex: 1,
  },
  greetingText: {
    color: 'white',
    fontSize: 24,
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 6,
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  headerButtonGradient: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  messageBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#4ECDC4',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  badgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  storySection: {
    marginTop: 40,
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  sectionHeader: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  storiesScroll: {
    marginHorizontal: -8,
  },
  storiesContent: {
    paddingHorizontal: 8,
  },
  addStoryCard: {
    marginHorizontal: 8,
    borderRadius: 20,
    overflow: 'hidden',
  },
  addStoryGradient: {
    width: 80,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  addStoryText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
  },
  storyContainer: {
    alignItems: 'center',
    marginHorizontal: 12,
    width: 75,
  },
  storyCircle: {
    position: 'relative',
    marginBottom: 8,
  },
  storyGradientBorder: {
    width: 75,
    height: 75,
    borderRadius: 37.5,
    padding: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  storyImageWrapper: {
    width: '100%',
    height: '100%',
    borderRadius: 35,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  storyCircularImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  storyAvatarOverlay: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  storyUserAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  storyUsername: {
    color: 'white',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },
  feedContainer: {
    paddingBottom: 120,
  },
  feedList: {
    flex: 1,
    paddingTop: 20,
  },
  floatingActionHub: {
    position: 'absolute',
    bottom: 100,
    right: 24,
    alignItems: 'flex-end',
    gap: 12,
    zIndex: 100,
  },
  createButton: {
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  createButtonGradient: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discoverButton: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  discoverButtonGradient: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: 40,
  },
  emptyText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 6,
  },
  emptySubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
});