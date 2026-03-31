"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const STATUS_OPTIONS = ["liidi", "kartoitus", "tarjous", "seuranta", "voitettu", "hävitty"];

const STATUS_COLORS = {
  liidi: "#6b7280",
  kartoitus: "#2563eb",
  tarjous: "#d97706",
  seuranta: "#7c3aed",
  voitettu: "#16a34a",
  hävitty: "#dc2626",
};

const TASK_PRIORITY_COLORS = {
  matala: "#6b7280",
  normaali: "#2563eb",
  korkea: "#d97706",
  kriittinen: "#dc2626",
};

function formatDate(value) {
  if (!value) return "-";
  return value;
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
  });

  const [taskForm, setTaskForm] = useState({
    client_id: "",
    title: "",
    task_type: "soitto",
    priority: "normaali",
    due_date: "",
    notes: "",
  });

  const [clients, setClients] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [viewMode, setViewMode] = useState("table");

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    await Promise.all([fetchClients(), fetchTasks()]);
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

  function updateField(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function updateTaskField(field, value) {
    setTaskForm((prev) => ({
      ...prev,
      [field]: value,
    }));
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

  const totals = useMemo(() => {
    const pipeline = clients
      .filter((c) => !["voitettu", "hävitty"].includes(c.status))
      .reduce((sum, c) => sum + Number(c.value || 0), 0);

    const won = clients
      .filter((c) => c.status === "voitettu")
      .reduce((sum, c) => sum + Number(c.value || 0), 0);

    const lost = clients
      .filter((c) => c.status === "hävitty")
      .reduce((sum, c) => sum + Number(c.value || 0), 0);

    const dueContacts = clients.filter(
      (client) => client.next_action_date && isDueTodayOrEarlier(client.next_action_date)
    ).length;

    const todayTasks = tasks.filter(
      (task) => task.status !== "tehty" && task.due_date && isDueToday(task.due_date)
    ).length;

    const overdueTasks = tasks.filter(
      (task) => task.status !== "tehty" && task.due_date && isOverdue(task.due_date)
    ).length;

    const hotLeads = clients.filter(
      (client) =>
        !["voitettu", "hävitty"].includes(client.status) &&
        Number(client.probability || 0) >= 60
    ).length;

    return { pipeline, won, lost, dueContacts, todayTasks, overdueTasks, hotLeads };
  }, [clients, tasks]);

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

  return (
    <main
      style={{
        padding: 40,
        color: "white",
        background: "#090b14",
        minHeight: "100vh",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1 style={{ fontSize: 56, marginBottom: 24, lineHeight: 1.1 }}>Salopino CRM 🚀</h1>

      <div
        style={{
          display: "flex",
          gap: 18,
          marginBottom: 28,
          flexWrap: "wrap",
        }}
      >
        <MetricCard title="Avoin pipeline €" value={`${totals.pipeline} €`} color="#d97706" />
        <MetricCard title="Voitettu €" value={`${totals.won} €`} color="#16a34a" />
        <MetricCard title="Hävitty €" value={`${totals.lost} €`} color="#dc2626" />
        <MetricCard title="Follow-upit nyt" value={totals.dueContacts} color="#7c3aed" />
        <MetricCard title="Tehtävät tänään" value={totals.todayTasks} color="#2563eb" />
        <MetricCard title="Myöhässä" value={totals.overdueTasks} color="#ef4444" />
        <MetricCard title="Kuumat liidit" value={totals.hotLeads} color="#f59e0b" />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.3fr 1fr 1fr",
          gap: 18,
          marginBottom: 30,
          alignItems: "start",
        }}
      >
        <Panel title="Ota yhteyttä tänään">
          {contactsToday.length === 0 ? (
            <EmptyText text="Ei erääntyneitä follow-uppeja." />
          ) : (
            contactsToday.map((client) => (
              <ReminderCard
                key={client.id}
                color={STATUS_COLORS[client.status] || "#6b7280"}
                title={client.name}
                subtitle={`${client.company || "Ei yritystä"} · ${client.status || "-"} · ${Number(client.value || 0)} €`}
                line1={`Seuraava toimenpide: ${client.next_action || "-"}`}
                line2={`Päivä: ${formatDate(client.next_action_date)} · Viimeisin kontakti: ${formatDate(client.last_contact_date)}`}
                line3={`Sähköposti: ${client.email || "-"} · Puhelin: ${client.phone || "-"}`}
              />
            ))
          )}
        </Panel>

        <Panel title="Tehtävät tänään">
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

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 18,
          marginBottom: 30,
          alignItems: "start",
        }}
      >
        <Panel title="Lisää uusi case">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(180px, 1fr))",
              gap: 16,
              marginBottom: 20,
            }}
          >
            <input
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="Asiakkaan nimi"
              style={inputStyle}
            />
            <input
              value={form.company}
              onChange={(e) => updateField("company", e.target.value)}
              placeholder="Yritys"
              style={inputStyle}
            />
            <input
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              placeholder="Sähköposti"
              style={inputStyle}
            />
            <input
              value={form.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              placeholder="Puhelin"
              style={inputStyle}
            />
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
            <input
              type="number"
              value={form.value}
              onChange={(e) => updateField("value", e.target.value)}
              placeholder="Arvo €"
              style={inputStyle}
            />
            <input
              type="number"
              value={form.probability}
              onChange={(e) => updateField("probability", e.target.value)}
              placeholder="Todennäköisyys %"
              style={inputStyle}
            />
            <input
              value={form.next_action}
              onChange={(e) => updateField("next_action", e.target.value)}
              placeholder="Seuraava toimenpide"
              style={inputStyle}
            />
            <input
              type="date"
              value={form.next_action_date}
              onChange={(e) => updateField("next_action_date", e.target.value)}
              style={inputStyle}
            />
            <input
              type="date"
              value={form.last_contact_date}
              onChange={(e) => updateField("last_contact_date", e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button onClick={addClient} style={primaryButtonStyle}>
              Lisää asiakas
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

        <Panel title="Lisää tehtävä">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(180px, 1fr))",
              gap: 16,
              marginBottom: 20,
            }}
          >
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

            <input
              value={taskForm.title}
              onChange={(e) => updateTaskField("title", e.target.value)}
              placeholder="Tehtävän nimi"
              style={inputStyle}
            />

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

            <input
              type="date"
              value={taskForm.due_date}
              onChange={(e) => updateTaskField("due_date", e.target.value)}
              style={inputStyle}
            />

            <input
              value={taskForm.notes}
              onChange={(e) => updateTaskField("notes", e.target.value)}
              placeholder="Muistiinpano"
              style={inputStyle}
            />
          </div>

          <button onClick={addTask} style={primaryButtonStyle}>
            Lisää tehtävä
          </button>
        </Panel>
      </div>

      <Panel title="Kuumat liidit" style={{ marginBottom: 30 }}>
        {hotLeads.length === 0 ? (
          <EmptyText text="Ei kuumia liidejä juuri nyt." />
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {hotLeads.map((client) => (
              <ReminderCard
                key={client.id}
                color="#f59e0b"
                title={client.name}
                subtitle={`${client.company || "Ei yritystä"} · ${client.status || "-"} · ${Number(client.value || 0)} €`}
                line1={`Todennäköisyys: ${Number(client.probability || 0)} %`}
                line2={`Seuraava toimenpide: ${client.next_action || "-"}`}
                line3={`Päivä: ${formatDate(client.next_action_date)}`}
              />
            ))}
          </div>
        )}
      </Panel>

      {viewMode === "table" ? (
        <Panel title="Myyntitaulukko" style={{ marginBottom: 30 }}>
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr>
                  {[
                    "Nimi",
                    "Yritys",
                    "Sähköposti",
                    "Puhelin",
                    "Status",
                    "Arvo €",
                    "Tod. %",
                    "Seuraava toimenpide",
                    "Seuraava päivä",
                    "Viim. kontakti",
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: "left",
                        padding: 12,
                        borderBottom: "1px solid #2a3144",
                        color: "#d9dbe3",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id}>
                    <td style={cellStyle}>{client.name}</td>
                    <td style={cellStyle}>{client.company || "-"}</td>
                    <td style={cellStyle}>{client.email || "-"}</td>
                    <td style={cellStyle}>{client.phone || "-"}</td>
                    <td style={cellStyle}>
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
                    <td style={cellStyle}>{Number(client.value || 0)} €</td>
                    <td style={cellStyle}>{Number(client.probability || 0)} %</td>
                    <td style={cellStyle}>{client.next_action || "-"}</td>
                    <td style={cellStyle}>{formatDate(client.next_action_date)}</td>
                    <td style={cellStyle}>{formatDate(client.last_contact_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      ) : (
        <Panel title="Kanban-putki" style={{ marginBottom: 30 }}>
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
                    borderRadius: 14,
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
                      <div style={{ fontSize: 22, fontWeight: 700, textTransform: "capitalize" }}>{status}</div>
                      <div style={{ fontSize: 13, color: "#9ca3af" }}>
                        {items.length} kpl · {total} €
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
                          borderRadius: 10,
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
                            borderRadius: 12,
                            padding: 14,
                          }}
                        >
                          <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 6 }}>
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
                            Todennäköisyys: {Number(client.probability || 0)} %
                          </div>
                          <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 4 }}>
                            Seuraava: {client.next_action || "-"}
                          </div>
                          <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 8 }}>
                            Päivä: {formatDate(client.next_action_date)}
                          </div>
                          <div style={{ fontSize: 18, fontWeight: 700 }}>{Number(client.value || 0)} €</div>

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
    </main>
  );
}

function Panel({ title, children, style = {} }) {
  return (
    <section
      style={{
        background: "#111522",
        border: "1px solid #22293a",
        borderRadius: 16,
        padding: 22,
        boxShadow: "0 10px 30px rgba(0,0,0,0.22)",
        ...style,
      }}
    >
      <h2 style={{ marginTop: 0, marginBottom: 18, fontSize: 24 }}>{title}</h2>
      {children}
    </section>
  );
}

function MetricCard({ title, value, color }) {
  return (
    <div
      style={{
        background: "#111522",
        border: `2px solid ${color}`,
        borderRadius: 16,
        padding: 20,
        minWidth: 230,
        boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
      }}
    >
      <div style={{ fontSize: 15, color: "#9ca3af", marginBottom: 10 }}>{title}</div>
      <div style={{ fontSize: 34, fontWeight: 700 }}>{value}</div>
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
        borderRadius: 12,
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
        borderRadius: 12,
        padding: 14,
      }}
    >
      <div style={{ fontSize: 17, fontWeight: 700 }}>{task.title || "-"}</div>
      <div style={{ color: "#d1d5db", marginTop: 4 }}>
        Asiakas: {clientName || "-"}
      </div>
      <div style={{ color: "#9ca3af", marginTop: 4 }}>
        Tyyppi: {task.task_type || "-"} · Prioriteetti: {task.priority || "-"}
      </div>
      <div style={{ color: "#9ca3af", marginTop: 4 }}>
        Deadline: {formatDate(task.due_date)}
      </div>
      <div style={{ color: "#9ca3af", marginTop: 4 }}>
        Muistiinpano: {task.notes || "-"}
      </div>

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
  borderRadius: 10,
  border: "1px solid #3a4155",
  background: "#fff",
  color: "#111",
};

const cellStyle = {
  padding: 12,
  borderBottom: "1px solid #22293a",
  whiteSpace: "nowrap",
};

const primaryButtonStyle = {
  padding: "12px 20px",
  fontSize: 18,
  cursor: "pointer",
  background: "#ffffff",
  color: "#111",
  border: "none",
  borderRadius: 10,
};

const secondaryButtonStyle = {
  padding: "12px 20px",
  fontSize: 16,
  cursor: "pointer",
  color: "white",
  border: "none",
  borderRadius: 10,
};
