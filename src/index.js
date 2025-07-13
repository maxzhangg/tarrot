import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter, Routes, Route } from "react-router-dom";
import PCPage from "./pages/PCPage";
import MobilePage from "./pages/MobilePage";
import Homepage from "./pages/HomePage";
import MobilePage_ChatHistory from "./pages/MobilePage_ChatHistory";
import { LanguageProvider } from "./context/LanguageProvider"; // ✅ 引入 provider
import "./index.css";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <LanguageProvider> {/* ✅ 包裹整颗树 */}
      <HashRouter>
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/pc" element={<PCPage />} />
          <Route path="/mobile" element={<MobilePage />} />
          <Route path="/mobile/chathistory" element={<MobilePage_ChatHistory />} />
        </Routes>
      </HashRouter>
    </LanguageProvider>
  </React.StrictMode>
);
