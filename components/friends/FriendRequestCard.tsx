import { View, Text, Image, TouchableOpacity } from 'react-native';

interface User {
  id: number;
  name: string;
  avatar: string;
}

interface FriendRequest {
  id: number;
  user: User;
  timestamp: string;
}

interface FriendRequestCardProps {
  request: FriendRequest;
  onAccept: () => void;
  onReject: () => void;
}

export default function FriendRequestCard({ request, onAccept, onReject }: FriendRequestCardProps) {
  return (
    <View className="flex-row items-center p-3 bg-white dark:bg-gray-900 rounded-lg mb-2 shadow-sm">
      <Image source={{ uri: request.user.avatar }} className="w-12 h-12 rounded-full" />
      <View className="flex-1 ml-4">
        <Text className="font-bold text-lg text-gray-900 dark:text-white">{request.user.name}</Text>
        <Text className="text-sm text-gray-500 dark:text-gray-400">Wants to be your friend</Text>
      </View>
      <View className="flex-row space-x-2">
        <TouchableOpacity onPress={onAccept} className="px-4 py-2 bg-blue-600 rounded-lg">
          <Text className="font-bold text-white">Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onReject} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg">
          <Text className="font-bold text-gray-800 dark:text-gray-200">Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
