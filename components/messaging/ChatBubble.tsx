import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

export default function ChatBubble({ message, isCurrentUser }: { message: any; isCurrentUser: boolean }) {
  const formatTime = (timestamp: string) => {
    // Simple time formatting - in real app you'd use proper date library
    return timestamp.split(' ')[0] || timestamp;
  };

  return (
    <View style={[styles.container, isCurrentUser ? styles.sentContainer : styles.receivedContainer]}>
      <View style={[styles.bubble, { maxWidth: '80%' }]}>
        {isCurrentUser ? (
          // Sent message (user's message)
          <LinearGradient
            colors={['#667eea', '#764ba2', '#f093fb']}
            style={[styles.gradient, styles.sentGradient]}
          >
            <View style={styles.messageContent}>
              <Text style={styles.sentText}>{message.text}</Text>
              <View style={styles.messageInfo}>
                <Text style={styles.sentTime}>{formatTime(message.timestamp)}</Text>
                <View style={styles.messageStatus}>
                  <Ionicons 
                    name={message.isRead ? "checkmark-done" : "checkmark"} 
                    size={14} 
                    color="rgba(255,255,255,0.8)" 
                  />
                </View>
              </View>
            </View>
          </LinearGradient>
        ) : (
          // Received message (other user's message)
          <LinearGradient
            colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.08)']}
            style={[styles.gradient, styles.receivedGradient]}
          >
            <BlurView intensity={12} tint="dark" style={styles.receivedBlur}>
              <View style={styles.messageContent}>
                <Text style={styles.receivedText}>{message.text}</Text>
                <View style={styles.messageInfo}>
                  <Text style={styles.receivedTime}>{formatTime(message.timestamp)}</Text>
                </View>
              </View>
            </BlurView>
          </LinearGradient>
        )}
        
        {/* Message tail */}
        <View style={[
          styles.messageTail,
          isCurrentUser ? styles.sentTail : styles.receivedTail
        ]}>
          {isCurrentUser ? (
            <LinearGradient
              colors={['#f093fb', '#667eea']}
              style={styles.tailGradient}
            />
          ) : (
            <LinearGradient
              colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.08)']}
              style={styles.tailGradient}
            />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 3,
    paddingHorizontal: 4,
  },
  sentContainer: {
    justifyContent: 'flex-end',
  },
  receivedContainer: {
    justifyContent: 'flex-start',
  },
  bubble: {
    position: 'relative',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  gradient: {
    borderRadius: 20,
  },
  sentGradient: {
    borderBottomRightRadius: 6,
  },
  receivedGradient: {
    borderBottomLeftRadius: 6,
  },
  receivedBlur: {
    borderRadius: 20,
    borderBottomLeftRadius: 6,
  },
  messageContent: {
    padding: 14,
    paddingBottom: 8,
    gap: 6,
  },
  sentText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 20,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  receivedText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 20,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  messageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    marginTop: 2,
  },
  sentTime: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontWeight: '500',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  receivedTime: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '500',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  messageStatus: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageTail: {
    position: 'absolute',
    bottom: 0,
    width: 12,
    height: 12,
    overflow: 'hidden',
  },
  sentTail: {
    right: -1,
    transform: [{ rotate: '45deg' }],
    borderTopLeftRadius: 20,
  },
  receivedTail: {
    left: -1,
    transform: [{ rotate: '-45deg' }],
    borderTopRightRadius: 20,
  },
  tailGradient: {
    width: '100%',
    height: '100%',
  },
});
