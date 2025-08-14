import { TouchableOpacity, Text, TouchableOpacityProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary';
}

export default function Button({ title, variant = 'primary', ...props }: ButtonProps) {
  if (variant === 'secondary') {
    return (
      <TouchableOpacity
        className="w-full py-4 bg-gray-100 dark:bg-gray-800 rounded-2xl active:bg-gray-200 dark:active:bg-gray-700 shadow-sm"
        {...props}
      >
        <Text className="text-base font-semibold text-center text-gray-800 dark:text-gray-200">
          {title}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity className="w-full rounded-2xl shadow-lg" {...props}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        className="py-4 rounded-2xl"
      >
        <Text className="text-base font-semibold text-center text-white">
          {title}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}
