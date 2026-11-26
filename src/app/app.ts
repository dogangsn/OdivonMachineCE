import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SeoService } from './core/seo/seo';
import { VersionStore } from './core/version/version-store';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `
    <router-outlet />
    @if (version.updateRequired()) {
      <div
        class="fixed inset-0 z-[90] grid place-items-center bg-slate-950/75 p-4 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="update-title"
      >
        <section
          class="odv-card relative w-full max-w-md overflow-hidden p-7 text-center shadow-2xl"
        >
          <div
            class="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400"
          ></div>
          <div class="relative mx-auto mb-4 inline-flex items-center justify-center">
            <span
              class="grid size-16 place-items-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/70 dark:text-indigo-400"
            >
              <span class="material-symbols-rounded !text-4xl">rocket_launch</span>
            </span>
            <span class="absolute -end-1 -top-1 flex size-3.5">
              <span
                class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"
              ></span>
              <span
                class="relative inline-flex size-3.5 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900"
              ></span>
            </span>
          </div>
          <span class="odv-badge-info mb-2">YENİ SÜRÜM YAYINLANDI</span>
          <h2 id="update-title" class="m-0 text-xl font-black text-slate-900 dark:text-white">
            Uygulama güncellemesi hazır
          </h2>
          <p class="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Güvenliğiniz için çerezler ve eski oturum önbelleği temizlenerek en güncel sürüme
            geçilecek ve giriş ekranına yönlendirileceksiniz.
          </p>
          @if (version.remote()?.version) {
            <div
              class="mt-3 inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-1.5 font-mono text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              <span>v{{ version.current.version }}</span>
              <span class="material-symbols-rounded !text-sm text-indigo-500">arrow_forward</span>
              <span class="text-emerald-600 dark:text-emerald-400"
                >v{{ version.remote()?.version }}</span
              >
            </div>
          }
          <button
            type="button"
            class="odv-btn-primary mt-6 w-full"
            [disabled]="version.updating()"
            (click)="version.applyUpdate()"
          >
            <span class="material-symbols-rounded">system_update_alt</span>
            {{ version.updating() ? 'Çerezler temizleniyor…' : 'Güncelle ve girişe git' }}
          </button>
        </section>
      </div>
    }
  `,
})
export class App {
  readonly version = inject(VersionStore);
  constructor() {
    inject(SeoService).start();
    this.version.start();
  }
}
