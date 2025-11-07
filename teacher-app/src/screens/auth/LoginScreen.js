import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text,
  StyleSheet, 
  StatusBar,
  KeyboardAvoidingView, 
  Platform, 
  ScrollView,
  Dimensions,
  Animated,
  TouchableOpacity,
  Image,
} from 'react-native';
import { 
  TextInput, 
  Button, 
  Snackbar
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';

const { width, height } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Animations
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);
  const scaleAnim = new Animated.Value(0.8);

  const { login } = useAuth();

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    const result = await login(email, password);

    if (!result.success) {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <View style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardContainer}
        >
          {/* Header Section */}
          <Animated.View 
            style={[
              styles.headerSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
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
          </Animated.View>

          {/* Login Form */}
          <Animated.View 
            style={[
              styles.formSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <View style={styles.loginCard}>
              <Text style={styles.welcomeText}>Welcome Back</Text>
              <Text style={styles.loginSubtext}>Sign in to your account</Text>
              
              <View style={styles.inputContainer}>
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

                <TouchableOpacity
                  onPress={handleLogin}
                  disabled={loading}
                  style={styles.loginButton}
                >
                  <Text style={styles.loginButtonText}>
                    {loading ? 'Signing In...' : 'SIGN IN'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    // TODO: Implement forgot password functionality
                    console.log('Forgot password pressed');
                  }}
                  style={styles.forgotPasswordButton}
                >
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => navigation.navigate('Register')}
                  style={styles.registerButton}
                >
                  <Text style={styles.registerButtonText}>Create New Account</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>

          {/* Footer */}
          <Animated.View 
            style={[
              styles.footer,
              { opacity: fadeAnim }
            ]}
          >
            <Text style={styles.footerText}>
              UNICEF × Ministry of Education • Ghana 🇬🇭
            </Text>
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
    paddingTop: 40,
    paddingBottom: 30,
  },

  // Header Section
  headerSection: {
    alignItems: 'center',
    flex: 0.3,
    justifyContent: 'center',
    paddingTop: 20,
  },
  unicefLogoContainer: {
    marginBottom: 16,
  },
  unicefLogo: {
    width: 100,
    height: 70,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1CABE2',
    textAlign: 'center',
    marginBottom: 8,
  },
  partnersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 16,
  },
  gesLogo: {
    width: 40,
    height: 48,
  },
  armsLogo: {
    width: 40,
    height: 48,
  },
  appSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '400',
    marginBottom: 4,
  },

  // Form Section
  formSection: {
    flex: 0.6,
    justifyContent: 'flex-start',
    paddingTop: 0,
  },
  loginCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#374785',
    textAlign: 'center',
    marginBottom: 8,
  },
  loginSubtext: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    fontWeight: '400',
  },
  inputContainer: {
    width: '100%',
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  loginButton: {
    marginTop: 8,
    marginBottom: 16,
    backgroundColor: '#1CABE2',
    borderRadius: 12,
    paddingVertical: 16,
    shadowColor: '#1CABE2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 1,
  },
  forgotPasswordButton: {
    paddingVertical: 8,
    marginVertical: 8,
  },
  forgotPasswordText: {
    color: '#1CABE2',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  registerButton: {
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1CABE2',
    backgroundColor: 'transparent',
    marginTop: 8,
  },
  registerButtonText: {
    color: '#1CABE2',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Footer
  footer: {
    flex: 0.1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 10,
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
