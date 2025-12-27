import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export default function LokomotifListesi() {
  const [lokos, setLokos] = useState([]);
  const [yeniLoco, setYeniLoco] = useState("");

  useEffect(() => {
    lokolariGetir();
  }, []);

  async function lokolariGetir() {
    const { data, error } = await supabase.from("lokomotifler").select("*");
    setLokos(data || []);
  }

  async function ekle() {
    if (!yeniLoco) return;

    await supabase.from("lokomotifler").insert({
      ad: yeniLoco,
      durum: "Faal"
    });

    setYeniLoco("");
    lokolariGetir();
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Lokomotifler</h2>

      <div style={{ marginBottom: 20 }}>
        <input
          placeholder="Yeni lokomotif adı"
          value={yeniLoco}
          onChange={(e) => setYeniLoco(e.target.value)}
        />
        <button onClick={ekle}>Ekle</button>
      </div>

      {lokos.map((l) => (
        <div
          key={l.id}
          style={{
            padding: 10,
            marginBottom: 10,
            background:
              l.durum === "Faal"
                ? "#b7f7b7"
                : l.durum === "Cari Tamir"
                ? "#fff3b0"
                : "#ffb0b0",
          }}
        >
          <strong>{l.ad}</strong> — {l.durum}
        </div>
      ))}
    </div>
  );
}