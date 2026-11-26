import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SeoService } from './seo';

describe('SeoService', () => {
  it('sets title, description, canonical and robots for a public route', () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const seo = TestBed.inject(SeoService);
    seo.apply({ title: 'Test', description: 'Açıklama', index: true }, '/register?plan=pro');
    expect(document.title).toBe('Test');
    expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toBe(
      'Açıklama',
    );
    expect(document.querySelector('meta[name="robots"]')?.getAttribute('content')).toContain(
      'index,follow',
    );
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      'https://machinece.odivon.com/register',
    );
  });

  it('marks routes without SEO data as noindex', () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    TestBed.inject(SeoService).apply({}, '/overview');
    expect(document.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe(
      'noindex,nofollow',
    );
  });

  it('adds and removes JSON-LD blocks', () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const seo = TestBed.inject(SeoService);
    seo.setJsonLd('ld-test', { '@type': 'Thing' });
    expect(document.getElementById('ld-test')?.textContent).toContain('Thing');
    seo.removeJsonLd('ld-test');
    expect(document.getElementById('ld-test')).toBeNull();
  });
});
