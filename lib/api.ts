import { supabase, Post, Comment, Like, Follow, Notification, Message, Chat, User } from './supabase';

// Posts API
export const postsApi = {
  // Get all posts with user info and likes
  async getPosts(limit = 10, offset = 0) {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        user:user_profiles(*),
        likes(user_id),
        saves(user_id)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data;
  },

  // Get posts by user
  async getPostsByUser(userId: string, limit = 10, offset = 0) {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        user:user_profiles(*),
        likes(user_id),
        saves(user_id)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data;
  },

  // Get single post
  async getPost(postId: string) {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        user:user_profiles(*),
        likes(user_id),
        saves(user_id),
        comments(
          *,
          user:user_profiles(*),
          likes(user_id)
        )
      `)
      .eq('id', postId)
      .single();

    if (error) throw error;
    return data;
  },

  // Create new post
  async createPost(content: string, images?: string[], location?: string, tags?: string[]) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        content,
        images,
        location,
        tags,
      })
      .select(`
        *,
        user:user_profiles(*)
      `)
      .single();

    if (error) throw error;
    return data;
  },

  // Update post
  async updatePost(postId: string, updates: Partial<Post>) {
    const { data, error } = await supabase
      .from('posts')
      .update(updates)
      .eq('id', postId)
      .select(`
        *,
        user:user_profiles(*)
      `)
      .single();

    if (error) throw error;
    return data;
  },

  // Delete post
  async deletePost(postId: string) {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);

    if (error) throw error;
  },

  // Like/Unlike post
  async toggleLike(postId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Check if already liked
    const { data: existingLike } = await supabase
      .from('likes')
      .select('id')
      .eq('user_id', user.id)
      .eq('post_id', postId)
      .single();

    if (existingLike) {
      // Unlike
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('id', existingLike.id);

      if (error) throw error;
      return { liked: false };
    } else {
      // Like
      const { error } = await supabase
        .from('likes')
        .insert({
          user_id: user.id,
          post_id: postId,
        });

      if (error) throw error;
      return { liked: true };
    }
  },

  // Save/Unsave post
  async toggleSave(postId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Check if already saved
    const { data: existingSave } = await supabase
      .from('saves')
      .select('id')
      .eq('user_id', user.id)
      .eq('post_id', postId)
      .single();

    if (existingSave) {
      // Unsave
      const { error } = await supabase
        .from('saves')
        .delete()
        .eq('id', existingSave.id);

      if (error) throw error;
      return { saved: false };
    } else {
      // Save
      const { error } = await supabase
        .from('saves')
        .insert({
          user_id: user.id,
          post_id: postId,
        });

      if (error) throw error;
      return { saved: true };
    }
  },
};

// Comments API
export const commentsApi = {
  // Get comments for a post
  async getComments(postId: string) {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        user:user_profiles(*),
        likes(user_id)
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  },

  // Create comment
  async createComment(postId: string, content: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        user_id: user.id,
        content,
      })
      .select(`
        *,
        user:user_profiles(*)
      `)
      .single();

    if (error) throw error;
    return data;
  },

  // Like/Unlike comment
  async toggleLike(commentId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Check if already liked
    const { data: existingLike } = await supabase
      .from('likes')
      .select('id')
      .eq('user_id', user.id)
      .eq('comment_id', commentId)
      .single();

    if (existingLike) {
      // Unlike
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('id', existingLike.id);

      if (error) throw error;
      return { liked: false };
    } else {
      // Like
      const { error } = await supabase
        .from('likes')
        .insert({
          user_id: user.id,
          comment_id: commentId,
        });

      if (error) throw error;
      return { liked: true };
    }
  },
};

// Users API
export const usersApi = {
  // Get user profile
  async getUser(userId: string) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  },

  // Search users
  async searchUsers(query: string, limit = 10) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .or(`name.ilike.%${query}%,username.ilike.%${query}%`)
      .limit(limit);

    if (error) throw error;
    return data;
  },

  // Follow/Unfollow user
  async toggleFollow(targetUserId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Check if already following
    const { data: existingFollow } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', targetUserId)
      .single();

    if (existingFollow) {
      // Unfollow
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('id', existingFollow.id);

      if (error) throw error;
      return { following: false };
    } else {
      // Follow
      const { error } = await supabase
        .from('follows')
        .insert({
          follower_id: user.id,
          following_id: targetUserId,
        });

      if (error) throw error;
      return { following: true };
    }
  },

  // Get followers
  async getFollowers(userId: string) {
    const { data, error } = await supabase
      .from('follows')
      .select(`
        follower:user_profiles!follows_follower_id_fkey(*)
      `)
      .eq('following_id', userId);

    if (error) throw error;
    return data.map(item => item.follower);
  },

  // Get following
  async getFollowing(userId: string) {
    const { data, error } = await supabase
      .from('follows')
      .select(`
        following:user_profiles!follows_following_id_fkey(*)
      `)
      .eq('follower_id', userId);

    if (error) throw error;
    return data.map(item => item.following);
  },
};

// Notifications API
export const notificationsApi = {
  // Get notifications for current user
  async getNotifications(limit = 20, offset = 0) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data;
  },

  // Mark notification as read
  async markAsRead(notificationId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) throw error;
  },

  // Mark all notifications as read
  async markAllAsRead() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);

    if (error) throw error;
  },

  // Create notification
  async createNotification(userId: string, type: string, title: string, message: string, data?: any) {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        data,
      });

    if (error) throw error;
  },
};

// Messages API
export const messagesApi = {
  // Get chats for current user
  async getChats() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('chat_members')
      .select(`
        chat:chats(
          *,
          members:chat_members(
            user:user_profiles(*)
          ),
          last_message:messages(content, created_at, user:user_profiles(name))
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map(item => item.chat);
  },

  // Get messages for a chat
  async getMessages(chatId: string, limit = 50, offset = 0) {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        user:user_profiles(*)
      `)
      .eq('chat_id', chatId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data.reverse(); // Reverse to show oldest first
  },

  // Send message
  async sendMessage(chatId: string, content: string, type = 'text') {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('messages')
      .insert({
        chat_id: chatId,
        user_id: user.id,
        content,
        type,
      })
      .select(`
        *,
        user:user_profiles(*)
      `)
      .single();

    if (error) throw error;
    return data;
  },

  // Create or get direct chat
  async createDirectChat(otherUserId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Check if chat already exists
    const { data: existingChatMembers } = await supabase
      .from('chat_members')
      .select(`
        chat_id,
        chat:chats!inner(is_group)
      `)
      .eq('user_id', user.id);

    if (existingChatMembers) {
      for (const member of existingChatMembers) {
        if (!(member.chat as any).is_group) {
          // Check if the other user is also in this chat
          const { data: otherMember } = await supabase
            .from('chat_members')
            .select('id')
            .eq('chat_id', member.chat_id)
            .eq('user_id', otherUserId)
            .single();

          if (otherMember) {
            return { chatId: member.chat_id };
          }
        }
      }
    }

    // Create new chat
    const { data: newChat, error: chatError } = await supabase
      .from('chats')
      .insert({
        is_group: false,
      })
      .select()
      .single();

    if (chatError) throw chatError;

    // Add both users to the chat
    const { error: membersError } = await supabase
      .from('chat_members')
      .insert([
        { chat_id: newChat.id, user_id: user.id },
        { chat_id: newChat.id, user_id: otherUserId },
      ]);

    if (membersError) throw membersError;

    return { chatId: newChat.id };
  },
};

// Real-time subscriptions
export const subscriptions = {
  // Subscribe to new posts
  subscribeToposts(callback: (payload: any) => void) {
    return supabase
      .channel('posts')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'posts' },
        callback
      )
      .subscribe();
  },

  // Subscribe to messages in a chat
  subscribeToMessages(chatId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`messages:${chatId}`)
      .on('postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `chat_id=eq.${chatId}`
        },
        callback
      )
      .subscribe();
  },

  // Subscribe to notifications
  subscribeToNotifications(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`notifications:${userId}`)
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe();
  },
};