# OdivonMachineCE

Odivon'un 2006/42/EC ve AB 2023/1230 kapsamındaki Makine Emniyeti, EN ISO 12100 Risk Değerlendirmesi, Teknik Dosya ve CE Uygunluk Beyanı yönetim platformudur. Angular 22, Signals, Tailwind CSS 4 ve Odivon UI Design System ile geliştirilir.

## Yerel geliştirme

```bash
npm install
npm start
```

MainAPI adresi ve Firebase web istemci ayarları `src/environments/environment.ts` ve `public/runtime-config.js` içinde yerel/deployment ortamına göre sağlanır. Bu repoya service-account veya production credential eklenmez.

## Doğrulama

```bash
npm run check
```

İş verisi yalnız `/api/v1/machine-ce` MainAPI alanından alınır. Firebase yalnız Auth ve App Check için kullanılır.

## Lisans

Bu projeye açık kaynak lisansı verilmemiştir. Tüm hakları saklıdır.
