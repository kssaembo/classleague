
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { LogIn, UserPlus, Lock, User, HelpCircle } from 'lucide-react';

const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // 이메일 형식이 아닐 경우 내부적으로 가상 도메인을 붙여 Supabase Auth 호환성 유지
  const formatEmail = (name: string) => {
    return name.includes('@') ? name : `${name.toLowerCase()}@classleague.internal`;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const email = formatEmail(username);

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) alert("로그인 실패: 아이디 또는 비밀번호를 확인해주세요.");
    } else {
      // 회원가입 시에는 teacher_id 기반 설정을 초기화함
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: username }
        }
      });

      if (error) {
        alert("회원가입 실패: " + error.message);
      } else {
        if (data.user) {
          // 초기 데이터 생성
          await supabase.from('settings').insert({
            teacher_id: data.user.id,
            title: '우리 반 스포츠 리그',
            description: '정정당당 즐거운 경기!',
            notice: '가입을 환영합니다! 설정에서 정보를 수정해보세요.',
            access_code: '1234',
            bonus_config: ['매너 점수', '페어플레이']
          });
        }
        alert("회원가입이 완료되었습니다! 이제 로그인 해주세요. (별도의 이메일 인증이 필요 없습니다)");
        setIsLogin(true);
      }
    }
    setLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!username) {
      alert("먼저 본인의 아이디를 입력한 후 '비밀번호 찾기'를 눌러주세요.");
      return;
    }
    const confirmed = window.confirm("비밀번호를 초기화 하시겠습니까?");
    if (confirmed) {
      const email = formatEmail(username);
      if (email.endsWith('@classleague.internal')) {
        alert("해당 계정은 아이디 방식 가입 계정으로 자동 초기화가 불가능합니다. 관리자(sinjoppo@naver.com)에게 아이디와 함께 문의주시면 수동으로 초기화해 드립니다.");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) alert(error.message);
        else alert("등록된 이메일 주소로 비밀번호 재설정 링크가 발송되었습니다.");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50 p-6">
      <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden border-2 border-green-100">
        <div className="bg-green-500 p-10 text-center text-white">
          <h1 className="text-4xl font-bold mb-2">⚽️ 리그 매니저</h1>
          <p className="text-green-100 opacity-90">선생님을 위한 학급 리그 관리 도구</p>
        </div>

        <form onSubmit={handleAuth} className="p-8 space-y-6">
          <div className="space-y-4">
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
              <input 
                type="text" 
                required
                placeholder="아이디 (또는 이메일)" 
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-green-400 transition-all font-medium"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
              <input 
                type="password" 
                required
                placeholder="비밀번호" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-green-400 transition-all font-medium"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-5 bg-green-500 hover:bg-green-600 text-white font-bold text-lg rounded-2xl shadow-lg transform transition-transform active:scale-95 disabled:opacity-50"
          >
            {loading ? '처리 중...' : (isLogin ? '로그인하기' : '선생님 가입하기')}
          </button>

          <div className="flex flex-col gap-3 text-center">
            <button 
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-slate-400 font-medium hover:text-green-500 transition-colors"
            >
              {isLogin ? '처음이신가요? 회원가입' : '이미 계정이 있나요? 로그인'}
            </button>
            <button 
              type="button"
              onClick={handleForgotPassword}
              className="text-slate-300 text-sm font-medium hover:text-slate-500 flex items-center justify-center gap-1"
            >
              <HelpCircle size={14} /> 비밀번호 찾기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
