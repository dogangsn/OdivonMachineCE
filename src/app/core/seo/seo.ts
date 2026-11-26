import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRouteSnapshot, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

export const SITE_URL = 'https://machinece.odivon.com';
export const SITE_NAME = 'Odivon MachineCE';
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;

export interface SeoData {
  readonly title?: string;
  readonly description?: string;
  /** false ⇒ `noindex,nofollow` (private application screens). */
  readonly index?: boolean;
}

export const DEFAULT_SEO: Required<SeoData> = {
  title: 'Odivon MachineCE | Makine Emniyeti ve CE Uygunluk Platformu',
  description:
    '2006/42/EC ve AB 2023/1230 kapsamında makine envanteri, EN ISO 12100 risk değerlendirmesi, harmonize standart matrisi, teknik dosya ve AT uygunluk beyanlarını tek platformda yönetin.',
  index: true,
};

/** Keeps title, description, canonical, robots and social tags in sync with the active route. */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly router = inject(Router);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  start(): void {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) =>
        this.apply(this.collect(this.router.routerState.snapshot.root), event.urlAfterRedirects),
      );
  }

  apply(seo: SeoData, url: string): void {
    const title = seo.title ?? DEFAULT_SEO.title;
    const description = seo.description ?? DEFAULT_SEO.description;
    const index = seo.index ?? false;
    const path = url.split(/[?#]/)[0] || '/';
    const canonical = `${SITE_URL}${path === '/' ? '/' : path}`;

    this.title.setTitle(title);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({
      name: 'robots',
      content: index ? 'index,follow,max-image-preview:large' : 'noindex,nofollow',
    });
    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:url', content: canonical });
    this.meta.updateTag({ property: 'og:image', content: DEFAULT_IMAGE });
    this.meta.updateTag({ name: 'twitter:title', content: title });
    this.meta.updateTag({ name: 'twitter:description', content: description });
    this.meta.updateTag({ name: 'twitter:image', content: DEFAULT_IMAGE });
    this.setCanonical(canonical);
  }

  /** Adds (or replaces) a JSON-LD block identified by `id`. */
  setJsonLd(id: string, data: unknown): void {
    this.removeJsonLd(id);
    const script = this.document.createElement('script');
    script.type = 'application/ld+json';
    script.id = id;
    script.textContent = JSON.stringify(data);
    this.document.head.appendChild(script);
  }

  removeJsonLd(id: string): void {
    this.document.getElementById(id)?.remove();
  }

  private collect(snapshot: ActivatedRouteSnapshot): SeoData {
    let merged: SeoData = {};
    for (let node: ActivatedRouteSnapshot | null = snapshot; node; node = node.firstChild) {
      const seo = node.data['seo'] as SeoData | undefined;
      if (seo) merged = { ...merged, ...seo };
    }
    return merged;
  }

  private setCanonical(href: string): void {
    let link = this.document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.rel = 'canonical';
      this.document.head.appendChild(link);
    }
    link.href = href;
  }
}
