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
  RadioButton,
  Checkbox,
  Snackbar,
  Divider,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { assessmentAPI } from '../services/api';

export default function AssessmentScreen({ route, navigation }) {
  const { studentId, studentName } = route.params || {};
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [assessments, setAssessments] = useState([]);
  
  // Add assessment dialog
  const [dialogVisible, setDialogVisible] = useState(false);
  const [literacyLevel, setLiteracyLevel] = useState('not_assessed');
  const [literacyScore, setLiteracyScore] = useState('');
  const [canReadSimpleSentence, setCanReadSimpleSentence] = useState(false);
  const [canWriteName, setCanWriteName] = useState(false);
  const [canIdentifyLetters, setCanIdentifyLetters] = useState(false);
  const [readingFluency, setReadingFluency] = useState('none');
  
  const [numeracyLevel, setNumeracyLevel] = useState('not_assessed');
  const [numeracyScore, setNumeracyScore] = useState('');
  const [canCountTo20, setCanCountTo20] = useState(false);
  const [canSolveBasicAddition, setCanSolveBasicAddition] = useState(false);
  const [canSolveBasicSubtraction, setCanSolveBasicSubtraction] = useState(false);
  const [numberRecognition, setNumberRecognition] = useState('none');
  
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    if (studentId) {
      loadAssessments();
    }
  }, [studentId]);

  const loadAssessments = async () => {
    try {
      setLoading(true);
      const response = await assessmentAPI.getByStudent(studentId);
      console.log('Assessments response:', response.data);
      const data = response.data?.data?.assessments || response.data?.assessments || [];
      console.log('Extracted assessments:', data);
      setAssessments(data);
    } catch (error) {
      console.error('Error loading assessments:', error);
      console.error('Error details:', error.response?.data);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to load assessments';
      showSnackbar(errorMsg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAssessments();
  };

  const showSnackbar = (message) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const handleAddAssessment = () => {
    setDialogVisible(true);
  };

  const submitAssessment = async () => {
    if (!studentId) {
      showSnackbar('Student ID is required');
      return;
    }

    try {
      setSubmitting(true);
      
      await assessmentAPI.create({
        student: studentId,
        literacyLevel,
        literacyScore: literacyScore ? parseInt(literacyScore) : undefined,
        literacyDetails: {
          canReadSimpleSentence,
          canWriteName,
          canIdentifyLetters,
          readingFluency,
        },
        numeracyLevel,
        numeracyScore: numeracyScore ? parseInt(numeracyScore) : undefined,
        numeracyDetails: {
          canCountTo20,
          canSolveBasicAddition,
          canSolveBasicSubtraction,
          numberRecognition,
        },
        notes,
      });
      
      showSnackbar('Assessment recorded successfully');
      setDialogVisible(false);
      resetForm();
      loadAssessments();
      
    } catch (error) {
      console.error('Error recording assessment:', error);
      showSnackbar('Failed to record assessment');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setLiteracyLevel('not_assessed');
    setLiteracyScore('');
    setCanReadSimpleSentence(false);
    setCanWriteName(false);
    setCanIdentifyLetters(false);
    setReadingFluency('none');
    setNumeracyLevel('not_assessed');
    setNumeracyScore('');
    setCanCountTo20(false);
    setCanSolveBasicAddition(false);
    setCanSolveBasicSubtraction(false);
    setNumberRecognition('none');
    setNotes('');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'short', 
      day: 'numeric'
    });
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'exceeding_benchmark': return '#4CAF50';
      case 'meeting_benchmark': return '#8BC34A';
      case 'below_benchmark': return '#FF9800';
      case 'not_assessed': return '#9E9E9E';
      default: return '#9E9E9E';
    }
  };

  const getLevelLabel = (level) => {
    switch (level) {
      case 'exceeding_benchmark': return 'Exceeding';
      case 'meeting_benchmark': return 'Meeting';
      case 'below_benchmark': return 'Below';
      case 'not_assessed': return 'Not Assessed';
      default: return level;
    }
  };

  const getLevelIcon = (level) => {
    switch (level) {
      case 'exceeding_benchmark': return 'trophy';
      case 'meeting_benchmark': return 'check-circle';
      case 'below_benchmark': return 'alert-circle';
      case 'not_assessed': return 'help-circle';
      default: return 'help-circle';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1CABE2" />
        <Text style={styles.loadingText}>Loading assessments...</Text>
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
            <Text style={styles.headerTitle}>Learning Assessments</Text>
            {studentName && (
              <Text style={styles.headerSubtitle}>{studentName}</Text>
            )}
          </View>
          <IconButton
            icon="refresh"
            size={24}
            iconColor="#FFFFFF"
            onPress={loadAssessments}
          />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Latest Assessment Summary */}
        {assessments.length > 0 && (
          <Card style={styles.summaryCard}>
            <Card.Content>
              <Text style={styles.summaryTitle}>Latest Assessment</Text>
              <Text style={styles.summaryDate}>
                {formatDate(assessments[0].assessmentDate)}
              </Text>
              
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <MaterialCommunityIcons name="book-open-variant" size={24} color="#1CABE2" />
                  <Text style={styles.summaryLabel}>Literacy</Text>
                  <Chip
                    style={[
                      styles.summaryChip,
                      { backgroundColor: getLevelColor(assessments[0].literacyLevel) + '20' }
                    ]}
                    textStyle={[
                      styles.summaryChipText,
                      { color: getLevelColor(assessments[0].literacyLevel) }
                    ]}
                  >
                    {getLevelLabel(assessments[0].literacyLevel)}
                  </Chip>
                </View>
                
                <View style={styles.summaryItem}>
                  <MaterialCommunityIcons name="calculator" size={24} color="#1CABE2" />
                  <Text style={styles.summaryLabel}>Numeracy</Text>
                  <Chip
                    style={[
                      styles.summaryChip,
                      { backgroundColor: getLevelColor(assessments[0].numeracyLevel) + '20' }
                    ]}
                    textStyle={[
                      styles.summaryChipText,
                      { color: getLevelColor(assessments[0].numeracyLevel) }
                    ]}
                  >
                    {getLevelLabel(assessments[0].numeracyLevel)}
                  </Chip>
                </View>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Assessment History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Assessment History</Text>
          
          {assessments.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons
                name="clipboard-text-outline"
                size={80}
                color="#9E9E9E"
              />
              <Text style={styles.emptyText}>No Assessments Yet</Text>
              <Text style={styles.emptySubtext}>
                Record the first learning assessment for this student
              </Text>
            </View>
          ) : (
            assessments.map((assessment, index) => (
              <Card key={assessment._id || index} style={styles.assessmentCard}>
                <Card.Content>
                  <View style={styles.assessmentHeader}>
                    <Text style={styles.assessmentDate}>
                      {formatDate(assessment.assessmentDate)}
                    </Text>
                    {assessment.overallLevel && (
                      <Chip
                        icon={() => (
                          <MaterialCommunityIcons
                            name={getLevelIcon(assessment.overallLevel)}
                            size={16}
                            color={getLevelColor(assessment.overallLevel)}
                          />
                        )}
                        style={[
                          styles.overallChip,
                          { backgroundColor: getLevelColor(assessment.overallLevel) + '20' }
                        ]}
                        textStyle={[
                          styles.overallChipText,
                          { color: getLevelColor(assessment.overallLevel) }
                        ]}
                      >
                        Overall: {getLevelLabel(assessment.overallLevel)}
                      </Chip>
                    )}
                  </View>

                  {/* Literacy Section */}
                  <View style={styles.assessmentSection}>
                    <View style={styles.sectionHeader}>
                      <MaterialCommunityIcons name="book-open-variant" size={20} color="#1CABE2" />
                      <Text style={styles.assessmentSectionTitle}>Literacy</Text>
                      <Chip
                        style={[
                          styles.levelChip,
                          { backgroundColor: getLevelColor(assessment.literacyLevel) + '20' }
                        ]}
                        textStyle={[
                          styles.levelChipText,
                          { color: getLevelColor(assessment.literacyLevel) }
                        ]}
                      >
                        {getLevelLabel(assessment.literacyLevel)}
                      </Chip>
                    </View>
                    
                    {assessment.literacyScore !== undefined && (
                      <Text style={styles.score}>Score: {assessment.literacyScore}/100</Text>
                    )}
                    
                    {assessment.literacyDetails && (
                      <View style={styles.detailsList}>
                        {assessment.literacyDetails.canReadSimpleSentence !== undefined && (
                          <View style={styles.detailItem}>
                            <MaterialCommunityIcons
                              name={assessment.literacyDetails.canReadSimpleSentence ? 'check' : 'close'}
                              size={16}
                              color={assessment.literacyDetails.canReadSimpleSentence ? '#4CAF50' : '#F44336'}
                            />
                            <Text style={styles.detailText}>Read simple sentence</Text>
                          </View>
                        )}
                        {assessment.literacyDetails.canWriteName !== undefined && (
                          <View style={styles.detailItem}>
                            <MaterialCommunityIcons
                              name={assessment.literacyDetails.canWriteName ? 'check' : 'close'}
                              size={16}
                              color={assessment.literacyDetails.canWriteName ? '#4CAF50' : '#F44336'}
                            />
                            <Text style={styles.detailText}>Write name</Text>
                          </View>
                        )}
                        {assessment.literacyDetails.canIdentifyLetters !== undefined && (
                          <View style={styles.detailItem}>
                            <MaterialCommunityIcons
                              name={assessment.literacyDetails.canIdentifyLetters ? 'check' : 'close'}
                              size={16}
                              color={assessment.literacyDetails.canIdentifyLetters ? '#4CAF50' : '#F44336'}
                            />
                            <Text style={styles.detailText}>Identify letters</Text>
                          </View>
                        )}
                        {assessment.literacyDetails.readingFluency && (
                          <View style={styles.detailItem}>
                            <MaterialCommunityIcons name="speedometer" size={16} color="#6B7280" />
                            <Text style={styles.detailText}>
                              Reading fluency: {assessment.literacyDetails.readingFluency}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>

                  <Divider style={styles.divider} />

                  {/* Numeracy Section */}
                  <View style={styles.assessmentSection}>
                    <View style={styles.sectionHeader}>
                      <MaterialCommunityIcons name="calculator" size={20} color="#1CABE2" />
                      <Text style={styles.assessmentSectionTitle}>Numeracy</Text>
                      <Chip
                        style={[
                          styles.levelChip,
                          { backgroundColor: getLevelColor(assessment.numeracyLevel) + '20' }
                        ]}
                        textStyle={[
                          styles.levelChipText,
                          { color: getLevelColor(assessment.numeracyLevel) }
                        ]}
                      >
                        {getLevelLabel(assessment.numeracyLevel)}
                      </Chip>
                    </View>
                    
                    {assessment.numeracyScore !== undefined && (
                      <Text style={styles.score}>Score: {assessment.numeracyScore}/100</Text>
                    )}
                    
                    {assessment.numeracyDetails && (
                      <View style={styles.detailsList}>
                        {assessment.numeracyDetails.canCountTo20 !== undefined && (
                          <View style={styles.detailItem}>
                            <MaterialCommunityIcons
                              name={assessment.numeracyDetails.canCountTo20 ? 'check' : 'close'}
                              size={16}
                              color={assessment.numeracyDetails.canCountTo20 ? '#4CAF50' : '#F44336'}
                            />
                            <Text style={styles.detailText}>Count to 20</Text>
                          </View>
                        )}
                        {assessment.numeracyDetails.canSolveBasicAddition !== undefined && (
                          <View style={styles.detailItem}>
                            <MaterialCommunityIcons
                              name={assessment.numeracyDetails.canSolveBasicAddition ? 'check' : 'close'}
                              size={16}
                              color={assessment.numeracyDetails.canSolveBasicAddition ? '#4CAF50' : '#F44336'}
                            />
                            <Text style={styles.detailText}>Basic addition</Text>
                          </View>
                        )}
                        {assessment.numeracyDetails.canSolveBasicSubtraction !== undefined && (
                          <View style={styles.detailItem}>
                            <MaterialCommunityIcons
                              name={assessment.numeracyDetails.canSolveBasicSubtraction ? 'check' : 'close'}
                              size={16}
                              color={assessment.numeracyDetails.canSolveBasicSubtraction ? '#4CAF50' : '#F44336'}
                            />
                            <Text style={styles.detailText}>Basic subtraction</Text>
                          </View>
                        )}
                        {assessment.numeracyDetails.numberRecognition && (
                          <View style={styles.detailItem}>
                            <MaterialCommunityIcons name="eye" size={16} color="#6B7280" />
                            <Text style={styles.detailText}>
                              Number recognition: {assessment.numeracyDetails.numberRecognition}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>

                  {assessment.notes && (
                    <>
                      <Divider style={styles.divider} />
                      <Text style={styles.notes}>{assessment.notes}</Text>
                    </>
                  )}
                </Card.Content>
              </Card>
            ))
          )}
        </View>
      </ScrollView>

      {/* Add Assessment Button */}
      {studentId && (
        <TouchableOpacity
          style={styles.fab}
          onPress={handleAddAssessment}
        >
          <LinearGradient
            colors={['#1CABE2', '#0E8FC7']}
            style={styles.fabGradient}
          >
            <MaterialCommunityIcons name="plus" size={24} color="#FFFFFF" />
            <Text style={styles.fabText}>Add Assessment</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Add Assessment Dialog */}
      <Portal>
        <Dialog 
          visible={dialogVisible} 
          onDismiss={() => setDialogVisible(false)}
          style={styles.dialog}
        >
          <Dialog.Title>Record Learning Assessment</Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView style={styles.dialogScroll}>
              <Dialog.Content>
                {/* Literacy Section */}
                <Text style={styles.dialogSectionTitle}>📚 Literacy Assessment</Text>
                
                <Text style={styles.inputLabel}>Level *</Text>
                <RadioButton.Group onValueChange={setLiteracyLevel} value={literacyLevel}>
                  <View style={styles.radioOption}>
                    <RadioButton value="exceeding_benchmark" />
                    <Text>Exceeding Benchmark</Text>
                  </View>
                  <View style={styles.radioOption}>
                    <RadioButton value="meeting_benchmark" />
                    <Text>Meeting Benchmark</Text>
                  </View>
                  <View style={styles.radioOption}>
                    <RadioButton value="below_benchmark" />
                    <Text>Below Benchmark</Text>
                  </View>
                </RadioButton.Group>

                <Text style={styles.inputLabel}>Skills</Text>
                <View style={styles.checkboxGroup}>
                  <View style={styles.checkboxOption}>
                    <Checkbox
                      status={canReadSimpleSentence ? 'checked' : 'unchecked'}
                      onPress={() => setCanReadSimpleSentence(!canReadSimpleSentence)}
                    />
                    <Text>Can read simple sentence</Text>
                  </View>
                  <View style={styles.checkboxOption}>
                    <Checkbox
                      status={canWriteName ? 'checked' : 'unchecked'}
                      onPress={() => setCanWriteName(!canWriteName)}
                    />
                    <Text>Can write name</Text>
                  </View>
                  <View style={styles.checkboxOption}>
                    <Checkbox
                      status={canIdentifyLetters ? 'checked' : 'unchecked'}
                      onPress={() => setCanIdentifyLetters(!canIdentifyLetters)}
                    />
                    <Text>Can identify letters</Text>
                  </View>
                </View>

                <Divider style={styles.dialogDivider} />

                {/* Numeracy Section */}
                <Text style={styles.dialogSectionTitle}>🔢 Numeracy Assessment</Text>
                
                <Text style={styles.inputLabel}>Level *</Text>
                <RadioButton.Group onValueChange={setNumeracyLevel} value={numeracyLevel}>
                  <View style={styles.radioOption}>
                    <RadioButton value="exceeding_benchmark" />
                    <Text>Exceeding Benchmark</Text>
                  </View>
                  <View style={styles.radioOption}>
                    <RadioButton value="meeting_benchmark" />
                    <Text>Meeting Benchmark</Text>
                  </View>
                  <View style={styles.radioOption}>
                    <RadioButton value="below_benchmark" />
                    <Text>Below Benchmark</Text>
                  </View>
                </RadioButton.Group>

                <Text style={styles.inputLabel}>Skills</Text>
                <View style={styles.checkboxGroup}>
                  <View style={styles.checkboxOption}>
                    <Checkbox
                      status={canCountTo20 ? 'checked' : 'unchecked'}
                      onPress={() => setCanCountTo20(!canCountTo20)}
                    />
                    <Text>Can count to 20</Text>
                  </View>
                  <View style={styles.checkboxOption}>
                    <Checkbox
                      status={canSolveBasicAddition ? 'checked' : 'unchecked'}
                      onPress={() => setCanSolveBasicAddition(!canSolveBasicAddition)}
                    />
                    <Text>Can solve basic addition</Text>
                  </View>
                  <View style={styles.checkboxOption}>
                    <Checkbox
                      status={canSolveBasicSubtraction ? 'checked' : 'unchecked'}
                      onPress={() => setCanSolveBasicSubtraction(!canSolveBasicSubtraction)}
                    />
                    <Text>Can solve basic subtraction</Text>
                  </View>
                </View>
              </Dialog.Content>
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>Cancel</Button>
            <Button
              onPress={submitAssessment}
              loading={submitting}
              disabled={submitting}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  summaryCard: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 4,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374785',
    marginBottom: 4,
  },
  summaryDate: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#374785',
    marginVertical: 8,
  },
  summaryChip: {
    height: 28,
  },
  summaryChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374785',
    marginBottom: 12,
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
  assessmentCard: {
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
  },
  assessmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  assessmentDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374785',
  },
  overallChip: {
    height: 28,
  },
  overallChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  assessmentSection: {
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  assessmentSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374785',
    marginLeft: 8,
    flex: 1,
  },
  levelChip: {
    height: 24,
  },
  levelChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  score: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  detailsList: {
    marginTop: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#374785',
    marginLeft: 8,
  },
  divider: {
    marginVertical: 12,
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
    borderRadius: 28,
    elevation: 6,
    overflow: 'hidden',
  },
  fabGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  dialog: {
    maxHeight: '80%',
  },
  dialogScroll: {
    maxHeight: 400,
  },
  dialogSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374785',
    marginTop: 8,
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374785',
    marginTop: 12,
    marginBottom: 8,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  checkboxGroup: {
    marginBottom: 8,
  },
  checkboxOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  dialogDivider: {
    marginVertical: 16,
  },
});
