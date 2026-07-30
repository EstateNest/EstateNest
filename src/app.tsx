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
import GA4 from "./components/GA4";

// Management CRM Pages
import Login from "./pages/management/Login";
import Dashboard from "./pages/management/Dashboard";
import Contacts from "./pages/management/Contacts";
import Leads from "./pages/management/Leads";
import Pipeline from "./pages/management/Pipeline";
import Appointments from "./pages/management/Appointments";
import Tasks from "./pages/management/Tasks";
import Content from "./pages/management/Content";
import Reports from "./pages/management/Reports";
import Settings from "./pages/management/Settings";
import NewLead from "./pages/management/leads/NewLead";
import NewContact from "./pages/management/contacts/NewContact";
import NewAppointment from "./pages/management/appointments/NewAppointment";
import ManagementNotFound from "./pages/management/ManagementNotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <GA4 />
      <BrowserRouter>
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
          <Route path="/management/dashboard" element={<Dashboard />} />
          <Route path="/management/contacts" element={<Contacts />} />
          <Route path="/management/leads" element={<Leads />} />
          <Route path="/management/leads/new" element={<NewLead />} />
          <Route path="/management/leads/:id" element={<Leads />} />
          <Route path="/management/pipeline" element={<Pipeline />} />
          <Route path="/management/appointments" element={<Appointments />} />
          <Route path="/management/appointments/new" element={<NewAppointment />} />
          <Route path="/management/tasks" element={<Tasks />} />
          <Route path="/management/content" element={<Content />} />
          <Route path="/management/reports" element={<Reports />} />
          <Route path="/management/settings" element={<Settings />} />
          <Route path="/management/contacts/new" element={<NewContact />} />
          <Route path="/management" element={<Login />} />
          
          {/* Management 404 - must be before the catch-all */}
          <Route path="/management/*" element={<ManagementNotFound />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
