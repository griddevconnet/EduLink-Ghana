import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  RefreshControl, 
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Image,
} from 'react-native';
import { Card, ActivityIndicator, Avatar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { schoolAPI, studentAPI, attendanceAPI } from '../services/api';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalStudents: 0,
    presentToday: 0,
    absentToday: 0,
    atRisk: 0,
    attendanceRate: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load dashboard statistics from backend
      const today = new Date().toISOString().split('T')[0];
      
      // Initialize default values
      let totalStudents = 0;
      let presentToday = 0;
      let absentToday = 0;
      let atRisk = 0;
      let attendanceRate = 0;
      
      // Get students count
      try {
        const studentsResponse = await studentAPI.getStudents({ limit: 1 });
        totalStudents = studentsResponse.data?.pagination?.total || 0;
      } catch (err) {
        console.log('Could not fetch students:', err.message);
      }
      
      // Get today's attendance
      try {
        const attendanceResponse = await attendanceAPI.getAttendance({ date: today });
        const attendanceData = attendanceResponse.data?.data;
        
        // Check if attendanceData is an array
        if (Array.isArray(attendanceData)) {
          presentToday = attendanceData.filter(a => a.status === 'present').length;
          absentToday = attendanceData.filter(a => a.status === 'absent').length;
        } else {
          console.log('Attendance data is not an array:', attendanceData);
        }
      } catch (err) {
        console.log('Could not fetch attendance:', err.message);
      }
      
      // Calculate attendance rate
      attendanceRate = totalStudents > 0 ? Math.round((presentToday / totalStudents) * 100) : 0;
      
      // Get at-risk students (those with low attendance)
      try {
        const atRiskResponse = await studentAPI.getAtRiskStudents();
        const atRiskData = atRiskResponse.data?.data;
        atRisk = Array.isArray(atRiskData) ? atRiskData.length : 0;
      } catch (err) {
        console.log('Could not fetch at-risk students:', err.message);
      }
      
      setStats({
        totalStudents,
        presentToday,
        absentToday,
        atRisk,
        attendanceRate,
      });
      
      // Set recent activity
      setRecentActivity([
        { icon: 'check-circle', text: `${presentToday} students marked present today`, time: 'Today', color: '#4CAF50' },
        { icon: 'alert-circle', text: `${absentToday} students absent`, time: 'Today', color: '#FF9800' },
        { icon: 'account-alert', text: `${atRisk} students at risk`, time: 'This week', color: '#F44336' },
      ]);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      // Use fallback data if API fails
      setStats({
        totalStudents: 0,
        presentToday: 0,
        absentToday: 0,
        atRisk: 0,
        attendanceRate: 0,
      });
      setRecentActivity([
        { icon: 'check-circle', text: 'No data available', time: 'Today', color: '#4CAF50' },
        { icon: 'alert-circle', text: 'No data available', time: 'Today', color: '#FF9800' },
        { icon: 'account-alert', text: 'No data available', time: 'This week', color: '#F44336' },
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1CABE2" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1CABE2" />
      
      {/* Header with Gradient */}
      <LinearGradient
        colors={['#1CABE2', '#374785']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Avatar.Text 
              size={50} 
              label={user?.firstName?.charAt(0) || 'T'} 
              style={styles.avatar}
              color="#1CABE2"
            />
            <View style={styles.headerText}>
              <Text style={styles.greeting}>Welcome back,</Text>
              <Text style={styles.userName}>{user?.firstName || 'Teacher'}! 👋</Text>
              <Text style={styles.schoolName}>{user?.school?.name || 'EduLink Ghana'}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <MaterialCommunityIcons name="cog" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={['#1CABE2']}
            tintColor="#1CABE2"
          />
        }
      >
        {/* Attendance Rate Card */}
        <Card style={styles.attendanceCard}>
          <LinearGradient
            colors={['#1CABE2', '#0E8FC7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.attendanceGradient}
          >
            <View style={styles.attendanceContent}>
              <View>
                <Text style={styles.attendanceLabel}>Today's Attendance</Text>
                <Text style={styles.attendanceRate}>{stats.attendanceRate}%</Text>
                <Text style={styles.attendanceSubtext}>
                  {stats.presentToday} of {stats.totalStudents} students
                </Text>
              </View>
              <MaterialCommunityIcons name="chart-donut" size={70} color="rgba(255,255,255,0.3)" />
            </View>
          </LinearGradient>
        </Card>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <TouchableOpacity 
            style={[styles.statCard, { backgroundColor: '#E3F2FD' }]}
            onPress={() => navigation.navigate('Students')}
          >
            <View style={styles.statIconContainer}>
              <MaterialCommunityIcons name="account-group" size={26} color="#1976D2" />
            </View>
            <Text style={styles.statNumber}>{stats.totalStudents}</Text>
            <Text style={styles.statLabel}>Total Students</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.statCard, { backgroundColor: '#E8F5E9' }]}
            onPress={() => navigation.navigate('Attendance')}
          >
            <View style={styles.statIconContainer}>
              <MaterialCommunityIcons name="check-circle" size={26} color="#4CAF50" />
            </View>
            <Text style={styles.statNumber}>{stats.presentToday}</Text>
            <Text style={styles.statLabel}>Present Today</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.statCard, { backgroundColor: '#FFF3E0' }]}
            onPress={() => navigation.navigate('Attendance')}
          >
            <View style={styles.statIconContainer}>
              <MaterialCommunityIcons name="alert-circle" size={26} color="#FF9800" />
            </View>
            <Text style={styles.statNumber}>{stats.absentToday}</Text>
            <Text style={styles.statLabel}>Absent Today</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.statCard, { backgroundColor: '#FFEBEE' }]}
            onPress={() => navigation.navigate('Students', { filter: 'atRisk' })}
          >
            <View style={styles.statIconContainer}>
              <MaterialCommunityIcons name="alert" size={26} color="#F44336" />
            </View>
            <Text style={styles.statNumber}>{stats.atRisk}</Text>
            <Text style={styles.statLabel}>At Risk</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('Attendance')}
            >
              <LinearGradient
                colors={['#1CABE2', '#0E8FC7']}
                style={styles.actionGradient}
              >
                <MaterialCommunityIcons name="clipboard-check" size={32} color="#FFFFFF" />
                <Text style={styles.actionText}>Mark{"\n"}Attendance</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('Students')}
            >
              <LinearGradient
                colors={['#374785', '#2A3660']}
                style={styles.actionGradient}
              >
                <MaterialCommunityIcons name="account-group" size={32} color="#FFFFFF" />
                <Text style={styles.actionText}>View{"\n"}Students</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('Reports')}
            >
              <LinearGradient
                colors={['#4CAF50', '#388E3C']}
                style={styles.actionGradient}
              >
                <MaterialCommunityIcons name="chart-bar" size={32} color="#FFFFFF" />
                <Text style={styles.actionText}>View{"\n"}Reports</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('Calls')}
            >
              <LinearGradient
                colors={['#FF9800', '#F57C00']}
                style={styles.actionGradient}
              >
                <MaterialCommunityIcons name="phone" size={32} color="#FFFFFF" />
                <Text style={styles.actionText}>Parent{"\n"}Calls</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <Card style={styles.activityCard}>
            {recentActivity.map((activity, index) => (
              <View key={index} style={styles.activityItem}>
                <View style={[styles.activityIcon, { backgroundColor: activity.color + '20' }]}>
                  <MaterialCommunityIcons name={activity.icon} size={24} color={activity.color} />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityText}>{activity.text}</Text>
                  <Text style={styles.activityTime}>{activity.time}</Text>
                </View>
              </View>
            ))}
          </Card>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    backgroundColor: '#FFFFFF',
  },
  headerText: {
    marginLeft: 15,
    flex: 1,
  },
  greeting: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.9,
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 2,
  },
  schoolName: {
    color: '#FFFFFF',
    fontSize: 12,
    opacity: 0.8,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  attendanceCard: {
    margin: 15,
    marginTop: 10,
    borderRadius: 15,
    elevation: 8,
    overflow: 'hidden',
  },
  attendanceGradient: {
    padding: 18,
  },
  attendanceContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  attendanceLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.9,
  },
  attendanceRate: {
    color: '#FFFFFF',
    fontSize: 42,
    fontWeight: 'bold',
    marginVertical: 5,
  },
  attendanceSubtext: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.9,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 10,
    marginTop: 10,
  },
  statCard: {
    width: (width - 50) / 2,
    margin: 7.5,
    padding: 15,
    borderRadius: 12,
    elevation: 3,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#374785',
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 15,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374785',
    marginBottom: 15,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: (width - 50) / 2,
    marginBottom: 15,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 4,
  },
  actionGradient: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 10,
    textAlign: 'center',
  },
  activityCard: {
    borderRadius: 15,
    elevation: 3,
    padding: 10,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  activityIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: '#374785',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: '#6B7280',
  },
});
