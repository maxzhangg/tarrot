import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import PCPage from "./pages/PCPage";
import MobilePage from "./pages/MobilePage";
import Homepage from "./pages/HomePage";
import "./index.css";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/pc" element={<PCPage />} />
        <Route path="/mobile" element={<MobilePage />} />
      </Routes>
    </HashRouter>
  </React.StrictMode>
);
