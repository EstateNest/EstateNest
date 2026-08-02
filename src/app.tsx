import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Services from "./pages/Services";
import About from "./pages/About";
import Quote from "./pages/Quote";
import Calculators from "./pages/Calculators";
import Careers from "./pages/Careers";
import Contact from "./pages/Contact";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Cookies from "./pages/Cookies";
import FAQ from "./pages/FAQ";
import ServiceAreas from "./pages/ServiceAreas";
import NotFound from "./pages/NotFound";
import ScrollToTop from "./components/ScrollToTop";
import ChatBot from "./components/ChatBot";

const Login = lazy(() => import("./pages/management/Login"));
const Dashboard = lazy(() => import("./pages/management/Dashboard"));
const AccessDenied = lazy(() => import("./pages/management/AccessDenied"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <ChatBot />
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-600">Loading...</div>}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/services" element={<Services />} />
          <Route path="/about" element={<About />} />
          <Route path="/quote" element={<Quote />} />
          <Route path="/calculators" element={<Calculators />} />
          <Route path="/careers" element={<Careers />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/cookies" element={<Cookies />} />
          <Route path="/service-areas" element={<ServiceAreas />} />
          {/* Management CRM Routes */}
          <Route path="/management/login" element={<Login />} />
          <Route path="/management/access-denied" element={<AccessDenied />} />
          <Route path="/management/*" element={<Dashboard />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
