import { WHATSAPP_E164, WHATSAPP_DISPLAY, clinicData, formatClinicAddress } from "../data/clinic.js";
import catalogueIndex from "../data/catalogueIndex.js";
import { formatPounds } from "../lib/formatPounds.js";

// The offline replies read their prices from the same catalogue the checkout
// charges from, so a price change can never leave them quoting the old one.
const pencePerTreatment = new Map(catalogueIndex.map((entry) => [entry.id, entry.pence]));
function price(treatmentId) {
  return formatPounds(pencePerTreatment.get(treatmentId) / 100);
}

function getLocalKnowledgeReply(userMessage) {
  const msg = (userMessage || "").toString().toLowerCase();

  if (msg.includes("microblade") || msg.includes("microblading") || msg.includes("brow")) {
    return `Microblading at MerryGold is ${price("spmu-microblading")} for 2 hours 30 mins. We also offer Ombré Powder Brows (${price("spmu-ombre-brows")}), Combination Brows (${price("spmu-combination-brows")}), and Brow Lamination (${price("brow-lamination")}). Would you like to book a consultation or book on our website?`;
  }

  if (msg.includes("laser") || msg.includes("hair removal") || msg.includes("tattoo")) {
    return `Laser hair removal is booked by combo packages or by individual body area. Individual small areas start at ${price("other-laser-hair-removal-individual-small-areas")}, ladies' full body is ${price("laser-full-body")} per session, and full leg + bikini + underarm is ${price("laser-full-leg-combo")}. Laser tattoo removal starts at ${price("other-small-tattoo-removal")}. A patch test is done before the first full session. Would you like to book a treatment?`;
  }

  if (msg.includes("massage")) {
    return `We offer Swedish massage (${price("other-relaxing-swedish-massage-30")} for 30 mins, ${price("other-relaxing-swedish-massage-60")} for 1 hour), Deep Tissue massage (${price("other-deep-tissue-massage-30")} for 30 mins, ${price("other-deep-tissue-massage-60")} for 1 hour), Hot Stone massage (${price("massage-hot-stone")} for 1 hour), the Aroma Dreamscape (${price("massage-aroma-cryo-sphere")}) and Couple Massage (${price("other-couple-massage")}). Would you like to book a massage?`;
  }

  if (msg.includes("facial") || msg.includes("skin") || msg.includes("peel") || msg.includes("glow")) {
    return `Facials start from ${price("facial-classic")} for the Classic/Mini Facial, ${price("facial-deep-cleansing")} for Deep Cleansing, ${price("facial-hydra")} for Hydra Facial, ${price("facial-derma-pen")} for Derma-Pen microneedling, ${price("facial-chemical-peel")} for a Chemical Peel, and ${price("facial-million-dollar")} for the MerryGold Million Dollar Facial. Can I help you choose a facial?`;
  }

  if (msg.includes("olu") || msg.includes("director") || msg.includes("who are you") || msg.includes("credentials") || msg.includes("experience")) {
    return "MerryGold is directed by Oluwakemi Okunniyi (Olu). She holds VTCT Level 2, 3, 4, and 5 clinical qualifications from the London Aesthetic Clinic and CPD certification. Her international luxury experience includes serving as Beauty Specialist at Harrods and Selfridges in London, Charlotte Tilbury, and Thérapie Clinic (Europe's #1 skin clinic). She personally oversees all clinical protocols.";
  }

  if (msg.includes("price") || msg.includes("cost") || msg.includes("how much")) {
    return `Bookable prices include Microblading Brows ${price("spmu-microblading")}, Deep Cleansing Facial ${price("facial-deep-cleansing")}, MerryGold Million Dollar Facial ${price("facial-million-dollar")}, Gold Facial ${price("facial-gold")}, ladies' full body laser ${price("laser-full-body")}, Swedish massage from ${price("other-relaxing-swedish-massage-30")}, and Lip Waxing from ${price("other-lip-waxing")}. The full list is on our Treatments and Pricing pages.`;
  }

  if (msg.includes("book") || msg.includes("appointment")) {
    return `You can book instantly online through our website (/treatments), message us on WhatsApp (${WHATSAPP_DISPLAY}), or call our concierge. What date and treatment were you considering?`;
  }

  if (msg.includes("training") || msg.includes("trainee") || msg.includes("learn to")) {
    return "MerryGold offers one-to-one clinic training by enquiry, not as a standard treatment booking. You can ask about semi-permanent makeup, clinical facials, laser hair removal, brow lamination and lash lift, bridal makeup, and threading. Open the Training page, fill the form, and Enquire now will open WhatsApp with your details ready to send.";
  }

  if (msg.includes("hours") || msg.includes("time") || msg.includes("open") || msg.includes("when")) {
    return "MerryGold is open Monday to Saturday from 10:00 to 20:00, and Sunday from 10:00 to 18:00. Booking ahead is best.";
  }

  if (msg.includes("where") || msg.includes("location") || msg.includes("address") || msg.includes("parking") || msg.includes("barking")) {
    return `MerryGold Beauty Clinic is at ${formatClinicAddress()}. ${clinicData.transport} A client review also notes Asda parking around the corner.`;
  }

  if (msg.includes("whatsapp") || msg.includes("phone") || msg.includes("call") || msg.includes("contact")) {
    return `You can reach our clinic concierge directly on WhatsApp at https://wa.me/${WHATSAPP_E164} or by phone at ${clinicData.contact.phone}. We are also available at ${clinicData.contact.email}.`;
  }

  return "Welcome to MerryGold Beauty Clinic. I am Goldie, your clinical concierge. I can answer any questions about our treatments, medical laser hair removal, bespoke facials, pricing, or help you book your appointment. How can I assist you today?";
}

function scrubStyle(text) {
  if (!text || typeof text !== "string") return text;
  return text
    .replace(/ — /g, ", ")
    .replace(/\s—(?=\S)/g, ", ")
    .replace(/(?<=\w)—(?=\w)/g, "-")
    .replace(/—\s*/g, ", ")
    // Emoji and pictographs, which the model still adds despite the prompt.
    .replace(/[\p{Extended_Pictographic}️]/gu, "")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}

export async function sendGoldieMessage(messagesHistory, userMessage) {
  try {
    const response = await fetch("/api/goldie", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: messagesHistory, userMessage })
    });

    if (response.ok) {
      const data = await response.json();
      if (data?.text && data.text.trim()) {
        return { text: scrubStyle(data.text.trim()), source: "openrouter" };
      }
    } else if (response.status !== 503) {
      // 503 means no key is configured, the same silent case as today.
      // Anything else (a 502 from OpenRouter, a bad request) is worth
      // seeing, so the cause of a generic-sounding reply is visible.
      const data = await response.json().catch(() => ({}));
      console.warn("Goldie API error, switching to local knowledge engine:", data.error);
    }
  } catch (err) {
    console.warn("Goldie API fetch error, switching to local knowledge engine:", err);
  }

  // Graceful, immediate local knowledge fallback
  return {
    text: scrubStyle(getLocalKnowledgeReply(userMessage)),
    source: "local-concierge"
  };
}
