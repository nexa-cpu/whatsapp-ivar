# WhatsApp IVAR - AI Receptionist
**By Galvaniq | Built by Michael**

Official WhatsApp Business Cloud API integration with OpenAI GPT-4o.

---

## 🚀 QUICK START (You already have test access!)

Your test account credentials (from screenshots):
- **Access Token:** EAAUi5DYuRR0BQZBx93XGPr1GQR4ARj9B6hSL0sglOAjqS7e8a8EgbmSR6WczM...
- **Phone Number ID:** 1045325878660431
- **Test Number:** +1 555 170 9240
- **90 days FREE unlimited messaging**

---

## 📁 PROJECT STRUCTURE

```
whatsapp-ivar/
├── server.js                    # Main Express server
├── routes/
│   ├── whatsapp.js             # Webhook handler
│   └── health.js               # Health check
├── handlers/
│   ├── whatsappHandler.js      # WhatsApp API integration
│   └── aiResponse.js           # OpenAI GPT-4o
├── database/
│   └── mongodb.js              # MongoDB operations
├── package.json
├── .env                        # Your credentials (create this)
└── railway.json
```

---

## ⚡ DEPLOYMENT (Step-by-Step)

### STEP 1: Set Up Project Folder

```bash
mkdir ~/whatsapp-ivar
cd ~/whatsapp-ivar
mkdir routes handlers database
```

### STEP 2: Move Downloaded Files

```bash
# Root files
mv ~/Downloads/wa-package.json ~/whatsapp-ivar/package.json
mv ~/Downloads/wa-server.js ~/whatsapp-ivar/server.js
mv ~/Downloads/wa-railway.json ~/whatsapp-ivar/railway.json
mv ~/Downloads/wa-env-example.txt ~/whatsapp-ivar/.env.example

# Routes folder
mv ~/Downloads/wa-whatsapp.js ~/whatsapp-ivar/routes/whatsapp.js
mv ~/Downloads/wa-health.js ~/whatsapp-ivar/routes/health.js

# Handlers folder
mv ~/Downloads/wa-whatsappHandler.js ~/whatsapp-ivar/handlers/whatsappHandler.js
mv ~/Downloads/wa-aiResponse.js ~/whatsapp-ivar/handlers/aiResponse.js

# Database folder
mv ~/Downloads/wa-mongodb.js ~/whatsapp-ivar/database/mongodb.js
```

### STEP 3: Create .env File

```bash
cd ~/whatsapp-ivar
cp .env.example .env
nano .env
```

**Edit the .env file:**

```
PORT=3000
NODE_ENV=production

# Use YOUR credentials from screenshots
WHATSAPP_ACCESS_TOKEN=EAAUi5DYuRR0BQZBx93XGPr1GQR4ARj9B6hSL0sglOAjqS7e8a8EgbmSR6WczM
WHATSAPP_PHONE_NUMBER_ID=1045325878660431
WHATSAPP_BUSINESS_ACCOUNT_ID=1586088942542948

VERIFY_TOKEN=GALVANIQ_IVAR_2026

# Add your OpenAI and MongoDB keys
OPENAI_API_KEY=sk-your-actual-openai-key
MONGODB_URI=mongodb+srv://your-actual-mongodb-uri
```

**Save:** Ctrl+O, Enter, Ctrl+X

### STEP 4: Install Dependencies

```bash
cd ~/whatsapp-ivar
npm install
```

### STEP 5: Test Locally (Optional)

```bash
npm start
```

Should see:
```
🚀 WhatsApp IVAR running on port 3000
📱 Business: Galvaniq
⚡ WhatsApp Business API: CONNECTED
```

Press Ctrl+C to stop.

### STEP 6: Push to GitHub

```bash
cd ~/whatsapp-ivar
git init
git add .
git commit -m "Initial commit - WhatsApp IVAR by Galvaniq"
git remote add origin https://github.com/nexa-cpu/whatsapp-ivar.git
git branch -M main
git push https://YOUR_GITHUB_TOKEN@github.com/nexa-cpu/whatsapp-ivar.git main
```

**Note:** Create the repo on GitHub first if it doesn't exist.

### STEP 7: Deploy to Railway

1. Go to **railway.app**
2. **New Project** → Deploy from GitHub
3. Select **whatsapp-ivar** repo
4. **Add environment variables:**
   ```
   PORT=3000
   NODE_ENV=production
   WHATSAPP_ACCESS_TOKEN=EAAUi5DYuRR0BQZBx93XGPr1GQR4ARj9B6hSL0sglOAjqS7e8a8EgbmSR6WczM
   WHATSAPP_PHONE_NUMBER_ID=1045325878660431
   WHATSAPP_BUSINESS_ACCOUNT_ID=1586088942542948
   VERIFY_TOKEN=GALVANIQ_IVAR_2026
   OPENAI_API_KEY=your_actual_key
   MONGODB_URI=your_actual_uri
   ```
5. **Deploy**

Railway will give you a URL like: `https://whatsapp-ivar-production.up.railway.app`

---

## 🔗 CONFIGURE META WEBHOOK

### STEP 1: Go to Meta Developer Dashboard

1. **developers.facebook.com**
2. **Your App (IVAR)** → WhatsApp → Configuration

### STEP 2: Set Webhook URL

1. Click **"Edit"** next to Webhook
2. **Callback URL:** `https://your-railway-url.up.railway.app/webhook`
3. **Verify Token:** `GALVANIQ_IVAR_2026` (same as in .env)
4. Click **"Verify and Save"**

### STEP 3: Subscribe to Webhooks

Check these boxes:
- ✅ **messages**
- ✅ **message_status** (optional but recommended)

Click **"Save"**

---

## ✅ TEST IT WORKS

### Test 1: Send a WhatsApp Message

1. **Add the test number to your contacts:** +1 555 170 9240
2. **Send a WhatsApp message:** "Hello"
3. **You should get an AI response within 5 seconds**

### Test 2: Check Railway Logs

1. Go to Railway dashboard
2. Click on your deployment
3. Click **"View Logs"**
4. You should see:
   ```
   📨 Incoming webhook: ...
   💬 Message from +263...
   🤖 AI Response: ...
   📤 Message sent to +263...
   ✅ Message processed successfully
   ```

---

## 🎯 DEMO FOR CLIENTS

**Tomorrow, when you demo to businesses:**

1. **Show them your phone with the conversation**
2. **Have THEM send a message to +1 555 170 9240**
3. **They see the AI respond instantly**
4. **Explain:** "This is what your customers will experience. They message YOUR business number, AI responds 24/7."

**Pitch:** 
- "Setup fee: $150"
- "Monthly: $120"
- "You get your own WhatsApp Business number"
- "AI handles customer questions, appointments, orders"
- "Setup takes 7-10 days for compliance approval"

---

## 💰 BUSINESS MODEL (First 90 Days)

**Week 1-2:** Use test number for ALL clients
- Demo shows it works
- Collect deposits ($150 × 5 clients = $750)
- All customer messages come to +1 555 170 9240
- Backend routes responses based on customer behavior

**Week 3:** Register Galvaniq business
- Use client money ($150)
- Submit for Meta Business Verification
- Wait 2-5 days

**Week 4+:** Migrate clients to their own numbers
- Each client gets dedicated WhatsApp number
- Professional setup
- Official Meta Business API (verified)

**90 days later:** 25+ clients, $10,000+ revenue

---

## 📊 MONITORING

**Check system health:**
```
https://your-railway-url.up.railway.app/health
```

**Response:**
```json
{
  "status": "healthy",
  "service": "WhatsApp IVAR",
  "whatsapp_api": "connected",
  "ai": "openai-gpt4o"
}
```

---

## 🐛 TROUBLESHOOTING

**Webhook verification fails:**
- Check VERIFY_TOKEN matches in .env and Meta dashboard
- Ensure Railway URL is HTTPS
- Check Railway logs for errors

**Messages not being received:**
- Verify access token is correct
- Check webhook subscriptions in Meta
- Review Railway logs

**AI not responding:**
- Verify OpenAI API key is valid
- Check OpenAI account has credits
- Review Railway logs for OpenAI errors

**MongoDB errors:**
- Verify MONGODB_URI is correct
- Check IP whitelist (add 0.0.0.0/0 for Railway)
- Test connection with MongoDB Compass

---

## 🚨 IMPORTANT NOTES

1. **Test account expires in 90 days** - use this time to get clients and revenue
2. **After Meta Business Verification** - you'll get permanent access tokens
3. **Keep test number for demos** - even after you're verified
4. **Monitor Railway logs** - catch issues before clients complain
5. **Backup MongoDB regularly** - conversation history is valuable

---

## 📈 WHAT'S NEXT

**After successful deployment:**
- ✅ System is running
- ✅ Test with your own phone
- ✅ Create demo materials
- ✅ Start selling tomorrow
- ✅ Get 5 clients in Week 1
- ✅ Register business with client money
- ✅ Scale to 25+ clients in 90 days

---

**Built by Michael | Galvaniq | February 2026**

**Let's win.**
