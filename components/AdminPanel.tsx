
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Settings, Team, Match } from '../types';
import { Save, Users, Copy, Share2, Key, Plus, X, AlertTriangle, Check, Lock, Download, Bell, QrCode, ExternalLink } from 'lucide-react';

interface AdminPanelProps {
  teacherId: string;
  settings: Settings | null;
  teams: Team[];
  matches: Match[];
  onUpdate: () => void;
  session: any;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ teacherId, settings, teams, matches, onUpdate, session }) => {
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [adminPass, setAdminPass] = useState('');
  
  // Toast State
  const [toast, setToast] = useState<{ message: string; show: boolean }>({ message: '', show: false });
  // QR Modal State
  const [showQrModal, setShowQrModal] = useState(false);

  const [title, setTitle] = useState(settings?.title || '');
  const [description, setDescription] = useState(settings?.description || '');
  const [notice, setNotice] = useState(settings?.notice || '');
  const [accessCode, setAccessCode] = useState(settings?.access_code || '1234');
  const [bonusConfig, setBonusConfig] = useState<string[]>(settings?.bonus_config || ['보너스 점수']);
  
  const [teamListRaw, setTeamListRaw] = useState(teams.map(t => t.name).join(', '));
  const [confirmUpdate, setConfirmUpdate] = useState(false);

  // 고정 도메인 기반 학생 접속 링크
  const studentLink = `https://classleague.vercel.app/?ref=${teacherId}`;

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast({ ...toast, show: false });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  const showSuccessToast = (msg: string) => {
    setToast({ message: msg, show: true });
  };

  const handleAdminUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPass === accessCode || !!session) {
      setIsAdminUnlocked(true);
    } else {
      alert("비밀번호가 일치하지 않습니다.");
    }
  };

  const handleSaveSettings = async () => {
    const { error } = await supabase.from('settings').upsert({
      id: settings?.id, 
      teacher_id: teacherId,
      title,
      description,
      notice,
      access_code: accessCode,
      bonus_config: bonusConfig
    });
    
    if (error) {
      alert("저장 중 오류가 발생했습니다: " + error.message);
    } else {
      showSuccessToast("기본 정보 저장이 완료되었습니다! ✅");
      onUpdate();
    }
  };

  const handleSaveBonus = async () => {
    const { error } = await supabase.from('settings').upsert({
      id: settings?.id,
      teacher_id: teacherId,
      bonus_config: bonusConfig
    });
    if (error) {
      alert("저장 중 오류가 발생했습니다: " + error.message);
    } else {
      showSuccessToast("보너스 항목 저장이 완료되었습니다! ✅");
      onUpdate();
    }
  };

  const handleUpdateTeams = async () => {
    const names = teamListRaw.split(',').map(n => n.trim()).filter(n => n.length > 0);
    if (names.length === 0) return;

    await supabase.from('teams').delete().eq('teacher_id', teacherId);
    
    const newTeams = names.map(name => ({
      teacher_id: teacherId,
      name: name,
    }));
    const { error } = await supabase.from('teams').insert(newTeams);
    
    if (error) {
      alert("저장 중 오류가 발생했습니다: " + error.message);
    } else {
      showSuccessToast("팀 명단 업데이트가 완료되었습니다! ✅");
      setConfirmUpdate(false);
      onUpdate();
    }
  };

  const downloadExcel = () => {
    // 순위 데이터 가공 및 정렬
    const statsData = teams.map(team => {
      const teamMatches = matches.filter(m => m.team1_id === team.id || m.team2_id === team.id);
      let wins = 0, draws = 0, losses = 0, bonusTotal = 0;
      teamMatches.forEach(m => {
        const isTeam1 = m.team1_id === team.id;
        const myScore = isTeam1 ? m.score1 : m.score2;
        const opScore = isTeam1 ? m.score2 : m.score1;
        bonusTotal += (isTeam1 ? (m.bonus_details1?.length || 0) : (m.bonus_details2?.length || 0));
        if (myScore > opScore) wins++;
        else if (myScore === opScore) draws++;
        else losses++;
      });
      return {
        name: team.name,
        points: (wins * 3) + (draws * 2) + (losses * 1) + bonusTotal,
        totalGames: teamMatches.length,
        wins, draws, losses,
        bonusTotal
      };
    }).sort((a, b) => b.points - a.points || b.wins - a.wins);

    // 요청된 순서대로 순위표 데이터 생성
    const statsExport = statsData.map((s, idx) => ({
      '순위': idx + 1,
      '팀명': s.name,
      '승점': s.points,
      '경기수': s.totalGames,
      '승': s.wins,
      '무': s.draws,
      '패': s.losses,
      '보너스 점수': s.bonusTotal
    }));

    // 요청된 순서대로 경기 세부 기록 생성 (보너스 삭제)
    const matchHistoryExport = matches.map(m => {
      const t1 = teams.find(t => t.id === m.team1_id)?.name || '삭제됨';
      const t2 = teams.find(t => t.id === m.team2_id)?.name || '삭제됨';
      return {
        '날짜': m.match_date,
        '팀A': t1,
        '팀B': t2,
        '점수 A': m.score1,
        '점수 B': m.score2,
        '전략 및 메모': m.strategy_memo
      };
    });

    const wb = (window as any).XLSX.utils.book_new();
    const ws1 = (window as any).XLSX.utils.json_to_sheet(statsExport);
    const ws2 = (window as any).XLSX.utils.json_to_sheet(matchHistoryExport);
    
    (window as any).XLSX.utils.book_append_sheet(wb, ws1, "리그 순위표");
    (window as any).XLSX.utils.book_append_sheet(wb, ws2, "경기 세부 기록");
    
    // 로컬 날짜 생성
    const d = new Date();
    const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    
    (window as any).XLSX.writeFile(wb, `${settings?.title || '학급리그'}_기록_${dateStr}.xlsx`);
  };

  const addBonusItem = () => {
    setBonusConfig([...bonusConfig, "새 보너스 항목"]);
  };

  const removeBonusItem = (index: number) => {
    setBonusConfig(bonusConfig.filter((_, i) => i !== index));
  };

  const updateBonusItem = (index: number, value: string) => {
    const updated = [...bonusConfig];
    updated[index] = value;
    setBonusConfig(updated);
  };

  if (!isAdminUnlocked) {
    return (
      <div className="bg-white rounded-3xl p-8 shadow-lg max-w-md mx-auto text-center border-4 border-red-100">
        <Lock className="mx-auto text-red-400 mb-4" size={48} />
        <h2 className="text-2xl font-bold text-slate-800 mb-2">관리자 확인</h2>
        <p className="text-sm text-slate-500 mb-6">설정을 변경하려면 교사 비밀번호를 입력하세요.</p>
        <form onSubmit={handleAdminUnlock} className="space-y-4">
          <input 
            type="password" 
            value={adminPass} 
            onChange={e => setAdminPass(e.target.value)}
            placeholder="교사 비밀번호 입력" 
            className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-center font-bold text-xl outline-none focus:border-red-400"
          />
          <button type="submit" className="w-full py-4 bg-red-500 text-white font-bold rounded-2xl shadow-lg">
            관리자 모드 진입
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10 relative">
      {/* 커스텀 토스트 알림 UI */}
      {toast.show && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-4 duration-300">
          <div className="bg-slate-900/95 backdrop-blur-md text-white px-8 py-4 rounded-[2rem] shadow-2xl flex items-center gap-3 border border-white/10">
            <div className="bg-green-500 p-2 rounded-full">
              <Check size={18} className="text-white" />
            </div>
            <span className="font-bold whitespace-nowrap">{toast.message}</span>
          </div>
        </div>
      )}

      {/* QR 코드 모달 */}
      {showQrModal && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] p-8 max-w-sm w-full text-center shadow-2xl border-4 border-blue-500 transform animate-in zoom-in slide-in-from-bottom-4">
            <button onClick={() => setShowQrModal(false)} className="absolute top-6 right-6 p-2 text-slate-300 hover:text-slate-600">
              <X size={24} />
            </button>
            <h3 className="text-xl font-bold text-slate-800 mb-2 flex items-center justify-center gap-2">
              <QrCode className="text-blue-500" /> 우리 반 접속 QR
            </h3>
            <p className="text-xs text-slate-400 mb-6 font-medium">학생들이 카메라로 스캔하면 즉시 접속됩니다.</p>
            
            <div className="bg-slate-50 p-6 rounded-[2rem] mb-6 flex justify-center border-2 border-slate-100">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(studentLink)}`} 
                alt="Student Link QR Code"
                className="w-48 h-48"
              />
            </div>
            
            <button onClick={() => setShowQrModal(false)} className="w-full py-4 bg-blue-500 text-white font-bold rounded-2xl shadow-lg hover:bg-blue-600">
              닫기
            </button>
          </div>
        </div>
      )}

      {/* 데이터 다운로드 섹션 */}
      <div className="bg-slate-800 rounded-3xl p-6 text-white shadow-lg flex items-center justify-between">
        <div>
          <h3 className="font-bold flex items-center gap-2 mb-1"><Download size={18} /> 현재 기록 다운로드</h3>
          <p className="text-xs text-slate-400">순위표와 세부 기록을 엑셀 파일로 저장합니다.</p>
        </div>
        <button onClick={downloadExcel} className="bg-green-500 hover:bg-green-600 px-4 md:px-6 py-3 rounded-2xl transition-all font-bold flex items-center gap-2 shadow-lg">
          <Download size={18} /> <span className="hidden md:inline">다운로드</span>
        </button>
      </div>

      <div className="bg-blue-600 rounded-3xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold flex items-center gap-2 mb-1"><Share2 size={18} /> 학생용 개별 접속 링크</h3>
            <p className="text-xs text-blue-100">이 주소를 복사해서 전달하거나 QR코드를 보여주세요.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => {
              navigator.clipboard.writeText(studentLink);
              showSuccessToast("링크가 복사되었습니다! 🔗");
            }} className="bg-white/20 hover:bg-white/30 p-3 rounded-2xl transition-all flex items-center gap-2 font-bold text-sm">
              <Copy size={20} /> <span className="hidden md:inline">복사</span>
            </button>
            <button onClick={() => setShowQrModal(true)} className="bg-white text-blue-600 hover:bg-blue-50 p-3 rounded-2xl transition-all flex items-center gap-2 font-bold text-sm">
              <QrCode size={20} /> <span className="hidden md:inline">QR코드</span>
            </button>
          </div>
        </div>
        <div className="bg-blue-700/50 p-4 rounded-2xl border border-blue-400/30 flex items-center justify-between gap-4">
          <code className="text-[11px] md:text-xs font-mono break-all opacity-90 select-all">{studentLink}</code>
          <a href={studentLink} target="_blank" rel="noreferrer" className="shrink-0 text-blue-200 hover:text-white transition-colors">
            <ExternalLink size={16} />
          </a>
        </div>
      </div>

      <section className="bg-white rounded-3xl p-6 shadow-md border-2 border-slate-50">
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Save className="text-green-500" /> 리그 정보 및 세부 설명
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-500 mb-1">리그 제목</label>
            <input 
              type="text" 
              value={title} 
              onChange={e => setTitle(e.target.value)}
              className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-green-400 font-bold"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-500 mb-1">세부 설명 (부제목)</label>
            <input 
              type="text" 
              value={description} 
              onChange={e => setDescription(e.target.value)}
              className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-green-400"
              placeholder="리그에 대한 짧은 설명을 적어주세요."
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-500 mb-1">교사 비밀번호 (입장 코드)</label>
            <input 
              type="text" 
              value={accessCode} 
              onChange={e => setAccessCode(e.target.value)}
              className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-green-400 font-bold"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-500 mb-1">공지사항 (팝업)</label>
            <textarea 
              value={notice} 
              onChange={e => setNotice(e.target.value)}
              className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-green-400 h-24 text-sm"
            />
          </div>
          <button onClick={handleSaveSettings} className="w-full py-4 bg-green-500 text-white font-bold rounded-2xl shadow-md hover:bg-green-600">
            기본 정보 저장
          </button>
        </div>
      </section>

      <section className="bg-white rounded-3xl p-6 shadow-md border-2 border-orange-50">
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Plus className="text-orange-500" /> 보너스 점수 항목 관리
        </h2>
        <div className="space-y-3">
          {bonusConfig.map((item, idx) => (
            <div key={idx} className="flex gap-2">
              <input 
                type="text" 
                value={item} 
                onChange={(e) => updateBonusItem(idx, e.target.value)}
                className="flex-1 p-3 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none font-medium"
              />
              <button onClick={() => removeBonusItem(idx)} className="p-3 text-red-400 hover:bg-red-50 rounded-xl">
                <X size={20} />
              </button>
            </div>
          ))}
          <button onClick={addBonusItem} className="w-full py-3 border-2 border-dashed border-slate-200 text-slate-400 rounded-xl hover:bg-slate-50 font-bold flex items-center justify-center gap-2">
            <Plus size={18} /> 항목 추가하기
          </button>
          <div className="mt-4 p-4 bg-orange-50 rounded-xl text-xs text-orange-700">
            * 각 체크된 항목마다 팀당 1점씩 추가 점수가 부여됩니다.
          </div>
          <button onClick={handleSaveBonus} className="w-full py-4 bg-orange-500 text-white font-bold rounded-2xl shadow-md hover:bg-orange-600">
            보너스 설정 저장
          </button>
        </div>
      </section>

      <section className="bg-white rounded-3xl p-6 shadow-md border-2 border-blue-50">
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Users className="text-blue-500" /> 팀 명단 관리
        </h2>
        <div className="space-y-4">
          <p className="text-xs text-slate-400 italic">팀 이름을 쉼표(,)로 구분하여 입력해 주세요. (예: 사자팀, 호랑이팀, 독수리팀...)</p>
          <textarea 
            value={teamListRaw} 
            onChange={e => setTeamListRaw(e.target.value)}
            className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-400 h-32 text-sm"
          />
          
          {!confirmUpdate ? (
            <button onClick={() => setConfirmUpdate(true)} className="w-full py-4 bg-blue-500 text-white font-bold rounded-2xl shadow-md hover:bg-blue-600">
              팀 명단 업데이트
            </button>
          ) : (
            <div className="bg-red-50 p-4 rounded-2xl border-2 border-red-100 animate-in fade-in slide-in-from-top-2">
              <p className="text-red-600 font-bold text-sm mb-3 flex items-center gap-2">
                <AlertTriangle size={16} /> 기존 팀 정보와 경기 기록에 영향이 있을 수 있습니다. 정말 진행할까요?
              </p>
              <div className="flex gap-2">
                <button onClick={handleUpdateTeams} className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl flex items-center justify-center gap-2">
                  <Check size={18} /> 네, 업데이트합니다
                </button>
                <button onClick={() => setConfirmUpdate(false)} className="flex-1 py-3 bg-slate-200 text-slate-600 font-bold rounded-xl">
                  아니요, 취소할게요
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default AdminPanel;
