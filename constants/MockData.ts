// Static data that doesn't depend on user profiles
export const TRENDING_TOPICS = [
  { id: 1, tag: '#TechInnovation', posts: '12.5k' },
  { id: 2, tag: '#DigitalArt', posts: '8.9k' },
  { id: 3, tag: '#Sustainability', posts: '15.2k' },
  { id: 4, tag: '#CodeLife', posts: '6.7k' },
  { id: 5, tag: '#CreativeDesign', posts: '11.1k' }
];

export const DISCOVER_CATEGORIES = [
  { id: 1, name: 'For You', icon: '✨', color: '#FF6B6B' },
  { id: 2, name: 'Tech', icon: '💻', color: '#4ECDC4' },
  { id: 3, name: 'Art', icon: '🎨', color: '#45B7D1' },
  { id: 4, name: 'Travel', icon: '✈️', color: '#96CEB4' },
  { id: 5, name: 'Food', icon: '🍕', color: '#FFEAA7' },
  { id: 6, name: 'Lifestyle', icon: '🌟', color: '#DDA0DD' }
];

// All user-dependent data has been removed and will be loaded from Supabase
// USERS, POSTS, STORIES, CHATS, NOTIFICATIONS, etc. are now loaded dynamically from the API
