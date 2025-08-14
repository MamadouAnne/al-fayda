import { View, Text, ScrollView, TouchableOpacity, StatusBar, Animated, StyleSheet, Dimensions, Image, FlatList } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { POSTS, USERS } from '@/constants/MockData';
import { useState, useRef, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const floatingAnimation = useRef(new Animated.Value(0)).current;
  const likeAnimation = useRef(new Animated.Value(1)).current;

  // Find post by ID
  const post = POSTS.find(p => p.id.toString() === id);
  
  // Get other posts from the same user (excluding current post)
  const otherUserPosts = post ? POSTS.filter(p => p.user.id === post.user.id && p.id !== post.id) : [];

  useEffect(() => {
    if (post) {
      setLikesCount(post.likes);
      setIsLiked(false);
      setIsSaved(false);
    }

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
  }, [post]);

  const floatingY = floatingAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });

  if (!post) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#667eea', '#764ba2', '#f093fb', '#f5576c']}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Post not found</Text>
        </View>
      </View>
    );
  }

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

  const handleShare = () => {
    console.log('Sharing post:', post.id);
  };

  const handleComment = () => {
    setShowComments(!showComments);
  };

  const handleOtherPostPress = (postId: number) => {
    router.push(`/post/${postId}`);
  };

  const renderImageItem = ({ item, index }: { item: string; index: number }) => (
    <View style={styles.imageContainer}>
      <Image source={{ uri: item }} style={styles.postImage} />
      {post.images.length > 1 && (
        <View style={styles.imageCounter}>
          <BlurView intensity={15} tint="dark" style={styles.counterBlur}>
            <Text style={styles.counterText}>{index + 1}/{post.images.length}</Text>
          </BlurView>
        </View>
      )}
    </View>
  );

  const mockComments = [
    { id: 1, user: USERS[1], text: 'Amazing shot! Love the colors 🔥', timestamp: '2h ago', likes: 12 },
    { id: 2, user: USERS[2], text: 'This is incredible! Where was this taken?', timestamp: '1h ago', likes: 8 },
    { id: 3, user: USERS[3], text: 'Stunning work as always! 👏', timestamp: '45m ago', likes: 5 },
  ];

  const renderComment = ({ item }: { item: any }) => (
    <Animated.View style={[styles.commentItem, { opacity: fadeAnimation }]}>
      <LinearGradient
        colors={['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.05)']}
        style={styles.commentGradient}
      >
        <BlurView intensity={10} tint="dark" style={styles.commentBlur}>
          <View style={styles.commentContent}>
            <TouchableOpacity onPress={() => router.push(`/user/${item.user.id}`)} style={styles.commentUser}>
              <View style={styles.commentAvatarContainer}>
                <LinearGradient
                  colors={['#f093fb', '#f5576c', '#4facfe', '#00f2fe']}
                  style={styles.commentAvatarRing}
                >
                  <Image source={{ uri: item.user.avatar }} style={styles.commentAvatar} />
                </LinearGradient>
              </View>
              <View style={styles.commentUserInfo}>
                <View style={styles.commentNameRow}>
                  <Text style={styles.commentUserName}>{item.user.name}</Text>
                  {item.user.verified && (
                    <View style={styles.commentVerifiedBadge}>
                      <Ionicons name="checkmark" size={10} color="white" />
                    </View>
                  )}
                </View>
                <Text style={styles.commentTimestamp}>{item.timestamp}</Text>
              </View>
            </TouchableOpacity>
            
            <Text style={styles.commentText}>{item.text}</Text>
            
            <View style={styles.commentActions}>
              <TouchableOpacity style={styles.commentLike}>
                <Ionicons name="heart-outline" size={16} color="rgba(255,255,255,0.7)" />
                <Text style={styles.commentLikeText}>{item.likes}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.commentReply}>
                <Text style={styles.commentReplyText}>Reply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </LinearGradient>
    </Animated.View>
  );

  const renderOtherPost = ({ item, index }: { item: any; index: number }) => (
    <Animated.View 
      style={[
        styles.otherPostItem,
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
      <TouchableOpacity 
        style={styles.otherPostContainer}
        onPress={() => handleOtherPostPress(item.id)}
      >
        <LinearGradient
          colors={['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.05)']}
          style={styles.otherPostGradient}
        >
          <BlurView intensity={10} tint="dark" style={styles.otherPostBlur}>
            <Image source={{ uri: item.images[0] }} style={styles.otherPostImage} />
            
            {/* Post overlay with stats */}
            <View style={styles.otherPostOverlay}>
              <View style={styles.otherPostStats}>
                <View style={styles.otherPostStat}>
                  <Ionicons name="heart" size={14} color="white" />
                  <Text style={styles.otherPostStatText}>{item.likes}</Text>
                </View>
                <View style={styles.otherPostStat}>
                  <Ionicons name="chatbubble" size={14} color="white" />
                  <Text style={styles.otherPostStatText}>{item.comments?.length || 0}</Text>
                </View>
              </View>
              
              {item.images.length > 1 && (
                <View style={styles.multipleImagesIndicator}>
                  <Ionicons name="copy" size={12} color="white" />
                </View>
              )}
            </View>
            
            {/* Post preview info */}
            <View style={styles.otherPostInfo}>
              <Text style={styles.otherPostCaption} numberOfLines={2}>
                {item.caption}
              </Text>
              <Text style={styles.otherPostTimestamp}>{item.timestamp}</Text>
            </View>
          </BlurView>
        </LinearGradient>
      </TouchableOpacity>
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
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <BlurView intensity={20} tint="light" style={styles.backButtonBlur}>
                <Ionicons name="arrow-back" size={24} color="white" />
              </BlurView>
            </TouchableOpacity>
            
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Post</Text>
            </View>
            
            <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
              <BlurView intensity={20} tint="light" style={styles.shareButtonBlur}>
                <Ionicons name="share-outline" size={24} color="white" />
              </BlurView>
            </TouchableOpacity>
          </View>
        </BlurView>
      </Animated.View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Info */}
        <Animated.View style={[styles.userSection, { opacity: fadeAnimation }]}>
          <TouchableOpacity onPress={handleUserPress} style={styles.userInfo}>
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={['#f093fb', '#f5576c', '#4facfe', '#00f2fe']}
                style={styles.avatarRing}
              >
                <Image source={{ uri: post.user.avatar }} style={styles.avatar} />
              </LinearGradient>
              <View style={styles.onlineIndicator} />
            </View>
            
            <View style={styles.userDetails}>
              <View style={styles.nameRow}>
                <Text style={styles.userName}>{post.user.name}</Text>
                {post.user.verified && (
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark" size={14} color="white" />
                  </View>
                )}
              </View>
              <Text style={styles.userUsername}>{post.user.username}</Text>
              {post.location && (
                <View style={styles.locationRow}>
                  <Ionicons name="location" size={12} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.locationText}>{post.location}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
          
          <Text style={styles.timestamp}>{post.timestamp}</Text>
        </Animated.View>

        {/* Post Images */}
        <Animated.View style={[styles.imagesSection, { opacity: fadeAnimation }]}>
          <FlatList
            data={post.images}
            renderItem={renderImageItem}
            keyExtractor={(item, index) => index.toString()}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              const newIndex = Math.round(event.nativeEvent.contentOffset.x / width);
              setCurrentImageIndex(newIndex);
            }}
          />
          
          {post.images.length > 1 && (
            <View style={styles.dotsContainer}>
              {post.images.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    { opacity: index === currentImageIndex ? 1 : 0.5 }
                  ]}
                />
              ))}
            </View>
          )}
        </Animated.View>

        {/* Post Actions */}
        <Animated.View style={[styles.actionsSection, { opacity: fadeAnimation }]}>
          <View style={styles.mainActions}>
            <Animated.View style={{ transform: [{ scale: likeAnimation }] }}>
              <TouchableOpacity onPress={handleLike} style={styles.actionButton}>
                <LinearGradient
                  colors={isLiked ? ['#EF4444', '#DC2626'] : ['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                  style={styles.actionButtonGradient}
                >
                  <Ionicons 
                    name={isLiked ? "heart" : "heart-outline"} 
                    size={24} 
                    color="white" 
                  />
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
            
            <TouchableOpacity onPress={handleComment} style={styles.actionButton}>
              <LinearGradient
                colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                style={styles.actionButtonGradient}
              >
                <Ionicons name="chatbubble-outline" size={22} color="white" />
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={handleShare} style={styles.actionButton}>
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
              <Ionicons 
                name={isSaved ? "bookmark" : "bookmark-outline"} 
                size={22} 
                color="white" 
              />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Post Stats */}
        <Animated.View style={[styles.statsSection, { opacity: fadeAnimation }]}>
          <Text style={styles.likesText}>{likesCount.toLocaleString()} likes</Text>
          {post.shares && (
            <Text style={styles.statText}>{post.shares} shares</Text>
          )}
          <Text style={styles.statText}>{mockComments.length} comments</Text>
        </Animated.View>

        {/* Caption */}
        <Animated.View style={[styles.captionSection, { opacity: fadeAnimation }]}>
          <Text style={styles.captionText}>
            <TouchableOpacity onPress={handleUserPress}>
              <Text style={styles.authorName}>{post.user.name}</Text>
            </TouchableOpacity>{' '}
            {post.caption}
          </Text>
          
          {/* Tags */}
          {post.tags && (
            <View style={styles.tagsContainer}>
              {post.tags.map((tag, index) => (
                <TouchableOpacity key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </Animated.View>

        {/* Comments Section */}
        {showComments && (
          <Animated.View style={[styles.commentsSection, { opacity: fadeAnimation }]}>
            <View style={styles.commentsSectionHeader}>
              <Text style={styles.commentsSectionTitle}>Comments</Text>
              <TouchableOpacity onPress={() => setShowComments(false)}>
                <Ionicons name="chevron-up" size={20} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={mockComments}
              renderItem={renderComment}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              style={styles.commentsList}
            />
          </Animated.View>
        )}

        {/* More from this user */}
        {otherUserPosts.length > 0 && (
          <Animated.View style={[styles.morePostsSection, { opacity: fadeAnimation }]}>
            <View style={styles.morePostsHeader}>
              <View style={styles.morePostsHeaderContent}>
                <TouchableOpacity onPress={handleUserPress} style={styles.morePostsUserInfo}>
                  <View style={styles.morePostsAvatarContainer}>
                    <LinearGradient
                      colors={['#f093fb', '#f5576c', '#4facfe', '#00f2fe']}
                      style={styles.morePostsAvatarRing}
                    >
                      <Image source={{ uri: post.user.avatar }} style={styles.morePostsAvatar} />
                    </LinearGradient>
                  </View>
                  <View style={styles.morePostsUserDetails}>
                    <Text style={styles.morePostsTitle}>More from {post.user.name.split(' ')[0]}</Text>
                    <Text style={styles.morePostsSubtitle}>{otherUserPosts.length} more posts</Text>
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity onPress={handleUserPress} style={styles.viewProfileButton}>
                  <LinearGradient
                    colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                    style={styles.viewProfileGradient}
                  >
                    <Text style={styles.viewProfileText}>View Profile</Text>
                    <Ionicons name="arrow-forward" size={16} color="white" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
            
            <FlatList
              data={otherUserPosts.slice(0, 6)} // Show up to 6 posts
              renderItem={renderOtherPost}
              keyExtractor={(item) => item.id.toString()}
              numColumns={2}
              scrollEnabled={false}
              columnWrapperStyle={styles.otherPostsRow}
              style={styles.otherPostsList}
              contentContainerStyle={styles.otherPostsContent}
            />
            
            {otherUserPosts.length > 6 && (
              <TouchableOpacity onPress={handleUserPress} style={styles.viewMoreButton}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.08)']}
                  style={styles.viewMoreGradient}
                >
                  <BlurView intensity={10} tint="dark" style={styles.viewMoreBlur}>
                    <Ionicons name="grid" size={20} color="white" />
                    <Text style={styles.viewMoreText}>View All {otherUserPosts.length} Posts</Text>
                  </BlurView>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </Animated.View>
        )}
      </ScrollView>
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
    top: 400,
    left: -20,
    width: 80,
    height: 80,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 40,
    opacity: 0.6,
  },
  orb3: {
    position: 'absolute',
    bottom: 300,
    right: 40,
    width: 120,
    height: 120,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 60,
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
    justifyContent: 'space-between',
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
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  shareButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  shareButtonBlur: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingTop: 120,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarRing: {
    width: 50,
    height: 50,
    borderRadius: 25,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 14,
    height: 14,
    backgroundColor: '#10B981',
    borderRadius: 7,
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
    fontSize: 16,
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
  userUsername: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '500',
  },
  timestamp: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: '500',
  },
  imagesSection: {
    marginBottom: 16,
  },
  imageContainer: {
    width: width,
    height: 400,
    position: 'relative',
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  imageCounter: {
    position: 'absolute',
    top: 16,
    right: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  counterBlur: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  counterText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
  },
  actionsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  mainActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
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
  saveButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 16,
  },
  likesText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  statText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
  captionSection: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  captionText: {
    color: 'white',
    fontSize: 15,
    lineHeight: 22,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  authorName: {
    fontWeight: '700',
    color: 'white',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 8,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
  },
  tagText: {
    color: '#4ECDC4',
    fontSize: 14,
    fontWeight: '600',
  },
  commentsSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  commentsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  commentsSectionTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  commentsList: {
    gap: 12,
  },
  commentItem: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  commentGradient: {
    borderRadius: 16,
  },
  commentBlur: {
    padding: 16,
  },
  commentContent: {
    gap: 12,
  },
  commentUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  commentAvatarContainer: {
    position: 'relative',
  },
  commentAvatarRing: {
    width: 36,
    height: 36,
    borderRadius: 18,
    padding: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentAvatar: {
    width: 33,
    height: 33,
    borderRadius: 16.5,
  },
  commentUserInfo: {
    flex: 1,
  },
  commentNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  commentUserName: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  commentVerifiedBadge: {
    backgroundColor: '#1DA1F2',
    borderRadius: 6,
    width: 12,
    height: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentTimestamp: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: '500',
  },
  commentText: {
    color: 'white',
    fontSize: 14,
    lineHeight: 20,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  commentLike: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  commentLikeText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '500',
  },
  commentReply: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  commentReplyText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '600',
  },
  // More posts section styles
  morePostsSection: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 40,
  },
  morePostsHeader: {
    marginBottom: 20,
  },
  morePostsHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  morePostsUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  morePostsAvatarContainer: {
    position: 'relative',
  },
  morePostsAvatarRing: {
    width: 40,
    height: 40,
    borderRadius: 20,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  morePostsAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  morePostsUserDetails: {
    flex: 1,
    gap: 2,
  },
  morePostsTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  morePostsSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '500',
  },
  viewProfileButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  viewProfileGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  viewProfileText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  otherPostsList: {
    marginTop: 8,
  },
  otherPostsContent: {
    gap: 12,
  },
  otherPostsRow: {
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  otherPostItem: {
    width: '48%',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  otherPostContainer: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  otherPostGradient: {
    borderRadius: 16,
  },
  otherPostBlur: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  otherPostImage: {
    width: '100%',
    height: 120,
  },
  otherPostOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'space-between',
    padding: 8,
  },
  otherPostStats: {
    flexDirection: 'row',
    gap: 12,
    alignSelf: 'flex-end',
  },
  otherPostStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  otherPostStatText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  multipleImagesIndicator: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 8,
    padding: 4,
  },
  otherPostInfo: {
    padding: 12,
    gap: 6,
  },
  otherPostCaption: {
    color: 'white',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  otherPostTimestamp: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontWeight: '500',
  },
  viewMoreButton: {
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  viewMoreGradient: {
    borderRadius: 16,
  },
  viewMoreBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  viewMoreText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
});