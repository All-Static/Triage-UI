import { apiRequest } from './configuration';

export function validateBuildNumber(value: string): string {
  const buildNumber = value.trim();
  if (!/^[1-9]\d*$/.test(buildNumber)) throw new Error('Enter a positive whole build number.');
  return buildNumber;
}

export const triageService = {
  // only send the build number. the backend gets the credentials from the saved YAML
  // it adds /build-number/ to the job url for this run, without changing the YAML
  async run(value: string): Promise<void> {
    const result = await apiRequest('/api/triage', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ build_number: validateBuildNumber(value) }),
    });
    // the backend should return { status: 'completed', results: ... } when its done
    // dont show completed until it actually confirms that
    if (!result || typeof result !== 'object' || !('status' in result) || result.status !== 'completed')
      throw new Error('The backend did not confirm that triage completed.');
  },
};
