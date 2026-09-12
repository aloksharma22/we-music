import { ThemePalette, ThemeId } from '../types';

export const THEME_PALETTES: ThemePalette[] = [
  // --- STUDIO EMERALD (DEFAULT DARK MODE) ---
  {
    id: 'emerald',
    name: 'Studio Emerald',
    tagline: 'Deep evergreen obsidian with luminous forest emerald & mint accents',
    genreMatch: 'Studio Emerald Dark Mode',
    mode: 'dark',
    accentHex: '#10b981',
    secondaryHex: '#34d399',
    bgHex: '#06120b',
    surfaceHex: '#0d1e15',
    cardHex: '#132a1e',
    borderHex: '#1e3e2c',
    textHex: '#f0fdf4',
    mutedHex: '#86efac',
    previewGradient: 'from-emerald-500 to-teal-600',
  },

  // --- CLEAN LIGHT STUDIO (STANDARD LIGHT MODE) ---
  {
    id: 'light_studio',
    name: 'Clean Light Studio',
    tagline: 'Pure porcelain white gallery canvas with crisp typography & vivid emerald accents',
    genreMatch: 'Studio Light Mode',
    mode: 'light',
    accentHex: '#10b981',
    secondaryHex: '#059669',
    bgHex: '#ffffff',
    surfaceHex: '#ffffff',
    cardHex: '#ffffff',
    borderHex: '#e2e8f0',
    textHex: '#0f172a',
    mutedHex: '#64748b',
    previewGradient: 'from-emerald-500 to-teal-600',
  },
];

const STORAGE_KEY_THEME = 'your_melody_artist_theme';

export const getTheme = (id: ThemeId): ThemePalette => {
  return THEME_PALETTES.find((t) => t.id === id) || THEME_PALETTES[0];
};

export const loadStoredTheme = (): ThemeId => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_THEME) as ThemeId;
    if (saved && THEME_PALETTES.some((t) => t.id === saved)) {
      return saved;
    }
  } catch {
    // fallback
  }
  return 'emerald';
};

export const saveStoredTheme = (id: ThemeId): void => {
  try {
    localStorage.setItem(STORAGE_KEY_THEME, id);
  } catch (e) {
    console.error('Failed to save theme:', e);
  }
};

export const applyThemeToDOM = (id: ThemeId): void => {
  const theme = getTheme(id);
  const root = document.documentElement;

  // Set CSS variables
  root.style.setProperty('--theme-accent', theme.accentHex);
  root.style.setProperty('--theme-secondary', theme.secondaryHex);
  root.style.setProperty('--theme-bg', theme.bgHex);
  root.style.setProperty('--theme-surface', theme.surfaceHex);
  root.style.setProperty('--theme-card', theme.cardHex || theme.surfaceHex);
  root.style.setProperty('--theme-border', theme.borderHex);
  root.style.setProperty('--theme-text', theme.textHex);
  root.style.setProperty('--theme-muted', theme.mutedHex);

  // Set light/dark class
  if (theme.mode === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  // Set data-theme and data-theme-mode attributes
  root.setAttribute('data-theme', theme.id);
  root.setAttribute('data-theme-mode', theme.mode);
};
