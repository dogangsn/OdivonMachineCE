import { Component, inject, signal } from '@angular/core';
import { FormField, form, minLength, required, submit } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { AuthStore } from '../../core/auth/auth-store';
import { PageHeader } from '../../shared/ui/page-header';
import { SlideOver } from '../../shared/ui/slide-over';
import { RoleOption, SettingsApi, TenantUser } from './settings.api';
@Component({
  selector: 'app-settings-page',
  imports: [PageHeader, SlideOver, FormField, RouterLink],
  template: `<div class="space-y-6">
      <app-page-header
        eyebrow="TENANT YÖNETİMİ"
        icon="tune"
        title="Ekip ve Ayarlar"
        description="Hesap profilini, ekip erişimini ve rol atamalarını tenant sınırları içinde yönetin."
      >
        @if (canManage) {
          <button actions type="button" class="odv-btn-primary" (click)="openUser()">
            <span class="material-symbols-rounded">person_add</span>Ekip üyesi ekle
          </button>
        }
      </app-page-header>
      <section class="grid gap-5 lg:grid-cols-[.75fr_1.25fr]">
        <article class="kpi-card flex flex-col justify-between p-6">
          <div>
            <div class="flex items-center justify-between">
              <span
                class="text-xs font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400"
                >KURUMSAL TENANT</span
              >
              <span
                class="grid size-10 place-items-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400"
              >
                <span class="material-symbols-rounded">domain</span>
              </span>
            </div>
            <h2 class="mt-3 text-xl font-black text-slate-900 dark:text-white">
              {{ auth.session()?.tenantName || 'Odivon Kuruluşu' }}
            </h2>
            <div class="mt-5 space-y-3.5 text-sm">
              <div
                class="flex items-center justify-between rounded-xl border border-slate-200/70 bg-slate-50/70 px-3.5 py-2.5 dark:border-slate-800 dark:bg-slate-800/50"
              >
                <span class="text-xs font-semibold text-slate-500">Tenant Kimliği</span>
                <code class="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">{{
                  auth.session()?.tenantId || '—'
                }}</code>
              </div>
              <div
                class="flex items-center justify-between rounded-xl border border-slate-200/70 bg-slate-50/70 px-3.5 py-2.5 dark:border-slate-800 dark:bg-slate-800/50"
              >
                <span class="text-xs font-semibold text-slate-500">Üyelik Durumu</span>
                <span class="odv-badge-success">{{
                  auth.session()?.membershipStatus || 'active'
                }}</span>
              </div>
            </div>
          </div>
          <div class="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
            <a routerLink="/billing" class="odv-btn-soft w-full justify-center">
              <span class="material-symbols-rounded">credit_card</span>Abonelik ve ödeme yönetimi
            </a>
          </div>
        </article>
        <article class="odv-card p-6">
          <div
            class="mb-5 flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800"
          >
            <span
              class="grid size-10 place-items-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400"
            >
              <span class="material-symbols-rounded">person</span>
            </span>
            <div>
              <h2 class="m-0 text-lg font-black text-slate-900 dark:text-white">Hesabım</h2>
              <p class="mb-0 mt-0.5 text-xs text-slate-500">
                Denetim kayıtlarında görünen yetkili mühendis/kullanıcı profiliniz
              </p>
            </div>
          </div>
          <form class="grid gap-4 sm:grid-cols-2" (submit)="saveProfile($event)">
            <label
              ><span
                class="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300"
                >Ad soyad</span
              ><input class="odv-input" [formField]="profileForm.displayName" /></label
            ><label
              ><span
                class="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300"
                >Telefon</span
              ><input class="odv-input" autocomplete="tel" [formField]="profileForm.phone" /></label
            ><label class="sm:col-span-2"
              ><span
                class="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300"
                >E-posta</span
              ><input class="odv-input" disabled [value]="auth.session()?.email"
            /></label>
            <div class="sm:col-span-2 flex justify-end">
              <button class="odv-btn-primary" type="submit" [disabled]="profileSaving()">
                <span class="material-symbols-rounded">check</span>
                {{ profileSaving() ? 'Kaydediliyor…' : 'Profili kaydet' }}
              </button>
            </div>
          </form>
        </article>
      </section>
      <section class="odv-card overflow-hidden">
        <div
          class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 p-5 dark:border-slate-800"
        >
          <div>
            <h2 class="m-0 text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              Ekip erişimi
            </h2>
            <p class="mb-0 mt-1 text-xs sm:text-sm text-slate-500">
              Her kullanıcı yalnız atanmış rol ve MachineCE izinleriyle işlem yapar.
            </p>
          </div>
          <span class="odv-badge-info">{{ users().length }} Kullanıcı</span>
        </div>
        @if (loading()) {
          <div class="grid min-h-52 place-items-center">
            <span class="material-symbols-rounded animate-spin !text-4xl text-indigo-600"
              >progress_activity</span
            >
          </div>
        } @else if (error()) {
          <div class="p-8 text-center text-sm text-rose-600">{{ error() }}</div>
        } @else {
          <div class="overflow-x-auto custom-scroll">
            <table class="w-full min-w-[760px] border-collapse">
              <thead>
                <tr>
                  <th class="odv-th">Kullanıcı</th>
                  <th class="odv-th">Rol</th>
                  <th class="odv-th">Doğrulama</th>
                  <th class="odv-th">Durum</th>
                  <th class="odv-th text-end">İşlem</th>
                </tr>
              </thead>
              <tbody>
                @for (user of users(); track user.uid) {
                  <tr class="transition-colors hover:bg-indigo-50/40 dark:hover:bg-slate-800/60">
                    <td class="odv-td">
                      <div class="flex items-center gap-3">
                        <span
                          class="grid size-8 shrink-0 place-items-center rounded-full bg-indigo-50 text-[11px] font-bold text-indigo-600 dark:bg-indigo-950/70 dark:text-indigo-400"
                        >
                          {{ initials(user.displayName || user.email) }}
                        </span>
                        <div>
                          <strong class="block font-bold text-slate-900 dark:text-white">{{
                            user.displayName
                          }}</strong>
                          <span class="text-xs text-slate-500">{{ user.email }}</span>
                        </div>
                      </div>
                    </td>
                    <td class="odv-td">
                      <span class="odv-badge-info">
                        {{
                          user.role === 'owner'
                            ? 'Hesap sahibi'
                            : user.roleIds.length + ' özel rol'
                        }}
                      </span>
                    </td>
                    <td class="odv-td">
                      <span
                        [class]="user.emailVerified ? 'odv-badge-success' : 'odv-badge-warning'"
                        >{{ user.emailVerified ? 'Doğrulandı' : 'Bekliyor' }}</span
                      >
                    </td>
                    <td class="odv-td">
                      <span
                        [class]="
                          user.status === 'active' ? 'odv-badge-success' : 'odv-badge-neutral'
                        "
                        >{{ user.status === 'active' ? 'Aktif' : 'Pasif' }}</span
                      >
                    </td>
                    <td class="odv-td text-end">
                      @if (user.role !== 'owner' && user.status === 'active' && canManage) {
                        <button
                          type="button"
                          class="odv-btn-ghost !py-1.5 !px-3 !text-xs !text-rose-600 dark:!text-rose-400"
                          (click)="deactivate(user)"
                        >
                          Erişimi kapat
                        </button>
                      }
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="5" class="p-10 text-center text-sm text-slate-500">
                      Ekip kullanıcısı bulunmuyor.
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
      [dirty]="userForm().dirty()"
      [submitting]="saving()"
      title="Ekip üyesi ekle"
      description="Yeni kullanıcıya geçici parola ve görev rolü atayın."
      eyebrow="ERİŞİM YÖNETİMİ"
      icon="person_add"
      submitLabel="Kullanıcı oluştur"
      (closed)="drawerOpen.set(false)"
      (submitted)="createUser()"
    >
      @if (saveError()) {
        <div role="alert" class="rounded-xl bg-rose-50 p-4 text-sm font-semibold text-rose-700">
          {{ saveError() }}
        </div>
      }
      <section class="odv-card p-5">
        <div class="grid gap-4">
          <label
            ><span class="mb-1.5 block text-xs font-bold">Ad soyad *</span
            ><input class="odv-input" [formField]="userForm.displayName" /></label
          ><label
            ><span class="mb-1.5 block text-xs font-bold">E-posta *</span
            ><input class="odv-input" type="email" [formField]="userForm.email" /></label
          ><label
            ><span class="mb-1.5 block text-xs font-bold">Geçici parola *</span
            ><input
              class="odv-input"
              type="password"
              autocomplete="new-password"
              [formField]="userForm.password" /></label
          ><label
            ><span class="mb-1.5 block text-xs font-bold">Rol *</span
            ><select class="odv-input" [formField]="userForm.roleId">
              <option value="">Rol seçin</option>
              @for (role of roles(); track role.id) {
                <option [value]="role.id">{{ role.name }}</option>
              }
            </select></label
          >
        </div>
      </section></app-slide-over
    >`,
})
export class SettingsPage {
  readonly auth = inject(AuthStore);
  readonly canManage = ['owner', 'admin'].includes(this.auth.session()?.role ?? '');
  readonly users = signal<TenantUser[]>([]);
  readonly roles = signal<RoleOption[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly drawerOpen = signal(false);
  readonly saving = signal(false);
  readonly saveError = signal('');
  readonly profileSaving = signal(false);
  readonly profile = signal({ displayName: this.auth.session()?.name ?? '', phone: '' });
  readonly profileForm = form(this.profile, (p) => required(p.displayName));
  readonly user = signal({ displayName: '', email: '', password: '', roleId: '' });
  readonly userForm = form(this.user, (p) => {
    required(p.displayName);
    required(p.email);
    required(p.password);
    minLength(p.password, 10);
    required(p.roleId);
  });
  private readonly api = inject(SettingsApi);
  constructor() {
    void this.load();
  }
  initials(name: string): string {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  async load() {
    this.loading.set(true);
    try {
      const [users, roles] = await Promise.all([this.api.users(), this.api.roles()]);
      this.users.set(users);
      this.roles.set(roles);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Ekip bilgileri alınamadı.');
    } finally {
      this.loading.set(false);
    }
  }
  openUser() {
    this.user.set({ displayName: '', email: '', password: '', roleId: '' });
    this.drawerOpen.set(true);
  }
  createUser() {
    submit(this.userForm, async () => {
      this.saving.set(true);
      this.saveError.set('');
      try {
        await this.api.createUser({
          displayName: this.user().displayName,
          email: this.user().email,
          password: this.user().password,
          roleIds: [this.user().roleId],
        });
        this.drawerOpen.set(false);
        await this.load();
      } catch (e) {
        this.saveError.set(e instanceof Error ? e.message : 'Kullanıcı oluşturulamadı.');
      } finally {
        this.saving.set(false);
      }
    });
  }
  saveProfile(event: Event) {
    event.preventDefault();
    submit(this.profileForm, async () => {
      this.profileSaving.set(true);
      try {
        await this.api.updateMe(this.profile());
        await this.auth.refreshProfile();
        await Swal.fire({
          icon: 'success',
          title: 'Profil güncellendi',
          confirmButtonText: 'Tamam',
          buttonsStyling: false,
          customClass: { confirmButton: 'odivon-btn-primary' },
        });
      } finally {
        this.profileSaving.set(false);
      }
    });
  }
  async deactivate(user: TenantUser) {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Erişimi kapat?',
      text: `${user.displayName} artık çalışma alanına erişemeyecek.`,
      showCancelButton: true,
      confirmButtonText: 'Erişimi kapat',
      cancelButtonText: 'Vazgeç',
      buttonsStyling: false,
      customClass: { confirmButton: 'odivon-btn-danger', cancelButton: 'odivon-btn-cancel' },
    });
    if (result.isConfirmed) {
      await this.api.deactivate(user.uid);
      await this.load();
    }
  }
}
