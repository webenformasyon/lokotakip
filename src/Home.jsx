// src/Home.jsx
import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export default function Home({ onSelect }) {
  const [locos, setLocos] = useState([]);
  const [logsMap, setLogsMap] = useState({});

  async function loadLocos() {
    const { data, error } = await supabase
      .from("locomotives")
      .select("*")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (!error) {
      setLocos(data);
      // Her loko için işlemleri yükle
      loadAllLogs(data);
    }
  }

  async function loadAllLogs(locomotives) {
    const logsData = {};
    for (const loco of locomotives) {
      const { data } = await supabase
        .from("locomotive_logs")
        .select("*")
        .eq("loco_id", loco.id)
        .order("created_at", { ascending: false })
        .limit(1);
      
      logsData[loco.id] = data || [];
    }
    setLogsMap(logsData);
  }

  useEffect(() => {
    loadLocos();

    // Realtime — biri ekleyince / güncelleyince herkese düşsün
    const channel = supabase
      .channel("locomotives")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "locomotives" },
        () => loadLocos()
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  function statusColor(status) {
    switch (status) {
      case "faal": return "green";
      case "cari_tamir": return "orange";
      case "gayri_faal": return "red";
      default: return "grey";
    }
  }

  function statusText(status) {
    switch (status) {
      case "faal": return "Faal";
      case "cari_tamir": return "Cari Tamir";
      case "gayri_faal": return "Gayri Faal";
      default: return status;
    }
  }

  async function changeStatus(locoId, newStatus) {
    await supabase
      .from("locomotives")
      .update({ status: newStatus })
      .eq("id", locoId);
    
    loadLocos();
  }

  function getTurkishDate() {
    const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 
                    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    const now = new Date();
    const dayName = days[now.getDay()];
    const day = now.getDate();
    const month = months[now.getMonth()];
    const year = now.getFullYear();
    
    return `${dayName}, ${day} ${month} ${year}`;
  }

  async function shareOnWhatsApp() {
    let message = `🚂 *Lokomotif Durumu*\n`;
    message += `📅 ${getTurkishDate()}\n`;
    message += `━━━━━━━━━━━━━━━\n\n`;

    for (const loco of locos) {
      const logs = logsMap[loco.id] || [];
      message += `🔹 *${loco.name}*\n`;
      message += `   Durum: ${statusText(loco.status)}\n`;
      
      if (logs.length > 0) {
        message += `   Son İşlem: ${logs[0].title}\n`;
      } else {
        message += `   İşlem kaydı yok\n`;
      }
      message += `\n`;
    }

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  }

  return (
    <div style={{ 
      padding: "15px",
      maxWidth: "100%",
      margin: "0 auto",
      paddingBottom: "100px"
    }}>
      {/* Tarih Başlığı */}
      <div style={{
        backgroundColor: "#FF6B35",
        color: "white",
        padding: "15px",
        borderRadius: "8px",
        marginBottom: "20px",
        textAlign: "center",
        fontSize: "1.1rem",
        fontWeight: "bold",
        boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
      }}>
        📅 {getTurkishDate()}
      </div>

      <h2 style={{ 
        fontSize: "2rem",
        marginBottom: "1.5rem",
        textAlign: "center",
        fontWeight: "bold"
      }}>
        Lokomotifler
      </h2>

      {locos.map((loco) => {
        const logs = logsMap[loco.id] || [];
        return (
          <div
            key={loco.id}
            style={{
              border: "2px solid #ccc",
              borderLeft: `8px solid ${statusColor(loco.status)}`,
              borderRadius: "8px",
              marginBottom: "15px",
              boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
              overflow: "hidden"
            }}
          >
            {/* Lokomotif Bilgisi */}
            <div 
              style={{
                padding: "15px",
                backgroundColor: "#f9f9f9"
              }}
            >
              {/* Loko Adı - Tıklanabilir */}
              <div 
                onClick={() => onSelect(loco)}
                style={{ 
                  fontSize: "1.8rem",
                  fontWeight: "bold",
                  marginBottom: "15px",
                  color: "#000",
                  cursor: "pointer"
                }}
              >
                🚂 {loco.name}
              </div>
              
              {/* Durum Seçici */}
              <div style={{ 
                display: "flex",
                alignItems: "center",
                gap: "10px"
              }}>
                <span style={{ 
                  fontSize: "1.3rem",
                  color: "#666",
                  fontWeight: "600"
                }}>
                  Durum:
                </span>
                <select
                  value={loco.status}
                  onChange={(e) => {
                    e.stopPropagation();
                    changeStatus(loco.id, e.target.value);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    padding: "10px 15px",
                    fontSize: "1.2rem",
                    fontWeight: "bold",
                    border: `3px solid ${statusColor(loco.status)}`,
                    borderRadius: "8px",
                    backgroundColor: "white",
                    color: statusColor(loco.status),
                    cursor: "pointer",
                    minWidth: "180px"
                  }}
                >
                  <option value="faal" style={{ color: "green" }}>🟢 Faal</option>
                  <option value="cari_tamir" style={{ color: "orange" }}>🟠 Cari Tamir</option>
                  <option value="gayri_faal" style={{ color: "red" }}>🔴 Gayri Faal</option>
                </select>
              </div>
            </div>

            {/* Son İşlem */}
            {logs.length > 0 && (
              <div style={{
                padding: "15px",
                backgroundColor: "#fff",
                borderTop: "1px solid #e0e0e0"
              }}>
                <div style={{ 
                  fontSize: "1.2rem",
                  fontWeight: "bold",
                  marginBottom: "10px",
                  color: "#666"
                }}>
                  Son İşlem:
                </div>
                <div style={{
                  fontSize: "1.2rem",
                  padding: "12px",
                  backgroundColor: "#e3f2fd",
                  borderRadius: "8px",
                  borderLeft: "5px solid #2196F3",
                  color: "#000",
                  lineHeight: "1.5"
                }}>
                  {logs[0].title}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* WhatsApp Paylaş Butonu */}
      <button
        onClick={shareOnWhatsApp}
        style={{
          width: "100%",
          padding: "18px",
          fontSize: "1.4rem",
          fontWeight: "bold",
          backgroundColor: "#25D366",
          color: "white",
          border: "none",
          borderRadius: "10px",
          cursor: "pointer",
          marginTop: "20px",
          marginBottom: "20px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "12px"
        }}
      >
        <span style={{ fontSize: "1.8rem" }}>📱</span>
        WhatsApp'ta Paylaş
      </button>
    </div>
  );
}