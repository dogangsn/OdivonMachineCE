import { Component, inject, signal } from '@angular/core';
import {
  email,
  FormField,
  form,
  minLength,
  required,
  submit,
  validate,
} from '@angular/forms/signals';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthStore } from '../../core/auth/auth-store';
import { TranslatePipe } from '../../core/i18n/i18n';
import { PRODUCT } from '../../domain/product-manifest';

@Component({
  selector: 'app-auth-page',
  imports: [FormField, RouterLink, TranslatePipe],
  template: `
    <main class="min-h-screen bg-slate-950 text-white lg:grid lg:grid-cols-[1.08fr_.92fr]">
      <section
        class="relative hidden overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 p-12 lg:flex lg:flex-col lg:justify-between"
      >
        <div
          class="pointer-events-none absolute -start-20 top-20 size-96 rounded-full bg-indigo-500/20 blur-3xl"
        ></div>
        <div
          class="pointer-events-none absolute bottom-10 end-10 size-80 rounded-full bg-fuchsia-500/15 blur-3xl"
        ></div>
        <div class="relative flex items-center gap-3.5">
          <span
            class="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30"
            ><span class="material-symbols-rounded">precision_manufacturing</span></span
          >
          <div>
            <strong class="text-xl font-black tracking-tight">Odivon</strong>
            <span class="block text-xs font-semibold text-indigo-200">{{ product.name }}</span>
          </div>
        </div>
        <div class="relative max-w-2xl">
          <span
            class="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-bold text-indigo-100 backdrop-blur-xs"
          >
            <span class="size-2 animate-pulse rounded-full bg-emerald-400"></span>
            2006/42/EC · AB 2023/1230 Makine CE Operasyon Merkezi
          </span>
          <h1 class="m-0 text-4xl font-black leading-tight tracking-tight xl:text-5xl">
            Risk analizinden AT uygunluk beyanına,<br />tek kanıt zinciriyle güvenle yönetin.
          </h1>
          <p class="mt-6 max-w-xl text-base leading-relaxed text-indigo-100/90">
            {{ product.promiseKey | t }}
          </p>
          <div class="mt-10 grid grid-cols-3 gap-3.5">
            <div class="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-xs">
              <strong class="block text-2xl font-black">EN ISO 12100</strong>
              <span class="mt-1 block text-xs text-indigo-200">Risk Değerlendirme Matrisi</span>
            </div>
            <div class="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-xs">
              <strong class="block text-2xl font-black">8 Dil + RTL</strong>
              <span class="mt-1 block text-xs text-indigo-200">Uluslararası Denetim Paketi</span>
            </div>
            <div class="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-xs">
              <strong class="block text-2xl font-black">%100</strong>
              <span class="mt-1 block text-xs text-indigo-200">Değişmez Denetim İzi</span>
            </div>
          </div>
        </div>
        <p class="relative text-xs font-medium text-indigo-300/80">
          Odivon Kurumsal Bulut Altyapısı · Tenant İzolasyonu & KVKK/GDPR Uyumlu
        </p>
      </section>
      <section
        class="flex min-h-screen items-center justify-center bg-[#f8fafc] p-5 text-slate-900 dark:bg-[#0b1120] dark:text-white"
      >
        <div class="odv-card w-full max-w-md p-7 sm:p-9">
          <div class="mb-7 flex items-center gap-3 lg:hidden">
            <span
              class="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white"
              ><span class="material-symbols-rounded">precision_manufacturing</span></span
            ><strong>Odivon · {{ product.name }}</strong>
          </div>
          <div class="mb-7">
            <span
              class="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
            >
              <span class="size-1.5 rounded-full bg-indigo-500"></span>
              {{ isRegister ? 'Yeni çalışma alanı' : 'Tekrar hoş geldiniz' }}
            </span>
            <h2 class="mb-2 mt-3 text-2xl font-black tracking-tight sm:text-3xl">
              {{ isRegister ? 'Hesabınızı oluşturun' : 'Hesabınıza giriş yapın' }}
            </h2>
            <p class="m-0 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {{
                isRegister
                  ? 'Makine emniyeti ve CE uyumluluk operasyonunuzu birkaç adımda başlatın.'
                  : 'MachineCE operasyon merkezine güvenli erişim sağlayın.'
              }}
            </p>
          </div>
          <form class="space-y-4" (submit)="onSubmit($event)">
            @if (isRegister) {
              <label class="block"
                ><span class="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">Ad soyad</span>
                <input class="odv-input" [formField]="authForm.name" autocomplete="name" />
                @if (authForm.name().touched() && authForm.name().invalid()) {
                  <span class="mt-1 block text-xs text-rose-600">Ad soyad zorunludur.</span>
                }</label
              ><label class="block"
                ><span class="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">Şirket / Kuruluş adı</span>
                <input
                  class="odv-input"
                  [formField]="authForm.company"
                  autocomplete="organization"
              /></label>
            }
            <label class="block"
              ><span class="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">E-posta adresi</span>
              <input
                class="odv-input"
                type="email"
                [formField]="authForm.email"
                autocomplete="email"
              />
              @if (authForm.email().touched() && authForm.email().invalid()) {
                <span class="mt-1 block text-xs text-rose-600">Geçerli bir e-posta girin.</span>
              }
            </label>
            <label class="block"
              ><span class="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">Şifre</span>
              <div class="relative">
                <input
                  class="odv-input pe-12"
                  [type]="showPassword() ? 'text' : 'password'"
                  [formField]="authForm.password"
                  [autocomplete]="isRegister ? 'new-password' : 'current-password'"
                /><button
                  class="odv-icon-btn absolute end-1 top-1/2 -translate-y-1/2"
                  type="button"
                  (click)="showPassword.update((v) => !v)"
                  [attr.aria-label]="showPassword() ? 'Şifreyi gizle' : 'Şifreyi göster'"
                >
                  <span class="material-symbols-rounded">{{
                    showPassword() ? 'visibility_off' : 'visibility'
                  }}</span>
                </button>
              </div>
              @if (authForm.password().touched() && authForm.password().invalid()) {
                <span class="mt-1 block text-xs text-rose-600"
                  >Şifre en az 8 karakter olmalıdır.</span
                >
              }
            </label>
            @if (!isRegister) {
              <div class="-mt-1 text-end">
                <a
                  routerLink="/forgot-password"
                  class="text-xs font-bold text-indigo-600 hover:underline dark:text-indigo-400"
                  >Şifremi unuttum</a
                >
              </div>
            }
            @if (error()) {
              <div
                role="alert"
                class="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/60 dark:text-rose-300"
              >
                {{ error() }}
              </div>
            }
            @if (isRegister) {
              <label
                class="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-slate-50 p-3 text-xs leading-5 dark:border-slate-800 dark:bg-slate-800/60"
              >
                <input
                  class="mt-1 size-4 accent-indigo-600"
                  type="checkbox"
                  [checked]="consent()"
                  (change)="consent.set($any($event.target).checked)"
                />
                <span
                  ><a class="font-bold text-indigo-600 dark:text-indigo-400" href="/legal/terms" target="_blank"
                    >Kullanım koşullarını</a
                  >
                  ve
                  <a class="font-bold text-indigo-600 dark:text-indigo-400" href="/legal/privacy" target="_blank"
                    >gizlilik bildirimini</a
                  >
                  okudum, kabul ediyorum.</span
                >
              </label>
            }
            <button class="odv-btn-primary w-full" type="submit" [disabled]="busy()">
              {{ busy() ? 'İşleniyor…' : isRegister ? 'Ücretsiz hesap oluştur' : 'Giriş yap' }}
            </button>
          </form>
          <p class="mt-6 text-center text-xs sm:text-sm text-slate-500">
            {{ isRegister ? 'Zaten hesabınız var mı?' : 'Henüz hesabınız yok mu?' }}
            <a
              class="font-bold text-indigo-600 hover:underline dark:text-indigo-400"
              [routerLink]="isRegister ? '/login' : '/register'"
              >{{ isRegister ? 'Giriş yapın' : 'Hesap oluşturun' }}</a
            >
          </p>
        </div>
      </section>
    </main>
  `,
})
export class AuthPage {
  readonly product = PRODUCT;
  readonly isRegister = inject(ActivatedRoute).snapshot.data['mode'] === 'register';
  readonly showPassword = signal(false);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly consent = signal(false);
  readonly model = signal({ name: '', company: '', email: '', password: '' });
  readonly authForm = form(this.model, (p) => {
    if (this.isRegister) required(p.name);
    required(p.email);
    email(p.email);
    required(p.password);
    minLength(p.password, this.isRegister ? 10 : 8);
    if (this.isRegister)
      validate(p.password, ({ value }) =>
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/.test(value())
          ? undefined
          : { kind: 'passwordStrength', message: 'Şifre yeterince güçlü değil.' },
      );
  });
  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);
  onSubmit(event: Event): void {
    event.preventDefault();
    submit(this.authForm, async () => {
      this.busy.set(true);
      this.error.set('');
      try {
        const value = this.model();
        if (this.isRegister && !this.consent()) throw new Error('Koşulları kabul etmelisiniz.');
        if (this.isRegister)
          await this.auth.register(value.name, value.company, value.email, value.password);
        else await this.auth.signIn(value.email, value.password);
        await this.router.navigateByUrl('/overview');
      } catch (error) {
        this.error.set(error instanceof Error ? error.message : 'İşlem tamamlanamadı.');
      } finally {
        this.busy.set(false);
      }
    });
  }
}
