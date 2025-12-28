// src/AddLoco.jsx
import { useState } from "react";
import { supabase } from "./supabase";

export default function AddLoco({ onBack }) {
  const [name, setName] = useState("");
  const [status, setStatus] = useState("faal");

  async function save() {
    await supabase.from("locomotives").insert({ name, status });
    onBack();
  }

  return (
    <div style={{ padding: 20 }}>
      <button onClick={onBack}>← Geri</button>
      <h2>Yeni Lokomotif</h2>

      <input
        placeholder="Loke adı"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{ width: "100%", padding: 10, marginBottom: 10 }}
      />

      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        style={{ width: "100%", padding: 10, marginBottom: 20 }}
      >
        <option value="faal">Faal</option>
        <option value="cari_tamir">Cari Tamir</option>
        <option value="gayri_faal">Gayri Faal</option>
      </select>

      <button onClick={save} style={{ padding: 12, width: "100%" }}>
        Kaydet
      </button>
    </div>
  );
}