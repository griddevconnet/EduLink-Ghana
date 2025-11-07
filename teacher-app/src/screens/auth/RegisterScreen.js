import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Animated,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { TextInput, Snackbar } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';

const { height } = Dimensions.get('window');

export default function RegisterScreen({ navigation }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { register } = useAuth();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleRegister = async () => {
    if (!firstName || !lastName || !email || !phone || !password) {
      setError('Please fill in all fields');
      return;
    }

    // Validate phone number format
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    if (!phoneRegex.test(phone.trim())) {
      setError('Phone number must be 10-15 digits (e.g., +233123456789 or 0123456789)');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('Starting registration...');
      const result = await register({
        firstName,
        lastName,
        email,
        phone,
        password,
      });
      
      console.log('Registration result:', result);
      
      if (!result.success) {
        setError(result.error || 'Registration failed');
      }
      // If successful, user will be automatically logged in and redirected
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.container}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          <Animated.View style={[styles.keyboardContainer, { opacity: fadeAnim }]}>
            {/* Header Section */}
            <View style={styles.headerSection}>
              {/* UNICEF Logo */}
              <View style={styles.unicefLogoContainer}>
                <Image
                  source={require('../../../assets/UNICEF.png')}
                  style={styles.unicefLogo}
                  resizeMode="contain"
                />
              </View>

              <Text style={styles.appTitle}>EduLink Ghana</Text>
              <Text style={styles.appSubtitle}>In collaboration with</Text>
              
              {/* GES and Ghana Coat of Arms */}
              <View style={styles.partnersContainer}>
                <Image
                  source={require('../../../assets/GES.png')}
                  style={styles.gesLogo}
                  resizeMode="contain"
                />
                <Image
                  source={require('../../../assets/ARMS (2).png')}
                  style={styles.armsLogo}
                  resizeMode="contain"
                />
              </View>
            </View>

            {/* Form Section */}
            <ScrollView 
              style={styles.scrollView}
              contentContainerStyle={styles.formSection}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.registerCard}>
                <Text style={styles.welcomeText}>Create Account</Text>
                <Text style={styles.subtitleText}>Join the EduLink Ghana community</Text>
                  {/* Name Row */}
                  <View style={styles.nameRow}>
                    <TextInput
                      label="First Name"
                      value={firstName}
                      onChangeText={setFirstName}
                      mode="outlined"
                      style={[styles.input, styles.nameInput]}
                      outlineStyle={{ borderRadius: 25 }}
                      theme={{
                        colors: {
                          primary: '#1CABE2',
                          outline: '#D1D5DB',
                          onSurfaceVariant: '#6B7280',
                        }
                      }}
                      outlineColor="#D1D5DB"
                      activeOutlineColor="#1CABE2"
                    />
                    <TextInput
                      label="Last Name"
                      value={lastName}
                      onChangeText={setLastName}
                      mode="outlined"
                      style={[styles.input, styles.nameInput]}
                      outlineStyle={{ borderRadius: 25 }}
                      theme={{
                        colors: {
                          primary: '#1CABE2',
                          outline: '#D1D5DB',
                          onSurfaceVariant: '#6B7280',
                        }
                      }}
                      outlineColor="#D1D5DB"
                      activeOutlineColor="#1CABE2"
                    />
                  </View>

                  <TextInput
                    label="Email Address"
                    value={email}
                    onChangeText={setEmail}
                    mode="outlined"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    left={<TextInput.Icon icon="email-outline" />}
                    style={styles.input}
                    outlineStyle={{ borderRadius: 25 }}
                    theme={{
                      colors: {
                        primary: '#1CABE2',
                        outline: '#D1D5DB',
                        onSurfaceVariant: '#6B7280',
                      }
                    }}
                    outlineColor="#D1D5DB"
                    activeOutlineColor="#1CABE2"
                  />

                  <TextInput
                    label="Phone Number"
                    value={phone}
                    onChangeText={setPhone}
                    mode="outlined"
                    keyboardType="phone-pad"
                    left={<TextInput.Icon icon="phone-outline" />}
                    style={styles.input}
                    outlineStyle={{ borderRadius: 25 }}
                    theme={{
                      colors: {
                        primary: '#1CABE2',
                        outline: '#D1D5DB',
                        onSurfaceVariant: '#6B7280',
                      }
                    }}
                    outlineColor="#D1D5DB"
                    activeOutlineColor="#1CABE2"
                  />

                  <TextInput
                    label="Password"
                    value={password}
                    onChangeText={setPassword}
                    mode="outlined"
                    secureTextEntry={!showPassword}
                    left={<TextInput.Icon icon="lock-outline" />}
                    right={
                      <TextInput.Icon
                        icon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        onPress={() => setShowPassword(!showPassword)}
                      />
                    }
                    style={styles.input}
                    outlineStyle={{ borderRadius: 25 }}
                    theme={{
                      colors: {
                        primary: '#1CABE2',
                        outline: '#D1D5DB',
                        onSurfaceVariant: '#6B7280',
                      }
                    }}
                    outlineColor="#D1D5DB"
                    activeOutlineColor="#1CABE2"
                  />

                  <TextInput
                    label="Confirm Password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    mode="outlined"
                    secureTextEntry={!showConfirmPassword}
                    left={<TextInput.Icon icon="lock-check-outline" />}
                    right={
                      <TextInput.Icon
                        icon={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      />
                    }
                    style={styles.input}
                    outlineStyle={{ borderRadius: 25 }}
                    theme={{
                      colors: {
                        primary: '#1CABE2',
                        outline: '#D1D5DB',
                        onSurfaceVariant: '#6B7280',
                      }
                    }}
                    outlineColor="#D1D5DB"
                    activeOutlineColor="#1CABE2"
                  />

                  <TouchableOpacity
                    onPress={handleRegister}
                    disabled={loading}
                    style={styles.registerButton}
                  >
                    <Text style={styles.registerButtonText}>
                      {loading ? 'Creating Account...' : 'CREATE ACCOUNT'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => navigation.navigate('Login')}
                    style={styles.loginButton}
                  >
                    <Text style={styles.loginButtonText}>Already have an account? Sign In</Text>
                  </TouchableOpacity>
              </View>
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                UNICEF × Ministry of Education • Ghana 🇬🇭
              </Text>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>

      <Snackbar
        visible={!!error}
        onDismiss={() => setError('')}
        duration={4000}
        action={{
          label: 'OK',
          onPress: () => setError(''),
          textColor: '#1CABE2'
        }}
        style={styles.snackbar}
      >
        {error}
      </Snackbar>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 10,
  },

  // Header Section
  headerSection: {
    alignItems: 'center',
    flex: 0.22,
    justifyContent: 'flex-start',
    paddingTop: 10,
  },
  unicefLogoContainer: {
    marginBottom: 8,
  },
  unicefLogo: {
    width: 70,
    height: 48,
  },
  appTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1CABE2',
    textAlign: 'center',
    marginBottom: 4,
  },
  partnersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    gap: 10,
  },
  gesLogo: {
    width: 30,
    height: 36,
  },
  armsLogo: {
    width: 30,
    height: 36,
  },
  appSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '400',
    marginBottom: 8,
  },

  // ScrollView
  scrollView: {
    flex: 1,
  },
  // Form Section
  formSection: {
    paddingTop: 30,
    paddingBottom: 80,
  },
  registerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#374785',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitleText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 10,
  },
  inputContainer: {
    width: '100%',
  },
  nameRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  nameInput: {
    flex: 1,
    marginBottom: 0,
    backgroundColor: '#FFFFFF',
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  registerButton: {
    marginTop: 4,
    marginBottom: 10,
    backgroundColor: '#1CABE2',
    borderRadius: 12,
    paddingVertical: 14,
    shadowColor: '#1CABE2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 1,
  },
  loginButton: {
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1CABE2',
    backgroundColor: 'transparent',
  },
  loginButtonText: {
    color: '#1CABE2',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 20,
    paddingTop: 10,
    backgroundColor: '#FFFFFF',
  },
  footerText: {
    color: '#6B7280',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },

  // Snackbar
  snackbar: {
    backgroundColor: '#374151',
    borderRadius: 8,
  },
});
