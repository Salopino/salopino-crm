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
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(120,52,180,0.18), transparent 30%), radial-gradient(circle at top right, rgba(212,175,55,0.10), transparent 25%), #090b14",
        color: "#f8fafc",
        fontFamily: "Inter, Arial, sans-serif",
      }}
    >
      <div style={{ maxWidth: 1680, margin: "0 auto", padding: 24 }}>
        <header
          style={{
            display: "grid",
            gridTemplateColumns: "280px 1fr",
            gap: 18,
            alignItems: "stretch",
          }}
        >
          <aside
            style={{
              background: "rgba(17,21,34,0.96)",
              border: "1px solid rgba(231,223,178,0.12)",
              borderRadius: 24,
              padding: 20,
              boxShadow: "0 16px 50px rgba(0,0,0,0.24)",
            }}
          >
            <div
              style={{
                fontSize: 13,
                color: "#e7dfb2",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              Salopino Control
            </div>

            <div style={{ fontSize: 34, fontWeight: 800, marginBottom: 18 }}>
              CRM / Talous
            </div>

            <div style={{ color: "#94a3b8", fontSize: 14, marginBottom: 22, lineHeight: 1.5 }}>
              Myynti, tarjoukset, kirjanpito ja kassavirta samassa ohjauspaneelissa.
            </div>

            <nav style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  style={{
                    textAlign: "left",
                    padding: "12px 14px",
                    borderRadius: 14,
                    border: activeView === item.id ? "1px solid #e7dfb2" : "1px solid #263247",
                    background: activeView === item.id ? "#1a2336" : "#111827",
                    color: "#f8fafc",
                    cursor: "pointer",
                    fontWeight: activeView === item.id ? 700 : 500,
                  }}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </aside>

          <section
            style={{
              background: "linear-gradient(135deg, rgba(17,21,34,0.96), rgba(9,11,20,0.96))",
              border: "1px solid rgba(231,223,178,0.14)",
              borderRadius: 24,
              padding: 26,
              boxShadow: "0 18px 50px rgba(0,0,0,0.28)",
            }}
          >
            <div
              style={{
                fontSize: 13,
                color: "#e7dfb2",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              Premium UI v5
            </div>

            <h1 style={{ fontSize: 48, lineHeight: 1.04, margin: 0 }}>{pageTitle}</h1>

            <div style={{ marginTop: 10, color: "#94a3b8", fontSize: 16, maxWidth: 920 }}>
              Tämä runko erottaa dashboardin, CRM:n, Kanbanin, tarjoukset ja talouden omiksi näkymikseen.
              Seuraavaksi jokainen osio kytketään dataan vaiheittain.
            </div>
          </section>
        </header>

        <div style={{ marginTop: 22 }}>
          {activeView === "dashboard" && <DashboardView />}
          {activeView === "crm" && <CRMView />}
          {activeView === "kanban" && <KanbanView />}
          {activeView === "quotes" && <QuotesView />}
          {activeView === "finance" && <FinanceView />}
          {activeView === "settings" && <SettingsView />}
        </div>
      </div>
    </main>
  );
}

function DashboardView() {
  return (
    <div style={{ display: "grid", gap: 18 }}>
      <SectionTitle
        title="Johtamisen mittarit"
        description="Tähän tulee myynnin, kassavirran ja talouden tärkeimmät tunnusluvut."
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(220px, 1fr))", gap: 16 }}>
        <MetricCard title="Avoin pipeline" value="-" color="#f59e0b" />
        <MetricCard title="Weighted pipeline" value="-" color="#8b5cf6" />
        <MetricCard title="Voitettu" value="-" color="#22c55e" />
        <MetricCard title="Kassasaldo" value="-" color="#14b8a6" />
        <MetricCard title="30 pv kassavirta" value="-" color="#3b82f6" />
        <MetricCard title="60 pv kassavirta" value="-" color="#38bdf8" />
        <MetricCard title="90 pv kassavirta" value="-" color="#eab308" />
        <MetricCard title="Erääntyneet tehtävät" value="-" color="#ef4444" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 18 }}>
        <Panel title="Toimenpiteet tänään">
          <PanelHint text="Tähän tulevat follow-upit ja tehtävät, jotka ovat tänään tai jo myöhässä." />
          <EmptyText text="Ei sisältöä vielä." />
        </Panel>

        <Panel title="Talousstatus">
          <PanelHint text="Tähän tulee viimeisin raporttikuukausi, tulos, kassa ja oma pääoma." />
          <EmptyText text="Ei sisältöä vielä." />
        </Panel>
      </div>
    </div>
  );
}

function CRMView() {
  return (
    <div style={{ display: "grid", gap: 18 }}>
      <SectionTitle
        title="CRM"
        description="Asiakkaat, yhteyshenkilöt, tehtävät ja linkit yhteen paikkaan."
      />

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 18 }}>
        <Panel title="Uusi asiakas / case">
          <PanelHint text="Tähän tulee asiakkaan, yrityksen, statuksen, arvon, todennäköisyyden ja linkkien syöttö." />
          <PlaceholderForm lines={8} />
        </Panel>

        <Panel title="Uusi tehtävä">
          <PanelHint text="Tähän tulee tehtävä asiakkaalle: deadline, prioriteetti, tyyppi ja muistiinpano." />
          <PlaceholderForm lines={5} />
        </Panel>
      </div>

      <Panel title="Asiakastaulukko">
        <PanelHint text="Tähän tulee täydellinen CRM-taulukko: asiakas, yritys, status, arvo, seuraava toimenpide, LinkedIn, tarjouslinkki." />
        <PlaceholderTable columns={10} rows={4} />
      </Panel>
    </div>
  );
}

function KanbanView() {
  return (
    <div style={{ display: "grid", gap: 18 }}>
      <SectionTitle
        title="Kanban"
        description="Vaihejohtamisen näkymä. Täällä liikutetaan caseja liidistä voitettuun tai hävittyyn."
      />

      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 18 }}>
        <Panel title="Myyntiputki">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(220px, 1fr))", gap: 14 }}>
            {["liidi", "kartoitus", "tarjous", "seuranta", "voitettu", "hävitty"].map((status) => (
              <StatusColumn key={status} title={status} />
            ))}
          </div>
        </Panel>

        <Panel title="Kanbanin rinnalla">
          <PanelHint text="Tähän voidaan tuoda esimerkiksi kuumat liidit, avoimet tarjoukset tai laskuttamattomat voitetut työt." />
          <EmptyText text="Ei sisältöä vielä." />
        </Panel>
      </div>
    </div>
  );
}

function QuotesView() {
  return (
    <div style={{ display: "grid", gap: 18 }}>
      <SectionTitle
        title="Tarjoukset"
        description="Tarjouspohja kytketään CRM:ään niin, että asiakas, yhteyshenkilö ja tarjousstatus elävät yhdessä."
      />

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 18 }}>
        <Panel title="Uusi tarjous">
          <PanelHint text="Tähän tulee tarjouslomake: asiakas, yhteyshenkilö, otsikko, päivät, ALV, maksuehto ja rivit." />
          <PlaceholderForm lines={8} />
        </Panel>

        <Panel title="Tarjousrivit / hinnasto">
          <PanelHint text="Tähän tulee rivit pricing_templates-taulusta sekä käsin lisättävät tarjousrivit." />
          <PlaceholderForm lines={6} />
        </Panel>
      </div>

      <Panel title="Tarjousarkisto">
        <PanelHint text="Tähän tulee kaikki tarjoukset: numero, asiakas, status, summa, voimassaolo ja PDF-linkki." />
        <PlaceholderTable columns={8} rows={4} />
      </Panel>
    </div>
  );
}

function FinanceView() {
  return (
    <div style={{ display: "grid", gap: 18 }}>
      <SectionTitle
        title="Talous"
        description="Kirjanpidon kuukausiraportit, kassavirta, saamiset, velat ja importit samassa näkymässä."
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(220px, 1fr))", gap: 16 }}>
        <MetricCard title="Liikevaihto" value="-" color="#3b82f6" />
        <MetricCard title="Tulos" value="-" color="#14b8a6" />
        <MetricCard title="Kassasaldo" value="-" color="#22c55e" />
        <MetricCard title="Oma pääoma" value="-" color="#eab308" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <Panel title="Talousimport">
          <PanelHint text="Tähän tulee CSV/XLSX/PDF-import. Raportit saapuvat usein vasta seuraavan kuun noin 20. päivä, joten näkymä toimii viiveellisellä datalla." />
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <ActionButton label="Valitse tiedosto" />
            <ActionButton label="Esikatsele" />
            <ActionButton label="Tuo kirjanpitoon" />
            <ActionButton label="Päivitä kassavirta" />
          </div>
        </Panel>

        <Panel title="Kassavirta">
          <PanelHint text="Tähän tulee forecast / invoiced / paid -logiikka cashflow_events-taulusta." />
          <PlaceholderTable columns={5} rows={5} />
        </Panel>
      </div>

      <Panel title="Kuukausiraportit">
        <PanelHint text="Tähän tulee finance_monthly-taulun data: liikevaihto, tulos, kassa, saamiset, velat, oma pääoma." />
        <PlaceholderTable columns={7} rows={5} />
      </Panel>
    </div>
  );
}

function SettingsView() {
  return (
    <div style={{ display: "grid", gap: 18 }}>
      <SectionTitle
        title="Asetukset"
        description="Yritystiedot, tarjousnumerointi, maksuehdot, ALV, hinnastopohjat ja muut oletukset."
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <Panel title="Yritystiedot">
          <PlaceholderForm lines={6} />
        </Panel>

        <Panel title="Tarjous- ja laskutusasetukset">
          <PlaceholderForm lines={6} />
        </Panel>
      </div>

      <Panel title="Hinnastopohjat">
        <PanelHint text="Tähän tulee pricing_templates-taulu: palvelu, yksikkö, oletushinta, ALV ja kuvaus." />
        <PlaceholderTable columns={5} rows={5} />
      </Panel>
    </div>
  );
}

function SectionTitle({ title, description }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ fontSize: 30, fontWeight: 800, marginBottom: 6 }}>{title}</div>
      <div style={{ color: "#94a3b8", fontSize: 15 }}>{description}</div>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <section
      style={{
        background: "rgba(17, 21, 34, 0.96)",
        border: "1px solid rgba(231,223,178,0.10)",
        borderRadius: 22,
        padding: 22,
        boxShadow: "0 16px 50px rgba(0,0,0,0.24)",
      }}
    >
      <h2 style={{ marginTop: 0, marginBottom: 18, fontSize: 24 }}>{title}</h2>
      {children}
    </section>
  );
}

function PanelHint({ text }) {
  return (
    <div
      style={{
        color: "#94a3b8",
        fontSize: 13,
        marginBottom: 16,
        padding: "10px 12px",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid #243047",
        borderRadius: 12,
      }}
    >
      {text}
    </div>
  );
}

function MetricCard({ title, value, color }) {
  return (
    <div
      style={{
        background: "linear-gradient(180deg, rgba(17,21,34,0.98), rgba(11,15,25,0.98))",
        border: `2px solid ${color}`,
        borderRadius: 18,
        padding: 22,
        minHeight: 128,
        boxShadow: "0 14px 30px rgba(0,0,0,0.25)",
      }}
    >
      <div style={{ fontSize: 15, color: "#94a3b8", marginBottom: 14 }}>{title}</div>
      <div style={{ fontSize: 36, fontWeight: 800 }}>{value}</div>
    </div>
  );
}

function ActionButton({ label }) {
  return (
    <button
      style={{
        padding: "12px 18px",
        fontSize: 15,
        fontWeight: 700,
        cursor: "pointer",
        background: "#0f766e",
        color: "white",
        border: "none",
        borderRadius: 12,
      }}
    >
      {label}
    </button>
  );
}

function PlaceholderForm({ lines = 5 }) {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          style={{
            height: 46,
            borderRadius: 12,
            background: "#f8fafc",
            opacity: 0.9,
          }}
        />
      ))}
    </div>
  );
}

function PlaceholderTable({ columns = 5, rows = 4 }) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 8 }}>
        {Array.from({ length: columns }).map((_, i) => (
          <div
            key={i}
            style={{
              height: 18,
              borderRadius: 8,
              background: "#22304a",
            }}
          />
        ))}
      </div>

      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 8 }}>
          {Array.from({ length: columns }).map((_, c) => (
            <div
              key={c}
              style={{
                height: 42,
                borderRadius: 10,
                background: "#0b0f19",
                border: "1px solid #22304a",
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function StatusColumn({ title }) {
  return (
    <div
      style={{
        background: "#0d1320",
        border: "1px solid #243047",
        borderRadius: 16,
        padding: 14,
        minHeight: 220,
      }}
    >
      <div style={{ fontSize: 20, fontWeight: 800, textTransform: "capitalize", marginBottom: 10 }}>
        {title}
      </div>

      <div
        style={{
          background: "#0b0f19",
          border: "1px dashed #374151",
          borderRadius: 12,
          padding: 12,
          color: "#6b7280",
          fontSize: 14,
        }}
      >
        Kortit tulevat tähän
      </div>
    </div>
  );
}
