const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function getResponse(userMessage, conversationHistory = []) {
  try {
    // Build messages array for OpenAI
    const messages = [
      {
        role: 'system',
        content: `You are IVAR, an AI receptionist for Galvaniq businesses in Zimbabwe. 
        
Your role:
- Answer customer questions professionally and helpfully
- Provide business information when asked
- Take messages for the business owner
- Book appointments if requested
- Be friendly, concise, and efficient
- Use a warm, professional tone suitable for Zimbabwe
- If you don't know something, politely say so and offer to take a message

Keep responses under 100 words unless more detail is specifically requested. Use WhatsApp-friendly formatting (no markdown).`
      }
    ];

    // Add conversation history (last 5 messages to save tokens)
    const recentHistory = conversationHistory.slice(-5);
    recentHistory.forEach(msg => {
      messages.push({ role: 'user', content: msg.userMessage });
      messages.push({ role: 'assistant', content: msg.aiResponse });
    });

    // Add current message
    messages.push({ role: 'user', content: userMessage });

    console.log(`🤖 Sending to OpenAI GPT-4o (${messages.length} messages in context)...`);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: messages,
      max_tokens: 200,
      temperature: 0.7
    });

    const aiReply = completion.choices[0].message.content;
    
    console.log(`✅ OpenAI response received (${completion.usage.total_tokens} tokens used)`);

    return aiReply;
  } catch (error) {
    console.error('❌ OpenAI API Error:', error.message);
    
    // Return fallback response
    return "I'm having trouble processing your request right now. Please try again in a moment, or feel free to call us directly for immediate assistance.";
  }
}

module.exports = {
  getResponse
};
