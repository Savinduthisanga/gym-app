import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Layout from './components/layout/Layout';
import Dashboard from './components/dashboard/Dashboard';
import WorkoutTracker from './components/workouts/WorkoutTracker';
import MemberManagement from './components/members/MemberManagement';
import DietTracker from './components/diet/DietTracker';
import PaymentTracker from './components/payments/PaymentTracker';
import Reports from './components/reports/Reports';
import Settings from './components/settings/Settings';
import ExportData from './components/export/ExportData';
import EquipmentManagement from './components/equipment/EquipmentManagement';

export default function App() {
  return (
    <BrowserRouter>
      <SettingsProvider>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/workouts" element={<WorkoutTracker />} />
            <Route path="/members" element={<MemberManagement />} />
            <Route path="/diet" element={<DietTracker />} />
            <Route path="/payments" element={<PaymentTracker />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/equipment" element={<EquipmentManagement />} />
            <Route path="/export" element={<ExportData />} />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
      </SettingsProvider>
    </BrowserRouter>
  );
}
