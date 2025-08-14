import { TextInput, TextInputProps } from 'react-native';

export default function Input(props: TextInputProps) {
  return (
    <TextInput
      className="w-full px-5 py-4 mb-4 text-base text-gray-800 bg-gray-50 border border-gray-200 rounded-2xl focus:border-blue-500 focus:bg-white dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 shadow-sm"
      placeholderTextColor="#9CA3AF"
      {...props}
    />
  );
}
