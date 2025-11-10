import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import {
  Text,
  Card,
  Avatar,
  Button,
  ActivityIndicator,
  Chip,
  Divider,
  FAB,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { studentAPI, attendanceAPI } from '../../services/api';

const { width } = Dimensions.get('window');

export default function StudentDetailScreen({ route, navigation }) {
  const { studentId } = route.params;
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState({
    totalDays: 0,
    presentDays: 0,
    absentDays: 0,
    attendanceRate: 0,
  });


  useEffect(() => {
    loadStudentDetails();
  }, [studentId]);

  const loadStudentDetails = async () => {
    try {
      setLoading(true);
      console.log('Loading student details for ID:', studentId);
      
      // Load student details
      const studentResponse = await studentAPI.getById(studentId);
      const studentData = studentResponse.data.data.student;
      setStudent(studentData);

      // Load attendance history
      try {
        const attendanceResponse = await attendanceAPI.getByStudent(studentId);
        const attendanceData = attendanceResponse.data.data.attendance || [];
        setAttendanceHistory(attendanceData);

        // Calculate attendance stats
        const totalDays = attendanceData.length;
        const presentDays = attendanceData.filter(a => a.status === 'present').length;
        const absentDays = totalDays - presentDays;
        const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

        setAttendanceStats({
          totalDays,
          presentDays,
          absentDays,
          attendanceRate,
        });
      } catch (attendanceError) {
        console.log('Could not load attendance history:', attendanceError.message);
      }

    } catch (error) {
      console.error('Error loading student details:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      let errorMessage = 'Failed to load student details';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      Alert.alert('Error', errorMessage, [
        { text: 'Go Back', onPress: () => navigation.goBack() },
        { text: 'Retry', onPress: () => loadStudentDetails() }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleEditStudent = () => {
    navigation.navigate('EditStudent', { studentId, student });
  };

  const handleMarkAttendance = () => {
    navigation.navigate('MarkAttendance', { studentId, student });
  };

  const handleContactParent = () => {
    const primaryContact = student?.parentContacts?.[0];
    if (primaryContact?.phone) {
      Alert.alert(
        'Contact Parent',
        `Call ${primaryContact.name || 'Parent'} at ${primaryContact.phone}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Log Call', 
            onPress: () => navigation.navigate('CallLog', { 
              studentId: student._id, 
              studentName: `${student.firstName} ${student.lastName}` 
            })
          },
        ]
      );
    } else {
      Alert.alert('No Contact', 'No parent contact information available');
    }
  };

  const getGenderIcon = (gender) => {
    switch (gender?.toLowerCase()) {
      case 'male': return 'face-man';
      case 'female': return 'face-woman';
      default: return 'account';
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'enrolled': return '#4CAF50';
      case 'dropped_out': return '#F44336';
      case 'never_enrolled': return '#FF9800';
      default: return '#6B7280';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 'N/A';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1CABE2" />
        <Text style={styles.loadingText}>Loading student details...</Text>
      </View>
    );
  }

  if (!student) {
    return (
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons name="account-alert" size={64} color="#F44336" />
        <Text style={styles.errorText}>Student not found</Text>
        <Button mode="contained" onPress={() => navigation.goBack()}>
          Go Back
        </Button>
      </View>
    );
  }

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
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Student Details</Text>
          <TouchableOpacity 
            onPress={handleEditStudent}
            style={styles.editButton}
          >
            <MaterialCommunityIcons name="pencil" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Student Profile Card */}
        <Card style={styles.profileCard}>
          <Card.Content style={styles.profileContent}>
            <View style={styles.profileHeader}>
              <Avatar.Icon
                size={80}
                icon={getGenderIcon(student.gender)}
                style={[styles.avatar, { backgroundColor: '#1CABE2' }]}
              />
              <View style={styles.profileInfo}>
                <Text style={styles.studentName}>
                  {student.firstName} {student.lastName}
                </Text>
                {student.otherNames && (
                  <Text style={styles.otherNames}>({student.otherNames})</Text>
                )}
                <Text style={styles.studentClass}>Class: {student.class || 'Not assigned'}</Text>
                <Chip
                  mode="flat"
                  style={[styles.statusChip, { backgroundColor: `${getStatusColor(student.enrollmentStatus)}20` }]}
                  textStyle={[styles.statusText, { color: getStatusColor(student.enrollmentStatus) }]}
                >
                  {student.enrollmentStatus?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}
                </Chip>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Basic Information Card */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="account-details" size={24} color="#1CABE2" />
              <Text style={styles.sectionTitle}>Basic Information</Text>
            </View>
            <Divider style={styles.divider} />
            
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Date of Birth</Text>
                <Text style={styles.infoValue}>{formatDate(student.dateOfBirth)}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Age</Text>
                <Text style={styles.infoValue}>{calculateAge(student.dateOfBirth)} years</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Gender</Text>
                <Text style={styles.infoValue}>{student.gender || 'Not specified'}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Student ID</Text>
                <Text style={styles.infoValue}>{student.studentId || 'Not assigned'}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* School Information Card */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="school" size={24} color="#1CABE2" />
              <Text style={styles.sectionTitle}>School Information</Text>
            </View>
            <Divider style={styles.divider} />
            
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>School</Text>
                <Text style={styles.infoValue}>{student.school?.name || 'Not assigned'}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Location</Text>
                <Text style={styles.infoValue}>
                  {student.school ? `${student.school.district}, ${student.school.region}` : 'N/A'}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Enrollment Date</Text>
                <Text style={styles.infoValue}>{formatDate(student.enrollmentDate)}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Location Type</Text>
                <Text style={styles.infoValue}>{student.locationType || 'Not specified'}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Quick Actions Card */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="lightning-bolt" size={24} color="#1CABE2" />
              <Text style={styles.sectionTitle}>Quick Actions</Text>
            </View>
            <Divider style={styles.divider} />
            
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate('Assessment', { 
                  studentId: student._id, 
                  studentName: `${student.firstName} ${student.lastName}` 
                })}
              >
                <LinearGradient
                  colors={['#4CAF50', '#45A049']}
                  style={styles.actionButtonGradient}
                >
                  <MaterialCommunityIcons name="clipboard-text" size={24} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>Assessments</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate('CallLog', { 
                  studentId: student._id, 
                  studentName: `${student.firstName} ${student.lastName}` 
                })}
              >
                <LinearGradient
                  colors={['#2196F3', '#1976D2']}
                  style={styles.actionButtonGradient}
                >
                  <MaterialCommunityIcons name="phone-log" size={24} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>Call Logs</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Card.Content>
        </Card>

        {/* Attendance Summary Card */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="calendar-check" size={24} color="#1CABE2" />
              <Text style={styles.sectionTitle}>Attendance Summary</Text>
            </View>
            <Divider style={styles.divider} />
            
            <View style={styles.attendanceStats}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{attendanceStats.attendanceRate}%</Text>
                <Text style={styles.statLabel}>Attendance Rate</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{attendanceStats.presentDays}</Text>
                <Text style={styles.statLabel}>Present Days</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{attendanceStats.absentDays}</Text>
                <Text style={styles.statLabel}>Absent Days</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{attendanceStats.totalDays}</Text>
                <Text style={styles.statLabel}>Total Days</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Parent Contact Card */}
        {student.parentContacts && student.parentContacts.length > 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="phone-in-talk" size={24} color="#1CABE2" />
                <Text style={styles.sectionTitle}>Parent/Guardian Contact</Text>
              </View>
              <Divider style={styles.divider} />
              
              {student.parentContacts.map((contact, index) => (
                <View key={index} style={styles.contactItem}>
                  <View style={styles.contactInfo}>
                    <Text style={styles.contactName}>
                      {contact.name || `${contact.relation || 'Guardian'}`}
                    </Text>
                    <Text style={styles.contactPhone}>{contact.phone}</Text>
                    <Text style={styles.contactRelation}>{contact.relation}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.callButton}
                    onPress={handleContactParent}
                  >
                    <MaterialCommunityIcons name="phone" size={20} color="#1CABE2" />
                  </TouchableOpacity>
                </View>
              ))}
            </Card.Content>
          </Card>
        )}

        {/* Additional Information Card */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="information" size={24} color="#1CABE2" />
              <Text style={styles.sectionTitle}>Additional Information</Text>
            </View>
            <Divider style={styles.divider} />
            
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Disability Status</Text>
                <Text style={styles.infoValue}>{student.disabilityStatus || 'None'}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Registration Source</Text>
                <Text style={styles.infoValue}>{student.registrationSource || 'School'}</Text>
              </View>
            </View>
            
            {student.notes && (
              <View style={styles.notesSection}>
                <Text style={styles.infoLabel}>Notes</Text>
                <Text style={styles.notesText}>{student.notes}</Text>
              </View>
            )}
          </Card.Content>
        </Card>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Floating Action Button */}
      <FAB
        icon="calendar-plus"
        label="Mark Attendance"
        style={styles.fab}
        onPress={handleMarkAttendance}
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#F44336',
    marginVertical: 16,
    textAlign: 'center',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  editButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  profileCard: {
    margin: 15,
    marginTop: 15,
    borderRadius: 15,
    elevation: 6,
  },
  profileContent: {
    padding: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#374785',
    marginBottom: 4,
  },
  otherNames: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  studentClass: {
    fontSize: 16,
    color: '#1CABE2',
    marginBottom: 8,
  },
  statusChip: {
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  card: {
    margin: 15,
    marginTop: 0,
    borderRadius: 12,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374785',
    marginLeft: 8,
  },
  divider: {
    marginBottom: 15,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
  },
  actionButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 6,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  infoItem: {
    width: '48%',
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 16,
    color: '#374785',
    fontWeight: '500',
  },
  attendanceStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1CABE2',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374785',
    marginBottom: 2,
  },
  contactPhone: {
    fontSize: 14,
    color: '#1CABE2',
    marginBottom: 2,
  },
  contactRelation: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'capitalize',
  },
  callButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(28, 171, 226, 0.1)',
  },
  notesSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  notesText: {
    fontSize: 14,
    color: '#374785',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  bottomSpacing: {
    height: 100,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#1CABE2',
  },
});
