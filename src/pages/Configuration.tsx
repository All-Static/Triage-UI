import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { PageHeading } from '../components/UI';
import { configurationService, normalizeJobUrl } from '../services/configuration';
import type { JenkinsConfiguration } from '../services/configuration';
import './Configuration.css';

// grab the name from the job url so we dont need another field
const emptyForm = { username: '', url: '', token: '' };
type Field = keyof typeof emptyForm;
export default function Configuration() {
  const [jobs, setJobs] = useState<JenkinsConfiguration[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [deleteId, setDeleteId] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [showToken, setShowToken] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  // load the saved username and job url but leave the token blank
  useEffect(() => {
    let active = true;
    configurationService.list().then(configurations => {
      if (active) setJobs(configurations);
    }).catch(() => {
      if (active) setError('Jenkins job persistence is not yet implemented or the backend is unavailable. No saved jobs could be loaded.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  function select(id: string) {
    const job = jobs.find(item => item.id === id);
    setSelectedId(id); setDeleteId(''); setShowToken(false); setErrors({}); setMessage('');
    setForm(job ? { username: job.username, url: job.url, token: '' } : emptyForm);
  }
  async function remove(id: string) {
    setSaving(true); setError(''); setMessage('');
    try {
      await configurationService.remove(id);
      setJobs(previous => previous.filter(job => job.id !== id));
      if (selectedId === id) select('');
      setDeleteId(''); setMessage('Jenkins job deleted successfully.');
    } catch { setError('Deletion was not confirmed. The backend is unavailable or returned an error.'); }
    finally { setSaving(false); }
  }
  function change(field: Field, value: string) {
    setForm(previous => ({ ...previous, [field]: value }));
    setErrors(previous => ({ ...previous, [field]: undefined }));
    setMessage('');
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading || saving) return;
    setError(''); setMessage('');
    // check the details first so we dont save the same job twice
    const next: Partial<Record<Field, string>> = {};
    if (!form.username.trim()) next.username = 'Enter your Jenkins username.';
    if (!selectedId && !form.token.trim()) next.token = 'Enter your Jenkins API token.';
    if (!form.url.trim()) next.url = 'Enter the Jenkins job URL.';
    else { try {
      const url = normalizeJobUrl(form.url);
      if (jobs.some(job => job.id !== selectedId && job.url === url)) next.url = 'This Jenkins job is already saved. Select it to edit.';
    } catch (error) { next.url = (error as Error).message; } }
    setErrors(next);
    if (Object.keys(next).length) return;
    setSaving(true);
    try {
      // save when they hit the button then wait for the backend to give the okay
      const saved = await configurationService.save(form, selectedId || undefined);
      // clear out the token once the save goes through
      setJobs(previous => [...previous.filter(job => job.id !== saved.id), saved]);
      setSelectedId(saved.id);
      setForm({ username: saved.username, url: saved.url, token: '' }); setShowToken(false);
      setMessage('Jenkins job saved successfully.');
    } catch {
      setError('Jenkins job was not confirmed saved. The backend is unavailable or returned an error. Please retry when the API is connected.');
    } finally { setSaving(false); }
  }
  return <>
    <PageHeading eyebrow="TRIAGE WORKSPACE" title="Configuration" description="Manage the Jenkins jobs used for triage." />
    <section className="surface detail-section configuration-panel" aria-labelledby="configuration-heading">
      <h2 id="configuration-heading">Jenkins Jobs</h2>
      <p>Enter the job URL without a build number. Changes are sent only when you save. Saved tokens are never displayed. When editing, leave the token blank to keep it.</p>
      <label className="field">Saved Jenkins Jobs
        <select value={selectedId} disabled={loading || saving} onChange={event => select(event.target.value)}>
          <option value="">Add New Job</option>
          {jobs.map(job => <option key={job.id} value={job.id}>{job.name}</option>)}
        </select>
      </label>
      {!loading && !jobs.length && !error && <p>No saved Jenkins jobs yet.</p>}
      <ul className="configuration-list">
        {jobs.map(job => <li key={job.id}>
          <div><strong>{job.name}</strong><div className="muted">{job.url}</div></div>
          <div className="configuration-actions">
            <button type="button" className="secondary" disabled={saving || loading} onClick={() => select(job.id)}>Edit Job</button>
            <button type="button" className="secondary" disabled={saving || loading} onClick={() => setDeleteId(job.id)}>Delete Job</button>
          </div>
          {deleteId === job.id && <div className="configuration-actions">
            <span>Delete this Jenkins job?</span>
            <button type="button" className="secondary" disabled={saving} onClick={() => remove(job.id)}>Confirm Delete Job</button>
            <button type="button" className="secondary" disabled={saving} onClick={() => setDeleteId('')}>Cancel</button>
          </div>}
        </li>)}
      </ul>
      <form onSubmit={save} noValidate className="configuration-form">
        {([['username', 'Jenkins Username'], ['url', 'Jenkins Job URL']] as const).map(([field, label]) =>
          <div className="field" key={field}>
            <label htmlFor={field}>{label} <span aria-hidden="true">*</span></label>
            <input id={field} type={field === 'url' ? 'url' : 'text'} value={form[field]} required disabled={loading || saving}
              autoComplete="off" onChange={event => change(field, event.target.value)} aria-invalid={Boolean(errors[field])}
              aria-describedby={errors[field] ? field + '-error' : undefined} />
            {errors[field] && <span className="error" id={field + '-error'} role="alert">{errors[field]}</span>}
          </div>)}
        <div className="field">
          <label htmlFor="token">Jenkins API Token {!selectedId && <span aria-hidden="true">*</span>}</label>
          <div className="configuration-token">
            <input id="token" type={showToken ? 'text' : 'password'} value={form.token} required={!selectedId} disabled={loading || saving}
              autoComplete="new-password" spellCheck={false} onChange={event => change('token', event.target.value)}
              aria-invalid={Boolean(errors.token)} aria-describedby={errors.token ? 'token-error' : undefined} />
            <button type="button" className="secondary" disabled={loading || saving} aria-controls="token" aria-pressed={showToken}
              onClick={() => setShowToken(previous => !previous)}>{showToken ? 'Hide Token' : 'Show Token'}</button>
          </div>
          {errors.token && <span id="token-error" className="error" role="alert">{errors.token}</span>}
        </div>
        <div className="configuration-actions"><button type="submit" className="primary" disabled={loading || saving}>
          {loading ? 'Loading…' : saving ? 'Saving…' : 'Save Job'}</button></div>
        {error && <div className="error" role="alert">{error}</div>}
        {message && <div className="configuration-success" role="status">{message}</div>}
      </form>
    </section>
  </>;
}
