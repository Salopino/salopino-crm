"use client";

import { useMemo, useState } from "react";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "crm", label: "CRM" },
  { id: "kanban", label: "Kanban" },
  { id: "quotes", label: "Tarjoukset" },
  { id: "finance", label: "Talous" },
  { id: "settings", label: "Asetukset" },
];

export default function Home() {
  const [activeView, setActiveView] = useState("dashboard");

  const pageTitle = useMemo(() => {
    return NAV_ITEMS.find((n) => n.id === activeView)?.label || "Dashboard";
  }, [activeView]);

  return (
    <main style={mainStyle}>
      <div style={containerStyle}>
        {/* SIDEBAR */}
        <aside style={sidebarStyle}>
          <div style={sidebarHeader}>Salopino CRM</div>

          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              style={{
                ...navButton,
                background:
                  activeView === item.id ? "#1f2937" : "transparent",
              }}
            >
              {item.label}
            </button>
          ))}
        </aside>

        {/* CONTENT */}
        <section style={contentStyle}>
          <h1 style={titleStyle}>{pageTitle}</h1>

          {activeView === "dashboard" && <Dashboard />}
          {activeView === "crm" && <CRM />}
          {activeView === "kanban" && <Kanban />}
          {activeView === "quotes" && <Quotes />}
          {activeView === "finance" && <Finance />}
          {activeView === "settings" && <Settings />}
        </section>
      </div>
    </main>
  );
}

/* ================= DASHBOARD ================= */

function Dashboard() {
  return (
    <>
      <div style={grid4}>
        <MetricCard title="Avoin pipeline" value="-" color="#f59e0b" />
        <MetricCard title="Voitettu" value="-" color="#22c55e" />
        <MetricCard title="Kassasaldo" value="-" color="#3b82f6" />
        <MetricCard title="Tulos" value="-" color="#14b8a6" />
      </div>

      <Panel title="Päivän tehtävät">
        <EmptyText text="Ei tehtäviä." />
      </Panel>
    </>
  );
}

/* ================= CRM ================= */

function CRM() {
  return (
    <>
      <Panel title="Lisää uusi asiakas">
        <PlaceholderForm />
      </Panel>

      <Panel title="Asiakastaulukko">
        <PlaceholderTable />
      </Panel>
    </>
  );
}

/* ================= KANBAN ================= */

function Kanban() {
  return (
    <Panel title="Myyntiputki">
      <div style={{ display: "flex", gap: 12 }}>
        {["liidi", "kartoitus", "tarjous", "voitettu"].map((s) => (
          <StatusColumn key={s} title={s} />
        ))}
      </div>
    </Panel>
  );
}

/* ================= QUOTES ================= */

function Quotes() {
  return (
    <>
      <Panel title="Uusi tarjous">
        <PlaceholderForm />
      </Panel>

      <Panel title="Tarjoukset">
        <PlaceholderTable />
      </Panel>
    </>
  );
}

/* ================= FINANCE ================= */

function Finance() {
  return (
    <>
      <div style={grid4}>
        <MetricCard title="Liikevaihto" value="-" color="#3b82f6" />
        <MetricCard title="Kassa" value="-" color="#22c55e" />
        <MetricCard title="Saamiset" value="-" color="#eab308" />
        <MetricCard title="Velat" value="-" color="#ef4444" />
      </div>

      <Panel title="Kassavirta">
        <EmptyText text="Ei dataa." />
      </Panel>
    </>
  );
}

/* ================= SETTINGS ================= */

function Settings() {
  return (
    <Panel title="Asetukset">
      <PlaceholderForm />
    </Panel>
  );
}

/* ================= COMPONENTS ================= */

function Panel({ title, children }) {
  return (
    <div style={panelStyle}>
      <h2 style={{ marginBottom: 12 }}>{title}</h2>
      {children}
    </div>
  );
}

function MetricCard({ title, value, color }) {
  return (
    <div style={{ ...metricStyle, border: `2px solid ${color}` }}>
      <div style={{ color: "#9ca3af" }}>{title}</div>
      <div style={{ fontSize: 28, fontWeight: "bold" }}>{value}</div>
    </div>
  );
}

function PlaceholderForm() {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} style={inputFake} />
      ))}
    </div>
  );
}

function PlaceholderTable() {
  return (
    <div style={{ display: "grid", gap: 8 }}>
      {[1, 2, 3].map((r) => (
        <div key={r} style={rowFake} />
      ))}
    </div>
  );
}

function StatusColumn({ title }) {
  return (
    <div style={kanbanCol}>
      <b>{title}</b>
      <EmptyText text="Ei kortteja" />
    </div>
  );
}

/* ✅ TÄMÄ PUUTTUI SINULTA → nyt mukana */
function EmptyText({ text }) {
  return (
    <div style={{ color: "#94a3b8", fontSize: 14 }}>{text}</div>
  );
}

/* ================= STYLES ================= */

const mainStyle = {
  background: "#0b0b10",
  minHeight: "100vh",
  color: "white",
};

const containerStyle = {
  display: "flex",
};

const sidebarStyle = {
  width: 220,
  padding: 20,
  borderRight: "1px solid #222",
};

const sidebarHeader = {
  fontSize: 22,
  fontWeight: "bold",
  marginBottom: 20,
};

const navButton = {
  display: "block",
  width: "100%",
  padding: 10,
  marginBottom: 8,
  color: "white",
  border: "none",
  textAlign: "left",
  cursor: "pointer",
};

const contentStyle = {
  flex: 1,
  padding: 30,
};

const titleStyle = {
  fontSize: 40,
  marginBottom: 20,
};

const panelStyle = {
  background: "#111522",
  padding: 20,
  borderRadius: 12,
  marginBottom: 20,
};

const metricStyle = {
  padding: 16,
  borderRadius: 12,
  background: "#111522",
};

const grid4 = {
  display: "grid",
  gridTemplateColumns: "repeat(4,1fr)",
  gap: 12,
  marginBottom: 20,
};

const inputFake = {
  height: 40,
  background: "#fff",
  borderRadius: 6,
};

const rowFake = {
  height: 40,
  background: "#1f2937",
  borderRadius: 6,
};

const kanbanCol = {
  flex: 1,
  background: "#111522",
  padding: 12,
  borderRadius: 10,
};
