import { View, Text, FlatList, TextInput } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import CommentThread from '@/components/feed/CommentThread';
import PostCard from '@/components/feed/PostCard';
import { postsApi } from '@/lib/api';

export default function CommentsScreen() {
  let params;
  let postId;
  
  try {
    params = useLocalSearchParams();
    postId = params?.postId;
  } catch (error) {
    console.error('Error getting search params:', error);
    params = {};
    postId = null;
  }
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadPost = async () => {
    if (!postId) return;
    
    try {
      setLoading(true);
      console.log('Loading post for comments with ID:', postId);
      
      const postData = await postsApi.getPost(postId as string);
      console.log('Post loaded for comments:', postData);
      
      setPost(postData);
    } catch (error) {
      console.error('Error loading post for comments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPost();
  }, [postId]);

  if (!postId) {
    return (
      <View className="flex-1 bg-gray-50 dark:bg-black items-center justify-center">
        <Text className="text-gray-500">Invalid post ID.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 dark:bg-black items-center justify-center">
        <Text className="text-gray-500">Loading comments...</Text>
      </View>
    );
  }

  if (!post) {
    return (
      <View className="flex-1 bg-gray-50 dark:bg-black items-center justify-center">
        <Text className="text-gray-500">Post not found.</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50 dark:bg-black">
      <FlatList
        data={post.comments}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <CommentThread comment={item} />}
        ListHeaderComponent={<PostCard post={post} />}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
      <View className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
        <TextInput
          placeholder="Add a comment..."
          placeholderTextColor="#9CA3AF"
          className="w-full px-4 py-3 text-base text-gray-800 bg-gray-100 border border-gray-300 rounded-full focus:border-blue-500 focus:bg-white dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600"
        />
      </View>
    </View>
  );
}
