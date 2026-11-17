import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PageHeader } from '../../shared/ui/page-header';
interface Audit {
  id: string;
  event: string;
  entity: string;
  entityId: string;
  version: number;
  actorId: string;
  createdAt: string;
}
@Component({
  selector: 'app-activity-page',
  imports: [PageHeader, DatePipe],
  template: `<div class="space-y-6">
    <app-page-header
      eyebrow="DEĞİŞMEZ DENETİM İZİ"
      icon="history"
      title="Aktivite ve Denetim Günlüğü"
      description="Makine envanteri, risk analizi, teknik dosya ve AT uygunluk beyanlarındaki tüm sürüm kontrollü değişiklikler."
    />
    <section class="odv-card overflow-hidden">
      @if (loading()) {
        <div class="grid min-h-64 place-items-center">
          <span class="material-symbols-rounded animate-spin !text-4xl text-indigo-600"
            >progress_activity</span
          >
        </div>
      } @else if (error()) {
        <div role="alert" class="p-10 text-center text-sm text-rose-600">{{ error() }}</div>
      } @else {
        <div class="divide-y divide-slate-100 dark:divide-slate-800">
          @for (item of items(); track item.id) {
            <article
              class="grid gap-4 p-5 transition-colors hover:bg-indigo-50/30 dark:hover:bg-slate-800/40 sm:grid-cols-[auto_1fr_auto] sm:items-center"
            >
              <span
                class="grid size-11 place-items-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/70 dark:text-indigo-400"
                ><span class="material-symbols-rounded">{{ icon(item.event) }}</span></span
              >
              <div>
                <div class="flex flex-wrap items-center gap-2">
                  <strong class="text-sm font-bold text-slate-900 dark:text-white">{{
                    label(item.event)
                  }}</strong>
                  <span class="odv-badge-info !text-[10px]">Sürüm {{ item.version }}</span>
                </div>
                <span class="mt-1 block font-mono text-[11px] text-slate-500"
                  >{{ item.entity }} / {{ item.entityId }}</span
                >
              </div>
              <div class="text-start sm:text-end">
                <time class="block text-xs font-bold text-slate-700 dark:text-slate-300">{{
                  item.createdAt | date: 'dd.MM.yyyy HH:mm'
                }}</time>
                <span class="text-[11px] text-slate-400">Aktör: {{ item.actorId }}</span>
              </div>
            </article>
          } @empty {
            <div class="p-14 text-center">
              <div
                class="mx-auto mb-3 grid size-14 place-items-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800"
              >
                <span class="material-symbols-rounded !text-3xl">history</span>
              </div>
              <strong class="block text-sm font-bold text-slate-900 dark:text-white"
                >Henüz denetim olayı bulunmuyor</strong
              >
              <span class="mt-1 block text-xs text-slate-500">
                CE kayıtlarında yapılan her işlem burada değişmez biçimde listelenir.
              </span>
            </div>
          }
        </div>
      }
    </section>
  </div>`,
})
export class ActivityPage {
  readonly items = signal<Audit[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  private readonly http = inject(HttpClient);
  constructor() {
    void this.load();
  }
  async load() {
    try {
      const response = await firstValueFrom(
        this.http.get<{ data: Audit[] }>(`${environment.apiBaseUrl}/machine-ce/audit?limit=100`),
      );
      this.items.set(response.data);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Aktivite günlüğü alınamadı.');
    } finally {
      this.loading.set(false);
    }
  }
  label(e: string) {
    return e.endsWith('.created')
      ? 'Yeni CE kaydı oluşturuldu'
      : e.endsWith('.updated')
        ? 'Kayıt güncellendi'
        : e.endsWith('.archived')
          ? 'Kayıt arşivlendi'
          : e.endsWith('.restored')
            ? 'Kayıt arşivden geri yüklendi'
            : e;
  }
  icon(e: string) {
    return e.endsWith('.created')
      ? 'add_circle'
      : e.endsWith('.updated')
        ? 'edit_note'
        : e.endsWith('.archived')
          ? 'archive'
          : 'restore';
  }
}
