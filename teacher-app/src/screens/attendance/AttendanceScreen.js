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
import { studentAPI, attendanceAPI } from '../../services/api';

const { width } = Dimensions.get('window');

export default function AttendanceScreen({ navigation }) {
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
      const studentsResponse = await studentAPI.getStudents();
      const studentsList = studentsResponse.data.students || [];
      setStudents(studentsList);

      // Load existing attendance for selected date
      const attendanceResponse = await attendanceAPI.getAttendance({
        date: selectedDate,
        limit: 1000
      });
      
      // Convert attendance array to object for easy lookup
      const attendanceMap = {};
      if (attendanceResponse.data.attendance) {
        attendanceResponse.data.attendance.forEach(record => {
          attendanceMap[record.student._id || record.student] = record.status;
        });
      }
      setAttendanceData(attendanceMap);

    } catch (error) {
      console.error('Error loading attendance data:', error);
      Alert.alert('Error', 'Failed to load attendance data');
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

  const submitAttendance = async () => {
    try {
      setSubmitting(true);
      
      const attendanceArray = students.map(student => ({
        student: student._id,
        date: selectedDate,
        status: attendanceData[student._id] || 'absent',
        markedBy: 'teacher', // This will be set by backend based on auth
      }));

      await attendanceAPI.bulkMark(attendanceArray);
      
      Alert.alert(
        'Success',
        `Attendance marked for ${students.length} students on ${new Date(selectedDate).toLocaleDateString()}`
      );
      
    } catch (error) {
      console.error('Error submitting attendance:', error);
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
