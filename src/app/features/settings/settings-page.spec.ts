import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthStore } from '../../core/auth/auth-store';
import { SettingsPage } from './settings-page';

describe('SettingsPage (Users & Roles RBAC)', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SettingsPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: AuthStore,
          useValue: {
            session: () => ({
              name: 'Doğan Güneş',
              email: 'dogan@odivon.com',
              tenantId: 'ten-1',
              tenantName: 'Odivon Mühendislik',
              emailVerified: true,
              role: 'owner',
              membershipStatus: 'active',
              trialEndsAt: null,
              subscriptionEndsAt: null,
              inGrace: false,
              onboardingCompleted: true,
            }),
            refreshProfile: async () => null,
          },
        },
      ],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads users and roles, resolves role names, and toggles role permissions', async () => {
    const fixture = TestBed.createComponent(SettingsPage);
    const component = fixture.componentInstance;

    http.expectOne(`${environment.apiBaseUrl}/identity/users`).flush({
      data: [
        {
          uid: 'u-1',
          email: 'kaan@odivon.com',
          displayName: 'Kaan Demir',
          role: 'user',
          roleIds: ['role-ce-lead'],
          status: 'active',
          emailVerified: true,
        },
      ],
    });

    http.expectOne(`${environment.apiBaseUrl}/identity/roles`).flush({
      data: [
        {
          id: 'role-ce-lead',
          name: 'CE Baş Mühendisi',
          description: 'Tam CE yetkisi',
          permissions: {
            machineCeRecords: ['view', 'create', 'update', 'approve', 'export'],
          },
        },
      ],
    });

    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.users()).toHaveLength(1);
    expect(component.roleList()).toHaveLength(1);
    expect(component.resolveRoleNames(['role-ce-lead'])).toEqual(['CE Baş Mühendisi']);

    component.applyRoleTemplate(component.roleTemplates[1]);
    expect(component.roleDrawerOpen()).toBe(true);
    expect(component.roleDraft().name).toBe('Risk & Teknik Dosya Uzmanı');
    expect(component.hasRoleAction('machineCeRecords', 'create')).toBe(true);

    component.toggleRoleAction('users', 'create', true);
    expect(component.hasRoleAction('users', 'create')).toBe(true);
    expect(component.hasRoleAction('users', 'view')).toBe(true);
  });
});
