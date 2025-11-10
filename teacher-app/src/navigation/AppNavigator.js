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
import AddStudentScreen from '../screens/students/AddStudentScreen';
import AttendanceScreen from '../screens/attendance/AttendanceScreen';
import AttendanceHistoryScreen from '../screens/attendance/AttendanceHistoryScreen';
import FollowUpScreen from '../screens/FollowUpScreen';
import CallLogScreen from '../screens/CallLogScreen';
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
          position: 'absolute',
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          height: 65,
          paddingBottom: 10,
          paddingTop: 10,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          borderRadius: 20,
          marginHorizontal: 15,
          marginBottom: 15,
          overflow: 'hidden',
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
        component={HomeNavigator}
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
        component={AttendanceNavigator}
        options={{ 
          title: 'Mark Attendance',
          tabBarLabel: 'Attendance',
          headerShown: false,
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ 
          title: 'My Profile',
          tabBarLabel: 'Profile',
          headerShown: false,
        }}
      />
    </Tab.Navigator>
  );
}

// Home Stack Navigator
function HomeNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#1CABE2' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen 
        name="Dashboard" 
        component={HomeScreen}
        options={{ title: 'Home', headerShown: false }}
      />
      <Stack.Screen 
        name="FollowUp" 
        component={FollowUpScreen}
        options={{ title: 'Follow-Up Queue', headerShown: false }}
      />
      <Stack.Screen 
        name="CallLog" 
        component={CallLogScreen}
        options={{ title: 'Call Logs', headerShown: false }}
      />
    </Stack.Navigator>
  );
}

// Attendance Stack Navigator
function AttendanceNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#1CABE2' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen 
        name="MarkAttendance" 
        component={AttendanceScreen}
        options={{ title: 'Mark Attendance', headerShown: false }}
      />
      <Stack.Screen 
        name="AttendanceHistory" 
        component={AttendanceHistoryScreen}
        options={{ title: 'Attendance History', headerShown: false }}
      />
    </Stack.Navigator>
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
        options={{ title: 'My Students', headerShown: false }}
      />
      <Stack.Screen 
        name="StudentDetail" 
        component={StudentDetailScreen}
        options={{ title: 'Student Details', headerShown: false }}
      />
      <Stack.Screen 
        name="AddStudent" 
        component={AddStudentScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="CallLog" 
        component={CallLogScreen}
        options={{ title: 'Call Logs', headerShown: false }}
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
