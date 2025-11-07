import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  TextInput,
  ActivityIndicator,
  Avatar,
  Divider 
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';

export default function ProfileScreen() {
  const { user, logout, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [editingSchool, setEditingSchool] = useState(false);
  const [schoolData, setSchoolData] = useState({
    name: '',
    region: 'Greater Accra',
    district: '',
    address: ''
  });

  const regions = [
    'Greater Accra', 'Ashanti', 'Western', 'Central', 'Eastern',
    'Volta', 'Northern', 'Upper East', 'Upper West', 'Brong Ahafo',
    'Savannah', 'North East', 'Bono', 'Bono East', 'Ahafo', 'Oti'
  ];

  const handleFixStudentAssociations = async () => {
    Alert.alert(
      'Fix Student Access',
      'This will fix access issues for students you created. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Fix', 
          onPress: async () => {
            try {
              setLoading(true);
              const response = await fetch('https://edulink-backend-07ac.onrender.com/api/students/fix-associations', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${await AsyncStorage.getItem('authToken')}`
                }
              });
              
              const result = await response.json();
              
              if (response.ok) {
                Alert.alert('Success', `Fixed ${result.data.fixedCount} student associations`);
              } else {
                Alert.alert('Error', result.message || 'Failed to fix associations');
              }
            } catch (error) {
              Alert.alert('Error', 'Network error. Please try again.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleSchoolSetup = async () => {
    if (!schoolData.name.trim()) {
      Alert.alert('Validation Error', 'School name is required');
      return;
    }
    if (!schoolData.district.trim()) {
      Alert.alert('Validation Error', 'District is required');
      return;
    }

    setLoading(true);
    try {
      console.log('Updating school with data:', schoolData);
      const response = await authAPI.updateProfile({
        schoolInfo: schoolData
      });
      console.log('School update response:', response.data);
      
      // Refresh user data to get updated school information
      const refreshResult = await refreshUser();
      console.log('User refresh result:', refreshResult);
      
      Alert.alert(
        'Success!',
        'School information has been saved successfully',
        [
          {
            text: 'OK',
            onPress: () => {
              setEditingSchool(false);
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error updating school:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to update school information'
      );
    } finally {
      setLoading(false);
    }
  };

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
        <Text style={styles.headerTitle}>My Profile</Text>
        <Text style={styles.headerSubtitle}>Manage your account settings</Text>
      </LinearGradient>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Profile Info Card */}
        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <View style={styles.profileHeader}>
              <Avatar.Text 
                size={80} 
                label={`${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`}
                style={styles.avatar}
                labelStyle={styles.avatarLabel}
              />
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>
                  {user?.firstName} {user?.lastName}
                </Text>
                <Text style={styles.profileRole}>{user?.role}</Text>
                <Text style={styles.profilePhone}>{user?.phone}</Text>
                {user?.email && (
                  <Text style={styles.profileEmail}>{user?.email}</Text>
                )}
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* School Information Card */}
        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="school" size={24} color="#1CABE2" />
              <Text style={styles.sectionTitle}>School Information</Text>
              {!editingSchool && (
                <TouchableOpacity 
                  onPress={() => {
                    // Pre-populate form with existing school data
                    if (user?.school) {
                      setSchoolData({
                        name: user.school.name || '',
                        region: user.school.region || 'Greater Accra',
                        district: user.school.district || '',
                        address: user.school.address || ''
                      });
                    }
                    setEditingSchool(true);
                  }}
                  style={styles.editButton}
                >
                  <MaterialCommunityIcons name="pencil" size={20} color="#1CABE2" />
                </TouchableOpacity>
              )}
            </View>

            {user?.school && !editingSchool ? (
              <View style={styles.schoolInfo}>
                <Text style={styles.schoolName}>{user.school.name}</Text>
                <Text style={styles.schoolDetails}>
                  {user.school.district}, {user.school.region}
                </Text>
                <View style={styles.statusBadge}>
                  <MaterialCommunityIcons name="check-circle" size={16} color="#4CAF50" />
                  <Text style={styles.statusText}>School Verified</Text>
                </View>
              </View>
            ) : editingSchool ? (
              <View style={styles.schoolForm}>
                <TextInput
                  label="School Name"
                  value={schoolData.name}
                  onChangeText={(text) => setSchoolData({...schoolData, name: text})}
                  style={styles.input}
                  mode="outlined"
                />
                
                <TextInput
                  label="District"
                  value={schoolData.district}
                  onChangeText={(text) => setSchoolData({...schoolData, district: text})}
                  style={styles.input}
                  mode="outlined"
                />

                {/* Region Selector */}
                <View style={styles.regionSelector}>
                  <Text style={styles.regionLabel}>Region</Text>
                  <View style={styles.regionChips}>
                    {regions.map((region) => (
                      <TouchableOpacity
                        key={region}
                        onPress={() => setSchoolData({...schoolData, region})}
                        style={[
                          styles.regionChip,
                          schoolData.region === region && styles.regionChipSelected
                        ]}
                      >
                        <Text style={[
                          styles.regionChipText,
                          schoolData.region === region && styles.regionChipTextSelected
                        ]}>
                          {region}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                
                <TextInput
                  label="Address (Optional)"
                  value={schoolData.address}
                  onChangeText={(text) => setSchoolData({...schoolData, address: text})}
                  style={styles.input}
                  mode="outlined"
                  multiline
                />

                <View style={styles.formButtons}>
                  <Button
                    mode="outlined"
                    onPress={() => {
                      setEditingSchool(false);
                      // Reset form data
                      setSchoolData({
                        name: '',
                        region: 'Greater Accra',
                        district: '',
                        address: ''
                      });
                    }}
                    style={[styles.formButton, styles.cancelButton]}
                  >
                    Cancel
                  </Button>
                  <Button
                    mode="contained"
                    onPress={handleSchoolSetup}
                    loading={loading}
                    disabled={loading}
                    style={[styles.formButton, styles.saveButton]}
                  >
                    {user?.school ? 'Update School' : 'Save School'}
                  </Button>
                </View>
              </View>
            ) : (
              <View style={styles.noSchool}>
                <MaterialCommunityIcons name="school-outline" size={48} color="#E5E7EB" />
                <Text style={styles.noSchoolTitle}>No School Associated</Text>
                <Text style={styles.noSchoolText}>
                  Set up your school information to start adding students
                </Text>
                <Button
                  mode="contained"
                  onPress={() => setEditingSchool(true)}
                  style={styles.setupButton}
                  icon="plus"
                >
                  Set Up School
                </Button>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Account Actions */}
      <Card style={styles.card}>
        <Card.Content style={styles.cardContent}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="cog" size={24} color="#1CABE2" />
            <Text style={styles.sectionTitle}>Account Actions</Text>
          </View>

          <TouchableOpacity style={styles.actionItem}>
            <MaterialCommunityIcons name="lock-reset" size={20} color="#374785" />
            <Text style={styles.actionText}>Change Password</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem}>
            <MaterialCommunityIcons name="phone-check" size={20} color="#374785" />
            <Text style={styles.actionText}>Verify Phone Number</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem}>
            <MaterialCommunityIcons name="help-circle" size={20} color="#374785" />
            <Text style={styles.actionText}>Help & Support</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Temporary Fix Button */}
          <TouchableOpacity 
            style={[styles.actionItem, { backgroundColor: '#FFF3CD', borderRadius: 8, marginTop: 10 }]}
            onPress={handleFixStudentAssociations}
          >
            <MaterialCommunityIcons name="wrench" size={20} color="#856404" />
            <Text style={[styles.actionText, { color: '#856404' }]}>Fix Student Access (Temp)</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#856404" />
          </TouchableOpacity>
        </Card.Content>
      </Card>

      {/* Logout Button */}
      <Button 
        mode="contained" 
        onPress={logout} 
        style={styles.logoutButton}
        buttonColor="#F44336"
        icon="logout"
      >
        Logout
      </Button>
    </ScrollView>
  </View>
);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 15,
    paddingBottom: 100,
  },
  card: {
    marginBottom: 15,
    borderRadius: 12,
    elevation: 4,
  },
  cardContent: {
    padding: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: '#1CABE2',
    marginRight: 15,
  },
  avatarLabel: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374785',
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 14,
    color: '#1CABE2',
    textTransform: 'capitalize',
    marginBottom: 2,
  },
  profilePhone: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 14,
    color: '#6B7280',
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
    flex: 1,
  },
  editButton: {
    padding: 4,
  },
  schoolInfo: {
    paddingLeft: 32,
  },
  schoolName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374785',
    marginBottom: 4,
  },
  schoolDetails: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    color: '#4CAF50',
    marginLeft: 4,
    fontWeight: '600',
  },
  noSchool: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noSchoolTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374785',
    marginTop: 12,
    marginBottom: 8,
  },
  noSchoolText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  setupButton: {
    backgroundColor: '#1CABE2',
    borderRadius: 8,
  },
  schoolForm: {
    paddingLeft: 32,
  },
  input: {
    marginBottom: 15,
  },
  regionSelector: {
    marginBottom: 15,
  },
  regionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374785',
    marginBottom: 10,
  },
  regionChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  regionChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  regionChipSelected: {
    backgroundColor: '#1CABE2',
    borderColor: '#1CABE2',
  },
  regionChipText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  regionChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  formButton: {
    flex: 1,
    marginHorizontal: 5,
  },
  cancelButton: {
    borderColor: '#6B7280',
  },
  saveButton: {
    backgroundColor: '#1CABE2',
  },
  divider: {
    marginVertical: 15,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  actionText: {
    fontSize: 16,
    color: '#374785',
    marginLeft: 12,
    flex: 1,
  },
  logoutButton: {
    marginTop: 20,
    borderRadius: 8,
  },
});
