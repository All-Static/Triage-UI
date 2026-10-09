import { apiRequest, normalizeJobUrl } from './configuration';

export function validateBuildNumber(value: string): string {
  const buildNumber = value.trim();
  if (!/^[1-9]\d*$/.test(buildNumber)) throw new Error('Enter a positive whole build number.');
  return buildNumber;
}

// this build url is just for the run dont save it over the job url
export function constructBuildUrl(jobUrl: string, value: string): string {
  return normalizeJobUrl(jobUrl) + validateBuildNumber(value) + '/';
}

export const triageService = {
  // send the configuration id and build number the backend gets the credentials from the saved yaml
  // it adds build number to the job url for this run without changing the yaml
  async run(configurationId: string, value: string): Promise<void> {
    const result = await apiRequest('/api/triage', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ configuration_id: configurationId, build_number: validateBuildNumber(value) }),
    });
    // the backend should return status completed results when its done
    // dont call it completed until the backend says its done
    if (!result || typeof result !== 'object' || !('status' in result) || result.status !== 'completed')
      throw new Error('The backend did not confirm that triage completed.');
  },
};
