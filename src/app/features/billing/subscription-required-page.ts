import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../../core/auth/auth-store';
@Component({
  selector: 'app-subscription-required-page',
  imports: [DatePipe, RouterLink],
  template: `<main class="mx-auto grid min-h-[70vh] max-w-4xl place-items-center px-4 py-10">
    <section class="odv-card w-full overflow-hidden">
      <div
        class="grid gap-8 bg-gradient-to-br from-slate-900 via-rose-950 to-indigo-950 p-8 text-white md:grid-cols-[1fr_auto] md:items-center"
      >
        <div>
          <span class="odv-badge-warning">ERİŞİM BEKLEMEDE</span>
          <h1 class="mb-3 mt-5 text-3xl sm:text-4xl font-black tracking-tight">
            Abonelik süresi sona erdi
          </h1>
          <p class="m-0 max-w-2xl text-xs sm:text-sm leading-7 text-slate-300">
            Makine envanteri ve teknik dosya kayıtlarınız güvenle korunuyor. Yeni CE kaydı
            oluşturmak ve denetim akışına devam etmek için aboneliğin yenilenmesi gerekiyor.
          </p>
        </div>
        <span class="material-symbols-rounded !text-7xl text-amber-300">lock_clock</span>
      </div>
      <div class="grid gap-5 p-8 md:grid-cols-3">
        <div
          class="rounded-2xl border border-slate-200/70 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-800/60"
        >
          <strong class="block text-xs sm:text-sm font-bold">Son erişim tarihi</strong
          ><span class="mt-1 block text-xs sm:text-sm text-slate-500">{{
            (auth.session()?.subscriptionEndsAt | date: 'dd.MM.yyyy') || '—'
          }}</span>
        </div>
        <div
          class="rounded-2xl border border-slate-200/70 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-800/60"
        >
          <strong class="block text-xs sm:text-sm font-bold">Veriler silinmedi</strong
          ><span class="mt-1 block text-xs sm:text-sm text-slate-500"
            >Değişmez CE denetim izi korunur.</span
          >
        </div>
        <div
          class="rounded-2xl border border-slate-200/70 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-800/60"
        >
          <strong class="block text-xs sm:text-sm font-bold">Kurumsal Destek</strong
          ><a
            class="mt-1 block text-xs sm:text-sm font-bold text-indigo-600 dark:text-indigo-400"
            href="mailto:destek@odivon.com"
            >destek@odivon.com</a
          >
        </div>
        @if (isManager) {
          <div class="md:col-span-3 text-end">
            <a class="odv-btn-primary" routerLink="/billing">
              <span class="material-symbols-rounded">credit_card</span>Aboneliği yenile
            </a>
          </div>
        }
      </div>
    </section>
  </main>`,
})
export class SubscriptionRequiredPage {
  readonly auth = inject(AuthStore);
  readonly isManager = ['owner', 'admin'].includes(this.auth.session()?.role ?? '');
}
