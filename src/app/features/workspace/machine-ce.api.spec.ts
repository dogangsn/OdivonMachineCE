import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { environment } from '../../../environments/environment';
import { MachineCePage } from './machine-ce-page';
import { MachineCeApi } from './machine-ce.api';

describe('MachineCeApi & MachineCePage', () => {
  let api: MachineCeApi;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MachineCePage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: { view: 'overview' },
            },
          },
        },
      ],
    });
    api = TestBed.inject(MachineCeApi);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('forwards tenant record filters', async () => {
    const result = api.list('machine', false, 'pres');
    const request = http.expectOne(
      (r) =>
        r.url === `${environment.apiBaseUrl}/machine-ce/records` &&
        r.params.get('kind') === 'machine' &&
        r.params.get('search') === 'pres',
    );
    request.flush({ data: { items: [] } });
    await expect(result).resolves.toEqual({ items: [] });
  });

  it('computes EN ISO 12100 risk score and filters records in MachineCePage', async () => {
    const fixture = TestBed.createComponent(MachineCePage);
    const component = fixture.componentInstance;

    http
      .expectOne((r) => r.url === `${environment.apiBaseUrl}/machine-ce/records`)
      .flush({
        data: {
          items: [
            {
              id: 'rec-1',
              kind: 'risk-assessment',
              name: 'Abkant Pres Ezilme Riski',
              location: 'Gebze Tesis 1',
              manufacturer: 'Odivon',
              model: 'AP-400',
              serialNumber: 'SN-1001',
              machineType: 'Hidrolik Pres',
              manufactureYear: 2026,
              directive: '2006/42/EC',
              standardRefs: ['EN ISO 12100'],
              hazard: 'Üst kalıp inişinde el ezilmesi',
              severity: 5,
              probability: 4,
              riskScore: null,
              protectiveMeasures: 'Tip 4 ışık perdesi',
              residualRisk: 'Düşük',
              responsibleName: 'Kaan Demir',
              assessmentDueAt: '2026-12-30T10:00:00Z',
              approvedAt: null,
              notes: null,
              documentRefs: ['RA-001'],
              status: 'action-required',
              version: 2,
              updatedAt: '2026-11-16T10:00:00Z',
              archivedAt: null,
            },
          ],
        },
      });
    http
      .expectOne(`${environment.apiBaseUrl}/machine-ce/dashboard`)
      .flush({
        data: {
          total: 1,
          machines: 0,
          riskAssessments: 1,
          standards: 0,
          technicalFiles: 0,
          declarations: 0,
          approved: 0,
          dueSoon: 1,
          actionRequired: 1,
          complianceScore: 92,
        },
      });

    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.filteredRecords()).toHaveLength(1);
    expect(component.rowRiskScore(component.filteredRecords()[0])).toBe(20);
    expect(component.riskLevelLabel(20)).toBe('Yüksek');

    component.openCreate();
    component.patchNumber('severity', '4');
    component.patchNumber('probability', '3');
    expect(component.draftRiskScore()).toBe(12);
    expect(component.riskLevelLabel(12)).toBe('Orta');
  });
});
