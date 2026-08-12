import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { initStorage } from "./storageShim.js";

// Sets up window.storage — uses Firebase Firestore if src/firebaseConfig.js
// has been filled in, otherwise falls back to localStorage (per-browser only).
initStorage();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
