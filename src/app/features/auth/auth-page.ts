import { DOCUMENT } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import {
  email,
  FormField,
  form,
  minLength,
  required,
  submit,
  validate,
} from '@angular/forms/signals';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthStore } from '../../core/auth/auth-store';
import { BUILD_INFO } from '../../core/version/build-info';
import { PRODUCT } from '../../domain/product-manifest';

const LIVE_EVENTS = [
  {
    tone: 'ok',
    title: 'Hidrolik Abkant Pres #2 onaylandı',
    meta: 'Teknik dosya v4 · Gebze OSB · şimdi',
  },
  {
    tone: 'pay',
    title: 'EN ISO 12100 risk matrisi doğrulandı',
    meta: 'Artık risk skoru: 4 (Düşük) · 1 dk',
  },
  {
    tone: 'info',
    title: 'EN 60204-1 güvenlik testi eklendi',
    meta: 'Robotik Kaynak Hücresi · 3 dk',
  },
  {
    tone: 'ok',
    title: 'AT Uygunluk Beyanı dijital imzalandı',
    meta: '2006/42/EC & AB 2023/1230 · 5 dk',
  },
] as const;

@Component({
  selector: 'app-auth-page',
  imports: [FormField, RouterLink],
  template: `
    <main class="auth-page" id="main">
      <!-- Left Story & Interactive Visual Panel -->
      <section class="story-panel">
        <div class="brand">
          <span aria-hidden="true">O</span>
          <div>
            <strong>ODIVON</strong>
            <small>MACHINE CE</small>
          </div>
        </div>

        <p class="eyebrow">MAKİNE EMNİYETİ & CE UYUMLULUK BULUTU · 2006/42/EC · AB 2023/1230</p>
        <h1>
          CE kanıt zincirini tek ekrandan <span class="shine">yönetin.</span>
        </h1>
        <p class="story-lead">
          Makine envanteri, EN ISO 12100 risk değerlendirmesi, harmonize standart matrisi, teknik
          dosya ve AT uygunluk beyanları aynı denetlenebilir çalışma alanında.
        </p>

        <!-- Animated CE Compliance Schematic, Orbit & Live Ticker -->
        <div class="visual-scene" aria-hidden="true">
          <div class="map">
            <svg viewBox="0 0 360 240">
              <defs>
                <linearGradient id="lv-route" x1="0" x2="1">
                  <stop offset="0" stop-color="#34d399" />
                  <stop offset="1" stop-color="#a78bfa" />
                </linearGradient>
              </defs>
              <g class="streets">
                <path d="M0 60 H360 M0 130 H360 M0 200 H360 M70 0 V240 M170 0 V240 M270 0 V240" />
                <path d="M0 240 L140 0 M220 240 L360 40" />
              </g>
              <path d="M0 175 Q90 150 160 185 T360 160" class="water" />
              <path
                id="lv-path"
                d="M48 196 C 90 120, 150 210, 190 130 S 280 60, 318 52"
                class="route-bg"
              />
              <path
                d="M48 196 C 90 120, 150 210, 190 130 S 280 60, 318 52"
                class="route"
                stroke="url(#lv-route)"
              />
              <g class="pin start" transform="translate(48 196)">
                <circle r="16" class="pulse" />
                <circle r="7" />
              </g>
              <g class="pin end" transform="translate(318 52)">
                <circle r="16" class="pulse" />
                <circle r="7" />
              </g>
              <g class="vehicle">
                <rect x="-13" y="-7" width="26" height="14" rx="5" />
                <rect x="-4" y="-5" width="9" height="10" rx="2" class="roof" />
                @if (!reduced) {
                  <animateMotion
                    dur="7s"
                    repeatCount="indefinite"
                    rotate="auto"
                    keyPoints="0;1"
                    keyTimes="0;1"
                    calcMode="spline"
                    keySplines=".45 0 .55 1"
                  >
                    <mpath href="#lv-path" />
                  </animateMotion>
                }
              </g>
              <text x="24" y="226" class="label">EN ISO 12100 Risk</text>
              <text x="255" y="30" class="label">AT Beyanı & CE</text>
            </svg>
            <div class="eta">
              <small>Canlı CE Hazırlık</small>
              <b>%98 Uyumlu</b>
            </div>
          </div>

          <div class="orbit">
            <div class="core"><span>CE</span></div>
            <div class="ring r1">
              <i class="sat s1"><span>ISO 12100</span></i>
              <i class="sat s2"><span>EN 60204</span></i>
            </div>
            <div class="ring r2">
              <i class="sat s3"><span>2006/42/EC</span></i>
              <i class="sat s4"><span>2023/1230</span></i>
              <i class="sat s5"><span>PL d/e</span></i>
            </div>
          </div>

          <div class="ticker">
            <ul>
              @for (e of events; track $index) {
                <li [class]="e.tone">
                  <span class="dot"></span>
                  <div>
                    <b>{{ e.title }}</b>
                    <small>{{ e.meta }}</small>
                  </div>
                </li>
              }
              <li [class]="events[0].tone">
                <span class="dot"></span>
                <div>
                  <b>{{ events[0].title }}</b>
                  <small>{{ events[0].meta }}</small>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div class="stats">
          <div>
            <b>14 gün</b>
            <small>Ücretsiz kurumsal deneme</small>
          </div>
          <div>
            <b>EN ISO 12100</b>
            <small>Dinamik risk skoru matrisi</small>
          </div>
          <div>
            <b>%100</b>
            <small>Değişmez denetim izi</small>
          </div>
        </div>
      </section>

      <!-- Right Form Panel -->
      <section class="form-panel" [class.dark-panel]="dark()">
        <div class="ambient-glow" aria-hidden="true"></div>
        <div class="blob b1" aria-hidden="true"></div>
        <div class="blob b2" aria-hidden="true"></div>

        <button
          class="theme-btn"
          type="button"
          (click)="toggleTheme()"
          [attr.aria-label]="dark() ? 'Açık temaya geç' : 'Koyu temaya geç'"
          [attr.aria-pressed]="dark()"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            @if (dark()) {
              <circle cx="12" cy="12" r="4.5" />
              <path
                d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"
              />
            } @else {
              <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
            }
          </svg>
          <span>{{ dark() ? 'Açık tema' : 'Koyu tema' }}</span>
        </button>

        <div class="form-card">
          <div class="mobile-brand">
            <span aria-hidden="true">O</span>
            <strong>ODIVON · {{ product.name }}</strong>
          </div>

          <!-- Sliding Pill Mode Switcher -->
          <div class="switch" role="group" aria-label="Hesap işlemi">
            <button
              type="button"
              [attr.aria-pressed]="!registerMode()"
              (click)="setMode(false)"
            >
              Giriş yap
            </button>
            <button
              type="button"
              [attr.aria-pressed]="registerMode()"
              (click)="setMode(true)"
            >
              Ücretsiz dene
            </button>
            <span class="pill" [class.right]="registerMode()" aria-hidden="true"></span>
          </div>

          <h2>
            {{ registerMode() ? 'Yeni çalışma alanı oluşturun' : 'Tekrar hoş geldiniz' }}
          </h2>
          <p class="lead">
            {{
              registerMode()
                ? 'Makine emniyeti ve CE teknik dosya operasyonunuzu dakikalar içinde başlatın.'
                : 'MachineCE operasyon ve denetim merkezine güvenli erişim sağlayın.'
            }}
          </p>

          @if (justUpdated) {
            <div class="notice" role="status">
              Yeni sürüme (<strong>v{{ buildVersion }}</strong>) güncellendi. Güvenliğiniz için
              çerezler ve eski oturum temizlendi; lütfen tekrar giriş yapın.
            </div>
          }

          <form (submit)="onSubmit($event)" novalidate>
            @if (registerMode()) {
              <div class="row">
                <label>
                  Ad soyad
                  <span class="input">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <circle cx="12" cy="8" r="4" />
                      <path d="M4 21a8 8 0 0 1 16 0" />
                    </svg>
                    <input
                      [formField]="authForm.name"
                      autocomplete="name"
                      placeholder="Adınız Soyadınız"
                    />
                  </span>
                  @if (authForm.name().touched() && authForm.name().invalid()) {
                    <span class="field-err">Ad soyad zorunludur.</span>
                  }
                </label>

                <label>
                  Şirket / Kuruluş adı
                  <span class="input">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M4 21V5l8-3 8 3v16M9 21v-5h6v5M8 9h.01M12 9h.01M16 9h.01M8 13h.01M16 13h.01"
                      />
                    </svg>
                    <input
                      [formField]="authForm.company"
                      autocomplete="organization"
                      placeholder="Örn. Yıldız Makine A.Ş."
                    />
                  </span>
                </label>
              </div>
            }

            <label>
              E-posta adresi
              <span class="input">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="3" y="5" width="18" height="14" rx="3" />
                  <path d="m4 7 8 6 8-6" />
                </svg>
                <input
                  type="email"
                  [formField]="authForm.email"
                  autocomplete="email"
                  placeholder="muhendislik@firma.com"
                />
              </span>
              @if (authForm.email().touched() && authForm.email().invalid()) {
                <span class="field-err">Geçerli bir kurumsal e-posta adresi girin.</span>
              }
            </label>

            <label>
              <span class="label-row">
                <span>Şifre</span>
                @if (!registerMode()) {
                  <a routerLink="/forgot-password" class="link">Şifremi unuttum</a>
                }
              </span>
              <span class="input">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="4" y="10" width="16" height="11" rx="3" />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                </svg>
                <input
                  [type]="showPassword() ? 'text' : 'password'"
                  [formField]="authForm.password"
                  [autocomplete]="registerMode() ? 'new-password' : 'current-password'"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  class="eye"
                  (click)="showPassword.update((v) => !v)"
                  [attr.aria-label]="showPassword() ? 'Şifreyi gizle' : 'Şifreyi göster'"
                >
                  {{ showPassword() ? 'Gizle' : 'Göster' }}
                </button>
              </span>
              @if (authForm.password().touched() && authForm.password().invalid()) {
                <span class="field-err">
                  {{
                    registerMode()
                      ? 'En az 10 karakter (büyük/küçük harf, rakam ve sembol) girin.'
                      : 'Şifre en az 8 karakter olmalıdır.'
                  }}
                </span>
              }
            </label>

            @if (registerMode()) {
              <label class="check">
                <input
                  type="checkbox"
                  [checked]="consent()"
                  (change)="consent.set($any($event.target).checked)"
                />
                <span>
                  <a href="/legal/terms" target="_blank" rel="noopener">Kullanım koşullarını</a>
                  ve
                  <a href="/legal/privacy" target="_blank" rel="noopener">gizlilik bildirimini</a>
                  okudum, kabul ediyorum.
                </span>
              </label>
            }

            @if (error()) {
              <p class="error" role="alert">{{ error() }}</p>
            }

            <button class="submit" type="submit" [disabled]="busy()">
              @if (busy()) {
                <span class="spinner" aria-hidden="true"></span>
                <span>İşleniyor…</span>
              } @else {
                <span>{{
                  registerMode() ? 'Ücretsiz hesap oluştur' : 'Operasyon merkezine giriş yap'
                }}</span>
                <span aria-hidden="true">→</span>
              }
            </button>
          </form>

          <ul class="trust">
            <li>256-bit SSL</li>
            <li>KVKK & GDPR uyumlu</li>
            <li>Sürüm v{{ buildVersion }}</li>
          </ul>

          <nav class="legal" aria-label="Yasal bağlantılar">
            <a routerLink="/legal/terms">Kullanım Koşulları</a>
            <a routerLink="/legal/privacy">Gizlilik Bildirimi</a>
            <a routerLink="/forgot-password">Şifre Sıfırlama</a>
          </nav>
        </div>
      </section>
    </main>
  `,
  styles: `
    .auth-page {
      min-height: 100vh;
      min-height: 100dvh;
      overflow-x: clip;
      display: grid;
      grid-template-columns: 1.06fr 0.94fr;
      background: #060d1d;
    }

    /* Left Story Panel */
    .story-panel {
      color: #fff;
      position: relative;
      padding: clamp(2rem, 5vw, 5rem);
      padding-top: 5.5rem;
      display: flex;
      flex-direction: column;
      justify-content: center;
      background:
        radial-gradient(circle at 20% 22%, rgba(99, 102, 241, 0.34), transparent 42%),
        radial-gradient(circle at 82% 85%, rgba(168, 85, 247, 0.22), transparent 40%),
        #081225;
      border-inline-end: 1px solid rgba(148, 163, 184, 0.12);
    }

    .brand {
      position: absolute;
      top: 2rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      letter-spacing: 0.1em;
    }
    .brand span {
      display: grid;
      place-items: center;
      width: 2.6rem;
      height: 2.6rem;
      border-radius: 0.85rem;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      font-weight: 900;
      font-size: 1.15rem;
      box-shadow: 0 0 24px rgba(129, 140, 248, 0.6);
    }
    .brand strong {
      display: block;
      font-size: 0.95rem;
      font-weight: 900;
    }
    .brand small {
      display: block;
      font-size: 0.65rem;
      font-weight: 700;
      color: #a5b4fc;
      letter-spacing: 0.16em;
    }

    .eyebrow {
      margin: 0;
      font-size: 0.7rem;
      font-weight: 800;
      letter-spacing: 0.13em;
      color: #a5b4fc;
    }

    .story-panel h1 {
      max-width: 620px;
      margin: 0.6rem 0;
      font-size: clamp(2.2rem, 4.2vw, 3.8rem);
      font-weight: 900;
      line-height: 1.04;
      letter-spacing: -0.04em;
      animation: rise 0.75s ease-out both;
    }

    .shine {
      background: linear-gradient(90deg, #a5b4fc, #f0abfc, #34d399, #a5b4fc);
      background-size: 200% auto;
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
      animation: sheen 5s linear infinite;
    }

    .story-lead {
      max-width: 540px;
      margin: 0;
      color: #a8b3c7;
      font-size: 0.96rem;
      line-height: 1.65;
      animation: rise 0.75s 0.12s ease-out both;
    }

    /* Interactive Visual Scene */
    .visual-scene {
      position: relative;
      display: block;
      height: clamp(16rem, 35vh, 21rem);
      margin: 1.75rem 0 1.5rem;
    }
    .map {
      position: absolute;
      inset: 0 28% 2.2rem 0;
      border-radius: 1.4rem;
      overflow: hidden;
      background: linear-gradient(160deg, #111a3a, #0c1330);
      border: 1px solid rgba(165, 180, 252, 0.22);
      box-shadow: 0 28px 65px rgba(2, 6, 23, 0.55);
    }
    .map svg {
      width: 100%;
      height: 100%;
    }
    .streets path {
      fill: none;
      stroke: rgba(148, 163, 184, 0.11);
      stroke-width: 5;
      stroke-linecap: round;
    }
    .water {
      fill: none;
      stroke: rgba(56, 189, 248, 0.13);
      stroke-width: 16;
      stroke-linecap: round;
    }
    .route-bg {
      fill: none;
      stroke: rgba(255, 255, 255, 0.08);
      stroke-width: 8;
      stroke-linecap: round;
    }
    .route {
      fill: none;
      stroke-width: 4;
      stroke-linecap: round;
      stroke-dasharray: 10 9;
      animation: flow 1s linear infinite;
    }
    .pin circle {
      fill: #34d399;
    }
    .pin.end circle {
      fill: #a78bfa;
    }
    .pin .pulse {
      opacity: 0.35;
      transform-origin: center;
      transform-box: fill-box;
      animation: pulse 2s ease-out infinite;
    }
    .vehicle rect {
      fill: #fff;
    }
    .vehicle .roof {
      fill: #6366f1;
    }
    .label {
      fill: #cbd5e1;
      font-size: 11px;
      font-weight: 700;
    }
    .eta {
      position: absolute;
      inset-inline-start: 1rem;
      top: 1rem;
      display: grid;
      padding: 0.5rem 0.8rem;
      border-radius: 0.85rem;
      background: rgba(15, 23, 42, 0.65);
      border: 1px solid rgba(255, 255, 255, 0.14);
      backdrop-filter: blur(10px);
      color: #fff;
    }
    .eta small {
      font-size: 0.65rem;
      color: #c7d2fe;
    }
    .eta b {
      font-size: 1.05rem;
      color: #34d399;
    }

    .orbit {
      position: absolute;
      inset-inline-end: 0;
      top: 0;
      width: 12.5rem;
      aspect-ratio: 1;
      display: grid;
      place-items: center;
    }
    .core {
      width: 3.5rem;
      aspect-ratio: 1;
      border-radius: 1.15rem;
      display: grid;
      place-items: center;
      background: linear-gradient(135deg, #6366f1, #c026d3);
      color: #fff;
      font-weight: 900;
      font-size: 1.15rem;
      box-shadow: 0 0 38px rgba(167, 139, 250, 0.7);
      animation: breathe 3s ease-in-out infinite;
    }
    .ring {
      position: absolute;
      border-radius: 50%;
      border: 1px dashed rgba(199, 210, 254, 0.3);
      animation: spin 18s linear infinite;
    }
    .r1 {
      inset: 22%;
    }
    .r2 {
      inset: 2%;
      animation-duration: 28s;
      animation-direction: reverse;
    }
    .sat {
      position: absolute;
      left: 50%;
      top: 50%;
      padding: 0.2rem 0.5rem;
      border-radius: 1rem;
      font-style: normal;
      font-size: 0.6rem;
      font-weight: 800;
      color: #1e1b4b;
      background: #e0e7ff;
      box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);
      translate: -50% -50%;
    }
    .sat span {
      display: block;
      animation: spin 18s linear infinite reverse;
    }
    .r2 .sat span {
      animation-duration: 28s;
      animation-direction: normal;
    }
    .s1 {
      transform: rotate(0deg) translate(3.9rem) rotate(0deg);
    }
    .s2 {
      transform: rotate(180deg) translate(3.9rem) rotate(-180deg);
    }
    .s3 {
      transform: rotate(55deg) translate(5.9rem) rotate(-55deg);
      background: #fae8ff;
    }
    .s4 {
      transform: rotate(185deg) translate(5.9rem) rotate(-185deg);
      background: #fae8ff;
    }
    .s5 {
      transform: rotate(305deg) translate(5.9rem) rotate(-305deg);
      background: #d1fae5;
    }

    .ticker {
      position: absolute;
      inset-inline-end: 0;
      bottom: 0;
      width: min(20rem, 66%);
      height: 4.1rem;
      overflow: hidden;
      border-radius: 1.1rem;
      background: rgba(255, 255, 255, 0.97);
      box-shadow: 0 20px 50px rgba(2, 6, 23, 0.48);
    }
    .ticker ul {
      margin: 0;
      padding: 0;
      list-style: none;
      animation: tick 12s cubic-bezier(0.7, 0, 0.3, 1) infinite;
    }
    .ticker li {
      height: 4.1rem;
      display: flex;
      align-items: center;
      gap: 0.7rem;
      padding: 0 1rem;
      color: #0f172a;
    }
    .ticker li div {
      display: grid;
    }
    .ticker b {
      font-size: 0.78rem;
      font-weight: 800;
    }
    .ticker small {
      font-size: 0.67rem;
      color: #475569;
    }
    .dot {
      width: 0.62rem;
      height: 0.62rem;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.2);
      flex: none;
    }
    .pay .dot {
      background: #6366f1;
      box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.2);
    }
    .info .dot {
      background: #f59e0b;
      box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.2);
    }

    .stats {
      display: flex;
      gap: 2.2rem;
      padding-top: 0.5rem;
    }
    .stats div {
      display: grid;
    }
    .stats b {
      font-size: 1.15rem;
      font-weight: 900;
    }
    .stats small {
      color: #94a3b8;
      font-size: 0.76rem;
    }

    /* Right Form Panel */
    .form-panel {
      --bg: #f8fafc;
      --card: #ffffff;
      --card-border: #e2e8f0;
      --card-shadow:
        0 4px 6px -1px rgba(15, 23, 42, 0.05),
        0 20px 40px -15px rgba(15, 23, 42, 0.08),
        0 0 0 1px rgba(226, 232 240, 0.7);
      --text: #0f172a;
      --muted: #64748b;
      --line: #e2e8f0;
      --in: #ffffff;
      --lab: #334155;
      --soft: #f1f5f9;
      --dots: rgba(148, 163, 184, 0.22);
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      min-height: 100dvh;
      padding: 3.5rem 1.5rem 2rem;
      overflow-y: auto;
      overflow-x: hidden;
      background: var(--bg) radial-gradient(var(--dots) 1px, transparent 1px) 0 0 / 24px 24px;
      color: var(--text);
    }
    .form-panel.dark-panel,
    :host-context(html.dark) .form-panel {
      --bg: #090e1a;
      --card: #0f172a;
      --card-border: rgba(255, 255, 255, 0.08);
      --card-shadow:
        0 4px 12px rgba(0, 0, 0, 0.4),
        0 25px 50px -12px rgba(0, 0, 0, 0.6),
        0 0 0 1px rgba(255, 255, 255, 0.05);
      --text: #f8fafc;
      --muted: #94a3b8;
      --line: #1e293b;
      --in: #090e1a;
      --lab: #cbd5e1;
      --soft: #1a2338;
      --dots: rgba(255, 255, 255, 0.06);
    }

    .ambient-glow {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 34rem;
      max-width: 90vw;
      height: 34rem;
      border-radius: 50%;
      background: radial-gradient(
        circle,
        rgba(99, 102, 241, 0.1) 0%,
        rgba(99, 102, 241, 0.03) 45%,
        transparent 70%
      );
      filter: blur(60px);
      pointer-events: none;
    }
    .blob {
      position: absolute;
      width: 24rem;
      aspect-ratio: 1;
      border-radius: 50%;
      filter: blur(85px);
      pointer-events: none;
      opacity: 0.13;
      animation: drift 18s ease-in-out infinite alternate;
    }
    .b1 {
      top: -8rem;
      inset-inline-end: -8rem;
      background: #6366f1;
    }
    .b2 {
      bottom: -10rem;
      inset-inline-start: -8rem;
      background: #38bdf8;
      animation-delay: -9s;
    }

    .theme-btn {
      position: absolute;
      top: 1.25rem;
      inset-inline-end: 1.25rem;
      z-index: 10;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.95rem;
      border: 1px solid var(--line);
      border-radius: 9999px;
      background: var(--card);
      color: var(--text);
      font-size: 0.78rem;
      font-weight: 700;
      box-shadow: 0 2px 10px rgba(15, 23, 42, 0.06);
      transition: transform 0.2s ease, border-color 0.2s ease;
    }
    .theme-btn:hover {
      transform: translateY(-1px);
      border-color: #6366f1;
    }
    .theme-btn svg {
      width: 1rem;
      height: 1rem;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.8;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    .form-card {
      position: relative;
      z-index: 1;
      width: min(29rem, 100%);
      margin: auto 0;
      padding: 2.25rem;
      border-radius: 1.5rem;
      background: var(--card);
      border: 1px solid var(--card-border);
      box-shadow: var(--card-shadow);
      animation: rise 0.55s ease-out both;
    }

    .mobile-brand {
      display: none;
      align-items: center;
      gap: 0.65rem;
      margin-bottom: 1.25rem;
      font-weight: 800;
      font-size: 0.85rem;
      letter-spacing: 0.08em;
    }
    .mobile-brand span {
      display: grid;
      place-items: center;
      width: 2.1rem;
      height: 2.1rem;
      border-radius: 0.7rem;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: #fff;
      font-weight: 900;
    }

    /* Mode Switcher */
    .switch {
      position: relative;
      display: grid;
      grid-template-columns: 1fr 1fr;
      padding: 0.3rem;
      margin-bottom: 1.5rem;
      border-radius: 1rem;
      background: var(--soft);
    }
    .switch button {
      position: relative;
      z-index: 1;
      border: 0;
      background: none;
      color: var(--muted);
      font-size: 0.85rem;
      font-weight: 700;
      padding: 0.6rem;
      cursor: pointer;
      transition: color 0.25s;
    }
    .switch button[aria-pressed='true'] {
      color: #fff;
    }
    .pill {
      position: absolute;
      inset: 0.3rem auto 0.3rem 0.3rem;
      width: calc(50% - 0.3rem);
      border-radius: 0.75rem;
      background: linear-gradient(135deg, #6366f1, #7c3aed);
      box-shadow: 0 6px 18px rgba(99, 102, 241, 0.38);
      transition: transform 0.38s cubic-bezier(0.4, 1.4, 0.5, 1);
    }
    .pill.right {
      transform: translateX(100%);
    }

    .form-card h2 {
      margin: 0;
      font-size: 1.65rem;
      font-weight: 900;
      letter-spacing: -0.03em;
    }
    .lead {
      margin: 0.4rem 0 1.4rem;
      color: var(--muted);
      font-size: 0.88rem;
      line-height: 1.5;
    }

    form {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: 1rem;
    }
    .row {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.85rem;
    }
    label {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: 0.4rem;
      color: var(--lab);
      font-size: 0.8rem;
      font-weight: 700;
    }
    .label-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .input {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      height: 3.1rem;
      padding: 0 0.9rem;
      border: 1.5px solid var(--line);
      border-radius: 0.9rem;
      background: var(--in);
      color: var(--muted);
      transition: border-color 0.2s, box-shadow 0.2s, color 0.2s;
    }
    .input:focus-within {
      border-color: #6366f1;
      color: #6366f1;
      box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.16);
    }
    .input svg {
      flex: none;
      width: 1.1rem;
      height: 1.1rem;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.8;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    .input input {
      flex: 1;
      width: 100%;
      min-width: 0;
      height: 100%;
      border: 0;
      outline: 0;
      background: none;
      color: var(--text);
      font-size: 0.9rem;
      font-weight: 500;
    }
    .input input::placeholder {
      color: #94a3b8;
    }
    .eye,
    .link {
      border: 0;
      background: none;
      color: #4f46e5;
      font-size: 0.76rem;
      font-weight: 700;
      text-decoration: none;
      cursor: pointer;
    }
    .dark-panel .eye,
    .dark-panel .link,
    .dark-panel .check a,
    :host-context(html.dark) .eye,
    :host-context(html.dark) .link,
    :host-context(html.dark) .check a {
      color: #a5b4fc;
    }
    .field-err {
      color: #e11d48;
      font-size: 0.74rem;
      font-weight: 600;
    }
    .check {
      display: flex;
      align-items: flex-start;
      gap: 0.55rem;
      font-weight: 500;
      font-size: 0.78rem;
      line-height: 1.45;
    }
    .check input {
      margin-top: 0.2rem;
      accent-color: #6366f1;
    }
    .check a {
      color: #4f46e5;
      font-weight: 700;
    }
    .submit {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 0.55rem;
      height: 3.2rem;
      margin-top: 0.25rem;
      border: 0;
      border-radius: 0.95rem;
      color: #fff;
      font-size: 0.94rem;
      font-weight: 800;
      background: linear-gradient(135deg, #6366f1, #7c3aed 60%, #c026d3);
      background-size: 180% 100%;
      box-shadow: 0 10px 24px -6px rgba(99, 102, 241, 0.48);
      cursor: pointer;
      transition: background-position 0.5s, transform 0.2s ease, opacity 0.2s;
    }
    .submit:hover:not(:disabled) {
      background-position: 100% 0;
      transform: translateY(-1px);
    }
    .submit:disabled {
      opacity: 0.65;
      cursor: not-allowed;
    }
    .spinner {
      width: 1rem;
      height: 1rem;
      border-radius: 50%;
      border: 2px solid rgba(255, 255, 255, 0.35);
      border-top-color: #fff;
      animation: spin 0.7s linear infinite;
    }
    .error {
      margin: 0;
      padding: 0.75rem 0.9rem;
      border-radius: 0.85rem;
      background: rgba(244, 63, 94, 0.1);
      border: 1px solid rgba(244, 63, 94, 0.25);
      color: #e11d48;
      font-size: 0.8rem;
      font-weight: 700;
    }
    .notice {
      margin: 0 0 1rem;
      padding: 0.8rem 0.95rem;
      border-radius: 0.85rem;
      border-inline-start: 4px solid #10b981;
      background: rgba(16, 185, 129, 0.12);
      color: #047857;
      font-size: 0.8rem;
      font-weight: 600;
      line-height: 1.45;
    }
    .dark-panel .notice,
    :host-context(html.dark) .notice {
      color: #6ee7b7;
    }
    .trust {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 0.6rem 1.15rem;
      margin: 1.4rem 0 0;
      padding: 0;
      list-style: none;
      color: var(--muted);
      font-size: 0.73rem;
      font-weight: 600;
    }
    .trust li::before {
      content: '✓ ';
      color: #10b981;
      font-weight: 900;
    }
    .legal {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 0.4rem 1rem;
      margin-top: 0.85rem;
      font-size: 0.75rem;
    }
    .legal a {
      display: inline-flex;
      align-items: center;
      min-height: 26px;
      color: var(--muted);
      text-decoration: none;
      font-weight: 600;
    }
    .legal a:hover {
      color: #6366f1;
      text-decoration: underline;
    }

    @keyframes rise {
      from {
        opacity: 0;
        transform: translateY(16px);
      }
    }
    @keyframes sheen {
      to {
        background-position: 200% center;
      }
    }
    @keyframes flow {
      to {
        stroke-dashoffset: -19;
      }
    }
    @keyframes pulse {
      from {
        transform: scale(0.6);
        opacity: 0.6;
      }
      to {
        transform: scale(1.6);
        opacity: 0;
      }
    }
    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
    @keyframes breathe {
      50% {
        transform: scale(1.08);
      }
    }
    @keyframes drift {
      to {
        transform: translate(-3rem, 2rem) scale(1.15);
      }
    }
    @keyframes tick {
      0%,
      20% {
        transform: translateY(0);
      }
      25%,
      45% {
        transform: translateY(-4.1rem);
      }
      50%,
      70% {
        transform: translateY(-8.2rem);
      }
      75%,
      95% {
        transform: translateY(-12.3rem);
      }
      100% {
        transform: translateY(-16.4rem);
      }
    }

    @media (max-width: 960px) {
      .auth-page {
        grid-template-columns: 1fr;
      }
      .form-panel {
        order: -1;
        min-height: 100svh;
        padding: 4.5rem 1rem 2rem;
      }
      .form-card {
        padding: 1.65rem;
      }
      .mobile-brand {
        display: flex;
      }
      .story-panel {
        padding: 4.5rem 1.5rem 2.5rem;
      }
      .brand {
        top: 1.5rem;
      }
      .stats {
        gap: 1rem;
        flex-wrap: wrap;
      }
    }
    @media (max-width: 600px) {
      .row {
        grid-template-columns: minmax(0, 1fr);
      }
      .map {
        inset: 0 0 3rem 0;
      }
      .orbit {
        display: none;
      }
      .ticker {
        width: 90%;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      *,
      *::before {
        animation: none !important;
        transition: none !important;
      }
    }
  `,
})
export class AuthPage {
  readonly product = PRODUCT;
  readonly events = LIVE_EVENTS;
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthStore);
  readonly reduced =
    inject(DOCUMENT).defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

  readonly registerMode = signal(this.route.snapshot.data['mode'] === 'register');
  readonly dark = signal(localStorage.getItem('odivon:theme') === 'dark');
  readonly justUpdated = this.route.snapshot.queryParamMap.get('updated') === '1';
  readonly buildVersion = BUILD_INFO.version;
  readonly showPassword = signal(false);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly consent = signal(false);
  readonly model = signal({ name: '', company: '', email: '', password: '' });
  readonly authForm = form(this.model, (p) => {
    required(p.email);
    email(p.email);
    required(p.password);
    minLength(p.password, 8);
    validate(p.name, ({ value }) =>
      this.registerMode() && !value().trim()
        ? { kind: 'required', message: 'Ad soyad zorunludur.' }
        : undefined,
    );
    validate(p.password, ({ value }) =>
      this.registerMode() &&
        (value().length < 10 || !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/.test(value()))
        ? { kind: 'passwordStrength', message: 'Şifre yeterince güçlü değil.' }
        : undefined,
    );
  });

  constructor() {
    document.documentElement.classList.toggle('dark', this.dark());
  }

  setMode(register: boolean): void {
    this.registerMode.set(register);
    this.error.set('');
    void this.router.navigateByUrl(register ? '/register' : '/login', { replaceUrl: true });
  }

  toggleTheme(): void {
    this.dark.update((v) => !v);
    document.documentElement.classList.toggle('dark', this.dark());
    localStorage.setItem('odivon:theme', this.dark() ? 'dark' : 'light');
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    submit(this.authForm, async () => {
      this.busy.set(true);
      this.error.set('');
      try {
        const value = this.model();
        if (this.registerMode() && !this.consent()) {
          throw new Error('Devam etmek için kullanım koşullarını ve gizlilik bildirimini kabul etmelisiniz.');
        }
        if (this.registerMode()) {
          await this.auth.register(value.name, value.company, value.email, value.password);
        } else {
          await this.auth.signIn(value.email, value.password);
        }
        await this.router.navigateByUrl('/overview');
      } catch (error) {
        this.error.set(error instanceof Error ? error.message : 'İşlem tamamlanamadı.');
      } finally {
        this.busy.set(false);
      }
    });
  }
}
