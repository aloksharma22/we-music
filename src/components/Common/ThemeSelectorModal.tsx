import React, { useState } from 'react';
import { X, Check, Palette, Sparkles, Sun, Moon, Layers } from 'lucide-react';
import { ThemeId, ThemePalette } from '../../types';
import { THEME_PALETTES, applyThemeToDOM, saveStoredTheme } from '../../services/themeService';

interface ThemeSelectorModalProps {
  currentThemeId: ThemeId;
  isOpen: boolean;
  onClose: () => void;
  onSelectTheme: (id: ThemeId) => void;
}

type FilterMode = 'all' | 'light' | 'dark';

export const ThemeSelectorModal: React.FC<ThemeSelectorModalProps> = ({
  currentThemeId,
  isOpen,
  onClose,
  onSelectTheme,
}) => {
  const [filterMode, setFilterMode] = useState<FilterMode>('all');

  if (!isOpen) return null;

  const handleChoose = (id: ThemeId) => {
    onSelectTheme(id);
    saveStoredTheme(id);
    applyThemeToDOM(id);
  };

  const filteredPalettes = THEME_PALETTES.filter((theme) => {
    if (filterMode === 'all') return true;
    return theme.mode === filterMode;
  });

  const lightCount = THEME_PALETTES.filter((t) => t.mode === 'light').length;
  const darkCount = THEME_PALETTES.filter((t) => t.mode === 'dark').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div
        className="bg-slate-900 border border-slate-800 text-white rounded-2xl w-full max-w-4xl h-[85vh] max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-800 bg-slate-950 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-emerald-500 via-amber-500 to-sky-500 flex items-center justify-center text-white shadow-md shrink-0">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                Supreme Artist Color Modes
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                  2 Modes
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Studio Emerald (Dark Mode) &amp; Clean Light Studio (Light Mode).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800/80 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Navigation Tabs */}
        <div className="flex items-center gap-2 px-5 sm:px-6 py-3 border-b border-slate-800 bg-slate-950/60 shrink-0">
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              filterMode === 'all'
                ? 'bg-slate-800 text-white border border-slate-700 shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>All Themes ({THEME_PALETTES.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('light')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              filterMode === 'light'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Sun className="w-3.5 h-3.5 text-amber-400" />
            <span>Light Modes ({lightCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('dark')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              filterMode === 'dark'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Moon className="w-3.5 h-3.5 text-indigo-400" />
            <span>Dark Modes ({darkCount})</span>
          </button>
        </div>

        {/* Theme Grid */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {filteredPalettes.map((theme: ThemePalette) => {
            const isSelected = currentThemeId === theme.id;
            return (
              <div
                key={theme.id}
                onClick={() => handleChoose(theme.id)}
                className={`relative rounded-xl p-3.5 sm:p-4 border transition-all cursor-pointer text-left group flex flex-col justify-between ${
                  isSelected
                    ? 'border-emerald-500 bg-slate-800/95 shadow-xl ring-2 ring-emerald-500/30'
                    : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-900'
                }`}
                style={{
                  borderLeftColor: theme.accentHex,
                  borderLeftWidth: '4px',
                }}
              >
                <div>
                  {/* Header info */}
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white group-hover:text-emerald-300 transition">
                        {theme.name}
                      </span>
                      {theme.mode === 'light' ? (
                        <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                          <Sun className="w-2.5 h-2.5" /> Light
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
                          <Moon className="w-2.5 h-2.5" /> Dark
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0 shadow-xs">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 mb-2 leading-relaxed line-clamp-2">
                    {theme.tagline}
                  </p>

                  {/* Genre Match */}
                  <div className="text-[11px] text-slate-400 font-mono mb-2.5 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-slate-500" />
                    <span>{theme.genreMatch}</span>
                  </div>
                </div>

                {/* Interactive Palette Swatch Preview */}
                <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-3 shrink-0">
                  <div
                    className="flex items-center gap-1.5 px-2 py-1 rounded-md border text-[10px] font-mono"
                    style={{
                      backgroundColor: theme.bgHex,
                      borderColor: theme.borderHex,
                      color: theme.textHex,
                    }}
                    title="Simulated Canvas & Surfaces"
                  >
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: theme.accentHex }}
                      title="Accent Primary"
                    />
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: theme.secondaryHex }}
                      title="Accent Secondary"
                    />
                    <div
                      className="px-1.5 py-0.5 rounded text-[9px] border"
                      style={{
                        backgroundColor: theme.cardHex || theme.surfaceHex,
                        borderColor: theme.borderHex,
                        color: theme.textHex,
                      }}
                    >
                      Card
                    </div>
                  </div>

                  <div>
                    <span
                      className={`text-[11px] font-medium px-2.5 py-1 rounded-lg ${
                        isSelected
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'text-slate-400 group-hover:text-white'
                      }`}
                    >
                      {isSelected ? 'Active' : 'Apply'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span className="truncate pr-2">Themes instantly transform waveforms, canvas backgrounds, surfaces, and glass layers.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition cursor-pointer shrink-0 shadow-md shadow-emerald-500/20"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
