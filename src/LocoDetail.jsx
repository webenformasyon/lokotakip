// src/LocoDetail.jsx
import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export default function LocoDetail({ loco, onBack }) {
  const [logs, setLogs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");

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
    if (!newTitle.trim()) {
      alert("Lütfen işlem başlığı girin");
      return;
    }

    await supabase.from("locomotive_logs").insert({
      loco_id: loco.id,
      title: newTitle,
      description: newDescription,
      status_after: loco.status
    });

    // Formu temizle ve kapat
    setNewTitle("");
    setNewDescription("");
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
          padding: "10px 15px",
          fontSize: "1rem"
        }}
      >
        ← Geri
      </button>
      
      <h2 style={{ 
        fontSize: "clamp(1.5rem, 5vw, 2rem)",
        marginBottom: "1rem"
      }}>
        {loco.name}
      </h2>

      <h3 style={{ 
        fontSize: "clamp(1.2rem, 4vw, 1.5rem)",
        marginTop: "2rem",
        marginBottom: "1rem"
      }}>
        İşlem Geçmişi
      </h3>
      
      {!showForm ? (
        <button 
          onClick={() => setShowForm(true)} 
          style={{ 
            padding: "12px 20px", 
            marginBottom: "20px",
            fontSize: "1rem",
            borderRadius: "8px",
            backgroundColor: "#2196F3",
            color: "white",
            border: "none",
            cursor: "pointer",
            width: "100%",
            maxWidth: "300px"
          }}
        >
          + Yeni İşlem Ekle
        </button>
      ) : (
        <div style={{
          backgroundColor: "#f0f8ff",
          padding: "20px",
          borderRadius: "8px",
          marginBottom: "20px",
          border: "2px solid #2196F3"
        }}>
          <h4 style={{ marginTop: 0, marginBottom: "15px" }}>Yeni İşlem</h4>
          
          <input
            type="text"
            placeholder="İşlem başlığı (örn: Yağ Değişimi)"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              marginBottom: "10px",
              fontSize: "1rem",
              border: "1px solid #ccc",
              borderRadius: "6px",
              boxSizing: "border-box"
            }}
          />
          
          <textarea
            placeholder="Açıklama (opsiyonel)"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            rows="3"
            style={{
              width: "100%",
              padding: "12px",
              marginBottom: "15px",
              fontSize: "1rem",
              border: "1px solid #ccc",
              borderRadius: "6px",
              boxSizing: "border-box",
              resize: "vertical"
            }}
          />
          
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={addLog}
              style={{
                flex: 1,
                padding: "12px",
                fontSize: "1rem",
                borderRadius: "6px",
                backgroundColor: "#4CAF50",
                color: "white",
                border: "none",
                cursor: "pointer",
                fontWeight: "bold"
              }}
            >
              Kaydet
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setNewTitle("");
                setNewDescription("");
              }}
              style={{
                flex: 1,
                padding: "12px",
                fontSize: "1rem",
                borderRadius: "6px",
                backgroundColor: "#f44336",
                color: "white",
                border: "none",
                cursor: "pointer"
              }}
            >
              İptal
            </button>
          </div>
        </div>
      )}

      {logs.map((log) => (
        <div 
          key={log.id} 
          style={{ 
            padding: "15px", 
            border: "1px solid #ccc", 
            marginBottom: "12px",
            borderRadius: "8px",
            backgroundColor: "#f9f9f9",
            boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
          }}
        >
          <div style={{ 
            fontWeight: "bold",
            fontSize: "clamp(1rem, 3vw, 1.1rem)",
            marginBottom: "8px"
          }}>
            {log.title}
          </div>
          <div style={{ 
            fontSize: "clamp(0.9rem, 2.5vw, 1rem)",
            marginBottom: "8px",
            color: "#555"
          }}>
            {log.description}
          </div>
          <small style={{ 
            fontSize: "clamp(0.75rem, 2vw, 0.85rem)",
            color: "#888"
          }}>
            {new Date(log.created_at).toLocaleString('tr-TR')}
          </small>
        </div>
      ))}
    </div>
  );
}