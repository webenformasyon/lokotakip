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
  const [viewMode, setViewMode] = useState(() => {
    // localStorage'dan oku, yoksa "liste" varsayılan
    const saved = localStorage.getItem('lokoViewMode');
    return saved || 'liste';
  }); // Görünüm modu: 'liste', 'kompakt', 'ozet'
  const [selectedLocoDetail, setSelectedLocoDetail] = useState(null); // Kompakt görünümde seçilen lokomotif detayı
  const [showOldRecords, setShowOldRecords] = useState(false); // Eski kayıtlar toggle
  const [oldLocos, setOldLocos] = useState([]); // Depodan gitmiş lokolar
  const [ozetStatusPopup, setOzetStatusPopup] = useState(null); // Özet görünümünde durum popup'ı için lokomotif ID

  async function loadLocos() {
    const { data, error } = await supabase
      .from("locomotives")
      .select("*")
      .eq("is_active", true)
      .eq("gone", false)
      .order("name", { ascending: true });

    if (!error) {
      // Sadece lokomotif numarasına göre sıralama (durum değişince kaybolmasın)
      const sortedData = [...data].sort((a, b) => {
        return a.name.localeCompare(b.name, 'tr');
      });
      
      setLocos(sortedData);
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

  // viewMode değiştiğinde localStorage'a kaydet
  useEffect(() => {
    localStorage.setItem('lokoViewMode', viewMode);
  }, [viewMode]);

  // Kompakt görünümde ilk lokoyu varsayılan olarak seç
  useEffect(() => {
    if (viewMode === 'kompakt' && locos.length > 0) {
      // Eğer seçili lokomotif yoksa veya seçili lokomotif listede yoksa, ilk lokomotifi seç
      if (!selectedLocoDetail || !locos.find(l => l.id === selectedLocoDetail.id)) {
        setSelectedLocoDetail(locos[0]);
      }
    }
    // Kompakt görünümden çıkıldığında seçimi temizle
    if (viewMode !== 'kompakt') {
      setSelectedLocoDetail(null);
    }
  }, [viewMode, locos]);

  function statusColor(status) {
    switch (status) {
      case "faal": return "green";
      case "cari_tamir": return "orange";
      case "gayri_faal": return "red";
      case "bakimda": return "blue";
      default: return "grey";
    }
  }

  function is110Series(locoName) {
    return locoName && locoName.toString().startsWith('110');
  }

  function formatKbType(kbType, locoName) {
    if (!kbType) return "";
    if (is110Series(locoName)) {
      // 110 ile başlayanlar için S1, S2, S3
      return kbType.replace('kb', 'S').toUpperCase();
    } else {
      // Diğerleri için KB1, KB2, KB3
      return kbType.toUpperCase();
    }
  }

  function statusText(status, kbType, faalSubStatus, locoName = null) {
    switch (status) {
      case "faal": 
        if (faalSubStatus === 'bakimsiz') return "Faal (Bakımsız)";
        if (faalSubStatus === 'bakiliyor') return "Faal (Bakılıyor)";
        if (faalSubStatus === 'hazir') return "Faal (Hazır)";
        return "Faal";
      case "cari_tamir": return "Cari Tamir";
      case "gayri_faal": return "Gayri Faal";
      case "bakimda": return kbType ? `Bakımda (${formatKbType(kbType, locoName)})` : "Bakımda";
      default: return status;
    }
  }

  function isBakimda(status) {
    return status === "bakimda";
  }

  async function changeStatus(locoId, newStatus, kbType = null, faalSubStatus = null) {
    const updateData = { status: newStatus };
    
    // Eğer bakımda durumuna geçiyorsak ve kb_type belirtilmemişse, lokomotif tipine göre varsayılan değer
    if (newStatus === "bakimda") {
      const loco = locos.find(l => l.id === locoId);
      if (!kbType) {
        // Varsayılan değer: 110 serisi için s1, diğerleri için kb1
        kbType = is110Series(loco?.name) ? "s1" : "kb1";
      }
      updateData.kb_type = kbType;
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
    
    const { error } = await supabase
      .from("locomotives")
      .update(updateData)
      .eq("id", locoId);
    
    if (error) {
      console.error("Status update error:", error);
      return;
    }
    
    loadLocos();
  }

  async function deleteLoco(locoId) {
    await supabase
      .from("locomotives")
      .delete()
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

  function formatNotesWithStyles(text) {
    if (!text) return text;
    
    const specialTexts = [
      { text: "Soğuk Sevk", bgColor: "#2196F3", color: "white", borderColor: "#1565C0", isTakip: false },
      { text: "KB Yaklaşıyor", bgColor: "#FF9800", color: "white", borderColor: "#E65100", isTakip: false },
      { text: "Malzeme Bekler", bgColor: "#9C27B0", color: "white", borderColor: "#6A1B9A", isTakip: false },
      { text: "Takip:", bgColor: "#800020", color: "white", borderColor: "#5C0015", isTakip: true },
      { text: "Marş Yapma", bgColor: "#000000", color: "white", borderColor: "#333333", isTakip: false }
    ];

    let formattedText = text;
    specialTexts.forEach(({ text: specialText, bgColor, color, borderColor, isTakip }) => {
      const regex = new RegExp(`(${specialText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      formattedText = formattedText.replace(regex, (match) => {
        const animationClass = isTakip ? 'takip-animation' : '';
        return `<span class="${animationClass}" style="display: inline-block; padding: 2px 6px; border-radius: 3px; background-color: ${bgColor}; color: ${color}; border: 1px solid ${borderColor}; font-size: 0.75em; font-weight: 600; margin: 0 2px;">${match}</span>`;
      });
    });

    return formattedText;
  }

  async function loadOldLocos() {
    const { data, error } = await supabase
      .from("locomotives")
      .select("*")
      .eq("is_active", true)
      .eq("gone", true)
      .order("updated_at", { ascending: false });

    if (!error) {
      setOldLocos(data || []);
    }
  }

  function formatDate(dateString) {
    if (!dateString) return "-";
    const date = new Date(dateString);
    const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 
                    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    const dayName = days[date.getDay()];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${dayName}, ${day} ${month} ${year} ${hours}:${minutes}`;
  }

  async function saveNotes() {
    const trimmedText = editNotesText.trim();

    await supabase
      .from("locomotives")
      .update({ notes: trimmedText })
      .eq("id", editingLoco.id);

    // Eğer selectedLocoDetail açıksa, onu da güncelle
    if (selectedLocoDetail && selectedLocoDetail.id === editingLoco.id) {
      setSelectedLocoDetail({ ...selectedLocoDetail, notes: trimmedText });
    }

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
    message += `━━━━━━━━━━━━━━━\n`;

    for (const loco of locos) {
      const status = statusText(loco.status, loco.kb_type, loco.faal_sub_status, loco.name);
      message += `🔹 *${loco.name}* - ${status}`;
      
      if (loco.notes && loco.notes.trim()) {
        message += `\n   Not: ${loco.notes}`;
      }
      message += `\n`;
    }
    // Boş satırları temizle
    return message.replace(/\n{3,}/g, '\n\n').trim();
  }

  function generateWhatsAppMessageForSingleLoco(loco) {
    const status = statusText(loco.status, loco.kb_type, loco.faal_sub_status, loco.name);
    let message = `🚂 *${loco.name}*\n\n`;
    message += `Durum: ${status}`;
    
    if (loco.notes && loco.notes.trim()) {
      message += `\n\nNot: ${loco.notes}`;
    }
    return message;
  }

  function openWhatsAppPreview() {
    const message = generateWhatsAppMessage();
    setWhatsappMessage(message);
    setShowWhatsappPreview(true);
  }

  function openWhatsAppPreviewForSingleLoco(loco) {
    const message = generateWhatsAppMessageForSingleLoco(loco);
    setWhatsappMessage(message);
    setShowWhatsappPreview(true);
  }

  function shareOnWhatsApp() {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;
    
    // iOS'ta PWA içinde window.open sorun çıkarabiliyor, window.location kullan
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    if (isIOS && window.matchMedia('(display-mode: standalone)').matches) {
      // iOS PWA içinde - window.location kullan
      window.location.href = whatsappUrl;
    } else {
      // Android veya normal tarayıcı - window.open kullan
      window.open(whatsappUrl, '_blank');
    }
    
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
        setOzetStatusPopup(null);
      }}
    >
      <div style={{
        display: "flex",
        flexDirection: "column",
        marginBottom: "1.5rem"
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "10px"
        }}>
          <h2 style={{ 
            fontSize: "1.35rem",
            fontWeight: "bold",
            margin: 0
          }}>
            {locos.length} Lokomotif
          </h2>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "10px"
          }}>
            <div style={{ 
              fontSize: "0.85rem",
              color: "#666",
              fontWeight: "normal"
            }}>
              {getStatusStats()}
            </div>
            {/* Yenile Butonu - İstatistiğin sağında */}
            <button
              onClick={loadLocos}
              style={{
                padding: "8px",
                fontSize: "1.3rem",
                fontWeight: "bold",
                backgroundColor: "transparent",
                color: "#666",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.2s",
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.1)";
                e.currentTarget.style.color = "#FF6B35";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.color = "#666";
              }}
              title="Yenile"
            >
              🔄
            </button>
          </div>
        </div>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          justifyContent: "flex-start"
        }}>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => {
                setViewMode('liste');
                setShowOldRecords(false);
              }}
              style={{
                padding: "8px 16px",
                fontSize: "0.85rem",
                fontWeight: "bold",
                backgroundColor: viewMode === 'liste' ? "#4CAF50" : "#666",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.2s"
              }}
            >
              📋 Liste
            </button>
            <button
              onClick={() => {
                setViewMode('kompakt');
                setShowOldRecords(false);
              }}
              style={{
                padding: "8px 16px",
                fontSize: "0.85rem",
                fontWeight: "bold",
                backgroundColor: viewMode === 'kompakt' ? "#4CAF50" : "#666",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.2s"
              }}
            >
              🔢 Kompakt
            </button>
            <button
              onClick={() => {
                setViewMode('ozet');
                setShowOldRecords(false);
              }}
              style={{
                padding: "8px 16px",
                fontSize: "0.85rem",
                fontWeight: "bold",
                backgroundColor: viewMode === 'ozet' ? "#2196F3" : "#666",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.2s"
              }}
            >
              📊 Özet
            </button>
          </div>
          <button
            onClick={() => {
              if (!showOldRecords) {
                loadOldLocos();
              }
              setShowOldRecords(!showOldRecords);
            }}
            style={{
              padding: "8px 16px",
              fontSize: "0.85rem",
              fontWeight: "bold",
              backgroundColor: showOldRecords ? "#800020" : "#666",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              whiteSpace: "nowrap"
            }}
          >
            📜 Eski Kayıtlar
          </button>
        </div>
      </div>

      {/* Eski Kayıtlar Listesi */}
      {showOldRecords && (
        <div style={{
          marginBottom: "30px",
          padding: "20px",
          backgroundColor: "#f9f9f9",
          borderRadius: "12px",
          border: "2px solid #800020"
        }}>
          <h3 style={{
            marginTop: 0,
            marginBottom: "20px",
            fontSize: "1.2rem",
            fontWeight: "bold",
            color: "#800020",
            textAlign: "center"
          }}>
            📜 Depodan Gitmiş Lokomotifler ({oldLocos.length})
          </h3>
          
          {oldLocos.length === 0 ? (
            <div style={{
              textAlign: "center",
              padding: "40px",
              color: "#666",
              fontSize: "1rem"
            }}>
              Eski kayıt bulunamadı
            </div>
          ) : (
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px"
            }}>
              {oldLocos.map((loco) => (
                <div
                  key={loco.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "15px",
                    padding: "12px",
                    backgroundColor: "white",
                    borderRadius: "8px",
                    border: "1px solid #ddd",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
                  }}
                >
                  <div style={{
                    fontSize: "1rem",
                    fontWeight: "bold",
                    color: "#000",
                    flex: "0 0 auto"
                  }}>
                    🚂 {loco.name}
                  </div>
                  <div style={{
                    fontSize: "0.85rem",
                    color: "#666",
                    flex: 1,
                    textAlign: "right",
                    lineHeight: "1.4"
                  }}>
                    {loco.notes && loco.notes.trim() ? (
                      <span dangerouslySetInnerHTML={{ __html: formatNotesWithStyles(loco.notes) }}></span>
                    ) : "-"}
                  </div>
                  <div style={{
                    fontSize: "0.75rem",
                    color: "#999",
                    flex: "0 0 auto",
                    marginLeft: "10px",
                    whiteSpace: "nowrap"
                  }}>
                    📅 {formatDate(loco.updated_at)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!showOldRecords && viewMode === 'kompakt' ? (
        // Kompakt Görünüm - Gruplara ayrılmış lokomotifler
        (() => {
          const statusColorMap = {
            faal: "#4CAF50",
            cari_tamir: "#FF9800",
            bakimda: "#2196F3",
            gayri_faal: "#f44336"
          };

          // Lokoları gruplara ayır
          const groups = {
            '110': [],
            '24': [],
            '15': [],
            '22-33': [] // 22 ve 33 ile başlayanlar
          };

          locos.forEach((loco) => {
            const name = loco.name.toString();
            if (name.startsWith('110')) {
              groups['110'].push(loco);
            } else if (name.startsWith('24')) {
              groups['24'].push(loco);
            } else if (name.startsWith('15')) {
              groups['15'].push(loco);
            } else if (name.startsWith('22') || name.startsWith('33')) {
              groups['22-33'].push(loco);
            }
          });

          // Grupları sırala (110, 24, 15, 22-33)
          const groupOrder = ['110', '24', '15', '22-33'];

          // Her grubu 3'erli sütunlara böl
          const renderGroupColumns = (groupLocos) => {
            const columns = [];
            for (let i = 0; i < groupLocos.length; i += 3) {
              columns.push(groupLocos.slice(i, i + 3));
            }
            return columns;
          };

          return (
            <div style={{
              display: "flex",
              gap: "20px",
              justifyContent: "center",
              flexWrap: "wrap",
              padding: "10px"
            }}>
              {groupOrder.map((groupKey) => {
                const groupLocos = groups[groupKey];
                if (groupLocos.length === 0) return null;

                const columns = renderGroupColumns(groupLocos);

                return (
                  <div
                    key={groupKey}
                    style={{
                      display: "flex",
                      gap: "20px",
                      alignItems: "flex-start"
                    }}
                  >
                    {columns.map((column, colIndex) => (
                      <div
                        key={colIndex}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "10px",
                          alignItems: "center"
                        }}
                      >
                        {column.map((loco) => {
                          const isSelected = selectedLocoDetail && selectedLocoDetail.id === loco.id;
                          return (
                            <div
                              key={loco.id}
                              onClick={() => setSelectedLocoDetail(loco)}
                              style={{
                                padding: "12px 20px",
                                fontSize: "1rem",
                                fontWeight: isSelected ? "700" : "bold",
                                backgroundColor: statusColorMap[loco.status] || "#666",
                                color: isSelected ? "#000" : "white",
                                borderRadius: "8px",
                                boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                                cursor: "pointer",
                                transition: "all 0.2s",
                                whiteSpace: "nowrap"
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
                    ))}
                  </div>
                );
              })}
            </div>
          );
        })()
      ) : !showOldRecords && (viewMode === 'liste' || viewMode === 'ozet') ? (
        // Normal Liste Görünümü veya Özet Görünümü
        locos.map((loco) => {
          return (
            <div
              key={loco.id}
              style={{
                border: "2px solid #ccc",
                borderLeft: `8px solid ${statusColor(loco.status)}`,
                borderRadius: "8px",
                marginBottom: viewMode === 'ozet' ? "8px" : "15px",
                boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                overflow: "visible",
                position: "relative"
              }}
            >
            {/* Lokomotif Bilgisi */}
            <div 
              style={{
                padding: viewMode === 'ozet' ? "8px 12px" : "15px",
                backgroundColor: "#f9f9f9",
                overflow: "visible"
              }}
            >
              {/* Loko Adı, Özel Durumlar ve Sil Butonu */}
              {viewMode === 'ozet' ? (
                <div style={{ 
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "10px",
                  position: "relative"
                }}>
                  <div style={{ position: "relative", flex: "0 0 auto" }}>
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        setOzetStatusPopup(ozetStatusPopup === loco.id ? null : loco.id);
                      }}
                      style={{ 
                        fontSize: "1rem",
                        fontWeight: "bold",
                        color: "#000",
                        cursor: "pointer",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        transition: "background-color 0.2s"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#e3f2fd";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      🚂 {loco.name}
                    </div>
                    
                    {/* Özet görünümünde durum popup'ı */}
                    {ozetStatusPopup === loco.id && (
                      <div style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        marginTop: "8px",
                        backgroundColor: "white",
                        borderRadius: "12px",
                        padding: "12px",
                        boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
                        zIndex: 4000,
                        border: "2px solid #e0e0e0",
                        minWidth: "200px"
                      }}
                      onClick={(e) => e.stopPropagation()}
                      >
                        <div style={{ 
                          display: "flex",
                          gap: "5px",
                          flexDirection: "column"
                        }}>
                          <div style={{ position: "relative", width: "100%" }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (loco.status === "faal") {
                                  setOpenFaalPopup(openFaalPopup === loco.id ? null : loco.id);
                                } else {
                                  changeStatus(loco.id, "faal", null, "bakimsiz");
                                  setOpenFaalPopup(loco.id);
                                }
                                setOzetStatusPopup(null);
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
                              setOzetStatusPopup(null);
                            }}
                            style={{
                              width: "100%",
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
                          <div style={{ position: "relative", width: "100%" }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isBakimda(loco.status)) {
                                  setOpenKbPopup(openKbPopup === loco.id ? null : loco.id);
                                } else {
                                  const defaultKb = is110Series(loco.name) ? "s1" : "kb1";
                                  changeStatus(loco.id, "bakimda", defaultKb);
                                  setOpenKbPopup(loco.id);
                                }
                                setOzetStatusPopup(null);
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
                                  ({formatKbType(loco.kb_type, loco.name)})
                                </span>
                              )}
                            </button>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              changeStatus(loco.id, "gayri_faal");
                              setOzetStatusPopup(null);
                            }}
                            style={{
                              width: "100%",
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
                    )}
                  </div>
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditNotes(loco);
                      setOzetStatusPopup(null);
                    }}
                    style={{ 
                      fontSize: "0.85rem",
                      color: "#666",
                      flex: 1,
                      textAlign: "right",
                      lineHeight: "1.4",
                      cursor: "pointer",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      transition: "background-color 0.2s"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#e3f2fd";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                    dangerouslySetInnerHTML={{ __html: loco.notes && loco.notes.trim() ? formatNotesWithStyles(loco.notes) : "-" }}
                  >
                  </div>
                  <div style={{ display: "flex", gap: "4px", flexShrink: 0, alignItems: "center" }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOzetStatusPopup(null);
                        setActionSheetLoco({ ...loco, action: 'gone' });
                      }}
                      title="Depodan Gitmiş"
                      style={{
                        padding: "4px 6px",
                        fontSize: "1rem",
                        lineHeight: 1,
                        backgroundColor: "#FF9800",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer"
                      }}
                    >
                      🚂
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOzetStatusPopup(null);
                        setActionSheetLoco({ ...loco, action: 'delete' });
                      }}
                      title="Sil"
                      style={{
                        padding: "4px 6px",
                        fontSize: "1rem",
                        lineHeight: 1,
                        backgroundColor: "#f44336",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer"
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ) : (
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
              )}
              
              {/* Durum Switch/Tab - Özet görünümde gizle */}
              {viewMode !== 'ozet' && (
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
                        const defaultKb = is110Series(loco.name) ? "s1" : "kb1";
                        changeStatus(loco.id, "bakimda", defaultKb);
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
                        ({formatKbType(loco.kb_type, loco.name)})
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
              )}

            </div>

            {/* Notlar - Özet görünümde gösterilmiyor, yukarıda gösteriliyor */}
            {viewMode !== 'ozet' && (
              <>
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
                    dangerouslySetInnerHTML={{ __html: formatNotesWithStyles(loco.notes) }}
                    >
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
              </>
            )}
          </div>
        );
        })
      ) : null}

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
          zIndex: 4000,
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
              
              <button
                onClick={() => {
                  const currentText = editNotesText.trim();
                  const newText = currentText ? `${currentText} Takip:` : "Takip:";
                  setEditNotesText(newText);
                }}
                style={{
                  padding: "6px 12px",
                  borderRadius: "4px",
                  backgroundColor: "#800020",
                  color: "white",
                  fontSize: "0.7rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  border: "1px solid #5C0015",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                  whiteSpace: "nowrap"
                }}
              >
                Takip:
              </button>
              
              <button
                onClick={() => {
                  const currentText = editNotesText.trim();
                  const newText = currentText ? `${currentText} Marş Yapma` : "Marş Yapma";
                  setEditNotesText(newText);
                }}
                style={{
                  padding: "6px 12px",
                  borderRadius: "4px",
                  backgroundColor: "#000000",
                  color: "white",
                  fontSize: "0.7rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  border: "1px solid #333333",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                  whiteSpace: "nowrap"
                }}
              >
                Marş Yapma
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

      {/* WhatsApp Paylaş Butonu - Kompakt görünümde gizle */}
      {viewMode !== 'kompakt' && (
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
      )}

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
            zIndex: 4000,
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
              {(() => {
                const loco = locos.find(l => l.id === openKbPopup);
                const is110 = is110Series(loco?.name);
                const options = is110 ? ["s1", "s2", "s3"] : ["kb1", "kb2", "kb3"];
                
                return options.map((kb) => {
                  const currentKbType = loco?.kb_type;
                  // Seçim kontrolü: direkt eşleşme veya eski veri formatından dönüşüm
                  let isSelected = currentKbType === kb;
                  if (!isSelected && currentKbType) {
                    // Eğer 110 serisi ise ve mevcut kb_type kb1/kb2/kb3 formatında ise
                    if (is110 && currentKbType.startsWith('kb')) {
                      isSelected = currentKbType.replace('kb', 's') === kb;
                    }
                    // Eğer 110 serisi değilse ve mevcut kb_type s1/s2/s3 formatında ise
                    else if (!is110 && currentKbType.startsWith('s')) {
                      isSelected = currentKbType.replace('s', 'kb') === kb;
                    }
                  }
                  
                  return (
                    <button
                      key={kb}
                      onClick={async () => {
                        await changeStatus(openKbPopup, "bakimda", kb);
                        setOpenKbPopup(null);
                      }}
                      style={{
                        padding: "18px",
                        fontSize: "1.1rem",
                        fontWeight: "bold",
                        border: isSelected ? "3px solid #1976d2" : "2px solid #90caf9",
                        borderRadius: "12px",
                        backgroundColor: isSelected ? "#bbdefb" : "#e3f2fd",
                        color: isSelected ? "#0d47a1" : "#1976d2",
                        cursor: "pointer",
                        transition: "all 0.2s"
                      }}
                    >
                      {formatKbType(kb, loco?.name)}
                    </button>
                  );
                });
              })()}
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
            zIndex: 4000,
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
            zIndex: 5000,
            padding: "20px"
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "white",
              borderRadius: "16px",
              padding: "25px",
              maxWidth: "90vw",
              width: "100%",
              boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
              maxHeight: "90vh",
              height: "90vh",
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
              style={{
                flex: 1,
                minHeight: "60vh",
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

      {/* Kompakt Görünüm Lokomotif Detay Modal - Eski kayıtlar açıkken gizle */}
      {viewMode === 'kompakt' && !showOldRecords && selectedLocoDetail && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "transparent",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            zIndex: 3000,
            padding: "20px",
            paddingBottom: "40px",
            overflowY: "auto",
            pointerEvents: "none"
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "white",
              borderRadius: "16px",
              padding: "20px",
              maxWidth: "600px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
              position: "relative",
              pointerEvents: "auto"
            }}
          >

            {/* Lokomotif Kartı - Liste görünümündeki gibi */}
            <div
              style={{
                border: "2px solid #ccc",
                borderLeft: `8px solid ${statusColor(selectedLocoDetail.status)}`,
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
                    🚂 {selectedLocoDetail.name}
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActionSheetLoco({ ...selectedLocoDetail, action: 'gone' });
                      setSelectedLocoDetail(null);
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
                      setActionSheetLoco({ ...selectedLocoDetail, action: 'delete' });
                      setSelectedLocoDetail(null);
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
                        if (selectedLocoDetail.status === "faal") {
                          setOpenFaalPopup(openFaalPopup === selectedLocoDetail.id ? null : selectedLocoDetail.id);
                        } else {
                          changeStatus(selectedLocoDetail.id, "faal", null, "bakimsiz");
                          setOpenFaalPopup(selectedLocoDetail.id);
                        }
                      }}
                      style={{
                        width: "100%",
                        padding: "12px",
                        fontSize: "0.75rem",
                        fontWeight: "bold",
                        border: selectedLocoDetail.status === "faal" ? "3px solid green" : "2px solid #ddd",
                        borderRadius: "8px",
                        backgroundColor: selectedLocoDetail.status === "faal" ? "#e8f5e9" : "white",
                        color: selectedLocoDetail.status === "faal" ? "green" : "#666",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        position: "relative"
                      }}
                    >
                      🟢 Faal
                      {selectedLocoDetail.status === "faal" && selectedLocoDetail.faal_sub_status && (
                        <span style={{
                          position: "absolute",
                          bottom: "2px",
                          right: "4px",
                          fontSize: "0.6rem",
                          fontWeight: "600",
                          color: selectedLocoDetail.faal_sub_status === "bakimsiz" ? "#E65100" : 
                                 selectedLocoDetail.faal_sub_status === "bakiliyor" ? "#F57C00" : 
                                 "#2E7D32"
                        }}>
                          ({selectedLocoDetail.faal_sub_status === "bakimsiz" ? "Bakımsız" : selectedLocoDetail.faal_sub_status === "bakiliyor" ? "Bakılıyor" : "Hazır"})
                        </span>
                      )}
                    </button>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      changeStatus(selectedLocoDetail.id, "cari_tamir");
                    }}
                    style={{
                      flex: 1,
                      padding: "12px",
                      fontSize: "0.75rem",
                      fontWeight: "bold",
                      border: selectedLocoDetail.status === "cari_tamir" ? "3px solid orange" : "2px solid #ddd",
                      borderRadius: "8px",
                      backgroundColor: selectedLocoDetail.status === "cari_tamir" ? "#fff3e0" : "white",
                      color: selectedLocoDetail.status === "cari_tamir" ? "orange" : "#666",
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
                        if (isBakimda(selectedLocoDetail.status)) {
                          setOpenKbPopup(openKbPopup === selectedLocoDetail.id ? null : selectedLocoDetail.id);
                        } else {
                          const defaultKb = is110Series(selectedLocoDetail.name) ? "s1" : "kb1";
                          changeStatus(selectedLocoDetail.id, "bakimda", defaultKb);
                          setOpenKbPopup(selectedLocoDetail.id);
                        }
                      }}
                      style={{
                        width: "100%",
                        padding: "12px",
                        fontSize: "0.75rem",
                        fontWeight: "bold",
                        border: isBakimda(selectedLocoDetail.status) ? "3px solid blue" : "2px solid #ddd",
                        borderRadius: "8px",
                        backgroundColor: isBakimda(selectedLocoDetail.status) ? "#e3f2fd" : "white",
                        color: isBakimda(selectedLocoDetail.status) ? "blue" : "#666",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        position: "relative"
                      }}
                    >
                      🔵 Bakımda
                      {isBakimda(selectedLocoDetail.status) && selectedLocoDetail.kb_type && (
                        <span style={{
                          position: "absolute",
                          bottom: "2px",
                          right: "4px",
                          fontSize: "0.6rem",
                          fontWeight: "600",
                          color: "#1976d2"
                        }}>
                          ({formatKbType(selectedLocoDetail.kb_type, selectedLocoDetail.name)})
                        </span>
                      )}
                    </button>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      changeStatus(selectedLocoDetail.id, "gayri_faal");
                    }}
                    style={{
                      flex: 1,
                      padding: "12px",
                      fontSize: "0.75rem",
                      fontWeight: "bold",
                      border: selectedLocoDetail.status === "gayri_faal" ? "3px solid red" : "2px solid #ddd",
                      borderRadius: "8px",
                      backgroundColor: selectedLocoDetail.status === "gayri_faal" ? "#ffebee" : "white",
                      color: selectedLocoDetail.status === "gayri_faal" ? "red" : "#666",
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    🔴 Gayri Faal
                  </button>
                </div>
              </div>

              {/* Notlar */}
              {selectedLocoDetail.notes && selectedLocoDetail.notes.trim() ? (
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditNotes(selectedLocoDetail);
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
                  dangerouslySetInnerHTML={{ __html: formatNotesWithStyles(selectedLocoDetail.notes) }}
                  >
                  </div>
                </div>
              ) : (
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditNotes(selectedLocoDetail);
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

              {/* WhatsApp Paylaş Butonu - En Altta */}
              <button
                onClick={() => {
                  openWhatsAppPreview();
                }}
                style={{
                  width: "100%",
                  padding: "18px",
                  fontSize: "1rem",
                  fontWeight: "bold",
                  backgroundColor: "#25D366",
                  color: "white",
                  border: "none",
                  borderRadius: "12px",
                  cursor: "pointer",
                  marginTop: "20px",
                  boxShadow: "0 4px 12px rgba(37, 211, 102, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "12px",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#20BA5A";
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 6px 16px rgba(37, 211, 102, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#25D366";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(37, 211, 102, 0.3)";
                }}
              >
                <span style={{ fontSize: "1.2rem" }}>📱</span>
                WhatsApp'ta Paylaş
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}