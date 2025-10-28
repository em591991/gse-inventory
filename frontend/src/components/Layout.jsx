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
    { path: "/rfqs", label: "RFQs"},
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
      <nav className="bg-white shadow-lg border-b-4 border-primary">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="GSE Integrated" className="h-12" />
            </div>

            {/* User Menu Component */}
            <UserMenu />
          </div>
        </div>

        {/* Navigation Links */}
        <div className="px-6 py-0 bg-gray-100 border-t border-gray-200">
          <div className="flex gap-1 overflow-x-auto">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition border-b-3 ${
                  isActive(item.path)
                    ? "bg-white text-primary border-b-4 border-primary"
                    : "text-gray-700 hover:bg-white hover:text-primary border-b-4 border-transparent"
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