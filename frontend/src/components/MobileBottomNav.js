import React from "react";
import { NavLink, useLocation } from "react-router-dom";

const tabs = [
  {
    label: "Home",
    icon: "⌂",
    to: "/",
    matches: (pathname) => pathname === "/",
  },
  {
    label: "Map",
    icon: "⌖",
    to: "/map",
    matches: (pathname) => pathname === "/map",
  },
  {
    label: "My Finds",
    icon: "♥",
    to: "/my-finds",
    matches: (pathname) => pathname === "/my-finds" || pathname === "/my-sellers",
  },
  {
    label: "Sellers",
    icon: "▣",
    to: "/seller-dashboard",
    matches: (pathname) =>
      [
        "/seller",
        "/list-your-business",
        "/review-submissions",
        "/seller-dashboard",
        "/application-pending",
        "/seller-agreement",
        "/create-password",
        "/payment-setup",
        "/payment-success",
      ].includes(pathname),
  },
  {
    label: "Profile",
    icon: "◉",
    to: "/profile",
    matches: (pathname) => pathname === "/profile" || pathname === "/auth",
  },
];

export default function MobileBottomNav() {
  const location = useLocation();

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile bottom navigation">
      <div className="mobile-bottom-nav__inner">
        {tabs.map((tab) => {
          const isActive = tab.matches(location.pathname);

          return (
            <NavLink
              key={tab.label}
              to={tab.to}
              className={`mobile-bottom-nav__item${isActive ? " is-active" : ""}`}
              aria-current={isActive ? "page" : undefined}
            >
              <span className="mobile-bottom-nav__icon" aria-hidden="true">
                {tab.icon}
              </span>
              <span className="mobile-bottom-nav__label">{tab.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
