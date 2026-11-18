import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { apiErrorDetails } from '../../core/api/api-error';

interface Envelope<T> {
  data: T;
}

export type PermissionAction =
  | 'view'
  | 'create'
  | 'update'
  | 'delete'
  | 'export'
  | 'approve'
  | 'refund';

export type PermissionResourceKey = 'machineCeRecords' | 'users' | 'roles';

export type RolePermissionMap = Partial<Record<PermissionResourceKey, PermissionAction[]>>;

export interface TenantUser {
  uid: string;
  email: string;
  displayName: string;
  role: string;
  roleIds: string[];
  status: 'active' | 'inactive';
  emailVerified: boolean;
}

export interface RoleOption {
  id: string;
  name: string;
}

export interface TenantRole {
  id: string;
  name: string;
  description: string | null;
  permissions: Record<string, PermissionAction[]>;
  updatedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class SettingsApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/identity`;

  users() {
    return this.request(this.http.get<Envelope<TenantUser[]>>(`${this.base}/users`));
  }

  createUser(input: { email: string; displayName: string; password: string; roleIds: string[] }) {
    return this.request(this.http.post<Envelope<TenantUser>>(`${this.base}/users`, input));
  }

  updateUser(
    uid: string,
    input: {
      displayName?: string;
      roleIds?: string[];
      status?: 'active' | 'inactive';
      password?: string;
    },
  ) {
    return this.request(
      this.http.patch<Envelope<TenantUser>>(
        `${this.base}/users/${encodeURIComponent(uid)}`,
        input,
      ),
    );
  }

  deactivate(uid: string) {
    return this.request(
      this.http.delete<Envelope<{ uid: string }>>(`${this.base}/users/${encodeURIComponent(uid)}`),
    );
  }

  roles() {
    return this.request(this.http.get<Envelope<RoleOption[]>>(`${this.base}/roles/lookup`));
  }

  listRoles() {
    return this.request(this.http.get<Envelope<TenantRole[]>>(`${this.base}/roles`));
  }

  createRole(input: {
    name: string;
    description?: string | null;
    permissions: Record<string, PermissionAction[]>;
  }) {
    return this.request(this.http.post<Envelope<TenantRole>>(`${this.base}/roles`, input));
  }

  updateRole(
    id: string,
    input: {
      name?: string;
      description?: string | null;
      permissions?: Record<string, PermissionAction[]>;
    },
  ) {
    return this.request(
      this.http.patch<Envelope<TenantRole>>(
        `${this.base}/roles/${encodeURIComponent(id)}`,
        input,
      ),
    );
  }

  deleteRole(id: string) {
    return this.request(
      this.http.delete<Envelope<{ id: string }>>(`${this.base}/roles/${encodeURIComponent(id)}`),
    );
  }

  updateMe(input: { displayName: string; phone: string }) {
    return this.request(this.http.patch<Envelope<unknown>>(`${this.base}/me`, input));
  }

  changePassword(input: { currentPassword?: string; newPassword: string }) {
    return this.request(this.http.post<Envelope<unknown>>(`${this.base}/change-password`, input));
  }

  private async request<T>(source: Observable<Envelope<T>>): Promise<T> {
    try {
      return (await firstValueFrom(source)).data;
    } catch (error) {
      if (error instanceof HttpErrorResponse)
        throw new Error(apiErrorDetails(error, 'Ayar işlemi tamamlanamadı.').message);
      throw error;
    }
  }
}
