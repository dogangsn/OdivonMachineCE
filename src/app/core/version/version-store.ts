import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';
import { FirebaseIdentity } from '../auth/firebase-identity';
import { BUILD_INFO } from './build-info';

export interface RemoteVersion {
  version: string;
  buildId?: string;
  commit?: string;
  builtAt?: string;
  releaseNotes?: string[];
}

const PRESERVED_KEYS = ['odivon:theme', 'odivon:preferred_lang'] as const;
const APP_VERSION_KEY = 'odivon:app_version';

@Injectable({ providedIn: 'root' })
export class VersionStore {
  private readonly document = inject(DOCUMENT);
  private readonly identity = inject(FirebaseIdentity, { optional: true });
  private timer: number | undefined;

  readonly current = BUILD_INFO;
  readonly remote = signal<RemoteVersion | null>(null);
  readonly updateRequired = signal(false);
  readonly updating = signal(false);

  start(): void {
    if (this.timer) return;
    this.verifyStoredVersionOnBoot();
    void this.check();
    this.timer = window.setInterval(() => void this.check(), 60_000);
    this.document.addEventListener('visibilitychange', () => {
      if (this.document.visibilityState === 'visible') void this.check();
    });
  }

  async check(): Promise<void> {
    try {
      const response = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' });
      if (!response.ok) return;
      const value = (await response.json()) as RemoteVersion;
      this.remote.set(value);
      if (
        (value.version && value.version !== BUILD_INFO.version) ||
        (value.buildId && value.buildId !== BUILD_INFO.buildId)
      ) {
        this.updateRequired.set(true);
      }
    } catch {}
  }

  requireUpdate(): void {
    this.updateRequired.set(true);
  }

  async applyUpdate(): Promise<void> {
    if (this.updating()) return;
    this.updating.set(true);
    const nextVersion = this.remote()?.version || BUILD_INFO.version;
    try {
      await this.identity?.logout().catch(() => undefined);
      this.clearCookies();
      this.clearClientStorage(nextVersion);

      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations().catch(() => []);
        await Promise.all(regs.map((r) => r.unregister().catch(() => false)));
      }
      if ('caches' in window) {
        const keys = await caches.keys().catch(() => []);
        await Promise.all(keys.map((k) => caches.delete(k).catch(() => false)));
      }
      if ('indexedDB' in window && typeof indexedDB.deleteDatabase === 'function') {
        try {
          indexedDB.deleteDatabase('firebaseLocalStorageDb');
        } catch {}
      }
    } finally {
      this.navigateToLogin();
    }
  }

  private verifyStoredVersionOnBoot(): void {
    try {
      const storedVersion = localStorage.getItem(APP_VERSION_KEY);
      if (storedVersion && storedVersion !== BUILD_INFO.version) {
        void this.identity?.logout().catch(() => undefined);
        this.clearCookies();
        this.clearClientStorage(BUILD_INFO.version);
        if (!window.location.pathname.startsWith('/login')) {
          this.navigateToLogin();
        }
        return;
      }
      localStorage.setItem(APP_VERSION_KEY, BUILD_INFO.version);
    } catch {}
  }

  clearCookies(): void {
    try {
      const raw = this.document.cookie || '';
      if (!raw) return;
      const host = window.location?.hostname || '';
      const domainParts = host.split('.');
      const rootDomain =
        domainParts.length >= 2 ? `.${domainParts.slice(-2).join('.')}` : undefined;

      for (const part of raw.split(';')) {
        const eqPos = part.indexOf('=');
        const name = (eqPos > -1 ? part.slice(0, eqPos) : part).trim();
        if (!name) continue;
        this.document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
        if (host) {
          this.document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${host}`;
        }
        if (rootDomain) {
          this.document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${rootDomain}`;
        }
      }
    } catch {}
  }

  clearClientStorage(targetVersion: string): void {
    try {
      const kept = PRESERVED_KEYS.map((k) => [k, localStorage.getItem(k)] as const);
      localStorage.clear();
      for (const [k, v] of kept) {
        if (v !== null) localStorage.setItem(k, v);
      }
      localStorage.setItem(APP_VERSION_KEY, targetVersion);
      sessionStorage.clear();
    } catch {}
  }

  private navigateToLogin(): void {
    try {
      window.location.replace('/login?updated=1');
    } catch {}
  }
}
