"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Home() {
  const [name, setName] = useState("");
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

  async function addClient() {
    if (!name.trim()) return;

    const { error } = await supabase
      .from("clients")
      .insert([{ name: name.trim() }]);

    if (error) {
      console.error("Virhe lisäyksessä:", error);
      alert("Asiakkaan lisäys epäonnistui");
      return;
    }

    setName("");
    fetchClients();
  }

  return (
    <main style={{ padding: 40, color: "white", background: "#0b0b10", minHeight: "100vh" }}>
      <h1>Salopino CRM 🚀</h1>

      <div style={{ marginTop: 20, marginBottom: 30 }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Asiakkaan nimi"
          style={{ padding: 10, marginRight: 10, minWidth: 280 }}
        />
        <button onClick={addClient} style={{ padding: "10px 16px" }}>
          Lisää
        </button>
      </div>

      <ul>
        {clients.map((c) => (
          <li key={c.id}>{c.name}</li>
        ))}
      </ul>
    </main>
  );
}
