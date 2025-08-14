import { View, Text, Image } from 'react-native';
import Button from '@/components/core/Button';

export default function ProfileHeader({ user }) {
  return (
    <View className="items-center w-full p-4">
      <Image source={{ uri: user.avatar }} className="w-24 h-24 rounded-full border-4 border-white dark:border-gray-800" />
      <Text className="text-2xl font-bold mt-4 text-gray-900 dark:text-white">{user.name}</Text>
      <Text className="text-center text-gray-600 dark:text-gray-400 my-2">{user.bio}</Text>
      <View className="flex-row justify-around w-full my-4">
        <View className="items-center">
          <Text className="text-xl font-bold text-gray-900 dark:text-white">{user.posts.length}</Text>
          <Text className="text-gray-500 dark:text-gray-400">Posts</Text>
        </View>
        <View className="items-center">
          <Text className="text-xl font-bold text-gray-900 dark:text-white">{user.friends}</Text>
          <Text className="text-gray-500 dark:text-gray-400">Friends</Text>
        </View>
      </View>
      <Button title="Edit Profile" onPress={() => {}} />
    </View>
  );
}
