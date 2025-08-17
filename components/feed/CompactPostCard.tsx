import { View, Text, Image, TouchableOpacity, Dimensions, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useState, useRef, useCallback, useMemo, memo, useEffect } from 'react';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// Global video manager to ensure only one compact video plays at a time
let currentlyPlayingCompactVideo: { postId: string; stopVideo: () => void } | null = null;

const setGlobalPlayingCompactVideo = (postId: string, stopVideoFn: () => void) => {
  // Stop any currently playing video
  if (currentlyPlayingCompactVideo && currentlyPlayingCompactVideo.postId !== postId) {
    console.log(`📹 Stopping previously playing compact video: ${currentlyPlayingCompactVideo.postId}`);
    currentlyPlayingCompactVideo.stopVideo();
  }
  console.log(`📹 Setting global playing compact video: ${postId}`);
  currentlyPlayingCompactVideo = { postId, stopVideo: stopVideoFn };
};

const clearGlobalPlayingCompactVideo = (postId: string) => {
  if (currentlyPlayingCompactVideo && currentlyPlayingCompactVideo.postId === postId) {
    console.log(`📹 Clearing global playing compact video: ${postId}`);
    currentlyPlayingCompactVideo = null;
  }
};

// Helper function to check if URL is a video
const isVideoUrl = (url: string): boolean => {
  const videoExtensions = ['.mp4', '.mov', '.avi', '.webm', '.mkv'];
  const lowerUrl = url.toLowerCase();
  return videoExtensions.some(ext => lowerUrl.includes(ext)) || lowerUrl.includes('video_');
};

interface Post {
  id: number;
  user: {
    id: number;
    name: string;
    username: string;
    avatar: string | null;
    verified?: boolean;
    location?: string;
  };
  images: string[];
  caption: string;
  likes: number;
  shares?: number;
  saves?: number;
  views?: number;
  timestamp: string;
  location?: string;
  tags?: string[];
  comments?: any[];
}

interface CompactPostCardProps {
  post: Post;
  index?: number;
  isVisible?: boolean;
  onPress?: () => void;
}

function CompactPostCard({ post, index = 0, isVisible = true, onPress }: CompactPostCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isScreenFocused, setIsScreenFocused] = useState(true);
  const [sharesCount, setSharesCount] = useState(post.shares || 0);
  
  const videoRef = useRef<Video>(null);
  const likeAnimation = useRef(new Animated.Value(1)).current;
  const router = useRouter();

  // Handle screen focus/blur to pause videos when navigating away
  useFocusEffect(
    useCallback(() => {
      setIsScreenFocused(true);
      return () => {
        setIsScreenFocused(false);
        // Stop video when screen loses focus
        if (isVideoPlaying && videoRef.current) {
          console.log(`📹 Screen lost focus - stopping video for post ${post.id}`);
          clearGlobalPlayingCompactVideo(String(post.id));
          videoRef.current.pauseAsync().catch(error => 
            console.log('Video pause error on screen unfocus:', error)
          );
          setIsVideoPlaying(false);
        }
      };
    }, [isVideoPlaying, post.id])
  );

  // Stop video when component becomes invisible (disabled for grid layout)
  useEffect(() => {
    // Disable auto-stopping for grid layout - let users manually control videos
    // Only auto-stop for feed-style layouts where visibility tracking is meaningful
    const shouldAutoStop = false; // Disabled for compact cards
    
    if (!isVisible && isVideoPlaying && videoRef.current && shouldAutoStop) {
      console.log(`📹 Post ${post.id} became invisible - stopping video`);
      clearGlobalPlayingCompactVideo(String(post.id));
      videoRef.current.pauseAsync().catch(error => 
        console.log('Video pause error on visibility change:', error)
      );
      setIsVideoPlaying(false);
    }
  }, [isVisible, isVideoPlaying, post.id]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isVideoPlaying) {
        console.log(`📹 Component unmounting - clearing global video for post ${post.id}`);
        clearGlobalPlayingCompactVideo(String(post.id));
      }
    };
  }, [isVideoPlaying, post.id]);

  const handleLike = useCallback(() => {
    Animated.sequence([
      Animated.timing(likeAnimation, { toValue: 1.2, duration: 100, useNativeDriver: true }),
      Animated.timing(likeAnimation, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
  }, [isLiked, likeAnimation]);

  const handleUserPress = useCallback(() => {
    router.push(`/(tabs)/profile?userId=${post.user.id}`);
  }, [post.user.id, router]);

  const handlePostPress = useCallback(() => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/post/${post.id}`);
    }
  }, [onPress, post.id, router]);

  const handleShare = useCallback(() => {
    // Increment share count optimistically
    setSharesCount(prev => prev + 1);
    
    // Here you would implement actual sharing logic
    console.log(`📤 Sharing post ${post.id}`);
    
    // Example share functionality (you can customize this)
    // Share.share({
    //   message: `Check out this post: ${post.caption}`,
    //   url: `https://yourapp.com/post/${post.id}`,
    // });
  }, [post.id]);

  const stopThisVideo = useCallback(() => {
    console.log(`📹 stopThisVideo called for post ${post.id}`);
    setIsVideoPlaying(false);
    if (videoRef.current) {
      videoRef.current.pauseAsync().catch(error => {
        console.log('Error pausing video:', error);
      });
    }
  }, [post.id]);

  const toggleVideoPlayback = useCallback(() => {
    // For compact cards, only require screen focus - not strict visibility
    // This allows users to play any video that's visible on screen
    if (!isScreenFocused) {
      console.log(`📹 Cannot toggle video for post ${post.id} - screen not focused`);
      return;
    }

    if (videoRef.current) {
      if (isVideoPlaying) {
        console.log(`📹 Pausing video for post ${post.id}`);
        clearGlobalPlayingCompactVideo(String(post.id));
        videoRef.current.pauseAsync().catch(error => 
          console.log('Video pause error:', error)
        );
        setIsVideoPlaying(false);
      } else {
        console.log(`📹 Starting to play video for post ${post.id}`);
        // Register this video as the globally playing one (this will stop any other playing video)
        setGlobalPlayingCompactVideo(String(post.id), stopThisVideo);
        videoRef.current.playAsync().then(() => {
          console.log(`📹 Video play started successfully for post ${post.id}`);
          setIsVideoPlaying(true);
        }).catch(error => {
          console.log('Video play error:', error);
          setIsVideoPlaying(false);
        });
      }
    } else {
      console.log(`📹 Video ref is null for post ${post.id}`);
    }
  }, [isVideoPlaying, isScreenFocused, post.id, stopThisVideo]);

  const renderMedia = useMemo(() => {
    console.log(`📸 Rendering media for post ${post.id}, images:`, post.images);
    
    if (!post.images || post.images.length === 0) {
      console.log(`📸 No images for post ${post.id}`);
      return (
        <View style={styles.noImageContainer}>
          <Ionicons name="image-outline" size={40} color="rgba(255,255,255,0.3)" />
          <Text style={styles.noImageText}>No Image</Text>
        </View>
      );
    }

    const mediaUrl = post.images[0];
    console.log(`📸 Media URL for post ${post.id}:`, mediaUrl);
    const isVideo = isVideoUrl(mediaUrl);

    if (isVideo) {
      return (
        <View style={styles.mediaContainer}>
          <Video
            ref={videoRef}
            source={{ uri: mediaUrl }}
            style={styles.media}
            resizeMode={ResizeMode.COVER}
            shouldPlay={isVideoPlaying && isScreenFocused}
            isLooping
            isMuted={false}
            onError={e => console.error(`📹 Video error for post ${post.id}:`, e)}
            onPlaybackStatusUpdate={(status: AVPlaybackStatus) => {
              if (status.isLoaded) {
                const shouldPlay = isVideoPlaying && isScreenFocused;
                if (status.isPlaying !== shouldPlay) {
                  console.log(`📹 Video ${post.id} status mismatch: isPlaying=${status.isPlaying}, shouldPlay=${shouldPlay}`);
                }
              }
            }}
          />
          <TouchableOpacity
            style={styles.videoOverlay}
            onPress={toggleVideoPlayback}
            activeOpacity={1}
          >
            {!isVideoPlaying && (
              <View style={styles.playButton}>
                <Ionicons name="play" size={20} color="white" />
              </View>
            )}
          </TouchableOpacity>
          <View style={styles.videoIndicator}>
            <Ionicons name="videocam" size={12} color="white" />
          </View>
        </View>
      );
    }

    return (
      <TouchableOpacity onPress={handlePostPress} activeOpacity={0.9}>
        <Image
          source={{ uri: mediaUrl }}
          style={styles.media}
          onError={(error) => console.error(`📸 Image failed to load for post ${post.id}:`, mediaUrl, error)}
          onLoad={() => console.log(`📸 Image loaded successfully for post ${post.id}:`, mediaUrl)}
        />
      </TouchableOpacity>
    );
  }, [post.images, isVisible, isVideoPlaying, isScreenFocused, handlePostPress, toggleVideoPlayback, post.id]);

  return (
    <View style={styles.container}>
      {/* Media */}
      <View style={styles.mediaSection}>
        {renderMedia}
        
        {/* Multiple images indicator */}
        {post.images && post.images.length > 1 && (
          <View style={styles.multipleIcon}>
            <Ionicons name="copy" size={12} color="white" />
          </View>
        )}
        
        {/* Overlay gradient for better text readability */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.6)']}
          style={styles.overlayGradient}
        />
        
        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Animated.View style={{ transform: [{ scale: likeAnimation }] }}>
            <TouchableOpacity onPress={handleLike} style={styles.quickActionButton}>
              <Ionicons 
                name={isLiked ? "heart" : "heart-outline"} 
                size={16} 
                color={isLiked ? "#FF6B6B" : "white"} 
              />
            </TouchableOpacity>
          </Animated.View>
          
          <TouchableOpacity onPress={handlePostPress} style={styles.quickActionButton}>
            <Ionicons name="chatbubble-outline" size={14} color="white" />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={handleShare} style={styles.quickActionButton}>
            <Ionicons name="share-outline" size={14} color="white" />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Compact Info */}
      <View style={styles.infoSection}>
        {/* User info */}
        <TouchableOpacity onPress={handleUserPress} style={styles.userRow}>
          <View style={styles.avatarContainer}>
            {post.user.avatar ? (
              <Image source={{ uri: post.user.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.defaultAvatar]}>
                <Text style={styles.initialsText}>
                  {(post.user.name || post.user.username || 'U').slice(0, 1).toUpperCase()}
                </Text>
              </View>
            )}
            {post.user.verified && (
              <View style={styles.verifiedIcon}>
                <Ionicons name="checkmark" size={8} color="white" />
              </View>
            )}
          </View>
          <Text style={styles.username} numberOfLines={1}>
            {post.user.username}
          </Text>
        </TouchableOpacity>
        
        {/* Stats - Clickable to view post details */}
        <TouchableOpacity onPress={handlePostPress} style={styles.statsRow} activeOpacity={0.7}>
          <View style={styles.statItem}>
            <Ionicons name="heart" size={12} color="#FF6B6B" />
            <Text style={styles.statText}>{likesCount}</Text>
          </View>
          {post.comments && post.comments.length > 0 && (
            <View style={styles.statItem}>
              <Ionicons name="chatbubble" size={12} color="rgba(255,255,255,0.7)" />
              <Text style={styles.statText}>{post.comments.length}</Text>
            </View>
          )}
          {sharesCount > 0 && (
            <View style={styles.statItem}>
              <Ionicons name="share" size={12} color="rgba(255,255,255,0.7)" />
              <Text style={styles.statText}>{sharesCount}</Text>
            </View>
          )}
          {post.views && post.views > 0 && (
            <View style={styles.statItem}>
              <Ionicons name="eye" size={12} color="rgba(255,255,255,0.7)" />
              <Text style={styles.statText}>{post.views}</Text>
            </View>
          )}
        </TouchableOpacity>
        
        {/* Caption preview - Clickable to view post details */}
        {post.caption && (
          <TouchableOpacity onPress={handlePostPress} activeOpacity={0.7}>
            <Text style={styles.captionPreview} numberOfLines={2}>
              {post.caption}
            </Text>
          </TouchableOpacity>
        )}
        
      </View>
    </View>
  );
}

// Responsive card sizing based on screen width - WITH SMALL GAPS
const getCardDimensions = () => {
  const gap = 1; // Small gap between cards
  
  if (width < 350) {
    // Small phones: 2 columns
    return {
      cardWidth: (width - gap) / 2,
      columns: 2
    };
  } else if (width > 500) {
    // Tablets/large phones: 3 columns
    return {
      cardWidth: (width - (2 * gap)) / 3,
      columns: 3
    };
  } else {
    // Standard phones: 2 columns
    return {
      cardWidth: (width - gap) / 2,
      columns: 2
    };
  }
};

const { cardWidth } = getCardDimensions();
const cardHeight = cardWidth * 1.2; // Reduced aspect ratio for shorter cards

const styles = StyleSheet.create({
  container: {
    width: cardWidth,
    height: cardHeight,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  mediaSection: {
    flex: 1,
    position: 'relative',
  },
  mediaContainer: {
    flex: 1,
    position: 'relative',
  },
  media: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  noImageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  noImageText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 8,
  },
  multipleIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 8,
    padding: 4,
  },
  videoIndicator: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 8,
    padding: 4,
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  quickActions: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'column',
    gap: 6,
  },
  quickActionButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoSection: {
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.4)',
    minHeight: 80,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 6,
  },
  avatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  defaultAvatar: {
    backgroundColor: '#667eea',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  verifiedIcon: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4ECDC4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  username: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    fontWeight: '500',
  },
  captionPreview: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 10,
    lineHeight: 14,
  },
});

export default memo(CompactPostCard);