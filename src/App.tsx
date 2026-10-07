import { Link, Navigate, Route, Routes } from "react-router-dom";
import RunTriage from "./pages/RunTriage";
import Results from "./pages/Results";
import Configuration from "./pages/Configuration";
export default function App() {
 return <div className="app"><div className="main-shell" style={{ marginLeft: 0, width: "100%" }}><main>
 {/* Temporary testing links; replaced by the navigation ticket. */}
 <div aria-label="Temporary page links" style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
 <Link className="secondary" to="/">Run Triage</Link><Link className="secondary" to="/results">Results</Link><Link className="secondary" to="/configuration">Configuration</Link>
 </div>
 <Routes><Route path="/" element={<RunTriage />} /><Route path="/results" element={<Results />} /><Route path="/configuration" element={<Configuration />} /><Route path="/settings" element={<Navigate to="/configuration" replace />} /><Route path="*" element={<div className="empty">Page not found</div>} /></Routes>
 </main></div></div>;
}
