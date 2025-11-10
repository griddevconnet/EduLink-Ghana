import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  Card,
  Searchbar,
  Chip,
  ActivityIndicator,
  Divider,
  IconButton,
  SegmentedButtons,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { attendanceAPI } from '../../services/api';

export default function AttendanceHistoryScreen({ navigation }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState('week'); // week, month, all
  const [statusFilter, setStatusFilter] = useState('all'); // all, present, absent
  const [stats, setStats] = useState({
    totalDays: 0,
    presentCount: 0,
    absentCount: 0,
    attendanceRate: 0,
  });

  useEffect(() => {
    loadAttendanceHistory();
  }, [dateRange]);

  useEffect(() => {
    filterRecords();
  }, [attendanceRecords, searchQuery, statusFilter]);

  const loadAttendanceHistory = async () => {
    try {
      setLoading(true);
      
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      
      if (dateRange === 'week') {
        startDate.setDate(startDate.getDate() - 7);
      } else if (dateRange === 'month') {
        startDate.setMonth(startDate.getMonth() - 1);
      } else {
        startDate.setMonth(startDate.getMonth() - 3); // Last 3 months for 'all'
      }

      const response = await attendanceAPI.getByDateRange(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );

      console.log('📊 Attendance history response:', JSON.stringify(response.data, null, 2));
      
      // Handle different response structures
      let records = [];
      if (response.data?.data?.attendance && Array.isArray(response.data.data.attendance)) {
        // Structure: { success: true, data: { attendance: [...], pagination: {...} } }
        records = response.data.data.attendance;
      } else if (response.data?.attendance && Array.isArray(response.data.attendance)) {
        // Structure: { attendance: [...], pagination: {...} }
        records = response.data.attendance;
      } else if (Array.isArray(response.data?.data)) {
        // Structure: { data: [...] }
        records = response.data.data;
      } else if (Array.isArray(response.data)) {
        // Direct array
        records = response.data;
      }
      
      console.log('📋 Processed records:', records.length);
      console.log('📋 Sample record:', records[0]);
      setAttendanceRecords(records);
      calculateStats(records);
    } catch (error) {
      console.error('Error loading attendance history:', error);
      console.error('Error details:', error.response?.data || error.message);
      setAttendanceRecords([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateStats = (records) => {
    // Safety check
    if (!Array.isArray(records) || records.length === 0) {
      setStats({
        totalDays: 0,
        presentCount: 0,
        absentCount: 0,
        attendanceRate: 0,
      });
      return;
    }

    // Group by date to get unique days
    const dateMap = {};
    let presentCount = 0;
    let absentCount = 0;

    records.forEach((record) => {
      if (!record || !record.date) return; // Skip invalid records
      
      const dateKey = record.date.split('T')[0];
      if (!dateMap[dateKey]) {
        dateMap[dateKey] = { present: 0, absent: 0 };
      }
      if (record.status === 'present') {
        presentCount++;
        dateMap[dateKey].present++;
      } else {
        absentCount++;
        dateMap[dateKey].absent++;
      }
    });

    const totalDays = Object.keys(dateMap).length;
    const totalRecords = presentCount + absentCount;
    const attendanceRate = totalRecords > 0 
      ? ((presentCount / totalRecords) * 100).toFixed(1)
      : 0;

    setStats({
      totalDays,
      presentCount,
      absentCount,
      attendanceRate,
    });
  };

  const filterRecords = () => {
    // Safety check
    if (!Array.isArray(attendanceRecords)) {
      setFilteredRecords([]);
      return;
    }

    let filtered = [...attendanceRecords];

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((record) => record && record.status === statusFilter);
    }

    // Filter by search query (student name)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((record) => {
        if (!record || !record.student) return false;
        const studentName = `${record.student?.firstName || ''} ${record.student?.lastName || ''}`.toLowerCase();
        return studentName.includes(query);
      });
    }

    // Group by date
    const groupedByDate = {};
    filtered.forEach((record) => {
      if (!record || !record.date) return; // Skip invalid records
      
      const dateKey = record.date.split('T')[0];
      if (!groupedByDate[dateKey]) {
        groupedByDate[dateKey] = [];
      }
      groupedByDate[dateKey].push(record);
    });

    // Convert to array and sort by date (newest first)
    const grouped = Object.keys(groupedByDate)
      .sort((a, b) => new Date(b) - new Date(a))
      .map((date) => ({
        date,
        records: groupedByDate[date],
      }));

    setFilteredRecords(grouped);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAttendanceHistory();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const getStatusColor = (status) => {
    return status === 'present' ? '#10B981' : '#EF4444';
  };

  const getStatusIcon = (status) => {
    return status === 'present' ? 'check-circle' : 'close-circle';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1CABE2" />
        <Text style={styles.loadingText}>Loading attendance history...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <IconButton
            icon="arrow-left"
            size={24}
            iconColor="#FFFFFF"
            onPress={() => navigation.goBack()}
          />
          <Text style={styles.headerTitle}>Attendance History</Text>
          <IconButton
            icon="download"
            size={24}
            iconColor="#FFFFFF"
            onPress={() => {
              // TODO: Implement export functionality
              console.log('Export attendance history');
            }}
          />
        </View>

        {/* Stats Card */}
        <Card style={styles.statsCard}>
          <Card.Content>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.totalDays}</Text>
                <Text style={styles.statLabel}>Days</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#10B981' }]}>
                  {stats.presentCount}
                </Text>
                <Text style={styles.statLabel}>Present</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#EF4444' }]}>
                  {stats.absentCount}
                </Text>
                <Text style={styles.statLabel}>Absent</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#1CABE2' }]}>
                  {stats.attendanceRate}%
                </Text>
                <Text style={styles.statLabel}>Rate</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        {/* Date Range Filter */}
        <SegmentedButtons
          value={dateRange}
          onValueChange={setDateRange}
          buttons={[
            { value: 'week', label: 'Week' },
            { value: 'month', label: 'Month' },
            { value: 'all', label: 'All' },
          ]}
          style={styles.segmentedButtons}
        />

        {/* Search Bar */}
        <Searchbar
          placeholder="Search by student name..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          iconColor="#1CABE2"
        />

        {/* Status Filter Chips */}
        <View style={styles.chipsContainer}>
          <Chip
            selected={statusFilter === 'all'}
            onPress={() => setStatusFilter('all')}
            style={styles.chip}
            selectedColor="#1CABE2"
          >
            All
          </Chip>
          <Chip
            selected={statusFilter === 'present'}
            onPress={() => setStatusFilter('present')}
            style={styles.chip}
            selectedColor="#10B981"
          >
            Present
          </Chip>
          <Chip
            selected={statusFilter === 'absent'}
            onPress={() => setStatusFilter('absent')}
            style={styles.chip}
            selectedColor="#EF4444"
          >
            Absent
          </Chip>
        </View>
      </View>

      {/* Attendance Records List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredRecords.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="calendar-blank"
              size={80}
              color="#D1D5DB"
            />
            <Text style={styles.emptyText}>No attendance records found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Attendance records will appear here'}
            </Text>
          </View>
        ) : (
          filteredRecords.map((group) => (
            <View key={group.date} style={styles.dateGroup}>
              {/* Date Header */}
              <View style={styles.dateHeader}>
                <MaterialCommunityIcons
                  name="calendar"
                  size={20}
                  color="#1CABE2"
                />
                <Text style={styles.dateText}>{formatDate(group.date)}</Text>
                <Text style={styles.recordCount}>
                  {group.records.length} record{group.records.length !== 1 ? 's' : ''}
                </Text>
              </View>

              {/* Records for this date */}
              {group.records.map((record) => (
                <Card key={record._id} style={styles.recordCard}>
                  <TouchableOpacity
                    onPress={() => {
                      // Navigate to student detail
                      navigation.navigate('Students', {
                        screen: 'StudentDetail',
                        params: { studentId: record.student?._id },
                      });
                    }}
                  >
                    <Card.Content style={styles.recordContent}>
                      <View style={styles.recordLeft}>
                        <MaterialCommunityIcons
                          name={getStatusIcon(record.status)}
                          size={28}
                          color={getStatusColor(record.status)}
                        />
                        <View style={styles.studentInfo}>
                          <Text style={styles.studentName}>
                            {record.student?.firstName} {record.student?.lastName}
                          </Text>
                          <Text style={styles.studentClass}>
                            Class {record.student?.class}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.recordRight}>
                        <Chip
                          style={[
                            styles.statusChip,
                            { backgroundColor: getStatusColor(record.status) + '20' },
                          ]}
                          textStyle={[
                            styles.statusChipText,
                            { color: getStatusColor(record.status) },
                          ]}
                        >
                          {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                        </Chip>
                        {record.notes && (
                          <MaterialCommunityIcons
                            name="note-text"
                            size={18}
                            color="#6B7280"
                            style={styles.noteIcon}
                          />
                        )}
                      </View>
                    </Card.Content>
                  </TouchableOpacity>
                </Card>
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    backgroundColor: '#1CABE2',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    elevation: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#374785',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  filtersContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  segmentedButtons: {
    marginBottom: 12,
  },
  searchBar: {
    marginBottom: 12,
    backgroundColor: '#F9FAFB',
  },
  chipsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    marginRight: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374785',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  dateGroup: {
    marginBottom: 24,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374785',
    marginLeft: 8,
    flex: 1,
  },
  recordCount: {
    fontSize: 12,
    color: '#6B7280',
  },
  recordCard: {
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    elevation: 1,
  },
  recordContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  recordLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  studentInfo: {
    marginLeft: 12,
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374785',
  },
  studentClass: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  recordRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusChip: {
    height: 28,
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  noteIcon: {
    marginLeft: 8,
  },
});
