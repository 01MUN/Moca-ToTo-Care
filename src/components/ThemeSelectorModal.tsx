import React from 'react';
import { ThemeOption, ThemeId } from '../types';
import { motion } from 'motion/react';
import { Palette, X, Check, Sparkles } from 'lucide-react';

interface ThemeSelectorModalProps {
  themes: ThemeOption[];
  activeThemeId: ThemeId;
  onSelectTheme: (themeId: ThemeId) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const ThemeSelectorModal: React.FC<ThemeSelectorModalProps> = ({
  themes,
  activeThemeId,
  onSelectTheme,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto border border-stone-200"
      >
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-100 text-[#8B5E3C]">
              <Palette className="w-4 h-4 text-amber-600" />
            </span>
            <div>
              <h3 className="text-sm font-extrabold text-stone-900">
                개인화 화면 테마 설정
              </h3>
              <p className="text-[10px] text-stone-400">선택한 분위기로 전체 앱 감성이 변경됩니다</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-stone-100 text-stone-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2.5">
          {themes.map((theme) => {
            const isSelected = theme.id === activeThemeId;
            return (
              <motion.button
                key={theme.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  onSelectTheme(theme.id);
                  onClose();
                }}
                className={`w-full p-3.5 rounded-2xl border text-left flex items-start justify-between gap-3 transition-all ${
                  isSelected
                    ? 'bg-amber-50/80 border-[#8B5E3C] shadow-md ring-2 ring-[#8B5E3C]/20'
                    : 'bg-stone-50/70 border-stone-200 hover:bg-stone-100'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-stone-900">{theme.name}</span>
                    {isSelected && (
                      <span className="text-[9px] bg-[#8B5E3C] text-white px-2 py-0.5 rounded-full font-bold">
                        적용 중
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-stone-500 mt-1 leading-normal">{theme.description}</p>
                </div>

                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border ${
                    isSelected ? 'bg-[#8B5E3C] text-white border-[#8B5E3C]' : 'border-stone-300 bg-white'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
                </div>
              </motion.button>
            );
          })}
        </div>

      </motion.div>
    </div>
  );
};
