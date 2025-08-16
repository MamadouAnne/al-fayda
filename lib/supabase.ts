import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL or Anon Key is missing.');
}

// Create platform-aware storage
const platformStorage = Platform.OS === 'web' ? undefined : AsyncStorage;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: platformStorage,
    autoRefreshToken: true,
    persistSession: Platform.OS !== 'web',
    detectSessionInUrl: Platform.OS === 'web',
  },
});

// Database Types
export interface User {
  id: string;
  email: string;
  name: string;
  username: string;
  avatar?: string;
  bio?: string;
  verified: boolean;
  location?: string;
  website?: string;
  followers_count: number;
  following_count: number;
  posts_count: number;
  created_at: string;
  updated_at: string;
  hasStory?: boolean;
}

export interface Post {
  id: string;
  user_id: string;
  user?: User;
  content: string;
  images?: string[];
  likes_count: number;
  comments_count: number;
  shares_count: number;
  saves_count: number;
  location?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  user?: User;
  content: string;
  likes_count: number;
  created_at: string;
  updated_at: string;
}

export interface Like {
  id: string;
  user_id: string;
  post_id?: string;
  comment_id?: string;
  created_at: string;
}

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'like' | 'comment' | 'follow' | 'mention' | 'friend_request' | 'achievement';
  title: string;
  message: string;
  read: boolean;
  data?: any;
  created_at: string;
}

export interface Chat {
  id: string;
  name?: string;
  is_group: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChatMember {
  id: string;
  chat_id: string;
  user_id: string;
  user?: User;
  joined_at: string;
}

export interface Message {
  id: string;
  chat_id: string;
  user_id: string;
  user?: User;
  content: string;
  type: 'text' | 'image' | 'file';
  created_at: string;
}

export interface Story {
  id: string;
  user_id: string;
  user?: User;
  media_url: string;
  media_type: 'image' | 'video';
  content?: string;
  views_count: number;
  expires_at: string;
  created_at: string;
}

// Utility function to get avatar URL from Supabase storage
export const getAvatarUrl = (avatarPath: string | null | undefined): string | null => {
  if (!avatarPath) return null;
  
  // If it's already a full URL (like senecom), return as is
  if (avatarPath.startsWith('http')) {
    return avatarPath;
  }
  
  // For legacy filename-only entries, generate public URL from storage
  try {
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(avatarPath);
    return publicUrl;
  } catch (error) {
    console.error('Error generating avatar public URL:', error);
    return null;
  }
};

// Utility function to check and sync user avatar from storage
export const syncUserAvatar = async (userId: string): Promise<string | null> => {
  try {
    const { data: files, error } = await supabase.storage
      .from('avatars')
      .list('', {
        search: `avatar_${userId}_`,
        sortBy: { column: 'name', order: 'desc' },
        limit: 1,
      });

    if (error) {
      console.error('Error listing avatar files:', error);
      return null;
    }

    if (files && files.length > 0) {
      const latestAvatar = files[0];
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(latestAvatar.name);

      // Update user profile
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ avatar: publicUrl, updated_at: new Date().toISOString() })
        .eq('id', userId);
        
      if (updateError) {
        console.error('Error updating user avatar in database:', updateError);
      } else {
        console.log('Successfully synced avatar for user:', userId);
      }

      return publicUrl;
    }

    return null;
  } catch (error) {
    console.error('Error syncing user avatar:', error);
    return null;
  }
};
