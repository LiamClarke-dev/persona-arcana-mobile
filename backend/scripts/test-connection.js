const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const JournalEntry = require('../models/JournalEntry');

async function testConnection() {
  try {
    console.log('🔄 Testing MongoDB Atlas connection...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('✅ Connected to MongoDB Atlas successfully!');
    
    // Test User model
    console.log('🔄 Testing User model...');
    const testUser = new User({
      email: 'test-connection@example.com',
      name: 'Test Connection User',
      googleId: 'test-google-123',
    });
    
    await testUser.save();
    console.log('✅ User model test successful - User created');
    
    // Retrieve the user
    const retrievedUser = await User.findById(testUser._id);
    console.log('✅ User model test successful - User retrieved');
    console.log('📋 User data:', {
      id: retrievedUser._id,
      email: retrievedUser.email,
      name: retrievedUser.name,
      createdAt: retrievedUser.createdAt,
    });
    
    // Test indexes
    console.log('🔄 Testing indexes...');
    const userIndexes = await User.collection.getIndexes();
    console.log('✅ User indexes:', Object.keys(userIndexes));
    
    const journalIndexes = await JournalEntry.collection.getIndexes();
    console.log('✅ JournalEntry indexes:', Object.keys(journalIndexes));
    
    // Clean up test data
    await User.findByIdAndDelete(testUser._id);
    console.log('✅ Test data cleaned up');
    
    // Test vector-ready schema
    console.log('🔄 Testing vector-ready schema...');
    const testEntry = new JournalEntry({
      userId: new mongoose.Types.ObjectId(),
      content: 'This is a test journal entry for vector search preparation.',
      date: new Date(),
      wordCount: 10,
      embeddings: [0.1, 0.2, 0.3, 0.4, 0.5], // Test vector
    });
    
    await testEntry.save();
    console.log('✅ Vector-ready schema test successful');
    
    // Clean up
    await JournalEntry.findByIdAndDelete(testEntry._id);
    console.log('✅ Vector test data cleaned up');
    
    console.log('🎉 All tests passed! MongoDB Atlas setup is complete.');
    
  } catch (error) {
    console.error('❌ Connection test failed:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Connection closed');
  }
}

// Run the test
testConnection()
  .then(() => {
    console.log('✅ Connection test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Connection test failed:', error);
    process.exit(1);
  });