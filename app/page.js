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
    const { data } = await supabase.from("clients").select("*");
    setClients(data || []);
  }

  async function addClient() {
    if (!name) return;

    await supabase.from("clients").insert([{ name }]);
    setName("");
    fetchClients();
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Salopino CRM 🚀</h1>

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Asiakkaan nimi"
      />

      <button onClick={addClient}>Lisää</button>

      <ul>
        {clients.map((c) => (
          <li key={c.id}>{c.name}</li>
        ))}
      </ul>
    </div>
  );
}
