const { MongoClient } = require('mongodb');

let db = null;
let client = null;

async function connect() {
  if (db) {
    return db;
  }

  try {
    const uri = process.env.MONGODB_URI;
    
    if (!uri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    client = new MongoClient(uri);
    await client.connect();
    
    db = client.db('whatsapp-ivar');
    
    console.log('✅ Connected to MongoDB');
    
    // Create indexes for better performance
    await db.collection('conversations').createIndex({ from: 1, timestamp: -1 });
    await db.collection('conversations').createIndex({ messageId: 1 }, { unique: true });
    
    return db;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
}

async function saveMessage(from, userMessage, aiResponse, messageId) {
  try {
    const database = await connect();
    const collection = database.collection('conversations');

    const document = {
      from,
      userMessage,
      aiResponse,
      messageId,
      timestamp: new Date()
    };

    await collection.insertOne(document);
    console.log(`💾 Message saved to database (from: ${from})`);
  } catch (error) {
    // If duplicate messageId (already processed), just log and continue
    if (error.code === 11000) {
      console.log(`⚠️  Duplicate message ${messageId}, skipping`);
      return;
    }
    console.error('❌ Error saving message:', error);
    // Don't throw - we don't want to fail the whole request if DB is down
  }
}

async function getConversationHistory(from, limit = 5) {
  try {
    const database = await connect();
    const collection = database.collection('conversations');

    const messages = await collection
      .find({ from })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();

    // Reverse to get chronological order
    return messages.reverse();
  } catch (error) {
    console.error('❌ Error getting conversation history:', error);
    return [];
  }
}

// Get stats (useful for monitoring)
async function getStats() {
  try {
    const database = await connect();
    const collection = database.collection('conversations');

    const totalMessages = await collection.countDocuments();
    const uniqueCustomers = await collection.distinct('from');
    
    return {
      totalMessages,
      uniqueCustomers: uniqueCustomers.length,
      timestamp: new Date()
    };
  } catch (error) {
    console.error('❌ Error getting stats:', error);
    return { error: error.message };
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  if (client) {
    await client.close();
    console.log('📴 MongoDB connection closed');
    process.exit(0);
  }
});

module.exports = {
  connect,
  saveMessage,
  getConversationHistory,
  getStats
};
