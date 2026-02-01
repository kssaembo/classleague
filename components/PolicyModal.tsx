
import React from 'react';
import { X, Shield, FileText } from 'lucide-react';

interface PolicyModalProps {
  type: 'terms' | 'privacy' | null;
  onClose: () => void;
}

const PolicyModal: React.FC<PolicyModalProps> = ({ type, onClose }) => {
  if (!type) return null;

  const policies = {
    terms: {
      title: '이용약관',
      icon: <FileText className="text-indigo-500" />,
      content: `
[학급 리그 매니저 이용약관]

제1조 (목적)
본 약관은 '학급 리그 매니저'(이하 '서비스')를 이용함에 있어 서비스 제공자와 이용자(교사)의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.

제2조 (서비스의 성격)
1. 본 서비스는 초등학교 학급 운영을 돕기 위한 보조 도구입니다.
2. 서비스는 개인의 취미 및 교육적 목적을 위해 제작되었으며, 상업적 용도로 사용되지 않습니다.

제3조 (이용자의 의무)
1. 이용자는 학급 내 학생들의 정보를 입력할 때 학생들의 인격을 존중해야 합니다.
2. 부적절한 언어 사용이나 허위 사실 기재를 금지합니다.
3. 공유 링크 및 입장 코드의 관리 책임은 이용자에게 있습니다.

제4조 (데이터의 관리 및 책임)
1. 이용자가 입력한 모든 데이터의 소유권은 이용자에게 있습니다.
2. 서비스 제공자는 시스템 오류, 천재지변 등으로 인한 데이터 유실에 대해 책임을 지지 않습니다. 중요한 기록은 주기적으로 엑셀 다운로드 기능을 통해 백업하시길 권장합니다.
3. 학생 간의 갈등이나 조작 논란에 대한 중재 책임은 담당 교사에게 있습니다.

제5조 (서비스의 변경 및 중단)
서비스 제공자는 사전 공지 후 서비스를 수정하거나 중단할 수 있습니다.
      `
    },
    privacy: {
      title: '개인정보처리방침',
      icon: <Shield className="text-green-500" />,
      content: `
[개인정보처리방침]

'학급 리그 매니저'는 이용자의 개인정보를 보호하기 위해 다음과 같은 지침을 준수합니다.

1. 개인정보 수집 항목 및 목적
- 수집 항목 (교사): 이메일 주소, 비밀번호(암호화 저장), 리그 설정 정보.
- 수집 목적: 회원 가입 및 본인 확인, 비밀번호 찾기 기능 제공, 학급 데이터 저장.
- 학생 정보: 본 서비스는 학생의 계정을 생성하지 않으며, '팀 이름' 외의 학생 개인식별정보 수집을 지양합니다. 팀 이름에 학생 실명 입력을 최소화할 것을 권장합니다.

2. 개인정보의 보유 및 파기
- 보유 기간: 회원 탈퇴 시까지 또는 서비스 종료 시까지.
- 파기 절차: 회원 탈퇴 시 수집된 정보와 저장된 모든 리그 데이터는 DB에서 즉시 삭제됩니다.

3. 제3자 제공 및 위탁
- 본 서비스는 수집된 정보를 외부에 제공하거나 판매하지 않습니다.
- 데이터베이스 관리를 위해 Supabase 시스템을 사용합니다.

4. 이용자의 권리
- 이용자는 언제든지 본인의 정보를 수정하거나 탈퇴를 통해 삭제를 요청할 수 있습니다.

5. 아동의 개인정보 보호
- 본 서비스는 학생이 직접 가입하는 기능을 제공하지 않으며, 교사가 관리하는 보조 도구입니다. 경기 결과 입력 시 학생이 작성하는 메모는 교사의 지도 하에 관리되어야 합니다.
      `
    }
  };

  const activePolicy = policies[type];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden border-4 border-slate-100 flex flex-col">
        <div className="p-6 bg-slate-50 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            {activePolicy.icon}
            <h2 className="text-xl font-bold text-slate-800">{activePolicy.title}</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-8 overflow-y-auto bg-white">
          <pre className="text-slate-600 font-medium whitespace-pre-wrap leading-relaxed text-sm font-sans">
            {activePolicy.content.trim()}
          </pre>
        </div>

        <div className="p-6 bg-slate-50 border-t text-center">
          <button 
            onClick={onClose}
            className="px-12 py-3 bg-slate-800 text-white font-bold rounded-2xl shadow-lg hover:bg-slate-900 transition-all"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default PolicyModal;
