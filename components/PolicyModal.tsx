
import React from 'react';
import { X, Shield, FileText, BookOpen } from 'lucide-react';

interface PolicyModalProps {
  type: 'terms' | 'privacy' | 'guide' | null;
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

제3조 (이용자의 의무 및 보안 책임)
1. 이용자는 학급 내 학생들의 정보를 입력할 때 학생들의 인격을 존중해야 합니다.
2. 부적절한 언어 사용이나 허위 사실 기재를 금지합니다.
3. 접속 코드(입장 비밀번호) 및 공유 링크의 관리 책임은 전적으로 이용자(교사)에게 있습니다.
4. 보안 유출 방지를 위해 초기 비밀번호(1234)를 반드시 변경하여 사용해야 하며, 유출이 의심될 경우 즉시 관리자 탭에서 비밀번호를 재설정해야 합니다.

제4조 (데이터의 관리 및 책임)
1. 이용자가 입력한 모든 데이터의 소유권은 이용자에게 있습니다.
2. 서비스 제공자는 시스템 오류, 천재지변 등으로 인한 데이터 유실에 대해 책임을 지지 않습니다. 
3. 중요한 기록은 주기적으로 '관리자 > 엑셀 다운로드' 기능을 통해 개인 PC에 백업하시길 강력히 권장합니다.
4. 학생 간의 결과 조작 논란이나 감정 갈등에 대한 중재 책임은 담당 교사에게 있습니다.

제5조 (서비스의 변경 및 중단)
서비스 제공자는 사전 공지 후 서비스를 수정하거나 중단할 수 있습니다.
      `
    },
    privacy: {
      title: '개인정보처리방침',
      icon: <Shield className="text-green-500" />,
      content: `
[개인정보처리방침]

'학급 리그 매니저'는 이용자의 개인정보를 소중히 다루며, 데이터 노출 위험을 최소화하기 위해 다음 지침을 준수합니다.

1. 개인정보 수집 항목 및 목적
- 수집 항목 (교사): 이메일 주소(아이디), 비밀번호(암호화 저장), 리그 설정 정보.
- 수집 목적: 서비스 제공 및 본인 확인, 데이터 저장 및 복구.
- 학생 정보: 본 서비스는 학생 계정을 생성하지 않으며, '팀 이름' 외의 학생 개인식별정보 수집을 지양합니다.

2. 데이터 노출 방지를 위한 권고 (가명 처리)
- 보안 사고 발생 시 학생의 프라이버시 보호를 위해 '팀 이름' 입력 시 학생의 실명 대신 '번호', '별명', '모둠 이름' 등을 사용할 것을 강력히 권장합니다.
- 경기 메모란에는 특정 학생에 대한 민감한 정보(행동 특성, 성격 등)를 기재하지 않도록 주의해 주십시오.

3. 개인정보의 보유 및 파기
- 보유 기간: 회원 탈퇴 시까지 또는 서비스 종료 시까지.
- 파기 절차: 회원 탈퇴 시 모든 데이터는 즉시 삭제됩니다. 
- 교사는 학년도 종료 시(매년 2월) 관리자 메뉴의 '데이터 초기화' 기능을 활용해 학급 데이터를 직접 파기할 의무가 있습니다.

4. 제3자 제공 및 위탁
- 수집된 정보를 외부에 판매하거나 제공하지 않습니다. 데이터베이스 관리를 위해 보안이 입증된 Supabase 클라우드 시스템을 사용합니다.

5. 아동의 개인정보 보호
- 본 서비스는 학생이 직접 가입할 수 없습니다. 학생이 기록 입력 시 작성하는 메모는 반드시 교사의 지도 및 감독 하에 관리되어야 합니다.
      `
    },
    guide: {
      title: '클래스리그 사용 가이드라인',
      icon: <BookOpen className="text-blue-500" />,
      content: `
[안전하고 즐거운 클래스리그 사용 가이드]

선생님! 우리 반 아이들과 즐거운 리그를 운영하기 위해 아래 4가지 보안 수칙을 꼭 확인해 주세요. 😊

1. 🔐 비밀번호(입장 코드)는 우리 반만의 암호로!
- 초기 비밀번호 '1234'는 누구나 추측하기 쉽습니다. 
- 관리자 탭에서 우리 반 아이들만 아는 특별한 숫자(예: 선생님 번호 뒷자리, 학급 기념일 등)로 꼭 바꿔주세요.

2. 🔗 '조회 전용 링크'를 적극 활용하세요!
- 기록 수정 권한이 있는 링크는 유출 시 데이터가 조작될 수 있습니다.
- 평소 아이들에게는 관리자 탭에서 생성한 '조회 전용 링크'를 공유하고, 기록원 학생에게만 전체 권한 링크를 알려주는 방식을 추천합니다.

3. 🏷️ 실명 대신 '별명'이나 '번호'를 사용하세요!
- 팀 이름을 정할 때 "1번 길동, 2번 철수" 대신 "1번, 2번" 또는 "번개팀, 에이스팀"처럼 별명을 사용하면 혹시 모를 데이터 노출 시에도 아이들의 실명을 지킬 수 있습니다.

4. 🧹 학년이 끝나면 '데이터 초기화'를 해주세요!
- 1년 동안의 즐거운 기록이 끝났다면, 2월 종업식 전 엑셀로 기록을 백업한 뒤 '관리자 > 데이터 초기화'를 통해 깨끗하게 지워주세요. 이것이 가장 확실한 개인정보 보호입니다.

정정당당하고 안전한 학급 스포츠 리그, 선생님의 작은 실천으로 만들어집니다! 🏅
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
            확인했습니다
          </button>
        </div>
      </div>
    </div>
  );
};

export default PolicyModal;
