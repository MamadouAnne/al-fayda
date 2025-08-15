import { 
  View, 
  Text, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  StatusBar, 
  Animated, 
  StyleSheet, 
  Dimensions 
} from 'react-native';
// Removed static data imports
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

interface NotificationItem {
  id: number;
  type: string;
  user?: {
    name: string;
    avatar: string;
  };
  post?: any;
  timestamp: string;
  read: boolean;
  title?: string;
  description?: string;
}

export default function NotificationsScreen() {
  const [selectedTab, setSelectedTab] = useState('all');
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const floatingAnimation = useRef(new Animated.Value(0)).current;
  const router = useRouter();

  useEffect(() => {
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

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
      case 'post_like':
        return { name: 'heart', color: '#EF4444', bgColor: '#FEF2F2' };
      case 'comment':
        return { name: 'chatbubble', color: '#3B82F6', bgColor: '#EFF6FF' };
      case 'friend_request':
      case 'follow':
        return { name: 'person-add', color: '#10B981', bgColor: '#F0FDF4' };
      case 'mention':
        return { name: 'at', color: '#F59E0B', bgColor: '#FFFBEB' };
      case 'achievement':
        return { name: 'trophy', color: '#8B5CF6', bgColor: '#FAF5FF' };
      default:
        return { name: 'notifications', color: '#6B7280', bgColor: '#F9FAFB' };
    }
  };

  const renderNotificationItem = ({ item, index }: { item: NotificationItem; index: number }) => {
    const iconData = getNotificationIcon(item.type);
    let notificationText = '';

    switch (item.type) {
      case 'like':
      case 'post_like':
        notificationText = `${item.user?.name} liked your post.`;
        break;
      case 'comment':
        notificationText = `${item.user?.name} commented on your post.`;
        break;
      case 'friend_request':
        notificationText = `${item.user?.name} sent you a friend request.`;
        break;
      case 'follow':
        notificationText = `${item.user?.name} started following you.`;
        break;
      case 'mention':
        notificationText = `${item.user?.name} mentioned you in a post.`;
        break;
      case 'achievement':
        notificationText = `${item.title}: ${item.description}`;
        break;
      default:
        notificationText = 'New notification.';
    }

    return (
      <Animated.View 
        style={[
          styles.notificationItem,
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
        <TouchableOpacity style={styles.notificationContent}>
          <BlurView intensity={15} tint="light" style={styles.notificationBlur}>
            <View style={styles.notificationRow}>
              {/* Icon Container */}
              <View style={[styles.iconContainer, { backgroundColor: iconData.bgColor }]}>
                <Ionicons name={iconData.name as any} size={20} color={iconData.color} />
              </View>

              {/* User Avatar */}
              {item.user && (
                <View style={styles.avatarContainer}>
                  <Image source={{ uri: item.user.avatar }} style={styles.avatar} />
                  {!item.read && <View style={styles.unreadDot} />}
                </View>
              )}

              {/* Content */}
              <View style={styles.contentContainer}>
                <Text style={[styles.notificationText, { opacity: item.read ? 0.7 : 1 }]}>
                  {notificationText}
                </Text>
                <Text style={styles.timestamp}>{item.timestamp}</Text>
              </View>

              {/* Action Button */}
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="chevron-forward" size={16} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </BlurView>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const EmptyState = () => (
    <Animated.View style={[styles.emptyState, { opacity: fadeAnimation }]}>
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
              <Ionicons name="notifications-outline" size={60} color="white" />
            </LinearGradient>
          </View>
          <Text style={styles.emptyTitle}>No notifications yet</Text>
          <Text style={styles.emptyDescription}>
            You'll see notifications about your posts, comments, and friends here.
          </Text>
        </BlurView>
      </LinearGradient>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Background Gradient */}
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
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <BlurView intensity={20} tint="light" style={styles.backButtonBlur}>
                  <Ionicons name="arrow-back" size={24} color="white" />
                </BlurView>
              </TouchableOpacity>
              <Text style={styles.title}>Notifications</Text>
              <TouchableOpacity style={styles.settingsButton}>
                <BlurView intensity={20} tint="light" style={styles.settingsButtonBlur}>
                  <Ionicons name="settings-outline" size={24} color="white" />
                </BlurView>
              </TouchableOpacity>
            </View>
            
            {/* Tab Buttons */}
            <View style={styles.tabContainer}>
              <BlurView intensity={20} tint="light" style={styles.tabBlur}>
                <View style={styles.tabRow}>
                  {['all', 'unread'].map((tab) => (
                    <TouchableOpacity
                      key={tab}
                      onPress={() => setSelectedTab(tab)}
                      style={[
                        styles.tabButton,
                        selectedTab === tab && styles.activeTabButton
                      ]}
                    >
                      {selectedTab === tab && (
                        <LinearGradient
                          colors={['#f093fb', '#f5576c']}
                          style={styles.activeTabGradient}
                        />
                      )}
                      <Text style={[
                        styles.tabText,
                        selectedTab === tab && styles.activeTabText
                      ]}>
                        {tab === 'all' ? 'All' : 'Unread'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </BlurView>
            </View>
          </View>
        </BlurView>
      </Animated.View>

      {/* Notifications List */}
      <View style={styles.notificationsList}>
        <FlatList
          data={[]}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderNotificationItem}
          ListEmptyComponent={EmptyState}
          contentContainerStyle={styles.notificationsListContent}
          showsVerticalScrollIndicator={false}
        />
      </View>
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
    paddingBottom: 20,
  },
  headerBlur: {
    paddingHorizontal: 20,
  },
  headerContent: {
    gap: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  backButtonBlur: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: 'white',
    fontSize: 28,
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 6,
    letterSpacing: 1,
  },
  settingsButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  settingsButtonBlur: {
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
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 4,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 16,
    position: 'relative',
  },
  activeTabButton: {
    overflow: 'hidden',
  },
  activeTabGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
  },
  tabText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    fontWeight: '600',
    zIndex: 1,
  },
  activeTabText: {
    color: 'white',
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  notificationsList: {
    flex: 1,
    paddingTop: 180,
  },
  notificationsListContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  notificationItem: {
    marginBottom: 12,
  },
  notificationContent: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  notificationBlur: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  unreadDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    backgroundColor: '#EF4444',
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'white',
  },
  contentContainer: {
    flex: 1,
  },
  notificationText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 20,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  timestamp: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginTop: 60,
  },
  emptyStateGradient: {
    borderRadius: 24,
    width: '100%',
  },
  emptyStateBlur: {
    padding: 40,
    alignItems: 'center',
  },
  emptyIconContainer: {
    marginBottom: 24,
    borderRadius: 40,
    overflow: 'hidden',
  },
  emptyIconGradient: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  emptyDescription: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});
