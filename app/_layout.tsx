import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';

import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    // Hide splash screen once the layout is ready
    SplashScreen.hideAsync();
  }, []);

  return (
    <AuthProvider>
      <ThemeProvider>
        <RootLayoutNav />
      </ThemeProvider>
    </AuthProvider>
  )
}

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    console.log('Layout: Auth state check - loading:', loading, 'user:', !!user, 'segments:', segments);
    
    if (loading) {
      console.log('Layout: Still loading auth, waiting...');
      return; // Wait for auth to load
    }

    const inTabsGroup = segments[0] === '(tabs)';

    if (user) {
      console.log('Layout: User is signed in, checking if redirect needed');
      // User is signed in, redirect to home if they're not already in a protected route
      if (!inTabsGroup && segments[0] !== 'create-post' && segments[0] !== 'create-story' && segments[0] !== 'story-viewer' && segments[0] !== 'messages' && segments[0] !== 'chat' && segments[0] !== 'notifications' && segments[0] !== 'user' && segments[0] !== 'post' && segments[0] !== 'comments') {
        console.log('Layout: Redirecting to home...');
        router.replace('/(tabs)/home');
      } else {
        console.log('Layout: User already in protected route, no redirect needed');
      }
    } else {
      console.log('Layout: User not signed in, checking if protection needed');
      // User is not signed in, redirect to welcome/auth if they're trying to access protected routes
      if (inTabsGroup || segments[0] === 'create-post' || segments[0] === 'create-story' || segments[0] === 'story-viewer' || segments[0] === 'messages' || segments[0] === 'chat' || segments[0] === 'notifications' || segments[0] === 'user' || segments[0] === 'post' || segments[0] === 'comments') {
        console.log('Layout: Redirecting to welcome screen...');
        router.replace('/');
      }
    }
  }, [user, loading, segments]);

  return (
    <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="create-post" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="create-story" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="story-viewer" options={{ presentation: 'fullScreenModal', headerShown: false }} />
        <Stack.Screen name="comments" options={{ presentation: 'card', headerTitle: 'Comments' }} />
        <Stack.Screen name="messages" options={{ headerShown: false }} />
        <Stack.Screen name="chat/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="notifications" options={{ presentation: 'card', headerTitle: 'Notifications' }} />
        <Stack.Screen name="user/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="post/[id]" options={{ headerShown: false }} />
    </Stack>
  )
}
