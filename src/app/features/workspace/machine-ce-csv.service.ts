import { Injectable } from '@angular/core';
import { MachineCeKind, MachineCeRecord, MachineCeStatus, RecordDraft } from './machine-ce.api';

@Injectable({ providedIn: 'root' })
export class MachineCeCsvService {
  private readonly headers = [
    'Kayıt Türü',
    'Makine / Kayıt Adı',
    'Tesis / Konum',
    'Üretici',
    'Model',
    'Seri Numarası',
    'Makine Tipi',
    'İmalat Yılı',
    'Direktif',
    'Harmonize Standartlar',
    'Tehlike',
    'Şiddet',
    'Olasılık',
    'Koruyucu Tedbirler',
    'Kalan Risk',
    'Sorumlu',
    'Sonraki İnceleme',
    'Onay Tarihi',
    'Belge Referansları',
    'Teknik Notlar',
    'Durum',
  ];

  exportRecords(records: MachineCeRecord[], filenamePrefix = 'machinece-kayitlar'): void {
    const rows = records.map((r) => [
      r.kind,
      r.name,
      r.location,
      r.manufacturer ?? '',
      r.model ?? '',
      r.serialNumber ?? '',
      r.machineType ?? '',
      r.manufactureYear != null ? String(r.manufactureYear) : '',
      r.directive ?? '2006/42/EC',
      (r.standardRefs ?? []).join(', '),
      r.hazard ?? '',
      r.severity != null ? String(r.severity) : '',
      r.probability != null ? String(r.probability) : '',
      r.protectiveMeasures ?? '',
      r.residualRisk ?? '',
      r.responsibleName ?? '',
      r.assessmentDueAt ?? '',
      r.approvedAt ?? '',
      (r.documentRefs ?? []).join(', '),
      r.notes ?? '',
      r.status,
    ]);

    const csv = this.buildCsv([this.headers, ...rows]);
    this.triggerDownload(csv, `${filenamePrefix}-${new Date().toISOString().slice(0, 10)}.csv`);
  }

  downloadTemplate(): void {
    const sampleRows = [
      [
        'machine',
        'CNC Hidrolik Abkant Pres Hattı #2',
        'Gebze OSB · Hol B',
        'Odivon Endüstriyel A.Ş.',
        'ODV-PRESS-320T',
        'SN-2026-0412',
        'Hidrolik Abkant Pres',
        '2025',
        '2006/42/EC, AB 2023/1230',
        'EN ISO 12100, EN 12622, EN 60204-1, EN ISO 13849-1',
        'Üst kalıp iniş bölgesinde ezilme ve sıkışma tehlikesi',
        '4',
        '2',
        'Tip 4 lazer ışık perdesi (PL e), çift el kumanda ve kilitlemeli yan muhafazalar',
        'Bakım öncesi LOTO (Kilitleme/Etiketleme) ve koruyucu eldiven kullanımı',
        'Ahmet Yılmaz (Baş Mühendis)',
        '2027-06-15',
        '2026-11-18',
        'TF-2026-0412, RA-12100-01, TEST-60204-08',
        'Yıllık periyodik topraklama ve duruş süresi testi doğrulandı.',
        'approved',
      ],
      [
        'risk-assessment',
        'Robotik MIG/MAG Kaynak Hücresi #4',
        'Bursa Nilüfer OSB · Kaynak Holü',
        'KUKA / Odivon Otomasyon',
        'KR-210-CELL',
        'SN-2026-0889',
        'Endüstriyel Robotik Hücre',
        '2026',
        '2006/42/EC, AB 2023/1230',
        'EN ISO 12100, EN ISO 10218-2, EN ISO 13855',
        'Robot çalışma zarfına yetkisiz giriş ve ark radyasyonu',
        '5',
        '2',
        'RFID kodlu emniyet kapı kilidi, alan tarayıcı ve otomatik ark perdesi',
        'Teach-pendant düşük hız modunda (250 mm/s) eğitimli operatör erişimi',
        'Zeynep Kaya (CE Uzmanı)',
        '2027-04-01',
        '',
        'RA-10218-04, DWG-CELL-19',
        'Emniyet PLC doğrulama testi devam ediyor.',
        'in-review',
      ],
    ];
    const csv = this.buildCsv([this.headers, ...sampleRows]);
    this.triggerDownload(csv, 'machinece-toplu-yukleme-sablonu.csv');
  }

  parseCsv(rawText: string, fallbackKind: MachineCeKind = 'machine'): RecordDraft[] {
    const cleaned = rawText.replace(/^\uFEFF/, '').trim();
    if (!cleaned) return [];

    const firstLine = cleaned.split(/\r?\n/)[0] ?? '';
    const delimiter =
      (firstLine.match(/;/g)?.length ?? 0) >= (firstLine.match(/,/g)?.length ?? 0) ? ';' : ',';
    const matrix = this.tokenizeCsv(cleaned, delimiter);
    if (matrix.length < 2) return [];

    const headerRow = matrix[0].map((h) => h.trim().toLocaleLowerCase('tr-TR'));
    const dataRows = matrix.slice(1);

    const col = (row: string[], names: string[], fallbackIndex: number): string => {
      for (const name of names) {
        const idx = headerRow.findIndex((h) => h.includes(name));
        if (idx !== -1 && row[idx] !== undefined) return row[idx].trim();
      }
      return (row[fallbackIndex] ?? '').trim();
    };

    const drafts: RecordDraft[] = [];
    for (const row of dataRows) {
      if (row.every((cell) => !cell.trim())) continue;
      const name = col(row, ['makine / kayıt adı', 'kayıt adı', 'makine adı', 'name', 'ad'], 1);
      const location = col(row, ['tesis', 'konum', 'location', 'bölüm'], 2);
      if (!name) continue;

      const rawKind = col(row, ['kayıt türü', 'tür', 'kind', 'type'], 0).toLocaleLowerCase('tr-TR');
      const kind = this.normalizeKind(rawKind, fallbackKind);
      const rawStatus = col(row, ['durum', 'status'], 20).toLocaleLowerCase('tr-TR');
      const status = this.normalizeStatus(rawStatus);

      const yearNum = Number(col(row, ['imalat yılı', 'yıl', 'year'], 7));
      const sevNum = Number(col(row, ['şiddet', 'severity'], 11));
      const probNum = Number(col(row, ['olasılık', 'probability'], 12));

      const responsibleName = col(row, ['sorumlu', 'responsible'], 15);
      const approvedAt = col(row, ['onay tarihi', 'approved'], 17);
      const documentRefsText = col(row, ['belge referans', 'document', 'kanıt'], 18);

      // Ensure approved records satisfy mandatory approval fields or fall back to in-review
      const safeStatus: MachineCeStatus =
        status === 'approved' && (!responsibleName || !approvedAt || !documentRefsText)
          ? 'in-review'
          : status;

      drafts.push({
        kind,
        name,
        location: location || 'Ana Üretim Tesisi',
        manufacturer: col(row, ['üretici', 'imalatçı', 'manufacturer'], 3),
        model: col(row, ['model'], 4),
        serialNumber: col(row, ['seri', 'serial'], 5),
        machineType: col(row, ['makine tipi', 'ekipman tipi', 'machine type'], 6),
        manufactureYear:
          Number.isFinite(yearNum) && yearNum >= 1900 && yearNum <= 2100 ? yearNum : null,
        directive: col(row, ['direktif', 'directive', 'mevzuat'], 8) || '2006/42/EC',
        standardRefsText:
          col(row, ['harmonize', 'standart', 'standard'], 9) || 'EN ISO 12100, EN 60204-1',
        hazard: col(row, ['tehlike', 'hazard'], 10),
        severity: Number.isFinite(sevNum) && sevNum >= 1 && sevNum <= 5 ? sevNum : null,
        probability: Number.isFinite(probNum) && probNum >= 1 && probNum <= 5 ? probNum : null,
        protectiveMeasures: col(row, ['koruyucu', 'tedbir', 'protective'], 13),
        residualRisk: col(row, ['kalan risk', 'artık risk', 'residual'], 14),
        responsibleName,
        assessmentDueAt: col(row, ['sonraki inceleme', 'değerlendirme', 'due'], 16),
        approvedAt,
        documentRefsText,
        notes: col(row, ['teknik not', 'notlar', 'notes'], 19),
        status: safeStatus,
      });
    }
    return drafts;
  }

  private normalizeKind(value: string, fallback: MachineCeKind): MachineCeKind {
    if (value.includes('risk')) return 'risk-assessment';
    if (value.includes('standart') || value === 'standard') return 'standard';
    if (value.includes('teknik') || value === 'technical-file') return 'technical-file';
    if (value.includes('beyan') || value === 'declaration') return 'declaration';
    if (value.includes('makine') || value === 'machine') return 'machine';
    return fallback;
  }

  private normalizeStatus(value: string): MachineCeStatus {
    if (value === 'approved' || value.includes('onay')) return 'approved';
    if (value === 'in-review' || value.includes('inceleme')) return 'in-review';
    if (value === 'action-required' || value.includes('aksiyon')) return 'action-required';
    if (value === 'rejected' || value.includes('red')) return 'rejected';
    return 'draft';
  }

  private buildCsv(rows: string[][]): string {
    const escapeCell = (cell: string) => {
      const normalized = cell.replace(/\r?\n/g, ' ');
      if (normalized.includes(';') || normalized.includes('"') || normalized.includes(',')) {
        return `"${normalized.replace(/"/g, '""')}"`;
      }
      return normalized;
    };
    return '\uFEFF' + rows.map((row) => row.map(escapeCell).join(';')).join('\r\n');
  }

  private tokenizeCsv(text: string, delimiter: string): string[][] {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentCell = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      const next = text[i + 1];
      if (inQuotes) {
        if (ch === '"' && next === '"') {
          currentCell += '"';
          i++;
        } else if (ch === '"') {
          inQuotes = false;
        } else {
          currentCell += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === delimiter) {
          currentRow.push(currentCell);
          currentCell = '';
        } else if (ch === '\r' && next === '\n') {
          currentRow.push(currentCell);
          rows.push(currentRow);
          currentRow = [];
          currentCell = '';
          i++;
        } else if (ch === '\n') {
          currentRow.push(currentCell);
          rows.push(currentRow);
          currentRow = [];
          currentCell = '';
        } else {
          currentCell += ch;
        }
      }
    }
    if (currentCell.length > 0 || currentRow.length > 0) {
      currentRow.push(currentCell);
      rows.push(currentRow);
    }
    return rows;
  }

  private triggerDownload(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }
}
