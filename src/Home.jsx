// src/Home.jsx
import { useEffect, useRef, useState } from "react";
import { supabase } from "./supabase";

export default function Home() {
  const [locos, setLocos] = useState([]);
  const [editingLoco, setEditingLoco] = useState(null);
  const [editNotesText, setEditNotesText] = useState("");
  const [isSavingHistory, setIsSavingHistory] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [hasMoreHistory, setHasMoreHistory] = useState(false);
  const [noteHistory, setNoteHistory] = useState([]);
  const [historySaveError, setHistorySaveError] = useState("");
  const [historyDeleteTarget, setHistoryDeleteTarget] = useState(null);
  const [historyDeletePassword, setHistoryDeletePassword] = useState("");
  const [historyDeleteError, setHistoryDeleteError] = useState("");
  const [isDeletingHistory, setIsDeletingHistory] = useState(false);
  const [openKbPopup, setOpenKbPopup] = useState(null); // Hangi lokomotifin KB popup'ı açık
  const [openFaalPopup, setOpenFaalPopup] = useState(null); // Hangi lokomotifin Faal popup'ı açık
  const [actionSheetLoco, setActionSheetLoco] = useState(null); // Action sheet için lokomotif
  const [actionSheetError, setActionSheetError] = useState("");
  const [whatsappMessage, setWhatsappMessage] = useState(""); // WhatsApp mesajı
  const [showWhatsappPreview, setShowWhatsappPreview] = useState(false); // WhatsApp önizleme
  const [viewMode, setViewMode] = useState(() => {
    // localStorage'dan oku, yoksa "liste" varsayılan
    const saved = localStorage.getItem('lokoViewMode');
    return saved || 'liste';
  }); // Görünüm modu: 'liste', 'kompakt', 'ozet'
  const [selectedLocoDetail, setSelectedLocoDetail] = useState(null); // Kompakt görünümde seçilen lokomotif detayı
  const [showOldRecords, setShowOldRecords] = useState(false); // Eski kayıtlar toggle
  const [showTrainLog, setShowTrainLog] = useState(false);
  const [oldNotesSearch, setOldNotesSearch] = useState("");
  const [oldNotes, setOldNotes] = useState([]);
  const [isLoadingOldNotes, setIsLoadingOldNotes] = useState(false);
  const [hasMoreOldNotes, setHasMoreOldNotes] = useState(true);
  const [oldNotesError, setOldNotesError] = useState("");
  const [trainLogSearch, setTrainLogSearch] = useState("");
  const [trainDepartures, setTrainDepartures] = useState([]);
  const [isLoadingTrainLog, setIsLoadingTrainLog] = useState(false);
  const [hasMoreTrainLog, setHasMoreTrainLog] = useState(true);
  const [trainLogError, setTrainLogError] = useState("");
  const [ozetStatusPopup, setOzetStatusPopup] = useState(null); // Özet görünümünde durum popup'ı için lokomotif ID
  const [isRefreshing, setIsRefreshing] = useState(false);
  const showOldRecordsRef = useRef(showOldRecords);
  const showTrainLogRef = useRef(showTrainLog);
  const editNotesTextareaRef = useRef(null);
  const historyLoadRequestRef = useRef(0);
  const historyLoadingRef = useRef(false);
  const historyNextOffsetRef = useRef(0);
  const historyHasMoreRef = useRef(false);
  const oldNotesRequestIdRef = useRef(0);
  const oldNotesLoadingRef = useRef(false);
  const oldNotesNextPageRef = useRef(0);
  const oldNotesHasMoreRef = useRef(true);
  const oldNotesSentinelRef = useRef(null);
  const loadOldNotesRef = useRef(null);
  const trainLogRequestIdRef = useRef(0);
  const trainLogLoadingRef = useRef(false);
  const trainLogNextPageRef = useRef(0);
  const trainLogHasMoreRef = useRef(true);
  const trainLogSentinelRef = useRef(null);
  const loadTrainLogRef = useRef(null);

  useEffect(() => {
    if (!editingLoco || !editNotesTextareaRef.current) return;

    const textarea = editNotesTextareaRef.current;
    const cursorPosition = textarea.value.length;
    textarea.focus();
    textarea.setSelectionRange(cursorPosition, cursorPosition);
  }, [editingLoco]);

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
      setSelectedLocoDetail((prev) => {
        if (!prev) return prev;
        return sortedData.find((l) => l.id === prev.id) || prev;
      });
    }
  }

  function refreshFromServer() {
    if (showOldRecordsRef.current) {
      loadOldNotes();
    } else if (showTrainLogRef.current) {
      loadTrainLog();
    } else {
      loadLocos();
    }
  }

  async function refreshManually() {
    if (isRefreshing) return;

    setIsRefreshing(true);
    try {
      await Promise.all([
        showOldRecordsRef.current
          ? loadOldNotes()
          : showTrainLogRef.current
            ? loadTrainLog()
            : loadLocos()
      ]);
    } finally {
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    showOldRecordsRef.current = showOldRecords;
  }, [showOldRecords]);

  useEffect(() => {
    showTrainLogRef.current = showTrainLog;
  }, [showTrainLog]);

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

  // Telefon/PWA: uygulama arka plandan dönünce yenile butonuyla aynı veriyi çek
  useEffect(() => {
    function onResume() {
      if (document.visibilityState !== "visible") return;
      refreshFromServer();
    }

    function onPageShow(event) {
      if (event.persisted) {
        onResume();
      }
    }

    document.addEventListener("visibilitychange", onResume);
    window.addEventListener("pageshow", onPageShow);
    window.addEventListener("focus", onResume);

    return () => {
      document.removeEventListener("visibilitychange", onResume);
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("focus", onResume);
    };
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
        if (faalSubStatus === 'yolda') return "Faal (Yolda)";
        return "Faal";
      case "cari_tamir": return "Cari Tamir";
      case "gayri_faal": return "Gayri Faal";
      case "bakimda": return kbType ? `Bakımda (${formatKbType(kbType, locoName)})` : "Bakımda";
      default: return status;
    }
  }

  function whatsappStatusText(loco) {
    if (loco.status === "faal" && loco.faal_sub_status === "hazir") {
      return "Faal";
    }

    return statusText(loco.status, loco.kb_type, loco.faal_sub_status, loco.name);
  }

  function whatsappStatusIcon(status) {
    switch (status) {
      case "faal": return "🟢";
      case "cari_tamir": return "🟡";
      case "gayri_faal": return "🔴";
      case "bakimda": return "🔵";
      default: return "🔹";
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
    const { error } = await supabase.rpc("record_locomotive_train_departure", {
      p_locomotive_id: locoId
    });

    if (error) {
      console.error("Train departure archive error:", error);
      setActionSheetError(`Tren kaydı oluşturulamadı; lokomotif silinmedi. ${error.message}`);
      return false;
    }

    loadLocos();
    return true;
  }

  async function toggleTrain(loco) {
    const train = !loco.train;
    const { error } = await supabase
      .from("locomotives")
      .update({ train })
      .eq("id", loco.id);

    if (error) {
      console.error("Train status update error:", error);
      return;
    }

    setLocos((current) => current.map((item) => item.id === loco.id ? { ...item, train } : item));
    setSelectedLocoDetail((current) => current?.id === loco.id ? { ...current, train } : current);
  }

  function openEditNotes(loco) {
    setEditingLoco(loco);
    setEditNotesText(loco.notes || "");
    setNoteHistory([]);
    setHistorySaveError("");
    loadNoteHistory(loco.name);
  }

  async function loadNoteHistory(locoName, reset = true) {
    if (!reset && (historyLoadingRef.current || !historyHasMoreRef.current)) return;

    const requestId = reset ? ++historyLoadRequestRef.current : historyLoadRequestRef.current;
    if (reset) {
      historyNextOffsetRef.current = 0;
      historyHasMoreRef.current = true;
      setHasMoreHistory(true);
      setNoteHistory([]);
      setHistorySaveError("");
    }

    const offset = historyNextOffsetRef.current;
    const pageSize = 5;
    historyLoadingRef.current = true;
    setIsLoadingHistory(true);

    try {
      const { data, error } = await supabase
        .from("locomotive_note_history")
        .select("id, locomotive_name, note_text, created_at")
        .eq("locomotive_name", locoName)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (requestId !== historyLoadRequestRef.current) return;

      if (error) {
        console.error("History load error:", error);
        setHistorySaveError("Tarihçe yüklenemedi. Veritabanı tablosu ve izinleri kontrol edin.");
        historyHasMoreRef.current = false;
        setHasMoreHistory(false);
      } else {
        const pageData = data || [];
        setNoteHistory((current) => reset ? pageData : [...current, ...pageData]);
        historyNextOffsetRef.current = offset + pageData.length;
        const hasMore = pageData.length === pageSize;
        historyHasMoreRef.current = hasMore;
        setHasMoreHistory(hasMore);
      }
    } catch (error) {
      if (requestId === historyLoadRequestRef.current) {
        console.error("History load error:", error);
        setHistorySaveError("Tarihçe yüklenemedi. Lütfen tekrar deneyin.");
        historyHasMoreRef.current = false;
        setHasMoreHistory(false);
      }
    } finally {
      if (requestId === historyLoadRequestRef.current) {
        historyLoadingRef.current = false;
        setIsLoadingHistory(false);
      }
    }
  }

  function insertNoteText(text, cursorOffset = text.length) {
    const textarea = editNotesTextareaRef.current;
    const start = textarea?.selectionStart ?? editNotesText.length;
    const end = textarea?.selectionEnd ?? start;
    const before = editNotesText.slice(0, start);
    const after = editNotesText.slice(end);
    const prefix = before && !/\s$/.test(before) ? " " : "";
    const suffix = after && !/^\s/.test(after) ? " " : "";
    const updatedText = `${before}${prefix}${text}${suffix}${after}`;
    const cursorPosition = before.length + prefix.length + cursorOffset;

    setEditNotesText(updatedText);
    requestAnimationFrame(() => {
      textarea?.focus();
      textarea?.setSelectionRange(cursorPosition, cursorPosition);
    });
  }

  function insertNoteTextAtStart(text) {
    const textarea = editNotesTextareaRef.current;
    const separator = editNotesText && !/^\s/.test(editNotesText) ? " " : "";
    const updatedText = `${text}${separator}${editNotesText}`;

    setEditNotesText(updatedText);
    requestAnimationFrame(() => {
      textarea?.focus();
      textarea?.setSelectionRange(text.length, text.length);
    });
  }

  function formatNotesWithStyles(text) {
    if (!text) return text;
    
    const specialTexts = [
      { text: "İMDAT", bgColor: "#00897B", color: "white", borderColor: "#00695C", isTakip: false },
      { text: "Soğuk Sevk", bgColor: "#2196F3", color: "white", borderColor: "#1565C0", isTakip: false },
      { text: "Bakım Yaklaşıyor", bgColor: "#FF9800", color: "white", borderColor: "#E65100", isTakip: false },
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

  async function loadOldNotes(reset = true, searchValue = oldNotesSearch) {
    if (!reset && (oldNotesLoadingRef.current || !oldNotesHasMoreRef.current)) return;

    const requestId = reset ? ++oldNotesRequestIdRef.current : oldNotesRequestIdRef.current;
    if (reset) {
      oldNotesNextPageRef.current = 0;
      oldNotesHasMoreRef.current = true;
      setHasMoreOldNotes(true);
      setOldNotes([]);
      setOldNotesError("");
    }

    const page = oldNotesNextPageRef.current;
    const pageSize = 100;
    oldNotesLoadingRef.current = true;
    setIsLoadingOldNotes(true);

    try {
      let query = supabase
        .from("locomotive_note_history")
        .select("id, locomotive_name, note_text, created_at")
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      const search = searchValue.trim();
      if (search) {
        const escapedSearch = search.replace(/[\\%_"]/g, "\\$&");
        query = query.or(
          `locomotive_name.ilike."%${escapedSearch}%",note_text.ilike."%${escapedSearch}%"`
        );
      }

      const { data, error } = await query;
      if (requestId !== oldNotesRequestIdRef.current) return;

      if (error) {
        console.error("Old note history load error:", error);
        setOldNotesError("Lokomotif notları yüklenemedi.");
        oldNotesHasMoreRef.current = false;
        setHasMoreOldNotes(false);
      } else {
        const pageData = data || [];
        setOldNotes((current) => reset ? pageData : [...current, ...pageData]);
        oldNotesNextPageRef.current = page + 1;
        const hasMore = pageData.length === pageSize;
        oldNotesHasMoreRef.current = hasMore;
        setHasMoreOldNotes(hasMore);
      }
    } catch (error) {
      if (requestId === oldNotesRequestIdRef.current) {
        console.error("Old note history load error:", error);
        setOldNotesError("Lokomotif notları yüklenemedi.");
        oldNotesHasMoreRef.current = false;
        setHasMoreOldNotes(false);
      }
    } finally {
      if (requestId === oldNotesRequestIdRef.current) {
        oldNotesLoadingRef.current = false;
        setIsLoadingOldNotes(false);
      }
    }
  }

  loadOldNotesRef.current = loadOldNotes;

  useEffect(() => {
    if (!showOldRecords || !hasMoreOldNotes || isLoadingOldNotes) return;

    const sentinel = oldNotesSentinelRef.current;
    if (!sentinel || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) loadOldNotesRef.current?.(false);
    }, { rootMargin: "240px" });

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [showOldRecords, hasMoreOldNotes, isLoadingOldNotes, oldNotes.length]);

  async function loadTrainLog(reset = true, searchValue = trainLogSearch) {
    if (!reset && (trainLogLoadingRef.current || !trainLogHasMoreRef.current)) return;

    const requestId = reset ? ++trainLogRequestIdRef.current : trainLogRequestIdRef.current;
    if (reset) {
      trainLogNextPageRef.current = 0;
      trainLogHasMoreRef.current = true;
      setHasMoreTrainLog(true);
      setTrainDepartures([]);
      setTrainLogError("");
    }

    const page = trainLogNextPageRef.current;
    const pageSize = 100;
    trainLogLoadingRef.current = true;
    setIsLoadingTrainLog(true);

    try {
      let query = supabase
        .from("locomotive_train_departures")
        .select("locomotive_name, locomotive_created_at, departed_at")
        .order("departed_at", { ascending: false })
        .order("locomotive_name", { ascending: true })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      const search = searchValue.trim();
      if (search) query = query.ilike("locomotive_name", `%${search}%`);

      const { data, error } = await query;
      if (requestId !== trainLogRequestIdRef.current) return;

      if (error) {
        console.error("Train log load error:", error);
        setTrainLogError("Tren kayıtları yüklenemedi.");
        trainLogHasMoreRef.current = false;
        setHasMoreTrainLog(false);
      } else {
        const pageData = data || [];
        setTrainDepartures((current) => reset ? pageData : [...current, ...pageData]);
        trainLogNextPageRef.current = page + 1;
        const hasMore = pageData.length === pageSize;
        trainLogHasMoreRef.current = hasMore;
        setHasMoreTrainLog(hasMore);
      }
    } catch (error) {
      if (requestId === trainLogRequestIdRef.current) {
        console.error("Train log load error:", error);
        setTrainLogError("Tren kayıtları yüklenemedi.");
        trainLogHasMoreRef.current = false;
        setHasMoreTrainLog(false);
      }
    } finally {
      if (requestId === trainLogRequestIdRef.current) {
        trainLogLoadingRef.current = false;
        setIsLoadingTrainLog(false);
      }
    }
  }

  loadTrainLogRef.current = loadTrainLog;

  useEffect(() => {
    if (!showTrainLog || !hasMoreTrainLog || isLoadingTrainLog) return;

    const sentinel = trainLogSentinelRef.current;
    if (!sentinel || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) loadTrainLogRef.current?.(false);
    }, { rootMargin: "240px" });

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [showTrainLog, hasMoreTrainLog, isLoadingTrainLog, trainDepartures.length]);

  function formatHistoryTimestamp(timestamp) {
    const date = new Date(timestamp);
    const dayNames = ["Paz", "Pzt", "Sal", "Çar", "Prş", "Cum", "Cmt"];
    const dayName = dayNames[date.getDay()];
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear()).slice(-2);
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${dayName} ${day}.${month}.${year} ${hours}:${minutes}`;
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

  async function saveNoteToHistory() {
    const trimmedText = editNotesText.trim();
    if (!trimmedText || isSavingHistory) return;

    const requestId = historyLoadRequestRef.current;
    setIsSavingHistory(true);
    setHistorySaveError("");

    try {
      const { error } = await supabase
        .from("locomotive_note_history")
        .insert({ locomotive_name: editingLoco.name, note_text: trimmedText });

      if (error) {
        console.error("History update error:", error);
        setHistorySaveError("Tarihçe kaydedilemedi. Veritabanı tablosu ve izinleri kontrol edin.");
        return;
      }

      if (requestId === historyLoadRequestRef.current) {
        setEditNotesText("");
        loadNoteHistory(editingLoco.name);
      }
    } catch (error) {
      console.error("History update error:", error);
      setHistorySaveError("Tarihçe kaydedilemedi. Lütfen tekrar deneyin.");
    } finally {
      setIsSavingHistory(false);
    }
  }

  async function deleteHistoryEntry() {
    if (historyDeletePassword !== "tcdd") {
      setHistoryDeleteError("Şifre yanlış.");
      return;
    }

    setIsDeletingHistory(true);
    setHistoryDeleteError("");

    try {
      let query = supabase
        .from(historyDeleteTarget.type === "train" ? "locomotive_train_departures" : "locomotive_note_history")
        .delete();

      if (historyDeleteTarget.type === "train") {
        query = query
          .eq("locomotive_name", historyDeleteTarget.locomotive_name)
          .eq("departed_at", historyDeleteTarget.departed_at);
      } else {
        query = query.eq("id", historyDeleteTarget.id);
      }

      const { error } = await query;

      if (error) {
        console.error("History delete error:", error);
        setHistoryDeleteError("Tarihçe kaydı silinemedi.");
        return;
      }

      if (historyDeleteTarget.type === "train") {
        setTrainDepartures((current) => current.filter((entry) =>
          entry.locomotive_name !== historyDeleteTarget.locomotive_name ||
          entry.departed_at !== historyDeleteTarget.departed_at
        ));
      } else {
        setOldNotes((current) => current.filter((entry) => entry.id !== historyDeleteTarget.id));
        if (editingLoco) {
          loadNoteHistory(editingLoco.name);
        } else {
          setNoteHistory((current) => current.filter((entry) => entry.id !== historyDeleteTarget.id));
        }
      }
      setHistoryDeleteTarget(null);
      setHistoryDeletePassword("");
    } catch (error) {
      console.error("History delete error:", error);
      setHistoryDeleteError("Tarihçe kaydı silinemedi. Lütfen tekrar deneyin.");
    } finally {
      setIsDeletingHistory(false);
    }
  }

  function closeNotesPopup() {
    historyLoadRequestRef.current += 1;
    setEditingLoco(null);
    setEditNotesText("");
    setNoteHistory([]);
    setIsLoadingHistory(false);
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
      const status = whatsappStatusText(loco);
      const statusIcon = whatsappStatusIcon(loco.status);
      message += `${statusIcon} *${loco.name}* - ${status}`;
      
      if (loco.notes && loco.notes.trim()) {
        message += `\n   Not: ${loco.notes}`;
      }
      message += `\n`;
    }
    // Boş satırları temizle
    return message.replace(/\n{3,}/g, '\n\n').trim();
  }

  function generateWhatsAppMessageForSingleLoco(loco) {
    const status = whatsappStatusText(loco);
    const statusIcon = whatsappStatusIcon(loco.status);
    let message = `${statusIcon} 🚂 *${loco.name}*\n\n`;
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

  const normalizedOldNotesSearch = oldNotesSearch.trim().toLocaleLowerCase("tr");
  const filteredOldNotes = normalizedOldNotesSearch
    ? oldNotes.filter((entry) =>
        entry.locomotive_name.toLocaleLowerCase("tr").includes(normalizedOldNotesSearch) ||
        entry.note_text.toLocaleLowerCase("tr").includes(normalizedOldNotesSearch)
      )
    : oldNotes;

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
            {showOldRecords
              ? `Tarihçe (${oldNotes.length}${hasMoreOldNotes ? "+" : ""})`
              : showTrainLog
                ? `LOG (${trainDepartures.length}${hasMoreTrainLog ? "+" : ""})`
                : `${locos.length} Lokomotif`}
          </h2>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "10px"
          }}>
            {!showOldRecords && !showTrainLog && <div style={{ 
              fontSize: "0.85rem",
              color: "#666",
              fontWeight: "normal"
            }}>
              {getStatusStats()}
            </div>}
            {/* Yenile Butonu - İstatistiğin sağında */}
            <button
              onClick={refreshManually}
              disabled={isRefreshing}
              aria-label={isRefreshing ? "Yenileniyor" : "Yenile"}
              style={{
                width: "40px",
                height: "40px",
                padding: 0,
                fontSize: "1.2rem",
                backgroundColor: isRefreshing ? "#1976d2" : "#2196F3",
                color: "white",
                border: "none",
                borderRadius: "50%",
                cursor: isRefreshing ? "wait" : "pointer",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                opacity: isRefreshing ? 0.8 : 1
              }}
              onMouseEnter={(e) => {
                if (!isRefreshing) {
                  e.currentTarget.style.transform = "scale(1.08)";
                  e.currentTarget.style.backgroundColor = "#1976d2";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.backgroundColor = isRefreshing ? "#1976d2" : "#2196F3";
              }}
              title={isRefreshing ? "Yenileniyor..." : "Yenile"}
            >
              <span className={isRefreshing ? "refresh-spinner" : ""}>🔄</span>
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
                setShowTrainLog(false);
                showOldRecordsRef.current = false;
                showTrainLogRef.current = false;
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
                setShowTrainLog(false);
                showOldRecordsRef.current = false;
                showTrainLogRef.current = false;
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
                setShowTrainLog(false);
                showOldRecordsRef.current = false;
                showTrainLogRef.current = false;
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
              const nextShowOldRecords = !showOldRecords;
              setShowOldRecords(nextShowOldRecords);
              setShowTrainLog(false);
              showOldRecordsRef.current = nextShowOldRecords;
              showTrainLogRef.current = false;
              if (nextShowOldRecords) loadOldNotes();
              else loadLocos();
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
            📜 Tarihçe
          </button>
          <button
            onClick={() => {
              const nextShowTrainLog = !showTrainLog;
              setShowTrainLog(nextShowTrainLog);
              setShowOldRecords(false);
              showTrainLogRef.current = nextShowTrainLog;
              showOldRecordsRef.current = false;
              if (nextShowTrainLog) loadTrainLog();
              else loadLocos();
            }}
            style={{
              padding: "8px 16px",
              fontSize: "0.85rem",
              fontWeight: "bold",
              backgroundColor: showTrainLog ? "#00897B" : "#666",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              whiteSpace: "nowrap"
            }}
          >
            LOG
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
            📜 Lokomotif Notları ({filteredOldNotes.length}{hasMoreOldNotes ? "+" : ""})
          </h3>

          <input
            type="search"
            value={oldNotesSearch}
            onChange={(event) => {
              const searchValue = event.target.value;
              setOldNotesSearch(searchValue);
              loadOldNotes(true, searchValue);
            }}
            placeholder="Lokomotif no veya notta ara"
            aria-label="Lokomotif numarası veya not içeriğinde ara"
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "11px 12px",
              marginBottom: "16px",
              border: "1px solid #bbb",
              borderRadius: "6px",
              fontSize: "0.9rem"
            }}
          />
          
          {oldNotesError ? (
            <div style={{ textAlign: "center", padding: "24px", color: "#c62828" }}>
              {oldNotesError}
            </div>
          ) : isLoadingOldNotes && oldNotes.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px", color: "#666" }}>
              Notlar yükleniyor...
            </div>
          ) : oldNotes.length === 0 ? (
            <div style={{
              textAlign: "center",
              padding: "40px",
              color: "#666",
              fontSize: "1rem"
            }}>
              Not kaydı bulunamadı
            </div>
          ) : filteredOldNotes.length === 0 ? (
            <div style={{ textAlign: "center", padding: "28px", color: "#666" }}>
              Aramayla eşleşen not bulunamadı
            </div>
          ) : (
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "6px"
            }}>
              {filteredOldNotes.map((entry) => (
                <div
                  key={entry.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(72px, auto) minmax(0, 1fr) 28px auto",
                    alignItems: "start",
                    gap: "10px",
                    padding: "10px 12px",
                    backgroundColor: "white",
                    borderRadius: "8px",
                    border: "1px solid #ddd"
                  }}
                >
                  <div style={{
                    fontSize: "0.9rem",
                    fontWeight: "bold",
                    color: "#000",
                    whiteSpace: "nowrap"
                  }}>
                    🚂 {entry.locomotive_name}
                  </div>
                  <div style={{
                    fontSize: "0.85rem",
                    color: "#222",
                    lineHeight: "1.4",
                    whiteSpace: "pre-wrap",
                    overflowWrap: "anywhere"
                  }}>
                    {entry.note_text}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setHistoryDeleteTarget({ type: "note", id: entry.id });
                      setHistoryDeletePassword("");
                      setHistoryDeleteError("");
                    }}
                    title="Tarihçe kaydını sil"
                    aria-label={`${formatHistoryTimestamp(entry.created_at)} tarihli ${entry.locomotive_name} kaydını sil`}
                    style={{
                      width: "28px",
                      height: "28px",
                      padding: 0,
                      border: "none",
                      borderRadius: "4px",
                      backgroundColor: "transparent",
                      color: "#c62828",
                      fontSize: "1.25rem",
                      lineHeight: 1,
                      cursor: "pointer"
                    }}
                  >
                    ×
                  </button>
                  <div style={{
                    fontSize: "0.75rem",
                    color: "#666",
                    whiteSpace: "nowrap"
                  }}>
                    {formatHistoryTimestamp(entry.created_at)}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div ref={oldNotesSentinelRef} aria-hidden="true" style={{ height: "1px" }} />
          {isLoadingOldNotes && oldNotes.length > 0 && (
            <div style={{ padding: "12px", color: "#666", textAlign: "center", fontSize: "0.8rem" }}>
              Daha fazla not yükleniyor...
            </div>
          )}
          {!hasMoreOldNotes && oldNotes.length > 0 && (
            <div style={{ padding: "8px", color: "#777", textAlign: "center", fontSize: "0.75rem" }}>
              Tüm kayıtlar yüklendi
            </div>
          )}
        </div>
      )}

      {showTrainLog && (
        <div style={{
          marginBottom: "30px",
          padding: "20px",
          backgroundColor: "#f9f9f9",
          borderRadius: "12px",
          border: "2px solid #00897B"
        }}>
          <h3 style={{
            marginTop: 0,
            marginBottom: "20px",
            fontSize: "1.2rem",
            fontWeight: "bold",
            color: "#00695C",
            textAlign: "center"
          }}>
            Tren Gidiş LOG ({trainDepartures.length}{hasMoreTrainLog ? "+" : ""} kayıt)
          </h3>

          <input
            type="search"
            value={trainLogSearch}
            onChange={(event) => {
              const searchValue = event.target.value;
              setTrainLogSearch(searchValue);
              loadTrainLog(true, searchValue);
            }}
            placeholder="Lokomotif no ara"
            aria-label="Tren kayıtlarında lokomotif numarası ara"
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "11px 12px",
              marginBottom: "16px",
              border: "1px solid #bbb",
              borderRadius: "6px",
              fontSize: "0.9rem"
            }}
          />

          {trainLogError ? (
            <div style={{ textAlign: "center", padding: "24px", color: "#c62828" }}>
              {trainLogError}
            </div>
          ) : isLoadingTrainLog && trainDepartures.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px", color: "#666" }}>
              Tren kayıtları yükleniyor...
            </div>
          ) : trainDepartures.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
              Tren kaydı bulunamadı
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              {trainDepartures.map((record) => (
                <div
                  key={`${record.locomotive_name}-${record.departed_at}`}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(64px, auto) minmax(0, 1fr) minmax(0, 1fr) 28px",
                    alignItems: "center",
                    gap: "8px",
                    padding: "9px 10px",
                    backgroundColor: "white",
                    borderRadius: "6px",
                    border: "1px solid #ddd",
                    color: "#333",
                    fontSize: "0.72rem"
                  }}
                >
                  <strong style={{ color: "#111", whiteSpace: "nowrap" }}>
                    🚂 {record.locomotive_name}
                  </strong>
                  <div style={{ overflowWrap: "anywhere" }}>
                    <strong>Eklenme:</strong>{" "}
                    {record.locomotive_created_at
                      ? formatHistoryTimestamp(record.locomotive_created_at)
                      : "Bilinmiyor"}
                  </div>
                  <div style={{ overflowWrap: "anywhere" }}>
                    <strong>Ayrılış:</strong> {formatHistoryTimestamp(record.departed_at)}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setHistoryDeleteTarget({
                        type: "train",
                        locomotive_name: record.locomotive_name,
                        departed_at: record.departed_at
                      });
                      setHistoryDeletePassword("");
                      setHistoryDeleteError("");
                    }}
                    title="LOG kaydını sil"
                    aria-label={`${record.locomotive_name} için ${formatHistoryTimestamp(record.departed_at)} LOG kaydını sil`}
                    style={{
                      width: "28px",
                      height: "28px",
                      padding: 0,
                      border: "none",
                      borderRadius: "4px",
                      backgroundColor: "transparent",
                      color: "#c62828",
                      fontSize: "1.25rem",
                      lineHeight: 1,
                      cursor: "pointer"
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          <div ref={trainLogSentinelRef} aria-hidden="true" style={{ height: "1px" }} />
          {isLoadingTrainLog && trainDepartures.length > 0 && (
            <div style={{ padding: "12px", color: "#666", textAlign: "center", fontSize: "0.8rem" }}>
              Diğer kayıtlar yükleniyor...
            </div>
          )}
          {!hasMoreTrainLog && trainDepartures.length > 0 && (
            <div style={{ padding: "8px", color: "#777", textAlign: "center", fontSize: "0.75rem" }}>
              Tüm kayıtlar yüklendi
            </div>
          )}
        </div>
      )}

      {!showOldRecords && !showTrainLog && viewMode === 'kompakt' ? (
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
      ) : !showOldRecords && !showTrainLog && (viewMode === 'liste' || viewMode === 'ozet') ? (
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
                    <div style={{
                      padding: "0 8px 4px",
                      fontSize: "0.7rem",
                      fontWeight: "600",
                      color: statusColor(loco.status),
                      whiteSpace: "nowrap"
                    }}>
                      {loco.status === "faal" && loco.faal_sub_status === "hazir"
                        ? "Faal"
                        : statusText(loco.status, loco.kb_type, loco.faal_sub_status, loco.name)}
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
                        minWidth: "280px"
                      }}
                      onClick={(e) => e.stopPropagation()}
                      >
                        <div style={{ 
                          display: "flex",
                          gap: "5px",
                          flexDirection: "column"
                        }}>
                          <div>
                            <div style={{
                              marginBottom: "6px",
                              color: "#2E7D32",
                              fontSize: "0.8rem",
                              fontWeight: "bold",
                              textAlign: "center"
                            }}>
                              🟢 Faal
                            </div>
                            <div style={{
                              display: "grid",
                              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                              gap: "4px"
                            }}>
                              {[
                                { value: "bakimsiz", label: "Bakımsız", color: "#FF9800", lightColor: "#FFE0B2", darkColor: "#E65100" },
                                { value: "bakiliyor", label: "Bakılıyor", color: "#FFC107", lightColor: "#FFF9C4", darkColor: "#F57C00" },
                                { value: "hazir", label: "Hazır", color: "#4CAF50", lightColor: "#C8E6C9", darkColor: "#2E7D32" },
                                { value: "yolda", label: "Yolda", color: "#2196F3", lightColor: "#BBDEFB", darkColor: "#1565C0" }
                              ].map((option) => {
                                const isSelected = loco.status === "faal" && loco.faal_sub_status === option.value;
                                return (
                                  <button
                                    key={option.value}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      changeStatus(loco.id, "faal", null, option.value);
                                      setOzetStatusPopup(null);
                                    }}
                                    style={{
                                      minWidth: 0,
                                      padding: "8px 2px",
                                      fontSize: "0.65rem",
                                      fontWeight: "bold",
                                      border: isSelected ? `2px solid ${option.darkColor}` : `1px solid ${option.color}`,
                                      borderRadius: "6px",
                                      backgroundColor: isSelected ? option.lightColor : "white",
                                      color: option.darkColor,
                                      cursor: "pointer",
                                      lineHeight: 1.2
                                    }}
                                  >
                                    {option.label}
                                  </button>
                                );
                              })}
                            </div>
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
                          <div>
                            <div style={{
                              marginBottom: "6px",
                              color: "#1976d2",
                              fontSize: "0.8rem",
                              fontWeight: "bold",
                              textAlign: "center"
                            }}>
                              🔵 Bakımda
                            </div>
                            <div style={{
                              display: "grid",
                              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                              gap: "4px"
                            }}>
                              {(is110Series(loco.name) ? ["s1", "s2", "s3"] : ["kb1", "kb2", "kb3"]).map((kb) => {
                                const isSelected = isBakimda(loco.status) &&
                                  formatKbType(loco.kb_type, loco.name) === formatKbType(kb, loco.name);
                                return (
                                  <button
                                    key={kb}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      changeStatus(loco.id, "bakimda", kb);
                                      setOzetStatusPopup(null);
                                    }}
                                    style={{
                                      minWidth: 0,
                                      padding: "8px 2px",
                                      fontSize: "0.7rem",
                                      fontWeight: "bold",
                                      border: isSelected ? "2px solid #1976d2" : "1px solid #90caf9",
                                      borderRadius: "6px",
                                      backgroundColor: isSelected ? "#bbdefb" : "white",
                                      color: "#1976d2",
                                      cursor: "pointer",
                                      lineHeight: 1.2
                                    }}
                                  >
                                    {formatKbType(kb, loco.name)}
                                  </button>
                                );
                              })}
                            </div>
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
                      textAlign: "left",
                      lineHeight: "1.4",
                      cursor: "pointer",
                      padding: "4px 8px",
                      minHeight: "36px",
                      boxSizing: "border-box",
                      borderRadius: "4px",
                      transition: "background-color 0.2s"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#e3f2fd";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                    dangerouslySetInnerHTML={{ __html: loco.notes && loco.notes.trim() ? formatNotesWithStyles(loco.notes) : "" }}
                  >
                  </div>
                  <div style={{ display: "flex", gap: "4px", flexShrink: 0, alignItems: "center" }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTrain(loco);
                      }}
                      title={loco.train ? "Depoda olarak işaretle" : "Tren gider olarak işaretle"}
                      style={{
                        padding: "4px 6px",
                        fontSize: "0.65rem",
                        fontWeight: "bold",
                        lineHeight: 1.2,
                        backgroundColor: loco.train ? "#FF9800" : "#009688",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        whiteSpace: "nowrap"
                      }}
                    >
                      {loco.train ? "Tren gider" : "Depoda"}
                    </button>
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
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTrain(loco);
                    }}
                    style={{
                      padding: "8px 12px",
                      fontSize: "0.75rem",
                      backgroundColor: loco.train ? "#FF9800" : "#009688",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontWeight: "bold",
                      whiteSpace: "nowrap"
                    }}
                  >
                    {loco.train ? "Tren gider" : "Depoda"}
                  </button>
                  
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
                                 loco.faal_sub_status === "yolda" ? "#1565C0" : "#2E7D32"
                      }}>
                               ({loco.faal_sub_status === "bakimsiz" ? "Bakımsız" : loco.faal_sub_status === "bakiliyor" ? "Bakılıyor" : loco.faal_sub_status === "yolda" ? "Yolda" : "Hazır"})
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
              maxHeight: "90vh",
              overflowY: "auto",
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
            
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "8px" }}>
              <button
                type="button"
                onClick={saveNoteToHistory}
                disabled={!editNotesText.trim() || isSavingHistory}
                style={{
                  padding: "8px 12px",
                  fontSize: "0.75rem",
                  fontWeight: "bold",
                  backgroundColor: isSavingHistory ? "#90a4ae" : "#1976d2",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: !editNotesText.trim() || isSavingHistory ? "not-allowed" : "pointer",
                  opacity: !editNotesText.trim() || isSavingHistory ? 0.7 : 1
                }}
              >
                {isSavingHistory ? "Kaydediliyor..." : "Tarihçeye Kaydet"}
              </button>
            </div>
            <textarea
              ref={editNotesTextareaRef}
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
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setEditNotesText("")}
                style={{
                  padding: "6px 12px",
                  borderRadius: "4px",
                  backgroundColor: "#f44336",
                  color: "white",
                  fontSize: "0.7rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  border: "1px solid #d32f2f",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                  whiteSpace: "nowrap"
                }}
              >
                Temizle
              </button>
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => insertNoteTextAtStart("İMDAT")}
                style={{
                  padding: "6px 12px",
                  borderRadius: "4px",
                  backgroundColor: "#00897B",
                  color: "white",
                  fontSize: "0.7rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  border: "1px solid #00695C",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                  whiteSpace: "nowrap"
                }}
              >
                İMDAT
              </button>
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => insertNoteText("Soğuk Sevk")}
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
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => insertNoteText("Bakım Yaklaşıyor (KB km)", "Bakım Yaklaşıyor (KB".length)}
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
                Bakım Yaklaşıyor
              </button>
              
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => insertNoteText("Malzeme Bekler")}
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
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => insertNoteText("Takip:")}
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
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => insertNoteText("Marş Yapma")}
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
            {historySaveError && (
              <div style={{ marginTop: "10px", color: "#c62828", fontSize: "0.8rem" }} role="alert">
                {historySaveError}
              </div>
            )}
            {(isLoadingHistory || noteHistory.length > 0) && (
              <div style={{ marginTop: "12px", borderTop: "1px solid #ddd", paddingTop: "8px" }}>
                <h4 style={{ margin: "0 0 6px", fontSize: "0.9rem", color: "#222" }}>Tarihçe</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                  {isLoadingHistory && noteHistory.length === 0 && (
                    <div style={{ fontSize: "0.8rem", color: "#666" }}>Yükleniyor...</div>
                  )}
                  {noteHistory.map((entry) => (
                    <div
                      key={entry.id}
                      style={{ paddingBottom: "4px", borderBottom: "1px solid #eee" }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                        <div style={{ flex: 1, minWidth: 0, fontSize: "0.85rem", color: "#222", whiteSpace: "pre-wrap", overflowWrap: "anywhere", lineHeight: "1.35" }}>
                          {entry.note_text}{" "}
                          <span style={{ color: "#555", fontSize: "0.75rem", whiteSpace: "nowrap" }}>
                            ({formatHistoryTimestamp(entry.created_at)})
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setHistoryDeleteTarget({ type: "note", id: entry.id });
                            setHistoryDeletePassword("");
                            setHistoryDeleteError("");
                          }}
                          title="Tarihçe kaydını sil"
                          aria-label={`${formatHistoryTimestamp(entry.created_at)} tarihli kaydı sil`}
                          style={{
                            flex: "0 0 28px",
                            width: "28px",
                            height: "28px",
                            padding: 0,
                            border: "none",
                            borderRadius: "4px",
                            backgroundColor: "transparent",
                            color: "#c62828",
                            fontSize: "1.25rem",
                            lineHeight: 1,
                            cursor: "pointer"
                          }}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {hasMoreHistory && (
                  <button
                    type="button"
                    onClick={() => loadNoteHistory(editingLoco.name, false)}
                    disabled={isLoadingHistory}
                    style={{
                      width: "100%",
                      marginTop: "8px",
                      padding: "9px",
                      border: "1px solid #bbb",
                      borderRadius: "6px",
                      backgroundColor: "#f5f5f5",
                      color: "#333",
                      fontSize: "0.8rem",
                      fontWeight: "600",
                      cursor: isLoadingHistory ? "wait" : "pointer"
                    }}
                  >
                    {isLoadingHistory ? "Yükleniyor..." : "Daha Fazla"}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {historyDeleteTarget !== null && (
        <div
          onClick={(event) => {
            if (event.target === event.currentTarget && !isDeletingHistory) {
              setHistoryDeleteTarget(null);
              setHistoryDeletePassword("");
            }
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 6000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            backgroundColor: "rgba(0,0,0,0.5)"
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="history-delete-title"
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "360px",
              padding: "22px",
              backgroundColor: "white",
              borderRadius: "10px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.3)"
            }}
          >
            <h3 id="history-delete-title" style={{ margin: "0 0 14px", fontSize: "1rem", color: "#222" }}>
              {historyDeleteTarget?.type === "train" ? "LOG kaydını sil" : "Tarihçe kaydını sil"}
            </h3>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                deleteHistoryEntry();
              }}
            >
              <input
                type="password"
                value={historyDeletePassword}
                onChange={(event) => setHistoryDeletePassword(event.target.value)}
                placeholder="Şifre"
                autoFocus
                autoComplete="current-password"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "11px",
                  marginBottom: "10px",
                  border: "1px solid #bbb",
                  borderRadius: "6px",
                  fontSize: "0.9rem"
                }}
              />
              {historyDeleteError && (
                <div role="alert" style={{ marginBottom: "10px", color: "#c62828", fontSize: "0.8rem" }}>
                  {historyDeleteError}
                </div>
              )}
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  disabled={isDeletingHistory}
                  onClick={() => {
                    setHistoryDeleteTarget(null);
                    setHistoryDeletePassword("");
                  }}
                  style={{
                    flex: 1,
                    padding: "11px",
                    border: "none",
                    borderRadius: "6px",
                    backgroundColor: "#eee",
                    color: "#333",
                    cursor: isDeletingHistory ? "wait" : "pointer"
                  }}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isDeletingHistory || !historyDeletePassword}
                  style={{
                    flex: 1,
                    padding: "11px",
                    border: "none",
                    borderRadius: "6px",
                    backgroundColor: "#c62828",
                    color: "white",
                    cursor: isDeletingHistory || !historyDeletePassword ? "not-allowed" : "pointer",
                    opacity: isDeletingHistory || !historyDeletePassword ? 0.7 : 1
                  }}
                >
                  {isDeletingHistory ? "Siliniyor..." : "Sil"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WhatsApp Paylaş Butonu - Kompakt görünümde gizle */}
      {viewMode !== 'kompakt' && !showOldRecords && !showTrainLog && (
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
                { value: "hazir", label: "Hazır", color: "#4CAF50", lightColor: "#C8E6C9", darkColor: "#2E7D32" },
                { value: "yolda", label: "Yolda", color: "#2196F3", lightColor: "#BBDEFB", darkColor: "#1565C0" }
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
                ? `${actionSheetLoco.name} tren kaydına eklenip lokomotif kayıtlarından silinecek. Devam etmek istiyor musunuz?`
                : `${actionSheetLoco.name} lokomotifini kaldırmak istediğinize emin misiniz?`}
            </p>
            {actionSheetError && (
              <p role="alert" style={{ margin: "0 0 16px", color: "#c62828", fontSize: "0.85rem", textAlign: "center" }}>
                {actionSheetError}
              </p>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <button
                onClick={async () => {
                  setActionSheetError("");
                  let completed = true;
                  if (actionSheetLoco.action === 'gone') {
                    completed = await markAsGone(actionSheetLoco.id);
                  } else if (actionSheetLoco.action === 'delete') {
                    deleteLoco(actionSheetLoco.id);
                  }
                  if (completed) setActionSheetLoco(null);
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
      {viewMode === 'kompakt' && !showOldRecords && !showTrainLog && selectedLocoDetail && (
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
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTrain(selectedLocoDetail);
                    }}
                    style={{
                      padding: "8px 12px",
                      fontSize: "0.75rem",
                      backgroundColor: selectedLocoDetail.train ? "#FF9800" : "#009688",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontWeight: "bold",
                      whiteSpace: "nowrap"
                    }}
                  >
                    {selectedLocoDetail.train ? "Tren gider" : "Depoda"}
                  </button>
                  
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
                                 selectedLocoDetail.faal_sub_status === "yolda" ? "#1565C0" : "#2E7D32"
                        }}>
                            ({selectedLocoDetail.faal_sub_status === "bakimsiz" ? "Bakımsız" : selectedLocoDetail.faal_sub_status === "bakiliyor" ? "Bakılıyor" : selectedLocoDetail.faal_sub_status === "yolda" ? "Yolda" : "Hazır"})
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