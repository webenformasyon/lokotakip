// src/App.jsx
import { useState } from "react";
import Home from "./Home";
import AddLoco from "./AddLoco";
import LocoDetail from "./LocoDetail";

export default function App() {
  const [screen, setScreen] = useState("home");
  const [selected, setSelected] = useState(null);

  if (screen === "add") return <AddLoco onBack={() => setScreen("home")} />;
  if (screen === "detail") return <LocoDetail loco={selected} onBack={() => setScreen("home")} />;

  return (
    <div>
      <Home onSelect={(loco) => { setSelected(loco); setScreen("detail"); }} />

      <button
        onClick={() => setScreen("add")}
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          width: "60px",
          height: "60px",
          padding: "0",
          borderRadius: "50%",
          fontSize: "28px",
          fontWeight: "bold",
          backgroundColor: "#FF6B35",
          color: "white",
          border: "none",
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.3s",
          zIndex: 1000
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.1)";
          e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.4)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";
        }}
      >
        +
      </button>
    </div>
  );
}