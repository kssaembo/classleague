
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';
import { Team, Match, Settings } from './types';
import Login from './components/Login';
import AdminPanel from './components/AdminPanel';
import MatchEntry from './components/MatchEntry';
import Rankings from './components/Rankings';
import MatchHistory from './components/MatchHistory';
import NoticePopup from './components/NoticePopup';
import { Trophy, History, PlusCircle, Settings as SettingsIcon, LogOut, Lock, Mail } from 'lucide-react';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [isStudentMode, setIsStudentMode] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [inputCode, setInputCode] = useState('');
  const [activeTab, setActiveTab] = useState<'entry' | 'rankings' | 'history' | 'admin'>('rankings');
  const [settings, setSettings] = useState<Settings | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    
    if (ref) {
      setTeacherId(ref);
      setIsStudentMode(true);
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
    setEditingMatch(match);
    setActiveTab('entry');
  };

  if (!teacherId && !session) {
    return <Login />;
  }

  if (loading && !settings) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-green-50 font-bold text-green-600">
        리그 정보를 불러오는 중... ⚽️
      </div>
    );
  }

  if (!isAuthenticated && isStudentMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50 p-6 text-center">
        <div className="bg-white rounded-[2rem] shadow-xl p-8 w-full max-sm border-b-8 border-green-200">
          <Lock className="mx-auto text-green-500 mb-4" size={48} />
          <h2 className="text-2xl font-bold text-slate-800 mb-6">우리 반 입장 코드</h2>
          <form onSubmit={handleAccessCodeSubmit} className="space-y-4">
            <input 
              type="text" 
              value={inputCode}
              onChange={e => setInputCode(e.target.value)}
              placeholder="교사 비밀번호 입력"
              className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-center text-xl font-bold outline-none focus:border-green-400"
            />
            <button className="w-full py-4 bg-green-500 text-white font-bold rounded-2xl text-lg shadow-lg">
              입장하기
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-green-50 text-slate-800 flex flex-col">
      <NoticePopup notice={settings?.notice || ''} />

      <header className="bg-white p-12 text-center border-b-2 border-green-100 relative">
        <h1 className="text-3xl md:text-6xl font-black text-green-700 mb-4">
          {settings?.title || "우리 반 스포츠 리그"}
        </h1>
        <p className="text-xl md:text-2xl text-slate-500 font-bold">{settings?.description || "정정당당 즐거운 경기!"}</p>
        
        {!isStudentMode && session && (
          <button onClick={handleLogout} className="absolute top-6 right-6 p-2 text-slate-300 hover:text-red-500">
            <LogOut size={28} />
          </button>
        )}
      </header>

      <nav className="bg-white border-b-4 border-green-100 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto flex justify-around">
          <NavButton active={activeTab === 'rankings'} icon={<Trophy size={20}/>} label="순위표" onClick={() => { setActiveTab('rankings'); setEditingMatch(null); }} />
          <NavButton active={activeTab === 'entry'} icon={<PlusCircle size={20}/>} label={editingMatch ? "기록 수정" : "경기 추가"} onClick={() => { setActiveTab('entry'); }} />
          <NavButton active={activeTab === 'history'} icon={<History size={20}/>} label="기록" onClick={() => { setActiveTab('history'); setEditingMatch(null); }} />
          <NavButton active={activeTab === 'admin'} icon={<SettingsIcon size={20}/>} label="관리자" onClick={() => { setActiveTab('admin'); setEditingMatch(null); }} />
        </div>
      </nav>

      <main className="max-w-4xl mx-auto p-4 mt-4 flex-grow w-full">
        {activeTab === 'rankings' && <Rankings teams={teams} matches={matches} />}
        {activeTab === 'entry' && <MatchEntry teacherId={teacherId!} teams={teams} onComplete={() => { fetchData(); setEditingMatch(null); setActiveTab('history'); }} settings={settings} editingMatch={editingMatch} onCancel={() => { setEditingMatch(null); setActiveTab('history'); }} />}
        {activeTab === 'history' && <MatchHistory teams={teams} matches={matches} onUpdate={fetchData} teacherId={teacherId!} onEdit={startEditing} accessCode={settings?.access_code || '1234'} />}
        {activeTab === 'admin' && <AdminPanel teacherId={teacherId!} settings={settings} teams={teams} matches={matches} onUpdate={fetchData} session={session} />}
      </main>

      <footer className="bg-white py-10 px-6 border-t border-slate-100 text-center space-y-4">
        <div className="flex flex-col items-center gap-1 text-slate-400 text-[10px] md:text-xs">
          <p className="flex items-center gap-1"><Mail size={12} /> 제안이나 문의사항이 있으시면 언제든 메일 주세요.</p>
          <p className="italic">(비밀번호 분실 시 이메일 주시면 초기화시켜 드립니다)</p>
        </div>
        <div className="text-slate-500 text-xs md:text-sm font-bold space-y-1">
          <p>Contact: <a href="mailto:sinjoppo@naver.com" className="text-blue-500 underline">sinjoppo@naver.com</a></p>
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
}

const NavButton: React.FC<NavButtonProps> = ({ active, icon, label, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex-1 flex flex-col items-center py-3 transition-all border-b-4 ${active ? 'text-green-600 border-green-600 bg-green-50' : 'text-slate-400 border-transparent'}`}
  >
    {icon}
    <span className="text-xs font-bold mt-1">{label}</span>
  </button>
);

export default App;
