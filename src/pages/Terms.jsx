import { Link } from "react-router-dom";
import LegalDocument from "../components/legal/LegalDocument";
import { clinicData, formatClinicAddress } from "../data/clinic";

export default function Terms() {
  return (
    <LegalDocument
      heading="Terms and policies"
      title="Terms and Policies | MerryGold Beauty Clinic"
      description="Booking, payment, cancellation, health and product policies for treatments, courses and training at MerryGold Beauty Clinic."
      updated="3 October 2026"
    >
      <p>
        These terms apply whenever you book a treatment, buy a product from our dispensary, or
        enquire about training with {clinicData.legalName}, trading as {clinicData.name}. By
        booking or buying with us, you're agreeing to them, so please read the sections that
        apply to you before you go ahead.
      </p>

      <h2>1. Who we are</h2>
      <p>
        {clinicData.name} is run by {clinicData.legalName}, a company registered in England and
        Wales, company number {clinicData.companyNumber}. Our clinic is at {formatClinicAddress()}.
        You can reach us on{" "}
        <a href={clinicData.contact.emailHref}>{clinicData.contact.email}</a> or{" "}
        {clinicData.contact.phone}.
      </p>

      <h2>2. Bookings and payment</h2>
      <p>
        Online bookings are paid in full at checkout through Stripe. A booking is confirmed once
        that payment goes through and you get a confirmation from us. If you'd rather not pay
        upfront, you can request a free consultation from the site instead: no payment is taken,
        and any treatment plan and cost is agreed with you in person before you book and pay.
      </p>

      <h2>3. Cancellations, rescheduling and no-shows</h2>
      <p>
        Plans change, and it's always better to tell us than to miss the appointment. Let us
        know by phone, WhatsApp or email as early as you can, and one of the following applies:
      </p>
      <ul>
        <li>
          <strong>24 hours' notice or more:</strong> a full refund to your original payment
          method, or we move your appointment to a new date at no extra cost. Your choice.
        </li>
        <li>
          <strong>Less than 24 hours' notice:</strong> we keep 50% of the treatment price to
          cover the appointment slot, which usually can't be filled at short notice, and refund
          the rest.
        </li>
        <li>
          <strong>No-show, meaning no cancellation and no contact from you:</strong> the full
          payment is kept. We'll have held that time for you and had no chance to offer it to
          someone else.
        </li>
      </ul>
      <p>
        If we need to cancel or move an appointment, for example if a practitioner is unwell,
        you'll get a full refund or a new appointment at a time that suits you, whichever you'd
        rather have.
      </p>

      <h2>4. Late arrival</h2>
      <p>
        We can usually accommodate up to 15 minutes' lateness. Beyond that, we may need to
        shorten your treatment so we don't run into the next client's appointment, ask you to
        rebook, or treat it as a late cancellation under section 3, depending on how much time is
        left and what's booked in after you.
      </p>

      <h2>5. Consultations and patch tests</h2>
      <p>
        You can request a free consultation from the site at any point, whether or not you've
        booked a treatment. For a first tint, lash lift, laser session, semi-permanent makeup or
        chemical peel, we'll need to do a patch test at least 48 hours before your appointment, so
        there's time for any reaction to show before we treat you. A patch test stays valid for 6
        months, as long as nothing about your health or medication has changed in that time. If
        you arrive for a first appointment without a patch test done in that window, we'll need to
        do it there and then and rebook the treatment itself.
      </p>

      <h2>6. Your health and things you must tell us</h2>
      <p>
        Before we treat you, please tell us about:
      </p>
      <ul>
        <li>Any medication you're taking, including anything applied to your skin</li>
        <li>Pregnancy or breastfeeding</li>
        <li>Allergies, including to plasters, latex or fragrance</li>
        <li>Skin conditions, recent sunburn, sunbed use or fake tan</li>
        <li>Any other treatments, medical or cosmetic, you've had recently, anywhere, not just with us</li>
        <li>Isotretinoin (Roaccutane), if you've taken it in the last 6 months</li>
        <li>A personal or family history of keloid scarring</li>
      </ul>
      <p>
        We ask about these because some of them make certain treatments unsafe or mean we need to
        adjust our approach. If something you didn't tell us affects your treatment or your
        results, we're not responsible for that outcome, and we reserve the right to refuse or
        stop a treatment at any point, including partway through, if we think it isn't safe to
        continue.
      </p>

      <h2>7. Age</h2>
      <p>
        You need to be 18 or over for laser hair removal, semi-permanent makeup, tattoo removal,
        chemical peels and microneedling. If you're 16 or 17, we can offer most other beauty
        treatments (facials, waxing, threading, brow and lash services) with a parent or guardian
        present at your first appointment and their written consent. Botulinum toxin and cosmetic
        fillers, including a fillers consultation, are never offered to anyone under 18: this is a
        legal requirement under the Botulinum Toxin and Cosmetic Fillers (Children) Act 2021, and
        there are no exceptions we can make to it.
      </p>

      <h2>8. Results and aftercare</h2>
      <p>
        Skin, hair and makeup results vary from person to person. Photographs on this site show
        real results on individual clients, not a guarantee that you'll see the same outcome.
        We'll give you aftercare instructions after your treatment, and following them matters:
        skipping them can affect both your results and your safety.
      </p>

      <h2>9. Refunds</h2>
      <p>
        If you cancel or don't attend, section 3 sets out what's refunded. If a treatment itself
        goes wrong, meaning it wasn't carried out with reasonable care and skill, you're entitled
        under the Consumer Rights Act 2015 to have it corrected or to a price reduction or refund,
        and we'd want to know regardless so we can put it right. Get in touch as soon as you can
        after the appointment; see section 16 for how.
      </p>

      <h2>10. Courses, packages and gift vouchers</h2>
      <p>
        Course and package sessions, and gift vouchers, are valid for 12 months from the date you
        buy them. Each session within a course follows the same cancellation and lateness rules as
        a single appointment (sections 3 and 4). Vouchers can be used against any treatment or
        product unless we've said otherwise when you bought it.
      </p>

      <h2>11. Products bought online</h2>
      <p>
        You can return an unopened, unused product in its original packaging within 14 days of
        receiving it, for a refund. Once a product's seal is broken, we can't accept it back
        unless it's faulty, for hygiene reasons.
      </p>

      <h2>12. Prices</h2>
      <p>
        Prices on the site are the prices at the time you book, and the price you pay at checkout
        is the price you're charged; we won't change it after you've paid. Prices can change for
        future bookings without notice.
      </p>

      <h2>13. Photographs and consent</h2>
      <p>
        Before and after photographs shown on this site are of real clients who agreed to their
        use. We may take clinical photographs during your treatment for your own record and to
        track your results; these stay private to your file unless you separately agree, in
        writing, to let us use them for marketing.
      </p>

      <h2>14. In the clinic</h2>
      <p>
        Please arrive with any preparation we've asked for, such as makeup-free skin, and let us
        know in advance if you're bringing anyone with you, as space in the treatment room is
        limited. We want the clinic to be a calm, hygienic space for every client, and we may ask
        you to reschedule if you arrive unwell or visibly unable to safely receive treatment.
      </p>

      <h2>15. Training courses</h2>
      <p>
        The <Link to="/training">training page</Link> is an enquiry form, not a booking. Course
        fees, dates and entry requirements are agreed with you in writing before any training
        starts, and none of the cancellation terms above apply until that written agreement is in
        place.
      </p>

      <h2>16. Complaints</h2>
      <p>
        If something about your treatment or your visit wasn't right, tell us in writing, by
        email, within 14 days, and we'll respond within 5 working days. Most things are easiest to
        put right quickly, so the sooner we hear from you, the better.
      </p>

      <h2>17. Liability</h2>
      <p>
        Nothing in these terms limits our liability for death or personal injury caused by our
        negligence, or for fraud. Beyond that, we're not responsible for loss you could have
        avoided by following the aftercare we give you, or for delays or problems caused by
        network issues or third-party services, such as Stripe, that are outside our control.
      </p>

      <h2>18. Privacy</h2>
      <p>
        Our <Link to="/privacy">Privacy Policy</Link> explains how we collect and use your
        personal information, including the health information you give us at consultation, which
        we use only to plan and provide your treatment safely.
      </p>

      <h2>19. Changes to these terms</h2>
      <p>
        We may update these terms from time to time, for example if our policies or the law
        change. The version that applies to you is the one published on this page when you make
        your booking.
      </p>

      <h2>20. Governing law</h2>
      <p>
        These terms are governed by the law of England and Wales, and any dispute is subject to
        the exclusive jurisdiction of the courts of England and Wales.
      </p>
    </LegalDocument>
  );
}
