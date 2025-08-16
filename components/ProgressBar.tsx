import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

interface ProgressBarProps {
  progress: number; // 0-100
  height?: number;
  backgroundColor?: string;
  progressColor?: string;
  showPercentage?: boolean;
  label?: string;
  animated?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  height = 6,
  backgroundColor = '#E5E7EB',
  progressColor = '#667eea',
  showPercentage = false,
  label,
  animated = true,
}) => {
  const progressValue = React.useRef(new Animated.Value(0)).current;
  
  React.useEffect(() => {
    if (animated) {
      Animated.timing(progressValue, {
        toValue: progress,
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else {
      progressValue.setValue(progress);
    }
  }, [progress, animated, progressValue]);

  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <View style={styles.container}>
      {(label || showPercentage) && (
        <View style={styles.labelContainer}>
          {label && <Text style={styles.label}>{label}</Text>}
          {showPercentage && (
            <Text style={styles.percentage}>{Math.round(clampedProgress)}%</Text>
          )}
        </View>
      )}
      
      <View style={[styles.progressTrack, { height, backgroundColor }]}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              height,
              backgroundColor: progressColor,
              width: animated 
                ? progressValue.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', '100%'],
                    extrapolate: 'clamp',
                  })
                : `${clampedProgress}%`,
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },
  percentage: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '600',
  },
  progressTrack: {
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    borderRadius: 999,
  },
});

export default ProgressBar;