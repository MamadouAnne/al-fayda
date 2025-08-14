export const USERS = [
  { 
    id: 1, 
    name: 'Mamadou Anne', 
    username: '@mamadou_dev',
    avatar: 'https://i.pravatar.cc/150?u=1',
    verified: true,
    location: 'San Francisco, CA',
    followers: 12400,
    following: 892,
    bio: 'Full-stack developer passionate about AI & mobile apps 🚀 Building the future one line of code at a time. Open to collaborations!',
    website: 'mamadouanne.dev',
    joinDate: 'March 2021',
    profession: 'Software Engineer'
  },
  { 
    id: 2, 
    name: 'Luna Rodriguez', 
    username: '@luna_creates',
    avatar: 'https://i.pravatar.cc/150?u=2',
    verified: false,
    location: 'Barcelona, Spain',
    followers: 8900,
    following: 445,
    bio: 'Digital artist & UI/UX designer ✨ Creating beautiful experiences that inspire. Love coffee, cats, and creativity!',
    website: 'lunacreates.com',
    joinDate: 'July 2020',
    profession: 'Digital Artist'
  },
  { 
    id: 3, 
    name: 'Kai Chen', 
    username: '@kai_explorer',
    avatar: 'https://i.pravatar.cc/150?u=3',
    verified: true,
    location: 'Tokyo, Japan',
    followers: 15600,
    following: 234,
    bio: 'Adventure photographer 📸 Capturing moments from around the world. Next destination: Iceland! 🏔️ #wanderlust',
    website: 'kaiexplorer.photo',
    joinDate: 'January 2019',
    profession: 'Photographer'
  },
  { 
    id: 4, 
    name: 'Maya Thompson', 
    username: '@maya_vibes',
    avatar: 'https://i.pravatar.cc/150?u=4',
    verified: false,
    location: 'New York, NY',
    followers: 6700,
    following: 1200,
    bio: 'Lifestyle blogger & wellness coach 🧘‍♀️ Spreading good vibes and positive energy. Yoga teacher | Plant mom | Living my best life 🌱',
    website: 'mayavibes.blog',
    joinDate: 'September 2020',
    profession: 'Wellness Coach'
  },
  { 
    id: 5, 
    name: 'Alex Rivers', 
    username: '@alex_codes',
    avatar: 'https://i.pravatar.cc/150?u=5',
    verified: true,
    location: 'London, UK',
    followers: 22100,
    following: 156,
    bio: 'Senior Software Engineer @TechCorp 💻 Open source enthusiast | Docker & Kubernetes expert | Coffee addict ☕ Building scalable solutions',
    website: 'alexrivers.tech',
    joinDate: 'April 2018',
    profession: 'Senior Software Engineer'
  },
  {
    id: 6,
    name: 'Zara Okafor',
    username: '@zara_designs',
    avatar: 'https://i.pravatar.cc/150?u=6',
    verified: false,
    location: 'Lagos, Nigeria',
    followers: 11300,
    following: 678
  },
  {
    id: 7,
    name: 'Rio Santos',
    username: '@rio_adventures',
    avatar: 'https://i.pravatar.cc/150?u=7',
    verified: true,
    location: 'São Paulo, Brazil',
    followers: 18900,
    following: 432
  }
];

export const STORIES = USERS.map(user => ({ 
  ...user, 
  hasStory: true,
  storyPreview: `https://picsum.photos/400/600?random=${user.id}`,
  viewCount: Math.floor(Math.random() * 500) + 100
}));

export const TRENDING_TOPICS = [
  { id: 1, tag: '#TechInnovation', posts: '12.5k' },
  { id: 2, tag: '#DigitalArt', posts: '8.9k' },
  { id: 3, tag: '#Sustainability', posts: '15.2k' },
  { id: 4, tag: '#CodeLife', posts: '6.7k' },
  { id: 5, tag: '#CreativeDesign', posts: '11.1k' }
];

export const POSTS = [
  {
    id: 1,
    user: USERS[1],
    images: [
      'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=500&q=80',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&q=80'
    ],
    caption: 'Creating magic in the urban jungle ✨ Sometimes the most beautiful moments happen in unexpected places. What inspires you today? #Barcelona #UrbanArt #Inspiration',
    likes: 2847,
    shares: 156,
    saves: 423,
    timestamp: '2h ago',
    location: 'Park Güell, Barcelona',
    tags: ['#UrbanArt', '#Barcelona', '#Inspiration'],
    comments: [
      { id: 1, user: USERS[0], text: 'This is absolutely stunning! The composition is perfect 🔥', timestamp: '1h ago', likes: 12 },
      { id: 2, user: USERS[2], text: 'Barcelona has the most amazing architecture. Great capture!', timestamp: '45m ago', likes: 8 },
      { id: 3, user: USERS[4], text: 'The lighting in this shot is incredible ⚡️', timestamp: '30m ago', likes: 15 }
    ],
  },
  {
    id: 2,
    user: USERS[3],
    images: ['https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=500&q=80'],
    caption: 'Late night coding session powered by pizza and determination 🍕💻 Building something revolutionary tonight! Who else is up grinding? #CodeLife #StartupLife #Pizza',
    likes: 1923,
    shares: 89,
    saves: 234,
    timestamp: '4h ago',
    location: 'Brooklyn, NY',
    tags: ['#CodeLife', '#StartupLife', '#Pizza'],
    comments: [
      { id: 1, user: USERS[5], text: 'The hustle never stops! What are you building?', timestamp: '3h ago', likes: 23 },
      { id: 2, user: USERS[6], text: 'Pizza is the ultimate fuel for coding marathons 🚀', timestamp: '2h ago', likes: 18 }
    ],
  },
  {
    id: 3,
    user: USERS[2],
    images: [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500&q=80',
      'https://images.unsplash.com/photo-1464822759844-d150baec4ba5?w=500&q=80',
      'https://images.unsplash.com/photo-1551632811-561732d1e306?w=500&q=80'
    ],
    caption: 'Reached the summit just as the sun painted the sky gold 🏔️✨ 3 days of hiking, countless memories, and a reminder of how small we are in this vast universe. Nature is the ultimate teacher.',
    likes: 4521,
    shares: 287,
    saves: 891,
    timestamp: '1d ago',
    location: 'Mount Fuji, Japan',
    tags: ['#MountFuji', '#Hiking', '#Nature', '#Sunrise'],
    comments: [
      { id: 1, user: USERS[0], text: 'This is why I follow your adventures! Absolutely breathtaking 🙌', timestamp: '20h ago', likes: 45 },
      { id: 2, user: USERS[1], text: 'The colors in that sunrise are unreal! What camera did you use?', timestamp: '18h ago', likes: 32 },
      { id: 3, user: USERS[4], text: 'Adding this to my bucket list right now 📝', timestamp: '12h ago', likes: 28 }
    ],
  },
  {
    id: 4,
    user: USERS[4],
    images: ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&q=80'],
    caption: 'Sunday vibes: artisanal coffee, ambient jazz, and lines of code that actually work ☕️🎵 Sometimes the perfect environment makes all the difference. What\'s your ideal creative space?',
    likes: 3156,
    shares: 145,
    saves: 567,
    timestamp: '2d ago',
    location: 'Blue Bottle Coffee, NYC',
    tags: ['#Coffee', '#CodeLife', '#SundayVibes', '#NYC'],
    comments: [
      { id: 1, user: USERS[6], text: 'This aesthetic is everything! Which coffee shop is this?', timestamp: '1d ago', likes: 19 },
      { id: 2, user: USERS[0], text: 'Jazz + code = perfect productivity combo 🎯', timestamp: '1d ago', likes: 24 }
    ],
  },
  {
    id: 5,
    user: USERS[5],
    images: [
      'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=500&q=80',
      'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=500&q=80'
    ],
    caption: 'Just shipped a major feature that took months of planning 🚀 The feeling when your code finally does exactly what you envisioned... pure magic ✨ Huge thanks to the team who believed in this vision!',
    likes: 5234,
    shares: 423,
    saves: 1205,
    timestamp: '3d ago',
    location: 'London, UK',
    tags: ['#TechLife', '#Shipping', '#TeamWork', '#Innovation'],
    comments: [
      { id: 1, user: USERS[3], text: 'Congrats! Can\'t wait to try it out 🔥', timestamp: '2d ago', likes: 67 },
      { id: 2, user: USERS[1], text: 'The dedication shows! This is going to change everything', timestamp: '2d ago', likes: 54 },
      { id: 3, user: USERS[2], text: 'From concept to reality - incredible journey to watch 👏', timestamp: '1d ago', likes: 39 }
    ],
  }
];

export const FRIEND_REQUESTS = [
  { id: 1, user: USERS[2], mutualFriends: 15 },
  { id: 2, user: USERS[4], mutualFriends: 8 },
  { id: 3, user: USERS[5], mutualFriends: 23 },
];

export const SUGGESTED_FRIENDS = [
  { id: 1, user: USERS[6], reason: 'Works at similar companies', mutualFriends: 12 },
  { id: 2, user: USERS[5], reason: 'Lives in London', mutualFriends: 7 },
  { id: 3, user: USERS[3], reason: 'Has similar interests', mutualFriends: 4 },
];

export const CURRENT_USER_PROFILE = {
  ...USERS[0],
  bio: '🚀 React Native Developer | Building the future one line at a time\n💡 Open source contributor | Coffee addict ☕️\n📍 Currently building @al-fayda',
  friends: 1247,
  posts: [
    { id: 1, image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500&q=80', likes: 234 },
    { id: 2, image: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=500&q=80', likes: 189 },
    { id: 3, image: 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=500&q=80', likes: 445 },
    { id: 4, image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=500&q=80', likes: 321 },
    { id: 5, image: 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=500&q=80', likes: 567 },
    { id: 6, image: 'https://images.unsplash.com/photo-1515378791036-0648a814c963?w=500&q=80', likes: 298 },
  ],
  achievements: [
    { id: 1, icon: '🏆', title: 'Top Creator', description: 'One of the most engaged creators this month' },
    { id: 2, icon: '⭐', title: 'Early Adopter', description: 'Joined Al-Fayda in the first 100 users' },
    { id: 3, icon: '🔥', title: 'Streak Master', description: '30 days of consistent posting' }
  ],
  stats: {
    totalLikes: 125600,
    totalViews: 2340000,
    postsThisMonth: 28
  }
};

export const CHATS = [
  {
    id: 1,
    users: [{ ...USERS[0], isCurrentUser: true }, USERS[1]],
    lastMessage: "That's an amazing idea! Let's collaborate on it 🔥",
    timestamp: '2m ago',
    unread: 2,
    messages: [
      { id: 1, text: 'Hey Luna! Saw your latest post, incredible work', timestamp: '10:00 AM', user: USERS[0] },
      { id: 2, text: 'Thanks Mamadou! Your feedback means a lot 😊', timestamp: '10:01 AM', user: USERS[1] },
      { id: 3, text: 'I have a project idea that might interest you', timestamp: '10:05 AM', user: USERS[0] },
      { id: 4, text: "That's an amazing idea! Let's collaborate on it 🔥", timestamp: '10:07 AM', user: USERS[1] },
    ]
  },
  {
    id: 2,
    users: [{ ...USERS[0], isCurrentUser: true }, USERS[2]],
    lastMessage: "The sunrise view was absolutely worth the 3-day trek!",
    timestamp: '1h ago',
    unread: 0,
    messages: [
      { id: 1, text: 'Dude, that Mount Fuji post was insane!', timestamp: 'Yesterday 8:00 PM', user: USERS[0] },
      { id: 2, text: "The sunrise view was absolutely worth the 3-day trek!", timestamp: 'Yesterday 8:30 PM', user: USERS[2] },
    ]
  },
  {
    id: 3,
    users: [{ ...USERS[0], isCurrentUser: true }, USERS[4]],
    lastMessage: "Thanks for the coffee shop recommendation!",
    timestamp: '3h ago',
    unread: 1,
    messages: [
      { id: 1, text: 'Which coffee shop was that in your latest post?', timestamp: '4h ago', user: USERS[0] },
      { id: 2, text: "Thanks for the coffee shop recommendation!", timestamp: '3h ago', user: USERS[4] },
    ]
  }
];

export const GROUP_CHATS = [
  {
    id: 1,
    name: 'Tech Innovators',
    avatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=200&q=80',
    members: [USERS[0], USERS[2], USERS[4], USERS[5]],
    lastMessage: 'Who\'s joining the hackathon this weekend?',
    timestamp: '5m ago',
    unread: 3
  },
  {
    id: 2,
    name: 'Travel Squad',
    avatar: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=200&q=80',
    members: [USERS[0], USERS[1], USERS[2], USERS[6]],
    lastMessage: 'Next destination: Iceland! ❄️',
    timestamp: '2h ago',
    unread: 0
  }
];

export const NOTIFICATIONS = [
  { id: 1, type: 'like', user: USERS[1], post: POSTS[0], timestamp: '2m ago', read: false },
  { id: 2, type: 'comment', user: USERS[2], post: POSTS[0], timestamp: '15m ago', read: false },
  { id: 3, type: 'follow', user: USERS[4], timestamp: '1h ago', read: false },
  { id: 4, type: 'mention', user: USERS[5], post: POSTS[1], timestamp: '2h ago', read: true },
  { id: 5, type: 'friend_request', user: USERS[6], timestamp: '1d ago', read: false },
  { id: 6, type: 'post_like', user: USERS[3], post: POSTS[2], timestamp: '1d ago', read: true },
  { id: 7, type: 'achievement', title: 'Streak Master', description: '30 days of consistent posting', timestamp: '2d ago', read: true }
];

export const DISCOVER_CATEGORIES = [
  { id: 1, name: 'For You', icon: '✨', color: '#FF6B6B' },
  { id: 2, name: 'Tech', icon: '💻', color: '#4ECDC4' },
  { id: 3, name: 'Art', icon: '🎨', color: '#45B7D1' },
  { id: 4, name: 'Travel', icon: '✈️', color: '#96CEB4' },
  { id: 5, name: 'Food', icon: '🍕', color: '#FFEAA7' },
  { id: 6, name: 'Lifestyle', icon: '🌟', color: '#DDA0DD' }
];

export const FEATURED_CREATORS = [
  { ...USERS[2], category: 'Adventure', trending: true },
  { ...USERS[5], category: 'Tech', trending: true },
  { ...USERS[1], category: 'Design', trending: false },
  { ...USERS[6], category: 'Art', trending: true },
];
