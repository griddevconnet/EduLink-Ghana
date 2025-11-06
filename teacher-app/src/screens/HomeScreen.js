import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Card, Title, Paragraph, Button, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { schoolAPI, studentAPI, attendanceAPI } from '../services/api';

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalStudents: 0,
    presentToday: 0,
    absentToday: 0,
    atRisk: 0,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load dashboard statistics
      // This is a placeholder - implement actual API calls
      setStats({
        totalStudents: 45,
        presentToday: 38,
        absentToday: 7,
        atRisk: 5,
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
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
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Card style={styles.welcomeCard}>
        <Card.Content>
          <Title>Welcome back, {user?.firstName}! 👋</Title>
          <Paragraph>
            {user?.school?.name || 'EduLink Teacher'}
          </Paragraph>
        </Card.Content>
      </Card>

      <View style={styles.statsGrid}>
        <Card style={[styles.statCard, styles.primaryCard]}>
          <Card.Content style={styles.statContent}>
            <MaterialCommunityIcons name="account-group" size={40} color="#4CAF50" />
            <Title style={styles.statNumber}>{stats.totalStudents}</Title>
            <Paragraph>Total Students</Paragraph>
          </Card.Content>
        </Card>

        <Card style={[styles.statCard, styles.successCard]}>
          <Card.Content style={styles.statContent}>
            <MaterialCommunityIcons name="check-circle" size={40} color="#4CAF50" />
            <Title style={styles.statNumber}>{stats.presentToday}</Title>
            <Paragraph>Present Today</Paragraph>
          </Card.Content>
        </Card>

        <Card style={[styles.statCard, styles.warningCard]}>
          <Card.Content style={styles.statContent}>
            <MaterialCommunityIcons name="alert-circle" size={40} color="#FF9800" />
            <Title style={styles.statNumber}>{stats.absentToday}</Title>
            <Paragraph>Absent Today</Paragraph>
          </Card.Content>
        </Card>

        <Card style={[styles.statCard, styles.dangerCard]}>
          <Card.Content style={styles.statContent}>
            <MaterialCommunityIcons name="alert" size={40} color="#F44336" />
            <Title style={styles.statNumber}>{stats.atRisk}</Title>
            <Paragraph>At Risk</Paragraph>
          </Card.Content>
        </Card>
      </View>

      <Card style={styles.actionCard}>
        <Card.Content>
          <Title>Quick Actions</Title>
        </Card.Content>
        <Card.Actions>
          <Button
            mode="contained"
            icon="clipboard-check"
            onPress={() => navigation.navigate('Attendance')}
            style={styles.actionButton}
          >
            Mark Attendance
          </Button>
        </Card.Actions>
        <Card.Actions>
          <Button
            mode="outlined"
            icon="account-group"
            onPress={() => navigation.navigate('Students')}
            style={styles.actionButton}
          >
            View Students
          </Button>
        </Card.Actions>
      </Card>
    </ScrollView>
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
  },
  welcomeCard: {
    margin: 15,
    elevation: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
  },
  statCard: {
    width: '47%',
    margin: '1.5%',
    elevation: 4,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: 15,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    marginVertical: 5,
  },
  primaryCard: {
    backgroundColor: '#E8F5E9',
  },
  successCard: {
    backgroundColor: '#E8F5E9',
  },
  warningCard: {
    backgroundColor: '#FFF3E0',
  },
  dangerCard: {
    backgroundColor: '#FFEBEE',
  },
  actionCard: {
    margin: 15,
    elevation: 4,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 5,
  },
});
