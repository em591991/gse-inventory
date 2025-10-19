import { Link, useLocation } from "react-router-dom";

function Navbar() {
  const location = useLocation();

  const linkClass = (path) =>
    `px-3 py-2 rounded ${
      location.pathname === path
        ? "bg-blue-600 text-white"
        : "text-gray-700 hover:bg-blue-100"
    }`;

  return (
    <nav className="bg-gseblue text-white p-3 flex space-x-3 shadow-md">
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
