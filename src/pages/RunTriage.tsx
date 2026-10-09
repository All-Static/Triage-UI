import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Play, LoaderCircle } from 'lucide-react';
import { PageHeading, Badge } from '../components/UI';
import { configurationService } from '../services/configuration';
import type { JenkinsConfiguration } from '../services/configuration';
import { triageService, validateBuildNumber, constructBuildUrl } from '../services/triage';

export default function RunTriage() {
  const [input, setInput] = useState('');
  const [jobs, setJobs] = useState<JenkinsConfiguration[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const configuration = jobs.find(job => job.id === selectedId);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [buildError, setBuildError] = useState('');
  const [completed, setCompleted] = useState(false);
  // grab the saved job so nobody has to type it all in again
  useEffect(() => {
    let active = true;
    configurationService.list().then(saved => { if (active) { setJobs(saved); setSelectedId(saved[0]?.id ?? ''); } })
      .catch(() => { if (active) setLoadError('Unable to load the configured Jenkins job. Configuration persistence is not yet implemented or the backend is unavailable.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  async function run(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // wait for a saved job and dont kick off the same run twice
    if (running || loading || !configuration) return;
    setError(''); setBuildError(''); setCompleted(false);
    // make sure the build number is a positive whole number
    try { validateBuildNumber(input); }
    catch { setBuildError('Enter a positive whole build number.'); return; }
    setRunning(true);
    try { await triageService.run(configuration.id, input); setCompleted(true); }
    catch { setError('Triage did not complete. The backend is unavailable or returned an error. Please try again when the API is connected.'); }
    finally { setRunning(false); }
  }
  // show where this run is headed but leave the saved job url alone
  let buildUrl = '';
  if (configuration && input.trim()) {
    try { buildUrl = constructBuildUrl(configuration.url, input); } catch { /* still typing so dont show a build url just yet */ }
  }
  return <>
    <PageHeading eyebrow="TRIAGE WORKSPACE" title="Run Triage" description="Run triage for a build of your configured Jenkins job." />
    <section className="analysis-panel">
      <div className="analysis-intro"><span className="analysis-symbol"><Play size={21} /></span>
        <div><h3>Start with a build</h3><p>Retrieve Jenkins data and run the existing ML triage workflow.</p></div>
      </div>
      <div style={{ marginBottom: 20, overflowWrap: 'anywhere' }}>
        {loading ? <p role="status">Loading Jenkins configuration…</p> : loadError ?
          <p className="error" role="alert">{loadError} <Link to="/configuration">Open Configuration</Link> to configure the job or retry loading.</p> :
          configuration ? <><p>Configured Jenkins Job: <strong>{configuration.name}</strong></p><p className="muted">{configuration.url}</p></> :
          <p>{jobs.length ? 'Select a saved Jenkins configuration below.' : 'No Jenkins job has been configured.'} <Link to="/configuration">Open Configuration</Link> to save a Jenkins job before running triage.</p>}
      </div>
      <form onSubmit={run} noValidate>
        <label className="field">Jenkins Configuration
          <select value={selectedId} disabled={running || loading || !jobs.length} required
            onChange={event => { setSelectedId(event.target.value); setError(''); setBuildError(''); setCompleted(false); }}>
            <option value="">Select a saved job</option>
            {jobs.map(job => <option key={job.id} value={job.id}>{job.name}</option>)}
          </select>
        </label>
        <label className="field">Build Number
          <div className="build-input"><span aria-hidden="true">#</span>
            <input value={input} onChange={event => { setInput(event.target.value); setBuildError(''); setError(''); setCompleted(false); }}
              inputMode="numeric" required aria-invalid={Boolean(buildError)} aria-describedby={buildError ? 'build-error' : undefined}
              placeholder="Enter build number" disabled={running} />
          </div>
        </label>
        <button type="submit" className="primary" disabled={running || loading || !configuration}>
          {running ? <LoaderCircle className="spin" size={17} /> : <Play size={17} />}
          Run Triage{!running && <ArrowRight size={16} />}
        </button>
      </form>
      {buildUrl && <p style={{ marginTop: 15, overflowWrap: 'anywhere' }}>Target Build URL: {buildUrl}</p>}
      <div className="table-footer" style={{ padding: '15px 0 0', border: 0 }}><Link to="/configuration">Jenkins configuration ↗</Link></div>
      {buildError && <p id="build-error" className="error" role="alert">{buildError}</p>}
      {error && <p className="error" role="alert">{error}</p>}
    </section>
    <div className="section-heading"><div><h2>Run Status</h2><p>Status from the triage operation.</p></div></div>
    <section className="surface detail-section"><div className="result-heading" style={{ margin: 0 }} role="status"><div>
      <Badge tone={error || loadError ? 'red' : completed ? 'green' : 'blue'}>
        {running ? 'Running' : loading ? 'Loading configuration' : error || loadError ? 'Unavailable' : completed ? 'Completed' : configuration ? 'Ready' : 'Configuration required'}
      </Badge>
    </div></div></section>
  </>;
}
