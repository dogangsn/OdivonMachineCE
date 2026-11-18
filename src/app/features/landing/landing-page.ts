import { CurrencyPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthStore } from '../../core/auth/auth-store';
import { BUILD_INFO } from '../../core/version/build-info';

interface PublicPlan {
  id: 'starter' | 'pro' | 'enterprise' | string;
  name: string;
  monthly: number | null;
  yearly: number | null;
}

interface PublicPricingResponse {
  data?: {
    currency: string;
    plans: PublicPlan[];
  };
  plans?: PublicPlan[];
}

const DEFAULT_PLANS: readonly PublicPlan[] = [
  { id: 'starter', name: 'Başlangıç', monthly: 99, yearly: 1100 },
  { id: 'pro', name: 'Profesyonel', monthly: 199, yearly: 2200 },
  { id: 'enterprise', name: 'Kurumsal', monthly: 399, yearly: 3380 },
];

@Component({
  selector: 'app-landing-page',
  imports: [RouterLink, CurrencyPipe],
  template: `
    <div class="min-h-screen bg-[#f8fafc] text-slate-900 dark:bg-[#0b1120] dark:text-slate-100">
      <a
        href="#main"
        class="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[90] odv-btn-primary"
        >İçeriğe geç</a
      >

      <!-- Sticky Top Navigation Bar -->
      <header
        class="sticky top-0 z-50 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/85"
      >
        <div
          class="mx-auto flex min-h-18 max-w-[1440px] flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8"
        >
          <!-- TOP-LEFT CLUSTER: Brand + Direct Login / Register Buttons -->
          <div class="flex flex-wrap items-center gap-3 sm:gap-4">
            <a routerLink="/" class="flex items-center gap-3 text-inherit no-underline">
              <span
                class="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-600 to-purple-700 text-white shadow-lg shadow-indigo-500/25"
              >
                <span class="material-symbols-rounded">precision_manufacturing</span>
              </span>
              <div>
                <div class="flex items-center gap-1.5">
                  <strong class="text-base font-black tracking-tight text-slate-900 dark:text-white"
                    >ODIVON</strong
                  >
                  <span
                    class="rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:bg-indigo-950/80 dark:text-indigo-300"
                    >MachineCE</span
                  >
                </div>
                <span class="block text-[11px] font-medium text-slate-500 dark:text-slate-400"
                  >2006/42/EC & AB 2023/1230 Platformu</span
                >
              </div>
            </a>

            <div class="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block"></div>

            <!-- Sol Üst Giriş Yap & Üye Ol Butonları -->
            <div class="flex items-center gap-2">
              @if (auth.isAuthenticated()) {
                <a routerLink="/overview" class="odv-btn-primary !py-2 !px-4 !text-xs">
                  <span class="material-symbols-rounded !text-base">space_dashboard</span>
                  Operasyon Paneline Git
                </a>
              } @else {
                <a routerLink="/login" class="odv-btn-ghost !py-2 !px-3.5 !text-xs">
                  <span class="material-symbols-rounded !text-base">login</span>
                  Giriş Yap
                </a>
                <a routerLink="/register" class="odv-btn-primary !py-2 !px-4 !text-xs">
                  <span class="material-symbols-rounded !text-base">person_add</span>
                  Üye Ol
                </a>
              }
            </div>
          </div>

          <!-- RIGHT CLUSTER: Section Links & Theme Toggle -->
          <div class="flex items-center gap-3">
            <nav aria-label="Sayfa bölümleri" class="hidden xl:flex items-center gap-1">
              <a
                href="#moduller"
                class="rounded-xl px-3 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-100 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-indigo-400"
                >CE Modülleri</a
              >
              <a
                href="#risk-matrisi"
                class="rounded-xl px-3 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-100 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-indigo-400"
                >EN ISO 12100 Matrisi</a
              >
              <a
                href="#paketler"
                class="rounded-xl px-3 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-100 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-indigo-400"
                >Paketler & Fiyatlar</a
              >
              <a
                href="#nasil-calisir"
                class="rounded-xl px-3 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-100 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-indigo-400"
                >Nasıl Çalışır?</a
              >
              <a
                href="#sss"
                class="rounded-xl px-3 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-100 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-indigo-400"
                >SSS</a
              >
            </nav>

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
        </div>
      </header>

      <main id="main">
        <!-- HERO SECTION -->
        <section
          class="relative overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 py-16 text-white sm:py-24"
        >
          <div
            class="pointer-events-none absolute -start-24 top-10 size-96 rounded-full bg-indigo-500/20 blur-3xl"
          ></div>
          <div
            class="pointer-events-none absolute bottom-0 end-0 size-96 rounded-full bg-purple-500/20 blur-3xl"
          ></div>

          <div
            class="relative mx-auto grid max-w-[1440px] items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.08fr_0.92fr] lg:px-8"
          >
            <!-- Hero Copy -->
            <div>
              <div
                class="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3.5 py-1.5 text-xs font-bold text-emerald-300"
              >
                <span class="size-2 animate-pulse rounded-full bg-emerald-400"></span>
                2006/42/EC · AB 2023/1230 Makine Emniyeti & CE Uygunluk Bulutu
              </div>

              <h1
                class="mt-6 text-4xl font-black leading-[1.06] tracking-tight sm:text-5xl xl:text-6xl"
              >
                Risk analizinden AT uygunluk beyanına,
                <span
                  class="bg-gradient-to-r from-indigo-300 via-purple-300 to-emerald-300 bg-clip-text text-transparent"
                  >tek kanıt zinciri.</span
                >
              </h1>

              <p class="mt-6 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
                Makine envanteri, <strong>EN ISO 12100</strong> risk değerlendirme matrisi,
                harmonize standart eşleştirmesi, sürüm kontrollü teknik dosya ve AT uygunluk
                beyanlarını denetime hazır tek merkezden yönetin.
              </p>

              <div class="mt-8 flex flex-wrap items-center gap-3.5">
                @if (auth.isAuthenticated()) {
                  <a routerLink="/overview" class="odv-btn-primary !px-6 !py-3.5 !text-sm">
                    <span class="material-symbols-rounded">space_dashboard</span>
                    Operasyon Merkezine Git
                  </a>
                } @else {
                  <a routerLink="/register" class="odv-btn-primary !px-6 !py-3.5 !text-sm">
                    <span class="material-symbols-rounded">rocket_launch</span>
                    14 Gün Ücretsiz Deneyin
                  </a>
                  <a
                    routerLink="/login"
                    class="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3.5 text-sm font-bold text-white backdrop-blur-xs transition-all hover:bg-white/15"
                  >
                    <span class="material-symbols-rounded">login</span>
                    Giriş Yap
                  </a>
                }
                <a
                  href="#paketler"
                  class="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-indigo-300 hover:text-white"
                >
                  Paketleri İncele
                  <span class="material-symbols-rounded !text-base">arrow_downward</span>
                </a>
              </div>

              <ul
                class="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs font-semibold text-slate-300 list-none p-0"
              >
                <li class="flex items-center gap-1.5">
                  <span class="material-symbols-rounded !text-base text-emerald-400"
                    >check_circle</span
                  >
                  Kredi kartı gerekmez
                </li>
                <li class="flex items-center gap-1.5">
                  <span class="material-symbols-rounded !text-base text-emerald-400"
                    >check_circle</span
                  >
                  EN ISO 12100 otomatik risk skoru
                </li>
                <li class="flex items-center gap-1.5">
                  <span class="material-symbols-rounded !text-base text-emerald-400"
                    >check_circle</span
                  >
                  Değişmez denetim izi (Audit Trail)
                </li>
                <li class="flex items-center gap-1.5">
                  <span class="material-symbols-rounded !text-base text-emerald-400"
                    >check_circle</span
                  >
                  8 dil & ihracat uyumlu
                </li>
              </ul>
            </div>

            <!-- Interactive Live Dashboard Mockup Card -->
            <div
              class="rounded-2xl border border-white/15 bg-slate-900/90 p-4 shadow-2xl backdrop-blur-xl sm:p-6"
              aria-label="Odivon MachineCE canlı panel önizlemesi"
            >
              <div
                class="mb-4 flex items-center justify-between border-b border-slate-800 pb-3 text-xs"
              >
                <div class="flex items-center gap-2">
                  <span class="size-2.5 rounded-full bg-rose-500"></span>
                  <span class="size-2.5 rounded-full bg-amber-400"></span>
                  <span class="size-2.5 rounded-full bg-emerald-400"></span>
                  <span
                    class="ms-2 rounded-md bg-slate-800 px-2.5 py-0.5 font-mono text-[11px] text-slate-300"
                    >machinece.odivon.com/overview</span
                  >
                </div>
                <span class="odv-badge-success !text-[10px]">CANLI TELEMETRİ</span>
              </div>

              <!-- Mini KPIs -->
              <div class="grid grid-cols-3 gap-3">
                <div
                  class="rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 p-3.5 text-white"
                >
                  <span class="block text-[10px] font-bold uppercase text-indigo-100"
                    >CE Hazırlık</span
                  >
                  <strong class="mt-1 block text-2xl font-black">%98</strong>
                  <span class="text-[10px] text-indigo-100">Tam kanıt zinciri</span>
                </div>
                <div class="rounded-xl border border-slate-800 bg-slate-800/70 p-3.5">
                  <span class="block text-[10px] font-bold uppercase text-slate-400"
                    >Makine & Hat</span
                  >
                  <strong class="mt-1 block text-2xl font-black text-white">148</strong>
                  <span class="text-[10px] text-emerald-400">Tümü güncel</span>
                </div>
                <div class="rounded-xl border border-slate-800 bg-slate-800/70 p-3.5">
                  <span class="block text-[10px] font-bold uppercase text-slate-400"
                    >AT Beyanı</span
                  >
                  <strong class="mt-1 block text-2xl font-black text-emerald-400">64</strong>
                  <span class="text-[10px] text-slate-400">Dijital onaylı</span>
                </div>
              </div>

              <!-- Live Risk & Standards Preview -->
              <div
                id="risk-matrisi"
                class="mt-4 rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-3"
              >
                <div class="flex items-center justify-between text-xs">
                  <span class="font-bold text-slate-300"
                    >EN ISO 12100 Risk Azaltım & Standart Uyumu</span
                  >
                  <span class="font-mono text-[11px] text-emerald-400">PL d/e Doğrulandı</span>
                </div>
                <div class="space-y-2 text-xs">
                  <div>
                    <div class="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span>EN ISO 12100 · Tehlike & Risk Analizi</span>
                      <strong class="text-white">%100</strong>
                    </div>
                    <div class="h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        class="h-full w-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div class="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span>EN 60204-1 · Makine Elektrik Donanımı</span>
                      <strong class="text-white">%96</strong>
                    </div>
                    <div class="h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        class="h-full w-[96%] rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div class="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span>EN ISO 13849-1 · Emniyetle İlgili Kontrol Sistemleri</span>
                      <strong class="text-white">%94</strong>
                    </div>
                    <div class="h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        class="h-full w-[94%] rounded-full bg-gradient-to-r from-sky-400 to-indigo-500"
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Audit Row Preview -->
              <div
                class="mt-3 flex items-center justify-between rounded-xl border border-slate-800 bg-slate-800/50 px-3.5 py-2.5 text-xs"
              >
                <div class="flex items-center gap-2.5">
                  <span class="size-2 rounded-full bg-emerald-400"></span>
                  <span class="font-semibold text-slate-200"
                    >CNC Abkant Pres #2 · Teknik Dosya Paketi İndirildi</span
                  >
                </div>
                <span class="font-mono text-[10px] text-slate-400">Sürüm v4</span>
              </div>
            </div>
          </div>
        </section>

        <!-- 4 HIGHLIGHTS STRIP -->
        <section class="mx-auto -mt-8 relative z-10 max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <article class="kpi-card">
              <div class="flex items-center gap-3">
                <span
                  class="grid size-10 place-items-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/70 dark:text-indigo-400"
                >
                  <span class="material-symbols-rounded">precision_manufacturing</span>
                </span>
                <div>
                  <strong class="block text-sm font-black">2006/42/EC & 2023/1230</strong>
                  <span class="text-xs text-slate-500">AB ve TR mevzuatına tam uyum</span>
                </div>
              </div>
            </article>
            <article class="kpi-card">
              <div class="flex items-center gap-3">
                <span
                  class="grid size-10 place-items-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/70 dark:text-amber-400"
                >
                  <span class="material-symbols-rounded">health_and_safety</span>
                </span>
                <div>
                  <strong class="block text-sm font-black">EN ISO 12100 Matrisi</strong>
                  <span class="text-xs text-slate-500">Otomatik Şiddet × Olasılık skoru</span>
                </div>
              </div>
            </article>
            <article class="kpi-card">
              <div class="flex items-center gap-3">
                <span
                  class="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/70 dark:text-emerald-400"
                >
                  <span class="material-symbols-rounded">folder_managed</span>
                </span>
                <div>
                  <strong class="block text-sm font-black">Tek Tıkla Teknik Dosya</strong>
                  <span class="text-xs text-slate-500">Denetime hazır kanıt paketi çıktısı</span>
                </div>
              </div>
            </article>
            <article class="kpi-card">
              <div class="flex items-center gap-3">
                <span
                  class="grid size-10 place-items-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/70 dark:text-purple-400"
                >
                  <span class="material-symbols-rounded">admin_panel_settings</span>
                </span>
                <div>
                  <strong class="block text-sm font-black">Rol Tabanlı Yetki (RBAC)</strong>
                  <span class="text-xs text-slate-500">Mühendis, onaycı ve denetçi rolleri</span>
                </div>
              </div>
            </article>
          </div>
        </section>

        <!-- CORE MODULES SECTION -->
        <section id="moduller" class="mx-auto max-w-[1440px] px-4 py-20 sm:px-6 lg:px-8">
          <div class="mx-auto max-w-2xl text-center">
            <span
              class="text-xs font-extrabold uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-400"
              >5 TEMEL OPERASYON MODÜLÜ</span
            >
            <h2
              class="mt-2 text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl"
            >
              Makine emniyeti yaşam döngüsünün tamamı tek platformda
            </h2>
            <p class="mt-3 text-sm sm:text-base text-slate-500">
              Dağınık Excel dosyalarına son verin; makine sicilinden AT uygunluk beyanına kadar her
              adımı sürüm kontrolüyle birbirine bağlayın.
            </p>
          </div>

          <div class="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            @for (mod of modules; track mod.title) {
              <article class="kpi-card flex flex-col justify-between p-6">
                <div>
                  <span
                    class="grid size-12 place-items-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/70 dark:text-indigo-400"
                  >
                    <span class="material-symbols-rounded !text-2xl">{{ mod.icon }}</span>
                  </span>
                  <h3 class="mt-4 text-lg font-black text-slate-900 dark:text-white">
                    {{ mod.title }}
                  </h3>
                  <p class="mt-2 text-xs sm:text-sm leading-relaxed text-slate-500">
                    {{ mod.description }}
                  </p>
                </div>
                <ul class="mt-5 space-y-2 border-t border-slate-100 pt-4 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:text-slate-300 list-none p-0">
                  @for (pt of mod.points; track pt) {
                    <li class="flex items-center gap-2">
                      <span class="material-symbols-rounded !text-base text-emerald-500"
                        >check_circle</span
                      >
                      {{ pt }}
                    </li>
                  }
                </ul>
              </article>
            }
          </div>
        </section>

        <!-- SAAS PRICING & PACKAGES SECTION -->
        <section
          id="paketler"
          class="border-y border-slate-200/80 bg-white py-20 dark:border-slate-800/80 dark:bg-slate-900/50"
        >
          <div class="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
            <div class="flex flex-col items-center justify-between gap-6 text-center lg:flex-row lg:text-start">
              <div>
                <span
                  class="text-xs font-extrabold uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-400"
                  >SAAS ABONELİK PAKETLERİ</span
                >
                <h2
                  class="mt-2 text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl"
                >
                  Üretim ölçeğinize uygun şeffaf paketler
                </h2>
                <p class="mt-2 text-sm sm:text-base text-slate-500">
                  Her paket <strong>14 gün ücretsiz deneme</strong> ile başlar; kredi kartı
                  gerekmez. Yıllık ödemede 2 ay avantaj sağlanır.
                </p>
              </div>

              <!-- Monthly / Yearly Switch -->
              <div
                class="inline-flex rounded-2xl border border-slate-200/80 bg-slate-100 p-1.5 dark:border-slate-700/80 dark:bg-slate-800"
              >
                <button
                  type="button"
                  class="rounded-xl px-5 py-2.5 text-xs font-extrabold transition-all"
                  [class.bg-white]="cycle() === 'monthly'"
                  [class.dark:bg-slate-700]="cycle() === 'monthly'"
                  [class.text-indigo-600]="cycle() === 'monthly'"
                  [class.dark:text-indigo-300]="cycle() === 'monthly'"
                  [class.shadow-xs]="cycle() === 'monthly'"
                  (click)="cycle.set('monthly')"
                >
                  Aylık Ödeme
                </button>
                <button
                  type="button"
                  class="flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-extrabold transition-all"
                  [class.bg-white]="cycle() === 'yearly'"
                  [class.dark:bg-slate-700]="cycle() === 'yearly'"
                  [class.text-indigo-600]="cycle() === 'yearly'"
                  [class.dark:text-indigo-300]="cycle() === 'yearly'"
                  [class.shadow-xs]="cycle() === 'yearly'"
                  (click)="cycle.set('yearly')"
                >
                  <span>Yıllık Ödeme</span>
                  <span class="odv-badge-success !px-2 !py-0.5 !text-[10px]">2 Ay Avantaj</span>
                </button>
              </div>
            </div>

            <div class="mt-12 grid gap-6 lg:grid-cols-3">
              @for (plan of plans(); track plan.id; let idx = $index) {
                <article
                  class="kpi-card relative flex flex-col justify-between p-7"
                  [class.ring-2]="idx === 1"
                  [class.ring-indigo-500]="idx === 1"
                >
                  @if (idx === 1) {
                    <span
                      class="odv-badge-info absolute end-5 top-5 !bg-indigo-600 !text-white !border-indigo-600"
                      >EN ÇOK TERCİH EDİLEN</span
                    >
                  }
                  <div>
                    <h3 class="m-0 text-2xl font-black text-slate-900 dark:text-white">
                      {{ plan.name }}
                    </h3>
                    <p class="mt-2 text-xs sm:text-sm text-slate-500">
                      {{ planDescription(plan.id) }}
                    </p>

                    <div class="my-6 flex items-baseline gap-1.5">
                      <strong
                        class="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white"
                      >
                        {{
                          planPrice(plan)
                            | currency: 'TRY' : 'symbol-narrow' : '1.0-0' : 'tr-TR'
                        }}
                      </strong>
                      <span class="text-xs font-bold text-slate-500">
                        / {{ cycle() === 'monthly' ? 'ay' : 'yıl' }} + KDV
                      </span>
                    </div>

                    <ul class="space-y-3 border-t border-slate-100 pt-5 text-xs sm:text-sm list-none p-0 dark:border-slate-800">
                      @for (feat of planFeatures(plan.id); track feat) {
                        <li class="flex items-center gap-2.5 font-semibold text-slate-700 dark:text-slate-300">
                          <span class="material-symbols-rounded text-emerald-500"
                            >check_circle</span
                          >
                          {{ feat }}
                        </li>
                      }
                    </ul>
                  </div>

                  <div class="mt-8">
                    @if (auth.isAuthenticated()) {
                      <a
                        routerLink="/billing"
                        class="w-full justify-center"
                        [class.odv-btn-primary]="idx === 1"
                        [class.odv-btn-soft]="idx !== 1"
                      >
                        <span class="material-symbols-rounded">credit_card</span>
                        Abonelik Panelinden Seç
                      </a>
                    } @else {
                      <a
                        routerLink="/register"
                        [queryParams]="{ plan: plan.id, cycle: cycle() }"
                        class="w-full justify-center"
                        [class.odv-btn-primary]="idx === 1"
                        [class.odv-btn-soft]="idx !== 1"
                      >
                        <span class="material-symbols-rounded">rocket_launch</span>
                        14 Gün Ücretsiz Başla
                      </a>
                    }
                  </div>
                </article>
              }
            </div>
          </div>
        </section>

        <!-- HOW IT WORKS SECTION -->
        <section id="nasil-calisir" class="mx-auto max-w-[1440px] px-4 py-20 sm:px-6 lg:px-8">
          <div class="mx-auto max-w-2xl text-center">
            <span
              class="text-xs font-extrabold uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-400"
              >NASIL ÇALIŞIR?</span
            >
            <h2
              class="mt-2 text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl"
            >
              3 adımda denetime hazır CE kanıt zinciri
            </h2>
          </div>

          <div class="mt-12 grid gap-6 md:grid-cols-3">
            @for (step of steps; track step.no) {
              <article class="kpi-card p-6">
                <span
                  class="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-base font-black text-white shadow-md shadow-indigo-500/25"
                >
                  {{ step.no }}
                </span>
                <h3 class="mt-4 text-lg font-black text-slate-900 dark:text-white">
                  {{ step.title }}
                </h3>
                <p class="mt-2 mb-0 text-xs sm:text-sm leading-relaxed text-slate-500">
                  {{ step.text }}
                </p>
              </article>
            }
          </div>
        </section>

        <!-- FAQ SECTION -->
        <section id="sss" class="mx-auto max-w-4xl px-4 pb-20 sm:px-6 lg:px-8">
          <div class="text-center mb-10">
            <span
              class="text-xs font-extrabold uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-400"
              >SIKÇA SORULAN SORULAR</span
            >
            <h2 class="mt-2 text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              Merak edilenler
            </h2>
          </div>

          <div class="space-y-3">
            @for (item of faqs; track item.q) {
              <details class="odv-card group p-5">
                <summary
                  class="flex cursor-pointer items-center justify-between gap-4 text-sm sm:text-base font-extrabold text-slate-900 dark:text-white list-none"
                >
                  <span>{{ item.q }}</span>
                  <span
                    class="material-symbols-rounded text-indigo-600 transition-transform group-open:rotate-180"
                    >expand_more</span
                  >
                </summary>
                <p class="mt-3 mb-0 text-xs sm:text-sm leading-relaxed text-slate-500">
                  {{ item.a }}
                </p>
              </details>
            }
          </div>
        </section>

        <!-- BOTTOM CTA BANNER -->
        <section class="mx-auto max-w-[1440px] px-4 pb-16 sm:px-6 lg:px-8">
          <div
            class="rounded-3xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-700 p-8 text-center text-white shadow-2xl sm:p-12"
          >
            <h2 class="m-0 text-2xl font-black tracking-tight sm:text-4xl">
              Makine CE ve teknik dosya süreçlerinizi bugün dijitalleştirin
            </h2>
            <p class="mx-auto mt-3 max-w-2xl text-sm sm:text-base text-indigo-100">
              14 gün boyunca tüm modülleri kredi kartı gerekmeden ücretsiz deneyin.
            </p>
            <div class="mt-7 flex flex-wrap justify-center gap-3.5">
              <a
                routerLink="/register"
                class="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-black text-indigo-700 shadow-lg transition-transform hover:-translate-y-0.5"
              >
                <span class="material-symbols-rounded">person_add</span>
                Hemen Ücretsiz Üye Ol
              </a>
              <a
                routerLink="/login"
                class="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-bold text-white backdrop-blur-xs transition-colors hover:bg-white/20"
              >
                <span class="material-symbols-rounded">login</span>
                Giriş Yap
              </a>
            </div>
          </div>
        </section>
      </main>

      <!-- FOOTER -->
      <footer
        class="border-t border-slate-200/80 bg-white py-8 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900"
      >
        <div
          class="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 px-4 sm:px-6 lg:px-8"
        >
          <div class="flex items-center gap-2.5">
            <span
              class="grid size-7 place-items-center rounded-lg bg-indigo-600 text-white font-black"
              >O</span
            >
            <strong class="text-slate-900 dark:text-white">Odivon MachineCE</strong>
            <span>· Sürüm v{{ version }}</span>
          </div>
          <div class="flex flex-wrap items-center gap-4 font-semibold">
            <a routerLink="/legal/terms" class="hover:text-indigo-600">Kullanım Koşulları</a>
            <a routerLink="/legal/privacy" class="hover:text-indigo-600">Gizlilik ve KVKK</a>
            <a routerLink="/login" class="hover:text-indigo-600">Giriş Yap</a>
            <a routerLink="/register" class="hover:text-indigo-600">Üye Ol</a>
          </div>
        </div>
      </footer>
    </div>
  `,
})
export class LandingPage {
  readonly auth = inject(AuthStore);
  private readonly http = inject(HttpClient);
  readonly version = BUILD_INFO.version;
  readonly dark = signal(localStorage.getItem('odivon:theme') === 'dark');
  readonly cycle = signal<'monthly' | 'yearly'>('yearly');
  readonly plans = signal<readonly PublicPlan[]>(DEFAULT_PLANS);

  readonly modules = [
    {
      icon: 'precision_manufacturing',
      title: 'Makine ve Hat Envanteri',
      description:
        'Üretilen veya sahada işletilen tüm makineleri seri numarası, model, imalat yılı ve direktif kapsamıyla kayıt altına alın.',
      points: [
        '2006/42/EC ve AB 2023/1230 kapsam takibi',
        'Tesis, hol ve üretim hattı bazlı sicil',
        'Sürüm kontrollü revizyon geçmişi',
      ],
    },
    {
      icon: 'health_and_safety',
      title: 'EN ISO 12100 Risk Değerlendirmesi',
      description:
        'Tehlikeleri tanımlayın, Şiddet (1–5) × Olasılık (1–5) matrisiyle risk skorunu otomatik hesaplayın ve koruyucu tedbirleri belgeleyin.',
      points: [
        'Otomatik Risk Skoru (Düşük / Orta / Yüksek)',
        '3 aşamalı koruyucu tedbir ve LOTO kaydı',
        'Artık (kalan) risk ve piktogram bildirimi',
      ],
    },
    {
      icon: 'rule',
      title: 'Harmonize Standart Matrisi',
      description:
        'Makinenize uygulanan A, B ve C tipi harmonize standartları eşleştirin ve standart güncellemelerini kaçırmayın.',
      points: [
        'EN ISO 12100, EN 60204-1, EN ISO 13849-1',
        'Madde bazlı uygunluk doğrulaması',
        'Çoklu direktif (EMC, LVD, ATEX) eşleşmesi',
      ],
    },
    {
      icon: 'folder_managed',
      title: 'Teknik Dosya Yönetimi',
      description:
        'Devre şemaları, mukavemet hesapları, elektriksel test raporları ve kullanım kılavuzu referanslarını tek merkezde tutun.',
      points: [
        'Çizim (DWG) ve test raporu referansları',
        'Sürüm kontrollü teknik belge zinciri',
        'Eksik belge uyarı mekanizması',
      ],
    },
    {
      icon: 'verified',
      title: 'AT Uygunluk Beyanı (DoC) & CE',
      description:
        'Zorunlu onay alanları doğrulandığında AT Uygunluk Beyanını oluşturun ve denetime hazır JSON/rapor paketini indirin.',
      points: [
        'Sorumlu mühendis ve onay tarihi doğrulaması',
        'Tek tıkla denetim paketi dışa aktarımı',
        'Değişmez snapshot (anlık görüntü) koruması',
      ],
    },
    {
      icon: 'admin_panel_settings',
      title: 'Ekip, Rol (RBAC) ve Denetim İzi',
      description:
        'Mühendislerinize, kalite onaycılarınıza ve dış denetçilerinize görev bazlı granüler yetki tanımlayın.',
      points: [
        'Hazır CE mühendislik rol şablonları',
        'Değiştirilemez aktivite ve denetim günlüğü',
        '8 dil ve Arapça RTL arayüz desteği',
      ],
    },
  ];

  readonly steps = [
    {
      no: '1',
      title: 'Ücretsiz Hesabınızı Açın',
      text: 'Sol üstteki "Üye Ol" düğmesiyle 1 dakikada kuruluşunuzu ve üretim tesisinizi tanımlayın; 14 günlük deneme anında başlasın.',
    },
    {
      no: '2',
      title: 'Makine ve Risk Analizini Girin',
      text: 'İlk makinenizi ekleyin, EN ISO 12100 tehlike matrisini ve uygulanan harmonize standartları kaydedin.',
    },
    {
      no: '3',
      title: 'Teknik Dosya ve CE Beyanını Onaylayın',
      text: 'Kanıt belgelerini bağlayın, yetkili mühendis onayıyla AT uygunluk beyanını ve denetim paketini tek tıkla indirin.',
    },
  ];

  readonly faqs = [
    {
      q: '14 günlük ücretsiz deneme nasıl işliyor?',
      a: 'Üye olduğunuzda kredi kartı bilgisi girmeden Profesyonel paket özellikleriyle 14 gün boyunca tüm modülleri kullanabilirsiniz.',
    },
    {
      q: 'Abonelik paketleri ve online ödeme hazır mı?',
      a: 'Evet. Çalışma alanı içindeki "Plan ve Abonelik" sayfasından Başlangıç, Profesyonel veya Kurumsal paketi aylık/yıllık seçerek güvenli ödeme altyapısıyla aboneliğinizi başlatabilirsiniz.',
    },
    {
      q: 'Ekibime farklı roller ve izinler tanımlayabilir miyim?',
      a: 'Evet. CE Baş Mühendisi, Risk Uzmanı, Kalite Onay Yöneticisi ve Denetçi (Salt Okunur) şablonlarını kullanabilir veya özel izin matrisi oluşturabilirsiniz.',
    },
    {
      q: 'Kayıtlarımız resmi denetimler için izlenebilir mi?',
      a: 'Evet. Her kayıt oluşturma, güncelleme, onaylama ve arşivleme işlemi sürüm numarası ve kullanıcı kimliğiyle değişmez denetim izine (Audit Trail) kaydedilir.',
    },
  ];

  constructor() {
    document.documentElement.classList.toggle('dark', this.dark());
    void this.loadLivePricing();
  }

  async loadLivePricing(): Promise<void> {
    try {
      const res = await firstValueFrom(
        this.http.get<PublicPricingResponse>(
          `${environment.apiBaseUrl}/public/saas-pricing?product=machine-ce`,
        ),
      );
      const list = res.data?.plans ?? res.plans;
      if (Array.isArray(list) && list.length > 0) {
        this.plans.set(list);
      }
    } catch {
      // Keep DEFAULT_PLANS fallback
    }
  }

  planPrice(plan: PublicPlan): number {
    return (this.cycle() === 'monthly' ? plan.monthly : plan.yearly) ?? 0;
  }

  planDescription(id: string): string {
    return id === 'starter'
      ? 'Tek üretim tesisli KOBİ ve makine üreticileri için temel CE uyumu.'
      : id === 'pro'
        ? 'Çok tesisli fabrikalar, EN ISO 12100 risk matrisi ve gelişmiş CE raporlama.'
        : 'Kurumsal ölçekte sınırsız makine envanteri, denetim paketi ve öncelikli destek.';
  }

  planFeatures(id: string): string[] {
    return id === 'starter'
      ? [
          '100 CE / Makine kaydı kapasitesi',
          '3 mühendis / kullanıcı hesabı',
          'EN ISO 12100 risk skoru hesaplama',
          'Standart matrisi ve teknik dosya',
          'Temel denetim raporu çıktısı',
        ]
      : id === 'pro'
        ? [
            '1.500 CE / Makine kaydı kapasitesi',
            '15 mühendis / kullanıcı hesabı',
            'Gelişmiş CE teknik dosya kanıt paketi',
            'Rol tabanlı yetkilendirme (RBAC)',
            'Değişmez denetim izi (Audit Trail)',
          ]
        : [
            'Sınırsız CE / Makine kaydı',
            'Sınırsız mühendis & denetçi kullanıcısı',
            'Tüm tesislerde çoklu dil (8 Dil + RTL)',
            'Gelişmiş uyumluluk ve denetim paketi',
            'Öncelikli kurumsal mühendislik desteği',
          ];
  }

  toggleTheme(): void {
    this.dark.update((v) => !v);
    document.documentElement.classList.toggle('dark', this.dark());
    localStorage.setItem('odivon:theme', this.dark() ? 'dark' : 'light');
  }
}
