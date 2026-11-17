import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import Swal from 'sweetalert2';
import { PRODUCT_NAVIGATION } from '../../domain/domain-navigation';
import { PageHeader } from '../../shared/ui/page-header';
import { SlideOver } from '../../shared/ui/slide-over';
import {
  MachineCeApi,
  MachineCeDashboard,
  MachineCeKind,
  MachineCeRecord,
  MachineCeStatus,
  RecordDraft,
} from './machine-ce.api';

const KINDS: Record<string, MachineCeKind> = {
  machines: 'machine',
  risks: 'risk-assessment',
  standards: 'standard',
  'technical-files': 'technical-file',
  declarations: 'declaration',
};

const emptyDraft = (kind: MachineCeKind): RecordDraft => ({
  kind,
  name: '',
  location: '',
  manufacturer: '',
  model: '',
  serialNumber: '',
  machineType: '',
  manufactureYear: null,
  directive: '2006/42/EC',
  standardRefsText: '',
  hazard: '',
  severity: null,
  probability: null,
  protectiveMeasures: '',
  residualRisk: '',
  responsibleName: '',
  assessmentDueAt: '',
  approvedAt: '',
  notes: '',
  documentRefsText: '',
  status: 'draft',
});

@Component({
  selector: 'app-machine-ce-page',
  imports: [PageHeader, SlideOver, DatePipe],
  template: `
    <div class="space-y-6">
      <app-page-header
        eyebrow="MAKİNE CE UYGUNLUK MERKEZİ"
        [icon]="domain?.icon ?? 'space_dashboard'"
        [title]="title"
        [description]="description"
      >
        <div actions class="flex flex-wrap items-center gap-2.5">
          <button type="button" class="odv-btn-soft" (click)="downloadReport()">
            <span class="material-symbols-rounded">download</span>Teknik dosya paketi
          </button>
          <button type="button" class="odv-btn-primary" (click)="openCreate()">
            <span class="material-symbols-rounded">add</span>Yeni kayıt
          </button>
        </div>
      </app-page-header>

      @if (error()) {
        <div
          role="alert"
          class="flex items-center justify-between gap-4 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-xs sm:text-sm font-bold text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/60 dark:text-rose-300"
        >
          <div class="flex items-center gap-2.5">
            <span class="material-symbols-rounded text-rose-600 dark:text-rose-400">error</span>
            <span>{{ error() }}</span>
          </div>
          <button type="button" class="odv-btn-ghost !py-1.5 !px-3" (click)="load()">
            Tekrar dene
          </button>
        </div>
      }

      @if (overview) {
        <!-- Live Telemetry & CE Readiness Radar Banner -->
        <section
          class="relative overflow-hidden rounded-2xl border border-slate-800/80 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-5 sm:p-6 text-white shadow-xl"
        >
          <div
            class="pointer-events-none absolute -end-20 -top-20 size-64 rounded-full bg-indigo-500/15 blur-3xl"
          ></div>
          <div
            class="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-center"
          >
            <!-- Left: Live Telemetry Indicator -->
            <div class="flex items-center gap-4">
              <div class="relative flex items-center justify-center">
                <div
                  class="flex size-14 items-center justify-center rounded-2xl border border-emerald-500/40 bg-emerald-500/20 text-emerald-400"
                >
                  <span class="material-symbols-rounded !text-3xl">precision_manufacturing</span>
                </div>
                <span class="absolute -end-1 -top-1 flex size-3.5">
                  <span
                    class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"
                  ></span>
                  <span
                    class="relative inline-flex size-3.5 rounded-full border-2 border-slate-900 bg-emerald-500"
                  ></span>
                </span>
              </div>

              <div>
                <div class="flex flex-wrap items-center gap-2">
                  <span class="text-xs font-extrabold uppercase tracking-wider text-emerald-400"
                    >Canlı CE Hazırlık Radarı</span
                  >
                  <span
                    class="rounded-md bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-slate-300"
                    >2006/42/EC · AB 2023/1230</span
                  >
                </div>
                <div class="mt-1 flex flex-wrap items-baseline gap-2.5">
                  <span class="text-3xl font-black leading-none tracking-tight text-white">
                    %{{ dashboard()?.complianceScore ?? 100 }}
                  </span>
                  <span class="text-xs sm:text-sm font-semibold text-slate-300"
                    >Kanıt Zinciri Uyumluluğu</span
                  >
                  <span
                    class="rounded-full border border-emerald-500/30 bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300"
                  >
                    {{ dashboard()?.approved ?? 0 }} Onaylı Kanıt
                  </span>
                </div>
              </div>
            </div>

            <!-- Middle: Dynamic Compliance Progress Bar -->
            <div class="w-full space-y-1.5 lg:max-w-xs">
              <div class="flex justify-between text-xs font-medium text-slate-400">
                <span>Kritik Eşik</span>
                <span class="font-bold text-white"
                  >%{{ dashboard()?.complianceScore ?? 100 }} Hazırlık</span
                >
                <span>Tam Uyum</span>
              </div>
              <div
                class="h-2.5 w-full overflow-hidden rounded-full border border-slate-700/60 bg-slate-800 p-0.5"
              >
                <div
                  class="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500 transition-all duration-500"
                  [style.width.%]="dashboard()?.complianceScore ?? 100"
                ></div>
              </div>
            </div>

            <!-- Right: Real-time Counters & Status -->
            <div
              class="flex flex-wrap items-center gap-6 border-t border-slate-800/80 pt-4 text-xs lg:border-t-0 lg:pt-0"
            >
              <div>
                <span class="block text-[11px] text-slate-400">30 Gün İçinde İnceleme</span>
                <span class="text-lg font-black tracking-tight text-amber-300">{{
                  dashboard()?.dueSoon ?? 0
                }}</span>
              </div>
              <div class="h-8 w-px bg-slate-800"></div>
              <div>
                <span class="block text-[11px] text-slate-400">Aksiyon Bekleyen</span>
                <span class="text-lg font-black tracking-tight text-rose-300">{{
                  dashboard()?.actionRequired ?? 0
                }}</span>
              </div>
              <div class="h-8 w-px bg-slate-800"></div>
              <div>
                <span class="block text-[11px] text-slate-400">MainAPI Durumu</span>
                <span class="inline-flex items-center gap-1.5 font-bold text-emerald-400">
                  <span class="size-2 animate-pulse rounded-full bg-emerald-400"></span>
                  Çevrimiçi
                </span>
              </div>
            </div>
          </div>
        </section>

        <!-- Executive 4-Column KPI Grid -->
        <section
          aria-label="Temel CE göstergeleri"
          class="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4"
        >
          <!-- KPI 1: Signature Primary Gradient Hero Card -->
          <article
            class="kpi-card relative flex flex-col justify-between overflow-hidden !border-0 !bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 !p-6 text-white !shadow-lg !shadow-indigo-500/25"
          >
            <div>
              <div class="flex items-center justify-between">
                <span class="text-xs font-extrabold uppercase tracking-wider text-white/90"
                  >Toplam CE Kaydı</span
                >
                <div
                  class="flex size-10 items-center justify-center rounded-xl bg-white/20 text-white backdrop-blur-xs"
                >
                  <span class="material-symbols-rounded">inventory_2</span>
                </div>
              </div>
              <div class="mt-4">
                <div class="text-4xl font-black leading-none tracking-tight text-white sm:text-5xl">
                  {{ dashboard()?.total ?? 0 }}
                </div>
                <div class="mt-1.5 text-xs font-semibold text-white/90">
                  Sürüm kontrollü teknik portföy
                </div>
              </div>
            </div>
            <div
              class="mt-5 flex items-center justify-between border-t border-white/20 pt-3.5 text-xs text-white/85"
            >
              <span
                ><strong class="font-bold text-white">{{ dashboard()?.approved ?? 0 }}</strong>
                Onaylı</span
              >
              <span class="inline-flex items-center gap-1.5 font-bold text-white">
                <span class="size-2 animate-pulse rounded-full bg-emerald-300"></span>
                Canlı Veri
              </span>
            </div>
          </article>

          <!-- KPI 2: Emerald Positive Accent Card -->
          <article class="kpi-card flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between">
                <span
                  class="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                  >Makine Envanteri</span
                >
                <div
                  class="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400"
                >
                  <span class="material-symbols-rounded">precision_manufacturing</span>
                </div>
              </div>
              <div class="mt-4">
                <div
                  class="text-4xl font-black leading-none tracking-tight text-slate-900 dark:text-white sm:text-5xl"
                >
                  {{ dashboard()?.machines ?? 0 }}
                </div>
                <div class="mt-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  Teknik kimliği doğrulanan makineler
                </div>
              </div>
            </div>
            <div
              class="mt-5 flex items-center justify-between border-t border-slate-100 pt-3.5 text-xs dark:border-slate-800/80"
            >
              <span class="text-slate-500 dark:text-slate-400">
                <strong class="font-bold text-slate-900 dark:text-white"
                  >{{ dashboard()?.standards ?? 0 }}</strong
                >
                Standart Eşleşmesi
              </span>
              <span class="odv-badge-success !text-[10px]">Aktif Filo</span>
            </div>
          </article>

          <!-- KPI 3: Amber Warning / Risk Assessment Card -->
          <article class="kpi-card flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between">
                <span
                  class="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                  >Risk Değerlendirmesi</span
                >
                <div
                  class="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400"
                >
                  <span class="material-symbols-rounded">health_and_safety</span>
                </div>
              </div>
              <div class="mt-4">
                <div
                  class="text-4xl font-black leading-none tracking-tight text-slate-900 dark:text-white sm:text-5xl"
                >
                  {{ dashboard()?.riskAssessments ?? 0 }}
                </div>
                <div class="mt-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                  EN ISO 12100 tehlike ve tedbir analizi
                </div>
              </div>
            </div>
            <div
              class="mt-5 flex items-center justify-between border-t border-slate-100 pt-3.5 text-xs dark:border-slate-800/80"
            >
              <span class="text-slate-500 dark:text-slate-400">
                <strong class="font-bold text-slate-900 dark:text-white">{{
                  dashboard()?.actionRequired ?? 0
                }}</strong>
                Aksiyon Gerekli
              </span>
              <span class="odv-badge-warning !text-[10px]">İzleniyor</span>
            </div>
          </article>

          <!-- KPI 4: Sky / Indigo Technical File & Declaration Card -->
          <article class="kpi-card flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between">
                <span
                  class="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                  >Teknik Dosya & Beyan</span
                >
                <div
                  class="flex size-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400"
                >
                  <span class="material-symbols-rounded">verified</span>
                </div>
              </div>
              <div class="mt-4">
                <div
                  class="text-4xl font-black leading-none tracking-tight text-slate-900 dark:text-white sm:text-5xl"
                >
                  {{ (dashboard()?.technicalFiles ?? 0) + (dashboard()?.declarations ?? 0) }}
                </div>
                <div class="mt-1.5 text-xs font-semibold text-sky-600 dark:text-sky-400">
                  {{ dashboard()?.technicalFiles ?? 0 }} Teknik Dosya ·
                  {{ dashboard()?.declarations ?? 0 }} AT Beyanı
                </div>
              </div>
            </div>
            <div
              class="mt-5 flex items-center justify-between border-t border-slate-100 pt-3.5 text-xs dark:border-slate-800/80"
            >
              <span class="text-slate-500 dark:text-slate-400">Denetim Kanıt Zinciri</span>
              <span class="odv-badge-info !text-[10px]">CE Onaylı</span>
            </div>
          </article>
        </section>
      } @else {
        <!-- Domain View Summary Cards -->
        <section class="grid grid-cols-1 gap-4 sm:grid-cols-3" aria-label="Modül özeti">
          <article class="kpi-card flex items-center justify-between">
            <div>
              <span
                class="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                >Listelenen Kayıt</span
              >
              <strong class="mt-2 block text-3xl font-black text-slate-900 dark:text-white">{{
                filteredRecords().length
              }}</strong>
              <span class="mt-1 block text-xs text-slate-500"
                >{{ title }} kapsamındaki kayıtlar</span
              >
            </div>
            <span
              class="grid size-12 place-items-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400"
            >
              <span class="material-symbols-rounded">{{ domain?.icon ?? 'folder_managed' }}</span>
            </span>
          </article>
          <article class="kpi-card flex items-center justify-between">
            <div>
              <span
                class="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                >Aksiyon Bekleyen</span
              >
              <strong class="mt-2 block text-3xl font-black text-amber-600 dark:text-amber-400">{{
                dashboard()?.actionRequired ?? 0
              }}</strong>
              <span class="mt-1 block text-xs text-slate-500"
                >İnceleme veya düzeltici faaliyet</span
              >
            </div>
            <span
              class="grid size-12 place-items-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400"
            >
              <span class="material-symbols-rounded">schedule</span>
            </span>
          </article>
          <article class="kpi-card flex items-center justify-between">
            <div>
              <span
                class="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                >CE Hazırlık Skoru</span
              >
              <strong
                class="mt-2 block text-3xl font-black text-emerald-600 dark:text-emerald-400"
                >%{{ dashboard()?.complianceScore ?? 100 }}</strong
              >
              <span class="mt-1 block text-xs text-slate-500">Genel kanıt zinciri oranı</span>
            </div>
            <span
              class="grid size-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400"
            >
              <span class="material-symbols-rounded">verified_user</span>
            </span>
          </article>
        </section>
      }

      <!-- Records Table Card -->
      <section class="odv-card overflow-hidden">
        <!-- Toolbar -->
        <div
          class="flex flex-col gap-4 border-b border-slate-200/80 p-4 sm:p-5 dark:border-slate-800 lg:flex-row lg:items-center lg:justify-between"
        >
          <!-- Segment Pill Tabs -->
          <div
            class="inline-flex self-start rounded-2xl border border-slate-200/80 bg-slate-100 p-1 text-xs font-bold dark:border-slate-700/80 dark:bg-slate-800/80"
          >
            <button
              type="button"
              class="flex items-center gap-2 rounded-xl px-4 py-2 transition-all"
              [class.bg-white]="!archived()"
              [class.dark:bg-slate-700]="!archived()"
              [class.text-indigo-600]="!archived()"
              [class.dark:text-indigo-300]="!archived()"
              [class.shadow-xs]="!archived()"
              [class.text-slate-500]="archived()"
              (click)="setArchived(false)"
            >
              <span class="material-symbols-rounded !text-base">inventory_2</span>
              <span>Aktif</span>
              @if (!archived()) {
                <span
                  class="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-extrabold text-indigo-600 dark:bg-indigo-950/80 dark:text-indigo-300"
                  >{{ filteredRecords().length }}</span
                >
              }
            </button>
            <button
              type="button"
              class="flex items-center gap-2 rounded-xl px-4 py-2 transition-all"
              [class.bg-white]="archived()"
              [class.dark:bg-slate-700]="archived()"
              [class.text-amber-600]="archived()"
              [class.dark:text-amber-300]="archived()"
              [class.shadow-xs]="archived()"
              [class.text-slate-500]="!archived()"
              (click)="setArchived(true)"
            >
              <span class="material-symbols-rounded !text-base">archive</span>
              <span>Arşiv</span>
              @if (archived()) {
                <span
                  class="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-extrabold text-amber-600 dark:bg-amber-950/80 dark:text-amber-300"
                  >{{ filteredRecords().length }}</span
                >
              }
            </button>
          </div>

          <!-- Search & Contextual Selects -->
          <div class="flex flex-col gap-2.5 sm:flex-row sm:items-center">
            @if (overview) {
              <select
                class="odv-input !w-auto !py-2 !text-xs font-semibold cursor-pointer"
                aria-label="Kayıt türü filtresi"
                [value]="kindFilter()"
                (change)="kindFilter.set($any($event.target).value)"
              >
                <option value="all">Tüm Kayıt Türleri</option>
                <option value="machine">Makine envanteri</option>
                <option value="risk-assessment">Risk değerlendirmesi</option>
                <option value="standard">Standart gerekliliği</option>
                <option value="technical-file">Teknik dosya</option>
                <option value="declaration">Uygunluk beyanı</option>
              </select>
            }
            <select
              class="odv-input !w-auto !py-2 !text-xs font-semibold cursor-pointer"
              aria-label="Durum filtresi"
              [value]="statusFilter()"
              (change)="statusFilter.set($any($event.target).value)"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="draft">Taslak</option>
              <option value="in-review">İncelemede</option>
              <option value="action-required">Aksiyon gerekli</option>
              <option value="approved">Onaylandı</option>
              <option value="rejected">Reddedildi</option>
            </select>

            <label class="relative block sm:w-80">
              <span class="sr-only">Kayıt ara</span>
              <span
                class="material-symbols-rounded pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                >search</span
              >
              <input
                class="odv-input ps-10 !py-2"
                type="search"
                placeholder="Makine, seri no, model, standart ara…"
                [value]="search()"
                (input)="search.set($any($event.target).value); scheduleLoad()"
              />
            </label>
          </div>
        </div>

        @if (loading()) {
          <div class="grid min-h-64 place-items-center p-8">
            <div class="flex flex-col items-center gap-3">
              <span class="material-symbols-rounded animate-spin !text-4xl text-indigo-600"
                >progress_activity</span
              >
              <span class="text-xs font-semibold text-slate-500"
                >CE kayıtları senkronize ediliyor…</span
              >
            </div>
          </div>
        } @else {
          <div class="overflow-x-auto custom-scroll">
            <table class="w-full min-w-[980px] border-collapse">
              <thead>
                <tr>
                  <th class="odv-th">Kayıt / Teknik Kimlik</th>
                  <th class="odv-th">Tür</th>
                  <th class="odv-th">Tesis / Konum</th>
                  <th class="odv-th">Direktif & Standart</th>
                  <th class="odv-th">Risk Skoru</th>
                  <th class="odv-th">İnceleme Tarihi</th>
                  <th class="odv-th">Durum</th>
                  <th class="odv-th text-end">İşlem</th>
                </tr>
              </thead>
              <tbody>
                @for (row of filteredRecords(); track row.id) {
                  <tr
                    class="group cursor-pointer transition-colors hover:bg-indigo-50/40 dark:hover:bg-slate-800/60"
                    (click)="openEdit(row)"
                  >
                    <td class="odv-td">
                      <div class="flex items-center gap-3">
                        <span
                          class="grid size-9 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600 transition-transform group-hover:scale-105 dark:bg-indigo-950/70 dark:text-indigo-400"
                        >
                          <span class="material-symbols-rounded !text-lg">{{
                            kindIcon(row.kind)
                          }}</span>
                        </span>
                        <div class="min-w-0">
                          <strong
                            class="block truncate font-bold text-slate-900 transition-colors group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400"
                            >{{ row.name }}</strong
                          >
                          <span class="block truncate font-mono text-[11px] text-slate-400">
                            {{ row.serialNumber || row.model || 'Teknik kimlik bekleniyor' }}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td class="odv-td font-semibold text-slate-600 dark:text-slate-300">
                      {{ kindLabel(row.kind) }}
                    </td>
                    <td class="odv-td text-slate-600 dark:text-slate-300">
                      <span class="inline-flex items-center gap-1.5">
                        <span class="material-symbols-rounded !text-sm text-slate-400"
                          >location_on</span
                        >
                        {{ row.location }}
                      </span>
                    </td>
                    <td class="odv-td">
                      <span class="odv-badge-info">
                        {{ row.directive || row.standardRefs[0] || '2006/42/EC' }}
                      </span>
                    </td>
                    <td class="odv-td">
                      @if (rowRiskScore(row); as score) {
                        <span [class]="riskBadgeClass(score)">
                          Skor {{ score }} · {{ riskLevelLabel(score) }}
                        </span>
                      } @else {
                        <span class="text-xs text-slate-400">—</span>
                      }
                    </td>
                    <td class="odv-td text-slate-600 dark:text-slate-300">
                      {{ row.assessmentDueAt ? (row.assessmentDueAt | date: 'dd.MM.yyyy') : '—' }}
                    </td>
                    <td class="odv-td">
                      <span [class]="statusClass(row.status)">{{ statusLabel(row.status) }}</span>
                    </td>
                    <td class="odv-td text-end" (click)="$event.stopPropagation()">
                      <div class="inline-flex items-center gap-1">
                        <button
                          type="button"
                          class="odv-icon-btn"
                          aria-label="Kaydı aç"
                          title="Düzenle"
                          (click)="openEdit(row)"
                        >
                          <span class="material-symbols-rounded !text-lg">edit</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="8" class="p-14 text-center">
                      <div
                        class="mx-auto mb-3 grid size-14 place-items-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800"
                      >
                        <span class="material-symbols-rounded !text-3xl"
                          >precision_manufacturing</span
                        >
                      </div>
                      <strong class="block text-sm font-extrabold text-slate-900 dark:text-white"
                        >Bu görünümde kayıt yok</strong
                      >
                      <span class="mt-1 block text-xs text-slate-500">
                        İlk makine veya uygunluk kaydını oluşturarak kanıt zincirini başlatın.
                      </span>
                      <button type="button" class="odv-btn-primary mt-4" (click)="openCreate()">
                        <span class="material-symbols-rounded">add</span>Yeni CE kaydı oluştur
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </section>
    </div>

    <app-slide-over
      [open]="drawerOpen()"
      [wide]="true"
      [dirty]="dirty()"
      [submitting]="saving()"
      [title]="editing() ? 'Kaydı düzenle' : 'Yeni CE uygunluk kaydı'"
      description="2006/42/EC ve EN ISO 12100 kapsamında sürüm kontrollü teknik kayıt yönetimi."
      eyebrow="SÜRÜM KONTROLLÜ TEKNİK KAYIT"
      icon="precision_manufacturing"
      submitLabel="Kaydet"
      (closed)="drawerOpen.set(false)"
      (submitted)="save()"
    >
      @if (saveError()) {
        <div
          role="alert"
          class="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs sm:text-sm font-bold text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/60 dark:text-rose-300"
        >
          <span class="material-symbols-rounded">error</span>
          <span>{{ saveError() }}</span>
        </div>
      }

      <!-- Section 1: Machine Identity -->
      <section class="odv-card p-5 sm:p-6">
        <div
          class="mb-4 flex items-center gap-3 border-b border-slate-100 pb-3.5 dark:border-slate-800"
        >
          <span
            class="grid size-9 place-items-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/70 dark:text-indigo-400"
          >
            <span class="material-symbols-rounded">badge</span>
          </span>
          <div>
            <h3 class="m-0 text-sm font-black text-slate-900 dark:text-white">
              Kayıt ve makine kimliği
            </h3>
            <p class="mb-0 mt-0.5 text-[11px] text-slate-500">
              Varlık türü, üretici, seri numarası ve tesis konumu
            </p>
          </div>
        </div>
        <div class="grid gap-4 sm:grid-cols-2">
          <label>
            <span class="field-label">Kayıt türü <span class="text-rose-500">*</span></span>
            <select
              class="odv-input"
              [value]="draft().kind"
              (change)="patch('kind', $any($event.target).value)"
            >
              <option value="machine">Makine envanteri</option>
              <option value="risk-assessment">Risk değerlendirmesi</option>
              <option value="standard">Standart gerekliliği</option>
              <option value="technical-file">Teknik dosya</option>
              <option value="declaration">Uygunluk beyanı</option>
            </select>
          </label>
          <label>
            <span class="field-label">Durum <span class="text-rose-500">*</span></span>
            <select
              class="odv-input"
              [value]="draft().status"
              (change)="patch('status', $any($event.target).value)"
            >
              <option value="draft">Taslak</option>
              <option value="in-review">İncelemede</option>
              <option value="action-required">Aksiyon gerekli</option>
              <option value="approved">Onaylandı</option>
              <option value="rejected">Reddedildi</option>
            </select>
          </label>
          <label class="sm:col-span-2">
            <span class="field-label">Makine / kayıt adı <span class="text-rose-500">*</span></span>
            <input
              class="odv-input"
              placeholder="Örn. CNC Hidrolik Abkant Pres Hattı #2"
              [value]="draft().name"
              (input)="patch('name', $any($event.target).value)"
            />
          </label>
          <label>
            <span class="field-label">Tesis / konum <span class="text-rose-500">*</span></span>
            <input
              class="odv-input"
              placeholder="Örn. Gebze OSB · Hol B"
              [value]="draft().location"
              (input)="patch('location', $any($event.target).value)"
            />
          </label>
          <label>
            <span class="field-label">Üretici</span>
            <input
              class="odv-input"
              [value]="draft().manufacturer"
              (input)="patch('manufacturer', $any($event.target).value)"
            />
          </label>
          <label>
            <span class="field-label">Model</span>
            <input
              class="odv-input"
              [value]="draft().model"
              (input)="patch('model', $any($event.target).value)"
            />
          </label>
          <label>
            <span class="field-label">Seri numarası</span>
            <input
              class="odv-input font-mono"
              [value]="draft().serialNumber"
              (input)="patch('serialNumber', $any($event.target).value)"
            />
          </label>
          <label>
            <span class="field-label">Makine tipi</span>
            <input
              class="odv-input"
              placeholder="Pres, paketleme hattı, robotik hücre…"
              [value]="draft().machineType"
              (input)="patch('machineType', $any($event.target).value)"
            />
          </label>
          <label>
            <span class="field-label">İmalat yılı</span>
            <input
              class="odv-input"
              type="number"
              min="1900"
              max="2100"
              [value]="draft().manufactureYear ?? ''"
              (input)="patchNumber('manufactureYear', $any($event.target).value)"
            />
          </label>
        </div>
      </section>

      <!-- Section 2: Directive & Standards Matrix -->
      <section class="odv-card p-5 sm:p-6">
        <div
          class="mb-4 flex items-center gap-3 border-b border-slate-100 pb-3.5 dark:border-slate-800"
        >
          <span
            class="grid size-9 place-items-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950/70 dark:text-sky-400"
          >
            <span class="material-symbols-rounded">rule</span>
          </span>
          <div>
            <h3 class="m-0 text-sm font-black text-slate-900 dark:text-white">
              Mevzuat ve standart matrisi
            </h3>
            <p class="mb-0 mt-0.5 text-[11px] text-slate-500">
              Uygulanan AB direktifleri ve A/B/C tipi harmonize standartlar
            </p>
          </div>
        </div>
        <div class="grid gap-4 sm:grid-cols-2">
          <label>
            <span class="field-label">Direktif / tüzük</span>
            <input
              class="odv-input"
              placeholder="2006/42/EC, 2014/30/EU, AB 2023/1230"
              [value]="draft().directive"
              (input)="patch('directive', $any($event.target).value)"
            />
          </label>
          <label>
            <span class="field-label">Harmonize standartlar</span>
            <input
              class="odv-input"
              placeholder="EN ISO 12100, EN 60204-1, EN ISO 13849-1"
              [value]="draft().standardRefsText"
              (input)="patch('standardRefsText', $any($event.target).value)"
            />
          </label>
        </div>
      </section>

      <!-- Section 3: Risk Assessment (EN ISO 12100) -->
      <section class="odv-card p-5 sm:p-6">
        <div
          class="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3.5 dark:border-slate-800"
        >
          <div class="flex items-center gap-3">
            <span
              class="grid size-9 place-items-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/70 dark:text-amber-400"
            >
              <span class="material-symbols-rounded">health_and_safety</span>
            </span>
            <div>
              <h3 class="m-0 text-sm font-black text-slate-900 dark:text-white">
                Risk değerlendirmesi
              </h3>
              <p class="mb-0 mt-0.5 text-[11px] text-slate-500">
                EN ISO 12100 tehlike tanımı, şiddet × olasılık matrisi ve koruyucu tedbirler
              </p>
            </div>
          </div>
          @if (draftRiskScore(); as score) {
            <span [class]="riskBadgeClass(score)">
              Hesaplanan Risk Skoru: {{ score }} ({{ riskLevelLabel(score) }})
            </span>
          }
        </div>
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="sm:col-span-2">
            <span class="field-label">Tehlike / tehlikeli durum</span>
            <textarea
              class="odv-input min-h-24"
              placeholder="Ezilme, kesilme, elektrik çarpması, beklenmedik çalışma…"
              [value]="draft().hazard"
              (input)="patch('hazard', $any($event.target).value)"
            ></textarea>
          </label>
          <label>
            <span class="field-label">Şiddet (1–5)</span>
            <input
              class="odv-input"
              type="number"
              min="1"
              max="5"
              [value]="draft().severity ?? ''"
              (input)="patchNumber('severity', $any($event.target).value)"
            />
          </label>
          <label>
            <span class="field-label">Olasılık (1–5)</span>
            <input
              class="odv-input"
              type="number"
              min="1"
              max="5"
              [value]="draft().probability ?? ''"
              (input)="patchNumber('probability', $any($event.target).value)"
            />
          </label>
          <label class="sm:col-span-2">
            <span class="field-label">Koruyucu tedbirler</span>
            <textarea
              class="odv-input min-h-24"
              placeholder="Tasarımla güvenli hale getirme, ışık perdesi, çift el kumanda, kilitlemeli muhafaza…"
              [value]="draft().protectiveMeasures"
              (input)="patch('protectiveMeasures', $any($event.target).value)"
            ></textarea>
          </label>
          <label class="sm:col-span-2">
            <span class="field-label">Kalan risk ve kullanıcı bilgilendirmesi</span>
            <textarea
              class="odv-input min-h-20"
              placeholder="KKD kullanımı, bakım prosedürü (LOTO) ve makine üzerindeki uyarı piktogramları…"
              [value]="draft().residualRisk"
              (input)="patch('residualRisk', $any($event.target).value)"
            ></textarea>
          </label>
        </div>
      </section>

      <!-- Section 4: Review, Approval & Evidence -->
      <section class="odv-card p-5 sm:p-6">
        <div
          class="mb-4 flex items-center gap-3 border-b border-slate-100 pb-3.5 dark:border-slate-800"
        >
          <span
            class="grid size-9 place-items-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/70 dark:text-emerald-400"
          >
            <span class="material-symbols-rounded">verified</span>
          </span>
          <div>
            <h3 class="m-0 text-sm font-black text-slate-900 dark:text-white">
              İnceleme, onay ve kanıt
            </h3>
            <p class="mb-0 mt-0.5 text-[11px] text-slate-500">
              Teknik dosya sorumlusu, denetim takvimi ve kanıt belge referansları
            </p>
          </div>
        </div>
        <div class="grid gap-4 sm:grid-cols-2">
          <label>
            <span class="field-label">Teknik dosya sorumlusu</span>
            <input
              class="odv-input"
              [value]="draft().responsibleName"
              (input)="patch('responsibleName', $any($event.target).value)"
            />
          </label>
          <label>
            <span class="field-label">Sonraki değerlendirme</span>
            <input
              class="odv-input"
              type="datetime-local"
              [value]="draft().assessmentDueAt"
              (input)="patch('assessmentDueAt', $any($event.target).value)"
            />
          </label>
          <label>
            <span class="field-label">Onay tarihi</span>
            <input
              class="odv-input"
              type="datetime-local"
              [value]="draft().approvedAt"
              (input)="patch('approvedAt', $any($event.target).value)"
            />
          </label>
          <label>
            <span class="field-label">Belge referansları</span>
            <input
              class="odv-input font-mono"
              placeholder="RA-001, DWG-042, TEST-118"
              [value]="draft().documentRefsText"
              (input)="patch('documentRefsText', $any($event.target).value)"
            />
          </label>
          <label class="sm:col-span-2">
            <span class="field-label">Teknik notlar</span>
            <textarea
              class="odv-input min-h-24"
              [value]="draft().notes"
              (input)="patch('notes', $any($event.target).value)"
            ></textarea>
          </label>
        </div>
      </section>

      @if (editing(); as row) {
        <div
          class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
        >
          <button
            type="button"
            class="odv-btn-ghost !text-rose-600 dark:!text-rose-400"
            (click)="toggleArchive(row)"
          >
            <span class="material-symbols-rounded">{{
              row.archivedAt ? 'restore_from_trash' : 'archive'
            }}</span>
            {{ row.archivedAt ? 'Arşivden çıkar' : 'Arşivle' }}
          </button>
          <span class="text-xs font-semibold text-slate-500">
            Sürüm {{ row.version }} · değişiklikler audit kaydına işlenir
          </span>
        </div>
      }
    </app-slide-over>
  `,
  styles: `
    .field-label {
      margin-block-end: 0.35rem;
      display: block;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: #475569;
    }
    :host-context(.dark) .field-label {
      color: #cbd5e1;
    }
  `,
})
export class MachineCePage {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(MachineCeApi);
  readonly overview = this.route.snapshot.data['view'] === 'overview';
  private readonly section = String(this.route.snapshot.data['section'] ?? '');
  readonly kind = this.overview ? null : (KINDS[this.section] ?? 'machine');
  readonly domain = PRODUCT_NAVIGATION.find((item) => item.key === this.section);
  readonly title = this.overview
    ? 'MachineCE Genel Bakış'
    : (this.domain?.title ?? 'Makine CE Kayıtları');
  readonly description = this.overview
    ? 'Makine, risk, standart, teknik dosya ve uygunluk beyanlarını canlı CE hazırlık verileriyle yönetin.'
    : (this.domain?.description ?? 'CE kararlarını kanıtlayan denetlenebilir teknik kayıtlar.');
  readonly records = signal<MachineCeRecord[]>([]);
  readonly dashboard = signal<MachineCeDashboard | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly search = signal('');
  readonly statusFilter = signal<'all' | MachineCeStatus>('all');
  readonly kindFilter = signal<'all' | MachineCeKind>('all');
  readonly archived = signal(false);
  readonly drawerOpen = signal(false);
  readonly saving = signal(false);
  readonly saveError = signal('');
  readonly editing = signal<MachineCeRecord | null>(null);
  readonly draft = signal<RecordDraft>(emptyDraft(this.kind ?? 'machine'));
  readonly dirty = signal(false);
  private timer?: ReturnType<typeof setTimeout>;

  readonly filteredRecords = computed(() => {
    const status = this.statusFilter();
    const kind = this.kindFilter();
    return this.records().filter((row) => {
      if (status !== 'all' && row.status !== status) return false;
      if (this.overview && kind !== 'all' && row.kind !== kind) return false;
      return true;
    });
  });

  readonly draftRiskScore = computed(() => {
    const d = this.draft();
    if (d.severity && d.probability) {
      return d.severity * d.probability;
    }
    return null;
  });

  readonly metrics = computed(() => {
    const d = this.dashboard();
    return [
      {
        label: 'Toplam kayıt',
        value: d?.total ?? 0,
        icon: 'inventory_2',
        note: 'Aktif teknik ve uygunluk kayıtları',
      },
      {
        label: 'Makine',
        value: d?.machines ?? 0,
        icon: 'precision_manufacturing',
        note: 'Teknik kimliği doğrulanan varlıklar',
      },
      {
        label: 'Risk değerlendirmesi',
        value: d?.riskAssessments ?? 0,
        icon: 'health_and_safety',
        note: 'İzlenebilir tehlike analizleri',
      },
      {
        label: 'Onaylı kayıt',
        value: d?.approved ?? 0,
        icon: 'verified',
        note: 'Yayınlanabilir CE kanıtları',
      },
    ];
  });

  constructor() {
    void this.load();
  }

  async load() {
    this.loading.set(true);
    this.error.set('');
    try {
      const [list, dashboard] = await Promise.all([
        this.api.list(this.kind, this.archived(), this.search()),
        this.api.dashboard(),
      ]);
      this.records.set(list.items);
      this.dashboard.set(dashboard);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Kayıtlar alınamadı.');
    } finally {
      this.loading.set(false);
    }
  }

  scheduleLoad() {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.load(), 250);
  }

  setArchived(value: boolean) {
    this.archived.set(value);
    void this.load();
  }

  openCreate() {
    this.editing.set(null);
    this.draft.set(emptyDraft(this.kind ?? 'machine'));
    this.dirty.set(false);
    this.saveError.set('');
    this.drawerOpen.set(true);
  }

  openEdit(row: MachineCeRecord) {
    this.editing.set(row);
    this.draft.set({
      kind: row.kind,
      name: row.name,
      location: row.location,
      manufacturer: row.manufacturer ?? '',
      model: row.model ?? '',
      serialNumber: row.serialNumber ?? '',
      machineType: row.machineType ?? '',
      manufactureYear: row.manufactureYear,
      directive: row.directive ?? '',
      standardRefsText: row.standardRefs.join(', '),
      hazard: row.hazard ?? '',
      severity: row.severity,
      probability: row.probability,
      protectiveMeasures: row.protectiveMeasures ?? '',
      residualRisk: row.residualRisk ?? '',
      responsibleName: row.responsibleName ?? '',
      assessmentDueAt: this.localDate(row.assessmentDueAt),
      approvedAt: this.localDate(row.approvedAt),
      notes: row.notes ?? '',
      documentRefsText: row.documentRefs.join(', '),
      status: row.status,
    });
    this.dirty.set(false);
    this.saveError.set('');
    this.drawerOpen.set(true);
  }

  patch<K extends keyof RecordDraft>(key: K, value: RecordDraft[K]) {
    this.draft.update((draft) => ({ ...draft, [key]: value }));
    this.dirty.set(true);
  }

  patchNumber(key: 'manufactureYear' | 'severity' | 'probability', value: string) {
    this.patch(key, value === '' ? null : Number(value));
  }

  async save() {
    const draft = this.draft();
    if (!draft.name.trim() || !draft.location.trim()) {
      this.saveError.set('Makine / kayıt adı ve tesis konumu zorunludur.');
      return;
    }
    if (
      draft.status === 'approved' &&
      (!draft.responsibleName.trim() || !draft.approvedAt || !draft.documentRefsText.trim())
    ) {
      this.saveError.set('Onay için sorumlu, onay tarihi ve kanıt belgesi zorunludur.');
      return;
    }
    this.saving.set(true);
    this.saveError.set('');
    try {
      const row = this.editing();
      if (row) await this.api.update(row.id, row.version, draft);
      else await this.api.create(draft);
      this.dirty.set(false);
      this.drawerOpen.set(false);
      await this.load();
    } catch (error) {
      this.saveError.set(error instanceof Error ? error.message : 'Kayıt kaydedilemedi.');
    } finally {
      this.saving.set(false);
    }
  }

  async toggleArchive(row: MachineCeRecord) {
    const result = await Swal.fire({
      title: row.archivedAt ? 'Kayıt geri açılsın mı?' : 'Kayıt arşivlensin mi?',
      text: 'İşlem denetim izine kaydedilecektir.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Onayla',
      cancelButtonText: 'Vazgeç',
      customClass: { confirmButton: 'odv-btn-primary', cancelButton: 'odv-btn-ghost' },
      buttonsStyling: false,
    });
    if (!result.isConfirmed) return;
    if (row.archivedAt) await this.api.restore(row.id);
    else await this.api.archive(row.id);
    this.dirty.set(false);
    this.drawerOpen.set(false);
    await this.load();
  }

  async downloadReport() {
    try {
      const report = await this.api.report();
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `machinece-teknik-dosya-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (error) {
      this.error.set(
        error instanceof Error ? error.message : 'Teknik dosya paketi oluşturulamadı.',
      );
    }
  }

  kindLabel(kind: MachineCeKind) {
    return (
      {
        machine: 'Makine envanteri',
        'risk-assessment': 'Risk değerlendirmesi',
        standard: 'Standart gerekliliği',
        'technical-file': 'Teknik dosya',
        declaration: 'Uygunluk beyanı',
      } as const
    )[kind];
  }

  kindIcon(kind: MachineCeKind) {
    return (
      {
        machine: 'precision_manufacturing',
        'risk-assessment': 'health_and_safety',
        standard: 'rule',
        'technical-file': 'folder_managed',
        declaration: 'verified',
      } as const
    )[kind];
  }

  rowRiskScore(row: MachineCeRecord): number | null {
    if (row.riskScore != null) return row.riskScore;
    if (row.severity && row.probability) return row.severity * row.probability;
    return null;
  }

  riskBadgeClass(score: number): string {
    return score >= 15
      ? 'odv-badge-danger'
      : score >= 8
        ? 'odv-badge-warning'
        : 'odv-badge-success';
  }

  riskLevelLabel(score: number): string {
    return score >= 15 ? 'Yüksek' : score >= 8 ? 'Orta' : 'Düşük';
  }

  statusLabel(status: MachineCeRecord['status']) {
    return (
      {
        draft: 'Taslak',
        'in-review': 'İncelemede',
        'action-required': 'Aksiyon gerekli',
        approved: 'Onaylandı',
        rejected: 'Reddedildi',
      } as const
    )[status];
  }

  statusClass(status: MachineCeRecord['status']) {
    return status === 'action-required' || status === 'rejected'
      ? 'odv-badge-danger'
      : status === 'draft' || status === 'in-review'
        ? 'odv-badge-warning'
        : 'odv-badge-success';
  }

  private localDate(value: string | null) {
    return value ? value.slice(0, 16) : '';
  }
}
