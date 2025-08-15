import { 
  View, 
  Text, 
  TouchableOpacity, 
  StatusBar, 
  Animated, 
  StyleSheet, 
  Dimensions, 
  Image, 
  ScrollView, 
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useRouter } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

const { width } = Dimensions.get('window');

export default function EditProfileScreen() {
  const router = useRouter();
  const { profile: currentUser, refreshProfile } = useAuth();
  
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    username: currentUser?.username || '',
    bio: currentUser?.bio || '',
    location: currentUser?.location || '',
    website: currentUser?.website || '',
    profession: currentUser?.profession || '',
    phone: currentUser?.phone || '',
    interests: currentUser?.interests || '',
    education: currentUser?.education || '',
    experience: currentUser?.experience || '',
    skills: currentUser?.skills || '',
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [avatar, setAvatar] = useState<string | null>(currentUser?.avatar || null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const floatingAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Update avatar state when currentUser changes
    if (currentUser?.avatar) {
      setAvatar(currentUser.avatar);
    }
  }, [currentUser]);

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnimation, {
        toValue: 1,
        duration: 1000,
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

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }

    if (formData.website && !formData.website.startsWith('http')) {
      newErrors.website = 'Website must be a valid URL (starting with http:// or https://)';
    }

    if (formData.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/[\s\(\)-]/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChangePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to change your photo.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        setAvatarLoading(true);
        const asset = result.assets[0];
        
        // Delete old avatar if it exists
        if (currentUser?.avatar) {
          try {
            // Extract filename from the current avatar URL
            const currentAvatarUrl = currentUser.avatar;
            if (currentAvatarUrl.includes('/avatars/')) {
              const oldFileName = currentAvatarUrl.split('/avatars/').pop()?.split('?')[0];
              if (oldFileName) {
                console.log('Deleting old avatar:', oldFileName);
                const { error: deleteError } = await supabase.storage
                  .from('avatars')
                  .remove([oldFileName]);
                
                if (deleteError) {
                  console.error('Error deleting old avatar:', deleteError);
                } else {
                  console.log('Old avatar deleted successfully');
                }
              }
            }
          } catch (error) {
            console.error('Error processing old avatar deletion:', error);
          }
        }
        
        const getContentType = (extension) => {
          switch (extension.toLowerCase()) {
            case 'jpg':
            case 'jpeg':
              return 'image/jpeg';
            case 'png':
              return 'image/png';
            case 'gif':
              return 'image/gif';
            default:
              return `image/${extension}`;
          }
        };

        // Create file name for upload
        const fileExtension = asset.uri.split('.').pop();
        const fileName = `avatar_${currentUser?.id}_${new Date().getTime()}.${fileExtension}`;
        const contentType = getContentType(fileExtension);
        
        // Convert image to array buffer for upload
        const base64 = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const decoded = atob(base64);
        const uint8Array = new Uint8Array(decoded.length);
        for (let i = 0; i < decoded.length; i++) {
          uint8Array[i] = decoded.charCodeAt(i);
        }

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, uint8Array.buffer, {
            cacheControl: '3600',
            upsert: false,
            contentType: contentType,
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw new Error('Failed to upload image');
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);

        console.log('Upload successful, public URL:', publicUrl);
        
        // Save to database immediately (like senecom)
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({ 
            avatar: publicUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentUser?.id);

        if (updateError) {
          console.error('Error updating avatar in database:', updateError);
          throw new Error('Failed to save avatar');
        }

        // Update local state
        setAvatar(publicUrl);
        
        // Refresh profile to sync with AuthContext
        await refreshProfile();
        
        console.log('Avatar saved successfully to database and state updated');
        Alert.alert('Success', 'Avatar updated successfully!');
      }
    } catch (error: any) {
      console.error('Error changing photo:', error);
      Alert.alert('Error', error.message || 'Failed to change photo');
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      console.log('=== SAVE PROCESS DEBUG ===');
      console.log('Current avatar state:', avatar);
      console.log('Current user avatar:', currentUser?.avatar);
      
      // Check if username is already taken (if changed)
      if (formData.username !== currentUser?.username) {
        const { data: existingUser } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('username', formData.username)
          .neq('id', currentUser?.id)
          .single();

        if (existingUser) {
          setErrors({ username: 'Username is already taken' });
          setLoading(false);
          return;
        }
      }

      // Update profile
      console.log('Saving profile with avatar:', avatar);
      const { error } = await supabase
        .from('user_profiles')
        .update({
          name: formData.name.trim(),
          username: formData.username.trim(),
          bio: formData.bio.trim() || null,
          location: formData.location.trim() || null,
          website: formData.website.trim() || null,
          profession: formData.profession.trim() || null,
          phone: formData.phone.trim() || null,
          interests: formData.interests.trim() || null,
          education: formData.education.trim() || null,
          experience: formData.experience.trim() || null,
          skills: formData.skills.trim() || null,
          avatar: avatar || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentUser?.id);

      if (error) throw error;

      console.log('Profile updated successfully, refreshing...');
      // Refresh the profile data
      await refreshProfile();
      console.log('Profile refreshed');
      
      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);

    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!currentUser) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

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

      {/* Header */}
      <Animated.View style={[styles.header, { opacity: fadeAnimation }]}>
        <BlurView intensity={15} tint="dark" style={styles.headerBlur}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
              <BlurView intensity={20} tint="light" style={styles.headerButtonBlur}>
                <Ionicons name="arrow-back" size={24} color="white" />
              </BlurView>
            </TouchableOpacity>
            
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Edit Profile</Text>
            </View>
            
            <TouchableOpacity 
              onPress={handleSave} 
              style={[styles.saveButton, loading && styles.saveButtonDisabled]}
              disabled={loading}
            >
              <BlurView intensity={20} tint="light" style={styles.saveButtonBlur}>
                {loading ? (
                  <Text style={styles.saveButtonText}>Saving...</Text>
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
              </BlurView>
            </TouchableOpacity>
          </View>
        </BlurView>
      </Animated.View>

      <KeyboardAvoidingView 
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Profile Picture Section */}
          <Animated.View style={[styles.avatarSection, { opacity: fadeAnimation }]}>
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={['#f093fb', '#f5576c', '#4facfe', '#00f2fe']}
                style={styles.avatarRing}
              >
                {(avatar || currentUser.avatar) ? (
                  <Image 
                    source={{ uri: avatar || currentUser.avatar }} 
                    style={styles.avatar}
                    onError={(error) => {
                      console.log('Avatar loading error:', error.nativeEvent);
                    }}
                    onLoad={() => {
                      console.log('Avatar loaded successfully');
                    }}
                  />
                ) : (
                  <View style={[styles.avatar, styles.defaultAvatar]}>
                    <Ionicons name="person" size={50} color="rgba(255,255,255,0.6)" />
                  </View>
                )}
                {avatarLoading && (
                  <View style={styles.avatarLoadingOverlay}>
                    <Text style={styles.avatarLoadingText}>Uploading...</Text>
                  </View>
                )}
              </LinearGradient>
              <TouchableOpacity 
                style={[styles.changePhotoButton, avatarLoading && styles.changePhotoButtonDisabled]}
                onPress={handleChangePhoto}
                disabled={avatarLoading}
              >
                <BlurView intensity={15} tint="dark" style={styles.changePhotoBlur}>
                  {avatarLoading ? (
                    <>
                      <Ionicons name="hourglass" size={16} color="white" />
                      <Text style={styles.changePhotoText}>Uploading...</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="camera" size={16} color="white" />
                      <Text style={styles.changePhotoText}>Change Photo</Text>
                    </>
                  )}
                </BlurView>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Form Fields */}
          <Animated.View style={[styles.formSection, { opacity: fadeAnimation }]}>
            
            {/* Name Field */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Display Name *</Text>
              <View style={styles.inputContainer}>
                <BlurView intensity={10} tint="dark" style={styles.inputBlur}>
                  <TextInput
                    style={[styles.input, errors.name && styles.inputError]}
                    value={formData.name}
                    onChangeText={(value) => handleFieldChange('name', value)}
                    placeholder="Enter your display name"
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    maxLength={50}
                  />
                </BlurView>
              </View>
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>

            {/* Username Field */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Username *</Text>
              <View style={styles.inputContainer}>
                <BlurView intensity={10} tint="dark" style={styles.inputBlur}>
                  <Text style={styles.inputPrefix}>@</Text>
                  <TextInput
                    style={[styles.input, styles.usernameInput, errors.username && styles.inputError]}
                    value={formData.username}
                    onChangeText={(value) => handleFieldChange('username', value.toLowerCase())}
                    placeholder="username"
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    maxLength={30}
                    autoCapitalize="none"
                  />
                </BlurView>
              </View>
              {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}
            </View>

            {/* Bio Field */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Bio</Text>
              <View style={styles.inputContainer}>
                <BlurView intensity={10} tint="dark" style={styles.inputBlur}>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={formData.bio}
                    onChangeText={(value) => handleFieldChange('bio', value)}
                    placeholder="Tell us about yourself..."
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    multiline
                    numberOfLines={4}
                    maxLength={160}
                  />
                </BlurView>
              </View>
              <Text style={styles.characterCount}>
                {formData.bio.length}/160
              </Text>
            </View>

            {/* Location Field */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Location</Text>
              <View style={styles.inputContainer}>
                <BlurView intensity={10} tint="dark" style={styles.inputBlur}>
                  <Ionicons name="location" size={16} color="rgba(255,255,255,0.7)" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={formData.location}
                    onChangeText={(value) => handleFieldChange('location', value)}
                    placeholder="Where are you based?"
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    maxLength={50}
                  />
                </BlurView>
              </View>
            </View>

            {/* Profession Field */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Profession</Text>
              <View style={styles.inputContainer}>
                <BlurView intensity={10} tint="dark" style={styles.inputBlur}>
                  <Ionicons name="briefcase" size={16} color="rgba(255,255,255,0.7)" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={formData.profession}
                    onChangeText={(value) => handleFieldChange('profession', value)}
                    placeholder="What do you do?"
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    maxLength={50}
                  />
                </BlurView>
              </View>
            </View>

            {/* Website Field */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Website</Text>
              <View style={styles.inputContainer}>
                <BlurView intensity={10} tint="dark" style={styles.inputBlur}>
                  <Ionicons name="link" size={16} color="rgba(255,255,255,0.7)" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, errors.website && styles.inputError]}
                    value={formData.website}
                    onChangeText={(value) => handleFieldChange('website', value)}
                    placeholder="https://yourwebsite.com"
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    keyboardType="url"
                    autoCapitalize="none"
                    maxLength={100}
                  />
                </BlurView>
              </View>
              {errors.website && <Text style={styles.errorText}>{errors.website}</Text>}
            </View>

            {/* Phone Field */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Phone Number</Text>
              <View style={styles.inputContainer}>
                <BlurView intensity={10} tint="dark" style={styles.inputBlur}>
                  <Ionicons name="call" size={16} color="rgba(255,255,255,0.7)" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, errors.phone && styles.inputError]}
                    value={formData.phone}
                    onChangeText={(value) => handleFieldChange('phone', value)}
                    placeholder="+1 (555) 000-0000"
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    keyboardType="phone-pad"
                    maxLength={20}
                  />
                </BlurView>
              </View>
              {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
            </View>

            {/* Education Field */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Education</Text>
              <View style={styles.inputContainer}>
                <BlurView intensity={10} tint="dark" style={styles.inputBlur}>
                  <Ionicons name="school" size={16} color="rgba(255,255,255,0.7)" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={formData.education}
                    onChangeText={(value) => handleFieldChange('education', value)}
                    placeholder="Your educational background..."
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    multiline
                    numberOfLines={3}
                    maxLength={200}
                  />
                </BlurView>
              </View>
              <Text style={styles.characterCount}>
                {formData.education.length}/200
              </Text>
            </View>

            {/* Experience Field */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Work Experience</Text>
              <View style={styles.inputContainer}>
                <BlurView intensity={10} tint="dark" style={styles.inputBlur}>
                  <Ionicons name="business" size={16} color="rgba(255,255,255,0.7)" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={formData.experience}
                    onChangeText={(value) => handleFieldChange('experience', value)}
                    placeholder="Your work experience..."
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    multiline
                    numberOfLines={4}
                    maxLength={300}
                  />
                </BlurView>
              </View>
              <Text style={styles.characterCount}>
                {formData.experience.length}/300
              </Text>
            </View>

            {/* Skills Field */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Skills & Expertise</Text>
              <View style={styles.inputContainer}>
                <BlurView intensity={10} tint="dark" style={styles.inputBlur}>
                  <Ionicons name="bulb" size={16} color="rgba(255,255,255,0.7)" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={formData.skills}
                    onChangeText={(value) => handleFieldChange('skills', value)}
                    placeholder="List your skills, separated by commas..."
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    multiline
                    numberOfLines={3}
                    maxLength={200}
                  />
                </BlurView>
              </View>
              <Text style={styles.characterCount}>
                {formData.skills.length}/200
              </Text>
            </View>

            {/* Interests Field */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Interests & Hobbies</Text>
              <View style={styles.inputContainer}>
                <BlurView intensity={10} tint="dark" style={styles.inputBlur}>
                  <Ionicons name="heart" size={16} color="rgba(255,255,255,0.7)" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={formData.interests}
                    onChangeText={(value) => handleFieldChange('interests', value)}
                    placeholder="What are you passionate about?"
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    multiline
                    numberOfLines={3}
                    maxLength={150}
                  />
                </BlurView>
              </View>
              <Text style={styles.characterCount}>
                {formData.interests.length}/150
              </Text>
            </View>

          </Animated.View>

          {/* Save Button (Bottom) */}
          <Animated.View style={[styles.bottomButtonSection, { opacity: fadeAnimation }]}>
            <TouchableOpacity 
              onPress={handleSave}
              style={[styles.saveButtonLarge, loading && styles.saveButtonDisabled]}
              disabled={loading}
            >
              <LinearGradient
                colors={loading ? ['#6B7280', '#4B5563'] : ['#10B981', '#059669']}
                style={styles.saveButtonGradient}
              >
                <Ionicons 
                  name={loading ? "hourglass" : "checkmark"} 
                  size={20} 
                  color="white" 
                />
                <Text style={styles.saveButtonLargeText}>
                  {loading ? 'Saving Changes...' : 'Save Changes'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundOrbs: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  orb1: {
    position: 'absolute',
    top: 120,
    right: 30,
    width: 100,
    height: 100,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 50,
    opacity: 0.8,
  },
  orb2: {
    position: 'absolute',
    top: 300,
    left: -20,
    width: 80,
    height: 80,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 40,
    opacity: 0.6,
  },
  orb3: {
    position: 'absolute',
    bottom: 200,
    right: 40,
    width: 120,
    height: 120,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 60,
    opacity: 0.7,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingTop: 50,
    paddingBottom: 10,
  },
  headerBlur: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  headerButtonBlur: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  saveButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonBlur: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingTop: 120,
  },
  avatarSection: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 30,
  },
  avatarContainer: {
    alignItems: 'center',
    gap: 15,
  },
  avatarRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 112,
    height: 112,
    borderRadius: 56,
  },
  defaultAvatar: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  changePhotoButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  changePhotoBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
  },
  changePhotoText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  changePhotoButtonDisabled: {
    opacity: 0.6,
  },
  avatarLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLoadingText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  formSection: {
    paddingHorizontal: 20,
    gap: 20,
  },
  fieldContainer: {
    gap: 8,
  },
  fieldLabel: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  inputContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  inputBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  inputPrefix: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 4,
  },
  input: {
    flex: 1,
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  usernameInput: {
    flex: 1,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputError: {
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  characterCount: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  bottomButtonSection: {
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  saveButtonLarge: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  saveButtonLargeText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
});