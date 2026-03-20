import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
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
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LinesProvider>
        <Toaster />
        <Sonner />
        <DevAdminToggle />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            

            {/* Protected routes */}
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
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

            {/* Admin routes */}
            <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminPanel /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </LinesProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
