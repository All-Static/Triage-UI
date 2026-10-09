// this is what the backend api needs to work with.
// backend keeps each jobs python configuration as { username, url, token }.
// ids are just for the api. grab job names from the urls instead of saving extra yaml fields.
// no build numbers belong in that file. the python tool still receives username, url, token.
// the backend needs to catch duplicate urls and leave the other saved jobs alone.
export interface JenkinsConfiguration { id: string; name: string; username: string; url: string; }
export interface ConfigurationInput { username: string; url: string; token?: string; }

export function normalizeJobUrl(value: string): string {
  const url = new URL(value.trim());
  if (!['http:', 'https:'].includes(url.protocol) || !url.hostname || url.username || url.password || url.search || url.hash)
    throw new Error('Enter an HTTP/HTTPS job URL without credentials, query parameters, or a fragment.');
  // keep just one slash at the end and check that this points to a job, not a build.
  url.pathname = url.pathname.replace(/\/+$/, '') + '/';
  if (!/\/job\/[^/]+\/$/.test(url.pathname))
    throw new Error('Enter the Jenkins job URL ending in /job/job-name/, without a build number.');
  // clean up encoded names so the same url can’t sneak in twice.
  try {
    url.pathname = url.pathname.split('/').map(segment => encodeURIComponent(decodeURIComponent(segment))).join('/');
  } catch { throw new Error('The job URL contains invalid URL encoding.'); }
  return url.toString();
}

// nested jobs still end in /job/name. decode that last name so the labels look right.
export function getJobName(value: string): string {
  const pathname = new URL(normalizeJobUrl(value)).pathname;
  const match = pathname.match(/\/job\/([^/]+)\/$/);
  return decodeURIComponent(match![1]);
}

// keep errors simple so the backend doesn’t accidentally spill the token.
export async function apiRequest(endpoint: string, options?: RequestInit): Promise<unknown> {
  try {
    const response = await fetch(endpoint, { ...options, cache: 'no-store' });
    // vite might send back an html page if the api is missing. that’s not a real save.
    if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) throw new Error();
    return await response.json();
  } catch {
    throw new Error('The backend is unavailable or returned an invalid response. Please try again when the API is connected.');
  }
}

function readConfiguration(value: unknown): JenkinsConfiguration {
  if (!value || typeof value !== 'object' || !('username' in value) || !('url' in value) ||
    !('id' in value) || typeof value.id !== 'string' || !value.id ||
    typeof value.username !== 'string' || !value.username.trim() || typeof value.url !== 'string')
    throw new Error('The backend returned an invalid configuration.');
  try { return { id: value.id, name: getJobName(value.url), username: value.username, url: normalizeJobUrl(value.url) }; }
  catch { throw new Error('The backend returned an invalid configuration.'); }
}

// only change one job at a time so the other yaml entries stay put
export const configurationService = {
  async list(): Promise<JenkinsConfiguration[]> {
    const value = await apiRequest('/api/configurations');
    if (!Array.isArray(value)) throw new Error('Invalid configuration list.');
    const jobs = value.map(readConfiguration);
    if (new Set(jobs.map(job => job.id)).size !== jobs.length || new Set(jobs.map(job => job.url)).size !== jobs.length)
      throw new Error('Duplicate configurations returned by backend.');
    return jobs;
  },
  async save(input: ConfigurationInput, id?: string): Promise<JenkinsConfiguration> {
    const saved = readConfiguration(await apiRequest(id ? '/api/configurations/' + encodeURIComponent(id) : '/api/configurations', {
      method: id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: input.username.trim(), url: normalizeJobUrl(input.url),
        ...(input.token?.trim() ? { token: input.token } : {}) }),
    }));
    if (id && saved.id !== id) throw new Error('Invalid configuration update response.');
    return saved;
  },
  async remove(id: string): Promise<void> {
    const result = await apiRequest('/api/configurations/' + encodeURIComponent(id), { method: 'DELETE' });
    if (!result || typeof result !== 'object' || !('deleted' in result) || result.deleted !== true)
      throw new Error('Deletion was not confirmed.');
  },
};
