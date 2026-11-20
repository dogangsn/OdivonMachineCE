import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { apiErrorDetails } from '../../core/api/api-error';

interface Envelope<T> {
  readonly data: T;
}
export type MachineCeKind =
  'machine' | 'risk-assessment' | 'standard' | 'technical-file' | 'declaration';
export type MachineCeStatus = 'draft' | 'in-review' | 'action-required' | 'approved' | 'rejected';

export interface MachineCeAttachmentMeta {
  readonly id: string;
  readonly name: string;
  readonly category: string;
  readonly mimeType: string;
  readonly size: number;
  readonly refCode: string;
  readonly uploadedAt: string;
  readonly uploadedBy: string;
}

export interface MachineCeAttachment extends MachineCeAttachmentMeta {
  readonly recordId: string;
  readonly tenantId: string;
  readonly dataUrl: string;
}

export interface UploadAttachmentInput {
  readonly name: string;
  readonly category: string;
  readonly mimeType: string;
  readonly size: number;
  readonly dataUrl: string;
  readonly refCode?: string;
}

export interface MachineCeRecord {
  readonly id: string;
  readonly kind: MachineCeKind;
  readonly name: string;
  readonly location: string;
  readonly manufacturer: string | null;
  readonly model: string | null;
  readonly serialNumber: string | null;
  readonly machineType: string | null;
  readonly manufactureYear: number | null;
  readonly directive: string | null;
  readonly standardRefs: string[];
  readonly hazard: string | null;
  readonly severity: number | null;
  readonly probability: number | null;
  readonly riskScore: number | null;
  readonly protectiveMeasures: string | null;
  readonly residualRisk: string | null;
  readonly responsibleName: string | null;
  readonly assessmentDueAt: string | null;
  readonly approvedAt: string | null;
  readonly notes: string | null;
  readonly documentRefs: string[];
  readonly attachments?: MachineCeAttachmentMeta[];
  readonly status: MachineCeStatus;
  readonly version: number;
  readonly updatedAt: string;
  readonly archivedAt: string | null;
}
export interface MachineCeDashboard {
  readonly total: number;
  readonly machines: number;
  readonly riskAssessments: number;
  readonly standards: number;
  readonly technicalFiles: number;
  readonly declarations: number;
  readonly approved: number;
  readonly dueSoon: number;
  readonly actionRequired: number;
  readonly complianceScore: number;
}
export interface RecordDraft {
  kind: MachineCeKind;
  name: string;
  location: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  machineType: string;
  manufactureYear: number | null;
  directive: string;
  standardRefsText: string;
  hazard: string;
  severity: number | null;
  probability: number | null;
  protectiveMeasures: string;
  residualRisk: string;
  responsibleName: string;
  assessmentDueAt: string;
  approvedAt: string;
  notes: string;
  documentRefsText: string;
  status: MachineCeStatus;
}

export interface AiAnalyzeMachineInput {
  readonly name: string;
  readonly machineType?: string;
  readonly location?: string;
  readonly hazardHint?: string;
}

export interface AiAnalyzeMachineOutput {
  readonly provider: 'gemini' | 'expert-engine';
  readonly machineType: string;
  readonly directive: string;
  readonly standardRefs: string[];
  readonly hazard: string;
  readonly severity: number;
  readonly probability: number;
  readonly riskScore: number;
  readonly performanceLevel: string;
  readonly protectiveMeasures: string;
  readonly residualRisk: string;
  readonly requiredTests: string[];
  readonly notes: string;
}

export interface AiPortfolioAuditOutput {
  readonly provider: 'gemini' | 'expert-engine';
  readonly headline: string;
  readonly readinessScore: number;
  readonly gaps: string[];
  readonly recommendations: string[];
  readonly regulation2023Notes: string[];
}

export interface AiCopilotAskOutput {
  readonly provider: 'gemini' | 'expert-engine';
  readonly title: string;
  readonly answer: string;
  readonly referencedStandards: string[];
  readonly checklist: string[];
  readonly suggestedDraft: {
    readonly name: string;
    readonly machineType: string;
    readonly directive: string;
    readonly standardRefs: string[];
    readonly hazard: string;
    readonly severity: number;
    readonly probability: number;
    readonly protectiveMeasures: string;
    readonly residualRisk: string;
  };
}

@Injectable({ providedIn: 'root' })
export class MachineCeApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/machine-ce`;
  list(kind: MachineCeKind | null, archived: boolean, search: string) {
    let params = new HttpParams().set('archived', archived).set('limit', 100);
    if (kind) params = params.set('kind', kind);
    if (search.trim()) params = params.set('search', search.trim());
    return this.request(
      this.http.get<Envelope<{ items: MachineCeRecord[] }>>(`${this.base}/records`, { params }),
    );
  }
  dashboard() {
    return this.request(this.http.get<Envelope<MachineCeDashboard>>(`${this.base}/dashboard`));
  }
  create(draft: RecordDraft) {
    return this.request(
      this.http.post<Envelope<MachineCeRecord>>(`${this.base}/records`, this.payload(draft)),
    );
  }
  bulkCreate(drafts: RecordDraft[]) {
    return this.request(
      this.http.post<Envelope<{ created: number; items: MachineCeRecord[] }>>(
        `${this.base}/records/bulk`,
        { items: drafts.map((draft) => this.payload(draft)) },
      ),
    );
  }
  uploadAttachment(recordId: string, input: UploadAttachmentInput) {
    return this.request(
      this.http.post<Envelope<MachineCeRecord>>(
        `${this.base}/records/${encodeURIComponent(recordId)}/attachments`,
        input,
      ),
    );
  }
  getAttachment(recordId: string, attachmentId: string) {
    return this.request(
      this.http.get<Envelope<MachineCeAttachment>>(
        `${this.base}/records/${encodeURIComponent(recordId)}/attachments/${encodeURIComponent(attachmentId)}`,
      ),
    );
  }
  deleteAttachment(recordId: string, attachmentId: string) {
    return this.request(
      this.http.delete<Envelope<MachineCeRecord>>(
        `${this.base}/records/${encodeURIComponent(recordId)}/attachments/${encodeURIComponent(attachmentId)}`,
      ),
    );
  }
  update(id: string, version: number, draft: RecordDraft) {
    return this.request(
      this.http.patch<Envelope<MachineCeRecord>>(`${this.base}/records/${encodeURIComponent(id)}`, {
        ...this.payload(draft),
        expectedVersion: version,
      }),
    );
  }
  archive(id: string) {
    return this.request(
      this.http.delete<Envelope<MachineCeRecord>>(`${this.base}/records/${encodeURIComponent(id)}`),
    );
  }
  restore(id: string) {
    return this.request(
      this.http.post<Envelope<MachineCeRecord>>(
        `${this.base}/records/${encodeURIComponent(id)}/restore`,
        {},
      ),
    );
  }
  report() {
    return this.request(this.http.get<Envelope<unknown>>(`${this.base}/reports/compliance`));
  }
  aiAnalyzeMachine(input: AiAnalyzeMachineInput) {
    return this.request(
      this.http.post<Envelope<AiAnalyzeMachineOutput>>(`${this.base}/ai/analyze-machine`, input),
    );
  }
  aiAuditPortfolio() {
    return this.request(
      this.http.post<Envelope<AiPortfolioAuditOutput>>(`${this.base}/ai/audit-portfolio`, {}),
    );
  }
  aiAskCopilot(question: string, contextMachineName?: string) {
    return this.request(
      this.http.post<Envelope<AiCopilotAskOutput>>(`${this.base}/ai/ask`, {
        question,
        contextMachineName: contextMachineName?.trim() || undefined,
      }),
    );
  }
  private payload(draft: RecordDraft) {
    const optional = (value: string) => value.trim() || undefined;
    return {
      ...draft,
      manufacturer: optional(draft.manufacturer),
      model: optional(draft.model),
      serialNumber: optional(draft.serialNumber),
      machineType: optional(draft.machineType),
      directive: optional(draft.directive),
      hazard: optional(draft.hazard),
      protectiveMeasures: optional(draft.protectiveMeasures),
      residualRisk: optional(draft.residualRisk),
      responsibleName: optional(draft.responsibleName),
      assessmentDueAt: optional(draft.assessmentDueAt),
      approvedAt: optional(draft.approvedAt),
      notes: optional(draft.notes),
      standardRefs: draft.standardRefsText
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      documentRefs: draft.documentRefsText
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      standardRefsText: undefined,
      documentRefsText: undefined,
    };
  }
  private async request<T>(source: Observable<Envelope<T>>): Promise<T> {
    try {
      return (await firstValueFrom(source)).data;
    } catch (error) {
      if (error instanceof HttpErrorResponse)
        throw new Error(apiErrorDetails(error, 'MainAPI isteği tamamlanamadı.').message);
      throw error;
    }
  }
}
