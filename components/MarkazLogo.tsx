import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

interface MarkazLogoProps {
  size?: 'small' | 'medium' | 'large';
  style?: any;
}

export default function MarkazLogo({ size = 'medium', style }: MarkazLogoProps) {
  const sizeStyles = {
    small: {
      container: { height: 35 },
      text: { fontSize: 16, letterSpacing: 2.5 },
      accent: { width: 24, height: 2 }
    },
    medium: {
      container: { height: 50 },
      text: { fontSize: 24, letterSpacing: 3 },
      accent: { width: 36, height: 3 }
    },
    large: {
      container: { height: 65 },
      text: { fontSize: 32, letterSpacing: 4 },
      accent: { width: 48, height: 4 }
    }
  };

  const currentSize = sizeStyles[size];

  return (
    <View style={[styles.container, currentSize.container, style]}>
      <BlurView intensity={25} style={styles.logoBlur}>
        <LinearGradient
          colors={['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.06)', 'rgba(255,255,255,0.02)']}
          style={styles.logoGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Background glow effect */}
          <View style={styles.backgroundGlow} />
          
          <View style={styles.logoContent}>
            <Text style={[styles.logoText, currentSize.text]}>
              MARKAZ
            </Text>
            
            <View style={styles.accentContainer}>
              <LinearGradient
                colors={['rgba(78,205,196,0.9)', 'rgba(255,107,107,0.9)', 'rgba(69,183,209,0.9)']}
                style={[styles.accentLine, currentSize.accent]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
              
              {/* Accent line glow */}
              <LinearGradient
                colors={['rgba(78,205,196,0.3)', 'rgba(255,107,107,0.3)', 'rgba(69,183,209,0.3)']}
                style={[styles.accentGlow, currentSize.accent]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </View>
          </View>

          {/* Enhanced floating elements */}
          <View style={styles.floatingElements}>
            <View style={[styles.sparkle, styles.sparkle1]} />
            <View style={[styles.sparkle, styles.sparkle2]} />
            <View style={[styles.sparkle, styles.sparkle3]} />
            <View style={[styles.orb, styles.orb1]} />
            <View style={[styles.orb, styles.orb2]} />
          </View>
        </LinearGradient>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBlur: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.04)',
    shadowColor: 'rgba(78,205,196,0.3)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
  },
  logoGradient: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 16,
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  backgroundGlow: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    backgroundColor: 'rgba(78,205,196,0.05)',
    borderRadius: 26,
    zIndex: 0,
  },
  logoContent: {
    alignItems: 'center',
    position: 'relative',
    zIndex: 3,
  },
  logoText: {
    color: 'white',
    fontWeight: '800',
    textAlign: 'center',
    textShadowColor: 'rgba(78,205,196,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
    includeFontPadding: false,
    opacity: 0.95,
  },
  accentContainer: {
    marginTop: 3,
    alignItems: 'center',
    position: 'relative',
  },
  accentLine: {
    borderRadius: 1,
    shadowColor: 'rgba(78,205,196,0.8)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  accentGlow: {
    position: 'absolute',
    borderRadius: 2,
    transform: [{ scaleX: 1.5 }, { scaleY: 2 }],
    opacity: 0.6,
  },
  floatingElements: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  sparkle: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 1,
  },
  sparkle1: {
    width: 2,
    height: 2,
    top: 6,
    right: 10,
    backgroundColor: 'rgba(78,205,196,0.7)',
    shadowColor: 'rgba(78,205,196,0.8)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  sparkle2: {
    width: 1.5,
    height: 1.5,
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(255,107,107,0.7)',
    shadowColor: 'rgba(255,107,107,0.8)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 3,
  },
  sparkle3: {
    width: 1,
    height: 1,
    top: '60%',
    right: 6,
    backgroundColor: 'rgba(69,183,209,0.8)',
    shadowColor: 'rgba(69,183,209,0.9)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 2,
  },
  orb: {
    position: 'absolute',
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  orb1: {
    width: 8,
    height: 8,
    top: 4,
    left: 4,
    backgroundColor: 'rgba(78,205,196,0.15)',
  },
  orb2: {
    width: 6,
    height: 6,
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(69,183,209,0.15)',
  },
});