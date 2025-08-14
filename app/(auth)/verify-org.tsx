import { Text, View } from 'react-native';
import { useState } from 'react';
import Input from '@/components/core/Input';
import Button from '@/components/core/Button';

export default function VerifyOrgScreen() {
  const [orgCode, setOrgCode] = useState('');

  const handleVerify = () => {
    // For now, just log the data. Later, this will call a Supabase function.
    console.log({ orgCode });
  };

  return (
    <View className="flex-1 items-center justify-center bg-white dark:bg-black p-8">
      <Text className="text-4xl font-bold mb-4 text-center text-gray-900 dark:text-white">Organization Code</Text>
      <Text className="text-lg text-gray-600 dark:text-gray-400 mb-8 text-center">Enter the code provided by your organization.</Text>
      <Input
        placeholder="ABC-123"
        value={orgCode}
        onChangeText={setOrgCode}
        autoCapitalize="characters"
      />
      <Button title="Verify & Continue" onPress={handleVerify} />
    </View>
  );
}
