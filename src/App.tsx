import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LinesProvider } from "@/hooks/useLines.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Home from "./pages/Home.tsx";
import LinePage from "./pages/LinePage.tsx";
import Auth from "./pages/Auth.tsx";
import TrainingHome from "./pages/TrainingHome.tsx";
import EmployeeTraining from "./pages/EmployeeTraining.tsx";
import TrainingForm from "./pages/TrainingForm.tsx";
import TrainingPrint from "./pages/TrainingPrint.tsx";
import EquipmentCatalog from "./pages/EquipmentCatalog.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LinesProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/ledningsbefaring" element={<Home />} />
            <Route path="/ledningsbefaring/linje/:lineId" element={<LinePage />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dokumentert-opplaering" element={<TrainingHome />} />
            <Route path="/dokumentert-opplaering/ansatt/:employeeId" element={<EmployeeTraining />} />
            <Route path="/dokumentert-opplaering/ansatt/:employeeId/ny" element={<TrainingForm />} />
            <Route path="/dokumentert-opplaering/ansatt/:employeeId/skjema/:recordId" element={<TrainingForm />} />
            <Route path="/dokumentert-opplaering/ansatt/:employeeId/print" element={<TrainingPrint />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </LinesProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
