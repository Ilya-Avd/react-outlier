Init project: package.json, TypeScript, Vite library mode
Core hook: базовый useClickOutside с cleanup
Portal support — composedPath() вместо contains(), чтобы видеть узлы из порталов
ignore option — список элементов/рефов, которые не триггерят "снаружи" (кнопка-триггер меню)
Escape key — keydown обработчик на Escape
Touch/mobile — touchstart с { passive: true }, правильный порядок относительно mousedown
Shadow DOM / iframe — опция rootNodes для нестандартных корней
Demo app — живое тестирование всех кейсов в браузере
Tests — vitest + @testing-library/react, покрытие всех кейсов
Build-ready — exports в package.json, типы, финальный README