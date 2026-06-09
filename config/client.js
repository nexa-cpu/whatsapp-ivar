/**
 * IVAR CLIENT CONFIGURATION — GALVANIQ GROUP
 * ─────────────────────────────────────────────────────────────────────
 * Client: Avantis Technologies Ltd
 * General Manager: Samantha Chapeta
 * IT Contact: Denzel (IT Department)
 * Package: IVAR Professional — $400/month + $750 setup
 * Head Office: 91 Aloe Way & Lomagundi Road, Avondale, Harare, Zimbabwe
 * Website: avantis.co.zw
 * Email: avantiszimbabwe@aol.com
 * Phone: +263 242 304 643
 * ─────────────────────────────────────────────────────────────────────
 * IVAR is deployed across Avantis departments — handling customer
 * enquiries, product support, partnership requests, dealer onboarding,
 * bulk & corporate sales, investor relations routing, and careers —
 * 24/7 — freeing the Avantis team to focus on manufacturing, R&D,
 * and closing enterprise deals.
 */

module.exports = {

  // ─── BUSINESS IDENTITY ─────────────────────────────────────────────
  business: {
    name: "Avantis Technologies",
    industry: "Technology Manufacturing & ICT Solutions",
    description:
      "Avantis Technologies is a Zimbabwean technology company founded on September 16, 2016, " +
      "specialising in the design, manufacturing, and local assembly of hardware and software products. " +
      "With an annual production capacity of 48,000 to 315,000 units, Avantis is one of Africa's " +
      "leading ICT manufacturers. All devices are powered by industry-standard Intel processors. " +
      "The Harare Msasa factory is Microsoft certified. Avantis serves clients in Zimbabwe, " +
      "South Africa, Angola, Kenya, Mozambique, and Uganda — with 80% of products exported globally " +
      "through distribution hubs in Uganda, South Africa, the Netherlands, and China.",
    location: "91 Aloe Way & Lomagundi Road, Avondale, Harare, Zimbabwe",
    headquarters: "91 Aloe Way & Lomagundi Road, Avondale, Harare, Zimbabwe",
    manufacturing: "Msasa, Harare (Microsoft certified) and Mainland China",
    distributionHubs: "Uganda, South Africa, the Netherlands, China",
    markets: "Zimbabwe (20%), Export — Africa, Latin America, Global (80%)",
    website: "avantis.co.zw",
    email: "avantiszimbabwe@aol.com",
    phone: "+263 242 304 643",
    workingHours: "Monday to Friday: 8am – 5pm | Saturday: 8am – 1pm | Sunday: Closed",
    currency: "USD",
    vision: "To be the first choice of ICT provider in Africa and the world.",
    mission:
      "To enhance the 4th Industrial Revolution through affordable devices to every household " +
      "in Africa, Latin America, and the world via world-class, research-based innovations.",
    founded: "September 16, 2016",
    countries: "Zimbabwe, South Africa, Angola, Kenya, Mozambique, Uganda",
    socialMedia: {
      facebook: "avantistech",
      instagram: "avantistech",
      twitter: "avantis_tech",
    },
  },

  // ─── OWNER / ESCALATION CONTACT ────────────────────────────────────
  owner: {
    name: "Samantha",
    role: "General Manager",
    whatsappNumber: "263788946950",
    email: "sammy.chapeta@avantis.co.zw",
    backupEmail: "avantiszimbabwe@aol.com",
    directLine: "+263 242 304 643",
  },

  // ─── PRODUCTS & SERVICES ───────────────────────────────────────────
  offerings: [

    // ── LAPTOPS ──
    {
      name: "Avantis P1 NoteBook",
      description:
        "Avantis-manufactured laptop, designed and assembled in Zimbabwe. " +
        "Intel-powered. Built for everyday work, school, and small business use. " +
        "Durable, reliable, and proudly African-made.",
      price: "$350",
      availability: "In stock — available at head office and authorised dealers",
    },
    {
      name: "Avantis P2 NoteBook",
      description:
        "Mid-range Avantis notebook. Intel processor, optimised for office productivity " +
        "and light creative work. Assembled at the Msasa, Harare facility.",
      price: "$350",
      availability: "In stock",
    },
    {
      name: "Avantis P3 NoteBook",
      description:
        "Performance Avantis notebook. Sleek design, high-efficiency Intel processor, " +
        "all-day battery life. Ideal for professionals who need speed and reliability on the move.",
      price: "$390",
      availability: "In stock",
    },
    {
      name: "Avantis P4 NoteBook",
      description:
        "Upper-tier Avantis notebook. Premium build, serious performance. " +
        "Designed for business professionals and power users who demand precision without limits.",
      price: "$389",
      availability: "In stock",
    },
    {
      name: "Avantis 15.6 Inch Intel Core i7 Notebook",
      description:
        "High-performance Avantis notebook. Intel Core i7 processor, 8GB RAM, 15.6\" display. " +
        "Built for demanding workloads — enterprise, engineering, content creation.",
      price: "$550",
      availability: "In stock",
    },
    {
      name: "Avantis Parote 1030i",
      description:
        "Zimbabwe's first locally assembled laptop, launched May 2026. " +
        "Intel Core i3 processor, designed for education and small business. " +
        "A landmark product in African technology manufacturing — proudly made in Zimbabwe.",
      price: "Contact sales team for pricing",
      availability: "Available — contact team for current stock",
    },

    // ── DESKTOPS ──
    {
      name: "Avantis Desktop Systems",
      description:
        "Avantis-assembled desktop computers for office and enterprise use. " +
        "Intel-powered, configurable for specific business requirements. " +
        "Ideal for schools, corporate offices, and government agencies.",
      price: "Request quotation — pricing depends on configuration",
      availability: "Available — contact sales team for specifications and pricing",
    },

    // ── SOUND ──
    {
      name: "Avantis Sound Devices",
      description:
        "Avantis audio products including headphones and sound accessories. " +
        "Designed for an immersive experience — compatible with Avantis devices and all major platforms.",
      price: "Visit avantis.co.zw/sound for current range and pricing",
      availability: "In stock",
    },

    // ── ACCESSORIES ──
    {
      name: "Avantis Accessories",
      description:
        "Full range of Avantis-branded and compatible accessories — laptop bags, adapters, " +
        "chargers, peripherals, and protective cases.",
      price: "From $10 — visit avantis.co.zw/accessories for full range",
      availability: "In stock",
    },

    // ── SOFTWARE & DIGITAL SOLUTIONS ──
    {
      name: "Custom Software Development",
      description:
        "Avantis builds custom applications and enterprise software solutions tailored to " +
        "business and government requirements. From workflow automation to sector-specific applications.",
      price: "Quoted per project scope — contact sales team",
      availability: "Available — engage sales team for requirements discussion",
    },
    {
      name: "Cloud Computing & Data Security",
      description:
        "Avantis provides robust cloud infrastructure and data security services. " +
        "Designed for organisations that need reliable, secure, African-hosted compute.",
      price: "Quoted per requirement",
      availability: "Available — contact team",
    },
    {
      name: "Digital Learning & E-Learning Solutions",
      description:
        "Avantis specialised e-learning applications and solutions for schools, universities, " +
        "and training institutions. Deployed across Sub-Saharan Africa with a focus on affordability " +
        "and access. Key vertical — particularly relevant for NGO and government education partners.",
      price: "Quoted per institution and scale",
      availability: "Available — contact partnerships team",
    },

    // ── CORPORATE & BULK ──
    {
      name: "Corporate & Government Procurement",
      description:
        "Avantis serves government agencies, schools, NGOs, and private companies with bulk " +
        "hardware procurement, custom configurations, and after-sales support. " +
        "Volume discounts available. Tender-ready documentation and compliance packages available.",
      price: "Custom pricing for bulk and corporate orders — contact Samantha directly",
      availability: "Available by arrangement",
    },

    // ── DEALER / DISTRIBUTION ──
    {
      name: "Dealer & Reseller Programme",
      description:
        "Avantis operates a structured dealer and reseller programme across Zimbabwe and Sub-Saharan Africa. " +
        "Authorised dealers receive volume pricing, product training, and marketing support.",
      price: "Dealer pricing discussed upon application",
      availability: "Accepting applications — contact sales team",
    },
  ],

  // ─── FREQUENTLY ASKED QUESTIONS ────────────────────────────────────
  faqs: [
    {
      question: "Where are you located?",
      answer:
        "Our head office is at 91 Aloe Way & Lomagundi Road, Avondale, Harare. " +
        "Our manufacturing facility is in Msasa, Harare.",
    },
    {
      question: "What are your business hours?",
      answer: "Monday to Friday 8am to 5pm, Saturday 8am to 1pm. Closed Sundays.",
    },
    {
      question: "Where are Avantis products manufactured?",
      answer:
        "Our products are designed and assembled in Zimbabwe at our Msasa factory, " +
        "which is Microsoft certified. We also manufacture in Mainland China for international scale. " +
        "We are proudly Africa's computer manufacturing company.",
    },
    {
      question: "Which countries do you operate in?",
      answer:
        "Zimbabwe, South Africa, Angola, Kenya, Mozambique, and Uganda, " +
        "with distribution hubs in Uganda, South Africa, the Netherlands, and China. " +
        "80% of our products are sold outside Zimbabwe.",
    },
    {
      question: "Do your products come with warranty?",
      answer:
        "Yes — all Avantis products come with manufacturer warranty. " +
        "Warranty periods vary by product. Visit avantis.co.zw/product-support for details.",
    },
    {
      question: "Can I become an Avantis dealer or reseller?",
      answer:
        "Yes — we run a dealer and reseller programme across Sub-Saharan Africa. " +
        "Tell me about your business and location and I'll connect you with our sales team.",
    },
    {
      question: "Do you supply to schools and government?",
      answer:
        "Absolutely. Education and government procurement are core markets for us. " +
        "We supply laptops, desktops, and full ICT solutions across Africa. " +
        "Contact our sales team for corporate and tender pricing.",
    },
    {
      question: "Do you have e-learning solutions?",
      answer:
        "Yes — Avantis has specialised e-learning applications deployed across Sub-Saharan Africa. " +
        "Relevant for schools, NGOs, and government education programmes. " +
        "Contact our partnerships team for a detailed discussion.",
    },
    {
      question: "How do I get a product quotation?",
      answer:
        "Visit avantis.co.zw and browse the product range, " +
        "or tell me what you need here on WhatsApp and I'll help you build the right solution " +
        "and connect you with our team for pricing.",
    },
    {
      question: "Do you offer cloud computing services?",
      answer:
        "Yes — Avantis provides cloud infrastructure and data security services. " +
        "Tell me about your organisation's requirements and I'll connect you with our solutions team.",
    },
    {
      question: "I'm interested in partnering with Avantis.",
      answer:
        "We welcome strategic partnerships — from NGOs and educational bodies to " +
        "technology companies and multinational suppliers. " +
        "Tell me about your organisation and what you have in mind and I'll connect you with Samantha directly.",
    },
    {
      question: "Do you have job openings?",
      answer:
        "Visit avantis.co.zw/careers for current openings. " +
        "Tell me the role you're interested in and I'll make sure the right person gets your details.",
    },
    {
      question: "What is the Parote 1030i?",
      answer:
        "The Parote 1030i is Zimbabwe's first locally assembled laptop, launched in May 2026. " +
        "Intel Core i3 powered, designed for education and small business. " +
        "Contact our sales team for pricing and availability.",
    },
    {
      question: "What payment methods do you accept?",
      answer:
        "USD cash, EcoCash, Zipit, and bank transfer for corporate orders. " +
        "Contact our sales team for corporate payment arrangements.",
    },
  ],

  // ─── IVAR PERSONALITY & TONE ───────────────────────────────────────
  tone: {
    style:
      "Professional, intelligent, and proudly African. " +
      "IVAR represents Avantis — a company building technology from Zimbabwe for the world. " +
      "Confident, knowledgeable, and forward-looking. Never robotic. Never generic. " +
      "Warm but sharp. Clear and direct.",
    language:
      "Auto-detect — respond fluently in whatever language the customer uses, " +
      "including Shona, Ndebele, French, Portuguese, and Swahili.",
    responseLength: "Concise but complete — enough detail to be genuinely useful without overwhelming.",
    useEmojis: false,
    name: "IVAR",
    persona:
      "You are IVAR, Avantis Technologies' intelligent AI assistant on WhatsApp. " +
      "You serve every department — sales, support, partnerships, dealer onboarding, careers, and investor relations. " +
      "You know the full Avantis product range, company history, manufacturing capabilities, and market presence. " +
      "You represent a company that manufactures technology in Africa for the world — carry that pride. " +
      "You qualify enquiries accurately, route them to the right team, and never leave a customer without a clear next step. " +
      "When you don't know a specific current price, stock level, or internal detail, say so honestly " +
      "and connect the customer with Samantha's team immediately.",
  },

  // ─── LEAD QUALIFICATION ────────────────────────────────────────────
  qualification: {
    questions: [
      "What can I help you with today — a product enquiry, support request, partnership, or something else?",
      "Is this for personal use, a business, school, or government organisation?",
      "Are you based in Zimbabwe or another country?",
      "Is this a single purchase or a bulk or institutional order?",
      "What's your approximate budget or quantity requirement?",
    ],
    hotLeadSignals: [
      "price", "cost", "how much", "available", "in stock", "I want to buy",
      "order", "purchase", "quotation", "quote", "bulk", "corporate",
      "government", "tender", "school", "university", "NGO",
      "delivery", "payment", "invoice", "ready to buy", "can I get",
      "laptop price", "desktop price", "units", "pieces",
      "dealer", "reseller", "distributor", "authorised",
      "partner", "invest", "sponsor", "collaborate",
      "Parote", "P1", "P2", "P3", "P4", "i7", "i5", "i3",
      "how many", "volume", "deposit", "pay now", "sign",
      "meet", "tomorrow", "in person", "when can", "where do I",
    ],
  },

  // ─── HANDOVER TRIGGERS ─────────────────────────────────────────────
  handoverTriggers: [
    "speak to someone", "real person", "human", "manager", "Samantha", "sales team",
    "complaint", "wrong product", "not happy", "refund", "warranty claim",
    "bulk order", "corporate pricing", "government order", "tender",
    "volume discount", "after sales", "repair", "technical support",
    "speak to the owner", "call me", "deposit", "pay now",
    "want to sign", "ready to buy", "where do I sign", "make payment",
    "units", "pieces", "20", "30", "50", "100", "company order",
    "meet tomorrow", "want to meet", "in person meeting",
    "partnership", "investor", "sponsor", "joint venture",
    "dealer application", "reseller", "become a dealer",
    "careers", "job application", "internship",
    "Denzel", "IT support", "technical issue", "system not working",
  ],

  // ─── HANDOVER MESSAGE ──────────────────────────────────────────────
  handoverMessage:
    "Samantha and the team are on it — they'll reach out to you directly right now. " +
    "You can also reach us on +263 242 304 643 or visit us at 91 Aloe Way & Lomagundi Road, Avondale, Harare.",

  // ─── NEGOTIATION GUIDANCE ──────────────────────────────────────────
  negotiation: {
    canOffer:
      "IVAR can mention that corporate, government, and bulk orders qualify for special pricing, " +
      "and that Samantha's team will provide a tailored quotation. " +
      "IVAR can highlight that Avantis products are locally manufactured with full warranty " +
      "and after-sales support — buying Avantis is buying African-made quality.",
    cannotOffer:
      "Never quote a specific discount percentage without team confirmation. " +
      "Never confirm exact stock levels with certainty — always direct to the website or team. " +
      "Never promise a specific delivery time. " +
      "Never confirm payment arrangements — Samantha's team handles all payments and corporate deals.",
  },

  // ─── APPOINTMENT BOOKING ───────────────────────────────────────────
  appointments: {
    enabled: true,
    description:
      "For corporate clients, bulk buyers, partnership enquiries, or dealer applications, " +
      "IVAR can arrange a meeting with the Avantis team at head office or via call.",
    bookingMessage:
      "I can arrange for our team to connect with you directly. " +
      "What's your name, organisation, and the best time for them to reach you? " +
      "I'll make sure the right person gets back to you immediately.",
  },

  // ─── MONTHLY PERFORMANCE REPORTING ────────────────────────────────
  reporting: {
    enabled: true,
    description:
      "Monthly report delivered to Samantha showing: " +
      "total enquiries handled by department, top products enquired about, " +
      "leads qualified and handed to sales team, partnership and dealer enquiries captured, " +
      "common customer questions and objections, peak enquiry times and days, " +
      "and countries of origin of inbound enquiries.",
  },

};
