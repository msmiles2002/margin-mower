import type { RoundSummary } from './rules/scoring';

export interface LeadFields {
  firstName: string;
  company: string;
  email: string;
}

export interface HubSpotTarget {
  portalId: string;
  formGuid: string;
}

export interface PageContext {
  pageUri: string;
  pageName: string;
}

export interface HubSpotSubmission {
  fields: { objectTypeId: string; name: string; value: string }[];
  context: PageContext;
}

const CONTACT_OBJECT_TYPE = '0-1';

export function hubspotEnabled(target: HubSpotTarget): boolean {
  return target.portalId.trim() !== '' && target.formGuid.trim() !== '';
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function buildSubmission(lead: LeadFields, summary: RoundSummary, page: PageContext): HubSpotSubmission {
  const field = (name: string, value: string) => ({ objectTypeId: CONTACT_OBJECT_TYPE, name, value });
  return {
    fields: [
      field('firstname', lead.firstName.trim()),
      field('company', lead.company.trim()),
      field('email', lead.email.trim()),
      field('margin_mower_score', String(summary.points)),
      field('margin_mower_stars', String(summary.stars)),
    ],
    context: page,
  };
}

export function submissionUrl(target: HubSpotTarget): string {
  return `https://api.hsforms.com/submissions/v3/integration/submit/${encodeURIComponent(target.portalId)}/${encodeURIComponent(target.formGuid)}`;
}

export async function submitLead(
  target: HubSpotTarget,
  submission: HubSpotSubmission,
  fetchFn: typeof fetch = fetch,
): Promise<boolean> {
  try {
    const response = await fetchFn(submissionUrl(target), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submission),
    });
    return response.ok;
  } catch {
    return false;
  }
}
