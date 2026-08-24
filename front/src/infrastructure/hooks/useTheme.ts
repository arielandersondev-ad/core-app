import { useState, useEffect } from 'react';

export function useTheme() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    // Leer el estado actual del documento (lo establece el script en layout)
    const isDark = document.documentElement.classList.contains('dark');
    setDark(isDark);

    const observer = new MutationObserver(() => {
      const isDarkNow = document.documentElement.classList.contains('dark');
      setDark(isDarkNow);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

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