import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { MachineCeApi } from './machine-ce.api';

describe('MachineCeApi', () => {
  let api: MachineCeApi;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
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
});
