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
      name: 'notifications', 
      icon: 'notifications-outline', 
      activeIcon: 'notifications', 
      label: 'Alerts',
      gradient: activeGradient,
      badge: 3
    },
    { 
      name: 'messages', 
      icon: 'mail-outline', 
      activeIcon: 'mail', 
      label: 'Messages',
      gradient: activeGradient,
      badge: 2
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
                            <View style={styles.iconContainer}>
                              <Ionicons 
                                name={tabData.activeIcon as any} 
                                size={22} 
                                color="white" 
                              />
                              {tabData.badge && (
                                <View style={styles.badge}>
                                  <Text style={styles.badgeText}>{tabData.badge}</Text>
                                </View>
                              )}
                            </View>
                            <Text style={styles.activeTabLabel}>{tabData.label}</Text>
                            <View style={styles.activeIndicator} />
                          </View>
                        </BlurView>
                      </LinearGradient>
                    ) : (
                      <View style={styles.inactiveTab}>
                        <View style={styles.tabContent}>
                          <View style={styles.iconContainer}>
                            <Ionicons 
                              name={tabData.icon as any} 
                              size={20} 
                              color="rgba(255,255,255,0.7)" 
                            />
                            {tabData.badge && (
                              <View style={styles.badge}>
                                <Text style={styles.badgeText}>{tabData.badge}</Text>
                              </View>
                            )}
                          </View>
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
        name="notifications"
        options={{
          title: 'Notifications',
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
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
    height: 85, // Slightly taller for 6 tabs
    backgroundColor: 'transparent',
    justifyContent: 'flex-start',
    paddingTop: 15, // Reduced further
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
    paddingHorizontal: 4, // Reduced for more space
    height: 55, // Slightly taller
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 52, // Increased height for taller background
    width: '100%',
    borderRadius: 12, // Rounded corners for buttons
  },
  activeTabGradient: {
    borderRadius: 12,
    height: '100%', // Full height
    width: '100%', // Full width
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 2,
  },
  activeTabBlur: {
    flex: 1,
    borderRadius: 12, // Match the gradient border radius
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    position: 'relative',
  },
  inactiveTab: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%', // Full height to match active
    width: '100%', // Full width to match active
    borderRadius: 12,
    backgroundColor: 'transparent', // Removed background from inactive tabs
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    position: 'relative',
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'white',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  activeTabLabel: {
    color: 'white',
    fontSize: 9, // Smaller for 6 tabs
    fontWeight: '700',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  inactiveTabLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 8, // Smaller for 6 tabs
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
