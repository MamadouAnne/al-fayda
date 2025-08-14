import { View, Text, FlatList, TextInput, KeyboardAvoidingView, Platform, TouchableOpacity, StatusBar, Animated, StyleSheet, Dimensions, Image } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { CHATS, USERS } from '@/constants/MockData';
import ChatBubble from '@/components/messaging/ChatBubble';
import { useState, useRef, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function ChatScreen() {
  const { id, userName } = useLocalSearchParams();
  
  // First try to find existing chat by chat ID
  let chat = CHATS.find(c => c.id.toString() === id);
  let otherUser = null;
  
  // If no chat found, try to find user by user ID and create a new chat context
  if (!chat) {
    const user = USERS.find(u => u.id.toString() === id);
    if (user) {
      // Create a temporary chat object for new conversation
      otherUser = user;
      chat = {
        id: parseInt(id as string),
        users: [{ ...USERS[0], isCurrentUser: true }, user], // Assume USERS[0] is current user
        messages: [], // Empty messages for new chat
        lastMessage: '',
        timestamp: 'now',
        unread: 0
      };
    }
  } else {
    // Find the other user in existing chat
    otherUser = chat.users.find((u: any) => !('isCurrentUser' in u && u.isCurrentUser));
  }
  
  const [messageText, setMessageText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [messages, setMessages] = useState(chat?.messages || []);
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const floatingAnimation = useRef(new Animated.Value(0)).current;
  const router = useRouter();

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnimation, {
        toValue: 1,
        duration: 1000,
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
    outputRange: [0, -6],
  });

  if (!chat || !otherUser) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#667eea', '#764ba2', '#f093fb', '#f5576c']}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>User not found</Text>
        </View>
      </View>
    );
  }

  const handleSendMessage = () => {
    if (messageText.trim()) {
      // Create new message
      const newMessage = {
        id: messages.length + 1,
        text: messageText.trim(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        user: USERS[0], // Current user (assume USERS[0] is current user)
        isRead: false
      };
      
      // Add message to local state
      setMessages(prev => [...prev, newMessage]);
      setMessageText('');
      
      console.log('Sending message:', messageText);
    }
  };

  const handleVoiceRecord = () => {
    setIsRecording(!isRecording);
    console.log('Voice recording:', !isRecording);
  };

  const handleImagePicker = () => {
    console.log('Opening image picker');
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
            outputRange: [8, -4],
          }) }] 
        }]} />
        <Animated.View style={[styles.orb3, { 
          transform: [{ translateY: floatingAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [-4, 10],
          }) }] 
        }]} />
      </View>

      {/* Custom Header */}
      <Animated.View style={[styles.header, { opacity: fadeAnimation }]}>
        <BlurView intensity={15} tint="dark" style={styles.headerBlur}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <BlurView intensity={20} tint="light" style={styles.backButtonBlur}>
                <Ionicons name="arrow-back" size={24} color="white" />
              </BlurView>
            </TouchableOpacity>
            
            <View style={styles.userInfo}>
              <View style={styles.avatarContainer}>
                <LinearGradient
                  colors={['#f093fb', '#f5576c', '#4facfe', '#00f2fe']}
                  style={styles.avatarRing}
                >
                  <Image source={{ uri: otherUser?.avatar }} style={styles.avatar} />
                </LinearGradient>
                {/* Assume users are online for demo - in real app this would come from user status */}
                <View style={styles.onlineIndicator} />
              </View>
              
              <View style={styles.userDetails}>
                <View style={styles.nameRow}>
                  <Text style={styles.userName}>{otherUser?.name}</Text>
                  {otherUser?.verified && (
                    <View style={styles.verifiedBadge}>
                      <Ionicons name="checkmark" size={12} color="white" />
                    </View>
                  )}
                </View>
                <Text style={styles.userStatus}>Active now</Text>
              </View>
            </View>
            
            <TouchableOpacity style={styles.moreButton}>
              <BlurView intensity={20} tint="light" style={styles.moreButtonBlur}>
                <Ionicons name="ellipsis-horizontal" size={24} color="white" />
              </BlurView>
            </TouchableOpacity>
          </View>
        </BlurView>
      </Animated.View>

      <KeyboardAvoidingView 
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Messages List */}
        <View style={styles.messagesContainer}>
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item, index }) => (
              <Animated.View 
                style={[
                  styles.messageWrapper,
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
                <ChatBubble message={item} isCurrentUser={item.user.id === 1} />
              </Animated.View>
            )}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            inverted
            ListEmptyComponent={() => (
              <Animated.View style={[styles.emptyChat, { opacity: fadeAnimation }]}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.05)']}
                  style={styles.emptyChatGradient}
                >
                  <BlurView intensity={10} tint="dark" style={styles.emptyChatBlur}>
                    <View style={styles.emptyChatIconContainer}>
                      <LinearGradient
                        colors={['#667eea', '#764ba2']}
                        style={styles.emptyChatIconGradient}
                      >
                        <Ionicons name="chatbubbles-outline" size={40} color="white" />
                      </LinearGradient>
                    </View>
                    <Text style={styles.emptyChatTitle}>Start the conversation</Text>
                    <Text style={styles.emptyChatDescription}>
                      Send a message to {otherUser?.name.split(' ')[0]} to get started.
                    </Text>
                  </BlurView>
                </LinearGradient>
              </Animated.View>
            )}
          />
        </View>

        {/* Beautiful Input Area */}
        <Animated.View style={[styles.inputContainer, { opacity: fadeAnimation }]}>
          <BlurView intensity={15} tint="dark" style={styles.inputBlur}>
            <View style={styles.inputContent}>
              {/* Image Button */}
              <TouchableOpacity onPress={handleImagePicker} style={styles.actionButton}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                  style={styles.actionButtonGradient}
                >
                  <Ionicons name="image" size={20} color="white" />
                </LinearGradient>
              </TouchableOpacity>

              {/* Text Input */}
              <View style={styles.textInputContainer}>
                <BlurView intensity={20} tint="light" style={styles.textInputBlur}>
                  <TextInput
                    placeholder="Type a message..."
                    placeholderTextColor="rgba(255,255,255,0.6)"
                    style={styles.textInput}
                    value={messageText}
                    onChangeText={setMessageText}
                    onSubmitEditing={handleSendMessage}
                    multiline
                    maxLength={500}
                  />
                </BlurView>
              </View>

              {/* Voice/Send Button */}
              <TouchableOpacity 
                onPress={messageText.trim() ? handleSendMessage : handleVoiceRecord}
                style={styles.primaryButton}
              >
                <LinearGradient
                  colors={messageText.trim() ? ['#10B981', '#059669'] : isRecording ? ['#EF4444', '#DC2626'] : ['#667eea', '#764ba2']}
                  style={styles.primaryButtonGradient}
                >
                  <Ionicons 
                    name={messageText.trim() ? "send" : isRecording ? "stop" : "mic"} 
                    size={20} 
                    color="white" 
                  />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </BlurView>
        </Animated.View>
      </KeyboardAvoidingView>
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
    top: 150,
    right: 30,
    width: 80,
    height: 80,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 40,
    opacity: 0.8,
  },
  orb2: {
    position: 'absolute',
    top: 400,
    left: -20,
    width: 60,
    height: 60,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 30,
    opacity: 0.6,
  },
  orb3: {
    position: 'absolute',
    bottom: 300,
    right: 50,
    width: 100,
    height: 100,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 50,
    opacity: 0.7,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
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
    gap: 16,
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
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarRing: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 41,
    height: 41,
    borderRadius: 20.5,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 12,
    height: 12,
    backgroundColor: '#10B981',
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  userDetails: {
    flex: 1,
    gap: 2,
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
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userStatus: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '500',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
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
  keyboardContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
    paddingTop: 120,
  },
  messageWrapper: {
    marginVertical: 2,
  },
  messagesList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  inputContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  inputBlur: {
    borderRadius: 24,
    padding: 12,
  },
  inputContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  actionButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInputContainer: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    maxHeight: 100,
  },
  textInputBlur: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  textInput: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 20,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    minHeight: 20,
  },
  primaryButton: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonGradient: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyChat: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
    transform: [{ scaleY: -1 }], // Flip back since FlatList is inverted
  },
  emptyChatGradient: {
    borderRadius: 24,
    width: '100%',
  },
  emptyChatBlur: {
    padding: 40,
    alignItems: 'center',
  },
  emptyChatIconContainer: {
    marginBottom: 20,
    borderRadius: 30,
    overflow: 'hidden',
  },
  emptyChatIconGradient: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyChatTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  emptyChatDescription: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});
