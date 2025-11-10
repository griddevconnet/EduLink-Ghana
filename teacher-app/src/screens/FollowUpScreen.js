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
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { attendanceAPI } from '../services/api';

export default function FollowUpScreen({ navigation }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [followUps, setFollowUps] = useState([]);
  const [selectedFollowUp, setSelectedFollowUp] = useState(null);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [reason, setReason] = useState('');
  const [reasonDetails, setReasonDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    loadFollowUps();
  }, []);

  const loadFollowUps = async () => {
    try {
      setLoading(true);
      const response = await attendanceAPI.getFollowUpRequired();
      const data = response.data?.data?.attendance || [];
      setFollowUps(data);
    } catch (error) {
      console.error('Error loading follow-ups:', error);
      showSnackbar('Failed to load follow-up list');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadFollowUps();
  };

  const showSnackbar = (message) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const handleCompleteFollowUp = (followUp) => {
    setSelectedFollowUp(followUp);
    setReason(followUp.reason || '');
    setReasonDetails(followUp.reasonDetails || '');
    setDialogVisible(true);
  };

  const submitFollowUp = async () => {
    if (!reason.trim()) {
      showSnackbar('Please provide a reason');
      return;
    }

    try {
      setSubmitting(true);
      await attendanceAPI.completeFollowUp(selectedFollowUp._id, {
        reason,
        reasonDetails,
      });
      
      showSnackbar('Follow-up completed successfully');
      setDialogVisible(false);
      setSelectedFollowUp(null);
      setReason('');
      setReasonDetails('');
      
      // Reload the list
      loadFollowUps();
    } catch (error) {
      console.error('Error completing follow-up:', error);
      showSnackbar('Failed to complete follow-up');
    } finally {
      setSubmitting(false);
    }
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
      const daysAgo = Math.floor((today - date) / (1000 * 60 * 60 * 24));
      return `${daysAgo} day${daysAgo !== 1 ? 's' : ''} ago`;
    }
  };

  const getPriorityColor = (date) => {
    const daysAgo = Math.floor((new Date() - new Date(date)) / (1000 * 60 * 60 * 24));
    if (daysAgo >= 3) return '#D32F2F'; // Critical - 3+ days
    if (daysAgo >= 2) return '#F44336'; // High - 2 days
    if (daysAgo >= 1) return '#FF9800'; // Medium - 1 day
    return '#4CAF50'; // Low - today
  };

  const getPriorityLabel = (date) => {
    const daysAgo = Math.floor((new Date() - new Date(date)) / (1000 * 60 * 60 * 24));
    if (daysAgo >= 3) return 'Critical';
    if (daysAgo >= 2) return 'High';
    if (daysAgo >= 1) return 'Medium';
    return 'New';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1CABE2" />
        <Text style={styles.loadingText}>Loading follow-ups...</Text>
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
          <Text style={styles.headerTitle}>Follow-Up Queue</Text>
          <IconButton
            icon="refresh"
            size={24}
            iconColor="#FFFFFF"
            onPress={loadFollowUps}
          />
        </View>
        
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{followUps.length}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {followUps.filter(f => getPriorityLabel(f.date) === 'Critical').length}
            </Text>
            <Text style={styles.statLabel}>Critical</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {followUps.filter(f => formatDate(f.date) === 'Today').length}
            </Text>
            <Text style={styles.statLabel}>Today</Text>
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
        {followUps.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="check-circle-outline"
              size={80}
              color="#4CAF50"
            />
            <Text style={styles.emptyText}>All Caught Up!</Text>
            <Text style={styles.emptySubtext}>
              No students need follow-up calls right now
            </Text>
          </View>
        ) : (
          followUps.map((followUp) => (
            <Card key={followUp._id} style={styles.followUpCard}>
              <TouchableOpacity
                onPress={() => navigation.navigate('Students', {
                  screen: 'StudentDetail',
                  params: { studentId: followUp.student?._id }
                })}
              >
                <Card.Content style={styles.cardContent}>
                  <View style={styles.cardHeader}>
                    <View style={styles.studentInfo}>
                      <Text style={styles.studentName}>
                        {followUp.student?.firstName} {followUp.student?.lastName}
                      </Text>
                      <Text style={styles.studentClass}>
                        Class {followUp.student?.class}
                      </Text>
                    </View>
                    <Chip
                      style={[
                        styles.priorityChip,
                        { backgroundColor: getPriorityColor(followUp.date) + '20' }
                      ]}
                      textStyle={[
                        styles.priorityText,
                        { color: getPriorityColor(followUp.date) }
                      ]}
                    >
                      {getPriorityLabel(followUp.date)}
                    </Chip>
                  </View>

                  <View style={styles.detailsRow}>
                    <View style={styles.detailItem}>
                      <MaterialCommunityIcons name="calendar" size={16} color="#6B7280" />
                      <Text style={styles.detailText}>
                        Absent {formatDate(followUp.date)}
                      </Text>
                    </View>
                    <View style={styles.detailItem}>
                      <MaterialCommunityIcons name="help-circle" size={16} color="#6B7280" />
                      <Text style={styles.detailText}>
                        {followUp.reason || 'Unknown reason'}
                      </Text>
                    </View>
                  </View>

                  {followUp.reasonDetails && (
                    <Text style={styles.reasonDetails}>{followUp.reasonDetails}</Text>
                  )}

                  <View style={styles.actions}>
                    <Button
                      mode="contained"
                      onPress={() => handleCompleteFollowUp(followUp)}
                      style={styles.completeButton}
                      icon="check"
                    >
                      Complete Follow-Up
                    </Button>
                    {followUp.student?.parentContacts?.[0]?.phone && (
                      <IconButton
                        icon="phone"
                        size={24}
                        iconColor="#1CABE2"
                        style={styles.callButton}
                        onPress={() => {
                          // TODO: Integrate with call functionality
                          showSnackbar('Call feature coming soon');
                        }}
                      />
                    )}
                  </View>
                </Card.Content>
              </TouchableOpacity>
            </Card>
          ))
        )}
      </ScrollView>

      {/* Complete Follow-Up Dialog */}
      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Title>Complete Follow-Up</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.dialogLabel}>Student:</Text>
            <Text style={styles.dialogValue}>
              {selectedFollowUp?.student?.firstName} {selectedFollowUp?.student?.lastName}
            </Text>
            
            <TextInput
              label="Reason for Absence *"
              value={reason}
              onChangeText={setReason}
              mode="outlined"
              style={styles.input}
              placeholder="e.g., Sick, Family emergency"
            />
            
            <TextInput
              label="Additional Details"
              value={reasonDetails}
              onChangeText={setReasonDetails}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
              placeholder="Any additional information..."
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>Cancel</Button>
            <Button
              onPress={submitFollowUp}
              loading={submitting}
              disabled={submitting || !reason.trim()}
            >
              Complete
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Snackbar */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{
          label: 'OK',
          onPress: () => setSnackbarVisible(false),
        }}
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
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
  },
  followUpCard: {
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
  },
  cardContent: {
    paddingVertical: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374785',
  },
  studentClass: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  priorityChip: {
    height: 28,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
  },
  reasonDetails: {
    fontSize: 14,
    color: '#374785',
    fontStyle: 'italic',
    marginBottom: 12,
    paddingLeft: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#1CABE2',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  completeButton: {
    flex: 1,
    backgroundColor: '#1CABE2',
  },
  callButton: {
    marginLeft: 8,
  },
  dialogLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  dialogValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374785',
    marginBottom: 16,
  },
  input: {
    marginTop: 12,
  },
});
