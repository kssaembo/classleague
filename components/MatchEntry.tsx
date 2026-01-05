
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Team, Settings, Match } from '../types';
import { PlusCircle, CheckCircle2, Save, XCircle } from 'lucide-react';

interface MatchEntryProps {
  teacherId: string;
  teams: Team[];
  onComplete: () => void;
  settings: Settings | null;
  editingMatch?: Match | null;
  onCancel?: () => void;
}

const MatchEntry: React.FC<MatchEntryProps> = ({ teacherId, teams, onComplete, settings, editingMatch, onCancel }) => {
  // 로컬 날짜 YYYY-MM-DD 구하는 헬퍼 함수
  const getLocalDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [date, setDate] = useState(getLocalDateString());
  const [team1, setTeam1] = useState('');
  const [team2, setTeam2] = useState('');
  const [score1, setScore1] = useState<number | string>(0);
  const [score2, setScore2] = useState<number | string>(0);
  const [memo, setMemo] = useState('');
  const [bonusDetails1, setBonusDetails1] = useState<string[]>([]);
  const [bonusDetails2, setBonusDetails2] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingMatch) {
      setDate(editingMatch.match_date);
      setTeam1(editingMatch.team1_id);
      setTeam2(editingMatch.team2_id);
      setScore1(editingMatch.score1);
      setScore2(editingMatch.score2);
      setMemo(editingMatch.strategy_memo || '');
      setBonusDetails1(editingMatch.bonus_details1 || []);
      setBonusDetails2(editingMatch.bonus_details2 || []);
    } else {
      // 초기화 시 로컬 오늘 날짜 적용
      setDate(getLocalDateString());
      setTeam1('');
      setTeam2('');
      setScore1(0);
      setScore2(0);
      setMemo('');
      setBonusDetails1([]);
      setBonusDetails2([]);
    }
  }, [editingMatch]);

  const bonusItems = settings?.bonus_config || ['보너스 점수'];

  const toggleBonus = (teamNum: 1 | 2, item: string) => {
    if (teamNum === 1) {
      setBonusDetails1(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
    } else {
      setBonusDetails2(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!team1 || !team2 || team1 === team2) {
      alert("서로 다른 두 팀을 선택해주세요!");
      return;
    }

    setSubmitting(true);
    const payload = {
      teacher_id: teacherId,
      match_date: date,
      team1_id: team1,
      team2_id: team2,
      score1: Number(score1),
      score2: Number(score2),
      strategy_memo: memo,
      bonus_details1: bonusDetails1,
      bonus_details2: bonusDetails2
    };

    let error;
    if (editingMatch) {
      const res = await supabase.from('matches').update(payload).eq('id', editingMatch.id);
      error = res.error;
    } else {
      const res = await supabase.from('matches').insert(payload);
      error = res.error;
    }

    if (error) {
      alert("오류가 발생했습니다: " + error.message);
    } else {
      alert(editingMatch ? "기록 수정이 완료되었습니다! ✨" : "경기가 성공적으로 등록되었습니다! 🏅");
      onComplete();
    }
    setSubmitting(false);
  };

  return (
    <div className="bg-white rounded-3xl shadow-lg p-6 border-b-8 border-yellow-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          {editingMatch ? <Save className="text-blue-500" /> : <PlusCircle className="text-yellow-500" />}
          {editingMatch ? "경기 기록 수정하기" : "새로운 경기 기록하기"}
        </h2>
        {editingMatch && onCancel && (
          <button onClick={onCancel} className="text-slate-400 hover:text-red-500 flex items-center gap-1 font-bold text-sm">
            <XCircle size={18} /> 수정 취소
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-100">
          <label className="block text-sm font-bold text-slate-500 mb-2">📅 경기 날짜</label>
          <input 
            type="date" 
            value={date} 
            onChange={e => setDate(e.target.value)}
            className="w-full p-4 bg-white border-2 border-slate-200 rounded-xl font-bold outline-none focus:border-yellow-400"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="bg-blue-50 p-6 rounded-3xl border-2 border-blue-100">
              <label className="block text-blue-800 font-black mb-3 text-lg">🟦 우리 팀 (A)</label>
              <select 
                value={team1} 
                onChange={e => setTeam1(e.target.value)}
                className="w-full p-4 mb-6 bg-white border-2 border-blue-200 rounded-2xl font-bold outline-none shadow-sm"
              >
                <option value="">팀 선택</option>
                {teams.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              
              <div className="flex flex-col items-center">
                <span className="text-slate-500 font-bold text-sm mb-2">획득 점수</span>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setScore1(Math.max(0, Number(score1) - 1))} className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-xl shadow-sm border-2 border-blue-100 text-xl font-black text-blue-600 active:scale-90">-</button>
                  <input 
                    type="number" 
                    value={score1}
                    onChange={e => setScore1(e.target.value)}
                    className="w-16 h-10 md:h-12 bg-white border-2 border-blue-200 rounded-xl text-xl md:text-2xl font-black text-center outline-none focus:border-blue-400"
                  />
                  <button type="button" onClick={() => setScore1(Number(score1) + 1)} className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-xl shadow-sm border-2 border-blue-100 text-xl font-black text-blue-600 active:scale-90">+</button>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border-2 border-blue-50">
              <p className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">🌟 보너스 항목</p>
              <div className="grid grid-cols-1 gap-2">
                {bonusItems.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggleBonus(1, item)}
                    className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all font-bold text-xs
                      ${bonusDetails1.includes(item) ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-blue-100'}`}
                  >
                    <CheckCircle2 size={16} /> {item}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-red-50 p-6 rounded-3xl border-2 border-red-100">
              <label className="block text-red-800 font-black mb-3 text-lg">🟥 상대 팀 (B)</label>
              <select 
                value={team2} 
                onChange={e => setTeam2(e.target.value)}
                className="w-full p-4 mb-6 bg-white border-2 border-red-200 rounded-2xl font-bold outline-none shadow-sm"
              >
                <option value="">팀 선택</option>
                {teams.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              
              <div className="flex flex-col items-center">
                <span className="text-slate-500 font-bold text-sm mb-2">획득 점수</span>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setScore2(Math.max(0, Number(score2) - 1))} className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-xl shadow-sm border-2 border-red-100 text-xl font-black text-red-600 active:scale-90">-</button>
                  <input 
                    type="number" 
                    value={score2}
                    onChange={e => setScore2(e.target.value)}
                    className="w-16 h-10 md:h-12 bg-white border-2 border-red-200 rounded-xl text-xl md:text-2xl font-black text-center outline-none focus:border-red-400"
                  />
                  <button type="button" onClick={() => setScore2(Number(score2) + 1)} className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-xl shadow-sm border-2 border-red-100 text-xl font-black text-red-600 active:scale-90">+</button>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border-2 border-red-50">
              <p className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">🌟 보너스 항목</p>
              <div className="grid grid-cols-1 gap-2">
                {bonusItems.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggleBonus(2, item)}
                    className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all font-bold text-xs
                      ${bonusDetails2.includes(item) ? 'bg-red-100 border-red-300 text-red-700' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-red-100'}`}
                  >
                    <CheckCircle2 size={16} /> {item}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 p-6 rounded-2xl border-2 border-slate-100">
          <label className="block text-sm font-bold text-slate-500 mb-3">📝 경기 메모 및 소감</label>
          <textarea 
            value={memo} 
            onChange={e => setMemo(e.target.value)}
            placeholder="경기를 통해 느낀 점, 새롭게 알게 된 점, 인상 깊었던 부분, 상대를 통해 배운 점, 전략적인 내용 등을 기록해주세요."
            className="w-full p-4 bg-white border-2 border-slate-200 rounded-2xl outline-none focus:border-yellow-400 min-h-[120px] font-medium text-xs md:text-sm"
          />
        </div>

        <button 
          type="submit" 
          disabled={submitting}
          className={`w-full py-6 text-white font-black text-xl md:text-2xl rounded-[2rem] shadow-xl transform transition-transform active:scale-95 disabled:opacity-50 ${editingMatch ? 'bg-blue-500 hover:bg-blue-600' : 'bg-yellow-400 hover:bg-yellow-500'}`}
        >
          {submitting ? '처리 중...' : (editingMatch ? '기록 수정 완료 ✨' : '경기 기록 저장하기 🏅')}
        </button>
      </form>
    </div>
  );
};

export default MatchEntry;
