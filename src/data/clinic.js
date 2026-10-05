// The site's one canonical host (www, so the DNS can stay at IONOS beside the
// Zoho mail records; the bare domain forwards here). Used for canonical URLs,
// share tags, structured data and the sitemap, so a domain change is one edit.
export const SITE_ORIGIN = "https://www.merrygoldbeautyclinics.com";

// The same number in two formats; change both together.
export const WHATSAPP_E164 = "447939402111";
export const WHATSAPP_DISPLAY = "+44 7939 402111";

const CLINIC_EMAIL = "hello@merrygoldbeautyclinics.com";

export function buildWhatsAppUrl(message) {
  return `https://wa.me/${WHATSAPP_E164}?text=${encodeURIComponent(message)}`;
}

export const clinicData = {
  name: "MerryGold Beauty Clinic",
  legalName: "Merrygold Beauty and Aesthetics Clinics Limited",
  companyNumber: "16606278",
  jurisdiction: "England & Wales",
  tagline: "Your confidant for your best skin",
  foundingYear: 2018,
  director: {
    name: "Oluwakemi Okunniyi",
    preferredName: "Olu (Merrygold)",
    title: "Founder, Senior Aesthetic Practitioner & Beauty Artist",
    credentials: "VTCT Level 2, 3, 4, 5 (London Aesthetic Clinic) | CPD Certified (EVLISS Aesthetic Clinic)",
    pastExperience: [
      "Beauty Specialist & Retail Artist at Harrods and Selfridges, London",
      "Beauty Specialist with Charlotte Tilbury UK",
      "Skin Specialist at Thérapie Clinic (Europe's #1 Skin Clinic)",
      "Freelance Artistry with 24Seven Talent Acquisition",
      "Alumna of Unveil Beauty Nigeria & London Aesthetic Clinic"
    ],
    bio: "Hello, I’m Merrygold, a passionate beauty artist and certified skin therapist with over 10 years of hands-on experience in the global beauty industry. My journey began in Nigeria, where I pioneered makeup artistry in a well-known location and helped shape the local beauty scene. Since then, I’ve trained with top beauty academies across Nigeria and the UK, earned VTCT level 2, 3, 4, 5 beauty qualifications and CPD certifications from respected institutions in London, and worked with globally renowned brands and stores like Charlotte Tilbury, Harrods and Selfridges. These experiences have sharpened my expertise in delivering treatments that blend care and results. Throughout my career, I’ve served a diverse clientele, from high-profile individuals to everyday clients seeking confidence through beauty. My roles as a beauty specialist and skin therapist have taken me to prestigious platforms like Thérapie Clinic (Europe’s top skin clinic) and 24Seven Talent Acquisition, allowing me to work across both creative and clinical beauty spaces. I’ve built a reputation for my attention to detail, warm personality, and personalised approach, always putting my clients’ needs first. Whether addressing skin concerns or enhancing natural features through makeup, I bring a gentle touch and a results-driven mindset to every session. Today, I continue to evolve with the industry while staying grounded in my passion for empowering others. Beauty is more than skin-deep; it is a journey of self-confidence and self-care. My mission is to help you feel radiant, inside and out, by offering world-class treatments and heartfelt service. Thank you for being here. I look forward to helping you love your skin and celebrate your beauty with grace and excellence.",
    philosophy: "Beauty isn't one-size-fits-all. It is about understanding individual anatomy, keeping up with skin science, and most importantly, listening to what each client truly needs. We design every treatment to enhance your natural features, never to distort them, and to leave you with a real sense of wellbeing.",
    standards: [
      "VTCT Levels 2 to 5 accredited clinical protocols",
      "CPD certified in advanced aesthetic and skincare safety standards",
      "Specialist calibration for all skin tones and Fitzpatrick phototypes I-VI",
      "Patch testing and bespoke pre-treatment consultation with every client"
    ]
  },
  contact: {
    phone: "+44 793 940 2111",
    phoneHref: "tel:+447939402111",
    whatsappUrl: buildWhatsAppUrl("Hello MerryGold, I would like to enquire about a treatment."),
    email: CLINIC_EMAIL,
    emailHref: `mailto:${CLINIC_EMAIL}`,
    address: {
      street: "Suite C, Weller House, Longbridge Road",
      area: "Barking",
      city: "London",
      postalCode: "IG11 8RT",
      country: "United Kingdom"
    },
    openingHours: [
      { days: "Monday - Saturday", hours: "10:00 - 20:00" },
      { days: "Sunday", hours: "10:00 - 18:00" }
    ],
    // The clinic's commission-free Treatwell booking link (Treatwell Connect,
    // Online booking, Booking link). Treatwell keeps its own diary, separate
    // from the site's bookings.
    treatwellBookingUrl: "https://trea.tw/bGnj8v279digB9A3f"
  },
  transport: "Two-minute walk from Barking station.",
  amenities: [
    "Cash accepted",
    "Credit card accepted",
    "Debit card accepted"
  ],
  venueAbout: [
    "Welcome to Merrygold Beauty Clinic, a cosy, warm, and relaxing beauty space where your comfort, satisfaction, and confidence come first. We are dedicated to giving you a premium care experience designed not just for results, but for complete relaxation and enjoyment.",
    "To ensure your comfort throughout your visit, we provide a clean, beautifully scented space with soft, calming music to help you unwind. You’ll be welcomed with a refreshing drink such as water, juice, or tea, and treated to a cozy, comfortable treatment bed for a truly relaxing experience. After your treatment, we also offer a mirror moment so you can fully see and enjoy your beautiful results.",
    "At Merrygold, every detail is thoughtfully designed to make you feel cared for, relaxed, and confidently glowing."
  ],
  team: [
    {
      id: "oluwakemi",
      name: "Oluwakemi Okunniyi",
      preferredName: "Olu (Merrygold)",
      title: "Beauty and Aesthetic Therapist",
      services: ["Hair", "Face", "Hair removal", "Medical Aesthetics"],
      reviewCount: 9,
      reviewAverage: "5.0"
    },
    {
      id: "tobi",
      name: "Tobi Obaju",
      preferredName: "Tobi",
      title: "Face treatments",
      services: ["Face"],
      reviewCount: 0,
      reviewAverage: null
    }
  ],
  social: {
    // Taken down on 2026-09-28 while the owner refreshes all three accounts.
    // Set to true to show them again in the header, footer and schema, but
    // correct the TikTok address first: @merrygoldbeauty is not the clinic's.
    showLinks: false,
    instagram: "https://www.instagram.com/merrygoldbeautyclinicltd/",
    tiktok: "https://www.tiktok.com/@merrygoldbeauty",
    // The page her share link (facebook.com/share/1EYEUBAg8A) resolves to.
    facebook: "https://www.facebook.com/MerrygoldColoursAndMakeupSchool/",
    email: `mailto:${CLINIC_EMAIL}`
  },
  // Confirmed against the clinic's Google Business Profile listing. No
  // rating or review count here: those go stale, and the live Google
  // reviews feed (functions/api/google-reviews.js) supplies them instead.
  google: {
    listedName: "Merrygold Beauty Clinic Ltd",
    mapsUrl: "https://maps.google.com/?cid=4154085419101479058",
    knowledgeGraphId: "/g/11xn9mr71w"
  }
};

export function formatClinicAddress() {
  const { street, area, city, postalCode } = clinicData.contact.address;
  return `${street}, ${area}, ${city} ${postalCode}`;
}

export function getLocalBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "BeautySalon",
    "name": clinicData.name,
    "legalName": clinicData.legalName,
    "identifier": clinicData.companyNumber,
    "image": `${SITE_ORIGIN}/assets/merrygold-logo-full.png`,
    "@id": SITE_ORIGIN,
    "url": SITE_ORIGIN,
    "telephone": clinicData.contact.phone,
    ...(clinicData.social.showLinks && {
      "sameAs": [
        clinicData.social.tiktok,
        clinicData.social.instagram,
        clinicData.social.facebook
      ]
    }),
    "priceRange": "££-£££",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": clinicData.contact.address.street,
      "addressLocality": clinicData.contact.address.area,
      "addressRegion": clinicData.contact.address.city,
      "postalCode": clinicData.contact.address.postalCode,
      "addressCountry": "GB"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 51.5367,
      "longitude": 0.0827
    },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        "opens": "10:00",
        "closes": "20:00"
      },
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": "Sunday",
        "opens": "10:00",
        "closes": "18:00"
      }
    ]
  };
}
