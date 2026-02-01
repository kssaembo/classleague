
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Settings, Team, Match, LeagueType } from '../types';
import { Save, Users, Copy, Share2, Key, Plus, X, AlertTriangle, Check, Lock, Download, Bell, QrCode, ExternalLink, Timer, Target, CheckCircle, Clock, Eye } from 'lucide-react';

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
  
  const [toast, setToast] = useState<{ message: string; show: boolean }>({ message: '', show: false });
  const [showQrModal, setShowQrModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false); // 커스텀 confirm 모달 상태

  const [title, setTitle] = useState(settings?.title || '');
  const [description, setDescription] = useState(settings?.description || '');
  const [notice, setNotice] = useState(settings?.notice || '');
  const [accessCode, setAccessCode] = useState(settings?.access_code || '1234');
  const [bonusConfig, setBonusConfig] = useState<string[]>(settings?.bonus_config || ['보너스 점수']);
  const [leagueType, setLeagueType] = useState<LeagueType>(settings?.league_type || 'points');
  const [leagueUnit, setLeagueUnit] = useState(settings?.league_unit || '점');
  
  const [teamListRaw, setTeamListRaw] = useState(teams.map(t => t.name).join(', '));
  const [confirmUpdate, setConfirmUpdate] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 공식 URL을 기반으로 링크 생성
  const baseUrl = "https://classleague.vercel.app/";
  const studentLink = `${baseUrl}?ref=${teacherId}`;
  const readonlyLink = `${baseUrl}?ref=${teacherId}&readonly=true`;

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

  const copyToClipboard = (text: string, msg: string) => {
    navigator.clipboard.writeText(text).then(() => {
      showSuccessToast(msg);
    });
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
    });
    
    if (error) {
      alert("저장 중 오류가 발생했습니다: " + error.message);
    } else {
      showSuccessToast("기본 정보 저장이 완료되었습니다! ✅");
      onUpdate();
    }
  };

  const executeTemplateSave = async () => {
    setIsSaving(true);
    const { error: deleteError } = await supabase.from('matches').delete().eq('teacher_id', teacherId);
    
    if (deleteError) {
      alert("기록 초기화 중 오류가 발생했습니다: " + deleteError.message);
      setIsSaving(false);
      return;
    }

    const { error: saveError } = await supabase.from('settings').upsert({
      id: settings?.id,
      teacher_id: teacherId,
      league_type: leagueType,
      league_unit: leagueUnit
    });

    if (saveError) {
      alert("설정 저장 중 오류가 발생했습니다: " + saveError.message);
    } else {
      showSuccessToast("저장이 완료되었습니다! ✅");
      onUpdate();
    }
    setIsSaving(false);
    setShowConfirmModal(false);
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
    const d = new Date();
    const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    (window as any).XLSX.writeFile((window as any).XLSX.utils.book_new(), `${settings?.title || '학급리그'}_기록_${dateStr}.xlsx`);
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

      {/* 대결 방식 변경 확인 모달 */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full text-center shadow-2xl border-4 border-red-500 transform animate-in zoom-in slide-in-from-bottom-4">
            <div className="bg-red-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="text-red-500" size={40} />
            </div>
            <h3 className="text-2xl font-black text-slate-800 mb-4">정말 변경하시겠습니까?</h3>
            <p className="text-slate-500 font-bold mb-8 leading-relaxed">
              대결 방식을 수정하면 <span className="text-red-500 underline">이전 모든 경기 기록 결과가 삭제</span>되며 복구할 수 없습니다. 계속하시겠습니까?
            </p>
            <div className="flex gap-4">
              <button 
                onClick={executeTemplateSave}
                disabled={isSaving}
                className="flex-1 py-4 bg-red-500 text-white font-black rounded-2xl shadow-lg hover:bg-red-600 disabled:opacity-50 transition-all"
              >
                {isSaving ? "처리 중..." : "네, 초기화 후 저장"}
              </button>
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-4 bg-slate-100 text-slate-500 font-black rounded-2xl hover:bg-slate-200 transition-all"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {showQrModal && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] p-8 max-sm w-full text-center shadow-2xl border-4 border-blue-500 transform animate-in zoom-in slide-in-from-bottom-4">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-800 rounded-3xl p-6 text-white shadow-lg flex items-center justify-between">
          <div>
            <h3 className="font-bold flex items-center gap-2 mb-1"><Download size={18} /> 기록 엑셀 다운로드</h3>
            <p className="text-xs text-slate-400">전체 기록을 파일로 소장하세요.</p>
          </div>
          <button onClick={downloadExcel} className="bg-green-500 hover:bg-green-600 px-4 py-3 rounded-2xl transition-all font-bold flex items-center gap-2 shadow-lg">
            <Download size={18} /> <span className="hidden md:inline">다운로드</span>
          </button>
        </div>
        <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-lg flex items-center justify-between">
          <div>
            <h3 className="font-bold flex items-center gap-2 mb-1"><Eye size={18} /> 조회 전용 링크 생성</h3>
            <p className="text-xs text-indigo-200">기록 수정이 불가능한 링크입니다.</p>
          </div>
          <button onClick={() => copyToClipboard(readonlyLink, "조회 전용 링크가 복사되었습니다! 🔗")} className="bg-white text-indigo-600 hover:bg-indigo-50 px-4 py-3 rounded-2xl transition-all font-bold flex items-center gap-2 shadow-lg">
            <Copy size={18} /> <span className="hidden md:inline">링크 복사</span>
          </button>
        </div>
      </div>

      <section className="bg-white rounded-3xl p-6 shadow-md border-2 border-indigo-50">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-2">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Target className="text-indigo-500" /> 리그 대결 방식(템플릿) 설정
          </h2>
          <span className="text-red-500 text-[10px] md:text-xs font-black bg-red-50 px-3 py-1.5 rounded-full border border-red-100">
            리그 대결 방식 설정을 수정할 경우 이전 모든 경기 기록 데이터는 초기화됩니다.
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {[
            { id: 'points', label: '점수제', icon: <Target size={20} />, desc: '승점제 반영. 승3점, 무2점, 패1점' },
            { id: 'time', label: '시간 기록(↓)', icon: <Timer size={20} />, desc: '낮을수록 우승' },
            { id: 'time_high', label: '시간 기록(↑)', icon: <Clock size={20} />, desc: '높을수록 우승' },
            { id: 'count', label: '횟수/거리', icon: <Plus size={20} />, desc: '높을수록 우승' },
            { id: 'mission', label: '미션 완료', icon: <CheckCircle size={20} />, desc: '성공/실패 체크' },
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => {
                setLeagueType(type.id as LeagueType);
                if (type.id === 'points') setLeagueUnit('점');
                if (type.id === 'time' || type.id === 'time_high') setLeagueUnit('초');
                if (type.id === 'count') setLeagueUnit('회');
                if (type.id === 'mission') setLeagueUnit('개');
              }}
              className={`p-4 rounded-2xl border-2 transition-all text-left flex flex-col gap-2 ${
                leagueType === type.id ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200' : 'border-slate-100 bg-slate-50 opacity-60 grayscale'
              }`}
            >
              <div className={`${leagueType === type.id ? 'text-indigo-600' : 'text-slate-400'}`}>{type.icon}</div>
              <div className="font-black text-xs md:text-sm">{type.label}</div>
              <div className="text-[9px] md:text-[10px] text-slate-400 font-medium leading-tight">{type.desc}</div>
            </button>
          ))}
        </div>
        <div className="bg-slate-50 p-4 rounded-2xl mb-6">
          <label className="block text-xs font-bold text-slate-400 mb-2">단위 설정 (예: 점, 초, 회, m, 개...)</label>
          <input 
            type="text" 
            value={leagueUnit} 
            onChange={e => setLeagueUnit(e.target.value)}
            className="w-full p-3 bg-white border-2 border-slate-100 rounded-xl outline-none focus:border-indigo-400 font-bold"
            placeholder="단위를 입력하세요."
          />
        </div>
        <button 
          onClick={() => setShowConfirmModal(true)} 
          className="w-full py-4 bg-indigo-500 text-white font-black rounded-2xl shadow-md hover:bg-indigo-600 flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          <Save size={18} /> 대결 방식 저장 및 데이터 초기화
        </button>
      </section>

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
              placeholder="짧은 설명을 적어주세요."
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
              <p className="text-red-600 font-bold text-sm mb-3">정말 업데이트할까요? 기존 경기 기록에 영향이 있을 수 있습니다.</p>
              <div className="flex gap-2">
                <button onClick={handleUpdateTeams} className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl">확인</button>
                <button onClick={() => setConfirmUpdate(false)} className="flex-1 py-3 bg-slate-200 text-slate-600 font-bold rounded-xl">취소</button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default AdminPanel;
