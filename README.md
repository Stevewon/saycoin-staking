# Staking DApp - 모바일 연동형 스테이킹 웹 애플리케이션

간단하고 안전한 모바일 최적화 스테이킹 DApp입니다.

## ✨ 주요 기능

- 📱 **모바일 반응형**: 모든 디바이스에서 완벽하게 작동
- 🔗 **다중 지갑 연결**: MetaMask, WalletConnect 등 지원
- 💎 **스테이킹/언스테이킹**: 간편한 자산 관리
- 🎁 **실시간 보상**: 즉시 청구 가능한 보상 시스템
- ⚡ **빠른 처리**: 최적화된 트랜잭션 처리
- 🎨 **현대적인 UI**: 다크 모드 기반 세련된 디자인

## 🚀 빠른 시작

### 설치

```bash
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

### 프로덕션 빌드

```bash
npm run build
```

## 🔧 설정

### WalletConnect 프로젝트 ID 설정

1. [WalletConnect Cloud](https://cloud.walletconnect.com)에서 프로젝트 생성
2. `src/utils/web3Config.js` 파일에서 `projectId` 업데이트:

```javascript
const projectId = 'YOUR_ACTUAL_PROJECT_ID'
```

### 스마트 컨트랙트 주소 설정

`src/contracts/stakingContract.js` 파일에서 배포된 컨트랙트 주소로 업데이트:

```javascript
export const STAKING_CONTRACT_ADDRESS = "0xYourContractAddress"
```

## 📱 지원 네트워크

- Ethereum Mainnet (Chain ID: 1)
- Sepolia Testnet (Chain ID: 11155111)
- Polygon (Chain ID: 137)

## 🛠️ 기술 스택

- **React 18**: 최신 React 기능 활용
- **Vite**: 빠른 개발 환경
- **ethers.js v6**: 블록체인 상호작용
- **Web3Modal**: 다중 지갑 연결 지원
- **CSS3**: 반응형 디자인

## 📐 프로젝트 구조

```
src/
├── components/        # React 컴포넌트
│   ├── Header.jsx    # 헤더 및 지갑 연결
│   ├── StatsCard.jsx # 통계 카드
│   ├── StakingPanel.jsx # 스테이킹 패널
│   └── RewardsPanel.jsx # 보상 패널
├── hooks/            # 커스텀 React Hooks
│   └── useStaking.js # 스테이킹 로직
├── contracts/        # 스마트 컨트랙트 인터페이스
│   └── stakingContract.js
├── utils/            # 유틸리티 함수
│   └── web3Config.js # Web3 설정
├── App.jsx           # 메인 앱 컴포넌트
├── App.css           # 앱 스타일
├── main.jsx          # 진입점
└── index.css         # 글로벌 스타일
```

## 🔒 보안 고려사항

- ⚠️ 이 프로젝트는 테스트용입니다
- 🔐 실제 운영 환경에서는 스마트 컨트랙트 감사 필수
- 🛡️ 프라이빗 키는 절대 노출하지 마세요
- ✅ 테스트넷에서 충분한 테스트 후 메인넷 배포

## 📝 사용 방법

1. **지갑 연결**: 우측 상단의 "지갑 연결" 버튼 클릭
2. **스테이킹**: 원하는 금액 입력 후 "스테이킹 하기" 클릭
3. **보상 확인**: 실시간으로 누적되는 보상 확인
4. **보상 청구**: "보상 청구하기" 버튼으로 보상 수령
5. **언스테이킹**: 필요시 스테이킹된 자산 회수

## 🌐 모바일 최적화

- ✅ 터치 친화적인 UI
- ✅ 반응형 레이아웃 (모바일/태블릿/데스크톱)
- ✅ 최적화된 폰트 크기
- ✅ 모바일 지갑 앱 연동 지원

## 📄 라이선스

MIT License

## 🤝 기여

이슈와 풀 리퀘스트를 환영합니다!

---

Made with ❤️ by Staking DApp Team
