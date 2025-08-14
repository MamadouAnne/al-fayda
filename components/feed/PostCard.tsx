import { View, Text, Image, TouchableOpacity, ScrollView, Dimensions, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState, useRef } from 'react';

const { width } = Dimensions.get('window');

interface Post {
  id: number;
  user: {
    id: number;
    name: string;
    username: string;
    avatar: string;
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
}

export default function PostCard({ post, index = 0 }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const likeAnimation = useRef(new Animated.Value(1)).current;
  const router = useRouter();

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
            <Image 
              source={{ uri: post.user.avatar }} 
              style={styles.avatar}
            />
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
      <TouchableOpacity onPress={handlePostPress} style={styles.imageSection}>
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
          {post.images.map((imageUrl, imgIndex) => (
            <Image 
              key={imgIndex}
              source={{ uri: imageUrl }} 
              style={styles.postImage}
            />
          ))}
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
      </TouchableOpacity>

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
});