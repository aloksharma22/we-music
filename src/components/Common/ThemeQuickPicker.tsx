import React, { useState, useRef, useEffect } from 'react';
import { Palette, Check, Sparkles, ChevronDown } from 'lucide-react';
import { ThemeId } from '../../types';
import { THEME_PALETTES, getTheme } from '../../services/themeService';

interface ThemeQuickPickerProps {
  currentThemeId: ThemeId;
  onSelectTheme: (id: ThemeId) => void;
  onOpenFullGallery?: () => void;
}

export const ThemeQuickPicker: React.FC<ThemeQuickPickerProps> = ({
  currentThemeId,
  onSelectTheme,
  onOpenFullGallery,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const currentTheme = getTheme(currentThemeId);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const darkPalettes = THEME_PALETTES.filter((t) => t.mode === 'dark');
  const lightPalettes = THEME_PALETTES.filter((t) => t.mode === 'light');

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button: Rich swatch + theme name + dropdown chevron */}
      <button
        type="button"
        id="theme-quick-picker-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold transition cursor-pointer shadow-xs"
        title={`Choose a Color Palette (${THEME_PALETTES.length} Aesthetics: ${darkPalettes.length} Dark, ${lightPalettes.length} Light)`}
      >
        {/* Dual-color indicator dot */}
        <span className="relative flex h-3.5 w-3.5 rounded-full overflow-hidden shrink-0 ring-1 ring-slate-300 dark:ring-slate-700">
          <span
            className="w-1/2 h-full"
            style={{ backgroundColor: currentTheme.accentHex }}
          />
          <span
            className="w-1/2 h-full"
            style={{ backgroundColor: currentTheme.secondaryHex }}
          />
        </span>

        <span className="hidden md:inline truncate max-w-[100px] text-left">
          {currentTheme.name}
        </span>

        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-2.5 z-50 animate-fade-in backdrop-blur-xl">
          {/* Header */}
          <div className="flex items-center justify-between px-2.5 py-2 border-b border-slate-100 dark:border-slate-800/80 mb-2">
            <div className="flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                Color Themes
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {THEME_PALETTES.length} Aesthetics
            </span>
          </div>

          <div className="max-h-80 overflow-y-auto space-y-3 px-1 pr-1.5">
            {/* Dark Themes Group */}
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold px-2 block mb-1">
                Dark & Night Themes ({darkPalettes.length})
              </span>
              <div className="space-y-1">
                {darkPalettes.map((theme) => {
                  const isSelected = theme.id === currentThemeId;
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => {
                        onSelectTheme(theme.id);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition cursor-pointer border ${
                        isSelected
                          ? 'bg-slate-100 dark:bg-slate-800/90 border-slate-300 dark:border-slate-700 shadow-xs'
                          : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Swatch circle */}
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 shadow-xs ring-1 ring-slate-200 dark:ring-slate-700"
                          style={{
                            background: `linear-gradient(135deg, ${theme.accentHex} 0%, ${theme.secondaryHex} 100%)`,
                          }}
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate leading-tight">
                            {theme.name}
                          </p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                            {theme.genreMatch}
                          </p>
                        </div>
                      </div>

                      {isSelected && (
                        <span
                          className="p-1 rounded-full text-slate-950 flex items-center justify-center shrink-0 shadow-xs"
                          style={{ backgroundColor: theme.accentHex }}
                        >
                          <Check className="w-3 h-3 stroke-[3]" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Light Themes Group */}
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold px-2 block mb-1">
                Daylight & Clean Studio ({lightPalettes.length})
              </span>
              <div className="space-y-1">
                {lightPalettes.map((theme) => {
                  const isSelected = theme.id === currentThemeId;
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => {
                        onSelectTheme(theme.id);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition cursor-pointer border ${
                        isSelected
                          ? 'bg-slate-100 dark:bg-slate-800/90 border-slate-300 dark:border-slate-700 shadow-xs'
                          : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 shadow-xs ring-1 ring-slate-300"
                          style={{
                            background: `linear-gradient(135deg, ${theme.accentHex} 0%, ${theme.secondaryHex} 100%)`,
                          }}
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate leading-tight">
                            {theme.name}
                          </p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                            {theme.genreMatch}
                          </p>
                        </div>
                      </div>

                      {isSelected && (
                        <span
                          className="p-1 rounded-full text-white flex items-center justify-center shrink-0 shadow-xs"
                          style={{ backgroundColor: theme.accentHex }}
                        >
                          <Check className="w-3 h-3 stroke-[3]" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer link to full gallery */}
          {onOpenFullGallery && (
            <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800/80">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenFullGallery();
                }}
                className="w-full py-1.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Open Theme Studio Gallery</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
