export const config = {
  pageUrl: 'https://bomdata.io/margin-mower/',
  demoUrl: 'https://bomdata.io/contact/',
  siteUrl: 'https://bomdata.io/',
  // Opens LinkedIn's post composer, where the player attaches the saved image and pastes the caption.
  linkedInPostUrl: 'https://www.linkedin.com/feed/?shareActive=true',
  // Filled in after the HubSpot form is created (see README). Empty values hide the lead form.
  hubspotPortalId: '',
  hubspotFormGuid: '',
};

const UTM_TAGS: Record<string, string> = {
  utm_source: 'linkedin',
  utm_medium: 'game',
  utm_campaign: 'margin-mower',
};

export function withUtm(url: string): string {
  const parsed = new URL(url);
  for (const [key, value] of Object.entries(UTM_TAGS)) parsed.searchParams.set(key, value);
  return parsed.toString();
}
