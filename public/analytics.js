(function scheduleEstateNestAnalytics(windowObject, documentObject) {
  function initializeEstateNestAnalytics() {
  windowObject.dataLayer = windowObject.dataLayer || [];
  windowObject.gtag = windowObject.gtag || function gtag() {
    windowObject.dataLayer.push(arguments);
  };
  windowObject.gtag('js', new Date());
  windowObject.gtag('config', 'G-20HKYHFVLK', { anonymize_ip: true });

  var googleAnalyticsScript = documentObject.createElement('script');
  googleAnalyticsScript.async = true;
  googleAnalyticsScript.src = 'https://www.googletagmanager.com/gtag/js?id=G-20HKYHFVLK';
  documentObject.head.appendChild(googleAnalyticsScript);

  windowObject.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
  var googleTagManagerScript = documentObject.createElement('script');
  googleTagManagerScript.async = true;
  googleTagManagerScript.src = 'https://www.googletagmanager.com/gtm.js?id=GTM-MMQH7HJ';
  documentObject.head.appendChild(googleTagManagerScript);

  windowObject.clarity = windowObject.clarity || function clarity() {
    (windowObject.clarity.q = windowObject.clarity.q || []).push(arguments);
  };
  var clarityScript = documentObject.createElement('script');
  clarityScript.async = true;
  clarityScript.src = 'https://www.clarity.ms/tag/68cnkf1i9n';
  documentObject.head.appendChild(clarityScript);
  }

  if ('requestIdleCallback' in windowObject) {
    windowObject.requestIdleCallback(initializeEstateNestAnalytics, { timeout: 2000 });
  } else {
    windowObject.addEventListener('load', initializeEstateNestAnalytics, { once: true });
  }
})(window, document);
