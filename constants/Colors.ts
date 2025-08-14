const tintColorLight = '#2f95dc';
const tintColorDark = '#fff';

export default {
  light: {
    text: '#000',
    background: '#fff',
    tint: tintColorLight,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorLight,
    // Custom colors
    primary: '#3B82F6', // Blue-500
    secondary: '#6B7280', // Gray-500
    accent: '#EC4899', // Pink-500
    cardBackground: '#FFFFFF',
    borderColor: '#E5E7EB', // Gray-200
    gradientStart: '#FEDA75',
    gradientEnd: '#4F5BD5',
  },
  dark: {
    text: '#fff',
    background: '#000',
    tint: tintColorDark,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorDark,
    // Custom colors
    primary: '#60A5FA', // Blue-400
    secondary: '#9CA3AF', // Gray-400
    accent: '#F472B6', // Pink-400
    cardBackground: '#1F2937', // Gray-800
    borderColor: '#374151', // Gray-700
    gradientStart: '#FEDA75',
    gradientEnd: '#4F5BD5',
  },
};