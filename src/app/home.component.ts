import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CmsApiService, getErrorMessage } from './cms-api.service';
import { appConfig } from './app-config';
import defaultSections from './default-sections.json';
import { ContentItem, HeroSlide, SiteSection } from './models';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div *ngIf="loading" class="grid min-h-screen place-items-center bg-slate-950 text-white">
      <div class="text-center"><div class="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-blue-400"></div><p class="text-sm text-slate-300">Loading MFD Solutions…</p></div>
    </div>
    <main *ngIf="!loading && loadError" class="grid min-h-screen place-items-center bg-slate-950 px-6 text-white">
      <div class="max-w-lg text-center"><div class="mb-5 text-4xl">⚠️</div><h1 class="text-2xl font-bold">The website couldn’t be loaded</h1><p class="mt-3 text-slate-300">{{ loadError }}</p><button class="mt-7 rounded-xl bg-blue-500 px-6 py-3 font-semibold hover:bg-blue-400" (click)="load()">Try again</button></div>
    </main>
    <ng-container *ngIf="!loading && !loadError">
      <div class="fixed left-0 top-0 z-[60] h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-violet-500 transition-[width]" [style.width.%]="scrollProgress"></div>
      <header class="site-header sticky top-0 z-50 border-b border-slate-200/70 bg-white/90 shadow-sm backdrop-blur-xl" [class.header-scrolled]="headerScrolled">
        <nav class="site-nav mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
          <a href="#home" class="site-logo group flex items-center gap-3 no-underline">
            <span class="site-logo-icon grid h-12 w-12 place-items-center rounded-[14px] bg-gradient-to-br from-blue-500 via-violet-500 to-cyan-400 text-sm font-black text-white shadow-glow transition-transform">MFD</span>
            <span class="flex flex-col leading-tight"><strong class="text-base font-extrabold tracking-tight text-ink">MFD Solutions</strong><span class="mt-1 text-[11px] font-semibold uppercase tracking-[1.5px] text-slate-500">Design & Development</span></span>
          </a>
          <ul class="site-nav-menu" [class.menu-open]="menuOpen">
            <li *ngFor="let link of navigation"><a class="site-nav-link" [class.nav-link-active]="activeNavId === link.id" [attr.aria-current]="activeNavId === link.id ? 'location' : null" [href]="'#' + link.id" (click)="navigateToSection($event, link.id)">{{ link.label }}</a></li>
            <li><a href="#contact" (click)="menuOpen = false" class="site-nav-cta">Get a Quote <span aria-hidden="true">→</span></a></li>
          </ul>
          <button type="button" class="menu-toggle min-[721px]:hidden" (click)="menuOpen = !menuOpen" [attr.aria-expanded]="menuOpen" aria-label="Toggle menu">☰</button>
        </nav>
      </header>

      <main [class.static-site]="staticSite">
      <ng-container *ngFor="let section of sections">
        <section *ngIf="section.kind === 'hero'" [id]="section.id" class="hero-carousel relative isolate h-[92vh] min-h-[640px] overflow-hidden bg-slate-950 text-white max-[900px]:h-auto max-[900px]:min-h-[700px]">
          <ng-container *ngIf="section.content.slides?.length">
            <ng-container *ngFor="let slide of section.content.slides; let i = index">
              <div *ngIf="i === activeSlide" class="hero-slide absolute inset-0" [ngClass]="heroAnimation(i)">
                <img [src]="slide.image" alt="" crossorigin="anonymous" referrerpolicy="no-referrer" class="hero-backdrop-image h-full w-full object-cover opacity-35">
                <div class="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-blue-950/45"></div>
                <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_75%_25%,rgba(59,130,246,.35),transparent_35%)]"></div>
                <div class="hero-slide-content absolute inset-0 z-10 mx-auto grid min-h-full max-w-7xl items-center gap-10 px-6 py-20 lg:grid-cols-[1.25fr_.75fr] lg:px-8">
                  <div class="hero-copy max-w-3xl">
                    <span class="inline-flex items-center gap-2 rounded-full border border-blue-300/25 bg-blue-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[.16em] text-blue-200"><span class="h-2 w-2 animate-pulse rounded-full bg-cyan-300"></span>{{ slide.badge }}</span>
                    <h1 class="mt-7 text-4xl font-black leading-[1.08] tracking-[-.045em] sm:text-5xl lg:text-7xl">{{ slide.title }} <span class="bg-gradient-to-r from-blue-300 via-cyan-300 to-violet-300 bg-clip-text text-transparent">{{ slide.accent }}</span></h1>
                    <p class="mt-6 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">{{ slide.description }}</p>
                    <div class="mt-9 flex flex-wrap gap-3">
                      <a href="#contact" class="rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 px-6 py-3.5 font-bold text-white shadow-glow transition hover:-translate-y-1">{{ slide.primary }} <span class="ml-1">→</span></a>
                      <a href="#services" class="rounded-xl border border-white/25 bg-white/5 px-6 py-3.5 font-semibold text-white backdrop-blur transition hover:border-blue-300/70 hover:bg-blue-400/10">{{ slide.secondary }}</a>
                    </div>
                  </div>
                  <aside class="hero-stat-card hidden rounded-3xl border border-white/15 bg-slate-950/50 p-7 shadow-2xl backdrop-blur-xl lg:block">
                    <p class="text-xs font-bold uppercase tracking-[.2em] text-blue-300">Why work with me</p>
                    <div *ngFor="let stat of slide.stats" class="flex items-center justify-between gap-5 border-b border-white/10 py-5 last:border-0">
                      <span class="text-sm text-slate-300">{{ stat.title }}</span><strong class="text-right text-sm font-bold text-white">{{ stat.value }}</strong>
                    </div>
                  </aside>
                </div>
              </div>
            </ng-container>
          </ng-container>
          <div class="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3">
            <button type="button" (click)="moveSlide(-1, section)" class="grid h-10 w-10 place-items-center rounded-full border border-white/25 bg-white/10 text-xl backdrop-blur transition hover:bg-white/20" aria-label="Previous slide">‹</button>
            <button *ngFor="let slide of section.content.slides; let i = index" type="button" (click)="activeSlide = i" class="h-2.5 rounded-full transition-all" [class]="i === activeSlide ? 'w-8 bg-cyan-300' : 'w-2.5 bg-white/45'" [attr.aria-label]="'Show slide ' + (i + 1)"></button>
            <button type="button" (click)="moveSlide(1, section)" class="grid h-10 w-10 place-items-center rounded-full border border-white/25 bg-white/10 text-xl backdrop-blur transition hover:bg-white/20" aria-label="Next slide">›</button>
          </div>
          <span class="absolute bottom-10 right-8 hidden text-xs font-semibold tracking-[.2em] text-white/50 lg:block">SCROLL TO EXPLORE ↓</span>
        </section>

        <section *ngIf="section.kind !== 'hero'" [id]="section.id" [class.site-content-section]="true" class="relative overflow-hidden px-5 py-20 sm:px-8 sm:py-24"
          [ngClass]="sectionClasses(section.id)">
          <div class="pointer-events-none absolute -right-36 -top-32 h-96 w-96 rounded-full bg-blue-400/10 blur-3xl"></div>
          <div class="relative mx-auto max-w-7xl">
            <div *ngIf="section.kind !== 'about'" class="reveal-on-scroll mx-auto mb-12 max-w-3xl text-center sm:mb-16">
              <span class="inline-flex rounded-full border border-blue-500/15 bg-blue-500/5 px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-[.19em] text-blue-600">{{ section.eyebrow }}</span>
              <h2 class="mt-5 text-3xl font-black tracking-[-.035em] text-ink sm:text-4xl lg:text-5xl" [class.text-white]="isDark(section.id)">{{ section.title }}</h2>
              <p *ngIf="section.description" class="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-500" [class.text-slate-300]="isDark(section.id)">{{ section.description }}</p>
            </div>

            <ng-container [ngSwitch]="section.kind">
              <div *ngSwitchCase="'about'" class="grid items-center gap-10 lg:grid-cols-[.8fr_1.2fr] lg:gap-16">
                <div class="about-image-wrap group relative mx-auto w-full max-w-md reveal-on-scroll">
                  <div class="absolute -left-5 -top-5 h-32 w-32 rounded-3xl bg-gradient-to-br from-blue-500 to-violet-500 opacity-20 blur-2xl"></div>
                  <img [src]="imageOf(section, 'image')" [alt]="imageAltOf(section)" crossorigin="anonymous" referrerpolicy="no-referrer" class="about-profile-image relative aspect-[4/5] w-full rounded-[1.5rem] object-cover shadow-card">
                  <div class="about-image-overlay absolute inset-0 flex items-end rounded-[1.5rem] p-7 text-white"><div><strong class="block text-xl font-bold">Mohammad Farooq</strong><span class="mt-1 block text-sm text-slate-300">{{ textOf(section, 'role') }}</span></div></div>
                  <span class="about-image-badge absolute right-4 top-5 z-10 -rotate-3 rounded-xl bg-gradient-to-br from-yellow-300 to-amber-400 px-4 py-2.5 text-sm font-extrabold text-ink shadow-lg">12+ Years Exp.</span>
                </div>
                <div class="about-copy reveal-on-scroll">
                  <span class="mb-4 inline-flex rounded-full border border-blue-500/15 bg-blue-500/5 px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-[.19em] text-blue-600">{{ section.eyebrow }}</span>
                  <h2 class="mb-5 text-3xl font-black leading-tight tracking-[-.035em] text-ink sm:text-4xl"><span class="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">{{ section.title }}</span></h2>
                  <p class="mb-4 leading-7 text-slate-600">{{ section.description }}</p>
                  <p *ngFor="let paragraph of paragraphsOf(section)" class="mb-4 leading-7 text-slate-600">{{ paragraph }}</p>
                  <div class="mt-7 grid gap-3 sm:grid-cols-2">
                      <div *ngFor="let item of section.content.items?.slice(0, 4)" class="motion-card reveal-on-scroll flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3.5 shadow-sm"><span class="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 text-white">{{ item.icon }}</span><span class="text-sm font-semibold text-slate-700">{{ item.title }}</span></div>
                  </div>
                  <ul class="mt-6 space-y-3">
                    <li *ngFor="let item of section.content.items?.slice(4)" class="flex items-start gap-3 text-sm leading-6 text-slate-700"><span class="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 text-xs font-black text-white">{{ item.icon }}</span>{{ item.title }}</li>
                  </ul>
                  <div class="mt-7 flex flex-wrap gap-2"><span *ngFor="let tag of tagsOf(section)" class="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-600 hover:text-white">{{ tag }}</span></div>
                </div>
              </div>

              <div *ngSwitchCase="'stats'" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <article *ngFor="let item of section.content.items" class="rounded-2xl border border-white/10 bg-white/[.06] p-8 text-center backdrop-blur transition hover:-translate-y-2 hover:bg-blue-400/10"><strong class="block bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-5xl font-black text-transparent">{{ item.value }}</strong><span class="mt-3 block text-xs font-semibold uppercase tracking-[.16em] text-slate-300">{{ item.title }}</span></article>
              </div>

              <div *ngSwitchCase="'details'" class="space-y-7">
                <article *ngFor="let item of section.content.items; let i = index" class="grid overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm md:grid-cols-2">
                  <div class="detail-image-wrap group relative min-h-64" [ngClass]="i % 2 === 1 ? 'md:order-2' : ''"><img [src]="item.image" [alt]="item.label || item.title" crossorigin="anonymous" referrerpolicy="no-referrer" class="detail-image absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110 motion-reduce:transition-none"><span class="absolute bottom-4 left-4 rounded-lg bg-slate-950/80 px-3 py-1.5 text-xs font-bold text-white backdrop-blur transition duration-300 group-hover:bg-fuchsia-700">{{ item.label }}</span></div>
                  <div class="p-7 sm:p-10"><span class="text-3xl">{{ item.icon }}</span><h3 class="mt-3 text-2xl font-extrabold tracking-tight">{{ item.title }}</h3><p class="mt-3 leading-7 text-slate-500">{{ item.description }}</p><ul class="mt-5 space-y-2.5"><li *ngFor="let feature of item.features" class="flex gap-2 text-sm text-slate-700"><span class="font-bold text-blue-500">✓</span>{{ feature }}</li></ul></div>
                </article>
              </div>

              <div *ngSwitchCase="'technologies'" class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                <article *ngFor="let item of section.content.items" class="rounded-2xl border border-slate-100 bg-white p-5 text-center shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-glow"><span class="block text-3xl">{{ item.icon }}</span><h3 class="mt-2 text-sm font-bold">{{ item.title }}</h3></article>
              </div>

              <div *ngSwitchCase="'process'" class="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <article *ngFor="let item of section.content.items; let i = index" class="relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-7 shadow-sm transition hover:-translate-y-2 hover:shadow-card"><span class="absolute -right-1 -top-6 text-8xl font-black text-blue-500/[.08]">0{{ i + 1 }}</span><span class="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-500 text-2xl text-white shadow-glow">{{ item.icon }}</span><h3 class="relative mt-5 text-lg font-bold">{{ item.title }}</h3><p class="relative mt-2 text-sm leading-6 text-slate-500">{{ item.description }}</p></article>
              </div>

              <div *ngSwitchCase="'portfolio'" class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <a *ngFor="let item of section.content.items" [href]="item.href || '#contact'" target="_blank" rel="noopener noreferrer" class="motion-card reveal-on-scroll group relative h-72 overflow-hidden rounded-2xl bg-slate-900 shadow-card"><img [src]="item.image" [alt]="item.title" crossorigin="anonymous" referrerpolicy="no-referrer" class="h-full w-full object-cover transition duration-700 group-hover:scale-110"><div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/25 to-transparent"></div><div class="absolute inset-x-0 bottom-0 p-6 text-white"><span class="rounded-full border border-yellow-300/40 bg-yellow-300/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-yellow-200">{{ item.label }}</span><h3 class="mt-3 text-lg font-bold">{{ item.title }}</h3><p class="mt-1 text-sm text-slate-300">{{ item.description }}</p></div></a>
              </div>

              <div *ngSwitchCase="'guarantee'" class="grid items-center gap-7 lg:grid-cols-[1.15fr_.85fr]">
                <ul class="space-y-4"><li *ngFor="let item of section.content.items" class="flex items-center gap-3 text-sm font-medium text-slate-100"><span class="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-500 text-white">{{ item.icon }}</span>{{ item.title }}</li></ul>
                <div class="rounded-3xl border border-white/15 bg-white/[.07] p-8 text-center shadow-2xl backdrop-blur"><div class="mx-auto grid h-24 w-24 place-items-center rounded-full border border-emerald-300/40 bg-emerald-400/15 text-5xl">🛡️</div><h3 class="mt-6 text-xl font-extrabold text-white">{{ textOf(section, 'cardTitle') }}</h3><p class="mt-3 leading-7 text-slate-300">{{ textOf(section, 'cardDescription') }}</p></div>
              </div>

              <div *ngSwitchCase="'pricing'" class="grid items-stretch gap-5 lg:grid-cols-3">
                <article *ngFor="let item of section.content.items" class="relative flex flex-col rounded-3xl border p-7 shadow-sm transition hover:-translate-y-2 hover:shadow-card" [ngClass]="item['featured'] ? 'border-amber-200 bg-gradient-to-br from-amber-300 via-orange-300 to-rose-300 text-slate-950 ring-2 ring-amber-200/60' : 'border-fuchsia-300/20 bg-gradient-to-br from-slate-900 to-fuchsia-950 text-white hover:border-fuchsia-300/60'">
                  <span *ngIf="item['featured']" class="absolute right-4 top-4 rounded-full bg-white/80 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-rose-800">Most Popular</span>
                  <span class="text-3xl">{{ item.icon }}</span><h3 class="mt-4 text-xl font-extrabold">{{ item.title }}</h3><p class="mt-1 text-sm" [ngClass]="item['featured'] ? 'text-slate-700' : 'text-fuchsia-200'">{{ item.label }}</p><strong class="mt-5 text-4xl font-black" [ngClass]="item['featured'] ? 'text-rose-800' : 'text-amber-300'">{{ item.price }}</strong><p class="mt-2 text-sm" [ngClass]="item['featured'] ? 'text-slate-700' : 'text-slate-300'">{{ item.description }}</p>
                  <ul class="my-6 flex-1 space-y-3 border-t pt-5" [ngClass]="item['featured'] ? 'border-slate-200' : 'border-white/10'"><li *ngFor="let feature of item.features" class="flex gap-2 text-sm" [ngClass]="item['featured'] ? 'text-slate-600' : 'text-slate-300'"><span class="text-emerald-500">✓</span>{{ feature }}</li></ul><a href="#contact" class="rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-3 text-center text-sm font-bold text-white shadow-glow transition hover:opacity-90">Get Started <span class="ml-1">→</span></a>
                </article>
              </div>

              <div *ngSwitchCase="'testimonials'" class="testimonials-carousel">
                <div #testimonialViewport id="testimonialsViewport" class="testimonials-viewport" (mouseenter)="pauseTestimonials()" (mouseleave)="resumeTestimonials()" (focusin)="pauseTestimonials()" (focusout)="resumeTestimonials()" (scroll)="updateTestimonialIndex($event)" aria-label="Client testimonials">
                  <div class="testimonials-track">
                    <article *ngFor="let item of section.content.items" class="testimonial-card rounded-2xl border border-white/10 bg-white/[.06] p-6 backdrop-blur"><p class="text-amber-300">★★★★★</p><blockquote class="mt-4 min-h-24 text-sm leading-7 text-slate-200">{{ item.title }}</blockquote><div class="mt-5 flex items-center gap-3 border-t border-white/10 pt-4"><img [src]="item['image']" [alt]="item.person" crossorigin="anonymous" referrerpolicy="no-referrer" class="h-11 w-11 rounded-full object-cover"><div><strong class="block text-sm text-white">{{ item.person }}</strong><span class="text-xs text-slate-400">{{ item.role }}</span></div></div></article>
                  </div>
                </div>
                <div class="testimonials-nav">
                  <button type="button" class="testimonial-arrow" (click)="moveTestimonial(-1)" [disabled]="testimonialIndex === 0" aria-label="Previous testimonial">‹</button>
                  <div class="testimonial-dots" role="group" aria-label="Choose testimonial slide">
                    <button *ngFor="let page of testimonialPages; let i = index" type="button" class="testimonial-dot" [class.active]="i === testimonialIndex" [attr.aria-label]="'Show testimonial slide ' + (i + 1)" [attr.aria-current]="i === testimonialIndex ? 'true' : null" (click)="goToTestimonial(i)"></button>
                  </div>
                  <button type="button" class="testimonial-arrow" (click)="moveTestimonial(1)" [disabled]="testimonialIndex >= testimonialPages.length - 1" aria-label="Next testimonial">›</button>
                </div>
              </div>

              <div *ngSwitchCase="'faq'" class="mx-auto max-w-3xl space-y-3">
                <article *ngFor="let item of section.content.items; let i = index" class="overflow-hidden rounded-2xl border bg-white transition" [class.border-blue-400]="openFaq === i" [class.border-slate-100]="openFaq !== i"><button type="button" class="flex w-full items-center justify-between gap-4 px-5 py-5 text-left font-semibold text-ink sm:px-7" (click)="openFaq = openFaq === i ? -1 : i"><span>{{ item.title }}</span><span class="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-blue-500 to-violet-500 text-lg text-white">{{ openFaq === i ? '−' : '+' }}</span></button><p *ngIf="openFaq === i" class="px-5 pb-5 leading-7 text-slate-500 sm:px-7">{{ item.answer }}</p></article>
              </div>

              <div *ngSwitchCase="'contact'" class="grid items-center gap-10 lg:grid-cols-2">
                <div><h3 class="text-2xl font-bold">Let’s talk about your next idea.</h3><p class="mt-3 leading-7 text-slate-300">Share a few details and we’ll get back to you within one business day.</p><a *ngFor="let item of section.content.items" [href]="item.href || null" class="reveal-on-scroll mt-4 flex items-center gap-4 rounded-xl border border-white/10 bg-white/[.05] p-4 text-white transition hover:translate-x-1 hover:bg-blue-500/15"><span class="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 text-xl">{{ item.icon }}</span><span><strong class="block text-xs uppercase tracking-wider text-slate-400">{{ item.title }}</strong><span class="mt-1 block text-sm">{{ item.value }}</span></span></a></div>
                <form class="reveal-on-scroll rounded-3xl border border-white/15 bg-white/[.06] p-6 shadow-2xl backdrop-blur sm:p-8" (ngSubmit)="submitContact()"><h3 class="mb-5 text-xl font-bold text-white">Send a message</h3><label class="mb-4 block text-sm font-medium text-slate-200">Your name<input name="name" autocomplete="name" [(ngModel)]="contact.name" required minlength="2" maxlength="120" class="mt-2 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-blue-400" placeholder="Jane Smith"></label><label class="mb-4 block text-sm font-medium text-slate-200">Email address<input name="email" type="email" autocomplete="email" [(ngModel)]="contact.email" required maxlength="254" class="mt-2 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-blue-400" placeholder="jane@company.com"></label><label class="mb-5 block text-sm font-medium text-slate-200">Project details<textarea name="message" autocomplete="off" [(ngModel)]="contact.message" required minlength="10" maxlength="5000" rows="4" class="mt-2 w-full resize-y rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-blue-400" placeholder="Tell me about what you need…"></textarea></label><button [disabled]="contactSending" class="w-full rounded-xl bg-gradient-to-r from-blue-500 via-violet-500 to-cyan-500 px-5 py-3.5 font-bold text-white shadow-glow disabled:opacity-50">{{ contactSending ? 'Sending…' : 'Send your message →' }}</button><p *ngIf="contactStatus" class="mt-4 text-sm" [class.text-emerald-300]="!contactError" [class.text-rose-300]="contactError" role="status">{{ contactStatus }}</p></form>
              </div>

              <div *ngSwitchCase="'newsletter'" class="reveal-on-scroll mx-auto max-w-4xl rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-violet-50 p-7 text-center shadow-card sm:p-12"><span class="text-3xl">✉️</span><h3 class="mt-3 text-2xl font-bold">{{ section.title }}</h3><p class="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">{{ section.description }}</p><form (ngSubmit)="subscribe()" class="mx-auto mt-6 flex max-w-xl flex-col gap-3 sm:flex-row"><input type="email" name="subscriberEmail" autocomplete="email" [(ngModel)]="subscriberEmail" required maxlength="254" placeholder="Your email address" class="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-blue-400"><button [disabled]="newsletterSending" class="rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-6 py-3 font-bold text-white disabled:opacity-50">{{ newsletterSending ? 'Joining…' : 'Subscribe' }}</button></form><p *ngIf="newsletterStatus" class="mt-3 text-sm" [class.text-emerald-700]="!newsletterError" [class.text-rose-600]="newsletterError" role="status">{{ newsletterStatus }}</p></div>

              <div *ngSwitchDefault class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" [class.lg:grid-cols-4]="section.id === 'global-presence'">
                <article *ngFor="let item of section.content.items" class="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-card"><span class="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 text-2xl text-white shadow-glow">{{ item.icon || '✦' }}</span><h3 class="mt-5 text-lg font-bold">{{ item.title }}</h3><p *ngIf="item.description" class="mt-2 text-sm leading-6 text-slate-500">{{ item.description }}</p></article>
              </div>
            </ng-container>
          </div>
        </section>
      </ng-container>
      </main>

      <footer class="relative overflow-hidden bg-[#060a14] px-6 pb-8 pt-16 text-slate-400 sm:px-8">
        <div class="mx-auto mb-10 grid max-w-7xl gap-10 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1.2fr]">
          <div>
            <div class="mb-4 flex items-center gap-3"><span class="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 text-sm font-black text-white">MFD</span><span><strong class="block text-base font-extrabold text-white">MFD Solutions</strong><small class="text-[10px] uppercase tracking-[.15em]">Design &amp; Development</small></span></div>
            <p class="mb-4 text-sm leading-7">MFD Solutions delivers premium web, mobile, and cloud services worldwide. 12+ years of experience in Website Development and Graphic Design.</p>
            <div class="mt-5 flex gap-3">
              <a href="https://www.behance.net/Farooq127" target="_blank" rel="noopener noreferrer" title="Behance" class="grid h-10 w-10 place-items-center rounded-xl bg-white/[.06] text-sm font-bold text-slate-300 transition hover:-translate-y-1 hover:bg-blue-600 hover:text-white">Be</a>
              <a href="https://wa.me/966570849844" target="_blank" rel="noopener noreferrer" title="WhatsApp" class="grid h-10 w-10 place-items-center rounded-xl bg-white/[.06] text-sm font-bold text-slate-300 transition hover:-translate-y-1 hover:bg-emerald-600 hover:text-white">Wa</a>
              <a href="https://sites.google.com/view/mohammadfarooq" target="_blank" rel="noopener noreferrer" title="Website" class="grid h-10 w-10 place-items-center rounded-xl bg-white/[.06] text-sm font-bold text-slate-300 transition hover:-translate-y-1 hover:bg-blue-600 hover:text-white">🌐</a>
              <a href="mailto:mohammadfarooq127@gmail.com" title="Email" class="grid h-10 w-10 place-items-center rounded-xl bg-white/[.06] text-sm font-bold text-slate-300 transition hover:-translate-y-1 hover:bg-blue-600 hover:text-white">@</a>
            </div>
          </div>
          <div><h3 class="mb-4 font-bold text-white">Services</h3><ul class="grid gap-2 text-sm">
            <li><a href="#services" class="transition hover:text-blue-300">Web Designing</a></li><li><a href="#services" class="transition hover:text-blue-300">Web Development</a></li><li><a href="#services" class="transition hover:text-blue-300">Mobile App Development</a></li><li><a href="#services" class="transition hover:text-blue-300">CMS Development</a></li><li><a href="#services" class="transition hover:text-blue-300">E-Commerce</a></li><li><a href="#services" class="transition hover:text-blue-300">Graphic Design</a></li><li><a href="#services" class="transition hover:text-blue-300">Prototyping</a></li><li><a href="#services" class="transition hover:text-blue-300">SEO/SMO Services</a></li>
          </ul></div>
          <div><h3 class="mb-4 font-bold text-white">Quick Links</h3><ul class="grid gap-2 text-sm">
            <li><a href="#home" class="transition hover:text-blue-300">Home</a></li><li><a href="#about" class="transition hover:text-blue-300">About Myself</a></li><li><a href="#services" class="transition hover:text-blue-300">Services</a></li><li><a href="#more-details" class="transition hover:text-blue-300">More Details</a></li><li><a href="#why-us" class="transition hover:text-blue-300">Why Us</a></li><li><a href="#portfolio" class="transition hover:text-blue-300">Latest Work</a></li><li><a href="#guarantee" class="transition hover:text-blue-300">Our Guarantee</a></li><li><a href="#pricing" class="transition hover:text-blue-300">Pricing</a></li><li><a href="#faq" class="transition hover:text-blue-300">FAQ</a></li>
          </ul></div>
          <div><h3 class="mb-4 font-bold text-white">Get In Touch</h3><div class="grid gap-3 text-sm leading-6">
            <a href="tel:+966570849844" class="transition hover:text-blue-300">📞 <span>+966 570 849 844</span></a>
            <a href="https://wa.me/966570849844" target="_blank" rel="noopener noreferrer" class="transition hover:text-blue-300">💬 <span>WhatsApp: +966 570 849 844</span></a>
            <a href="mailto:mohammadfarooq127@gmail.com" class="transition hover:text-blue-300">✉️ <span>mohammadfarooq127@gmail.com</span></a>
            <a href="https://sites.google.com/view/mohammadfarooq" target="_blank" rel="noopener noreferrer" class="break-words transition hover:text-blue-300">🌐 <span>sites.google.com/view/mohammadfarooq</span></a>
            <a href="https://www.behance.net/Farooq127" target="_blank" rel="noopener noreferrer" class="transition hover:text-blue-300">🎨 <span>behance.net/Farooq127</span></a>
            <span>📍 Riyadh, Saudi Arabia</span>
          </div></div>
        </div>
        <div class="mx-auto flex max-w-7xl flex-col justify-between gap-3 border-t border-white/10 pt-6 text-center text-xs sm:flex-row sm:text-left"><p>© {{ currentYear }} <a href="https://sites.google.com/view/mohammadfarooq" target="_blank" rel="noopener noreferrer" class="text-blue-400 transition hover:text-blue-300">MFD Solutions</a> — Design &amp; Development. All rights reserved. | Riyadh, Saudi Arabia</p><a routerLink="/admin" class="text-slate-500 transition hover:text-blue-300">Admin login</a></div>
      </footer>
      <a href="https://wa.me/966570849844" target="_blank" rel="noopener noreferrer" aria-label="Chat with us on WhatsApp" class="whatsapp-float fixed bottom-6 right-6 z-40 grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-[#25D366] to-[#128C7E] text-white shadow-xl transition hover:scale-110">
        <svg viewBox="0 0 32 32" aria-hidden="true" class="relative z-10 h-8 w-8 fill-current"><path d="M16.04 3C8.87 3 3.04 8.82 3.04 15.99c0 2.29.6 4.53 1.74 6.51L3 29l6.67-1.75a12.94 12.94 0 0 0 6.36 1.62h.01c7.16 0 12.99-5.82 13-12.98A12.91 12.91 0 0 0 25.24 6.7 12.88 12.88 0 0 0 16.04 3zm0 23.66h-.01c-1.93 0-3.83-.52-5.48-1.5l-.39-.23-3.96 1.04 1.06-3.86-.25-.4a10.7 10.7 0 0 1-1.64-5.72c0-5.92 4.82-10.74 10.75-10.74 2.87 0 5.57 1.12 7.6 3.15a10.68 10.68 0 0 1 3.15 7.6c0 5.93-4.82 10.75-10.83 10.66zm5.9-8.05c-.32-.16-1.9-.94-2.2-1.04-.3-.11-.52-.16-.74.16-.22.33-.85 1.05-1.04 1.26-.2.22-.38.25-.7.08-.33-.16-1.37-.5-2.6-1.58-.96-.86-1.6-1.92-1.8-2.25-.19-.32-.02-.5.15-.66.15-.15.33-.38.49-.57.16-.2.22-.33.33-.55.1-.22.05-.41-.03-.57-.08-.16-.74-1.78-1.02-2.43-.27-.64-.54-.55-.74-.56h-.63c-.22 0-.58.08-.88.41-.3.33-1.16 1.13-1.16 2.75 0 1.62 1.19 3.18 1.35 3.4.17.21 2.34 3.58 5.67 5.01.8.35 1.42.56 1.9.71.8.25 1.53.22 2.1.13.65-.1 1.9-.78 2.17-1.54.27-.75.27-1.4.2-1.54-.09-.14-.3-.22-.63-.38z"/></svg>
        <span class="whatsapp-label">Chat with us</span>
      </a>
      <button *ngIf="showTop" type="button" (click)="scrollTop()" aria-label="Back to top" class="fixed bottom-8 right-24 z-40 grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-blue-500 to-violet-500 text-xl text-white shadow-glow transition hover:-translate-y-1">↑</button>
    </ng-container>
  `
})
export class HomeComponent implements OnInit, OnDestroy {
  private readonly api = inject(CmsApiService);
  readonly staticSite = appConfig.githubPages;
  readonly currentYear = new Date().getFullYear();
  navigation: { id: string; label: string }[] = [];
  sections: SiteSection[] = [];
  loading = true;
  loadError = '';
  activeSlide = 0;
  activeNavId = 'home';
  openFaq = 0;
  menuOpen = false;
  headerScrolled = false;
  scrollProgress = 0;
  showTop = false;
  testimonialIndex = 0;
  private testimonialsPerView = 3;
  contactSending = false;
  contactStatus = '';
  contactError = false;
  contact = { name: '', email: '', message: '' };
  newsletterSending = false;
  newsletterStatus = '';
  newsletterError = false;
  subscriberEmail = '';
  private slideTimer?: ReturnType<typeof setInterval>;
  private testimonialTimer?: ReturnType<typeof setInterval>;

  private updateNavigation(): void {
    const links = [
      { id: 'home', label: 'Home' }, { id: 'about', label: 'About' },
      { id: 'services', label: 'Services' }, { id: 'more-details', label: 'More Details' },
      { id: 'why-us', label: 'Why Us' }, { id: 'portfolio', label: 'Work' },
      { id: 'pricing', label: 'Pricing' }, { id: 'faq', label: 'FAQ' }
    ];
    const availableIds = new Set(this.sections.map((section) => section.id));
    const knownIds = new Set(links.map((link) => link.id));
    this.navigation = [
      ...links.filter((link) => availableIds.has(link.id)),
      ...this.sections
        .filter((section) => !knownIds.has(section.id) && section.id !== 'contact' && section.id !== 'newsletter')
        .map((section) => ({ id: section.id, label: section.title }))
    ];
  }

  navigateToSection(event: MouseEvent, id: string): void {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const section = document.getElementById(id);
    if (!section) return;
    event.preventDefault();
    this.activeNavId = id;
    this.menuOpen = false;
    if (window.location.hash !== `#${id}`) window.history.pushState(null, '', `#${id}`);
    section.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
      block: 'start'
    });
  }

  ngOnInit(): void {
    this.load();
    window.addEventListener('scroll', this.onScroll, { passive: true });
    window.addEventListener('resize', this.onResize, { passive: true });
    this.onResize();
    this.slideTimer = setInterval(() => {
      const hero = this.sections.find((section) => section.kind === 'hero');
      if (hero?.content.slides?.length) this.moveSlide(1, hero);
    }, 6500);
    this.resumeTestimonials();
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.onScroll);
    window.removeEventListener('resize', this.onResize);
    if (this.slideTimer) clearInterval(this.slideTimer);
    if (this.testimonialTimer) clearInterval(this.testimonialTimer);
  }

  load(): void {
    this.loading = true;
    this.loadError = '';
    if (this.staticSite) {
      this.sections = defaultSections.map((section) => {
        const image = section.content['image'];
        return typeof image === 'string' && image.startsWith('/')
          ? { ...section, content: { ...section.content, image: new URL(image.slice(1), document.baseURI).toString() } }
          : section;
      });
      this.updateNavigation();
      this.loading = false;
      return;
    }

    this.api.getPublicSections().subscribe({
      next: (sections) => {
        this.sections = sections;
        this.updateNavigation();
        this.loading = false;
      },
      error: (error: unknown) => {
        this.loadError = getErrorMessage(error, 'Could not load website content. Check that the API server is running.');
        this.loading = false;
      }
    });
  }

  moveSlide(offset: number, section: SiteSection): void {
    const length = section.content.slides?.length ?? 0;
    if (length) this.activeSlide = (this.activeSlide + offset + length) % length;
  }

  heroAnimation(index: number): string {
    return ['hero-animation-left', 'hero-animation-right', 'hero-animation-zoom', 'hero-animation-orbit'][index % 4];
  }

  get testimonialPages(): number[] {
    const section = this.sections.find((entry) => entry.kind === 'testimonials');
    const count = section?.content.items?.length ?? 0;
    return Array.from({ length: Math.max(1, count - this.testimonialsPerView + 1) }, (_value, index) => index);
  }

  moveTestimonial(direction: number, wrap = false): void {
    const lastPage = this.testimonialPages.length - 1;
    const nextIndex = this.testimonialIndex + direction;
    if (wrap && nextIndex > lastPage) {
      this.goToTestimonial(0);
      return;
    }
    this.goToTestimonial(Math.max(0, Math.min(lastPage, nextIndex)));
  }

  goToTestimonial(index: number): void {
    this.testimonialIndex = Math.max(0, Math.min(this.testimonialPages.length - 1, index));
    const viewport = document.getElementById('testimonialsViewport');
    const track = viewport?.querySelector<HTMLElement>('.testimonials-track');
    const card = track?.querySelector<HTMLElement>('.testimonial-card');
    if (!viewport || !track || !card) return;
    const gap = Number.parseFloat(getComputedStyle(track).columnGap) || 0;
    viewport.scrollTo({ left: this.testimonialIndex * (card.offsetWidth + gap), behavior: 'smooth' });
  }

  updateTestimonialIndex(event: Event): void {
    const viewport = event.currentTarget;
    if (!(viewport instanceof HTMLElement)) return;
    const card = viewport.querySelector<HTMLElement>('.testimonial-card');
    const track = viewport.querySelector<HTMLElement>('.testimonials-track');
    if (!card || !track) return;
    const gap = Number.parseFloat(getComputedStyle(track).columnGap) || 0;
    const step = card.offsetWidth + gap;
    if (step > 0) this.testimonialIndex = Math.max(0, Math.min(this.testimonialPages.length - 1, Math.round(viewport.scrollLeft / step)));
  }

  pauseTestimonials(): void {
    if (this.testimonialTimer) {
      clearInterval(this.testimonialTimer);
      this.testimonialTimer = undefined;
    }
  }

  resumeTestimonials(): void {
    this.pauseTestimonials();
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    this.testimonialTimer = setInterval(() => this.moveTestimonial(1, true), 5500);
  }

  sectionClasses(id: string): string {
    const classes: Record<string, string> = {
      about: 'bg-gradient-to-b from-white via-violet-50/60 to-white',
      services: 'bg-gradient-to-b from-slate-50 via-blue-50/60 to-white',
      'more-details': 'bg-gradient-to-b from-white to-cyan-50/70',
      'why-us': 'bg-gradient-to-b from-slate-50 to-white',
      'tech-stack': 'bg-gradient-to-b from-white to-blue-50/60',
      stats: 'bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-white',
      process: 'bg-gradient-to-b from-slate-50 to-amber-50/60',
      portfolio: 'bg-gradient-to-b from-white to-cyan-50/70',
      guarantee: 'bg-gradient-to-br from-blue-950 via-violet-950 to-blue-950 text-white',
      'global-presence': 'bg-gradient-to-b from-slate-50 to-white',
      newsletter: 'bg-white',
      pricing: 'bg-gradient-to-br from-rose-950 via-fuchsia-950 to-amber-950 text-white',
      testimonials: 'bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-white',
      faq: 'bg-gradient-to-b from-slate-50 to-sky-50',
      contact: 'bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-white'
    };
    return classes[id] ?? 'bg-white';
  }

  isDark(id: string): boolean {
    return ['stats', 'guarantee', 'pricing', 'testimonials', 'contact'].includes(id);
  }

  textOf(section: SiteSection, key: string): string {
    const value = section.content[key];
    return typeof value === 'string' ? value : '';
  }

  imageOf(section: SiteSection, key: string): string {
    return this.textOf(section, key);
  }

  imageAltOf(section: SiteSection): string {
    return this.textOf(section, 'imageAlt') || section.title;
  }

  paragraphsOf(section: SiteSection): string[] {
    return section.content.paragraphs ?? [];
  }

  tagsOf(section: SiteSection): string[] {
    return section.content.tags ?? [];
  }

  submitContact(): void {
    this.contactSending = true;
    this.contactStatus = '';
    this.api.sendContact(this.contact).subscribe({
      next: (result) => {
        this.contactStatus = result.message;
        this.contactError = false;
        this.contact = { name: '', email: '', message: '' };
        this.contactSending = false;
      },
      error: (error: unknown) => {
        this.contactStatus = getErrorMessage(error, 'Your message could not be sent. Please try again.');
        this.contactError = true;
        this.contactSending = false;
      }
    });
  }

  subscribe(): void {
    this.newsletterSending = true;
    this.newsletterStatus = '';
    this.api.subscribe(this.subscriberEmail).subscribe({
      next: (result) => {
        this.newsletterStatus = result.message;
        this.newsletterError = false;
        this.subscriberEmail = '';
        this.newsletterSending = false;
      },
      error: (error: unknown) => {
        this.newsletterStatus = getErrorMessage(error, 'Subscription failed. Please try again.');
        this.newsletterError = true;
        this.newsletterSending = false;
      }
    });
  }

  scrollTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private readonly onScroll = (): void => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    this.scrollProgress = scrollable > 0 ? Math.min(100, (window.scrollY / scrollable) * 100) : 0;
    this.showTop = window.scrollY > 500;
    this.headerScrolled = window.scrollY > 24;
    const currentSection = this.navigation
      .filter((link) => {
        const element = document.getElementById(link.id);
        return element && element.getBoundingClientRect().top <= 130;
      })
      .at(-1);
    if (currentSection) this.activeNavId = currentSection.id;
  };

  private readonly onResize = (): void => {
    this.testimonialsPerView = window.innerWidth <= 720 ? 1 : window.innerWidth <= 1000 ? 2 : 3;
    const lastPage = this.testimonialPages.length - 1;
    if (this.testimonialIndex > lastPage) this.testimonialIndex = Math.max(0, lastPage);
    this.goToTestimonial(this.testimonialIndex);
  };

}
