import { describe, expect, it } from 'vitest';
import { config, linkedInShareUrl, withUtm } from './config';

describe('config', () => {
  it('points at the bomdata.io page and contact page', () => {
    expect(config.pageUrl).toBe('https://bomdata.io/margin-mower/');
    expect(config.demoUrl).toBe('https://bomdata.io/contact/');
  });

  it('adds campaign UTM tags and keeps existing params', () => {
    const url = new URL(withUtm('https://bomdata.io/contact/?ref=x'));
    expect(url.pathname).toBe('/contact/');
    expect(url.searchParams.get('ref')).toBe('x');
    expect(url.searchParams.get('utm_source')).toBe('linkedin');
    expect(url.searchParams.get('utm_medium')).toBe('game');
    expect(url.searchParams.get('utm_campaign')).toBe('margin-mower');
  });

  it('builds a LinkedIn share link for the page', () => {
    expect(linkedInShareUrl('https://bomdata.io/margin-mower/')).toBe(
      'https://www.linkedin.com/sharing/share-offsite/?url=https%3A%2F%2Fbomdata.io%2Fmargin-mower%2F',
    );
  });
});
