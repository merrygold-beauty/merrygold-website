import { Link } from "react-router-dom";
import LegalDocument from "../components/legal/LegalDocument";
import { clinicData } from "../data/clinic";
import { ASSISTANT_NAME } from "../data/labels";

export default function Privacy() {
  return (
    <LegalDocument
      heading="Privacy Policy"
      title="Privacy Policy | MerryGold Beauty Clinic"
      description="How MerryGold Beauty Clinic collects, uses, and stores personal information for bookings, shop orders, enquiries, and clinic care."
      updated="14 September 2026"
    >
      <p>
        This notice explains what personal information {clinicData.legalName} ("MerryGold", "we") collects, why we use it, and the choices you have. We are the data controller. Company No. {clinicData.companyNumber}, registered in {clinicData.jurisdiction}.
      </p>
      <p>
        Contact: <a href={clinicData.contact.emailHref}>{clinicData.contact.email}</a> or {clinicData.contact.phone}.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>Identity and contact details: name, email, telephone, and postal address when you book, buy, or send an enquiry.</li>
        <li>Booking details: the treatment or product you choose, preferred dates, and notes you give us about your skin or appointment.</li>
        <li>Payment records: we do not store card numbers on this website. Stripe processes card payments on its own pages.</li>
        <li>Training enquiries: name, contact details, the programmes you select, your experience level, and any notes, sent to us on WhatsApp at your request.</li>
        <li>Messages: emails, WhatsApp chats, the contact form, and {ASSISTANT_NAME} questions you type.</li>
        <li>Bag contents: product identifiers stored in your browser so your bag is still there if you refresh the page.</li>
        <li>Cookie notice choice: a local record that you closed this site's cookie notice.</li>
      </ul>

      <h2>What we use it for</h2>
      <ul>
        <li>To answer enquiries and arrange consultations, treatments, training places, and product orders.</li>
        <li>To take payment in full at checkout on Stripe's page, send a receipt by email, and handle rescheduling or returns.</li>
        <li>To keep the clinical record we need for safe treatment, including patch tests and aftercare.</li>
        <li>To remember your shopping bag and that you have seen the cookie notice.</li>
        <li>To meet legal duties (tax, accounting, and health and safety records).</li>
      </ul>
      <p>
        We do not sell your information. We do not use it for advertising networks.
      </p>

      <h2>Legal bases</h2>
      <p>
        We rely on: taking steps at your request before a contract, and performing a contract (bookings, shop orders, training places); legitimate interests in running a private clinic and answering messages; legal obligation for records we must keep; and consent where you choose to message us on WhatsApp or Ask Olu.
      </p>

      <h2>Who we share it with</h2>
      <ul>
        <li>Stripe, to take payment. Card data is entered securely on Stripe's checkout.</li>
        <li>WhatsApp (Meta), if you send us a WhatsApp message, including a training enquiry. Meta provides that service under its own terms.</li>
        <li>Our email delivery provider, to send your contact, consultation, or training enquiry to the clinic's inbox.</li>
        <li>The {ASSISTANT_NAME} concierge provider, only when that live connection is switched on, so a reply can be generated. If it is not connected, answers stay on this site.</li>
        <li>Professional advisers and regulators if the law requires it.</li>
      </ul>

      <h2>How long we keep it</h2>
      <p>
        Enquiry messages that do not become a booking are kept only as long as needed to reply, then deleted. Booking, payment, and clinical records are kept for as long as UK law and professional standards require, then securely destroyed. Bag data and the cookie notice flag live in your browser until you clear it.
      </p>

      <h2>Your rights</h2>
      <p>
        You may ask for a copy of your information, ask us to correct it, delete it, restrict it, or object to our use of it, and you may ask for data portability where it applies. Write to {clinicData.contact.email}. You can also complain to the Information Commissioner's Office at ico.org.uk.
      </p>

      <h2>Cookies</h2>
      <p>
        This website does not set advertising or analytics cookies. See the <Link to="/cookies">Cookie Notice</Link> for what stays in your browser and how to close the notice.
      </p>
    </LegalDocument>
  );
}
