/**
 * IVAR CLIENT CONFIGURATION
 * ─────────────────────────────────────────────
 * This is the brain of each client deployment.
 * Fill this out for every new client before deploying.
 * Every field shapes how IVAR speaks, sells, and escalates.
 */

module.exports = {

  // ─── BUSINESS IDENTITY ───────────────────────────────────────────────
  business: {
    name: "Acacia Boutique Hotel",
    industry: "hospitality",          // retail | hospitality | real_estate | services
    location: "Harare, Zimbabwe",
    description: "A luxury boutique hotel in the heart of Harare with 24 rooms, a rooftop restaurant, conference facilities, and a spa.",
    website: "www.acaciahotel.co.zw",
    workingHours: "Front desk: 24/7 | Management: Mon–Fri 8am–6pm",
    currency: "USD",
  },

  // ─── OWNER / ESCALATION CONTACT ──────────────────────────────────────
  owner: {
    name: "Tendai",
    whatsappNumber: "2637XXXXXXXX",   // Full international format, no + sign
    email: "tendai@acaciahotel.co.zw",
    backupEmail: "reservations@acaciahotel.co.zw",
  },

  // ─── PRODUCTS / SERVICES ─────────────────────────────────────────────
  // Add everything IVAR should know how to sell or describe
  offerings: [
    {
      name: "Standard Room",
      description: "Comfortable room with en-suite bathroom, AC, WiFi, and breakfast included.",
      price: "$85/night",
      availability: "Subject to dates — IVAR will take booking request",
    },
    {
      name: "Deluxe Room",
      description: "Spacious room with king bed, city view, minibar, and premium amenities.",
      price: "$130/night",
      availability: "Subject to dates",
    },
    {
      name: "Conference Package",
      description: "Full-day conference room hire with projector, whiteboard, tea breaks, and lunch.",
      price: "From $400/day (up to 30 pax)",
      availability: "Weekdays, advance booking required",
    },
    {
      name: "Spa Treatment",
      description: "Full body massage, facial, or couples treatment.",
      price: "From $45",
      availability: "Daily 9am–7pm, appointment required",
    },
  ],

  // ─── FREQUENTLY ASKED QUESTIONS ──────────────────────────────────────
  faqs: [
    {
      question: "Do you have parking?",
      answer: "Yes, we have secure on-site parking available at no extra charge for guests."
    },
    {
      question: "Is breakfast included?",
      answer: "Breakfast is included in Standard and Deluxe room rates. It's served from 6:30am to 10am."
    },
    {
      question: "What is your cancellation policy?",
      answer: "Free cancellation up to 48 hours before check-in. Late cancellations incur one night's charge."
    },
    {
      question: "Do you accept EcoCash or Zipit?",
      answer: "We accept USD cash, Zipit, EcoCash, and major credit cards."
    },
  ],

  // ─── IVAR PERSONALITY & TONE ─────────────────────────────────────────
  tone: {
    style: "warm, professional, and confident",
    language: "English",              // Primary language
    responseLength: "concise",        // concise | detailed
    useEmojis: false,                 // true | false
    name: "IVAR",                     // What the AI calls itself
  },

  // ─── LEAD QUALIFICATION RULES ────────────────────────────────────────
  // IVAR will try to gather this info before handing over
  qualification: {
    questions: [
      "What dates are you looking at?",
      "How many guests will be staying?",
      "What is the purpose of your visit — leisure or business?",
    ],
    hotLeadSignals: [
      "ready to book",
      "confirm",
      "pay",
      "reserve",
      "how do I pay",
      "deposit",
      "today",
      "this week",
      "urgent",
    ],
  },

  // ─── HANDOVER TRIGGERS ───────────────────────────────────────────────
  // Any of these in the conversation → escalate to human immediately
  handoverTriggers: [
    "speak to someone",
    "speak to a person",
    "real person",
    "human",
    "manager",
    "owner",
    "complaint",
    "not happy",
    "disappointed",
    "refund",
    "this is wrong",
    "speak to the team",
  ],

  // ─── HANDOVER MESSAGE ────────────────────────────────────────────────
  // What IVAR tells the customer when escalating
  handoverMessage: "I'll connect you with one of our team members right away. They'll be with you in just a moment. Thank you for your patience! 🙏",

  // ─── NEGOTIATION GUIDANCE ────────────────────────────────────────────
  negotiation: {
    canOffer: "IVAR can mention that management may consider special rates for long stays (5+ nights) or large group bookings, but cannot confirm discounts — a human must do that.",
    cannotOffer: "IVAR must never confirm a specific discount or special price. Always say 'our team can discuss options with you directly.'",
  },

};
