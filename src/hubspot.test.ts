import { describe, expect, it, vi } from 'vitest';
import { buildSubmission, hubspotEnabled, isValidEmail, submissionUrl, submitLead } from './hubspot';
import type { RoundSummary } from './rules/scoring';

const target = { portalId: '123', formGuid: 'abc-def' };
const summary: RoundSummary = { stars: 8, maxStars: 10, efficiency: 97, points: 2330, hoursSaved: 0.8, title: 'Pro' };
const page = { pageUri: 'https://bomdata.io/margin-mower/', pageName: 'Margin Mower' };
const lead = { firstName: 'Pat', company: 'GreenCo', email: 'pat@greenco.com' };

describe('hubspotEnabled', () => {
  it('needs both a portal ID and a form GUID', () => {
    expect(hubspotEnabled(target)).toBe(true);
    expect(hubspotEnabled({ portalId: '', formGuid: 'abc' })).toBe(false);
    expect(hubspotEnabled({ portalId: '123', formGuid: '  ' })).toBe(false);
  });
});

describe('isValidEmail', () => {
  it('accepts normal addresses and rejects junk', () => {
    expect(isValidEmail('pat@greenco.com')).toBe(true);
    expect(isValidEmail('  pat@greenco.com ')).toBe(true);
    expect(isValidEmail('pat@greenco')).toBe(false);
    expect(isValidEmail('not an email')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });
});

describe('buildSubmission', () => {
  it('maps trimmed lead fields and the score to HubSpot contact fields', () => {
    expect(buildSubmission({ firstName: ' Pat ', company: 'GreenCo', email: 'pat@greenco.com ' }, summary, page)).toEqual({
      fields: [
        { objectTypeId: '0-1', name: 'firstname', value: 'Pat' },
        { objectTypeId: '0-1', name: 'company', value: 'GreenCo' },
        { objectTypeId: '0-1', name: 'email', value: 'pat@greenco.com' },
        { objectTypeId: '0-1', name: 'margin_mower_score', value: '2330' },
        { objectTypeId: '0-1', name: 'margin_mower_stars', value: '8' },
      ],
      context: page,
    });
  });
});

describe('submitLead', () => {
  const submission = buildSubmission(lead, summary, page);

  it('posts JSON to the HubSpot forms endpoint', async () => {
    const fetchFn = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => new Response(null, { status: 200 }));
    await expect(submitLead(target, submission, fetchFn)).resolves.toBe(true);
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe('https://api.hsforms.com/submissions/v3/integration/submit/123/abc-def');
    expect(init?.method).toBe('POST');
    expect(JSON.parse(String(init?.body))).toEqual(submission);
  });

  it('returns false on an error status', async () => {
    const fetchFn = vi.fn(async () => new Response(null, { status: 400 }));
    await expect(submitLead(target, submission, fetchFn)).resolves.toBe(false);
  });

  it('returns false when the network fails', async () => {
    const fetchFn = vi.fn(async () => {
      throw new TypeError('offline');
    });
    await expect(submitLead(target, submission, fetchFn)).resolves.toBe(false);
  });

  it('encodes the IDs in the URL', () => {
    expect(submissionUrl({ portalId: '1 2', formGuid: 'a/b' })).toBe(
      'https://api.hsforms.com/submissions/v3/integration/submit/1%202/a%2Fb',
    );
  });
});
