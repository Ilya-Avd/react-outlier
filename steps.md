Init project: package.json, TypeScript, Vite library mode
Core hook: basic useClickOutside with cleanup
Portal support — composedPath() instead of contains(), so nodes from portals are visible
ignore option — list of elements/refs that don't trigger "outside" (a menu's trigger button)
Escape key — keydown handler for Escape
Touch/mobile — touchstart with { passive: true }, correct ordering relative to mousedown
Shadow DOM / iframe — rootNodes option for non-standard roots
Demo app — live testing of every case in the browser
Tests — vitest + @testing-library/react, covering every case
Build-ready — exports in package.json, types, final README
