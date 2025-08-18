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
  if (!mediaPath) {
    return null;
  }
  
  // If it's already a full HTTP URL, return as is
  if (mediaPath.startsWith('http')) {
    return mediaPath;
  }
  
  // If it's a local file path (starts with file://), skip it
  if (mediaPath.startsWith('file://')) {
    return null;
  }
  
  // If it contains local device paths, skip it
  if (mediaPath.includes('/data/user/') || 
      mediaPath.includes('/cache/') || 
      mediaPath.includes('ExperienceData') ||
      mediaPath.includes('ImagePicker') ||
      mediaPath.includes('%25') || // URL encoded characters
      mediaPath.includes('host.exp.exponent')) {
    return null;
  }
  
  // Generate public URL from storage for valid storage paths
  try {
    const { data: { publicUrl } } = supabase.storage
      .from('stories')
      .getPublicUrl(mediaPath);
    return publicUrl;
  } catch (error) {
    return null; // Return null instead of invalid path
  }
};

// Utility function to get post image URLs from Supabase storage
export const getPostImageUrls = (imagePaths: string[] | null | undefined): string[] => {
  if (!imagePaths || !Array.isArray(imagePaths)) {
    return [];
  }
  
  const processedUrls = imagePaths.map(imagePath => {
    if (!imagePath) {
      return '';
    }
    
    // If it's already a full HTTP URL, return as is
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // If it's a local file path (starts with file://), skip it
    if (imagePath.startsWith('file://')) {
      return '';
    }
    
    // If it contains local device paths, skip it
    if (imagePath.includes('/data/user/') || 
        imagePath.includes('/cache/') || 
        imagePath.includes('ExperienceData') ||
        imagePath.includes('ImagePicker') ||
        imagePath.includes('%25') || // URL encoded characters
        imagePath.includes('host.exp.exponent')) {
      return '';
    }
    
    // Generate public URL from storage for valid storage paths
    try {
      const { data: { publicUrl } } = supabase.storage
        .from('posts')
        .getPublicUrl(imagePath);
      return publicUrl;
    } catch (error) {
      return ''; // Return empty string instead of invalid path
    }
  }).filter(url => url !== ''); // Remove empty URLs
  
  return processedUrls;
};

// Utility function to ensure bucket exists
const ensureBucketExists = async (bucketName: string): Promise<boolean> => {
  try {
    // Try to list files in the bucket to check if it exists
    const { error } = await supabase.storage.from(bucketName).list('', { limit: 1 });
    
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
  fileName?: string,
  onProgress?: (progress: number) => void
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
    
    // Use different approaches based on file size to avoid string length limits
    console.log('📖 Reading file...');
    onProgress?.(10); // 10% - started reading file
    
    const response = await fetch(mediaUri);
    if (!response.ok) {
      throw new Error(`Failed to fetch media: ${response.statusText}`);
    }
    
    // Get content length to check file size
    const contentLength = response.headers.get('content-length');
    const fileSize = contentLength ? parseInt(contentLength) : 0;
    console.log('📊 File size:', fileSize, 'bytes');
    
    onProgress?.(20); // 20% - file info retrieved
    
    // For large files (over 50MB), use blob approach to avoid string length limits
    const maxSafeSize = 50 * 1024 * 1024; // 50MB
    let fileData: Uint8Array;
    
    if (fileSize > maxSafeSize || isVideo) {
      console.log('📦 Using blob approach for large file or video...');
      onProgress?.(30); // 30% - starting blob conversion
      
      const blob = await response.blob();
      onProgress?.(50); // 50% - blob created
      
      const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          onProgress?.(70); // 70% - file read complete
          resolve(reader.result as ArrayBuffer);
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(blob);
      });
      fileData = new Uint8Array(arrayBuffer);
    } else {
      console.log('📦 Using ArrayBuffer approach for smaller file...');
      onProgress?.(50); // 50% - starting array buffer conversion
      const arrayBuffer = await response.arrayBuffer();
      onProgress?.(70); // 70% - file read complete
      fileData = new Uint8Array(arrayBuffer);
    }
    
    // Upload to Supabase storage
    onProgress?.(80); // 80% - starting upload
    
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
    
    onProgress?.(90); // 90% - upload complete, getting URL
    console.log('✅ Upload successful:', data);
    
    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);
    
    onProgress?.(100); // 100% - completely done
    console.log('✅ Media uploaded successfully:', publicUrl);
    return publicUrl;
    
  } catch (error) {
    console.error('❌ Error uploading media:', error);
    
    // Check if it's a string length error and provide helpful message
    if (error instanceof RangeError && error.message.includes('String length exceeds limit')) {
      console.error('❌ File too large for JavaScript engine. Consider compressing the video or using a smaller file.');
    }
    
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
export const uploadMedia = async (
  mediaUris: string[], 
  bucket: string = 'posts',
  onProgress?: (fileIndex: number, progress: number, totalFiles: number) => void
): Promise<string[]> => {
  console.log('📤 Uploading multiple media files:', mediaUris);
  
  const results: string[] = [];
  
  // Upload files sequentially to better track progress
  for (let index = 0; index < mediaUris.length; index++) {
    const uri = mediaUris[index];
    const extension = uri.split('.').pop()?.toLowerCase() || 'jpg';
    const isVideo = ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(extension);
    const prefix = isVideo ? 'video' : 'image';
    const fileName = `${prefix}_${Date.now()}_${index}.${extension}`;
    
    const result = await uploadMediaToStorage(uri, bucket, fileName, (progress) => {
      onProgress?.(index, progress, mediaUris.length);
    });
    
    if (result) {
      results.push(result);
    }
  }
  
  console.log('✅ Successfully uploaded media files:', results);
  return results;
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
