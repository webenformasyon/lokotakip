// src/LocoDetail.jsx
import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export default function LocoDetail({ loco, onBack }) {
  const [logs, setLogs] = useState([]);

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
    const title = prompt("İşlem başlığı:");
    if (!title) return;

    const description = prompt("Açıklama (opsiyonel):");

    await supabase.from("locomotive_logs").insert({
      loco_id: loco.id,
      title,
      description,
      status_after: loco.status
    });

    loadLogs();
  }

  return (
    <div style={{ padding: 20 }}>
      <button onClick={onBack}>← Geri</button>
      <h2>{loco.name}</h2>

      <h3>İşlem Geçmişi</h3>
      <button onClick={addLog} style={{ padding: 10, marginBottom: 20 }}>
        Yeni İşlem Ekle
      </button>

      {logs.map((log) => (
        <div key={log.id} style={{ padding: 12, border: "1px solid #ccc", marginBottom: 10 }}>
          <b>{log.title}</b>
          <div>{log.description}</div>
          <small>{new Date(log.created_at).toLocaleString()}</small>
        </div>
      ))}
    </div>
  );
}