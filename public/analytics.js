// Google Analytics 4 (gtag.js). Kept as a same-origin file so the strict CSP needs no 'unsafe-inline'.
// SPA page views are sent automatically by GA4 enhanced measurement (browser history changes).
window.dataLayer = window.dataLayer || [];
function gtag() {
  window.dataLayer.push(arguments);
}
window.gtag = gtag;
gtag('js', new Date());
gtag('config', 'G-Z68HVJGM94', { anonymize_ip: true });
