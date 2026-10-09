import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { PageHeading } from '../components/UI';
import { configurationService, normalizeJobUrl } from '../services/configuration';
import './Configuration.css';

// just the three values the python tool needs in its YAML file
const emptyForm = { username: '', url: '', token: '' };
type Field = keyof typeof emptyForm;
export default function Configuration() {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [showToken, setShowToken] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  // load the saved username and job url. keep the token field blank
  useEffect(() => {
    let active = true;
    configurationService.get().then(configuration => {
      if (active && configuration) setForm({ ...configuration, token: '' });
    }).catch(() => {
      if (active) setError('Unable to load configuration. The configuration backend is unavailable. You can enter details and retry saving.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  function change(field: Field, value: string) {
    setForm(previous => ({ ...previous, [field]: value }));
    setErrors(previous => ({ ...previous, [field]: undefined }));
    setMessage('');
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading || saving) return;
    setError(''); setMessage('');
    // check all three fields before sending anything to the backend.
    const next: Partial<Record<Field, string>> = {};
    if (!form.username.trim()) next.username = 'Enter your Jenkins username.';
    if (!form.token.trim()) next.token = 'Enter your Jenkins API token.';
    if (!form.url.trim()) next.url = 'Enter the Jenkins job URL.';
    else { try { normalizeJobUrl(form.url); } catch (error) { next.url = (error as Error).message; } }
    setErrors(next);
    if (Object.keys(next).length) return;
    setSaving(true);
    try {
      // only save when the button is clicked and wait for the backend to confirm it
      const saved = await configurationService.save(form);
      // clear the token from the form once the save succeeds
      setForm({ ...saved, token: '' }); setShowToken(false);
      setMessage('Configuration saved successfully.');
    } catch {
      setError('Configuration was not confirmed saved. The backend is unavailable or returned an error. Please retry when the API is connected.');
    } finally { setSaving(false); }
  }
  return <>
    <PageHeading eyebrow="TRIAGE WORKSPACE" title="Configuration" description="Configure the Jenkins job used for triage." />
    <section className="surface detail-section configuration-panel" aria-labelledby="configuration-heading">
      <h2 id="configuration-heading">Jenkins configuration</h2>
      <p>Enter the job URL without a build number. Changes are sent only when you save. Reenter the token when saving changes; saved tokens are never displayed.</p>
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
          <label htmlFor="token">Jenkins API Token <span aria-hidden="true">*</span></label>
          <div className="configuration-token">
            <input id="token" type={showToken ? 'text' : 'password'} value={form.token} required disabled={loading || saving}
              autoComplete="new-password" spellCheck={false} onChange={event => change('token', event.target.value)}
              aria-invalid={Boolean(errors.token)} aria-describedby={errors.token ? 'token-error' : undefined} />
            <button type="button" className="secondary" disabled={loading || saving} aria-controls="token" aria-pressed={showToken}
              onClick={() => setShowToken(previous => !previous)}>{showToken ? 'Hide Token' : 'Show Token'}</button>
          </div>
          {errors.token && <span id="token-error" className="error" role="alert">{errors.token}</span>}
        </div>
        <div className="configuration-actions"><button type="submit" className="primary" disabled={loading || saving}>
          {loading ? 'Loading…' : saving ? 'Saving…' : 'Save Configuration'}</button></div>
        {error && <div className="error" role="alert">{error}</div>}
        {message && <div className="configuration-success" role="status">{message}</div>}
      </form>
    </section>
  </>;
}
