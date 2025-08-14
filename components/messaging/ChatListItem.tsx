import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

export default function ChatListItem({ chat }: { chat: any }) {
  const user = chat.users.find((u: any) => !('isCurrentUser' in u && u.isCurrentUser));
  const lastMessage = chat.messages.slice(-1)[0];
  const isUnread = chat.unread > 0;
  
  if (!user) return null;
  
  return (
    <Link href={{ pathname: '/chat/[id]', params: { id: chat.id, userName: user.name } }} asChild>
      <TouchableOpacity activeOpacity={0.8} style={styles.container}>
        <LinearGradient
          colors={['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.05)']}
          style={styles.gradient}
        >
          <BlurView intensity={10} tint="dark" style={styles.blur}>
            <View style={styles.content}>
              {/* Avatar Section */}
              <View style={styles.avatarContainer}>
                <LinearGradient
                  colors={['#667eea', '#764ba2', '#f093fb', '#4facfe']}
                  style={styles.avatarRing}
                >
                  <Image source={{ uri: user.avatar }} style={styles.avatar} />
                </LinearGradient>
                {user.isOnline && <View style={styles.onlineIndicator} />}
                {user.verified && (
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark" size={8} color="white" />
                  </View>
                )}
              </View>

              {/* Message Content */}
              <View style={styles.messageContent}>
                <View style={styles.nameRow}>
                  <Text style={styles.userName} numberOfLines={1}>
                    {user.name}
                  </Text>
                  {isUnread && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadCount}>{chat.unread}</Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.messageRow}>
                  <Text 
                    style={[
                      styles.lastMessage,
                      isUnread && styles.unreadMessage
                    ]} 
                    numberOfLines={1}
                  >
                    {lastMessage.text}
                  </Text>
                  <Text style={styles.timestamp}>{lastMessage.timestamp}</Text>
                </View>
              </View>

              {/* Message Status */}
              <View style={styles.statusContainer}>
                {lastMessage.isRead ? (
                  <Ionicons name="checkmark-done" size={16} color="#10B981" />
                ) : (
                  <Ionicons name="checkmark" size={16} color="rgba(255,255,255,0.5)" />
                )}
              </View>
            </View>
          </BlurView>
        </LinearGradient>
      </TouchableOpacity>
    </Link>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  gradient: {
    borderRadius: 20,
  },
  blur: {
    padding: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    padding: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    backgroundColor: '#10B981',
    borderRadius: 7,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  verifiedBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#1DA1F2',
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageContent: {
    flex: 1,
    gap: 6,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userName: {
    color: 'white',
    fontSize: 17,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: '#f093fb',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  lastMessage: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  unreadMessage: {
    color: 'white',
    fontWeight: '600',
  },
  timestamp: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontWeight: '500',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  statusContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
