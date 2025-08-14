import { View, Text, Image } from 'react-native';

export default function OrgHeader({ organization }) {
  return (
    <View className="w-full bg-blue-600 p-4 flex-row items-center rounded-b-2xl">
      <Image source={{ uri: organization.logo }} className="w-10 h-10 rounded-full bg-white" />
      <Text className="ml-4 text-xl font-bold text-white">{organization.name}</Text>
    </View>
  );
}
