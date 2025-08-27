import { View, Text, Image, TouchableOpacity, ScrollView, Dimensions, Animated, StyleSheet, PanResponder, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useState, useRef, useEffect, memo, useCallback, useMemo } from 'react';
import { VideoView, useVideoPlayer } from 'expo-video';
import { setAudioModeAsync } from 'expo-audio';
import { LinearGradient } from 'expo-linear-gradient';
import { postsApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { usePostInteractions } from '@/contexts/PostInteractionContext';
import { isVideoUrl } from '@/lib/utils/media';

const { width } = Dimensions.get('window');

// Global video manager to ensure only one video plays at a time
let currentlyPlayingVideo: { postId: string; stopVideo: () => void } | null = null;

const setGlobalPlayingVideo = (postId: string, stopVideoFn: () => void) => {
  // Stop any currently playing video
  if (currentlyPlayingVideo && currentlyPlayingVideo.postId !== postId) {
    currentlyPlayingVideo.stopVideo();
  }
  currentlyPlayingVideo = { postId, stopVideo: stopVideoFn };
};

const clearGlobalPlayingVideo = (postId: string) => {
  if (currentlyPlayingVideo && currentlyPlayingVideo.postId === postId) {
    currentlyPlayingVideo = null;
  }
};

interface Post {
  id: string;
  user_id: string;
  user: {
    id: string;
    name: string;
    username: string;
    avatar: string | null;
    verified?: boolean;
    location?: string;
  };
  content: string;
  images: string[];
  likes_count: number;
  comments_count: number;
  shares_count: number;
  saves_count: number;
  views_count: number;
  location?: string;
  tags?: string[];
  comments?: any[];
  created_at: string;
  updated_at: string;
  likes?: Array<{ user_id: string }>;
  saves?: Array<{ user_id: string }>;
}

interface PostCardProps {
  post: Post;
  index?: number;
  isVisible?: boolean;
}

function PostCard({ post, index = 0, isVisible = true }: PostCardProps) {
  const { profile } = useAuth();
  const { 
    likedPosts, 
    savedPosts, 
    postsLikesCount, 
    toggleLike, 
    toggleSave 
  } = usePostInteractions();
  
  const isLiked = likedPosts[post.id] ?? false;
  const isSaved = savedPosts[post.id] ?? false;
  const likesCount = postsLikesCount[post.id] ?? post.likes_count ?? 0;
  const savesCount = post.saves_count || 0;
  const [commentsCount, setCommentsCount] = useState(Array.isArray(post.comments) ? post.comments.length : post.comments_count || 0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [viewsCount, setViewsCount] = useState(post.views_count || 0);
  
  // Create video players for all videos in the post
  const videoUrls = useMemo(() => {
    return post.images.filter(url => isVideoUrl(url));
  }, [post.images]);
  
  // Create a player for the first video (most common case - single video posts)
  const mainPlayer = useVideoPlayer(videoUrls[0] || '', player => {
    player.loop = true;
    player.muted = false;
  });
  
  // For multiple videos, we'll use the main player for the first video
  // and fall back to a simpler approach for additional videos
  const getPlayerForVideo = useCallback((videoUrl: string) => {
    if (videoUrl === videoUrls[0]) {
      return mainPlayer;
    }
    // For additional videos, return null and render as image
    // This is a limitation of the current expo-video hook approach
    return null;
  }, [videoUrls, mainPlayer]);
  const likeAnimation = useRef(new Animated.Value(1)).current;
  const router = useRouter();

  useEffect(() => {
    const configureAudio = async () => {
      try {
        await setAudioModeAsync({
          allowsRecording: false,
          playsInSilentMode: true,
        });
      } catch (error) {
        // Audio configuration error - fail silently
      }
    };
    configureAudio();
  }, []);

  // Track previous visibility to avoid stopping videos immediately on mount
  const prevVisibleRef = useRef(isVisible);
  const hasBeenVisibleRef = useRef(false);
  
  // Track if this post has ever been visible
  useEffect(() => {
    if (isVisible) {
      hasBeenVisibleRef.current = true;
    }
  }, [isVisible, post.id]);

  // Update views when post becomes visible
  useEffect(() => {
    if (isVisible && profile) {
      const updateViewCount = async () => {
        try {
          await postsApi.incrementViewCount(post.id);
          setViewsCount(prev => prev + 1);
        } catch (error) {
          console.error('Error updating view count:', error);
        }
      };
      
      updateViewCount();
    }
  }, [isVisible, post.id, profile?.id]);

  // Stop videos when screen loses focus (navigating away)
  useFocusEffect(
    useCallback(() => {
      return () => {
        // Screen is losing focus - stop any playing video
        if (isVideoPlaying) {
          clearGlobalPlayingVideo(String(post.id));
          setIsVideoPlaying(false);
          
          // Force pause video in this post
          if (mainPlayer) {
            mainPlayer.pause();
          }
        }
      };
    }, [isVideoPlaying, post.id, mainPlayer])
  );
  
  // Effect to handle stopping videos when post becomes invisible (scroll away)
  useEffect(() => {
    const isNowVisible = isVisible;
    
    // Stop video if:
    // 1. Video is currently playing
    // 2. Post is now not visible (strict visibility check, no fallbacks)
    // 3. Post has been visible at least once (to avoid stopping on mount)
    if (isVideoPlaying && !isNowVisible && hasBeenVisibleRef.current) {
      clearGlobalPlayingVideo(String(post.id));
      setIsVideoPlaying(false);
      
      // Force pause video in this post
      if (mainPlayer) {
        mainPlayer.pause();
      }
    }
    
    // Update previous visibility
    prevVisibleRef.current = isNowVisible;
  }, [isVisible, isVideoPlaying, mainPlayer, post.id]);

  const handleLike = useCallback(async () => {
    if (!profile) {
      router.push('/sign-in');
      return;
    }
    
    try {
      await toggleLike(post.id, isLiked);
      
      // Animation
      Animated.sequence([
        Animated.timing(likeAnimation, {
          toValue: 1.3,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(likeAnimation, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  }, [isLiked, post.id, likeAnimation, profile, toggleLike]);

  const handleSavePress = async () => {
    if (!profile) {
      router.push('/sign-in');
      return;
    }
    
    try {
      await toggleSave(post.id, isSaved);
    } catch (error) {
      console.error('Error toggling save:', error);
    }
  };

  const handleUserPress = () => router.push(`/(tabs)/profile?userId=${post.user.id}`);
  const handleCommentPress = useCallback(() => {
    // Navigate to comments screen
    router.push({
      pathname: '/post/[id]',
      params: { 
        id: post.id,
        // Pass initial data to avoid loading flicker
        initialData: JSON.stringify({
          ...post,
          likes_count: likesCount,
          comments_count: commentsCount,
          is_liked: isLiked,
          is_saved: isSaved
        })
      }
    });
  }, [post.id, likesCount, commentsCount, isLiked, isSaved]);
  
  const handleSharePress = useCallback(() => {
    if (!profile) {
      router.push('/sign-in');
      return;
    }
    // In a real app, you would implement sharing functionality here
    Alert.alert('Share', 'Sharing functionality will be implemented here');
  }, [profile, router]);

  const onScroll = (event: any) => {
    const newIndex = Math.round(event.nativeEvent.contentOffset.x / (width - 32));
    if (newIndex !== currentImageIndex) {
      setCurrentImageIndex(newIndex);
    }
  };

  const stopThisVideo = useCallback(() => {
    setIsVideoPlaying(false);
    if (mainPlayer) {
      mainPlayer.pause();
    }
  }, [mainPlayer]);

  const handlePlayVideo = useCallback(() => {
    // Allow video to start if post is visible OR if it's one of the first few posts and hasn't been marked visible yet
    // This handles the case where FlatList hasn't properly detected visibility yet
    const canPlay = isVisible || (index !== undefined && index <= 2 && !hasBeenVisibleRef.current);
    
    if (!canPlay) {
      return;
    }
    
    // Register this video as the globally playing one (this will stop any other playing video)
    setGlobalPlayingVideo(String(post.id), stopThisVideo);
    
    setIsVideoPlaying(true);
  }, [post.id, stopThisVideo, isVisible, index]);

  const handlePauseVideo = useCallback(() => {
    // Clear this video from global playing state
    clearGlobalPlayingVideo(String(post.id));
    
    setIsVideoPlaying(false);
    
    // Force pause the current video
    if (mainPlayer) {
      mainPlayer.pause();
    }
  }, [post.id, currentImageIndex]);

  const togglePlayPause = useCallback(() => {
    if (isVideoPlaying) {
      handlePauseVideo();
    } else {
      handlePlayVideo();
    }
  }, [isVideoPlaying, handlePauseVideo, handlePlayVideo]);

  // Calculate shouldPlayVideo using useMemo to ensure it's stable
  const shouldPlayVideoForCurrentImage = useMemo(() => {
    // Video can play if user wants it to play AND it's the current image
    // Use more permissive visibility check - allow early posts or explicitly visible posts
    const isEffectivelyVisible = isVisible || (index !== undefined && index <= 2 && !hasBeenVisibleRef.current);
    const currentMedia = post.images[currentImageIndex] || '';
    const isCurrentMediaVideo = isVideoUrl(currentMedia);
    const result = isVideoPlaying && isCurrentMediaVideo && isEffectivelyVisible;
    return result;
  }, [isVideoPlaying, currentImageIndex, isVisible, index, post.id, post.images]);

  // Control video player based on shouldPlayVideo
  useEffect(() => {
    if (videoUrls.length > 0 && mainPlayer) {
      const currentImageUrl = post.images[currentImageIndex] || '';
      const currentImageIsVideo = isVideoUrl(currentImageUrl);
      const isMainVideo = currentImageUrl === videoUrls[0];
      const shouldPlay = shouldPlayVideoForCurrentImage && currentImageIsVideo && isMainVideo;
      
      if (shouldPlay) {
        console.log('Playing video:', currentImageUrl);
        mainPlayer.play();
      } else {
        console.log('Pausing video');
        mainPlayer.pause();
      }
    }
  }, [shouldPlayVideoForCurrentImage, currentImageIndex, videoUrls, mainPlayer, post.images]);

  useEffect(() => {
    console.log('PostCard rendered with post:', {
      id: post.id,
      images: post.images,
      hasImages: post.images && post.images.length > 0,
      currentImageIndex,
      isVisible,
      index
    });
  }, [post, currentImageIndex, isVisible, index]);

  const renderMedia = useCallback((mediaUrl: string, imgIndex: number) => {
    const isVideo = isVideoUrl(mediaUrl);
    const isCurrentImage = imgIndex === currentImageIndex;
    
    console.log(`Rendering media ${imgIndex} (${isVideo ? 'video' : 'image'}):`, {
      mediaUrl,
      isCurrentImage,
      isVideoPlaying
    });

    if (!mediaUrl) {
      return (
        <View key={`media-${imgIndex}`} style={styles.noImageContainer}>
          <Ionicons name="image-outline" size={40} color="rgba(255,255,255,0.3)" />
        </View>
      );
    }

    if (isVideo) {
      const videoPlayer = getPlayerForVideo(mediaUrl);
      const shouldShowVideo = isCurrentImage && isVideoPlaying;
      
      // Always render the video player when it's the current image
      if (videoPlayer) {
        return (
          <View key={`media-${imgIndex}`} style={styles.videoContainer}>
            <VideoView
              style={styles.postImage}
              player={videoPlayer}
              allowsFullscreen={false}
              allowsPictureInPicture={false}
              nativeControls={false}
              contentFit="cover"
            />
            <TouchableOpacity
              style={[styles.playOverlay, isVideoPlaying && { backgroundColor: 'transparent' }]}
              onPress={togglePlayPause}
              activeOpacity={1}
            >
              {!isVideoPlaying && (
                <View style={styles.playButton}>
                  <Ionicons name="play" size={40} color="white" />
                </View>
              )}
            </TouchableOpacity>
          </View>
        );
      } else {
        // Fallback to image with video icon
        return (
          <TouchableOpacity key={`media-${imgIndex}`} onPress={handleCommentPress}>
            <Image
              source={{ uri: mediaUrl }}
              style={styles.postImage}
              onError={() => {}}
              resizeMode="cover"
            />
            <View style={styles.videoIndicatorOverlay}>
              <Ionicons name="play-circle" size={50} color="rgba(255,255,255,0.8)" />
            </View>
          </TouchableOpacity>
        );
      }
    } else {
      console.log('Rendering image:', mediaUrl);
      return (
        <View key={`media-${imgIndex}`} style={styles.imageContainer}>
          <Image
            source={{ uri: mediaUrl }}
            style={styles.postImage}
            resizeMode="cover"
            onError={(e) => {
              console.log('Error loading image:', mediaUrl, e.nativeEvent.error);
            }}
            onLoad={() => console.log('Image loaded successfully:', mediaUrl)}
          />
        </View>
      );
    }
  }, [currentImageIndex, shouldPlayVideoForCurrentImage, post.id, handleCommentPress, togglePlayPause, isVideoPlaying, getPlayerForVideo]);

  // Format number to K, M, etc.
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'm';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };
  
  // Simple like count display
  const getLikersPreview = () => {
    if (likesCount === 0) return '';
    return `Liked by ${likesCount} ${likesCount === 1 ? 'person' : 'people'}`;
  };

  // Get shares count safely
  const getSharesCount = (): number => {
    return post.shares_count || 0;
  };

  return (
    <View style={styles.container}>
      {/* Post Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleUserPress} style={styles.userInfo}>
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={['#f093fb', '#f5576c', '#4facfe', '#00f2fe']}
              style={styles.avatarRing}
            >
              {post.user.avatar ? (
                <Image source={{ uri: post.user.avatar }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.defaultAvatar]}>
                  <Text style={styles.initialsText}>
                    {(post.user.name || post.user.username || 'U').slice(0, 2).toUpperCase()}
                  </Text>
                </View>
              )}
            </LinearGradient>
          </View>
          <View style={styles.userDetails}>
            <View style={styles.nameRow}>
              <Text style={styles.userName}>{post.user.name || 'Unknown'}</Text>
              {post.user.verified && (
                <Ionicons name="checkmark-circle" size={16} color="#3B82F6" style={{ marginLeft: 4 }} />
              )}
            </View>
            <Text style={styles.username}>{`@${post.user.username}`}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={16} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Post Media */}
      {post.images && post.images.length > 0 ? (
        <View style={styles.imageSection}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onScroll}
            style={styles.imageScrollView}
            contentContainerStyle={styles.scrollViewContent}
            scrollEventThrottle={16}
            decelerationRate="fast"
          >
            {post.images.map((mediaUrl, imgIndex) => renderMedia(mediaUrl, imgIndex))}
          </ScrollView>
          {post.images.length > 1 && (
            <View style={styles.indicatorContainer}>
              {post.images.map((_, imgIndex) => (
                <View
                  key={imgIndex}
                  style={[
                    styles.indicator,
                    { backgroundColor: imgIndex === currentImageIndex ? '#3B82F6' : '#D1D5DB' },
                  ]}
                />
              ))}
            </View>
          )}
        </View>
      ) : (
        <View style={styles.noImageContainer}>
          <Text style={styles.noImageText}>No media to display</Text>
        </View>
      )}

      {/* Post Actions */}
      <View style={styles.actionsRow}>
        <View style={styles.leftActions}>
          <Animated.View style={{ transform: [{ scale: likeAnimation }] }}>
            <TouchableOpacity onPress={handleLike} style={styles.actionButton} activeOpacity={0.7}>
              <LinearGradient
                colors={isLiked ? ['#EF4444', '#DC2626'] : ['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                style={[styles.actionButtonGradient, isLiked && styles.likedButton]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons 
                  name={isLiked ? "heart" : "heart-outline"} 
                  size={18} 
                  color={isLiked ? "#FF6B6B" : "white"} 
                />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
          
          <View style={styles.actionWithCount}>
            <TouchableOpacity onPress={handleCommentPress} style={styles.actionButton}>
              <LinearGradient
                colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                style={styles.actionButtonGradient}
              >
                <Ionicons name="chatbubble-outline" size={20} color="white" />
              </LinearGradient>
            </TouchableOpacity>
            <Text style={[styles.actionCount, commentsCount === 0 && { opacity: 0.6 }]}>
              {formatNumber(commentsCount)}
            </Text>
          </View>
          
          <TouchableOpacity style={styles.actionButton}>
            <LinearGradient
              colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
              style={styles.actionButtonGradient}
            >
              <Ionicons name="paper-plane-outline" size={20} color="white" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity onPress={handleSavePress} style={styles.saveButton}>
          <LinearGradient
            colors={isSaved ? ['#3B82F6', '#2563EB'] : ['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
            style={styles.saveButtonGradient}
          >
            <Ionicons name={isSaved ? "bookmark" : "bookmark-outline"} size={20} color="white" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsSection}>
        {/* Stats row */}
        <View style={styles.statsIconRow}>
          <View style={styles.statItem}>
            <Ionicons name="heart" size={16} color={isLiked ? "#FF6B6B" : "rgba(255,255,255,0.8)"} />
            <Text style={[styles.statNumber, isLiked && { color: '#FF6B6B' }]}>{likesCount.toLocaleString()}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="chatbubble" size={16} color="rgba(255,255,255,0.8)" />
            <Text style={styles.statNumber}>{commentsCount.toLocaleString()}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="eye" size={16} color="rgba(255,255,255,0.8)" />
            <Text style={styles.statNumber}>{viewsCount.toLocaleString()}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="paper-plane" size={16} color="rgba(255,255,255,0.8)" />
            <Text style={styles.statNumber}>{getSharesCount().toLocaleString()}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="bookmark" size={16} color="rgba(255,255,255,0.8)" />
            <Text style={styles.statNumber}>{savesCount.toLocaleString()}</Text>
          </View>
        </View>
        
        {/* Likes count with text */}
        {likesCount > 0 && (
          <View style={styles.likesRow}>
            <Ionicons name="heart" size={16} color="#FF6B6B" style={styles.likeIcon} />
            <Text style={styles.likesCount}>
              <Text style={styles.boldText}>{post.user.username || 'Someone'}</Text>
              {likesCount > 1 ? ` and ${(likesCount - 1).toLocaleString()} others` : ''} liked this
            </Text>
          </View>
        )}
      </View>

      {/* Caption */}
      <View style={styles.captionSection}>
        <Text style={styles.caption} numberOfLines={2}>
          <Text style={styles.username}>{post.user.username} </Text>
          {post.content}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    marginBottom: 20,
    marginHorizontal: 0,
    overflow: 'hidden',
    zIndex: 1002,
    elevation: 25,
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 15,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarRing: {
    width: 54,
    height: 54,
    borderRadius: 27,
    padding: 3,
    backgroundColor: 'transparent',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  defaultAvatar: {
    backgroundColor: '#667eea',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  userDetails: {
    marginLeft: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontWeight: '600',
    color: 'white',
    fontSize: 16,
  },
  username: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  moreButton: {
    padding: 8,
  },
  imageSection: {
    position: 'relative',
    width: '100%',
    marginVertical: 8,
  },
  imageScrollView: {
    width: '100%',
  },
  scrollViewContent: {
    flexDirection: 'row',
    paddingHorizontal: 0,
  },
  imageContainer: {
    width: width,
    aspectRatio: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  postImage: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
    resizeMode: 'cover',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 10,
    width: '100%',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  actionButton: {
    marginRight: 15,
  },
  actionWithCount: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  actionButtonGradient: {
    padding: 10,
    borderRadius: 50,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  likedButton: {
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
  },
  actionCount: {
    color: 'white',
    fontSize: 13,
    marginLeft: 4,
    fontWeight: '600',
  },
  saveButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsSection: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  likesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  likeIcon: {
    marginRight: 6,
  },
  statsIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    paddingHorizontal: 4,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statNumber: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    fontWeight: '500',
  },
  likesCount: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  captionSection: {
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  caption: {
    color: 'white',
    fontSize: 14,
    lineHeight: 18,
    marginTop: 8,
    marginBottom: 4,
  },
  boldText: {
    fontWeight: 'bold',
  },
  noImageContainer: {
    width: '100%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
  },
  noImageText: {
    color: 'rgba(255,255,255,0.7)',
  },
  videoContainer: {
    position: 'relative',
    width: width,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    overflow: 'hidden',
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  videoIndicatorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
});

export default memo(PostCard);