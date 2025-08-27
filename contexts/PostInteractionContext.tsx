import React, { createContext, useContext, useState, useCallback } from 'react';
import { Post } from '@/lib/supabase';
import { postsApi } from '@/lib/api';

interface PostInteractionContextType {
  likedPosts: Record<string, boolean>;
  savedPosts: Record<string, boolean>;
  postsLikesCount: Record<string, number>;
  toggleLike: (postId: string, currentState: boolean) => void;
  toggleSave: (postId: string, currentState: boolean) => void;
  updatePostLikes: (postId: string, isLiked: boolean, likesCount: number) => void;
}

const PostInteractionContext = createContext<PostInteractionContextType | undefined>(undefined);

export const PostInteractionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const [savedPosts, setSavedPosts] = useState<Record<string, boolean>>({});
  const [postsLikesCount, setPostsLikesCount] = useState<Record<string, number>>({});

  const toggleLike = useCallback(async (postId: string, currentState: boolean) => {
    const newLikedState = !currentState;
    
    // Optimistic update
    setLikedPosts(prev => ({
      ...prev,
      [postId]: newLikedState
    }));

    setPostsLikesCount(prev => ({
      ...prev,
      [postId]: Math.max(0, (prev[postId] || 0) + (newLikedState ? 1 : -1))
    }));

    try {
      if (newLikedState) {
        await postsApi.likePost(postId);
      } else {
        await postsApi.unlikePost(postId);
      }
    } catch (error: any) {
      console.error('Error toggling like:', error);
      
      // Check if it's a duplicate like error (code 23505 is a unique constraint violation in PostgreSQL)
      if (error.code === '23505' && error.message?.includes('likes_user_id_post_id_key')) {
        // If it's a duplicate like, ensure the UI shows the post as liked
        setLikedPosts(prev => ({
          ...prev,
          [postId]: true
        }));
        
        // Fetch the actual like count to ensure it's in sync
        try {
          const post = await postsApi.getPost(postId);
          if (post) {
            setPostsLikesCount(prev => ({
              ...prev,
              [postId]: post.likes_count || 1
            }));
          }
        } catch (fetchError) {
          console.error('Error fetching updated post data:', fetchError);
          // If we can't fetch the updated data, at least ensure the count is at least 1
          setPostsLikesCount(prev => ({
            ...prev,
            [postId]: Math.max(1, prev[postId] || 1)
          }));
        }
        return; // Exit early for duplicate likes
      }
      
      // For other errors, revert to the previous state
      setLikedPosts(prev => ({
        ...prev,
        [postId]: currentState
      }));
      
      setPostsLikesCount(prev => ({
        ...prev,
        [postId]: (prev[postId] || 0) + (currentState ? 1 : -1)
      }));
      
      throw error; // Re-throw to allow components to handle the error if needed
    }
  }, []);

  const toggleSave = useCallback(async (postId: string, currentState: boolean) => {
    const newSavedState = !currentState;
    
    // Optimistic update
    setSavedPosts(prev => ({
      ...prev,
      [postId]: newSavedState
    }));

    try {
      if (newSavedState) {
        await postsApi.savePost(postId);
      } else {
        await postsApi.unsavePost(postId);
      }
    } catch (error) {
      console.error('Error toggling save:', error);
      // Revert on error
      setSavedPosts(prev => ({
        ...prev,
        [postId]: currentState
      }));
      throw error;
    }
  }, []);

  const updatePostLikes = useCallback((postId: string, isLiked: boolean, likesCount: number) => {
    setLikedPosts(prev => ({
      ...prev,
      [postId]: isLiked
    }));
    
    setPostsLikesCount(prev => ({
      ...prev,
      [postId]: likesCount
    }));
  }, []);

  return (
    <PostInteractionContext.Provider 
      value={{
        likedPosts,
        savedPosts,
        postsLikesCount,
        toggleLike,
        toggleSave,
        updatePostLikes
      }}
    >
      {children}
    </PostInteractionContext.Provider>
  );
};

export const usePostInteractions = () => {
  const context = useContext(PostInteractionContext);
  if (context === undefined) {
    throw new Error('usePostInteractions must be used within a PostInteractionProvider');
  }
  return context;
};
