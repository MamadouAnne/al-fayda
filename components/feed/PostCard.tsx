import { View, Text, Image, TouchableOpacity, ScrollView, Dimensions, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import { Video, ResizeMode, AVPlaybackStatus, Audio } from 'expo-av';

const { width } = Dimensions.get('window');

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

export default function PostCard({ post, index = 0, isVisible = true }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [videoPlayCounts, setVideoPlayCounts] = useState<{ [key: number]: number }>({});
  const [manualPlayStates, setManualPlayStates] = useState<{ [key: number]: boolean }>({});
  const [showControls, setShowControls] = useState<{ [key: number]: boolean }>({});
  const [playingStates, setPlayingStates] = useState<{ [key: number]: boolean }>({});
  const videoRefs = useRef<{ [key: number]: Video | null }>({});
  const likeAnimation = useRef(new Animated.Value(1)).current;
  const router = useRouter();

  // Debug log to see what images we're receiving
  console.log('🃏 PostCard received - Post ID:', post.id, 'Images:', post.images);
  console.log('📊 Image count:', post.images.length);

  // Effect to configure audio session for video playback with sound
  useEffect(() => {
    const configureAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: false,
          playsInSilentModeIOS: true, // This allows video to play sound even in silent mode
          shouldDuckAndroid: false,
          playThroughEarpieceAndroid: false,
        });
        console.log('✅ Audio session configured for video playback');
      } catch (error) {
        console.error('❌ Error configuring audio session:', error);
      }
    };

    configureAudio();
  }, []);

  // Effect to pause all videos when component unmounts or goes out of view
  useEffect(() => {
    return () => {
      // Cleanup: pause all videos when component unmounts
      Object.values(videoRefs.current).forEach(video => {
        if (video) {
          video.pauseAsync().catch(() => {});
        }
      });
    };
  }, []);

  // Effect to handle video playback based on visibility and current media
  useEffect(() => {
    // Always pause all videos first when post is not visible
    if (!isVisible) {
      console.log('📱 Post not visible, pausing all videos');
      Object.values(videoRefs.current).forEach(video => {
        if (video) {
          video.pauseAsync().catch(err => {
            console.log('Video pause error:', err.message);
          });
        }
      });
      return;
    }

    // Pause videos that are not currently visible
    Object.entries(videoRefs.current).forEach(([indexStr, video]) => {
      const index = parseInt(indexStr);
      if (video && index !== currentImageIndex) {
        video.pauseAsync().catch(err => {
          console.log('Video pause error:', err.message);
        });
      }
    });

    const currentVideo = videoRefs.current[currentImageIndex];
    const currentMediaUrl = post.images[currentImageIndex];
    const isCurrentMediaVideo = currentMediaUrl && isVideoUrl(currentMediaUrl);

    if (currentVideo && isCurrentMediaVideo) {
      const playCount = videoPlayCounts[currentImageIndex] || 0;
      const isManualPlay = manualPlayStates[currentImageIndex];
      
      console.log(`🎬 Video ${currentImageIndex} - Play count: ${playCount}, Manual: ${isManualPlay}, Visible: ${isVisible}`);
      
      // Only manage playback state, don't interfere with ongoing playback
      if (playCount >= 3 && !isManualPlay) {
        // Stop the video after 3 auto-plays
        currentVideo.pauseAsync();
        console.log('🛑 Video stopped after 3 auto-plays (from useEffect)');
      } else if (isManualPlay) {
        // If user manually played, ensure it's playing
        currentVideo.playAsync().then(() => {
          currentVideo.setVolumeAsync(1.0);
          console.log('✅ Video manually playing with sound enabled');
        }).catch(err => {
          console.log('Video play error:', err.message);
        });
      }
      // For auto-play videos (playCount < 3), let shouldPlay handle the playback
    }
  }, [currentImageIndex, post.images, videoPlayCounts, manualPlayStates, isVisible]);

  // Auto-hide video controls after 3 seconds
  useEffect(() => {
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    
    Object.entries(showControls).forEach(([indexStr, isVisible]) => {
      if (isVisible) {
        const timeout = setTimeout(() => {
          setShowControls(prev => ({
            ...prev,
            [parseInt(indexStr)]: false
          }));
          console.log(`🎮 Auto-hiding controls for video ${indexStr}`);
        }, 2000);
        timeouts.push(timeout);
      }
    });

    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [showControls]);

  const handleLike = () => {
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

    setIsLiked(!isLiked);
    setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
  };

  const handleUserPress = () => {
    router.push(`/user/${post.user.id}`);
  };

  const handlePostPress = () => {
    router.push(`/post/${post.id}`);
  };

  return (
    <View style={[styles.container, { transform: [{ scale: 1 - (index * 0.005) }] }]}>
      {/* Post Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleUserPress} style={styles.userInfo}>
          <View style={styles.avatarContainer}>
            {post.user.avatar ? (
              <Image 
                source={{ uri: post.user.avatar }} 
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.avatar, styles.defaultAvatar]}>
                <Text style={styles.initialsText}>
                  {(post.user.name || post.user.username || 'U').slice(0, 2).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.onlineIndicator} />
          </View>
          <View style={styles.userDetails}>
            <View style={styles.nameRow}>
              <Text style={styles.userName}>{post.user.name}</Text>
              {post.user.verified && (
                <Ionicons name="checkmark-circle" size={16} color="#3B82F6" style={{ marginLeft: 4 }} />
              )}
            </View>
            <Text style={styles.username}>{post.user.username}</Text>
            {post.location && (
              <View style={styles.locationRow}>
                <Ionicons name="location" size={12} color="#6B7280" />
                <Text style={styles.locationText}>{post.location}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <Text style={styles.timestamp}>{post.timestamp}</Text>
          <TouchableOpacity style={styles.moreButton}>
            <Ionicons name="ellipsis-horizontal" size={16} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Post Images */}
      {post.images && post.images.length > 0 ? (
        <View style={styles.imageSection}>
          <ScrollView 
            horizontal 
            pagingEnabled 
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              const newIndex = Math.round(event.nativeEvent.contentOffset.x / (width - 32));
              setCurrentImageIndex(newIndex);
            }}
            style={styles.imageScrollView}
            scrollEnabled={post.images.length > 1}
          >
            {post.images.map((mediaUrl, imgIndex) => {
              const isVideo = isVideoUrl(mediaUrl);
              console.log(`🖼️ Rendering ${isVideo ? 'video' : 'image'} ${imgIndex}:`, mediaUrl);
              
              if (isVideo) {
                return (
                  <View key={`video-container-${imgIndex}`} style={styles.videoContainer}>
                    <Video
                      ref={(ref) => {
                        videoRefs.current[imgIndex] = ref;
                      }}
                      source={{ uri: mediaUrl }}
                      style={styles.postImage}
                      resizeMode={ResizeMode.COVER}
                      shouldPlay={isVisible && imgIndex === currentImageIndex && (
                        (videoPlayCounts[imgIndex] || 0) < 3 || manualPlayStates[imgIndex]
                      )}
                      isLooping={false}
                      isMuted={false}
                      volume={1.0}
                      useNativeControls={false}
                      onError={(error) => console.error('❌ Video failed to load:', mediaUrl, error)}
                      onLoad={() => console.log('✅ Video loaded successfully:', mediaUrl)}
                      onPlaybackStatusUpdate={(status: AVPlaybackStatus) => {
                        if (status.isLoaded) {
                          // Update playing state
                          setPlayingStates(prev => ({
                            ...prev,
                            [imgIndex]: status.isPlaying
                          }));
                          
                          if (status.didJustFinish && imgIndex === currentImageIndex && isVisible) {
                            const currentPlayCount = videoPlayCounts[imgIndex] || 0;
                            const isManualPlay = manualPlayStates[imgIndex];
                            const newPlayCount = currentPlayCount + 1;
                            
                            console.log(`📹 Video ${imgIndex} finished play ${newPlayCount}, manual: ${isManualPlay}`);
                            
                            // Increment play count
                            setVideoPlayCounts(prev => ({
                              ...prev,
                              [imgIndex]: newPlayCount
                            }));
                            
                            const video = videoRefs.current[imgIndex];
                            if (video && !isManualPlay) {
                              // Only restart if we haven't reached limit (3 times)
                              if (newPlayCount < 3) {
                                setTimeout(() => {
                                  video.replayAsync().then(() => {
                                    video.setVolumeAsync(1.0);
                                    console.log(`🔄 Video auto-playing ${newPlayCount + 1}/3`);
                                  });
                                }, 200);
                              } else {
                                video.pauseAsync();
                                console.log('🛑 Video finished 3 auto-plays, stopping');
                              }
                            }
                          }
                        }
                      }}
                    />
                    
                    {/* Custom video controls overlay */}
                    {showControls[imgIndex] && (
                      <View style={styles.customControls}>
                        <TouchableOpacity 
                          style={styles.playPauseButton}
                          onPress={() => {
                            const video = videoRefs.current[imgIndex];
                            if (video) {
                              const isPlaying = playingStates[imgIndex];
                              if (isPlaying) {
                                video.pauseAsync();
                                console.log('⏸️ Video paused manually');
                              } else {
                                video.playAsync();
                                console.log('▶️ Video played manually');
                              }
                            }
                          }}
                        >
                          <Ionicons 
                            name={playingStates[imgIndex] ? "pause-circle" : "play-circle"} 
                            size={60} 
                            color="white" 
                          />
                        </TouchableOpacity>
                        
                        {/* Close controls button */}
                        <TouchableOpacity 
                          style={styles.closeControlsButton}
                          onPress={() => {
                            setShowControls(prev => ({
                              ...prev,
                              [imgIndex]: false
                            }));
                            console.log('❌ Video controls hidden');
                          }}
                        >
                          <Ionicons name="close-circle" size={30} color="white" />
                        </TouchableOpacity>
                      </View>
                    )}
                    
                    {/* Simple tap overlay for showing controls */}
                    {!showControls[imgIndex] && (
                      <TouchableOpacity 
                        style={styles.videoTapArea}
                        activeOpacity={1}
                        onPress={() => {
                          setShowControls(prev => ({
                            ...prev,
                            [imgIndex]: true
                          }));
                          console.log('🎮 Video controls shown for video', imgIndex);
                        }}
                      />
                    )}
                    {/* Video overlay indicator and manual play button */}
                    <TouchableOpacity 
                      key={`video-overlay-${imgIndex}`}
                      style={styles.videoOverlay}
                      onPress={() => {
                        const video = videoRefs.current[imgIndex];
                        const playCount = videoPlayCounts[imgIndex] || 0;
                        const isManualPlay = manualPlayStates[imgIndex];
                        const hasControls = showControls[imgIndex];
                        
                        if (video) {
                          // If video has finished 3 auto-plays and no controls shown, enable manual play
                          if (playCount >= 3 && !isManualPlay && !hasControls) {
                            setManualPlayStates(prev => ({
                              ...prev,
                              [imgIndex]: true
                            }));
                            
                            // Reset the video to start from beginning for manual play
                            video.setPositionAsync(0).then(() => {
                              video.playAsync().then(() => {
                                video.setVolumeAsync(1.0);
                                console.log('🎮 Video manually started by user');
                              });
                            });
                          } else {
                            // Toggle video controls visibility
                            setShowControls(prev => ({
                              ...prev,
                              [imgIndex]: !prev[imgIndex]
                            }));
                            console.log('🎮 Video controls toggled');
                          }
                        }
                      }}
                    >
                      <View style={styles.videoIndicator}>
                        <Ionicons 
                          name={(() => {
                            if (imgIndex !== currentImageIndex) return "play";
                            const playCount = videoPlayCounts[imgIndex] || 0;
                            const isManualPlay = manualPlayStates[imgIndex];
                            const hasControls = showControls[imgIndex];
                            
                            if (playCount >= 3 && !isManualPlay && !hasControls) {
                              return "play"; // Show play button after 3 auto-plays
                            }
                            if (hasControls) {
                              return "settings"; // Show settings icon when controls are visible
                            }
                            return "volume-high"; // Show volume when playing
                          })()}
                          size={20} 
                          color="white"
                        />
                      </View>
                    </TouchableOpacity>
                  </View>
                );
              } else {
                return (
                  <TouchableOpacity key={`image-${imgIndex}`} onPress={handlePostPress}>
                    <Image 
                      source={{ uri: mediaUrl }} 
                      style={styles.postImage}
                      onError={(error) => console.error('❌ Image failed to load:', mediaUrl, error)}
                      onLoad={() => console.log('✅ Image loaded successfully:', mediaUrl)}
                    />
                  </TouchableOpacity>
                );
              }
            })}
          </ScrollView>
          
          {/* Image indicators */}
          {post.images.length > 1 && (
            <View style={styles.indicatorContainer}>
              {post.images.map((_, imgIndex) => (
                <View 
                  key={imgIndex}
                  style={[
                    styles.indicator,
                    { backgroundColor: imgIndex === currentImageIndex ? '#3B82F6' : '#D1D5DB' }
                  ]}
                />
              ))}
            </View>
          )}
        </View>
      ) : (
        <View style={styles.noImageContainer}>
          <Text style={styles.noImageText}>No images to display</Text>
        </View>
      )}

      {/* Post Actions */}
      <View style={styles.actionsRow}>
        <View style={styles.leftActions}>
          <Animated.View style={{ transform: [{ scale: likeAnimation }] }}>
            <TouchableOpacity onPress={handleLike} style={styles.actionButton}>
              <Ionicons 
                name={isLiked ? "heart" : "heart-outline"} 
                size={26} 
                color={isLiked ? "#EF4444" : "#374151"} 
              />
            </TouchableOpacity>
          </Animated.View>
          
          <TouchableOpacity onPress={handlePostPress} style={styles.actionButton}>
            <Ionicons name="chatbubble-outline" size={24} color="#374151" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="paper-plane-outline" size={24} color="#374151" />
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity onPress={handleSave}>
          <Ionicons 
            name={isSaved ? "bookmark" : "bookmark-outline"} 
            size={24} 
            color={isSaved ? "#3B82F6" : "#374151"} 
          />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.leftStats}>
          <Text style={styles.likesText}>
            {likesCount.toLocaleString()} likes
          </Text>
          {post.shares && (
            <Text style={styles.statText}>
              {post.shares} shares
            </Text>
          )}
          {post.comments && post.comments.length > 0 && (
            <Text style={styles.statText}>
              {post.comments.length} comments
            </Text>
          )}
        </View>
        {post.saves && (
          <Text style={styles.statText}>
            {post.saves} saves
          </Text>
        )}
      </View>

      {/* Caption */}
      <View style={styles.captionSection}>
        <Text style={styles.captionText}>
          <TouchableOpacity onPress={handleUserPress}>
            <Text style={styles.authorName}>{post.user.name}</Text>
          </TouchableOpacity>{' '}
          {post.caption}
        </Text>
        
        {/* Tags */}
        {post.tags && (
          <View style={styles.tagsContainer}>
            {post.tags.map((tag, tagIndex) => (
              <TouchableOpacity key={tagIndex} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        
        {/* Comments preview */}
        {post.comments && post.comments.length > 0 && (
          <TouchableOpacity onPress={handlePostPress} style={styles.commentsSection}>
            <Text style={styles.viewCommentsText}>
              View all {post.comments.length} comments
            </Text>
            {post.comments.slice(0, 2).map((comment) => (
              <View key={comment.id} style={styles.commentRow}>
                <Text style={styles.commentText}>
                  <Text style={styles.commentAuthor}>{comment.user.name}</Text>{' '}
                  {comment.text}
                </Text>
              </View>
            ))}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 24,
    marginBottom: 20,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 48,
    height: 48,
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
  onlineIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    backgroundColor: '#10B981',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'white',
  },
  userDetails: {
    marginLeft: 12,
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontWeight: 'bold',
    color: '#1F2937',
    fontSize: 16,
  },
  username: {
    fontSize: 14,
    color: '#6B7280',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  locationText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timestamp: {
    fontSize: 12,
    color: '#6B7280',
  },
  moreButton: {
    backgroundColor: '#F3F4F6',
    padding: 8,
    borderRadius: 20,
  },
  imageSection: {
    position: 'relative',
  },
  imageScrollView: {
    marginHorizontal: 16,
  },
  postImage: {
    width: width - 32,
    height: 300,
    borderRadius: 16,
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
    gap: 4,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  actionButton: {
    padding: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  leftStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  likesText: {
    fontWeight: 'bold',
    color: '#1F2937',
    fontSize: 16,
  },
  statText: {
    color: '#6B7280',
    fontSize: 14,
  },
  captionSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  captionText: {
    color: '#1F2937',
    fontSize: 16,
    lineHeight: 22,
  },
  authorName: {
    fontWeight: 'bold',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tag: {
    marginRight: 8,
    marginBottom: 4,
  },
  tagText: {
    color: '#3B82F6',
    fontWeight: '500',
    fontSize: 14,
  },
  commentsSection: {
    marginTop: 12,
  },
  viewCommentsText: {
    color: '#6B7280',
    fontSize: 14,
  },
  commentRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  commentText: {
    color: '#1F2937',
    fontSize: 14,
  },
  commentAuthor: {
    fontWeight: '600',
  },
  noImageContainer: {
    height: 200,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    borderRadius: 16,
  },
  noImageText: {
    color: '#6B7280',
    fontSize: 14,
    fontStyle: 'italic',
  },
  videoOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 20,
  },
  videoIndicator: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoContainer: {
    position: 'relative',
  },
  videoWrapper: {
    position: 'relative',
  },
  videoTapArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5,
    backgroundColor: 'transparent',
  },
  customControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 15,
  },
  playPauseButton: {
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  closeControlsButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    padding: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
});