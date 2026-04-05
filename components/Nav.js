import { useRouter } from "next/router";
import Link from "next/link";

const NAV_ITEMS = [
  { href: "/",             label: "Command",     icon: "▲" },
  { href: "/screener",     label: "Screener",    icon: "◈" },
  { href: "/trades",       label: "Trades",      icon: "⊞" },
  { href: "/portfolio",    label: "Portfolio",   icon: "◉" },
  { href: "/backtest",     label: "Backtest",    icon: "◎" },
  { href: "/methodology",  label: "Methodology", icon: "⊙" },
];

export default function Nav() {
  const router = useRouter();

  return (
    <div style={{
      background: "#070b11",
      borderBottom: "1px solid #0f1c28",
      padding: "0 24px",
      position: "sticky",
      top: 0,
      zIndex: 100,
    }}>
      <div style={{ maxWidth: 960, margin: "0 auto", display: "flex", alignItems: "stretch", justifyContent: "space-between" }}>

        {/* Logo */}
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10, padding: "14px 0" }}>
          <span style={{ fontFamily: "'Orbitron', monospace", fontWeight: 900, fontSize: 16, color: "#00ff88", letterSpacing: "0.08em" }}>
            SWINGDESK
          </span>
          <span style={{ fontSize: 9, color: "#1a3040", letterSpacing: "0.15em", display: "none" }}>PRIVATE</span>
        </Link>

        {/* Nav links */}
        <div style={{ display: "flex", gap: 0 }}>
          {NAV_ITEMS.map((item) => {
            const active = router.pathname === item.href;
            return (
              <Link key={item.href} href={item.href} style={{ textDecoration: "none" }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "0 18px", height: "100%", cursor: "pointer",
                  borderBottom: active ? "2px solid #00ff88" : "2px solid transparent",
                  transition: "all 0.15s",
                }}>
                  <span style={{ fontSize: 12, color: active ? "#00ff88" : "#2a4050" }}>{item.icon}</span>
                  <span style={{
                    fontFamily: "'Orbitron', monospace", fontWeight: 700,
                    fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase",
                    color: active ? "#00ff88" : "#2a4050",
                    transition: "color 0.15s",
                  }}>
                    {item.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Date */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <span style={{ fontSize: 10, color: "#1a3040", letterSpacing: "0.12em" }}>
            {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }).toUpperCase()}
          </span>
        </div>

      </div>
    </div>
  );
}
