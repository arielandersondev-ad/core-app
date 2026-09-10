import { useState, useEffect } from 'react';

export function useTheme() {
  // Inicialización perezosa: solo se ejecuta en el cliente
  const [dark, setDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    return document.documentElement.classList.contains('dark');
  });

  useEffect(() => {
    // Solo observar cambios en la clase 'dark' (por si cambia desde fuera)
    const observer = new MutationObserver(() => {
      const isDarkNow = document.documentElement.classList.contains('dark');
      setDark(isDarkNow);
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  const toggleDark = () => {
    const newDark = !dark;
    document.documentElement.classList.toggle('dark', newDark);
    localStorage.setItem('theme', newDark ? 'dark' : 'light');
    setDark(newDark);
  };

  return { dark, toggleDark };
}