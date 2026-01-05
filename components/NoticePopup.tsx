
import React, { useState, useEffect } from 'react';
import { X, Megaphone } from 'lucide-react';

interface NoticePopupProps {
  notice: string;
}

const NoticePopup: React.FC<NoticePopupProps> = ({ notice }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!notice) return;
    
    const hiddenUntil = localStorage.getItem('notice_hidden_until');
    if (!hiddenUntil || new Date().getTime() > parseInt(hiddenUntil)) {
      setIsVisible(true);
    }
  }, [notice]);

  const closeForeverToday = () => {
    const tomorrow = new Date();
    tomorrow.setHours(23, 59, 59, 999);
    localStorage.setItem('notice_hidden_until', tomorrow.getTime().toString());
    setIsVisible(false);
  };

  if (!isVisible || !notice) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full overflow-hidden border-4 border-yellow-400 transform transition-all animate-in fade-in zoom-in duration-300">
        <div className="bg-yellow-400 p-6 flex items-center gap-3">
          <div className="bg-white p-2 rounded-full text-yellow-500 shadow-inner">
            <Megaphone size={24} />
          </div>
          <h2 className="text-xl font-kids font-bold text-yellow-900">선생님의 알림장</h2>
        </div>
        
        <div className="p-8">
          <p className="text-slate-700 font-medium whitespace-pre-wrap leading-relaxed">
            {notice}
          </p>
        </div>

        <div className="p-6 bg-slate-50 flex flex-col gap-3">
          <button 
            onClick={() => setIsVisible(false)}
            className="w-full py-4 bg-yellow-400 hover:bg-yellow-500 text-white font-bold rounded-2xl transition-colors shadow-md"
          >
            확인했어요!
          </button>
          <button 
            onClick={closeForeverToday}
            className="w-full py-2 text-slate-400 text-sm font-medium hover:text-slate-600 transition-colors"
          >
            오늘 하루 보지 않기
          </button>
        </div>
      </div>
    </div>
  );
};

export default NoticePopup;
