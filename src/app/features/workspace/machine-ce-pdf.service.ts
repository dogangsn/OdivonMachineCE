import { Injectable } from '@angular/core';
import { MachineCeDashboard, MachineCeRecord } from './machine-ce.api';

@Injectable({ providedIn: 'root' })
export class MachineCePdfService {
  printRecordDoC(row: MachineCeRecord, tenantName = 'Odivon MachineCE Kurumsal Çalışma Alanı'): void {
    const score =
      row.riskScore ?? (row.severity && row.probability ? row.severity * row.probability : null);
    const riskLevel =
      score == null ? 'Belirtilmedi' : score >= 15 ? 'Yüksek Risk' : score >= 8 ? 'Orta Risk' : 'Düşük / Kabul Edilebilir';
    const standards = row.standardRefs.length
      ? row.standardRefs
      : ['EN ISO 12100:2010', 'EN 60204-1:2018', 'EN ISO 13849-1:2023'];
    const docs = row.documentRefs.length ? row.documentRefs : ['TF-GENEL-001'];
    const attachments = row.attachments ?? [];
    const issueDate = this.formatDate(row.approvedAt || row.updatedAt);
    const dueDate = this.formatDate(row.assessmentDueAt);

    const html = `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <title>AT Uygunluk Beyanı & Teknik Dosya — ${this.esc(row.name)}</title>
  <style>
    @page { size: A4 portrait; margin: 14mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #0f172a;
      background: #f8fafc;
      font-size: 12px;
      line-height: 1.5;
    }
    .toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 24px;
      background: #0f172a;
      color: #fff;
      position: sticky;
      top: 0;
      z-index: 10;
    }
    .toolbar-actions { display: flex; gap: 10px; }
    .btn {
      border: 0;
      border-radius: 8px;
      padding: 8px 16px;
      font-weight: 700;
      font-size: 12px;
      cursor: pointer;
    }
    .btn-primary { background: #4f46e5; color: #fff; }
    .btn-ghost { background: rgba(255,255,255,0.12); color: #fff; }
    .sheet {
      max-width: 210mm;
      margin: 20px auto;
      background: #fff;
      border: 1px solid #cbd5e1;
      border-radius: 12px;
      padding: 24px 28px;
      box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
    }
    .header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 16px;
      margin-bottom: 18px;
    }
    .ce-mark {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .ce-box {
      width: 56px;
      height: 56px;
      border: 2.5px solid #0f172a;
      border-radius: 12px;
      display: grid;
      place-items: center;
      font-weight: 900;
      font-size: 24px;
      letter-spacing: 2px;
    }
    .doc-eyebrow {
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: #4f46e5;
    }
    .doc-title {
      margin: 3px 0 2px;
      font-size: 19px;
      font-weight: 900;
      letter-spacing: -0.02em;
      color: #0f172a;
    }
    .doc-sub {
      margin: 0;
      font-size: 11px;
      color: #475569;
      font-weight: 600;
    }
    .meta-box {
      text-align: right;
      font-size: 11px;
      color: #334155;
    }
    .meta-box strong {
      display: block;
      font-size: 12px;
      color: #0f172a;
    }
    .badge {
      display: inline-block;
      margin-top: 6px;
      padding: 3px 10px;
      border-radius: 999px;
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      background: #e0e7ff;
      color: #3730a3;
    }
    .section {
      margin-bottom: 16px;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      overflow: hidden;
    }
    .section-head {
      background: #f1f5f9;
      padding: 8px 14px;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #1e293b;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
    }
    .cell {
      padding: 9px 14px;
      border-bottom: 1px solid #f1f5f9;
      border-right: 1px solid #f1f5f9;
    }
    .cell-label {
      display: block;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
      margin-bottom: 2px;
    }
    .cell-val {
      font-weight: 700;
      color: #0f172a;
      word-break: break-word;
    }
    .full-cell {
      grid-column: 1 / -1;
      padding: 10px 14px;
      border-bottom: 1px solid #f1f5f9;
    }
    .chips {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 4px;
    }
    .chip {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 3px 8px;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 11px;
      font-weight: 700;
      color: #1e293b;
    }
    .declaration-statement {
      padding: 12px 14px;
      background: #f8fafc;
      border-left: 4px solid #4f46e5;
      font-size: 11.5px;
      color: #1e293b;
      margin: 14px 0;
    }
    .sign-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-top: 18px;
    }
    .sign-box {
      border: 1px dashed #94a3b8;
      border-radius: 10px;
      padding: 14px;
      min-height: 105px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .footer-note {
      margin-top: 14px;
      padding-top: 10px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: #64748b;
    }
    @media print {
      body { background: #fff; }
      .toolbar { display: none !important; }
      .sheet {
        margin: 0;
        border: 0;
        box-shadow: none;
        padding: 0;
        max-width: 100%;
      }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <div>
      <strong>ODIVON MachineCE · Resmî Belge Çıktı Motoru</strong>
      <span style="margin-left:10px;opacity:.75;">2006/42/EC · AB 2023/1230 · EN ISO 12100</span>
    </div>
    <div class="toolbar-actions">
      <button class="btn btn-primary" onclick="window.print()">PDF Olarak Kaydet / Yazdır</button>
      <button class="btn btn-ghost" onclick="window.close()">Kapat</button>
    </div>
  </div>

  <main class="sheet">
    <header class="header">
      <div class="ce-mark">
        <div class="ce-box" aria-label="CE İşareti">CE</div>
        <div>
          <span class="doc-eyebrow">2006/42/EC EK II · AB 2023/1230 · EN ISO 12100</span>
          <h1 class="doc-title">AT / AB UYGUNLUK BEYANI & TEKNİK DOSYA FÖYÜ</h1>
          <p class="doc-sub">EC / EU DECLARATION OF CONFORMITY & TECHNICAL FILE SUMMARY</p>
        </div>
      </div>
      <div class="meta-box">
        <strong>Belge No: CE-${this.esc(row.id.slice(0, 8).toUpperCase())}-V${row.version}</strong>
        <span>Kayıt Türü: ${this.esc(this.kindLabel(row.kind))}</span><br/>
        <span>Düzenleme / Onay: ${this.esc(issueDate)}</span><br/>
        <span class="badge">${this.esc(this.statusLabel(row.status))} · Sürüm v${row.version}</span>
      </div>
    </header>

    <div class="section">
      <div class="section-head">
        <span>1. İmalatçı / İşletme ve Tesis Kimliği</span>
        <span>Manufacturer & Facility</span>
      </div>
      <div class="grid-2">
        <div class="cell">
          <span class="cell-label">Kuruluş / Çalışma Alanı</span>
          <span class="cell-val">${this.esc(row.manufacturer || tenantName)}</span>
        </div>
        <div class="cell">
          <span class="cell-label">Üretim Tesisi / Konum</span>
          <span class="cell-val">${this.esc(row.location)}</span>
        </div>
        <div class="cell">
          <span class="cell-label">Teknik Dosya Sorumlusu</span>
          <span class="cell-val">${this.esc(row.responsibleName || 'Atanmadı')}</span>
        </div>
        <div class="cell">
          <span class="cell-label">Sonraki Periyodik İnceleme</span>
          <span class="cell-val">${this.esc(dueDate)}</span>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-head">
        <span>2. Makine / Ekipman Teknik Kimliği</span>
        <span>Machine Technical Identification</span>
      </div>
      <div class="grid-2">
        <div class="cell">
          <span class="cell-label">Makine / Kayıt Adı</span>
          <span class="cell-val">${this.esc(row.name)}</span>
        </div>
        <div class="cell">
          <span class="cell-label">Makine Tipi / Fonksiyonu</span>
          <span class="cell-val">${this.esc(row.machineType || 'Endüstriyel Makine / Hat')}</span>
        </div>
        <div class="cell">
          <span class="cell-label">Model</span>
          <span class="cell-val">${this.esc(row.model || '—')}</span>
        </div>
        <div class="cell">
          <span class="cell-label">Seri Numarası & İmalat Yılı</span>
          <span class="cell-val">${this.esc(row.serialNumber || '—')} ${row.manufactureYear ? `(${row.manufactureYear})` : ''}</span>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-head">
        <span>3. Uygulanan AB Direktifleri ve Harmonize Standartlar</span>
        <span>Directives & Harmonized Standards</span>
      </div>
      <div class="grid-2">
        <div class="full-cell">
          <span class="cell-label">Temel Direktifler / Tüzükler</span>
          <span class="cell-val">${this.esc(row.directive || '2006/42/EC Makine Emniyeti Yönetmeliği · AB 2023/1230 Makine Tüzüğü')}</span>
        </div>
        <div class="full-cell">
          <span class="cell-label">Referans Alınan Harmonize Standartlar (A / B / C Tipi)</span>
          <div class="chips">
            ${standards.map((s) => `<span class="chip">${this.esc(s)}</span>`).join('')}
          </div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-head">
        <span>4. EN ISO 12100 Risk Değerlendirmesi ve Emniyet Tedbirleri</span>
        <span>Risk Assessment & Protective Measures</span>
      </div>
      <div class="grid-2">
        <div class="cell">
          <span class="cell-label">Şiddet (S: 1-5) × Olasılık (P: 1-5)</span>
          <span class="cell-val">Şiddet: ${row.severity ?? '—'} · Olasılık: ${row.probability ?? '—'}</span>
        </div>
        <div class="cell">
          <span class="cell-label">Hesaplanan Risk Skoru & Seviye</span>
          <span class="cell-val">${score != null ? `${score} / 25 — ${riskLevel}` : 'Değerlendirilmedi'}</span>
        </div>
        <div class="full-cell">
          <span class="cell-label">Tanımlanan Tehlike / Tehlikeli Durum</span>
          <span class="cell-val">${this.esc(row.hazard || 'Mekanik, elektrik ve kontrol devresi tehlikeleri EN ISO 12100 kapsamında analiz edilmiştir.')}</span>
        </div>
        <div class="full-cell">
          <span class="cell-label">Uygulanan Koruyucu Tedbirler (3 Adım Yöntemi)</span>
          <span class="cell-val">${this.esc(row.protectiveMeasures || 'Tasarımla güvenli hale getirme, teknik koruyucu donanımlar ve emniyet kontrol fonksiyonları.')}</span>
        </div>
        <div class="full-cell">
          <span class="cell-label">Kalan (Artık) Risk ve Kullanıcı Bilgilendirmesi</span>
          <span class="cell-val">${this.esc(row.residualRisk || 'Bakım öncesi LOTO (Kilitleme/Etiketleme), KKD kullanımı ve kullanım kılavuzu talimatları.')}</span>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-head">
        <span>5. Teknik Dosya Kanıt Referansları ve Yüklenen Belgeler</span>
        <span>Technical File Evidence & Attachments</span>
      </div>
      <div class="grid-2">
        <div class="full-cell">
          <span class="cell-label">Kanıt Belge Kodları</span>
          <div class="chips">
            ${docs.map((d) => `<span class="chip">${this.esc(d)}</span>`).join('')}
          </div>
        </div>
        ${
          attachments.length
            ? `<div class="full-cell">
                <span class="cell-label">Yüklenen Teknik Dosya Ekleri (${attachments.length} Adet)</span>
                <div class="chips">
                  ${attachments
                    .map(
                      (a) =>
                        `<span class="chip">${this.esc(a.refCode)} · ${this.esc(a.name)} (${this.esc(a.category)})</span>`,
                    )
                    .join('')}
                </div>
              </div>`
            : ''
        }
        ${
          row.notes
            ? `<div class="full-cell">
                <span class="cell-label">Teknik Denetim Notları</span>
                <span class="cell-val">${this.esc(row.notes)}</span>
              </div>`
            : ''
        }
      </div>
    </div>

    <div class="declaration-statement">
      <strong>Uygunluk Beyanı Taahhüdü:</strong> Yukarıda teknik kimliği belirtilen makinenin/ekipmanın,
      <strong>${this.esc(row.directive || '2006/42/EC Makine Emniyeti Yönetmeliği ve AB 2023/1230')}</strong>
      temel sağlık ve güvenlik gerekliliklerine ve yukarıda listelenen harmonize standartlara uygun olduğunu;
      Ek VII kapsamındaki teknik dosyanın eksiksiz olarak muhafaza edildiğini beyan ederiz.
    </div>

    <div class="sign-grid">
      <div class="sign-box">
        <div>
          <span class="cell-label">Teknik Dosyayı Düzenleyen / Sorumlu Mühendis</span>
          <strong style="font-size:13px;">${this.esc(row.responsibleName || '______________________')}</strong>
        </div>
        <div style="font-size:10px;color:#64748b;">Tarih & İmza: ${this.esc(issueDate)}</div>
      </div>
      <div class="sign-box">
        <div>
          <span class="cell-label">İmalatçı / Yetkili Temsilci Onayı</span>
          <strong style="font-size:13px;">${this.esc(row.manufacturer || tenantName)}</strong>
        </div>
        <div style="font-size:10px;color:#64748b;">Kaşe & Yetkili İmza:</div>
      </div>
    </div>

    <footer class="footer-note">
      <span>ODIVON MachineCE · Değişmez Denetim İzi (Immutable Audit Trail)</span>
      <span>Kayıt ID: ${this.esc(row.id)} · Sürüm v${row.version} · Çıktı Tarihi: ${this.formatDate(new Date().toISOString())}</span>
    </footer>
  </main>
  <script>
    window.addEventListener('load', () => {
      setTimeout(() => window.print(), 250);
    });
  </script>
</body>
</html>`;

    this.openPrintWindow(html);
  }

  printPortfolioReport(
    records: MachineCeRecord[],
    dashboard: MachineCeDashboard | null,
    title = 'Makine CE Uyumluluk ve Risk Portföyü Raporu',
  ): void {
    const now = this.formatDate(new Date().toISOString());
    const rowsHtml = records
      .map((r, index) => {
        const score =
          r.riskScore ?? (r.severity && r.probability ? r.severity * r.probability : null);
        return `<tr>
          <td>${index + 1}</td>
          <td><strong>${this.esc(r.name)}</strong><br/><small>${this.esc(r.serialNumber || r.model || '—')}</small></td>
          <td>${this.esc(this.kindLabel(r.kind))}</td>
          <td>${this.esc(r.location)}</td>
          <td>${this.esc(r.directive || '2006/42/EC')}<br/><small>${this.esc(r.standardRefs.join(', ') || '—')}</small></td>
          <td>${score != null ? `<strong>${score}</strong> (${r.severity}×${r.probability})` : '—'}</td>
          <td>${this.esc(r.responsibleName || '—')}</td>
          <td>${this.esc(this.statusLabel(r.status))} (v${r.version})</td>
        </tr>`;
      })
      .join('');

    const html = `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <title>${this.esc(title)} — Odivon MachineCE</title>
  <style>
    @page { size: A4 landscape; margin: 12mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #0f172a;
      background: #f8fafc;
      font-size: 11px;
    }
    .toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 24px;
      background: #0f172a;
      color: #fff;
    }
    .btn {
      border: 0;
      border-radius: 8px;
      padding: 8px 16px;
      font-weight: 700;
      font-size: 12px;
      cursor: pointer;
      background: #4f46e5;
      color: #fff;
    }
    .sheet {
      max-width: 285mm;
      margin: 18px auto;
      background: #fff;
      border: 1px solid #cbd5e1;
      border-radius: 12px;
      padding: 22px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .kpis {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 10px;
      margin-bottom: 16px;
    }
    .kpi {
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 10px 12px;
      background: #f8fafc;
    }
    .kpi span { display: block; font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; }
    .kpi strong { font-size: 20px; font-weight: 900; color: #0f172a; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #cbd5e1; padding: 7px 9px; text-align: left; vertical-align: top; }
    th { background: #f1f5f9; font-size: 10px; font-weight: 800; text-transform: uppercase; }
    small { color: #64748b; font-size: 10px; }
    @media print {
      body { background: #fff; }
      .toolbar { display: none !important; }
      .sheet { margin: 0; border: 0; padding: 0; max-width: 100%; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <strong>ODIVON MachineCE · Denetim ve Portföy PDF Raporu</strong>
    <button class="btn" onclick="window.print()">PDF Olarak Kaydet / Yazdır</button>
  </div>
  <main class="sheet">
    <header class="header">
      <div>
        <div style="font-size:10px;font-weight:800;color:#4f46e5;letter-spacing:.12em;">2006/42/EC · AB 2023/1230 · EN ISO 12100</div>
        <h1 style="margin:3px 0 0;font-size:18px;font-weight:900;">${this.esc(title)}</h1>
      </div>
      <div style="text-align:right;font-size:11px;">
        <strong>Rapor Tarihi: ${this.esc(now)}</strong><br/>
        <span>Listelenen Kayıt: ${records.length}</span>
      </div>
    </header>
    <section class="kpis">
      <div class="kpi"><span>CE Hazırlık Skoru</span><strong>%${dashboard?.complianceScore ?? 100}</strong></div>
      <div class="kpi"><span>Toplam Kayıt</span><strong>${dashboard?.total ?? records.length}</strong></div>
      <div class="kpi"><span>Makine Envanteri</span><strong>${dashboard?.machines ?? 0}</strong></div>
      <div class="kpi"><span>EN ISO 12100 Risk</span><strong>${dashboard?.riskAssessments ?? 0}</strong></div>
      <div class="kpi"><span>Onaylı Kanıt</span><strong>${dashboard?.approved ?? 0}</strong></div>
    </section>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Makine / Kayıt & Seri No</th>
          <th>Tür</th>
          <th>Tesis / Konum</th>
          <th>Direktif & Standartlar</th>
          <th>Risk Skoru</th>
          <th>Sorumlu</th>
          <th>Durum & Sürüm</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml || '<tr><td colspan="8" style="text-align:center;padding:20px;">Kayıt bulunmuyor.</td></tr>'}
      </tbody>
    </table>
  </main>
  <script>
    window.addEventListener('load', () => {
      setTimeout(() => window.print(), 250);
    });
  </script>
</body>
</html>`;

    this.openPrintWindow(html);
  }

  private openPrintWindow(html: string): void {
    const popup = window.open('', '_blank', 'width=980,height=860,noopener');
    if (popup) {
      popup.document.open();
      popup.document.write(html);
      popup.document.close();
      return;
    }
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `machinece-belge-${new Date().toISOString().slice(0, 10)}.html`;
    link.click();
    URL.revokeObjectURL(url);
  }

  private formatDate(value: string | null | undefined): string {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  private kindLabel(kind: MachineCeRecord['kind']): string {
    return (
      {
        machine: 'Makine Envanteri',
        'risk-assessment': 'EN ISO 12100 Risk Değerlendirmesi',
        standard: 'Harmonize Standart Gerekliliği',
        'technical-file': 'Teknik Dosya',
        declaration: 'AT Uygunluk Beyanı',
      } as const
    )[kind];
  }

  private statusLabel(status: MachineCeRecord['status']): string {
    return (
      {
        draft: 'Taslak',
        'in-review': 'İncelemede',
        'action-required': 'Aksiyon Gerekli',
        approved: 'Onaylandı',
        rejected: 'Reddedildi',
      } as const
    )[status];
  }

  private esc(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
