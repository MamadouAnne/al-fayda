import { View, FlatList, TextInput, Text, TouchableOpacity, ScrollView, Image, StatusBar, Animated, StyleSheet, Dimensions } from 'react-native';
import { USERS, POSTS, DISCOVER_CATEGORIES, TRENDING_TOPICS, FEATURED_CREATORS } from '@/constants/MockData';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

export default function SearchScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('For You');
  const [searchFocused, setSearchFocused] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showAllTrending, setShowAllTrending] = useState(false);
  const [displayedPosts, setDisplayedPosts] = useState(POSTS.slice(0, 6));
  const [loading, setLoading] = useState(false);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const searchAnimation = useRef(new Animated.Value(0)).current;
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const floatingAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnimation, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatingAnimation, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(floatingAnimation, {
            toValue: 0,
            duration: 3000,
            useNativeDriver: true,
          }),
        ])
      ),
    ]).start();
  }, []);

  const floatingY = floatingAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });

  // Generate related posts based on category
  const generateRelatedPosts = (category: string, existingPosts: any[], count: number = 6) => {
    const categoryKeywords = {
      'For You': ['amazing', 'beautiful', 'inspiring', 'incredible', 'stunning'],
      'Tech': ['code', 'technology', 'digital', 'innovation', 'AI', 'software', 'development'],
      'Art': ['creative', 'design', 'artistic', 'beautiful', 'visual', 'inspiration'],
      'Travel': ['adventure', 'explore', 'journey', 'destination', 'wanderlust', 'nature'],
      'Food': ['delicious', 'taste', 'recipe', 'cooking', 'culinary', 'flavor'],
      'Lifestyle': ['life', 'wellness', 'vibes', 'living', 'positive', 'energy']
    };

    const keywords = categoryKeywords[category as keyof typeof categoryKeywords] || categoryKeywords['For You'];
    const basePosts = [...POSTS];
    const newPosts = [];

    for (let i = 0; i < count; i++) {
      const randomPost = basePosts[Math.floor(Math.random() * basePosts.length)];
      const randomKeyword = keywords[Math.floor(Math.random() * keywords.length)];
      
      // Create a variation of the post with category-relevant content
      const newPost = {
        ...randomPost,
        id: Date.now() + i,
        caption: `${randomKeyword.charAt(0).toUpperCase() + randomKeyword.slice(1)} moment! ${randomPost.caption}`,
        likes: Math.floor(Math.random() * 5000) + 100,
        timestamp: `${Math.floor(Math.random() * 24)}h ago`,
        tags: [...(randomPost.tags || []), `#${category}`],
      };
      
      newPosts.push(newPost);
    }

    return newPosts;
  };

  const filteredUsers = USERS.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPosts = POSTS.filter(post =>
    post.caption.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Filter posts by category
  const getFilteredPostsByCategory = (category: string) => {
    if (category === 'For You') return displayedPosts;
    
    const categoryTags = {
      'Tech': ['#CodeLife', '#TechLife', '#Innovation'],
      'Art': ['#UrbanArt', '#CreativeDesign', '#DigitalArt'],
      'Travel': ['#Hiking', '#Nature', '#MountFuji', '#Barcelona'],
      'Food': ['#Pizza', '#Coffee'],
      'Lifestyle': ['#SundayVibes', '#Wellness']
    };

    const relevantTags = categoryTags[category as keyof typeof categoryTags] || [];
    return displayedPosts.filter(post => 
      post.tags?.some(tag => relevantTags.includes(tag)) ||
      post.caption.toLowerCase().includes(category.toLowerCase())
    );
  };

  const loadMorePosts = () => {
    if (loading || !hasMorePosts) return;

    setLoading(true);
    
    setTimeout(() => {
      const newPosts = generateRelatedPosts(selectedCategory, displayedPosts, 6);
      setDisplayedPosts(prev => [...prev, ...newPosts]);
      setLoading(false);
      
      // Stop loading more after reaching a reasonable limit
      if (displayedPosts.length > 30) {
        setHasMorePosts(false);
      }
    }, 1000); // Simulate network delay
  };

  // Reset posts when category changes
  useEffect(() => {
    const initialPosts = selectedCategory === 'For You' 
      ? POSTS.slice(0, 6)
      : [...POSTS.slice(0, 3), ...generateRelatedPosts(selectedCategory, [], 3)];
    
    setDisplayedPosts(initialPosts);
    setHasMorePosts(true);
  }, [selectedCategory]);

  const handleSearchFocus = () => {
    setSearchFocused(true);
    Animated.timing(searchAnimation, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleSearchBlur = () => {
    if (!searchQuery) {
      setSearchFocused(false);
      Animated.timing(searchAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  };

  const searchBarWidth = searchAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['100%', '85%'],
  });

  const LoadingComponent = () => (
    <View style={styles.loadingContainer}>
      <LinearGradient
        colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
        style={styles.loadingGradient}
      >
        <BlurView intensity={8} tint="dark" style={styles.loadingBlur}>
          <Animated.View style={[styles.loadingSpinner, {
            transform: [{
              rotate: floatingAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '360deg'],
              })
            }]
          }]}>
            <Ionicons name="refresh" size={24} color="white" />
          </Animated.View>
          <Text style={styles.loadingText}>Loading more posts...</Text>
        </BlurView>
      </LinearGradient>
    </View>
  );

  const LoadMoreButton = () => (
    <TouchableOpacity style={styles.loadMoreContainer} onPress={loadMorePosts}>
      <LinearGradient
        colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.08)']}
        style={styles.loadMoreGradient}
      >
        <BlurView intensity={10} tint="dark" style={styles.loadMoreBlur}>
          <Ionicons name="add-circle" size={20} color="white" />
          <Text style={styles.loadMoreText}>Load More Posts</Text>
          <Ionicons name="chevron-down" size={16} color="rgba(255,255,255,0.8)" />
        </BlurView>
      </LinearGradient>
    </TouchableOpacity>
  );

  const DiscoverGrid = ({ posts, showLoadMore = false }: { posts: any[], showLoadMore?: boolean }) => (
    <View>
      <View style={styles.discoverGrid}>
        {posts.map((post, index) => (
          <TouchableOpacity 
            key={post.id} 
            style={[styles.discoverCard, {
              width: index % 3 === 0 ? '100%' : '48%',
              height: index % 3 === 0 ? 220 : 180,
            }]}
            onPress={() => router.push(`/post/${post.id}`)}
          >
            <Image 
              source={{ uri: post.images[0] }} 
              style={styles.discoverImage}
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.8)']}
              style={styles.discoverOverlay}
            >
              <View style={styles.discoverContent}>
                <View style={styles.discoverTextContainer}>
                  <Text style={styles.discoverCaption} numberOfLines={2}>
                    {post.caption.substring(0, 50)}...
                  </Text>
                  <Text style={styles.discoverAuthor}>
                    by {post.user.name}
                  </Text>
                </View>
                <View style={styles.discoverLikes}>
                  <Ionicons name="heart" size={14} color="#ff6b6b" />
                  <Text style={styles.discoverLikesText}>
                    {post.likes > 999 ? `${(post.likes / 1000).toFixed(1)}k` : post.likes}
                  </Text>
                </View>
              </View>
            </LinearGradient>
            <View style={styles.discoverBorder} />
          </TouchableOpacity>
        ))}
      </View>
      
      {showLoadMore && (
        <View style={styles.loadMoreSection}>
          {loading ? <LoadingComponent /> : hasMorePosts && <LoadMoreButton />}
        </View>
      )}
    </View>
  );

  const SearchResults = () => (
    <Animated.ScrollView 
      style={[styles.mainContent, { opacity: fadeAnimation }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {filteredUsers.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>People</Text>
            <Text style={[styles.seeAllText, { fontSize: 13 }]}>
              {filteredUsers.length} result{filteredUsers.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.searchUsersScroll}>
            <View style={styles.searchUsersContainer}>
              {filteredUsers.map(user => (
                <TouchableOpacity 
                  key={user.id} 
                  style={styles.searchUserCard}
                  onPress={() => router.push(`/user/${user.id}`)}
                >
                  <LinearGradient
                    colors={['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.06)']}
                    style={styles.searchUserGradient}
                  >
                    <BlurView intensity={8} tint="dark" style={styles.searchUserBlur}>
                      <View style={styles.searchUserAvatarContainer}>
                        <LinearGradient
                          colors={['#667eea', '#764ba2']}
                          style={styles.searchUserAvatarRing}
                        >
                          <Image 
                            source={{ uri: user.avatar }} 
                            style={styles.searchUserAvatar}
                          />
                        </LinearGradient>
                        {user.verified && (
                          <View style={styles.searchUserVerified}>
                            <Ionicons name="checkmark-circle" size={14} color="#1DA1F2" />
                          </View>
                        )}
                      </View>
                      <Text style={styles.searchUserName} numberOfLines={1}>
                        {user.name.split(' ')[0]}
                      </Text>
                      <Text style={styles.searchUserUsername} numberOfLines={1}>
                        {user.username}
                      </Text>
                    </BlurView>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {filteredPosts.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Posts</Text>
            <Text style={[styles.seeAllText, { fontSize: 13 }]}>
              {filteredPosts.length} result{filteredPosts.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <DiscoverGrid posts={filteredPosts} />
        </View>
      )}

      {filteredUsers.length === 0 && filteredPosts.length === 0 && searchQuery.length > 0 && (
        <View style={styles.noResultsContainer}>
          <LinearGradient
            colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
            style={styles.noResultsGradient}
          >
            <BlurView intensity={8} tint="dark" style={styles.noResultsBlur}>
              <Ionicons name="search" size={48} color="rgba(255,255,255,0.5)" />
              <Text style={styles.noResultsTitle}>No results found</Text>
              <Text style={styles.noResultsText}>
                Try searching for something else or check your spelling
              </Text>
            </BlurView>
          </LinearGradient>
        </View>
      )}
    </Animated.ScrollView>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Full Page Background Gradient */}
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb', '#f5576c']}
        style={StyleSheet.absoluteFillObject}
      />
      
      {/* Background Floating Orbs */}
      <View style={styles.backgroundOrbs}>
        <Animated.View style={[styles.orb1, { transform: [{ translateY: floatingY }] }]} />
        <Animated.View style={[styles.orb2, { 
          transform: [{ translateY: floatingAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [10, -5],
          }) }] 
        }]} />
        <Animated.View style={[styles.orb3, { 
          transform: [{ translateY: floatingAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [-5, 15],
          }) }] 
        }]} />
      </View>
      
      {/* Search Header */}
      <Animated.View style={[styles.searchHeader, { opacity: fadeAnimation }]}>
        <BlurView intensity={15} tint="dark" style={styles.searchHeaderBlur}>
          <View style={styles.searchContainer}>
            <Animated.View style={[styles.searchInputContainer, { width: searchBarWidth }]}>
              <BlurView intensity={20} tint="light" style={styles.searchInputBlur}>
                <Ionicons name="search" size={20} color="rgba(255,255,255,0.7)" style={styles.searchIcon} />
                <TextInput
                  placeholder="Search posts, people, hashtags..."
                  placeholderTextColor="rgba(255,255,255,0.6)"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onFocus={handleSearchFocus}
                  onBlur={handleSearchBlur}
                  style={styles.searchInput}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                    <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.7)" />
                  </TouchableOpacity>
                )}
              </BlurView>
            </Animated.View>
            
            {searchFocused && (
              <TouchableOpacity 
                onPress={() => {
                  setSearchQuery('');
                  setSearchFocused(false);
                  Animated.timing(searchAnimation, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: false,
                  }).start();
                }}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        </BlurView>
      </Animated.View>

      {searchQuery.length > 0 ? (
        <SearchResults />
      ) : (
        <Animated.ScrollView 
          showsVerticalScrollIndicator={false}
          style={[styles.mainContent, { opacity: fadeAnimation }]}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Categories Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Explore Categories</Text>
              <TouchableOpacity 
                style={styles.seeAllButton}
                onPress={() => setShowAllCategories(!showAllCategories)}
              >
                <Text style={styles.seeAllText}>
                  {showAllCategories ? 'Show Less' : 'See All'}
                </Text>
                <Ionicons 
                  name={showAllCategories ? "chevron-up" : "chevron-forward"} 
                  size={16} 
                  color="rgba(255,255,255,0.8)" 
                />
              </TouchableOpacity>
            </View>
            {showAllCategories ? (
              <View style={styles.categoriesGridContainer}>
                <View style={styles.categoriesGrid}>
                  {DISCOVER_CATEGORIES.map((category, index) => (
                    <TouchableOpacity 
                      key={category.id}
                      onPress={() => setSelectedCategory(category.name)}
                      style={styles.categoryGridCard}
                    >
                      <LinearGradient
                        colors={selectedCategory === category.name 
                          ? ['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.1)'] 
                          : ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']
                        }
                        style={styles.categoryGradient}
                      >
                        <BlurView intensity={8} tint="dark" style={styles.categoryGridBlur}>
                          <Text style={styles.categoryGridIcon}>{category.icon}</Text>
                          <Text style={[styles.categoryGridName, {
                            color: selectedCategory === category.name ? 'white' : 'rgba(255,255,255,0.8)'
                          }]}>
                            {category.name}
                          </Text>
                          {selectedCategory === category.name && (
                            <View style={styles.categoryIndicator} />
                          )}
                        </BlurView>
                      </LinearGradient>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
                <View style={styles.categoriesContainer}>
                  {DISCOVER_CATEGORIES.slice(0, 4).map((category, index) => (
                    <TouchableOpacity 
                      key={category.id}
                      onPress={() => setSelectedCategory(category.name)}
                      style={styles.categoryCard}
                    >
                      <LinearGradient
                        colors={selectedCategory === category.name 
                          ? ['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.1)'] 
                          : ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']
                        }
                        style={styles.categoryGradient}
                      >
                        <BlurView intensity={8} tint="dark" style={styles.categoryBlur}>
                          <Text style={styles.categoryIcon}>{category.icon}</Text>
                          <Text style={[styles.categoryName, {
                            color: selectedCategory === category.name ? 'white' : 'rgba(255,255,255,0.8)'
                          }]}>
                            {category.name}
                          </Text>
                          {selectedCategory === category.name && (
                            <View style={styles.categoryIndicator} />
                          )}
                        </BlurView>
                      </LinearGradient>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            )}
          </View>

          {/* Trending Topics Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Trending Now</Text>
              <TouchableOpacity 
                style={styles.seeAllButton}
                onPress={() => setShowAllTrending(!showAllTrending)}
              >
                <Text style={styles.seeAllText}>
                  {showAllTrending ? 'Show Less' : 'View All'}
                </Text>
                <Ionicons 
                  name={showAllTrending ? "chevron-up" : "trending-up"} 
                  size={16} 
                  color="rgba(255,255,255,0.8)" 
                />
              </TouchableOpacity>
            </View>
            <View style={styles.trendingContainer}>
              <LinearGradient
                colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)']}
                style={styles.trendingGradient}
              >
                <BlurView intensity={10} tint="dark" style={styles.trendingBlur}>
                  {(showAllTrending ? TRENDING_TOPICS : TRENDING_TOPICS.slice(0, 3)).map((topic, index) => (
                    <TouchableOpacity key={topic.id} style={[styles.trendingItem, {
                      borderBottomWidth: index < (showAllTrending ? TRENDING_TOPICS : TRENDING_TOPICS.slice(0, 3)).length - 1 ? 1 : 0
                    }]}>
                      <View style={styles.trendingLeft}>
                        <LinearGradient
                          colors={['#667eea', '#764ba2']}
                          style={styles.trendingNumber}
                        >
                          <Text style={styles.trendingNumberText}>{index + 1}</Text>
                        </LinearGradient>
                        <View style={styles.trendingInfo}>
                          <Text style={styles.trendingTag}>{topic.tag}</Text>
                          <Text style={styles.trendingPosts}>{topic.posts} posts</Text>
                        </View>
                      </View>
                      <View style={styles.trendingIndicator}>
                        <Ionicons name="trending-up" size={18} color="#10B981" />
                      </View>
                    </TouchableOpacity>
                  ))}
                </BlurView>
              </LinearGradient>
            </View>
          </View>

          {/* Featured Creators Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Featured Creators</Text>
              <TouchableOpacity style={styles.seeAllButton}>
                <Text style={styles.seeAllText}>Discover</Text>
                <Ionicons name="people" size={16} color="rgba(255,255,255,0.8)" />
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.creatorsScroll}>
              <View style={styles.creatorsContainer}>
                {FEATURED_CREATORS.map((creator, index) => (
                  <Animated.View 
                    key={creator.id} 
                    style={[styles.creatorCard, {
                      transform: [{
                        translateY: floatingAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, index % 2 === 0 ? -3 : 3],
                        })
                      }]
                    }]}
                  >
                    <LinearGradient
                      colors={['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.06)']}
                      style={styles.creatorGradient}
                    >
                      <BlurView intensity={8} tint="dark" style={styles.creatorBlur}>
                        {creator.trending && (
                          <View style={styles.hotBadge}>
                            <LinearGradient colors={['#ff6b6b', '#ee5a52']} style={styles.hotBadgeGradient}>
                              <Text style={styles.hotBadgeText}>🔥 Hot</Text>
                            </LinearGradient>
                          </View>
                        )}
                        
                        <View style={styles.creatorAvatarContainer}>
                          <LinearGradient
                            colors={['#667eea', '#764ba2', '#f093fb']}
                            style={styles.creatorAvatarRing}
                          >
                            <Image 
                              source={{ uri: creator.avatar }} 
                              style={styles.creatorAvatar}
                            />
                          </LinearGradient>
                          {creator.verified && (
                            <View style={styles.verifiedBadge}>
                              <Ionicons name="checkmark-circle" size={16} color="#1DA1F2" />
                            </View>
                          )}
                        </View>
                        
                        <View style={styles.creatorInfo}>
                          <Text style={styles.creatorName}>{creator.name}</Text>
                          <Text style={styles.creatorUsername}>{creator.username}</Text>
                          <View style={styles.creatorCategory}>
                            <Text style={styles.creatorCategoryText}>{creator.category}</Text>
                          </View>
                          <Text style={styles.creatorFollowers}>
                            {(creator.followers / 1000).toFixed(1)}k followers
                          </Text>
                        </View>
                        
                        <TouchableOpacity style={styles.followButton}>
                          <LinearGradient colors={['#667eea', '#764ba2']} style={styles.followGradient}>
                            <Ionicons name="person-add" size={14} color="white" />
                            <Text style={styles.followText}>Follow</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      </BlurView>
                    </LinearGradient>
                  </Animated.View>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Discover Content Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {selectedCategory === 'For You' ? 'Discover Posts' : `${selectedCategory} Posts`}
              </Text>
              <View style={styles.seeAllButton}>
                <Text style={styles.seeAllText}>{displayedPosts.length} posts</Text>
                <Ionicons name="grid" size={16} color="rgba(255,255,255,0.8)" />
              </View>
            </View>
            <DiscoverGrid posts={getFilteredPostsByCategory(selectedCategory)} showLoadMore={true} />
          </View>
        </Animated.ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  backgroundOrbs: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  orb1: {
    position: 'absolute',
    top: 150,
    right: 20,
    width: 100,
    height: 100,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 50,
    opacity: 0.8,
  },
  orb2: {
    position: 'absolute',
    top: 350,
    left: -30,
    width: 120,
    height: 120,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 60,
    opacity: 0.6,
  },
  orb3: {
    position: 'absolute',
    bottom: 250,
    right: 40,
    width: 90,
    height: 90,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 45,
    opacity: 0.7,
  },
  searchHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingTop: 50,
    paddingBottom: 16,
  },
  searchHeaderBlur: {
    paddingHorizontal: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchInputContainer: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  searchInputBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  clearButton: {
    marginLeft: 8,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  cancelText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    fontWeight: '600',
  },
  mainContent: {
    flex: 1,
    paddingTop: 110,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '600',
  },
  categoriesScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  categoriesContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  categoryCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  categoryGradient: {
    borderRadius: 20,
  },
  categoryBlur: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
    minWidth: 110,
    position: 'relative',
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  categoryIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'white',
    borderRadius: 2,
  },
  categoriesGridContainer: {
    paddingHorizontal: 20,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  categoryGridCard: {
    width: '48%',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 12,
  },
  categoryGridBlur: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: 'center',
    position: 'relative',
  },
  categoryGridIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  categoryGridName: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  trendingContainer: {
    marginHorizontal: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  trendingGradient: {
    borderRadius: 20,
  },
  trendingBlur: {
    padding: 20,
  },
  trendingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  trendingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  trendingNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  trendingNumberText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  trendingInfo: {
    flex: 1,
  },
  trendingTag: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  trendingPosts: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '500',
  },
  trendingIndicator: {
    marginLeft: 12,
  },
  creatorsScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  creatorsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  creatorCard: {
    width: 200,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  creatorGradient: {
    borderRadius: 20,
  },
  creatorBlur: {
    padding: 20,
    alignItems: 'center',
    position: 'relative',
  },
  hotBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  hotBadgeGradient: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  hotBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  creatorAvatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  creatorAvatarRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  creatorAvatar: {
    width: 74,
    height: 74,
    borderRadius: 37,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  creatorInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  creatorName: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  creatorUsername: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    marginBottom: 8,
    textAlign: 'center',
  },
  creatorCategory: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  creatorCategoryText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  creatorFollowers: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    textAlign: 'center',
  },
  followButton: {
    borderRadius: 20,
    overflow: 'hidden',
    width: '100%',
  },
  followGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
  },
  followText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  discoverGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    gap: 12,
  },
  discoverCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    position: 'relative',
  },
  discoverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  discoverOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    justifyContent: 'flex-end',
    padding: 12,
  },
  discoverContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  discoverTextContainer: {
    flex: 1,
    marginRight: 8,
  },
  discoverCaption: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  discoverAuthor: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontWeight: '500',
  },
  discoverLikes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  discoverLikesText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  discoverBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
  },
  searchUsersScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  searchUsersContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  searchUserCard: {
    width: 100,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  searchUserGradient: {
    borderRadius: 16,
  },
  searchUserBlur: {
    padding: 16,
    alignItems: 'center',
  },
  searchUserAvatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  searchUserAvatarRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchUserAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  searchUserVerified: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchUserName: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  searchUserUsername: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    textAlign: 'center',
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 100,
    borderRadius: 20,
    overflow: 'hidden',
  },
  noResultsGradient: {
    width: '100%',
    borderRadius: 20,
  },
  noResultsBlur: {
    padding: 40,
    alignItems: 'center',
  },
  noResultsTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  noResultsText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  loadMoreSection: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  loadingGradient: {
    borderRadius: 16,
  },
  loadingBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 12,
  },
  loadingSpinner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  loadMoreContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  loadMoreGradient: {
    borderRadius: 16,
  },
  loadMoreBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  loadMoreText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
});
