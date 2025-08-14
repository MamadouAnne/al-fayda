import { View, Text, TextInput, TouchableOpacity, Image } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import Button from '@/components/core/Button';

export default function CreatePostScreen() {
  const router = useRouter();
  const [caption, setCaption] = useState('');
  const [image, setImage] = useState(null);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  return (
    <View className="flex-1 bg-white dark:bg-black p-4">
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-2xl font-bold text-gray-900 dark:text-white">Create Post</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-blue-500 text-lg">Cancel</Text>
        </TouchableOpacity>
      </View>
      
      <TextInput
        placeholder="What's on your mind?"
        placeholderTextColor="#9CA3AF"
        value={caption}
        onChangeText={setCaption}
        multiline
        className="h-32 w-full px-4 py-3 mb-4 text-base text-gray-800 bg-gray-100 border border-gray-300 rounded-lg focus:border-blue-500 focus:bg-white dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600"
      />

      <TouchableOpacity onPress={pickImage} className="mb-4 p-4 border border-dashed border-gray-400 rounded-lg items-center justify-center">
        {image ? (
          <Image source={{ uri: image }} className="w-full h-48 rounded-lg" />
        ) : (
          <Text className="text-gray-500 dark:text-gray-400">Tap to select an image/video</Text>
        )}
      </TouchableOpacity>

      <Button title="Post" onPress={() => console.log('Create post')} />
    </View>
  );
}
