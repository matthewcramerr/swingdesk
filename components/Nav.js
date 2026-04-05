import { useRouter } from "next/router";
import Link from "next/link";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/",          label: "Command",   icon: "▲" },
  { href: "/screener",  label: "Screener",  icon: "◈" },
  { href: "/trades",    label: "Trades",    icon: "⊞" },
  { href: "/portfolio", label: "Portfolio", icon: "◉" },
  { href: "/backtest",  label: "Backtest",  icon: "◎" },
];

export default function Nav() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <style>{`
        .nav-root {
          background: #070b11;
          border-bottom: 1px solid #0f1c28;
          padding: 0 20px;
          position: sticky;
          top: 0;
          z-index: 200;
        }
        .nav-inner {
          max-width: 960px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 52px;
        }
        .nav-logo {
          font-family: 'Orbitron', monospace;
          font-weight: 900;
          font-size: 15px;
          color: #00ff88;
          letter-spacing: 0.08em;
          text-decoration: none;
          flex-shrink: 0;
        }
        .nav-links {
          display: flex;
          align-items: stretch;
          height: 52px;
        }
        .nav-link {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 0 14px;
          text-decoration: none;
          border-bottom: 2px solid transparent;
          transition: all 0.15s;
          white-space: nowrap;
        }
        .nav-link.active { border-bottom-color: #00ff88; }
        .nav-link-icon { font-size: 11px; }
        .nav-link-label {
          font-family: 'Orbitron', monospace;
          font-weight: 700;
          font-size: 9px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }
        .nav-date {
          font-size: 9px;
          color: #1a3040;
          letter-spacing: 0.12em;
          flex-shrink: 0;
        }
        .hamburger {
          display: none;
          flex-direction: column;
          gap: 5px;
          cursor: pointer;
          padding: 8px;
          background: none;
          border: none;
        }
        .hamburger-line {
          width: 22px;
          height: 2px;
          background: #2a4050;
          transition: background 0.15s;
        }
        .hamburger:hover .hamburger-line { background: #00ff88; }
        .mobile-menu {
          display: none;
          position: fixed;
          top: 52px;
          left: 0;
          right: 0;
          bottom: 0;
          background: #070b11;
          z-index: 199;
          flex-direction: column;
          padding: 12px 0;
          border-top: 1px solid #0f1c28;
        }
        .mobile-menu.open { display: flex; }
        .mobile-link {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px 24px;
          text-decoration: none;
          border-left: 3px solid transparent;
          transition: all 0.15s;
        }
        .mobile-link.active { border-left-color: #00ff88; background: #0a1520; }
        .mobile-link:active { background: #0a1520; }
        .mobile-link-icon { font-size: 14px; }
        .mobile-link-label {
          font-family: 'Orbitron', monospace;
          font-weight: 700;
          font-size: 12px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }
        @media (max-width: 640px) {
          .nav-links { display: none; }
          .nav-date { display: none; }
          .hamburger { display: flex; }
        }
      `}</style>

      <div className="nav-root">
        <div className="nav-inner">
          <Link href="/" className="nav-logo" onClick={() => setOpen(false)}>
            SWINGDESK
          </Link>

          {/* Desktop nav */}
          <div className="nav-links">
            {NAV_ITEMS.map(item => {
              const active = router.pathname === item.href;
              return (
                <Link key={item.href} href={item.href} className={`nav-link ${active ? "active" : ""}`}>
                  <span className="nav-link-icon" style={{ color: active ? "#00ff88" : "#2a4050" }}>{item.icon}</span>
                  <span className="nav-link-label" style={{ color: active ? "#00ff88" : "#2a4050" }}>{item.label}</span>
                </Link>
              );
            })}
          </div>

          <span className="nav-date">
            {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }).toUpperCase()}
          </span>

          {/* Hamburger */}
          <button className="hamburger" onClick={() => setOpen(!open)} aria-label="Menu">
            <div className="hamburger-line" style={{ background: open ? "#00ff88" : undefined }} />
            <div className="hamburger-line" style={{ background: open ? "#00ff88" : undefined }} />
            <div className="hamburger-line" style={{ background: open ? "#00ff88" : undefined }} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`mobile-menu ${open ? "open" : ""}`}>
        {NAV_ITEMS.map(item => {
          const active = router.pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`mobile-link ${active ? "active" : ""}`}
              onClick={() => setOpen(false)}
            >
              <span className="mobile-link-icon" style={{ color: active ? "#00ff88" : "#2a4050" }}>{item.icon}</span>
              <span className="mobile-link-label" style={{ color: active ? "#00ff88" : "#3a5568" }}>{item.label}</span>
            </Link>
          );
        })}
        <div style={{ marginTop: "auto", padding: "20px 24px", borderTop: "1px solid #0a1520" }}>
          <div style={{ fontSize: 9, color: "#1a2535", letterSpacing: "0.15em" }}>
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }).toUpperCase()}
          </div>
        </div>
      </div>
    </>
  );
}
