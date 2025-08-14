import { View, Text, Image, TouchableOpacity } from 'react-native';

interface User {
  id: number;
  name: string;
  avatar: string;
}

interface UserListItemProps {
  user: User;
  onPress: () => void;
}

export default function UserListItem({ user, onPress }: UserListItemProps) {
  return (
    <TouchableOpacity onPress={onPress} className="flex-row items-center p-3 bg-white dark:bg-gray-900 rounded-lg mb-2">
      <Image source={{ uri: user.avatar }} className="w-12 h-12 rounded-full" />
      <Text className="ml-4 font-bold text-lg text-gray-900 dark:text-white">{user.name}</Text>
    </TouchableOpacity>
  );
}
