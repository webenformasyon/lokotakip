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
          padding: "12px 20px",
          fontSize: "1.2rem"
        }}
      >
        ← Geri
      </button>
      
      <h2 style={{ 
        fontSize: "1.8rem",
        marginBottom: "1.5rem"
      }}>
        Yeni Lokomotif
      </h2>

      <input
        placeholder="Loko adı"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{ 
          width: "100%", 
          padding: "15px 18px", 
          marginBottom: "15px",
          fontSize: "1.2rem",
          border: "2px solid #ccc",
          borderRadius: "8px",
          boxSizing: "border-box"
        }}
      />

      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        style={{ 
          width: "100%", 
          padding: "15px 18px", 
          marginBottom: "20px",
          fontSize: "1.2rem",
          border: "2px solid #ccc",
          borderRadius: "8px",
          boxSizing: "border-box",
          backgroundColor: "#fff",
          color: "#000"
        }}
      >
        <option value="faal">Faal</option>
        <option value="cari_tamir">Cari Tamir</option>
        <option value="gayri_faal">Gayri Faal</option>
      </select>

      <button 
        onClick={save} 
        style={{ 
          padding: "18px 20px", 
          width: "100%",
          fontSize: "1.3rem",
          fontWeight: "bold",
          borderRadius: "8px",
          backgroundColor: "#4CAF50",
          color: "white",
          border: "none",
          cursor: "pointer"
        }}
      >
        Kaydet
      </button>
    </div>
  );
}