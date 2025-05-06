// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
// Remove direct import of BattleScene here
// import { BattleScene } from "./components/BattleScene";
import { App } from "./App"; // Import the new App component
import './index.css';

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App /> {/* Render the App component */}
  </React.StrictMode>
);