import { View, Text, Image } from 'react-native';

export default function CommentThread({ comment }) {
  return (
    <View className="flex-row items-start p-3 bg-white dark:bg-gray-900 rounded-lg mb-2 shadow-sm">
      <Image source={{ uri: comment.user.avatar }} className="w-10 h-10 rounded-full" />
      <View className="ml-3 flex-1">
        <Text className="font-bold text-gray-900 dark:text-white">{comment.user.name}</Text>
        <Text className="text-gray-700 dark:text-gray-300">{comment.text}</Text>
      </View>
    </View>
  );
}
