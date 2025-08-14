import { View, Text, FlatList, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { POSTS } from '@/constants/MockData';
import CommentThread from '@/components/feed/CommentThread';
import PostCard from '@/components/feed/PostCard';

export default function CommentsScreen() {
  const router = useRouter();
  const { postId } = useLocalSearchParams();
  const post = POSTS.find(p => p.id.toString() === postId);

  if (!post) {
    return <View><Text>Post not found.</Text></View>;
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
