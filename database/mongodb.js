const { MongoClient } = require('mongodb');

let db = null;
let mongoClient = null;

// ─── CONNECTION ───────────────────────────────────────────────────────────────

async function connect() {
  if (db) return db;

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set in environment variables');

  mongoClient = new MongoClient(uri);
  await mongoClient.connect();

  db = mongoClient.db('ivar');

  // Indexes for performance
  await db.collection('conversations').createIndex({ from: 1, timestamp: -1 });
  await db.collection('conversations').createIndex({ messageId: 1 }, { unique: true });
  await db.collection('leads').createIndex({ from: 1 }, { unique: true });

  console.log('✅ MongoDB connected');
  return db;
}

// ─── MESSAGES ─────────────────────────────────────────────────────────────────

/**
 * Saves a message exchange (customer + IVAR) to the conversations collection.
 */
async function saveMessage({ from, userMessage, aiResponse, messageId, handoverTriggered = false }) {
  try {
    const database = await connect();

    await database.collection('conversations').insertOne({
      from,
      userMessage,
      aiResponse,
      messageId,
      handoverTriggered,
      timestamp: new Date(),
    });

    // Update or create the lead record for this customer
    await upsertLead(from, { lastSeen: new Date() });

    console.log(`💾 Message saved for ${from}`);
  } catch (error) {
    if (error.code === 11000) {
      console.log(`⚠️  Duplicate message ${messageId} — skipping`);
      return;
    }
    console.error('❌ saveMessage error:', error.message);
    // Non-fatal — don't crash the pipeline
  }
}

/**
 * Returns last N message exchanges for a customer, in chronological order.
 */
async function getConversationHistory(from, limit = 8) {
  try {
    const database = await connect();

    const messages = await database.collection('conversations')
      .find({ from })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();

    return messages.reverse(); // Chronological order for OpenAI context
  } catch (error) {
    console.error('❌ getConversationHistory error:', error.message);
    return [];
  }
}

// ─── LEADS ────────────────────────────────────────────────────────────────────

/**
 * Creates or updates a lead record for a customer.
 */
async function upsertLead(from, updates = {}) {
  try {
    const database = await connect();

    await database.collection('leads').updateOne(
      { from },
      {
        $set: { ...updates, updatedAt: new Date() },
        $setOnInsert: {
          from,
          status: 'new',
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );
  } catch (error) {
    console.error('❌ upsertLead error:', error.message);
  }
}

/**
 * Returns the current status of a lead.
 * Used to check if this customer has already been handed over.
 */
async function getLeadStatus(from) {
  try {
    const database = await connect();
    const lead = await database.collection('leads').findOne({ from });
    return lead?.status || 'new';
  } catch (error) {
    console.error('❌ getLeadStatus error:', error.message);
    return 'new';
  }
}

/**
 * Updates lead status (e.g. 'qualifying', 'hot', 'handed_over', 'cold').
 * Also logs the handover reason if provided.
 */
async function updateLeadStatus(from, status, handoverReason = null) {
  try {
    const database = await connect();

    const update = {
      status,
      updatedAt: new Date(),
    };

    if (handoverReason) {
      update.handoverReason = handoverReason;
      update.handoverAt = new Date();
    }

    await database.collection('leads').updateOne(
      { from },
      { $set: update },
      { upsert: true }
    );

    console.log(`📊 Lead ${from} status → ${status}`);
  } catch (error) {
    console.error('❌ updateLeadStatus error:', error.message);
  }
}

// ─── STATS ────────────────────────────────────────────────────────────────────

/**
 * Returns a dashboard summary — useful for monitoring and client reports.
 */
async function getStats() {
  try {
    const database = await connect();

    const [totalMessages, totalLeads, handedOver, hotLeads] = await Promise.all([
      database.collection('conversations').countDocuments(),
      database.collection('leads').countDocuments(),
      database.collection('leads').countDocuments({ status: 'handed_over' }),
      database.collection('leads').countDocuments({ status: 'hot' }),
    ]);

    return {
      totalMessages,
      totalLeads,
      handedOver,
      hotLeads,
      conversionRate: totalLeads > 0 ? `${Math.round((handedOver / totalLeads) * 100)}%` : '0%',
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('❌ getStats error:', error.message);
    return { error: error.message };
  }
}

// ─── GRACEFUL SHUTDOWN ────────────────────────────────────────────────────────

process.on('SIGINT', async () => {
  if (mongoClient) {
    await mongoClient.close();
    console.log('📴 MongoDB connection closed');
  }
  process.exit(0);
});

module.exports = {
  connect,
  saveMessage,
  getConversationHistory,
  getLeadStatus,
  updateLeadStatus,
  upsertLead,
  getStats,
};
