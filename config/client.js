/**
 * IVAR CLIENT CONFIGURATION — GALVANIQ GROUP
 * ─────────────────────────────────────────────────────────────────────
 * Client:        Avantis Technologies Ltd
 * GM:            Samantha Chapeta
 * IT Lead:       Denzel (surname TBC)
 * Package:       IVAR Professional — $400/month + $750 setup
 * Head Office:   91 Aloe Way & Lomagundi Road, Avondale, Harare, Zimbabwe
 * Manufacturing: Msasa Factory, Harare (Microsoft Certified) + Mainland China
 * Phone:         +263 242 304 643
 * WhatsApp:      +263 774 516 917 (Samantha)
 * Email:         avantiszimbabwe@aol.com
 * Website:       avantis.co.zw
 * Founded:       September 16, 2016
 * ─────────────────────────────────────────────────────────────────────
 * NOTE: This is NOT a WhatsApp receptionist.
 * IVAR is deployed as an intelligent internal + external operations system
 * connected across Sales, Customer Support, Manufacturing Enquiries,
 * Corporate/Government Procurement, Distribution, and Marketing departments.
 * ─────────────────────────────────────────────────────────────────────
 */

module.exports = {

  // ─── BUSINESS IDENTITY ─────────────────────────────────────────────
  business: {
    name: "Avantis Technologies",
    legalName: "Avantis Technologies Ltd",
    tagline: "The Computer Manufacturing Company in Zimbabwe",
    founded: "September 16, 2016",
    description:
      "Avantis Technologies is Zimbabwe's leading computer hardware manufacturer, " +
      "specialising in the design, manufacturing, and local assembly of laptops, desktops, tablets, " +
      "sound devices, and accessories. " +
      "With an annual production capacity of 48,000 to 315,000 units, Avantis powers its devices " +
      "with industry-standard Intel processors and operates a Microsoft-certified factory in Msasa, Harare. " +
      "80% of products are exported globally — with distribution hubs in Uganda, South Africa, " +
      "the Netherlands, and China. " +
      "Avantis operates across Zimbabwe, South Africa, Angola, Kenya, Mozambique, and Uganda, " +
      "and is preparing for a VFEX stock exchange listing in 2026.",
    vision: "To be the first choice of ICT provider in Africa and the world.",
    mission:
      "To enhance the 4th Industrial Revolution through affordable devices to every household " +
      "in Africa, Latin America, and the world via world-class, research-based innovations.",
    coreValues: ["Innovation", "Responsibility", "Customer Service", "Fun"],
    website: "avantis.co.zw",
    email: "avantiszimbabwe@aol.com",
    workingHours: "Monday to Friday: 8am – 5pm | Saturday: By appointment | Sunday: Closed",
    currency: "USD",
    socialMedia: {
      facebook: "avantistech",
      instagram: "avantistech",
      twitter: "avantis_tech",
    },
  },

  // ─── LOCATIONS ─────────────────────────────────────────────────────
  locations: {
    headOffice: {
      label: "Head Office",
      address: "91 Aloe Way & Lomagundi Road, Avondale, Harare, Zimbabwe",
      phone: "+263 242 304 643",
      whatsapp: "+263 774 516 917",
      email: "avantiszimbabwe@aol.com",
    },
    manufacturing: [
      {
        label: "Msasa Factory — Harare",
        note: "Microsoft Certified manufacturing facility. Primary local assembly and production.",
      },
      {
        label: "Manufacturing Partner — Mainland China",
        note: "Offshore manufacturing for volume production and component supply.",
      },
    ],
    distributionHubs: [
      "Uganda",
      "South Africa",
      "The Netherlands",
      "China",
    ],
    activeMarkets: [
      "Zimbabwe (20% of units — local market)",
      "South Africa",
      "Angola",
      "Kenya",
      "Mozambique",
      "Uganda",
      "Global export (80% of total production)",
    ],
  },

  // ─── KEY CONTACTS ──────────────────────────────────────────────────
  keyContacts: {
    generalManager: {
      name: "Samantha Chapeta",
      role: "General Manager",
      whatsapp: "+263 774 516 917",
      email: "sammy.chapeta@avantis.co.zw",
      note: "Primary decision maker for operational and technology partnerships.",
    },
    itLead: {
      name: "Denzel",
      role: "IT Lead",
      answer:
        "Yes — we serve government agencies and companies with corporate pricing and volume discounts. " +
        "Tell me about your organisation's requirements and our team will get you a tailored quote.",
    },
    {
      question: "What payment methods do you accept?",
      answer: "USD cash, EcoCash, Zipit, and bank transfer for corporate orders.",
    },
    {
      question: "Do you sell MacBooks?",
      answer:
        "We don't stock MacBooks currently, but we carry premium Windows laptops from HP, Lenovo, Dell, and Asus " +
        "that match or exceed MacBook performance at better value. Let me know your use case and budget and I'll recommend the right one.",
    },
    {
      question: "Do you have laptops under $300?",
      answer:
        "Yes — we have the HP 15s from $250, Lenovo IdeaPad 3 from $270, and Acer Aspire 5 from $290. " +
        "All come with warranty. Which will you be using it for?",
    },
    {
      question: "Do you repair electronics?",
      answer:
        "For repair services, let me connect you with our team directly — they'll advise what we can assist with.",
    },
    {
      question: "How do I track my order?",
      answer:
        "Share your order
      note: "Technical evaluator for IVAR deployment. Reports to Samantha.",
    },
  },

  // ─── PRODUCTS & OFFERINGS ──────────────────────────────────────────
  offerings: [

    // ── LAPTOPS ──
    {
      category: "Laptops",
      description: "Avantis-manufactured laptops powered by Intel processors. Engineered for performance, durability, and affordability.",
      products: [
        {
          name: "Avantis P1 NoteBook",
          description: "Entry-level Avantis laptop. Slim design, Intel processor, ideal for education and home use.",
          price: "$350",
          availability: "In stock",
        },
        {
          name: "Avantis P2 NoteBook",
          description: "Mid-range NoteBook with balanced performance for work and study.",
          price: "$350",
          availability: "In stock",
        },
        {
          name: "Avantis P3 NoteBook",
          description: "Professional NoteBook with enhanced performance. Ideal for business and enterprise use.",
          price: "$390",
          availability: "In stock",
        },
        {
          name: "Avantis P4 NoteBook",
          description: "Advanced NoteBook with high-efficiency Intel processor. For professionals and power users.",
          price: "$389",
          availability: "In stock",
        },
        {
          name: "Avantis 15.6\" Intel Core i7 NoteBook",
          description: "High-performance 15.6-inch laptop. Intel Core i7, 8GB RAM. For demanding workloads, creative work, and enterprise deployment.",
          price: "$550",
          availability: "In stock",
        },
        {
          name: "Avantis Parote 1030i",
          description: "Zimbabwe's first locally assembled laptop — unveiled May 2026. Represents Avantis' flagship locally assembled product line.",
          price: "Contact sales for pricing",
          availability: "New launch — contact sales team",
          note: "Flagship product. Key talking point for government and corporate procurement conversations.",
        },
      ],
    },

    // ── DESKTOPS ──
    {
      category: "Desktops",
      description: "Avantis desktop computers for office, education, and enterprise. Available for bulk and corporate procurement.",
      products: [
        {
          name: "Avantis Desktop Range",
          description: "Intel-powered desktop computers for office and institutional use. Suitable for schools, government, and corporate environments.",
          price: "Contact sales for configuration and pricing",
          availability: "Available — contact sales for spec and quote",
        },
      ],
    },

    // ── SOUND ──
    {
      category: "Sound Devices",
      description: "Avantis audio products including speakers and sound accessories.",
      products: [
        {
          name: "Avantis Sound Range",
          description: "Sound devices designed for home, education, and office environments.",
          price: "Contact sales for pricing",
          availability: "In stock — visit website or contact team",
        },
      ],
    },

    // ── ACCESSORIES ──
    {
      category: "Accessories",
      description: "Avantis accessories including bags, adapters, peripherals, and device add-ons.",
      products: [
        {
          name: "Avantis Accessories Range",
          description: "Laptop bags, adapters, cables, and peripherals compatible with Avantis and standard devices.",
          price: "From $5 — varies by product",
          availability: "In stock",
        },
      ],
    },

    // ── SOFTWARE & DIGITAL ──
    {
      category: "Software & Digital Solutions",
      description: "Custom enterprise software and digital solutions developed by Avantis.",
      products: [
        {
          name: "Custom Software Development",
          description: "Enterprise and custom application development. Tailored for education, SME, and government clients.",
          price: "Quoted per requirement",
          availability: "Available by engagement — contact Samantha",
        },
        {
          name: "Cloud Computing Services",
          description: "Robust cloud infrastructure and data security services for organisations.",
          price: "Quoted per requirement",
          availability: "Contact sales",
        },
        {
          name: "Digital Learning / E-Learning Solutions",
          description: "Specialised e-learning applications for schools, training institutions, and education ministries.",
          price: "Quoted per requirement",
          availability: "Contact sales",
        },
      ],
    },

    // ── CORPORATE & GOVERNMENT ──
    {
      category: "Corporate & Government Procurement",
      description: "Avantis serves government agencies, parastatals, NGOs, and corporations with bulk hardware procurement, ICT fit-outs, and after-sales support.",
      products: [
        {
          name: "Bulk Laptop & Desktop Procurement",
          description:
            "Volume supply of Avantis laptops and desktops for schools, government ministries, corporates, and NGOs. " +
            "Custom configurations available. Competitive pricing for bulk orders.",
          price: "Custom pricing — contact Samantha or sales team",
          availability: "Available — minimum order quantities apply",
        },
        {
          name: "ICT Infrastructure Supply",
          description: "Full ICT fit-out supply including hardware, peripherals, accessories, and installation support for offices and institutions.",
          price: "Quoted per project",
          availability: "Available by arrangement",
        },
        {
          name: "Education Sector Supply",
          description:
            "Laptops, desktops, and e-learning solutions for primary schools, secondary schools, colleges, and universities. " +
            "Avantis has specific focus on making devices accessible to every African household — education is a primary market.",
          price: "Subsidised pricing available for qualifying institutions — contact sales",
          availability: "Available — contact Samantha for education procurement pricing",
        },
      ],
    },
  ],

  // ─── DEPARTMENTS — IVAR INTEGRATION MAP ───────────────────────────
  // IVAR is connected to all departments. Each department has defined
  // intents, triggers, and handover logic.
  departments: {

    sales: {
      label: "Sales Department",
      description: "Handles product enquiries, quotations, order processing, and customer conversions.",
      ivarRole:
        "IVAR qualifies inbound sales leads, answers product and pricing questions, " +
        "captures customer details and requirements, and routes hot leads to the sales team. " +
        "For bulk and corporate orders, IVAR collects full requirement specs before handover.",
      handoverTriggers: [
        "quotation", "quote", "how much", "price", "bulk order", "corporate order",
        "government tender", "want to buy", "purchase", "order", "ready to pay",
        "invoice", "pro forma", "can I get", "units", "pieces", "quantity",
        "volume discount", "minimum order", "delivery", "when can I receive",
        "in stock", "do you have", "available", "reseller", "distributor",
        "partner pricing", "export order",
      ],
      escalationContact: "Samantha Chapeta — sammy.chapeta@avantis.co.zw | +263 774 516 917",
    },

    customerSupport: {
      label: "Customer Support Department",
      description: "Handles post-sale support, warranty claims, product issues, repairs, and customer satisfaction.",
      ivarRole:
        "IVAR handles initial support triage — identifying the issue, collecting device details, " +
        "and routing to the appropriate support channel. " +
        "For warranty claims, IVAR collects proof of purchase and device details before handover. " +
        "For technical issues, IVAR attempts first-level resolution using known FAQs and manuals.",
      handoverTriggers: [
        "not working", "broken", "warranty", "warranty claim", "repair", "fault",
        "screen", "battery", "won't turn on", "slow", "crashed", "damaged",
        "return", "exchange", "refund", "after sales", "support", "help with my device",
        "technical issue", "product manual", "how to", "setup help",
      ],
      escalationContact: "Customer Support Team — avantiszimbabwe@aol.com | +263 242 304 643",
      productManuals: "avantis.co.zw/product-manuals/",
      productSupport: "avantis.co.zw/product-support/",
    },

    manufacturing: {
      label: "Manufacturing & Production",
      description: "Manages production at Msasa factory (Harare) and China partner facility. Handles production enquiries and capacity questions.",
      ivarRole:
        "IVAR handles inbound manufacturing partnership enquiries, component sourcing questions, " +
        "OEM/ODM requests, and production capacity questions. " +
        "IVAR does not confirm production schedules or capacity details — routes to management.",
      handoverTriggers: [
        "factory", "manufacturing", "production", "OEM", "ODM", "custom build",
        "component", "assembly", "Msasa", "Microsoft certified", "production capacity",
        "partnership", "supply chain", "white label", "custom hardware",
      ],
      note: "Msasa factory is Microsoft certified. China facility handles volume production.",
      escalationContact: "Management — route via Samantha Chapeta",
    },

    corporatePartnerships: {
      label: "Corporate & Government Partnerships",
      description: "Manages B2G and B2B relationships, tenders, government procurement, and strategic partnerships.",
      ivarRole:
        "IVAR handles initial partnership and tender enquiries, captures organisation details, " +
        "and routes serious prospects to Samantha. " +
        "For government and NGO enquiries, IVAR collects: organisation name, contact person, " +
        "procurement requirement, quantity estimate, and timeline.",
      handoverTriggers: [
        "government", "ministry", "parastatal", "NGO", "tender", "RFQ", "RFP",
        "procurement", "ZITF", "VFEX", "investor", "partnership", "MOU",
        "strategic alliance", "distribution agreement", "reseller", "agent",
        "SADC", "export", "international", "wholesale",
      ],
      escalationContact: "Samantha Chapeta — sammy.chapeta@avantis.co.zw | +263 774 516 917",
    },

    distribution: {
      label: "Distribution & Logistics",
      description: "Manages order fulfilment, delivery, export logistics, and distribution hub coordination.",
      ivarRole:
        "IVAR handles order tracking enquiries, delivery status questions, export documentation requests, " +
        "and distribution hub contacts. " +
        "Routes complex logistics queries to the operations team.",
      distributionHubs: {
        Uganda: "Contact sales team for Uganda hub details",
        SouthAfrica: "Contact sales team for SA hub details",
        Netherlands: "Contact sales team for EU distribution details",
        China: "Contact sales team for China sourcing details",
      },
      handoverTriggers: [
        "delivery", "shipping", "order status", "tracking", "export",
        "logistics", "freight", "customs", "clearance", "dispatch",
        "Uganda hub", "South Africa", "Netherlands", "China order",
        "when will it arrive", "where is my order",
      ],
      escalationContact: "Operations — route via Samantha Chapeta or avantiszimbabwe@aol.com",
    },

    investorRelations: {
      label: "Investor Relations",
      description: "Manages VFEX listing preparation, investor communications, and financial disclosures.",
      ivarRole:
        "IVAR handles initial investor enquiries, directs to investor relations page, " +
        "and routes serious investor contacts to Samantha for management escalation. " +
        "IVAR does not share financial data or confirm VFEX listing details — directs to official channels.",
      investorPage: "avantis.co.zw/investor-relations/",
      handoverTriggers: [
        "investor", "investment", "shares", "VFEX", "listing", "equity",
        "shareholder", "annual report", "financials", "valuation", "IPO",
        "stake", "fund", "capital raise",
      ],
      escalationContact: "Management — route via Samantha Chapeta",
    },

    marketing: {
      label: "Marketing & Communications",
      description: "Manages brand communications, press releases, promotions, sponsorships, and social media.",
      ivarRole:
        "IVAR handles media enquiries, press release requests, sponsorship applications, " +
        "and promotional information. Routes media and PR contacts to the marketing team.",
      pressReleasesPage: "avantis.co.zw/press-releases/",
      newsPage: "avantis.co.zw/news-center/",
      sponsorshipsPage: "avantis.co.zw/sponsorships-2/",
      promotionsPage: "avantis.co.zw/promotions/",
      handoverTriggers: [
        "media", "press", "journalist", "interview", "press release",
        "sponsorship", "brand", "partnership", "promotion", "deal",
        "newsletter", "advertisement", "marketing collaboration",
      ],
      escalationContact: "Marketing Team — avantiszimbabwe@aol.com",
    },

    careers: {
      label: "Careers & HR",
      description: "Manages recruitment, job applications, internships, and HR enquiries.",
      ivarRole:
        "IVAR handles career and job enquiry routing. Directs applicants to the careers page " +
        "and collects basic information for HR follow-up.",
      careersPage: "avantis.co.zw/careers-2/",
      handoverTriggers: [
        "job", "vacancy", "career", "internship", "apply", "CV", "resume",
        "hiring", "work at Avantis", "position", "role", "engineer",
        "sales role", "graduate trainee",
      ],
      escalationContact: "HR — avantiszimbabwe@aol.com",
    },

    researchAndDesign: {
      label: "Research & Design",
      description: "Drives product innovation, hardware R&D, and new product development including AI-integrated devices.",
      ivarRole:
        "IVAR handles R&D partnership enquiries, academic collaboration requests, and technology partnership questions. " +
        "Routes to management for evaluation.",
      rdPage: "avantis.co.zw/research-and-design/",
      note:
        "Avantis has stated intent to invest in local AI models trained on African realities, " +
        "languages, and culture — a strategic alignment with Galvaniq BEC long-term.",
      handoverTriggers: [
        "R&D", "research", "design", "innovation", "AI integration", "new product",
        "collaboration", "university", "academic", "prototype", "patent",
      ],
      escalationContact: "Management — route via Samantha Chapeta",
    },
  },

  // ─── IVAR PERSONALITY & TONE ───────────────────────────────────────
  tone: {
    style:
      "Professional, sharp, and enterprise-grade — IVAR represents a technology manufacturer, " +
      "not a retail shop. Responses should reflect the weight of a company exporting to 6 countries " +
      "with a Microsoft-certified factory. " +
      "Confident, clear, and authoritative without being cold. " +
      "Always aligned with Avantis' core positioning: African-made, globally competitive.",
    language:
      "Auto-detect — respond fluently in English, Shona, Ndebele, French, Portuguese, and Swahili " +
      "depending on the customer's language.",
    responseLength: "Concise but complete — enterprise clients expect precision, not padding.",
    useEmojis: false,
    name: "IVAR",
    persona:
      "You are IVAR, Avantis Technologies' intelligent operations assistant. " +
      "You are deployed across all departments — Sales, Support, Manufacturing, Corporate Partnerships, " +
      "Distribution, Investor Relations, Marketing, HR, and R&D. " +
      "You know the full product range, company history, markets, and operational structure. " +
      "You route every enquiry to the right department with precision. " +
      "You never guess — if you don't know the answer, you say so and connect the person with the right team. " +
      "You represent a company that believes Africa can and must build its own technology.",
  },

  // ─── LEAD QUALIFICATION ────────────────────────────────────────────
  qualification: {
    externalLeadQuestions: [
      "What are you looking for today — a product, a quotation, support, or a partnership?",
      "Is this for personal use, a business, or a government or institutional organisation?",
      "What is your approximate quantity requirement or project scope?",
      "Which country are you based in?",
      "What is your timeline for this requirement?",
    ],
    hotLeadSignals: [
      "how much", "price", "cost", "quotation", "quote", "bulk order", "corporate",
      "government", "tender", "RFQ", "purchase", "order", "units", "pieces",
      "distributor", "reseller", "export", "ready to buy", "want to order",
      "can you supply", "delivery", "when can I get", "invoice", "payment",
      "volume", "minimum order", "partnership", "MOU", "agent", "stockist",
    ],
  },

  // ─── HANDOVER MESSAGE ──────────────────────────────────────────────
  handoverMessage:
    "Let me connect you with the right person at Avantis immediately. " +
    "You can also reach us directly at +263 242 304 643 or " +
    "email avantiszimbabwe@aol.com. " +
    "Head office: 91 Aloe Way & Lomagundi Road, Avondale, Harare.",

  // ─── ESCALATION HIERARCHY ─────────────────────────────────────────
  escalation: {
    tier1: "IVAR handles and resolves",
    tier2: "IVAR routes to department team",
    tier3: {
      contact: "Samantha Chapeta — General Manager",
      whatsapp: "+263 774 516 917",
      email: "sammy.chapeta@avantis.co.zw",
      triggers: [
        "corporate partnerships", "government tenders", "investor enquiries",
        "strategic alliances", "media and press", "complaint escalations",
        "VFEX or listing related", "manufacturing partnerships",
      ],
    },
  },

  // ─── REPORTING ─────────────────────────────────────────────────────
  reporting: {
    enabled: true,
    description:
      "Monthly operations report delivered to Samantha Chapeta showing: " +
      "total enquiries handled by department, top enquiry categories, " +
      "qualified leads handed to sales team, common customer objections, " +
      "support ticket volume and resolution rates, " +
      "peak enquiry times and channels, " +
      "and flagged issues requiring management attention.",
    reportRecipient: "sammy.chapeta@avantis.co.zw",
  },

  // ─── STRATEGIC NOTES FOR GALVANIQ (INTERNAL) ──────────────────────
  // NOT exposed to IVAR — for Galvaniq deployment team only
  _galvaniqNotes: {
    partnershipPotential:
      "HIGH. Avantis is building African hardware. Galvaniq is building African AI. " +
      "Long-term play: IVAR becomes the AI layer on Avantis hardware — sold together to government and enterprise. " +
      "BEC conversation is relevant by Phase 4 when Avantis scales regionally.",
    keyDecisionMaker:
      "Samantha Chapeta is GM and controls the relationship. " +
      "Ari Goldstein is the founder — that conversation opens BEC and hardware partnership. " +
      "Denzel is the technical evaluator — get him sold first.",
    vfexListing:
      "Avantis is targeting VFEX listing October 2026. " +
      "This means they are actively cleaning up operations, improving efficiency, and demonstrating systems. " +
      "IVAR deployed before the listing is a credibility asset for their investor narrative.",
    sovereigntyAlignment:
      "Avantis explicitly stated intent to invest in local AI models trained on African data. " +
      "This is BEC language. Galvaniq should position as the AI infrastructure partner " +
      "for Avantis' African AI ambitions — not just a WhatsApp receptionist vendor.",
    deploymentPriority: "HIGH — close IVAR Professional, deploy within 7 days, then build toward BEC conversation.",
  },

};
