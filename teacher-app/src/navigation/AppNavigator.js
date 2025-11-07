import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Main Screens
import HomeScreen from '../screens/HomeScreen';
import StudentsScreen from '../screens/students/StudentsScreen';
import StudentDetailScreen from '../screens/students/StudentDetailScreen';
import AttendanceScreen from '../screens/attendance/AttendanceScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Auth Stack Navigator
function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#1CABE2' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen 
        name="Login" 
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Register" 
        component={RegisterScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

// Main Tab Navigator
function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Students') {
            iconName = focused ? 'account-group' : 'account-group-outline';
          } else if (route.name === 'Attendance') {
            iconName = focused ? 'clipboard-check' : 'clipboard-check-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'account' : 'account-outline';
          }

          return <MaterialCommunityIcons name={iconName} size={26} color={color} />;
        },
        tabBarActiveTintColor: '#1CABE2',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
        headerStyle: { backgroundColor: '#1CABE2' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ 
          title: 'Home',
          headerShown: false,
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen 
        name="Students" 
        component={StudentsNavigator}
        options={{ 
          headerShown: false,
          tabBarLabel: 'Students',
        }}
      />
      <Tab.Screen 
        name="Attendance" 
        component={AttendanceScreen}
        options={{ 
          title: 'Mark Attendance',
          tabBarLabel: 'Attendance',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ 
          title: 'My Profile',
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
}

// Students Stack Navigator
function StudentsNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#1CABE2' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen 
        name="StudentsList" 
        component={StudentsScreen}
        options={{ title: 'My Students' }}
      />
      <Stack.Screen 
        name="StudentDetail" 
        component={StudentDetailScreen}
        options={{ title: 'Student Details' }}
      />
    </Stack.Navigator>
  );
}

// Main App Navigator
export default function AppNavigator() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return null; // Or a loading screen
  }

  return isAuthenticated ? <MainNavigator /> : <AuthNavigator />;
}
