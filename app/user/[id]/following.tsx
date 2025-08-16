import { View, Text, FlatList, TouchableOpacity, StatusBar, StyleSheet, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { usersApi, User } from '@/lib/api';
import UserListItem from '@/components/core/UserListItem';
import { useAuth } from '@/contexts/AuthContext';

export default function FollowingScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { profile: currentUser } = useAuth();
  const [following, setFollowing] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [followStatuses, setFollowStatuses] = useState<Record<string, boolean>>({});

  const loadData = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      
      // Load user profile to get the name for the header
      const userData = await usersApi.getUserProfile(id as string);
      setUser(userData);
      
      // Load following
      const followingData = await usersApi.getFollowing(id as string);
      setFollowing(followingData || []);
      
      // Check follow status for each user being followed if current user exists
      if (currentUser && followingData && Array.isArray(followingData)) {
        const statuses: Record<string, boolean> = {};
        for (const followedUser of followingData) {
          if (followedUser.id && followedUser.id !== currentUser.id) {
            try {
              statuses[followedUser.id] = await usersApi.isFollowing(currentUser.id, followedUser.id);
            } catch (error) {
              statuses[followedUser.id] = false;
            }
          }
        }
        setFollowStatuses(statuses);
      }
    } catch (error) {
      console.error('Error loading following:', error);
      setFollowing([]);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUserPress = (userId: string) => {
    if (userId === currentUser?.id) {
      router.push('/profile');
    } else {
      router.push(`/user/${userId}`);
    }
  };

  const handleAvatarPress = (userId: string) => {
    router.push(`/story/${userId}`);
  };

  const handleFollowChange = (userId: string, isFollowing: boolean) => {
    // Update the local follow status
    setFollowStatuses(prev => ({
      ...prev,
      [userId]: isFollowing
    }));
  };

  const renderFollowing = ({ item }: { item: any }) => (
    <UserListItem
      user={item}
      onPress={() => handleUserPress(item.id)}
      showFollowButton={true}
      isFollowing={followStatuses[item.id] || false}
      onFollowChange={(isFollowing) => handleFollowChange(item.id, isFollowing)}
      onAvatarPress={() => handleAvatarPress(item.id)}
    />
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading following...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header */}
      <View style={styles.header}>
        <BlurView intensity={15} tint="dark" style={styles.headerBlur}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Following</Text>
              <Text style={styles.headerSubtitle}>
                {user?.name || 'User'} • {user?.following_count?.toLocaleString() || following.length} following
              </Text>
            </View>
            
            <View style={styles.placeholder} />
          </View>
        </BlurView>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {following.length === 0 ? (
          <View style={styles.emptyState}>
            <LinearGradient
              colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
              style={styles.emptyGradient}
            >
              <BlurView intensity={10} tint="dark" style={styles.emptyBlur}>
                <Ionicons name="person-add-outline" size={60} color="rgba(255,255,255,0.6)" />
                <Text style={styles.emptyTitle}>Not following anyone yet</Text>
                <Text style={styles.emptyDescription}>
                  When {user?.name || 'this user'} follows people, they'll appear here.
                </Text>
              </BlurView>
            </LinearGradient>
          </View>
        ) : (
          <FlatList
            data={following}
            renderItem={renderFollowing}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="white"
              />
            }
          />
        )}
      </View>
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
    paddingVertical: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  headerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingTop: 120,
  },
  listContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    borderRadius: 20,
    margin: 20,
    overflow: 'hidden',
  },
  emptyGradient: {
    borderRadius: 20,
    width: '100%',
    height: '100%',
  },
  emptyBlur: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyDescription: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});