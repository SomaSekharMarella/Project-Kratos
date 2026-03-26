import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Home" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/admin", label: "Admin" },
  { to: "/voting", label: "Voting" },
  { to: "/results", label: "Results" },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      {links.map((item) => (
        <NavLink key={item.to} to={item.to} end={item.to === "/"} className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
          {item.label}
        </NavLink>
      ))}
    </aside>
  );
}

