import { useCallback } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import PullToRefresh from "@/components/PullToRefresh";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LinesProvider } from "@/hooks/useLines.tsx";
import ProtectedRoute from "@/components/ProtectedRoute";
import Dashboard from "./pages/Dashboard.tsx";
import Home from "./pages/Home.tsx";
import LinePage from "./pages/LinePage.tsx";
import Auth from "./pages/Auth.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import AdminPanel from "./pages/AdminPanel.tsx";
import DevAdminToggle from "./components/DevAdminToggle.tsx";
import TrainingHome from "./pages/TrainingHome.tsx";
import EmployeeTraining from "./pages/EmployeeTraining.tsx";
import TrainingForm from "./pages/TrainingForm.tsx";
import TrainingPrint from "./pages/TrainingPrint.tsx";
import EquipmentCatalog from "./pages/EquipmentCatalog.tsx";
import EquipmentDetail from "./pages/EquipmentDetail.tsx";
import WasteManagement from "./pages/WasteManagement.tsx";
import AdminEmployeeList from "./pages/AdminEmployeeList.tsx";
import VoltageRound from "./pages/VoltageRound.tsx";
import VoltageRoundPrint from "./pages/VoltageRoundPrint.tsx";
import Sf6Round from "./pages/Sf6Round.tsx";
import NotFound from "./pages/NotFound.tsx";
import Stasjon from "./pages/Stasjon.tsx";
import Ledning from "./pages/Ledning.tsx";
import Montasje from "./pages/Montasje.tsx";
import MontasjeDetail from "./pages/MontasjeDetail.tsx";
import Drone from "./pages/Drone.tsx";
import DroneRules from "./pages/DroneRules.tsx";
import DroneRuleDetail from "./pages/DroneRuleDetail.tsx";
import DroneGuide from "./pages/DroneGuide.tsx";
import DroneClasses from "./pages/DroneClasses.tsx";
import DroneClassDetail from "./pages/DroneClassDetail.tsx";
import StatnettProcedures from "./pages/StatnettProcedures.tsx";
import StatnettProcedurePdf from "./pages/StatnettProcedurePdf.tsx";

const queryClient = new QueryClient();

const handlePullRefresh = async () => {
  window.location.reload();
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LinesProvider>
        <Toaster />
        <Sonner />
        <DevAdminToggle />
        <PullToRefresh onRefresh={handlePullRefresh}>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            

            {/* Protected routes */}
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/stasjon" element={<ProtectedRoute><Stasjon /></ProtectedRoute>} />
            <Route path="/ledning" element={<ProtectedRoute><Ledning /></ProtectedRoute>} />
            <Route path="/ledning/montasje" element={<ProtectedRoute><Montasje /></ProtectedRoute>} />
            <Route path="/ledning/montasje/:guideId" element={<ProtectedRoute><MontasjeDetail /></ProtectedRoute>} />
            <Route path="/drone" element={<ProtectedRoute><Drone /></ProtectedRoute>} />
            <Route path="/drone/regler" element={<ProtectedRoute><DroneRules /></ProtectedRoute>} />
            <Route path="/drone/regler/:ruleId" element={<ProtectedRoute><DroneRuleDetail /></ProtectedRoute>} />
            <Route path="/drone/guide/:guideId" element={<ProtectedRoute><DroneGuide /></ProtectedRoute>} />
            <Route path="/drone/klasser" element={<ProtectedRoute><DroneClasses /></ProtectedRoute>} />
            <Route path="/drone/klasser/:classId" element={<ProtectedRoute><DroneClassDetail /></ProtectedRoute>} />
            <Route path="/drone/prosedyrer" element={<ProtectedRoute><StatnettProcedures /></ProtectedRoute>} />
            <Route path="/drone/prosedyrer/:sdokId/pdf" element={<ProtectedRoute><StatnettProcedurePdf /></ProtectedRoute>} />
            <Route path="/ledningsbefaring" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/ledningsbefaring/linje/:lineId" element={<ProtectedRoute><LinePage /></ProtectedRoute>} />
            <Route path="/dokumentert-opplaering" element={<ProtectedRoute><TrainingHome /></ProtectedRoute>} />
            <Route path="/dokumentert-opplaering/ansatt/:employeeId" element={<ProtectedRoute><EmployeeTraining /></ProtectedRoute>} />
            <Route path="/dokumentert-opplaering/ansatte" element={<ProtectedRoute requireAdmin><AdminEmployeeList /></ProtectedRoute>} />
            <Route path="/dokumentert-opplaering/ansatt/:employeeId/ny" element={<ProtectedRoute><TrainingForm /></ProtectedRoute>} />
            <Route path="/dokumentert-opplaering/ansatt/:employeeId/skjema/:recordId" element={<ProtectedRoute><TrainingForm /></ProtectedRoute>} />
            <Route path="/dokumentert-opplaering/ansatt/:employeeId/print" element={<ProtectedRoute><TrainingPrint /></ProtectedRoute>} />
            <Route path="/dokumentert-opplaering/katalog" element={<ProtectedRoute><EquipmentCatalog /></ProtectedRoute>} />
            <Route path="/dokumentert-opplaering/katalog/:itemId" element={<ProtectedRoute><EquipmentDetail /></ProtectedRoute>} />
            <Route path="/avfallshandtering" element={<ProtectedRoute><WasteManagement /></ProtectedRoute>} />
            <Route path="/spenningsrunde" element={<ProtectedRoute><VoltageRound /></ProtectedRoute>} />
            <Route path="/spenningsrunde/:roundId/print" element={<ProtectedRoute><VoltageRoundPrint /></ProtectedRoute>} />
            <Route path="/sf6-runde" element={<ProtectedRoute><Sf6Round /></ProtectedRoute>} />


            {/* Admin routes */}
            <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminPanel /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </PullToRefresh>
      </LinesProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
