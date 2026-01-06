
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { LogIn, UserPlus, Lock, User, HelpCircle, ArrowLeft, CheckCircle2, AlertCircle, X, ShieldCheck } from 'lucide-react';

const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // 비밀번호 찾기 단계 관리: 0(로그인/가입), 1(이메일 입력), 2(코드 및 새 비번 입력)
  const [resetStep, setResetStep] = useState(0);
  const [resetEmail, setResetEmail] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // 토스트 알림 상태
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; show: boolean }>({
    message: '',
    type: 'success',
    show: false
  });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type, show: true });
  };

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

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
      if (error) {
        if (error.status === 429) {
          showToast("너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해주세요.", "error");
        } else {
          showToast("아이디나 비밀번호를 다시 확인해 주세요.", "error");
        }
      }
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: username }
        }
      });

      if (error) {
        showToast("회원가입 실패: " + error.message, "error");
      } else {
        if (data.user) {
          await supabase.from('settings').insert({
            teacher_id: data.user.id,
            title: '우리 반 스포츠 리그',
            description: '정정당당 즐거운 경기!',
            notice: '가입을 환영합니다! 설정에서 정보를 수정해보세요.',
            access_code: '1234',
            bonus_config: ['매너 점수', '페어플레이']
          });
        }
        showToast("회원가입 완료! 이제 로그인 해주세요.", "success");
        setIsLogin(true);
      }
    }
    setLoading(false);
  };

  // 비밀번호 찾기 1단계: 이메일 발송
  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const email = resetEmail.includes('@') ? resetEmail : `${resetEmail.toLowerCase()}@classleague.internal`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    
    if (error) {
      if (error.status === 429) {
        showToast("요청이 너무 많습니다. 1~2분 뒤에 다시 시도해주세요.", "error");
      } else {
        showToast("이메일을 다시 확인해주세요. 이메일 확인이 안되면 관리자에게 비밀번호 초기화를 문의해 주세요.", "error");
      }
    } else {
      showToast("복구 코드가 발급되었습니다. 이메일을 확인하거나 다음 단계로 진행하세요.", "success");
      setResetStep(2);
    }
    setLoading(false);
  };

  // 비밀번호 찾기 2단계: 코드 검증 및 비번 변경
  const handleResetComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const email = resetEmail.includes('@') ? resetEmail : `${resetEmail.toLowerCase()}@classleague.internal`;
    
    try {
      // 복구 코드 검증
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: recoveryCode,
        type: 'recovery'
      });

      if (verifyError) {
        if (verifyError.status === 429) {
          showToast("인증 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.", "error");
        } else {
          showToast("복구 코드가 일치하지 않거나 만료되었습니다.", "error");
        }
        setLoading(false);
        return;
      }

      // 검증 성공 시 바로 비밀번호 업데이트
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        showToast("비밀번호 변경 중 오류가 발생했습니다: " + updateError.message, "error");
      } else {
        // 복구 과정에서 생성된 세션을 로그아웃시켜 수동 로그인을 유도함
        await supabase.auth.signOut();
        
        showToast("비밀번호 변경이 완료되었습니다.", "success");
        
        // 상태 초기화 및 로그인 화면으로 전환
        setResetStep(0);
        setResetEmail('');
        setRecoveryCode('');
        setNewPassword('');
        setIsLogin(true);
        // 로그인 아이디 필드에 이메일 자동 입력 (편의성)
        setUsername(resetEmail);
      }
    } catch (err) {
      showToast("예기치 못한 오류가 발생했습니다.", "error");
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50 p-6 relative overflow-hidden">
      {/* 커스텀 토스트 알림 */}
      {toast.show && (
        <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border animate-in slide-in-from-top-4 duration-300 ${
          toast.type === 'success' ? 'bg-green-600 border-green-400 text-white' : 'bg-red-600 border-red-400 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span className="font-bold text-sm whitespace-pre-wrap">{toast.message}</span>
          <button onClick={() => setToast(prev => ({ ...prev, show: false }))} className="ml-2 hover:opacity-70">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden border-2 border-green-100 transform transition-all">
        <div className="bg-green-500 p-10 text-center text-white relative">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="grid grid-cols-6 gap-2 p-2">
              {[...Array(24)].map((_, i) => <div key={i} className="w-4 h-4 rounded-full bg-white"></div>)}
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-2 relative z-10 font-kids">⚽️ 리그 매니저</h1>
          <p className="text-green-100 opacity-90 relative z-10">선생님을 위한 학급 리그 관리 도구</p>
        </div>

        {resetStep === 0 ? (
          /* 로그인 / 회원가입 폼 */
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

            {!isLogin && (
              <div className="bg-blue-50 p-4 rounded-2xl flex gap-3 text-blue-600 border border-blue-100 animate-in fade-in slide-in-from-top-2">
                <AlertCircle size={20} className="shrink-0 mt-0.5" />
                <p className="text-[11px] font-medium leading-relaxed">
                  이메일로 가입하시면 비밀번호 분실 시 해당 이메일로 복구코드가 발급됩니다. 
                  아이디로 가입하시면 비밀번호 분실 시 관리자 이메일로 비밀번호 초기화를 요청해주세요.
                </p>
              </div>
            )}

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
                onClick={() => setResetStep(1)}
                className="text-slate-300 text-sm font-medium hover:text-slate-500 flex items-center justify-center gap-1"
              >
                <HelpCircle size={14} /> 비밀번호 찾기
              </button>
            </div>
          </form>
        ) : resetStep === 1 ? (
          /* 비밀번호 찾기 1단계: 이메일 입력 */
          <div className="p-8 space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="text-center">
              <h2 className="text-xl font-bold text-slate-700 mb-2 font-kids">비밀번호 찾기</h2>
              <p className="text-xs text-slate-400">가입 시 입력했던 아이디나 이메일을 입력해주세요.</p>
            </div>
            
            <form onSubmit={handleResetRequest} className="space-y-4">
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                <input 
                  type="text" 
                  required
                  placeholder="아이디 또는 이메일" 
                  value={resetEmail}
                  onChange={e => setResetEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-green-400 transition-all font-medium"
                />
              </div>
              <button 
                type="submit"
                disabled={loading}
                className="w-full py-5 bg-blue-500 hover:bg-blue-600 text-white font-bold text-lg rounded-2xl shadow-lg transform transition-transform active:scale-95 disabled:opacity-50"
              >
                {loading ? '전송 중...' : '복구 코드 받기'}
              </button>
              <button 
                type="button"
                onClick={() => setResetStep(0)}
                className="w-full py-3 text-slate-400 font-bold flex items-center justify-center gap-2"
              >
                <ArrowLeft size={16} /> 이전으로
              </button>
            </form>
          </div>
        ) : (
          /* 비밀번호 찾기 2단계: 코드 및 새 비번 입력 */
          <div className="p-8 space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="text-center">
              <h2 className="text-xl font-bold text-slate-700 mb-2 font-kids">새 비밀번호 설정</h2>
              <p className="text-xs text-slate-400">전송된 복구 코드와 새 비밀번호를 입력하세요.</p>
            </div>
            
            <form onSubmit={handleResetComplete} className="space-y-4">
              <div className="relative">
                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                <input 
                  type="text" 
                  required
                  placeholder="6자리 복구 코드 입력" 
                  value={recoveryCode}
                  onChange={e => setRecoveryCode(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-green-400 text-center font-bold tracking-widest"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                <input 
                  type="password" 
                  required
                  placeholder="새로운 비밀번호" 
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-green-400 font-medium"
                />
              </div>
              <button 
                type="submit"
                disabled={loading}
                className="w-full py-5 bg-green-600 hover:bg-green-700 text-white font-bold text-lg rounded-2xl shadow-lg transform transition-transform active:scale-95 disabled:opacity-50"
              >
                {loading ? '변경 중...' : '비밀번호 변경 완료'}
              </button>
              <p className="text-[10px] text-slate-400 text-center italic">
                * 이메일로 발송된 6자리 숫자를 입력해 주세요.
              </p>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
