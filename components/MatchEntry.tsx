
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Team, Settings, Match } from '../types';
import { PlusCircle, CheckCircle2, Save, XCircle, Check, X } from 'lucide-react';

interface MatchEntryProps {
  teacherId: string;
  teams: Team[];
  onComplete: () => void;
  settings: Settings | null;
  editingMatch?: Match | null;
  onCancel?: () => void;
}

const MatchEntry: React.FC<MatchEntryProps> = ({ teacherId, teams, onComplete, settings, editingMatch, onCancel }) => {
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

  const leagueType = settings?.league_type || 'points';
  const unit = settings?.league_unit || '점';

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
      setDate(getLocalDateString());
      setTeam1('');
      setTeam2('');
      setScore1(0);
      setScore2(0);
      setMemo('');
      setBonusDetails1([]);
      setBonusDetails2([]);
    }
  }, [editingMatch, leagueType]);

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
    if (!team1 || (leagueType !== 'mission' && !team2) || (team1 === team2)) {
      alert("팀을 올바르게 선택해주세요!");
      return;
    }

    setSubmitting(true);
    const payload = {
      teacher_id: teacherId,
      match_date: date,
      team1_id: team1,
      team2_id: leagueType === 'mission' ? team1 : team2, // 미션형은 자기 자신 대결 혹은 더미
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
      alert("기록이 성공적으로 저장되었습니다! ✨");
      onComplete();
    }
    setSubmitting(false);
  };

  const renderScoreInput = (num: 1 | 2, score: number | string, setScore: (val: number | string) => void) => {
    if (leagueType === 'mission') {
      return (
        <div className="flex gap-2">
          <button 
            type="button" 
            onClick={() => setScore(1)}
            className={`flex-1 py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-2 ${score === 1 ? 'bg-green-500 text-white shadow-lg ring-4 ring-green-100' : 'bg-slate-100 text-slate-400'}`}
          >
            <Check size={20} /> 성공
          </button>
          <button 
            type="button" 
            onClick={() => setScore(0)}
            className={`flex-1 py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-2 ${score === 0 ? 'bg-red-500 text-white shadow-lg ring-4 ring-red-100' : 'bg-slate-100 text-slate-400'}`}
          >
            <X size={20} /> 실패
          </button>
        </div>
      );
    }

    const isRecordType = leagueType === 'time' || leagueType === 'time_high' || leagueType === 'count';

    return (
      <div className="flex flex-col items-center">
        <span className="text-slate-500 font-bold text-sm mb-2">{isRecordType ? '기록 입력' : '획득 점수'}</span>
        <div className="flex items-center gap-10">
          {!isRecordType && (
            <button type="button" onClick={() => setScore(Math.max(0, Number(score) - 1))} className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-xl shadow-sm border-2 border-slate-100 text-xl font-black text-slate-600 active:scale-90">-</button>
          )}
          <div className="relative">
            <input 
              type="number" 
              step="0.01"
              value={score}
              onChange={e => setScore(e.target.value)}
              className="w-24 h-12 md:h-14 bg-white border-2 border-slate-200 rounded-xl text-xl md:text-2xl font-black text-center outline-none focus:border-indigo-400"
            />
            <span className="absolute -right-6 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">{unit}</span>
          </div>
          {!isRecordType && (
            <button type="button" onClick={() => setScore(Number(score) + 1)} className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-xl shadow-sm border-2 border-slate-100 text-xl font-black text-slate-600 active:scale-90">+</button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-3xl shadow-lg p-6 border-b-8 border-indigo-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          {editingMatch ? <Save className="text-indigo-500" /> : <PlusCircle className="text-indigo-500" />}
          {editingMatch ? "기록 수정하기" : "새 경기 기록하기"}
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
            className="w-full p-4 bg-white border-2 border-slate-200 rounded-xl font-bold outline-none focus:border-indigo-400"
          />
        </div>

        <div className={`grid grid-cols-1 ${leagueType === 'mission' ? '' : 'md:grid-cols-2'} gap-8`}>
          {/* 팀 1 섹션 */}
          <div className="space-y-4">
            <div className={`p-6 rounded-3xl border-2 ${leagueType === 'mission' ? 'bg-indigo-50 border-indigo-100' : 'bg-blue-50 border-blue-100'}`}>
              <label className="block text-slate-800 font-black mb-3 text-lg">🟦 {leagueType === 'mission' ? '기록할 팀' : '팀 A'}</label>
              <select 
                value={team1} 
                onChange={e => setTeam1(e.target.value)}
                className="w-full p-4 mb-6 bg-white border-2 border-indigo-200 rounded-2xl font-bold outline-none shadow-sm"
              >
                <option value="">팀 선택</option>
                {teams.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              {renderScoreInput(1, score1, setScore1)}
            </div>
            
            <div className="bg-white p-5 rounded-2xl border-2 border-indigo-50">
              <p className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">🌟 보너스 항목</p>
              <div className="flex flex-wrap gap-2">
                {bonusItems.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggleBonus(1, item)}
                    className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all font-bold text-xs
                      ${bonusDetails1.includes(item) ? 'bg-indigo-100 border-indigo-300 text-indigo-700' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                  >
                    <CheckCircle2 size={16} /> {item}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 팀 2 섹션 (미션형이 아닐 때만) */}
          {leagueType !== 'mission' && (
            <div className="space-y-4">
              <div className="bg-red-50 p-6 rounded-3xl border-2 border-red-100">
                <label className="block text-red-800 font-black mb-3 text-lg">🟥 팀 B</label>
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
                {renderScoreInput(2, score2, setScore2)}
              </div>
              <div className="bg-white p-5 rounded-2xl border-2 border-red-50">
                <p className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">🌟 보너스 항목</p>
                <div className="flex flex-wrap gap-2">
                  {bonusItems.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => toggleBonus(2, item)}
                      className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all font-bold text-xs
                        ${bonusDetails2.includes(item) ? 'bg-red-100 border-red-300 text-red-700' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                    >
                      <CheckCircle2 size={16} /> {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-slate-50 p-6 rounded-2xl border-2 border-slate-100">
          <label className="block text-sm font-bold text-slate-500 mb-3">📝 경기 메모</label>
          <textarea 
            value={memo} 
            onChange={e => setMemo(e.target.value)}
            placeholder="기록에 남길 메모를 적어주세요."
            className="w-full p-4 bg-white border-2 border-slate-200 rounded-2xl outline-none focus:border-indigo-400 min-h-[100px] font-medium text-sm"
          />
        </div>

        <button 
          type="submit" 
          disabled={submitting}
          className="w-full py-5 bg-indigo-500 hover:bg-indigo-600 text-white font-black text-xl rounded-[2rem] shadow-xl disabled:opacity-50"
        >
          {submitting ? '처리 중...' : (editingMatch ? '수정 완료 ✨' : '기록 저장하기 🏅')}
        </button>
      </form>
    </div>
  );
};

export default MatchEntry;
