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
    <div style={{ 
      padding: "20px",
      maxWidth: "800px",
      margin: "0 auto",
      paddingBottom: "100px" // FAB için boşluk
    }}>
      <h2 style={{ 
        fontSize: "clamp(1.5rem, 5vw, 2rem)",
        marginBottom: "1rem"
      }}>
        Lokomotifler
      </h2>
      {locos.map((loco) => (
        <div
          key={loco.id}
          onClick={() => onSelect(loco)}
          style={{
            border: "1px solid #ccc",
            padding: "15px",
            marginBottom: "10px",
            cursor: "pointer",
            borderLeft: `8px solid ${statusColor(loco.status)}`,
            borderRadius: "8px",
            transition: "all 0.2s",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateX(5px)";
            e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.15)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateX(0)";
            e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
          }}
        >
          <div style={{ 
            fontSize: "clamp(1rem, 3vw, 1.2rem)",
            fontWeight: "bold"
          }}>
            {loco.name}
          </div>
          <div style={{ 
            fontSize: "clamp(0.85rem, 2.5vw, 0.95rem)",
            marginTop: "5px",
            opacity: 0.8
          }}>
            Durum: {loco.status.replace("_", " ")}
          </div>
        </div>
      ))}
    </div>
  );
}