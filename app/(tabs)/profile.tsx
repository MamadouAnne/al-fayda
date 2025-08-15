import { View, Text, TouchableOpacity, StatusBar, Animated, StyleSheet, Dimensions, Image, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useRef, useEffect, useCallback } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { postsApi } from '@/lib/api';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const router = useRouter();
  const { profile: currentUser, signOut, session, loading: isLoading } = useAuth();
  
  const [selectedTab, setSelectedTab] = useState('posts');
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;

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

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/sign-in');
    } catch (error) {
      console.error('Error signing out:', error);
    }
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

      {/* Header */}
      <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
        <BlurView intensity={10} tint="dark" style={styles.headerBlur}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Profile</Text>
            <TouchableOpacity onPress={handleSignOut} style={styles.headerButton}>
              <Ionicons name="log-out" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </BlurView>
      </Animated.View>

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
          
          {/* Avatar and User Info Row */}
          <View style={styles.profileHeader}>
            <View style={styles.avatarWrapper}>
              <Image 
                source={{ 
                  uri: currentUser.avatar || `https://i.pravatar.cc/150?u=${currentUser.id}` 
                }} 
                style={styles.avatar} 
              />
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
              <Ionicons name="link" size={16} color="#4ECDC4" />
              <Text style={styles.websiteText}>{currentUser.website}</Text>
            </TouchableOpacity>
          )}

          {/* Join Date */}
          <View style={styles.joinDateSection}>
            <Ionicons name="calendar" size={16} color="rgba(255,255,255,0.7)" />
            <Text style={styles.joinDateText}>
              Joined {new Date(currentUser.created_at).toLocaleDateString('en-US', { 
                month: 'long', 
                year: 'numeric' 
              })}
            </Text>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <TouchableOpacity style={styles.statCard}>
              <Text style={styles.statNumber}>{currentUser.posts_count || userPosts.length}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.statCard}>
              <Text style={styles.statNumber}>{currentUser.followers_count?.toLocaleString() || '0'}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.statCard}>
              <Text style={styles.statNumber}>{currentUser.following_count?.toLocaleString() || '0'}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.editButton}>
              <Ionicons name="create" size={18} color="white" />
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.shareButton}>
              <Ionicons name="share" size={18} color="white" />
            </TouchableOpacity>
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
  },
  headerBlur: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    paddingTop: 100,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 15,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  verifiedBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#1DA1F2',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  displayName: {
    color: 'white',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 2,
  },
  username: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  locationText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '500',
  },
  bioSection: {
    marginBottom: 12,
  },
  bioText: {
    color: 'white',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'left',
  },
  websiteSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
    marginBottom: 12,
  },
  websiteText: {
    color: '#4ECDC4',
    fontSize: 15,
    fontWeight: '500',
  },
  joinDateSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
    marginBottom: 20,
  },
  joinDateText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statCard: {
    alignItems: 'center',
  },
  statNumber: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 3,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  editButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  editButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
  shareButton: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
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