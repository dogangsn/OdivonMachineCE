import { Injectable, Pipe, PipeTransform, computed, inject, signal } from '@angular/core';
export type SupportedLang = 'tr' | 'en' | 'de' | 'fr' | 'es' | 'it' | 'nl' | 'ar';
export interface LanguageOption {
  readonly code: SupportedLang;
  readonly nativeName: string;
  readonly flag: string;
  readonly dir: 'ltr' | 'rtl';
}
export const LANGUAGES: readonly LanguageOption[] = [
  { code: 'tr', nativeName: 'Türkçe', flag: '🇹🇷', dir: 'ltr' },
  { code: 'en', nativeName: 'English', flag: '🇬🇧', dir: 'ltr' },
  { code: 'de', nativeName: 'Deutsch', flag: '🇩🇪', dir: 'ltr' },
  { code: 'fr', nativeName: 'Français', flag: '🇫🇷', dir: 'ltr' },
  { code: 'es', nativeName: 'Español', flag: '🇪🇸', dir: 'ltr' },
  { code: 'it', nativeName: 'Italiano', flag: '🇮🇹', dir: 'ltr' },
  { code: 'nl', nativeName: 'Nederlands', flag: '🇳🇱', dir: 'ltr' },
  { code: 'ar', nativeName: 'العربية', flag: '🇦🇪', dir: 'rtl' },
];
const TR: Record<string, string> = {
  'nav.overview': 'Genel Bakış',
  'nav.machines': 'Makine Envanteri',
  'nav.risks': 'Risk Değerlendirmeleri',
  'nav.standards': 'Standart Matrisi',
  'nav.technicalFiles': 'Teknik Dosyalar',
  'nav.declarations': 'Uygunluk Beyanları',
  'nav.products': 'Ürünler',
  'nav.recipes': 'Reçeteler',
  'nav.allergens': 'Alerjen Kontrolü',
  'nav.nutrition': 'Besin Değerleri',
  'nav.approvals': 'Etiket Onayları',
  'nav.activity': 'Denetim İzi',
  'nav.billing': 'Plan ve Abonelik',
  'nav.settings': 'Ekip ve Ayarlar',
  'shell.operations': 'CE Operasyon Merkezi',
  'shell.governance': 'Yönetişim & Kurumsal',
  'shell.liveSync': 'Canlı Senkronizasyon',
  'shell.subtitle': 'Makine Emniyeti, Risk Analizi ve Teknik Dosya Yönetim Merkezi',
  'shell.auditReady': 'Denetime Hazır Altyapı',
  'shell.logout': 'Güvenli çıkış',
  'common.search': 'Ad, kod veya açıklama ara…',
  'common.new': 'Yeni Kayıt',
  'common.active': 'Aktif',
  'common.archive': 'Arşiv',
  'common.save': 'Kaydet',
  'common.cancel': 'Vazgeç',
  'dashboard.live': 'Canlı Uyum Radarı',
  'dashboard.online': 'Çevrimiçi',
  'dashboard.health': 'Sistem Durumu',
  'dashboard.capacity': 'Tamamlanma',
  'dashboard.today': 'Bugünkü İşlem',
  'product.category': 'Makine CE ve mevzuat uygunluğu',
  'product.tagline': 'Her makine güvenli, denetlenebilir ve CE işaretine hazır.',
  'product.promise':
    '2006/42/EC ve AB 2023/1230 kapsamında makine envanteri, EN ISO 12100 risk analizi, teknik dosya ve uygunluk beyanlarını tek kanıt zincirinde yönetin.',
  'metric.total': 'Takip edilen varlık',
  'metric.totalNote': 'Tüm tesislerde',
  'metric.active': 'Uyum skoru',
  'metric.activeNote': 'Aktif makine filosu',
  'metric.pending': 'Yaklaşan kontrol',
  'metric.pendingNote': 'Önümüzdeki 30 gün',
  'metric.score': 'Açık işlem',
  'metric.scoreNote': 'Mühendis onayı bekliyor',
  'module.title': 'CE Uyumluluk Modülleri',
  'module.subtitle': 'Makine emniyeti yaşam döngüsünü uçtan uca kapsayan çalışma alanı',
  'module.one': 'Makine envanteri',
  'module.oneDesc': 'Makine, hat, seri numarası ve direktif kapsam kaydı',
  'module.two': 'Risk değerlendirmesi',
  'module.twoDesc': 'EN ISO 12100 tehlike, şiddet/olasılık ve tedbir analizi',
  'module.three': 'Teknik dosya',
  'module.threeDesc': 'Şema, hesaplama, test raporu ve kullanım kılavuzu arşivi',
  'module.four': 'AT uygunluk beyanı',
  'module.fourDesc': 'Sürüm kontrollü onay ve CE işaretleme kanıt paketi',
  'table.name': 'Kayıt',
  'table.status': 'Durum',
  'empty.title': 'Henüz kayıt yok',
  'empty.body': 'İlk kaydı oluşturarak iş akışını başlatın.',
  'update.title': 'Uygulama güncellemesi hazır',
  'update.body': 'Güvenli biçimde en güncel sürüme geçin.',
  'update.action': 'Şimdi Güncelle',
  'drawer.title': 'Yeni Kayıt Oluştur',
  'drawer.name': 'Kayıt adı',
};
const EN: Record<string, string> = {
  'nav.overview': 'Overview',
  'nav.machines': 'Machine Inventory',
  'nav.risks': 'Risk Assessments',
  'nav.standards': 'Standards Matrix',
  'nav.technicalFiles': 'Technical Files',
  'nav.declarations': 'CE Declarations',
  'nav.products': 'Products',
  'nav.recipes': 'Recipes',
  'nav.allergens': 'Allergen Control',
  'nav.nutrition': 'Nutrition',
  'nav.approvals': 'Label Approvals',
  'nav.activity': 'Audit Trail',
  'nav.billing': 'Plan & Billing',
  'nav.settings': 'Team & Settings',
  'shell.operations': 'CE Operations Center',
  'shell.governance': 'Governance & Enterprise',
  'shell.liveSync': 'Live Sync',
  'shell.subtitle': 'Machine Safety, Risk Analysis & Technical File Hub',
  'shell.auditReady': 'Audit-Ready Infrastructure',
  'shell.logout': 'Secure Sign Out',
  'common.search': 'Search by name, code or description…',
  'common.new': 'New Record',
  'common.active': 'Active',
  'common.archive': 'Archive',
  'common.save': 'Save',
  'common.cancel': 'Cancel',
  'dashboard.live': 'Live Compliance Radar',
  'dashboard.online': 'Online',
  'dashboard.health': 'System Status',
  'dashboard.capacity': 'Completion',
  'dashboard.today': 'Today',
  'module.title': 'CE Compliance Modules',
  'module.subtitle': 'End-to-end machine safety lifecycle workspace',
  'table.name': 'Record',
  'table.status': 'Status',
  'empty.title': 'No records yet',
  'empty.body': 'Create the first record to begin.',
  'update.title': 'Application update ready',
  'update.body': 'Move safely to the latest version.',
  'update.action': 'Update Now',
  'drawer.title': 'Create New Record',
  'drawer.name': 'Record name',
};
const NAV_TRANSLATIONS: Record<Exclude<SupportedLang, 'tr' | 'en'>, Record<string, string>> = {
  de: {
    'nav.overview': 'Übersicht',
    'nav.machines': 'Maschineninventar',
    'nav.risks': 'Risikobeurteilungen',
    'nav.standards': 'Normenmatrix',
    'nav.technicalFiles': 'Technische Unterlagen',
    'nav.declarations': 'Konformitätserklärungen',
    'nav.products': 'Produkte',
    'nav.recipes': 'Rezepturen',
    'nav.allergens': 'Allergenkontrolle',
    'nav.nutrition': 'Nährwerte',
    'nav.approvals': 'Etikettenfreigaben',
    'nav.activity': 'Prüfpfad',
    'nav.billing': 'Abonnement',
    'nav.settings': 'Team & Einstellungen',
    'shell.operations': 'CE-Betriebszentrum',
    'shell.governance': 'Governance & Unternehmen',
    'shell.liveSync': 'Live-Synchronisierung',
    'shell.logout': 'Sicher abmelden',
    'common.cancel': 'Abbrechen',
  },
  fr: {
    'nav.overview': 'Vue d’ensemble',
    'nav.machines': 'Inventaire machines',
    'nav.risks': 'Évaluations des risques',
    'nav.standards': 'Matrice des normes',
    'nav.technicalFiles': 'Dossiers techniques',
    'nav.declarations': 'Déclarations CE',
    'nav.products': 'Produits',
    'nav.recipes': 'Recettes',
    'nav.allergens': 'Contrôle des allergènes',
    'nav.nutrition': 'Valeurs nutritionnelles',
    'nav.approvals': 'Approbations d’étiquettes',
    'nav.activity': 'Journal d’audit',
    'nav.billing': 'Abonnement',
    'nav.settings': 'Équipe & Paramètres',
    'shell.operations': 'Centre d’opérations CE',
    'shell.governance': 'Gouvernance & Entreprise',
    'shell.liveSync': 'Synchro en direct',
    'shell.logout': 'Déconnexion sécurisée',
    'common.cancel': 'Annuler',
  },
  es: {
    'nav.overview': 'Resumen',
    'nav.machines': 'Inventario de máquinas',
    'nav.risks': 'Evaluaciones de riesgos',
    'nav.standards': 'Matriz de normas',
    'nav.technicalFiles': 'Expedientes técnicos',
    'nav.declarations': 'Declaraciones CE',
    'nav.products': 'Productos',
    'nav.recipes': 'Recetas',
    'nav.allergens': 'Control de alérgenos',
    'nav.nutrition': 'Nutrición',
    'nav.approvals': 'Aprobaciones de etiquetas',
    'nav.activity': 'Auditoría',
    'nav.billing': 'Suscripción',
    'nav.settings': 'Equipo y Ajustes',
    'shell.operations': 'Centro de Operaciones CE',
    'shell.governance': 'Gobernanza y Empresa',
    'shell.liveSync': 'Sincronización en vivo',
    'shell.logout': 'Cerrar sesión',
    'common.cancel': 'Cancelar',
  },
  it: {
    'nav.overview': 'Panoramica',
    'nav.machines': 'Inventario macchine',
    'nav.risks': 'Valutazione dei rischi',
    'nav.standards': 'Matrice degli standard',
    'nav.technicalFiles': 'Fascicoli tecnici',
    'nav.declarations': 'Dichiarazioni CE',
    'nav.products': 'Prodotti',
    'nav.recipes': 'Ricette',
    'nav.allergens': 'Controllo allergeni',
    'nav.nutrition': 'Valori nutrizionali',
    'nav.approvals': 'Approvazioni etichette',
    'nav.activity': 'Registro di controllo',
    'nav.billing': 'Abbonamento',
    'nav.settings': 'Team e Impostazioni',
    'shell.operations': 'Centro Operativo CE',
    'shell.governance': 'Governance e Azienda',
    'shell.liveSync': 'Sincronizzazione live',
    'shell.logout': 'Disconnessione sicura',
    'common.cancel': 'Annulla',
  },
  nl: {
    'nav.overview': 'Overzicht',
    'nav.machines': 'Machine-inventaris',
    'nav.risks': 'Risicobeoordelingen',
    'nav.standards': 'Normenmatrix',
    'nav.technicalFiles': 'Technische dossiers',
    'nav.declarations': 'CE-verklaringen',
    'nav.products': 'Producten',
    'nav.recipes': 'Recepturen',
    'nav.allergens': 'Allergenencontrole',
    'nav.nutrition': 'Voedingswaarden',
    'nav.approvals': 'Etiketgoedkeuringen',
    'nav.activity': 'Audittrail',
    'nav.billing': 'Abonnement',
    'nav.settings': 'Team & Instellingen',
    'shell.operations': 'CE-operatiecentrum',
    'shell.governance': 'Governance & Enterprise',
    'shell.liveSync': 'Live synchronisatie',
    'shell.logout': 'Veilig uitloggen',
    'common.cancel': 'Annuleren',
  },
  ar: {
    'nav.overview': 'نظرة عامة',
    'nav.machines': 'جرد الآلات',
    'nav.risks': 'تقييمات المخاطر',
    'nav.standards': 'مصفوفة المعايير',
    'nav.technicalFiles': 'الملفات التقنية',
    'nav.declarations': 'إعلانات المطابقة CE',
    'nav.products': 'المنتجات',
    'nav.recipes': 'الوصفات',
    'nav.allergens': 'مراقبة مسببات الحساسية',
    'nav.nutrition': 'القيم الغذائية',
    'nav.approvals': 'اعتمادات الملصقات',
    'nav.activity': 'سجل التدقيق',
    'nav.billing': 'الاشتراك والفوترة',
    'nav.settings': 'الفريق والإعدادات',
    'shell.operations': 'مركز عمليات CE',
    'shell.governance': 'الحوكمة والمؤسسة',
    'shell.liveSync': 'مزامنة مباشرة',
    'shell.logout': 'تسجيل خروج آمن',
    'common.cancel': 'إلغاء',
  },
};
const DICTS: Record<SupportedLang, Record<string, string>> = {
  tr: TR,
  en: EN,
  de: NAV_TRANSLATIONS.de,
  fr: NAV_TRANSLATIONS.fr,
  es: NAV_TRANSLATIONS.es,
  it: NAV_TRANSLATIONS.it,
  nl: NAV_TRANSLATIONS.nl,
  ar: NAV_TRANSLATIONS.ar,
};
@Injectable({ providedIn: 'root' })
export class I18nStore {
  readonly currentLang = signal<SupportedLang>(this.initial());
  readonly options = LANGUAGES;
  readonly active = computed(
    () => LANGUAGES.find((x) => x.code === this.currentLang()) ?? LANGUAGES[0],
  );
  constructor() {
    queueMicrotask(() => this.applyDocumentState());
  }
  setLanguage(lang: SupportedLang): void {
    this.currentLang.set(lang);
    localStorage.setItem('odivon:preferred_lang', lang);
    this.applyDocumentState();
  }
  t(key: string): string {
    return DICTS[this.currentLang()][key] ?? TR[key] ?? key;
  }
  private initial(): SupportedLang {
    const value = localStorage.getItem('odivon:preferred_lang') as SupportedLang | null;
    return LANGUAGES.some((x) => x.code === value) ? value! : 'tr';
  }
  private applyDocumentState() {
    document.documentElement.lang = this.currentLang();
    document.documentElement.dir = this.active().dir;
    document.documentElement.classList.toggle('rtl', this.active().dir === 'rtl');
  }
}
@Pipe({ name: 't', pure: false })
export class TranslatePipe implements PipeTransform {
  private readonly i18n = inject(I18nStore);
  transform(key: string): string {
    this.i18n.currentLang();
    return this.i18n.t(key);
  }
}
