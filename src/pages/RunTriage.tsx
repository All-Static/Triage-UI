import { useState } from "react";
import { ArrowRight, Play, LoaderCircle } from "lucide-react";
import { PageHeading, Badge } from "../components/UI";
export default function RunTriage() {
  const [input, setInput] = useState("");
  const [project, setProject] = useState("");
  const running = false;
  const error = "";
  return (
    <>
      <PageHeading
        eyebrow="LEAVING BLANK FOR NOW***"
        title="Run Triage"
        description="ALSO leaving blank"
      />
      <section className="analysis-panel">
        <div className="analysis-intro">
          <span className="analysis-symbol">
            <Play size={21} />
          </span>
          <div>
            <h3>Start with a build</h3>
            <p>
              Retrieve Jenkins data and run the existing ML triage workflow.
            </p>
          </div>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            // Ticket 1: UI only; no triage execution.
          }}
        >
          <label className="field">
            Project
            <input
              value={project}
              onChange={(e) => setProject(e.target.value)}
              placeholder="Enter project"
              disabled={running}
              autoComplete="off"
            />
          </label>
          <label className="field">
            Build Number
            <div className="build-input">
              <span>#</span>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                inputMode="numeric"
                aria-invalid={!!error}
                aria-describedby={error ? "run-error" : undefined}
                placeholder="Enter build number"
                disabled={running}
              />
            </div>
          </label>
          <button className="primary" disabled={running}>
            {running ? (
              <LoaderCircle className="spin" size={17} />
            ) : (
              <Play size={17} />
            )}
            Run Triage{!running && <ArrowRight size={16} />}
          </button>
        </form>
        <div
          className="table-footer"
          style={{ padding: "15px 0 0", border: 0 }}
        >
          <span style={{ color: "var(--green)" }}>Jenkins configuration ↗</span>
        </div>
        {error && (
          <p id="run-error" className="error" role="alert">
            {error}
          </p>
        )}
      </section>
      <div className="section-heading"><div><h2>Run Status</h2><p>Status from the triage operation.</p></div></div>
      <section className="surface detail-section"><div className="result-heading" style={{ margin: 0 }} role="status"><div><Badge tone="blue">Ready</Badge></div></div></section>
    </>
  );
}
