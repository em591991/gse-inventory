import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Items from "./pages/Items";
import BulkUpload from "./components/BulkUpload";
import Vendors from "./pages/Vendors";
import Orders from "./pages/Orders";
import VendorDetail from "./pages/VendorDetail";
import VendorItems from "./pages/VendorItems";



function Home() {
  return (
    <div className="p-8 text-center">
      <h1 className="text-4xl font-bold text-red-500">Tailwind Test</h1>
      <p className="text-green-600 mt-2">If this is red and green, Tailwind base is working.</p>
    </div>
  );
}


function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/items" element={<Items />} />
          <Route path="/vendors" element={<Vendors />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/upload" element={<BulkUpload />} />
          <Route path="/vendors/:id" element={<VendorDetail />} /> {/* 🆕 detail route */}
          <Route path="/vendor-items" element={<VendorItems />} /> {/* ✅ this route */}
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
