import React from "react";
import { NavLink } from "react-router-dom";
import "./AdminTabs.css";

export default function AdminTabs(){
  const tabs = [
    { to: "/admin", label: "Dashboard", icon: "📊" },
    { to: "/admin/orders", label: "Orders", icon: "🧾" },
    { to: "/admin/menu-stock", label: "Menu & Stock", icon: "🍽️" },
    { to: "/admin/users", label: "Users", icon: "👥" },
    { to: "/admin/crowd", label: "Crowd Meter", icon: "📈" },
  ];
  return (
    <div className="admin-tabs-wrap">
      <nav className="admin-tabs card">
        {tabs.map(t => (
          <NavLink key={t.to} to={t.to} end className="tab-link">
            <span className="t-ic" aria-hidden="true">{t.icon}</span>
            <span>{t.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
