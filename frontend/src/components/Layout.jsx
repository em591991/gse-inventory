import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import UserMenu from "./UserMenu";

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("Logistics");

  // Main navigation sections
  const mainSections = [
    { id: "Logistics", label: "Logistics" },
    { id: "Sales", label: "Sales" },
    { id: "Operations", label: "Operations" },
    { id: "Admin", label: "Admin" },
    { id: "Info", label: "Info" },
  ];

  // Secondary navigation items organized by section
  const sectionNavItems = {
    Logistics: [
      { path: "/items", label: "Inventory" },
      { path: "/locations", label: "Locations" },
      { path: "/vendors", label: "Vendors" },
      { path: "/vendor-items", label: "Vendor Items" },
      { path: "/orders", label: "Orders" },
      { path: "/rfqs", label: "RFQs" },
      { path: "/shipments", label: "Shipments" },
      { path: "/equipment", label: "Equipment" },
      { path: "/vehicles", label: "Vehicles" },
    ],
    Sales: [
      { path: "/sales", label: "Dashboard" },
    ],
    Operations: [
      { path: "/operations", label: "Dashboard" },
    ],
    Admin: [
      { path: "/admin", label: "Dashboard" },
      { path: "/users", label: "Users" },
      { path: "/audit", label: "Audit Log" },
    ],
    Info: [
      { path: "/info", label: "Dashboard" },
    ],
  };

  // Determine which section should be active based on current route
  const getCurrentSection = () => {
    for (const [section, items] of Object.entries(sectionNavItems)) {
      if (items.some(item => location.pathname.startsWith(item.path))) {
        return section;
      }
    }
    return "Logistics"; // Default
  };

  // Get active section (either from state or auto-detect from route)
  const currentSection = getCurrentSection();
  if (currentSection !== activeSection) {
    setActiveSection(currentSection);
  }

  const isActive = (path) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  const handleSectionClick = (sectionId) => {
    setActiveSection(sectionId);
    // Navigate to first page in that section if it has pages
    const pages = sectionNavItems[sectionId];
    if (pages && pages.length > 0) {
      navigate(pages[0].path);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white shadow-lg border-b-4 border-gseblue">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Left side: Logo + Main Navigation Sections */}
            <div className="flex items-center gap-6">
              {/* Logo - Clickable to Home */}
              <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition">
                <img src="/logo.png" alt="GSE Integrated" className="h-12" />
              </Link>

              {/* Main Navigation Sections */}
              {mainSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => handleSectionClick(section.id)}
                  className={`px-4 py-3 text-sm font-semibold whitespace-nowrap transition border-b-4 ${
                    activeSection === section.id
                      ? "text-gseblue border-gseblue"
                      : "text-gray-700 hover:text-gseblue border-transparent"
                  }`}
                >
                  {section.label}
                </button>
              ))}
            </div>

            {/* Right side: User Menu Component */}
            <UserMenu />
          </div>
        </div>

        {/* Secondary Navigation - Context-aware based on active section */}
        {sectionNavItems[activeSection]?.length > 0 && (
          <div className="px-6 py-0 bg-gsegray border-t border-gray-200">
            <div className="flex gap-1 overflow-x-auto">
              {sectionNavItems[activeSection].map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition border-b-3 ${
                    isActive(item.path)
                      ? "bg-white text-gseblue border-b-4 border-gseblue"
                      : "text-gray-700 hover:bg-white hover:text-gseblue border-b-4 border-transparent"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="min-h-screen">{children}</main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-4 mt-8">
        <div className="container mx-auto px-6 text-center text-sm">
          <p>GSE Inventory Management System © 2025</p>
          <p className="text-gray-400 mt-1">
            Powered by GSE Technology Solutions
          </p>
        </div>
      </footer>
    </div>
  );
}