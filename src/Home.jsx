// src/Home.jsx
import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export default function Home() {
  const [locos, setLocos] = useState([]);
  const [editingLoco, setEditingLoco] = useState(null);
  const [editNotesText, setEditNotesText] = useState("");
  const [openKbPopup, setOpenKbPopup] = useState(null); // Hangi lokomotifin KB popup'ı açık
  const [openFaalPopup, setOpenFaalPopup] = useState(null); // Hangi lokomotifin Faal popup'ı açık

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

  async function changeStatus(locoId, newStatus, kbType = null, faalSubStatus = null) {
    const updateData = { status: newStatus };
    
    // Eğer bakımda durumuna geçiyorsak ve kb_type belirtilmemişse, kb1 yap
    if (newStatus === "bakimda") {
      updateData.kb_type = kbType || "kb1";
      updateData.faal_sub_status = null;
    } else if (newStatus === "faal") {
      // Faal durumuna geçiyorsak ve faal_sub_status belirtilmemişse, devam_ediyor yap
      updateData.faal_sub_status = faalSubStatus || "devam_ediyor";
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
        fontSize: "0.75rem",
        fontWeight: "bold",
        boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
      }}>
        📅 {getTurkishDate()}
      </div>

      <h2 style={{ 
        fontSize: "1.35rem",
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
                  fontSize: "0.8rem",
                  fontWeight: "bold",
                  color: "#000",
                  flex: 1
                }}>
                  🚂 {loco.name}
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`${loco.name} lokomotifini depodan gitmiş olarak işaretlemek istediğinize emin misiniz?`)) {
                      markAsGone(loco.id);
                    }
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
                    if (confirm(`${loco.name} lokomotifini kaldırmak istediğinize emin misiniz?`)) {
                      deleteLoco(loco.id);
                    }
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
                        changeStatus(loco.id, "faal", null, "devam_ediyor");
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
                        color: "#2E7D32"
                      }}>
                        ({loco.faal_sub_status === "devam_ediyor" ? "Devam Ediyor" : "Hazır"})
                      </span>
                    )}
                  </button>
                  
                  {/* Faal Popup */}
                  {openFaalPopup === loco.id && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        marginTop: "5px",
                        backgroundColor: "white",
                        borderRadius: "8px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                        border: "2px solid #4CAF50",
                        zIndex: 1000,
                        padding: "8px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "5px"
                      }}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          changeStatus(loco.id, "faal", null, "devam_ediyor");
                          setOpenFaalPopup(null);
                        }}
                        style={{
                          padding: "10px",
                          fontSize: "0.7rem",
                          fontWeight: "bold",
                          border: loco.faal_sub_status === "devam_ediyor" ? "3px solid #2E7D32" : "2px solid #81C784",
                          borderRadius: "6px",
                          backgroundColor: loco.faal_sub_status === "devam_ediyor" ? "#C8E6C9" : "#E8F5E9",
                          color: loco.faal_sub_status === "devam_ediyor" ? "#1B5E20" : "#2E7D32",
                          cursor: "pointer",
                          transition: "all 0.2s"
                        }}
                      >
                        Devam Ediyor
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          changeStatus(loco.id, "faal", null, "hazir");
                          setOpenFaalPopup(null);
                        }}
                        style={{
                          padding: "10px",
                          fontSize: "0.7rem",
                          fontWeight: "bold",
                          border: loco.faal_sub_status === "hazir" ? "3px solid #2E7D32" : "2px solid #81C784",
                          borderRadius: "6px",
                          backgroundColor: loco.faal_sub_status === "hazir" ? "#C8E6C9" : "#E8F5E9",
                          color: loco.faal_sub_status === "hazir" ? "#1B5E20" : "#2E7D32",
                          cursor: "pointer",
                          transition: "all 0.2s"
                        }}
                      >
                        Hazır
                      </button>
                    </div>
                  )}
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
                  
                  {/* KB Popup */}
                  {openKbPopup === loco.id && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        marginTop: "5px",
                        backgroundColor: "white",
                        borderRadius: "8px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                        border: "2px solid #2196F3",
                        zIndex: 1000,
                        padding: "8px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "5px"
                      }}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          changeStatus(loco.id, "bakimda", "kb1");
                          setOpenKbPopup(null);
                        }}
                        style={{
                          padding: "10px",
                          fontSize: "0.7rem",
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
                          setOpenKbPopup(null);
                        }}
                        style={{
                          padding: "10px",
                          fontSize: "0.7rem",
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
                          setOpenKbPopup(null);
                        }}
                        style={{
                          padding: "10px",
                          fontSize: "0.7rem",
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
        onClick={shareOnWhatsApp}
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
    </div>
  );
}