import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ScrollToTop } from "./components/ScrollToTop";
import { Navigation } from "./components/Navigation";

import Index from "./pages/Index";
import { DriverMode } from "./pages/DriverMode";
import { RiderMode } from "./pages/RiderMode";
import { NIP19Page } from "./pages/NIP19Page";
import NotFound from "./pages/NotFound";

export function AppRouter() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 text-foreground">
        <Navigation />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/driver" element={<DriverMode />} />
          <Route path="/rider" element={<RiderMode />} />
          {/* NIP-19 route for npub1, note1, naddr1, nevent1, nprofile1 */}
          <Route path="/:nip19" element={<NIP19Page />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
export default AppRouter;