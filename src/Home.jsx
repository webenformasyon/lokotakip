// src/Home.jsx
import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export default function Home({ onSelect }) {
  const [locos, setLocos] = useState([]);

  async function loadLocos() {
    const { data, error } = await supabase
      .from("locomotives")
      .select("*")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (!error) setLocos(data);
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

  return (
    <div style={{ padding: 20 }}>
      <h2>Lokomotifler</h2>
      {locos.map((loco) => (
        <div
          key={loco.id}
          onClick={() => onSelect(loco)}
          style={{
            border: "1px solid #ccc",
            padding: 15,
            marginBottom: 10,
            cursor: "pointer",
            borderLeft: `8px solid ${statusColor(loco.status)}`
          }}
        >
          <b>{loco.name}</b>
          <div>Durum: {loco.status.replace("_", " ")}</div>
        </div>
      ))}
    </div>
  );
}