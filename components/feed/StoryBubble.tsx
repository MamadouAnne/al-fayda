import { View, Text, Image, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState, useRef } from 'react';

interface Story {
  id: number;
  name: string;
  username: string;
  avatar: string;
  hasStory: boolean;
  storyPreview?: string;
  viewCount?: number;
  verified?: boolean;
}

interface StoryBubbleProps {
  story: Story;
}

export default function StoryBubble({ story }: StoryBubbleProps) {
  const [pressed, setPressed] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const router = useRouter();

  const handlePressIn = () => {
    setPressed(true);
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    setPressed(false);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handleStoryPress = () => {
    // Navigate to user profile when story is tapped
    router.push(`/user/${story.id}`);
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity 
        style={styles.container}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handleStoryPress}
        activeOpacity={0.9}
      >
        <View style={styles.storyContainer}>
          <LinearGradient
            colors={['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7']}
            start={{ x: 0.0, y: 0.0 }}
            end={{ x: 1.0, y: 1.0 }}
            style={styles.gradientBorder}
          >
            <View style={styles.avatarContainer}>
              <Image
                source={{ uri: story.avatar }}
                style={styles.avatar}
              />
            </View>
          </LinearGradient>
          
          {/* Online indicator */}
          <View style={styles.onlineIndicator} />
          
          {/* View count for stories */}
          {story.viewCount && (
            <View style={styles.viewCountBadge}>
              <Text style={styles.viewCountText}>
                {story.viewCount > 999 ? '999+' : story.viewCount}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.textContainer}>
          <View style={styles.nameRow}>
            <Text style={styles.firstName} numberOfLines={1}>
              {story.name.split(' ')[0]}
            </Text>
            {story.verified && (
              <Ionicons name="checkmark-circle" size={12} color="#3B82F6" style={{ marginLeft: 2 }} />
            )}
          </View>
          <Text style={styles.username} numberOfLines={1}>
            {story.username}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginHorizontal: 8,
  },
  storyContainer: {
    position: 'relative',
  },
  gradientBorder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 34,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    backgroundColor: '#10B981',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  viewCountBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#8b5cf6',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  viewCountText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  textContainer: {
    marginTop: 8,
    alignItems: 'center',
    maxWidth: 75,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  firstName: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
  },
  username: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
});