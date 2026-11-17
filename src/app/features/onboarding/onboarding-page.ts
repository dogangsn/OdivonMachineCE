import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { email, FormField, form, required, submit } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthStore } from '../../core/auth/auth-store';

@Component({
  selector: 'app-onboarding-page',
  imports: [FormField],
  template: `<main class="min-h-screen bg-[#f8fafc] p-5 dark:bg-[#0b1120]">
    <div class="mx-auto max-w-6xl py-6">
      <header class="mb-7 flex items-center gap-3.5">
        <span
          class="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-600 to-purple-700 text-white shadow-lg shadow-indigo-500/25"
          ><span class="material-symbols-rounded">precision_manufacturing</span></span
        >
        <div>
          <strong class="text-lg font-black tracking-tight text-slate-900 dark:text-white"
            >Odivon MachineCE</strong
          ><span class="block text-xs font-medium text-slate-500"
            >Makine Emniyeti ve CE Uygunluk Çalışma Alanı Kurulumu</span
          >
        </div>
      </header>
      <div class="grid gap-6 lg:grid-cols-[.75fr_1.25fr]">
        <aside
          class="odv-card relative overflow-hidden !bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-950 p-7 text-white"
        >
          <span
            class="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-indigo-200"
            >KURULUŞ PROFİLİ · ADIM 1/1</span
          >
          <h1 class="mt-4 text-2xl sm:text-3xl font-black tracking-tight">
            Denetime hazır CE kanıt zinciri temelini kurun
          </h1>
          <p class="mt-2 text-xs sm:text-sm leading-relaxed text-slate-300">
            Bu bilgiler teknik dosyalarda, EN ISO 12100 risk raporlarında ve AT uygunluk
            beyanlarında (2006/42/EC · AB 2023/1230) resmi üretici/işletmeci kimliği olarak
            kullanılır.
          </p>
          <ul class="mt-7 space-y-4 text-xs sm:text-sm text-slate-200">
            <li class="flex items-start gap-3">
              <span class="material-symbols-rounded text-emerald-400">check_circle</span>
              <span>Tenant izolasyonu ve rol tabanlı mühendislik yetkileri</span>
            </li>
            <li class="flex items-start gap-3">
              <span class="material-symbols-rounded text-emerald-400">check_circle</span>
              <span>Tesis bazlı makine envanteri, standart matrisi ve periyodik inceleme takvimi</span>
            </li>
            <li class="flex items-start gap-3">
              <span class="material-symbols-rounded text-emerald-400">check_circle</span>
              <span>Değişmez denetim izi (Audit Trail) ve tek tıkla teknik dosya paketi</span>
            </li>
          </ul>
        </aside>
        <section class="odv-card p-7 sm:p-9">
          <h2 class="m-0 text-xl font-black text-slate-900 dark:text-white">
            Kuruluş, üretim tesisi ve teknik dosya sorumlusu
          </h2>
          <form class="mt-6 grid gap-4 sm:grid-cols-2" (submit)="complete($event)">
            <label class="sm:col-span-2"
              ><span class="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">Ticari unvan *</span>
              <input
                class="odv-input"
                autocomplete="organization"
                [formField]="setupForm.legalName" /></label
            ><label
              ><span class="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">Vergi / kayıt numarası</span>
              <input class="odv-input" [formField]="setupForm.taxNumber" /></label
            ><label
              ><span class="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">Üretim tesisi / Fabrika *</span>
              <input class="odv-input" [formField]="setupForm.productionSite" /></label
            ><label
              ><span class="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">Ülke *</span>
              <input class="odv-input" [formField]="setupForm.country" /></label
            ><label
              ><span class="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">Saat dilimi *</span>
              <select class="odv-input" [formField]="setupForm.timezone">
                <option value="Europe/Istanbul">Europe/Istanbul</option>
                <option value="Europe/Berlin">Europe/Berlin</option>
                <option value="Europe/London">Europe/London</option>
              </select></label
            ><label class="sm:col-span-2"
              ><span class="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">Hedef pazarlar & Direktif kapsamı *</span>
              <input
                class="odv-input"
                placeholder="TR, EU (CE), UK (UKCA)"
                [formField]="setupForm.targetMarketsText" /></label
            ><label
              ><span class="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">Teknik dosya / CE sorumlusu *</span>
              <input class="odv-input" [formField]="setupForm.regulatoryContactName" /></label
            ><label
              ><span class="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">Sorumlu e-posta *</span>
              <input
                class="odv-input"
                type="email"
                [formField]="setupForm.regulatoryContactEmail" /></label
            ><label
              ><span class="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">Sorumlu telefon</span>
              <input class="odv-input" [formField]="setupForm.regulatoryContactPhone"
            /></label>
            @if (error()) {
              <div
                role="alert"
                class="sm:col-span-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs sm:text-sm font-bold text-rose-700"
              >
                {{ error() }}
              </div>
            }
            <div class="sm:col-span-2 mt-2">
              <button
                class="odv-btn-primary w-full justify-center sm:w-auto"
                type="submit"
                [disabled]="saving()"
              >
                <span class="material-symbols-rounded">rocket_launch</span>
                {{ saving() ? 'Kuruluyor…' : 'Çalışma alanını tamamla' }}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  </main>`,
})
export class OnboardingPage {
  readonly auth = inject(AuthStore);
  readonly model = signal({
    legalName: this.auth.session()?.tenantName ?? '',
    taxNumber: '',
    productionSite: '',
    country: 'Türkiye',
    timezone: 'Europe/Istanbul',
    targetMarketsText: 'TR, EU',
    regulatoryContactName: this.auth.session()?.name ?? '',
    regulatoryContactEmail: this.auth.session()?.email ?? '',
    regulatoryContactPhone: '',
  });
  readonly setupForm = form(this.model, (p) => {
    required(p.legalName);
    required(p.productionSite);
    required(p.country);
    required(p.timezone);
    required(p.targetMarketsText);
    required(p.regulatoryContactName);
    required(p.regulatoryContactEmail);
    email(p.regulatoryContactEmail);
  });
  readonly saving = signal(false);
  readonly error = signal('');
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  complete(event: Event) {
    event.preventDefault();
    submit(this.setupForm, async () => {
      this.saving.set(true);
      this.error.set('');
      try {
        await firstValueFrom(
          this.http.post(`${environment.apiBaseUrl}/machine-ce/onboarding/complete`, {
            ...this.model(),
            targetMarkets: this.model()
              .targetMarketsText.split(',')
              .map((item) => item.trim())
              .filter(Boolean),
            targetMarketsText: undefined,
          }),
        );
        await this.auth.refreshProfile();
        await this.router.navigateByUrl('/overview');
      } catch (e) {
        this.error.set(e instanceof Error ? e.message : 'Kurulum tamamlanamadı.');
      } finally {
        this.saving.set(false);
      }
    });
  }
}
