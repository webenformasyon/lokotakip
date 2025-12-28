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
          bottom: 20,
          right: 20,
          padding: 20,
          borderRadius: "50%",
          fontSize: 24
        }}
      >
        +
      </button>
    </div>
  );
}