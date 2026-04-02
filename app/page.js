"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

/*
  OLETUKSET TÄSTÄ ENSIMMÄISESTÄ VERSIOSTA

  Tämä tiedosto olettaa, että:
  - käytössä on App Router
  - ympäristömuuttujat ovat:
      NEXT_PUBLIC_SUPABASE_URL
      NEXT_PUBLIC_SUPABASE_ANON_KEY

  - clients-taulussa on ainakin nämä sarakkeet:
      id
      name
      status
      email
      phone
      notes
      created_at
      updated_at

    ja mahdollisesti myös:
      company_name
      city
      business_id

  - tasks-taulussa voi olla esimerkiksi:
      id
      title
      status
      completed
      due_date

  - finance_monthly-taulussa voi olla esimerkiksi:
      id
      month
      revenue
      expenses
      profit
      target

  - cashflow_events-taulussa voi olla esimerkiksi:
      id
      event_date
      amount
      type
      description

  Jos jokin sarakenimi poikkeaa, vaihda vastaava kohta tästä tiedostosta.
*/

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const STATUS_OPTIONS = [
  "Liidi",
  "Kontaktoitu",
  "Tarjous",
  "Neuvottelu",
  "Voitettu",
  "Hävitty",
];

const KANBAN_COLUMNS = STATUS_OPTIONS;

const emptyClientForm = {
  id: null,
  name: "",
  company_name: "",
  email: "",
  phone: "",
  city: "",
  business_id: "",
  status: "Liidi",
  notes: "",
};

function euro(value) {
  const num = Number(value || 0);
  return new Intl.NumberFormat("fi-FI", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(num);
}

function formatDate(value) {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleDateString("fi-FI");
  } catch {
    return value;
  }
}

function normalizeStatus(status) {
  if (!status) return "Liidi";
  const found = STATUS_OPTIONS.find(
    (s) => s.toLowerCase() === String(status).toLowerCase()
  );
  return found || status;
}

function Card({ title, value, subvalue, accent = false }) {
  return (
    <div
      style={{
        background: accent
          ? "linear-gradient(135deg, rgba(82,49,122,0.95), rgba(28,18,49,0.98))"
          : "rgba(18,18,28,0.92)",
        border: "1px solid rgba(231,223,178,0.12)",
        borderRadius: 22,
        padding: 20,
        boxShadow: accent
          ? "0 12px 40px rgba(111, 73, 170, 0.28)"
          : "0 10px 30px rgba(0,0,0,0.28)",
      }}
    >
      <div
        style={{
          fontSize: 13,
          letterSpacing: 0.4,
          color: "rgba(244,241,233,0.72)",
          marginBottom: 10,
          textTransform: "uppercase",
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: 30,
          fontWeight: 800,
          color: "#f4f1e9",
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      <div
        style={{
          marginTop: 10,
          fontSize: 13,
          color: "rgba(244,241,233,0.66)",
        }}
      >
        {subvalue}
      </div>
    </div>
  );
}

function SectionTitle({ eyebrow, title, right }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "end",
        gap: 16,
        marginBottom: 18,
        flexWrap: "wrap",
      }}
    >
      <div>
        <div
          style={{
            fontSize: 12,
            letterSpacing: 0.8,
            textTransform: "uppercase",
            color: "#d9c98a",
            marginBottom: 6,
          }}
        >
          {eyebrow}
        </div>
        <h2
          style={{
            margin: 0,
            fontSize: 28,
            lineHeight: 1.1,
            color: "#f4f1e9",
          }}
        >
          {title}
        </h2>
      </div>
      {right ? <div>{right}</div> : null}
    </div>
  );
}

function Input({ label, ...props }) {
  return (
    <label style={{ display: "block" }}>
      <div
        style={{
          marginBottom: 8,
          fontSize: 13,
          color: "rgba(244,241,233,0.78)",
          fontWeight: 600,
        }}
      >
        {label}
      </div>
      <input
        {...props}
        style={{
          width: "100%",
          background: "rgba(11,11,18,0.92)",
          color: "#f4f1e9",
          border: "1px solid rgba(231,223,178,0.14)",
          borderRadius: 14,
          padding: "12px 14px",
          outline: "none",
          fontSize: 14,
          ...props.style,
        }}
      />
    </label>
  );
}

function Select({ label, children, ...props }) {
  return (
    <label style={{ display: "block" }}>
      <div
        style={{
          marginBottom: 8,
          fontSize: 13,
          color: "rgba(244,241,233,0.78)",
          fontWeight: 600,
        }}
      >
        {label}
      </div>
      <select
        {...props}
        style={{
          width: "100%",
          background: "rgba(11,11,18,0.92)",
          color: "#f4f1e9",
          border: "1px solid rgba(231,223,178,0.14)",
          borderRadius: 14,
          padding: "12px 14px",
          outline: "none",
          fontSize: 14,
          ...props.style,
        }}
      >
        {children}
      </select>
    </label>
  );
}

function TextArea({ label, ...props }) {
  return (
    <label style={{ display: "block" }}>
      <div
        style={{
          marginBottom: 8,
          fontSize: 13,
          color: "rgba(244,241,233,0.78)",
          fontWeight: 600,
        }}
      >
        {label}
      </div>
      <textarea
        {...props}
        style={{
          width: "100%",
          minHeight: 120,
          resize: "vertical",
          background: "rgba(11,11,18,0.92)",
          color: "#f4f1e9",
          border: "1px solid rgba(231,223,178,0.14)",
          borderRadius: 14,
          padding: "12px 14px",
          outline: "none",
          fontSize: 14,
          ...props.style,
        }}
      />
    </label>
  );
}

function Button({
  children,
  variant = "primary",
  disabled = false,
  ...props
}) {
  const styles =
    variant === "ghost"
      ? {
          background: "transparent",
          color: "#f4f1e9",
          border: "1px solid rgba(231,223,178,0.14)",
        }
      : variant === "danger"
      ? {
          background: "rgba(120,31,49,0.20)",
          color: "#ffd7df",
          border: "1px solid rgba(255,93,129,0.22)",
        }
      : {
          background:
            "linear-gradient(135deg, rgba(217,201,138,1), rgba(162,126,56,1))",
          color: "#17120d",
          border: "1px solid rgba(231,223,178,0.18)",
        };

  return (
    <button
      disabled={disabled}
      {...props}
      style={{
        padding: "12px 16px",
        borderRadius: 14,
        fontWeight: 700,
        fontSize: 14,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
        transition: "0.2s ease",
        ...styles,
        ...props.style,
      }}
    >
      {children}
    </button>
  );
}

export default function Page() {
  const [activeView, setActiveView] = useState("dashboard");

  const [clients, setClients] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [financeMonthly, setFinanceMonthly] = useState([]);
  const [cashflowEvents, setCashflowEvents] = useState([]);

  const [loading, setLoading] = useState(true);
  const [savingClient, setSavingClient] = useState(false);
  const [deletingClientId, setDeletingClientId] = useState(null);
  const [updatingKanbanId, setUpdatingKanbanId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [clientForm, setClientForm] = useState(emptyClientForm);

  const [crmSearch, setCrmSearch] = useState("");
  const [crmStatusFilter, setCrmStatusFilter] = useState("Kaikki");

  async function loadAllData() {
    setLoading(true);
    setError("");

    try {
      const [clientsRes, tasksRes, financeRes, cashflowRes] = await Promise.all([
        supabase
          .from("clients")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("tasks")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("finance_monthly")
          .select("*")
          .order("month", { ascending: false }),
        supabase
          .from("cashflow_events")
          .select("*")
          .order("event_date", { ascending: false }),
      ]);

      if (clientsRes.error) throw clientsRes.error;
      if (tasksRes.error) throw tasksRes.error;
      if (financeRes.error) throw financeRes.error;
      if (cashflowRes.error) throw cashflowRes.error;

      setClients((clientsRes.data || []).map((c) => ({ ...c, status: normalizeStatus(c.status) })));
      setTasks(tasksRes.data || []);
      setFinanceMonthly(financeRes.data || []);
      setCashflowEvents(cashflowRes.data || []);
    } catch (err) {
      setError(err.message || "Datan haku epäonnistui.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(""), 2500);
    return () => clearTimeout(t);
  }, [success]);

  const dashboardMetrics = useMemo(() => {
    const totalClients = clients.length;
    const openTasks = tasks.filter((t) => {
      if (typeof t.completed === "boolean") return !t.completed;
      return !["done", "completed", "valmis"].includes(
        String(t.status || "").toLowerCase()
      );
    }).length;

    const overdueTasks = tasks.filter((t) => {
      if (!t.due_date) return false;
      const due = new Date(t.due_date);
      const now = new Date();
      const isDone =
        typeof t.completed === "boolean"
          ? t.completed
          : ["done", "completed", "valmis"].includes(
              String(t.status || "").toLowerCase()
            );
      return due < now && !isDone;
    }).length;

    const latestMonth = financeMonthly[0] || null;
    const latestRevenue = Number(latestMonth?.revenue || 0);
    const latestExpenses = Number(latestMonth?.expenses || 0);
    const latestProfit =
      latestMonth?.profit !== undefined && latestMonth?.profit !== null
        ? Number(latestMonth.profit)
        : latestRevenue - latestExpenses;
    const latestTarget = Number(latestMonth?.target || 0);

    const next30Cashflow = cashflowEvents
      .filter((e) => {
        if (!e.event_date) return false;
        const d = new Date(e.event_date);
        const now = new Date();
        const future = new Date();
        future.setDate(now.getDate() + 30);
        return d >= now && d <= future;
      })
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);

    const wonClients = clients.filter(
      (c) => String(c.status || "").toLowerCase() === "voitettu"
    ).length;

    return {
      totalClients,
      openTasks,
      overdueTasks,
      latestMonth,
      latestRevenue,
      latestExpenses,
      latestProfit,
      latestTarget,
      next30Cashflow,
      wonClients,
    };
  }, [clients, tasks, financeMonthly, cashflowEvents]);

  const filteredClients = useMemo(() => {
    const q = crmSearch.trim().toLowerCase();

    return clients.filter((client) => {
      const matchesSearch =
        !q ||
        [
          client.name,
          client.company_name,
          client.email,
          client.phone,
          client.city,
          client.business_id,
          client.notes,
        ]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q));

      const matchesStatus =
        crmStatusFilter === "Kaikki" ||
        normalizeStatus(client.status) === crmStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [clients, crmSearch, crmStatusFilter]);

  const kanbanData = useMemo(() => {
    const map = {};
    for (const col of KANBAN_COLUMNS) map[col] = [];

    for (const client of clients) {
      const status = normalizeStatus(client.status);
      if (!map[status]) map[status] = [];
      map[status].push(client);
    }

    return map;
  }, [clients]);

  function resetForm() {
    setClientForm(emptyClientForm);
  }

  function startEditClient(client) {
    setClientForm({
      id: client.id,
      name: client.name || "",
      company_name: client.company_name || "",
      email: client.email || "",
      phone: client.phone || "",
      city: client.city || "",
      business_id: client.business_id || "",
      status: normalizeStatus(client.status),
      notes: client.notes || "",
    });
    setActiveView("crm");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleClientSubmit(e) {
    e.preventDefault();
    setSavingClient(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        name: clientForm.name?.trim() || null,
        company_name: clientForm.company_name?.trim() || null,
        email: clientForm.email?.trim() || null,
        phone: clientForm.phone?.trim() || null,
        city: clientForm.city?.trim() || null,
        business_id: clientForm.business_id?.trim() || null,
        status: clientForm.status || "Liidi",
        notes: clientForm.notes?.trim() || null,
        updated_at: new Date().toISOString(),
      };

      if (!payload.name) {
        throw new Error("Asiakkaan nimi on pakollinen.");
      }

      if (clientForm.id) {
        const { error: updateError } = await supabase
          .from("clients")
          .update(payload)
          .eq("id", clientForm.id);

        if (updateError) throw updateError;
        setSuccess("Asiakas päivitetty.");
      } else {
        const { error: insertError } = await supabase.from("clients").insert({
          ...payload,
          created_at: new Date().toISOString(),
        });

        if (insertError) throw insertError;
        setSuccess("Asiakas lisätty.");
      }

      resetForm();
      await loadAllData();
    } catch (err) {
      setError(err.message || "Asiakkaan tallennus epäonnistui.");
    } finally {
      setSavingClient(false);
    }
  }

  async function handleDeleteClient(id) {
    const ok = window.confirm("Poistetaanko asiakas varmasti?");
    if (!ok) return;

    setDeletingClientId(id);
    setError("");
    setSuccess("");

    try {
      const { error: deleteError } = await supabase
        .from("clients")
        .delete()
        .eq("id", id);

      if (deleteError) throw deleteError;

      if (clientForm.id === id) resetForm();
      setSuccess("Asiakas poistettu.");
      await loadAllData();
    } catch (err) {
      setError(err.message || "Asiakkaan poisto epäonnistui.");
    } finally {
      setDeletingClientId(null);
    }
  }

  async function updateClientStatus(clientId, newStatus) {
    setUpdatingKanbanId(clientId);
    setError("");
    setSuccess("");

    try {
      const { error: updateError } = await supabase
        .from("clients")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", clientId);

      if (updateError) throw updateError;

      setClients((prev) =>
        prev.map((c) =>
          c.id === clientId
            ? { ...c, status: newStatus, updated_at: new Date().toISOString() }
            : c
        )
      );
      setSuccess("Status päivitetty.");
    } catch (err) {
      setError(err.message || "Statuksen päivitys epäonnistui.");
    } finally {
      setUpdatingKanbanId(null);
    }
  }

  const latestCashflowRows = cashflowEvents.slice(0, 8);
  const latestFinanceRows = financeMonthly.slice(0, 6);
  const latestTasks = tasks.slice(0, 6);

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(90,49,132,0.25), transparent 28%), radial-gradient(circle at top right, rgba(180,143,72,0.09), transparent 22%), linear-gradient(180deg, #08070d 0%, #0c0a12 100%)",
        color: "#f4f1e9",
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: 1500,
          margin: "0 auto",
          padding: "32px 20px 80px",
        }}
      >
        <header
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 0.8fr",
            gap: 20,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              background:
                "linear-gradient(135deg, rgba(29,22,43,0.96), rgba(14,12,22,0.98))",
              border: "1px solid rgba(231,223,178,0.12)",
              borderRadius: 28,
              padding: 28,
              boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                padding: "8px 12px",
                borderRadius: 999,
                background: "rgba(231,223,178,0.10)",
                border: "1px solid rgba(231,223,178,0.12)",
                fontSize: 12,
                color: "#d9c98a",
                fontWeight: 700,
                letterSpacing: 0.5,
                marginBottom: 16,
              }}
            >
              SALOPINO CRM / TALOUSOHJAUS
            </div>

            <h1
              style={{
                margin: "0 0 10px",
                fontSize: 42,
                lineHeight: 1.05,
                fontWeight: 900,
                maxWidth: 760,
              }}
            >
              Dashboard + CRM + Kanban
            </h1>

            <p
              style={{
                margin: 0,
                maxWidth: 780,
                color: "rgba(244,241,233,0.74)",
                fontSize: 16,
                lineHeight: 1.7,
              }}
            >
              Ensimmäinen yhtenäinen Next.js-versio, joka kytkee asiakkaat,
              tehtävät ja talousluvut samaan operatiiviseen näkymään. Tämä
              toimii hyvänä perustana, jonka päälle rakennetaan seuraavassa
              vaiheessa Tarjoukset, Talous ja Asetukset valmiiksi.
            </p>
          </div>

          <div
            style={{
              background: "rgba(16,15,24,0.92)",
              border: "1px solid rgba(231,223,178,0.12)",
              borderRadius: 28,
              padding: 22,
              boxShadow: "0 20px 50px rgba(0,0,0,0.30)",
            }}
          >
            <div
              style={{
                fontSize: 12,
                letterSpacing: 0.8,
                textTransform: "uppercase",
                color: "#d9c98a",
                marginBottom: 12,
                fontWeight: 700,
              }}
            >
              Navigaatio
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0,1fr))",
                gap: 10,
              }}
            >
              {[
                { key: "dashboard", label: "Dashboard" },
                { key: "crm", label: "CRM" },
                { key: "kanban", label: "Kanban" },
              ].map((item) => {
                const active = activeView === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => setActiveView(item.key)}
                    style={{
                      padding: "14px 12px",
                      borderRadius: 16,
                      border: active
                        ? "1px solid rgba(231,223,178,0.34)"
                        : "1px solid rgba(231,223,178,0.10)",
                      background: active
                        ? "linear-gradient(135deg, rgba(217,201,138,0.22), rgba(120,92,35,0.18))"
                        : "rgba(10,10,16,0.84)",
                      color: "#f4f1e9",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            <div
              style={{
                marginTop: 16,
                padding: 14,
                borderRadius: 16,
                background: "rgba(9,9,14,0.72)",
                border: "1px solid rgba(231,223,178,0.08)",
                color: "rgba(244,241,233,0.68)",
                fontSize: 13,
                lineHeight: 1.6,
              }}
            >
              Seuraavassa iteraatiossa tähän samaan tiedostoon lisätään
              Tarjoukset, Talous ja Asetukset ilman että nykyinen runko hajoaa.
            </div>
          </div>
        </header>

        {(error || success) && (
          <div
            style={{
              marginBottom: 18,
              padding: "14px 16px",
              borderRadius: 16,
              border: error
                ? "1px solid rgba(255,120,120,0.24)"
                : "1px solid rgba(144,220,167,0.22)",
              background: error
                ? "rgba(120,31,49,0.16)"
                : "rgba(37,92,54,0.18)",
              color: error ? "#ffd7df" : "#d5ffe0",
              fontWeight: 600,
            }}
          >
            {error || success}
          </div>
        )}

        {loading ? (
          <div
            style={{
              background: "rgba(18,18,28,0.92)",
              border: "1px solid rgba(231,223,178,0.10)",
              borderRadius: 28,
              padding: 28,
              color: "rgba(244,241,233,0.75)",
            }}
          >
            Haetaan dataa Supabasesta...
          </div>
        ) : (
          <>
            {activeView === "dashboard" && (
              <section>
                <SectionTitle
                  eyebrow="Operatiivinen tilannekuva"
                  title="Dashboard"
                  right={
                    <Button variant="ghost" onClick={loadAllData}>
                      Päivitä data
                    </Button>
                  }
                />

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(5, minmax(0,1fr))",
                    gap: 16,
                    marginBottom: 22,
                  }}
                >
                  <Card
                    title="Asiakkaita"
                    value={dashboardMetrics.totalClients}
                    subvalue={`Voitettuja ${dashboardMetrics.wonClients} kpl`}
                    accent
                  />
                  <Card
                    title="Avoimet tehtävät"
                    value={dashboardMetrics.openTasks}
                    subvalue={`Myöhässä ${dashboardMetrics.overdueTasks} kpl`}
                  />
                  <Card
                    title="Viimeisin liikevaihto"
                    value={euro(dashboardMetrics.latestRevenue)}
                    subvalue={
                      dashboardMetrics.latestMonth
                        ? `Kuukausi ${dashboardMetrics.latestMonth.month || "-"}`
                        : "Ei kuukausidataa"
                    }
                  />
                  <Card
                    title="Viimeisin tulos"
                    value={euro(dashboardMetrics.latestProfit)}
                    subvalue={`Kulut ${euro(dashboardMetrics.latestExpenses)}`}
                  />
                  <Card
                    title="30 pv kassavirta"
                    value={euro(dashboardMetrics.next30Cashflow)}
                    subvalue={`Tavoite ${euro(dashboardMetrics.latestTarget)}`}
                  />
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.15fr 0.85fr",
                    gap: 18,
                  }}
                >
                  <div
                    style={{
                      background: "rgba(18,18,28,0.92)",
                      border: "1px solid rgba(231,223,178,0.10)",
                      borderRadius: 24,
                      padding: 22,
                    }}
                  >
                    <SectionTitle
                      eyebrow="Viimeisimmät asiakkaat"
                      title="CRM-sisääntulo"
                    />

                    <div style={{ overflowX: "auto" }}>
                      <table
                        style={{
                          width: "100%",
                          borderCollapse: "collapse",
                          fontSize: 14,
                        }}
                      >
                        <thead>
                          <tr>
                            {["Nimi", "Yritys", "Status", "Puhelin", "Luotu", ""].map(
                              (h) => (
                                <th
                                  key={h}
                                  style={{
                                    textAlign: "left",
                                    padding: "12px 10px",
                                    color: "rgba(244,241,233,0.66)",
                                    fontWeight: 700,
                                    borderBottom:
                                      "1px solid rgba(231,223,178,0.10)",
                                  }}
                                >
                                  {h}
                                </th>
                              )
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {clients.slice(0, 8).map((client) => (
                            <tr key={client.id}>
                              <td
                                style={{
                                  padding: "14px 10px",
                                  borderBottom:
                                    "1px solid rgba(231,223,178,0.08)",
                                  fontWeight: 700,
                                }}
                              >
                                {client.name || "-"}
                              </td>
                              <td
                                style={{
                                  padding: "14px 10px",
                                  borderBottom:
                                    "1px solid rgba(231,223,178,0.08)",
                                  color: "rgba(244,241,233,0.78)",
                                }}
                              >
                                {client.company_name || "-"}
                              </td>
                              <td
                                style={{
                                  padding: "14px 10px",
                                  borderBottom:
                                    "1px solid rgba(231,223,178,0.08)",
                                }}
                              >
                                <span
                                  style={{
                                    display: "inline-flex",
                                    padding: "6px 10px",
                                    borderRadius: 999,
                                    background: "rgba(231,223,178,0.08)",
                                    border:
                                      "1px solid rgba(231,223,178,0.12)",
                                    fontSize: 12,
                                    fontWeight: 700,
                                  }}
                                >
                                  {normalizeStatus(client.status)}
                                </span>
                              </td>
                              <td
                                style={{
                                  padding: "14px 10px",
                                  borderBottom:
                                    "1px solid rgba(231,223,178,0.08)",
                                  color: "rgba(244,241,233,0.78)",
                                }}
                              >
                                {client.phone || "-"}
                              </td>
                              <td
                                style={{
                                  padding: "14px 10px",
                                  borderBottom:
                                    "1px solid rgba(231,223,178,0.08)",
                                  color: "rgba(244,241,233,0.60)",
                                }}
                              >
                                {formatDate(client.created_at)}
                              </td>
                              <td
                                style={{
                                  padding: "14px 10px",
                                  borderBottom:
                                    "1px solid rgba(231,223,178,0.08)",
                                  textAlign: "right",
                                }}
                              >
                                <Button
                                  variant="ghost"
                                  onClick={() => startEditClient(client)}
                                >
                                  Muokkaa
                                </Button>
                              </td>
                            </tr>
                          ))}
                          {!clients.length && (
                            <tr>
                              <td
                                colSpan={6}
                                style={{
                                  padding: "18px 10px",
                                  color: "rgba(244,241,233,0.58)",
                                }}
                              >
                                Ei asiakkaita.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gap: 18,
                    }}
                  >
                    <div
                      style={{
                        background: "rgba(18,18,28,0.92)",
                        border: "1px solid rgba(231,223,178,0.10)",
                        borderRadius: 24,
                        padding: 22,
                      }}
                    >
                      <SectionTitle
                        eyebrow="Tehtävät"
                        title="Avoimet tehtävät"
                      />
                      <div style={{ display: "grid", gap: 10 }}>
                        {latestTasks.length ? (
                          latestTasks.map((task) => {
                            const done =
                              typeof task.completed === "boolean"
                                ? task.completed
                                : ["done", "completed", "valmis"].includes(
                                    String(task.status || "").toLowerCase()
                                  );

                            return (
                              <div
                                key={task.id}
                                style={{
                                  padding: 14,
                                  borderRadius: 16,
                                  background: "rgba(10,10,16,0.78)",
                                  border: "1px solid rgba(231,223,178,0.08)",
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    gap: 12,
                                    alignItems: "center",
                                  }}
                                >
                                  <div
                                    style={{
                                      fontWeight: 700,
                                      color: "#f4f1e9",
                                    }}
                                  >
                                    {task.title || "Nimetön tehtävä"}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: 12,
                                      padding: "5px 8px",
                                      borderRadius: 999,
                                      background: done
                                        ? "rgba(71,137,94,0.18)"
                                        : "rgba(217,201,138,0.12)",
                                      border: done
                                        ? "1px solid rgba(125,212,156,0.18)"
                                        : "1px solid rgba(231,223,178,0.10)",
                                      color: done
                                        ? "#ccffe0"
                                        : "rgba(244,241,233,0.78)",
                                      fontWeight: 700,
                                    }}
                                  >
                                    {done ? "Valmis" : task.status || "Avoin"}
                                  </div>
                                </div>
                                <div
                                  style={{
                                    marginTop: 8,
                                    color: "rgba(244,241,233,0.58)",
                                    fontSize: 13,
                                  }}
                                >
                                  Eräpäivä: {formatDate(task.due_date)}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div
                            style={{
                              color: "rgba(244,241,233,0.58)",
                              fontSize: 14,
                            }}
                          >
                            Ei tehtäviä.
                          </div>
                        )}
                      </div>
                    </div>

                    <div
                      style={{
                        background: "rgba(18,18,28,0.92)",
                        border: "1px solid rgba(231,223,178,0.10)",
                        borderRadius: 24,
                        padding: 22,
                      }}
                    >
                      <SectionTitle
                        eyebrow="Kassa"
                        title="Viimeisimmät kassavirrat"
                      />
                      <div style={{ display: "grid", gap: 10 }}>
                        {latestCashflowRows.length ? (
                          latestCashflowRows.map((row) => (
                            <div
                              key={row.id}
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                gap: 12,
                                alignItems: "center",
                                padding: 14,
                                borderRadius: 16,
                                background: "rgba(10,10,16,0.78)",
                                border: "1px solid rgba(231,223,178,0.08)",
                              }}
                            >
                              <div>
                                <div style={{ fontWeight: 700 }}>
                                  {row.description || row.type || "Kassavirta"}
                                </div>
                                <div
                                  style={{
                                    marginTop: 5,
                                    color: "rgba(244,241,233,0.58)",
                                    fontSize: 13,
                                  }}
                                >
                                  {formatDate(row.event_date)}
                                </div>
                              </div>
                              <div
                                style={{
                                  fontWeight: 800,
                                  color:
                                    Number(row.amount || 0) >= 0
                                      ? "#dfffe8"
                                      : "#ffd8de",
                                }}
                              >
                                {euro(row.amount)}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div
                            style={{
                              color: "rgba(244,241,233,0.58)",
                              fontSize: 14,
                            }}
                          >
                            Ei kassavirtadataa.
                          </div>
                        )}
                      </div>
                    </div>

                    <div
                      style={{
                        background: "rgba(18,18,28,0.92)",
                        border: "1px solid rgba(231,223,178,0.10)",
                        borderRadius: 24,
                        padding: 22,
                      }}
                    >
                      <SectionTitle
                        eyebrow="Kuukausitalous"
                        title="Viimeisimmät kuukaudet"
                      />
                      <div style={{ display: "grid", gap: 10 }}>
                        {latestFinanceRows.length ? (
                          latestFinanceRows.map((row) => {
                            const revenue = Number(row.revenue || 0);
                            const expenses = Number(row.expenses || 0);
                            const profit =
                              row.profit !== undefined && row.profit !== null
                                ? Number(row.profit)
                                : revenue - expenses;

                            return (
                              <div
                                key={row.id}
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  gap: 16,
                                  alignItems: "center",
                                  padding: 14,
                                  borderRadius: 16,
                                  background: "rgba(10,10,16,0.78)",
                                  border: "1px solid rgba(231,223,178,0.08)",
                                }}
                              >
                                <div>
                                  <div style={{ fontWeight: 700 }}>
                                    {row.month || "Kuukausi"}
                                  </div>
                                  <div
                                    style={{
                                      marginTop: 5,
                                      color: "rgba(244,241,233,0.58)",
                                      fontSize: 13,
                                    }}
                                  >
                                    Liikevaihto {euro(revenue)} / Kulut{" "}
                                    {euro(expenses)}
                                  </div>
                                </div>
                                <div
                                  style={{
                                    fontWeight: 800,
                                    color:
                                      profit >= 0 ? "#dfffe8" : "#ffd8de",
                                  }}
                                >
                                  {euro(profit)}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div
                            style={{
                              color: "rgba(244,241,233,0.58)",
                              fontSize: 14,
                            }}
                          >
                            Ei finance_monthly-dataa.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {activeView === "crm" && (
              <section>
                <SectionTitle
                  eyebrow="Asiakkuuksien hallinta"
                  title="CRM"
                  right={
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <Button variant="ghost" onClick={resetForm}>
                        Uusi asiakas
                      </Button>
                      <Button variant="ghost" onClick={loadAllData}>
                        Päivitä
                      </Button>
                    </div>
                  }
                />

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "440px 1fr",
                    gap: 18,
                  }}
                >
                  <div
                    style={{
                      background:
                        "linear-gradient(180deg, rgba(23,20,34,0.98), rgba(14,12,22,0.98))",
                      border: "1px solid rgba(231,223,178,0.12)",
                      borderRadius: 24,
                      padding: 22,
                      alignSelf: "start",
                      position: "sticky",
                      top: 20,
                    }}
                  >
                    <SectionTitle
                      eyebrow={clientForm.id ? "Muokkaus" : "Uusi asiakas"}
                      title={clientForm.id ? "Päivitä tiedot" : "Lisää asiakas"}
                    />

                    <form onSubmit={handleClientSubmit}>
                      <div
                        style={{
                          display: "grid",
                          gap: 14,
                        }}
                      >
                        <Input
                          label="Nimi *"
                          value={clientForm.name}
                          onChange={(e) =>
                            setClientForm((prev) => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                          placeholder="Esim. Jari Salopino"
                        />

                        <Input
                          label="Yritys"
                          value={clientForm.company_name}
                          onChange={(e) =>
                            setClientForm((prev) => ({
                              ...prev,
                              company_name: e.target.value,
                            }))
                          }
                          placeholder="Esim. Yritys Oy"
                        />

                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: 12,
                          }}
                        >
                          <Input
                            label="Sähköposti"
                            value={clientForm.email}
                            onChange={(e) =>
                              setClientForm((prev) => ({
                                ...prev,
                                email: e.target.value,
                              }))
                            }
                            placeholder="nimi@yritys.fi"
                          />
                          <Input
                            label="Puhelin"
                            value={clientForm.phone}
                            onChange={(e) =>
                              setClientForm((prev) => ({
                                ...prev,
                                phone: e.target.value,
                              }))
                            }
                            placeholder="040..."
                          />
                        </div>

                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: 12,
                          }}
                        >
                          <Input
                            label="Kaupunki"
                            value={clientForm.city}
                            onChange={(e) =>
                              setClientForm((prev) => ({
                                ...prev,
                                city: e.target.value,
                              }))
                            }
                            placeholder="Tampere"
                          />
                          <Input
                            label="Y-tunnus"
                            value={clientForm.business_id}
                            onChange={(e) =>
                              setClientForm((prev) => ({
                                ...prev,
                                business_id: e.target.value,
                              }))
                            }
                            placeholder="1234567-8"
                          />
                        </div>

                        <Select
                          label="Status"
                          value={clientForm.status}
                          onChange={(e) =>
                            setClientForm((prev) => ({
                              ...prev,
                              status: e.target.value,
                            }))
                          }
                        >
                          {STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </Select>

                        <TextArea
                          label="Muistiinpanot"
                          value={clientForm.notes}
                          onChange={(e) =>
                            setClientForm((prev) => ({
                              ...prev,
                              notes: e.target.value,
                            }))
                          }
                          placeholder="Lisätiedot asiakkaasta, tarjoushistoria, seuraava toimenpide..."
                        />

                        <div
                          style={{
                            display: "flex",
                            gap: 10,
                            flexWrap: "wrap",
                            marginTop: 4,
                          }}
                        >
                          <Button type="submit" disabled={savingClient}>
                            {savingClient
                              ? "Tallennetaan..."
                              : clientForm.id
                              ? "Päivitä asiakas"
                              : "Lisää asiakas"}
                          </Button>

                          <Button
                            type="button"
                            variant="ghost"
                            onClick={resetForm}
                          >
                            Tyhjennä
                          </Button>
                        </div>
                      </div>
                    </form>
                  </div>

                  <div
                    style={{
                      background: "rgba(18,18,28,0.92)",
                      border: "1px solid rgba(231,223,178,0.10)",
                      borderRadius: 24,
                      padding: 22,
                    }}
                  >
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 220px",
                        gap: 12,
                        marginBottom: 18,
                      }}
                    >
                      <Input
                        label="Hae asiakasta"
                        value={crmSearch}
                        onChange={(e) => setCrmSearch(e.target.value)}
                        placeholder="Nimi, yritys, sähköposti, puhelin..."
                      />

                      <Select
                        label="Status-suodatus"
                        value={crmStatusFilter}
                        onChange={(e) => setCrmStatusFilter(e.target.value)}
                      >
                        <option value="Kaikki">Kaikki</option>
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div
                      style={{
                        marginBottom: 14,
                        color: "rgba(244,241,233,0.68)",
                        fontSize: 14,
                      }}
                    >
                      Näytetään {filteredClients.length} / {clients.length} asiakasta
                    </div>

                    <div style={{ display: "grid", gap: 12 }}>
                      {filteredClients.length ? (
                        filteredClients.map((client) => (
                          <div
                            key={client.id}
                            style={{
                              background: "rgba(10,10,16,0.78)",
                              border: "1px solid rgba(231,223,178,0.08)",
                              borderRadius: 18,
                              padding: 18,
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                gap: 18,
                                alignItems: "start",
                                flexWrap: "wrap",
                              }}
                            >
                              <div style={{ flex: 1, minWidth: 240 }}>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                    flexWrap: "wrap",
                                    marginBottom: 10,
                                  }}
                                >
                                  <div
                                    style={{
                                      fontSize: 20,
                                      fontWeight: 800,
                                      color: "#f4f1e9",
                                    }}
                                  >
                                    {client.name || "-"}
                                  </div>
                                  <span
                                    style={{
                                      display: "inline-flex",
                                      padding: "6px 10px",
                                      borderRadius: 999,
                                      background: "rgba(231,223,178,0.08)",
                                      border:
                                        "1px solid rgba(231,223,178,0.12)",
                                      fontSize: 12,
                                      fontWeight: 700,
                                      color: "#f4f1e9",
                                    }}
                                  >
                                    {normalizeStatus(client.status)}
                                  </span>
                                </div>

                                <div
                                  style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(2, minmax(0,1fr))",
                                    gap: 10,
                                    color: "rgba(244,241,233,0.72)",
                                    fontSize: 14,
                                    marginBottom: 12,
                                  }}
                                >
                                  <div>
                                    <strong>Yritys:</strong>{" "}
                                    {client.company_name || "-"}
                                  </div>
                                  <div>
                                    <strong>Kaupunki:</strong> {client.city || "-"}
                                  </div>
                                  <div>
                                    <strong>Sähköposti:</strong>{" "}
                                    {client.email || "-"}
                                  </div>
                                  <div>
                                    <strong>Puhelin:</strong>{" "}
                                    {client.phone || "-"}
                                  </div>
                                  <div>
                                    <strong>Y-tunnus:</strong>{" "}
                                    {client.business_id || "-"}
                                  </div>
                                  <div>
                                    <strong>Päivitetty:</strong>{" "}
                                    {formatDate(client.updated_at)}
                                  </div>
                                </div>

                                {client.notes ? (
                                  <div
                                    style={{
                                      color: "rgba(244,241,233,0.64)",
                                      fontSize: 14,
                                      lineHeight: 1.6,
                                      whiteSpace: "pre-wrap",
                                    }}
                                  >
                                    {client.notes}
                                  </div>
                                ) : null}
                              </div>

                              <div
                                style={{
                                  display: "flex",
                                  gap: 10,
                                  flexWrap: "wrap",
                                }}
                              >
                                <Button
                                  variant="ghost"
                                  onClick={() => startEditClient(client)}
                                >
                                  Muokkaa
                                </Button>
                                <Button
                                  variant="danger"
                                  disabled={deletingClientId === client.id}
                                  onClick={() => handleDeleteClient(client.id)}
                                >
                                  {deletingClientId === client.id
                                    ? "Poistetaan..."
                                    : "Poista"}
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div
                          style={{
                            padding: 18,
                            borderRadius: 18,
                            background: "rgba(10,10,16,0.78)",
                            border: "1px solid rgba(231,223,178,0.08)",
                            color: "rgba(244,241,233,0.60)",
                          }}
                        >
                          Ei hakuehdoilla löytyviä asiakkaita.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {activeView === "kanban" && (
              <section>
                <SectionTitle
                  eyebrow="Myyntiputki"
                  title="Kanban"
                  right={
                    <Button variant="ghost" onClick={loadAllData}>
                      Päivitä
                    </Button>
                  }
                />

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${KANBAN_COLUMNS.length}, minmax(260px, 1fr))`,
                    gap: 14,
                    overflowX: "auto",
                    alignItems: "start",
                  }}
                >
                  {KANBAN_COLUMNS.map((column) => (
                    <div
                      key={column}
                      style={{
                        minWidth: 260,
                        background: "rgba(18,18,28,0.92)",
                        border: "1px solid rgba(231,223,178,0.10)",
                        borderRadius: 22,
                        padding: 14,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 14,
                          paddingBottom: 12,
                          borderBottom: "1px solid rgba(231,223,178,0.08)",
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 800,
                            fontSize: 16,
                          }}
                        >
                          {column}
                        </div>
                        <div
                          style={{
                            minWidth: 32,
                            height: 32,
                            borderRadius: 999,
                            background: "rgba(231,223,178,0.08)",
                            border: "1px solid rgba(231,223,178,0.10)",
                            display: "grid",
                            placeItems: "center",
                            fontWeight: 800,
                            fontSize: 13,
                            color: "#d9c98a",
                          }}
                        >
                          {kanbanData[column]?.length || 0}
                        </div>
                      </div>

                      <div style={{ display: "grid", gap: 12 }}>
                        {(kanbanData[column] || []).length ? (
                          kanbanData[column].map((client) => (
                            <div
                              key={client.id}
                              style={{
                                background:
                                  "linear-gradient(180deg, rgba(14,14,20,0.95), rgba(10,10,15,0.98))",
                                border: "1px solid rgba(231,223,178,0.08)",
                                borderRadius: 18,
                                padding: 14,
                                boxShadow: "0 10px 26px rgba(0,0,0,0.24)",
                              }}
                            >
                              <div
                                style={{
                                  fontSize: 16,
                                  fontWeight: 800,
                                  marginBottom: 6,
                                }}
                              >
                                {client.name || "-"}
                              </div>

                              <div
                                style={{
                                  fontSize: 13,
                                  color: "rgba(244,241,233,0.66)",
                                  marginBottom: 6,
                                }}
                              >
                                {client.company_name || "Ei yritysnimeä"}
                              </div>

                              <div
                                style={{
                                  fontSize: 13,
                                  color: "rgba(244,241,233,0.56)",
                                  marginBottom: 12,
                                }}
                              >
                                {client.email || "-"} {client.phone ? `• ${client.phone}` : ""}
                              </div>

                              <Select
                                label="Vaihda status"
                                value={normalizeStatus(client.status)}
                                onChange={(e) =>
                                  updateClientStatus(client.id, e.target.value)
                                }
                                disabled={updatingKanbanId === client.id}
                              >
                                {STATUS_OPTIONS.map((status) => (
                                  <option key={status} value={status}>
                                    {status}
                                  </option>
                                ))}
                              </Select>

                              <div
                                style={{
                                  display: "flex",
                                  gap: 10,
                                  marginTop: 10,
                                  flexWrap: "wrap",
                                }}
                              >
                                <Button
                                  variant="ghost"
                                  onClick={() => startEditClient(client)}
                                >
                                  Muokkaa
                                </Button>
                                <Button
                                  variant="danger"
                                  disabled={deletingClientId === client.id}
                                  onClick={() => handleDeleteClient(client.id)}
                                >
                                  {deletingClientId === client.id
                                    ? "Poistetaan..."
                                    : "Poista"}
                                </Button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div
                            style={{
                              padding: 14,
                              borderRadius: 16,
                              border: "1px dashed rgba(231,223,178,0.14)",
                              color: "rgba(244,241,233,0.48)",
                              fontSize: 14,
                              textAlign: "center",
                            }}
                          >
                            Ei asiakkaita tässä vaiheessa
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
