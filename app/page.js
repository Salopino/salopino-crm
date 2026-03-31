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

function formatDate(value) {
  if (!value) return "-";
  return value;
}

function isDueTodayOrEarlier(dateString) {
  if (!dateString) return false;
  const today = new Date();
  const localToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const due = new Date(dateString);
  const localDue = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  return localDue <= localToday;
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

  const [clients, setClients] = useState([]);
  const [viewMode, setViewMode] = useState("table");

  useEffect(() => {
    fetchClients();
  }, []);

  async function fetchClients() {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Virhe haussa:", error);
      return;
    }

    setClients(data || []);
  }

  function updateField(field, value) {
    setForm((prev) => ({
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

    return { pipeline, won, lost };
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

  return (
    <main
      style={{
        padding: 40,
        color: "white",
        background: "#0b0b10",
        minHeight: "100vh",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1 style={{ fontSize: 48, marginBottom: 20 }}>Salopino CRM 🚀</h1>

      <div
        style={{
          display: "flex",
          gap: 16,
          marginBottom: 24,
          flexWrap: "wrap",
        }}
      >
        <MetricCard title="Avoin pipeline €" value={totals.pipeline} color="#d97706" />
        <MetricCard title="Voitettu €" value={totals.won} color="#16a34a" />
        <MetricCard title="Hävitty €" value={totals.lost} color="#dc2626" />
      </div>

      <section
        style={{
          background: "#111522",
          border: "1px solid #22293a",
          borderRadius: 12,
          padding: 20,
          marginBottom: 28,
          maxWidth: 1200,
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: 14 }}>Ota yhteyttä tänään</h2>

        {contactsToday.length === 0 ? (
          <div style={{ color: "#9ca3af" }}>Ei erääntyneitä follow-uppeja.</div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {contactsToday.map((client) => (
              <div
                key={client.id}
                style={{
                  background: "#0b0f19",
                  border: "1px solid #2a3144",
                  borderLeft: `4px solid ${STATUS_COLORS[client.status] || "#6b7280"}`,
                  borderRadius: 10,
                  padding: 14,
                }}
              >
                <div style={{ fontSize: 18, fontWeight: 700 }}>{client.name}</div>
                <div style={{ color: "#d1d5db", marginTop: 4 }}>
                  {client.company || "Ei yritystä"} · {client.status || "-"} · {Number(client.value || 0)} €
                </div>
                <div style={{ color: "#9ca3af", marginTop: 6 }}>
                  Seuraava toimenpide: {client.next_action || "-"}
                </div>
                <div style={{ color: "#9ca3af", marginTop: 4 }}>
                  Päivä: {formatDate(client.next_action_date)} · Viimeisin kontakti: {formatDate(client.last_contact_date)}
                </div>
                <div style={{ color: "#9ca3af", marginTop: 4 }}>
                  Sähköposti: {client.email || "-"} · Puhelin: {client.phone || "-"} · Todennäköisyys: {Number(client.probability || 0)} %
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(220px, 1fr))",
          gap: 16,
          maxWidth: 1400,
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

      <div style={{ display: "flex", gap: 12, marginBottom: 30 }}>
        <button
          onClick={addClient}
          style={{
            padding: "12px 20px",
            fontSize: 18,
            cursor: "pointer",
          }}
        >
          Lisää asiakas
        </button>

        <button
          onClick={() => setViewMode("table")}
          style={{
            padding: "12px 20px",
            fontSize: 16,
            cursor: "pointer",
            background: viewMode === "table" ? "#1d4ed8" : "#1f2937",
            color: "white",
            border: "none",
            borderRadius: 6,
          }}
        >
          Taulukko
        </button>

        <button
          onClick={() => setViewMode("kanban")}
          style={{
            padding: "12px 20px",
            fontSize: 16,
            cursor: "pointer",
            background: viewMode === "kanban" ? "#1d4ed8" : "#1f2937",
            color: "white",
            border: "none",
            borderRadius: 6,
          }}
        >
          Kanban
        </button>
      </div>

      {viewMode === "table" ? (
        <table
          style={{
            width: "100%",
            maxWidth: 1500,
            borderCollapse: "collapse",
            background: "#111522",
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
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(6, minmax(220px, 1fr))",
            gap: 16,
            alignItems: "start",
          }}
        >
          {STATUS_OPTIONS.map((status) => {
            const items = groupedClients[status] || [];
            const total = items.reduce((sum, item) => sum + Number(item.value || 0), 0);

            return (
              <div
                key={status}
                style={{
                  background: "#111522",
                  border: `2px solid ${STATUS_COLORS[status] || "#374151"}`,
                  borderRadius: 12,
                  padding: 12,
                  minHeight: 420,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 12,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700, textTransform: "capitalize" }}>{status}</div>
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
                          borderRadius: 10,
                          padding: 12,
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>
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
                        <div style={{ fontSize: 15, fontWeight: 700 }}>{Number(client.value || 0)} €</div>

                        <select
                          value={client.status}
                          onChange={(e) => updateStatus(client.id, e.target.value)}
                          style={{
                            marginTop: 8,
                            padding: 8,
                            borderRadius: 6,
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
      )}
    </main>
  );
}

function MetricCard({ title, value, color }) {
  return (
    <div
      style={{
        background: "#111522",
        border: `2px solid ${color}`,
        borderRadius: 12,
        padding: 16,
        minWidth: 220,
      }}
    >
      <div style={{ fontSize: 14, color: "#9ca3af", marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 28, fontWeight: 700 }}>{value} €</div>
    </div>
  );
}

const inputStyle = {
  padding: 12,
  fontSize: 16,
  borderRadius: 6,
  border: "1px solid #3a4155",
  background: "#fff",
  color: "#111",
};

const cellStyle = {
  padding: 12,
  borderBottom: "1px solid #22293a",
};
