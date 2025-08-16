import { View, Text, FlatList, TouchableOpacity, StatusBar, StyleSheet, RefreshControl, Dimensions, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect, useCallback, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import PagerView from 'react-native-pager-view';
import { usersApi, User } from '@/lib/api';
import UserListItem from '@/components/core/UserListItem';
import { useAuth } from '@/contexts/AuthContext';

const { width } = Dimensions.get('window');

interface Props {
  initialTab?: 'followers' | 'following';
}

export default function FollowTabsScreen() {
  const { id, tab } = useLocalSearchParams();
  const router = useRouter();
  const { profile: currentUser } = useAuth();
  const pagerRef = useRef<PagerView>(null);
  
  const [followers, setFollowers] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [followStatuses, setFollowStatuses] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<number>(
    tab === 'following' ? 1 : tab === 'suggestions' ? 2 : 0
  );

  const loadData = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      
      // Load user profile
      const userData = await usersApi.getUserProfile(id as string);
      setUser(userData);
      
      // Load followers, following, and suggestions
      const [followersData, followingData, suggestionsData] = await Promise.all([
        usersApi.getFollowers(id as string),
        usersApi.getFollowing(id as string),
        currentUser ? usersApi.getSuggestedUsers(currentUser.id, 15) : Promise.resolve([])
      ]);
      
      setFollowers(followersData || []);
      setFollowing(followingData || []);
      setSuggestions(suggestionsData || []);
      
      // Check follow status for all users if current user exists
      if (currentUser) {
        const allUsers = [...(followersData || []), ...(followingData || []), ...(suggestionsData || [])];
        const uniqueUsers = allUsers.filter((user, index, self) => 
          index === self.findIndex(u => u.id === user.id) && user.id !== currentUser.id
        );
        
        const statuses: Record<string, boolean> = {};
        await Promise.all(
          uniqueUsers.map(async (user) => {
            try {
              statuses[user.id] = await usersApi.isFollowing(currentUser.id, user.id);
            } catch (error) {
              statuses[user.id] = false;
            }
          })
        );
        setFollowStatuses(statuses);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setFollowers([]);
      setFollowing([]);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [id, currentUser]);

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
    // This function is called when a UserListItem avatar is pressed
    // The UserListItem component already checks for hasStory internally
    // and only calls this if the user has a story
    router.push(`/story/${userId}`);
  };


  const handleFollowChange = (userId: string, isFollowing: boolean) => {
    setFollowStatuses(prev => ({
      ...prev,
      [userId]: isFollowing
    }));
    
    // If we're unfollowing someone from the followers list, 
    // we might want to refresh the data to get updated counts
    if (!isFollowing) {
      console.log(`Unfollowed user ${userId}`);
    }
  };

  const handleTabPress = (tabIndex: number) => {
    setActiveTab(tabIndex);
    pagerRef.current?.setPage(tabIndex);
  };

  const handlePageSelected = (e: any) => {
    setActiveTab(e.nativeEvent.position);
  };


  const renderUser = ({ item }: { item: User }) => {
    const isCurrentUserFollowing = followStatuses[item.id] || false;
    const shouldShowButton = Boolean(currentUser && currentUser.id !== item.id);
    
    return (
      <UserListItem
        user={item}
        onPress={() => handleUserPress(item.id)}
        showFollowButton={shouldShowButton}
        isFollowing={isCurrentUserFollowing}
        onFollowChange={(isFollowing) => handleFollowChange(item.id, isFollowing)}
        onAvatarPress={() => handleAvatarPress(item.id)}
      />
    );
  };

  const renderFollowersList = () => (
    <View style={styles.listContainer}>
      {followers.length === 0 ? (
        <View style={styles.emptyState}>
          <LinearGradient
            colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
            style={styles.emptyGradient}
          >
            <BlurView intensity={10} tint="dark" style={styles.emptyBlur}>
              <Ionicons name="people-outline" size={60} color="rgba(255,255,255,0.6)" />
              <Text style={styles.emptyTitle}>No followers yet</Text>
              <Text style={styles.emptyDescription}>
                When people follow {user?.name || 'this user'}, they'll appear here.
              </Text>
            </BlurView>
          </LinearGradient>
        </View>
      ) : (
        <FlatList
          data={followers}
          renderItem={renderUser}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.flatListContent}
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
  );

  const renderFollowingList = () => (
    <View style={styles.listContainer}>
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
          renderItem={renderUser}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.flatListContent}
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
  );

  const renderSuggestionsList = () => (
    <View style={styles.listContainer}>
      {suggestions.length === 0 ? (
        <View style={styles.emptyState}>
          <LinearGradient
            colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
            style={styles.emptyGradient}
          >
            <BlurView intensity={10} tint="dark" style={styles.emptyBlur}>
              <Ionicons name="sparkles-outline" size={60} color="rgba(255,255,255,0.6)" />
              <Text style={styles.emptyTitle}>No suggestions available</Text>
              <Text style={styles.emptyDescription}>
                We'll suggest people you might want to follow based on your activity.
              </Text>
            </BlurView>
          </LinearGradient>
        </View>
      ) : (
        <View>
          <View style={styles.sectionHeader}>
            <LinearGradient
              colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)']}
              style={styles.sectionHeaderGradient}
            >
              <BlurView intensity={10} tint="dark" style={styles.sectionHeaderBlur}>
                <Ionicons name="sparkles" size={20} color="rgba(255,255,255,0.8)" />
                <Text style={styles.sectionHeaderText}>Suggested for you</Text>
              </BlurView>
            </LinearGradient>
          </View>
          <FlatList
            data={suggestions}
            renderItem={renderUser}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.flatListContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="white"
              />
            }
          />
        </View>
      )}
    </View>
  );

  if (loading) {
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Back Button */}
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={24} color="white" />
      </TouchableOpacity>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <BlurView intensity={20} tint="light" style={styles.tabBlur}>
          <View style={styles.tabNavigation}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 0 && styles.activeTab]}
              onPress={() => handleTabPress(0)}
            >
              <Text style={[styles.tabText, activeTab === 0 && styles.activeTabText]} numberOfLines={1}>
                Followers
              </Text>
              <Text style={[styles.tabCount, activeTab === 0 && styles.activeTabCount]}>
                {user?.followers_count?.toLocaleString() || followers.length}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.tab, activeTab === 1 && styles.activeTab]}
              onPress={() => handleTabPress(1)}
            >
              <Text style={[styles.tabText, activeTab === 1 && styles.activeTabText]} numberOfLines={1}>
                Following
              </Text>
              <Text style={[styles.tabCount, activeTab === 1 && styles.activeTabCount]}>
                {user?.following_count?.toLocaleString() || following.length}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 2 && styles.activeTab]}
              onPress={() => handleTabPress(2)}
            >
              <Text style={[styles.tabText, activeTab === 2 && styles.activeTabText]} numberOfLines={1}>
                Suggestions
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Tab Indicator */}
          <View style={styles.indicatorContainer}>
            <View 
              style={[
                styles.indicator, 
                { 
                  left: activeTab === 0 ? '8.33%' : activeTab === 1 ? '41.67%' : '75%' 
                }
              ]} 
            />
          </View>
        </BlurView>
      </View>

      {/* Pager View */}
      <PagerView
        ref={pagerRef}
        style={styles.pagerView}
        initialPage={activeTab}
        onPageSelected={handlePageSelected}
      >
        <View key="followers" style={styles.page}>
          {renderFollowersList()}
        </View>
        <View key="following" style={styles.page}>
          {renderFollowingList()}
        </View>
        <View key="suggestions" style={styles.page}>
          {renderSuggestionsList()}
        </View>
      </PagerView>
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
  placeholder: {
    width: 40,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  tabContainer: {
    marginTop: 100,
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  tabBlur: {
    paddingVertical: 8,
  },
  tabNavigation: {
    flexDirection: 'row',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  activeTab: {
    // Active tab styling handled by indicator
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
  tabCount: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  activeTabCount: {
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  indicatorContainer: {
    position: 'relative',
    height: 3,
    marginHorizontal: 16,
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    width: '16.67%',
    height: 3,
    backgroundColor: 'white',
    borderRadius: 2,
    shadowColor: 'white',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  pagerView: {
    flex: 1,
    marginTop: 8,
  },
  page: {
    flex: 1,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  flatListContent: {
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
  sectionHeader: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: 4,
  },
  sectionHeaderGradient: {
    borderRadius: 12,
  },
  sectionHeaderBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  sectionHeaderText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});