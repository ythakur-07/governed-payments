import { Outlet } from "react-router-dom";
import TopNav from "./TopNav.jsx";
import Footer from "./Footer.jsx";
import ScrollToTop from "./ScrollToTop.jsx";

// Editorial, light-themed shell for the public research site.
// Scoped under .gp-site so the dark operator console theme is unaffected.
export default function SiteLayout() {
  return (
    <div className="gp-site min-h-screen flex flex-col">
      <ScrollToTop />
      <TopNav />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
