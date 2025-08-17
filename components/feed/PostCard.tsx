import { View, Text, Image, TouchableOpacity, ScrollView, Dimensions, Animated, StyleSheet, PanResponder } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useState, useRef, useEffect, memo, useCallback, useMemo } from 'react';
import { Video, ResizeMode, AVPlaybackStatus, Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// Global video manager to ensure only one video plays at a time
let currentlyPlayingVideo: { postId: string; stopVideo: () => void } | null = null;

const setGlobalPlayingVideo = (postId: string, stopVideoFn: () => void) => {
  // Stop any currently playing video
  if (currentlyPlayingVideo && currentlyPlayingVideo.postId !== postId) {
    console.log(`📹 Stopping previously playing video: ${currentlyPlayingVideo.postId}`);
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
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  
  const videoRefs = useRef<{ [key: number]: Video | null }>({});
  const likeAnimation = useRef(new Animated.Value(1)).current;
  const router = useRouter();

  useEffect(() => {
    const configureAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: false,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: false,
          playThroughEarpieceAndroid: false,
        });
      } catch (error) {
        console.error('❌ Error configuring audio session:', error);
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
      console.log(`📱 Post ${post.id} marked as having been visible`);
    }
    console.log(`📱 Post ${post.id} visibility changed: ${isVisible}`);
  }, [isVisible, post.id]);

  // Stop videos when screen loses focus (navigating away)
  useFocusEffect(
    useCallback(() => {
      return () => {
        // Screen is losing focus - stop any playing video
        if (isVideoPlaying) {
          console.log(`📹 Screen lost focus - stopping video for post ${post.id}`);
          clearGlobalPlayingVideo(String(post.id));
          setIsVideoPlaying(false);
          
          // Force pause all videos in this post
          Object.values(videoRefs.current).forEach(video => {
            if (video) {
              video.pauseAsync().catch(error => 
                console.log('Video pause error on screen unfocus:', error)
              );
            }
          });
        }
      };
    }, [isVideoPlaying, post.id])
  );
  
  // Effect to handle stopping videos when post becomes invisible (scroll away)
  useEffect(() => {
    const wasVisible = prevVisibleRef.current;
    const isNowVisible = isVisible;
    
    console.log(`📹 Post ${post.id} visibility effect: wasVisible=${wasVisible}, isNowVisible=${isNowVisible}, isVideoPlaying=${isVideoPlaying}, hasBeenVisible=${hasBeenVisibleRef.current}`);
    
    // Stop video if:
    // 1. Video is currently playing
    // 2. Post is now not visible (strict visibility check, no fallbacks)
    // 3. Post has been visible at least once (to avoid stopping on mount)
    if (isVideoPlaying && !isNowVisible && hasBeenVisibleRef.current) {
      console.log(`📹 Post ${post.id} stopping video - scrolled away (was: ${wasVisible}, now: ${isNowVisible})`);
      clearGlobalPlayingVideo(String(post.id));
      setIsVideoPlaying(false);
      
      // Force pause all videos in this post
      Object.values(videoRefs.current).forEach(video => {
        if (video) {
          video.pauseAsync().catch(error => 
            console.log('Video pause error on scroll away:', error)
          );
        }
      });
    }
    
    // Update previous visibility
    prevVisibleRef.current = isNowVisible;
  }, [isVisible, isVideoPlaying, post.id]);

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

  const handleSave = () => setIsSaved(!isSaved);
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
    const currentVideo = videoRefs.current[currentImageIndex];
    if (currentVideo) {
      currentVideo.pauseAsync().catch(error => {
        console.log('Error pausing video:', error);
      });
    }
  }, [currentImageIndex]);

  const handlePlayVideo = useCallback(() => {
    console.log(`📹 Play button clicked for post ${post.id}, isVisible: ${isVisible}, hasBeenVisible: ${hasBeenVisibleRef.current}`);
    
    // Allow video to start if post is visible OR if it's one of the first few posts and hasn't been marked visible yet
    // This handles the case where FlatList hasn't properly detected visibility yet
    const canPlay = isVisible || (index !== undefined && index <= 2 && !hasBeenVisibleRef.current);
    
    if (!canPlay) {
      console.log(`📹 Cannot start video for post ${post.id} - not visible and not in initial view`);
      return;
    }
    
    // Register this video as the globally playing one (this will stop any other playing video)
    setGlobalPlayingVideo(String(post.id), stopThisVideo);
    
    setIsVideoPlaying(true);
    console.log(`📹 Video set to play for post ${post.id} (isVisible: ${isVisible}, index: ${index})`);
  }, [post.id, stopThisVideo, isVisible, index]);

  const handlePauseVideo = useCallback(() => {
    console.log(`📹 Pause button clicked for post ${post.id}`);
    
    // Clear this video from global playing state
    clearGlobalPlayingVideo(String(post.id));
    
    setIsVideoPlaying(false);
    console.log(`📹 Pausing video playback for post ${post.id}`);
    
    // Force pause the current video
    const currentVideo = videoRefs.current[currentImageIndex];
    if (currentVideo) {
      console.log(`📹 Force pausing video for post ${post.id}, imgIndex: ${currentImageIndex}`);
      currentVideo.pauseAsync().catch(error => {
        console.error(`📹 Error pausing video:`, error);
      });
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
    const result = isVideoPlaying && currentImageIndex === 0 && isEffectivelyVisible;
    console.log(`📹 Video ${post.id} shouldPlay calculation: isVideoPlaying=${isVideoPlaying}, currentImageIndex=${currentImageIndex}, isVisible=${isVisible}, isEffectivelyVisible=${isEffectivelyVisible}, result=${result}`);
    return result;
  }, [isVideoPlaying, currentImageIndex, isVisible, index, post.id]);

  const renderMedia = useCallback((mediaUrl: string, imgIndex: number) => {
    const isVideo = isVideoUrl(mediaUrl);
    // Use the memoized value for this specific image
    const shouldPlayVideo = imgIndex === currentImageIndex ? shouldPlayVideoForCurrentImage : false;
    
    // Debug log when video should play
    if (isVideo && imgIndex === currentImageIndex) {
      console.log(`📹 Video ${post.id} renderMedia: imgIndex=${imgIndex}, currentImageIndex=${currentImageIndex}, shouldPlayVideo=${shouldPlayVideo}, memoized=${shouldPlayVideoForCurrentImage}`);
    }

    if (isVideo) {
      return (
        <View key={`media-${imgIndex}`} style={styles.videoContainer}>
          <Video
            ref={ref => {
              videoRefs.current[imgIndex] = ref;
              console.log(`📹 Video ref set for post ${post.id}, imgIndex: ${imgIndex}, shouldPlay: ${shouldPlayVideo}`);
            }}
            source={{ uri: mediaUrl }}
            style={styles.postImage}
            resizeMode={ResizeMode.COVER}
            shouldPlay={shouldPlayVideo}
            isLooping
            isMuted={false}
            onError={e => console.error(`❌ Video error:`, e)}
            onLoad={() => console.log(`📹 Video loaded for post ${post.id}, image ${imgIndex}, shouldPlay: ${shouldPlayVideo}`)}
            onPlaybackStatusUpdate={(status: AVPlaybackStatus) => {
              // Reduced logging to prevent spam
              if (status.isLoaded && status.isPlaying !== shouldPlayVideo) {
                console.log(`📹 Video status mismatch for post ${post.id}: isPlaying=${status.isPlaying}, shouldPlay=${shouldPlayVideo}`);
              }
            }}
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
      return (
        <TouchableOpacity key={`media-${imgIndex}`} onPress={handlePostPress}>
          <Image
            source={{ uri: mediaUrl }}
            style={styles.postImage}
            onError={() => console.error('❌ Image failed to load:', mediaUrl)}
          />
        </TouchableOpacity>
      );
    }
  }, [currentImageIndex, shouldPlayVideoForCurrentImage, post.id, handlePostPress, togglePlayPause, isVideoPlaying]);

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
            scrollEventThrottle={16}
          >
            {post.images.map(renderMedia)}
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
                <Ionicons name={isLiked ? "heart" : "heart-outline"} size={24} color="white" />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
          <TouchableOpacity onPress={handlePostPress} style={styles.actionButton}>
            <LinearGradient
              colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
              style={styles.actionButtonGradient}
            >
              <Ionicons name="chatbubble-outline" size={22} color="white" />
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <LinearGradient
              colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
              style={styles.actionButtonGradient}
            >
              <Ionicons name="paper-plane-outline" size={22} color="white" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          <LinearGradient
            colors={isSaved ? ['#3B82F6', '#2563EB'] : ['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
            style={styles.saveButtonGradient}
          >
            <Ionicons name={isSaved ? "bookmark" : "bookmark-outline"} size={22} color="white" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Stats & Caption */}
      <View style={styles.captionSection}>
        <Text style={styles.likesText}>{`${likesCount.toLocaleString()} likes`}</Text>
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
  },
  imageScrollView: {},
  postImage: {
    width: width,
    height: width,
    borderRadius: 0,
    marginHorizontal: 0,
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
    marginRight: 20,
  },
  actionButtonGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsRow: {
    paddingHorizontal: 16,
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
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noImageText: {
    color: 'rgba(255,255,255,0.7)',
  },
  videoContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
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
});

export default memo(PostCard);