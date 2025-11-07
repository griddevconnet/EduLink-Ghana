import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  StatusBar,
  Dimensions,
} from 'react-native';
import { Card, ActivityIndicator, FAB, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { studentAPI } from '../../services/api';

const { width } = Dimensions.get('window');

export default function StudentsScreen({ navigation }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all, enrolled, at-risk

  useEffect(() => {
    loadStudents();
  }, [filter]);

  const loadStudents = async () => {
    try {
      const params = {
        limit: 50,
        page: 1,
      };

      if (filter === 'enrolled') {
        params.enrollmentStatus = 'enrolled';
      }

      const response = await studentAPI.getStudents(params);
      const studentsData = response.data?.data?.students || response.data?.students || [];
      setStudents(Array.isArray(studentsData) ? studentsData : []);
    } catch (error) {
      console.error('Error loading students:', error);
      setStudents([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadStudents();
  };

  const filteredStudents = students.filter(student =>
    `${student.firstName} ${student.lastName}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const getGenderIcon = (gender) => {
    if (gender === 'Male') return 'gender-male';
    if (gender === 'Female') return 'gender-female';
    return 'gender-male-female';
  };

  const getGenderColor = (gender) => {
    if (gender === 'Male') return '#1976D2';
    if (gender === 'Female') return '#E91E63';
    return '#9C27B0';
  };

  const renderStudent = ({ item }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('StudentDetail', { student: item })}
    >
      <Card style={styles.studentCard}>
        <View style={styles.studentContent}>
          <View style={styles.studentLeft}>
            <View style={[styles.avatar, { backgroundColor: getGenderColor(item.gender) + '20' }]}>
              <MaterialCommunityIcons
                name={getGenderIcon(item.gender)}
                size={28}
                color={getGenderColor(item.gender)}
              />
            </View>
            <View style={styles.studentInfo}>
              <Text style={styles.studentName}>
                {item.firstName} {item.lastName}
              </Text>
              <View style={styles.studentMeta}>
                <MaterialCommunityIcons name="school" size={14} color="#6B7280" />
                <Text style={styles.studentClass}>{item.class || 'No Class'}</Text>
              </View>
              {item.studentId && (
                <View style={styles.studentMeta}>
                  <MaterialCommunityIcons name="identifier" size={14} color="#6B7280" />
                  <Text style={styles.studentId}>ID: {item.studentId}</Text>
                </View>
              )}
            </View>
          </View>
          <View style={styles.studentRight}>
            <Chip
              mode="flat"
              style={[
                styles.statusChip,
                item.enrollmentStatus === 'enrolled'
                  ? styles.enrolledChip
                  : styles.droppedChip,
              ]}
              textStyle={styles.chipText}
            >
              {item.enrollmentStatus === 'enrolled' ? 'Enrolled' : 'Dropped'}
            </Chip>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#9CA3AF" />
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons name="account-group-outline" size={80} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>No Students Found</Text>
      <Text style={styles.emptyText}>
        {searchQuery
          ? 'Try adjusting your search'
          : 'Add your first student to get started'}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1CABE2" />
        <Text style={styles.loadingText}>Loading students...</Text>
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
        <Text style={styles.headerTitle}>My Students</Text>
        <Text style={styles.headerSubtitle}>
          {filteredStudents.length} {filteredStudents.length === 1 ? 'student' : 'students'}
        </Text>
      </LinearGradient>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <MaterialCommunityIcons name="magnify" size={20} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search students..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <MaterialCommunityIcons name="close-circle" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Chips */}
      <View style={styles.filterContainer}>
        <TouchableOpacity onPress={() => setFilter('all')}>
          <Chip
            selected={filter === 'all'}
            mode={filter === 'all' ? 'flat' : 'outlined'}
            style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
            textStyle={filter === 'all' ? styles.filterTextActive : styles.filterText}
          >
            All Students
          </Chip>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setFilter('enrolled')}>
          <Chip
            selected={filter === 'enrolled'}
            mode={filter === 'enrolled' ? 'flat' : 'outlined'}
            style={[styles.filterChip, filter === 'enrolled' && styles.filterChipActive]}
            textStyle={filter === 'enrolled' ? styles.filterTextActive : styles.filterText}
          >
            Enrolled
          </Chip>
        </TouchableOpacity>
      </View>

      {/* Students List */}
      <FlatList
        data={filteredStudents}
        renderItem={renderStudent}
        keyExtractor={(item) => item._id || item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#1CABE2']}
            tintColor="#1CABE2"
          />
        }
        ListEmptyComponent={renderEmptyState}
      />

      {/* Floating Action Button */}
      <FAB
        icon="plus"
        style={styles.fab}
        color="#FFFFFF"
        onPress={() => navigation.navigate('AddStudent')}
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
    marginTop: 10,
    fontSize: 14,
    color: '#6B7280',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    margin: 15,
    marginTop: 10,
    paddingHorizontal: 15,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 15,
    color: '#374785',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    marginBottom: 10,
    gap: 10,
  },
  filterChip: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: '#1CABE2',
  },
  filterText: {
    color: '#6B7280',
    fontSize: 12,
  },
  filterTextActive: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  listContent: {
    paddingHorizontal: 15,
    paddingBottom: 100,
  },
  studentCard: {
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
    backgroundColor: '#FFFFFF',
  },
  studentContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  studentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374785',
    marginBottom: 4,
  },
  studentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  studentClass: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 4,
  },
  studentId: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  studentRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusChip: {
    height: 28,
  },
  enrolledChip: {
    backgroundColor: '#E8F5E9',
  },
  droppedChip: {
    backgroundColor: '#FFEBEE',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
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
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 90,
    backgroundColor: '#1CABE2',
  },
});
