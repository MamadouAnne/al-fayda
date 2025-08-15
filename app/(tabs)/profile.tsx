import { View, Text, FlatList, TouchableOpacity, StatusBar, Animated, StyleSheet, Dimensions, Image, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useRef, useEffect, useCallback } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { postsApi, usersApi } from '@/lib/api';

const { width, height } = Dimensions.get('window');

export default function ProfileScreen() {
  const router = useRouter();
  const { user, profile: currentUser, signOut, session, loading: isLoading } = useAuth();
  
  // Debug logging
  useEffect(() => {
    console.log('Profile screen - user:', !!user, 'profile:', !!currentUser, 'loading:', isLoading);
    if (currentUser) {
      console.log('Profile data:', { name: currentUser.name, username: currentUser.username, email: currentUser.email });
    }
  }, [user, currentUser, isLoading]);
  const [selectedTab, setSelectedTab] = useState('posts');
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const floatingAnimation = useRef(new Animated.Value(0)).current;

  const loadUserPosts = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      const posts = await postsApi.getPostsByUser(currentUser.id, 20, 0);
      
      // Transform posts data for the UI with proper null checks
      const transformedPosts = Array.isArray(posts) ? posts.map(post => ({
        id: post?.id || '',
        image: post?.images?.[0] || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500&q=80',
        likes: post?.likes?.length || 0
      })) : [];
      
      setUserPosts(transformedPosts);
    } catch (error) {
      console.error('Error loading user posts:', error);
      setUserPosts([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      loadUserPosts();
    }
    
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnimation, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatingAnimation, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(floatingAnimation, {
            toValue: 0,
            duration: 3000,
            useNativeDriver: true,
          }),
        ])
      ),
    ]).start();
  }, [currentUser, loadUserPosts]);

  const floatingY = floatingAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });

  const switchTab = (tab: string) => {
    setSelectedTab(tab);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/sign-in');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Show loading state while auth is loading
  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <LinearGradient
          colors={['#667eea', '#764ba2', '#f093fb', '#f5576c']}
          style={StyleSheet.absoluteFillObject}
        />
        <Text style={styles.notAuthenticatedText}>Loading...</Text>
      </View>
    );
  }

  // If no session at all, redirect to sign in
  if (!session) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <LinearGradient
          colors={['#667eea', '#764ba2', '#f093fb', '#f5576c']}
          style={StyleSheet.absoluteFillObject}
        />
        <Text style={styles.notAuthenticatedText}>Please sign in to view your profile</Text>
        <TouchableOpacity 
          style={styles.signInButton}
          onPress={() => router.push('/sign-in')}
        >
          <Text style={styles.signInButtonText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // If session exists but user profile hasn't loaded yet, show loading
  if (!currentUser) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <LinearGradient
          colors={['#667eea', '#764ba2', '#f093fb', '#f5576c']}
          style={StyleSheet.absoluteFillObject}
        />
        <Text style={styles.notAuthenticatedText}>Loading your profile...</Text>
      </View>
    );
  }

  const renderPostGrid = () => {
    return (
      <View style={styles.postsGrid}>
        {Array.isArray(userPosts) && userPosts.length > 0 ? (
          userPosts.map((post, index) => (
            <Animated.View 
              key={post.id}
              style={[
                styles.postGridItem,
                {
                  opacity: fadeAnimation,
                  transform: [{
                    translateY: floatingAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, index % 2 === 0 ? -2 : 2],
                    })
                  }]
                }
              ]}
            >
              <TouchableOpacity 
                style={styles.postImageContainer}
                onPress={() => router.push(`/post/${post.id}`)}
              >
                <Image source={{ uri: post.image }} style={styles.postGridImage} />
                <View style={styles.postOverlay}>
                  <View style={styles.postStats}>
                    <View style={styles.postStat}>
                      <Ionicons name="heart" size={16} color="white" />
                      <Text style={styles.postStatText}>{post.likes}</Text>
                    </View>
                    <View style={styles.postStat}>
                      <Ionicons name="chatbubble" size={16} color="white" />
                      <Text style={styles.postStatText}>{Math.floor(post.likes * 0.1)}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <LinearGradient
              colors={['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.05)']}
              style={styles.emptyStateGradient}
            >
              <BlurView intensity={10} tint="dark" style={styles.emptyStateBlur}>
                <View style={styles.emptyIconContainer}>
                  <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    style={styles.emptyIconGradient}
                  >
                    <Ionicons name="images-outline" size={40} color="white" />
                  </LinearGradient>
                </View>
                <Text style={styles.emptyTitle}>No posts yet</Text>
                <Text style={styles.emptyDescription}>
                  When you share posts, they'll appear here.
                </Text>
              </BlurView>
            </LinearGradient>
          </View>
        )}
      </View>
    );
  };

  const renderActivityFeed = () => {
    // Mock activity data - in real app this would come from an API
    const activities = [
      { id: 1, type: 'like', text: 'Liked a photo by Maya Thompson', timestamp: '2h ago' },
      { id: 2, type: 'follow', text: 'Started following Alex Rivers', timestamp: '1d ago' },
      { id: 3, type: 'comment', text: 'Commented on Luna Rodriguez\'s post', timestamp: '2d ago' },
      { id: 4, type: 'post', text: 'Shared a new photo', timestamp: '3d ago' },
    ];

    return (
      <View style={styles.activityFeed}>
        {Array.isArray(activities) ? activities.map((activity, index) => (
          <Animated.View 
            key={activity.id}
            style={[
              styles.activityItem,
              {
                opacity: fadeAnimation,
                transform: [{
                  translateY: floatingAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, index % 2 === 0 ? -1 : 1],
                  })
                }]
              }
            ]}
          >
            <LinearGradient
              colors={['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.05)']}
              style={styles.activityGradient}
            >
              <BlurView intensity={10} tint="dark" style={styles.activityBlur}>
                <View style={styles.activityContent}>
                  <View style={styles.activityIconContainer}>
                    <LinearGradient
                      colors={['#f093fb', '#f5576c']}
                      style={styles.activityIconGradient}
                    >
                      <Ionicons 
                        name={
                          activity.type === 'like' ? 'heart' :
                          activity.type === 'follow' ? 'person-add' :
                          activity.type === 'comment' ? 'chatbubble' :
                          'camera'
                        } 
                        size={16} 
                        color="white" 
                      />
                    </LinearGradient>
                  </View>
                  <View style={styles.activityDetails}>
                    <Text style={styles.activityText}>{activity.text}</Text>
                    <Text style={styles.activityTimestamp}>{activity.timestamp}</Text>
                  </View>
                </View>
              </BlurView>
            </LinearGradient>
          </Animated.View>
        )) : null}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Full Page Background Gradient */}
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb', '#f5576c']}
        style={StyleSheet.absoluteFillObject}
      />
      
      {/* Background Floating Orbs */}
      <View style={styles.backgroundOrbs}>
        <Animated.View style={[styles.orb1, { transform: [{ translateY: floatingY }] }]} />
        <Animated.View style={[styles.orb2, { 
          transform: [{ translateY: floatingAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [10, -5],
          }) }] 
        }]} />
        <Animated.View style={[styles.orb3, { 
          transform: [{ translateY: floatingAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [-5, 15],
          }) }] 
        }]} />
      </View>

      {/* Header */}
      <Animated.View style={[styles.header, { opacity: fadeAnimation }]}>
        <BlurView intensity={15} tint="dark" style={styles.headerBlur}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <BlurView intensity={20} tint="light" style={styles.backButtonBlur}>
                <Ionicons name="arrow-back" size={24} color="white" />
              </BlurView>
            </TouchableOpacity>
            
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>{currentUser.username || currentUser.name}</Text>
            </View>
            
            <TouchableOpacity style={styles.moreButton} onPress={handleSignOut}>
              <BlurView intensity={20} tint="light" style={styles.moreButtonBlur}>
                <Ionicons name="log-out" size={24} color="white" />
              </BlurView>
            </TouchableOpacity>
          </View>
        </BlurView>
      </Animated.View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Info */}
        <Animated.View style={[styles.profileSection, { opacity: fadeAnimation }]}>
          <View style={styles.profileInfo}>
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={['#f093fb', '#f5576c', '#4facfe', '#00f2fe']}
                style={styles.avatarRing}
              >
                <Image 
                  source={{ 
                    uri: (currentUser as any).avatar_url || `https://i.pravatar.cc/150?u=${currentUser.id}` 
                  }} 
                  style={styles.avatar} 
                />
              </LinearGradient>
              <View style={styles.onlineIndicator} />
              {currentUser.verified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark" size={16} color="white" />
                </View>
              )}
            </View>
            
            <View style={styles.userDetails}>
              <View style={styles.nameRow}>
                <Text style={styles.userName}>{currentUser.name}</Text>
              </View>
              <Text style={styles.userUsername}>{currentUser.username}</Text>
              {currentUser.location && (
                <View style={styles.locationRow}>
                  <Ionicons name="location" size={14} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.locationText}>{currentUser.location}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Bio Section */}
          {currentUser.bio && (
            <View style={styles.bioSection}>
              <Text style={styles.bioText}>{currentUser.bio}</Text>
            </View>
          )}

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{currentUser.posts_count || userPosts.length}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{currentUser.followers_count || 0}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{currentUser.following_count || 0}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.followButton}>
              <LinearGradient
                colors={['#10B981', '#059669']}
                style={styles.followButtonGradient}
              >
                <Ionicons name="create" size={18} color="white" />
                <Text style={styles.followButtonText}>Edit Profile</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.messageButton}>
              <BlurView intensity={20} tint="light" style={styles.messageButtonBlur}>
                <Ionicons name="share" size={18} color="white" />
                <Text style={styles.messageButtonText}>Share</Text>
              </BlurView>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Tab Navigation */}
        <Animated.View style={[styles.tabContainer, { opacity: fadeAnimation }]}>
          <BlurView intensity={25} tint="light" style={styles.tabBlur}>
            <View style={styles.tabNavigation}>
              {[
                { id: 'posts', label: 'Posts', icon: 'grid-outline' },
                { id: 'activity', label: 'Activity', icon: 'pulse-outline' }
              ].map((tab) => (
                <TouchableOpacity
                  key={tab.id}
                  onPress={() => switchTab(tab.id)}
                  style={[styles.tab, selectedTab === tab.id && styles.activeTab]}
                >
                  {selectedTab === tab.id ? (
                    <LinearGradient
                      colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
                      style={styles.activeTabGradient}
                    />
                  ) : (
                    <View style={styles.inactiveTab} />
                  )}
                  <Ionicons 
                    name={tab.icon as any} 
                    size={20} 
                    color={selectedTab === tab.id ? 'white' : 'rgba(255,255,255,0.7)'} 
                  />
                  <Text style={[styles.tabText, selectedTab === tab.id && styles.activeTabText]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </BlurView>
        </Animated.View>

        {/* Content */}
        <View style={styles.tabContent}>
          {selectedTab === 'posts' ? renderPostGrid() : renderActivityFeed()}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundOrbs: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  orb1: {
    position: 'absolute',
    top: 120,
    right: 30,
    width: 100,
    height: 100,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 50,
    opacity: 0.8,
  },
  orb2: {
    position: 'absolute',
    top: 300,
    left: -20,
    width: 80,
    height: 80,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 40,
    opacity: 0.6,
  },
  orb3: {
    position: 'absolute',
    bottom: 200,
    right: 40,
    width: 120,
    height: 120,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 60,
    opacity: 0.7,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingTop: 50,
    paddingBottom: 10,
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
  backButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  backButtonBlur: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  moreButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  moreButtonBlur: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingTop: 120,
  },
  profileSection: {
    padding: 20,
    gap: 20,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarRing: {
    width: 90,
    height: 90,
    borderRadius: 45,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 3,
    right: 3,
    width: 20,
    height: 20,
    backgroundColor: '#10B981',
    borderRadius: 10,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  verifiedBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#1DA1F2',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userDetails: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userName: {
    color: 'white',
    fontSize: 24,
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 6,
  },
  userUsername: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    fontWeight: '500',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  locationText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '500',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  bioSection: {
    marginTop: 16,
    paddingHorizontal: 4,
  },
  bioText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
    textAlign: 'left',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
  },
  stat: {
    alignItems: 'center',
    gap: 4,
  },
  statNumber: {
    color: 'white',
    fontSize: 22,
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 6,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  followButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  followButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  followButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  messageButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  messageButtonBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  messageButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  tabContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tabBlur: {
    borderRadius: 20,
    padding: 4,
  },
  tabNavigation: {
    flexDirection: 'row',
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 16,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  activeTab: {
    transform: [{ scale: 1.02 }],
  },
  activeTabGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
  },
  inactiveTab: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  tabText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  activeTabText: {
    color: 'white',
    fontWeight: '700',
  },
  tabContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  postsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  postGridItem: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
  },
  postImageContainer: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  postGridImage: {
    width: '100%',
    height: '100%',
  },
  postOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 8,
  },
  postStats: {
    flexDirection: 'row',
    gap: 12,
  },
  postStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  postStatText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 40,
  },
  emptyStateGradient: {
    borderRadius: 20,
  },
  emptyStateBlur: {
    padding: 40,
    alignItems: 'center',
  },
  emptyIconContainer: {
    marginBottom: 20,
    borderRadius: 30,
    overflow: 'hidden',
  },
  emptyIconGradient: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  emptyDescription: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  activityFeed: {
    gap: 12,
  },
  activityItem: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  activityGradient: {
    borderRadius: 16,
  },
  activityBlur: {
    padding: 16,
  },
  activityContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activityIconContainer: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  activityIconGradient: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityDetails: {
    flex: 1,
    gap: 4,
  },
  activityText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  activityTimestamp: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: '500',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  notAuthenticatedText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 6,
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
    fontWeight: 'bold',
    textAlign: 'center',
  },
});