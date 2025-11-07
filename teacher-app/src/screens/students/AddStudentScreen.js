import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import { TextInput, Button, Card, ActivityIndicator, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { studentAPI } from '../../services/api';

export default function AddStudentScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    otherNames: '',
    dateOfBirth: '',
    gender: '',
    class: '',
    schoolName: '',
    schoolLocation: '',
    disabilityStatus: 'None',
    enrollmentStatus: 'enrolled',
    // Parent Information
    parentFirstName: '',
    parentLastName: '',
    parentContact: '',
  });

  const genderOptions = ['Male', 'Female', 'Other'];
  const disabilityOptions = ['None', 'Visual', 'Hearing', 'Physical', 'Cognitive', 'Multiple'];

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      Alert.alert('Validation Error', 'First name is required');
      return false;
    }
    if (!formData.lastName.trim()) {
      Alert.alert('Validation Error', 'Last name is required');
      return false;
    }
    if (!formData.dateOfBirth.trim()) {
      Alert.alert('Validation Error', 'Date of birth is required (YYYY-MM-DD format)');
      return false;
    }
    if (!formData.gender) {
      Alert.alert('Validation Error', 'Please select a gender');
      return false;
    }
    if (!formData.schoolName.trim()) {
      Alert.alert('Validation Error', 'School name is required');
      return false;
    }
    if (!formData.parentContact.trim()) {
      Alert.alert('Validation Error', 'Parent contact is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const studentData = {
        ...formData,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        otherNames: formData.otherNames.trim() || undefined,
        class: formData.class.trim() || undefined,
        schoolName: formData.schoolName.trim(),
        schoolLocation: formData.schoolLocation.trim() || undefined,
        parentFirstName: formData.parentFirstName.trim() || undefined,
        parentLastName: formData.parentLastName.trim() || undefined,
        parentContact: formData.parentContact.trim(),
      };

      await studentAPI.create(studentData);
      
      Alert.alert(
        'Success!', 
        'Student added successfully',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      console.error('Error adding student:', error);
      Alert.alert(
        'Error', 
        error.response?.data?.message || 'Failed to add student. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const renderGenderChips = () => (
    <View style={styles.chipContainer}>
      {genderOptions.map((gender) => (
        <TouchableOpacity key={gender} onPress={() => updateField('gender', gender)}>
          <Chip
            selected={formData.gender === gender}
            mode={formData.gender === gender ? 'flat' : 'outlined'}
            style={[
              styles.chip,
              formData.gender === gender && styles.chipSelected
            ]}
            textStyle={formData.gender === gender ? styles.chipTextSelected : styles.chipText}
          >
            {gender}
          </Chip>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderDisabilityChips = () => (
    <View style={styles.chipContainer}>
      {disabilityOptions.map((disability) => (
        <TouchableOpacity key={disability} onPress={() => updateField('disabilityStatus', disability)}>
          <Chip
            selected={formData.disabilityStatus === disability}
            mode={formData.disabilityStatus === disability ? 'flat' : 'outlined'}
            style={[
              styles.chip,
              formData.disabilityStatus === disability && styles.chipSelected
            ]}
            textStyle={formData.disabilityStatus === disability ? styles.chipTextSelected : styles.chipText}
          >
            {disability}
          </Chip>
        </TouchableOpacity>
      ))}
    </View>
  );

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
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add New Student</Text>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Card style={styles.formCard}>
          <View style={styles.formContent}>
            {/* Personal Information */}
            <Text style={styles.sectionTitle}>Personal Information</Text>
            
            <View style={styles.row}>
              <TextInput
                label="First Name *"
                value={formData.firstName}
                onChangeText={(text) => updateField('firstName', text)}
                style={[styles.input, styles.halfInput]}
                mode="outlined"
                outlineColor="#E5E7EB"
                activeOutlineColor="#1CABE2"
              />
              <TextInput
                label="Last Name *"
                value={formData.lastName}
                onChangeText={(text) => updateField('lastName', text)}
                style={[styles.input, styles.halfInput]}
                mode="outlined"
                outlineColor="#E5E7EB"
                activeOutlineColor="#1CABE2"
              />
            </View>

            <TextInput
              label="Other Names"
              value={formData.otherNames}
              onChangeText={(text) => updateField('otherNames', text)}
              style={styles.input}
              mode="outlined"
              outlineColor="#E5E7EB"
              activeOutlineColor="#1CABE2"
            />

            <TextInput
              label="Date of Birth (YYYY-MM-DD) *"
              value={formData.dateOfBirth}
              onChangeText={(text) => updateField('dateOfBirth', text)}
              style={styles.input}
              mode="outlined"
              outlineColor="#E5E7EB"
              activeOutlineColor="#1CABE2"
              placeholder="2010-01-15"
            />

            <Text style={styles.fieldLabel}>Gender *</Text>
            {renderGenderChips()}

            {/* School Information */}
            <Text style={styles.sectionTitle}>School Information</Text>
            
            <TextInput
              label="School Name *"
              value={formData.schoolName}
              onChangeText={(text) => updateField('schoolName', text)}
              style={styles.input}
              mode="outlined"
              outlineColor="#E5E7EB"
              activeOutlineColor="#1CABE2"
              placeholder="Accra Primary School"
            />

            <TextInput
              label="School Location"
              value={formData.schoolLocation}
              onChangeText={(text) => updateField('schoolLocation', text)}
              style={styles.input}
              mode="outlined"
              outlineColor="#E5E7EB"
              activeOutlineColor="#1CABE2"
              placeholder="Accra, Greater Accra Region"
            />

            <TextInput
              label="Class"
              value={formData.class}
              onChangeText={(text) => updateField('class', text)}
              style={styles.input}
              mode="outlined"
              outlineColor="#E5E7EB"
              activeOutlineColor="#1CABE2"
              placeholder="Class 5"
            />

            {/* Parent Information */}
            <Text style={styles.sectionTitle}>Parent Information</Text>
            
            <View style={styles.row}>
              <TextInput
                label="Parent First Name"
                value={formData.parentFirstName}
                onChangeText={(text) => updateField('parentFirstName', text)}
                style={[styles.input, styles.halfInput]}
                mode="outlined"
                outlineColor="#E5E7EB"
                activeOutlineColor="#1CABE2"
                placeholder="John"
              />
              <TextInput
                label="Parent Last Name"
                value={formData.parentLastName}
                onChangeText={(text) => updateField('parentLastName', text)}
                style={[styles.input, styles.halfInput]}
                mode="outlined"
                outlineColor="#E5E7EB"
                activeOutlineColor="#1CABE2"
                placeholder="Doe"
              />
            </View>

            <TextInput
              label="Parent Contact *"
              value={formData.parentContact}
              onChangeText={(text) => updateField('parentContact', text)}
              style={styles.input}
              mode="outlined"
              outlineColor="#E5E7EB"
              activeOutlineColor="#1CABE2"
              placeholder="+233XXXXXXXXX or 0XXXXXXXXX"
              keyboardType="phone-pad"
            />

            {/* Accessibility */}
            <Text style={styles.sectionTitle}>Accessibility</Text>
            <Text style={styles.fieldLabel}>Disability Status</Text>
            {renderDisabilityChips()}

            {/* Submit Button */}
            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={loading}
              disabled={loading}
              style={styles.submitButton}
              contentStyle={styles.submitButtonContent}
              labelStyle={styles.submitButtonText}
            >
              {loading ? 'Adding Student...' : 'Add Student'}
            </Button>
          </View>
        </Card>
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
  placeholder: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 15,
    paddingBottom: 100,
  },
  formCard: {
    borderRadius: 15,
    elevation: 4,
  },
  formContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374785',
    marginBottom: 15,
    marginTop: 10,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374785',
    marginBottom: 10,
    marginTop: 5,
  },
  input: {
    marginBottom: 15,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  halfInput: {
    flex: 1,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  chip: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  chipSelected: {
    backgroundColor: '#1CABE2',
  },
  chipText: {
    color: '#6B7280',
    fontSize: 12,
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  submitButton: {
    backgroundColor: '#1CABE2',
    marginTop: 20,
    borderRadius: 12,
  },
  submitButtonContent: {
    paddingVertical: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
