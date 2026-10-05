import { Link } from "react-router-dom";
import LegalDocument from "../components/legal/LegalDocument";

export default function Cookies() {
  return (
    <LegalDocument
      heading="Cookie Notice"
      title="Cookie Notice | MerryGold Beauty Clinic"
      description="MerryGold Beauty Clinic uses no advertising or analytics cookies. This notice explains the essential browser storage we use and how to close the notice."
      updated="14 September 2026"
    >
      <p>
        UK law requires us to tell you what we store in your browser and why. This site does not use advertising cookies, analytics cookies, or social media tracking pixels.
      </p>

      <h2>What we store</h2>
      <ul>
        <li>
          <strong>Shopping bag.</strong> Product identifiers and quantities are saved in local storage under a MerryGold bag key so your selection is still there if you reload the page. This is needed to complete a purchase.
        </li>
        <li>
          <strong>Cookie notice.</strong> When you close the notice, we save a flag in local storage so the same message does not appear on every page load.
        </li>
      </ul>
      <p>
        These are strictly necessary for the shop and for remembering your choice. We do not need extra consent to use them.
      </p>

      <h2>What we do not store</h2>
      <p>
        We do not set Google Analytics, advertising, or remarketing cookies. Closing the notice does not switch tracking on, because tracking is not present.
      </p>

      <h2>How to clear it</h2>
      <p>
        You can delete site data in your browser settings. That empties your bag and will show the cookie notice again on the next visit. For how we use personal information you type into forms, see the <Link to="/privacy">Privacy Policy</Link>.
      </p>
    </LegalDocument>
  );
}
