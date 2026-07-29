import { useEffect } from 'react';

// GA4 Component - Loads Google Analytics 4 when VITE_PUBLIC_GA_ID is configured
// Add to Vercel Dashboard → Settings → Environment Variables:
// Name: VITE_PUBLIC_GA_ID
// Value: G-XXXXXXXXXX (your actual GA4 Measurement ID)

const GA4 = () => {
  useEffect(() => {
    const gaId = import.meta.env.VITE_PUBLIC_GA_ID;
    
    // Only load GA4 if a valid ID is configured
    if (!gaId || gaId === 'G-XXXXXXXXXX' || !gaId.startsWith('G-')) {
      console.log('[Analytics] GA4 not configured - set VITE_PUBLIC_GA_ID environment variable');
      return;
    }

    // Load GA4 script
    const gtmScript = document.createElement('script');
    gtmScript.async = true;
    gtmScript.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    document.head.appendChild(gtmScript);

    // Initialize dataLayer and gtag
    (window as any).dataLayer = (window as any).dataLayer || [];
    
    // Define gtag function
    (window as any).gtag = function gtag(...args: any[]) {
      (window as any).dataLayer.push(args);
    };

    // Initialize GA4
    (window as any).gtag('js', new Date());
    (window as any).gtag('config', gaId, {
      send_page_view: true,
      cookie_flags: 'SameSite=Lax;Secure'
    });

    console.log(`[Analytics] GA4 initialized with ID: ${gaId}`);

    // Cleanup
    return () => {
      const script = document.querySelector(`script[src*="googletagmanager.com"]`);
      if (script) {
        script.remove();
      }
    };
  }, []);

  return null;
};

export default GA4;
