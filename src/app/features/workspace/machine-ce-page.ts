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
        [title]="title"
        [description]="description"
      >
        <div actions class="flex flex-wrap gap-2">
          <button type="button" class="odv-btn-soft" (click)="downloadReport()">
            <span class="material-symbols-rounded">download</span>Teknik dosya paketi
          </button>
          @if (!overview) {
            <button type="button" class="odv-btn-primary" (click)="openCreate()">
              <span class="material-symbols-rounded">add</span>Yeni kayıt
            </button>
          }
        </div>
      </app-page-header>
      @if (error()) {
        <div role="alert" class="rounded-2xl bg-rose-50 p-4 text-sm font-bold text-rose-700">
          {{ error() }} <button class="ms-3 underline" (click)="load()">Tekrar dene</button>
        </div>
      }
      @if (overview) {
        <section
          class="odv-card overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-950 p-7 text-white lg:p-9"
        >
          <div class="grid gap-7 lg:grid-cols-[1.3fr_1fr] lg:items-center">
            <div>
              <span class="odv-badge-success">CANLI CE HAZIRLIK RADARI</span>
              <h2 class="mb-3 mt-5 text-3xl font-black">
                Riskten uygunluk beyanına kadar tek kanıt zinciri
              </h2>
              <p class="m-0 max-w-2xl text-sm leading-7 text-slate-300">
                Makine kimliği, risk değerlendirmesi, standart matrisi, teknik dosya ve uygunluk
                beyanını sürüm kontrollü yönetin.
              </p>
            </div>
            <div class="grid grid-cols-3 gap-3 text-center">
              <div class="rounded-2xl bg-white/10 p-4">
                <strong class="block text-3xl">%{{ dashboard()?.complianceScore ?? 100 }}</strong
                ><span class="text-xs text-slate-300">Hazırlık</span>
              </div>
              <div class="rounded-2xl bg-white/10 p-4">
                <strong class="block text-3xl">{{ dashboard()?.dueSoon ?? 0 }}</strong
                ><span class="text-xs text-slate-300">30 gün</span>
              </div>
              <div class="rounded-2xl bg-white/10 p-4">
                <strong class="block text-3xl">{{ dashboard()?.actionRequired ?? 0 }}</strong
                ><span class="text-xs text-slate-300">Aksiyon</span>
              </div>
            </div>
          </div>
        </section>
        <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          @for (metric of metrics(); track metric.label) {
            <article class="odv-card p-5">
              <div class="flex items-center justify-between">
                <span class="text-xs font-black uppercase tracking-wider text-slate-500">{{
                  metric.label
                }}</span
                ><span class="material-symbols-rounded text-violet-600">{{ metric.icon }}</span>
              </div>
              <strong class="mt-4 block text-4xl font-black">{{ metric.value }}</strong
              ><span class="mt-2 block text-xs text-slate-500">{{ metric.note }}</span>
            </article>
          }
        </section>
      }
      <section class="odv-card overflow-hidden">
        <div
          class="flex flex-col gap-4 border-b border-slate-200 p-5 dark:border-slate-700 lg:flex-row lg:items-center lg:justify-between"
        >
          <div class="inline-flex rounded-xl bg-slate-100 p-1 dark:bg-slate-900">
            <button
              class="rounded-lg px-4 py-2 text-xs font-bold"
              [class.bg-white]="!archived()"
              (click)="setArchived(false)"
            >
              Aktif</button
            ><button
              class="rounded-lg px-4 py-2 text-xs font-bold"
              [class.bg-white]="archived()"
              (click)="setArchived(true)"
            >
              Arşiv
            </button>
          </div>
          <label class="relative block lg:w-96"
            ><span class="sr-only">Kayıt ara</span
            ><span
              class="material-symbols-rounded pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-slate-400"
              >search</span
            ><input
              class="odv-input ps-10"
              type="search"
              placeholder="Makine, seri no, model, standart veya sorumlu ara…"
              [value]="search()"
              (input)="search.set($any($event.target).value); scheduleLoad()"
          /></label>
        </div>
        @if (loading()) {
          <div class="grid min-h-64 place-items-center">
            <span class="material-symbols-rounded animate-spin text-4xl text-violet-600"
              >progress_activity</span
            >
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full min-w-[980px]">
              <thead>
                <tr>
                  <th class="odv-th">Kayıt</th>
                  <th class="odv-th">Tür</th>
                  <th class="odv-th">Konum</th>
                  <th class="odv-th">Direktif / standart</th>
                  <th class="odv-th">İnceleme tarihi</th>
                  <th class="odv-th">Durum</th>
                  <th class="odv-th"><span class="sr-only">İşlem</span></th>
                </tr>
              </thead>
              <tbody>
                @for (row of records(); track row.id) {
                  <tr class="hover:bg-violet-50/50 dark:hover:bg-slate-800">
                    <td class="odv-td">
                      <strong class="block">{{ row.name }}</strong
                      ><span class="text-xs text-slate-500">{{
                        row.serialNumber || row.model || 'Teknik kimlik bekleniyor'
                      }}</span>
                    </td>
                    <td class="odv-td">{{ kindLabel(row.kind) }}</td>
                    <td class="odv-td">{{ row.location }}</td>
                    <td class="odv-td">
                      <span class="odv-badge-info">{{
                        row.directive || row.standardRefs[0] || 'Belirtilmedi'
                      }}</span>
                    </td>
                    <td class="odv-td">
                      {{ row.assessmentDueAt ? (row.assessmentDueAt | date: 'dd.MM.yyyy') : '—' }}
                    </td>
                    <td class="odv-td">
                      <span [class]="statusClass(row.status)">{{ statusLabel(row.status) }}</span>
                    </td>
                    <td class="odv-td text-end">
                      <button class="odv-icon-btn" aria-label="Kaydı aç" (click)="openEdit(row)">
                        <span class="material-symbols-rounded">edit</span>
                      </button>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="7" class="p-12 text-center">
                      <span class="material-symbols-rounded text-5xl text-slate-300"
                        >precision_manufacturing</span
                      ><strong class="mt-3 block">Bu görünümde kayıt yok</strong
                      ><span class="text-sm text-slate-500"
                        >İlk makine veya uygunluk kaydını oluşturarak kanıt zincirini
                        başlatın.</span
                      >
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
      eyebrow="SÜRÜM KONTROLLÜ TEKNİK KAYIT"
      icon="precision_manufacturing"
      submitLabel="Kaydet"
      (closed)="drawerOpen.set(false)"
      (submitted)="save()"
    >
      @if (saveError()) {
        <div role="alert" class="rounded-xl bg-rose-50 p-4 text-sm font-bold text-rose-700">
          {{ saveError() }}
        </div>
      }
      <section class="odv-card p-5">
        <h3 class="mt-0">Kayıt ve makine kimliği</h3>
        <div class="grid gap-4 sm:grid-cols-2">
          <label
            ><span class="field-label">Kayıt türü *</span
            ><select
              class="odv-input"
              [value]="draft().kind"
              (change)="patch('kind', $any($event.target).value)"
            >
              <option value="machine">Makine envanteri</option>
              <option value="risk-assessment">Risk değerlendirmesi</option>
              <option value="standard">Standart gerekliliği</option>
              <option value="technical-file">Teknik dosya</option>
              <option value="declaration">Uygunluk beyanı</option>
            </select></label
          ><label
            ><span class="field-label">Durum *</span
            ><select
              class="odv-input"
              [value]="draft().status"
              (change)="patch('status', $any($event.target).value)"
            >
              <option value="draft">Taslak</option>
              <option value="in-review">İncelemede</option>
              <option value="action-required">Aksiyon gerekli</option>
              <option value="approved">Onaylandı</option>
              <option value="rejected">Reddedildi</option>
            </select></label
          >
          <label class="sm:col-span-2"
            ><span class="field-label">Makine / kayıt adı *</span
            ><input
              class="odv-input"
              [value]="draft().name"
              (input)="patch('name', $any($event.target).value)" /></label
          ><label
            ><span class="field-label">Tesis / konum *</span
            ><input
              class="odv-input"
              [value]="draft().location"
              (input)="patch('location', $any($event.target).value)" /></label
          ><label
            ><span class="field-label">Üretici</span
            ><input
              class="odv-input"
              [value]="draft().manufacturer"
              (input)="patch('manufacturer', $any($event.target).value)" /></label
          ><label
            ><span class="field-label">Model</span
            ><input
              class="odv-input"
              [value]="draft().model"
              (input)="patch('model', $any($event.target).value)" /></label
          ><label
            ><span class="field-label">Seri numarası</span
            ><input
              class="odv-input"
              [value]="draft().serialNumber"
              (input)="patch('serialNumber', $any($event.target).value)" /></label
          ><label
            ><span class="field-label">Makine tipi</span
            ><input
              class="odv-input"
              placeholder="Pres, paketleme hattı…"
              [value]="draft().machineType"
              (input)="patch('machineType', $any($event.target).value)" /></label
          ><label
            ><span class="field-label">İmalat yılı</span
            ><input
              class="odv-input"
              type="number"
              min="1900"
              max="2100"
              [value]="draft().manufactureYear ?? ''"
              (input)="patchNumber('manufactureYear', $any($event.target).value)"
          /></label>
        </div>
      </section>
      <section class="odv-card p-5">
        <h3 class="mt-0">Mevzuat ve standart matrisi</h3>
        <div class="grid gap-4 sm:grid-cols-2">
          <label
            ><span class="field-label">Direktif / tüzük</span
            ><input
              class="odv-input"
              placeholder="2006/42/EC"
              [value]="draft().directive"
              (input)="patch('directive', $any($event.target).value)" /></label
          ><label
            ><span class="field-label">Harmonize standartlar</span
            ><input
              class="odv-input"
              placeholder="EN ISO 12100, EN 60204-1"
              [value]="draft().standardRefsText"
              (input)="patch('standardRefsText', $any($event.target).value)"
          /></label>
        </div>
      </section>
      <section class="odv-card p-5">
        <h3 class="mt-0">Risk değerlendirmesi</h3>
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="sm:col-span-2"
            ><span class="field-label">Tehlike / tehlikeli durum</span
            ><textarea
              class="odv-input min-h-24"
              [value]="draft().hazard"
              (input)="patch('hazard', $any($event.target).value)"
            ></textarea></label
          ><label
            ><span class="field-label">Şiddet (1–5)</span
            ><input
              class="odv-input"
              type="number"
              min="1"
              max="5"
              [value]="draft().severity ?? ''"
              (input)="patchNumber('severity', $any($event.target).value)" /></label
          ><label
            ><span class="field-label">Olasılık (1–5)</span
            ><input
              class="odv-input"
              type="number"
              min="1"
              max="5"
              [value]="draft().probability ?? ''"
              (input)="patchNumber('probability', $any($event.target).value)" /></label
          ><label class="sm:col-span-2"
            ><span class="field-label">Koruyucu tedbirler</span
            ><textarea
              class="odv-input min-h-24"
              [value]="draft().protectiveMeasures"
              (input)="patch('protectiveMeasures', $any($event.target).value)"
            ></textarea></label
          ><label class="sm:col-span-2"
            ><span class="field-label">Kalan risk ve kullanıcı bilgilendirmesi</span
            ><textarea
              class="odv-input min-h-20"
              [value]="draft().residualRisk"
              (input)="patch('residualRisk', $any($event.target).value)"
            ></textarea>
          </label>
        </div>
      </section>
      <section class="odv-card p-5">
        <h3 class="mt-0">İnceleme, onay ve kanıt</h3>
        <div class="grid gap-4 sm:grid-cols-2">
          <label
            ><span class="field-label">Teknik dosya sorumlusu</span
            ><input
              class="odv-input"
              [value]="draft().responsibleName"
              (input)="patch('responsibleName', $any($event.target).value)" /></label
          ><label
            ><span class="field-label">Sonraki değerlendirme</span
            ><input
              class="odv-input"
              type="datetime-local"
              [value]="draft().assessmentDueAt"
              (input)="patch('assessmentDueAt', $any($event.target).value)" /></label
          ><label
            ><span class="field-label">Onay tarihi</span
            ><input
              class="odv-input"
              type="datetime-local"
              [value]="draft().approvedAt"
              (input)="patch('approvedAt', $any($event.target).value)" /></label
          ><label
            ><span class="field-label">Belge referansları</span
            ><input
              class="odv-input"
              placeholder="RA-001, DWG-042, TEST-118"
              [value]="draft().documentRefsText"
              (input)="patch('documentRefsText', $any($event.target).value)" /></label
          ><label class="sm:col-span-2"
            ><span class="field-label">Teknik notlar</span
            ><textarea
              class="odv-input min-h-24"
              [value]="draft().notes"
              (input)="patch('notes', $any($event.target).value)"
            ></textarea>
          </label>
        </div>
      </section>
      @if (editing(); as row) {
        <div class="flex justify-between">
          <button type="button" class="odv-btn-ghost text-rose-600" (click)="toggleArchive(row)">
            {{ row.archivedAt ? 'Arşivden çıkar' : 'Arşivle' }}</button
          ><span class="text-xs text-slate-500"
            >Sürüm {{ row.version }} · değişiklikler audit kaydına işlenir</span
          >
        </div>
      }
    </app-slide-over>
  `,
  styles: `
    .field-label {
      margin-block-end: 0.25rem;
      display: block;
      font-size: 0.75rem;
      font-weight: 700;
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
  readonly archived = signal(false);
  readonly drawerOpen = signal(false);
  readonly saving = signal(false);
  readonly saveError = signal('');
  readonly editing = signal<MachineCeRecord | null>(null);
  readonly draft = signal<RecordDraft>(emptyDraft(this.kind ?? 'machine'));
  readonly dirty = signal(false);
  private timer?: ReturnType<typeof setTimeout>;
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
