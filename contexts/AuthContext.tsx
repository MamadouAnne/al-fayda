import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';

interface Profile {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  email?: string;
  bio?: string;
  verified: boolean;
  location?: string;
  website?: string;
  followers_count: number;
  following_count: number;
  posts_count: number;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (fullName: string, email: string, password: string, username: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Add a cache to prevent duplicate fetches
  const profileCache = useRef<{[key: string]: Profile | null}>({});
  const fetchingProfiles = useRef<{[key: string]: Promise<Profile | null>}>({});

  const fetchProfile = async (userId: string, authUser?: User): Promise<Profile | null> => {
    // Return cached profile if available
    if (profileCache.current[userId]) {
      console.log('Returning cached profile for user:', userId);
      return profileCache.current[userId];
    }

    // Return existing promise if already fetching
    const existingPromise = fetchingProfiles.current[userId];
    if (existingPromise) {
      console.log('Profile fetch already in progress for user:', userId);
      return await existingPromise;
    }

    console.log('=== Creating immediate profile for user:', userId, '===');
    
    // Create profile immediately from auth data - completely synchronous
    const fetchPromise = (async (): Promise<Profile | null> => {
      try {
        // Use passed authUser or fallback to getting it
        let currentAuthUser = authUser;
        if (!currentAuthUser) {
          console.log('No auth user passed, trying to get current user...');
          const { data: { user } } = await supabase.auth.getUser();
          currentAuthUser = user || undefined;
        }

        if (!currentAuthUser) {
          console.log('No auth user found at all');
          return null;
        }

        console.log('Creating profile from auth data...', currentAuthUser.email);
        const immediateProfile: Profile = {
          id: userId,
          email: currentAuthUser.email || '',
          name: currentAuthUser.user_metadata?.full_name || currentAuthUser.email?.split('@')[0] || 'User',
          username: currentAuthUser.user_metadata?.username || currentAuthUser.email?.split('@')[0] || 'user',
          avatar: currentAuthUser.user_metadata?.avatar_url || undefined,
          bio: undefined,
          verified: false,
          location: undefined,
          website: undefined,
          followers_count: 0,
          following_count: 0,
          posts_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        console.log('Immediate profile created:', immediateProfile);
        
        // Cache the profile
        profileCache.current[userId] = immediateProfile;
        
        // Try to sync with database in background (don't await)
        syncProfileToDatabase(immediateProfile).catch(error => {
          console.log('Background database sync failed:', error);
        });
        
        return immediateProfile;
        
      } catch (error) {
        console.error('Error creating immediate profile:', error);
        return null;
      } finally {
        // Clean up the pending fetch
        delete fetchingProfiles.current[userId];
      }
    })();

    // Cache the promise
    fetchingProfiles.current[userId] = fetchPromise;
    
    return fetchPromise;
  };

  const syncProfileToDatabase = async (profile: Profile): Promise<void> => {
    try {
      console.log('Attempting background database sync...');
      await supabase
        .from('user_profiles')
        .upsert(profile, { onConflict: 'id' });
      console.log('Profile synced to database');
    } catch (error) {
      console.log('Database sync failed, but profile still works locally:', error);
    }
  };

  const createFallbackProfile = async (userId: string): Promise<Profile | null> => {
    try {
      // Get user data from auth
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return null;

      console.log('Creating fallback profile with auth data...');
      const fallbackProfile: Partial<Profile> = {
        id: userId,
        email: authUser.email || '',
        name: authUser.email?.split('@')[0] || 'User',
        username: authUser.email?.split('@')[0] || 'user',
        verified: false,
        followers_count: 0,
        following_count: 0,
        posts_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Try to insert the profile
      const { data, error } = await supabase
        .from('user_profiles')
        .insert(fallbackProfile)
        .select()
        .single();

      if (error) {
        console.error('Error creating fallback profile:', error);
        // Return a local profile object for immediate use
        const localProfile = fallbackProfile as Profile;
        profileCache.current[userId] = localProfile;
        return localProfile;
      }

      console.log('Fallback profile created successfully');
      const createdProfile = data as Profile;
      profileCache.current[userId] = createdProfile;
      return createdProfile;

    } catch (error) {
      console.error('Error in createFallbackProfile:', error);
      return null;
    }
  };

  const refreshSession = async () => {
    try {
      setLoading(true);
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Session refresh error:', error);
        // If refresh token is invalid, clear the session
        if (error.message?.includes('Refresh Token Not Found') || error.message?.includes('Invalid Refresh Token')) {
          console.log('Refresh token invalid, clearing session...');
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          setProfile(null);
          return;
        }
      }
      
      if (currentSession) {
        setSession(currentSession);
        setUser(currentSession.user);
        
        // Fetch and set profile
        if (currentSession.user) {
          console.log('Refresh session found user, fetching profile...');
          const userProfile = await fetchProfile(currentSession.user.id);
          console.log('Refresh profile fetch result:', !!userProfile);
          setProfile(userProfile);
        }
      } else {
        setSession(null);
        setUser(null);
        setProfile(null);
      }
    } catch (error) {
      console.error('Error refreshing session:', error);
      // If it's a refresh token error, clear the session
      if (error instanceof Error && (error.message?.includes('Refresh Token') || error.message?.includes('Invalid'))) {
        console.log('Clearing invalid session...');
        setSession(null);
        setUser(null);
        setProfile(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial session fetch - simplified to avoid blocking
    const initializeAuth = async () => {
      try {
        console.log('Starting auth initialization...');
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Initial session fetch error:', error);
          // Clear everything on error
          setSession(null);
          setUser(null);
          setProfile(null);
        } else if (currentSession) {
          console.log('Initial session found');
          setSession(currentSession);
          setUser(currentSession.user);
          
          // Create basic profile without blocking
          if (currentSession.user) {
            const basicProfile: Profile = {
              id: currentSession.user.id,
              email: currentSession.user.email || '',
              name: currentSession.user.user_metadata?.full_name || currentSession.user.email?.split('@')[0] || 'User',
              username: currentSession.user.user_metadata?.username || currentSession.user.email?.split('@')[0] || 'user',
              avatar: currentSession.user.user_metadata?.avatar_url,
              bio: undefined,
              verified: false,
              location: undefined,
              website: undefined,
              followers_count: 0,
              following_count: 0,
              posts_count: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            setProfile(basicProfile);
          }
        } else {
          console.log('No initial session found');
          setSession(null);
          setUser(null);
          setProfile(null);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setSession(null);
        setUser(null);
        setProfile(null);
      } finally {
        console.log('Auth initialization completed, setting loading to false');
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('Auth state change:', event, currentSession ? 'session exists' : 'no session');
        
        if (currentSession) {
          console.log('Setting session and user from auth state change');
          setSession(currentSession);
          setUser(currentSession.user);
          
          // Create basic profile immediately
          if (currentSession.user) {
            const basicProfile: Profile = {
              id: currentSession.user.id,
              email: currentSession.user.email || '',
              name: currentSession.user.user_metadata?.full_name || currentSession.user.email?.split('@')[0] || 'User',
              username: currentSession.user.user_metadata?.username || currentSession.user.email?.split('@')[0] || 'user',
              avatar: currentSession.user.user_metadata?.avatar_url,
              bio: undefined,
              verified: false,
              location: undefined,
              website: undefined,
              followers_count: 0,
              following_count: 0,
              posts_count: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            setProfile(basicProfile);
          }
        } else {
          console.log('Clearing session and user data');
          setSession(null);
          setUser(null);
          setProfile(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error };
      }

      // Profile will be set by auth state change handler
      return { error: null };
    } catch (error) {
      console.error('Error signing in:', error);
      return { error };
    }
  };

  const signUp = async (fullName: string, email: string, password: string, username: string) => {
    try {
      // Basic validation (exact copy from senecom)
      if (!fullName.trim()) {
        alert('Please enter your full name');
        return { error: 'Please enter your full name' };
      }
      if (!email.trim()) {
        alert('Please enter your email');
        return { error: 'Please enter your email' };
      }
      if (!password.trim()) {
        alert('Please enter your password');
        return { error: 'Please enter your password' };
      }

      // EXACT copy of senecom's auth signup call
      const {
        data: { user },
      } = await supabase.auth.signUp({
        email,
        password,
      });

      if (user) {
        console.log('Registration data:', { 
          fullName: fullName, 
          email: email,
          username: username
        });

        // Create or update profile using upsert (exact copy from senecom but using user_profiles)
        const { error: profileError } = await supabase.from('user_profiles').upsert({
          id: user.id,
          name: fullName.trim(),
          username: username.trim(),
          email,
          verified: false,
          followers_count: 0,
          following_count: 0,
          posts_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id'
        });

        if (profileError) {
          console.error('Error creating profile:', profileError);
          return { error: 'Failed to create user profile: ' + profileError.message };
        }

        console.log('Profile created successfully');

        // EXACT copy from senecom - call signIn after successful registration
        await signIn(email, password);
      }
      
      return {};
    } catch (error) {
      console.error('Signup error:', error);
      return { error: 'An unexpected error occurred: ' + (error as Error).message };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const isAuthenticated = !!user && !!session;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        isAuthenticated,
        signIn,
        signUp,
        signOut,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;