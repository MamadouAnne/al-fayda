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

// Utility function to get story media URL from Supabase storage
export const getStoryMediaUrl = (mediaPath: string | null | undefined): string | null => {
  console.log('📸 Processing story media:', mediaPath);
  
  if (!mediaPath) {
    console.log('❌ No media path provided');
    return null;
  }
  
  // If it's already a full HTTP URL, return as is
  if (mediaPath.startsWith('http')) {
    console.log('✅ Already a full URL:', mediaPath);
    return mediaPath;
  }
  
  // If it's a local file path (starts with file://), skip it
  if (mediaPath.startsWith('file://')) {
    console.log('❌ Local file path detected, skipping:', mediaPath);
    return null;
  }
  
  // If it contains local device paths, skip it
  if (mediaPath.includes('/data/user/') || mediaPath.includes('/cache/') || mediaPath.includes('ExperienceData')) {
    console.log('❌ Local device path detected, skipping:', mediaPath);
    return null;
  }
  
  // Generate public URL from storage for valid storage paths
  try {
    const { data: { publicUrl } } = supabase.storage
      .from('stories')
      .getPublicUrl(mediaPath);
    console.log('✅ Generated story public URL:', publicUrl);
    return publicUrl;
  } catch (error) {
    console.error('❌ Error generating story media public URL:', error);
    return null; // Return null instead of invalid path
  }
};

// Utility function to get post image URLs from Supabase storage
export const getPostImageUrls = (imagePaths: string[] | null | undefined): string[] => {
  console.log('🖼️ Processing post images:', imagePaths);
  
  if (!imagePaths || !Array.isArray(imagePaths)) {
    console.log('❌ No image paths provided or not an array');
    return [];
  }
  
  const processedUrls = imagePaths.map(imagePath => {
    console.log('🔄 Processing image path:', imagePath);
    
    if (!imagePath) {
      console.log('❌ Empty image path');
      return '';
    }
    
    // If it's already a full HTTP URL, return as is
    if (imagePath.startsWith('http')) {
      console.log('✅ Already a full URL:', imagePath);
      return imagePath;
    }
    
    // If it's a local file path (starts with file://), skip it
    if (imagePath.startsWith('file://')) {
      console.log('❌ Local file path detected, skipping:', imagePath);
      return '';
    }
    
    // If it contains local device paths, skip it
    if (imagePath.includes('/data/user/') || imagePath.includes('/cache/') || imagePath.includes('ExperienceData')) {
      console.log('❌ Local device path detected, skipping:', imagePath);
      return '';
    }
    
    // Generate public URL from storage for valid storage paths
    try {
      const { data: { publicUrl } } = supabase.storage
        .from('posts')
        .getPublicUrl(imagePath);
      console.log('✅ Generated public URL:', publicUrl);
      return publicUrl;
    } catch (error) {
      console.error('❌ Error generating post image public URL:', error);
      return ''; // Return empty string instead of invalid path
    }
  }).filter(url => url !== ''); // Remove empty URLs
  
  console.log('🎯 Final processed URLs:', processedUrls);
  return processedUrls;
};

// Utility function to ensure bucket exists
const ensureBucketExists = async (bucketName: string): Promise<boolean> => {
  try {
    // Try to list files in the bucket to check if it exists
    const { data, error } = await supabase.storage.from(bucketName).list('', { limit: 1 });
    
    if (error) {
      console.log(`⚠️ Bucket '${bucketName}' might not exist:`, error.message);
      return false;
    }
    
    console.log(`✅ Bucket '${bucketName}' exists`);
    return true;
  } catch (error) {
    console.error(`❌ Error checking bucket '${bucketName}':`, error);
    return false;
  }
};

// Utility function to upload media (image or video) to Supabase storage
export const uploadMediaToStorage = async (
  mediaUri: string, 
  bucket: string, 
  fileName?: string
): Promise<string | null> => {
  try {
    console.log('📤 Uploading media to storage:', mediaUri, 'to bucket:', bucket);
    
    // Check if bucket exists
    const bucketExists = await ensureBucketExists(bucket);
    if (!bucketExists) {
      console.error(`❌ Bucket '${bucket}' does not exist or is not accessible`);
      return null;
    }
    
    // Skip if it's already a URL
    if (mediaUri.startsWith('http')) {
      console.log('✅ Already a URL, returning as is');
      return mediaUri;
    }
    
    // For React Native, we need to handle local URIs differently
    if (!mediaUri.startsWith('file://') && !mediaUri.startsWith('content://') && !mediaUri.startsWith('/')) {
      console.log('❌ Invalid media URI format:', mediaUri);
      return null;
    }
    
    // Generate a unique filename if not provided
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substr(2, 9);
    const extension = mediaUri.split('.').pop()?.toLowerCase() || 'jpg';
    
    // Determine if this is a video or image
    const isVideo = ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(extension);
    const prefix = isVideo ? 'video' : 'image';
    const finalFileName = fileName || `${prefix}_${timestamp}_${randomId}.${extension}`;
    
    // Determine correct MIME type
    let mimeType: string;
    if (isVideo) {
      switch (extension) {
        case 'mov':
          mimeType = 'video/quicktime';
          break;
        case 'mp4':
          mimeType = 'video/mp4';
          break;
        case 'webm':
          mimeType = 'video/webm';
          break;
        case 'avi':
          mimeType = 'video/avi';
          break;
        default:
          mimeType = `video/${extension}`;
      }
    } else {
      switch (extension) {
        case 'jpg':
        case 'jpeg':
          mimeType = 'image/jpeg';
          break;
        case 'png':
          mimeType = 'image/png';
          break;
        case 'gif':
          mimeType = 'image/gif';
          break;
        case 'webp':
          mimeType = 'image/webp';
          break;
        default:
          mimeType = 'image/jpeg'; // Default fallback
      }
    }
    
    console.log('📝 Generated filename:', finalFileName, 'MIME type:', mimeType);
    
    // Use ArrayBuffer approach for React Native
    console.log('📖 Reading file as ArrayBuffer...');
    const response = await fetch(mediaUri);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    console.log('📊 File loaded as ArrayBuffer, size:', arrayBuffer.byteLength, 'bytes');
    
    // Convert ArrayBuffer to Uint8Array for Supabase
    const fileData = new Uint8Array(arrayBuffer);
    
    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(finalFileName, fileData, {
        cacheControl: '3600',
        upsert: false,
        contentType: mimeType
      });
    
    if (error) {
      console.error('❌ Upload error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
        bucket: bucket,
        fileName: finalFileName,
        fullError: error
      });
      return null;
    }
    
    if (!data) {
      console.error('❌ No data returned from upload');
      return null;
    }
    
    console.log('✅ Upload successful:', data);
    
    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);
    
    console.log('✅ Image uploaded successfully:', publicUrl);
    return publicUrl;
    
  } catch (error) {
    console.error('❌ Error uploading image:', error);
    return null;
  }
};

// Test function to check storage setup
export const testStorageSetup = async (): Promise<void> => {
  console.log('🧪 Testing storage setup...');
  
  try {
    // Test bucket access
    const buckets = ['posts', 'stories', 'avatars'];
    
    for (const bucketName of buckets) {
      console.log(`🔍 Testing bucket: ${bucketName}`);
      const { data, error } = await supabase.storage.from(bucketName).list('', { limit: 1 });
      
      if (error) {
        console.error(`❌ Bucket '${bucketName}' error:`, error);
      } else {
        console.log(`✅ Bucket '${bucketName}' is accessible`);
      }
    }
    
    // Test creating a small test file
    const testData = new Uint8Array([137, 80, 78, 71]); // PNG header
    const testFileName = `test_${Date.now()}.png`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('posts')
      .upload(testFileName, testData, {
        contentType: 'image/png'
      });
    
    if (uploadError) {
      console.error('❌ Test upload failed:', uploadError);
    } else {
      console.log('✅ Test upload successful:', uploadData);
      
      // Clean up test file
      await supabase.storage.from('posts').remove([testFileName]);
      console.log('🧹 Test file cleaned up');
    }
    
  } catch (error) {
    console.error('❌ Storage test failed:', error);
  }
};

// Utility function to upload multiple media files
export const uploadMedia = async (mediaUris: string[], bucket: string = 'posts'): Promise<string[]> => {
  console.log('📤 Uploading multiple media files:', mediaUris);
  
  const uploadPromises = mediaUris.map(async (uri, index) => {
    const extension = uri.split('.').pop()?.toLowerCase() || 'jpg';
    const isVideo = ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(extension);
    const prefix = isVideo ? 'video' : 'image';
    const fileName = `${prefix}_${Date.now()}_${index}.${extension}`;
    return uploadMediaToStorage(uri, bucket, fileName);
  });
  
  const results = await Promise.all(uploadPromises);
  const validUrls = results.filter(url => url !== null) as string[];
  
  console.log('✅ Successfully uploaded media files:', validUrls);
  return validUrls;
};

// Backward compatibility alias
export const uploadImages = uploadMedia;
export const uploadImageToStorage = uploadMediaToStorage;

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
