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
    // Evitar duplicar el script si ya fue cargado
    if (document.getElementById('google-translate-script')) return;

    window.googleTranslateElementInit = () => {
      new window.google.translate.TranslateElement(
        {
          pageLanguage: 'es', // Idioma base en el que está desarrollada tu app
          includedLanguages: 'en,es,fr', // Idiomas permitidos (Español, Inglés, Francés, etc.)
          layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
          autoDisplay: false,
        },
        'google_translate_element'
      );
    };

    const script = document.createElement('script');
    script.id = 'google-translate-script';
    script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return (
    <div className="flex items-center">
      {/* Contenedor donde aparecerá el selector de Google */}
      <div id="google_translate_element"></div>
    </div>
  );
};