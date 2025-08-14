import { View, Text, TouchableOpacity, StatusBar, Animated, Dimensions, Image, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useState, useRef, useEffect } from 'react';
import { POSTS } from '@/constants/MockData';

const { width } = Dimensions.get('window');

export default function IndexScreen() {
  const router = useRouter();
  const [currentFeature, setCurrentFeature] = useState(0);
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const slideAnimation = useRef(new Animated.Value(100)).current;

  const features = [
    {
      title: 'Connect & Share',
      description: 'Share your moments with beautiful posts and stories',
      image: POSTS[0]?.images[0] || 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=500&q=80',
      icon: 'heart'
    },
    {
      title: 'Discover Content',
      description: 'Explore trending topics and find new creators',
      image: POSTS[1]?.images[0] || 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=500&q=80',
      icon: 'compass'
    },
    {
      title: 'Build Community',
      description: 'Connect with friends and grow your network',
      image: POSTS[2]?.images[0] || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500&q=80',
      icon: 'people'
    }
  ];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnimation, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnimation, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Background Pattern */}
      <View style={StyleSheet.absoluteFillObject}>
        <Animated.View 
          style={[
            styles.backgroundShape1,
            {
              opacity: fadeAnimation,
              transform: [{ rotate: '45deg' }]
            }
          ]}
        />
        <Animated.View 
          style={[
            styles.backgroundShape2,
            {
              opacity: fadeAnimation,
              transform: [{ rotate: '-15deg' }]
            }
          ]}
        />
        <Animated.View 
          style={[
            styles.backgroundShape3,
            { opacity: fadeAnimation }
          ]}
        />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View 
          style={[
            styles.headerContainer,
            {
              opacity: fadeAnimation,
              transform: [{ translateY: slideAnimation }]
            }
          ]}
        >
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>AF</Text>
          </View>
          
          <Text style={styles.titleText}>al-fayda</Text>
          <Text style={styles.subtitleText}>
            The Social Experience
          </Text>
          <Text style={styles.taglineText}>
            Connect • Create • Collaborate
          </Text>
        </Animated.View>

        {/* Feature Showcase */}
        <Animated.View 
          style={[
            styles.featureShowcase,
            {
              opacity: fadeAnimation,
              transform: [{ translateY: slideAnimation }]
            }
          ]}
        >
          <View style={styles.featureCard}>
            <View style={styles.featureContent}>
              <View style={styles.featureImageContainer}>
                <Image 
                  source={{ uri: features[currentFeature].image }}
                  style={styles.featureImage}
                />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.6)']}
                  style={styles.featureOverlay}
                >
                  <View style={styles.featureIconRow}>
                    <Ionicons name={features[currentFeature].icon as any} size={20} color="white" />
                    <Text style={styles.featureOverlayText}>{features[currentFeature].title}</Text>
                  </View>
                </LinearGradient>
              </View>
              
              <Text style={styles.featureTitleText}>
                {features[currentFeature].title}
              </Text>
              <Text style={styles.featureDescText}>
                {features[currentFeature].description}
              </Text>
            </View>

            {/* Feature Indicators */}
            <View style={styles.indicatorContainer}>
              {features.map((_, index) => (
                <View 
                  key={index}
                  style={[
                    styles.indicator,
                    { backgroundColor: index === currentFeature ? 'white' : 'rgba(255,255,255,0.3)' }
                  ]}
                />
              ))}
            </View>
          </View>
        </Animated.View>

        {/* Features Grid */}
        <Animated.View 
          style={[
            styles.featuresGrid,
            {
              opacity: fadeAnimation,
              transform: [{ translateY: slideAnimation }]
            }
          ]}
        >
          <Text style={styles.sectionTitle}>
            Why Choose al-fayda?
          </Text>
          
          <View style={styles.gridContainer}>
            {[
              { icon: 'flash', title: 'Lightning Fast', desc: 'Optimized for speed' },
              { icon: 'shield-checkmark', title: 'Secure', desc: 'Your privacy matters' },
              { icon: 'color-palette', title: 'Beautiful', desc: 'Stunning design' },
              { icon: 'people', title: 'Community', desc: 'Connect with others' }
            ].map((feature, index) => (
              <View key={index} style={styles.gridItem}>
                <View style={styles.gridIcon}>
                  <Ionicons name={feature.icon as any} size={20} color="white" />
                </View>
                <Text style={styles.gridTitle}>{feature.title}</Text>
                <Text style={styles.gridDesc}>{feature.desc}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View 
          style={[
            styles.actionContainer,
            {
              opacity: fadeAnimation,
              transform: [{ translateY: slideAnimation }]
            }
          ]}
        >
          <TouchableOpacity 
            onPress={() => router.replace('/(tabs)/home')}
            style={styles.primaryButton}
          >
            <Ionicons name="compass" size={20} color="#667eea" />
            <Text style={styles.primaryButtonText}>
              Explore
            </Text>
          </TouchableOpacity>

          <View style={styles.secondaryButtonRow}>
            <TouchableOpacity 
              onPress={() => router.push('/(auth)/sign-in')}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>Sign In</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => router.push('/(auth)/sign-up')}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Join thousands of users already using al-fayda
            </Text>
            <View style={styles.ratingRow}>
              <View style={styles.starRow}>
                {[1,2,3,4,5].map(i => (
                  <Ionicons key={i} name="star" size={16} color="#FFD700" />
                ))}
              </View>
              <Text style={styles.ratingText}>4.9/5 from 12k+ reviews</Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundShape1: {
    position: 'absolute',
    top: 80,
    right: 40,
    width: 128,
    height: 128,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 64,
  },
  backgroundShape2: {
    position: 'absolute',
    top: 160,
    left: 20,
    width: 96,
    height: 96,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
  },
  backgroundShape3: {
    position: 'absolute',
    bottom: 160,
    right: 32,
    width: 80,
    height: 80,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 40,
  },
  scrollView: {
    flex: 1,
  },
  headerContainer: {
    alignItems: 'center',
    paddingTop: 64,
    paddingHorizontal: 32,
  },
  logoContainer: {
    width: 96,
    height: 96,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  logoText: {
    fontSize: 36,
    fontWeight: '900',
    color: 'white',
  },
  titleText: {
    fontSize: 48,
    fontWeight: '900',
    color: 'white',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitleText: {
    fontSize: 20,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 8,
  },
  taglineText: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 48,
  },
  featureShowcase: {
    paddingHorizontal: 32,
    marginBottom: 48,
  },
  featureCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  featureContent: {
    alignItems: 'center',
    marginBottom: 24,
  },
  featureImageContainer: {
    width: 192,
    height: 192,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  featureImage: {
    width: '100%',
    height: '100%',
  },
  featureOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    justifyContent: 'flex-end',
    padding: 16,
  },
  featureIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureOverlayText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  featureTitleText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  featureDescText: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  featuresGrid: {
    paddingHorizontal: 32,
    marginBottom: 48,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 24,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  gridIcon: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  gridTitle: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 4,
  },
  gridDesc: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  actionContainer: {
    paddingHorizontal: 32,
    paddingBottom: 48,
  },
  primaryButton: {
    backgroundColor: 'white',
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  primaryButtonText: {
    color: '#667eea',
    fontWeight: 'bold',
    fontSize: 18,
    marginLeft: 8,
  },
  secondaryButtonRow: {
    flexDirection: 'row',
    gap: 16,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  secondaryButtonText: {
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    marginTop: 32,
  },
  footerText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    textAlign: 'center',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  starRow: {
    flexDirection: 'row',
    marginRight: 8,
  },
  ratingText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
});