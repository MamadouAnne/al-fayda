import { View, FlatList, ScrollView, Text, TouchableOpacity, StatusBar, Animated, StyleSheet, Dimensions, Image, RefreshControl } from 'react-native';
import { TRENDING_TOPICS } from '@/constants/MockData';
import PostCard from '@/components/feed/PostCard';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { postsApi, storiesApi, subscriptions } from '@/lib/api';
import { getAvatarUrl } from '@/lib/supabase';

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [posts, setPosts] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [groupedStories, setGroupedStories] = useState<any[]>([]);
  const [viewedStories, setViewedStories] = useState<Set<string>>(new Set());
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
          avatar: getAvatarUrl(post.user.avatar),
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
      
      // Group stories by user
      const grouped = storiesData.reduce((acc: any[], story: any) => {
        const existingUser = acc.find(group => group.user_id === story.user_id);
        if (existingUser) {
          existingUser.stories.push(story);
          existingUser.story_count = existingUser.stories.length;
          // Update the most recent story as the cover
          if (new Date(story.created_at) > new Date(existingUser.created_at)) {
            existingUser.media_url = story.media_url;
            existingUser.created_at = story.created_at;
            existingUser.id = story.id; // Update to the most recent story ID
          }
        } else {
          acc.push({
            ...story,
            stories: [story],
            story_count: 1
          });
        }
        return acc;
      }, []);
      
      // Sort by most recent story
      grouped.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setGroupedStories(grouped);
    } catch (error) {
      console.error('Error loading posts:', error);
      // Fallback to empty array if API fails
      setPosts([]);
      setStories([]);
      setGroupedStories([]);
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
      <View style={[styles.storySection, { paddingTop: 15 }]}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.storiesContent, { paddingTop: 5 }]}
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
          {groupedStories.map((storyGroup, index) => (
            <TouchableOpacity 
              key={storyGroup.user_id} 
              style={styles.storyContainer}
              onPress={() => {
                // Mark all stories from this user as viewed
                storyGroup.stories.forEach((story: any) => {
                  setViewedStories(prev => new Set([...prev, story.id]));
                });
                
                router.push({
                  pathname: '/story-viewer',
                  params: { 
                    storyId: storyGroup.id,
                    userId: storyGroup.user_id,
                    userStories: JSON.stringify(storyGroup.stories.map((s: any) => s.id)),
                    allUserStories: JSON.stringify(groupedStories.map((g: any) => ({
                      userId: g.user_id,
                      storyId: g.id,
                      stories: g.stories.map((s: any) => s.id)
                    }))),
                    currentUserIndex: index.toString()
                  }
                });
              }}
            >
              <View style={styles.storyCircle}>
                {/* Gradient Border */}
                <LinearGradient
                  colors={storyGroup.stories.some((s: any) => viewedStories.has(s.id)) && 
                          storyGroup.stories.every((s: any) => viewedStories.has(s.id))
                    ? ['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.2)', 'rgba(255,255,255,0.3)'] // All viewed: subtle gray
                    : ['#E91E63', '#F06292', '#9C27B0', '#BA68C8'] // Has unviewed: elegant pink-purple gradient
                  }
                  style={[
                    styles.storyGradientBorder,
                    (storyGroup.stories.some((s: any) => viewedStories.has(s.id)) && 
                     storyGroup.stories.every((s: any) => viewedStories.has(s.id))) 
                      ? styles.viewedStoryBorder : styles.unviewedStoryBorder
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.storyImageWrapper}>
                    <Image 
                      source={{ uri: storyGroup.media_url }} 
                      style={styles.storyCircularImage} 
                    />
                  </View>
                </LinearGradient>
                
                {/* User Avatar Overlay */}
                {(() => {
                  const avatarUrl = getAvatarUrl(storyGroup.user?.avatar);
                  return (
                    <View style={styles.storyAvatarOverlay}>
                      {avatarUrl ? (
                        <Image 
                          source={{ uri: avatarUrl }} 
                          style={styles.storyUserAvatar} 
                        />
                      ) : (
                        <View style={[styles.storyUserAvatar, styles.storyDefaultAvatar]}>
                          <Text style={styles.storyInitialsText}>
                            {(storyGroup.user?.name || storyGroup.user?.username || 'U').slice(0, 1).toUpperCase()}
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })()}
                
                {/* Multiple Stories Indicator */}
                {storyGroup.story_count > 1 && (
                  <View style={styles.multipleStoriesIndicator}>
                    <Text style={styles.multipleStoriesText}>{storyGroup.story_count}</Text>
                  </View>
                )}
              </View>
              
              <Text style={styles.storyUsername} numberOfLines={1}>
                {storyGroup.user?.username || storyGroup.user?.name}
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
            <Ionicons name="add" size={32} color="white" />
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
    marginTop: 30,
    paddingHorizontal: 8,
    marginBottom: 18,
  },
  sectionHeader: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  storiesScroll: {
    marginHorizontal: -4,
  },
  storiesContent: {
    paddingHorizontal: 8,
    paddingLeft: 4,
    alignItems: 'center',
  },
  addStoryCard: {
    marginLeft: 0,
    marginRight: 6,
    borderRadius: 16,
    overflow: 'hidden',
  },
  addStoryGradient: {
    width: 70,
    height: 85,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  addStoryText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
  },
  storyContainer: {
    alignItems: 'center',
    marginHorizontal: 8,
    width: 85,
  },
  storyCircle: {
    position: 'relative',
    marginBottom: 8,
  },
  storyGradientBorder: {
    width: 85,
    height: 85,
    borderRadius: 42.5,
    padding: 3.5,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  storyImageWrapper: {
    width: '100%',
    height: '100%',
    borderRadius: 38.5,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.98)',
  },
  storyCircularImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  storyAvatarOverlay: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 2,
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  storyUserAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  storyDefaultAvatar: {
    backgroundColor: '#667eea',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyInitialsText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  storyUsername: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    letterSpacing: 0.2,
  },
  unviewedStoryBorder: {
    // Elegant shadow for unviewed stories
    shadowColor: '#E91E63',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 18,
    elevation: 12,
  },
  viewedStoryBorder: {
    // Subtle shadow for viewed stories
    shadowColor: 'rgba(255,255,255,0.2)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  multipleStoriesIndicator: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  multipleStoriesText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
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
    width: 64,
    height: 64,
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