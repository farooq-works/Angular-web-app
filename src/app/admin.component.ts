import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CmsApiService, getErrorMessage } from './cms-api.service';
import { AdminUser, SectionContent, SiteSection } from './models';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <main *ngIf="checking" class="grid min-h-screen place-items-center bg-slate-950 text-white"><div class="text-center"><div class="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-blue-400"></div><p class="text-sm text-slate-300">Checking admin session…</p></div></main>

    <main *ngIf="!checking && !authenticated" class="relative grid min-h-screen place-items-center overflow-hidden bg-slate-950 px-5 py-12 text-white">
      <div class="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl"></div><div class="pointer-events-none absolute -bottom-40 -right-32 h-[32rem] w-[32rem] rounded-full bg-violet-500/20 blur-3xl"></div>
      <div class="relative w-full max-w-md">
        <a routerLink="/" class="mb-8 inline-flex items-center gap-3 text-white no-underline"><span class="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-500 text-sm font-black shadow-glow">MFD</span><strong class="text-sm font-extrabold">MFD Solutions</strong></a>
        <form (ngSubmit)="login()" class="rounded-3xl border border-white/10 bg-white/[.06] p-7 shadow-2xl backdrop-blur-xl sm:p-9">
          <span class="text-xs font-bold uppercase tracking-[.2em] text-blue-300">Admin access</span><h1 class="mt-2 text-3xl font-black tracking-tight">Welcome back</h1><p class="mt-2 text-sm text-slate-400">Sign in to manage your website content.</p>
          <label class="mt-7 block text-sm font-medium text-slate-200">Username<input name="username" [(ngModel)]="username" autocomplete="username" required class="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-blue-400" placeholder="Username"></label>
          <label class="mt-4 block text-sm font-medium text-slate-200">Password<input name="password" [(ngModel)]="password" [type]="showPassword ? 'text' : 'password'" autocomplete="current-password" required class="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-blue-400" placeholder="Password"></label>
          <label class="mt-4 flex items-center gap-2 text-xs text-slate-400"><input type="checkbox" name="showPassword" autocomplete="off" [(ngModel)]="showPassword" class="accent-blue-500"> Show password</label>
          <p *ngIf="errorMessage" role="alert" class="mt-4 rounded-lg border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{{ errorMessage }}</p>
          <button [disabled]="loggingIn" class="mt-6 w-full rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 px-5 py-3.5 font-bold text-white shadow-glow transition hover:opacity-90 disabled:opacity-50">{{ loggingIn ? 'Signing in…' : 'Sign in to dashboard →' }}</button>
          <p class="mt-5 text-center text-xs text-slate-500">Authorized administrators only.</p>
        </form>
        <a routerLink="/" class="mt-6 block text-center text-sm text-slate-400 transition hover:text-white">← Return to the website</a>
      </div>
    </main>

    <main *ngIf="!checking && authenticated" class="min-h-screen bg-slate-100 text-slate-800">
      <header class="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div class="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-3 sm:px-7">
          <a routerLink="/" class="flex items-center gap-3 text-ink no-underline"><span class="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 text-xs font-black text-white">MFD</span><span><strong class="block text-sm">Website CMS</strong><small class="text-xs text-slate-500">MFD Solutions</small></span></a>
          <div class="flex items-center gap-2"><span class="hidden text-sm text-slate-500 sm:inline">{{ currentUsername }}</span><a routerLink="/" target="_blank" class="hidden rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium transition hover:bg-slate-50 sm:inline-flex">View website ↗</a><button type="button" (click)="logout()" class="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-rose-200 hover:text-rose-600">Sign out</button></div>
        </div>
      </header>

      <div class="mx-auto max-w-[1500px] px-4 py-6 sm:px-7 sm:py-9">
        <div class="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div><p class="text-xs font-bold uppercase tracking-[.18em] text-blue-600">Content management</p><h1 class="mt-2 text-3xl font-black tracking-tight text-ink">Website sections</h1><p class="mt-1 text-sm text-slate-500">Manage the live pages, copy, and order of each section.</p></div>
          <button type="button" (click)="addSection()" [disabled]="saving" class="rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-3 text-sm font-bold text-white shadow-glow transition hover:-translate-y-0.5 disabled:opacity-50">＋ Add new section</button>
        </div>
        <div *ngIf="notice" role="status" class="mb-5 rounded-xl border px-4 py-3 text-sm" [ngClass]="noticeIsError ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-800'">{{ notice }}</div>
        <section *ngIf="isOwner" class="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div><p class="text-xs font-bold uppercase tracking-[.16em] text-blue-600">Access management</p><h2 class="mt-1 text-xl font-extrabold text-ink">Dashboard users</h2><p class="mt-1 text-sm text-slate-500">Add or remove accounts that can manage website content.</p></div>
            <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{{ adminUsers.length }} additional {{ adminUsers.length === 1 ? 'user' : 'users' }}</span>
          </div>
          <div *ngIf="usersNotice" role="status" class="mt-4 rounded-lg border px-4 py-3 text-sm" [ngClass]="usersNoticeIsError ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-800'">{{ usersNotice }}</div>
          <form (ngSubmit)="addAdminUser()" class="mt-5 grid items-end gap-4 sm:grid-cols-[1fr_1fr_auto]">
            <label class="block text-sm font-semibold">Username<input name="newUsername" [(ngModel)]="newUsername" minlength="3" maxlength="32" pattern="[A-Za-z0-9._-]+" autocomplete="off" required class="mt-2 w-full rounded-lg border border-slate-200 px-3.5 py-2.5 font-normal outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" placeholder="colleague"></label>
            <label class="block text-sm font-semibold">Temporary password<input name="newPassword" [(ngModel)]="newPassword" type="password" minlength="16" maxlength="72" autocomplete="new-password" required class="mt-2 w-full rounded-lg border border-slate-200 px-3.5 py-2.5 font-normal outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" placeholder="At least 16 characters"><small class="mt-1 block font-normal text-slate-500">Use a unique password (16–72 bytes) and share it privately.</small></label>
            <button type="submit" [disabled]="userSaving" class="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-50">{{ userSaving ? 'Saving…' : '＋ Add user' }}</button>
          </form>
          <div *ngIf="usersLoading" class="mt-5 text-sm text-slate-500">Loading dashboard users…</div>
          <div *ngIf="!usersLoading && adminUsers.length" class="mt-5 divide-y divide-slate-100 rounded-xl border border-slate-100">
            <div *ngFor="let user of adminUsers" class="px-4 py-3">
              <div class="flex flex-wrap items-center justify-between gap-3">
                <div><strong class="text-sm">{{ user.username }}</strong><p class="mt-0.5 text-xs text-slate-500">Added {{ user.createdAt | date:'mediumDate' }}</p></div>
                <div class="flex flex-wrap gap-2">
                  <button type="button" (click)="startPasswordReset(user)" [disabled]="userSaving" class="rounded-lg border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 disabled:opacity-50">Reset password</button>
                  <button type="button" (click)="removeAdminUser(user)" [disabled]="userSaving" class="rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50">Remove access</button>
                </div>
              </div>
              <form *ngIf="passwordResetUsername === user.username" (ngSubmit)="resetAdminUserPassword(user)" class="mt-3 flex flex-wrap items-end gap-3 rounded-lg bg-slate-50 p-3">
                <label class="min-w-60 flex-1 text-sm font-semibold">New password<input [name]="'resetPassword-' + user.username" [(ngModel)]="passwordResetValue" type="password" minlength="16" maxlength="72" autocomplete="new-password" required class="mt-2 w-full rounded-lg border border-slate-200 px-3.5 py-2.5 font-normal outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" placeholder="At least 16 characters"></label>
                <button type="submit" [disabled]="userSaving" class="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-50">{{ userSaving ? 'Saving…' : 'Set new password' }}</button>
                <button type="button" (click)="cancelPasswordReset()" [disabled]="userSaving" class="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 disabled:opacity-50">Cancel</button>
                <p class="w-full text-xs text-slate-500">Use a unique password (16–72 bytes). The user’s active sessions will be signed out.</p>
              </form>
              <div *ngIf="resetPasswordResult?.username === user.username" role="status" class="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                <p>Password reset. Share this new password privately; it cannot be retrieved again.</p>
                <p class="mt-1 break-all font-mono">{{ resetPasswordResult?.password }}</p>
                <button type="button" (click)="dismissResetPasswordResult()" class="mt-2 text-xs font-semibold underline">Hide password</button>
              </div>
            </div>
          </div>
          <p *ngIf="!usersLoading && !adminUsers.length" class="mt-5 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">No additional dashboard users yet.</p>
        </section>
        <div class="grid items-start gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside class="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <div class="flex items-center justify-between px-3 py-3"><h2 class="text-sm font-bold">All sections</h2><span class="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold">{{ sections.length }}</span></div>
            <div *ngIf="sectionsLoading" class="p-5 text-sm text-slate-500">Loading sections…</div>
            <div *ngIf="!sectionsLoading && sections.length === 0" class="p-5 text-sm text-slate-500">No sections yet. Add one to get started.</div>
            <button *ngFor="let section of sections" type="button" (click)="selectSection(section)" class="mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition" [ngClass]="selected?.id === section.id ? 'bg-blue-50 text-blue-800 ring-1 ring-blue-100' : 'text-slate-600 hover:bg-slate-50'">
              <span class="h-2 w-2 shrink-0 rounded-full" [ngClass]="section.published ? 'bg-emerald-500' : 'bg-slate-300'"></span><span class="min-w-0 flex-1"><strong class="block truncate text-sm">{{ section.title }}</strong><small class="text-xs text-slate-400">{{ section.id }} · order {{ section.sortOrder }}</small></span>
            </button>
          </aside>

          <section *ngIf="selected && draft" class="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div class="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-7">
              <div><span class="text-[10px] font-bold uppercase tracking-[.16em] text-blue-600">Editing section</span><h2 class="mt-1 text-xl font-extrabold text-ink">{{ draft.title }}</h2></div>
              <div class="flex flex-wrap items-center gap-2"><button type="button" (click)="duplicateSection()" [disabled]="saving" class="rounded-lg border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 disabled:opacity-50">Duplicate section</button><button type="button" (click)="deleteSection()" [disabled]="saving" class="rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50">Delete</button><button type="button" (click)="saveSection()" [disabled]="saving" class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-50">{{ saving ? 'Saving…' : 'Save changes' }}</button></div>
            </div>
            <form (ngSubmit)="saveSection()" class="space-y-5 p-5 sm:p-7">
              <div class="grid gap-5 sm:grid-cols-2">
                <label class="block text-sm font-semibold">Section title<input name="title" autocomplete="off" [(ngModel)]="draft.title" maxlength="160" required class="mt-2 w-full rounded-lg border border-slate-200 px-3.5 py-2.5 font-normal outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"></label>
                <label class="block text-sm font-semibold">Section ID <span class="font-normal text-slate-400">(URL anchor)</span><input name="id" autocomplete="off" [ngModel]="draft.id" readonly class="mt-2 w-full rounded-lg border border-slate-100 bg-slate-50 px-3.5 py-2.5 font-mono text-sm font-normal text-slate-500"></label>
                <label class="block text-sm font-semibold">Eyebrow<input name="eyebrow" autocomplete="off" [(ngModel)]="draft.eyebrow" maxlength="5000" class="mt-2 w-full rounded-lg border border-slate-200 px-3.5 py-2.5 font-normal outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"></label>
                <label class="block text-sm font-semibold">Layout type<select name="kind" [(ngModel)]="draft.kind" class="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 font-normal outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"><option *ngFor="let kind of sectionKinds" [value]="kind">{{ kind }}</option></select></label>
                <label class="block text-sm font-semibold">Order<input name="sortOrder" type="number" autocomplete="off" min="0" max="10000" [(ngModel)]="draft.sortOrder" class="mt-2 w-full rounded-lg border border-slate-200 px-3.5 py-2.5 font-normal outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"></label>
                <label class="flex items-end pb-2"><span class="flex items-center gap-2 text-sm font-semibold"><input name="published" type="checkbox" autocomplete="off" [(ngModel)]="draft.published" class="h-4 w-4 accent-blue-600"> Visible on public website</span></label>
              </div>
              <label class="block text-sm font-semibold">Section description<textarea name="description" autocomplete="off" [(ngModel)]="draft.description" maxlength="5000" rows="3" class="mt-2 w-full resize-y rounded-lg border border-slate-200 px-3.5 py-2.5 font-normal leading-6 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"></textarea></label>
              <label class="block text-sm font-semibold">Section content <span class="font-normal text-slate-500">· JSON (items, slides, images, paragraphs, and other layout data)</span><textarea name="contentJson" autocomplete="off" [(ngModel)]="contentJson" spellcheck="false" rows="18" class="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-slate-950 px-4 py-4 font-mono text-xs leading-6 text-emerald-200 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 sm:text-sm"></textarea></label>
              <p class="text-xs leading-5 text-slate-500">Keep content valid JSON. Array entries in <code class="rounded bg-slate-100 px-1">items</code> become cards or list items. Use <code class="rounded bg-slate-100 px-1">slides</code> for hero content. Removing a section deletes it from the public site.</p>
              <div class="flex flex-wrap gap-3 border-t border-slate-100 pt-5"><button [disabled]="saving" class="rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-3 text-sm font-bold text-white shadow-glow disabled:opacity-50">{{ saving ? 'Saving…' : 'Save section' }}</button><button type="button" (click)="resetDraft()" class="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50">Discard unsaved changes</button></div>
            </form>
          </section>
          <section *ngIf="!selected && !sectionsLoading" class="grid min-h-64 place-items-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center"><div><span class="text-4xl">✏️</span><h2 class="mt-3 font-bold">Choose a section to edit</h2><p class="mt-1 text-sm text-slate-500">Or add a section to start creating.</p></div></section>
        </div>
      </div>
    </main>
  `
})
export class AdminComponent implements OnInit {
  private readonly api = inject(CmsApiService);
  readonly sectionKinds = ['hero', 'about', 'cards', 'details', 'technologies', 'stats', 'process', 'portfolio', 'guarantee', 'pricing', 'testimonials', 'faq', 'contact', 'newsletter'];
  authenticated = false;
  checking = true;
  loggingIn = false;
  username = '';
  password = '';
  showPassword = false;
  errorMessage = '';
  currentUsername = '';
  isOwner = false;
  adminUsers: AdminUser[] = [];
  usersLoading = false;
  userSaving = false;
  newUsername = '';
  newPassword = '';
  passwordResetUsername: string | null = null;
  passwordResetValue = '';
  resetPasswordResult: { username: string; password: string } | null = null;
  usersNotice = '';
  usersNoticeIsError = false;
  sections: SiteSection[] = [];
  selected: SiteSection | null = null;
  draft: SiteSection | null = null;
  contentJson = '';
  sectionsLoading = false;
  saving = false;
  notice = '';
  noticeIsError = false;

  ngOnInit(): void {
    this.api.currentUser().subscribe({
      next: (user) => {
        this.checking = false;
        if (user.username) {
          this.authenticated = true;
          this.currentUsername = user.username;
          this.isOwner = user.isOwner;
          this.loadSections();
          if (this.isOwner) this.loadAdminUsers();
        }
      },
      error: (error: unknown) => {
        this.checking = false;
        if (this.statusOf(error) !== 401) this.errorMessage = getErrorMessage(error, 'Could not verify your admin session.');
      }
    });
  }

  login(): void {
    this.errorMessage = '';
    this.loggingIn = true;
    this.api.login(this.username, this.password).subscribe({
      next: (user) => {
        this.password = '';
        this.authenticated = true;
        this.currentUsername = user.username;
        this.isOwner = user.isOwner;
        this.loggingIn = false;
        this.loadSections();
        if (this.isOwner) this.loadAdminUsers();
      },
      error: (error: unknown) => {
        this.errorMessage = getErrorMessage(error, 'Sign in failed. Please try again.');
        this.loggingIn = false;
      }
    });
  }

  loadSections(): void {
    this.sectionsLoading = true;
    this.api.getAdminSections().subscribe({
      next: (sections) => {
        this.sections = sections;
        this.sectionsLoading = false;
        if (this.selected) {
          const current = sections.find((section) => section.id === this.selected?.id);
          if (current) this.selectSection(current);
        }
      },
      error: (error: unknown) => {
        this.sectionsLoading = false;
        if (this.statusOf(error) === 401) {
          this.authenticated = false;
          this.errorMessage = 'Your session expired. Please sign in again.';
        } else {
          this.setNotice(getErrorMessage(error, 'Could not load website sections.'), true);
        }
      }
    });
  }

  loadAdminUsers(): void {
    this.usersLoading = true;
    this.api.getAdminUsers().subscribe({
      next: (users) => {
        this.adminUsers = users;
        this.usersLoading = false;
      },
      error: (error: unknown) => {
        this.usersLoading = false;
        if (this.statusOf(error) === 401) {
          this.authenticated = false;
          this.errorMessage = 'Your session expired. Please sign in again.';
        } else {
          this.setUsersNotice(getErrorMessage(error, 'Could not load dashboard users.'), true);
        }
      }
    });
  }

  addAdminUser(): void {
    if (this.userSaving) return;
    this.userSaving = true;
    this.usersNotice = '';
    this.api.createAdminUser(this.newUsername, this.newPassword).subscribe({
      next: (user) => {
        this.newUsername = '';
        this.newPassword = '';
        this.userSaving = false;
        this.setUsersNotice(`Dashboard access added for ${user.username}. Share the password privately.`);
        this.loadAdminUsers();
      },
      error: (error: unknown) => {
        this.userSaving = false;
        if (this.statusOf(error) === 401) {
          this.authenticated = false;
          this.errorMessage = 'Your session expired. Please sign in again.';
        } else {
          this.setUsersNotice(getErrorMessage(error, 'Could not add that dashboard user.'), true);
        }
      }
    });
  }

  removeAdminUser(user: AdminUser): void {
    if (this.userSaving || !window.confirm(`Remove dashboard access for "${user.username}"? Their active sessions will be signed out.`)) return;
    this.userSaving = true;
    this.usersNotice = '';
    this.api.deleteAdminUser(user.username).subscribe({
      next: () => {
        this.adminUsers = this.adminUsers.filter((entry) => entry.username !== user.username);
        if (this.passwordResetUsername === user.username) this.cancelPasswordReset();
        if (this.resetPasswordResult?.username === user.username) this.dismissResetPasswordResult();
        this.userSaving = false;
        this.setUsersNotice(`Dashboard access removed for ${user.username}.`);
      },
      error: (error: unknown) => {
        this.userSaving = false;
        if (this.statusOf(error) === 401) {
          this.authenticated = false;
          this.errorMessage = 'Your session expired. Please sign in again.';
        } else {
          this.setUsersNotice(getErrorMessage(error, 'Could not remove that dashboard user.'), true);
        }
      }
    });
  }

  startPasswordReset(user: AdminUser): void {
    this.passwordResetUsername = user.username;
    this.passwordResetValue = '';
    this.resetPasswordResult = null;
    this.usersNotice = '';
  }

  cancelPasswordReset(): void {
    this.passwordResetUsername = null;
    this.passwordResetValue = '';
  }

  resetAdminUserPassword(user: AdminUser): void {
    if (this.userSaving || this.passwordResetUsername !== user.username) return;
    this.userSaving = true;
    this.usersNotice = '';
    this.api.resetAdminUserPassword(user.username, this.passwordResetValue).subscribe({
      next: () => {
        this.resetPasswordResult = { username: user.username, password: this.passwordResetValue };
        this.cancelPasswordReset();
        this.userSaving = false;
        this.setUsersNotice(`Password reset for ${user.username}. Their active sessions were signed out.`);
      },
      error: (error: unknown) => {
        this.userSaving = false;
        if (this.statusOf(error) === 401) {
          this.authenticated = false;
          this.errorMessage = 'Your session expired. Please sign in again.';
        } else {
          this.setUsersNotice(getErrorMessage(error, 'Could not reset that dashboard user’s password.'), true);
        }
      }
    });
  }

  dismissResetPasswordResult(): void {
    this.resetPasswordResult = null;
  }

  selectSection(section: SiteSection): void {
    this.selected = section;
    this.draft = structuredClone(section);
    this.contentJson = JSON.stringify(this.draft.content, null, 2);
    this.notice = '';
  }

  addSection(): void {
    const id = `new-section-${Date.now()}`;
    const section: SiteSection = {
      id,
      title: 'New section',
      eyebrow: 'New section',
      description: 'Add a short introduction for this section.',
      kind: 'cards',
      content: { items: [{ title: 'New item', description: 'Add your content here.', icon: '✨' }] },
      sortOrder: this.sections.length ? Math.max(...this.sections.map((entry) => entry.sortOrder)) + 1 : 0,
      published: true
    };
    this.saving = true;
    this.api.createSection(section).subscribe({
      next: (saved) => {
        this.sections = [...this.sections, saved].sort((a, b) => a.sortOrder - b.sortOrder);
        this.selectSection(saved);
        this.saving = false;
        this.setNotice('Section added. Edit its details and save your changes.');
      },
      error: (error: unknown) => {
        this.saving = false;
        this.setNotice(getErrorMessage(error, 'Could not add that section.'), true);
      }
    });
  }

  duplicateSection(): void {
    if (!this.selected || this.saving) return;
    const source = this.selected;
    const sortOrder = this.sections.length ? Math.max(...this.sections.map((entry) => entry.sortOrder)) + 1 : 0;
    if (sortOrder > 10_000) {
      this.setNotice('The section order limit has been reached. Adjust the existing section order before duplicating.', true);
      return;
    }

    const baseId = `${source.id.slice(0, 75)}-copy`;
    let id = baseId;
    let suffix = 2;
    while (this.sections.some((section) => section.id === id)) {
      const suffixText = `-${suffix}`;
      id = `${baseId.slice(0, 80 - suffixText.length)}${suffixText}`;
      suffix += 1;
    }

    const duplicate: SiteSection = {
      ...structuredClone(source),
      id,
      title: `${source.title.slice(0, 153)} (Copy)`,
      sortOrder
    };
    this.saving = true;
    this.api.createSection(duplicate).subscribe({
      next: (saved) => {
        this.sections = [...this.sections, saved].sort((a, b) => a.sortOrder - b.sortOrder);
        this.selectSection(saved);
        this.saving = false;
        this.setNotice('Section duplicated. Update its content and save your changes.');
      },
      error: (error: unknown) => {
        this.saving = false;
        this.setNotice(getErrorMessage(error, 'Could not duplicate this section.'), true);
      }
    });
  }

  saveSection(): void {
    if (!this.draft || this.saving) return;
    let content: SectionContent;
    try {
      const parsed: unknown = JSON.parse(this.contentJson);
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        this.setNotice('Section content must be a JSON object.', true);
        return;
      }
      content = parsed as SectionContent;
    } catch (error) {
      this.setNotice(`Invalid JSON: ${getErrorMessage(error, 'Check the content for syntax errors.')}`, true);
      return;
    }

    const sectionToSave = { ...this.draft, content };
    this.saving = true;
    this.api.updateSection(sectionToSave).subscribe({
      next: (saved) => {
        this.sections = this.sections.map((section) => section.id === saved.id ? saved : section).sort((a, b) => a.sortOrder - b.sortOrder);
        this.selectSection(saved);
        this.saving = false;
        this.setNotice('Changes saved and published to the website.');
      },
      error: (error: unknown) => {
        this.saving = false;
        this.setNotice(getErrorMessage(error, 'Could not save this section.'), true);
      }
    });
  }

  deleteSection(): void {
    if (!this.selected || this.saving) return;
    if (!window.confirm(`Permanently delete "${this.selected.title}"? This removes it from the public website.`)) return;
    const id = this.selected.id;
    this.saving = true;
    this.api.deleteSection(id).subscribe({
      next: () => {
        this.sections = this.sections.filter((section) => section.id !== id);
        this.selected = null;
        this.draft = null;
        this.contentJson = '';
        this.saving = false;
        this.setNotice('Section deleted.');
      },
      error: (error: unknown) => {
        this.saving = false;
        this.setNotice(getErrorMessage(error, 'Could not delete this section.'), true);
      }
    });
  }

  resetDraft(): void {
    if (this.selected) this.selectSection(this.selected);
  }

  logout(): void {
    this.api.logout().subscribe({
      next: () => {
        this.authenticated = false;
        this.currentUsername = '';
        this.isOwner = false;
        this.adminUsers = [];
        this.cancelPasswordReset();
        this.dismissResetPasswordResult();
        this.sections = [];
        this.selected = null;
      },
      error: (error: unknown) => this.setNotice(getErrorMessage(error, 'Could not sign out. Please try again.'), true)
    });
  }

  private statusOf(error: unknown): number {
    return typeof error === 'object' && error !== null && 'status' in error && typeof error.status === 'number' ? error.status : 0;
  }

  private setNotice(message: string, isError = false): void {
    this.notice = message;
    this.noticeIsError = isError;
  }

  private setUsersNotice(message: string, isError = false): void {
    this.usersNotice = message;
    this.usersNoticeIsError = isError;
  }
}
