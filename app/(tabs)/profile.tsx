import { View, Text, TouchableOpacity, StatusBar, Animated, StyleSheet, Dimensions, Image, ScrollView, RefreshControl, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useState, useRef, useEffect, useCallback } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { postsApi } from '@/lib/api';
// Avatar URLs are stored directly in database - no utility function needed

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const router = useRouter();
  const { profile: currentUser, signOut, session, loading: isLoading, refreshProfile } = useAuth();
  
  const [selectedTab, setSelectedTab] = useState('posts');
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  const lastRefreshTime = useRef<number>(0);

  // Avatar sync not needed - following senecom approach with direct URL usage

  const loadUserPosts = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      const posts = await postsApi.getPostsByUser(currentUser.id, 20, 0);
      
      const transformedPosts = Array.isArray(posts) ? posts.map(post => ({
        id: post?.id || '',
        image: post?.images?.[0] || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500&q=80',
        likes: post?.likes_count || 0,
        comments: post?.comments_count || 0,
        images: post?.images || []
      })) : [];
      
      setUserPosts(transformedPosts);
    } catch (error) {
      console.error('Error loading user posts:', error);
      setUserPosts([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadUserPosts();
    setRefreshing(false);
  }, [loadUserPosts]);

  useEffect(() => {
    if (currentUser) {
      loadUserPosts();
    }
    
    Animated.timing(fadeAnimation, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [currentUser, loadUserPosts]);

  useFocusEffect(
    useCallback(() => {
      const refreshData = async () => {
        if (!currentUser) return;
        
        // Throttle refresh calls - only allow one every 2 seconds
        const now = Date.now();
        if (now - lastRefreshTime.current < 2000) {
          console.log('Skipping refresh - too soon since last refresh');
          return;
        }
        
        lastRefreshTime.current = now;
        console.log('Profile screen focused - refreshing data');
        console.log('🔍 Current user avatar before refresh:', currentUser.avatar);
        
        try {
          await refreshProfile();
          await loadUserPosts();
          console.log('🔍 Current user avatar after refresh:', currentUser.avatar);
        } catch (error) {
          console.error('Error refreshing data on focus:', error);
        }
      };
      
      refreshData();
    }, [currentUser?.id])
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

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  if (isLoading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  if (!session || !currentUser) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
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
      <View style={styles.postsGrid}>
        {userPosts.map((post, index) => (
          <TouchableOpacity 
            key={post.id}
            style={styles.postItem}
            onPress={() => router.push(`/post/${post.id}`)}
          >
            <Image source={{ uri: post.image }} style={styles.postImage} />
            {post.images?.length > 1 && (
              <View style={styles.multipleIcon}>
                <Ionicons name="copy" size={16} color="white" />
              </View>
            )}
            <View style={styles.postOverlay}>
              <View style={styles.postStats}>
                <View style={styles.statItem}>
                  <Ionicons name="heart" size={16} color="white" />
                  <Text style={styles.statText}>{post.likes}</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="chatbubble" size={16} color="white" />
                  <Text style={styles.statText}>{post.comments}</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Fixed Header */}
      <View style={styles.header}>
        <BlurView intensity={15} tint="dark" style={styles.headerBlur}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Profile</Text>
            </View>
            
            <View style={styles.headerActions}>
              <TouchableOpacity 
                onPress={() => router.push('/edit-profile')} 
                style={styles.headerActionButton}
              >
                <Ionicons name="create-outline" size={22} color="white" />
              </TouchableOpacity>
              
              <TouchableOpacity onPress={handleSettingsMenu} style={styles.headerActionButton}>
                <Ionicons name="ellipsis-vertical" size={22} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </View>

      <Animated.ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
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
          />
        }
      >
        {/* Profile Section */}
        <Animated.View style={[styles.profileSection, { opacity: fadeAnimation }]}>
          
          {/* Profile Card with Gradient Background */}
          <View style={styles.profileCard}>
            <LinearGradient
              colors={['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.06)']}
              style={styles.profileCardGradient}
            >
              
              {/* Avatar and User Info Row */}
              <View style={styles.profileHeader}>
                <View style={styles.avatarWrapper}>
                  <LinearGradient
                    colors={['#667eea', '#764ba2', '#f093fb', '#f5576c']}
                    style={styles.avatarRing}
                  >
                    {currentUser.avatar ? (
                      <Image 
                        source={{ uri: currentUser.avatar }} 
                        style={styles.avatar}
                        onLoad={() => console.log('✅ Profile avatar loaded:', currentUser.avatar)}
                        onError={(error) => console.log('❌ Profile avatar error:', error, 'URL:', currentUser.avatar)}
                      />
                    ) : (
                      <View style={[styles.avatar, styles.defaultAvatar]}>
                        <Text style={styles.initialsText}>
                          {(currentUser.name || currentUser.username || 'U').slice(0, 2).toUpperCase()}
                        </Text>
                      </View>
                    )}
                  </LinearGradient>
                  {currentUser.verified && (
                    <View style={styles.verifiedBadge}>
                      <Ionicons name="checkmark" size={12} color="white" />
                    </View>
                  )}
                </View>

                <View style={styles.userInfo}>
                  <Text style={styles.displayName}>{currentUser.name}</Text>
                  <Text style={styles.username}>@{currentUser.username}</Text>
                  
                  {currentUser.location && (
                    <View style={styles.locationRow}>
                      <Ionicons name="location" size={14} color="rgba(255,255,255,0.7)" />
                      <Text style={styles.locationText}>{currentUser.location}</Text>
                    </View>
                  )}
                  
                  {/* Join Date */}
                  <View style={styles.joinDateRow}>
                    <Ionicons name="calendar" size={12} color="rgba(255,255,255,0.5)" />
                    <Text style={styles.joinDateText}>
                      Joined {new Date(currentUser.created_at).toLocaleDateString('en-US', { 
                        month: 'short', 
                        year: 'numeric' 
                      })}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Bio */}
              {currentUser.bio && (
                <View style={styles.bioSection}>
                  <Text style={styles.bioText}>{currentUser.bio}</Text>
                </View>
              )}

              {/* Website */}
              {currentUser.website && (
                <TouchableOpacity style={styles.websiteSection}>
                  <View style={styles.websiteIconWrapper}>
                    <Ionicons name="link" size={14} color="#4ECDC4" />
                  </View>
                  <Text style={styles.websiteText}>{currentUser.website}</Text>
                </TouchableOpacity>
              )}

            </LinearGradient>
          </View>

          {/* Stats Card */}
          <View style={styles.statsCard}>
            <LinearGradient
              colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)']}
              style={styles.statsCardGradient}
            >
              
              <View style={styles.statsRow}>
                <TouchableOpacity style={styles.statCard}>
                  <Text style={styles.statNumber}>{currentUser.posts_count || userPosts.length}</Text>
                  <Text style={styles.statLabel}>Posts</Text>
                </TouchableOpacity>
                
                <View style={styles.statDivider} />
                
                <TouchableOpacity style={styles.statCard}>
                  <Text style={styles.statNumber}>{currentUser.followers_count?.toLocaleString() || '0'}</Text>
                  <Text style={styles.statLabel}>Followers</Text>
                </TouchableOpacity>
                
                <View style={styles.statDivider} />
                
                <TouchableOpacity style={styles.statCard}>
                  <Text style={styles.statNumber}>{currentUser.following_count?.toLocaleString() || '0'}</Text>
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
              { id: 'posts', label: 'Posts', icon: 'grid-outline' },
              { id: 'saved', label: 'Saved', icon: 'bookmark-outline' },
              { id: 'tagged', label: 'Tagged', icon: 'person-outline' }
            ].map((tab) => (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setSelectedTab(tab.id)}
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
        <View style={styles.contentSection}>
          {selectedTab === 'posts' && renderPostGrid()}
        </View>
      </Animated.ScrollView>
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
  scrollView: {
    flex: 1,
  },
  profileSection: {
    paddingTop: 120,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  profileCard: {
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  profileCardGradient: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 16,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  defaultAvatar: {
    backgroundColor: '#667eea',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
  },
  verifiedBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#1DA1F2',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
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
    backgroundColor: 'rgba(78, 205, 196, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(78, 205, 196, 0.3)',
  },
  websiteIconWrapper: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(78, 205, 196, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  websiteText: {
    color: '#4ECDC4',
    fontSize: 14,
    fontWeight: '600',
  },
  statsCard: {
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  statsCardGradient: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
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
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tabContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 4,
    flexDirection: 'row',
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
    paddingHorizontal: 20,
    paddingBottom: 100,
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
});