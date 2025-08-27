import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { PostInteractionProvider } from '@/contexts/PostInteractionContext';

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
        <PostInteractionProvider>
          <RootLayoutNav />
        </PostInteractionProvider>
      </ThemeProvider>
    </AuthProvider>
  )
}

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    try {
      if (loading) {
        return; // Wait for auth to load
      }

      const inTabsGroup = segments[0] === '(tabs)';
      const protectedRoutes = ['create-post', 'create-story', 'story-viewer', 'messages', 'chat', 'notifications', 'user', 'post', 'comments', 'edit-profile'];
      const isInProtectedRoute = inTabsGroup || protectedRoutes.includes(segments[0]);

      if (user) {
        // User is signed in, redirect to home if they're not already in a protected route
        if (!isInProtectedRoute) {
          router.replace('/(tabs)/home');
        }
      } else {
        // User is not signed in, redirect to welcome/auth if they're trying to access protected routes
        if (isInProtectedRoute) {
          router.replace('/');
        }
      }
    } catch (error) {
      console.error('Navigation error in RootLayoutNav:', error);
      // Fallback navigation to prevent app freeze
      if (!user) {
        router.replace('/');
      }
    }
  }, [user, loading, segments]);

  return (
    <Stack screenOptions={{
      headerShown: false,
      animation: 'fade',
      contentStyle: { backgroundColor: '#0f0f23' },
    }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="create-post" options={{ presentation: 'modal', headerShown: false }} />
      <Stack.Screen name="create-story" options={{ presentation: 'modal', headerShown: false }} />
      <Stack.Screen name="story-viewer" options={{ presentation: 'fullScreenModal', headerShown: false }} />
      <Stack.Screen name="edit-profile" options={{ presentation: 'card', headerShown: false }} />
      <Stack.Screen name="comments" options={{ presentation: 'card', headerTitle: 'Comments' }} />
      <Stack.Screen name="messages" options={{ headerShown: false }} />
      <Stack.Screen name="chat/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="notifications" options={{ presentation: 'card', headerTitle: 'Notifications' }} />
      <Stack.Screen name="user/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="user/[id]/follow-tabs" options={{ headerShown: false }} />
      <Stack.Screen name="post/[id]" options={{ headerShown: false }} />
    </Stack>
  )
}
