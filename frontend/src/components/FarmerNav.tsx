import { NavLink } from "react-router-dom";

export function FarmerNav() {
  return (
    <nav className="flex items-center gap-2">
      <NavLink
        to="/dashboard"
        end
        className={({ isActive }) => (isActive ? "tab active" : "tab")}
      >
        Overview
      </NavLink>
      <NavLink
        to="/dashboard/vlm"
        className={({ isActive }) => (isActive ? "tab active" : "tab")}
      >
        VLM Detection
      </NavLink>
    </nav>
  );
}
