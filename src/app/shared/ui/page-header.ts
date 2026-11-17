import { Component, input } from '@angular/core';

@Component({
  selector: 'app-page-header',
  template: `
    <header
      class="relative mb-6 overflow-hidden rounded-2xl border border-slate-200/80 bg-white px-5 py-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:px-7 sm:py-6"
    >
      <div
        class="pointer-events-none absolute -end-16 -top-20 size-56 rounded-full bg-indigo-500/10 blur-3xl"
      ></div>
      <div
        class="pointer-events-none absolute end-24 top-0 h-px w-48 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"
      ></div>
      <div class="relative flex flex-wrap items-center justify-between gap-4">
        <div class="min-w-0">
          @if (eyebrow()) {
            <div
              class="mb-2.5 inline-flex items-center gap-2 rounded-full border border-indigo-200/70 bg-indigo-50/80 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-indigo-700 dark:border-indigo-800/60 dark:bg-indigo-950/60 dark:text-indigo-300"
            >
              <span class="size-1.5 rounded-full bg-indigo-500"></span>{{ eyebrow() }}
            </div>
          }
          <div class="flex items-center gap-3.5">
            <span
              class="grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 via-violet-600 to-purple-700 text-white shadow-md shadow-indigo-500/20"
            >
              <span class="material-symbols-rounded" aria-hidden="true">{{ icon() }}</span>
            </span>
            <div>
              <h1
                class="m-0 text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl"
              >
                {{ title() }}
              </h1>
              @if (description()) {
                <p
                  class="mb-0 mt-1 max-w-[68ch] text-xs font-medium leading-relaxed text-slate-500 dark:text-slate-400 sm:text-sm"
                >
                  {{ description() }}
                </p>
              }
            </div>
          </div>
        </div>
        <div class="flex flex-wrap items-center gap-2.5"><ng-content select="[actions]" /></div>
      </div>
    </header>
  `,
})
export class PageHeader {
  readonly eyebrow = input('');
  readonly icon = input('precision_manufacturing');
  readonly title = input.required<string>();
  readonly description = input('');
}
