import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
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

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/items" element={<Items />} />
          <Route path="/vendors" element={<Vendors />} />
          <Route path="/vendors/:id" element={<VendorDetail />} />
          <Route path="/vendor-items" element={<VendorItems />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/shipments" element={<Shipments />} />
          <Route path="/equipment" element={<Equipment />} />
          <Route path="/vehicles" element={<Vehicles />} />
          <Route path="/users" element={<Users />} />
          <Route path="/locations" element={<Locations />} />
          <Route path="/audit" element={<AuditLog />} />
          <Route path="/upload" element={<BulkUpload />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;