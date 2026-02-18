import { useLanguage } from '../contexts/LanguageContext';
import { Globe } from 'lucide-react';

export default function LanguageSelector() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2">
      <Globe className="w-4 h-4 text-gray-600 dark:text-gray-400" />
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as 'ru' | 'en')}
        className="bg-transparent text-sm text-gray-900 dark:text-gray-100 border-none focus:ring-0 cursor-pointer"
      >
        <option value="ru">Русский</option>
        <option value="en">English</option>
      </select>
    </div>
  );
}
