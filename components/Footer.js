import Link from "next/link";

export default function Footer() {
  return (
    <div style={{
      marginTop: 60,
      paddingTop: 20,
      paddingBottom: 32,
      borderTop: "1px solid #0a1520",
      textAlign: "center",
    }}>
      <div style={{ marginBottom: 12, display: "flex", justifyContent: "center", gap: 24, flexWrap: "wrap" }}>
        <Link href="/methodology" style={{ textDecoration: "none" }}>
          <span style={{
            fontSize: 10, color: "#2a4050", letterSpacing: "0.15em",
            textTransform: "uppercase", cursor: "pointer",
            transition: "color 0.15s",
          }}
            onMouseEnter={e => e.target.style.color = "#00ff88"}
            onMouseLeave={e => e.target.style.color = "#2a4050"}
          >
            ⊙ Our Methodology
          </span>
        </Link>
        <span style={{ fontSize: 10, color: "#0d1820", letterSpacing: "0.1em" }}>·</span>
        <span style={{ fontSize: 10, color: "#0d1820", letterSpacing: "0.12em" }}>
          For Educational Purposes Only
        </span>
        <span style={{ fontSize: 10, color: "#0d1820", letterSpacing: "0.1em" }}>·</span>
        <span style={{ fontSize: 10, color: "#0d1820", letterSpacing: "0.12em" }}>
          Not Financial Advice
        </span>
        <span style={{ fontSize: 10, color: "#0d1820", letterSpacing: "0.1em" }}>·</span>
        <span style={{ fontSize: 10, color: "#0d1820", letterSpacing: "0.12em" }}>
          All Trades Carry Risk
        </span>
      </div>
      <div style={{ fontSize: 9, color: "#0a1520", letterSpacing: "0.15em" }}>
        SWINGDESK · BUILTBLANK.COM
      </div>
    </div>
  );
}
