import { View, Text, Image, TouchableOpacity, ScrollView, Dimensions, Animated, StyleSheet, PanResponder } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useState, useRef, useEffect, memo, useCallback, useMemo } from 'react';
import { VideoView, useVideoPlayer } from 'expo-video';
import { setAudioModeAsync } from 'expo-audio';
import { LinearGradient } from 'expo-linear-gradient';

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
  timestamp: string;
  location?: string;
  tags?: string[];
  comments?: any[];
}

interface PostCardProps {
  post: Post;
  index?: number;
  isVisible?: boolean;
}

function PostCard({ post, index = 0, isVisible = true }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes);
  const [savesCount, setSavesCount] = useState(post.saves || 0);
  const [viewsCount] = useState(Math.floor(Math.random() * 5000) + 100); // Mock views
  const [commentsCount] = useState(post.comments?.length || 0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  
  
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

  // Temporarily disable image switching effect to test video playback
  // Effect to reset video playing state when switching images
  // useEffect(() => {
  //   if (isVideoPlaying) {
  //     clearGlobalPlayingVideo(String(post.id));
  //     setIsVideoPlaying(false);
  //   }
  // }, [currentImageIndex, isVideoPlaying, post.id]);

  const handleLike = () => {
    Animated.sequence([
      Animated.timing(likeAnimation, { toValue: 1.3, duration: 100, useNativeDriver: true }),
      Animated.timing(likeAnimation, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
    setSavesCount(prev => isSaved ? prev - 1 : prev + 1);
  };
  const handleUserPress = () => router.push(`/(tabs)/profile?userId=${post.user.id}`);
  const handlePostPress = () => router.push(`/post/${post.id}`);

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
          <TouchableOpacity key={`media-${imgIndex}`} onPress={handlePostPress}>
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
  }, [currentImageIndex, shouldPlayVideoForCurrentImage, post.id, handlePostPress, togglePlayPause, isVideoPlaying, getPlayerForVideo]);

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
            <TouchableOpacity onPress={handleLike} style={styles.actionButton}>
              <LinearGradient
                colors={isLiked ? ['#EF4444', '#DC2626'] : ['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                style={styles.actionButtonGradient}
              >
                <Ionicons name={isLiked ? "heart" : "heart-outline"} size={18} color="white" />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
          <TouchableOpacity onPress={handlePostPress} style={styles.actionButton}>
            <LinearGradient
              colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
              style={styles.actionButtonGradient}
            >
              <Ionicons name="chatbubble-outline" size={18} color="white" />
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <LinearGradient
              colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
              style={styles.actionButtonGradient}
            >
              <Ionicons name="paper-plane-outline" size={18} color="white" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          <LinearGradient
            colors={isSaved ? ['#3B82F6', '#2563EB'] : ['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
            style={styles.saveButtonGradient}
          >
            <Ionicons name={isSaved ? "bookmark" : "bookmark-outline"} size={18} color="white" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsSection}>
        <View style={styles.statsIconRow}>
          <View style={styles.statItem}>
            <Ionicons name="heart" size={16} color="#FF6B6B" />
            <Text style={styles.statNumber}>{likesCount.toLocaleString()}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="chatbubble" size={16} color="rgba(255,255,255,0.8)" />
            <Text style={styles.statNumber}>{commentsCount}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="eye" size={16} color="rgba(255,255,255,0.8)" />
            <Text style={styles.statNumber}>{viewsCount.toLocaleString()}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="paper-plane" size={16} color="rgba(255,255,255,0.8)" />
            <Text style={styles.statNumber}>{post.shares?.toLocaleString() || 0}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="bookmark" size={16} color="rgba(255,255,255,0.8)" />
            <Text style={styles.statNumber}>{savesCount.toLocaleString()}</Text>
          </View>
        </View>
      </View>

      {/* Caption */}
      <View style={styles.captionSection}>
        <Text style={styles.captionText} numberOfLines={2}>
          <Text style={styles.authorName} onPress={handleUserPress}>
            {post.user.username}
          </Text>
          <Text> {post.caption}</Text>
        </Text>
        {post.comments && post.comments.length > 0 && (
          <TouchableOpacity onPress={handlePostPress}>
            <Text style={styles.viewCommentsText}>{`View all ${post.comments.length} comments`}</Text>
          </TouchableOpacity>
        )}
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
  actionButtonGradient: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
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
  statsIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statNumber: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  likesText: {
    fontWeight: '600',
    color: 'white',
    fontSize: 14,
  },
  captionSection: {
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  captionText: {
    color: 'white',
    fontSize: 15,
    lineHeight: 20,
    marginTop: 8,
  },
  authorName: {
    fontWeight: '600',
    color: 'white',
  },
  viewCommentsText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginTop: 4,
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