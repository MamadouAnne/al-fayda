import { View, Text, FlatList, TouchableOpacity, StatusBar, Animated, StyleSheet, Dimensions, Image, TextInput } from 'react-native';
import { CHATS } from '@/constants/MockData';
import ChatListItem from '@/components/messaging/ChatListItem';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

export default function MessagesScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const floatingAnimation = useRef(new Animated.Value(0)).current;
  const router = useRouter();

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

  const filteredChats = CHATS.filter(chat => {
    const user = chat.users.find(u => !('isCurrentUser' in u && u.isCurrentUser));
    return user?.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const renderChatItem = ({ item, index }: { item: any; index: number }) => (
    <Animated.View 
      style={[
        styles.chatItemContainer,
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
      <ChatListItem chat={item} />
    </Animated.View>
  );

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
              <Ionicons name="chatbubbles-outline" size={60} color="white" />
            </LinearGradient>
          </View>
          <Text style={styles.emptyTitle}>No conversations yet</Text>
          <Text style={styles.emptyDescription}>
            Start a conversation with your friends to see messages here.
          </Text>
          <TouchableOpacity style={styles.startChatButton}>
            <LinearGradient colors={['#f093fb', '#f5576c']} style={styles.startChatGradient}>
              <Ionicons name="add" size={20} color="white" />
              <Text style={styles.startChatText}>Start New Chat</Text>
            </LinearGradient>
          </TouchableOpacity>
        </BlurView>
      </LinearGradient>
    </Animated.View>
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
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <BlurView intensity={20} tint="light" style={styles.backButtonBlur}>
                  <Ionicons name="arrow-back" size={24} color="white" />
                </BlurView>
              </TouchableOpacity>
              <Text style={styles.title}>Messages</Text>
              <TouchableOpacity style={styles.addButton}>
                <BlurView intensity={20} tint="light" style={styles.addButtonBlur}>
                  <Ionicons name="create-outline" size={24} color="white" />
                </BlurView>
              </TouchableOpacity>
            </View>
            
            {/* Beautiful Search Bar */}
            <View style={styles.searchContainer}>
              <BlurView intensity={20} tint="light" style={styles.searchBlur}>
                <Ionicons name="search" size={20} color="rgba(255,255,255,0.7)" style={styles.searchIcon} />
                <TextInput
                  placeholder="Search conversations..."
                  placeholderTextColor="rgba(255,255,255,0.6)"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  style={styles.searchInput}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                    <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.7)" />
                  </TouchableOpacity>
                )}
              </BlurView>
            </View>
          </View>
        </BlurView>
      </Animated.View>

      {/* Chat List */}
      <View style={styles.chatList}>
        <FlatList
          data={filteredChats}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderChatItem}
          ListEmptyComponent={EmptyState}
          contentContainerStyle={styles.chatListContent}
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
  searchContainer: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  searchBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  clearButton: {
    marginLeft: 8,
  },
  chatList: {
    flex: 1,
    paddingTop: 160,
  },
  chatListContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  chatItemContainer: {
    marginBottom: 12,
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
    marginBottom: 24,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  startChatButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  startChatGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 8,
  },
  startChatText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});
