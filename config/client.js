/**
 * IVAR CLIENT CONFIGURATION — CHICKEN HUT ZIMBABWE
 * ─────────────────────────────────────────────────────────────────
 * Configured for Chicken Hut's WhatsApp ordering and customer service.
 * Replaces their current broken scripted bot with a fully intelligent,
 * conversational AI that handles orders, complaints, and enquiries.
 */

module.exports = {

  // ─── BUSINESS IDENTITY ─────────────────────────────────────────────
  business: {
    name: "Chicken Hut",
    industry: "hospitality",
    location: "Multiple locations across Zimbabwe",
    description:
      "Chicken Hut is Zimbabwe's beloved Portuguese Bar-B-Q Shop, serving flame-grilled chicken " +
      "and a full menu of meals, sides, and drinks across multiple locations. " +
      "We offer dine-in, takeaway, and delivery through our partnership with LastMile.",
    website: "chickenhut.co.zw",
    workingHours: "Sunday–Thursday: 9am–9pm | Friday–Saturday: 9am–10pm",
    currency: "USD and ZiG accepted",
  },

  // ─── OWNER / ESCALATION CONTACT ────────────────────────────────────
  owner: {
    name: "Itai",
    whatsappNumber: "263XXXXXXXXX",   // Replace with Itai's actual number after meeting
    email: "info@chickenhut.co.zw",
    backupEmail: "",
    directLine: "To be confirmed",
  },

  // ─── PRODUCTS / SERVICES ───────────────────────────────────────────
  offerings: [
    {
      name: "Quarter Chicken Meal",
      description: "Flame-grilled quarter chicken served with chips and a roll.",
      price: "From $4.50",
      availability: "Available during business hours at all branches",
    },
    {
      name: "Half Chicken Meal",
      description: "Flame-grilled half chicken with chips and a roll.",
      price: "From $7.50",
      availability: "Available during business hours at all branches",
    },
    {
      name: "Full Chicken Meal",
      description: "Full flame-grilled chicken with chips and rolls — great for sharing.",
      price: "From $13.00",
      availability: "Available during business hours at all branches",
    },
    {
      name: "Family Bucket",
      description: "Generous family-sized portion of chicken pieces with sides.",
      price: "From $18.00",
      availability: "Available during business hours",
    },
    {
      name: "Delivery via LastMile",
      description: "Order online through chickenhut.co.zw and get it delivered to your door via LastMile.",
      price: "Delivery fee applies depending on location",
      availability: "During business hours — Sunday–Thursday 9am–9pm, Friday–Saturday 9am–10pm",
    },
    {
      name: "Takeaway",
      description: "Order ahead on WhatsApp and collect at your nearest branch — no waiting.",
      price: "Menu prices apply",
      availability: "During business hours",
    },
  ],

  // ─── FREQUENTLY ASKED QUESTIONS ────────────────────────────────────
  faqs: [
    {
      question: "How do I place an order?",
      answer:
        "You can order right here on WhatsApp — just tell me what you'd like and your nearest branch or delivery address. " +
        "I'll get it sorted for you. You can also order online at chickenhut.co.zw for delivery via LastMile.",
    },
    {
      question: "Do you deliver?",
      answer:
        "Yes — we deliver through our partnership with LastMile. " +
        "Order through chickenhut.co.zw or let me know your address and I'll guide you through it.",
    },
    {
      question: "What are your opening hours?",
      answer:
        "We're open Sunday to Thursday from 9am to 9pm, and Friday to Saturday from 9am to 10pm.",
    },
    {
      question: "Where are your branches?",
      answer:
        "We have multiple locations across Zimbabwe. Let me know which area you're in and I'll tell you the nearest branch.",
    },
    {
      question: "Can I order ahead for pickup?",
      answer:
        "Absolutely — just tell me your order and preferred branch and we'll have it ready for you to collect. No queuing.",
    },
    {
      question: "Do you cater for events or large orders?",
      answer:
        "Yes we do. For large orders or event catering, let me take your details and our team will get back to you with a quote.",
    },
    {
      question: "What payment methods do you accept?",
      answer:
        "We accept USD cash, ZiG, EcoCash, and Zipit at our branches. Online orders go through the website payment system.",
    },
    {
      question: "I can't register or log in on your website.",
      answer:
        "Sorry about that — our team is aware of the website issue and it's being fixed. " +
        "In the meantime, you can order directly through WhatsApp right here and I'll sort you out.",
    },
  ],

  // ─── IVAR PERSONALITY & TONE ───────────────────────────────────────
  tone: {
    style: "warm, fast, and friendly — like a helpful team member who knows the menu inside out and genuinely wants to get you fed",
    language: "Auto-detect — respond in whatever language the customer uses",
    responseLength: "concise",
    useEmojis: false,
    name: "IVAR",
  },

  // ─── LEAD QUALIFICATION ────────────────────────────────────────────
  qualification: {
    questions: [
      "Which area or branch are you closest to?",
      "Are you ordering for delivery or collection?",
      "Is this for yourself or a larger group?",
    ],
    hotLeadSignals: [
      "order", "hungry", "want to order", "can I get", "how much",
      "deliver", "pickup", "collect", "takeaway", "catering",
      "book", "large order", "event", "ready to order",
    ],
  },

  // ─── HANDOVER TRIGGERS ─────────────────────────────────────────────
  handoverTriggers: [
    "speak to someone", "real person", "human", "manager",
    "complaint", "wrong order", "not happy", "refund",
    "my order is late", "order never arrived", "speak to the team",
    "event catering", "large order", "corporate order",
  ],

  // ─── HANDOVER MESSAGE ──────────────────────────────────────────────
  handoverMessage:
    "Let me connect you with one of our team members right away — they'll sort this out for you immediately.",

  // ─── NEGOTIATION GUIDANCE ──────────────────────────────────────────
  negotiation: {
    canOffer:
      "IVAR can mention that large or corporate orders may qualify for special pricing — " +
      "but must say the team will confirm exact figures.",
    cannotOffer:
      "Never confirm a discount or special price without team approval. " +
      "Never promise a delivery time — always say 'our team will confirm your delivery window'.",
  },

};
