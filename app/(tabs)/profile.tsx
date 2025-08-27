import { View, Text, TouchableOpacity, StatusBar, Animated, StyleSheet, Dimensions, Image, ScrollView, RefreshControl, Alert } from 'react-native';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { postsApi, usersApi } from '@/lib/api';
import { getPostImageUrls } from '@/lib/supabase';
import PostCard from '@/components/feed/PostCard';
import CompactPostCard from '@/components/feed/CompactPostCard';
import { isVideoUrl } from '@/lib/utils/media';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId?: string }>();
  const { profile: currentUser, signOut, session, loading: isLoading, refreshProfile } = useAuth();
  
  const [selectedTab, setSelectedTab] = useState('posts');
  const [viewedUser, setViewedUser] = useState<any>(null);
  const tabAnimation = useRef(new Animated.Value(0)).current;
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [realCounts, setRealCounts] = useState<{followers_count: number, following_count: number} | null>(null);
  const [visiblePostIndex, setVisiblePostIndex] = useState(0);
  const [isScreenFocused, setIsScreenFocused] = useState(true);
  
  // Determine if we're viewing the current user or another user
  const isCurrentUser = !userId || userId === currentUser?.id;
  const displayUser = isCurrentUser ? currentUser : viewedUser;
  
  // Memoize the posts list to prevent infinite re-renders
  const memoizedPosts = useMemo(() => userPosts.slice(0, 3), [userPosts]);
  
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  const lastRefreshTime = useRef<number>(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const postRefs = useRef<{ [key: number]: View | null }>({});

  // Handle scroll to determine visible post for video playback
  const handleScroll = useCallback((event: any) => {
    if (selectedTab !== 'posts' || memoizedPosts.length === 0) return;
    
    const scrollPosition = event.nativeEvent.contentOffset.y;
    const windowHeight = Dimensions.get('window').height;
    
    // For compact grid layout, we need different calculation
    // Profile header is approximately 620px (profile + stats + tabs)
    const profileHeaderHeight = 620;
    
    // For compact cards in 2-column grid - with small gaps
    const gap = 1; // Small gap between cards
    const cardsPerRow = width > 500 ? 3 : 2;
    const cardWidth = cardsPerRow === 3 
      ? (width - (2 * gap)) / 3 
      : (width - gap) / 2;
    const cardHeight = cardWidth * 1.2 + 2; // Reduced aspect ratio + small margin
    const rowHeight = cardHeight;
    
    // Adjust scroll position to account for profile header
    const adjustedScrollPosition = Math.max(0, scrollPosition - profileHeaderHeight);
    
    // Calculate which row is most visible
    let visibleRowIndex = 0;
    if (adjustedScrollPosition > 0) {
      visibleRowIndex = Math.floor((adjustedScrollPosition + windowHeight / 3) / rowHeight);
      visibleRowIndex = Math.max(0, Math.min(visibleRowIndex, Math.ceil(memoizedPosts.length / cardsPerRow) - 1));
    }
    
    // Convert row index to post index (first post in the visible row)
    const newVisibleIndex = Math.min(visibleRowIndex * cardsPerRow, memoizedPosts.length - 1);
    
    if (newVisibleIndex !== visiblePostIndex) {
      console.log(`📱 Scroll visibility changed from post ${visiblePostIndex} to ${newVisibleIndex} (scroll: ${scrollPosition}, row: ${visibleRowIndex})`);
      setVisiblePostIndex(newVisibleIndex);
    }
  }, [selectedTab, memoizedPosts, visiblePostIndex, width]);

  // Avatar sync not needed - following senecom approach with direct URL usage

  const loadUserData = useCallback(async () => {
    const targetUserId = userId || currentUser?.id;
    if (!targetUserId) return;
    
    try {
      setLoading(true);
      
      // Load both posts and real user profile with updated counts
      const [posts, userProfile] = await Promise.all([
        postsApi.getPostsByUser(targetUserId, 20, 0),
        usersApi.getUserProfile(targetUserId)
      ]);
      
      // Set the viewed user if it's not the current user
      if (!isCurrentUser && userProfile) {
        setViewedUser(userProfile);
      }
      
      const transformedPosts = Array.isArray(posts) ? posts.map((post, index) => {
        // Ensure all values are properly defined and typed
        const postId = post?.id ? String(post.id) : String(index);
        const numericId = post?.id ? parseInt(String(post.id).slice(-8), 16) || (index + 1) : (index + 1);
        
        const postUser = isCurrentUser ? currentUser : userProfile;
        const transformedPost = {
          id: numericId,
          user: {
            id: parseInt(String(postUser?.id)) || 1,
            name: String(postUser?.name || 'User'),
            username: String(postUser?.username || 'user'),
            avatar: postUser?.avatar || null,
            verified: Boolean(postUser?.verified),
            location: postUser?.location ? String(postUser.location) : undefined
          },
          images: getPostImageUrls(post?.images) || [],
          caption: String(post?.content || ''),
          likes: Number(post?.likes_count) || 0,
          comments: [],
          shares: Number(post?.shares_count) || 0,
          saves: Number(post?.saves_count) || 0,
          views: Number(post?.views_count) || Math.floor(Math.random() * 1000) + 50, // Mock views for now
          timestamp: post?.created_at ? String(new Date(post.created_at).toLocaleDateString()) : 'Today',
          location: post?.location ? String(post.location) : undefined,
          tags: [],
          originalId: postId
        };
        
        console.log(`📊 Transformed post ${numericId}:`, {
          originalImages: post?.images,
          processedImages: getPostImageUrls(post?.images),
          transformedImages: transformedPost.images,
          hasImages: transformedPost.images.length > 0
        });
        
        return transformedPost;
      }) : [];
      
      setUserPosts(transformedPosts);
      
      // Set the real counts from the API
      if (userProfile) {
        setRealCounts({
          followers_count: userProfile.followers_count || 0,
          following_count: userProfile.following_count || 0
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setUserPosts([]);
    } finally {
      setLoading(false);
    }
  }, [userId, currentUser?.id, isCurrentUser]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadUserData();
    setRefreshing(false);
  }, [loadUserData]);

  useEffect(() => {
    if (currentUser || userId) {
      loadUserData();
    }
    
    Animated.timing(fadeAnimation, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [currentUser, userId, loadUserData]);

  // Reset visible post index when switching to posts tab
  useEffect(() => {
    if (selectedTab === 'posts' && memoizedPosts.length > 0) {
      console.log(`📱 Setting visible post index to 0 for posts tab`);
      setVisiblePostIndex(0);
    } else if (selectedTab !== 'posts') {
      // Stop all videos when not on posts tab
      setVisiblePostIndex(-1);
    }
  }, [selectedTab, memoizedPosts.length]);

  // Set visible post when screen gains focus and we're on posts tab
  useEffect(() => {
    if (isScreenFocused && selectedTab === 'posts' && memoizedPosts.length > 0) {
      console.log(`📱 Screen focused - setting visible post index to 0`);
      setVisiblePostIndex(0);
    }
  }, [isScreenFocused, selectedTab, memoizedPosts.length]);

  // Debug visibility state
  useEffect(() => {
    console.log(`📱 Profile state: isScreenFocused=${isScreenFocused}, selectedTab=${selectedTab}, visiblePostIndex=${visiblePostIndex}`);
  }, [isScreenFocused, selectedTab, visiblePostIndex]);

  // Debug which content is being rendered
  useEffect(() => {
    console.log(`📱 Rendering content for tab: ${selectedTab}`);
  }, [selectedTab]);

  useFocusEffect(
    useCallback(() => {
      setIsScreenFocused(true);
      
      const refreshData = async () => {
        if (!currentUser) return;
        
        // Throttle refresh calls - only allow one every 30 seconds
        const now = Date.now();
        if (now - lastRefreshTime.current < 30000) {
          return;
        }
        
        lastRefreshTime.current = now;
        
        try {
          await refreshProfile();
          await loadUserData();
        } catch (error) {
          // Silent error handling to prevent console spam
        }
      };
      
      // Only refresh if it's been a while since last refresh
      refreshData();
      
      return () => {
        setIsScreenFocused(false);
        // Force reset visible post index to ensure videos stop when leaving screen
        setVisiblePostIndex(-1);
      };
    }, []) // Remove currentUser?.id dependency to prevent loops
  );

  const handleShareProfile = () => {
    Alert.alert('Share Profile', 'Profile sharing functionality will be available soon!');
  };

  const handleSettingsMenu = () => {
    Alert.alert(
      'Profile Settings',
      'Choose an action',
      [
        {
          text: 'Edit Profile',
          onPress: () => router.push('/edit-profile'),
        },
        {
          text: 'Share Profile',
          onPress: handleShareProfile,
        },
        {
          text: 'Privacy Settings',
          onPress: () => {
            Alert.alert('Coming Soon', 'Privacy settings will be available soon!');
          },
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: handleSignOut,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.replace('/sign-in');
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Header opacity animation (unused but kept for future use)
  // const headerOpacity = scrollY.interpolate({
  //   inputRange: [0, 100],
  //   outputRange: [0, 1],
  //   extrapolate: 'clamp',
  // });

  if (isLoading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#0f0f23', '#1a1a2e', '#16213e']}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  if (!session || (!currentUser && isCurrentUser)) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#0f0f23', '#1a1a2e', '#16213e']}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.errorContainer}>
          <Ionicons name="person-outline" size={60} color="white" />
          <Text style={styles.errorTitle}>Sign In Required</Text>
          <Text style={styles.errorText}>Please sign in to view your profile</Text>
          <TouchableOpacity 
            style={styles.signInButton}
            onPress={() => router.push('/sign-in')}
          >
            <Text style={styles.signInButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const renderPostFeed = useCallback(() => {
    console.log(`📱 renderPostFeed called with ${memoizedPosts.length} posts, selectedTab: ${selectedTab}, visiblePostIndex: ${visiblePostIndex}, isScreenFocused: ${isScreenFocused}`);
    
    if (memoizedPosts.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="images-outline" size={60} color="rgba(255,255,255,0.5)" />
          <Text style={styles.emptyTitle}>No posts yet</Text>
          <Text style={styles.emptyDescription}>
            Start sharing your moments with the world!
          </Text>
          <TouchableOpacity 
            style={styles.createPostButton}
            onPress={() => router.push('/create-post')}
          >
            <Text style={styles.createPostText}>Create Post</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.compactGrid}>
        {memoizedPosts.map((post, index) => {
          // For grid layout, make the first few posts in the visible area eligible for video playback
          const cardsPerRow = width > 500 ? 3 : 2;
          const currentRow = Math.floor(index / cardsPerRow);
          const visibleRow = Math.floor(visiblePostIndex / cardsPerRow);
          
          // A post is visible if it's in the current visible row or the next row
          const isInVisibleArea = currentRow >= visibleRow && currentRow <= visibleRow + 1;
          const isPostVisible = isScreenFocused && selectedTab === 'posts' && isInVisibleArea && index === visiblePostIndex;
          
          console.log(`📱 Post ${index} visibility: row=${currentRow}, visibleRow=${visibleRow}, isInArea=${isInVisibleArea}, isVisible=${isPostVisible}`);
          
          // Calculate small spacing between cards
          const isRightColumn = cardsPerRow === 2 ? index % 2 === 1 : index % 3 === 2;
          const isMiddleColumn = cardsPerRow === 3 && index % 3 === 1;
          
          return (
            <View 
              key={`profile-post-${post.originalId || post.id}`}
              ref={(ref) => { postRefs.current[index] = ref; }}
              style={[
                styles.compactCardWrapper,
                {
                  marginRight: isRightColumn ? 0 : 1,
                  marginLeft: isMiddleColumn ? 0.5 : 0,
                  marginBottom: 1,
                }
              ]}
            >
              <CompactPostCard 
                post={post} 
                index={index}
                isVisible={isPostVisible}
                onPress={() => router.push(`/post/${post.originalId || post.id}`)}
              />
            </View>
          );
        })}
      </View>
    );
  }, [memoizedPosts, selectedTab, visiblePostIndex, isScreenFocused, router]);

  const renderPostGrid = () => {
    if (userPosts.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="images-outline" size={60} color="rgba(255,255,255,0.5)" />
          <Text style={styles.emptyTitle}>No posts yet</Text>
          <Text style={styles.emptyDescription}>
            Start sharing your moments with the world!
          </Text>
          <TouchableOpacity 
            style={styles.createPostButton}
            onPress={() => router.push('/create-post')}
          >
            <Text style={styles.createPostText}>Create Post</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.compactGrid}>
        {userPosts.map((post, index) => {
          // Calculate small spacing between cards
          const gridCardsPerRow = width > 500 ? 3 : 2;
          const isRightColumn = gridCardsPerRow === 2 ? index % 2 === 1 : index % 3 === 2;
          const isMiddleColumn = gridCardsPerRow === 3 && index % 3 === 1;
          
          return (
            <View 
              key={post.id} 
              style={[
                styles.compactCardWrapper,
                {
                  marginRight: isRightColumn ? 0 : 1,
                  marginLeft: isMiddleColumn ? 0.5 : 0,
                  marginBottom: 1,
                }
              ]}
            >
              <CompactPostCard 
                post={post}
                isVisible={true} // Allow manual video playback in grid view
                onPress={() => router.push(`/post/${post.originalId || post.id}`)}
              />
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <LinearGradient
        colors={['#0f0f23', '#1a1a2e', '#16213e']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Fixed Header */}
      <View style={styles.header}>
        <BlurView intensity={1} tint="dark" style={styles.headerBlur}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            
            <View style={styles.headerCenter}>
              {isCurrentUser && <Text style={styles.headerTitle}>Profile</Text>}
            </View>
            
            <View style={styles.headerActions}>
              {isCurrentUser ? (
                <>
                  <TouchableOpacity 
                    onPress={() => router.push('/edit-profile')} 
                    style={styles.headerActionButton}
                  >
                    <Ionicons name="create-outline" size={22} color="white" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity onPress={handleSettingsMenu} style={styles.headerActionButton}>
                    <Ionicons name="ellipsis-vertical" size={22} color="white" />
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.headerSpacer} />
              )}
            </View>
          </View>
        </BlurView>
      </View>

      <Animated.ScrollView 
        ref={scrollViewRef}
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { 
            useNativeDriver: false,
            listener: handleScroll
          }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="white"
          />
        }
      >
        {/* Profile Section */}
        <Animated.View style={[styles.profileSection, { opacity: fadeAnimation }]}>
          
          {/* Profile Card with Gradient Background */}
          <View style={styles.profileCard}>
            <LinearGradient
              colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)']}
              style={styles.profileCardGradient}
            >
              
              {/* Avatar and User Info Row */}
              <View style={styles.profileHeader}>
                <View style={styles.avatarWrapper}>
                  <LinearGradient
                    colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)', 'rgba(255,255,255,0.2)', 'rgba(255,255,255,0.15)']}
                    style={styles.avatarRing}
                  >
                    {displayUser?.avatar ? (
                      <Image 
                        source={{ uri: displayUser.avatar }} 
                        style={styles.avatar}
                        onLoad={() => console.log('✅ Profile avatar loaded:', displayUser.avatar)}
                        onError={(error) => console.log('❌ Profile avatar error:', error, 'URL:', displayUser.avatar)}
                      />
                    ) : (
                      <View style={[styles.avatar, styles.defaultAvatar]}>
                        <Text style={styles.initialsText}>
                          {(displayUser?.name || displayUser?.username || 'U').slice(0, 2).toUpperCase()}
                        </Text>
                      </View>
                    )}
                  </LinearGradient>
                  {displayUser?.verified && (
                    <View style={styles.verifiedBadge}>
                      <Ionicons name="checkmark" size={12} color="black" />
                    </View>
                  )}
                </View>

                <View style={styles.userInfo}>
                  <Text style={styles.displayName}>{displayUser?.name}</Text>
                  <Text style={styles.username}>@{displayUser?.username}</Text>
                  
                  {displayUser?.location && (
                    <View style={styles.locationRow}>
                      <Ionicons name="location" size={14} color="rgba(255,255,255,0.7)" />
                      <Text style={styles.locationText}>{displayUser.location}</Text>
                    </View>
                  )}
                  
                  {/* Join Date */}
                  <View style={styles.joinDateRow}>
                    <Ionicons name="calendar" size={12} color="rgba(255,255,255,0.5)" />
                    <Text style={styles.joinDateText}>
                      Joined {new Date(displayUser?.created_at).toLocaleDateString('en-US', { 
                        month: 'short', 
                        year: 'numeric' 
                      })}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Bio */}
              {displayUser?.bio && (
                <View style={styles.bioSection}>
                  <Text style={styles.bioText}>{displayUser.bio}</Text>
                </View>
              )}

              {/* Website */}
              {displayUser?.website && (
                <TouchableOpacity style={styles.websiteSection}>
                  <View style={styles.websiteIconWrapper}>
                    <Ionicons name="link" size={14} color="rgba(255,255,255,0.8)" />
                  </View>
                  <Text style={styles.websiteText}>{displayUser.website}</Text>
                </TouchableOpacity>
              )}

            </LinearGradient>
          </View>

          {/* Stats Card */}
          <View style={styles.statsCard}>
            <LinearGradient
              colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)']}
              style={styles.statsCardGradient}
            >
              
              <View style={styles.statsRow}>
                <TouchableOpacity style={styles.statCard}>
                  <Text style={styles.statNumber}>{displayUser?.posts_count || userPosts.length}</Text>
                  <Text style={styles.statLabel}>Posts</Text>
                </TouchableOpacity>
                
                <View style={styles.statDivider} />
                
                <TouchableOpacity 
                  style={styles.statCard}
                  onPress={() => router.push(`/user/${displayUser?.id}/follow-tabs?tab=followers`)}
                >
                  <Text style={styles.statNumber}>{(realCounts?.followers_count ?? displayUser?.followers_count ?? 0).toLocaleString()}</Text>
                  <Text style={styles.statLabel}>Followers</Text>
                </TouchableOpacity>
                
                <View style={styles.statDivider} />
                
                <TouchableOpacity 
                  style={styles.statCard}
                  onPress={() => router.push(`/user/${displayUser?.id}/follow-tabs?tab=following`)}
                >
                  <Text style={styles.statNumber}>{(realCounts?.following_count ?? displayUser?.following_count ?? 0).toLocaleString()}</Text>
                  <Text style={styles.statLabel}>Following</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>

        </Animated.View>

        {/* Tabs */}
        <View style={styles.tabSection}>
          <View style={styles.tabContainer}>
            {[
              { id: 'posts', label: 'Cards', icon: 'apps-outline' },
              { id: 'grid', label: 'Gallery', icon: 'grid-outline' },
              { id: 'saved', label: 'Saved', icon: 'bookmark-outline' }
            ].map((tab) => (
              <TouchableOpacity
                key={tab.id}
                onPress={() => {
                  setSelectedTab(tab.id);
                  if (tab.id === 'posts') {
                    setVisiblePostIndex(0);
                  }
                  // Animate tab transition
                  Animated.timing(tabAnimation, {
                    toValue: tab.id === 'posts' ? 0 : 1,
                    duration: 300,
                    useNativeDriver: true,
                  }).start();
                }}
                style={[styles.tab, selectedTab === tab.id && styles.activeTab]}
              >
                <Ionicons 
                  name={tab.icon as any} 
                  size={20} 
                  color={selectedTab === tab.id ? 'white' : 'rgba(255,255,255,0.6)'} 
                />
                <Text style={[styles.tabText, selectedTab === tab.id && styles.activeTabText]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Content */}
        <Animated.View 
          style={[
            selectedTab === 'posts' ? styles.feedContentSection : styles.contentSection,
            {
              opacity: tabAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1],
                extrapolate: 'clamp',
              }),
              transform: [{
                translateY: tabAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0],
                  extrapolate: 'clamp',
                })
              }]
            }
          ]}
        >
          {selectedTab === 'posts' && renderPostFeed()}
          {selectedTab === 'grid' && renderPostGrid()}
        </Animated.View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 10,
  },
  errorText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
  },
  signInButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  signInButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingTop: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  headerBlur: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerSpacer: {
    width: 80, // Match the width of both action buttons with gap
  },
  headerActionButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  profileSection: {
    paddingTop: 120,
    paddingHorizontal: 0,
    paddingBottom: 20,
  },
  profileCard: {
    borderRadius: 0,
    marginBottom: 16,
    marginHorizontal: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  profileCardGradient: {
    borderRadius: 0,
    padding: 20,
    borderWidth: 0,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  displayName: {
    color: 'white',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  username: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  locationText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '500',
  },
  joinDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  joinDateText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontWeight: '500',
  },
  bioSection: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  bioText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'left',
  },
  websiteSection: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  websiteIconWrapper: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  websiteText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontWeight: '600',
  },
  statsCard: {
    borderRadius: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  statsCardGradient: {
    borderRadius: 0,
    padding: 16,
    borderWidth: 0,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 8,
  },
  statNumber: {
    color: 'white',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tabSection: {
    paddingHorizontal: 0,
    marginBottom: 20,
  },
  tabContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 0,
    padding: 4,
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  activeTab: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  tabText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontWeight: '600',
  },
  activeTabText: {
    color: 'white',
  },
  contentSection: {
    paddingHorizontal: 0,
    paddingBottom: 100,
  },
  feedContentSection: {
    paddingHorizontal: 0,
    paddingBottom: 100,
  },
  feedContainer: {
    paddingHorizontal: 0,
  },
  compactGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 0,
    justifyContent: 'flex-start',
  },
  compactCardWrapper: {
    // Margins handled dynamically for spacing
  },
  postsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
  },
  postItem: {
    width: (width - 46) / 3,
    aspectRatio: 1,
    position: 'relative',
  },
  postImage: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  videoIcon: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -12 }, { translateY: -12 }],
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 5,
  },
  multipleIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    padding: 4,
  },
  postOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    padding: 8,
  },
  postStats: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 8,
  },
  emptyDescription: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  createPostButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  createPostText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarWrapper: {
    marginRight: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 94,
    height: 94,
    borderRadius: 47,
  },
  defaultAvatar: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    color: 'white',
    fontSize: 32,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
});