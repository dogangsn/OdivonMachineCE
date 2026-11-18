import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormField, form, minLength, required, submit } from '@angular/forms/signals';
import { ActivatedRoute } from '@angular/router';
import { AuthStore } from '../../core/auth/auth-store';
import { PageHeader } from '../../shared/ui/page-header';
import { SlideOver } from '../../shared/ui/slide-over';
import {
  BillingApi,
  BillingStatus,
  BuyerDraft,
  MachineCeEntitlements,
  PaymentRecord,
  SaasPlan,
} from './billing.api';
@Component({
  selector: 'app-billing-page',
  imports: [CurrencyPipe, DatePipe, FormField, PageHeader, SlideOver],
  template: `<div class="space-y-7">
      <app-page-header
        eyebrow="SAAS ABONELİK MERKEZİ"
        icon="credit_card"
        title="Plan, Kullanım ve Ödeme"
        description="Makine CE kayıt kapasitenizi izleyin, planınızı seçin ve sunucu tarafından doğrulanan güvenli ödemeleri yönetin."
      />
      @if (loading()) {
        <div class="grid min-h-80 place-items-center">
          <span class="material-symbols-rounded animate-spin !text-5xl text-indigo-600"
            >progress_activity</span
          >
        </div>
      } @else if (error()) {
        <div role="alert" class="odv-card p-8 text-center text-rose-600">{{ error() }}</div>
      } @else {
        <section class="grid gap-5 lg:grid-cols-[1.4fr_.6fr]">
          <article
            class="overflow-hidden rounded-2xl border border-slate-800/80 bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-950 p-7 text-white shadow-xl"
          >
            <div class="flex flex-wrap items-start justify-between gap-5">
              <div>
                <span
                  class="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/20 px-3 py-1 text-[10px] font-black tracking-widest text-emerald-300"
                >
                  <span class="size-1.5 animate-pulse rounded-full bg-emerald-400"></span>
                  {{ statusLabel(status()!) }}
                </span>
                <h2 class="mb-2 mt-4 text-2xl sm:text-3xl font-black tracking-tight">
                  MachineCE çalışma alanınız güvende
                </h2>
                <p class="m-0 max-w-2xl text-xs sm:text-sm leading-6 text-slate-300">
                  Teknik dosya ve denetim kayıtları tenant sınırında korunur; kapasite ve gelişmiş
                  uyumluluk paketi hakları seçili plana göre uygulanır.
                </p>
              </div>
              <span
                class="grid size-14 place-items-center rounded-2xl bg-white/10 text-indigo-300"
              >
                <span class="material-symbols-rounded !text-3xl">precision_manufacturing</span>
              </span>
            </div>
            <div class="mt-7 grid gap-3 sm:grid-cols-3">
              <div class="rounded-2xl border border-white/10 bg-white/10 p-4">
                <strong class="block text-2xl font-black"
                  >{{ entitlements()?.usage?.records ?? 0 }} /
                  {{ entitlements()?.records ?? '∞' }}</strong
                ><span class="text-xs text-slate-300">CE & Makine kaydı</span>
              </div>
              <div class="rounded-2xl border border-white/10 bg-white/10 p-4">
                <strong class="block text-2xl font-black">{{
                  entitlements()?.users ?? '∞'
                }}</strong
                ><span class="text-xs text-slate-300">Mühendis / Kullanıcı limiti</span>
              </div>
              <div class="rounded-2xl border border-white/10 bg-white/10 p-4">
                <strong class="block text-2xl font-black">{{
                  entitlements()?.advancedReports ? 'Açık' : 'Temel'
                }}</strong
                ><span class="text-xs text-slate-300">Teknik dosya paketi</span>
              </div>
            </div>
          </article>
          <article class="kpi-card flex flex-col justify-between p-6">
            <div>
              <span class="text-xs font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400"
                >DÖNEM DURUMU</span
              >
              <h3 class="mt-3 text-3xl font-black text-slate-900 dark:text-white">
                {{ status()?.daysLeft ?? '—' }} gün
              </h3>
              <p class="text-xs sm:text-sm text-slate-500">
                {{
                  status()?.subscriptionEndsAt
                    ? 'Dönem bitişi: ' + (status()?.subscriptionEndsAt | date: 'dd.MM.yyyy')
                    : '14 günlük kurumsal deneme dönemi'
                }}
              </p>
            </div>
            <div class="mt-5">
              <div class="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  class="h-full w-2/3 rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500"
                ></div>
              </div>
            </div>
          </article>
        </section>
        <section>
          <div class="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 class="m-0 text-xl font-black text-slate-900 dark:text-white">Planlar</h2>
              <p class="mb-0 mt-1 text-xs sm:text-sm text-slate-500">
                Yıllık ödemede iki aylık kurumsal avantaj.
              </p>
            </div>
            <div
              class="inline-flex rounded-2xl border border-slate-200/80 bg-slate-100 p-1 dark:border-slate-700/80 dark:bg-slate-800"
            >
              <button
                type="button"
                class="rounded-xl px-4 py-2 text-xs font-bold transition-all"
                [class.bg-white]="cycle() === 'monthly'"
                [class.dark:bg-slate-700]="cycle() === 'monthly'"
                [class.shadow-xs]="cycle() === 'monthly'"
                (click)="cycle.set('monthly')"
              >
                Aylık</button
              ><button
                type="button"
                class="rounded-xl px-4 py-2 text-xs font-bold transition-all"
                [class.bg-white]="cycle() === 'yearly'"
                [class.dark:bg-slate-700]="cycle() === 'yearly'"
                [class.shadow-xs]="cycle() === 'yearly'"
                (click)="cycle.set('yearly')"
              >
                Yıllık
              </button>
            </div>
          </div>
          <div class="grid gap-5 lg:grid-cols-3">
            @for (plan of plans(); track plan.id; let index = $index) {
              <article
                class="kpi-card relative flex flex-col justify-between p-6"
                [class.ring-2]="index === 1"
                [class.ring-indigo-500]="index === 1"
              >
                <div>
                  @if (entitlements()?.planId === plan.id) {
                    <span class="odv-badge-success absolute end-4 top-4 !text-[10px]"
                      >MEVCUT PLAN</span
                    >
                  }
                  <h3 class="m-0 text-xl font-black text-slate-900 dark:text-white">
                    {{ plan.name }}
                  </h3>
                  <p class="mt-2 text-xs sm:text-sm text-slate-500">{{ description(plan.id) }}</p>
                  <div class="my-6">
                    <strong class="text-4xl font-black text-slate-900 dark:text-white">{{
                      price(plan) | currency: 'TRY' : 'symbol-narrow' : '1.0-0' : 'tr-TR'
                    }}</strong
                    ><span class="text-xs font-semibold text-slate-500">
                      / {{ cycle() === 'monthly' ? 'ay' : 'yıl' }}</span
                    >
                  </div>
                  <ul class="mb-6 space-y-3 text-xs sm:text-sm">
                    @for (feature of features(plan.id); track feature) {
                      <li class="flex items-center gap-2.5">
                        <span class="material-symbols-rounded text-emerald-600">check_circle</span
                        >{{ feature }}
                      </li>
                    }
                  </ul>
                </div>
                <button
                  type="button"
                  class="w-full"
                  [class.odv-btn-primary]="index === 1"
                  [class.odv-btn-soft]="index !== 1"
                  [disabled]="auth.session()?.role !== 'owner' || !price(plan)"
                  (click)="selectPlan(plan)"
                >
                  {{
                    auth.session()?.role === 'owner'
                      ? 'Bu planı seç'
                      : 'Yalnız hesap sahibi değiştirebilir'
                  }}
                </button>
              </article>
            }
          </div>
        </section>
        <section class="odv-card overflow-hidden">
          <div class="border-b border-slate-200/80 p-5 dark:border-slate-800">
            <h2 class="m-0 text-lg font-black text-slate-900 dark:text-white">
              Ödeme ve makbuz geçmişi
            </h2>
          </div>
          <div class="overflow-x-auto custom-scroll">
            <table class="w-full min-w-[760px] border-collapse">
              <thead>
                <tr>
                  <th class="odv-th">Makbuz</th>
                  <th class="odv-th">Plan</th>
                  <th class="odv-th">Dönem</th>
                  <th class="odv-th">Tutar</th>
                  <th class="odv-th">Ödeme tarihi</th>
                </tr>
              </thead>
              <tbody>
                @for (payment of history(); track payment.id) {
                  <tr class="hover:bg-indigo-50/40 dark:hover:bg-slate-800/60">
                    <td class="odv-td font-mono text-xs">{{ payment.receiptNo }}</td>
                    <td class="odv-td font-bold">{{ payment.planId }}</td>
                    <td class="odv-td">
                      {{ payment.periodStartsAt | date: 'dd.MM.yyyy' }} –
                      {{ payment.periodEndsAt | date: 'dd.MM.yyyy' }}
                    </td>
                    <td class="odv-td font-bold">
                      {{ payment.amountKurus / 100 | currency: payment.currency }}
                    </td>
                    <td class="odv-td">{{ payment.paidAt | date: 'dd.MM.yyyy HH:mm' }}</td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="5" class="p-10 text-center text-xs sm:text-sm text-slate-500">
                      Henüz tamamlanmış ödeme yok.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </section>
      }
    </div>
    <app-slide-over
      [open]="drawerOpen()"
      [wide]="true"
      [dirty]="buyerForm().dirty()"
      [submitting]="saving()"
      title="Güvenli ödeme bilgileri"
      [description]="selectedPlan()?.name ?? ''"
      eyebrow="IYZICO GÜVENLİ ÖDEME"
      icon="credit_card"
      submitLabel="Güvenli ödemeye geç"
      (closed)="drawerOpen.set(false)"
      (submitted)="checkout()"
    >
      @if (saveError()) {
        <div role="alert" class="rounded-xl bg-rose-50 p-4 text-sm font-semibold text-rose-700">
          {{ saveError() }}
        </div>
      }
      <section class="odv-card p-5">
        <div class="grid gap-4 sm:grid-cols-2">
          <label
            ><span class="mb-1 block text-xs font-bold">Ad *</span
            ><input class="odv-input" [formField]="buyerForm.name" /></label
          ><label
            ><span class="mb-1 block text-xs font-bold">Soyad *</span
            ><input class="odv-input" [formField]="buyerForm.surname" /></label
          ><label
            ><span class="mb-1 block text-xs font-bold">T.C. kimlik no *</span
            ><input
              class="odv-input"
              inputmode="numeric"
              [formField]="buyerForm.identityNumber" /></label
          ><label
            ><span class="mb-1 block text-xs font-bold">Telefon *</span
            ><input class="odv-input" [formField]="buyerForm.gsmNumber" /></label
          ><label
            ><span class="mb-1 block text-xs font-bold">Şehir *</span
            ><input class="odv-input" [formField]="buyerForm.city" /></label
          ><label
            ><span class="mb-1 block text-xs font-bold">E-posta *</span
            ><input class="odv-input" type="email" [formField]="buyerForm.email" /></label
          ><label class="sm:col-span-2"
            ><span class="mb-1 block text-xs font-bold">Fatura adresi *</span
            ><textarea class="odv-input min-h-24" [formField]="buyerForm.address"></textarea>
          </label>
        </div></section
    ></app-slide-over>`,
})
export class BillingPage {
  readonly auth = inject(AuthStore);
  readonly plans = signal<SaasPlan[]>([]);
  readonly status = signal<BillingStatus | null>(null);
  readonly history = signal<PaymentRecord[]>([]);
  readonly entitlements = signal<MachineCeEntitlements | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly cycle = signal<'monthly' | 'yearly'>('yearly');
  readonly drawerOpen = signal(false);
  readonly selectedPlan = signal<SaasPlan | null>(null);
  readonly saving = signal(false);
  readonly saveError = signal('');
  readonly buyer = signal<BuyerDraft>({
    name: '',
    surname: '',
    identityNumber: '',
    email: this.auth.session()?.email ?? '',
    gsmNumber: '',
    address: '',
    city: '',
    country: 'Turkey',
  });
  readonly buyerForm = form(this.buyer, (p) => {
    required(p.name);
    required(p.surname);
    required(p.identityNumber);
    minLength(p.identityNumber, 11);
    required(p.email);
    required(p.gsmNumber);
    required(p.address);
    required(p.city);
  });
  private readonly api = inject(BillingApi);
  private readonly route = inject(ActivatedRoute);
  private readonly fallbackPlans: SaasPlan[] = [
    { id: 'starter', name: 'Başlangıç', monthly: 99, yearly: 1100 },
    { id: 'pro', name: 'Profesyonel', monthly: 199, yearly: 2200 },
    { id: 'enterprise', name: 'Kurumsal', monthly: 399, yearly: 3380 },
  ];
  constructor() {
    void this.load();
  }
  async load() {
    try {
      const [plans, status, history, access] = await Promise.all([
        this.api.plans(),
        this.api.status(),
        this.api.history(),
        this.api.entitlements(),
      ]);
      const resolvedPlans = plans?.length ? plans : this.fallbackPlans;
      this.plans.set(resolvedPlans);
      this.status.set(status);
      this.history.set(history);
      this.entitlements.set(access);

      const requestedPlanId = this.route.snapshot.queryParamMap.get('plan');
      if (requestedPlanId && this.auth.session()?.role === 'owner') {
        const match = resolvedPlans.find((item) => item.id === requestedPlanId);
        if (match) {
          this.selectPlan(match);
        }
      }
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Abonelik verileri alınamadı.');
    } finally {
      this.loading.set(false);
    }
  }
  price(plan: SaasPlan) {
    return this.cycle() === 'monthly' ? plan.monthly : plan.yearly;
  }
  selectPlan(plan: SaasPlan) {
    this.selectedPlan.set(plan);
    this.drawerOpen.set(true);
  }
  checkout() {
    submit(this.buyerForm, async () => {
      const plan = this.selectedPlan();
      if (!plan) return;
      this.saving.set(true);
      try {
        window.location.assign(await this.api.checkout(plan.id, this.cycle(), this.buyer()));
      } catch (e) {
        this.saveError.set(e instanceof Error ? e.message : 'Ödeme başlatılamadı.');
        this.saving.set(false);
      }
    });
  }
  statusLabel(s: BillingStatus) {
    return s.inGrace
      ? 'EK SÜRE'
      : s.membershipStatus === 'active'
        ? 'AKTİF ABONELİK'
        : s.membershipStatus === 'trial'
          ? 'ÜCRETSİZ DENEME'
          : 'ERİŞİM SONA ERDİ';
  }
  description(id: string) {
    return id === 'starter'
      ? 'Tek üretim tesisli ekipler için temel Makine CE ve teknik dosya uyumu.'
      : id === 'pro'
        ? 'Çok tesisli operasyonlar, EN ISO 12100 risk matrisi ve gelişmiş CE raporlama.'
        : 'Kurumsal ölçekte sınırsız makine envanteri, denetim paketi ve öncelikli destek.';
  }
  features(id: string) {
    return id === 'starter'
      ? ['100 CE / makine kaydı', '3 mühendis kullanıcısı', 'Temel teknik dosya raporu']
      : id === 'pro'
        ? ['1.500 CE / makine kaydı', '15 mühendis kullanıcısı', 'Gelişmiş CE kanıt paketi']
        : ['Sınırsız CE kaydı', 'Sınırsız kullanıcı', 'Öncelikli kurumsal destek'];
  }
}
