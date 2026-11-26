import { Routes } from '@angular/router';
import {
  authGuard,
  billingGuard,
  onboardingGuard,
  pendingVerificationGuard,
} from './core/auth/auth.guard';
import { PRODUCT_NAVIGATION } from './domain/domain-navigation';
import { DEFAULT_SEO, SeoData } from './core/seo/seo';

const seo = (data: SeoData) => ({ seo: data });

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./features/landing/landing-page').then((m) => m.LandingPage),
    data: seo(DEFAULT_SEO),
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/auth-page').then((m) => m.AuthPage),
    data: {
      mode: 'login',
      ...seo({
        title: 'Giriş Yap | Odivon MachineCE',
        description:
          'Odivon MachineCE hesabınıza giriş yapın; makine CE dosyalarınıza, risk değerlendirmelerinize ve AT uygunluk beyanlarınıza erişin.',
        index: true,
      }),
    },
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/auth-page').then((m) => m.AuthPage),
    data: {
      mode: 'register',
      ...seo({
        title: 'Ücretsiz Deneyin | Odivon MachineCE',
        description:
          'Kredi kartı gerekmeden 14 gün ücretsiz deneyin. Makine CE uygunluk, EN ISO 12100 risk analizi ve teknik dosya süreçlerinizi dijitalleştirin.',
        index: true,
      }),
    },
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./features/auth/forgot-password-page').then((m) => m.ForgotPasswordPage),
  },
  {
    path: 'verify-email',
    canActivate: [pendingVerificationGuard],
    loadComponent: () => import('./features/auth/verify-email-page').then((m) => m.VerifyEmailPage),
  },
  {
    path: 'legal/terms',
    loadComponent: () => import('./features/legal/legal-page').then((m) => m.LegalPage),
    data: {
      document: 'terms',
      ...seo({
        title: 'Kullanım Koşulları | Odivon MachineCE',
        description:
          'Odivon MachineCE SaaS hizmet kullanım koşulları, abonelik ve sorumluluk esasları.',
        index: true,
      }),
    },
  },
  {
    path: 'legal/privacy',
    loadComponent: () => import('./features/legal/legal-page').then((m) => m.LegalPage),
    data: {
      document: 'privacy',
      ...seo({
        title: 'Gizlilik ve KVKK | Odivon MachineCE',
        description:
          'Odivon MachineCE gizlilik ve kişisel verilerin işlenmesine ilişkin KVKK aydınlatma bildirimi.',
        index: true,
      }),
    },
  },
  {
    path: 'onboarding',
    canActivate: [onboardingGuard],
    loadComponent: () =>
      import('./features/onboarding/onboarding-page').then((m) => m.OnboardingPage),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/app-shell').then((m) => m.AppShell),
    children: [
      {
        path: 'overview',
        loadComponent: () =>
          import('./features/workspace/machine-ce-page').then((m) => m.MachineCePage),
        data: { view: 'overview' },
      },
      ...PRODUCT_NAVIGATION.map((item) => ({
        path: item.path,
        loadComponent: () =>
          import('./features/workspace/machine-ce-page').then((m) => m.MachineCePage),
        data: { view: 'domain', section: item.key },
      })),
      {
        path: 'activity',
        loadComponent: () =>
          import('./features/activity/activity-page').then((m) => m.ActivityPage),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/settings/settings-page').then((m) => m.SettingsPage),
      },
      {
        path: 'billing',
        canActivate: [billingGuard],
        loadComponent: () => import('./features/billing/billing-page').then((m) => m.BillingPage),
      },
      {
        path: 'subscription-result',
        canActivate: [billingGuard],
        loadComponent: () =>
          import('./features/billing/subscription-result-page').then(
            (m) => m.SubscriptionResultPage,
          ),
      },
      {
        path: 'subscription-required',
        loadComponent: () =>
          import('./features/billing/subscription-required-page').then(
            (m) => m.SubscriptionRequiredPage,
          ),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
