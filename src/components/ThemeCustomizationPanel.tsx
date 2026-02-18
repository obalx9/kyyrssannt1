import { useState } from 'react';
import { Palette, Layout, Sparkles, Sun, Moon } from 'lucide-react';
import {
  themePresets,
  emojiSets,
  postStyleInfo,
  type ThemeConfig,
  type PostStyle,
  type EmojiSet,
  type Density
} from '../utils/themePresets';
import PostStylePreview from './PostStylePreview';
import { useLanguage } from '../contexts/LanguageContext';

interface ThemeCustomizationPanelProps {
  themePreset: string;
  onThemePresetChange: (presetId: string) => void;
}

type CustomizationTab = 'preset' | 'postStyle' | 'emoji';

export default function ThemeCustomizationPanel({
  themePreset,
  onThemePresetChange
}: ThemeCustomizationPanelProps) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<CustomizationTab>('preset');
  const [previewMode, setPreviewMode] = useState<'light' | 'dark'>('light');

  const currentPreset = themePresets.find(p => p.id === themePreset) || themePresets[0];
  const currentConfig = currentPreset.config;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Palette className="w-5 h-5" />
          {t('themeCustomization')}
        </h3>
        <div className="flex items-center gap-2 text-xs bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => setPreviewMode('light')}
            className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
              previewMode === 'light'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            <Sun className="w-3 h-3" />
            {t('light')}
          </button>
          <button
            onClick={() => setPreviewMode('dark')}
            className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
              previewMode === 'dark'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            <Moon className="w-3 h-3" />
            {t('dark')}
          </button>
        </div>
      </div>

      <div className="border-b border-gray-200 dark:border-gray-700 mb-4">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('preset')}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === 'preset'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            <Palette className="w-4 h-4" />
            {t('presets')}
          </button>
          <button
            onClick={() => setActiveTab('postStyle')}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === 'postStyle'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            <Layout className="w-4 h-4" />
            {t('postStyle')}
          </button>
          <button
            onClick={() => setActiveTab('emoji')}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === 'emoji'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            {t('emojiPattern')}
          </button>
        </div>
      </div>

      {activeTab === 'preset' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('choosePresetDesc')}
          </p>
          <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
            {themePresets.map((preset) => {
              const previewBg = previewMode === 'dark'
                ? preset.config.background.dark
                : preset.config.background.light;

              return (
                <button
                  key={preset.id}
                  onClick={() => onThemePresetChange(preset.id)}
                  className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                    themePreset === preset.id
                      ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div
                    className="h-20 w-full"
                    style={{ background: previewBg }}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all" />
                  <div className="p-2 bg-white dark:bg-gray-800">
                    <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                      {t('language') === 'ru' ? preset.nameRu : preset.name}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
          {themePreset && (
            <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {t('language') === 'ru' ? currentPreset.descriptionRu : currentPreset.description}
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'postStyle' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('postStyleDesc')}: <span className="font-medium">
              {t('language') === 'ru'
                ? postStyleInfo[currentConfig.posts.style].nameRu
                : postStyleInfo[currentConfig.posts.style].name}
            </span>
          </p>
          <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto pr-2">
            {Object.entries(postStyleInfo).map(([styleId, info]) => {
              const style = styleId as PostStyle;
              const theme = previewMode === 'light'
                ? currentConfig.posts.light
                : currentConfig.posts.dark;

              return (
                <div key={style} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                        {t('language') === 'ru' ? info.nameRu : info.name}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {t('language') === 'ru' ? info.descriptionRu : info.description}
                      </div>
                    </div>
                    {currentConfig.posts.style === style && (
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded">
                        {t('active')}
                      </span>
                    )}
                  </div>
                  <PostStylePreview
                    style={style}
                    theme={theme}
                    borderRadius={currentConfig.posts.borderRadius}
                    isDark={previewMode === 'dark'}
                  />
                </div>
              );
            })}
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-xs text-blue-600 dark:text-blue-400">
              {t('postStyleNote')}
            </p>
          </div>
        </div>
      )}

      {activeTab === 'emoji' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('emojiPatternDesc')}
            </p>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={currentConfig.posts.emojiPattern.enabled}
                disabled
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {t('enabled')}
              </span>
            </label>
          </div>

          {currentConfig.posts.emojiPattern.enabled ? (
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('currentPattern')}:
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex gap-1 text-2xl">
                      {currentConfig.posts.emojiPattern.emojis.map((emoji, i) => (
                        <span key={i}>{emoji}</span>
                      ))}
                    </div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {t('language') === 'ru'
                        ? emojiSets[currentConfig.posts.emojiPattern.set].nameRu
                        : emojiSets[currentConfig.posts.emojiPattern.set].name}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <div>
                      <span className="font-medium">{t('density')}:</span> {
                        currentConfig.posts.emojiPattern.density === 'low' ? (t('low')) :
                        currentConfig.posts.emojiPattern.density === 'medium' ? (t('medium')) :
                        (t('high'))
                      }
                    </div>
                    <div>
                      <span className="font-medium">{t('opacity')}:</span> {
                        (currentConfig.posts.emojiPattern.opacity * 100).toFixed(0)
                      }%
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('availablePatterns')}:
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                  {Object.entries(emojiSets).map(([setId, setInfo]) => (
                    <div
                      key={setId}
                      className={`p-3 rounded-lg border-2 transition-colors ${
                        currentConfig.posts.emojiPattern.set === setId
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30'
                      }`}
                    >
                      <div className="flex gap-1 text-lg mb-1">
                        {setInfo.emojis.slice(0, 3).map((emoji, i) => (
                          <span key={i}>{emoji}</span>
                        ))}
                      </div>
                      <div className="text-xs font-medium text-gray-900 dark:text-gray-100">
                        {t('language') === 'ru' ? setInfo.nameRu : setInfo.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {t('emojiDisabled')}
            </div>
          )}

          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-xs text-blue-600 dark:text-blue-400">
              {t('emojiNote')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
