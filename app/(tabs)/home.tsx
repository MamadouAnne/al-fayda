import { View, FlatList, ScrollView, Text, TouchableOpacity, StatusBar, Animated, StyleSheet, Dimensions, Image, RefreshControl } from 'react-native';
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
  const [currentTime, setCurrentTime] = useState(new Date());
  const [posts, setPosts] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [groupedStories, setGroupedStories] = useState<any[]>([]);
  const [viewedStories, setViewedStories] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [visiblePosts, setVisiblePosts] = useState<Set<string>>(new Set());
  const [isScreenFocused, setIsScreenFocused] = useState(true);
  const scrollY = useRef(new Animated.Value(0)).current;
  const floatingAnimation = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  const scrollDirection = useRef(new Animated.Value(0)).current; // 0 = down (show), 1 = up (hide)
  const router = useRouter();
  const { profile } = useAuth();

  // Load posts and stories on component mount
  const loadPosts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await postsApi.getPosts(20, 0);
      console.log('🔍 Raw posts data:', data);
      console.log('📊 Number of posts fetched:', data?.length || 0);
      if (data && data.length > 0) {
        console.log('👥 Users in posts:', data.map(p => ({ id: p.user?.id, name: p.user?.name })));
      }
      
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
        images: getPostImageUrls(post.images) || [],
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
      console.log('📸 Raw stories data:', storiesData);
      console.log('📊 Number of stories fetched:', storiesData?.length || 0);
      if (storiesData && storiesData.length > 0) {
        console.log('👥 Users in stories:', storiesData.map(s => ({ id: s.user?.id, name: s.user?.name })));
      }
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

    // Listen to scroll changes for bottom navigation animation
    const scrollListener = scrollY.addListener(({ value }) => {
      const currentScrollY = value;
      const scrollDiff = currentScrollY - lastScrollY.current;
      
      // Ultra responsive - trigger on any scroll movement (> 1px)
      if (Math.abs(scrollDiff) > 1) {
        if (scrollDiff > 0 && currentScrollY > 10) {
          // Scrolling up - hide bottom navigation immediately
          setTabBarVisible(false);
          Animated.timing(scrollDirection, {
            toValue: 1,
            duration: 150, // Even faster animation
            useNativeDriver: true,
          }).start();
        } else if (scrollDiff < 0) {
          // Scrolling down - show bottom navigation immediately
          setTabBarVisible(true);
          Animated.timing(scrollDirection, {
            toValue: 0,
            duration: 150, // Even faster animation
            useNativeDriver: true,
          }).start();
        }
        lastScrollY.current = currentScrollY;
      }
    });

    // Subscribe to real-time post updates
    const postSubscription = subscriptions.subscribeToposts((payload) => {
      console.log('New post received:', payload);
      // Reload posts when new post is created
      loadPosts();
    });

    return () => {
      clearInterval(timer);
      scrollY.removeListener(scrollListener);
      if (postSubscription) {
        postSubscription.unsubscribe();
      }
    };
  }, [loadPosts, scrollY, scrollDirection]);

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
    
    // Simple logging
    if (visiblePosts.length > 0) {
      console.log('📱 Visible posts:', visiblePosts);
    }
    
    setVisiblePosts(newVisiblePosts);
  }, []);

  // Viewability config for FlatList
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 30, // Post is visible when 30% of the item is shown
    minimumViewTime: 50, // Wait 50ms before considering item visible/invisible
    waitForInteraction: false, // Don't wait for user interaction to stop
  }).current;

  const headerScale = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [1, 0.9],
    extrapolate: 'clamp',
  });


  const floatingY = floatingAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  const storyBarTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -150],
    extrapolate: 'clamp',
  });

  const storyBarOpacity = scrollY.interpolate({
    inputRange: [0, 50, 100],
    outputRange: [1, 0.5, 0],
    extrapolate: 'clamp',
  });

  // Background parallax animations
  const backgroundParallax1 = scrollY.interpolate({
    inputRange: [0, 300],
    outputRange: [0, -50],
    extrapolate: 'clamp',
  });

  const backgroundParallax2 = scrollY.interpolate({
    inputRange: [0, 400],
    outputRange: [0, 80],
    extrapolate: 'clamp',
  });

  const backgroundParallax3 = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [0, -30],
    extrapolate: 'clamp',
  });

  const backgroundScale = scrollY.interpolate({
    inputRange: [0, 500],
    outputRange: [1, 1.2],
    extrapolate: 'clamp',
  });

  // Header scroll animations
  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [0, -100],
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100, 150],
    outputRange: [1, 0.7, 0],
    extrapolate: 'clamp',
  });

  // Main background scroll animation
  const backgroundTranslateY = scrollY.interpolate({
    inputRange: [0, 400],
    outputRange: [0, -100],
    extrapolate: 'clamp',
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
      
      {/* Background that stays fixed while content scrolls */}
      <View style={styles.backgroundContainer}>
        <LinearGradient
          colors={['#0f0f23', '#1a1a2e', '#16213e']}
          style={StyleSheet.absoluteFillObject}
        />
        
        {/* Flowing Geometric Shapes */}
        <Animated.View 
          style={[
            styles.morphShape1,
            { 
              transform: [
                { translateY: Animated.add(floatingY, backgroundParallax1) },
                { scale: backgroundScale },
                { rotate: floatingAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg'],
                }) }
              ] 
            }
          ]}
        />
        <Animated.View 
          style={[
            styles.morphShape2,
            { 
              transform: [
                { 
                  translateX: floatingAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 20],
                  }) 
                },
                { translateY: backgroundParallax2 },
                { 
                  scale: Animated.multiply(
                    floatingAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.2],
                    }),
                    backgroundScale
                  )
                }
              ] 
            }
          ]}
        />
        <Animated.View 
          style={[
            styles.morphShape3,
            { 
              transform: [
                { 
                  translateY: Animated.add(
                    floatingAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [15, -15],
                    }),
                    backgroundParallax3
                  )
                },
                { scale: backgroundScale },
                { 
                  rotate: floatingAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['360deg', '0deg'],
                  }) 
                }
              ] 
            }
          ]}
        />
        
        {/* Mesh Gradient Overlay */}
        <LinearGradient
          colors={['rgba(255,107,107,0.1)', 'transparent', 'rgba(78,205,196,0.1)']}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </View>

      {/* Immersive Content Flow */}
      <Animated.FlatList
        data={posts}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={() => (
          <View>
            {/* Content spacer for header */}
            <View style={styles.headerSpacer} />
            
            {/* Futuristic Header Design */}
            <Animated.View 
              style={[
                styles.futuristicHeader,
                {
                  transform: [{ translateY: headerTranslateY }],
                  opacity: headerOpacity,
                }
              ]}
            >
              <BlurView intensity={20} style={styles.headerBlurContainer}>
                <View style={styles.headerContent}>
                  <View style={styles.brandSection}>
                    <View style={styles.brandIcon}>
                      <LinearGradient
                        colors={['#FF6B6B', '#4ECDC4']}
                        style={styles.brandIconGradient}
                      >
                        <Text style={styles.brandInitial}>A</Text>
                      </LinearGradient>
                    </View>
                    <View style={styles.brandTextContainer}>
                      <Text style={styles.brandName}>AL-Fayda</Text>
                      <Text style={styles.brandSubtitle}>{getGreeting()}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.headerActions}>
                    <TouchableOpacity style={styles.searchButton}>
                      <BlurView intensity={30} style={styles.actionButtonBlur}>
                        <Ionicons name="search" size={20} color="white" />
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
                  </View>
                </View>
              </BlurView>
            </Animated.View>

            {/* Neo-Morphic Story Constellation */}
            <Animated.View 
              style={[
                styles.storyConstellation,
                {
                  transform: [{ translateY: storyBarTranslateY }],
                  opacity: storyBarOpacity,
                }
              ]}
            >
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
                      colors={['rgba(255,107,107,0.3)', 'rgba(78,205,196,0.3)']}
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
                          : ['#FF6B6B', '#4ECDC4']
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
            </Animated.View>
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
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#FF6B6B"
            colors={['#FF6B6B', '#4ECDC4']}
          />
        }
        contentContainerStyle={styles.immersiveFeedContainer}
        showsVerticalScrollIndicator={false}
        style={styles.immersiveFeedList}
        ListEmptyComponent={
          !loading ? (
            <BlurView intensity={20} style={styles.emptyStateContainer}>
              <LinearGradient
                colors={['rgba(255,107,107,0.2)', 'rgba(78,205,196,0.2)']}
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
              colors={['#FF6B6B', '#4ECDC4']}
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
  brandSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  brandIcon: {
    marginRight: 12,
  },
  brandIconGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandInitial: {
    color: 'white',
    fontSize: 18,
    fontWeight: '900',
  },
  brandTextContainer: {
    flex: 1,
  },
  brandName: {
    color: 'white',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1,
  },
  brandSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
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
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'white',
  },
  notificationDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'white',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  orbMultiText: {
    color: 'white',
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
    shadowColor: '#FF6B6B',
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