import { View, Text, FlatList, TouchableOpacity, ScrollView, Image, StatusBar, Animated, StyleSheet, Dimensions } from 'react-native';
import { FRIEND_REQUESTS, SUGGESTED_FRIENDS, USERS, CURRENT_USER_PROFILE } from '@/constants/MockData';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

export default function FriendsScreen() {
  const [requests, setRequests] = useState(FRIEND_REQUESTS);
  const [selectedTab, setSelectedTab] = useState('requests');
  const router = useRouter();
  const slideAnimation = useRef(new Animated.Value(0)).current;
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const floatingAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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
  }, []);

  const floatingY = floatingAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });

  const handleAccept = (id: number) => {
    setRequests(prev => prev.filter(req => req.id !== id));
  };

  const handleReject = (id: number) => {
    setRequests(prev => prev.filter(req => req.id !== id));
  };

  const switchTab = (tab: string) => {
    setSelectedTab(tab);
    Animated.timing(slideAnimation, {
      toValue: tab === 'requests' ? 0 : 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const FriendRequestCard = ({ request, onAccept, onReject }: any) => (
    <Animated.View style={[styles.friendCard, { opacity: fadeAnimation }]}>
      <LinearGradient
        colors={['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.05)']}
        style={styles.cardGradient}
      >
        <BlurView intensity={10} tint="dark" style={styles.cardBlur}>
          <View style={styles.cardContent}>
            <View style={styles.userInfo}>
              <View style={styles.avatarContainer}>
                <LinearGradient
                  colors={['#667eea', '#764ba2', '#f093fb', '#4facfe']}
                  style={styles.avatarRing}
                >
                  <Image source={{ uri: request.user.avatar }} style={styles.avatar} />
                </LinearGradient>
                <View style={styles.onlineIndicator} />
              </View>
              
              <View style={styles.userDetails}>
                <View style={styles.nameRow}>
                  <Text style={styles.userName}>{request.user.name}</Text>
                  {request.user.verified && (
                    <View style={styles.verifiedBadge}>
                      <Ionicons name="checkmark" size={12} color="white" />
                    </View>
                  )}
                </View>
                <Text style={styles.userUsername}>{request.user.username}</Text>
                <Text style={styles.mutualFriends}>
                  {request.mutualFriends} mutual friends
                </Text>
              </View>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity onPress={() => onAccept(request.id)} style={styles.acceptButton}>
                <LinearGradient colors={['#10B981', '#059669']} style={styles.buttonGradient}>
                  <Ionicons name="checkmark" size={16} color="white" />
                  <Text style={styles.buttonText}>Accept</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onReject(request.id)} style={styles.declineButton}>
                <BlurView intensity={15} tint="light" style={styles.declineBlur}>
                  <Ionicons name="close" size={16} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.declineText}>Decline</Text>
                </BlurView>
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </LinearGradient>
    </Animated.View>
  );

  const SuggestedFriendCard = ({ suggestion }: any) => (
    <Animated.View style={[styles.suggestionCard, { opacity: fadeAnimation }]}>
      <LinearGradient
        colors={['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.05)']}
        style={styles.suggestionGradient}
      >
        <BlurView intensity={10} tint="dark" style={styles.suggestionBlur}>
          <View style={styles.suggestionContent}>
            <View style={styles.suggestionUserInfo}>
              <View style={styles.suggestionAvatarContainer}>
                <LinearGradient
                  colors={['#f093fb', '#f5576c', '#4facfe', '#00f2fe']}
                  style={styles.suggestionAvatarRing}
                >
                  <Image source={{ uri: suggestion.user.avatar }} style={styles.suggestionAvatar} />
                </LinearGradient>
                {suggestion.user.verified && (
                  <View style={styles.suggestionVerifiedBadge}>
                    <Ionicons name="checkmark" size={10} color="white" />
                  </View>
                )}
              </View>
              
              <View style={styles.suggestionUserDetails}>
                <Text style={styles.suggestionUserName}>{suggestion.user.name}</Text>
                <Text style={styles.suggestionUserUsername}>{suggestion.user.username}</Text>
                <View style={styles.reasonContainer}>
                  <BlurView intensity={15} tint="light" style={styles.reasonBlur}>
                    <Text style={styles.suggestionReason}>{suggestion.reason}</Text>
                  </BlurView>
                </View>
                <Text style={styles.suggestionMutualFriends}>
                  {suggestion.mutualFriends} mutual friends
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.addFriendButton}>
              <LinearGradient colors={['#f093fb', '#f5576c']} style={styles.addButtonGradient}>
                <Ionicons name="person-add" size={16} color="white" />
                <Text style={styles.addButtonText}>Add</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </BlurView>
      </LinearGradient>
    </Animated.View>
  );

  const MyFriendsGrid = () => (
    <View style={styles.friendsGridContainer}>
      <View style={styles.friendsHeader}>
        <Text style={styles.friendsTitle}>My Friends</Text>
        <View style={styles.friendsCountBadge}>
          <BlurView intensity={15} tint="light" style={styles.countBlur}>
            <Text style={styles.friendsCount}>{CURRENT_USER_PROFILE.friends} total</Text>
          </BlurView>
        </View>
      </View>
      
      <View style={styles.friendsGrid}>
        {USERS.slice(0, 6).map((user, index) => (
          <Animated.View 
            key={user.id}
            style={[
              styles.friendGridItem,
              {
                transform: [{
                  translateY: floatingAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, index % 2 === 0 ? -3 : 3],
                  })
                }]
              }
            ]}
          >
            <LinearGradient
              colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.08)']}
              style={styles.friendCardGradient}
            >
              <BlurView intensity={12} tint="dark" style={styles.friendCardBlur}>
                <View style={styles.friendCardContent}>
                  <View style={styles.friendAvatarContainer}>
                    <LinearGradient
                      colors={['#4facfe', '#00f2fe', '#667eea', '#764ba2']}
                      style={styles.friendAvatarRing}
                    >
                      <Image source={{ uri: user.avatar }} style={styles.friendAvatar} />
                    </LinearGradient>
                    <View style={styles.friendOnlineIndicator} />
                  </View>
                  
                  <View style={styles.friendInfo}>
                    <View style={styles.friendNameRow}>
                      <Text style={styles.friendName} numberOfLines={1}>
                        {user.name.split(' ')[0]}
                      </Text>
                      {user.verified && (
                        <View style={styles.friendVerifiedBadge}>
                          <Ionicons name="checkmark" size={10} color="white" />
                        </View>
                      )}
                    </View>
                    <Text style={styles.friendUsername} numberOfLines={1}>{user.username}</Text>
                  </View>
                  
                  <TouchableOpacity 
                    onPress={() => router.push('/messages')}
                    style={styles.messageButton}
                  >
                    <BlurView intensity={20} tint="light" style={styles.messageBlur}>
                      <Ionicons name="chatbubble" size={14} color="white" />
                      <Text style={styles.messageText}>Message</Text>
                    </BlurView>
                  </TouchableOpacity>
                </View>
              </BlurView>
            </LinearGradient>
          </Animated.View>
        ))}
      </View>
      
      <TouchableOpacity style={styles.viewAllButton}>
        <LinearGradient
          colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
          style={styles.viewAllGradient}
        >
          <BlurView intensity={15} tint="light" style={styles.viewAllBlur}>
            <Ionicons name="people" size={20} color="white" />
            <Text style={styles.viewAllText}>View All Friends</Text>
          </BlurView>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

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
            <View style={styles.titleRow}>
              <Text style={styles.title}>Friends</Text>
              <TouchableOpacity style={styles.addButton}>
                <BlurView intensity={20} tint="light" style={styles.addButtonBlur}>
                  <Ionicons name="person-add-outline" size={24} color="white" />
                </BlurView>
              </TouchableOpacity>
            </View>
            
            {/* Beautiful Tab Navigation */}
            <View style={styles.tabContainer}>
              <BlurView intensity={25} tint="light" style={styles.tabBlur}>
                <View style={styles.tabNavigation}>
                  {[
                    { id: 'requests', label: 'Requests', count: requests.length },
                    { id: 'suggestions', label: 'Suggestions', count: null },
                    { id: 'friends', label: 'My Friends', count: null }
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
                      <Text style={[styles.tabText, selectedTab === tab.id && styles.activeTabText]}>
                        {tab.label} {tab.count ? `(${tab.count})` : ''}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </BlurView>
            </View>
          </View>
        </BlurView>
      </Animated.View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {selectedTab === 'requests' && (
          <View style={styles.contentContainer}>
            {requests.length > 0 ? (
              requests.map((request) => (
                <FriendRequestCard
                  key={request.id}
                  request={request}
                  onAccept={handleAccept}
                  onReject={handleReject}
                />
              ))
            ) : (
              <View style={styles.emptyState}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.05)']}
                  style={styles.emptyStateGradient}
                >
                  <BlurView intensity={10} tint="dark" style={styles.emptyStateBlur}>
                    <View style={styles.emptyIconContainer}>
                      <Ionicons name="people-outline" size={60} color="rgba(255,255,255,0.6)" />
                    </View>
                    <Text style={styles.emptyTitle}>No friend requests</Text>
                    <Text style={styles.emptyDescription}>
                      When people send you friend requests, they'll appear here.
                    </Text>
                  </BlurView>
                </LinearGradient>
              </View>
            )}
          </View>
        )}

        {selectedTab === 'suggestions' && (
          <View style={styles.contentContainer}>
            <Text style={styles.sectionTitle}>People You May Know</Text>
            {SUGGESTED_FRIENDS.map((suggestion) => (
              <SuggestedFriendCard key={suggestion.id} suggestion={suggestion} />
            ))}
          </View>
        )}

        {selectedTab === 'friends' && <MyFriendsGrid />}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  backgroundOrbs: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  orb1: {
    position: 'absolute',
    top: 100,
    right: 30,
    width: 120,
    height: 120,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 60,
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
    right: 50,
    width: 100,
    height: 100,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 50,
    opacity: 0.7,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingTop: 50,
    paddingBottom: 20,
  },
  headerBlur: {
    padding: 20,
  },
  headerContent: {
    gap: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: 'white',
    fontSize: 32,
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 6,
    letterSpacing: 1,
  },
  addButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  addButtonBlur: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContainer: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  tabBlur: {
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
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  activeTabText: {
    color: 'white',
    fontWeight: '700',
  },
  content: {
    flex: 1,
    paddingTop: 180,
  },
  contentContainer: {
    padding: 20,
  },
  friendCard: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  cardGradient: {
    borderRadius: 20,
  },
  cardBlur: {
    padding: 20,
  },
  cardContent: {
    gap: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarRing: {
    width: 70,
    height: 70,
    borderRadius: 35,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    backgroundColor: '#10B981',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
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
    fontSize: 18,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  verifiedBadge: {
    backgroundColor: '#1DA1F2',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userUsername: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
  mutualFriends: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  acceptButton: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  declineButton: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  declineBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  declineText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  emptyStateGradient: {
    borderRadius: 20,
  },
  emptyStateBlur: {
    padding: 40,
    alignItems: 'center',
  },
  emptyIconContainer: {
    marginBottom: 16,
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
  sectionTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  // Suggestions styles
  suggestionCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  suggestionGradient: {
    borderRadius: 16,
  },
  suggestionBlur: {
    padding: 16,
  },
  suggestionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  suggestionUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  suggestionAvatarContainer: {
    position: 'relative',
  },
  suggestionAvatarRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    padding: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionAvatar: {
    width: 51,
    height: 51,
    borderRadius: 25.5,
  },
  suggestionVerifiedBadge: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    backgroundColor: '#1DA1F2',
    borderRadius: 7,
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionUserDetails: {
    flex: 1,
    gap: 2,
  },
  suggestionUserName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  suggestionUserUsername: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '500',
  },
  reasonContainer: {
    alignSelf: 'flex-start',
    borderRadius: 10,
    overflow: 'hidden',
    marginVertical: 2,
  },
  reasonBlur: {
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  suggestionReason: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  suggestionMutualFriends: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontWeight: '500',
  },
  addFriendButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
  },
  addButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
  // Friends grid styles
  friendsGridContainer: {
    padding: 20,
  },
  friendsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  friendsTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  friendsCountBadge: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  countBlur: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  friendsCount: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  friendsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  friendGridItem: {
    width: '48%',
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  friendCardGradient: {
    borderRadius: 18,
  },
  friendCardBlur: {
    padding: 16,
  },
  friendCardContent: {
    alignItems: 'center',
    gap: 12,
  },
  friendAvatarContainer: {
    position: 'relative',
  },
  friendAvatarRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    padding: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendAvatar: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
  },
  friendOnlineIndicator: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 14,
    height: 14,
    backgroundColor: '#10B981',
    borderRadius: 7,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  friendInfo: {
    alignItems: 'center',
    gap: 2,
  },
  friendNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  friendName: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  friendVerifiedBadge: {
    backgroundColor: '#1DA1F2',
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendUsername: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  messageButton: {
    borderRadius: 14,
    overflow: 'hidden',
    width: '100%',
  },
  messageBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 6,
  },
  messageText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  viewAllButton: {
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  viewAllGradient: {
    borderRadius: 16,
  },
  viewAllBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  viewAllText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
});
