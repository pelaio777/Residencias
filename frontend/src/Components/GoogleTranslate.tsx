// frontend/src/Components/GoogleTranslate.tsx
import React, { useEffect } from 'react';

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: any;
  }
}

export const GoogleTranslate: React.FC = () => {
  useEffect(() => {
    const initTranslate = () => {
      if (window.google && window.google.translate && window.google.translate.TranslateElement) {
        const container = document.getElementById('google_translate_element');
        if (container && !container.hasChildNodes()) {
          new window.google.translate.TranslateElement(
            {
              pageLanguage: 'es',
              includedLanguages: 'en,es,fr',
              layout: window.google.translate.TranslateElement.InlineLayout.HORIZONTAL,
              autoDisplay: false,
            },
            'google_translate_element'
          );
        }
      }
    };

    window.googleTranslateElementInit = initTranslate;

    // Cargar script de Google Translate solo si no existe
    if (!document.getElementById('google-translate-script')) {
      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);
    } else {
      initTranslate();
    }

    // Suprimir de forma activa la barra superior y cualquier desplazamiento del body
    const cleanupBanner = () => {
      if (document.body.style.top && document.body.style.top !== '0px') {
        document.body.style.top = '0px';
      }
      if (document.body.style.position && document.body.style.position !== 'static') {
        document.body.style.position = 'static';
      }
      const banner = document.querySelector('.goog-te-banner-frame') as HTMLElement | null;
      if (banner) {
        banner.style.display = 'none';
        banner.style.visibility = 'hidden';
      }
    };

    const observer = new MutationObserver(cleanupBanner);
    observer.observe(document.body, { attributes: true, attributeFilter: ['style', 'class'] });

    const interval = setInterval(cleanupBanner, 300);

    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, []);

  return (
    <div id="google_translate_element" className="w-full"></div>
  );
};

export default GoogleTranslate;