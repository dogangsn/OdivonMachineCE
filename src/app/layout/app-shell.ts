import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthStore } from '../core/auth/auth-store';
import { I18nStore, SupportedLang, TranslatePipe } from '../core/i18n/i18n';
import { VersionStore } from '../core/version/version-store';
import { PRODUCT_NAVIGATION } from '../domain/domain-navigation';
import { PRODUCT } from '../domain/product-manifest';

const NAV_KEY_MAP: Record<string, string> = {
  machines: 'nav.machines',
  risks: 'nav.risks',
  standards: 'nav.standards',
  'technical-files': 'nav.technicalFiles',
  declarations: 'nav.declarations',
};

@Component({
  selector: 'app-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, TranslatePipe],
  template: `
    <div class="min-h-screen bg-[#f8fafc] text-slate-900 dark:bg-[#0b1120] dark:text-slate-100">
      <a
        href="#main"
        class="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[80] odv-btn-primary"
        >İçeriğe geç</a
      >
      @if (mobileOpen()) {
        <button
          type="button"
          class="fixed inset-0 z-30 bg-slate-950/60 backdrop-blur-xs lg:hidden"
          aria-label="Menüyü kapat"
          (click)="mobileOpen.set(false)"
        ></button>
      }
      <aside
        class="fixed inset-y-0 start-0 z-40 flex w-72 flex-col border-e border-slate-200/80 bg-white/95 p-5 backdrop-blur-xl transition-transform duration-200 dark:border-slate-800/80 dark:bg-slate-900/95 lg:translate-x-0"
        [class.max-lg:-translate-x-full]="!mobileOpen()"
        [class.max-lg:rtl:translate-x-full]="!mobileOpen()"
      >
        <!-- Brand Header -->
        <div class="mb-6 flex items-center justify-between">
          <a routerLink="/overview" class="flex items-center gap-3 text-inherit no-underline">
            <div
              class="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-600 to-purple-700 text-white shadow-lg shadow-indigo-500/25"
            >
              <span class="material-symbols-rounded">precision_manufacturing</span>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <strong class="text-base font-black tracking-tight text-slate-900 dark:text-white"
                  >Odivon</strong
                >
                <span
                  class="rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:bg-indigo-950/80 dark:text-indigo-300"
                  >CE</span
                >
              </div>
              <span class="block text-[11px] font-semibold text-slate-500 dark:text-slate-400">{{
                product.name
              }}</span>
            </div>
          </a>
          <button
            type="button"
            class="odv-icon-btn lg:hidden"
            (click)="mobileOpen.set(false)"
            aria-label="Menüyü kapat"
          >
            <span class="material-symbols-rounded">close</span>
          </button>
        </div>

        <!-- Active Tenant & User Profile Card -->
        <div
          class="mb-5 rounded-2xl border border-slate-200/70 bg-slate-50/80 p-3.5 dark:border-slate-800 dark:bg-slate-800/60"
        >
          <div class="flex items-center gap-3">
            <span
              class="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-black text-white shadow-xs"
              >{{ initials() }}</span
            >
            <div class="min-w-0 flex-1">
              <strong
                class="block truncate text-xs font-extrabold text-slate-900 dark:text-white"
                >{{ auth.session()?.name || 'Yetkili Kullanıcı' }}</strong
              >
              <span class="block truncate text-[11px] text-slate-500 dark:text-slate-400">{{
                auth.session()?.tenantName || auth.session()?.email
              }}</span>
            </div>
            <span class="odv-badge-success !px-2 !py-0.5 !text-[10px]">{{ roleLabel() }}</span>
          </div>
        </div>

        <!-- Navigation -->
        <nav aria-label="Ana menü" class="custom-scroll flex-1 space-y-5 overflow-y-auto pe-1">
          <div>
            <span
              class="mb-2 block px-3 text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500"
              >{{ 'shell.operations' | t }}</span
            >
            <div class="space-y-1">
              @for (item of primaryMenu; track item.path) {
                <a
                  [routerLink]="item.path"
                  routerLinkActive="bg-indigo-50/90 text-indigo-700 shadow-2xs dark:bg-indigo-500/15 dark:text-indigo-300"
                  class="group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-slate-600 transition-all hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/70 dark:hover:text-white"
                  (click)="mobileOpen.set(false)"
                >
                  <span
                    class="material-symbols-rounded text-slate-400 transition-colors group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
                    >{{ item.icon }}</span
                  >
                  <span class="truncate">{{ item.labelKey | t }}</span>
                </a>
              }
            </div>
          </div>

          <div>
            <span
              class="mb-2 block px-3 text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500"
              >{{ 'shell.governance' | t }}</span
            >
            <div class="space-y-1">
              @for (item of governanceMenu; track item.path) {
                <a
                  [routerLink]="item.path"
                  routerLinkActive="bg-indigo-50/90 text-indigo-700 shadow-2xs dark:bg-indigo-500/15 dark:text-indigo-300"
                  class="group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-slate-600 transition-all hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/70 dark:hover:text-white"
                  (click)="mobileOpen.set(false)"
                >
                  <span
                    class="material-symbols-rounded text-slate-400 transition-colors group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
                    >{{ item.icon }}</span
                  >
                  <span class="truncate">{{ item.labelKey | t }}</span>
                </a>
              }
            </div>
          </div>
        </nav>

        <!-- Sidebar Footer -->
        <div class="mt-4 pt-3 border-t border-slate-200/70 dark:border-slate-800">
          <div
            class="mb-3 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-950 p-4 text-white shadow-md border border-indigo-500/20"
          >
            <div class="flex items-center justify-between">
              <span class="material-symbols-rounded text-indigo-400">verified_user</span>
              <span
                class="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/30"
                >2006/42/EC & 2023/1230</span
              >
            </div>
            <strong class="mt-2 block text-xs font-extrabold">{{
              'shell.auditReady' | t
            }}</strong>
            <span class="mt-0.5 block text-[11px] text-slate-300"
              >Sürüm v{{ version.current.version }} · MainAPI Korumalı</span
            >
          </div>
          <button
            type="button"
            class="odv-btn-ghost w-full justify-start !border-transparent hover:!border-rose-200 hover:!bg-rose-50 hover:!text-rose-600 dark:hover:!border-rose-900/50 dark:hover:!bg-rose-950/40 dark:hover:!text-rose-400"
            (click)="logout()"
          >
            <span class="material-symbols-rounded">logout</span>{{ 'shell.logout' | t }}
          </button>
        </div>
      </aside>

      <!-- Main Viewport -->
      <div class="lg:ms-72 flex min-h-screen flex-col">
        <header
          class="sticky top-0 z-20 flex min-h-16 items-center justify-between border-b border-slate-200/80 bg-white/85 px-4 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/85 sm:px-6 lg:px-8"
        >
          <div class="flex items-center gap-3">
            <button
              class="odv-icon-btn lg:hidden"
              type="button"
              (click)="mobileOpen.set(true)"
              aria-label="Menüyü aç"
            >
              <span class="material-symbols-rounded">menu</span>
            </button>
            <div>
              <div class="flex items-center gap-2">
                <strong class="text-sm font-extrabold text-slate-900 dark:text-white">{{
                  product.name
                }}</strong>
                <span
                  class="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/50"
                >
                  <span class="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  {{ 'shell.liveSync' | t }}
                </span>
              </div>
              <span
                class="hidden text-[11px] font-medium text-slate-500 dark:text-slate-400 sm:block"
                >{{ 'shell.subtitle' | t }}</span
              >
            </div>
          </div>

          <div class="flex items-center gap-2.5">
            <label class="sr-only" for="language">Dil</label>
            <select
              id="language"
              class="odv-input !w-auto !py-2 !ps-3 !pe-8 !text-xs !font-bold cursor-pointer"
              [value]="i18n.currentLang()"
              (change)="setLanguage($any($event.target).value)"
            >
              @for (language of i18n.options; track language.code) {
                <option [value]="language.code">
                  {{ language.flag }} {{ language.nativeName }}
                </option>
              }
            </select>
            <button
              type="button"
              class="odv-icon-btn border border-slate-200/80 dark:border-slate-700/80"
              (click)="toggleTheme()"
              [attr.aria-label]="dark() ? 'Açık temaya geç' : 'Koyu temaya geç'"
            >
              <span class="material-symbols-rounded">{{
                dark() ? 'light_mode' : 'dark_mode'
              }}</span>
            </button>
          </div>
        </header>

        <main id="main" class="mx-auto w-full max-w-[1520px] flex-1 p-4 sm:p-6 lg:p-8">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class AppShell {
  readonly product = PRODUCT;
  readonly auth = inject(AuthStore);
  readonly i18n = inject(I18nStore);
  readonly version = inject(VersionStore);
  readonly mobileOpen = signal(false);
  readonly dark = signal(localStorage.getItem('odivon:theme') === 'dark');

  readonly initials = computed(() => {
    const name = this.auth.session()?.name || this.auth.session()?.email || 'OD';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  });

  readonly roleLabel = computed(() => {
    const role = this.auth.session()?.role;
    return role === 'owner' ? 'Kurucu' : role === 'admin' ? 'Yönetici' : 'Uzman';
  });

  readonly primaryMenu = [
    { path: '/overview', icon: 'space_dashboard', labelKey: 'nav.overview' },
    ...PRODUCT_NAVIGATION.map((item) => ({
      path: `/${item.path}`,
      icon: item.icon,
      labelKey: NAV_KEY_MAP[item.key] ?? item.label,
    })),
  ];

  readonly governanceMenu = [
    { path: '/activity', icon: 'history', labelKey: 'nav.activity' },
    { path: '/billing', icon: 'credit_card', labelKey: 'nav.billing' },
    { path: '/settings', icon: 'tune', labelKey: 'nav.settings' },
  ];

  private readonly router = inject(Router);
  constructor() {
    document.documentElement.classList.toggle('dark', this.dark());
    this.i18n.setLanguage(this.i18n.currentLang());
  }
  setLanguage(value: string): void {
    this.i18n.setLanguage(value as SupportedLang);
  }
  toggleTheme(): void {
    this.dark.update((v) => !v);
    document.documentElement.classList.toggle('dark', this.dark());
    localStorage.setItem('odivon:theme', this.dark() ? 'dark' : 'light');
  }
  logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/login');
  }
}
