import { useState, useEffect } from 'react';
import { Shield, X, AlertTriangle } from 'lucide-react';

interface ContentProtectionWarningProps {
  courseName: string;
}

export default function ContentProtectionWarning({ courseName }: ContentProtectionWarningProps) {
  const [isVisible, setIsVisible] = useState(false);
  const storageKey = `protection-warning-shown-${courseName}`;

  useEffect(() => {
    const hasSeenWarning = localStorage.getItem(storageKey);
    if (!hasSeenWarning) {
      setTimeout(() => setIsVisible(true), 1000);
    }
  }, [storageKey]);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem(storageKey, 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-gradient-to-br from-red-600 to-red-800 rounded-2xl shadow-2xl max-w-2xl w-full p-8 relative animate-scale-in border-4 border-red-400">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <X className="w-6 h-6 text-white" />
        </button>

        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white">ЗАЩИТА КОНТЕНТА</h2>
            <p className="text-red-100 text-sm mt-1">Важная информация</p>
          </div>
        </div>

        <div className="bg-white/10 rounded-xl p-6 mb-6 backdrop-blur-sm">
          <div className="flex items-start gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-yellow-300 flex-shrink-0 mt-1" />
            <div className="text-white">
              <p className="font-semibold text-lg mb-2">ПРЕДУПРЕЖДЕНИЕ О ЗАЩИТЕ АВТОРСКИХ ПРАВ</p>
              <p className="text-red-100 leading-relaxed">
                Весь контент данного курса защищен водяными знаками с вашими персональными данными.
                Любая попытка копирования, распространения или перепродажи материалов будет отслеживаться.
              </p>
            </div>
          </div>

          <div className="border-t border-white/20 pt-4 mt-4">
            <p className="text-white font-semibold mb-3">Последствия нарушения:</p>
            <ul className="space-y-2 text-red-100">
              <li className="flex items-start gap-2">
                <span className="text-yellow-300 font-bold mt-0.5">•</span>
                <span>Немедленная блокировка доступа к курсу без возврата средств</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-300 font-bold mt-0.5">•</span>
                <span>Административная и уголовная ответственность за нарушение авторских прав</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-300 font-bold mt-0.5">•</span>
                <span>Взыскание материального ущерба и компенсации правообладателю</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-300 font-bold mt-0.5">•</span>
                <span>Внесение в черный список с запретом покупки других курсов</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="bg-white/10 rounded-xl p-4 mb-6 backdrop-blur-sm">
          <p className="text-white text-sm leading-relaxed">
            <span className="font-semibold">Система защиты:</span> Все видео и изображения содержат ваши
            персональные водяные знаки. Включена защита от скриншотов и записи экрана.
            При обнаружении попыток копирования или открытия инструментов разработчика система
            автоматически фиксирует нарушение.
          </p>
        </div>

        <button
          onClick={handleClose}
          className="w-full bg-white hover:bg-gray-100 text-red-700 font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
        >
          Я понимаю и принимаю условия
        </button>

        <p className="text-center text-red-100 text-xs mt-4 opacity-80">
          Продолжая использование курса, вы соглашаетесь соблюдать правила защиты авторских прав
        </p>
      </div>
    </div>
  );
}
