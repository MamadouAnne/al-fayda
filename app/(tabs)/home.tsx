import { View, FlatList, ScrollView, Text, TouchableOpacity, StatusBar, StyleSheet, Dimensions, Image, RefreshControl, Platform } from 'react-native';
import { TRENDING_TOPICS } from '@/constants/MockData';
import PostCard from '@/components/feed/PostCard';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { BlurView } from 'expo-blur';
import { postsApi, storiesApi, subscriptions } from '@/lib/api';
import { getAvatarUrl, getPostImageUrls, getStoryMediaUrl } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

const { width, height } = Dimensions.get('window');

// Simple date formatter to avoid Hermes Intl memory issues
const formatTimestamp = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return diffMins < 1 ? 'now' : `${diffMins}m`;
    } else if (diffHours < 24) {
      return `${diffHours}h`;
    } else if (diffDays < 7) {
      return `${diffDays}d`;
    } else {
      // Simple format without locale
      const month = date.getMonth() + 1;
      const day = date.getDate();
      return `${month}/${day}`;
    }
  } catch (error) {
    return 'now';
  }
};

// Global tab bar visibility state
let globalTabBarVisibility = true;
let tabBarVisibilityCallback: ((visible: boolean) => void) | null = null;

export const setTabBarVisible = (visible: boolean) => {
  globalTabBarVisibility = visible;
  if (tabBarVisibilityCallback) {
    tabBarVisibilityCallback(visible);
  }
};

export const subscribeToTabBarVisibility = (callback: (visible: boolean) => void) => {
  tabBarVisibilityCallback = callback;
  return () => {
    tabBarVisibilityCallback = null;
  };
};

export default function HomeScreen() {
  const [refreshing, setRefreshing] = useState(false);
  // Remove currentTime to reduce memory pressure
  // const [currentTime, setCurrentTime] = useState(new Date());
  const [posts, setPosts] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [groupedStories, setGroupedStories] = useState<any[]>([]);
  const [viewedStories, setViewedStories] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [visiblePosts, setVisiblePosts] = useState<Set<string>>(new Set());
  const [isScreenFocused, setIsScreenFocused] = useState(true);
  const lastScrollY = useRef(0);
  const router = useRouter();
  const { profile } = useAuth();

  // Load posts and stories on component mount
  const loadPosts = useCallback(async () => {
    try {
      setLoading(true);
      
      // Clear existing data first to free memory
      setPosts([]);
      setStories([]);
      setGroupedStories([]);
      
      // Small delay to allow garbage collection
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Load posts first (very small dataset to reduce memory)
      const data = await postsApi.getPosts(5, 0); // Reduced to 5 posts
      
      if (!data || data.length === 0) {
        return;
      }
      
      // Transform the data with minimal processing to reduce memory
      const transformedPosts = data.map(post => {
        // Log original post data for debugging
        console.log('Original post data:', {
          id: post.id,
          images: post.images,
          content: post.content?.substring(0, 100) + '...'
        });
        
        // Process images carefully to avoid memory spikes
        const images = post.images ? getPostImageUrls(post.images.slice(0, 3)) : []; // Limit to 3 images max
        
        const transformedPost = {
          id: post.id,
          user: {
            id: post.user.id,
            name: post.user.name || 'User',
            username: post.user.username || 'user',
            avatar: post.user.avatar ? getAvatarUrl(post.user.avatar) : null,
            verified: post.user.verified || false,
            location: post.location
          },
          images,
          caption: post.content ? post.content.slice(0, 500) : '', // Limit caption length
          likes: post.likes?.length || 0,
          timestamp: formatTimestamp(post.created_at),
          location: post.location,
          tags: [], // Remove tags to reduce memory
          comments: []
        };
        
        // Log transformed post for debugging
        console.log('Transformed post:', {
          id: transformedPost.id,
          images: transformedPost.images,
          hasImages: transformedPost.images.length > 0
        });
        
        return transformedPost;
      });
      
      setPosts(transformedPosts);
      
      // Load stories in background after posts are rendered (limit stories)
      setTimeout(async () => {
        try {
          const storiesData = await storiesApi.getStories();
          // Limit stories to reduce memory usage
          const limitedStories = storiesData.slice(0, 10);
          setStories(limitedStories);
          
          // Group stories by user
          const grouped = limitedStories.reduce((acc: any[], story: any) => {
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
        } catch (storyError) {
          // Fail silently to avoid crashes
          setStories([]);
          setGroupedStories([]);
        }
      }, 3000); // Load stories 3 seconds after posts to reduce memory pressure
      
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
    
    // Remove timer to reduce memory pressure
    // const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    
    // Note: We use the optimized handleScrollOptimized function defined later

    // Subscribe to real-time post updates
    const postSubscription = subscriptions.subscribeToposts(() => {
      // Reload posts when new post is created
      loadPosts();
    });

    return () => {
      // clearInterval(timer);
      if (postSubscription) {
        postSubscription.unsubscribe();
      }
    };
  }, [loadPosts]);

  // Handle screen focus/blur to pause videos when navigating away
  useFocusEffect(
    useCallback(() => {
      setIsScreenFocused(true);
      return () => {
        setIsScreenFocused(false);
        setVisiblePosts(new Set()); // Clear visible posts to pause all videos
      };
    }, [])
  );

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

  // Handle viewable items change for video pause/play
  const handleViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    // Allow posts with at least 30% visibility to be considered visible
    const visiblePosts = viewableItems
      .filter((item: any) => item.viewablePercentage >= 30)
      .map((item: any) => item.item.id.toString());
    
    const newVisiblePosts = new Set<string>(visiblePosts);
    
    // Track visible posts for video playback
    
    setVisiblePosts(newVisiblePosts);
  }, []);

  // Optimized viewability config to reduce memory
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50, // Higher threshold to reduce processing
    minimumViewTime: 200, // Longer wait time to reduce frequency
    waitForInteraction: false,
  }).current;

  const handleScrollOptimized = useCallback((event: any) => {
    // Completely disable tab bar visibility changes on Android for older devices
    if (Platform.OS === 'android') {
      return;
    }
    
    const currentScrollY = event.nativeEvent.contentOffset.y;
    const scrollDiff = currentScrollY - lastScrollY.current;
    
    // iOS only - smooth tab bar visibility changes
    if (Math.abs(scrollDiff) > 30) {
      if (scrollDiff > 0 && currentScrollY > 50) {
        setTabBarVisible(false);
      } else if (scrollDiff < 0) {
        setTabBarVisible(true);
      }
      lastScrollY.current = currentScrollY;
    }
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Background that stays fixed while content scrolls */}
      <View style={styles.backgroundContainer}>
        <LinearGradient
          colors={['#0f0f23', '#1a1a2e', '#16213e']}
          style={StyleSheet.absoluteFillObject}
        />
        
        {Platform.OS === 'ios' && (
          <>
            {/* Static Geometric Shapes - iOS only for performance */}
            <View style={styles.morphShape1} />
            <View style={styles.morphShape2} />
            <View style={styles.morphShape3} />
            
            {/* Mesh Gradient Overlay - iOS only */}
            <LinearGradient
              colors={['rgba(255,107,107,0.1)', 'transparent', 'rgba(78,205,196,0.1)']}
              style={StyleSheet.absoluteFillObject}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          </>
        )}
      </View>

      {/* Immersive Content Flow */}
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id.toString()}
        // Memory optimization props - more aggressive on Android
        removeClippedSubviews={true}
        maxToRenderPerBatch={Platform.OS === 'ios' ? 2 : 1}
        updateCellsBatchingPeriod={Platform.OS === 'ios' ? 100 : 200}
        initialNumToRender={Platform.OS === 'ios' ? 3 : 2}
        windowSize={Platform.OS === 'ios' ? 5 : 3}
        getItemLayout={(data, index) => (
          { length: 500, offset: 500 * index, index }
        )}
        ListHeaderComponent={() => (
          <View>
            {/* Content spacer for header */}
            <View style={styles.headerSpacer} />
            
            {/* Futuristic Header Design */}
            <View style={styles.futuristicHeader}>
              <BlurView intensity={20} style={styles.headerBlurContainer}>
                <View style={styles.headerContent}>
                  <View style={styles.headerActions}>
                    <TouchableOpacity style={styles.searchButton}>
                      <BlurView intensity={30} style={styles.actionButtonBlur}>
                        <Ionicons name="search" size={20} color="white" />
                      </BlurView>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.notificationButton}
                      onPress={() => router.push('/(tabs)/notifications')}
                    >
                      <BlurView intensity={30} style={styles.actionButtonBlur}>
                        <Ionicons name="notifications-outline" size={20} color="white" />
                        <View style={styles.notificationDot}>
                          <Text style={styles.badgeText}>3</Text>
                        </View>
                      </BlurView>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.messageButton}
                      onPress={() => router.push('/(tabs)/messages')}
                    >
                      <BlurView intensity={30} style={styles.actionButtonBlur}>
                        <Ionicons name="mail-outline" size={20} color="white" />
                        <View style={styles.messageBadge}>
                          <Text style={styles.badgeText}>2</Text>
                        </View>
                      </BlurView>
                    </TouchableOpacity>
                  </View>
                </View>
              </BlurView>
            </View>

            {/* Neo-Morphic Story Constellation */}
            <View style={styles.storyConstellation}>
              {/* Story Bar Background */}
              <View style={styles.storyBarBackground}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']}
                  style={styles.storyBarGradient}
                />
              </View>
              
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.storyConstellationContent}
                style={styles.storyConstellationScroll}
              >
                {/* Create Story Portal */}
                <TouchableOpacity 
                  style={styles.createStoryPortal}
                  onPress={() => router.push('/create-story')}
                >
                  <BlurView intensity={25} style={styles.portalBlur}>
                    <LinearGradient
                      colors={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.1)']}
                      style={styles.portalGradient}
                    >
                      {profile && (
                        <View style={styles.portalUserAvatar}>
                          {profile.avatar ? (
                            <Image 
                              source={{ uri: profile.avatar }} 
                              style={styles.portalAvatarImage} 
                            />
                          ) : (
                            <View style={[styles.portalAvatarImage, styles.portalAvatarDefault]}>
                              <Text style={styles.portalAvatarText}>
                                {(profile.name || profile.username || 'U').slice(0, 1).toUpperCase()}
                              </Text>
                            </View>
                          )}
                        </View>
                      )}
                      <View style={styles.portalPlusIcon}>
                        <Ionicons name="add" size={16} color="white" />
                      </View>
                      <Text style={styles.portalText}>Create</Text>
                    </LinearGradient>
                  </BlurView>
                </TouchableOpacity>
                
                {/* Story Orbs */}
                {groupedStories.map((storyGroup, index) => (
                  <TouchableOpacity 
                    key={storyGroup.user_id} 
                    style={styles.storyOrb}
                    onPress={() => {
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
                    <View style={styles.orbContainer}>
                      <LinearGradient
                        colors={storyGroup.stories.some((s: any) => viewedStories.has(s.id)) && 
                                storyGroup.stories.every((s: any) => viewedStories.has(s.id))
                          ? ['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']
                          : ['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']
                        }
                        style={styles.orbGradientRing}
                      >
                        <BlurView intensity={20} style={styles.orbImageContainer}>
                          <Image 
                            source={{ uri: getStoryMediaUrl(storyGroup.media_url) || storyGroup.media_url }} 
                            style={styles.orbImage} 
                          />
                        </BlurView>
                      </LinearGradient>
                      
                      {storyGroup.story_count > 1 && (
                        <View style={styles.orbMultiIndicator}>
                          <Text style={styles.orbMultiText}>{storyGroup.story_count}</Text>
                        </View>
                      )}
                    </View>
                    
                    <Text style={styles.orbUsername} numberOfLines={1}>
                      {storyGroup.user?.username || storyGroup.user?.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        )}
        renderItem={({ item, index }) => (
          <View style={styles.contentCardWrapper}>
            <BlurView intensity={15} style={styles.contentCardBlur}>
              <PostCard 
                post={item} 
                index={index} 
                isVisible={isScreenFocused && visiblePosts.has(item.id.toString())}
              />
            </BlurView>
          </View>
        )}
        onScroll={handleScrollOptimized}
        scrollEventThrottle={Platform.OS === 'ios' ? 16 : 100}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="rgba(255,255,255,0.8)"
            colors={['rgba(255,255,255,0.8)', 'rgba(255,255,255,0.6)']}
          />
        }
        contentContainerStyle={styles.immersiveFeedContainer}
        showsVerticalScrollIndicator={false}
        style={styles.immersiveFeedList}
        ListEmptyComponent={
          !loading ? (
            <BlurView intensity={20} style={styles.emptyStateContainer}>
              <LinearGradient
                colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)']}
                style={styles.emptyStateGradient}
              >
                <Text style={styles.emptyStateText}>Your Canvas Awaits</Text>
                <Text style={styles.emptyStateSubtext}>Be the first to paint this digital space</Text>
              </LinearGradient>
            </BlurView>
          ) : null
        }
      />
      
      {/* Quantum Floating Action Portal */}
      <View style={styles.quantumActionPortal}>
        <TouchableOpacity 
          style={styles.portalCreateButton}
          onPress={() => router.push('/create-post')}
        >
          <BlurView intensity={30} style={styles.portalButtonBlur}>
            <LinearGradient
              colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.15)']}
              style={styles.portalButtonGradient}
            >
              <Ionicons name="add" size={28} color="white" />
            </LinearGradient>
          </BlurView>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23', // Match the gradient background color
  },
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
    height: '120%',
    zIndex: -1,
    backgroundColor: '#0f0f23', // Ensure background color matches
  },
  headerSpacer: {
    height: 10, // Minimal top spacing
  },
  
  // Avant-garde Morphing Shapes
  morphShape1: {
    position: 'absolute',
    top: 80,
    right: -40,
    width: 160,
    height: 160,
    backgroundColor: 'rgba(255,107,107,0.08)',
    borderRadius: 80,
    transform: [{ skewX: '30deg' }],
  },
  morphShape2: {
    position: 'absolute',
    top: 250,
    left: -60,
    width: 120,
    height: 200,
    backgroundColor: 'rgba(78,205,196,0.06)',
    borderRadius: 60,
    transform: [{ skewY: '45deg' }],
  },
  morphShape3: {
    position: 'absolute',
    bottom: 200,
    right: 20,
    width: 140,
    height: 140,
    backgroundColor: 'rgba(69,183,209,0.05)',
    borderRadius: 70,
    transform: [{ skewX: '-20deg' }],
  },
  
  // Futuristic Header
  futuristicHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingTop: 50,
    paddingBottom: 20,
  },
  headerBlurContainer: {
    marginHorizontal: 20,
    borderRadius: 25,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  searchButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  messageButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  notificationButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  actionButtonBlur: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  messageBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  notificationDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  badgeText: {
    color: 'black',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  
  // Neo-Morphic Story Constellation
  storyConstellation: {
    marginTop: 140,
    paddingHorizontal: 20,
    marginBottom: 25,
    position: 'relative',
  },
  storyBarBackground: {
    position: 'absolute',
    top: -10,
    left: 0,
    right: 0,
    bottom: -10,
    borderRadius: 25,
    overflow: 'hidden',
  },
  storyBarGradient: {
    flex: 1,
    borderRadius: 25,
  },
  storyConstellationScroll: {
    paddingHorizontal: 0,
    zIndex: 1,
  },
  storyConstellationContent: {
    paddingHorizontal: 0,
    alignItems: 'center',
  },
  
  // Create Story Portal
  createStoryPortal: {
    marginRight: 15,
    borderRadius: 25,
    overflow: 'hidden',
  },
  portalBlur: {
    borderRadius: 25,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  portalGradient: {
    width: 90,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  portalUserAvatar: {
    marginBottom: 8,
  },
  portalAvatarImage: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  portalAvatarDefault: {
    backgroundColor: 'rgba(255,107,107,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  portalAvatarText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  portalPlusIcon: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  portalText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  
  // Story Orbs
  storyOrb: {
    alignItems: 'center',
    marginHorizontal: 10,
    width: 80,
  },
  orbContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  orbGradientRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbImageContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 37,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  orbImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  orbMultiIndicator: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  orbMultiText: {
    color: 'black',
    fontSize: 11,
    fontWeight: '700',
  },
  orbUsername: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    opacity: 0.9,
  },
  
  // Immersive Content Flow
  contentCardWrapper: {
    marginHorizontal: 20,
    marginVertical: 8,
    borderRadius: 25,
    overflow: 'hidden',
    zIndex: 1000,
    elevation: 20,
    position: 'relative',
  },
  contentCardBlur: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 25,
    overflow: 'hidden',
  },
  immersiveFeedContainer: {
    paddingBottom: 140,
    paddingTop: 10,
  },
  immersiveFeedList: {
    flex: 1,
    zIndex: 999,
    elevation: 18,
    position: 'relative',
  },
  
  // Empty State
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: 40,
    marginHorizontal: 20,
    borderRadius: 25,
    overflow: 'hidden',
  },
  emptyStateGradient: {
    padding: 40,
    alignItems: 'center',
    borderRadius: 25,
  },
  emptyStateText: {
    color: 'white',
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 1,
  },
  emptyStateSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    opacity: 0.9,
  },
  
  // Quantum Floating Action Portal
  quantumActionPortal: {
    position: 'absolute',
    bottom: 100,
    right: 25,
    zIndex: 9999,
  },
  portalCreateButton: {
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: 'rgba(255,255,255,0.3)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 50,
  },
  portalButtonBlur: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 30,
    overflow: 'hidden',
  },
  portalButtonGradient: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 30,
  },
});