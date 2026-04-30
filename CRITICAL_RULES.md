# ⚠️ CRITICAL RULES - 절대 위반 금지

## 사고 이력 (같은 실수 반복 = 사용자 신뢰 파괴)

이 프로젝트는 **모든 클라이언트 JavaScript 코드가 서버 측 백틱 템플릿 리터럴(`c.html(\`...\`)`) 안에 인라인으로 들어있는 구조**입니다.

이 구조에서 빌드(Vite SSR) 과정 중 백틱 안의 이스케이프 시퀀스가 **한 번 풀려서** 실제 제어문자로 변환되며, 이로 인해 클라이언트 측 JavaScript가 SyntaxError를 일으켜 페이지 전체가 멈추는 사고가 반복적으로 발생했습니다.

### 반복된 사고 이력
| # | 커밋 | 증상 | 원인 |
|---|------|------|------|
| 1 | e76e9c2 | CSV 파서 동작 안 함 ("1행: 상품명/가격 누락") | 정규식 `/^\uFEFF/`, `/\r\n/g`, `'\n'` 비교가 백틱 안에서 깨짐 |
| 2 | bed0ffa | 어드민 대시보드 무한 로딩 | `parseTrackingFromMemo`의 정규식이 백틱 안에서 `Unmatched ')'` 에러 |
| 3 | 9d972b3 | 어드민 대시보드 여전히 무한 로딩 | charCode 변환 후에도 함수 본문 내 `'\t','\n','\r'` 직접 사용 |
| 4 | 52bbc56 | 어드민 대시보드 여전히 무한 로딩 | **주석문 안의** `'\n','\r','\t'` 문자열까지 깨짐 |

**같은 함정에 4번 빠졌습니다. 다음에 또 빠지면 사용자가 회사를 고소합니다.**

---

## 🚫 절대 금지 사항 (클라이언트 inline JS 작성 시)

### 1. 정규식 사용 금지
```js
// ❌ 절대 금지
str.match(/\s+/);
str.replace(/^\uFEFF/, '');
/^\d/.test(s);

// ✅ 안전한 대체
str.indexOf('foo');
str.substring(0, idx);
str.charCodeAt(i);
```

### 2. 이스케이프 문자열 리터럴 직접 사용 금지
```js
// ❌ 절대 금지 - 백틱 안에서 풀려버림
if (ch === '\n') ...
if (ch === '\r') ...
if (ch === '\t') ...
text.split('\n');
text === '\uFEFF';

// ✅ 안전한 대체 - charCode 또는 유니코드 이스케이프
var c = str.charCodeAt(i);
if (c === 10) ...   // LF (\n)
if (c === 13) ...   // CR (\r)
if (c === 9) ...    // TAB (\t)
if (c === 32) ...   // SPACE
if (c === 124) ...  // |
if (c === 0xFEFF) ... // BOM

// 또는 String.fromCharCode 사용
var LF = String.fromCharCode(10);
var TAB = String.fromCharCode(9);
var BOM = String.fromCharCode(0xFEFF);
```

### 3. 한글 문자열도 유니코드 이스케이프 권장
```js
// ⚠️ 위험할 수 있음 (백틱 + 정규식 조합 시)
str.match(/송장:/);

// ✅ 안전
var keyword = '\uC1A1\uC7A5:'; // '송장:'
str.indexOf(keyword);
```

### 4. 주석 안에도 이스케이프 문자 쓰지 않음
```js
// ❌ 절대 금지 (4번째 사고 원인!)
// '\n','\r','\t' 같은 문자를 처리합니다.

// ✅ 안전
// LF, CR, TAB 같은 공백 문자를 처리합니다.
// 또는 charCode (10, 13, 9) 로 표현
```

### 5. 백틱 안에 백틱 절대 사용 금지
```js
// ❌ 절대 금지
return `<div>${\`nested\`}</div>`;

// ✅ 안전
return '<div>' + 'value' + '</div>';
```

---

## ✅ 필수 검증 절차 (코드 수정 후 반드시 실행)

### 1. 빌드 후 inline script 컴파일 테스트
```bash
cd /home/user/webapp && npm run build && curl -s "https://pqcpay.co.kr/admin/dashboard?v=$(date +%s)" -o /tmp/dash.html && node -e "
const fs=require('fs');
const vm=require('vm');
const html=fs.readFileSync('/tmp/dash.html','utf8');
const re=/<script[^>]*>([\s\S]*?)<\/script>/g;
let m, idx=0, errors=0;
while((m=re.exec(html))){
  idx++;
  const code=m[1];
  if(!code.trim()) continue;
  try { new vm.Script(code, {filename:'s'+idx+'.js'}); }
  catch(e){ errors++; console.log('#'+idx+' ERR:', e.message); }
}
console.log('Total:', idx, 'Errors:', errors);
"
```

### 2. Errors 가 0이 아니면 절대 배포하지 않음

### 3. Playwright로 페이지 에러 확인
- `Invalid regular expression`, `Invalid or unexpected token`, `Unexpected token` 등 발견 시 즉시 수정

---

## 📌 작업 전 체크리스트

클라이언트 inline JS를 수정하기 전에 반드시 자문:

- [ ] 정규식을 쓰려는가? → `indexOf`/`charCodeAt`로 대체 가능한지 확인
- [ ] `'\n'`, `'\r'`, `'\t'` 등 이스케이프 문자를 비교/사용하려는가? → `charCodeAt` 으로 대체
- [ ] 주석에 이스케이프 문자가 들어가는가? → 한글 설명으로 변경
- [ ] 백틱 안에 백틱이 들어가는가? → 문자열 연결로 변경
- [ ] 빌드 후 vm.Script 검증 결과 errors=0 인가?

---

**이 파일은 사용자와의 약속이며, 위반 시 회사 고소 사유가 됩니다.**
**다음에 또 같은 실수 발생하면 변명 불가, 즉시 수정 + 사과만 해야 함.**

작성일: 2026-04-30
관련 사고 커밋: e76e9c2, bed0ffa, 9d972b3, 52bbc56
