// src/Home.jsx
import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export default function Home() {
  const [locos, setLocos] = useState([]);
  const [editingLoco, setEditingLoco] = useState(null);
  const [editNotesText, setEditNotesText] = useState("");
  const [openKbPopup, setOpenKbPopup] = useState(null); // Hangi lokomotifin KB popup'ı açık
  const [openFaalPopup, setOpenFaalPopup] = useState(null); // Hangi lokomotifin Faal popup'ı açık
  const [actionSheetLoco, setActionSheetLoco] = useState(null); // Action sheet için lokomotif
  const [whatsappMessage, setWhatsappMessage] = useState(""); // WhatsApp mesajı
  const [showWhatsappPreview, setShowWhatsappPreview] = useState(false); // WhatsApp önizleme
  const [compactView, setCompactView] = useState(false); // Kompakt görünüm toggle

  async function loadLocos() {
    const { data, error } = await supabase
      .from("locomotives")
      .select("*")
      .eq("is_active", true)
      .eq("gone", false)
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

  function statusText(status, kbType, faalSubStatus) {
    switch (status) {
      case "faal": 
        if (faalSubStatus === 'bakimsiz') return "Faal (Bakımsız)";
        if (faalSubStatus === 'bakiliyor') return "Faal (Bakılıyor)";
        if (faalSubStatus === 'hazir') return "Faal (Hazır)";
        return "Faal";
      case "cari_tamir": return "Cari Tamir";
      case "gayri_faal": return "Gayri Faal";
      case "bakimda": return kbType ? `Bakımda (${kbType.toUpperCase()})` : "Bakımda";
      default: return status;
    }
  }

  function isBakimda(status) {
    return status === "bakimda";
  }

  async function changeStatus(locoId, newStatus, kbType = null, faalSubStatus = null) {
    const updateData = { status: newStatus };
    
    // Eğer bakımda durumuna geçiyorsak ve kb_type belirtilmemişse, kb1 yap
    if (newStatus === "bakimda") {
      updateData.kb_type = kbType || "kb1";
      updateData.faal_sub_status = null;
    } else if (newStatus === "faal") {
      // Faal durumuna geçiyorsak ve faal_sub_status belirtilmemişse, bakimsiz yap
      updateData.faal_sub_status = faalSubStatus || "bakimsiz";
      updateData.kb_type = null;
    } else {
      // Diğer durumlarda her ikisini de null yap
      updateData.kb_type = null;
      updateData.faal_sub_status = null;
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

  async function markAsGone(locoId) {
    await supabase
      .from("locomotives")
      .update({ gone: true })
      .eq("id", locoId);
    
    loadLocos();
  }

  function openEditNotes(loco) {
    setEditingLoco(loco);
    setEditNotesText(loco.notes || "");
  }

  async function saveNotes() {
    const trimmedText = editNotesText.trim();

    await supabase
      .from("locomotives")
      .update({ notes: trimmedText })
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
    setOpenKbPopup(null);
    setOpenFaalPopup(null);
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

  function getStatusStats() {
    const stats = {
      faal: 0,
      gayri_faal: 0,
      bakimda: 0,
      cari_tamir: 0
    };

    locos.forEach(loco => {
      if (stats.hasOwnProperty(loco.status)) {
        stats[loco.status]++;
      }
    });

    return `F:${stats.faal} GF:${stats.gayri_faal} KB:${stats.bakimda} CT:${stats.cari_tamir}`;
  }


  function generateWhatsAppMessage() {
    let message = `🚂 *Lokomotif Durumu*\n`;
    message += `📅 ${getTurkishDate()}\n`;
    message += `━━━━━━━━━━━━━━━\n\n`;

    for (const loco of locos) {
      message += `🔹 *${loco.name}*\n`;
      message += `   Durum: ${statusText(loco.status, loco.kb_type, loco.faal_sub_status)}\n`;
      
      if (loco.notes && loco.notes.trim()) {
        message += `   Not: ${loco.notes}\n`;
      }
      message += `\n`;
    }
    return message;
  }

  function openWhatsAppPreview() {
    const message = generateWhatsAppMessage();
    setWhatsappMessage(message);
    setShowWhatsappPreview(true);
  }

  function shareOnWhatsApp() {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;
    window.open(whatsappUrl, '_blank');
    setShowWhatsappPreview(false);
    setWhatsappMessage("");
  }

  return (
    <div 
      style={{ 
        padding: "15px",
        maxWidth: "100%",
        margin: "0 auto",
        paddingBottom: "100px"
      }}
      onClick={() => {
        setOpenKbPopup(null);
        setOpenFaalPopup(null);
      }}
    >
      {/* Tarih Başlığı */}
      <div style={{
        backgroundColor: "#FF6B35",
        color: "white",
        padding: "15px",
        borderRadius: "8px",
        marginBottom: "20px",
        textAlign: "center",
        fontSize: "0.75rem",
        fontWeight: "bold",
        boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
      }}>
        📅 {getTurkishDate()}
      </div>

      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "1.5rem"
      }}>
        <h2 style={{ 
          fontSize: "1.35rem",
          fontWeight: "bold",
          margin: 0,
          flex: 1,
          textAlign: "center"
        }}>
          {locos.length} Lokomotif <span style={{ fontSize: "0.9rem", fontWeight: "normal", color: "#666" }}>({getStatusStats()})</span>
        </h2>
        <button
          onClick={() => setCompactView(!compactView)}
          style={{
            padding: "8px 16px",
            fontSize: "0.85rem",
            fontWeight: "bold",
            backgroundColor: compactView ? "#4CAF50" : "#666",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            whiteSpace: "nowrap",
            marginLeft: "10px"
          }}
        >
          {compactView ? "📋 Liste" : "🔢 Kompakt"}
        </button>
      </div>

      {compactView ? (
        // Kompakt Görünüm - Sadece Lokomotif Numaraları
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "10px",
          justifyContent: "center"
        }}>
          {locos.map((loco) => {
            const statusColorMap = {
              faal: "#4CAF50",
              cari_tamir: "#FF9800",
              bakimda: "#2196F3",
              gayri_faal: "#f44336"
            };
            return (
              <div
                key={loco.id}
                style={{
                  padding: "12px 20px",
                  fontSize: "1rem",
                  fontWeight: "bold",
                  backgroundColor: statusColorMap[loco.status] || "#666",
                  color: "white",
                  borderRadius: "8px",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.05)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.2)";
                }}
              >
                {loco.name}
              </div>
            );
          })}
        </div>
      ) : (
        // Normal Liste Görünümü
        locos.map((loco) => {
          return (
            <div
              key={loco.id}
              style={{
                border: "2px solid #ccc",
                borderLeft: `8px solid ${statusColor(loco.status)}`,
                borderRadius: "8px",
                marginBottom: "15px",
                boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                overflow: "visible",
                position: "relative"
              }}
            >
            {/* Lokomotif Bilgisi */}
            <div 
              style={{
                padding: "15px",
                backgroundColor: "#f9f9f9",
                overflow: "visible"
              }}
            >
              {/* Loko Adı, Özel Durumlar ve Sil Butonu */}
              <div style={{ 
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "15px",
                gap: "10px"
              }}>
                <div style={{ 
                  fontSize: "1.1rem",
                  fontWeight: "bold",
                  color: "#000",
                  flex: 1
                }}>
                  🚂 {loco.name}
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActionSheetLoco({ ...loco, action: 'gone' });
                  }}
                  style={{
                    padding: "8px 12px",
                    fontSize: "0.75rem",
                    backgroundColor: "#FF9800",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "bold"
                  }}
                >
                  📦 Depodan Gitmiş
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActionSheetLoco({ ...loco, action: 'delete' });
                  }}
                  style={{
                    padding: "8px 12px",
                    fontSize: "0.75rem",
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
                <div style={{ position: "relative", flex: 1 }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (loco.status === "faal") {
                        // Eğer zaten faal ise popup aç/kapat
                        setOpenFaalPopup(openFaalPopup === loco.id ? null : loco.id);
                      } else {
                        // Faal değilse faal yap ve popup aç
                        changeStatus(loco.id, "faal", null, "bakimsiz");
                        setOpenFaalPopup(loco.id);
                      }
                    }}
                    style={{
                      width: "100%",
                      padding: "12px",
                      fontSize: "0.75rem",
                      fontWeight: "bold",
                      border: loco.status === "faal" ? "3px solid green" : "2px solid #ddd",
                      borderRadius: "8px",
                      backgroundColor: loco.status === "faal" ? "#e8f5e9" : "white",
                      color: loco.status === "faal" ? "green" : "#666",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      position: "relative"
                    }}
                  >
                    🟢 Faal
                    {loco.status === "faal" && loco.faal_sub_status && (
                      <span style={{
                        position: "absolute",
                        bottom: "2px",
                        right: "4px",
                        fontSize: "0.6rem",
                        fontWeight: "600",
                        color: loco.faal_sub_status === "bakimsiz" ? "#E65100" : 
                               loco.faal_sub_status === "bakiliyor" ? "#F57C00" : 
                               "#2E7D32"
                      }}>
                        ({loco.faal_sub_status === "bakimsiz" ? "Bakımsız" : loco.faal_sub_status === "bakiliyor" ? "Bakılıyor" : "Hazır"})
                      </span>
                    )}
                  </button>
                  
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    changeStatus(loco.id, "cari_tamir");
                  }}
                  style={{
                    flex: 1,
                    padding: "12px",
                    fontSize: "0.75rem",
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
                <div style={{ position: "relative", flex: 1 }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isBakimda(loco.status)) {
                        // Eğer zaten bakımda ise popup aç/kapat
                        setOpenKbPopup(openKbPopup === loco.id ? null : loco.id);
                      } else {
                        // Bakımda değilse bakımda yap ve popup aç
                        changeStatus(loco.id, "bakimda", "kb1");
                        setOpenKbPopup(loco.id);
                      }
                    }}
                    style={{
                      width: "100%",
                      padding: "12px",
                      fontSize: "0.75rem",
                      fontWeight: "bold",
                      border: isBakimda(loco.status) ? "3px solid blue" : "2px solid #ddd",
                      borderRadius: "8px",
                      backgroundColor: isBakimda(loco.status) ? "#e3f2fd" : "white",
                      color: isBakimda(loco.status) ? "blue" : "#666",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      position: "relative"
                    }}
                  >
                    🔵 Bakımda
                    {isBakimda(loco.status) && loco.kb_type && (
                      <span style={{
                        position: "absolute",
                        bottom: "2px",
                        right: "4px",
                        fontSize: "0.6rem",
                        fontWeight: "600",
                        color: "#1976d2"
                      }}>
                        ({loco.kb_type.toUpperCase()})
                      </span>
                    )}
                  </button>
                  
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    changeStatus(loco.id, "gayri_faal");
                  }}
                  style={{
                    flex: 1,
                    padding: "12px",
                    fontSize: "0.75rem",
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
                  fontSize: "0.8rem",
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
                  fontSize: "0.75rem",
                  fontStyle: "italic"
                }}
              >
                + Notlar için tıklayın
              </div>
            )}
          </div>
        );
        })
      )}

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
              fontSize: "1.0rem",
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
                fontSize: "0.8rem",
                border: "2px solid #ccc",
                borderRadius: "8px",
                boxSizing: "border-box",
                marginBottom: "15px",
                resize: "vertical",
                lineHeight: "1.5"
              }}
              autoFocus
            />
            
            {/* Özel Durum Butonları */}
            <div style={{ 
              display: "flex", 
              gap: "8px", 
              marginBottom: "20px",
              flexWrap: "wrap"
            }}>
              <button
                onClick={() => {
                  const currentText = editNotesText.trim();
                  const newText = currentText ? `${currentText} Soğuk Sevk` : "Soğuk Sevk";
                  setEditNotesText(newText);
                }}
                style={{
                  padding: "6px 12px",
                  borderRadius: "4px",
                  backgroundColor: "#2196F3",
                  color: "white",
                  fontSize: "0.7rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  border: "1px solid #1565C0",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                  whiteSpace: "nowrap"
                }}
              >
                Soğuk Sevk
              </button>
              
              <button
                onClick={() => {
                  const currentText = editNotesText.trim();
                  const newText = currentText ? `${currentText} KB Yaklaşıyor` : "KB Yaklaşıyor";
                  setEditNotesText(newText);
                }}
                style={{
                  padding: "6px 12px",
                  borderRadius: "4px",
                  backgroundColor: "#FF9800",
                  color: "white",
                  fontSize: "0.7rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  border: "1px solid #E65100",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                  whiteSpace: "nowrap"
                }}
              >
                KB Yaklaşıyor
              </button>
              
              <button
                onClick={() => {
                  const currentText = editNotesText.trim();
                  const newText = currentText ? `${currentText} Malzeme Bekler` : "Malzeme Bekler";
                  setEditNotesText(newText);
                }}
                style={{
                  padding: "6px 12px",
                  borderRadius: "4px",
                  backgroundColor: "#9C27B0",
                  color: "white",
                  fontSize: "0.7rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  border: "1px solid #6A1B9A",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                  whiteSpace: "nowrap"
                }}
              >
                Malzeme Bekler
              </button>
            </div>
            
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={saveNotes}
                style={{
                  flex: 1,
                  padding: "15px",
                  fontSize: "0.9rem",
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
                    fontSize: "0.9rem",
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
                  fontSize: "0.9rem",
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
        onClick={openWhatsAppPreview}
        style={{
          width: "100%",
          padding: "18px",
          fontSize: "0.95rem",
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
        <span style={{ fontSize: "1.2rem" }}>📱</span>
        WhatsApp'ta Paylaş
      </button>

      {/* KB Modal Popup */}
      {openKbPopup && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setOpenKbPopup(null);
            }
          }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 3000,
            padding: "20px"
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "white",
              borderRadius: "16px",
              padding: "30px",
              maxWidth: "400px",
              width: "100%",
              boxShadow: "0 8px 32px rgba(0,0,0,0.3)"
            }}
          >
            <h3 style={{
              marginTop: 0,
              marginBottom: "20px",
              fontSize: "1.2rem",
              fontWeight: "bold",
              textAlign: "center",
              color: "#1976d2"
            }}>
              Bakım Tipi Seçin
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {["kb1", "kb2", "kb3"].map((kb) => {
                const loco = locos.find(l => l.id === openKbPopup);
                return (
                  <button
                    key={kb}
                    onClick={() => {
                      changeStatus(openKbPopup, "bakimda", kb);
                      setOpenKbPopup(null);
                    }}
                    style={{
                      padding: "18px",
                      fontSize: "1.1rem",
                      fontWeight: "bold",
                      border: loco?.kb_type === kb ? "3px solid #1976d2" : "2px solid #90caf9",
                      borderRadius: "12px",
                      backgroundColor: loco?.kb_type === kb ? "#bbdefb" : "#e3f2fd",
                      color: loco?.kb_type === kb ? "#0d47a1" : "#1976d2",
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    {kb.toUpperCase()}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setOpenKbPopup(null)}
              style={{
                marginTop: "20px",
                width: "100%",
                padding: "12px",
                fontSize: "0.9rem",
                fontWeight: "bold",
                backgroundColor: "#999",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer"
              }}
            >
              İptal
            </button>
          </div>
        </div>
      )}

      {/* Faal Modal Popup */}
      {openFaalPopup && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setOpenFaalPopup(null);
            }
          }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 3000,
            padding: "20px"
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "white",
              borderRadius: "16px",
              padding: "30px",
              maxWidth: "400px",
              width: "100%",
              boxShadow: "0 8px 32px rgba(0,0,0,0.3)"
            }}
          >
            <h3 style={{
              marginTop: 0,
              marginBottom: "20px",
              fontSize: "1.2rem",
              fontWeight: "bold",
              textAlign: "center",
              color: "#2E7D32"
            }}>
              Faal Durumu Seçin
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[
                { value: "bakimsiz", label: "Bakımsız", color: "#FF9800", lightColor: "#FFE0B2", darkColor: "#E65100" },
                { value: "bakiliyor", label: "Bakılıyor", color: "#FFC107", lightColor: "#FFF9C4", darkColor: "#F57C00" },
                { value: "hazir", label: "Hazır", color: "#4CAF50", lightColor: "#C8E6C9", darkColor: "#2E7D32" }
              ].map((option) => {
                const loco = locos.find(l => l.id === openFaalPopup);
                const isSelected = loco?.faal_sub_status === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => {
                      changeStatus(openFaalPopup, "faal", null, option.value);
                      setOpenFaalPopup(null);
                    }}
                    style={{
                      padding: "18px",
                      fontSize: "1.1rem",
                      fontWeight: "bold",
                      border: isSelected ? `3px solid ${option.darkColor}` : `2px solid ${option.color}`,
                      borderRadius: "12px",
                      backgroundColor: isSelected ? option.lightColor : "#fff",
                      color: isSelected ? option.darkColor : option.color,
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setOpenFaalPopup(null)}
              style={{
                marginTop: "20px",
                width: "100%",
                padding: "12px",
                fontSize: "0.9rem",
                fontWeight: "bold",
                backgroundColor: "#999",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer"
              }}
            >
              İptal
            </button>
          </div>
        </div>
      )}

      {/* Action Sheet Popup - Onay */}
      {actionSheetLoco && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setActionSheetLoco(null);
            }
          }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            zIndex: 3000
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "white",
              borderTopLeftRadius: "20px",
              borderTopRightRadius: "20px",
              width: "100%",
              maxWidth: "500px",
              padding: "20px",
              boxShadow: "0 -4px 20px rgba(0,0,0,0.3)"
            }}
          >
            <div style={{
              width: "40px",
              height: "4px",
              backgroundColor: "#ccc",
              borderRadius: "2px",
              margin: "0 auto 20px"
            }} />
            <h3 style={{
              marginTop: 0,
              marginBottom: "10px",
              fontSize: "1.1rem",
              fontWeight: "bold",
              textAlign: "center"
            }}>
              {actionSheetLoco.action === 'gone' ? 'Depodan Gitmiş' : 'Sil'}
            </h3>
            <p style={{
              marginTop: 0,
              marginBottom: "20px",
              fontSize: "0.9rem",
              textAlign: "center",
              color: "#666"
            }}>
              {actionSheetLoco.action === 'gone' 
                ? `${actionSheetLoco.name} lokomotifini depodan gitmiş olarak işaretlemek istediğinize emin misiniz?`
                : `${actionSheetLoco.name} lokomotifini kaldırmak istediğinize emin misiniz?`}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <button
                onClick={() => {
                  if (actionSheetLoco.action === 'gone') {
                    markAsGone(actionSheetLoco.id);
                  } else if (actionSheetLoco.action === 'delete') {
                    deleteLoco(actionSheetLoco.id);
                  }
                  setActionSheetLoco(null);
                }}
                style={{
                  padding: "18px",
                  fontSize: "1rem",
                  fontWeight: "bold",
                  backgroundColor: actionSheetLoco.action === 'gone' ? "#FF9800" : "#f44336",
                  color: "white",
                  border: "none",
                  borderRadius: "12px",
                  cursor: "pointer"
                }}
              >
                {actionSheetLoco.action === 'gone' ? '📦 Evet, Depodan Gitmiş' : '🗑️ Evet, Sil'}
              </button>
              <button
                onClick={() => setActionSheetLoco(null)}
                style={{
                  padding: "18px",
                  fontSize: "1rem",
                  fontWeight: "bold",
                  backgroundColor: "#f5f5f5",
                  color: "#333",
                  border: "none",
                  borderRadius: "12px",
                  cursor: "pointer"
                }}
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Preview Modal */}
      {showWhatsappPreview && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowWhatsappPreview(false);
            }
          }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 3000,
            padding: "20px"
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "white",
              borderRadius: "16px",
              padding: "25px",
              maxWidth: "600px",
              width: "100%",
              boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
              maxHeight: "80vh",
              display: "flex",
              flexDirection: "column"
            }}
          >
            <h3 style={{
              marginTop: 0,
              marginBottom: "20px",
              fontSize: "1.2rem",
              fontWeight: "bold",
              textAlign: "center",
              color: "#25D366"
            }}>
              WhatsApp Mesajı Önizleme
            </h3>
            <textarea
              value={whatsappMessage}
              onChange={(e) => setWhatsappMessage(e.target.value)}
              rows={12}
              style={{
                width: "100%",
                padding: "15px",
                fontSize: "0.9rem",
                border: "2px solid #ccc",
                borderRadius: "8px",
                boxSizing: "border-box",
                marginBottom: "20px",
                resize: "vertical",
                lineHeight: "1.5",
                fontFamily: "monospace"
              }}
            />
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => {
                  setShowWhatsappPreview(false);
                  setWhatsappMessage("");
                }}
                style={{
                  flex: 1,
                  padding: "15px",
                  fontSize: "1rem",
                  fontWeight: "bold",
                  backgroundColor: "#999",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer"
                }}
              >
                İptal
              </button>
              <button
                onClick={shareOnWhatsApp}
                style={{
                  flex: 1,
                  padding: "15px",
                  fontSize: "1rem",
                  fontWeight: "bold",
                  backgroundColor: "#25D366",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer"
                }}
              >
                📱 Devam Et
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}