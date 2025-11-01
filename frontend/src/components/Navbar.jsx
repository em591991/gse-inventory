import { Link, useLocation } from "react-router-dom";

function Navbar() {
  const location = useLocation();

  const linkClass = (path) =>
    `px-3 py-2 rounded font-medium ${
      location.pathname === path
        ? "bg-primary text-white"
        : "text-gray-700 hover:bg-primary hover:text-white"
    }`;

  return (
    <nav className="bg-white border-b-4 border-primary p-3 flex items-center space-x-3 shadow-md">
      <img src="/logo.png" alt="GSE Integrated" className="h-10 mr-4" />
      <Link to="/" className={linkClass("/")}>
        Home
      </Link>
      <Link to="/items" className={linkClass("/items")}>
        Items
      </Link>
      <Link to="/vendors" className={linkClass("/vendors")}>
        Vendors
      </Link>
      <Link to="/orders" className={linkClass("/orders")}>
        Orders
      </Link>
      <Link to="/vendor-items" className={linkClass("/vendor-items")}>
        Vendor Items
      </Link>
    </nav>
  );
}

export default Navbar;
