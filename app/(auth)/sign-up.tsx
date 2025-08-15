import { Text, View, TouchableOpacity, TextInput, StatusBar, Animated, ScrollView, Alert, StyleSheet, Dimensions } from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

const { width, height } = Dimensions.get('window');

export default function SignUpScreen() {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const slideAnimation = useRef(new Animated.Value(50)).current;
  const floatingAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnimation, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnimation, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Floating animation for background elements
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatingAnimation, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(floatingAnimation, {
          toValue: 0,
          duration: 4000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleSignUp = async () => {
    console.log('=== handleSignUp function started ===');
    console.log('Form values:', { fullName, username, email, password: 'hidden', confirmPassword: 'hidden' });
    
    try {
      console.log('Starting validation...');
      // Basic validation (exact copy from senecom)
      if (!fullName.trim()) {
        console.log('Validation failed: fullName is empty');
        alert('Please enter your full name');
        return;
      }
      if (!username.trim()) {
        alert('Please enter your username');
        return;
      }
      if (!email.trim()) {
        alert('Please enter your email');
        return;
      }
      if (!password.trim()) {
        alert('Please enter your password');
        return;
      }
      if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
      }

      // Pass user metadata to the signUp function
      console.log('Validation passed, calling supabase.auth.signUp with metadata...');
      const {
        data: { user },
        error: signUpError,
      } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            username: username.trim(),
          },
        },
      });
      console.log('Supabase signup completed:', { hasUser: !!user, error: signUpError });

      if (signUpError) {
        console.error('Signup error:', signUpError);
        Alert.alert('Error', signUpError.message);
        return;
      }

      if (user) {
        console.log('User created successfully! ID:', user.id);
        console.log('Profile will be created automatically by trigger');
        
        // Since email confirmation is disabled, user is immediately signed in
        // Navigate directly to home page
        Alert.alert(
          'Welcome!', 
          'Your account has been created successfully!',
          [{ 
            text: 'Get Started', 
            onPress: () => router.replace('/(tabs)/home') 
          }]
        );
      } else {
        // Fallback case - shouldn't happen with email confirmation disabled
        Alert.alert(
          'Account Created',
          'Welcome to the app!',
          [{ text: 'Continue', onPress: () => router.replace('/(tabs)/home') }]
        );
      }
    } catch (error) {
      console.error('Signup error:', error);
      Alert.alert('Error', 'Failed to create account. Please try again.');
    }
  };

  const floatingY = floatingAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Dynamic Background */}
      <View style={styles.backgroundContainer}>
        <LinearGradient
          colors={['#667eea', '#764ba2', '#f093fb', '#f5576c']}
          style={StyleSheet.absoluteFillObject}
        />
        <Animated.View 
          style={[
            styles.floatingOrb1,
            { transform: [{ translateY: floatingY }, { rotate: '30deg' }] }
          ]}
        />
        <Animated.View 
          style={[
            styles.floatingOrb2,
            { transform: [{ translateY: floatingAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [10, -5],
            }) }, { rotate: '-20deg' }] }
          ]}
        />
        <Animated.View 
          style={[
            styles.floatingOrb3,
            { transform: [{ translateY: floatingAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [-5, 15],
            }) }] }
          ]}
        />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>

          <Animated.View 
            style={[
              styles.formContainer,
              {
                opacity: fadeAnimation,
                transform: [{ translateY: slideAnimation }]
              }
            ]}
          >
            <Text style={styles.formTitle}>Create Account</Text>
            <Text style={styles.formSubtitle}>Fill in your details to get started</Text>

            {/* Full Name Input */}
            <View style={styles.inputGroup}>
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <Ionicons name="person-outline" size={20} color="rgba(255,255,255,0.7)" />
                  <TextInput
                    placeholder="Full name"
                    placeholderTextColor="rgba(255,255,255,0.6)"
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                    style={styles.textInput}
                  />
                </View>
              </View>
            </View>

            {/* Username Input */}
            <View style={styles.inputGroup}>
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <Ionicons name="at-outline" size={20} color="rgba(255,255,255,0.7)" />
                  <TextInput
                    placeholder="Username"
                    placeholderTextColor="rgba(255,255,255,0.6)"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={styles.textInput}
                  />
                </View>
              </View>
            </View>

            {/* Email Input */}
            <View style={styles.inputGroup}>
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <Ionicons name="mail-outline" size={20} color="rgba(255,255,255,0.7)" />
                  <TextInput
                    placeholder="Email address"
                    placeholderTextColor="rgba(255,255,255,0.6)"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={styles.textInput}
                  />
                </View>
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={20} color="rgba(255,255,255,0.7)" />
                  <TextInput
                    placeholder="Password"
                    placeholderTextColor="rgba(255,255,255,0.6)"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    style={styles.textInput}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons 
                      name={showPassword ? "eye-off-outline" : "eye-outline"} 
                      size={20} 
                      color="rgba(255,255,255,0.7)" 
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputGroup}>
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <Ionicons name="shield-checkmark-outline" size={20} color="rgba(255,255,255,0.7)" />
                  <TextInput
                    placeholder="Confirm password"
                    placeholderTextColor="rgba(255,255,255,0.6)"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    style={styles.textInput}
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    <Ionicons 
                      name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                      size={20} 
                      color="rgba(255,255,255,0.7)" 
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Terms Agreement */}
            <TouchableOpacity 
              onPress={() => setAgreeToTerms(!agreeToTerms)}
              style={styles.termsContainer}
            >
              <View style={[styles.checkbox, agreeToTerms && styles.checkboxActive]}>
                {agreeToTerms && (
                  <Ionicons name="checkmark" size={12} color="#667eea" />
                )}
              </View>
              <View style={styles.termsTextContainer}>
                <Text style={styles.termsText}>
                  I agree to the <Text style={styles.termsLink}>Terms of Service</Text> and <Text style={styles.termsLink}>Privacy Policy</Text>
                </Text>
              </View>
            </TouchableOpacity>

            {/* Sign Up Button */}
            <TouchableOpacity 
              onPress={() => {
                console.log('Button pressed');
                console.log('Button disabled?', loading || !agreeToTerms || !fullName || !username || !email || !password || !confirmPassword);
                console.log('Debug values:', { loading, agreeToTerms, fullName: !!fullName, username: !!username, email: !!email, password: !!password, confirmPassword: !!confirmPassword });
                handleSignUp();
              }}
              disabled={loading || !agreeToTerms || !fullName || !username || !email || !password || !confirmPassword}
              style={[
                styles.primaryButton,
                (!agreeToTerms || !fullName || !username || !email || !password || !confirmPassword) && styles.primaryButtonDisabled
              ]}
            >
              <LinearGradient
                colors={(!agreeToTerms || !fullName || !username || !email || !password || !confirmPassword) 
                  ? ['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)'] 
                  : ['#FF6B6B', '#4ECDC4']
                }
                style={styles.primaryButtonGradient}
              >
                <View style={styles.buttonContent}>
                  {loading ? (
                    <Ionicons name="refresh-outline" size={20} color="white" />
                  ) : (
                    <Ionicons name="person-add" size={20} color="white" />
                  )}
                  <Text style={styles.primaryButtonText}>
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Login Buttons */}
            <View style={styles.socialButtonsContainer}>
              <TouchableOpacity style={styles.socialButton}>
                <Ionicons name="logo-google" size={24} color="white" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton}>
                <Ionicons name="logo-apple" size={24} color="white" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton}>
                <Ionicons name="logo-github" size={24} color="white" />
              </TouchableOpacity>
            </View>

            {/* Sign In Link */}
            <View style={styles.linkContainer}>
              <Text style={styles.linkText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/sign-in')}>
                <Text style={styles.linkButton}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Footer */}
          <Animated.View 
            style={[styles.footer, { opacity: fadeAnimation }]}
          >
            <Text style={styles.footerText}>
              By creating an account, you agree to our Terms of Service and Privacy Policy
            </Text>
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  backgroundContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  floatingOrb1: {
    position: 'absolute',
    top: 80,
    right: 30,
    width: 120,
    height: 120,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 60,
    opacity: 0.6,
  },
  floatingOrb2: {
    position: 'absolute',
    top: 200,
    left: -20,
    width: 80,
    height: 80,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    opacity: 0.4,
  },
  floatingOrb3: {
    position: 'absolute',
    bottom: 200,
    right: 50,
    width: 100,
    height: 100,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 50,
    opacity: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 50,
    minHeight: height,
  },
  formContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 24,
    padding: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 20,
  },
  formTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  textInput: {
    flex: 1,
    marginLeft: 12,
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  checkboxActive: {
    backgroundColor: 'white',
  },
  termsTextContainer: {
    flex: 1,
  },
  termsText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    lineHeight: 20,
  },
  termsLink: {
    color: 'white',
    fontWeight: '600',
  },
  primaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  primaryButtonDisabled: {
    shadowOpacity: 0.1,
  },
  primaryButtonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  dividerText: {
    color: 'rgba(255,255,255,0.6)',
    marginHorizontal: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    gap: 16,
  },
  socialButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  linkText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    fontWeight: '500',
  },
  linkButton: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
