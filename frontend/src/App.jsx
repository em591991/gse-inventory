import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Login from "./pages/Login";
import AuthCallback from "./pages/AuthCallback";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Items from "./pages/Items";
import BulkUpload from "./components/BulkUpload";
import Vendors from "./pages/Vendors";
import Orders from "./pages/Orders";
import VendorDetail from "./pages/VendorDetail";
import VendorItems from "./pages/VendorItems";
import Shipments from "./pages/Shipments";
import Equipment from "./pages/Equipment";
import Vehicles from "./pages/Vehicles";
import Locations from "./pages/Locations";
import Users from "./pages/Users";
import AuditLog from "./pages/AuditLog";
import OrderDetail from './pages/OrderDetail';
import CreateOrder from "./pages/CreateOrder";
import RFQs from "./pages/RFQs";
import CreateRFQ from "./pages/CreateRFQ";
import RFQDetail from "./pages/RFQDetail";
import QuoteImport from "./pages/QuoteImport";
import ReplenishmentView from "./pages/ReplenishmentView";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Protected routes - require authentication */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/items"
          element={
            <ProtectedRoute>
              <Layout>
                <Items />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/vendors"
          element={
            <ProtectedRoute>
              <Layout>
                <Vendors />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/vendors/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <VendorDetail />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/vendor-items"
          element={
            <ProtectedRoute>
              <Layout>
                <VendorItems />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/locations"
          element={
            <ProtectedRoute>
              <Layout>
                <Locations />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <Layout>
                <Orders />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders/create"
          element={
            <ProtectedRoute>
              <Layout>
                <CreateOrder />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders/:orderId"
          element={
            <ProtectedRoute>
              <Layout>
                <OrderDetail />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/shipments"
          element={
            <ProtectedRoute>
              <Layout>
                <Shipments />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/equipment"
          element={
            <ProtectedRoute>
              <Layout>
                <Equipment />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/vehicles"
          element={
            <ProtectedRoute>
              <Layout>
                <Vehicles />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <Layout>
                <Users />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/audit"
          element={
            <ProtectedRoute>
              <Layout>
                <AuditLog />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/upload"
          element={
            <ProtectedRoute>
              <Layout>
                <BulkUpload />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/rfqs"
          element={
            <ProtectedRoute>
              <Layout>
                <RFQs />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/rfqs/create"
          element={
            <ProtectedRoute>
              <Layout>
                <CreateRFQ />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/rfqs/:rfqId"
          element={
            <ProtectedRoute>
              <Layout>
                <RFQDetail />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/rfqs/:rfqId/import-quotes"
          element={
            <ProtectedRoute>
              <Layout>
                <QuoteImport />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/rfqs/:rfqId/replenishment"
          element={
            <ProtectedRoute>
              <Layout>
                <ReplenishmentView />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}