import React, { useRef, useEffect } from 'react';
import { Tabs } from 'expo-router';
import { 
  View, 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  Animated, 
  Dimensions,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

interface TabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

function CustomTabBar({ state, descriptors, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const floatingAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatingAnimation, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(floatingAnimation, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const floatingY = floatingAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -2],
  });

  // Consistent gradient for all selected tabs
  const activeGradient = ['#667eea', '#764ba2'];
  
  const tabInfo = [
    { 
      name: 'home', 
      icon: 'home', 
      activeIcon: 'home', 
      label: 'Home',
      gradient: activeGradient
    },
    { 
      name: 'search', 
      icon: 'compass-outline', 
      activeIcon: 'compass', 
      label: 'Discover',
      gradient: activeGradient
    },
    { 
      name: 'friends', 
      icon: 'people-outline', 
      activeIcon: 'people', 
      label: 'Friends',
      gradient: activeGradient
    },
    { 
      name: 'profile', 
      icon: 'person-outline', 
      activeIcon: 'person', 
      label: 'Profile',
      gradient: activeGradient
    },
  ];

  return (
    <View style={[styles.tabBarContainer, { paddingBottom: insets.bottom }]}>
      {/* Background with gradient and blur */}
      <LinearGradient
        colors={['rgba(40, 40, 40, 0.9)', 'rgba(60, 60, 60, 0.8)']} // Lighter colors
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.backgroundGradient}
      >
        <BlurView intensity={30} tint="light" style={styles.backgroundBlur} />
      </LinearGradient>
      
      {/* Decorative top border */}
      <View style={styles.topBorder} />
      
      {/* Tab bar content */}
      <View style={styles.tabBarContent}>
            {state.routes.map((route: any, index: number) => {
              const { options } = descriptors[route.key];
              const isFocused = state.index === index;
              const tabData = tabInfo.find(tab => tab.name === route.name);

              if (!tabData) return null;

              const onPress = () => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });

                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              };

              return (
                <Animated.View
                  key={route.name}
                  style={[
                    styles.tabItem,
                    {
                      transform: [{
                        translateY: floatingAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, index % 2 === 0 ? -1 : 1],
                        })
                      }]
                    }
                  ]}
                >
                  <TouchableOpacity
                    onPress={onPress}
                    style={styles.tabButton}
                    activeOpacity={0.8}
                  >
                    {isFocused ? (
                      <LinearGradient
                        colors={tabData.gradient as [string, string]}
                        style={styles.activeTabGradient}
                      >
                        <BlurView intensity={10} tint="light" style={styles.activeTabBlur}>
                          <View style={styles.tabContent}>
                            <Ionicons 
                              name={tabData.activeIcon as any} 
                              size={22} 
                              color="white" 
                            />
                            <Text style={styles.activeTabLabel}>{tabData.label}</Text>
                            <View style={styles.activeIndicator} />
                          </View>
                        </BlurView>
                      </LinearGradient>
                    ) : (
                      <View style={styles.inactiveTab}>
                        <View style={styles.tabContent}>
                          <Ionicons 
                            name={tabData.icon as any} 
                            size={20} 
                            color="rgba(255,255,255,0.7)" 
                          />
                          <Text style={styles.inactiveTabLabel}>{tabData.label}</Text>
                        </View>
                      </View>
                    )}
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
      </View>
      
      {/* Decorative orbs */}
      <View style={styles.orb} />
      <View style={[styles.orb, { right: 30, top: 10, width: 8, height: 8, opacity: 0.6 }]} />
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Discover',
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: 'Friends',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    height: 80, // Reduced from 100
    backgroundColor: 'transparent',
    justifyContent: 'flex-start',
    paddingTop: 20, // Reduced from 40
    overflow: 'hidden',
  },
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  backgroundBlur: {
    ...StyleSheet.absoluteFillObject,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  topBorder: {
    position: 'absolute',
    top: 0,
    left: '30%',
    right: '30%',
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderBottomLeftRadius: 1.5,
    borderBottomRightRadius: 1.5,
  },
  orb: {
    position: 'absolute',
    width: 10, // Slightly smaller
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    left: 30,
    top: 10, // Moved up
    opacity: 0.8,
  },
  tabBarContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    width: '100%',
    paddingBottom: 8,
    paddingHorizontal: 8,
    height: 50, // Reduced from 60
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 48, // Fixed height for consistency
    width: '100%',
    borderRadius: 12, // Rounded corners for buttons
  },
  activeTabGradient: {
    borderRadius: 12,
    height: 40,
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 2,
  },
  activeTabBlur: {
    flex: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    position: 'relative',
  },
  inactiveTab: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    width: '90%',
    borderRadius: 12,
    backgroundColor: 'transparent', // Removed background from inactive tabs
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    position: 'relative',
  },
  activeTabLabel: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  inactiveTabLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -4,
    width: 30,
    height: 2,
    backgroundColor: 'white',
    borderRadius: 1,
    opacity: 0.8,
  },
});
