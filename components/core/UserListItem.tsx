import { View, Text, Image, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { usersApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface User {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  followers_count?: number;
  following_count?: number;
  hasStory?: boolean;
}

interface UserListItemProps {
  user: User;
  onPress: () => void;
  showFollowButton?: boolean;
  isFollowing?: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
  onAvatarPress?: () => void;
}

export default function UserListItem({ 
  user, 
  onPress, 
  showFollowButton = false, 
  isFollowing = false,
  onFollowChange,
  onAvatarPress 
}: UserListItemProps) {
  const { profile: currentUser } = useAuth();
  const [followLoading, setFollowLoading] = useState(false);
  const [localIsFollowing, setLocalIsFollowing] = useState(isFollowing);
  
  // Simulate story for some users (for visual ring display only)
  const hasStory = user.hasStory || (parseInt(user.id, 36) % 3 === 0);

  // Update local state when prop changes
  useEffect(() => {
    setLocalIsFollowing(isFollowing);
  }, [isFollowing]);

  const handleFollow = async (e: any) => {
    e.stopPropagation();
    
    if (!currentUser || followLoading || currentUser.id === user.id) return;
    
    try {
      setFollowLoading(true);
      const result = await usersApi.toggleFollow(user.id);
      setLocalIsFollowing(result.following);
      onFollowChange?.(result.following);
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleAvatarPress = (e: any) => {
    e.stopPropagation();
    // Always navigate to user profile when avatar is clicked
    onPress();
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)']}
        style={styles.gradient}
      >
        <BlurView intensity={10} tint="dark" style={styles.blur}>
          <TouchableOpacity onPress={onPress} style={styles.touchable}>
            
            {/* Avatar with enhanced ring */}
            <TouchableOpacity 
              style={styles.avatarContainer}
              onPress={handleAvatarPress}
              activeOpacity={0.8}
            >
              {hasStory ? (
                <LinearGradient
                  colors={['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff']}
                  style={styles.storyRing}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.storyInnerRing}>
                    <LinearGradient
                      colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.9)']}
                      style={styles.storyInnerGradient}
                    >
                      <Image 
                        source={{ uri: user.avatar || `https://i.pravatar.cc/150?u=${user.id}` }} 
                        style={styles.avatarLarge}
                      />
                    </LinearGradient>
                  </View>
                </LinearGradient>
              ) : (
                <LinearGradient
                  colors={['#667eea', '#764ba2', '#f093fb', '#f5576c']}
                  style={styles.avatarRing}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.avatarInnerContainer}>
                    <Image 
                      source={{ uri: user.avatar || `https://i.pravatar.cc/150?u=${user.id}` }} 
                      style={styles.avatarLarge}
                    />
                  </View>
                </LinearGradient>
              )}
            </TouchableOpacity>
            
            {/* User Info */}
            <View style={styles.userInfo}>
              <Text style={styles.name}>{user.name}</Text>
              <Text style={styles.username}>@{user.username}</Text>
              {user.followers_count !== undefined && (
                <Text style={styles.followersText}>
                  {user.followers_count.toLocaleString()} followers
                </Text>
              )}
            </View>
            
            {/* Follow Button */}
            {showFollowButton && currentUser && currentUser.id !== user.id && (
              <TouchableOpacity
                onPress={handleFollow}
                disabled={followLoading}
                style={[
                  styles.followButton,
                  localIsFollowing && styles.followingButton,
                  followLoading && styles.followButtonDisabled
                ]}
              >
                {localIsFollowing ? (
                  <LinearGradient
                    colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                    style={styles.followButtonGradient}
                  >
                    {followLoading ? (
                      <ActivityIndicator size="small" color="rgba(255,255,255,0.8)" />
                    ) : (
                      <View style={styles.followButtonContent}>
                        <Ionicons name="checkmark" size={16} color="rgba(255,255,255,0.8)" />
                        <Text style={styles.followingText}>Following</Text>
                      </View>
                    )}
                  </LinearGradient>
                ) : (
                  <LinearGradient
                    colors={['#10B981', '#059669']}
                    style={styles.followButtonGradient}
                  >
                    {followLoading ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <View style={styles.followButtonContent}>
                        <Ionicons name="person-add" size={16} color="white" />
                        <Text style={styles.followText}>Follow</Text>
                      </View>
                    )}
                  </LinearGradient>
                )}
              </TouchableOpacity>
            )}
            
          </TouchableOpacity>
        </BlurView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  gradient: {
    borderRadius: 20,
  },
  blur: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  touchable: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    paddingVertical: 20,
  },
  avatarContainer: {
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  avatarRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(102, 126, 234, 0.6)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 10,
  },
  avatarInnerContainer: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    padding: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(255, 107, 107, 0.6)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 15,
  },
  storyInnerRing: {
    width: 75,
    height: 75,
    borderRadius: 37.5,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyInnerGradient: {
    width: 71,
    height: 71,
    borderRadius: 35.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLarge: {
    width: 67,
    height: 67,
    borderRadius: 33.5,
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  username: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  followersText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: '500',
  },
  followButton: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  followingButton: {
    // Additional styles for following state
  },
  followButtonDisabled: {
    opacity: 0.6,
  },
  followButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    minWidth: 100,
  },
  followButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  followText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  followingText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '600',
  },
});
