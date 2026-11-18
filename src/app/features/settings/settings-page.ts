import { Component, computed, inject, signal } from '@angular/core';
import { FormField, form, minLength, required, submit } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { AuthStore } from '../../core/auth/auth-store';
import { PageHeader } from '../../shared/ui/page-header';
import { SlideOver } from '../../shared/ui/slide-over';
import {
  PermissionAction,
  PermissionResourceKey,
  SettingsApi,
  TenantRole,
  TenantUser,
} from './settings.api';

interface ResourceMeta {
  readonly key: PermissionResourceKey;
  readonly label: string;
  readonly desc: string;
  readonly icon: string;
  readonly actions: readonly { key: PermissionAction; label: string }[];
}

const PERMISSION_MATRIX: readonly ResourceMeta[] = [
  {
    key: 'machineCeRecords',
    label: 'Makine CE Kayıtları & Teknik Dosya',
    desc: 'Makine envanteri, EN ISO 12100 risk analizi, standart matrisi ve AT beyanları',
    icon: 'precision_manufacturing',
    actions: [
      { key: 'view', label: 'Görüntüle' },
      { key: 'create', label: 'Oluştur' },
      { key: 'update', label: 'Düzenle' },
      { key: 'approve', label: 'Onayla (CE)' },
      { key: 'export', label: 'Rapor İndir' },
      { key: 'delete', label: 'Arşivle / Sil' },
    ],
  },
  {
    key: 'users',
    label: 'Ekip & Kullanıcı Yönetimi',
    desc: 'Çalışma alanındaki mühendis ve kullanıcı hesaplarını yönetme',
    icon: 'group',
    actions: [
      { key: 'view', label: 'Görüntüle' },
      { key: 'create', label: 'Kullanıcı Ekle' },
      { key: 'update', label: 'Rol / Durum Güncelle' },
      { key: 'delete', label: 'Erişimi Kapat' },
    ],
  },
  {
    key: 'roles',
    label: 'Rol & Yetki Matrisi Yönetimi',
    desc: 'Özel görev rolleri ve izin matrislerini tanımlama',
    icon: 'admin_panel_settings',
    actions: [
      { key: 'view', label: 'Görüntüle' },
      { key: 'create', label: 'Rol Oluştur' },
      { key: 'update', label: 'İzinleri Düzenle' },
      { key: 'delete', label: 'Rolü Sil' },
    ],
  },
];

interface RoleTemplate {
  readonly name: string;
  readonly description: string;
  readonly icon: string;
  readonly permissions: Record<string, PermissionAction[]>;
}

const ROLE_TEMPLATES: readonly RoleTemplate[] = [
  {
    name: 'CE Baş Mühendisi',
    description: 'Makine CE kayıtları, risk matrisi, teknik dosya onayı ve ekip görüntüleme tam yetkisi.',
    icon: 'verified_user',
    permissions: {
      machineCeRecords: ['view', 'create', 'update', 'approve', 'export', 'delete'],
      users: ['view'],
      roles: ['view'],
    },
  },
  {
    name: 'Risk & Teknik Dosya Uzmanı',
    description: 'Makine envanteri, EN ISO 12100 risk değerlendirmesi ve teknik dosya oluşturma/güncelleme yetkisi.',
    icon: 'health_and_safety',
    permissions: {
      machineCeRecords: ['view', 'create', 'update', 'export'],
    },
  },
  {
    name: 'Kalite & Onay Yöneticisi',
    description: 'Teknik dosyaları inceleme, AT uygunluk beyanlarını onaylama ve denetim paketi indirme yetkisi.',
    icon: 'fact_check',
    permissions: {
      machineCeRecords: ['view', 'update', 'approve', 'export'],
    },
  },
  {
    name: 'Denetçi / İzleyici (Salt Okunur)',
    description: 'İç veya dış denetçiler için kayıtları ve teknik dosya raporlarını salt okunur inceleme yetkisi.',
    icon: 'visibility',
    permissions: {
      machineCeRecords: ['view', 'export'],
    },
  },
];

@Component({
  selector: 'app-settings-page',
  imports: [PageHeader, SlideOver, FormField, RouterLink],
  template: `
    <div class="space-y-6">
      <app-page-header
        eyebrow="TENANT, EKİP & ROL YÖNETİŞİMİ"
        icon="tune"
        title="Ekip, Roller ve Ayarlar"
        description="Kullanıcı hesaplarını, görev bazlı MachineCE izin matrislerini ve kurumsal çalışma alanı profilini yönetin."
      >
        <div actions class="flex flex-wrap items-center gap-2.5">
          @if (canManage) {
            <button type="button" class="odv-btn-soft" (click)="openCreateRole()">
              <span class="material-symbols-rounded">admin_panel_settings</span>Yeni rol tanımla
            </button>
            <button type="button" class="odv-btn-primary" (click)="openCreateUser()">
              <span class="material-symbols-rounded">person_add</span>Ekip üyesi ekle
            </button>
          }
        </div>
      </app-page-header>

      <!-- KPI Summary Strip -->
      <section class="grid grid-cols-1 gap-4 sm:grid-cols-3" aria-label="Ekip ve rol özeti">
        <article class="kpi-card flex items-center justify-between">
          <div>
            <span
              class="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400"
              >Kayıtlı Kullanıcı</span
            >
            <strong class="mt-2 block text-3xl font-black text-slate-900 dark:text-white">{{
              users().length
            }}</strong>
            <span class="mt-1 block text-xs text-slate-500"
              >{{ activeUserCount() }} aktif · {{ users().length - activeUserCount() }} pasif</span
            >
          </div>
          <span
            class="grid size-12 place-items-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/70 dark:text-indigo-400"
          >
            <span class="material-symbols-rounded">groups</span>
          </span>
        </article>

        <article class="kpi-card flex items-center justify-between">
          <div>
            <span
              class="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400"
              >Tanımlı Görev Rolü</span
            >
            <strong class="mt-2 block text-3xl font-black text-indigo-600 dark:text-indigo-400">{{
              roleList().length
            }}</strong>
            <span class="mt-1 block text-xs text-slate-500"
              >Granüler MachineCE izin matrisi</span
            >
          </div>
          <span
            class="grid size-12 place-items-center rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-950/70 dark:text-purple-400"
          >
            <span class="material-symbols-rounded">admin_panel_settings</span>
          </span>
        </article>

        <article class="kpi-card flex items-center justify-between">
          <div>
            <span
              class="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400"
              >Kurumsal Tenant</span
            >
            <strong
              class="mt-2 block truncate text-xl font-black text-slate-900 dark:text-white"
              >{{ auth.session()?.tenantName || 'Odivon Kuruluşu' }}</strong
            >
            <span class="mt-1 block text-xs text-emerald-600 dark:text-emerald-400 font-bold"
              >Durum: {{ auth.session()?.membershipStatus || 'active' }}</span
            >
          </div>
          <span
            class="grid size-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/70 dark:text-emerald-400"
          >
            <span class="material-symbols-rounded">domain_verification</span>
          </span>
        </article>
      </section>

      <!-- Segmented Navigation Tabs -->
      <div
        class="inline-flex flex-wrap rounded-2xl border border-slate-200/80 bg-slate-100 p-1 text-xs font-bold dark:border-slate-700/80 dark:bg-slate-800/80"
        role="tablist"
      >
        <button
          type="button"
          role="tab"
          [attr.aria-selected]="activeTab() === 'users'"
          class="flex items-center gap-2 rounded-xl px-4 py-2.5 transition-all"
          [class.bg-white]="activeTab() === 'users'"
          [class.dark:bg-slate-700]="activeTab() === 'users'"
          [class.text-indigo-600]="activeTab() === 'users'"
          [class.dark:text-indigo-300]="activeTab() === 'users'"
          [class.shadow-xs]="activeTab() === 'users'"
          [class.text-slate-500]="activeTab() !== 'users'"
          (click)="activeTab.set('users')"
        >
          <span class="material-symbols-rounded !text-base">group</span>
          <span>Kullanıcılar & Ekip</span>
          <span
            class="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-extrabold text-indigo-600 dark:bg-indigo-950/80 dark:text-indigo-300"
            >{{ users().length }}</span
          >
        </button>

        <button
          type="button"
          role="tab"
          [attr.aria-selected]="activeTab() === 'roles'"
          class="flex items-center gap-2 rounded-xl px-4 py-2.5 transition-all"
          [class.bg-white]="activeTab() === 'roles'"
          [class.dark:bg-slate-700]="activeTab() === 'roles'"
          [class.text-indigo-600]="activeTab() === 'roles'"
          [class.dark:text-indigo-300]="activeTab() === 'roles'"
          [class.shadow-xs]="activeTab() === 'roles'"
          [class.text-slate-500]="activeTab() !== 'roles'"
          (click)="activeTab.set('roles')"
        >
          <span class="material-symbols-rounded !text-base">admin_panel_settings</span>
          <span>Roller & İzin Matrisi</span>
          <span
            class="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-extrabold text-indigo-600 dark:bg-indigo-950/80 dark:text-indigo-300"
            >{{ roleList().length }}</span
          >
        </button>

        <button
          type="button"
          role="tab"
          [attr.aria-selected]="activeTab() === 'profile'"
          class="flex items-center gap-2 rounded-xl px-4 py-2.5 transition-all"
          [class.bg-white]="activeTab() === 'profile'"
          [class.dark:bg-slate-700]="activeTab() === 'profile'"
          [class.text-indigo-600]="activeTab() === 'profile'"
          [class.dark:text-indigo-300]="activeTab() === 'profile'"
          [class.shadow-xs]="activeTab() === 'profile'"
          [class.text-slate-500]="activeTab() !== 'profile'"
          (click)="activeTab.set('profile')"
        >
          <span class="material-symbols-rounded !text-base">manage_accounts</span>
          <span>Hesabım & Güvenlik</span>
        </button>
      </div>

      @if (error()) {
        <div
          role="alert"
          class="flex items-center justify-between gap-4 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-xs sm:text-sm font-bold text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/60 dark:text-rose-300"
        >
          <span>{{ error() }}</span>
          <button type="button" class="odv-btn-ghost !py-1.5 !px-3" (click)="load()">
            Tekrar dene
          </button>
        </div>
      }

      <!-- TAB 1: USERS & TEAM -->
      @if (activeTab() === 'users') {
        <section class="odv-card overflow-hidden">
          <div
            class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 p-5 dark:border-slate-800"
          >
            <div>
              <h2 class="m-0 text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                Ekip Erişimi ve Kullanıcılar
              </h2>
              <p class="mb-0 mt-1 text-xs sm:text-sm text-slate-500">
                Her kullanıcı yalnızca kendisine atanan görev rollerindeki MachineCE izinleriyle işlem
                yapar.
              </p>
            </div>
            @if (canManage) {
              <button type="button" class="odv-btn-primary" (click)="openCreateUser()">
                <span class="material-symbols-rounded">person_add</span>Yeni kullanıcı ekle
              </button>
            }
          </div>

          @if (loading()) {
            <div class="grid min-h-56 place-items-center">
              <span class="material-symbols-rounded animate-spin !text-4xl text-indigo-600"
                >progress_activity</span
              >
            </div>
          } @else {
            <div class="overflow-x-auto custom-scroll">
              <table class="w-full min-w-[820px] border-collapse">
                <thead>
                  <tr>
                    <th class="odv-th">Kullanıcı</th>
                    <th class="odv-th">Atanan Roller</th>
                    <th class="odv-th">E-posta Doğrulama</th>
                    <th class="odv-th">Hesap Durumu</th>
                    <th class="odv-th text-end">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  @for (u of users(); track u.uid) {
                    <tr class="transition-colors hover:bg-indigo-50/40 dark:hover:bg-slate-800/60">
                      <td class="odv-td">
                        <div class="flex items-center gap-3">
                          <span
                            class="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-black text-white shadow-2xs"
                          >
                            {{ initials(u.displayName || u.email) }}
                          </span>
                          <div>
                            <strong class="block font-bold text-slate-900 dark:text-white">{{
                              u.displayName
                            }}</strong>
                            <span class="text-xs text-slate-500">{{ u.email }}</span>
                          </div>
                        </div>
                      </td>
                      <td class="odv-td">
                        @if (u.role === 'owner') {
                          <span class="odv-badge-info">
                            <span class="material-symbols-rounded !text-sm">workspace_premium</span>
                            Hesap Sahibi (Tam Yetki)
                          </span>
                        } @else {
                          <div class="flex flex-wrap gap-1.5">
                            @for (rName of resolveRoleNames(u.roleIds); track rName) {
                              <span class="odv-badge-info">{{ rName }}</span>
                            } @empty {
                              <span class="odv-badge-warning">Rol atanmadı</span>
                            }
                          </div>
                        }
                      </td>
                      <td class="odv-td">
                        <span
                          [class]="u.emailVerified ? 'odv-badge-success' : 'odv-badge-warning'"
                        >
                          {{ u.emailVerified ? 'Doğrulandı' : 'Onay Bekliyor' }}
                        </span>
                      </td>
                      <td class="odv-td">
                        <span
                          [class]="u.status === 'active' ? 'odv-badge-success' : 'odv-badge-neutral'"
                        >
                          {{ u.status === 'active' ? 'Aktif' : 'Pasif' }}
                        </span>
                      </td>
                      <td class="odv-td text-end">
                        @if (canManage && u.role !== 'owner') {
                          <div class="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              class="odv-btn-ghost !py-1.5 !px-3 !text-xs"
                              (click)="openEditUser(u)"
                            >
                              <span class="material-symbols-rounded !text-base">edit</span>
                              Düzenle
                            </button>
                            @if (u.status === 'active') {
                              <button
                                type="button"
                                class="odv-btn-ghost !py-1.5 !px-3 !text-xs !text-rose-600 dark:!text-rose-400"
                                (click)="deactivate(u)"
                              >
                                Erişimi kapat
                              </button>
                            } @else {
                              <button
                                type="button"
                                class="odv-btn-soft !py-1.5 !px-3 !text-xs"
                                (click)="reactivateUser(u)"
                              >
                                Aktifleştir
                              </button>
                            }
                          </div>
                        } @else {
                          <span class="text-xs text-slate-400">Korumalı hesap</span>
                        }
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="5" class="p-12 text-center text-sm text-slate-500">
                        Henüz ekip kullanıcısı bulunmuyor.
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </section>
      }

      <!-- TAB 2: ROLES & PERMISSION MATRIX -->
      @if (activeTab() === 'roles') {
        <div class="space-y-6">
          @if (canManage) {
            <!-- Quick Role Templates Strip -->
            <section class="odv-card p-5 sm:p-6">
              <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span
                    class="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 dark:text-indigo-400"
                    >HIZLI KURULUM ŞABLONLARI</span
                  >
                  <h3 class="m-0 mt-0.5 text-base font-black text-slate-900 dark:text-white">
                    Önerilen MachineCE Görev Rolleri
                  </h3>
                </div>
                <span class="text-xs text-slate-500"
                  >Tek tıkla standartlara uygun rol şablonu oluşturun</span
                >
              </div>
              <div class="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
                @for (tpl of roleTemplates; track tpl.name) {
                  <article
                    class="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 transition-all hover:border-indigo-300 hover:bg-white dark:border-slate-800 dark:bg-slate-800/40 dark:hover:border-indigo-700"
                  >
                    <div>
                      <div class="flex items-center justify-between gap-2">
                        <span
                          class="grid size-9 place-items-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/70 dark:text-indigo-400"
                        >
                          <span class="material-symbols-rounded !text-lg">{{ tpl.icon }}</span>
                        </span>
                        <span class="odv-badge-info !text-[10px]">Şablon</span>
                      </div>
                      <strong
                        class="mt-3 block text-sm font-extrabold text-slate-900 dark:text-white"
                        >{{ tpl.name }}</strong
                      >
                      <p class="mt-1 mb-0 text-xs leading-relaxed text-slate-500">
                        {{ tpl.description }}
                      </p>
                    </div>
                    <button
                      type="button"
                      class="odv-btn-soft mt-4 w-full justify-center !py-2 !text-xs"
                      (click)="applyRoleTemplate(tpl)"
                    >
                      <span class="material-symbols-rounded !text-base">add_circle</span>
                      Bu şablonla oluştur
                    </button>
                  </article>
                }
              </div>
            </section>
          }

          <!-- Existing Tenant Roles List -->
          <section class="odv-card overflow-hidden">
            <div
              class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 p-5 dark:border-slate-800"
            >
              <div>
                <h2 class="m-0 text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                  Tanımlı Roller ve Yetki Kapsamı
                </h2>
                <p class="mb-0 mt-1 text-xs sm:text-sm text-slate-500">
                  Kullanıcılara atanabilecek özel görev rolleri ve kaynak bazlı işlem izinleri.
                </p>
              </div>
              @if (canManage) {
                <button type="button" class="odv-btn-primary" (click)="openCreateRole()">
                  <span class="material-symbols-rounded">add</span>Özel rol oluştur
                </button>
              }
            </div>

            @if (roleList().length) {
              <div class="divide-y divide-slate-100 dark:divide-slate-800">
                @for (r of roleList(); track r.id) {
                  <article
                    class="flex flex-col justify-between gap-4 p-5 transition-colors hover:bg-indigo-50/30 dark:hover:bg-slate-800/40 lg:flex-row lg:items-center"
                  >
                    <div class="space-y-2">
                      <div class="flex flex-wrap items-center gap-2.5">
                        <span
                          class="grid size-9 place-items-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/70 dark:text-indigo-400"
                        >
                          <span class="material-symbols-rounded !text-lg">shield_person</span>
                        </span>
                        <div>
                          <strong class="text-sm sm:text-base font-black text-slate-900 dark:text-white">{{
                            r.name
                          }}</strong>
                          @if (r.description) {
                            <p class="m-0 text-xs text-slate-500">{{ r.description }}</p>
                          }
                        </div>
                        <span class="odv-badge-neutral !text-[10px]">
                          {{ assignedUserCount(r.id) }} kullanıcıda atanmış
                        </span>
                      </div>

                      <div class="flex flex-wrap gap-1.5 pt-1">
                        @for (summary of permissionSummaries(r); track summary) {
                          <span class="odv-badge-info !text-[11px]">{{ summary }}</span>
                        } @empty {
                          <span class="text-xs text-slate-400">Özel izin tanımlanmamış</span>
                        }
                      </div>
                    </div>

                    @if (canManage) {
                      <div class="flex items-center gap-2 self-end lg:self-center">
                        <button
                          type="button"
                          class="odv-btn-ghost !py-1.5 !px-3 !text-xs"
                          (click)="openEditRole(r)"
                        >
                          <span class="material-symbols-rounded !text-base">edit</span>
                          İzinleri düzenle
                        </button>
                        <button
                          type="button"
                          class="odv-btn-ghost !py-1.5 !px-3 !text-xs !text-rose-600 dark:!text-rose-400"
                          [disabled]="assignedUserCount(r.id) > 0"
                          [title]="
                            assignedUserCount(r.id) > 0
                              ? 'Kullanıcıya atanmış rol silinemez'
                              : 'Rolü sil'
                          "
                          (click)="removeRole(r)"
                        >
                          <span class="material-symbols-rounded !text-base">delete</span>
                          Sil
                        </button>
                      </div>
                    }
                  </article>
                }
              </div>
            } @else {
              <div class="p-12 text-center">
                <span class="material-symbols-rounded !text-4xl text-slate-300"
                  >admin_panel_settings</span
                >
                <strong class="mt-2 block text-sm font-bold text-slate-900 dark:text-white"
                  >Henüz özel görev rolü tanımlanmadı</strong
                >
                <p class="mt-1 text-xs text-slate-500">
                  Yukarıdaki hazır MachineCE şablonlarından birini seçebilir veya "Özel rol oluştur"
                  düğmesiyle kendi izin matrisinizi kurabilirsiniz.
                </p>
              </div>
            }
          </section>
        </div>
      }

      <!-- TAB 3: PROFILE, TENANT & PASSWORD -->
      @if (activeTab() === 'profile') {
        <section class="grid gap-5 lg:grid-cols-2">
          <!-- Profile Form -->
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
                <h2 class="m-0 text-lg font-black text-slate-900 dark:text-white">
                  Kişisel Profil Bilgileri
                </h2>
                <p class="mb-0 mt-0.5 text-xs text-slate-500">
                  CE teknik dosya ve denetim izinde görünen yetkili bilgileriniz
                </p>
              </div>
            </div>
            <form class="grid gap-4 sm:grid-cols-2" (submit)="saveProfile($event)">
              <label>
                <span
                  class="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300"
                  >Ad soyad</span
                >
                <input class="odv-input" [formField]="profileForm.displayName" />
              </label>
              <label>
                <span
                  class="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300"
                  >Telefon</span
                >
                <input class="odv-input" autocomplete="tel" [formField]="profileForm.phone" />
              </label>
              <label class="sm:col-span-2">
                <span
                  class="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300"
                  >E-posta adresi</span
                >
                <input class="odv-input" disabled [value]="auth.session()?.email" />
              </label>
              <div class="sm:col-span-2 flex items-center justify-between pt-2">
                <a routerLink="/billing" class="odv-btn-soft">
                  <span class="material-symbols-rounded">credit_card</span>Plan ve Abonelik
                </a>
                <button class="odv-btn-primary" type="submit" [disabled]="profileSaving()">
                  <span class="material-symbols-rounded">check</span>
                  {{ profileSaving() ? 'Kaydediliyor…' : 'Profili kaydet' }}
                </button>
              </div>
            </form>
          </article>

          <!-- Password Change Form -->
          <article class="odv-card p-6">
            <div
              class="mb-5 flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800"
            >
              <span
                class="grid size-10 place-items-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400"
              >
                <span class="material-symbols-rounded">lock_reset</span>
              </span>
              <div>
                <h2 class="m-0 text-lg font-black text-slate-900 dark:text-white">
                  Şifre ve Oturum Güvenliği
                </h2>
                <p class="mb-0 mt-0.5 text-xs text-slate-500">
                  Hesap şifrenizi güncelleyin (en az 10 karakter)
                </p>
              </div>
            </div>
            <form class="space-y-4" (submit)="updatePassword($event)">
              <label class="block">
                <span
                  class="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300"
                  >Mevcut şifre</span
                >
                <input
                  class="odv-input"
                  type="password"
                  autocomplete="current-password"
                  [formField]="passwordForm.currentPassword"
                />
              </label>
              <label class="block">
                <span
                  class="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300"
                  >Yeni şifre *</span
                >
                <input
                  class="odv-input"
                  type="password"
                  autocomplete="new-password"
                  [formField]="passwordForm.newPassword"
                />
              </label>
              @if (passwordError()) {
                <div role="alert" class="rounded-xl bg-rose-50 p-3 text-xs font-bold text-rose-700">
                  {{ passwordError() }}
                </div>
              }
              <div class="flex justify-end pt-2">
                <button class="odv-btn-primary" type="submit" [disabled]="passwordSaving()">
                  <span class="material-symbols-rounded">key</span>
                  {{ passwordSaving() ? 'Güncelleniyor…' : 'Şifreyi güncelle' }}
                </button>
              </div>
            </form>
          </article>
        </section>
      }
    </div>

    <!-- USER CREATE / EDIT DRAWER -->
    <app-slide-over
      [open]="userDrawerOpen()"
      [dirty]="userDirty()"
      [submitting]="saving()"
      [title]="editingUser() ? 'Kullanıcı ve rol atamasını düzenle' : 'Yeni ekip üyesi ekle'"
      description="Kullanıcı bilgilerini ve atanacak görev rollerini belirleyin."
      eyebrow="EKİP & ERİŞİM YÖNETİMİ"
      icon="person_add"
      [submitLabel]="editingUser() ? 'Değişiklikleri kaydet' : 'Kullanıcı oluştur'"
      (closed)="userDrawerOpen.set(false)"
      (submitted)="saveUser()"
    >
      @if (saveError()) {
        <div role="alert" class="rounded-xl bg-rose-50 p-4 text-sm font-semibold text-rose-700">
          {{ saveError() }}
        </div>
      }

      <section class="odv-card p-5 space-y-4">
        <h3 class="m-0 text-sm font-black text-slate-900 dark:text-white">Kimlik Bilgileri</h3>
        <div class="grid gap-4">
          <label>
            <span class="mb-1.5 block text-xs font-bold">Ad soyad *</span>
            <input
              class="odv-input"
              [value]="userDraft().displayName"
              (input)="patchUser('displayName', $any($event.target).value)"
            />
          </label>
          @if (!editingUser()) {
            <label>
              <span class="mb-1.5 block text-xs font-bold">E-posta adresi *</span>
              <input
                class="odv-input"
                type="email"
                [value]="userDraft().email"
                (input)="patchUser('email', $any($event.target).value)"
              />
            </label>
          }
          <label>
            <span class="mb-1.5 block text-xs font-bold">
              {{ editingUser() ? 'Yeni parola (boş bırakılırsa değişmez)' : 'Geçici parola (en az 10 karakter) *' }}
            </span>
            <input
              class="odv-input"
              type="password"
              autocomplete="new-password"
              [value]="userDraft().password"
              (input)="patchUser('password', $any($event.target).value)"
            />
          </label>
          @if (editingUser()) {
            <label>
              <span class="mb-1.5 block text-xs font-bold">Hesap durumu</span>
              <select
                class="odv-input"
                [value]="userDraft().status"
                (change)="patchUser('status', $any($event.target).value)"
              >
                <option value="active">Aktif</option>
                <option value="inactive">Pasif</option>
              </select>
            </label>
          }
        </div>
      </section>

      <section class="odv-card p-5 space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="m-0 text-sm font-black text-slate-900 dark:text-white">
              Atanacak Görev Rolleri *
            </h3>
            <p class="mb-0 mt-0.5 text-xs text-slate-500">
              Birden fazla rol seçildiğinde izinler birleştirilir.
            </p>
          </div>
          <button
            type="button"
            class="odv-btn-soft !py-1.5 !px-3 !text-xs"
            (click)="userDrawerOpen.set(false); openCreateRole()"
          >
            <span class="material-symbols-rounded !text-sm">add</span>Yeni rol
          </button>
        </div>

        @if (roleList().length) {
          <div class="space-y-2.5">
            @for (role of roleList(); track role.id) {
              <label
                class="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200/80 p-3.5 transition-colors hover:bg-indigo-50/40 dark:border-slate-800 dark:hover:bg-slate-800/60"
                [class.border-indigo-500]="userDraft().roleIds.includes(role.id)"
                [class.bg-indigo-50/30]="userDraft().roleIds.includes(role.id)"
              >
                <input
                  type="checkbox"
                  class="mt-0.5 size-4 accent-indigo-600"
                  [checked]="userDraft().roleIds.includes(role.id)"
                  (change)="toggleUserRole(role.id, $any($event.target).checked)"
                />
                <div class="min-w-0 flex-1">
                  <strong class="block text-xs sm:text-sm font-bold text-slate-900 dark:text-white">{{
                    role.name
                  }}</strong>
                  @if (role.description) {
                    <span class="block text-xs text-slate-500">{{ role.description }}</span>
                  }
                </div>
              </label>
            }
          </div>
        } @else {
          <div class="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/50 dark:text-amber-300">
            <strong>Henüz tanımlı rol bulunmuyor.</strong>
            <p class="mt-1 mb-3">
              Kullanıcı oluşturmadan önce tek tıkla varsayılan "CE Baş Mühendisi" rolünü
              oluşturabilirsiniz:
            </p>
            <button
              type="button"
              class="odv-btn-primary !py-1.5 !px-3 !text-xs"
              (click)="quickCreateDefaultRole()"
            >
              Varsayılan CE Mühendisi rolünü oluştur
            </button>
          </div>
        }
      </section>
    </app-slide-over>

    <!-- ROLE CREATE / EDIT DRAWER -->
    <app-slide-over
      [open]="roleDrawerOpen()"
      [wide]="true"
      [dirty]="roleDirty()"
      [submitting]="saving()"
      [title]="editingRole() ? 'Görev rolünü düzenle' : 'Yeni görev rolü ve izin matrisi'"
      description="Bu role sahip kullanıcıların MachineCE modüllerinde yapabileceği işlemleri seçin."
      eyebrow="ROL TABANLI ERİŞİM KONTROLÜ (RBAC)"
      icon="admin_panel_settings"
      [submitLabel]="editingRole() ? 'Rolü güncelle' : 'Rolü oluştur'"
      (closed)="roleDrawerOpen.set(false)"
      (submitted)="saveRole()"
    >
      @if (saveError()) {
        <div role="alert" class="rounded-xl bg-rose-50 p-4 text-sm font-semibold text-rose-700">
          {{ saveError() }}
        </div>
      }

      <section class="odv-card p-5 space-y-4">
        <div class="grid gap-4 sm:grid-cols-2">
          <label>
            <span class="mb-1.5 block text-xs font-bold">Rol adı *</span>
            <input
              class="odv-input"
              placeholder="Örn. Makine Emniyeti Mühendisi"
              [value]="roleDraft().name"
              (input)="patchRoleField('name', $any($event.target).value)"
            />
          </label>
          <label>
            <span class="mb-1.5 block text-xs font-bold">Açıklama</span>
            <input
              class="odv-input"
              placeholder="Görev ve sorumluluk özeti"
              [value]="roleDraft().description"
              (input)="patchRoleField('description', $any($event.target).value)"
            />
          </label>
        </div>
      </section>

      <section class="space-y-4">
        @for (res of permissionMatrix; track res.key) {
          <article class="odv-card p-5">
            <div class="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
              <div class="flex items-center gap-3">
                <span
                  class="grid size-9 place-items-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/70 dark:text-indigo-400"
                >
                  <span class="material-symbols-rounded">{{ res.icon }}</span>
                </span>
                <div>
                  <strong class="block text-sm font-black text-slate-900 dark:text-white">{{
                    res.label
                  }}</strong>
                  <span class="text-xs text-slate-500">{{ res.desc }}</span>
                </div>
              </div>
              <button
                type="button"
                class="odv-btn-ghost !py-1 !px-2.5 !text-xs"
                (click)="toggleAllResourceActions(res)"
              >
                Tümünü seç / kaldır
              </button>
            </div>

            <div class="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              @for (act of res.actions; track act.key) {
                <label
                  class="flex cursor-pointer items-center gap-2.5 rounded-xl border border-slate-200/80 px-3.5 py-2.5 text-xs font-bold transition-colors hover:bg-indigo-50/40 dark:border-slate-800 dark:hover:bg-slate-800/60"
                  [class.border-indigo-500]="hasRoleAction(res.key, act.key)"
                  [class.bg-indigo-50/40]="hasRoleAction(res.key, act.key)"
                >
                  <input
                    type="checkbox"
                    class="size-4 accent-indigo-600"
                    [checked]="hasRoleAction(res.key, act.key)"
                    (change)="toggleRoleAction(res.key, act.key, $any($event.target).checked)"
                  />
                  <span>{{ act.label }}</span>
                </label>
              }
            </div>
          </article>
        }
      </section>
    </app-slide-over>
  `,
})
export class SettingsPage {
  readonly auth = inject(AuthStore);
  readonly canManage = ['owner', 'admin'].includes(this.auth.session()?.role ?? '');
  readonly permissionMatrix = PERMISSION_MATRIX;
  readonly roleTemplates = ROLE_TEMPLATES;

  readonly activeTab = signal<'users' | 'roles' | 'profile'>('users');
  readonly users = signal<TenantUser[]>([]);
  readonly roleList = signal<TenantRole[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');

  readonly userDrawerOpen = signal(false);
  readonly editingUser = signal<TenantUser | null>(null);
  readonly userDirty = signal(false);
  readonly userDraft = signal({
    displayName: '',
    email: '',
    password: '',
    roleIds: [] as string[],
    status: 'active' as 'active' | 'inactive',
  });

  readonly roleDrawerOpen = signal(false);
  readonly editingRole = signal<TenantRole | null>(null);
  readonly roleDirty = signal(false);
  readonly roleDraft = signal<{
    name: string;
    description: string;
    permissions: Record<string, PermissionAction[]>;
  }>({
    name: '',
    description: '',
    permissions: { machineCeRecords: ['view', 'create', 'update', 'export'] },
  });

  readonly saving = signal(false);
  readonly saveError = signal('');

  readonly profileSaving = signal(false);
  readonly profile = signal({ displayName: this.auth.session()?.name ?? '', phone: '' });
  readonly profileForm = form(this.profile, (p) => required(p.displayName));

  readonly passwordSaving = signal(false);
  readonly passwordError = signal('');
  readonly passwordModel = signal({ currentPassword: '', newPassword: '' });
  readonly passwordForm = form(this.passwordModel, (p) => {
    required(p.newPassword);
    minLength(p.newPassword, 10);
  });

  readonly activeUserCount = computed(
    () => this.users().filter((u) => u.status === 'active').length,
  );

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
    this.error.set('');
    try {
      const [users, roles] = await Promise.all([
        this.api.users(),
        this.api.listRoles().catch(async () => {
          const basic = await this.api.roles();
          return basic.map((r) => ({ id: r.id, name: r.name, description: null, permissions: {} }));
        }),
      ]);
      this.users.set(users);
      this.roleList.set(roles);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Ekip ve rol bilgileri alınamadı.');
    } finally {
      this.loading.set(false);
    }
  }

  resolveRoleNames(roleIds: string[]): string[] {
    const map = new Map(this.roleList().map((r) => [r.id, r.name]));
    return (roleIds || []).map((id) => map.get(id) ?? 'Özel Rol');
  }

  assignedUserCount(roleId: string): number {
    return this.users().filter((u) => u.roleIds?.includes(roleId)).length;
  }

  permissionSummaries(role: TenantRole): string[] {
    const out: string[] = [];
    for (const meta of PERMISSION_MATRIX) {
      const acts = role.permissions?.[meta.key];
      if (acts?.length) {
        out.push(`${meta.label.split(' ')[0]}: ${acts.length} yetki`);
      }
    }
    return out;
  }

  /* User CRUD */
  openCreateUser() {
    this.editingUser.set(null);
    const defaultRoleId = this.roleList()[0]?.id;
    this.userDraft.set({
      displayName: '',
      email: '',
      password: '',
      roleIds: defaultRoleId ? [defaultRoleId] : [],
      status: 'active',
    });
    this.userDirty.set(false);
    this.saveError.set('');
    this.userDrawerOpen.set(true);
  }

  openEditUser(u: TenantUser) {
    this.editingUser.set(u);
    this.userDraft.set({
      displayName: u.displayName,
      email: u.email,
      password: '',
      roleIds: [...(u.roleIds || [])],
      status: u.status,
    });
    this.userDirty.set(false);
    this.saveError.set('');
    this.userDrawerOpen.set(true);
  }

  patchUser<K extends keyof ReturnType<typeof this.userDraft>>(
    key: K,
    value: ReturnType<typeof this.userDraft>[K],
  ) {
    this.userDraft.update((d) => ({ ...d, [key]: value }));
    this.userDirty.set(true);
  }

  toggleUserRole(roleId: string, checked: boolean) {
    this.userDraft.update((d) => {
      const set = new Set(d.roleIds);
      if (checked) set.add(roleId);
      else set.delete(roleId);
      return { ...d, roleIds: [...set] };
    });
    this.userDirty.set(true);
  }

  async quickCreateDefaultRole() {
    const tpl = ROLE_TEMPLATES[0];
    this.saving.set(true);
    try {
      const created = await this.api.createRole({
        name: tpl.name,
        description: tpl.description,
        permissions: tpl.permissions,
      });
      await this.load();
      this.toggleUserRole(created.id, true);
    } catch (e) {
      this.saveError.set(e instanceof Error ? e.message : 'Varsayılan rol oluşturulamadı.');
    } finally {
      this.saving.set(false);
    }
  }

  async saveUser() {
    const d = this.userDraft();
    const editing = this.editingUser();
    if (!d.displayName.trim()) {
      this.saveError.set('Ad soyad alanı zorunludur.');
      return;
    }
    if (!d.roleIds.length) {
      this.saveError.set('En az bir görev rolü seçmelisiniz.');
      return;
    }
    if (!editing && (!d.email.trim() || d.password.length < 10)) {
      this.saveError.set('Geçerli bir e-posta ve en az 10 karakterli geçici parola girin.');
      return;
    }
    if (editing && d.password && d.password.length < 10) {
      this.saveError.set('Yeni parola en az 10 karakter olmalıdır.');
      return;
    }

    this.saving.set(true);
    this.saveError.set('');
    try {
      if (editing) {
        await this.api.updateUser(editing.uid, {
          displayName: d.displayName.trim(),
          roleIds: d.roleIds,
          status: d.status,
          ...(d.password ? { password: d.password } : {}),
        });
      } else {
        await this.api.createUser({
          displayName: d.displayName.trim(),
          email: d.email.trim().toLowerCase(),
          password: d.password,
          roleIds: d.roleIds,
        });
      }
      this.userDirty.set(false);
      this.userDrawerOpen.set(false);
      await this.load();
    } catch (e) {
      this.saveError.set(e instanceof Error ? e.message : 'Kullanıcı kaydedilemedi.');
    } finally {
      this.saving.set(false);
    }
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

  async reactivateUser(user: TenantUser) {
    await this.api.updateUser(user.uid, { status: 'active' });
    await this.load();
  }

  /* Role CRUD */
  openCreateRole() {
    this.editingRole.set(null);
    this.roleDraft.set({
      name: '',
      description: '',
      permissions: { machineCeRecords: ['view', 'create', 'update', 'export'] },
    });
    this.roleDirty.set(false);
    this.saveError.set('');
    this.roleDrawerOpen.set(true);
  }

  openEditRole(role: TenantRole) {
    this.editingRole.set(role);
    this.roleDraft.set({
      name: role.name,
      description: role.description ?? '',
      permissions: JSON.parse(JSON.stringify(role.permissions || {})),
    });
    this.roleDirty.set(false);
    this.saveError.set('');
    this.roleDrawerOpen.set(true);
  }

  applyRoleTemplate(tpl: RoleTemplate) {
    this.editingRole.set(null);
    this.roleDraft.set({
      name: tpl.name,
      description: tpl.description,
      permissions: JSON.parse(JSON.stringify(tpl.permissions)),
    });
    this.roleDirty.set(true);
    this.saveError.set('');
    this.roleDrawerOpen.set(true);
  }

  patchRoleField(key: 'name' | 'description', value: string) {
    this.roleDraft.update((d) => ({ ...d, [key]: value }));
    this.roleDirty.set(true);
  }

  hasRoleAction(resource: PermissionResourceKey, action: PermissionAction): boolean {
    return Boolean(this.roleDraft().permissions[resource]?.includes(action));
  }

  toggleRoleAction(resource: PermissionResourceKey, action: PermissionAction, checked: boolean) {
    this.roleDraft.update((d) => {
      const current = new Set(d.permissions[resource] ?? []);
      if (checked) {
        current.add(action);
        current.add('view');
      } else {
        current.delete(action);
      }
      return {
        ...d,
        permissions: {
          ...d.permissions,
          [resource]: [...current],
        },
      };
    });
    this.roleDirty.set(true);
  }

  toggleAllResourceActions(res: ResourceMeta) {
    const current = this.roleDraft().permissions[res.key] ?? [];
    const allSelected = res.actions.every((a) => current.includes(a.key));
    this.roleDraft.update((d) => ({
      ...d,
      permissions: {
        ...d.permissions,
        [res.key]: allSelected ? [] : res.actions.map((a) => a.key),
      },
    }));
    this.roleDirty.set(true);
  }

  async saveRole() {
    const d = this.roleDraft();
    if (!d.name.trim()) {
      this.saveError.set('Rol adı zorunludur.');
      return;
    }
    this.saving.set(true);
    this.saveError.set('');
    try {
      const editing = this.editingRole();
      const payload = {
        name: d.name.trim(),
        description: d.description.trim() || null,
        permissions: d.permissions,
      };
      if (editing) {
        await this.api.updateRole(editing.id, payload);
      } else {
        await this.api.createRole(payload);
      }
      this.roleDirty.set(false);
      this.roleDrawerOpen.set(false);
      this.activeTab.set('roles');
      await this.load();
    } catch (e) {
      this.saveError.set(e instanceof Error ? e.message : 'Rol kaydedilemedi.');
    } finally {
      this.saving.set(false);
    }
  }

  async removeRole(role: TenantRole) {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Rol silinsin mi?',
      text: `${role.name} rolü kalıcı olarak kaldırılacak.`,
      showCancelButton: true,
      confirmButtonText: 'Rolü sil',
      cancelButtonText: 'Vazgeç',
      buttonsStyling: false,
      customClass: { confirmButton: 'odivon-btn-danger', cancelButton: 'odivon-btn-cancel' },
    });
    if (result.isConfirmed) {
      await this.api.deleteRole(role.id);
      await this.load();
    }
  }

  /* Profile & Password */
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

  updatePassword(event: Event) {
    event.preventDefault();
    submit(this.passwordForm, async () => {
      this.passwordSaving.set(true);
      this.passwordError.set('');
      try {
        await this.api.changePassword(this.passwordModel());
        this.passwordModel.set({ currentPassword: '', newPassword: '' });
        await Swal.fire({
          icon: 'success',
          title: 'Şifreniz güncellendi',
          confirmButtonText: 'Tamam',
          buttonsStyling: false,
          customClass: { confirmButton: 'odivon-btn-primary' },
        });
      } catch (e) {
        this.passwordError.set(e instanceof Error ? e.message : 'Şifre güncellenemedi.');
      } finally {
        this.passwordSaving.set(false);
      }
    });
  }
}
