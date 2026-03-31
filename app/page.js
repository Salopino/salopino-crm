"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const STATUS_OPTIONS = ["liidi", "kartoitus", "tarjous", "seuranta", "voitettu", "hävitty"];

export default function Home() {
  const [form, setForm] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    status: "liidi",
    value: 0,
  });

  const [clients, setClients] = useState([]);

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
    });

    fetchClients();
  }

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
      <h1 style={{ fontSize: 48, marginBottom: 30 }}>Salopino CRM 🚀</h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(220px, 1fr))",
          gap: 16,
          maxWidth: 1100,
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
      </div>

      <button
        onClick={addClient}
        style={{
          padding: "12px 20px",
          fontSize: 18,
          cursor: "pointer",
          marginBottom: 30,
        }}
      >
        Lisää asiakas
      </button>

      <table
        style={{
          width: "100%",
          maxWidth: 1200,
          borderCollapse: "collapse",
          background: "#111522",
        }}
      >
        <thead>
          <tr>
            {["Nimi", "Yritys", "Sähköposti", "Puhelin", "Status", "Arvo €"].map((h) => (
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
              <td style={cellStyle}>{client.status || "-"}</td>
              <td style={cellStyle}>{client.value ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
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
