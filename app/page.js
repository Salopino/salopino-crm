"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const STATUS_OPTIONS = ["liidi", "kartoitus", "tarjous", "seuranta", "voitettu", "hävitty"];

const STATUS_COLORS = {
  liidi: "#94a3b8",
  kartoitus: "#3b82f6",
  tarjous: "#f59e0b",
  seuranta: "#8b5cf6",
  voitettu: "#22c55e",
  hävitty: "#ef4444",
};

const TASK_PRIORITY_COLORS = {
  matala: "#64748b",
  normaali: "#3b82f6",
  korkea: "#f59e0b",
  kriittinen: "#ef4444",
};

function formatDate(value) {
  if (!value) return "-";
  return value;
}

function formatCurrency(value) {
  return `${Number(value || 0).toLocaleString("fi-FI")} €`;
}

function formatPercent(value) {
  return `${Number(value || 0)} %`;
}

function dateOnly(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function isDueToday(dateString) {
  if (!dateString) return false;
  const today = dateOnly(new Date());
  const due = dateOnly(new Date(dateString));
  return due.getTime() === today.getTime();
}

function isOverdue(dateString) {
  if (!dateString) return false;
  const today = dateOnly(new Date());
  const due = dateOnly(new Date(dateString));
  return due < today;
}

function isDueTodayOrEarlier(dateString) {
  if (!dateString) return false;
  const today = dateOnly(new Date());
  const due = dateOnly(new Date(dateString));
  return due <= today;
}

function safeUrl(url) {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `https://${url}`;
}

export default function Home() {
  const [form, setForm] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    status: "liidi",
    value: 0,
    probability: 0,
    next_action: "",
    next_action_date: "",
    last_contact_date: "",
    company_linkedin: "",
    quote_link: "",
  });

  const [taskForm, setTaskForm] = useState({
    client_id: "",
    title: "",
    task_type: "soitto",
    priority: "normaali",
    due_date: "",
    notes: "",
  });

  const [financeForm, setFinanceForm] = useState({
    report_month: "",
    revenue: 0,
    net_result: 0,
    cash_balance: 0,
    receivables: 0,
    liabilities: 0,
    equity: 0,
  });

  const [clients, setClients] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [finance, setFinance] = useState([]);
  const [viewMode, setViewMode] = useState("table");
  const [showFinanceForm, setShowFinanceForm] = useState(false);
  const [showFinanceTable, setShowFinanceTable] = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    await Promise.all([fetchClients(), fetchTasks(), fetchFinance()]);
  }

  async function fetchClients() {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Virhe haussa (clients):", error);
      return;
    }

    setClients(data || []);
  }

  async function fetchTasks() {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("due_date", { ascending: true });

    if (error) {
      console.error("Virhe haussa (tasks):", error);
      return;
    }

    setTasks(data || []);
  }

  async function fetchFinance() {
    const { data, error } = await supabase
      .from("finance_monthly")
      .select("*")
      .order("report_month", { ascending: false })
      .limit(12);

    if (error) {
      console.error("Virhe haussa (finance):", error);
      return;
    }

    setFinance(data || []);
  }

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function updateTaskField(field, value) {
    setTaskForm((prev) => ({ ...prev, [field]: value }));
  }

  function updateFinanceField(field, value) {
    setFinanceForm((prev) => ({ ...prev, [field]: value }));
  }

  async function addClient() {
    if (!form.name.trim()) {
      alert("Anna asiakkaan nimi");
      return;
    }

    const payload = {
      name: form.name.trim(),
      company: form.company.trim() || null,
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      status: form.status,
      value: Number(form.value) || 0,
      probability: Number(form.probability) || 0,
      next_action: form.next_action.trim() || null,
      next_action_date: form.next_action_date || null,
      last_contact_date: form.last_contact_date || null,
      company_linkedin: form.company_linkedin.trim() || null,
      quote_link: form.quote_link.trim() || null,
    };

    const { error } = await supabase.from("clients").insert([payload]);

    if (error) {
      console.error("Virhe lisäyksessä:", error);
      alert("Tallennus epäonnistui");
      return;
    }

    setForm({
      name: "",
      company: "",
      email: "",
      phone: "",
      status: "liidi",
      value: 0,
      probability: 0,
      next_action: "",
      next_action_date: "",
      last_contact_date: "",
      company_linkedin: "",
      quote_link: "",
    });

    fetchClients();
  }

  async function addTask() {
    if (!taskForm.title.trim()) {
      alert("Anna tehtävän nimi");
      return;
    }

    const payload = {
      client_id: taskForm.client_id || null,
      title: taskForm.title.trim(),
      task_type: taskForm.task_type || "soitto",
      priority: taskForm.priority || "normaali",
      status: "avoin",
      due_date: taskForm.due_date || null,
      notes: taskForm.notes.trim() || null,
    };

    const { error } = await supabase.from("tasks").insert([payload]);

    if (error) {
      console.error("Virhe tehtävän lisäyksessä:", error);
      alert("Tehtävän lisäys epäonnistui");
      return;
    }

    setTaskForm({
      client_id: "",
      title: "",
      task_type: "soitto",
      priority: "normaali",
      due_date: "",
      notes: "",
    });

    fetchTasks();
  }

  async function addFinanceReport() {
    if (!financeForm.report_month) {
      alert("Anna raporttikuukausi");
      return;
    }

    const payload = {
      report_month: financeForm.report_month,
      revenue: Number(financeForm.revenue) || 0,
      net_result: Number(financeForm.net_result) || 0,
      cash_balance: Number(financeForm.cash_balance) || 0,
      receivables: Number(financeForm.receivables) || 0,
      liabilities: Number(financeForm.liabilities) || 0,
      equity: Number(financeForm.equity) || 0,
    };

    const { error } = await supabase.from("finance_monthly").insert([payload]);

    if (error) {
      console.error("Virhe talousraportin lisäyksessä:", error);
      alert("Talousraportin tallennus epäonnistui");
      return;
    }

    setFinanceForm({
      report_month: "",
      revenue: 0,
      net_result: 0,
      cash_balance: 0,
      receivables: 0,
      liabilities: 0,
      equity: 0,
    });

    fetchFinance();
    setShowFinanceForm(false);
  }

  async function updateStatus(id, newStatus) {
    const { error } = await supabase
      .from("clients")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      console.error("Status päivitys epäonnistui:", error);
      alert("Status päivitys epäonnistui");
      return;
    }

    fetchClients();
  }

  async function updateTaskStatus(id, newStatus) {
    const updates = {
      status: newStatus,
      completed_at: newStatus === "tehty" ? new Date().toISOString() : null,
    };

    const { error } = await supabase
      .from("tasks")
      .update(updates)
      .eq("id", id);

    if (error) {
      console.error("Tehtävän status päivitys epäonnistui:", error);
      alert("Tehtävän status päivitys epäonnistui");
      return;
    }

    fetchTasks();
  }

  const clientNameById = useMemo(() => {
    const map = {};
    clients.forEach((c) => {
      map[c.id] = c.name || c.company || "Nimetön asiakas";
    });
    return map;
  }, [clients]);

  const groupedClients = useMemo(() => {
    return STATUS_OPTIONS.reduce((acc, status) => {
      acc[status] = clients.filter((client) => client.status === status);
      return acc;
    }, {});
  }, [clients]);

  const contactsToday = useMemo(() => {
    return clients
      .filter((client) => client.next_action_date && isDueTodayOrEarlier(client.next_action_date))
      .sort((a, b) => {
        if (!a.next_action_date) return 1;
        if (!b.next_action_date) return -1;
        return new Date(a.next_action_date) - new Date(b.next_action_date);
      });
  }, [clients]);

  const tasksToday = useMemo(() => {
    return tasks.filter(
      (task) => task.status !== "tehty" && task.due_date && isDueToday(task.due_date)
    );
  }, [tasks]);

  const overdueTasks = useMemo(() => {
    return tasks.filter(
      (task) => task.status !== "tehty" && task.due_date && isOverdue(task.due_date)
    );
  }, [tasks]);

  const hotLeads = useMemo(() => {
    return clients.filter(
      (client) =>
        !["voitettu", "hävitty"].includes(client.status) &&
        Number(client.probability || 0) >= 60
    );
  }, [clients]);

  const latestFinance = finance.length > 0 ? finance[0] : null;

  const totals = useMemo(() => {
    const pipeline = clients
      .filter((c) => !["voitettu", "hävitty"].includes(c.status))
      .reduce((sum, c) => sum + Number(c.value || 0), 0);

    const weightedPipeline = clients
      .filter((c) => !["voitettu", "hävitty"].includes(c.status))
      .reduce(
        (sum, c) => sum + (Number(c.value || 0) * Number(c.probability || 0)) / 100,
        0
      );

    const won = clients
      .filter((c) => c.status === "voitettu")
      .reduce((sum, c) => sum + Number(c.value || 0), 0);

    const lost = clients
      .filter((c) => c.status === "hävitty")
      .reduce((sum, c) => sum + Number(c.value || 0), 0);

    const allCases = clients.length;
    const wonCases = clients.filter((c) => c.status === "voitettu").length;
    const conversion = allCases > 0 ? Math.round((wonCases / allCases) * 100) : 0;
    const avgDeal = wonCases > 0 ? Math.round(won / wonCases) : 0;

    return {
      pipeline,
      weightedPipeline,
      won,
      lost,
      conversion,
      avgDeal,
    };
  }, [clients]);

  return (
    <main
      style={{
        padding: 32,
        color: "#f8fafc",
        background:
          "radial-gradient(circle at top left, rgba(120,52,180,0.18), transparent 30%), radial-gradient(circle at top right, rgba(212,175,55,0.10), transparent 25%), #090b14",
        minHeight: "100vh",
        fontFamily: "Inter, Arial, sans-serif",
      }}
    >
      <header
        style={{
          marginBottom: 28,
          padding: 24,
          borderRadius: 24,
          background: "linear-gradient(135deg, rgba(17,21,34,0.96), rgba(9,11,20,0.96))",
          border: "1px solid rgba(231,223,178,0.14)",
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
          Premium myynnin ohjauspaneeli
        </div>
        <h1 style={{ fontSize: 52, lineHeight: 1.02, margin: 0 }}>Salopino CRM</h1>
        <div style={{ marginTop: 10, color: "#94a3b8", fontSize: 16, maxWidth: 980 }}>
          CRM, tarjouslinkit, follow-upit, tehtävät ja kirjanpidon kuukausiseuranta samassa näkymässä.
          Tämä on operatiivinen työpiste, ei vain asiakaslista.
        </div>
      </header>

      <section style={{ marginBottom: 28 }}>
        <SectionTitle
          title="Johtamisen mittarit"
          description="Näistä näet yhdellä silmäyksellä myyntiputken, riskin, konversion ja toteutuneen tuloksen."
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(220px, 1fr))",
            gap: 16,
          }}
        >
          <MetricCard title="Avoin pipeline" value={formatCurrency(totals.pipeline)} color="#f59e0b" />
          <MetricCard title="Weighted pipeline" value={formatCurrency(totals.weightedPipeline)} color="#8b5cf6" />
          <MetricCard title="Voitettu" value={formatCurrency(totals.won)} color="#22c55e" />
          <MetricCard title="Hävitty" value={formatCurrency(totals.lost)} color="#ef4444" />
          <MetricCard title="Konversio" value={formatPercent(totals.conversion)} color="#38bdf8" />
          <MetricCard title="Keski kauppa" value={formatCurrency(totals.avgDeal)} color="#14b8a6" />
          <MetricCard title="Follow-upit nyt" value={contactsToday.length} color="#7c3aed" />
          <MetricCard title="Kuumat liidit" value={hotLeads.length} color="#eab308" />
        </div>
      </section>

      <section style={{ marginBottom: 28 }}>
        <SectionTitle
          title="Päivän prioriteetit"
          description="Tässä näkyvät kiireelliset kontaktit ja tehtävät. Näitä kautta järjestelmä alkaa oikeasti ohjata päivittäistä tekemistä."
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.3fr 1fr 1fr",
            gap: 18,
            alignItems: "start",
          }}
        >
          <Panel title="Ota yhteyttä tänään">
            <PanelHint text="Asiakkaat, joiden seuraava toimenpide on erääntynyt tänään tai aiemmin." />
            {contactsToday.length === 0 ? (
              <EmptyText text="Ei erääntyneitä follow-uppeja." />
            ) : (
              contactsToday.map((client) => (
                <ReminderCard
                  key={client.id}
                  color={STATUS_COLORS[client.status] || "#6b7280"}
                  title={client.name}
                  subtitle={`${client.company || "Ei yritystä"} · ${client.status || "-"} · ${formatCurrency(client.value)}`}
                  line1={`Seuraava toimenpide: ${client.next_action || "-"}`}
                  line2={`Seuraava päivä: ${formatDate(client.next_action_date)} · Viimeisin kontakti: ${formatDate(client.last_contact_date)}`}
                  line3={`Sähköposti: ${client.email || "-"} · Puhelin: ${client.phone || "-"}`}
                />
              ))
            )}
          </Panel>

          <Panel title="Tehtävät tänään">
            <PanelHint text="Avoimet tehtävät, joiden deadline on tänään." />
            {tasksToday.length === 0 ? (
              <EmptyText text="Ei tämän päivän tehtäviä." />
            ) : (
              tasksToday.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  clientName={clientNameById[task.client_id] || "-"}
                  onStatusChange={updateTaskStatus}
                />
              ))
            )}
          </Panel>

          <Panel title="Myöhässä olevat tehtävät">
            <PanelHint text="Nämä ovat jo deadline-päivän yli. Nosta nämä ensimmäiseksi työn alle." />
            {overdueTasks.length === 0 ? (
              <EmptyText text="Ei myöhässä olevia tehtäviä." />
            ) : (
              overdueTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  clientName={clientNameById[task.client_id] || "-"}
                  onStatusChange={updateTaskStatus}
                />
              ))
            )}
          </Panel>
        </div>
      </section>

      <section style={{ marginBottom: 28 }}>
        <SectionTitle
          title="Kirjanpito ja talousseuranta"
          description="Tähän osioon tuodaan tilitoimiston kuukausiraportit. Mukana myös selkeät toimintanapit, jotta talousnäkymä ei jää piiloon."
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(220px, 1fr))",
            gap: 16,
            marginBottom: 18,
          }}
        >
          <MetricCard
            title="Viimeisin liikevaihto"
            value={latestFinance ? formatCurrency(latestFinance.revenue) : "-"}
            color="#3b82f6"
          />
          <MetricCard
            title="Viimeisin tulos"
            value={latestFinance ? formatCurrency(latestFinance.net_result) : "-"}
            color="#14b8a6"
          />
          <MetricCard
            title="Kassasaldo"
            value={latestFinance ? formatCurrency(latestFinance.cash_balance) : "-"}
            color="#22c55e"
          />
          <MetricCard
            title="Oma pääoma"
            value={latestFinance ? formatCurrency(latestFinance.equity) : "-"}
            color="#f59e0b"
          />
        </div>

        <Panel title="Talousnäkymä">
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
            <button style={primaryButtonStyle} onClick={() => setShowFinanceForm((v) => !v)}>
              {showFinanceForm ? "Sulje kuukausiraportti" : "Lisää kuukausiraportti"}
            </button>

            <button style={secondaryFinanceButtonStyle} onClick={fetchFinance}>
              Päivitä talousluvut
            </button>

            <button
              style={secondaryFinanceButtonStyle}
              onClick={() => setShowFinanceTable((v) => !v)}
            >
              {showFinanceTable ? "Piilota kirjanpitoraportit" : "Avaa kirjanpitoraportit"}
            </button>
          </div>

          {showFinanceForm && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, minmax(180px, 1fr))",
                gap: 16,
                marginBottom: 18,
                padding: 18,
                borderRadius: 16,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid #243047",
              }}
            >
              <Field label="Raporttikuukausi" help="Kuukauden ensimmäinen päivä riittää">
                <input
                  type="date"
                  value={financeForm.report_month}
                  onChange={(e) => updateFinanceField("report_month", e.target.value)}
                  style={inputStyle}
                />
              </Field>

              <Field label="Liikevaihto" help="ALV 0 % kuukausitasolla">
                <input
                  type="number"
                  value={financeForm.revenue}
                  onChange={(e) => updateFinanceField("revenue", e.target.value)}
                  style={inputStyle}
                />
              </Field>

              <Field label="Tilikauden tulos" help="Kuukauden tai kumulatiivinen tulos">
                <input
                  type="number"
                  value={financeForm.net_result}
                  onChange={(e) => updateFinanceField("net_result", e.target.value)}
                  style={inputStyle}
                />
              </Field>

              <Field label="Kassasaldo" help="Rahat tileillä raportin hetkellä">
                <input
                  type="number"
                  value={financeForm.cash_balance}
                  onChange={(e) => updateFinanceField("cash_balance", e.target.value)}
                  style={inputStyle}
                />
              </Field>

              <Field label="Myyntisaamiset" help="Avoimet saatavat">
                <input
                  type="number"
                  value={financeForm.receivables}
                  onChange={(e) => updateFinanceField("receivables", e.target.value)}
                  style={inputStyle}
                />
              </Field>

              <Field label="Velat" help="Lyhyt- ja pitkäaikaiset velat">
                <input
                  type="number"
                  value={financeForm.liabilities}
                  onChange={(e) => updateFinanceField("liabilities", e.target.value)}
                  style={inputStyle}
                />
              </Field>

              <Field label="Oma pääoma" help="Kirjanpidon mukainen oma pääoma">
                <input
                  type="number"
                  value={financeForm.equity}
                  onChange={(e) => updateFinanceField("equity", e.target.value)}
                  style={inputStyle}
                />
              </Field>
            </div>
          )}

          {showFinanceForm && (
            <div style={{ marginBottom: 18 }}>
              <button style={primaryButtonStyle} onClick={addFinanceReport}>
                Tallenna kuukausiraportti
              </button>
            </div>
          )}

          {showFinanceTable && (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {[
                      "Kuukausi",
                      "Liikevaihto",
                      "Tulos",
                      "Kassa",
                      "Saamiset",
                      "Velat",
                      "Oma pääoma",
                    ].map((h) => (
                      <th key={h} style={thStyle}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {finance.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={emptyRowStyle}>
                        Ei kirjanpidon raportteja vielä.
                      </td>
                    </tr>
                  ) : (
                    finance.map((row) => (
                      <tr key={row.id}>
                        <td style={tdStyle}>{formatDate(row.report_month)}</td>
                        <td style={tdStyle}>{formatCurrency(row.revenue)}</td>
                        <td style={tdStyle}>{formatCurrency(row.net_result)}</td>
                        <td style={tdStyle}>{formatCurrency(row.cash_balance)}</td>
                        <td style={tdStyle}>{formatCurrency(row.receivables)}</td>
                        <td style={tdStyle}>{formatCurrency(row.liabilities)}</td>
                        <td style={tdStyle}>{formatCurrency(row.equity)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </section>

      <section style={{ marginBottom: 28 }}>
        <SectionTitle
          title="Uusi case"
          description="Kenttien yläpuolella näkyy nyt mitä tieto tarkoittaa. Tämä tekee syötöstä nopeampaa, yhdenmukaisempaa ja johdettavaa."
        />

        <Panel title="Case-lomake">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(220px, 1fr))",
              gap: 16,
              marginBottom: 18,
            }}
          >
            <Field label="Asiakkaan nimi" help="Kuka ostaa palvelun">
              <input
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="Esim. Kari Luttinen"
                style={inputStyle}
              />
            </Field>

            <Field label="Yritys" help="Organisaatio tai laskutusasiakas">
              <input
                value={form.company}
                onChange={(e) => updateField("company", e.target.value)}
                placeholder="Esim. C Interim Oy"
                style={inputStyle}
              />
            </Field>

            <Field label="Sähköposti" help="Tarjoukset ja follow-upit">
              <input
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                placeholder="nimi@yritys.fi"
                style={inputStyle}
              />
            </Field>

            <Field label="Puhelin" help="Nopea yhteydenotto">
              <input
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                placeholder="040 123 4567"
                style={inputStyle}
              />
            </Field>

            <Field label="Status" help="Missä vaiheessa kauppa on">
              <select
                value={form.status}
                onChange={(e) => updateField("status", e.target.value)}
                style={inputStyle}
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Arvo €" help="Kaupan arvo ALV 0 %">
              <input
                type="number"
                value={form.value}
                onChange={(e) => updateField("value", e.target.value)}
                placeholder="4500"
                style={inputStyle}
              />
            </Field>

            <Field label="Todennäköisyys %" help="Kuinka varma kauppa on">
              <input
                type="number"
                value={form.probability}
                onChange={(e) => updateField("probability", e.target.value)}
                placeholder="60"
                style={inputStyle}
              />
            </Field>

            <Field label="Seuraava toimenpide" help="Mitä teet seuraavaksi">
              <input
                value={form.next_action}
                onChange={(e) => updateField("next_action", e.target.value)}
                placeholder="Soita tarjouksesta"
                style={inputStyle}
              />
            </Field>

            <Field label="Seuraava päivä" help="Milloin teet seuraavan toimenpiteen">
              <input
                type="date"
                value={form.next_action_date}
                onChange={(e) => updateField("next_action_date", e.target.value)}
                style={inputStyle}
              />
            </Field>

            <Field label="Viimeisin kontakti" help="Milloin viimeksi olit yhteydessä">
              <input
                type="date"
                value={form.last_contact_date}
                onChange={(e) => updateField("last_contact_date", e.target.value)}
                style={inputStyle}
              />
            </Field>

            <Field label="LinkedIn-profiili" help="Suora linkki päätöksentekijään tai yritykseen">
              <input
                value={form.company_linkedin}
                onChange={(e) => updateField("company_linkedin", e.target.value)}
                placeholder="https://linkedin.com/..."
                style={inputStyle}
              />
            </Field>

            <Field label="Tarjouksen linkki" help="Suora linkki PDF:ään tai tarjousnäkymään">
              <input
                value={form.quote_link}
                onChange={(e) => updateField("quote_link", e.target.value)}
                placeholder="https://..."
                style={inputStyle}
              />
            </Field>
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button onClick={addClient} style={primaryButtonStyle}>
              Tallenna uusi case
            </button>

            <button
              onClick={() => setViewMode("table")}
              style={{
                ...secondaryButtonStyle,
                background: viewMode === "table" ? "#1d4ed8" : "#1f2937",
              }}
            >
              Taulukko
            </button>

            <button
              onClick={() => setViewMode("kanban")}
              style={{
                ...secondaryButtonStyle,
                background: viewMode === "kanban" ? "#1d4ed8" : "#1f2937",
              }}
            >
              Kanban
            </button>
          </div>
        </Panel>
      </section>

      <section style={{ marginBottom: 28 }}>
        <SectionTitle
          title="Tehtävät ja kuumat liidit"
          description="Tehtävät pitävät follow-upit käynnissä. Kuumat liidit näyttävät mihin sinun kannattaa käyttää eniten energiaa."
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1.4fr",
            gap: 18,
            alignItems: "start",
          }}
        >
          <Panel title="Lisää tehtävä">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(180px, 1fr))",
                gap: 16,
                marginBottom: 18,
              }}
            >
              <Field label="Asiakas" help="Mihin caseen tehtävä liittyy">
                <select
                  value={taskForm.client_id}
                  onChange={(e) => updateTaskField("client_id", e.target.value)}
                  style={inputStyle}
                >
                  <option value="">Valitse asiakas</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name} {client.company ? `- ${client.company}` : ""}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Tehtävän nimi" help="Lyhyt kuvaus tekemisestä">
                <input
                  value={taskForm.title}
                  onChange={(e) => updateTaskField("title", e.target.value)}
                  placeholder="Esim. Soita päätöksestä"
                  style={inputStyle}
                />
              </Field>

              <Field label="Tehtävätyyppi" help="Mitä kanavaa tai toimenpidettä tehtävä koskee">
                <select
                  value={taskForm.task_type}
                  onChange={(e) => updateTaskField("task_type", e.target.value)}
                  style={inputStyle}
                >
                  <option value="soitto">soitto</option>
                  <option value="sähköposti">sähköposti</option>
                  <option value="linkedin">linkedin</option>
                  <option value="tapaaminen">tapaaminen</option>
                  <option value="tarjous">tarjous</option>
                  <option value="muistutus">muistutus</option>
                </select>
              </Field>

              <Field label="Prioriteetti" help="Kuinka tärkeä tehtävä on">
                <select
                  value={taskForm.priority}
                  onChange={(e) => updateTaskField("priority", e.target.value)}
                  style={inputStyle}
                >
                  <option value="matala">matala</option>
                  <option value="normaali">normaali</option>
                  <option value="korkea">korkea</option>
                  <option value="kriittinen">kriittinen</option>
                </select>
              </Field>

              <Field label="Deadline" help="Milloin tehtävä pitää tehdä">
                <input
                  type="date"
                  value={taskForm.due_date}
                  onChange={(e) => updateTaskField("due_date", e.target.value)}
                  style={inputStyle}
                />
              </Field>

              <Field label="Muistiinpano" help="Lisäohje tai konteksti">
                <input
                  value={taskForm.notes}
                  onChange={(e) => updateTaskField("notes", e.target.value)}
                  placeholder="Esim. soita iltapäivällä"
                  style={inputStyle}
                />
              </Field>
            </div>

            <button onClick={addTask} style={primaryButtonStyle}>
              Lisää tehtävä
            </button>
          </Panel>

          <Panel title="Kuumat liidit">
            <PanelHint text="Avoimet caset, joiden todennäköisyys on vähintään 60 %. Nämä ovat nopeimman tuoton kohteita." />
            {hotLeads.length === 0 ? (
              <EmptyText text="Ei kuumia liidejä juuri nyt." />
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {hotLeads.map((client) => (
                  <ReminderCard
                    key={client.id}
                    color="#f59e0b"
                    title={client.name}
                    subtitle={`${client.company || "Ei yritystä"} · ${client.status || "-"} · ${formatCurrency(client.value)}`}
                    line1={`Todennäköisyys: ${formatPercent(client.probability)}`}
                    line2={`Seuraava toimenpide: ${client.next_action || "-"}`}
                    line3={`Seuraava päivä: ${formatDate(client.next_action_date)}`}
                  />
                ))}
              </div>
            )}
          </Panel>
        </div>
      </section>

      <section style={{ marginBottom: 28 }}>
        <SectionTitle
          title={viewMode === "table" ? "Myyntitaulukko" : "Kanban-putki"}
          description={
            viewMode === "table"
              ? "Taulukossa näet kaikki myynnin ohjaustiedot ja linkit yhdellä silmäyksellä."
              : "Kanban toimii vaihejohtamiseen. Vaihda status suoraan kortilta."
          }
        />

        {viewMode === "table" ? (
          <Panel title="Myyntitaulukko">
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {[
                      "Nimi",
                      "Yritys",
                      "Sähköposti",
                      "Puhelin",
                      "Status",
                      "Arvo",
                      "Tod. %",
                      "Seuraava toimenpide",
                      "Seuraava päivä",
                      "Viim. kontakti",
                      "LinkedIn",
                      "Tarjous",
                    ].map((h) => (
                      <th key={h} style={thStyle}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client) => (
                    <tr key={client.id}>
                      <td style={tdStyle}>{client.name || "-"}</td>
                      <td style={tdStyle}>{client.company || "-"}</td>
                      <td style={tdStyle}>{client.email || "-"}</td>
                      <td style={tdStyle}>{client.phone || "-"}</td>
                      <td style={tdStyle}>
                        <span
                          style={{
                            background: STATUS_COLORS[client.status] || "#374151",
                            color: "white",
                            padding: "4px 10px",
                            borderRadius: 999,
                            fontSize: 14,
                          }}
                        >
                          {client.status || "-"}
                        </span>
                      </td>
                      <td style={tdStyle}>{formatCurrency(client.value)}</td>
                      <td style={tdStyle}>{formatPercent(client.probability)}</td>
                      <td style={tdStyle}>{client.next_action || "-"}</td>
                      <td style={tdStyle}>{formatDate(client.next_action_date)}</td>
                      <td style={tdStyle}>{formatDate(client.last_contact_date)}</td>
                      <td style={tdStyle}>
                        {client.company_linkedin ? (
                          <a
                            href={safeUrl(client.company_linkedin)}
                            target="_blank"
                            rel="noreferrer"
                            style={linkStyle}
                          >
                            Avaa
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td style={tdStyle}>
                        {client.quote_link ? (
                          <a
                            href={safeUrl(client.quote_link)}
                            target="_blank"
                            rel="noreferrer"
                            style={linkStyle}
                          >
                            Tarjous
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        ) : (
          <Panel title="Kanban-putki">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(6, minmax(240px, 1fr))",
                gap: 16,
                alignItems: "start",
                minWidth: 1500,
              }}
            >
              {STATUS_OPTIONS.map((status) => {
                const items = groupedClients[status] || [];
                const total = items.reduce((sum, item) => sum + Number(item.value || 0), 0);

                return (
                  <div
                    key={status}
                    style={{
                      background: "#0d1320",
                      border: `2px solid ${STATUS_COLORS[status] || "#374151"}`,
                      borderRadius: 16,
                      padding: 14,
                      minHeight: 460,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 14,
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 22, fontWeight: 800, textTransform: "capitalize" }}>{status}</div>
                        <div style={{ fontSize: 13, color: "#9ca3af" }}>
                          {items.length} kpl · {formatCurrency(total)}
                        </div>
                      </div>
                      <div
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          background: STATUS_COLORS[status] || "#374151",
                        }}
                      />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {items.length === 0 ? (
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
                          Ei asiakkaita tässä vaiheessa
                        </div>
                      ) : (
                        items.map((client) => (
                          <div
                            key={client.id}
                            style={{
                              background: "#0b0f19",
                              border: "1px solid #22293a",
                              borderRadius: 14,
                              padding: 14,
                            }}
                          >
                            <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 6 }}>
                              {client.name || "-"}
                            </div>
                            <div style={{ fontSize: 14, color: "#d1d5db", marginBottom: 4 }}>
                              {client.company || "Ei yritystä"}
                            </div>
                            <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 4 }}>
                              {client.email || "-"}
                            </div>
                            <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 4 }}>
                              {client.phone || "-"}
                            </div>
                            <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 4 }}>
                              Todennäköisyys: {formatPercent(client.probability)}
                            </div>
                            <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 4 }}>
                              Seuraava: {client.next_action || "-"}
                            </div>
                            <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 8 }}>
                              Päivä: {formatDate(client.next_action_date)}
                            </div>
                            <div style={{ fontSize: 18, fontWeight: 800 }}>{formatCurrency(client.value)}</div>

                            <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                              {client.company_linkedin ? (
                                <a
                                  href={safeUrl(client.company_linkedin)}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={miniLinkButtonStyle}
                                >
                                  LinkedIn
                                </a>
                              ) : null}

                              {client.quote_link ? (
                                <a
                                  href={safeUrl(client.quote_link)}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={miniLinkButtonStyle}
                                >
                                  Tarjous
                                </a>
                              ) : null}
                            </div>

                            <select
                              value={client.status}
                              onChange={(e) => updateStatus(client.id, e.target.value)}
                              style={{
                                marginTop: 10,
                                padding: 8,
                                borderRadius: 8,
                                width: "100%",
                                border: "1px solid #374151",
                                background: "#fff",
                                color: "#111",
                              }}
                            >
                              {STATUS_OPTIONS.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>
        )}
      </section>
    </main>
  );
}

function SectionTitle({ title, description }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>{title}</div>
      <div style={{ color: "#94a3b8", fontSize: 15 }}>{description}</div>
    </div>
  );
}

function Field({ label, help, children }) {
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#e5e7eb", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8 }}>{help}</div>
      {children}
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
        padding: 18,
        minHeight: 120,
        boxShadow: "0 14px 30px rgba(0,0,0,0.25)",
      }}
    >
      <div style={{ fontSize: 14, color: "#94a3b8", marginBottom: 12 }}>{title}</div>
      <div style={{ fontSize: 34, fontWeight: 800 }}>{value}</div>
    </div>
  );
}

function ReminderCard({ color, title, subtitle, line1, line2, line3 }) {
  return (
    <div
      style={{
        background: "#0b0f19",
        border: "1px solid #2a3144",
        borderLeft: `5px solid ${color}`,
        borderRadius: 14,
        padding: 16,
      }}
    >
      <div style={{ fontSize: 18, fontWeight: 700 }}>{title}</div>
      <div style={{ color: "#d1d5db", marginTop: 4 }}>{subtitle}</div>
      <div style={{ color: "#9ca3af", marginTop: 6 }}>{line1}</div>
      <div style={{ color: "#9ca3af", marginTop: 4 }}>{line2}</div>
      <div style={{ color: "#9ca3af", marginTop: 4 }}>{line3}</div>
    </div>
  );
}

function TaskCard({ task, clientName, onStatusChange }) {
  return (
    <div
      style={{
        background: "#0b0f19",
        border: "1px solid #2a3144",
        borderLeft: `5px solid ${TASK_PRIORITY_COLORS[task.priority] || "#6b7280"}`,
        borderRadius: 14,
        padding: 14,
      }}
    >
      <div style={{ fontSize: 17, fontWeight: 700 }}>{task.title || "-"}</div>
      <div style={{ color: "#d1d5db", marginTop: 4 }}>Asiakas: {clientName || "-"}</div>
      <div style={{ color: "#9ca3af", marginTop: 4 }}>
        Tyyppi: {task.task_type || "-"} · Prioriteetti: {task.priority || "-"}
      </div>
      <div style={{ color: "#9ca3af", marginTop: 4 }}>Deadline: {formatDate(task.due_date)}</div>
      <div style={{ color: "#9ca3af", marginTop: 4 }}>Muistiinpano: {task.notes || "-"}</div>

      <select
        value={task.status || "avoin"}
        onChange={(e) => onStatusChange(task.id, e.target.value)}
        style={{
          marginTop: 10,
          padding: 8,
          borderRadius: 8,
          width: "100%",
          border: "1px solid #374151",
          background: "#fff",
          color: "#111",
        }}
      >
        <option value="avoin">avoin</option>
        <option value="tehty">tehty</option>
        <option value="siirretty">siirretty</option>
      </select>
    </div>
  );
}

function EmptyText({ text }) {
  return <div style={{ color: "#9ca3af" }}>{text}</div>;
}

const inputStyle = {
  padding: 14,
  fontSize: 16,
  borderRadius: 12,
  border: "1px solid #3a4155",
  background: "#f8fafc",
  color: "#111827",
  width: "100%",
  boxSizing: "border-box",
};

const primaryButtonStyle = {
  padding: "12px 18px",
  fontSize: 15,
  fontWeight: 700,
  cursor: "pointer",
  background: "#0f766e",
  color: "white",
  border: "none",
  borderRadius: 12,
};

const secondaryButtonStyle = {
  padding: "12px 18px",
  fontSize: 15,
  fontWeight: 600,
  cursor: "pointer",
  color: "white",
  border: "none",
  borderRadius: 12,
};

const secondaryFinanceButtonStyle = {
  padding: "12px 18px",
  fontSize: 15,
  fontWeight: 600,
  cursor: "pointer",
  color: "#f8fafc",
  border: "1px solid #334155",
  background: "#1f2937",
  borderRadius: 12,
};

const linkStyle = {
  display: "inline-block",
  padding: "6px 10px",
  borderRadius: 8,
  background: "#1d4ed8",
  color: "white",
  textDecoration: "none",
  fontSize: 13,
  fontWeight: 700,
};

const miniLinkButtonStyle = {
  display: "inline-block",
  padding: "6px 10px",
  borderRadius: 8,
  background: "#1f2937",
  color: "white",
  textDecoration: "none",
  fontSize: 12,
  fontWeight: 700,
  border: "1px solid #334155",
};

const thStyle = {
  textAlign: "left",
  padding: 12,
  borderBottom: "1px solid #2a3144",
  color: "#d9dbe3",
  whiteSpace: "nowrap",
};

const tdStyle = {
  padding: 12,
  borderBottom: "1px solid #22293a",
  whiteSpace: "nowrap",
};

const emptyRowStyle = {
  padding: 16,
  color: "#94a3b8",
  borderBottom: "1px solid #22293a",
};
