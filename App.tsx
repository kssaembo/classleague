
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';
import { Team, Match, Settings } from './types';
import Login from './components/Login';
import AdminPanel from './components/AdminPanel';
import MatchEntry from './components/MatchEntry';
import Rankings from './components/Rankings';
import MatchHistory from './components/MatchHistory';
import PolicyModal from './components/PolicyModal';
import { Trophy, History, PlusCircle, Settings as SettingsIcon, LogOut, Lock, Mail, Eye } from 'lucide-react';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [isStudentMode, setIsStudentMode] = useState(false);
  const [isReadOnlyMode, setIsReadOnlyMode] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [inputCode, setInputCode] = useState('');
  const [activeTab, setActiveTab] = useState<'entry' | 'rankings' | 'history' | 'admin'>('rankings');
  const [settings, setSettings] = useState<Settings | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [policyType, setPolicyType] = useState<'terms' | 'privacy' | 'guide' | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    const readonly = params.get('readonly');
    
    if (ref) {
      setTeacherId(ref);
      setIsStudentMode(true);
      // 'true' 문자열이거나 단순히 존재하기만 해도 조회 전용 모드 활성화
      if (readonly === 'true' || readonly === '') {
        setIsReadOnlyMode(true);
      }
      if (localStorage.getItem(`auth_code_${ref}`) === 'true') {
        setIsAuthenticated(true);
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session && !ref) {
        setTeacherId(session.user.id);
        setIsAuthenticated(true);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session && !ref) {
        setTeacherId(session.user.id);
        setIsAuthenticated(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 조회 전용 모드일 때 제한된 탭에 있으면 강제로 순위표로 이동
  useEffect(() => {
    if (isReadOnlyMode && (activeTab === 'entry' || activeTab === 'admin')) {
      setActiveTab('rankings');
    }
  }, [isReadOnlyMode, activeTab]);

  const fetchData = useCallback(async () => {
    if (!teacherId) return;
    setLoading(true);
    try {
      const [settingsRes, teamsRes, matchesRes] = await Promise.all([
        supabase.from('settings').select('*').eq('teacher_id', teacherId).single(),
        supabase.from('teams').select('*').eq('teacher_id', teacherId),
        supabase.from('matches').select('*').eq('teacher_id', teacherId).order('match_date', { ascending: false })
      ]);

      if (settingsRes.data) setSettings(settingsRes.data);
      if (teamsRes.data) setTeams(teamsRes.data);
      if (matchesRes.data) setMatches(matchesRes.data);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  }, [teacherId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAccessCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (settings && inputCode === settings.access_code) {
      setIsAuthenticated(true);
      localStorage.setItem(`auth_code_${teacherId}`, 'true');
    } else {
      alert("비밀번호가 틀렸습니다. 선생님께 문의하세요!");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem(`auth_code_${teacherId}`);
    window.location.href = '/';
  };

  const startEditing = (match: Match) => {
    if (isReadOnlyMode) return;
    setEditingMatch(match);
    setActiveTab('entry');
  };

  if (!teacherId && !session) {
    return <Login />;
  }

  if (loading && !settings) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-indigo-50 font-bold text-indigo-600">
        리그 정보를 불러오는 중... ⚽️
      </div>
    );
  }

  if (!isAuthenticated && isStudentMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-indigo-50 p-6 text-center">
        {isReadOnlyMode && (
          <div className="fixed top-0 left-0 w-full bg-amber-500 text-white py-2 font-black text-xs z-50 flex items-center justify-center gap-2">
            <Eye size={14} /> 조회 전용(학생용) 모드
          </div>
        )}
        <div className="bg-white rounded-[2rem] shadow-xl p-8 w-full max-sm border-b-8 border-indigo-200">
          <Lock className="mx-auto text-indigo-500 mb-4" size={48} />
          <h2 className="text-2xl font-bold text-slate-800 mb-6">우리 반 입장 코드</h2>
          <form onSubmit={handleAccessCodeSubmit} className="space-y-4">
            <input 
              type="text" 
              value={inputCode}
              onChange={e => setInputCode(e.target.value)}
              placeholder="교사 비밀번호 입력"
              className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-center text-xl font-bold outline-none focus:border-indigo-400"
            />
            <button className="w-full py-4 bg-indigo-500 text-white font-bold rounded-2xl text-lg shadow-lg">
              입장하기
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-indigo-50 text-slate-800 flex flex-col">
      <PolicyModal type={policyType} onClose={() => setPolicyType(null)} />

      {isReadOnlyMode && (
        <div className="bg-amber-500 text-white py-2 px-4 text-center font-black text-xs md:text-sm flex items-center justify-center gap-2 shadow-md sticky top-0 z-[60]">
          <Eye size={16} /> 조회 전용(학생용) 모드로 접속 중입니다. 기록 수정 및 관리가 불가능합니다.
        </div>
      )}

      <header className="bg-white p-12 text-center border-b-2 border-indigo-100 relative">
        <h1 className="text-3xl md:text-6xl font-black text-indigo-700 mb-4">
          {settings?.title || "우리 반 스포츠 리그"}
        </h1>
        <p className="text-xl md:text-2xl text-slate-500 font-bold">{settings?.description || "정정당당 즐거운 경기!"}</p>
        
        {!isStudentMode && session && (
          <button onClick={handleLogout} className="absolute top-6 right-6 p-2 text-slate-300 hover:text-red-500 transition-colors">
            <LogOut size={28} />
          </button>
        )}
      </header>

      <nav className="bg-white border-b-4 border-indigo-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-4xl mx-auto flex justify-around">
          <NavButton active={activeTab === 'rankings'} icon={<Trophy size={20}/>} label="순위표" onClick={() => { setActiveTab('rankings'); setEditingMatch(null); }} />
          
          <NavButton 
            active={activeTab === 'entry'} 
            icon={<PlusCircle size={20}/>} 
            label={editingMatch ? "기록 수정" : "기록 추가"} 
            disabled={isReadOnlyMode}
            onClick={() => { if(!isReadOnlyMode) setActiveTab('entry'); }} 
          />
          
          <NavButton active={activeTab === 'history'} icon={<History size={20}/>} label="기록" onClick={() => { setActiveTab('history'); setEditingMatch(null); }} />
          
          <NavButton 
            active={activeTab === 'admin'} 
            icon={<SettingsIcon size={20}/>} 
            label="관리자" 
            disabled={isReadOnlyMode}
            onClick={() => { if(!isReadOnlyMode) setActiveTab('admin'); setEditingMatch(null); }} 
          />
        </div>
      </nav>

      <main className="max-w-4xl mx-auto p-4 mt-4 flex-grow w-full">
        {activeTab === 'rankings' && <Rankings teams={teams} matches={matches} settings={settings} />}
        {activeTab === 'entry' && !isReadOnlyMode && <MatchEntry teacherId={teacherId!} teams={teams} onComplete={() => { fetchData(); setEditingMatch(null); setActiveTab('history'); }} settings={settings} editingMatch={editingMatch} onCancel={() => { setEditingMatch(null); setActiveTab('history'); }} />}
        {activeTab === 'history' && <MatchHistory teams={teams} matches={matches} onUpdate={fetchData} teacherId={teacherId!} onEdit={startEditing} accessCode={settings?.access_code || '1234'} />}
        {activeTab === 'admin' && !isReadOnlyMode && <AdminPanel teacherId={teacherId!} settings={settings} teams={teams} matches={matches} onUpdate={fetchData} session={session} />}
        
        {isReadOnlyMode && (activeTab === 'entry' || activeTab === 'admin') && (
          <div className="bg-white rounded-3xl p-12 text-center shadow-lg border-2 border-slate-100">
             <Lock className="mx-auto text-slate-200 mb-4" size={64} />
             <p className="text-slate-400 font-bold">조회 전용 모드에서는 접근할 수 없습니다.</p>
          </div>
        )}
      </main>

      <footer className="bg-white py-12 px-6 border-t border-slate-100 text-center space-y-6">
        <div className="flex flex-wrap justify-center gap-4 md:gap-8 text-slate-400 text-xs font-bold items-center">
          <button onClick={() => setPolicyType('terms')} className="hover:text-indigo-500 transition-colors">이용약관</button>
          <button onClick={() => setPolicyType('privacy')} className="hover:text-indigo-500 transition-colors">개인정보처리방침</button>
          <button 
            onClick={() => setPolicyType('guide')} 
            className="bg-indigo-600 text-white px-4 py-2 rounded-full hover:bg-indigo-700 transition-all shadow-md active:scale-95"
          >
            가이드라인 & 사용설명서
          </button>
        </div>
        <div className="flex flex-col items-center gap-1 text-slate-400 text-[10px] md:text-xs">
          <p className="flex items-center gap-1"><Mail size={12} /> 제안이나 문의사항이 있으시면 언제든 메일 주세요.</p>
        </div>
        <div className="text-slate-500 text-xs md:text-sm font-bold space-y-1">
          <p>Contact: <a href="mailto:sinjoppo@naver.com" className="text-indigo-500 underline">sinjoppo@naver.com</a></p>
          <p className="text-black font-bold">ⓒ 2026. Kwon's class. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

interface NavButtonProps {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

const NavButton: React.FC<NavButtonProps> = ({ active, icon, label, onClick, disabled = false }) => (
  <button 
    onClick={onClick}
    disabled={disabled}
    className={`flex-1 flex flex-col items-center py-3 transition-all border-b-4 
      ${disabled ? 'opacity-20 cursor-not-allowed grayscale' : ''}
      ${active && !disabled ? 'text-indigo-600 border-indigo-600 bg-indigo-50' : 'text-slate-400 border-transparent hover:bg-slate-50'}`}
  >
    {icon}
    <span className="text-xs font-bold mt-1">{label}</span>
  </button>
);

export default App;
