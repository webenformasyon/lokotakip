// src/AddLoco.jsx
import { useState, useRef, useEffect } from "react";
import { supabase } from "./supabase";

export default function AddLoco({ onBack }) {
  const [name, setName] = useState("");
  const [status, setStatus] = useState("faal");
  const [kbType, setKbType] = useState("kb1");
  const [faalSubStatus, setFaalSubStatus] = useState("bakimsiz");
  // 'show' = görünür, 'fade' = kayboluyor, null = yok
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const duplicateTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (duplicateTimeoutRef.current) clearTimeout(duplicateTimeoutRef.current);
    };
  }, []);

  async function save() {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    // Aynı isimde aktif loko var mı kontrol et
    const { data: existing } = await supabase
      .from("locomotives")
      .select("id")
      .eq("is_active", true)
      .eq("gone", false)
      .ilike("name", trimmedName)
      .limit(1);

    if (existing && existing.length > 0) {
      if (duplicateTimeoutRef.current) clearTimeout(duplicateTimeoutRef.current);
      setDuplicateWarning("show");
      duplicateTimeoutRef.current = setTimeout(() => {
        setDuplicateWarning("fade");
        duplicateTimeoutRef.current = setTimeout(() => {
          setDuplicateWarning(null);
          duplicateTimeoutRef.current = null;
        }, 500);
      }, 2000);
      return;
    }

    const data = {
      name: trimmedName,
      status,
      kb_type: status === "bakimda" ? kbType : null,
      faal_sub_status: status === "faal" ? faalSubStatus : null,
      is_active: true,
      gone: false
    };
    await supabase.from("locomotives").insert(data);
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

      {duplicateWarning && (
        <div
          role="alert"
          style={{
            padding: "14px 20px",
            marginBottom: "18px",
            borderRadius: "10px",
            backgroundColor: "#fff3cd",
            color: "#856404",
            border: "1px solid #ffc107",
            fontSize: "1.1rem",
            fontWeight: "600",
            transition: "opacity 0.5s ease-out",
            opacity: duplicateWarning === "fade" ? 0 : 1
          }}
        >
          Bu lokomotif zaten listede var.
        </div>
      )}

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
          marginBottom: (status === "bakimda" || status === "faal") ? "15px" : "25px",
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
        <option value="bakimda">🔵 Bakımda</option>
        <option value="gayri_faal">🔴 Gayri Faal</option>
      </select>

      {/* Faal Alt Seçeneği - Sadece Faal durumunda göster */}
      {status === "faal" && (
        <select
          value={faalSubStatus}
          onChange={(e) => setFaalSubStatus(e.target.value)}
          style={{ 
            width: "100%", 
            padding: "18px 20px", 
            marginBottom: "25px",
            fontSize: "1.4rem",
            border: "3px solid #4CAF50",
            borderRadius: "10px",
            boxSizing: "border-box",
            backgroundColor: "#E8F5E9",
            color: "#2E7D32",
            fontWeight: "600"
          }}
        >
          <option value="bakimsiz">Bakımsız</option>
          <option value="bakiliyor">Bakılıyor</option>
          <option value="hazir">Hazır</option>
        </select>
      )}

      {/* KB Seçeneği - Sadece Bakımda durumunda göster */}
      {status === "bakimda" && (
        <select
          value={kbType}
          onChange={(e) => setKbType(e.target.value)}
          style={{ 
            width: "100%", 
            padding: "18px 20px", 
            marginBottom: "25px",
            fontSize: "1.4rem",
            border: "3px solid #2196F3",
            borderRadius: "10px",
            boxSizing: "border-box",
            backgroundColor: "#e3f2fd",
            color: "#1976d2",
            fontWeight: "600"
          }}
        >
          <option value="kb1">KB1</option>
          <option value="kb2">KB2</option>
          <option value="kb3">KB3</option>
        </select>
      )}

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