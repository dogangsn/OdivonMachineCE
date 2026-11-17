import { TestBed } from '@angular/core/testing';
import { VersionStore } from './version-store';

describe('VersionStore', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    document.cookie = 'odivon_test_cookie=abc; path=/';
    TestBed.configureTestingModule({});
  });

  it('clears cookies and session storage while preserving theme and language on update', () => {
    const store = TestBed.inject(VersionStore);
    localStorage.setItem('odivon:theme', 'dark');
    localStorage.setItem('odivon:preferred_lang', 'en');
    localStorage.setItem('odivon:machine-ce:session', '{"email":"test@odivon.com"}');
    sessionStorage.setItem('temp_token', '123');

    store.clearCookies();
    store.clearClientStorage('1.0.5');

    expect(document.cookie).not.toContain('odivon_test_cookie=abc');
    expect(localStorage.getItem('odivon:machine-ce:session')).toBeNull();
    expect(sessionStorage.getItem('temp_token')).toBeNull();
    expect(localStorage.getItem('odivon:theme')).toBe('dark');
    expect(localStorage.getItem('odivon:preferred_lang')).toBe('en');
    expect(localStorage.getItem('odivon:app_version')).toBe('1.0.5');
  });
});
