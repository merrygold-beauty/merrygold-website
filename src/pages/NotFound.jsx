import { Link } from "react-router-dom";
import LegalDocument from "../components/legal/LegalDocument";

// Shown for any address the site does not have. The build pre-renders it as
// 404.html, which Cloudflare Pages serves with a 404 status.
export default function NotFound() {
  return (
    <LegalDocument
      heading="Page not found"
      title="Page not found | MerryGold Beauty Clinic"
      description="This page does not exist at MerryGold Beauty Clinic."
      noindex
    >
      <p>The page you asked for is not here. It may have moved, or the address may be mistyped.</p>
      <ul>
        <li><Link to="/">Home</Link></li>
        <li><Link to="/treatments">Treatments</Link></li>
        <li><Link to="/pricing">Pricing</Link></li>
        <li><Link to="/contact">Contact us</Link></li>
      </ul>
    </LegalDocument>
  );
}
