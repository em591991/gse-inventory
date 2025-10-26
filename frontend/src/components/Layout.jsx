import { Link, useLocation } from "react-router-dom";
import UserMenu from "./UserMenu";

export default function Layout({ children }) {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Home"},
    { path: "/items", label: "Inventory"},
    { path: "/locations", label: "Locations"},
    { path: "/vendors", label: "Vendors"},
    { path: "/vendor-items", label: "Vendor Items"},
    { path: "/orders", label: "Orders"},
    { path: "/shipments", label: "Shipments"},
    { path: "/equipment", label: "Equipment"},
    { path: "/vehicles", label: "Vehicles" },
    { path: "/users", label: "Users"},
    { path: "/audit", label: "Audit Log" },
  ];

  const isActive = (path) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <nav className="bg-blue-600 text-white shadow-lg">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⚡</span>
              <h1 className="text-xl font-bold">GSE Inventory</h1>
            </div>
            
            {/* User Menu Component */}
            <UserMenu />
          </div>
        </div>

        {/* Navigation Links */}
        <div className="px-6 py-2 bg-blue-700">
          <div className="flex gap-1 overflow-x-auto">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-4 py-2 rounded-t text-sm whitespace-nowrap transition ${
                  isActive(item.path)
                    ? "bg-white text-blue-600 font-semibold"
                    : "text-white hover:bg-blue-600"
                }`}
              >
                <span className="mr-1">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="min-h-screen">{children}</main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-4 mt-8">
        <div className="container mx-auto px-6 text-center text-sm">
          <p>GSE Inventory Management System © 2025</p>
          <p className="text-gray-400 mt-1">
            71 Models | 22+ API Endpoints | Django + React | Authenticated Users
          </p>
        </div>
      </footer>
    </div>
  );
}