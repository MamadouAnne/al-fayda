import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, Animated, StyleSheet, Dimensions, Image, TextInput, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { postsApi, commentsApi } from '@/lib/api';
import { Post, Comment, User } from '@/lib/supabase';

const { width } = Dimensions.get('window');

// Move styles to the top level to avoid hoisting issues
const styles = StyleSheet.create({
  // Layout
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
  },
  
  // Header
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,  // Increased zIndex to ensure it stays above other elements
    paddingTop: 60,
    paddingHorizontal: 15,
    backgroundColor: 'transparent',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 20,  
    paddingTop: 12,  
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  backButtonContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 22,
  },
  
  // Images Section
  imagesSection: {
    width,
    height: width,
  },
  imageContainer: {
    width,
    height: '100%',
    position: 'relative',
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  imageCounter: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  counterBlur: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  counterText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  dotsContainer: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 15,
    alignSelf: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'white',
    marginHorizontal: 3,
  },
  
  // User Section
  userSection: {
    padding: 20,
    paddingTop: 120,  // Increased to make space for the header
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatarRing: {
    width: 54,  
    height: 54,  
    borderRadius: 27,  
    padding: 3,  
    backgroundColor: 'transparent',
    borderWidth: 2,
    // Using a gradient border would require a custom component in React Native
    // For now, we'll use a solid color
    borderColor: '#FF8A00',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 23,
  },
  userDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  userName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 5,
  },
  
  // Actions Section
  actionsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  mainActions: {
    flexDirection: 'row',
    alignItems: 'center',
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
  
  // Stats Section
  statsSection: {
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  likesText: {
    color: 'white',
    fontWeight: '600',
    marginBottom: 5,
  },
  statText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginBottom: 3,
  },
  
  // Caption Section
  captionSection: {
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  captionContent: {
    flexDirection: 'column',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    fontSize: 15,
  },
  authorUsername: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tag: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    color: 'white',
    fontSize: 12,
  },
  
  // Comments Section
  commentsSection: {
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 15,
  },
  commentsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  commentsSectionTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  commentsList: {
    paddingHorizontal: 15,
  },
  
  // Error States
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
  },
  
  // Loading State
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 10,
  },
  
  // Comment Styles
  commentItem: {
    marginBottom: 15,
  },
  commentGradient: {
    borderRadius: 20,
    marginBottom: 10,
  },
  commentBlur: {
    padding: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(30, 30, 30, 0.7)',
  },
  commentContent: {
    flexDirection: 'row',
  },
  commentUser: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  commentAvatarContainer: {
    marginRight: 10,
  },
  commentAvatarRing: {
    width: 36,
    height: 36,
    borderRadius: 18,
    padding: 2,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#FF8A00',
  },
  commentAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  commentUserInfo: {
    flex: 1,
  },
  commentNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentUserName: {
    color: 'white',
    fontWeight: '600',
    marginRight: 5,
  },
  commentVerifiedBadge: {
    marginLeft: 4,
  },
  commentTimestamp: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginTop: 2,
  },
  commentText: {
    color: 'white',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 5,
  },
  commentActions: {
    flexDirection: 'row',
    marginTop: 8,
    marginLeft: 46,
  },
  commentLike: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  commentLikeText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginLeft: 4,
  },
  commentReply: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentReplyText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginLeft: 4,
  },
  
  // Other Post Item Styles
  otherPostItem: {
    marginRight: 15,
    width: 150,
    borderRadius: 15,
    overflow: 'hidden',
  },
  otherPostContainer: {
    borderRadius: 15,
    overflow: 'hidden',
  },
  otherPostGradient: {
    borderRadius: 15,
  },
  otherPostBlur: {
    padding: 10,
    borderRadius: 15,
    backgroundColor: 'rgba(30, 30, 30, 0.7)',
  },
  otherPostImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 10,
  },
  otherPostOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  otherPostStats: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
  },
  otherPostStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  otherPostStatText: {
    color: 'white',
    fontSize: 12,
    marginLeft: 2,
    fontWeight: '600',
  },
  multipleImagesIndicator: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
    padding: 4,
  },
  otherPostInfo: {
    marginTop: 8,
  },
  otherPostCaption: {
    color: 'white',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 4,
  },
  otherPostTimestamp: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
  },
  
  // Background Orbs
  backgroundOrbs: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1,
  },
  orb1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(255, 138, 0, 0.15)',
    top: -100,
    right: -100,
  },
  orb2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 0, 128, 0.1)',
    bottom: -50,
    left: -50,
  },
  orb3: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(0, 200, 255, 0.1)',
    top: '30%',
    left: '50%',
    marginLeft: -200,
  },
  
  // Header Styles
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  shareButtonContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 22,
  },
  
  // User Info Styles
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#000',
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  verifiedBadge: {
    marginLeft: 4,
  },
  userUsername: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  locationText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginLeft: 4,
  },
  postContentText: {
    color: 'white',
    fontSize: 15,
    lineHeight: 20,
    marginTop: 8,
  },
  timestamp: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    marginTop: 2,
  },
  
  // Save Button
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
  
  // More Posts Section
  morePostsSection: {
    marginTop: 20,
    paddingHorizontal: 15,
  },
  morePostsHeader: {
    marginBottom: 15,
  },
  morePostsHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  morePostsUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  morePostsAvatarContainer: {
    marginRight: 12,
  },
  morePostsAvatarRing: {
    width: 50,
    height: 50,
    borderRadius: 25,
    padding: 2,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#FF8A00',
  },
  morePostsAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 23,
  },
  morePostsUserDetails: {
    flex: 1,
  },
  morePostsTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  morePostsSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  viewProfileButton: {
    marginTop: 10,
    borderRadius: 20,
    overflow: 'hidden',
  },
  viewProfileGradient: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  viewProfileText: {
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
  },
  otherPostsRow: {
    marginTop: 15,
  },
  otherPostsList: {
    paddingBottom: 5,
  },
  otherPostsContent: {
    paddingRight: 15,
  },
  viewMoreButton: {
    marginTop: 15,
    borderRadius: 20,
    overflow: 'hidden',
  },
  viewMoreGradient: {
    borderRadius: 20,
  },
  viewMoreBlur: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(30, 30, 30, 0.7)',
  },
  viewMoreText: {
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
  },
  noCommentsText: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
  },
  
  // Comment Input Styles
  commentInputContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  commentInputGradient: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  commentInputBlur: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  commentInputContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  commentInputField: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: 'white',
    fontSize: 16,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  sendButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  
  // Comments Display Section
  commentsDisplaySection: {
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  commentsContainer: {
    gap: 8,
  },
  commentDisplayItem: {
    marginBottom: 6,
  },
  commentUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  commentDisplayAuthor: {
    fontWeight: '600',
    color: 'white',
    fontSize: 14,
  },
  commentDisplayUsername: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
  },
  commentDisplayText: {
    color: 'white',
    fontSize: 14,
    lineHeight: 18,
    paddingLeft: 0,
  },
});

export default function PostDetailScreen() {
  const router = useRouter();
  // Get the post ID from URL params with type safety
  const params = useLocalSearchParams<{ id: string }>();
  const safePostId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  
  // Initialize state with proper types - ALL useState hooks must come first
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [likesCount, setLikesCount] = useState<number>(0);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [otherUserPosts, setOtherUserPosts] = useState<Post[]>([]);
  const [postImages, setPostImages] = useState<string[]>([]);
  const [postTags, setPostTags] = useState<string[]>([]);
  const [postUser, setPostUser] = useState<User>({ 
    id: '', 
    name: 'Unknown User', 
    username: 'unknown',
    email: '',
    verified: false,
    followers_count: 0,
    following_count: 0,
    posts_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
  const [comments, setComments] = useState<Comment[]>([]);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Initialize animation refs with proper types
  const fadeAnimation = useRef<Animated.Value>(new Animated.Value(0)).current;
  const floatingAnimation = useRef<Animated.Value>(new Animated.Value(0)).current;
  const likeAnimation = useRef<Animated.Value>(new Animated.Value(1)).current;

  // Redirect if no ID is provided
  useEffect(() => {
    if (!safePostId) {
      console.error('No post ID provided');
      router.back();
      return;
    }
  }, [safePostId, router]);

  const loadComments = async () => {
    if (!safePostId) return;
    
    try {
      console.log('Loading comments for post:', safePostId);
      const commentsData = await commentsApi.getComments(safePostId);
      console.log('Comments loaded:', commentsData);
      
      if (commentsData) {
        setComments(commentsData);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
      setComments([]);
    }
  };

  const loadPost = async () => {
    if (!safePostId) return;
    
    try {
      setLoading(true);
      console.log('Loading post with ID:', safePostId);
      
      const postData = await postsApi.getPost(safePostId);
      console.log('Post loaded:', postData);
      
      if (!postData) {
        console.error('No post data received');
        return;
      }
      
      setPost(postData);
      setLikesCount(Array.isArray(postData.likes) ? postData.likes.length : 0);
      setIsLiked(false);
      setIsSaved(false);
      
      // Update derived state
      setPostImages(postData.images ?? []);
      setPostTags(postData.tags ?? []);
      setPostUser(postData.user ?? { id: '', name: 'Unknown User', username: 'unknown' });
      
      // Load comments for this post
      await loadComments();
      
      // Load other posts from the same user
      if (postData.userId) {
        try {
          const userPosts = await postsApi.getPostsByUser(postData.userId, 5, 0);
          setOtherUserPosts(Array.isArray(userPosts) ? userPosts.filter(p => p?.id !== safePostId) : []);
        } catch (error) {
          console.error('Error loading user posts:', error);
          setOtherUserPosts([]);
        }
      }
    } catch (error) {
      console.error('Error loading post:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (safePostId) {
      loadPost();
    }
  }, [safePostId]);

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

    // Keyboard event listeners
    const keyboardWillShow = (event: any) => {
      setKeyboardHeight(event.endCoordinates.height);
    };

    const keyboardWillHide = () => {
      setKeyboardHeight(0);
    };

    const keyboardDidShow = (event: any) => {
      setKeyboardHeight(event.endCoordinates.height);
    };

    const keyboardDidHide = () => {
      setKeyboardHeight(0);
    };

    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      Platform.OS === 'ios' ? keyboardWillShow : keyboardDidShow
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      Platform.OS === 'ios' ? keyboardWillHide : keyboardDidHide
    );

    return () => {
      showSubscription?.remove();
      hideSubscription?.remove();
    };
  }, []);

  const floatingY = floatingAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });

  const renderImageItem = useCallback(({ item, index }: { item: string; index: number }) => {
    if (!item) return null;
    
    return (
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: item }} 
          style={styles.postImage} 
          resizeMode="cover"
        />
        {postImages.length > 1 && (
          <View style={styles.imageCounter}>
            <BlurView intensity={15} tint="dark" style={styles.counterBlur}>
              <Text style={styles.counterText}>
                {index + 1}/{postImages.length}
              </Text>
            </BlurView>
          </View>
        )}
      </View>
    );
  }, [postImages.length]);


  if (!safePostId) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#667eea', '#764ba2', '#f093fb', '#f5576c']}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Invalid post ID</Text>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#667eea', '#764ba2', '#f093fb', '#f5576c']}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Loading post...</Text>
        </View>
      </View>
    );
  }

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
    if (postUser?.id) {
      router.push(`/user/${postUser.id}`);
    }
  };

  const handleShare = () => {
    if (post?.id) {
      console.log('Sharing post:', post.id);
      // Implement actual sharing logic here
    }
  };

  const handleComment = () => {
    setShowCommentInput(true);
  };

  const handleSendComment = async () => {
    if (commentText.trim() && safePostId) {
      try {
        console.log('Creating comment:', commentText);
        
        // Create comment using the API
        const newComment = await commentsApi.createComment(safePostId, commentText.trim());
        console.log('Comment created:', newComment);
        
        // Add the new comment to the beginning of the list (most recent first)
        setComments(prevComments => [newComment, ...prevComments]);
        
        // Clear input and hide
        setCommentText('');
        setShowCommentInput(false);
        Keyboard.dismiss();
      } catch (error) {
        console.error('Error creating comment:', error);
        // You could show an error message to the user here
        alert('Failed to add comment. Please try again.');
      }
    }
  };


  const handleOtherPostPress = (postId: string) => {
    if (!postId) {
      console.error('No post ID provided for navigation');
      return;
    }
    router.push(`/post/${postId}`);
  };

  const renderOtherPost = ({ item, index }: { item: Post; index: number }) => (
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
            <Image source={{ uri: item.images?.[0] || '' }} style={styles.otherPostImage} />
            
            {/* Post overlay with stats */}
            <View style={styles.otherPostOverlay}>
              <View style={styles.otherPostStats}>
                <View style={styles.otherPostStat}>
                  <Ionicons name="heart" size={14} color="white" />
                  <Text style={styles.otherPostStatText}>{item.likes_count || 0}</Text>
                </View>
                <View style={styles.otherPostStat}>
                  <Ionicons name="chatbubble" size={14} color="white" />
                  <Text style={styles.otherPostStatText}>{item.comments_count || 0}</Text>
                </View>
              </View>
              
              {(item.images?.length || 0) > 1 && (
                <View style={styles.multipleImagesIndicator}>
                  <Ionicons name="copy" size={12} color="white" />
                </View>
              )}
            </View>
            
            {/* Post preview info */}
            <View style={styles.otherPostInfo}>
              <Text style={styles.otherPostCaption} numberOfLines={2}>
                {item.content}
              </Text>
              <Text style={styles.otherPostTimestamp}>{item.created_at}</Text>
            </View>
          </BlurView>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );

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

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
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
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <View style={styles.backButtonContent}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </View>
          </TouchableOpacity>
          
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Post</Text>
          </View>
          
          <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
            <View style={styles.shareButtonContent}>
              <Ionicons name="share-outline" size={24} color="white" />
            </View>
          </TouchableOpacity>
        </View>
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
                <Image 
                  source={post.user?.avatar ? { uri: post.user.avatar } : require('@/assets/images/icon.png')} 
                  style={styles.avatar} 
                />
              </LinearGradient>
              <View style={styles.onlineIndicator} />
            </View>
            
            <View style={styles.userDetails}>
              <View style={styles.nameRow}>
                <Text style={styles.userName}>{post.user?.name || 'Unknown User'}</Text>
                {post.user?.verified && (
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark" size={14} color="white" />
                  </View>
                )}
              </View>
              <Text style={styles.userUsername}>{post.user?.username || 'unknown'}</Text>
              {post.location && (
                <View style={styles.locationRow}>
                  <Ionicons name="location" size={12} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.locationText}>{post.location}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
          
          <Text style={styles.timestamp}>{new Date(post.created_at).toLocaleDateString()}</Text>
        </Animated.View>

        {/* Post Images */}
        <Animated.View style={[styles.imagesSection, { opacity: fadeAnimation }]}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              const offsetX = event.nativeEvent.contentOffset.x;
              const newIndex = Math.round(offsetX / width);
              setCurrentImageIndex(newIndex);
            }}
          >
            {(postImages || []).map((item, index) => 
              renderImageItem({ item, index })
            )}
          </ScrollView>
          
          {(postImages?.length || 0) > 1 && (
            <View style={styles.dotsContainer}>
              {(postImages || []).map((_: string, index: number) => (
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
          {post?.shares_count ? (
            <Text style={styles.statText}>{post.shares_count} shares</Text>
          ) : null}
          <Text style={styles.statText}>{comments.length} comments</Text>
        </Animated.View>

        {/* Caption */}
        <Animated.View style={[styles.captionSection, { opacity: fadeAnimation }]}>
          <View style={styles.captionContent}>
            <TouchableOpacity onPress={handleUserPress} style={styles.authorRow}>
              <Text style={styles.authorName}>{postUser.name}</Text>
              <Text style={styles.authorUsername}>@{postUser.username}</Text>
            </TouchableOpacity>
            <Text style={styles.captionText}>{post?.content}</Text>
          </View>
          
          {/* Tags */}
          {postTags.length > 0 ? (
            <View style={styles.tagsContainer}>
              {(postTags || []).map((tag: string, index: number) => (
                <TouchableOpacity key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
        </Animated.View>

        {/* Comments Section */}
        <Animated.View style={[styles.commentsDisplaySection, { opacity: fadeAnimation }]}>
          {comments.length > 0 ? (
            <View style={styles.commentsContainer}>
              {comments.map((comment) => (
                <View key={comment.id} style={styles.commentDisplayItem}>
                  <TouchableOpacity 
                    onPress={() => comment.user?.id && router.push(`/user/${comment.user.id}`)}
                    style={styles.commentUserRow}
                  >
                    <Text style={styles.commentDisplayAuthor}>{comment.user?.name || 'Unknown User'}</Text>
                    <Text style={styles.commentDisplayUsername}>@{comment.user?.username || 'unknown'}</Text>
                  </TouchableOpacity>
                  <Text style={styles.commentDisplayText}>{comment.content}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </Animated.View>


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
                      <Image 
                        source={post.user?.avatar ? { uri: post.user.avatar } : require('@/assets/images/icon.png')} 
                        style={styles.morePostsAvatar} 
                      />
                    </LinearGradient>
                  </View>
                  <View style={styles.morePostsUserDetails}>
                    <Text style={styles.morePostsTitle}>More from {post.user?.name?.split(' ')[0] || 'User'}</Text>
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
            
            <View style={styles.otherPostsList}>
              <View style={styles.otherPostsContent}>
                {(otherUserPosts || []).slice(0, 6).reduce((rows: any[][], item, index) => {
                  if (index % 2 === 0) rows.push([]);
                  rows[rows.length - 1].push(item);
                  return rows;
                }, []).map((row: any[], rowIndex: number) => (
                  <View key={rowIndex} style={styles.otherPostsRow}>
                    {row.map((item: any, itemIndex: number) => 
                      renderOtherPost({ item, index: rowIndex * 2 + itemIndex })
                    )}
                  </View>
                ))}
              </View>
            </View>
            
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

      {/* Comment Input */}
      {showCommentInput && (
        <Animated.View 
          style={[
            styles.commentInputContainer,
            { 
              bottom: keyboardHeight > 0 ? keyboardHeight - (Platform.OS === 'ios' ? 0 : 20) : 0
            }
          ]}
        >
          <LinearGradient
            colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)']}
            style={styles.commentInputGradient}
          >
            <BlurView intensity={20} tint="dark" style={styles.commentInputBlur}>
              <View style={styles.commentInputContent}>
                <TextInput
                  style={styles.commentInputField}
                  placeholder="Add a comment..."
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={commentText}
                  onChangeText={setCommentText}
                  multiline
                  autoFocus
                  onSubmitEditing={handleSendComment}
                  returnKeyType="send"
                />
                
                <TouchableOpacity 
                  style={[styles.sendButton, !commentText.trim() && styles.sendButtonDisabled]}
                  onPress={handleSendComment}
                  disabled={!commentText.trim()}
                >
                  <LinearGradient
                    colors={commentText.trim() ? ['#4ECDC4', '#44A08D'] : ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
                    style={styles.sendButtonGradient}
                  >
                    <Ionicons 
                      name="send" 
                      size={20} 
                      color={commentText.trim() ? "white" : "rgba(255,255,255,0.5)"} 
                    />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </BlurView>
          </LinearGradient>
        </Animated.View>
      )}
    </KeyboardAvoidingView>
  );
}