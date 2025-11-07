import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  ActivityIndicator,
  Chip,
  FAB,
  Avatar,
  Divider,
  SegmentedButtons,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { studentAPI, attendanceAPI } from '../../services/api';

const { width } = Dimensions.get('window');

export default function AttendanceScreen({ navigation }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState('mark'); // 'mark' or 'history'
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load students
      console.log('Loading students...');
      const params = {
        limit: 50,
        page: 1,
        enrollmentStatus: 'enrolled'
      };
      
      const studentsResponse = await studentAPI.getStudents(params);
      console.log('Full students API response:', studentsResponse);
      console.log('Students data structure:', studentsResponse.data);
      
      // Try different possible data structures like StudentsScreen does
      const studentsList = studentsResponse.data?.data?.students || studentsResponse.data?.students || [];
      console.log('Students loaded:', studentsList.length);
      console.log('Students array:', studentsList);
      setStudents(studentsList);

      // Only load attendance if there are students
      if (studentsList.length > 0) {
        console.log('Loading attendance for date:', selectedDate);
        const attendanceResponse = await attendanceAPI.getAttendance({
          startDate: selectedDate,
          endDate: selectedDate,
          limit: 100
        });
        console.log('Attendance response:', attendanceResponse.data);
        
        // Convert attendance array to object for easy lookup
        const attendanceMap = {};
        if (attendanceResponse.data.attendance) {
          attendanceResponse.data.attendance.forEach(record => {
            attendanceMap[record.student._id || record.student] = record.status;
          });
        }
        setAttendanceData(attendanceMap);
      } else {
        console.log('No students found, skipping attendance load');
        setAttendanceData({});
      }

    } catch (error) {
      console.error('Error loading attendance data:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      const errorMessage = error.response?.data?.message || 'Failed to load attendance data';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const toggleAttendance = (studentId, currentStatus) => {
    const newStatus = currentStatus === 'present' ? 'absent' : 'present';
    console.log(`Toggling attendance for student ${studentId}: ${currentStatus} → ${newStatus}`);
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: newStatus
    }));
  };

  const markAllPresent = () => {
    const allPresentData = {};
    students.forEach(student => {
      allPresentData[student._id] = 'present';
    });
    setAttendanceData(allPresentData);
  };

  const markAllAbsent = () => {
    const allAbsentData = {};
    students.forEach(student => {
      allAbsentData[student._id] = 'absent';
    });
    setAttendanceData(allAbsentData);
  };

  const testBackendConnection = async () => {
    try {
      console.log('🧪 TESTING BACKEND CONNECTION FOR ATTENDANCE...');
      
      // Step 0: Check authentication status
      console.log('🧪 Step 0: Checking authentication...');
      console.log('🧪 User authenticated:', !!user);
      console.log('🧪 User role:', user?.role);
      console.log('🧪 User school ID:', user?.school?._id || user?.school);
      
      // Test profile endpoint to see current user data
      let profileResponse = null;
      try {
        console.log('🧪 Step 0.5: Fetching fresh user profile...');
        const { authAPI } = require('../../services/api');
        profileResponse = await authAPI.getProfile();
        console.log('🧪 Fresh profile data:', profileResponse.data);
        console.log('🧪 Fresh profile school:', profileResponse.data?.user?.school);
      } catch (profileError) {
        console.log('❌ Profile fetch failed:', profileError.message);
        console.log('❌ Profile error status:', profileError.response?.status);
      }
      
      // Check if auth token exists
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const token = await AsyncStorage.getItem('authToken');
      console.log('🧪 Auth token exists:', !!token);
      console.log('🧪 Auth token preview:', token ? `${token.substring(0, 20)}...` : 'null');
      
      // First test: Check if we can reach the attendance endpoint at all
      console.log('🧪 Step 1: Testing attendance GET endpoint...');
      try {
        const getResponse = await attendanceAPI.getAttendance({ limit: 1 });
        console.log('✅ GET attendance endpoint works:', getResponse.status);
      } catch (getError) {
        console.log('❌ GET attendance endpoint failed:', getError.message);
        console.log('❌ GET error status:', getError.response?.status);
        console.log('❌ GET error response:', getError.response?.data);
      }
      
      // Second test: Try to submit attendance
      console.log('🧪 Step 2: Testing attendance POST endpoint...');
      
      // Get user's school ID (required by backend)
      const schoolId = user?.school?._id || user?.school;
      
      // Validate school ID before sending
      if (!schoolId) {
        console.log('❌ No school ID found for user!');
        Alert.alert('Error', 'User has no school associated. Please check your profile.');
        return;
      }
      
      // Check if backend user has school association
      if (!profileResponse?.data?.user?.school) {
        console.log('❌ Backend user has no school! Frontend has school but backend is missing.');
        console.log('🔧 Attempting to fix school association...');
        
        try {
          const { authAPI } = require('../../services/api');
          const updateResponse = await authAPI.updateProfile({
            school: schoolId
          });
          console.log('✅ School association updated:', updateResponse.data);
          Alert.alert('Fixed', 'School association has been updated. Please try again.');
          return;
        } catch (updateError) {
          console.log('❌ Failed to update school association:', updateError.message);
          Alert.alert('Error', 'Failed to fix school association. Please contact support.');
          return;
        }
      }
      
      const testData = {
        school: schoolId,
        date: selectedDate,
        records: [{
          student: students[0]?._id || 'test-student-id',
          status: 'present'
        }]
      };
      
      console.log('🧪 Test data:', testData);
      console.log('🧪 School ID being sent:', schoolId);
      console.log('🧪 School ID type:', typeof schoolId);
      console.log('🧪 User object:', user);
      console.log('🧪 User role:', user?.role);
      console.log('🧪 User school raw:', user?.school);
      console.log('🧪 User school _id:', user?.school?._id);
      console.log('🧪 User school toString:', user?.school?.toString?.());
      console.log('🧪 Making test API call to bulk mark...');
      
      const response = await attendanceAPI.bulkMark(testData);
      console.log('🧪 Test response:', response);
      console.log('✅ Backend connection test SUCCESSFUL!');
      
      Alert.alert('Test Success', 'Backend connection is working!');
      
    } catch (error) {
      console.error('🧪 Test failed:', error);
      console.error('🧪 Test error response:', error.response?.data);
      console.error('🧪 Test error status:', error.response?.status);
      console.error('🧪 Test error config:', error.config);
      console.error('🧪 Full error object:', JSON.stringify(error.response, null, 2));
      
      // Show detailed error info
      const errorDetails = error.response?.data?.details || error.response?.data?.message || error.message;
      Alert.alert(
        'Test Failed', 
        `Backend test failed: ${error.message}\n\nDetails: ${JSON.stringify(errorDetails, null, 2)}`
      );
    }
  };

  const submitAttendance = async () => {
    try {
      setSubmitting(true);
      
      console.log('=== SUBMITTING ATTENDANCE ===');
      console.log('Selected date:', selectedDate);
      console.log('Students count:', students.length);
      console.log('Attendance data state:', attendanceData);
      
      const schoolId = user?.school?._id || user?.school;
      const attendanceRecords = students.map(student => ({
        student: student._id,
        status: attendanceData[student._id] || 'absent',
      }));

      const attendancePayload = {
        school: schoolId,
        date: selectedDate,
        records: attendanceRecords
      };

      console.log('Attendance payload to submit:', attendancePayload);
      console.log('School ID being sent:', schoolId);
      console.log('School ID type:', typeof schoolId);
      console.log('Records count:', attendanceRecords.length);
      console.log('Present count in submission:', attendanceRecords.filter(a => a.status === 'present').length);
      console.log('Absent count in submission:', attendanceRecords.filter(a => a.status === 'absent').length);
      
      // Check current user profile before submitting
      console.log('🔍 Checking user profile before submission...');
      try {
        const { authAPI } = require('../../services/api');
        const currentProfile = await authAPI.getProfile();
        // Extract user data - handle nested data structure
        const userData = currentProfile.data?.data?.user || currentProfile.data?.user;
        const userSchool = userData?.school;
        const userSchoolId = userSchool?._id || userSchool;
        
        console.log('Full profile response:', currentProfile);
        console.log('Profile response data:', currentProfile.data);
        console.log('Extracted user data:', userData);
        console.log('Current user profile:', userData);
        console.log('Current user school:', userSchool);
        console.log('User school ID:', userSchoolId);
        console.log('School ID match:', userSchoolId === schoolId);
        
        // If school doesn't match, try to fix it again
        if (!userSchool || userSchoolId !== schoolId) {
          console.log('🔧 School mismatch detected! Attempting to fix again...');
          const updateResponse = await authAPI.updateProfile({
            school: schoolId
          });
          console.log('✅ School re-association result:', updateResponse.data);
        }
      } catch (profileErr) {
        console.log('Could not fetch current profile:', profileErr.message);
      }

      const response = await attendanceAPI.bulkMark(attendancePayload);
      console.log('Bulk mark response:', response);
      console.log('Attendance submission successful!');
      
      Alert.alert(
        'Success',
        `Attendance marked for ${students.length} students on ${new Date(selectedDate).toLocaleDateString()}`
      );
      
    } catch (error) {
      console.error('Error submitting attendance:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      Alert.alert('Error', error.response?.data?.message || 'Failed to submit attendance');
    } finally {
      setSubmitting(false);
    }
  };

  const getAttendanceStats = () => {
    const totalStudents = students.length;
    const presentCount = Object.values(attendanceData).filter(status => status === 'present').length;
    const absentCount = totalStudents - presentCount;
    const attendanceRate = totalStudents > 0 ? ((presentCount / totalStudents) * 100).toFixed(1) : 0;

    return { totalStudents, presentCount, absentCount, attendanceRate };
  };

  const renderStudent = (student) => {
    const status = attendanceData[student._id];
    const isPresent = status === 'present';
    
    return (
      <Card key={student._id} style={styles.studentCard}>
        <TouchableOpacity
          onPress={() => toggleAttendance(student._id, status)}
          style={styles.studentContent}
        >
          <View style={styles.studentLeft}>
            <Avatar.Icon
              size={50}
              icon={student.gender === 'Male' ? 'account' : student.gender === 'Female' ? 'account-outline' : 'account'}
              style={[
                styles.avatar,
                { backgroundColor: isPresent ? '#4CAF50' : '#F44336' }
              ]}
            />
            <View style={styles.studentInfo}>
              <Text style={styles.studentName}>
                {student.firstName} {student.lastName}
              </Text>
              <Text style={styles.studentClass}>
                Class: {student.class || 'Not assigned'}
              </Text>
            </View>
          </View>
          <View style={styles.studentRight}>
            <Chip
              mode="flat"
              style={[
                styles.statusChip,
                isPresent ? styles.presentChip : styles.absentChip
              ]}
              textStyle={[
                styles.chipText,
                isPresent ? styles.presentText : styles.absentText
              ]}
              icon={isPresent ? 'check-circle' : 'close-circle'}
            >
              {isPresent ? 'Present' : 'Absent'}
            </Chip>
          </View>
        </TouchableOpacity>
      </Card>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1CABE2" />
        <Text style={styles.loadingText}>Loading attendance data...</Text>
      </View>
    );
  }

  const stats = getAttendanceStats();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1CABE2" />
      
      {/* Header */}
      <LinearGradient
        colors={['#1CABE2', '#374785']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Attendance</Text>
          <Text style={styles.headerDate}>
            {new Date(selectedDate).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </Text>
        </View>
      </LinearGradient>

      {/* Stats Card */}
      <Card style={styles.statsCard}>
        <Card.Content>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.totalStudents}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#4CAF50' }]}>{stats.presentCount}</Text>
              <Text style={styles.statLabel}>Present</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#F44336' }]}>{stats.absentCount}</Text>
              <Text style={styles.statLabel}>Absent</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#1CABE2' }]}>{stats.attendanceRate}%</Text>
              <Text style={styles.statLabel}>Rate</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Button
          mode="outlined"
          onPress={markAllPresent}
          style={styles.actionButton}
          icon="check-all"
        >
          All Present
        </Button>
        <Button
          mode="outlined"
          onPress={markAllAbsent}
          style={styles.actionButton}
          icon="close-circle-multiple"
        >
          All Absent
        </Button>
      </View>

      {/* Test Button */}
      <View style={styles.testSection}>
        <Button
          mode="contained"
          onPress={testBackendConnection}
          style={styles.testButton}
          icon="test-tube"
        >
          Test Backend Connection
        </Button>
      </View>

      {/* Students List */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {students.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="account-group-outline" size={80} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No Students Found</Text>
            <Text style={styles.emptyText}>Add students to start marking attendance</Text>
          </View>
        ) : (
          <View style={styles.studentsList}>
            {students.map(renderStudent)}
          </View>
        )}
      </ScrollView>

      {/* Submit FAB */}
      {console.log('🔍 FAB Debug - Students length:', students.length, 'Should show FAB:', students.length > 0)}
      {students.length > 0 && (
        <FAB
          icon="content-save"
          label="Save Attendance"
          onPress={submitAttendance}
          loading={submitting}
          disabled={submitting}
          style={styles.fab}
        />
      )}
      
      {/* Always show FAB for debugging */}
      <FAB
        icon="content-save"
        label="Debug Save"
        onPress={() => {
          console.log('🔍 Debug FAB pressed!');
          console.log('Students:', students.length);
          console.log('Submitting:', submitting);
          submitAttendance();
        }}
        loading={submitting}
        disabled={submitting}
        style={[styles.fab, { bottom: 80, backgroundColor: '#FF9800' }]}
      />
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
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerDate: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  statsCard: {
    margin: 16,
    elevation: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#374785',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
  },
  testSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  testButton: {
    backgroundColor: '#FF9800',
  },
  scrollView: {
    flex: 1,
  },
  studentsList: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  studentCard: {
    marginBottom: 8,
    elevation: 2,
  },
  studentContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  studentLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    marginRight: 12,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374785',
  },
  studentClass: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  studentRight: {
    alignItems: 'center',
  },
  statusChip: {
    minWidth: 80,
  },
  presentChip: {
    backgroundColor: '#E8F5E8',
  },
  absentChip: {
    backgroundColor: '#FFEBEE',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  presentText: {
    color: '#2E7D32',
  },
  absentText: {
    color: '#C62828',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374785',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#1CABE2',
  },
});
