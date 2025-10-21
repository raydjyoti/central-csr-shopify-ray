import CentralLogoWhite from "../assets/images/central-logo.svg";

export default function CentralLoader({ label = "Loading" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, gap: 12, flexDirection: "column" }}>
      <img src={CentralLogoWhite} alt={label} className="animate-spin" style={{ width: 24, height: 24 }} />
      <span className="text-gray-500 text-sm">{label}…</span>
    </div>
  );
}


