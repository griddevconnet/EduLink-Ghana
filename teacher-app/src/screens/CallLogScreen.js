import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import {
  Text,
  Card,
  ActivityIndicator,
  Chip,
  IconButton,
  Dialog,
  Portal,
  Button,
  TextInput,
  Snackbar,
  FAB,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { callAPI } from '../services/api';

export default function CallLogScreen({ route, navigation }) {
  const { studentId, studentName } = route.params || {};
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [callLogs, setCallLogs] = useState([]);
  const [stats, setStats] = useState({
    totalCalls: 0,
    answeredCalls: 0,
    successRate: 0,
  });
  
  // Add call dialog
  const [dialogVisible, setDialogVisible] = useState(false);
  const [phone, setPhone] = useState('');
  const [contactName, setContactName] = useState('');
  const [result, setResult] = useState('answered');
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    loadCallLogs();
  }, [studentId]);

  const loadCallLogs = async () => {
    try {
      setLoading(true);
      
      // Load call logs
      const logsResponse = studentId
        ? await callAPI.getByStudent(studentId, { limit: 50 })
        : await callAPI.getAll({ limit: 50 });
      
      const logs = logsResponse.data?.data?.callLogs || [];
      setCallLogs(logs);
      
      // Load stats
      const statsResponse = await callAPI.getStats(studentId ? { studentId } : {});
      const statsData = statsResponse.data?.data || {};
      setStats(statsData);
      
    } catch (error) {
      console.error('Error loading call logs:', error);
      showSnackbar('Failed to load call logs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadCallLogs();
  };

  const showSnackbar = (message) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const handleAddCall = () => {
    setDialogVisible(true);
  };

  const submitCall = async () => {
    if (!phone.trim()) {
      showSnackbar('Please enter a phone number');
      return;
    }

    if (!studentId) {
      showSnackbar('Student ID is required');
      return;
    }

    try {
      setSubmitting(true);
      
      await callAPI.create({
        studentId,
        phone: phone.trim(),
        contactName: contactName.trim(),
        result,
        durationSeconds: duration ? parseInt(duration) : 0,
        notes: notes.trim(),
      });
      
      showSnackbar('Call log added successfully');
      setDialogVisible(false);
      resetForm();
      loadCallLogs();
      
    } catch (error) {
      console.error('Error adding call log:', error);
      showSnackbar('Failed to add call log');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setPhone('');
    setContactName('');
    setResult('answered');
    setDuration('');
    setNotes('');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const getResultColor = (result) => {
    switch (result) {
      case 'answered': return '#4CAF50';
      case 'no_answer': return '#FF9800';
      case 'busy': return '#FFC107';
      case 'failed': return '#F44336';
      case 'rejected': return '#E91E63';
      case 'voicemail': return '#9C27B0';
      default: return '#9E9E9E';
    }
  };

  const getResultIcon = (result) => {
    switch (result) {
      case 'answered': return 'phone-check';
      case 'no_answer': return 'phone-missed';
      case 'busy': return 'phone-in-talk';
      case 'failed': return 'phone-remove';
      case 'rejected': return 'phone-cancel';
      case 'voicemail': return 'voicemail';
      default: return 'phone';
    }
  };

  const getResultLabel = (result) => {
    return result.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1CABE2" />
        <Text style={styles.loadingText}>Loading call logs...</Text>
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
        <View style={styles.headerTop}>
          <IconButton
            icon="arrow-left"
            size={24}
            iconColor="#FFFFFF"
            onPress={() => navigation.goBack()}
          />
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Call Logs</Text>
            {studentName && (
              <Text style={styles.headerSubtitle}>{studentName}</Text>
            )}
          </View>
          <IconButton
            icon="refresh"
            size={24}
            iconColor="#FFFFFF"
            onPress={loadCallLogs}
          />
        </View>
        
        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalCalls}</Text>
            <Text style={styles.statLabel}>Total Calls</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.answeredCalls}</Text>
            <Text style={styles.statLabel}>Answered</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.successRate}%</Text>
            <Text style={styles.statLabel}>Success Rate</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {callLogs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="phone-off"
              size={80}
              color="#9E9E9E"
            />
            <Text style={styles.emptyText}>No Call Logs Yet</Text>
            <Text style={styles.emptySubtext}>
              {studentId 
                ? 'Start tracking parent communication by adding call logs'
                : 'No calls have been made yet'}
            </Text>
          </View>
        ) : (
          callLogs.map((call) => (
            <Card key={call._id} style={styles.callCard}>
              <Card.Content style={styles.cardContent}>
                <View style={styles.callHeader}>
                  <View style={styles.callInfo}>
                    <View style={styles.callTitleRow}>
                      <MaterialCommunityIcons
                        name={getResultIcon(call.result)}
                        size={20}
                        color={getResultColor(call.result)}
                        style={styles.callIcon}
                      />
                      <Text style={styles.callTitle}>
                        {call.contactName || call.phone}
                      </Text>
                    </View>
                    {call.contactName && (
                      <Text style={styles.callPhone}>{call.phone}</Text>
                    )}
                    {!studentId && call.student && (
                      <Text style={styles.studentName}>
                        {call.student.firstName} {call.student.lastName} • Class {call.student.class}
                      </Text>
                    )}
                  </View>
                  <Chip
                    style={[
                      styles.resultChip,
                      { backgroundColor: getResultColor(call.result) + '20' }
                    ]}
                    textStyle={[
                      styles.resultText,
                      { color: getResultColor(call.result) }
                    ]}
                  >
                    {getResultLabel(call.result)}
                  </Chip>
                </View>

                <View style={styles.callDetails}>
                  <View style={styles.detailItem}>
                    <MaterialCommunityIcons name="clock-outline" size={16} color="#6B7280" />
                    <Text style={styles.detailText}>{formatDate(call.timePlaced)}</Text>
                  </View>
                  
                  {call.durationSeconds > 0 && (
                    <View style={styles.detailItem}>
                      <MaterialCommunityIcons name="timer-outline" size={16} color="#6B7280" />
                      <Text style={styles.detailText}>
                        {Math.floor(call.durationSeconds / 60)}:{(call.durationSeconds % 60).toString().padStart(2, '0')}
                      </Text>
                    </View>
                  )}
                  
                  <View style={styles.detailItem}>
                    <MaterialCommunityIcons 
                      name={call.provider === 'manual' ? 'account' : 'robot'} 
                      size={16} 
                      color="#6B7280" 
                    />
                    <Text style={styles.detailText}>
                      {call.provider === 'manual' ? 'Manual' : 'Automated'}
                    </Text>
                  </View>
                </View>

                {call.metadata?.notes && (
                  <Text style={styles.notes}>{call.metadata.notes}</Text>
                )}
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>

      {/* Add Call FAB */}
      {studentId && (
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={handleAddCall}
          label="Add Call"
        />
      )}

      {/* Add Call Dialog */}
      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Title>Log Parent Call</Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView>
              <Dialog.Content>
                <TextInput
                  label="Phone Number *"
                  value={phone}
                  onChangeText={setPhone}
                  mode="outlined"
                  keyboardType="phone-pad"
                  style={styles.input}
                  placeholder="+233XXXXXXXXX"
                />
                
                <TextInput
                  label="Contact Name"
                  value={contactName}
                  onChangeText={setContactName}
                  mode="outlined"
                  style={styles.input}
                  placeholder="e.g., Mother, Father, Guardian"
                />
                
                <Text style={styles.inputLabel}>Call Result *</Text>
                <View style={styles.resultOptions}>
                  {['answered', 'no_answer', 'busy', 'failed'].map((r) => (
                    <Chip
                      key={r}
                      selected={result === r}
                      onPress={() => setResult(r)}
                      style={styles.optionChip}
                    >
                      {getResultLabel(r)}
                    </Chip>
                  ))}
                </View>
                
                {result === 'answered' && (
                  <TextInput
                    label="Duration (seconds)"
                    value={duration}
                    onChangeText={setDuration}
                    mode="outlined"
                    keyboardType="numeric"
                    style={styles.input}
                    placeholder="e.g., 120"
                  />
                )}
                
                <TextInput
                  label="Notes"
                  value={notes}
                  onChangeText={setNotes}
                  mode="outlined"
                  multiline
                  numberOfLines={3}
                  style={styles.input}
                  placeholder="Any additional information..."
                />
              </Dialog.Content>
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>Cancel</Button>
            <Button
              onPress={submitCall}
              loading={submitting}
              disabled={submitting || !phone.trim()}
            >
              Save
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Snackbar */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>
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
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
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
    fontSize: 20,
    fontWeight: '600',
    color: '#374785',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  callCard: {
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
  },
  cardContent: {
    paddingVertical: 12,
  },
  callHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  callInfo: {
    flex: 1,
  },
  callTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  callIcon: {
    marginRight: 8,
  },
  callTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374785',
  },
  callPhone: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
    marginLeft: 28,
  },
  studentName: {
    fontSize: 13,
    color: '#9E9E9E',
    marginTop: 4,
    marginLeft: 28,
  },
  resultChip: {
    height: 28,
  },
  resultText: {
    fontSize: 12,
    fontWeight: '600',
  },
  callDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  detailText: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 6,
  },
  notes: {
    fontSize: 14,
    color: '#374785',
    fontStyle: 'italic',
    marginTop: 8,
    paddingLeft: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#1CABE2',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 80,
    backgroundColor: '#1CABE2',
  },
  input: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    color: '#374785',
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 4,
  },
  resultOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  optionChip: {
    marginRight: 8,
    marginBottom: 8,
  },
});
