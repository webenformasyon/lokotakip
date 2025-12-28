// src/Home.jsx
import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export default function Home() {
  const [locos, setLocos] = useState([]);
  const [editingLoco, setEditingLoco] = useState(null);
  const [editNotesText, setEditNotesText] = useState("");

  async function loadLocos() {
    const { data, error } = await supabase
      .from("locomotives")
      .select("*")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (!error) {
      setLocos(data);
    }
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
      case "bakimda": return "blue";
      default: return "grey";
    }
  }

  function statusText(status, kbType) {
    switch (status) {
      case "faal": return "Faal";
      case "cari_tamir": return "Cari Tamir";
      case "gayri_faal": return "Gayri Faal";
      case "bakimda": return kbType ? `Bakımda (${kbType.toUpperCase()})` : "Bakımda";
      default: return status;
    }
  }

  function isBakimda(status) {
    return status === "bakimda";
  }

  async function changeStatus(locoId, newStatus, kbType = null) {
    const updateData = { status: newStatus };
    
    // Eğer bakımda durumuna geçiyorsak ve kb_type belirtilmemişse, kb1 yap
    if (newStatus === "bakimda") {
      updateData.kb_type = kbType || "kb1";
    } else {
      // Bakımda değilse kb_type'ı null yap
      updateData.kb_type = null;
    }
    
    await supabase
      .from("locomotives")
      .update(updateData)
      .eq("id", locoId);
    
    loadLocos();
  }

  async function deleteLoco(locoId) {
    await supabase
      .from("locomotives")
      .update({ is_active: false })
      .eq("id", locoId);
    
    loadLocos();
  }

  function openEditNotes(loco) {
    setEditingLoco(loco);
    setEditNotesText(loco.notes || "");
  }

  async function saveNotes() {
    const trimmedText = editNotesText.trim();
    
    // Eğer text boş değilse tarih ekle, boşsa tamamen boş bırak
    const now = new Date();
    const dateStamp = formatLogDate(now.toISOString());
    const finalNotes = trimmedText ? `${trimmedText} ${dateStamp}` : "";

    await supabase
      .from("locomotives")
      .update({ notes: finalNotes })
      .eq("id", editingLoco.id);

    setEditingLoco(null);
    setEditNotesText("");
    loadLocos();
  }

  async function deleteNotes() {
    if (confirm("Notu silmek istediğinize emin misiniz?")) {
      await supabase
        .from("locomotives")
        .update({ notes: "" })
        .eq("id", editingLoco.id);

      setEditingLoco(null);
      setEditNotesText("");
      loadLocos();
    }
  }

  function closeNotesPopup() {
    setEditingLoco(null);
    setEditNotesText("");
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

  function formatLogDate(dateString) {
    const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 
                    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    const date = new Date(dateString);
    const day = date.getDate();
    const month = months[date.getMonth()];
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `(${day} ${month} ${hours}:${minutes})`;
  }

  async function shareOnWhatsApp() {
    let message = `🚂 *Lokomotif Durumu*\n`;
    message += `📅 ${getTurkishDate()}\n`;
    message += `━━━━━━━━━━━━━━━\n\n`;

    for (const loco of locos) {
      message += `🔹 *${loco.name}*\n`;
      message += `   Durum: ${statusText(loco.status, loco.kb_type)}\n`;
      
      if (loco.notes && loco.notes.trim()) {
        message += `   Not: ${loco.notes}\n`;
      } else {
        message += `   Not kaydı yok\n`;
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
              {/* Loko Adı ve Sil Butonu */}
              <div style={{ 
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "15px"
              }}>
                <div style={{ 
                  fontSize: "1.8rem",
                  fontWeight: "bold",
                  color: "#000"
                }}>
                  🚂 {loco.name}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`${loco.name} lokomotifini kaldırmak istediğinize emin misiniz?`)) {
                      deleteLoco(loco.id);
                    }
                  }}
                  style={{
                    padding: "8px 12px",
                    fontSize: "1.1rem",
                    backgroundColor: "#f44336",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "bold"
                  }}
                >
                  🗑️ Sil
                </button>
              </div>
              
              {/* Durum Switch/Tab */}
              <div style={{ 
                display: "flex",
                gap: "5px",
                marginBottom: "10px"
              }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    changeStatus(loco.id, "faal");
                  }}
                  style={{
                    flex: 1,
                    padding: "12px",
                    fontSize: "1.1rem",
                    fontWeight: "bold",
                    border: loco.status === "faal" ? "3px solid green" : "2px solid #ddd",
                    borderRadius: "8px",
                    backgroundColor: loco.status === "faal" ? "#e8f5e9" : "white",
                    color: loco.status === "faal" ? "green" : "#666",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  🟢 Faal
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    changeStatus(loco.id, "cari_tamir");
                  }}
                  style={{
                    flex: 1,
                    padding: "12px",
                    fontSize: "1.1rem",
                    fontWeight: "bold",
                    border: loco.status === "cari_tamir" ? "3px solid orange" : "2px solid #ddd",
                    borderRadius: "8px",
                    backgroundColor: loco.status === "cari_tamir" ? "#fff3e0" : "white",
                    color: loco.status === "cari_tamir" ? "orange" : "#666",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  🟠 Cari Tamir
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    changeStatus(loco.id, "bakimda", "kb1");
                  }}
                  style={{
                    flex: 1,
                    padding: "12px",
                    fontSize: "1.1rem",
                    fontWeight: "bold",
                    border: isBakimda(loco.status) ? "3px solid blue" : "2px solid #ddd",
                    borderRadius: "8px",
                    backgroundColor: isBakimda(loco.status) ? "#e3f2fd" : "white",
                    color: isBakimda(loco.status) ? "blue" : "#666",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  🔵 Bakımda
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    changeStatus(loco.id, "gayri_faal");
                  }}
                  style={{
                    flex: 1,
                    padding: "12px",
                    fontSize: "1.1rem",
                    fontWeight: "bold",
                    border: loco.status === "gayri_faal" ? "3px solid red" : "2px solid #ddd",
                    borderRadius: "8px",
                    backgroundColor: loco.status === "gayri_faal" ? "#ffebee" : "white",
                    color: loco.status === "gayri_faal" ? "red" : "#666",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  🔴 Gayri Faal
                </button>
              </div>

              {/* KB Alt Seçenekleri - Sadece Bakımda durumunda göster */}
              {isBakimda(loco.status) && (
                <div style={{ 
                  display: "flex",
                  gap: "5px",
                  marginBottom: "10px",
                  paddingLeft: "10px"
                }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      changeStatus(loco.id, "bakimda", "kb1");
                    }}
                    style={{
                      flex: 1,
                      padding: "10px",
                      fontSize: "1rem",
                      fontWeight: "bold",
                      border: loco.kb_type === "kb1" ? "3px solid #1976d2" : "2px solid #90caf9",
                      borderRadius: "6px",
                      backgroundColor: loco.kb_type === "kb1" ? "#bbdefb" : "#e3f2fd",
                      color: loco.kb_type === "kb1" ? "#0d47a1" : "#1976d2",
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    KB1
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      changeStatus(loco.id, "bakimda", "kb2");
                    }}
                    style={{
                      flex: 1,
                      padding: "10px",
                      fontSize: "1rem",
                      fontWeight: "bold",
                      border: loco.kb_type === "kb2" ? "3px solid #1976d2" : "2px solid #90caf9",
                      borderRadius: "6px",
                      backgroundColor: loco.kb_type === "kb2" ? "#bbdefb" : "#e3f2fd",
                      color: loco.kb_type === "kb2" ? "#0d47a1" : "#1976d2",
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    KB2
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      changeStatus(loco.id, "bakimda", "kb3");
                    }}
                    style={{
                      flex: 1,
                      padding: "10px",
                      fontSize: "1rem",
                      fontWeight: "bold",
                      border: loco.kb_type === "kb3" ? "3px solid #1976d2" : "2px solid #90caf9",
                      borderRadius: "6px",
                      backgroundColor: loco.kb_type === "kb3" ? "#bbdefb" : "#e3f2fd",
                      color: loco.kb_type === "kb3" ? "#0d47a1" : "#1976d2",
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    KB3
                  </button>
                </div>
              )}
            </div>

            {/* Notlar */}
            {loco.notes && loco.notes.trim() ? (
              <div 
                onClick={(e) => {
                  e.stopPropagation();
                  openEditNotes(loco);
                }}
                style={{
                  padding: "15px",
                  backgroundColor: "#fff",
                  borderTop: "1px solid #e0e0e0",
                  cursor: "pointer"
                }}
              >
                <div style={{
                  fontSize: "1.2rem",
                  padding: "12px",
                  backgroundColor: "#e3f2fd",
                  borderRadius: "8px",
                  borderLeft: "5px solid #2196F3",
                  color: "#000",
                  lineHeight: "1.5",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#bbdefb"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#e3f2fd"}
                >
                  {loco.notes}
                </div>
              </div>
            ) : (
              <div 
                onClick={(e) => {
                  e.stopPropagation();
                  openEditNotes(loco);
                }}
                style={{
                  padding: "15px",
                  backgroundColor: "#fff",
                  borderTop: "1px solid #e0e0e0",
                  cursor: "pointer",
                  textAlign: "center",
                  color: "#999",
                  fontSize: "1.1rem",
                  fontStyle: "italic"
                }}
              >
                + Notlar için tıklayın
              </div>
            )}
          </div>
        );
      })}

      {/* Notlar Düzenleme Popup */}
      {editingLoco && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2000,
          padding: "20px"
        }}
        onClick={closeNotesPopup}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "25px",
              maxWidth: "500px",
              width: "100%",
              boxShadow: "0 8px 32px rgba(0,0,0,0.3)"
            }}
          >
            <h3 style={{ 
              marginTop: 0,
              marginBottom: "20px",
              fontSize: "1.5rem",
              color: "#000"
            }}>
              Notları Düzenle
            </h3>
            
            <textarea
              value={editNotesText}
              onChange={(e) => setEditNotesText(e.target.value)}
              placeholder="Not girin..."
              rows="4"
              style={{
                width: "100%",
                padding: "15px",
                fontSize: "1.2rem",
                border: "2px solid #ccc",
                borderRadius: "8px",
                boxSizing: "border-box",
                marginBottom: "20px",
                resize: "vertical",
                lineHeight: "1.5"
              }}
              autoFocus
            />
            
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={saveNotes}
                style={{
                  flex: 1,
                  padding: "15px",
                  fontSize: "1.3rem",
                  fontWeight: "bold",
                  backgroundColor: "#4CAF50",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer"
                }}
              >
                ✅ Kaydet
              </button>
              {editingLoco.notes && editingLoco.notes.trim() && (
                <button
                  onClick={deleteNotes}
                  style={{
                    flex: 1,
                    padding: "15px",
                    fontSize: "1.3rem",
                    fontWeight: "bold",
                    backgroundColor: "#f44336",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer"
                  }}
                >
                  🗑️ Sil
                </button>
              )}
              <button
                onClick={closeNotesPopup}
                style={{
                  padding: "15px",
                  fontSize: "1.3rem",
                  fontWeight: "bold",
                  backgroundColor: "#999",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer"
                }}
              >
                ✖️
              </button>
            </div>
          </div>
        </div>
      )}

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