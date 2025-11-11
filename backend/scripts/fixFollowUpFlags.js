/**
 * Fix Follow-Up Flags Script
 * 
 * This script updates all existing attendance records to set followUpRequired = true
 * for all absences (except excused ones).
 * 
 * Run this ONCE after deploying the new follow-up logic to fix old records.
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Fix follow-up flags
const fixFollowUpFlags = async () => {
  try {
    console.log('🔧 Starting follow-up flag fix...\n');

    // Get the Attendance model
    const Attendance = mongoose.model('Attendance');

    // Find all absent students without follow-up flag
    const query = {
      status: 'absent',
      followUpRequired: false,
      followUpCompleted: false,
    };

    console.log('🔍 Searching for attendance records to fix...');
    const recordsToFix = await Attendance.find(query);
    console.log(`📊 Found ${recordsToFix.length} records to fix\n`);

    if (recordsToFix.length === 0) {
      console.log('✅ No records need fixing!');
      return;
    }

    // Update all records
    const result = await Attendance.updateMany(query, {
      $set: { followUpRequired: true },
    });

    console.log('✅ Update complete!');
    console.log(`📊 Modified ${result.modifiedCount} records\n`);

    // Show sample of fixed records
    console.log('📋 Sample of fixed records:');
    const samples = await Attendance.find({
      status: 'absent',
      followUpRequired: true,
      followUpCompleted: false,
    })
      .limit(5)
      .populate('student', 'firstName lastName')
      .populate('school', 'name');

    samples.forEach((record, index) => {
      console.log(`  ${index + 1}. ${record.student?.firstName} ${record.student?.lastName}`);
      console.log(`     School: ${record.school?.name}`);
      console.log(`     Date: ${record.date.toISOString().split('T')[0]}`);
      console.log(`     Follow-up Required: ${record.followUpRequired}`);
      console.log('');
    });

    console.log('🎉 All done! Follow-up flags have been fixed.');
  } catch (error) {
    console.error('❌ Error fixing follow-up flags:', error);
    throw error;
  }
};

// Main execution
const main = async () => {
  try {
    await connectDB();
    await fixFollowUpFlags();
    process.exit(0);
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
};

// Run the script
main();
