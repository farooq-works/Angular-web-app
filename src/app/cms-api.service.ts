import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AdminUser, SiteSection } from './models';

@Injectable({ providedIn: 'root' })
export class CmsApiService {
  private readonly http = inject(HttpClient);

  getPublicSections(): Observable<SiteSection[]> {
    return this.http.get<SiteSection[]>('/api/sections');
  }

  getAdminSections(): Observable<SiteSection[]> {
    return this.http.get<SiteSection[]>('/api/admin/sections');
  }

  login(username: string, password: string): Observable<{ username: string; isOwner: boolean }> {
    return this.http.post<{ username: string; isOwner: boolean }>('/api/auth/login', { username, password });
  }

  currentUser(): Observable<{ username: string | null; isOwner: boolean }> {
    return this.http.get<{ username: string | null; isOwner: boolean }>('/api/auth/me');
  }

  logout(): Observable<void> {
    return this.http.post<void>('/api/auth/logout', {});
  }

  createSection(section: SiteSection): Observable<SiteSection> {
    return this.http.post<SiteSection>('/api/admin/sections', section);
  }

  updateSection(section: SiteSection): Observable<SiteSection> {
    return this.http.put<SiteSection>(`/api/admin/sections/${encodeURIComponent(section.id)}`, section);
  }

  deleteSection(id: string): Observable<void> {
    return this.http.delete<void>(`/api/admin/sections/${encodeURIComponent(id)}`);
  }

  getAdminUsers(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>('/api/admin/users');
  }

  createAdminUser(username: string, password: string): Observable<{ username: string }> {
    return this.http.post<{ username: string }>('/api/admin/users', { username, password });
  }

  resetAdminUserPassword(username: string, password: string): Observable<{ username: string }> {
    return this.http.put<{ username: string }>(`/api/admin/users/${encodeURIComponent(username)}/password`, { password });
  }

  deleteAdminUser(username: string): Observable<void> {
    return this.http.delete<void>(`/api/admin/users/${encodeURIComponent(username)}`);
  }

  sendContact(form: { name: string; email: string; message: string }): Observable<{ message: string }> {
    return this.http.post<{ message: string }>('/api/contact', form);
  }

  subscribe(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>('/api/newsletter', { email });
  }
}

export function getErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error !== null && 'error' in error) {
    const body = error.error;
    if (typeof body === 'object' && body !== null && 'error' in body && typeof body.error === 'string') {
      return body.error;
    }
    if (typeof body === 'object' && body !== null && 'message' in body && typeof body.message === 'string') {
      return body.message;
    }
  }
  if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  return fallback;
}
