import { useState } from "react";
import axios from "axios";

const USERS = [
  { username: "marko.manager", password: "manager123", label: "Marko (Manager, Finance)" },
  { username: "jana.user", password: "user123", label: "Jana (User, HR)" },
  { username: "ana.admin", password: "admin123", label: "Ana (Admin, IT)" },
  { username: "petar.suspended", password: "user123", label: "Petar (Suspended, IT)" },
];

const RESOURCES = [
  { id: "r1", label: "r1 — Finansijski izvještaj (Finance, High)" },
  { id: "r2", label: "r2 — HR dokumentacija (HR, Medium)" },
  { id: "r3", label: "r3 — IT infrastruktura (IT, Medium)" },
  { id: "r4", label: "r4 — Javni pravilnik (IT, Low)" },
];

const IP_OPTIONS = [
  { value: "127.0.0.1", label: "127.0.0.1 (Korporativna mreža)" },
  { value: "203.0.113.1", label: "203.0.113.1 (Externa mreža)" },
];

const colors = {
  purple: "#9B59B6",
  purpleDark: "#7B3FA0",
  purpleLight: "#FBF6FE",
  purpleBorder: "#DCC8E8",
  gradient: "linear-gradient(135deg, #9B59B6, #C0709A)",
  permitBg: "#F4FAF0",
  permitBorder: "#A8D5A2",
  permitText: "#2E6B38",
  denyBg: "#FDF0F5",
  denyBorder: "#E8A8C0",
  denyText: "#8B2040",
  pillBg: "rgba(155,89,182,0.08)",
};

function Pill({ label, value }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: colors.pillBg, border: `0.5px solid ${colors.purpleBorder}`,
      borderRadius: 20, padding: "4px 12px", fontSize: 13,
      color: colors.purpleDark, margin: "3px 4px 3px 0",
    }}>
      <span style={{ color: "#888" }}>{label}:</span>
      <strong>{value}</strong>
    </span>
  );
}

export default function App() {
  const [selectedUser, setSelectedUser] = useState(USERS[0]);
  const [selectedResource, setSelectedResource] = useState(RESOURCES[0]);
  const [selectedIp, setSelectedIp] = useState(IP_OPTIONS[0]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  async function testAccess() {
    setLoading(true);
    setResult(null);
    try {
      const loginRes = await axios.post("http://localhost:3000/auth/login", {
        username: selectedUser.username,
        password: selectedUser.password,
      });

      const token = loginRes.data.token;
      const user = loginRes.data.user;

      try {
        const resourceRes = await axios.get(
          `http://localhost:3000/resources/${selectedResource.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "x-forwarded-for": selectedIp.value,
            },
          }
        );
        const newResult = {
          decision: "permit",
          user,
          resource: resourceRes.data.resource,
          ip: selectedIp.value,
        };
        setResult(newResult);
        setHistory(prev => [{ ...newResult, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 5));
      } catch (err) {
        const newResult = {
          decision: "deny",
          user,
          reason: err.response?.data?.reason,
          context: err.response?.data?.context,
          ip: selectedIp.value,
        };
        setResult(newResult);
        setHistory(prev => [{ ...newResult, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 5));
      }
    } catch (err) {
      const newResult = {
        decision: "error",
        reason: err.response?.data?.reason || 
                err.response?.data?.message || 
                "Greška pri prijavi.",
      };
      setResult(newResult);
    }
    setLoading(false);
  }

  const selectStyle = {
    width: "100%", padding: "9px 12px", borderRadius: 8,
    border: `1px solid ${colors.purpleBorder}`, fontSize: 14,
    background: colors.purpleLight, color: "#222",
    appearance: "none", cursor: "pointer",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%239B59B6' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center",
  };

  const labelStyle = {
    display: "block", fontWeight: 500, fontSize: 13,
    color: colors.purple, marginBottom: 6,
  };

  return (
    <div style={{ fontFamily: "Arial, sans-serif", maxWidth: 740, margin: "40px auto", padding: "0 20px" }}>

      {/* HEADER */}
      <div style={{ borderBottom: `1.5px solid ${colors.purpleBorder}`, paddingBottom: 16, marginBottom: 24 }}>
        <h1 style={{ color: colors.purpleDark, margin: 0, fontSize: 24, fontWeight: 600 }}>
          🔐 ABAC sistem
        </h1>
        <p style={{ color: "#888", margin: "5px 0 0", fontSize: 14 }}>
          Testiranje kontrole pristupa zasnovane na atributima
        </p>
      </div>

      {/* FORMA */}
      <div style={{ background: colors.purpleLight, padding: 24, borderRadius: 12, marginBottom: 20, border: `0.5px solid ${colors.purpleBorder}` }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div>
            <label style={labelStyle}>👤 Korisnik</label>
            <select style={selectStyle} onChange={e => setSelectedUser(USERS[e.target.value])}>
              {USERS.map((u, i) => <option key={u.username} value={i}>{u.label}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>📄 Resurs</label>
            <select style={selectStyle} onChange={e => setSelectedResource(RESOURCES[e.target.value])}>
              {RESOURCES.map((r, i) => <option key={r.id} value={i}>{r.label}</option>)}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>🌐 IP adresa (tip mreže)</label>
          <select style={selectStyle} onChange={e => setSelectedIp(IP_OPTIONS[e.target.value])}>
            {IP_OPTIONS.map((ip, i) => <option key={ip.value} value={i}>{ip.label}</option>)}
          </select>
        </div>

        <button
          onClick={testAccess}
          disabled={loading}
          style={{
            width: "100%", padding: 13,
            background: loading ? "#ccc" : colors.gradient,
            color: "white", border: "none", borderRadius: 8,
            fontSize: 15, fontWeight: 500, cursor: loading ? "not-allowed" : "pointer",
            letterSpacing: "0.2px",
          }}
        >
          {loading ? "⏳ Provjerava se..." : "🔍 Testiraj pristup"}
        </button>
      </div>

      {/* REZULTAT */}
      {result && (
        <div style={{
          padding: 24, borderRadius: 12, marginBottom: 20,
          background: result.decision === "permit" ? colors.permitBg : colors.denyBg,
          border: `1px solid ${result.decision === "permit" ? colors.permitBorder : colors.denyBorder}`,
        }}>
          <h2 style={{
            color: result.decision === "permit" ? colors.permitText : colors.denyText,
            marginTop: 0, marginBottom: 14, fontSize: 17, fontWeight: 500,
          }}>
            {result.decision === "permit" ? "✅ Pristup odobren" : "❌ Pristup odbijen"}
          </h2>

          {result.user && (
            <div style={{ marginBottom: 10 }}>
              <Pill label="Korisnik" value={result.user.username} />
              <Pill label="Uloga" value={result.user.role} />
              <Pill label="Odjeljenje" value={result.user.department} />
              <Pill label="Status" value={result.user.status} />
            </div>
          )}

          {result.decision === "permit" && result.resource && (
            <div>
              <Pill label="Resurs" value={result.resource.name} />
              <Pill label="Tip" value={result.resource.type} />
              <Pill label="Povjerljivost" value={result.resource.confidentiality} />
            </div>
          )}

          {result.decision === "deny" && (
            <div>
              <div style={{
                background: "rgba(176,48,96,0.07)", borderLeft: `3px solid #C0709A`,
                borderRadius: "0 8px 8px 0", padding: "10px 14px",
                fontSize: 14, marginBottom: 10,
              }}>
                <strong>Razlog:</strong> {result.reason}
              </div>
              {result.context && (
                <div>
                  <Pill label="Vrijeme" value={result.context.time_of_day} />
                  <Pill label="Dan" value={result.context.day_of_week} />
                  <Pill label="Mreža" value={result.context.ip_network} />
                </div>
              )}
            </div>
          )}

          {result.decision === "error" && (
            <div style={{ fontSize: 14 }}><strong>Greška:</strong> {result.reason}</div>
          )}
        </div>
      )}

      {/* ISTORIJA */}
      {history.length > 0 && (
        <div style={{ background: colors.purpleLight, padding: 20, borderRadius: 12, border: `0.5px solid ${colors.purpleBorder}` }}>
          <h3 style={{ color: colors.purpleDark, marginTop: 0, marginBottom: 14, fontSize: 15, fontWeight: 500 }}>
            📋 Istorija testova
          </h3>
          {history.map((h, i) => (
            <div key={i} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "8px 14px", marginBottom: 6, borderRadius: 8, fontSize: 13,
              background: h.decision === "permit" ? colors.permitBg : colors.denyBg,
              border: `0.5px solid ${h.decision === "permit" ? colors.permitBorder : colors.denyBorder}`,
            }}>
              <span style={{ color: "#999" }}>{h.time}</span>
              <span style={{ fontWeight: 500 }}>{h.user?.username}</span>
              <span style={{ color: "#999" }}>{h.ip}</span>
              <span style={{
                fontSize: 12, fontWeight: 500, padding: "2px 10px", borderRadius: 12,
                background: h.decision === "permit" ? "#D4EDD0" : "#F5D0E0",
                color: h.decision === "permit" ? colors.permitText : colors.denyText,
              }}>
                {h.decision === "permit" ? "PERMIT" : "DENY"}
              </span>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}