import React from 'react';
import { X, Command, Keyboard } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ onClose }) => {
  const shortcuts = [
    { key: 'Space', action: 'Play / Pause stream' },
    { key: 'J / ←', action: 'Seek backward 5 seconds' },
    { key: 'L / →', action: 'Seek forward 5 seconds' },
    { key: 'M', action: 'Mute / Unmute audio' },
    { key: '↑ / ↓', action: 'Increase / Decrease volume' },
    { key: 'F', action: 'Toggle Full Screen Visualizer' },
    { key: 'Q', action: 'Toggle Playback Queue' },
    { key: '/', action: 'Focus Global Search Bar' },
    { key: 'Esc', action: 'Close modals / full-screen player' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl text-slate-900 dark:text-slate-100 transition-colors">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">Keyboard Shortcuts</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-2">
          {shortcuts.map((s, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/60 text-xs"
            >
              <span className="text-slate-700 dark:text-slate-300 font-medium">{s.action}</span>
              <kbd className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-emerald-700 dark:text-emerald-400 font-mono text-[11px] font-bold shadow-xs">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="p-3.5 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 text-center font-mono">
          Accessible Audio Keyboard Navigation Enabled
        </div>
      </div>
    </div>
  );
};
