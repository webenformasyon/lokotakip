// src/LocoDetail.jsx
import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export default function LocoDetail({ loco, onBack }) {
  const [logs, setLogs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newLog, setNewLog] = useState("");

  async function loadLogs() {
    const { data } = await supabase
      .from("locomotive_logs")
      .select("*")
      .eq("loco_id", loco.id)
      .order("created_at", { ascending: false });

    setLogs(data || []);
  }

  useEffect(() => {
    loadLogs();

    const channel = supabase
      .channel("logs")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "locomotive_logs" },
        loadLogs
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  async function addLog() {
    if (!newLog.trim()) {
      alert("Lütfen işlem açıklaması girin");
      return;
    }

    await supabase.from("locomotive_logs").insert({
      loco_id: loco.id,
      title: newLog,
      description: null,
      status_after: loco.status
    });

    // Formu temizle ve kapat
    setNewLog("");
    setShowForm(false);
    loadLogs();
  }

  return (
    <div style={{ 
      padding: "20px",
      maxWidth: "800px",
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
        marginBottom: "1rem",
        fontWeight: "bold"
      }}>
        🚂 {loco.name}
      </h2>

      <h3 style={{ 
        fontSize: "1.6rem",
        marginTop: "2rem",
        marginBottom: "1rem",
        fontWeight: "bold"
      }}>
        İşlem Geçmişi
      </h3>
      
      {!showForm ? (
        <button 
          onClick={() => setShowForm(true)} 
          style={{ 
            padding: "18px 20px", 
            marginBottom: "20px",
            fontSize: "1.4rem",
            borderRadius: "10px",
            backgroundColor: "#2196F3",
            color: "white",
            border: "none",
            cursor: "pointer",
            width: "100%",
            fontWeight: "bold",
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)"
          }}
        >
          ➕ Yeni İşlem Ekle
        </button>
      ) : (
        <div style={{
          backgroundColor: "#f0f8ff",
          padding: "20px",
          borderRadius: "8px",
          marginBottom: "20px",
          border: "2px solid #2196F3"
        }}>
          <h4 style={{ 
            marginTop: 0, 
            marginBottom: "15px",
            fontSize: "1.5rem",
            fontWeight: "bold"
          }}>
            Yeni İşlem
          </h4>
          
          <textarea
            placeholder="İşlem açıklaması (örn: Yağ değişimi yapıldı, frenler kontrol edildi)"
            value={newLog}
            onChange={(e) => setNewLog(e.target.value)}
            rows="4"
            style={{
              width: "100%",
              padding: "18px",
              marginBottom: "18px",
              fontSize: "1.3rem",
              border: "3px solid #ccc",
              borderRadius: "8px",
              boxSizing: "border-box",
              resize: "vertical",
              lineHeight: "1.5"
            }}
          />
          
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={addLog}
              style={{
                flex: 1,
                padding: "18px",
                fontSize: "1.4rem",
                borderRadius: "8px",
                backgroundColor: "#4CAF50",
                color: "white",
                border: "none",
                cursor: "pointer",
                fontWeight: "bold",
                boxShadow: "0 4px 8px rgba(0,0,0,0.2)"
              }}
            >
              ✅ Kaydet
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setNewLog("");
              }}
              style={{
                flex: 1,
                padding: "18px",
                fontSize: "1.4rem",
                borderRadius: "8px",
                backgroundColor: "#f44336",
                color: "white",
                border: "none",
                cursor: "pointer",
                fontWeight: "bold",
                boxShadow: "0 4px 8px rgba(0,0,0,0.2)"
              }}
            >
              ❌ İptal
            </button>
          </div>
        </div>
      )}

      {logs.map((log) => (
        <div 
          key={log.id} 
          style={{ 
            padding: "20px", 
            border: "3px solid #e0e0e0", 
            marginBottom: "15px",
            borderRadius: "10px",
            backgroundColor: "#f9f9f9",
            boxShadow: "0 3px 6px rgba(0,0,0,0.1)"
          }}
        >
          <div style={{ 
            fontSize: "1.3rem",
            marginBottom: "12px",
            color: "#000",
            lineHeight: "1.6",
            fontWeight: "500"
          }}>
            {log.title}
          </div>
          <div style={{ 
            fontSize: "1.1rem",
            color: "#888",
            fontStyle: "italic",
            fontWeight: "500"
          }}>
            📅 {new Date(log.created_at).toLocaleString('tr-TR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>
      ))}
    </div>
  );
}