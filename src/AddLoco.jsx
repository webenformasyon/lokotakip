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
    <div style={{ 
      padding: "20px",
      maxWidth: "600px",
      margin: "0 auto",
      minHeight: "100vh"
    }}>
      <button 
        onClick={onBack}
        style={{
          marginBottom: "20px",
          padding: "15px 25px",
          fontSize: "1.4rem",
          fontWeight: "bold"
        }}
      >
        ← Geri
      </button>
      
      <h2 style={{ 
        fontSize: "2rem",
        marginBottom: "1.5rem",
        fontWeight: "bold"
      }}>
        Yeni Lokomotif
      </h2>

      <input
        placeholder="Loko adı (örn: 24100)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{ 
          width: "100%", 
          padding: "18px 20px", 
          marginBottom: "18px",
          fontSize: "1.4rem",
          border: "3px solid #ccc",
          borderRadius: "10px",
          boxSizing: "border-box",
          fontWeight: "500"
        }}
      />

      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        style={{ 
          width: "100%", 
          padding: "18px 20px", 
          marginBottom: "25px",
          fontSize: "1.4rem",
          border: "3px solid #ccc",
          borderRadius: "10px",
          boxSizing: "border-box",
          backgroundColor: "#fff",
          color: "#000",
          fontWeight: "600"
        }}
      >
        <option value="faal">🟢 Faal</option>
        <option value="cari_tamir">🟠 Cari Tamir</option>
        <option value="gayri_faal">🔴 Gayri Faal</option>
      </select>

      <button 
        onClick={save} 
        style={{ 
          padding: "20px", 
          width: "100%",
          fontSize: "1.5rem",
          fontWeight: "bold",
          borderRadius: "10px",
          backgroundColor: "#4CAF50",
          color: "white",
          border: "none",
          cursor: "pointer",
          boxShadow: "0 4px 12px rgba(0,0,0,0.2)"
        }}
      >
        ✅ Kaydet
      </button>
    </div>
  );
}