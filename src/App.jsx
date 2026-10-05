import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/layout/Layout";
import ScrollManager from "./components/common/ScrollManager";
import Home from "./pages/Home";
import Treatments from "./pages/Treatments";
import Shop from "./pages/Shop";
import About from "./pages/About";
import Results from "./pages/Results";
import TheClinic from "./pages/TheClinic";
import Contact from "./pages/Contact";
import Training from "./pages/Training";
import Blog from "./pages/Blog";
import BlogArticle from "./pages/BlogArticle";
import Privacy from "./pages/Privacy";
import Pricing from "./pages/Pricing";
import Cookies from "./pages/Cookies";
import Terms from "./pages/Terms";
import CheckoutResult from "./pages/CheckoutResult";
import OrdersDashboard from "./pages/OrdersDashboard";
import NotFound from "./pages/NotFound";
import { ShopProvider } from "./context/ShopContext";

export default function App() {
  return (
    <ShopProvider>
      <Layout>
        <ScrollManager />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/treatments" element={<Treatments />} />
          <Route path="/treatments/:slug" element={<Treatments />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/about" element={<About />} />
          <Route path="/results" element={<Results />} />
          <Route path="/the-clinic" element={<TheClinic />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/training" element={<Training />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogArticle />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/cookies" element={<Cookies />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/checkout/success" element={<CheckoutResult />} />
          <Route path="/checkout/cancelled" element={<CheckoutResult />} />
          <Route path="/admin/orders" element={<OrdersDashboard />} />
          {/* Old paths from before the About and Blog pages existed. public/_redirects
              sends these with a 301 on the live site; these cover links inside the app. */}
          <Route path="/director" element={<Navigate to="/about" replace />} />
          <Route path="/journal" element={<Navigate to="/blog" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </ShopProvider>
  );
}
