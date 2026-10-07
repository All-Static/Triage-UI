import { useState } from "react";
import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import RunTriage from "./pages/RunTriage";
import Results from "./pages/Results";
import Configuration from "./pages/Configuration";
export default function App() {
 const [menuOpen, setMenuOpen] = useState(false);
 return <div className="app">
 <button type="button" className="secondary workspace-menu-toggle" aria-controls="workspace-navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? "Close menu" : "Menu"}</button>
 <aside className={`sidebar${menuOpen ? " open" : ""}`}>
 <div className="brand">Triage Workspace</div>
 <nav id="workspace-navigation" aria-label="Workspace screens" onClick={() => setMenuOpen(false)}>
 <NavLink to="/" end>Run Triage</NavLink><NavLink to="/results" end>Results</NavLink><NavLink to="/configuration" end>Configuration</NavLink>
 </nav>
 </aside>
 <div className="main-shell"><main>
 <Routes><Route path="/" element={<RunTriage />} /><Route path="/results" element={<Results />} /><Route path="/configuration" element={<Configuration />} /><Route path="/settings" element={<Navigate to="/configuration" replace />} /><Route path="*" element={<div className="empty">Page not found</div>} /></Routes>
 </main></div></div>;
}
