import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import {
  themePresets,
  emojiSets,
  postStyleInfo,
  type ThemeConfig,
  type PostStyle,
  type EmojiSet,
  type Density,
  type Shadow,
  type Animation,
  type HoverEffect
} from '../utils/themePresets';
import { Palette, Sparkles, Image as ImageIcon, Settings } from 'lucide-react';

interface AdvancedThemeCustomizerProps {
  config: ThemeConfig;
  onChange: (config: ThemeConfig) => void;
}

export default function AdvancedThemeCustomizer({ config, onChange }: AdvancedThemeCustomizerProps) {
  const { t, language } = useLanguage();
  const [activeSection, setActiveSection] = useState<'preset' | 'background' | 'header' | 'posts' | 'emoji' | 'animations'>('preset');

  const updateConfig = (path: string[], value: any) => {
    const newConfig = JSON.parse(JSON.stringify(config));
    let current = newConfig;
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
    }
    current[path[path.length - 1]] = value;
    onChange(newConfig);
  };

  const loadPreset = (presetId: string) => {
    const preset = themePresets.find(p => p.id === presetId);
    if (preset) {
      onChange(preset.config);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveSection('preset')}
          className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
            activeSection === 'preset'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          <Palette className="w-4 h-4 inline mr-2" />
          {t('themePreset')}
        </button>
        <button
          onClick={() => setActiveSection('background')}
          className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
            activeSection === 'background'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          <ImageIcon className="w-4 h-4 inline mr-2" />
          {t('background')}
        </button>
        <button
          onClick={() => setActiveSection('header')}
          className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
            activeSection === 'header'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          {t('header')}
        </button>
        <button
          onClick={() => setActiveSection('posts')}
          className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
            activeSection === 'posts'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          {t('posts')}
        </button>
        <button
          onClick={() => setActiveSection('emoji')}
          className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
            activeSection === 'emoji'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          <Sparkles className="w-4 h-4 inline mr-2" />
          {t('emoji')}
        </button>
        <button
          onClick={() => setActiveSection('animations')}
          className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
            activeSection === 'animations'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          <Settings className="w-4 h-4 inline mr-2" />
          {t('animations')}
        </button>
      </div>

      <div className="space-y-4">
        {activeSection === 'preset' && (
          <div className="space-y-4">
            <h3 className="font-bold text-gray-900 dark:text-gray-100">
              {t('selectThemePreset')}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {themePresets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => loadPreset(preset.id)}
                  className="group relative overflow-hidden rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 transition-all"
                >
                  <div
                    className="h-24 w-full"
                    style={{ background: preset.preview }}
                  />
                  <div className="p-3 bg-white dark:bg-gray-800">
                    <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                      {language === 'ru' ? preset.nameRu : preset.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {language === 'ru' ? preset.descriptionRu : preset.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'background' && (
          <div className="space-y-4">
            <h3 className="font-bold text-gray-900 dark:text-gray-100">
              {t('backgroundSettings')}
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('backgroundType')}
              </label>
              <select
                value={config.background.type}
                onChange={(e) => updateConfig(['background', 'type'], e.target.value as 'solid' | 'gradient' | 'animated-gradient')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg"
              >
                <option value="solid">{language === 'ru' ? 'Однотонный' : 'Solid'}</option>
                <option value="gradient">{language === 'ru' ? 'Градиент' : 'Gradient'}</option>
                <option value="animated-gradient">{language === 'ru' ? 'Анимированный градиент' : 'Animated Gradient'}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('lightBackground')}
              </label>
              <input
                type="text"
                value={config.background.light}
                onChange={(e) => updateConfig(['background', 'light'], e.target.value)}
                placeholder="linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg font-mono text-sm"
              />
              <div
                className="mt-2 h-12 rounded border border-gray-300 dark:border-gray-600"
                style={{ background: config.background.light }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('darkBackground')}
              </label>
              <input
                type="text"
                value={config.background.dark}
                onChange={(e) => updateConfig(['background', 'dark'], e.target.value)}
                placeholder="linear-gradient(135deg, #2d1b1b 0%, #3d2525 100%)"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg font-mono text-sm"
              />
              <div
                className="mt-2 h-12 rounded border border-gray-300 dark:border-gray-600"
                style={{ background: config.background.dark }}
              />
            </div>
          </div>
        )}

        {activeSection === 'header' && (
          <div className="space-y-6">
            <div>
              <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-4">
                {t('lightMode')}
              </h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('backgroundColor')}
                  </label>
                  <input
                    type="color"
                    value={config.header.light.bg}
                    onChange={(e) => updateConfig(['header', 'light', 'bg'], e.target.value)}
                    className="w-full h-10 rounded border border-gray-300 dark:border-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('textColor')}
                  </label>
                  <input
                    type="color"
                    value={config.header.light.text}
                    onChange={(e) => updateConfig(['header', 'light', 'text'], e.target.value)}
                    className="w-full h-10 rounded border border-gray-300 dark:border-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('opacity')}: {(config.header.light.bgOpacity * 100).toFixed(0)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={config.header.light.bgOpacity}
                    onChange={(e) => updateConfig(['header', 'light', 'bgOpacity'], parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-4">
                {t('darkMode')}
              </h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('backgroundColor')}
                  </label>
                  <input
                    type="color"
                    value={config.header.dark.bg}
                    onChange={(e) => updateConfig(['header', 'dark', 'bg'], e.target.value)}
                    className="w-full h-10 rounded border border-gray-300 dark:border-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('textColor')}
                  </label>
                  <input
                    type="color"
                    value={config.header.dark.text}
                    onChange={(e) => updateConfig(['header', 'dark', 'text'], e.target.value)}
                    className="w-full h-10 rounded border border-gray-300 dark:border-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('opacity')}: {(config.header.dark.bgOpacity * 100).toFixed(0)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={config.header.dark.bgOpacity}
                    onChange={(e) => updateConfig(['header', 'dark', 'bgOpacity'], parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'posts' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('postStyle')}
              </label>
              <select
                value={config.posts.style}
                onChange={(e) => updateConfig(['posts', 'style'], e.target.value as PostStyle)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg"
              >
                {Object.entries(postStyleInfo).map(([key, info]) => (
                  <option key={key} value={key}>
                    {language === 'ru' ? info.nameRu : info.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('borderRadius')}: {config.posts.borderRadius}px
              </label>
              <input
                type="range"
                min="0"
                max="30"
                value={config.posts.borderRadius}
                onChange={(e) => updateConfig(['posts', 'borderRadius'], parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h4 className="font-bold text-gray-900 dark:text-gray-100">
                {t('lightMode')}
              </h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('backgroundColor')}
                </label>
                <input
                  type="text"
                  value={config.posts.light.bg}
                  onChange={(e) => updateConfig(['posts', 'light', 'bg'], e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg font-mono text-sm"
                />
                <div
                  className="mt-2 h-12 rounded border border-gray-300 dark:border-gray-600"
                  style={{ background: config.posts.light.bg }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('textColor')}
                </label>
                <input
                  type="color"
                  value={config.posts.light.text}
                  onChange={(e) => updateConfig(['posts', 'light', 'text'], e.target.value)}
                  className="w-full h-10 rounded border border-gray-300 dark:border-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('shadow')}
                </label>
                <select
                  value={config.posts.light.shadow}
                  onChange={(e) => updateConfig(['posts', 'light', 'shadow'], e.target.value as Shadow)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg"
                >
                  <option value="none">{language === 'ru' ? 'Нет' : 'None'}</option>
                  <option value="light">{language === 'ru' ? 'Легкая' : 'Light'}</option>
                  <option value="medium">{language === 'ru' ? 'Средняя' : 'Medium'}</option>
                  <option value="strong">{language === 'ru' ? 'Сильная' : 'Strong'}</option>
                </select>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h4 className="font-bold text-gray-900 dark:text-gray-100">
                {t('darkMode')}
              </h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('backgroundColor')}
                </label>
                <input
                  type="text"
                  value={config.posts.dark.bg}
                  onChange={(e) => updateConfig(['posts', 'dark', 'bg'], e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg font-mono text-sm"
                />
                <div
                  className="mt-2 h-12 rounded border border-gray-300 dark:border-gray-600"
                  style={{ background: config.posts.dark.bg }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('textColor')}
                </label>
                <input
                  type="color"
                  value={config.posts.dark.text}
                  onChange={(e) => updateConfig(['posts', 'dark', 'text'], e.target.value)}
                  className="w-full h-10 rounded border border-gray-300 dark:border-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('shadow')}
                </label>
                <select
                  value={config.posts.dark.shadow}
                  onChange={(e) => updateConfig(['posts', 'dark', 'shadow'], e.target.value as Shadow)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg"
                >
                  <option value="none">{language === 'ru' ? 'Нет' : 'None'}</option>
                  <option value="light">{language === 'ru' ? 'Легкая' : 'Light'}</option>
                  <option value="medium">{language === 'ru' ? 'Средняя' : 'Medium'}</option>
                  <option value="strong">{language === 'ru' ? 'Сильная' : 'Strong'}</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'emoji' && (
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.posts.emojiPattern.enabled}
                onChange={(e) => updateConfig(['posts', 'emojiPattern', 'enabled'], e.target.checked)}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {t('enableEmojiPattern')}
              </span>
            </label>

            {config.posts.emojiPattern.enabled && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('emojiSet')}
                  </label>
                  <select
                    value={config.posts.emojiPattern.set}
                    onChange={(e) => {
                      const set = e.target.value as EmojiSet;
                      const newConfig = JSON.parse(JSON.stringify(config));
                      newConfig.posts.emojiPattern.set = set;
                      newConfig.posts.emojiPattern.emojis = emojiSets[set].emojis;
                      onChange(newConfig);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg"
                  >
                    {Object.entries(emojiSets).map(([key, set]) => (
                      <option key={key} value={key}>
                        {language === 'ru' ? set.nameRu : set.name} {set.emojis.join(' ')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('emojiSize')}: {config.posts.emojiPattern.size}px
                  </label>
                  <input
                    type="range"
                    min="24"
                    max="80"
                    value={config.posts.emojiPattern.size}
                    onChange={(e) => updateConfig(['posts', 'emojiPattern', 'size'], parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('opacity')}: {(config.posts.emojiPattern.opacity * 100).toFixed(0)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="0.2"
                    step="0.01"
                    value={config.posts.emojiPattern.opacity}
                    onChange={(e) => updateConfig(['posts', 'emojiPattern', 'opacity'], parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('blur')}: {config.posts.emojiPattern.blur}px
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    value={config.posts.emojiPattern.blur}
                    onChange={(e) => updateConfig(['posts', 'emojiPattern', 'blur'], parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('density')}
                  </label>
                  <select
                    value={config.posts.emojiPattern.density}
                    onChange={(e) => updateConfig(['posts', 'emojiPattern', 'density'], e.target.value as Density)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg"
                  >
                    <option value="low">{language === 'ru' ? 'Низкая' : 'Low'}</option>
                    <option value="medium">{language === 'ru' ? 'Средняя' : 'Medium'}</option>
                    <option value="high">{language === 'ru' ? 'Высокая' : 'High'}</option>
                  </select>
                </div>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.posts.emojiPattern.rotation}
                    onChange={(e) => updateConfig(['posts', 'emojiPattern', 'rotation'], e.target.checked)}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {t('randomRotation')}
                  </span>
                </label>
              </>
            )}
          </div>
        )}

        {activeSection === 'animations' && (
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.animations.enabled}
                onChange={(e) => updateConfig(['animations', 'enabled'], e.target.checked)}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {t('enableAnimations')}
              </span>
            </label>

            {config.animations.enabled && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('postAppearAnimation')}
                  </label>
                  <select
                    value={config.animations.postAppear}
                    onChange={(e) => updateConfig(['animations', 'postAppear'], e.target.value as Animation)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg"
                  >
                    <option value="none">{language === 'ru' ? 'Нет' : 'None'}</option>
                    <option value="fade">{language === 'ru' ? 'Затухание' : 'Fade'}</option>
                    <option value="slide">{language === 'ru' ? 'Скольжение' : 'Slide'}</option>
                    <option value="fade-slide">{language === 'ru' ? 'Затухание + Скольжение' : 'Fade + Slide'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('hoverEffect')}
                  </label>
                  <select
                    value={config.animations.hoverEffect}
                    onChange={(e) => updateConfig(['animations', 'hoverEffect'], e.target.value as HoverEffect)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg"
                  >
                    <option value="none">{language === 'ru' ? 'Нет' : 'None'}</option>
                    <option value="lift">{language === 'ru' ? 'Подъем' : 'Lift'}</option>
                    <option value="glow">{language === 'ru' ? 'Свечение' : 'Glow'}</option>
                    <option value="scale">{language === 'ru' ? 'Масштаб' : 'Scale'}</option>
                  </select>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
