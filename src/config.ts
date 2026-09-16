export const config = {
  pageUrl: 'https://bomdata.io/margin-mower/',
  demoUrl: 'https://bomdata.io/contact/',
  siteUrl: 'https://bomdata.io/',
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

export function linkedInShareUrl(pageUrl: string): string {
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}`;
}
