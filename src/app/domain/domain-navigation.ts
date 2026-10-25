export interface DomainNavigationItem {
  readonly key: string;
  readonly path: string;
  readonly icon: string;
  readonly label: string;
  readonly title: string;
  readonly description: string;
}

export const PRODUCT_NAVIGATION: readonly DomainNavigationItem[] = [
  {
    key: 'machines',
    path: 'machines',
    icon: 'precision_manufacturing',
    label: 'Makine Envanteri',
    title: 'Makine Envanteri',
    description: 'Makine, hat ve güvenlik bileşenlerini teknik kimlikleriyle yönetin.',
  },
  {
    key: 'risks',
    path: 'risk-assessments',
    icon: 'health_and_safety',
    label: 'Risk Değerlendirmeleri',
    title: 'Risk Değerlendirmeleri',
    description: 'Tehlikeleri, risk skorlarını ve koruyucu önlemleri izlenebilir biçimde yönetin.',
  },
  {
    key: 'standards',
    path: 'standards',
    icon: 'rule',
    label: 'Standart Matrisi',
    title: 'Standart ve Gereklilik Matrisi',
    description: 'Uygulanabilir direktif, yönetmelik ve harmonize standartları eşleştirin.',
  },
  {
    key: 'technical-files',
    path: 'technical-files',
    icon: 'folder_managed',
    label: 'Teknik Dosyalar',
    title: 'Teknik Dosya Yönetimi',
    description: 'Çizim, hesap, test ve kullanım talimatlarını sürüm kontrollü saklayın.',
  },
  {
    key: 'declarations',
    path: 'declarations',
    icon: 'verified',
    label: 'Uygunluk Beyanları',
    title: 'Uygunluk Beyanları ve CE',
    description: 'Uygunluk beyanlarını, onayları ve CE işaretleme kanıtlarını yönetin.',
  },
];
