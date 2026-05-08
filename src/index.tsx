import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'

type Bindings = {
  DB: D1Database;
}

const app = new Hono<{ Bindings: Bindings }>()

// No-cache for HTML pages (prevent stale browser cache)
app.use('*', async (c, next) => {
  await next()
  const ct = c.res.headers.get('content-type') || ''
  if (ct.includes('text/html')) {
    c.res.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    c.res.headers.set('Pragma', 'no-cache')
    c.res.headers.set('Expires', '0')
  }
})

// Enable CORS
app.use('/api/*', cors())

// Serve static files with long cache
app.use('/static/*', serveStatic({ root: './public' }))

// ============================================
// Admin Auth Helpers
// ============================================
const ADMIN_ID = 'admin'
const ADMIN_PW = 'Qta@2026!Sec#Admin'

// ============================================
// Server-side i18n Helper
// ============================================
const serverTranslations: Record<string, Record<string, string>> = {
  ko: {
    'auth.admin_required': '관리자 인증이 필요합니다',
    'auth.invalid_token': '유효하지 않은 관리자 토큰입니다',
    'auth.admin_login_fail': '관리자 ID 또는 비밀번호가 일치하지 않습니다',
    'auth.login_error': '로그인 중 오류가 발생했습니다',
    'auth.all_fields_required': '모든 필드를 입력해주세요',
    'auth.invalid_phone': '올바른 전화번호 형식이 아닙니다 (010-XXXX-XXXX)',
    'auth.invalid_qkey_wallet': '올바른 QKEY 지갑주소 형식이 아닙니다 (예: 0xE0c1...f0e)',
    'auth.invalid_usdt_wallet': '올바른 USDT 지갑주소 형식이 아닙니다 (예: 0xE0c1...f0e)',
    'auth.referral_required': '추천인 코드는 필수입니다',
    'auth.invalid_referral': '유효하지 않은 추천인 코드입니다',
    'auth.email_exists': '이미 존재하는 이메일입니다',
    'auth.phone_exists': '이미 등록된 전화번호입니다',
    'auth.wallet_exists': '이미 등록된 지갑주소입니다',
    'auth.register_success': '회원가입이 완료되었습니다',
    'auth.register_error': '회원가입 중 오류가 발생했습니다',
    'auth.email_password_required': '이메일과 비밀번호를 입력해주세요',
    'auth.invalid_credentials': '이메일 또는 비밀번호가 일치하지 않습니다',
    'auth.login_success': '로그인 성공',
    'auth.name_phone_required': '이름과 전화번호를 입력해주세요',
    'auth.account_not_found': '일치하는 계정을 찾을 수 없습니다',
    'auth.find_id_error': '아이디 찾기 중 오류가 발생했습니다',
    'auth.email_phone_required': '이메일과 전화번호를 입력해주세요',
    'auth.temp_password_issued': '임시 비밀번호가 발급되었습니다. 로그인 후 반드시 비밀번호를 변경해주세요.',
    'auth.wallet_required': 'QKEY 지갑주소를 입력해주세요',
    'auth.find_pw_error': '비밀번호 찾기 중 오류가 발생했습니다',
    'profile.required_fields': '필수 정보를 입력해주세요',
    'profile.update_success': '프로필이 업데이트되었습니다',
    'profile.update_error': '프로필 업데이트 중 오류가 발생했습니다',
    'withdrawal.invalid_coin': '유효하지 않은 코인 타입입니다',
    'withdrawal.invalid_amount': '유효한 수량을 입력해주세요',
    'withdrawal.user_not_found': '사용자를 찾을 수 없습니다',
    'withdrawal.insufficient_balance': '잔액이 부족합니다 (출금 대기 중인 금액 포함)',
    'withdrawal.request_success': '출금 신청이 완료되었습니다',
    'withdrawal.request_error': '출금 신청 중 오류가 발생했습니다',
    'withdrawal.list_error': '출금 신청 목록 조회 중 오류가 발생했습니다',
    'swap.required_fields': '필수 정보를 입력해주세요',
    'swap.min_amount': '최소 스왑 수량은 100 USDT입니다',
    'swap.unit_error': '스왑 수량은 100 단위로만 가능합니다 (예: 100, 200, 300...)',
    'swap.user_not_found': '사용자를 찾을 수 없습니다',
    'swap.insufficient_qkey': 'QKEY 잔액이 부족합니다',
    'swap.success': 'QKEY가 USDT로 스왑되었습니다',
    'swap.error': '스왑 중 오류가 발생했습니다',
    'staking.required_fields': '필수 정보를 입력해주세요',
    'staking.invalid_amount': '유효한 금액을 입력해주세요',
    'staking.min_amount': '최소 투자금액은 $1,000입니다',
    'staking.unit_error': '투자금액은 $1,000 단위로만 입력 가능합니다',
    'staking.create_success': '투자 신청이 완료되었습니다. 관리자 승인 후 코인이 지급됩니다.',
    'staking.create_error': '투자 신청 중 오류가 발생했습니다',
    'staking.txid_required': 'TXID를 입력해주세요',
    'staking.txid_invalid': '올바른 TXID 형식이 아닙니다 (0x로 시작하는 66자리)',
    'staking.txid_success': 'TXID가 등록되었습니다',
    'staking.txid_error': 'TXID 저장 중 오류가 발생했습니다',
    'staking.list_error': '스테이킹 목록 조회 중 오류가 발생했습니다',
    'admin.pending_not_found': '승인 대기 중인 투자를 찾을 수 없습니다',
    'admin.approve_success': '투자가 승인되었습니다. 코인이 지급되었습니다.',
    'admin.approve_error': '투자 승인 중 오류가 발생했습니다',
    'admin.staking_pending_not_found': '승인 대기 중인 스테이킹을 찾을 수 없습니다',
    'admin.reject_success': '스테이킹이 거절되었습니다.',
    'admin.reject_error': '스테이킹 거절 중 오류가 발생했습니다',
    'admin.pending_list_error': '승인 대기 목록 조회 중 오류가 발생했습니다',
    'admin.all_list_error': '전체 목록 조회 중 오류가 발생했습니다',
    'admin.users_list_error': '사용자 목록 조회 중 오류가 발생했습니다',
    'admin.user_not_found': '존재하지 않는 사용자입니다',
    'admin.active_staking_block': '진행 중인 스테이킹이 있는 사용자는 탈퇴시킬 수 없습니다',
    'admin.delete_success': '사용자가 성공적으로 탈퇴 처리되었습니다',
    'admin.delete_error': '사용자 탈퇴 처리 중 오류가 발생했습니다',
    'admin.no_users_to_delete': '삭제할 사용자가 없습니다',
    'admin.bulk_delete_success': '명의 사용자가 삭제되었습니다',
    'admin.bulk_delete_error': '일괄 삭제 중 오류가 발생했습니다',
    'admin.rewards_error': '배당 현황 조회 중 오류가 발생했습니다',
    'admin.withdrawals_error': '출금 관리 조회 중 오류가 발생했습니다',
    'admin.wd_pending_not_found': '승인 대기 중인 출금 신청을 찾을 수 없습니다',
    'admin.wd_approve_success': '출금이 승인되었습니다',
    'admin.wd_approve_error': '출금 승인 중 오류가 발생했습니다',
    'admin.wd_reject_success': '출금이 거절되었습니다. 잔액이 환불되었습니다.',
    'admin.wd_reject_error': '출금 거절 중 오류가 발생했습니다',
    'admin.user_detail_error': '회원 상세 조회 중 오류가 발생했습니다',
    'admin.signups_error': '가입 현황 조회 중 오류가 발생했습니다',
    'admin.sales_error': '매출 현황 조회 중 오류가 발생했습니다',
    'admin.member_not_found': '회원을 찾을 수 없습니다',
    'admin.downline_error': '산하 매출 조회 중 오류가 발생했습니다',
    'admin.downline_search_placeholder': '아이디/이름/추천코드로 검색...',
    'admin.downline_search_prompt': '회원을 검색하세요',
    'admin.downline_enter_query': '검색어를 입력해주세요',
    'admin.downline_no_result': '검색 결과가 없습니다',
    'admin.search_required': '검색어를 입력해주세요',
    'admin.search_error': '회원 검색 중 오류가 발생했습니다',
    'admin.member_rewards_error': '수당 현황 조회 중 오류가 발생했습니다',
    'admin.export_wd_error': '출금내역 내보내기 실패',
    'admin.export_sales_error': '매출내역 내보내기 실패',
    'admin.export_users_error': '회원목록 내보내기 실패',
    'admin.export_rewards_error': '수당내역 내보내기 실패',
    'admin.join_date': '가입일',
    'admin.investment_amount': '투자금액',
    'admin.downline_sales': '산하 매출 조회',
    'admin.downline_sales_btn': '산하 매출',
    'admin.view_detail': '상세 조회',
    'admin.force_delete': '강제 탈퇴',
    'admin.title': '관리자',
    'admin.subtitle': '관리 패널',
    'admin.dashboard': '대시보드',
    'admin.login': '로그인',
    'admin.login_fail': '로그인 실패',
    'admin.logout': '로그아웃',
    'admin.id': '아이디',
    'admin.password': '비밀번호',
    'admin.loading': '로딩 중...',
    'admin.no_data': '데이터 없음',
    'admin.approve': '승인',
    'admin.reject': '거절',
    'admin.rejected': '거절됨',
    'admin.pending': '대기중',
    'admin.approve_confirm': '승인하시겠습니까?',
    'admin.reject_confirm': '거절하시겠습니까?',
    'admin.approve_fail': '승인 실패',
    'admin.reject_fail': '거절 실패',
    'admin.reject_refund': '거절 및 환불',
    'admin.tab_pending': '승인 대기',
    'admin.tab_all': '전체 목록',
    'admin.tab_users': '회원 관리',
    'admin.tab_rewards': '배당 관리',
    'admin.tab_sales': '매출 현황',
    'admin.tab_signups': '가입 현황',
    'admin.tab_withdrawals': '출금 관리',
    'admin.tab_member_rewards': '수당 현황',
    'admin.pending_title': '승인 대기 목록',
    'admin.all_title': '전체 스테이킹 목록',
    'admin.user_list': '회원 목록',
    'admin.user_detail': '회원 상세',
    'admin.user_detail_fail': '회원 상세 조회 실패',
    'admin.rewards_title': '배당 현황',
    'admin.withdrawals_title': '출금 관리',
    'admin.sales_title': '매출 현황',
    'admin.signups_title': '가입 현황',
    'admin.member_rewards_title': '수당 현황',
    'admin.downline_title': '산하 매출 조회',
    'admin.downline_search': '산하 검색',
    'admin.downline_fail': '산하 매출 조회 실패',
    'admin.export_csv': 'CSV 내보내기',
    'admin.total_users': '총 회원수',
    'admin.total_sales': '총 매출',
    'admin.total_sales_all': '총 매출 (전체)',
    'admin.new_signups': '신규 가입',
    'admin.today': '오늘',
    'admin.this_week': '이번 주',
    'admin.this_month': '이번 달',
    'admin.col_name': '이름',
    'admin.col_name_short': '이름',
    'admin.col_email': '아이디(이메일)',
    'admin.col_email_short': '아이디',
    'admin.col_country': '국가',
    'admin.col_status': '상태',
    'admin.col_date': '날짜',
    'admin.col_member': '회원',
    'admin.col_investment': '투자금',
    'admin.col_entry_amount': '진입금액',
    'admin.col_sale_amount': '판매금액',
    'admin.col_sale_date': '판매일',
    'admin.col_referrer': '추천인',
    'admin.col_daily_reward': '일일배당',
    'admin.col_referral_reward': '추천보상',
    'admin.col_total_reward': '총 보상',
    'admin.col_paid_qkey': '지급 QKEY',
    'admin.col_qkey_balance': 'QKEY 잔액',
    'admin.col_rate': '배율',
    'admin.status_active': '활성',
    'admin.status_completed': '완료',
    'admin.status_pending': '대기',
    'admin.status_rejected': '거절',
    'admin.no_pending': '대기 중인 항목 없음',
    'admin.no_stakings': '스테이킹 없음',
    'admin.no_staking': '스테이킹 없음',
    'admin.no_users': '회원 없음',
    'admin.no_rewards': '배당 없음',
    'admin.no_withdrawals': '출금 내역 없음',
    'admin.no_sales': '매출 없음',
    'admin.no_signups': '가입 없음',
    'admin.no_tx': '거래 내역 없음',
    'admin.no_reward_history': '보상 내역 없음',
    'admin.no_withdrawal_history': '출금 내역 없음',
    'admin.no_level1': '1대 추천인 없음',
    'admin.no_level2': '2대 추천인 없음',
    'admin.people_unit': '명',
    'admin.cases_unit': '건',
    'admin.days_unit': '일',
    'admin.amount_label': '금액',
    'admin.coin_label': '코인',
    'admin.qty_label': '수량',
    'admin.rate_label': '배율',
    'admin.type_label': '유형',
    'admin.desc_label': '설명',
    'admin.date_label': '날짜',
    'admin.status_label': '상태',
    'admin.period_label': '기간',
    'admin.email_label': '이메일',
    'admin.phone_label': '전화번호',
    'admin.start_date': '시작일',
    'admin.end_date': '종료일',
    'admin.staking_period': '스테이킹 기간',
    'admin.staking_section': '스테이킹 정보',
    'admin.reward_section': '보상 정보',
    'admin.tx_section': '거래 내역',
    'admin.withdrawal_section': '출금 내역',
    'admin.referral_code_label': '추천코드',
    'admin.referral_code_short': '추천코드: ',
    'admin.referrer_label': '추천인',
    'admin.referrer_none': '없음',
    'admin.referees_label': '피추천인',
    'admin.referral_total': '추천 총계',
    'admin.referral_reward_total': '추천 보상 총계',
    'admin.daily_rate': '일일 배당률',
    'admin.daily_total': '일일 배당 합계',
    'admin.daily_reward_title': '일일 배당금 지급',
    'admin.daily_reward_btn': '일일 배당금 지급',
    'admin.daily_reward_desc': '활성 스테이킹에 대해 일일 배당금을 지급합니다',
    'admin.daily_reward_confirm': '일일 배당금을 지급하시겠습니까?',
    'admin.daily_reward_fail': '배당금 지급 실패',
    'admin.daily_reward_processing': '배당금 지급 처리 중...',
    'admin.daily_reward_people': '명에게 지급',
    'admin.daily_reward_skipped': '건 스킵',
    'admin.daily_reward_total_qkey': '총 지급 QKEY',
    'admin.today_paid': '오늘 지급',
    'admin.total_paid_count': '총 지급 횟수',
    'admin.total_qkey_paid': '총 지급 QKEY',
    'admin.recent_rewards': '최근 배당',
    'admin.active_staking': '활성 스테이킹',
    'admin.grand_total': '총합계',
    'admin.direct_sale': '직접 판매',
    'admin.level1_sales': '1대 매출',
    'admin.level2_sales': '2대 매출',
    'admin.level1_downline': '1대 산하',
    'admin.level2_downline': '2대 산하',
    'admin.level1_matching': '1대 매칭',
    'admin.level2_matching': '2대 매칭',
    'admin.back_to_user': '회원 목록으로',
    'admin.load_fail': '로드 실패',
    'admin.download_fail': '다운로드 실패',
    'admin.copy_fail': '복사 실패',
    'admin.wallet_copied': '지갑 주소가 복사되었습니다',
    'admin.copy_wallet_title_qkey': 'QKEY 지갑 복사',
    'admin.copy_wallet_title_usdt': 'USDT 지갑 복사',
    'admin.qkey_wallet_label': 'QKEY 지갑',
    'admin.usdt_wallet_label': 'USDT 지갑',
    'admin.txid_not_registered': 'TXID 미등록',
    'admin.txid_unregistered': '미등록',
    'admin.delete_confirm1': '정말 탈퇴시키시겠습니까?',
    'admin.delete_confirm2': '이 작업은 되돌릴 수 없습니다.',
    'admin.delete_irreversible': '복구 불가',
    'admin.delete_fail': '탈퇴 처리 실패',
    'admin.delete_user_label': '사용자',
    'admin.delete_name_label': '이름',
    'admin.delete_email_label': '이메일',
    'admin.delete_staking_label': '스테이킹',
    'admin.delete_active_staking': '활성 스테이킹 있음',
    'admin.delete_has_staking': '스테이킹 보유',
    'admin.wd_pending': '출금 대기',
    'admin.wd_approved': '출금 승인됨',
    'admin.wd_rejected': '출금 거절됨',
    'admin.wd_total': '총 출금',
    'admin.wd_approve_confirm': '출금을 승인하시겠습니까?',
    'admin.wd_approve_fail': '출금 승인 실패',
    'admin.wd_reject_confirm': '출금을 거절하시겠습니까?',
    'admin.wd_reject_fail': '출금 거절 실패',
    'admin.no_search_result': '검색 결과 없음',
    'rewards.no_active': '활성 투자가 없거나 아직 첫 지급일이 아닙니다',
    'rewards.daily_error': '일일 배당금 지급 중 오류가 발생했습니다',
    'rewards.history_error': '보상 내역 조회 중 오류가 발생했습니다',
    'user.not_found': '사용자를 찾을 수 없습니다',
    'user.info_error': '사용자 정보 조회 중 오류가 발생했습니다',
    'user.tx_error': '거래 내역 조회 중 오류가 발생했습니다',
    'referral.error': '추천인 현황 조회 중 오류가 발생했습니다',
    'referral.rewards_error': '보상 내역 조회 중 오류가 발생했습니다',
    'csv.id': 'ID', 'csv.email': '이메일', 'csv.name': '이름', 'csv.coin_type': '코인종류',
    'csv.amount': '수량', 'csv.wallet_address': '지갑주소', 'csv.status': '상태',
    'csv.request_date': '신청일', 'csv.process_date': '처리일',
    'csv.pending': '대기', 'csv.approved': '승인', 'csv.rejected': '거절',
    'csv.country': '국가', 'csv.language': '언어', 'csv.sale_amount': '판매금액($)',
    'csv.period_days': '거치기간(일)', 'csv.daily_rate': '일일배당률',
    'csv.start_date': '시작일', 'csv.end_date': '종료일',
    'csv.active': '진행중', 'csv.completed': '완료',
    'csv.phone': '전화번호', 'csv.qkey_wallet': 'QKEY지갑', 'csv.usdt_wallet': 'USDT지갑',
    'csv.qta_balance': 'QTA잔액', 'csv.qx_balance': 'QX잔액',
    'csv.qkey_balance': 'QKEY잔액', 'csv.usdt_balance': 'USDT잔액',
    'csv.referral_code': '추천코드', 'csv.staking_amount': '투자금액($)', 'csv.join_date': '가입일',
    'csv.daily_total': '일일배당합계(QKEY)', 'csv.referral_total': '추천보상합계(QKEY)',
    'csv.total_reward': '총수당(QKEY)',
  },
  en: {
    'auth.admin_required': 'Admin authentication required',
    'auth.invalid_token': 'Invalid admin token',
    'auth.admin_login_fail': 'Admin ID or password does not match',
    'auth.login_error': 'An error occurred during login',
    'auth.all_fields_required': 'All fields are required',
    'auth.invalid_phone': 'Invalid phone number format (010-XXXX-XXXX)',
    'auth.invalid_qkey_wallet': 'Invalid QKEY wallet address format (e.g., 0xE0c1...f0e)',
    'auth.invalid_usdt_wallet': 'Invalid USDT wallet address format (e.g., 0xE0c1...f0e)',
    'auth.referral_required': 'Referral code is required',
    'auth.invalid_referral': 'Invalid referral code',
    'auth.email_exists': 'Email already exists',
    'auth.phone_exists': 'Phone number already registered',
    'auth.wallet_exists': 'Wallet address already registered',
    'auth.register_success': 'Registration completed successfully',
    'auth.register_error': 'An error occurred during registration',
    'auth.email_password_required': 'Please enter email and password',
    'auth.invalid_credentials': 'Email or password does not match',
    'auth.login_success': 'Login successful',
    'auth.name_phone_required': 'Please enter name and phone number',
    'auth.account_not_found': 'No matching account found',
    'auth.find_id_error': 'An error occurred while finding ID',
    'auth.email_phone_required': 'Please enter email and phone number',
    'auth.temp_password_issued': 'Temporary password has been issued. Please change your password after login.',
    'auth.wallet_required': 'Please enter your QKEY wallet address',
    'auth.find_pw_error': 'An error occurred while finding password',
    'profile.required_fields': 'Required fields are missing',
    'profile.update_success': 'Profile has been updated',
    'profile.update_error': 'An error occurred while updating profile',
    'withdrawal.invalid_coin': 'Invalid coin type',
    'withdrawal.invalid_amount': 'Please enter a valid amount',
    'withdrawal.user_not_found': 'User not found',
    'withdrawal.insufficient_balance': 'Insufficient balance (including pending withdrawals)',
    'withdrawal.request_success': 'Withdrawal request completed',
    'withdrawal.request_error': 'An error occurred during withdrawal request',
    'withdrawal.list_error': 'An error occurred while fetching withdrawal list',
    'swap.required_fields': 'Required fields are missing',
    'swap.min_amount': 'Minimum swap amount is 100 USDT',
    'swap.unit_error': 'Swap amount must be in units of 100 (e.g., 100, 200, 300...)',
    'swap.user_not_found': 'User not found',
    'swap.insufficient_qkey': 'Insufficient QKEY balance',
    'swap.success': 'QKEY has been swapped to USDT',
    'swap.error': 'An error occurred during swap',
    'staking.required_fields': 'Required fields are missing',
    'staking.invalid_amount': 'Please enter a valid amount',
    'staking.min_amount': 'Minimum investment is $1,000',
    'staking.unit_error': 'Investment must be in units of $1,000',
    'staking.create_success': 'Investment application completed. Coins will be distributed after admin approval.',
    'staking.create_error': 'An error occurred during investment application',
    'staking.txid_required': 'Please enter TXID',
    'staking.txid_invalid': 'Invalid TXID format (66 characters starting with 0x)',
    'staking.txid_success': 'TXID has been registered',
    'staking.txid_error': 'An error occurred while saving TXID',
    'staking.list_error': 'An error occurred while fetching staking list',
    'admin.pending_not_found': 'No pending investment found',
    'admin.approve_success': 'Investment approved. Coins have been distributed.',
    'admin.approve_error': 'An error occurred during investment approval',
    'admin.staking_pending_not_found': 'No pending staking found',
    'admin.reject_success': 'Staking has been rejected.',
    'admin.reject_error': 'An error occurred during staking rejection',
    'admin.pending_list_error': 'An error occurred while fetching pending list',
    'admin.all_list_error': 'An error occurred while fetching all list',
    'admin.users_list_error': 'An error occurred while fetching user list',
    'admin.user_not_found': 'User does not exist',
    'admin.active_staking_block': 'Cannot delete user with active staking',
    'admin.delete_success': 'User has been successfully deleted',
    'admin.delete_error': 'An error occurred while deleting user',
    'admin.no_users_to_delete': 'No users to delete',
    'admin.bulk_delete_success': ' user(s) have been deleted',
    'admin.bulk_delete_error': 'An error occurred during bulk deletion',
    'admin.rewards_error': 'An error occurred while fetching rewards status',
    'admin.withdrawals_error': 'An error occurred while fetching withdrawals',
    'admin.wd_pending_not_found': 'No pending withdrawal request found',
    'admin.wd_approve_success': 'Withdrawal has been approved',
    'admin.wd_approve_error': 'An error occurred during withdrawal approval',
    'admin.wd_reject_success': 'Withdrawal has been rejected. Balance has been refunded.',
    'admin.wd_reject_error': 'An error occurred during withdrawal rejection',
    'admin.user_detail_error': 'An error occurred while fetching user details',
    'admin.signups_error': 'An error occurred while fetching signup status',
    'admin.sales_error': 'An error occurred while fetching sales status',
    'admin.member_not_found': 'Member not found',
    'admin.downline_error': 'An error occurred while fetching downline sales',
    'admin.downline_search_placeholder': 'Search by ID/name/referral code...',
    'admin.downline_search_prompt': 'Search for a member',
    'admin.downline_enter_query': 'Please enter a search term',
    'admin.downline_no_result': 'No results found',
    'admin.search_required': 'Please enter a search term',
    'admin.search_error': 'An error occurred while searching members',
    'admin.member_rewards_error': 'An error occurred while fetching member rewards',
    'admin.export_wd_error': 'Failed to export withdrawal history',
    'admin.export_sales_error': 'Failed to export sales history',
    'admin.export_users_error': 'Failed to export member list',
    'admin.export_rewards_error': 'Failed to export rewards history',
    'rewards.no_active': 'No active investments or first payment date has not arrived',
    'rewards.daily_error': 'An error occurred during daily reward distribution',
    'rewards.history_error': 'An error occurred while fetching reward history',
    'user.not_found': 'User not found',
    'user.info_error': 'An error occurred while fetching user info',
    'user.tx_error': 'An error occurred while fetching transaction history',
    'referral.error': 'An error occurred while fetching referral status',
    'referral.rewards_error': 'An error occurred while fetching reward history',
    'csv.id': 'ID', 'csv.email': 'Email', 'csv.name': 'Name', 'csv.coin_type': 'Coin Type',
    'csv.amount': 'Amount', 'csv.wallet_address': 'Wallet Address', 'csv.status': 'Status',
    'csv.request_date': 'Request Date', 'csv.process_date': 'Process Date',
    'csv.pending': 'Pending', 'csv.approved': 'Approved', 'csv.rejected': 'Rejected',
    'csv.country': 'Country', 'csv.language': 'Language', 'csv.sale_amount': 'Sale Amount($)',
    'csv.period_days': 'Period(days)', 'csv.daily_rate': 'Daily Rate',
    'csv.start_date': 'Start Date', 'csv.end_date': 'End Date',
    'csv.active': 'Active', 'csv.completed': 'Completed',
    'csv.phone': 'Phone', 'csv.qkey_wallet': 'QKEY Wallet', 'csv.usdt_wallet': 'USDT Wallet',
    'csv.qta_balance': 'QTA Balance', 'csv.qx_balance': 'QX Balance',
    'csv.qkey_balance': 'QKEY Balance', 'csv.usdt_balance': 'USDT Balance',
    'csv.referral_code': 'Referral Code', 'csv.staking_amount': 'Staking($)', 'csv.join_date': 'Join Date',
    'csv.daily_total': 'Daily Total(QKEY)', 'csv.referral_total': 'Referral Total(QKEY)',
    'csv.total_reward': 'Total Reward(QKEY)',
  },
  ja: {
    'auth.admin_required': '管理者認証が必要です',
    'auth.invalid_token': '無効な管理者トークンです',
    'auth.admin_login_fail': '管理者IDまたはパスワードが一致しません',
    'auth.login_error': 'ログイン中にエラーが発生しました',
    'auth.all_fields_required': 'すべてのフィールドを入力してください',
    'auth.invalid_phone': '正しい電話番号形式ではありません (010-XXXX-XXXX)',
    'auth.invalid_qkey_wallet': '正しいQKEYウォレットアドレス形式ではありません (例: 0xE0c1...f0e)',
    'auth.invalid_usdt_wallet': '正しいUSDTウォレットアドレス形式ではありません (例: 0xE0c1...f0e)',
    'auth.referral_required': '紹介コードは必須です',
    'auth.invalid_referral': '無効な紹介コードです',
    'auth.email_exists': 'すでに存在するメールアドレスです',
    'auth.phone_exists': 'すでに登録されている電話番号です',
    'auth.wallet_exists': 'すでに登録されているウォレットアドレスです',
    'auth.register_success': '会員登録が完了しました',
    'auth.register_error': '会員登録中にエラーが発生しました',
    'auth.email_password_required': 'メールアドレスとパスワードを入力してください',
    'auth.invalid_credentials': 'メールアドレスまたはパスワードが一致しません',
    'auth.login_success': 'ログイン成功',
    'auth.name_phone_required': '名前と電話番号を入力してください',
    'auth.account_not_found': '一致するアカウントが見つかりません',
    'auth.find_id_error': 'ID検索中にエラーが発生しました',
    'auth.email_phone_required': 'メールアドレスと電話番号を入力してください',
    'auth.temp_password_issued': '仮パスワードが発行されました。ログイン後、必ずパスワードを変更してください。',
    'auth.wallet_required': 'QKEYウォレットアドレスを入力してください',
    'auth.find_pw_error': 'パスワード検索中にエラーが発生しました',
    'profile.required_fields': '必須情報を入力してください',
    'profile.update_success': 'プロフィールが更新されました',
    'profile.update_error': 'プロフィール更新中にエラーが発生しました',
    'withdrawal.invalid_coin': '無効なコインタイプです',
    'withdrawal.invalid_amount': '有効な数量を入力してください',
    'withdrawal.user_not_found': 'ユーザーが見つかりません',
    'withdrawal.insufficient_balance': '残高が不足しています（出金待ち金額を含む）',
    'withdrawal.request_success': '出金申請が完了しました',
    'withdrawal.request_error': '出金申請中にエラーが発生しました',
    'withdrawal.list_error': '出金申請リストの取得中にエラーが発生しました',
    'swap.required_fields': '必須情報を入力してください',
    'swap.min_amount': '最小スワップ数量は100 USDTです',
    'swap.unit_error': 'スワップ数量は100単位のみ可能です（例：100, 200, 300...）',
    'swap.user_not_found': 'ユーザーが見つかりません',
    'swap.insufficient_qkey': 'QKEY残高が不足しています',
    'swap.success': 'QKEYがUSDTにスワップされました',
    'swap.error': 'スワップ中にエラーが発生しました',
    'staking.required_fields': '必須情報を入力してください',
    'staking.invalid_amount': '有効な金額を入力してください',
    'staking.min_amount': '最小投資金額は$1,000です',
    'staking.unit_error': '投資金額は$1,000単位のみ入力可能です',
    'staking.create_success': '投資申請が完了しました。管理者承認後にコインが支給されます。',
    'staking.create_error': '投資申請中にエラーが発生しました',
    'staking.txid_required': 'TXIDを入力してください',
    'staking.txid_invalid': '正しいTXID形式ではありません（0xで始まる66桁）',
    'staking.txid_success': 'TXIDが登録されました',
    'staking.txid_error': 'TXID保存中にエラーが発生しました',
    'staking.list_error': 'ステーキングリストの取得中にエラーが発生しました',
    'admin.pending_not_found': '承認待ちの投資が見つかりません',
    'admin.approve_success': '投資が承認されました。コインが支給されました。',
    'admin.approve_error': '投資承認中にエラーが発生しました',
    'admin.staking_pending_not_found': '承認待ちのステーキングが見つかりません',
    'admin.reject_success': 'ステーキングが拒否されました。',
    'admin.reject_error': 'ステーキング拒否中にエラーが発生しました',
    'admin.pending_list_error': '承認待ちリストの取得中にエラーが発生しました',
    'admin.all_list_error': '全リストの取得中にエラーが発生しました',
    'admin.users_list_error': 'ユーザーリストの取得中にエラーが発生しました',
    'admin.user_not_found': '存在しないユーザーです',
    'admin.active_staking_block': 'アクティブなステーキングがあるユーザーは削除できません',
    'admin.delete_success': 'ユーザーが正常に退会処理されました',
    'admin.delete_error': 'ユーザー退会処理中にエラーが発生しました',
    'admin.no_users_to_delete': '削除するユーザーがいません',
    'admin.bulk_delete_success': '名のユーザーが削除されました',
    'admin.bulk_delete_error': '一括削除中にエラーが発生しました',
    'admin.rewards_error': '配当状況の取得中にエラーが発生しました',
    'admin.withdrawals_error': '出金管理の取得中にエラーが発生しました',
    'admin.wd_pending_not_found': '承認待ちの出金申請が見つかりません',
    'admin.wd_approve_success': '出金が承認されました',
    'admin.wd_approve_error': '出金承認中にエラーが発生しました',
    'admin.wd_reject_success': '出金が拒否されました。残高が返金されました。',
    'admin.wd_reject_error': '出金拒否中にエラーが発生しました',
    'admin.user_detail_error': '会員詳細の取得中にエラーが発生しました',
    'admin.signups_error': '加入状況の取得中にエラーが発生しました',
    'admin.sales_error': '売上状況の取得中にエラーが発生しました',
    'admin.member_not_found': '会員が見つかりません',
    'admin.downline_error': '傘下売上の取得中にエラーが発生しました',
    'admin.downline_search_placeholder': 'ID/名前/紹介コードで検索...',
    'admin.downline_search_prompt': '会員を検索してください',
    'admin.downline_enter_query': '検索語を入力してください',
    'admin.downline_no_result': '検索結果がありません',
    'admin.search_required': '検索語を入力してください',
    'admin.search_error': '会員検索中にエラーが発生しました',
    'admin.member_rewards_error': '手当状況の取得中にエラーが発生しました',
    'admin.export_wd_error': '出金履歴のエクスポートに失敗しました',
    'admin.export_sales_error': '売上履歴のエクスポートに失敗しました',
    'admin.export_users_error': '会員リストのエクスポートに失敗しました',
    'admin.export_rewards_error': '手当履歴のエクスポートに失敗しました',
    'rewards.no_active': 'アクティブな投資がないか、初回支給日前です',
    'rewards.daily_error': '日次配当金の支給中にエラーが発生しました',
    'rewards.history_error': '報酬履歴の取得中にエラーが発生しました',
    'user.not_found': 'ユーザーが見つかりません',
    'user.info_error': 'ユーザー情報の取得中にエラーが発生しました',
    'user.tx_error': '取引履歴の取得中にエラーが発生しました',
    'referral.error': '紹介者状況の取得中にエラーが発生しました',
    'referral.rewards_error': '報酬履歴の取得中にエラーが発生しました',
    'csv.id': 'ID', 'csv.email': 'メール', 'csv.name': '名前', 'csv.coin_type': 'コイン種類',
    'csv.amount': '数量', 'csv.wallet_address': 'ウォレットアドレス', 'csv.status': '状態',
    'csv.request_date': '申請日', 'csv.process_date': '処理日',
    'csv.pending': '待機', 'csv.approved': '承認', 'csv.rejected': '拒否',
    'csv.country': '国', 'csv.language': '言語', 'csv.sale_amount': '販売金額($)',
    'csv.period_days': '据置期間(日)', 'csv.daily_rate': '日次配当率',
    'csv.start_date': '開始日', 'csv.end_date': '終了日',
    'csv.active': '進行中', 'csv.completed': '完了',
    'csv.phone': '電話番号', 'csv.qkey_wallet': 'QKEYウォレット', 'csv.usdt_wallet': 'USDTウォレット',
    'csv.qta_balance': 'QTA残高', 'csv.qx_balance': 'QX残高',
    'csv.qkey_balance': 'QKEY残高', 'csv.usdt_balance': 'USDT残高',
    'csv.referral_code': '紹介コード', 'csv.staking_amount': '投資金額($)', 'csv.join_date': '加入日',
    'csv.daily_total': '日次配当合計(QKEY)', 'csv.referral_total': '紹介報酬合計(QKEY)',
    'csv.total_reward': '総手当(QKEY)',
  },
  zh: {
    'auth.admin_required': '需要管理员认证',
    'auth.invalid_token': '无效的管理员令牌',
    'auth.admin_login_fail': '管理员ID或密码不匹配',
    'auth.login_error': '登录时发生错误',
    'auth.all_fields_required': '请填写所有字段',
    'auth.invalid_phone': '电话号码格式不正确 (010-XXXX-XXXX)',
    'auth.invalid_qkey_wallet': 'QKEY钱包地址格式不正确 (例: 0xE0c1...f0e)',
    'auth.invalid_usdt_wallet': 'USDT钱包地址格式不正确 (例: 0xE0c1...f0e)',
    'auth.referral_required': '推荐码为必填项',
    'auth.invalid_referral': '无效的推荐码',
    'auth.email_exists': '该邮箱已存在',
    'auth.phone_exists': '该电话号码已注册',
    'auth.wallet_exists': '该钱包地址已注册',
    'auth.register_success': '注册完成',
    'auth.register_error': '注册时发生错误',
    'auth.email_password_required': '请输入邮箱和密码',
    'auth.invalid_credentials': '邮箱或密码不匹配',
    'auth.login_success': '登录成功',
    'auth.name_phone_required': '请输入姓名和电话号码',
    'auth.account_not_found': '未找到匹配的账户',
    'auth.find_id_error': '查找ID时发生错误',
    'auth.email_phone_required': '请输入邮箱和电话号码',
    'auth.temp_password_issued': '临时密码已发放。请登录后务必更改密码。',
    'auth.wallet_required': '请输入QKEY钱包地址',
    'auth.find_pw_error': '查找密码时发生错误',
    'profile.required_fields': '请输入必填信息',
    'profile.update_success': '个人资料已更新',
    'profile.update_error': '更新个人资料时发生错误',
    'withdrawal.invalid_coin': '无效的币种',
    'withdrawal.invalid_amount': '请输入有效数量',
    'withdrawal.user_not_found': '未找到用户',
    'withdrawal.insufficient_balance': '余额不足（包括待提现金额）',
    'withdrawal.request_success': '提现申请完成',
    'withdrawal.request_error': '提现申请时发生错误',
    'withdrawal.list_error': '获取提现列表时发生错误',
    'swap.required_fields': '请输入必填信息',
    'swap.min_amount': '最小兑换数量为100 USDT',
    'swap.unit_error': '兑换数量必须为100的倍数（例：100, 200, 300...）',
    'swap.user_not_found': '未找到用户',
    'swap.insufficient_qkey': 'QKEY余额不足',
    'swap.success': 'QKEY已兑换为USDT',
    'swap.error': '兑换时发生错误',
    'staking.required_fields': '请输入必填信息',
    'staking.invalid_amount': '请输入有效金额',
    'staking.min_amount': '最低投资金额为$1,000',
    'staking.unit_error': '投资金额必须为$1,000的倍数',
    'staking.create_success': '投资申请完成。管理员批准后将发放代币。',
    'staking.create_error': '投资申请时发生错误',
    'staking.txid_required': '请输入TXID',
    'staking.txid_invalid': 'TXID格式不正确（以0x开头的66位）',
    'staking.txid_success': 'TXID已注册',
    'staking.txid_error': '保存TXID时发生错误',
    'staking.list_error': '获取质押列表时发生错误',
    'admin.pending_not_found': '未找到待审批的投资',
    'admin.approve_success': '投资已批准。代币已发放。',
    'admin.approve_error': '投资审批时发生错误',
    'admin.staking_pending_not_found': '未找到待审批的质押',
    'admin.reject_success': '质押已被拒绝。',
    'admin.reject_error': '质押拒绝时发生错误',
    'admin.pending_list_error': '获取待审批列表时发生错误',
    'admin.all_list_error': '获取全部列表时发生错误',
    'admin.users_list_error': '获取用户列表时发生错误',
    'admin.user_not_found': '用户不存在',
    'admin.active_staking_block': '无法删除有活跃质押的用户',
    'admin.delete_success': '用户已成功注销',
    'admin.delete_error': '用户注销时发生错误',
    'admin.no_users_to_delete': '没有需要删除的用户',
    'admin.bulk_delete_success': '名用户已删除',
    'admin.bulk_delete_error': '批量删除时发生错误',
    'admin.rewards_error': '获取分红状况时发生错误',
    'admin.withdrawals_error': '获取提现管理数据时发生错误',
    'admin.wd_pending_not_found': '未找到待审批的提现申请',
    'admin.wd_approve_success': '提现已批准',
    'admin.wd_approve_error': '提现审批时发生错误',
    'admin.wd_reject_success': '提现已拒绝。余额已退还。',
    'admin.wd_reject_error': '提现拒绝时发生错误',
    'admin.user_detail_error': '获取会员详情时发生错误',
    'admin.signups_error': '获取注册状况时发生错误',
    'admin.sales_error': '获取销售状况时发生错误',
    'admin.member_not_found': '未找到会员',
    'admin.downline_error': '获取下线销售数据时发生错误',
    'admin.downline_search_placeholder': '按ID/姓名/推荐码搜索...',
    'admin.downline_search_prompt': '请搜索会员',
    'admin.downline_enter_query': '请输入搜索关键词',
    'admin.downline_no_result': '没有搜索结果',
    'admin.search_required': '请输入搜索关键词',
    'admin.search_error': '搜索会员时发生错误',
    'admin.member_rewards_error': '获取奖金状况时发生错误',
    'admin.export_wd_error': '导出提现记录失败',
    'admin.export_sales_error': '导出销售记录失败',
    'admin.export_users_error': '导出会员列表失败',
    'admin.export_rewards_error': '导出奖金记录失败',
    'rewards.no_active': '没有活跃投资或尚未到首次发放日',
    'rewards.daily_error': '发放每日分红时发生错误',
    'rewards.history_error': '获取奖励记录时发生错误',
    'user.not_found': '未找到用户',
    'user.info_error': '获取用户信息时发生错误',
    'user.tx_error': '获取交易记录时发生错误',
    'referral.error': '获取推荐人状况时发生错误',
    'referral.rewards_error': '获取奖励记录时发生错误',
    'csv.id': 'ID', 'csv.email': '邮箱', 'csv.name': '姓名', 'csv.coin_type': '币种',
    'csv.amount': '数量', 'csv.wallet_address': '钱包地址', 'csv.status': '状态',
    'csv.request_date': '申请日', 'csv.process_date': '处理日',
    'csv.pending': '待处理', 'csv.approved': '已批准', 'csv.rejected': '已拒绝',
    'csv.country': '国家', 'csv.language': '语言', 'csv.sale_amount': '销售金额($)',
    'csv.period_days': '锁定期(天)', 'csv.daily_rate': '日收益率',
    'csv.start_date': '开始日', 'csv.end_date': '结束日',
    'csv.active': '进行中', 'csv.completed': '已完成',
    'csv.phone': '电话', 'csv.qkey_wallet': 'QKEY钱包', 'csv.usdt_wallet': 'USDT钱包',
    'csv.qta_balance': 'QTA余额', 'csv.qx_balance': 'QX余额',
    'csv.qkey_balance': 'QKEY余额', 'csv.usdt_balance': 'USDT余额',
    'csv.referral_code': '推荐码', 'csv.staking_amount': '投资金额($)', 'csv.join_date': '注册日',
    'csv.daily_total': '日分红合计(QKEY)', 'csv.referral_total': '推荐奖励合计(QKEY)',
    'csv.total_reward': '总奖金(QKEY)',
  },
  vi: {
    'auth.admin_required': 'Cần xác thực quản trị viên',
    'auth.invalid_token': 'Token quản trị viên không hợp lệ',
    'auth.admin_login_fail': 'ID hoặc mật khẩu quản trị viên không khớp',
    'auth.login_error': 'Đã xảy ra lỗi khi đăng nhập',
    'auth.all_fields_required': 'Vui lòng nhập tất cả các trường',
    'auth.invalid_phone': 'Định dạng số điện thoại không hợp lệ (010-XXXX-XXXX)',
    'auth.invalid_qkey_wallet': 'Định dạng địa chỉ ví QKEY không hợp lệ (VD: 0xE0c1...f0e)',
    'auth.invalid_usdt_wallet': 'Định dạng địa chỉ ví USDT không hợp lệ (VD: 0xE0c1...f0e)',
    'auth.referral_required': 'Mã giới thiệu là bắt buộc',
    'auth.invalid_referral': 'Mã giới thiệu không hợp lệ',
    'auth.email_exists': 'Email đã tồn tại',
    'auth.phone_exists': 'Số điện thoại đã được đăng ký',
    'auth.wallet_exists': 'Địa chỉ ví đã được đăng ký',
    'auth.register_success': 'Đăng ký thành công',
    'auth.register_error': 'Đã xảy ra lỗi khi đăng ký',
    'auth.email_password_required': 'Vui lòng nhập email và mật khẩu',
    'auth.invalid_credentials': 'Email hoặc mật khẩu không khớp',
    'auth.login_success': 'Đăng nhập thành công',
    'auth.name_phone_required': 'Vui lòng nhập tên và số điện thoại',
    'auth.account_not_found': 'Không tìm thấy tài khoản phù hợp',
    'auth.find_id_error': 'Đã xảy ra lỗi khi tìm ID',
    'auth.email_phone_required': 'Vui lòng nhập email và số điện thoại',
    'auth.temp_password_issued': 'Mật khẩu tạm thời đã được cấp. Vui lòng đổi mật khẩu sau khi đăng nhập.',
    'auth.wallet_required': 'Vui lòng nhập địa chỉ ví QKEY',
    'auth.find_pw_error': 'Đã xảy ra lỗi khi tìm mật khẩu',
    'profile.required_fields': 'Vui lòng nhập thông tin bắt buộc',
    'profile.update_success': 'Hồ sơ đã được cập nhật',
    'profile.update_error': 'Đã xảy ra lỗi khi cập nhật hồ sơ',
    'withdrawal.invalid_coin': 'Loại coin không hợp lệ',
    'withdrawal.invalid_amount': 'Vui lòng nhập số lượng hợp lệ',
    'withdrawal.user_not_found': 'Không tìm thấy người dùng',
    'withdrawal.insufficient_balance': 'Số dư không đủ (bao gồm số tiền đang chờ rút)',
    'withdrawal.request_success': 'Yêu cầu rút tiền đã hoàn tất',
    'withdrawal.request_error': 'Đã xảy ra lỗi khi yêu cầu rút tiền',
    'withdrawal.list_error': 'Đã xảy ra lỗi khi lấy danh sách rút tiền',
    'swap.required_fields': 'Vui lòng nhập thông tin bắt buộc',
    'swap.min_amount': 'Số lượng swap tối thiểu là 100 USDT',
    'swap.unit_error': 'Số lượng swap phải là bội số của 100 (VD: 100, 200, 300...)',
    'swap.user_not_found': 'Không tìm thấy người dùng',
    'swap.insufficient_qkey': 'Số dư QKEY không đủ',
    'swap.success': 'QKEY đã được swap thành USDT',
    'swap.error': 'Đã xảy ra lỗi khi swap',
    'staking.required_fields': 'Vui lòng nhập thông tin bắt buộc',
    'staking.invalid_amount': 'Vui lòng nhập số tiền hợp lệ',
    'staking.min_amount': 'Số tiền đầu tư tối thiểu là $1,000',
    'staking.unit_error': 'Số tiền đầu tư phải là bội số của $1,000',
    'staking.create_success': 'Đơn đầu tư đã hoàn tất. Coin sẽ được phát sau khi quản trị viên phê duyệt.',
    'staking.create_error': 'Đã xảy ra lỗi khi nộp đơn đầu tư',
    'staking.txid_required': 'Vui lòng nhập TXID',
    'staking.txid_invalid': 'Định dạng TXID không hợp lệ (66 ký tự bắt đầu bằng 0x)',
    'staking.txid_success': 'TXID đã được đăng ký',
    'staking.txid_error': 'Đã xảy ra lỗi khi lưu TXID',
    'staking.list_error': 'Đã xảy ra lỗi khi lấy danh sách staking',
    'admin.pending_not_found': 'Không tìm thấy khoản đầu tư đang chờ duyệt',
    'admin.approve_success': 'Đầu tư đã được phê duyệt. Coin đã được phát.',
    'admin.approve_error': 'Đã xảy ra lỗi khi phê duyệt đầu tư',
    'admin.staking_pending_not_found': 'Không tìm thấy staking đang chờ duyệt',
    'admin.reject_success': 'Staking đã bị từ chối.',
    'admin.reject_error': 'Đã xảy ra lỗi khi từ chối staking',
    'admin.pending_list_error': 'Đã xảy ra lỗi khi lấy danh sách chờ duyệt',
    'admin.all_list_error': 'Đã xảy ra lỗi khi lấy toàn bộ danh sách',
    'admin.users_list_error': 'Đã xảy ra lỗi khi lấy danh sách người dùng',
    'admin.user_not_found': 'Người dùng không tồn tại',
    'admin.active_staking_block': 'Không thể xóa người dùng đang có staking hoạt động',
    'admin.delete_success': 'Người dùng đã được xóa thành công',
    'admin.delete_error': 'Đã xảy ra lỗi khi xóa người dùng',
    'admin.no_users_to_delete': 'Không có người dùng cần xóa',
    'admin.bulk_delete_success': ' người dùng đã bị xóa',
    'admin.bulk_delete_error': 'Đã xảy ra lỗi khi xóa hàng loạt',
    'admin.rewards_error': 'Đã xảy ra lỗi khi lấy tình trạng phân phối',
    'admin.withdrawals_error': 'Đã xảy ra lỗi khi lấy dữ liệu quản lý rút tiền',
    'admin.wd_pending_not_found': 'Không tìm thấy yêu cầu rút tiền đang chờ duyệt',
    'admin.wd_approve_success': 'Rút tiền đã được phê duyệt',
    'admin.wd_approve_error': 'Đã xảy ra lỗi khi phê duyệt rút tiền',
    'admin.wd_reject_success': 'Rút tiền đã bị từ chối. Số dư đã được hoàn trả.',
    'admin.wd_reject_error': 'Đã xảy ra lỗi khi từ chối rút tiền',
    'admin.user_detail_error': 'Đã xảy ra lỗi khi lấy chi tiết thành viên',
    'admin.signups_error': 'Đã xảy ra lỗi khi lấy tình trạng đăng ký',
    'admin.sales_error': 'Đã xảy ra lỗi khi lấy tình trạng doanh số',
    'admin.member_not_found': 'Không tìm thấy thành viên',
    'admin.downline_error': 'Đã xảy ra lỗi khi lấy doanh số tuyến dưới',
    'admin.downline_search_placeholder': 'Tìm theo ID/tên/mã giới thiệu...',
    'admin.downline_search_prompt': 'Tìm kiếm thành viên',
    'admin.downline_enter_query': 'Vui lòng nhập từ khóa tìm kiếm',
    'admin.downline_no_result': 'Không tìm thấy kết quả',
    'admin.search_required': 'Vui lòng nhập từ khóa tìm kiếm',
    'admin.search_error': 'Đã xảy ra lỗi khi tìm kiếm thành viên',
    'admin.member_rewards_error': 'Đã xảy ra lỗi khi lấy tình trạng hoa hồng',
    'admin.export_wd_error': 'Xuất lịch sử rút tiền thất bại',
    'admin.export_sales_error': 'Xuất lịch sử doanh số thất bại',
    'admin.export_users_error': 'Xuất danh sách thành viên thất bại',
    'admin.export_rewards_error': 'Xuất lịch sử hoa hồng thất bại',
    'rewards.no_active': 'Không có đầu tư hoạt động hoặc chưa đến ngày chi trả đầu tiên',
    'rewards.daily_error': 'Đã xảy ra lỗi khi phát cổ tức hàng ngày',
    'rewards.history_error': 'Đã xảy ra lỗi khi lấy lịch sử thưởng',
    'user.not_found': 'Không tìm thấy người dùng',
    'user.info_error': 'Đã xảy ra lỗi khi lấy thông tin người dùng',
    'user.tx_error': 'Đã xảy ra lỗi khi lấy lịch sử giao dịch',
    'referral.error': 'Đã xảy ra lỗi khi lấy tình trạng giới thiệu',
    'referral.rewards_error': 'Đã xảy ra lỗi khi lấy lịch sử thưởng',
    'csv.id': 'ID', 'csv.email': 'Email', 'csv.name': 'Tên', 'csv.coin_type': 'Loại coin',
    'csv.amount': 'Số lượng', 'csv.wallet_address': 'Địa chỉ ví', 'csv.status': 'Trạng thái',
    'csv.request_date': 'Ngày yêu cầu', 'csv.process_date': 'Ngày xử lý',
    'csv.pending': 'Chờ xử lý', 'csv.approved': 'Đã duyệt', 'csv.rejected': 'Đã từ chối',
    'csv.country': 'Quốc gia', 'csv.language': 'Ngôn ngữ', 'csv.sale_amount': 'Số tiền bán($)',
    'csv.period_days': 'Thời hạn(ngày)', 'csv.daily_rate': 'Tỷ lệ hàng ngày',
    'csv.start_date': 'Ngày bắt đầu', 'csv.end_date': 'Ngày kết thúc',
    'csv.active': 'Đang hoạt động', 'csv.completed': 'Hoàn thành',
    'csv.phone': 'SĐT', 'csv.qkey_wallet': 'Ví QKEY', 'csv.usdt_wallet': 'Ví USDT',
    'csv.qta_balance': 'Số dư QTA', 'csv.qx_balance': 'Số dư QX',
    'csv.qkey_balance': 'Số dư QKEY', 'csv.usdt_balance': 'Số dư USDT',
    'csv.referral_code': 'Mã giới thiệu', 'csv.staking_amount': 'Đầu tư($)', 'csv.join_date': 'Ngày tham gia',
    'csv.daily_total': 'Tổng hàng ngày(QKEY)', 'csv.referral_total': 'Tổng giới thiệu(QKEY)',
    'csv.total_reward': 'Tổng thưởng(QKEY)',
  },
  th: {
    'auth.admin_required': 'ต้องการการยืนยันตัวตนของผู้ดูแลระบบ',
    'auth.invalid_token': 'โทเค็นผู้ดูแลระบบไม่ถูกต้อง',
    'auth.admin_login_fail': 'ID หรือรหัสผ่านของผู้ดูแลระบบไม่ตรงกัน',
    'auth.login_error': 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ',
    'auth.all_fields_required': 'กรุณากรอกข้อมูลทุกช่อง',
    'auth.invalid_phone': 'รูปแบบหมายเลขโทรศัพท์ไม่ถูกต้อง (010-XXXX-XXXX)',
    'auth.invalid_qkey_wallet': 'รูปแบบที่อยู่กระเป๋า QKEY ไม่ถูกต้อง (เช่น 0xE0c1...f0e)',
    'auth.invalid_usdt_wallet': 'รูปแบบที่อยู่กระเป๋า USDT ไม่ถูกต้อง (เช่น 0xE0c1...f0e)',
    'auth.referral_required': 'ต้องระบุรหัสแนะนำ',
    'auth.invalid_referral': 'รหัสแนะนำไม่ถูกต้อง',
    'auth.email_exists': 'อีเมลนี้มีอยู่แล้ว',
    'auth.phone_exists': 'หมายเลขโทรศัพท์นี้ลงทะเบียนแล้ว',
    'auth.wallet_exists': 'ที่อยู่กระเป๋านี้ลงทะเบียนแล้ว',
    'auth.register_success': 'ลงทะเบียนเสร็จสมบูรณ์',
    'auth.register_error': 'เกิดข้อผิดพลาดในการลงทะเบียน',
    'auth.email_password_required': 'กรุณากรอกอีเมลและรหัสผ่าน',
    'auth.invalid_credentials': 'อีเมลหรือรหัสผ่านไม่ตรงกัน',
    'auth.login_success': 'เข้าสู่ระบบสำเร็จ',
    'auth.name_phone_required': 'กรุณากรอกชื่อและหมายเลขโทรศัพท์',
    'auth.account_not_found': 'ไม่พบบัญชีที่ตรงกัน',
    'auth.find_id_error': 'เกิดข้อผิดพลาดในการค้นหา ID',
    'auth.email_phone_required': 'กรุณากรอกอีเมลและหมายเลขโทรศัพท์',
    'auth.temp_password_issued': 'รหัสผ่านชั่วคราวถูกออกแล้ว กรุณาเปลี่ยนรหัสผ่านหลังเข้าสู่ระบบ',
    'auth.wallet_required': 'กรุณากรอกที่อยู่กระเป๋า QKEY',
    'auth.find_pw_error': 'เกิดข้อผิดพลาดในการค้นหารหัสผ่าน',
    'profile.required_fields': 'กรุณากรอกข้อมูลที่จำเป็น',
    'profile.update_success': 'โปรไฟล์ได้รับการอัปเดตแล้ว',
    'profile.update_error': 'เกิดข้อผิดพลาดในการอัปเดตโปรไฟล์',
    'withdrawal.invalid_coin': 'ประเภทเหรียญไม่ถูกต้อง',
    'withdrawal.invalid_amount': 'กรุณากรอกจำนวนที่ถูกต้อง',
    'withdrawal.user_not_found': 'ไม่พบผู้ใช้',
    'withdrawal.insufficient_balance': 'ยอดคงเหลือไม่เพียงพอ (รวมยอดรอถอน)',
    'withdrawal.request_success': 'คำขอถอนเงินเสร็จสมบูรณ์',
    'withdrawal.request_error': 'เกิดข้อผิดพลาดในการขอถอนเงิน',
    'withdrawal.list_error': 'เกิดข้อผิดพลาดในการดึงรายการถอนเงิน',
    'swap.required_fields': 'กรุณากรอกข้อมูลที่จำเป็น',
    'swap.min_amount': 'จำนวน swap ขั้นต่ำคือ 100 USDT',
    'swap.unit_error': 'จำนวน swap ต้องเป็นหน่วยละ 100 (เช่น 100, 200, 300...)',
    'swap.user_not_found': 'ไม่พบผู้ใช้',
    'swap.insufficient_qkey': 'ยอดคงเหลือ QKEY ไม่เพียงพอ',
    'swap.success': 'QKEY ถูก swap เป็น USDT แล้ว',
    'swap.error': 'เกิดข้อผิดพลาดในการ swap',
    'staking.required_fields': 'กรุณากรอกข้อมูลที่จำเป็น',
    'staking.invalid_amount': 'กรุณากรอกจำนวนเงินที่ถูกต้อง',
    'staking.min_amount': 'จำนวนเงินลงทุนขั้นต่ำคือ $1,000',
    'staking.unit_error': 'จำนวนเงินลงทุนต้องเป็นหน่วยละ $1,000',
    'staking.create_success': 'การสมัครลงทุนเสร็จสมบูรณ์ เหรียญจะถูกแจกจ่ายหลังจากผู้ดูแลระบบอนุมัติ',
    'staking.create_error': 'เกิดข้อผิดพลาดในการสมัครลงทุน',
    'staking.txid_required': 'กรุณากรอก TXID',
    'staking.txid_invalid': 'รูปแบบ TXID ไม่ถูกต้อง (66 ตัวอักษรเริ่มต้นด้วย 0x)',
    'staking.txid_success': 'TXID ถูกลงทะเบียนแล้ว',
    'staking.txid_error': 'เกิดข้อผิดพลาดในการบันทึก TXID',
    'staking.list_error': 'เกิดข้อผิดพลาดในการดึงรายการ staking',
    'admin.pending_not_found': 'ไม่พบการลงทุนที่รอดำเนินการ',
    'admin.approve_success': 'การลงทุนได้รับอนุมัติแล้ว เหรียญถูกแจกจ่ายแล้ว',
    'admin.approve_error': 'เกิดข้อผิดพลาดในการอนุมัติการลงทุน',
    'admin.staking_pending_not_found': 'ไม่พบ staking ที่รอดำเนินการ',
    'admin.reject_success': 'Staking ถูกปฏิเสธแล้ว',
    'admin.reject_error': 'เกิดข้อผิดพลาดในการปฏิเสธ staking',
    'admin.pending_list_error': 'เกิดข้อผิดพลาดในการดึงรายการรอดำเนินการ',
    'admin.all_list_error': 'เกิดข้อผิดพลาดในการดึงรายการทั้งหมด',
    'admin.users_list_error': 'เกิดข้อผิดพลาดในการดึงรายการผู้ใช้',
    'admin.user_not_found': 'ผู้ใช้ไม่มีอยู่',
    'admin.active_staking_block': 'ไม่สามารถลบผู้ใช้ที่มี staking ที่ใช้งานอยู่',
    'admin.delete_success': 'ผู้ใช้ถูกลบเรียบร้อยแล้ว',
    'admin.delete_error': 'เกิดข้อผิดพลาดในการลบผู้ใช้',
    'admin.no_users_to_delete': 'ไม่มีผู้ใช้ที่ต้องลบ',
    'admin.bulk_delete_success': ' ผู้ใช้ถูกลบแล้ว',
    'admin.bulk_delete_error': 'เกิดข้อผิดพลาดในการลบจำนวนมาก',
    'admin.rewards_error': 'เกิดข้อผิดพลาดในการดึงสถานะเงินปันผล',
    'admin.withdrawals_error': 'เกิดข้อผิดพลาดในการดึงข้อมูลการถอนเงิน',
    'admin.wd_pending_not_found': 'ไม่พบคำขอถอนเงินที่รอดำเนินการ',
    'admin.wd_approve_success': 'การถอนเงินได้รับอนุมัติแล้ว',
    'admin.wd_approve_error': 'เกิดข้อผิดพลาดในการอนุมัติการถอนเงิน',
    'admin.wd_reject_success': 'การถอนเงินถูกปฏิเสธ ยอดคงเหลือถูกคืนแล้ว',
    'admin.wd_reject_error': 'เกิดข้อผิดพลาดในการปฏิเสธการถอนเงิน',
    'admin.user_detail_error': 'เกิดข้อผิดพลาดในการดึงรายละเอียดสมาชิก',
    'admin.signups_error': 'เกิดข้อผิดพลาดในการดึงสถานะการลงทะเบียน',
    'admin.sales_error': 'เกิดข้อผิดพลาดในการดึงสถานะยอดขาย',
    'admin.member_not_found': 'ไม่พบสมาชิก',
    'admin.downline_error': 'เกิดข้อผิดพลาดในการดึงยอดขายลูกทีม',
    'admin.downline_search_placeholder': 'ค้นหาด้วย ID/ชื่อ/รหัสแนะนำ...',
    'admin.downline_search_prompt': 'ค้นหาสมาชิก',
    'admin.downline_enter_query': 'กรุณากรอกคำค้นหา',
    'admin.downline_no_result': 'ไม่พบผลลัพธ์',
    'admin.search_required': 'กรุณากรอกคำค้นหา',
    'admin.search_error': 'เกิดข้อผิดพลาดในการค้นหาสมาชิก',
    'admin.member_rewards_error': 'เกิดข้อผิดพลาดในการดึงสถานะค่าตอบแทน',
    'admin.export_wd_error': 'การส่งออกประวัติการถอนเงินล้มเหลว',
    'admin.export_sales_error': 'การส่งออกประวัติยอดขายล้มเหลว',
    'admin.export_users_error': 'การส่งออกรายชื่อสมาชิกล้มเหลว',
    'admin.export_rewards_error': 'การส่งออกประวัติค่าตอบแทนล้มเหลว',
    'rewards.no_active': 'ไม่มีการลงทุนที่ใช้งานอยู่หรือยังไม่ถึงวันจ่ายครั้งแรก',
    'rewards.daily_error': 'เกิดข้อผิดพลาดในการจ่ายเงินปันผลรายวัน',
    'rewards.history_error': 'เกิดข้อผิดพลาดในการดึงประวัติรางวัล',
    'user.not_found': 'ไม่พบผู้ใช้',
    'user.info_error': 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้',
    'user.tx_error': 'เกิดข้อผิดพลาดในการดึงประวัติธุรกรรม',
    'referral.error': 'เกิดข้อผิดพลาดในการดึงสถานะผู้แนะนำ',
    'referral.rewards_error': 'เกิดข้อผิดพลาดในการดึงประวัติรางวัล',
    'csv.id': 'ID', 'csv.email': 'อีเมล', 'csv.name': 'ชื่อ', 'csv.coin_type': 'ประเภทเหรียญ',
    'csv.amount': 'จำนวน', 'csv.wallet_address': 'ที่อยู่กระเป๋า', 'csv.status': 'สถานะ',
    'csv.request_date': 'วันที่ขอ', 'csv.process_date': 'วันที่ดำเนินการ',
    'csv.pending': 'รอดำเนินการ', 'csv.approved': 'อนุมัติแล้ว', 'csv.rejected': 'ถูกปฏิเสธ',
    'csv.country': 'ประเทศ', 'csv.language': 'ภาษา', 'csv.sale_amount': 'ยอดขาย($)',
    'csv.period_days': 'ระยะเวลา(วัน)', 'csv.daily_rate': 'อัตราผลตอบแทนรายวัน',
    'csv.start_date': 'วันเริ่มต้น', 'csv.end_date': 'วันสิ้นสุด',
    'csv.active': 'ดำเนินการอยู่', 'csv.completed': 'เสร็จสิ้น',
    'csv.phone': 'โทรศัพท์', 'csv.qkey_wallet': 'กระเป๋า QKEY', 'csv.usdt_wallet': 'กระเป๋า USDT',
    'csv.qta_balance': 'ยอด QTA', 'csv.qx_balance': 'ยอด QX',
    'csv.qkey_balance': 'ยอด QKEY', 'csv.usdt_balance': 'ยอด USDT',
    'csv.referral_code': 'รหัสแนะนำ', 'csv.staking_amount': 'ลงทุน($)', 'csv.join_date': 'วันที่เข้าร่วม',
    'csv.daily_total': 'รวมรายวัน(QKEY)', 'csv.referral_total': 'รวมแนะนำ(QKEY)',
    'csv.total_reward': 'รวมรางวัล(QKEY)',
  }
}

// Get language from Accept-Language header or default to 'ko'
function getLang(c: any): string {
  const acceptLang = c.req.header('Accept-Language') || ''
  const supported = ['ko', 'en', 'ja', 'zh', 'vi', 'th']
  for (const lang of supported) {
    if (acceptLang.toLowerCase().includes(lang)) return lang
  }
  return 'ko'
}

// Server-side translation function
function t(c: any, key: string): string {
  const lang = getLang(c)
  return serverTranslations[lang]?.[key] || serverTranslations['ko']?.[key] || key
}

// 관리자 토큰 생성 (간이 HMAC - 실서비스에서는 JWT 사용 권장)
function generateAdminToken(): string {
  const payload = ADMIN_ID + ':' + Date.now()
  // 간단한 base64 토큰 (Cloudflare Workers에서 crypto 사용 가능)
  return btoa(payload + ':' + ADMIN_PW)
}

// 관리자 토큰 검증
function verifyAdminToken(token: string): boolean {
  try {
    const decoded = atob(token)
    return decoded.endsWith(':' + ADMIN_PW)
  } catch {
    return false
  }
}

// HTML 이스케이프 (XSS 방지)
function escapeHtml(str: string): string {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// 비밀번호 해싱 (SHA-256)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + '_QUANTARIUM_SALT')
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
}

// 비밀번호 검증 (평문 호환 + 해시 점진적 전환)
async function verifyPassword(inputPassword: string, storedPassword: string): Promise<boolean> {
  // 해시된 비밀번호인지 체크 (64자 hex = SHA-256)
  if (storedPassword.length === 64 && /^[a-f0-9]{64}$/.test(storedPassword)) {
    const hashed = await hashPassword(inputPassword)
    return hashed === storedPassword
  }
  // 기존 평문 비밀번호 (마이그레이션 전)
  return inputPassword === storedPassword
}

// ============================================
// Admin API Auth Middleware
// ============================================
app.use('/api/admin/*', async (c, next) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: t(c, 'auth.admin_required') }, 401)
  }
  const token = authHeader.substring(7)
  if (!verifyAdminToken(token)) {
    return c.json({ error: t(c, 'auth.invalid_token') }, 401)
  }
  await next()
})

// 배당금 API도 관리자 인증 필요
app.use('/api/rewards/daily', async (c, next) => {
  if (c.req.method === 'POST') {
    const authHeader = c.req.header('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: t(c, 'auth.admin_required') }, 401)
    }
    const token = authHeader.substring(7)
    if (!verifyAdminToken(token)) {
      return c.json({ error: t(c, 'auth.invalid_token') }, 401)
    }
  }
  await next()
})

// ============================================
// API Routes - Admin Login
// ============================================
app.post('/api/auth/admin-login', async (c) => {
  try {
    const { adminId, password } = await c.req.json()
    if (adminId === ADMIN_ID && password === ADMIN_PW) {
      const token = generateAdminToken()
      return c.json({ success: true, token })
    }
    return c.json({ error: t(c, 'auth.admin_login_fail') }, 401)
  } catch {
    return c.json({ error: t(c, 'auth.login_error') }, 500)
  }
})

// ============================================
// API Routes - Auth
// ============================================

// 회원가입
app.post('/api/auth/register', async (c) => {
  try {
    const { email, password, name, phone, walletAddress, usdtWalletAddress, referralCode, country, language } = await c.req.json()

    if (!email || !password || !name || !phone || !walletAddress || !usdtWalletAddress) {
      return c.json({ error: t(c, 'auth.all_fields_required') }, 400)
    }

    // 이메일을 소문자로 변환 (대소문자 구분 제거)
    const normalizedEmail = email.toLowerCase().trim()

    // 전화번호에서 하이픈 제거 및 형식 검증 (010 + 8자리 숫자)
    const cleanPhone = phone.replace(/-/g, '')
    if (!cleanPhone.match(/^010\d{8}$/)) {
      return c.json({ error: t(c, 'auth.invalid_phone') }, 400)
    }

    // QKEY 지갑주소 형식 검증 (0x로 시작하는 42자리)
    if (!walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return c.json({ error: t(c, 'auth.invalid_qkey_wallet') }, 400)
    }

    // USDT 지갑주소 형식 검증 (0x로 시작하는 42자리)
    if (!usdtWalletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return c.json({ error: t(c, 'auth.invalid_usdt_wallet') }, 400)
    }

    const db = c.env.DB

    // 추천인 코드 검증 (필수)
    if (!referralCode || !referralCode.trim()) {
      return c.json({ error: t(c, 'auth.referral_required') }, 400)
    }
    let referrerId = null
    const MASTER_REFERRAL_CODE = 'QTAICVDN2'
    const upperCode = referralCode.trim().toUpperCase()
    
    if (upperCode === MASTER_REFERRAL_CODE) {
      // 최초 가입용 마스터 추천코드 - referrerId는 null
      referrerId = null
    } else {
      const referrer = await db.prepare('SELECT id FROM users WHERE referral_code = ?')
        .bind(upperCode)
        .first()
      
      if (!referrer) {
        return c.json({ error: t(c, 'auth.invalid_referral') }, 400)
      }
      referrerId = referrer.id
    }

    // 이메일 중복 체크 (소문자로 비교)
    const existingEmail = await db.prepare('SELECT id FROM users WHERE LOWER(email) = ?')
      .bind(normalizedEmail)
      .first()

    if (existingEmail) {
      return c.json({ error: t(c, 'auth.email_exists') }, 400)
    }

    // 전화번호 중복 체크
    const existingPhone = await db.prepare('SELECT id FROM users WHERE phone = ?')
      .bind(cleanPhone)
      .first()

    if (existingPhone) {
      return c.json({ error: t(c, 'auth.phone_exists') }, 400)
    }

    // 지갑주소 중복 체크
    const existingWallet = await db.prepare('SELECT id FROM users WHERE wallet_address = ?')
      .bind(walletAddress)
      .first()

    if (existingWallet) {
      return c.json({ error: t(c, 'auth.wallet_exists') }, 400)
    }

    // 고유한 추천인 코드 생성 (SAY + 6자리 랜덤)
    let newReferralCode = ''
    let isUnique = false
    while (!isUnique) {
      newReferralCode = 'QTA' + Math.random().toString(36).substring(2, 8).toUpperCase()
      const existing = await db.prepare('SELECT id FROM users WHERE referral_code = ?')
        .bind(newReferralCode)
        .first()
      if (!existing) {
        isUnique = true
      }
    }

    // 비밀번호 해싱
    const hashedPassword = await hashPassword(password)

    // 사용자 생성
    const result = await db.prepare(`
      INSERT INTO users (email, password, name, phone, wallet_address, usdt_wallet_address, qta_balance, qx_balance, qkey_balance, usdt_balance, referral_code, referrer_id, country, language)
      VALUES (?, ?, ?, ?, ?, ?, 0, 0, 0, 0, ?, ?, ?, ?)
    `).bind(normalizedEmail, hashedPassword, name, cleanPhone, walletAddress, usdtWalletAddress, newReferralCode, referrerId, country || '', language || 'ko').run()

    return c.json({ 
      success: true, 
      message: t(c, 'auth.register_success'),
      userId: result.meta.last_row_id,
      referralCode: newReferralCode
    })
  } catch (error) {
    return c.json({ error: t(c, 'auth.register_error') }, 500)
  }
})

// 로그인
app.post('/api/auth/login', async (c) => {
  try {
    const { email, password } = await c.req.json()

    if (!email || !password) {
      return c.json({ error: t(c, 'auth.email_password_required') }, 400)
    }

    // 이메일을 소문자로 변환 (대소문자 구분 제거)
    const normalizedEmail = email.toLowerCase().trim()

    const db = c.env.DB

    // 이메일로 사용자 조회 (비밀번호는 별도 검증)
    const user = await db.prepare(`
      SELECT id, email, password, name, phone, wallet_address, usdt_wallet_address, qta_balance, qx_balance, qkey_balance, usdt_balance, referral_code, created_at
      FROM users WHERE LOWER(email) = ?
    `).bind(normalizedEmail).first()

    if (!user) {
      return c.json({ error: t(c, 'auth.invalid_credentials') }, 401)
    }

    // 비밀번호 검증 (해시/평문 호환)
    const passwordMatch = await verifyPassword(password, user.password as string)
    if (!passwordMatch) {
      return c.json({ error: t(c, 'auth.invalid_credentials') }, 401)
    }

    // 평문 비밀번호인 경우 해시로 마이그레이션
    const storedPw = user.password as string
    if (!(storedPw.length === 64 && /^[a-f0-9]{64}$/.test(storedPw))) {
      const hashedPw = await hashPassword(password)
      await db.prepare('UPDATE users SET password = ? WHERE id = ?').bind(hashedPw, user.id).run()
    }

    // referral_code가 없으면 생성 (6자리 랜덤, 중복 체크)
    let referralCode = user.referral_code
    if (!referralCode) {
      let isUnique = false
      while (!isUnique) {
        referralCode = 'QTA' + Math.random().toString(36).substring(2, 8).toUpperCase()
        const existing = await db.prepare('SELECT id FROM users WHERE referral_code = ?').bind(referralCode).first()
        if (!existing) isUnique = true
      }
      await db.prepare(`
        UPDATE users SET referral_code = ? WHERE id = ?
      `).bind(referralCode, user.id).run()
    }

    return c.json({ 
      success: true, 
      message: t(c, 'auth.login_success'),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        wallet_address: user.wallet_address,
        usdt_wallet_address: user.usdt_wallet_address || '',
        qta_balance: user.qta_balance,
        qx_balance: user.qx_balance,
        qkey_balance: user.qkey_balance,
        usdt_balance: user.usdt_balance,
        referral_code: referralCode,
        created_at: user.created_at
      }
    })
  } catch (error) {
    return c.json({ error: t(c, 'auth.login_error') }, 500)
  }
})

// 아이디 찾기 (QKEY 지갑주소)
app.post('/api/auth/find-id', async (c) => {
  try {
    const { walletAddress } = await c.req.json()

    if (!walletAddress) {
      return c.json({ error: t(c, 'auth.wallet_required') }, 400)
    }

    if (!walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return c.json({ error: t(c, 'auth.invalid_qkey_wallet') }, 400)
    }

    const db = c.env.DB

    const user = await db.prepare(`
      SELECT email FROM users WHERE wallet_address = ?
    `).bind(walletAddress).first()

    if (!user) {
      return c.json({ error: t(c, 'auth.account_not_found') }, 404)
    }

    return c.json({ 
      success: true, 
      email: user.email
    })
  } catch (error) {
    return c.json({ error: t(c, 'auth.find_id_error') }, 500)
  }
})

// 비밀번호 찾기 (QKEY 지갑주소)
app.post('/api/auth/find-password', async (c) => {
  try {
    const { walletAddress } = await c.req.json()

    if (!walletAddress) {
      return c.json({ error: t(c, 'auth.wallet_required') }, 400)
    }

    if (!walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return c.json({ error: t(c, 'auth.invalid_qkey_wallet') }, 400)
    }

    const db = c.env.DB

    const user = await db.prepare(`
      SELECT id FROM users WHERE wallet_address = ?
    `).bind(walletAddress).first()

    if (!user) {
      return c.json({ error: t(c, 'auth.account_not_found') }, 404)
    }

    // 임시 비밀번호 생성 (해시하여 저장)
    const tempPassword = Math.random().toString(36).slice(-8)
    const hashedTemp = await hashPassword(tempPassword)

    await db.prepare(`
      UPDATE users SET password = ? WHERE id = ?
    `).bind(hashedTemp, user.id).run()

    return c.json({ 
      success: true, 
      tempPassword: tempPassword,
      message: t(c, 'auth.temp_password_issued')
    })
  } catch (error) {
    return c.json({ error: t(c, 'auth.find_pw_error') }, 500)
  }
})

// 사용자 프로필 업데이트
app.post('/api/user/update-profile', async (c) => {
  try {
    const { userId, name, phone, password } = await c.req.json()

    if (!userId || !name) {
      return c.json({ error: t(c, 'profile.required_fields') }, 400)
    }

    const db = c.env.DB

    // 비밀번호 변경이 있는 경우 (해시하여 저장)
    if (password) {
      const hashedPw = await hashPassword(password)
      await db.prepare(`
        UPDATE users 
        SET name = ?, phone = ?, password = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(name, phone || null, hashedPw, userId).run()
    } else {
      // 비밀번호 변경 없이 이름, 전화번호만 업데이트
      await db.prepare(`
        UPDATE users 
        SET name = ?, phone = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(name, phone || null, userId).run()
    }

    return c.json({ 
      success: true, 
      message: t(c, 'profile.update_success')
    })
  } catch (error) {
    return c.json({ error: t(c, 'profile.update_error') }, 500)
  }
})

// ============================================
// API Routes - Withdrawal
// ============================================

// 출금 신청 (금요일 오전 10시 ~ 오후 2시 KST만 가능)
app.post('/api/withdrawal/request', async (c) => {
  try {
    // 출금 신청 가능 시간 체크: 매주 금요일 10:00~14:00 KST (공휴일 무관)
    const now = new Date()
    if (!isWithdrawalWindowOpen(now)) {
      return c.json({ 
        error: '출금 신청은 매주 금요일 오전 10시 ~ 오후 2시(KST)에만 가능합니다. / Withdrawals are only available on Fridays 10:00 AM - 2:00 PM (KST).',
        withdrawal_closed: true
      }, 400)
    }

    const { userId, coinType, amount, walletAddress } = await c.req.json()

    if (!userId || !coinType || !amount || !walletAddress) {
      return c.json({ error: t(c, 'profile.required_fields') }, 400)
    }

    if (!['QTA', 'QX', 'QKEY', 'USDT'].includes(coinType)) {
      return c.json({ error: t(c, 'withdrawal.invalid_coin') }, 400)
    }

    if (amount <= 0) {
      return c.json({ error: t(c, 'withdrawal.invalid_amount') }, 400)
    }

    const db = c.env.DB

    // 사용자 잔액 확인
    const user = await db.prepare(`
      SELECT qta_balance, qx_balance, qkey_balance, usdt_balance FROM users WHERE id = ?
    `).bind(userId).first()

    if (!user) {
      return c.json({ error: t(c, 'withdrawal.user_not_found') }, 404)
    }

    // 잔액 확인 (잔액은 출금 신청 시 즉시 차감되므로 현재 잔액만 체크)
    const balanceField = coinType === 'QTA' ? 'qta_balance' : 
                         coinType === 'QX' ? 'qx_balance' : 
                         coinType === 'QKEY' ? 'qkey_balance' : 'usdt_balance'
    const currentBalance = (user[balanceField] || 0) as number

    if (currentBalance < amount) {
      return c.json({ error: t(c, 'withdrawal.insufficient_balance') }, 400)
    }

    // 잔액 즉시 차감 (출금 신청 시점) - 경쟁조건 방지: UPDATE 결과 확인
    const deductResult = await db.prepare(`
      UPDATE users SET ${balanceField} = ${balanceField} - ? WHERE id = ? AND ${balanceField} >= ?
    `).bind(amount, userId, amount).run()

    if (!deductResult.meta.changes || deductResult.meta.changes === 0) {
      return c.json({ error: t(c, 'withdrawal.insufficient_balance') }, 400)
    }

    // 출금 신청 생성
    const withdrawalResult = await db.prepare(`
      INSERT INTO withdrawals (user_id, coin_type, amount, wallet_address, status)
      VALUES (?, ?, ?, ?, 'pending')
    `).bind(userId, coinType, amount, walletAddress).run()

    return c.json({ 
      success: true, 
      message: t(c, 'withdrawal.request_success'),
      withdrawal: {
        id: withdrawalResult.meta.last_row_id,
        coinType: coinType,
        amount: amount,
        status: 'pending'
      }
    })
  } catch (error) {
    return c.json({ error: t(c, 'withdrawal.request_error') }, 500)
  }
})

// 출금 신청 창 상태 조회 (클라이언트 UI 동기화용)
// 룰: 매주 금요일 10:00~14:00 KST (공휴일 무관)
app.get('/api/withdrawal/window', (c) => {
  const now = new Date()
  const kst = new Date(now.getTime() + (9 * 60 * 60 * 1000))
  const todayKst = kst.toISOString().split('T')[0]
  const day = kst.getUTCDay()
  const hour = kst.getUTCHours()
  const minute = kst.getUTCMinutes()
  const isOpen = day === 5 && hour >= 10 && hour < 14
  // 다음 금요일 날짜 계산 (안내용)
  let diffToNextFriday: number
  if (day < 5) diffToNextFriday = 5 - day
  else if (day === 5) diffToNextFriday = 0
  else diffToNextFriday = 6 // 토요일이면 다음 주 금요일
  const nextFriday = new Date(kst.getTime() + diffToNextFriday * 24 * 60 * 60 * 1000)
  return c.json({
    success: true,
    isOpen,
    todayKst,
    withdrawalDate: nextFriday.toISOString().split('T')[0],
    hour,
    minute,
    openHour: 10,
    closeHour: 14
  })
})

// 출금 신청 목록 조회
app.get('/api/withdrawal/list/:userId', async (c) => {
  try {
    const userId = c.req.param('userId')
    const db = c.env.DB

    const withdrawals = await db.prepare(`
      SELECT * FROM withdrawals
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).bind(userId).all()

    return c.json({ 
      success: true, 
      withdrawals: withdrawals.results 
    })
  } catch (error) {
    return c.json({ error: t(c, 'withdrawal.list_error') }, 500)
  }
})

// 사용자: 출금 신청 취소 (pending 상태에서만, 차감된 잔액 즉시 환불)
app.post('/api/withdrawal/cancel/:withdrawalId', async (c) => {
  try {
    const db = c.env.DB
    const withdrawalId = c.req.param('withdrawalId')
    const body = await c.req.json().catch(() => ({}))
    const userId = body?.userId

    if (!userId) return c.json({ error: '사용자 정보가 필요합니다' }, 400)

    // cancelled_at / cancelled_by 컬럼 보장
    try { await db.prepare(`ALTER TABLE withdrawals ADD COLUMN cancelled_at DATETIME`).run() } catch(e) {}
    try { await db.prepare(`ALTER TABLE withdrawals ADD COLUMN cancelled_by TEXT`).run() } catch(e) {}

    // 본인 소유 + pending 상태인 출금건만 취소 가능
    const withdrawal = await db.prepare(`
      SELECT * FROM withdrawals WHERE id = ? AND user_id = ?
    `).bind(withdrawalId, userId).first()

    if (!withdrawal) {
      return c.json({ error: '출금 신청을 찾을 수 없습니다' }, 404)
    }
    if (withdrawal.status !== 'pending') {
      const labelMap: Record<string,string> = { approved: '승인완료', rejected: '거절됨', cancelled: '이미 취소됨' }
      return c.json({ error: `취소할 수 없는 상태입니다 (현재: ${labelMap[withdrawal.status as string] || withdrawal.status}). 처리 전(pending) 상태에서만 취소 가능합니다.` }, 400)
    }

    // 상태 변경 (경쟁조건 방지: pending 상태에서만)
    const upd = await db.prepare(`
      UPDATE withdrawals SET status = 'cancelled', cancelled_at = CURRENT_TIMESTAMP, cancelled_by = 'user'
      WHERE id = ? AND status = 'pending'
    `).bind(withdrawalId).run()

    if (!upd.meta.changes) {
      return c.json({ error: '이미 처리된 신청입니다' }, 400)
    }

    // 차감했던 잔액 복원
    const balanceField = withdrawal.coin_type === 'QTA' ? 'qta_balance' :
                         withdrawal.coin_type === 'QX' ? 'qx_balance' :
                         withdrawal.coin_type === 'QKEY' ? 'qkey_balance' : 'usdt_balance'

    await db.prepare(`
      UPDATE users SET ${balanceField} = ${balanceField} + ? WHERE id = ?
    `).bind(withdrawal.amount, withdrawal.user_id).run()

    // 환불 거래 기록
    try {
      await db.prepare(`
        INSERT INTO transactions (user_id, type, coin_type, amount, description)
        VALUES (?, 'withdrawal_cancel_refund', ?, ?, ?)
      `).bind(
        withdrawal.user_id,
        withdrawal.coin_type,
        withdrawal.amount,
        `출금 신청 취소 환불 (#${withdrawalId})`
      ).run()
    } catch(eTx) {}

    return c.json({
      success: true,
      message: `출금 신청이 취소되었습니다. ${Number(withdrawal.amount).toLocaleString()} ${withdrawal.coin_type}가 즉시 환불되었습니다.`,
      refunded: withdrawal.amount,
      coinType: withdrawal.coin_type
    })
  } catch (error) {
    return c.json({ error: '출금 취소 처리 중 오류가 발생했습니다' }, 500)
  }
})

// ============================================
// API Routes - Swap (QKEY → USDT)
// ============================================

// QKEY → USDT 스왑 (150 QKEY = 1 USDT, 최소 100 USDT, 100 단위)
app.post('/api/swap/qkey-to-usdt', async (c) => {
  try {
    const { userId, amount } = await c.req.json() // amount = 받고 싶은 USDT 수량
    const QKEY_PER_USDT = 150 // 150 QKEY = 1 USDT

    if (!userId || !amount) {
      return c.json({ error: t(c, 'profile.required_fields') }, 400)
    }

    // 최소 100 USDT 검증
    if (amount < 100) {
      return c.json({ error: t(c, 'swap.min_amount') }, 400)
    }

    // 100 단위 검증
    if (amount % 100 !== 0) {
      return c.json({ error: t(c, 'swap.unit_error') }, 400)
    }

    const requiredQkey = amount * QKEY_PER_USDT // 필요한 QKEY 수량

    const db = c.env.DB

    // 사용자 QKEY 잔액 확인
    const user = await db.prepare(`
      SELECT qkey_balance FROM users WHERE id = ?
    `).bind(userId).first()

    if (!user) {
      return c.json({ error: t(c, 'withdrawal.user_not_found') }, 404)
    }

    const qkeyBalance = user.qkey_balance || 0

    // QKEY 잔액 부족 체크
    if (qkeyBalance < requiredQkey) {
      return c.json({ error: `${t(c, 'swap.insufficient_qkey')} (${qkeyBalance.toLocaleString()} QKEY / ${requiredQkey.toLocaleString()} QKEY)` }, 400)
    }

    // QKEY 차감 & USDT 증가 (150 QKEY = 1 USDT) - 경쟁조건 방지
    const swapResult = await db.prepare(`
      UPDATE users 
      SET qkey_balance = qkey_balance - ?,
          usdt_balance = usdt_balance + ?
      WHERE id = ? AND qkey_balance >= ?
    `).bind(requiredQkey, amount, userId, requiredQkey).run()

    if (!swapResult.meta.changes || swapResult.meta.changes === 0) {
      return c.json({ error: `${t(c, 'swap.insufficient_qkey')} (concurrent request)` }, 400)
    }

    // 거래 내역 기록 (QKEY 차감) — ★ 출금성 거래는 음수로 저장 (잔액=tx_sum 정합성)
    await db.prepare(`
      INSERT INTO transactions (user_id, type, coin_type, amount, description)
      VALUES (?, 'swap_out', 'QKEY', ?, ?)
    `).bind(userId, -Math.abs(requiredQkey), `QKEY → USDT swap (${requiredQkey.toLocaleString()} QKEY → ${amount.toLocaleString()} USDT)`).run()

    // Transaction record (USDT increase)
    await db.prepare(`
      INSERT INTO transactions (user_id, type, coin_type, amount, description)
      VALUES (?, 'swap_in', 'USDT', ?, ?)
    `).bind(userId, amount, `QKEY → USDT swap (${requiredQkey.toLocaleString()} QKEY → ${amount.toLocaleString()} USDT)`).run()

    return c.json({ 
      success: true, 
      message: `${t(c, 'swap.success')} (${requiredQkey.toLocaleString()} QKEY → ${amount.toLocaleString()} USDT)`,
      swap: {
        from: 'QKEY',
        to: 'USDT',
        qkeyUsed: requiredQkey,
        usdtReceived: amount
      }
    })
  } catch (error) {
    console.error('Swap error:', error)
    return c.json({ error: t(c, 'swap.error') }, 500)
  }
})

// QKEY → QTA 스왑 (1:1, QKEY 1개 = QTA 1개)
app.post('/api/swap/qkey-to-qta', async (c) => {
  try {
    const { userId, amount } = await c.req.json() // amount = 받고 싶은 QTA 수량
    if (!userId || !amount || amount <= 0) {
      return c.json({ error: t(c, 'profile.required_fields') }, 400)
    }
    const requiredQkey = amount // 1:1 비율

    const db = c.env.DB
    const user = await db.prepare(`SELECT qkey_balance FROM users WHERE id = ?`).bind(userId).first()
    if (!user) return c.json({ error: t(c, 'withdrawal.user_not_found') }, 404)

    if ((user.qkey_balance || 0) < requiredQkey) {
      return c.json({ error: `${t(c, 'swap.insufficient_qkey')} (${(user.qkey_balance || 0).toLocaleString()} QKEY / ${requiredQkey.toLocaleString()} QKEY)` }, 400)
    }

    // QKEY 차감 & QTA 증가 - 경쟁조건 방지
    const swapQtaResult = await db.prepare(`UPDATE users SET qkey_balance = qkey_balance - ?, qta_balance = qta_balance + ? WHERE id = ? AND qkey_balance >= ?`).bind(requiredQkey, amount, userId, requiredQkey).run()
    if (!swapQtaResult.meta.changes || swapQtaResult.meta.changes === 0) {
      return c.json({ error: `${t(c, 'swap.insufficient_qkey')} (concurrent request)` }, 400)
    }

    // 거래 내역 (QKEY 차감) — ★ 출금성 거래는 음수로 저장
    await db.prepare(`INSERT INTO transactions (user_id, type, coin_type, amount, description) VALUES (?, 'swap_out', 'QKEY', ?, ?)`).bind(userId, -Math.abs(requiredQkey), `QKEY → QTA swap (${requiredQkey.toLocaleString()} QKEY → ${amount.toLocaleString()} QTA)`).run()

    // 거래 내역 (QTA 증가 - swap_in으로 기록 → 출금 가능 수량에 반영)
    await db.prepare(`INSERT INTO transactions (user_id, type, coin_type, amount, description) VALUES (?, 'swap_in', 'QTA', ?, ?)`).bind(userId, amount, `QKEY → QTA swap (${requiredQkey.toLocaleString()} QKEY → ${amount.toLocaleString()} QTA)`).run()

    return c.json({ success: true, message: `${requiredQkey.toLocaleString()} QKEY → ${amount.toLocaleString()} QTA`, swap: { from: 'QKEY', to: 'QTA', qkeyUsed: requiredQkey, received: amount } })
  } catch (error) {
    return c.json({ error: t(c, 'swap.error') }, 500)
  }
})

// QKEY → QX 스왑 (5:1, QKEY 5개 = QX 1개)
app.post('/api/swap/qkey-to-qx', async (c) => {
  try {
    const { userId, amount } = await c.req.json() // amount = 받고 싶은 QX 수량
    if (!userId || !amount || amount <= 0) {
      return c.json({ error: t(c, 'profile.required_fields') }, 400)
    }
    const requiredQkey = amount * 5 // 5:1 비율

    const db = c.env.DB
    const user = await db.prepare(`SELECT qkey_balance FROM users WHERE id = ?`).bind(userId).first()
    if (!user) return c.json({ error: t(c, 'withdrawal.user_not_found') }, 404)

    if ((user.qkey_balance || 0) < requiredQkey) {
      return c.json({ error: `${t(c, 'swap.insufficient_qkey')} (${(user.qkey_balance || 0).toLocaleString()} QKEY / ${requiredQkey.toLocaleString()} QKEY)` }, 400)
    }

    const swapQxResult = await db.prepare(`UPDATE users SET qkey_balance = qkey_balance - ?, qx_balance = qx_balance + ? WHERE id = ? AND qkey_balance >= ?`).bind(requiredQkey, amount, userId, requiredQkey).run()
    if (!swapQxResult.meta.changes || swapQxResult.meta.changes === 0) {
      return c.json({ error: `${t(c, 'swap.insufficient_qkey')} (concurrent request)` }, 400)
    }

    // ★ 출금성 거래는 음수로 저장 (잔액=tx_sum 정합성)
    await db.prepare(`INSERT INTO transactions (user_id, type, coin_type, amount, description) VALUES (?, 'swap_out', 'QKEY', ?, ?)`).bind(userId, -Math.abs(requiredQkey), `QKEY → QX swap (${requiredQkey.toLocaleString()} QKEY → ${amount.toLocaleString()} QX)`).run()

    await db.prepare(`INSERT INTO transactions (user_id, type, coin_type, amount, description) VALUES (?, 'swap_in', 'QX', ?, ?)`).bind(userId, amount, `QKEY → QX swap (${requiredQkey.toLocaleString()} QKEY → ${amount.toLocaleString()} QX)`).run()

    return c.json({ success: true, message: `${requiredQkey.toLocaleString()} QKEY → ${amount.toLocaleString()} QX`, swap: { from: 'QKEY', to: 'QX', qkeyUsed: requiredQkey, received: amount } })
  } catch (error) {
    return c.json({ error: t(c, 'swap.error') }, 500)
  }
})

// USDT → QKEY 스왑 (1 USDT = 150 QKEY, 역방향)
app.post('/api/swap/usdt-to-qkey', async (c) => {
  try {
    const { userId, amount } = await c.req.json() // amount = 사용할 USDT 수량
    if (!userId || !amount || amount <= 0) {
      return c.json({ error: t(c, 'profile.required_fields') }, 400)
    }
    const qkeyToReceive = amount * 150 // 1 USDT = 150 QKEY

    const db = c.env.DB
    const user = await db.prepare(`SELECT usdt_balance FROM users WHERE id = ?`).bind(userId).first()
    if (!user) return c.json({ error: t(c, 'withdrawal.user_not_found') }, 404)

    if ((user.usdt_balance || 0) < amount) {
      return c.json({ error: `USDT 잔액이 부족합니다 (${(user.usdt_balance || 0).toFixed(2)} USDT / ${amount.toFixed(2)} USDT)` }, 400)
    }

    const swapUkResult = await db.prepare(`UPDATE users SET usdt_balance = usdt_balance - ?, qkey_balance = qkey_balance + ? WHERE id = ? AND usdt_balance >= ?`).bind(amount, qkeyToReceive, userId, amount).run()
    if (!swapUkResult.meta.changes || swapUkResult.meta.changes === 0) {
      return c.json({ error: `USDT 잔액이 부족합니다 (concurrent request)` }, 400)
    }

    // ★ 출금성 거래는 음수로 저장 (잔액=tx_sum 정합성)
    await db.prepare(`INSERT INTO transactions (user_id, type, coin_type, amount, description) VALUES (?, 'swap_out', 'USDT', ?, ?)`).bind(userId, -Math.abs(amount), `USDT → QKEY swap (${amount.toLocaleString()} USDT → ${qkeyToReceive.toLocaleString()} QKEY)`).run()

    await db.prepare(`INSERT INTO transactions (user_id, type, coin_type, amount, description) VALUES (?, 'swap_in', 'QKEY', ?, ?)`).bind(userId, qkeyToReceive, `USDT → QKEY swap (${amount.toLocaleString()} USDT → ${qkeyToReceive.toLocaleString()} QKEY)`).run()

    return c.json({ success: true, message: `${amount.toLocaleString()} USDT → ${qkeyToReceive.toLocaleString()} QKEY`, swap: { from: 'USDT', to: 'QKEY', usdtUsed: amount, received: qkeyToReceive } })
  } catch (error) {
    return c.json({ error: t(c, 'swap.error') }, 500)
  }
})

// USDT → QTA 스왑 (1 USDT = 150 QTA, QKEY 1:1 기준)
app.post('/api/swap/usdt-to-qta', async (c) => {
  try {
    const { userId, amount } = await c.req.json() // amount = 사용할 USDT 수량
    if (!userId || !amount || amount <= 0) {
      return c.json({ error: t(c, 'profile.required_fields') }, 400)
    }
    const qtaToReceive = amount * 150

    const db = c.env.DB
    const user = await db.prepare(`SELECT usdt_balance FROM users WHERE id = ?`).bind(userId).first()
    if (!user) return c.json({ error: t(c, 'withdrawal.user_not_found') }, 404)

    if ((user.usdt_balance || 0) < amount) {
      return c.json({ error: `USDT 잔액이 부족합니다 (${(user.usdt_balance || 0).toFixed(2)} USDT)` }, 400)
    }

    const swapUqtaResult = await db.prepare(`UPDATE users SET usdt_balance = usdt_balance - ?, qta_balance = qta_balance + ? WHERE id = ? AND usdt_balance >= ?`).bind(amount, qtaToReceive, userId, amount).run()
    if (!swapUqtaResult.meta.changes || swapUqtaResult.meta.changes === 0) {
      return c.json({ error: `USDT 잔액이 부족합니다 (concurrent request)` }, 400)
    }

    // ★ 출금성 거래는 음수로 저장
    await db.prepare(`INSERT INTO transactions (user_id, type, coin_type, amount, description) VALUES (?, 'swap_out', 'USDT', ?, ?)`).bind(userId, -Math.abs(amount), `USDT → QTA swap (${amount} USDT → ${qtaToReceive.toLocaleString()} QTA)`).run()

    await db.prepare(`INSERT INTO transactions (user_id, type, coin_type, amount, description) VALUES (?, 'swap_in', 'QTA', ?, ?)`).bind(userId, qtaToReceive, `USDT → QTA swap (${amount} USDT → ${qtaToReceive.toLocaleString()} QTA)`).run()

    return c.json({ success: true, message: `${amount} USDT → ${qtaToReceive.toLocaleString()} QTA`, swap: { from: 'USDT', to: 'QTA', usdtUsed: amount, received: qtaToReceive } })
  } catch (error) {
    return c.json({ error: t(c, 'swap.error') }, 500)
  }
})

// USDT → QX 스왑 (1 USDT = 30 QX, QKEY 150/5=30 기준)
app.post('/api/swap/usdt-to-qx', async (c) => {
  try {
    const { userId, amount } = await c.req.json()
    if (!userId || !amount || amount <= 0) {
      return c.json({ error: t(c, 'profile.required_fields') }, 400)
    }
    const qxToReceive = amount * 30

    const db = c.env.DB
    const user = await db.prepare(`SELECT usdt_balance FROM users WHERE id = ?`).bind(userId).first()
    if (!user) return c.json({ error: t(c, 'withdrawal.user_not_found') }, 404)

    if ((user.usdt_balance || 0) < amount) {
      return c.json({ error: `USDT 잔액이 부족합니다 (${(user.usdt_balance || 0).toFixed(2)} USDT)` }, 400)
    }

    const swapUqxResult = await db.prepare(`UPDATE users SET usdt_balance = usdt_balance - ?, qx_balance = qx_balance + ? WHERE id = ? AND usdt_balance >= ?`).bind(amount, qxToReceive, userId, amount).run()
    if (!swapUqxResult.meta.changes || swapUqxResult.meta.changes === 0) {
      return c.json({ error: `USDT 잔액이 부족합니다 (concurrent request)` }, 400)
    }

    // ★ 출금성 거래는 음수로 저장
    await db.prepare(`INSERT INTO transactions (user_id, type, coin_type, amount, description) VALUES (?, 'swap_out', 'USDT', ?, ?)`).bind(userId, -Math.abs(amount), `USDT → QX swap (${amount} USDT → ${qxToReceive.toLocaleString()} QX)`).run()

    await db.prepare(`INSERT INTO transactions (user_id, type, coin_type, amount, description) VALUES (?, 'swap_in', 'QX', ?, ?)`).bind(userId, qxToReceive, `USDT → QX swap (${amount} USDT → ${qxToReceive.toLocaleString()} QX)`).run()

    return c.json({ success: true, message: `${amount} USDT → ${qxToReceive.toLocaleString()} QX`, swap: { from: 'USDT', to: 'QX', usdtUsed: amount, received: qxToReceive } })
  } catch (error) {
    return c.json({ error: t(c, 'swap.error') }, 500)
  }
})

// ============================================
// API Routes - Staking
// ============================================

// 정책 변경 적용 시점: 2026-04-30 00:00 KST (UTC 2026-04-29 15:00)
//   - $1,000~$4,000 구간: 일일 배당률 0.3%/0.5% → 0.5% 통일
//   - $1,000~$4,000 구간: 거치기간 60일/90일 → 90일 통일
//   - $5,000 이상 구간(0.7% 120일, 1.0% 180일)은 변경 없음
//   - 기존 스테이킹은 staking row에 daily_rate/period_days가 고정 저장되어 영향 없음
const POLICY_V2_DATE = new Date('2026-04-30T00:00:00+09:00')

// 투자금액별 일일 배당률 계산
function getDailyRate(amount: number, asOf?: Date): number {
  const now = asOf || new Date()
  const isV2 = now >= POLICY_V2_DATE

  if (amount >= 10000) return 0.01    // $10,000+: 1.0%
  if (amount >= 5000) return 0.007    // $5,000~$9,000: 0.7%
  if (isV2) {
    // [V2 / 2026-04-30~] $1,000~$4,000: 0.5% 통일
    return 0.005
  }
  // [V1 / ~2026-04-29] 기존 룰
  if (amount >= 3000) return 0.005    // $3,000~$4,000: 0.5%
  return 0.003                         // $1,000~$2,000: 0.3%
}

// 투자금액별 자동 거치기간 결정
function getAutoPeriodDays(amount: number, asOf?: Date): number {
  const now = asOf || new Date()
  const isV2 = now >= POLICY_V2_DATE

  if (amount >= 10000) return 180     // $10,000+: 180일
  if (amount >= 5000) return 120      // $5,000~$9,000: 120일
  if (isV2) {
    // [V2 / 2026-04-30~] $1,000~$4,000: 90일 통일
    return 90
  }
  // [V1 / ~2026-04-29] 기존 룰
  if (amount >= 3000) return 90       // $3,000~$4,000: 90일
  return 60                            // $1,000~$2,000: 60일
}

// 스테이킹 생성
app.post('/api/staking/create', async (c) => {
  try {
    const { userId, amount } = await c.req.json()

    if (!userId || !amount) {
      return c.json({ error: t(c, 'profile.required_fields') }, 400)
    }

    if (amount <= 0) {
      return c.json({ error: t(c, 'staking.invalid_amount') }, 400)
    }

    // 최소 투자금액 검증 ($1,000)
    if (amount < 1000) {
      return c.json({ error: t(c, 'staking.min_amount') }, 400)
    }

    // $1,000 단위 검증
    if (amount % 1000 !== 0) {
      return c.json({ error: t(c, 'staking.unit_error') }, 400)
    }

    // 금액에 따라 거치기간 자동 결정
    const periodDays = getAutoPeriodDays(amount)

    const db = c.env.DB

    // 코인 지급 수량 계산 (날짜 기반 정책)
    // ~5/10: QTA 75,000 / QX 10,000 / QKEY 5,000 per $1,000 (사장님 지시 2026-05-04 연장)
    // 5/11~: QTA 75,000 only (QX·QKEY 즉시지급 없음, 일일배당 QKEY만 유지)
    const PHASE2_DATE = new Date('2026-05-11T00:00:00+09:00') // KST 기준 5월 11일 00:00 (5/10 23:59:59 까지 3종 지급)
    const now = new Date()
    const isPhase2 = now >= PHASE2_DATE

    const qtaReward = (amount / 1000) * 75000
    const qxReward = isPhase2 ? 0 : (amount / 1000) * 10000
    const qkeyReward = isPhase2 ? 0 : (amount / 1000) * 5000

    // 일일 배당률 계산
    const dailyRate = getDailyRate(amount)

    // 스테이킹 생성 (관리자 승인 대기 상태)
    const stakingResult = await db.prepare(`
      INSERT INTO staking (user_id, amount, period_months, period_days, qta_reward, qx_reward, qkey_reward, daily_rate, start_date, end_date, status)
      VALUES (?, ?, 0, ?, ?, ?, ?, ?, '', '', 'pending')
    `).bind(userId, amount, periodDays, qtaReward, qxReward, qkeyReward, dailyRate).run()

    const stakingId = stakingResult.meta.last_row_id

    return c.json({ 
      success: true, 
      message: t(c, 'staking.create_success'),
      staking: {
        id: stakingId,
        amount,
        periodDays,
        dailyRate: (dailyRate * 100).toFixed(1) + '%',
        qtaReward,
        qxReward,
        qkeyReward
      }
    })
  } catch (error) {
    return c.json({ error: t(c, 'staking.create_error') }, 500)
  }
})

// TXID 저장 API
app.post('/api/staking/txid', async (c) => {
  try {
    const { stakingId, txid } = await c.req.json()
    
    if (!stakingId || !txid) {
      return c.json({ error: t(c, 'staking.txid_required') }, 400)
    }

    // TXID 형식 검증 (0x로 시작하는 64자리 hex + 0x = 66자)
    const txidTrimmed = txid.trim()
    if (!/^0x[a-fA-F0-9]{64}$/.test(txidTrimmed)) {
      return c.json({ error: t(c, 'staking.txid_invalid') }, 400)
    }

    const db = c.env.DB

    await db.prepare(`
      UPDATE staking SET txid = ? WHERE id = ?
    `).bind(txidTrimmed, stakingId).run()

    return c.json({ success: true, message: t(c, 'staking.txid_success') })
  } catch (error) {
    return c.json({ error: t(c, 'staking.txid_error') }, 500)
  }
})

// 사용자별 스테이킹 목록 조회
app.get('/api/staking/list/:userId', async (c) => {
  try {
    const userId = c.req.param('userId')
    const db = c.env.DB

    // ★★ 룰 (확정) ★★
    //   1) 진입금액(USDT)은 메인 카드 + 하단 스테이킹 목록 모두에서 무조건 표시
    //      (리셋 회원이라도 자기가 얼마 넣었는지는 봐야 함)
    //   2) 리셋된 스테이킹도 사용자 화면에 그대로 노출 (단, 코인 3종 보상값만 0으로 표시)
    //   3) 어드민 화면(/api/admin/staking/all)도 동일하게 모든 스테이킹 노출
    //   4) 코인 3종은 어드민이 리셋한 시점에만 0이 되고, 그 이후 데일리 배당은 정상 누적
    const stakings = await db.prepare(`
      SELECT id, amount, period_months, period_days, qta_reward, qx_reward, qkey_reward, daily_rate, start_date, end_date, status, txid, created_at, reset_at
      FROM staking
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).bind(userId).all()

    // ★ 리셋 이력 판별: 본 스테이킹 row에 reset_at이 찍혀 있으면 그 row만 보상값 0 처리
    const result = stakings.results.map((s: any) => {
      if (s.reset_at) {
        return {
          ...s,
          qta_reward: 0,
          qx_reward: 0,
          qkey_reward: 0
        }
      }
      return s
    })

    // is_reset_user: 한 건이라도 reset_at이 있으면 true (UI에서 안내용)
    const isResetUser = stakings.results.some((s: any) => !!s.reset_at)

    return c.json({ 
      success: true, 
      stakings: result,
      is_reset_user: isResetUser
    })
  } catch (error) {
    return c.json({ error: t(c, 'staking.list_error') }, 500)
  }
})

// 관리자: 투자 승인 (코인 지급)
app.post('/api/admin/staking/approve/:stakingId', async (c) => {
  try {
    const db = c.env.DB
    const stakingId = c.req.param('stakingId')

    // 투자 정보 조회
    const staking = await db.prepare(`
      SELECT * FROM staking WHERE id = ? AND status = 'pending'
    `).bind(stakingId).first()

    if (!staking) {
      return c.json({ error: t(c, 'admin.pending_not_found') }, 404)
    }

    // 승인 시점에 시작일과 종료일 설정 (거치기간: 일 단위)
    const startDate = new Date()
    const endDate = new Date(startDate)
    const periodDays = staking.period_days || (staking.period_months * 30)
    endDate.setDate(endDate.getDate() + periodDays)

    // 스테이킹 상태를 active로 변경하고 날짜 설정
    await db.prepare(`
      UPDATE staking 
      SET status = 'active', 
          start_date = ?, 
          end_date = ? 
      WHERE id = ?
    `).bind(startDate.toISOString(), endDate.toISOString(), stakingId).run()

    // 사용자 잔액 업데이트 (QTA 항상 지급, QX·QKEY는 DB 저장값 기반)
    const qkeyReward = staking.qkey_reward || 0
    const qxReward = staking.qx_reward || 0

    // QTA는 항상 지급
    await db.prepare(`
      UPDATE users SET qta_balance = qta_balance + ? WHERE id = ?
    `).bind(staking.qta_reward, staking.user_id).run()

    await db.prepare(`
      INSERT INTO transactions (user_id, type, coin_type, amount, description)
      VALUES (?, 'staking_reward', 'QTA', ?, ?)
    `).bind(staking.user_id, staking.qta_reward, `Staking reward (${periodDays}d)`).run()

    // QX 지급 (0보다 클 때만)
    if (qxReward > 0) {
      await db.prepare(`
        UPDATE users SET qx_balance = qx_balance + ? WHERE id = ?
      `).bind(qxReward, staking.user_id).run()

      await db.prepare(`
        INSERT INTO transactions (user_id, type, coin_type, amount, description)
        VALUES (?, 'staking_reward', 'QX', ?, ?)
      `).bind(staking.user_id, qxReward, `Staking reward (${periodDays}d)`).run()
    }

    // QKEY 즉시지급 (0보다 클 때만)
    if (qkeyReward > 0) {
      await db.prepare(`
        UPDATE users SET qkey_balance = qkey_balance + ? WHERE id = ?
      `).bind(qkeyReward, staking.user_id).run()

      await db.prepare(`
        INSERT INTO transactions (user_id, type, coin_type, amount, description)
        VALUES (?, 'staking_reward', 'QKEY', ?, ?)
      `).bind(staking.user_id, qkeyReward, `Staking reward (${periodDays}d)`).run()
    }

    // 직접추천수당 지급 (1회성, 매출의 10%, QKEY로 지급)
    // 환율: 1 USD = 1,500 KRW, 1 QKEY = 10 KRW → 1 USD = 150 QKEY
    // ★★ 정책 (2026-05-01 확정) ★★
    //   추천인 본인이 스테이킹을 "완료(승인)"하지 않았으면 직접추천수당도 지급하지 않는다.
    //   본인 스테이킹이 active 상태(거치기간 내)일 때만 지급.
    //   pending/없음/end_date 지남 → 0 지급(스킵), referral_rewards에도 기록하지 않음.
    try {
      const referrer = await db.prepare(`
        SELECT referrer_id FROM users WHERE id = ?
      `).bind(staking.user_id).first()

      if (referrer && referrer.referrer_id) {
        // 추천인 본인이 active 스테이킹을 보유하고 있는지(거치기간 내) 확인 (KST 룰 적용)
        const referrerActive = await db.prepare(`
          SELECT id FROM staking
          WHERE user_id = ?
            AND status = 'active'
            AND date(start_date, '+9 hours') <= date('now', '+9 hours')
            AND date(end_date, '+9 hours') >= date('now', '+9 hours')
          LIMIT 1
        `).bind(referrer.referrer_id).first()

        if (referrerActive) {
          const USD_TO_QKEY = 150
          const directBonusUsd = staking.amount * 0.10 // 매출의 10% (USD)
          const directBonusQkey = Math.round(directBonusUsd * USD_TO_QKEY) // QKEY로 변환

          await db.prepare(`
            UPDATE users SET qkey_balance = qkey_balance + ? WHERE id = ?
          `).bind(directBonusQkey, referrer.referrer_id).run()

          await db.prepare(`
            INSERT INTO transactions (user_id, type, coin_type, amount, description)
            VALUES (?, 'direct_referral', 'QKEY', ?, ?)
          `).bind(referrer.referrer_id, directBonusQkey, `Direct referral bonus ($${staking.amount.toLocaleString()} x 10% = ${directBonusQkey.toLocaleString()} QKEY)`).run()

          // 직접판매수당은 매출 발생 즉시 지급(공휴일 무관) → reward_date / paid_date 모두 오늘 KST
          await db.prepare(`
            INSERT INTO referral_rewards (referrer_id, referee_id, level, original_amount, reward_amount, reward_date, paid_date)
            VALUES (?, ?, 0, ?, ?, date('now', '+9 hours'), date('now', '+9 hours'))
          `).bind(referrer.referrer_id, staking.user_id, staking.amount, directBonusQkey).run()
        } else {
          console.log(`[직접추천수당 스킵] 추천인 #${referrer.referrer_id} 본인 스테이킹 미완료 (referee #${staking.user_id})`)
        }
      }
    } catch (e) {
      console.error('직접추천수당 지급 오류:', e)
    }

    return c.json({ 
      success: true, 
      message: t(c, 'admin.approve_success'),
      staking: {
        id: stakingId,
        userId: staking.user_id,
        qtaReward: staking.qta_reward,
        qxReward: staking.qx_reward,
        qkeyReward: qkeyReward,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }
    })
  } catch (error) {
    return c.json({ error: t(c, 'admin.approve_error') }, 500)
  }
})

// 관리자: 스테이킹 거절
app.post('/api/admin/staking/reject/:stakingId', async (c) => {
  try {
    const db = c.env.DB
    const stakingId = c.req.param('stakingId')

    // 스테이킹 정보 조회
    const staking = await db.prepare(`
      SELECT * FROM staking WHERE id = ? AND status = 'pending'
    `).bind(stakingId).first()

    if (!staking) {
      return c.json({ error: t(c, 'admin.staking_pending_not_found') }, 404)
    }

    // 스테이킹 상태를 rejected로 변경
    await db.prepare(`
      UPDATE staking SET status = 'rejected' WHERE id = ?
    `).bind(stakingId).run()

    return c.json({ 
      success: true, 
      message: t(c, 'admin.reject_success')
    })
  } catch (error) {
    return c.json({ error: t(c, 'admin.reject_error') }, 500)
  }
})

// 관리자: 승인 대기 중인 스테이킹 목록 조회
app.get('/api/admin/staking/pending', async (c) => {
  try {
    const db = c.env.DB

    // ★ 안전장치: status='pending'만 정확히 조회 (active/rejected/completed는 절대 제외)
    //   이미 처리된 row가 화면에 다시 뜨던 문제를 차단
    const stakings = await db.prepare(`
      SELECT s.*, u.name, u.email, u.wallet_address
      FROM staking s
      JOIN users u ON s.user_id = u.id
      WHERE s.status = 'pending'
        AND s.status != 'active'
        AND s.status != 'rejected'
        AND s.status != 'completed'
      ORDER BY s.created_at DESC
    `).all()

    // 브라우저/CDN 캐시 완전 차단: 승인 직후 즉시 최신 상태 반영
    c.header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
    c.header('Pragma', 'no-cache')
    c.header('Expires', '0')

    return c.json({
      success: true,
      stakings: stakings.results,
      _ts: Date.now()
    })
  } catch (error) {
    return c.json({ error: t(c, 'admin.pending_list_error') }, 500)
  }
})

// 관리자: 전체 스테이킹 목록 조회
app.get('/api/admin/staking/all', async (c) => {
  try {
    const db = c.env.DB
    
    const stakings = await db.prepare(`
      SELECT s.*, u.name, u.email, u.wallet_address
      FROM staking s
      JOIN users u ON s.user_id = u.id
      ORDER BY s.created_at DESC
    `).all()

    return c.json({ 
      success: true, 
      stakings: stakings.results 
    })
  } catch (error) {
    return c.json({ error: t(c, 'admin.all_list_error') }, 500)
  }
})

// 관리자: 전체 사용자 목록 조회
app.get('/api/admin/users', async (c) => {
  try {
    const db = c.env.DB
    
    // 사용자 목록 조회 (스테이킹 총 수량 + 추천인 정보 포함)
    const users = await db.prepare(`
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.phone, 
        u.wallet_address, 
        u.usdt_wallet_address,
        u.qta_balance, 
        u.qx_balance, 
        u.qkey_balance,
        u.usdt_balance, 
        u.country,
        u.language,
        u.referral_code,
        u.referrer_id,
        (SELECT name FROM users r WHERE r.id = u.referrer_id) as referrer_name,
        u.created_at,
        COALESCE(SUM(CASE WHEN s.status = 'active' THEN s.amount ELSE 0 END), 0) as staking_amount
      FROM users u
      LEFT JOIN staking s ON u.id = s.user_id
      GROUP BY u.id, u.name, u.email, u.phone, u.wallet_address, u.usdt_wallet_address,
               u.qta_balance, u.qx_balance, u.qkey_balance, u.usdt_balance, u.country, u.language,
               u.referral_code, u.referrer_id, u.created_at
      ORDER BY u.created_at DESC
    `).all()

    return c.json({ 
      success: true, 
      users: users.results 
    })
  } catch (error) {
    return c.json({ error: t(c, 'admin.users_list_error') }, 500)
  }
})

// 관리자: 사용자 강제 탈퇴
app.delete('/api/admin/user/:userId', async (c) => {
  try {
    const userId = c.req.param('userId')
    const db = c.env.DB

    // ★ 강제 삭제 옵션 (?force=1) ★
    //   - force=1: 진행 중인 스테이킹이 있어도 모든 데이터 삭제
    //   - force 미지정: 기존처럼 active 스테이킹 있으면 차단 (안전장치)
    const url = new URL(c.req.url)
    const force = url.searchParams.get('force') === '1'

    // 사용자 존재 확인
    const user = await db.prepare(`
      SELECT id, name, email FROM users WHERE id = ?
    `).bind(userId).first()

    if (!user) {
      return c.json({ error: t(c, 'admin.user_not_found') }, 404)
    }

    // 진행 중인 스테이킹 확인 (force=1이면 차단 우회)
    if (!force) {
      const activeStaking = await db.prepare(`
        SELECT COUNT(*) as count FROM staking 
        WHERE user_id = ? AND status = 'active' AND reset_at IS NULL
      `).bind(userId).first()

      if (activeStaking && activeStaking.count > 0) {
        return c.json({ 
          error: t(c, 'admin.active_staking_block'),
          activeStakingCount: activeStaking.count,
          hint: '강제 삭제하려면 ?force=1 쿼리 파라미터를 추가하세요.'
        }, 400)
      }
    }

    // 관련 데이터 삭제 (순서 중요: 외래키 제약조건)
    // 모든 삭제 작업을 try-catch로 감싸서 안전하게 처리
    
    // 1. 추천 보상 내역 삭제
    try {
      await db.prepare(`
        DELETE FROM referral_rewards 
        WHERE referrer_id = ? OR referee_id = ?
      `).bind(userId, userId).run()
    } catch (e) {
      console.log('referral_rewards 삭제 실패 (테이블 없음 또는 데이터 없음)')
    }

    // 2. 일일 보상 내역 삭제
    try {
      await db.prepare(`
        DELETE FROM daily_rewards WHERE user_id = ?
      `).bind(userId).run()
    } catch (e) {
      console.log('daily_rewards 삭제 실패:', e)
    }

    // 3. 거래 내역 삭제
    try {
      await db.prepare(`
        DELETE FROM transactions WHERE user_id = ?
      `).bind(userId).run()
    } catch (e) {
      console.log('transactions 삭제 실패:', e)
    }

    // 4. 출금 신청 내역 삭제
    try {
      await db.prepare(`
        DELETE FROM withdrawals WHERE user_id = ?
      `).bind(userId).run()
    } catch (e) {
      console.log('withdrawals 삭제 실패:', e)
    }

    // 5. 스테이킹 내역 삭제
    try {
      await db.prepare(`
        DELETE FROM staking WHERE user_id = ?
      `).bind(userId).run()
    } catch (e) {
      console.log('staking 삭제 실패:', e)
    }

    // 6. 추천 관계 해제 (이 사용자를 추천인으로 가진 사용자들)
    try {
      await db.prepare(`
        UPDATE users SET referrer_id = NULL WHERE referrer_id = ?
      `).bind(userId).run()
    } catch (e) {
      console.log('referrer_id 업데이트 실패:', e)
    }

    // 7. 사용자 삭제 (이것만은 반드시 성공해야 함)
    await db.prepare(`
      DELETE FROM users WHERE id = ?
    `).bind(userId).run()

    return c.json({ 
      success: true, 
      message: t(c, 'admin.delete_success'),
      deletedUser: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    })
  } catch (error) {
    console.error('사용자 탈퇴 처리 오류:', error)
    return c.json({ error: t(c, 'admin.delete_error') }, 500)
  }
})

// 관리자: 사용자 일괄 삭제 (특정 이메일 제외)
//
// ⚠️⚠️⚠️ 이 API는 사고 발생 후 강력한 안전장치가 적용되어 있습니다 ⚠️⚠️⚠️
// 한 번이라도 사고가 나면 회복이 어려우므로 다음 모든 조건을 통과해야 실제 삭제가 진행됩니다:
//  1. userIds(숫자 배열)가 명시적으로 전달되어야 함 (빈 배열, 미지정 모두 거부)
//  2. confirm === "I_UNDERSTAND_THIS_DELETES_USERS_PERMANENTLY" 이중 확인 문자열 필요
//  3. 한 번에 처리 가능한 최대 사용자 수 50명 제한
//  4. active 스테이킹이 있는 회원은 자동 제외 (실수로 운영 중인 회원 삭제 방지)
//  5. 모든 삭제 대상은 응답에 deletedUsers로 기록
app.post('/api/admin/users/bulk-delete', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}))
    const { userIds: requestedUserIds, keepEmails, confirm } = body as any
    const db = c.env.DB

    // 🔒 SAFETY 1: userIds가 명시적으로 전달되지 않으면 거부
    if (!Array.isArray(requestedUserIds) || requestedUserIds.length === 0) {
      return c.json({
        error: '삭제할 사용자 ID 목록(userIds)을 명시적으로 전달해야 합니다. 빈 배열은 허용되지 않습니다.',
        hint: 'userIds: [숫자배열], confirm: "I_UNDERSTAND_THIS_DELETES_USERS_PERMANENTLY" 두 값을 모두 전달하세요.'
      }, 400)
    }

    // 🔒 SAFETY 2: 이중 confirm 토큰 필요 (실수로 호출 못 하게)
    const REQUIRED_CONFIRM = 'I_UNDERSTAND_THIS_DELETES_USERS_PERMANENTLY'
    if (confirm !== REQUIRED_CONFIRM) {
      return c.json({
        error: '삭제 확인 토큰이 일치하지 않습니다.',
        hint: `confirm 필드에 정확히 "${REQUIRED_CONFIRM}" 문자열을 전달해야 합니다.`
      }, 400)
    }

    // 🔒 SAFETY 3: 한 번에 50명 이상 처리 금지
    if (requestedUserIds.length > 50) {
      return c.json({
        error: '한 번에 50명 이상은 삭제할 수 없습니다. 분할해서 호출하세요.',
        attempted: requestedUserIds.length
      }, 400)
    }

    // 🔒 SAFETY 4: 모든 ID가 유효한 숫자인지 확인
    const validIds = requestedUserIds.filter((id: any) => typeof id === 'number' && Number.isInteger(id) && id > 0)
    if (validIds.length !== requestedUserIds.length) {
      return c.json({
        error: 'userIds 배열은 양의 정수만 포함해야 합니다.',
        invalid: requestedUserIds.filter((id: any) => !validIds.includes(id))
      }, 400)
    }

    // 보호할 이메일 목록 (기본값: 관리자)
    const protectedEmails = (Array.isArray(keepEmails) && keepEmails.length > 0)
      ? keepEmails
      : ['admin@quantarium.com']

    // 삭제 대상: 명시적으로 받은 userIds 중 보호 이메일이 아닌 사용자만
    const idPlaceholders = validIds.map(() => '?').join(',')
    const emailPlaceholders = protectedEmails.map(() => '?').join(',')
    const usersToDelete = await db.prepare(`
      SELECT u.id, u.name, u.email,
             (SELECT COUNT(*) FROM staking WHERE user_id = u.id AND status = 'active') as active_staking_count
      FROM users u
      WHERE u.id IN (${idPlaceholders})
        AND u.email NOT IN (${emailPlaceholders})
    `).bind(...validIds, ...protectedEmails).all()

    if (usersToDelete.results.length === 0) {
      return c.json({
        success: true,
        message: t(c, 'admin.no_users_to_delete'),
        deletedCount: 0,
        keptEmails: protectedEmails
      })
    }

    // 🔒 SAFETY 5: active 스테이킹이 있는 회원은 자동 제외
    const safeToDelete = usersToDelete.results.filter((u: any) => (u.active_staking_count || 0) === 0)
    const skippedActive = usersToDelete.results.filter((u: any) => (u.active_staking_count || 0) > 0)

    if (safeToDelete.length === 0) {
      return c.json({
        success: false,
        error: '삭제 대상 회원이 모두 active 스테이킹을 가지고 있어 삭제할 수 없습니다.',
        skippedActive: skippedActive.map((u: any) => ({ id: u.id, name: u.name, email: u.email, active_staking_count: u.active_staking_count }))
      }, 400)
    }

    let deletedCount = 0

    // 각 사용자 삭제
    for (const user of safeToDelete as any[]) {
      try {
        const userId = user.id

        // 1. referral_rewards 삭제
        try {
          await db.prepare(`DELETE FROM referral_rewards WHERE referrer_id = ? OR referee_id = ?`).bind(userId, userId).run()
        } catch (e) { }

        // 2. daily_rewards 삭제
        try {
          await db.prepare(`DELETE FROM daily_rewards WHERE user_id = ?`).bind(userId).run()
        } catch (e) { }

        // 3. transactions 삭제
        try {
          await db.prepare(`DELETE FROM transactions WHERE user_id = ?`).bind(userId).run()
        } catch (e) { }

        // 4. withdrawals 삭제
        try {
          await db.prepare(`DELETE FROM withdrawals WHERE user_id = ?`).bind(userId).run()
        } catch (e) { }

        // 5. staking 삭제 (active는 위에서 제외했지만, pending/rejected 등은 함께 삭제됨)
        try {
          await db.prepare(`DELETE FROM staking WHERE user_id = ?`).bind(userId).run()
        } catch (e) { }

        // 6. 추천 관계 해제
        try {
          await db.prepare(`UPDATE users SET referrer_id = NULL WHERE referrer_id = ?`).bind(userId).run()
        } catch (e) { }

        // 7. 사용자 삭제
        await db.prepare(`DELETE FROM users WHERE id = ?`).bind(userId).run()
        
        deletedCount++
      } catch (error) {
        console.error(`사용자 ${(user as any).email} 삭제 실패:`, error)
      }
    }

    return c.json({ 
      success: true, 
      message: `${deletedCount}${t(c, 'admin.bulk_delete_success')}`,
      deletedCount: deletedCount,
      deletedUsers: safeToDelete.map((u: any) => ({ id: u.id, name: u.name, email: u.email })),
      skippedActive: skippedActive.map((u: any) => ({ id: u.id, name: u.name, email: u.email, active_staking_count: u.active_staking_count })),
      keptEmails: protectedEmails
    })
  } catch (error) {
    console.error('일괄 삭제 오류:', error)
    return c.json({ error: t(c, 'admin.bulk_delete_error') }, 500)
  }
})

// 관리자: 배당 현황 조회 (전체 배당금 지급 내역)
app.get('/api/admin/rewards', async (c) => {
  try {
    const db = c.env.DB

    // 배당 통계
    const stats = await db.prepare(`
      SELECT 
        COUNT(*) as total_count,
        COALESCE(SUM(usdt_amount), 0) as total_qkey,
        COUNT(DISTINCT user_id) as unique_users,
        MAX(reward_date) as last_reward_date
      FROM daily_rewards
    `).first()

    // 오늘 배당 내역
    const todayRewards = await db.prepare(`
      SELECT 
        COUNT(*) as count,
        COALESCE(SUM(usdt_amount), 0) as total_qkey
      FROM daily_rewards
      WHERE reward_date = date('now', '+9 hours')
    `).first()

    // 최근 배당 내역 (최근 100건, 사용자 정보 포함)
    const recentRewards = await db.prepare(`
      SELECT 
        d.id, d.user_id, d.staking_id, d.usdt_amount as qkey_amount, d.reward_date, d.created_at,
        u.name, u.email,
        s.amount as staking_amount, s.daily_rate
      FROM daily_rewards d
      JOIN users u ON d.user_id = u.id
      LEFT JOIN staking s ON d.staking_id = s.id
      ORDER BY d.created_at DESC
      LIMIT 100
    `).all()

    // 추천 보상 통계
    const referralStats = await db.prepare(`
      SELECT 
        COUNT(*) as total_count,
        COALESCE(SUM(reward_amount), 0) as total_qkey,
        COALESCE(SUM(CASE WHEN level = 0 THEN reward_amount ELSE 0 END), 0) as direct_total,
        COALESCE(SUM(CASE WHEN level = 1 THEN reward_amount ELSE 0 END), 0) as level1_total,
        COALESCE(SUM(CASE WHEN level = 2 THEN reward_amount ELSE 0 END), 0) as level2_total
      FROM referral_rewards
    `).first()

    // 추천 보상 상세 내역 (최근 100건, 직판/성과금 구분)
    let recentReferrals: any[] = []
    try {
      const refRows = await db.prepare(`
        SELECT 
          rr.id, rr.referrer_id, rr.referee_id, rr.level, rr.original_amount, rr.reward_amount,
          rr.reward_date, rr.created_at,
          ru.name as referrer_name, ru.email as referrer_email,
          re.name as referee_name, re.email as referee_email
        FROM referral_rewards rr
        LEFT JOIN users ru ON rr.referrer_id = ru.id
        LEFT JOIN users re ON rr.referee_id = re.id
        ORDER BY rr.created_at DESC
        LIMIT 100
      `).all()
      recentReferrals = refRows.results || []
    } catch (e) {
      recentReferrals = []
    }

    return c.json({
      success: true,
      stats: {
        totalCount: stats?.total_count || 0,
        totalQkey: stats?.total_qkey || 0,
        uniqueUsers: stats?.unique_users || 0,
        lastRewardDate: stats?.last_reward_date || '-'
      },
      today: {
        count: todayRewards?.count || 0,
        totalQkey: todayRewards?.total_qkey || 0
      },
      referralStats: {
        totalCount: referralStats?.total_count || 0,
        totalQkey: referralStats?.total_qkey || 0,
        directTotal: referralStats?.direct_total || 0,
        level1Total: referralStats?.level1_total || 0,
        level2Total: referralStats?.level2_total || 0
      },
      rewards: recentRewards.results,
      referrals: recentReferrals
    })
  } catch (error) {
    console.error('배당 현황 조회 오류:', error)
    return c.json({ error: t(c, 'admin.rewards_error') }, 500)
  }
})

// 어드민: 직접판매/성과금 CSV 다운로드 (referral_rewards 전체)
app.get('/api/admin/export/referrals', async (c) => {
  try {
    const db = c.env.DB
    const rows = await db.prepare(`
      SELECT 
        rr.id, rr.level, rr.original_amount, rr.reward_amount,
        rr.reward_date, rr.created_at,
        ru.name as referrer_name, ru.email as referrer_email,
        re.name as referee_name, re.email as referee_email
      FROM referral_rewards rr
      LEFT JOIN users ru ON rr.referrer_id = ru.id
      LEFT JOIN users re ON rr.referee_id = re.id
      ORDER BY rr.created_at DESC
    `).all()
    const BOM = String.fromCharCode(0xFEFF)
    const LF = String.fromCharCode(10)
    const headers = ['ID','구분','지급일','수령자(추천인)','수령자이메일','피추천인','피추천인이메일','원금(USD)','지급QKEY','등록시각']
    let csv = BOM + headers.join(',') + LF
    const labels: Record<number,string> = { 0: '직접판매', 1: '1대성과금', 2: '2대성과금' }
    for (const r of (rows.results || []) as any[]) {
      const safe = (v: any) => '"' + String(v == null ? '' : v).split('"').join('""') + '"'
      csv += [
        r.id,
        safe(labels[r.level as number] || ('레벨'+r.level)),
        safe(r.reward_date || ''),
        safe(r.referrer_name || ''),
        safe(r.referrer_email || ''),
        safe(r.referee_name || ''),
        safe(r.referee_email || ''),
        Number(r.original_amount || 0),
        Math.round(Number(r.reward_amount || 0)),
        safe(r.created_at || '')
      ].join(',') + LF
    }
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="referral_rewards_export.csv"'
      }
    })
  } catch (error) {
    return c.json({ error: '추천 보상 CSV 생성 중 오류' }, 500)
  }
})

// 어드민: 일일배당 CSV 다운로드 (daily_rewards 전체)
app.get('/api/admin/export/daily-rewards', async (c) => {
  try {
    const db = c.env.DB
    const rows = await db.prepare(`
      SELECT 
        d.id, d.user_id, d.staking_id, d.usdt_amount as qkey_amount, 
        d.reward_date, d.created_at,
        u.name, u.email,
        s.amount as staking_amount, s.daily_rate, s.period_days
      FROM daily_rewards d
      LEFT JOIN users u ON d.user_id = u.id
      LEFT JOIN staking s ON d.staking_id = s.id
      ORDER BY d.created_at DESC
    `).all()
    const BOM = String.fromCharCode(0xFEFF)
    const LF = String.fromCharCode(10)
    const headers = ['ID','지급일','회원명','이메일','투자금(USD)','일배당률(%)','기간(일)','지급QKEY','등록시각']
    let csv = BOM + headers.join(',') + LF
    for (const r of (rows.results || []) as any[]) {
      const safe = (v: any) => '"' + String(v == null ? '' : v).split('"').join('""') + '"'
      const ratePct = r.daily_rate ? (Number(r.daily_rate) * 100).toFixed(2) : ''
      csv += [
        r.id,
        safe(r.reward_date || ''),
        safe(r.name || ''),
        safe(r.email || ''),
        Number(r.staking_amount || 0),
        ratePct,
        Number(r.period_days || 0),
        Math.round(Number(r.qkey_amount || 0)),
        safe(r.created_at || '')
      ].join(',') + LF
    }
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="daily_rewards_export.csv"'
      }
    })
  } catch (error) {
    return c.json({ error: '일일배당 CSV 생성 중 오류' }, 500)
  }
})

// 관리자: 출금 관리 (전체 출금 신청 목록)
app.get('/api/admin/withdrawals', async (c) => {
  try {
    const db = c.env.DB

    // cancelled_at / cancelled_by 컬럼 보장 (이미 있으면 무시)
    try { await db.prepare(`ALTER TABLE withdrawals ADD COLUMN cancelled_at DATETIME`).run() } catch(e) {}
    try { await db.prepare(`ALTER TABLE withdrawals ADD COLUMN cancelled_by TEXT`).run() } catch(e) {}

    // 출금 통계
    const stats = await db.prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END), 0) as pending_count,
        COALESCE(SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END), 0) as approved_count,
        COALESCE(SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END), 0) as rejected_count,
        COALESCE(SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END), 0) as cancelled_count,
        COUNT(*) as total_count
      FROM withdrawals
    `).first()

    // 전체 출금 목록 (사용자 정보 + 취소 메타 포함)
    const withdrawals = await db.prepare(`
      SELECT 
        w.id, w.user_id, w.coin_type, w.amount, w.wallet_address, w.status, w.created_at,
        w.cancelled_at, w.cancelled_by,
        u.name, u.email
      FROM withdrawals w
      JOIN users u ON w.user_id = u.id
      ORDER BY w.created_at DESC
      LIMIT 200
    `).all()

    return c.json({
      success: true,
      stats: {
        pendingCount: stats?.pending_count || 0,
        approvedCount: stats?.approved_count || 0,
        rejectedCount: stats?.rejected_count || 0,
        cancelledCount: stats?.cancelled_count || 0,
        totalCount: stats?.total_count || 0
      },
      withdrawals: withdrawals.results
    })
  } catch (error) {
    console.error('출금 관리 조회 오류:', error)
    return c.json({ error: t(c, 'admin.withdrawals_error') }, 500)
  }
})

// 관리자: 출금 승인
app.post('/api/admin/withdrawal/approve/:withdrawalId', async (c) => {
  try {
    const db = c.env.DB
    const withdrawalId = c.req.param('withdrawalId')

    const withdrawal = await db.prepare(`
      SELECT * FROM withdrawals WHERE id = ? AND status = 'pending'
    `).bind(withdrawalId).first()

    if (!withdrawal) {
      return c.json({ error: t(c, 'admin.wd_pending_not_found') }, 404)
    }

    await db.prepare(`
      UPDATE withdrawals SET status = 'approved' WHERE id = ?
    `).bind(withdrawalId).run()

    return c.json({ success: true, message: t(c, 'admin.wd_approve_success') })
  } catch (error) {
    return c.json({ error: t(c, 'admin.wd_approve_error') }, 500)
  }
})

// 관리자: 출금 거절 (잔액 환불)
app.post('/api/admin/withdrawal/reject/:withdrawalId', async (c) => {
  try {
    const db = c.env.DB
    const withdrawalId = c.req.param('withdrawalId')

    const withdrawal = await db.prepare(`
      SELECT * FROM withdrawals WHERE id = ? AND status = 'pending'
    `).bind(withdrawalId).first()

    if (!withdrawal) {
      return c.json({ error: t(c, 'admin.wd_pending_not_found') }, 404)
    }

    // 잔액 환불
    const balanceField = withdrawal.coin_type === 'QTA' ? 'qta_balance' :
                         withdrawal.coin_type === 'QX' ? 'qx_balance' :
                         withdrawal.coin_type === 'QKEY' ? 'qkey_balance' : 'usdt_balance'

    await db.prepare(`
      UPDATE users SET ${balanceField} = ${balanceField} + ? WHERE id = ?
    `).bind(withdrawal.amount, withdrawal.user_id).run()

    await db.prepare(`
      UPDATE withdrawals SET status = 'rejected' WHERE id = ?
    `).bind(withdrawalId).run()

    return c.json({ success: true, message: t(c, 'admin.wd_reject_success') })
  } catch (error) {
    return c.json({ error: t(c, 'admin.wd_reject_error') }, 500)
  }
})

// 관리자: 회원 상세 조회
app.get('/api/admin/user/:userId', async (c) => {
  try {
    const db = c.env.DB
    const userId = c.req.param('userId')

    // 사용자 기본 정보
    const user = await db.prepare(`
      SELECT id, email, name, phone, wallet_address, usdt_wallet_address, 
             qta_balance, qx_balance, qkey_balance, usdt_balance, 
             referral_code, referrer_id, created_at
      FROM users WHERE id = ?
    `).bind(userId).first()

    if (!user) {
      return c.json({ error: t(c, 'withdrawal.user_not_found') }, 404)
    }

    // 스테이킹 내역
    const stakings = await db.prepare(`
      SELECT * FROM staking WHERE user_id = ? ORDER BY created_at DESC
    `).bind(userId).all()

    // 배당 내역 — 정합성 표시를 위해 LIMIT 제거, KST 정렬
    const rewards = await db.prepare(`
      SELECT d.*, s.amount as staking_amount
      FROM daily_rewards d
      LEFT JOIN staking s ON d.staking_id = s.id
      WHERE d.user_id = ?
      ORDER BY datetime(d.created_at, '+9 hours') DESC, d.id DESC
    `).bind(userId).all()

    // 출금 내역
    const withdrawals = await db.prepare(`
      SELECT * FROM withdrawals WHERE user_id = ? ORDER BY created_at DESC
    `).bind(userId).all()

    // 거래 내역 — 잔액 정합성 표시를 위해 LIMIT 제거 (전체 행 반환, KST 정렬)
    const transactions = await db.prepare(`
      SELECT * FROM transactions WHERE user_id = ?
      ORDER BY datetime(created_at, '+9 hours') DESC, id DESC
    `).bind(userId).all()

    // 직판수당(매출수당) 내역 — referrer_id 기준으로 본인이 받은 referral_rewards 표시
    let referralRewards: any[] = []
    try {
      const rr = await db.prepare(`
        SELECT r.id, r.referrer_id, r.referee_id, r.level, r.reward_amount,
               r.reward_date, r.paid_date, r.created_at,
               u.email as referee_email, u.name as referee_name
        FROM referral_rewards r
        LEFT JOIN users u ON r.referee_id = u.id
        WHERE r.referrer_id = ?
        ORDER BY r.created_at DESC
        LIMIT 100
      `).bind(userId).all()
      referralRewards = (rr.results || []) as any[]
    } catch(e) { /* 테이블 없으면 무시 */ }

    // 추천인 정보
    let referrer = null
    if (user.referrer_id) {
      referrer = await db.prepare(`
        SELECT id, name, email FROM users WHERE id = ?
      `).bind(user.referrer_id).first()
    }

    // 피추천인 수
    const referrals = await db.prepare(`
      SELECT COUNT(*) as count FROM users WHERE referrer_id = ?
    `).bind(userId).first()

    return c.json({
      success: true,
      user,
      stakings: stakings.results,
      rewards: rewards.results,
      referral_rewards: referralRewards,
      withdrawals: withdrawals.results,
      transactions: transactions.results,
      referrer,
      referralCount: referrals?.count || 0
    })
  } catch (error) {
    console.error('회원 상세 조회 오류:', error)
    return c.json({ error: t(c, 'admin.user_detail_error') }, 500)
  }
})

// 관리자: 회원 코인 잔액 리셋 (잔액 0 + 관련 거래내역/출금/보상 기록 전부 삭제)
// 관리자: 특정 스테이킹의 reset_at 마킹을 해제 (잘못 리셋된 건 복구용)
app.post('/api/admin/staking/:stakingId/unmark-reset', async (c) => {
  try {
    const db = c.env.DB
    const stakingId = c.req.param('stakingId')
    const s = await db.prepare(`SELECT id, user_id, amount, reset_at FROM staking WHERE id = ?`).bind(stakingId).first() as any
    if (!s) return c.json({ error: '스테이킹을 찾을 수 없습니다' }, 404)
    if (!s.reset_at) return c.json({ error: '이 스테이킹은 리셋된 적이 없습니다' }, 400)
    await db.prepare(`UPDATE staking SET reset_at = NULL WHERE id = ?`).bind(stakingId).run()
    const after = await db.prepare(`SELECT id, user_id, amount, reset_at FROM staking WHERE id = ?`).bind(stakingId).first()
    return c.json({ success: true, message: 'reset_at 마킹 해제됨', before: s, after })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

// 관리자: V2 정책($1,000~$4,000 = 90일/0.5%) 기존 row 일괄 보정
//  - 대상: status='active' AND amount in [1000, 4000] AND (period_days != 90 OR daily_rate != 0.005)
//  - period_days = 90, daily_rate = 0.005 강제 변경
//  - end_date = start_date + 90일 재계산
//  - reset_at 여부와 무관 (리셋된 스테이킹도 보정)
//  - dryRun=true 면 실제 수정 없이 대상만 반환
app.post('/api/admin/staking/migrate-v2', async (c) => {
  try {
    const db = c.env.DB
    const body = await c.req.json().catch(() => ({}))
    const dryRun = body.dryRun === true

    const targets = await db.prepare(`
      SELECT id, user_id, amount, period_days, daily_rate, start_date, end_date, reset_at
      FROM staking
      WHERE status = 'active'
        AND amount >= 1000 AND amount <= 4000
        AND (period_days != 90 OR daily_rate != 0.005)
    `).all()

    const updated: any[] = []
    for (const s of (targets.results as any[])) {
      let newEnd = s.end_date
      try {
        if (s.start_date) {
          const sd = new Date(s.start_date)
          if (!isNaN(sd.getTime())) {
            const ed = new Date(sd.getTime() + 90 * 24 * 60 * 60 * 1000)
            newEnd = ed.toISOString()
          }
        }
      } catch (_) {}

      const before = {
        id: s.id, user_id: s.user_id, amount: s.amount,
        period_days: s.period_days, daily_rate: s.daily_rate, end_date: s.end_date
      }
      const after = {
        id: s.id, user_id: s.user_id, amount: s.amount,
        period_days: 90, daily_rate: 0.005, end_date: newEnd
      }

      if (!dryRun) {
        await db.prepare(`
          UPDATE staking
          SET period_days = 90, daily_rate = 0.005, end_date = ?
          WHERE id = ?
        `).bind(newEnd, s.id).run()
      }
      updated.push({ before, after })
    }

    return c.json({
      success: true,
      dryRun,
      target_count: updated.length,
      message: dryRun ? `대상 ${updated.length}건 (dry-run, 변경 안 함)` : `${updated.length}건 보정 완료 (90일/0.5%)`,
      items: updated
    })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

// 관리자: 리셋된 스테이킹에 잘못 지급된 배당/매칭수당 환수 처리
//  - reset_at IS NOT NULL인 스테이킹의 daily_rewards를 모두 찾아서 환수
//  - 사용자 QKEY 잔액 차감 + 매칭수당 받은 추천인 잔액도 차감
//  - daily_rewards / 관련 transactions 행은 삭제하여 다음 cron에서 중복 미발생
app.post('/api/admin/clawback-reset-rewards', async (c) => {
  try {
    const db = c.env.DB
    const body = await c.req.json().catch(() => ({}))
    const targetUserId = body.userId  // 선택적: 특정 사용자만 처리. 없으면 전체

    // 리셋된 스테이킹 + 그에 연결된 daily_rewards 조회
    let query = `
      SELECT dr.id as reward_id, dr.user_id, dr.staking_id, dr.usdt_amount as qkey_amount, dr.reward_date,
             s.amount as staking_amount, s.reset_at,
             u.referrer_id
      FROM daily_rewards dr
      JOIN staking s ON dr.staking_id = s.id
      JOIN users u ON dr.user_id = u.id
      WHERE s.reset_at IS NOT NULL
    `
    const params: any[] = []
    if (targetUserId) {
      query += ` AND dr.user_id = ?`
      params.push(targetUserId)
    }
    const wrongRewards = await db.prepare(query).bind(...params).all()

    const summary = {
      reward_rows: wrongRewards.results.length,
      total_qkey_clawback: 0,
      affected_users: new Set<number>(),
      level1_clawback: 0,
      level2_clawback: 0,
      affected_referrers: new Set<number>(),
    }

    for (const r of wrongRewards.results as any[]) {
      const qkey = r.qkey_amount || 0
      // 1. 사용자 QKEY 잔액에서 환수 (음수 방지: GREATEST 효과를 위해 0 이하로 안 내려감)
      await db.prepare(`UPDATE users SET qkey_balance = MAX(0, qkey_balance - ?) WHERE id = ?`).bind(qkey, r.user_id).run()
      summary.total_qkey_clawback += qkey
      summary.affected_users.add(r.user_id)

      // 2. 매칭수당 환수 — 1대 추천인(20%)
      if (r.referrer_id) {
        const lv1 = Math.round(qkey * 0.2)
        await db.prepare(`UPDATE users SET qkey_balance = MAX(0, qkey_balance - ?) WHERE id = ?`).bind(lv1, r.referrer_id).run()
        summary.level1_clawback += lv1
        summary.affected_referrers.add(r.referrer_id)

        // 1대 추천인의 추천인 = 2대 (10%)
        const lv1User = await db.prepare(`SELECT referrer_id FROM users WHERE id = ?`).bind(r.referrer_id).first() as any
        if (lv1User?.referrer_id) {
          const lv2 = Math.round(qkey * 0.1)
          await db.prepare(`UPDATE users SET qkey_balance = MAX(0, qkey_balance - ?) WHERE id = ?`).bind(lv2, lv1User.referrer_id).run()
          summary.level2_clawback += lv2
          summary.affected_referrers.add(lv1User.referrer_id)
        }
      }

      // 3. 잘못된 daily_rewards 행 삭제 (다음 cron에서 다시 지급되도록 하려면 유지하지만,
      //    리셋된 스테이킹은 이제 reset_at 필터로 cron에서 제외되므로 삭제해도 안전)
      await db.prepare(`DELETE FROM daily_rewards WHERE id = ?`).bind(r.reward_id).run()
    }

    // 4. 관련 transactions(daily_qkey, referral_reward 중 오늘 reset 스테이킹 관련)도 정리
    //    - 단순 식별이 어려우므로 보수적으로 그대로 두고, 사용자/추천인 잔액만 환수 (감사 추적 가능)

    return c.json({
      success: true,
      message: '리셋된 스테이킹에 잘못 지급된 배당/매칭수당 환수 완료',
      summary: {
        reward_rows_removed: summary.reward_rows,
        total_qkey_clawback_from_users: summary.total_qkey_clawback,
        affected_user_count: summary.affected_users.size,
        level1_referral_clawback: summary.level1_clawback,
        level2_referral_clawback: summary.level2_clawback,
        affected_referrer_count: summary.affected_referrers.size,
      }
    })
  } catch (e: any) {
    console.error('clawback error:', e)
    return c.json({ error: e.message || 'clawback failed' }, 500)
  }
})

app.post('/api/admin/user/:userId/reset-balance', async (c) => {
  try {
    const db = c.env.DB
    const userId = c.req.param('userId')
    const { coinType } = await c.req.json()

    const validCoins = ['QTA', 'QX', 'QKEY']
    if (!validCoins.includes(coinType)) {
      return c.json({ error: 'Invalid coin type' }, 400)
    }

    // 현재 잔액 조회
    const columnMap: Record<string, string> = { QTA: 'qta_balance', QX: 'qx_balance', QKEY: 'qkey_balance' }
    const column = columnMap[coinType]

    const user = await db.prepare(`SELECT id, email, ${column} FROM users WHERE id = ?`).bind(userId).first()
    if (!user) {
      return c.json({ error: t(c, 'withdrawal.user_not_found') }, 404)
    }

    const prevBalance = (user as any)[column] || 0

    // 잔액을 0으로 리셋
    await db.prepare(`UPDATE users SET ${column} = 0 WHERE id = ?`).bind(userId).run()

    // === 해당 사용자의 해당 코인 관련 모든 기록 완전 삭제 ===
    const deleted: Record<string, number> = {}

    // 1. 해당 코인 거래내역 삭제 (swap_in, swap_out, daily_qkey, referral_reward, shop_purchase, staking_reward, admin_reset 등)
    try {
      const r = await db.prepare(`DELETE FROM transactions WHERE user_id = ? AND coin_type = ?`).bind(userId, coinType).run()
      deleted.transactions = r.meta?.changes || 0
    } catch (e) { deleted.transactions = 0 }

    // 2. 해당 코인 출금내역 삭제
    try {
      const r = await db.prepare(`DELETE FROM withdrawals WHERE user_id = ? AND coin_type = ?`).bind(userId, coinType).run()
      deleted.withdrawals = r.meta?.changes || 0
    } catch (e) { deleted.withdrawals = 0 }

    // 3. QKEY 리셋 → 추천보상만 삭제 (데일리배당/스테이킹/주문내역은 유지)
    if (coinType === 'QKEY') {
      // ★ daily_rewards는 유지 - 배당 기록이 남아야 다음 배당이 정상 동작
      // ★ orders는 유지 - 주문 이력은 보존
      try { const r = await db.prepare(`DELETE FROM referral_rewards WHERE referrer_id = ?`).bind(userId).run(); deleted.referralRewards = r.meta?.changes || 0 } catch (e) { deleted.referralRewards = 0 }
    }

    // 4. QTA 리셋 → 스테이킹 보상으로 받은 QTA이므로, 관련 스왑 거래(swap_in QTA)는 이미 위에서 삭제됨

    return c.json({
      success: true,
      message: `${coinType} 잔액 리셋 및 관련 기록 삭제 완료`,
      coinType,
      previousBalance: prevBalance,
      deletedRecords: deleted
    })
  } catch (error) {
    console.error('잔액 리셋 오류:', error)
    return c.json({ error: 'Balance reset failed' }, 500)
  }
})

// 관리자: 잔액 복구 API (긴급용)
app.post('/api/admin/user/:userId/restore-balance', async (c) => {
  try {
    const db = c.env.DB
    const userId = c.req.param('userId')

    // 사용자 존재 확인
    const exists = await db.prepare(`SELECT id FROM users WHERE id = ?`).bind(userId).first()
    if (!exists) {
      return c.json({ error: '사용자를 찾을 수 없습니다' }, 404)
    }

    const { qta, qx, qkey, usdt } = await c.req.json().catch(() => ({}))
    await db.prepare(`UPDATE users SET qta_balance = COALESCE(qta_balance,0) + ?, qx_balance = COALESCE(qx_balance,0) + ?, qkey_balance = COALESCE(qkey_balance,0) + ?, usdt_balance = COALESCE(usdt_balance,0) + ? WHERE id = ?`).bind(qta||0, qx||0, qkey||0, usdt||0, userId).run()
    const user = await db.prepare(`SELECT id,name,qta_balance,qx_balance,qkey_balance,usdt_balance FROM users WHERE id = ?`).bind(userId).first()
    return c.json({ success: true, user })
  } catch(e: any) { return c.json({ error: e.message }, 500) }
})

// 관리자: 전체 코인 리셋 (QTA + QX + QKEY 잔액 0 + 모든 관련 기록 삭제)
app.post('/api/admin/user/:userId/reset-all', async (c) => {
  try {
    const db = c.env.DB
    const userId = c.req.param('userId')

    const user = await db.prepare(`SELECT id, email, qta_balance, qx_balance, qkey_balance, usdt_balance FROM users WHERE id = ?`).bind(userId).first() as any
    if (!user) {
      return c.json({ error: '사용자를 찾을 수 없습니다' }, 404)
    }

    const prevBalances = {
      QTA: user.qta_balance || 0,
      QX: user.qx_balance || 0,
      QKEY: user.qkey_balance || 0,
      USDT: user.usdt_balance || 0
    }

    // 코인3종(QTA/QX/QKEY) 0으로 리셋 (USDT는 유지)
    await db.prepare(`UPDATE users SET qta_balance = 0, qx_balance = 0, qkey_balance = 0 WHERE id = ?`).bind(userId).run()

    const deleted: Record<string, number> = {}

    // 코인3종 관련 거래내역만 삭제 (daily_qkey, referral_reward, swap, staking 관련)
    try {
      const r = await db.prepare(`DELETE FROM transactions WHERE user_id = ? AND coin_type IN ('QTA','QX','QKEY')`).bind(userId).run()
      deleted.transactions = r.meta?.changes || 0
    } catch (e) { deleted.transactions = 0 }

    // 추천수당 삭제 (이 사용자가 받은 추천수당)
    try {
      const r = await db.prepare(`DELETE FROM referral_rewards WHERE referrer_id = ?`).bind(userId).run()
      deleted.referralRewards = r.meta?.changes || 0
    } catch (e) { deleted.referralRewards = 0 }

    // ★ 스테이킹: 그대로 유지 — 사용자 화면에서도 정상 노출됨
    //   - 사용자 「내 스테이킹 목록」: 그대로 표시 (진입금액/데일리배당 진행 상황 모두 보임)
    //   - 진입금액(주황색 박스 "퀀타리움구매") = active 스테이킹 amount 합계 그대로 유지
    //   - 데일리 배당: 계속 지급되어 QKEY 잔액으로 누적됨
    //   - 추천인 매칭수당: 추천인에게 계속 지급
    //   - 어드민 매출 통계: reset_at 마킹으로 「리셋된 매출」을 별도 식별 가능
    let markedStakings = 0
    try {
      const r = await db.prepare(`
        UPDATE staking SET reset_at = CURRENT_TIMESTAMP
        WHERE user_id = ? AND reset_at IS NULL
      `).bind(userId).run()
      markedStakings = r.meta?.changes || 0
    } catch (e) { markedStakings = 0 }
    deleted.markedStakings = markedStakings

    // ★ 데일리배당(daily_rewards)은 유지 - 삭제하지 않음
    // ★ 스테이킹 row 자체는 유지 - 데일리배당이 계속 쌓여야 하므로
    // ★ 출금내역/주문내역은 유지

    return c.json({
      success: true,
      message: '코인 3종(QTA/QX/QKEY) 잔액 리셋 완료 (스테이킹/진입금액/배당/매칭수당은 계속 유지)',
      previousBalances: prevBalances,
      deletedRecords: deleted
    })
  } catch (error: any) {
    console.error('전체 리셋 오류:', error)
    return c.json({ error: 'Full reset failed' }, 500)
  }
})

// 관리자: 회원가입 현황 조회
app.get('/api/admin/signups', async (c) => {
  try {
    const db = c.env.DB
    
    // 오늘 가입자
    const todayUsers = await db.prepare(`
      SELECT COUNT(*) as count
      FROM users
      WHERE date(created_at, '+9 hours') = date('now', '+9 hours')
    `).first()

    // 이번 주 가입자 (최근 7일, KST 기준)
    const weekUsers = await db.prepare(`
      SELECT COUNT(*) as count
      FROM users
      WHERE date(created_at, '+9 hours') >= date('now', '+9 hours', '-7 days')
    `).first()

    // 이번 달 가입자 (최근 30일, KST 기준)
    const monthUsers = await db.prepare(`
      SELECT COUNT(*) as count
      FROM users
      WHERE date(created_at, '+9 hours') >= date('now', '+9 hours', '-30 days')
    `).first()

    // 최근 가입자 목록 (최근 50명)
    const recentUsers = await db.prepare(`
      SELECT id, name, email, phone, wallet_address, usdt_wallet_address, created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT 50
    `).all()

    return c.json({ 
      success: true,
      today: todayUsers?.count || 0,
      week: weekUsers?.count || 0,
      month: monthUsers?.count || 0,
      users: recentUsers.results 
    })
  } catch (error) {
    return c.json({ error: t(c, 'admin.signups_error') }, 500)
  }
})

// ============================================
// API Routes - Admin Sales & Export
// ============================================

// 전체 매출 현황 (아이디/이름/판매금액/판매일)
app.get('/api/admin/sales', async (c) => {
  try {
    const db = c.env.DB
    // 어드민용 매출 목록: 리셋된 항목도 함께 반환하되 reset_at 컬럼으로 식별 가능하게 함
    const sales = await db.prepare(`
      SELECT 
        s.id as staking_id,
        u.id as user_id,
        u.email,
        u.name,
        u.country,
        u.language,
        s.amount,
        s.status,
        s.created_at as sale_date,
        s.start_date,
        s.end_date,
        s.period_days,
        s.daily_rate,
        s.reset_at
      FROM staking s
      JOIN users u ON s.user_id = u.id
      WHERE s.status IN ('active', 'completed')
      ORDER BY s.created_at DESC
    `).all()

    // 총 매출 집계 (전체)
    const totalSales = await db.prepare(`
      SELECT 
        COALESCE(SUM(amount), 0) as total_amount,
        COUNT(*) as total_count
      FROM staking WHERE status IN ('active', 'completed')
    `).first()

    const todaySales = await db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as amount, COUNT(*) as count
      FROM staking WHERE status IN ('active', 'completed') AND DATE(start_date) = DATE('now')
    `).first()

    const weekSales = await db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as amount, COUNT(*) as count
      FROM staking WHERE status IN ('active', 'completed') AND start_date >= DATE('now', '-7 days')
    `).first()

    const monthSales = await db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as amount, COUNT(*) as count
      FROM staking WHERE status IN ('active', 'completed') AND start_date >= DATE('now', '-30 days')
    `).first()

    // 리셋된(=어드민 강제 리셋 처리된) 매출 별도 집계
    const resetSales = await db.prepare(`
      SELECT 
        COALESCE(SUM(amount), 0) as amount,
        COUNT(*) as count
      FROM staking
      WHERE status IN ('active', 'completed') AND reset_at IS NOT NULL
    `).first()

    // 정상(=리셋되지 않은) 매출 별도 집계
    const activeSales = await db.prepare(`
      SELECT 
        COALESCE(SUM(amount), 0) as amount,
        COUNT(*) as count
      FROM staking
      WHERE status IN ('active', 'completed') AND reset_at IS NULL
    `).first()

    return c.json({
      success: true,
      stats: {
        totalAmount: totalSales?.total_amount || 0,
        totalCount: totalSales?.total_count || 0,
        todayAmount: todaySales?.amount || 0,
        todayCount: todaySales?.count || 0,
        weekAmount: weekSales?.amount || 0,
        weekCount: weekSales?.count || 0,
        monthAmount: monthSales?.amount || 0,
        monthCount: monthSales?.count || 0,
        // 리셋 분리 통계
        activeAmount: activeSales?.amount || 0,
        activeCount: activeSales?.count || 0,
        resetAmount: resetSales?.amount || 0,
        resetCount: resetSales?.count || 0
      },
      sales: sales.results
    })
  } catch (error) {
    return c.json({ error: t(c, 'admin.sales_error') }, 500)
  }
})

// 회원 산하 매출 조회 (1대/2대/전체)
app.get('/api/admin/downline-sales/:userId', async (c) => {
  try {
    const userId = c.req.param('userId')
    const db = c.env.DB

    // 해당 회원 정보
    const user = await db.prepare('SELECT id, name, email, referral_code FROM users WHERE id = ?').bind(userId).first()
    if (!user) return c.json({ error: t(c, 'admin.member_not_found') }, 404)

    // 1대 (직접 추천) 산하
    const level1Users = await db.prepare(`
      SELECT u.id, u.name, u.email, u.country, u.language, u.created_at,
        COALESCE(SUM(CASE WHEN s.status IN ('active','completed') THEN s.amount ELSE 0 END), 0) as staking_amount
      FROM users u
      LEFT JOIN staking s ON u.id = s.user_id
      WHERE u.referrer_id = ?
      GROUP BY u.id, u.name, u.email, u.country, u.language, u.created_at
      ORDER BY staking_amount DESC
    `).bind(userId).all()

    // 1대 산하 ID 목록
    const level1Ids = (level1Users.results || []).map((u: any) => u.id)

    // 2대 (간접 추천) 산하
    let level2Users = { results: [] as any[] }
    if (level1Ids.length > 0) {
      const placeholders = level1Ids.map(() => '?').join(',')
      level2Users = await db.prepare(`
        SELECT u.id, u.name, u.email, u.country, u.language, u.created_at,
          COALESCE(SUM(CASE WHEN s.status IN ('active','completed') THEN s.amount ELSE 0 END), 0) as staking_amount,
          r.name as referrer_name
        FROM users u
        LEFT JOIN staking s ON u.id = s.user_id
        LEFT JOIN users r ON u.referrer_id = r.id
        WHERE u.referrer_id IN (${placeholders})
        GROUP BY u.id, u.name, u.email, u.country, u.language, u.created_at, r.name
        ORDER BY staking_amount DESC
      `).bind(...level1Ids).all()
    }

    // 집계
    const level1Total = (level1Users.results || []).reduce((sum: number, u: any) => sum + (u.staking_amount || 0), 0)
    const level2Total = (level2Users.results || []).reduce((sum: number, u: any) => sum + (u.staking_amount || 0), 0)

    return c.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, referral_code: user.referral_code },
      level1: {
        count: level1Users.results?.length || 0,
        totalAmount: level1Total,
        users: level1Users.results
      },
      level2: {
        count: level2Users.results?.length || 0,
        totalAmount: level2Total,
        users: level2Users.results
      },
      grandTotal: level1Total + level2Total
    })
  } catch (error) {
    return c.json({ error: t(c, 'admin.downline_error') }, 500)
  }
})

// 회원 검색 API (이메일/이름으로 검색)
app.get('/api/admin/search-user', async (c) => {
  try {
    const query = c.req.query('q') || ''
    if (!query || query.length < 1) {
      return c.json({ error: t(c, 'admin.search_required') }, 400)
    }
    const db = c.env.DB
    const searchTerm = '%' + query + '%'
    const users = await db.prepare(`
      SELECT u.id, u.name, u.email, u.country, u.language, u.referral_code, u.created_at,
        COALESCE(SUM(CASE WHEN s.status IN ('active','completed') THEN s.amount ELSE 0 END), 0) as staking_amount
      FROM users u
      LEFT JOIN staking s ON u.id = s.user_id
      WHERE u.email LIKE ? OR u.name LIKE ? OR u.referral_code LIKE ?
      GROUP BY u.id, u.name, u.email, u.country, u.language, u.referral_code, u.created_at
      ORDER BY staking_amount DESC
      LIMIT 20
    `).bind(searchTerm, searchTerm, searchTerm).all()

    return c.json({ success: true, users: users.results })
  } catch (error) {
    return c.json({ error: t(c, 'admin.search_error') }, 500)
  }
})

// 회원 전체 수당 체크 (모든 회원의 보상 현황)
app.get('/api/admin/member-rewards', async (c) => {
  try {
    const db = c.env.DB

    // 회원별 전체 수당 집계
    const memberRewards = await db.prepare(`
      SELECT 
        u.id, u.name, u.email, u.country, u.language,
        u.qta_balance, u.qx_balance, u.qkey_balance, u.usdt_balance,
        COALESCE(SUM(CASE WHEN s.status IN ('active','completed') THEN s.amount ELSE 0 END), 0) as staking_amount,
        COALESCE(dr.daily_total, 0) as daily_reward_total,
        COALESCE(rr.referral_total, 0) as referral_reward_total,
        COALESCE(dr.daily_total, 0) + COALESCE(rr.referral_total, 0) as total_reward
      FROM users u
      LEFT JOIN staking s ON u.id = s.user_id
      LEFT JOIN (
        SELECT user_id, SUM(usdt_amount) as daily_total FROM daily_rewards GROUP BY user_id
      ) dr ON u.id = dr.user_id
      LEFT JOIN (
        SELECT referrer_id, SUM(reward_amount) as referral_total FROM referral_rewards GROUP BY referrer_id
      ) rr ON u.id = rr.referrer_id
      GROUP BY u.id, u.name, u.email, u.country, u.language,
               u.qta_balance, u.qx_balance, u.qkey_balance, u.usdt_balance,
               dr.daily_total, rr.referral_total
      ORDER BY total_reward DESC
    `).all()

    // 전체 합계
    const totals = await db.prepare(`
      SELECT 
        COALESCE(SUM(usdt_amount), 0) as total_daily_qkey
      FROM daily_rewards
    `).first()

    const referralTotals = await db.prepare(`
      SELECT COALESCE(SUM(reward_amount), 0) as total_referral_qkey
      FROM referral_rewards
    `).first()

    return c.json({
      success: true,
      members: memberRewards.results,
      totals: {
        totalDailyQkey: totals?.total_daily_qkey || 0,
        totalReferralQkey: referralTotals?.total_referral_qkey || 0,
        totalCombined: (totals?.total_daily_qkey || 0) + (referralTotals?.total_referral_qkey || 0)
      }
    })
  } catch (error) {
    return c.json({ error: t(c, 'admin.member_rewards_error') }, 500)
  }
})

// 엑셀 다운로드 API - CSV 형식 (출금내역)
app.get('/api/admin/export/withdrawals', async (c) => {
  try {
    const db = c.env.DB
    const withdrawals = await db.prepare(`
      SELECT w.id, u.email, u.name, w.coin_type, w.amount, w.wallet_address, w.status, w.created_at, w.processed_at
      FROM withdrawals w
      JOIN users u ON w.user_id = u.id
      ORDER BY w.created_at DESC
    `).all()

    let csv = '\uFEFF' + [t(c,'csv.id'),t(c,'csv.email'),t(c,'csv.name'),t(c,'csv.coin_type'),t(c,'csv.amount'),t(c,'csv.wallet_address'),t(c,'csv.status'),t(c,'csv.request_date'),t(c,'csv.process_date')].join(',') + '\n'
    for (const w of (withdrawals.results || []) as any[]) {
      const status = w.status === 'pending' ? t(c,'csv.pending') : w.status === 'approved' ? t(c,'csv.approved') : t(c,'csv.rejected')
      csv += `${w.id},"${w.email}","${w.name}",${w.coin_type},${w.amount},"${w.wallet_address}",${status},"${w.created_at}","${w.processed_at || ''}"\n`
    }

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="withdrawals_export.csv"'
      }
    })
  } catch (error) {
    return c.json({ error: t(c, 'admin.export_wd_error') }, 500)
  }
})

// 관리자 - 스왑 내역 조회
app.get('/api/admin/swaps', async (c) => {
  try {
    const db = c.env.DB
    const swaps = await db.prepare(`
      SELECT t.id, t.user_id, u.email, u.name, t.type, t.coin_type, t.amount, t.description, t.created_at
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      WHERE t.type IN ('swap_in', 'swap_out')
      ORDER BY t.created_at DESC
      LIMIT 500
    `).all()

    // 스왑 통계
    const stats = await db.prepare(`
      SELECT 
        COUNT(*) as total_count,
        COUNT(DISTINCT user_id) as unique_users,
        SUM(CASE WHEN type = 'swap_out' AND coin_type = 'QKEY' THEN amount ELSE 0 END) as total_qkey_used,
        SUM(CASE WHEN type = 'swap_out' AND coin_type = 'USDT' THEN amount ELSE 0 END) as total_usdt_used,
        SUM(CASE WHEN type = 'swap_in' AND coin_type = 'QTA' THEN amount ELSE 0 END) as total_qta_received,
        SUM(CASE WHEN type = 'swap_in' AND coin_type = 'QX' THEN amount ELSE 0 END) as total_qx_received,
        SUM(CASE WHEN type = 'swap_in' AND coin_type = 'USDT' THEN amount ELSE 0 END) as total_usdt_received,
        SUM(CASE WHEN type = 'swap_in' AND coin_type = 'QKEY' THEN amount ELSE 0 END) as total_qkey_received
      FROM transactions
      WHERE type IN ('swap_in', 'swap_out')
    `).first()

    return c.json({ success: true, swaps: swaps.results, stats })
  } catch (error) {
    return c.json({ error: 'Failed to load swap history' }, 500)
  }
})

// 엑셀 다운로드 API - CSV 형식 (전체 매출)
app.get('/api/admin/export/sales', async (c) => {
  try {
    const db = c.env.DB
    const sales = await db.prepare(`
      SELECT s.id, u.email, u.name, u.country, u.language, s.amount, s.status, s.period_days, s.daily_rate, s.start_date, s.end_date, s.created_at
      FROM staking s
      JOIN users u ON s.user_id = u.id
      ORDER BY s.created_at DESC
    `).all()

    let csv = '\uFEFF' + [t(c,'csv.id'),t(c,'csv.email'),t(c,'csv.name'),t(c,'csv.country'),t(c,'csv.language'),t(c,'csv.sale_amount'),t(c,'csv.status'),t(c,'csv.period_days'),t(c,'csv.daily_rate'),t(c,'csv.start_date'),t(c,'csv.end_date'),t(c,'csv.request_date')].join(',') + '\n'
    for (const s of (sales.results || []) as any[]) {
      const status = s.status === 'active' ? t(c,'csv.active') : s.status === 'pending' ? t(c,'csv.pending') : s.status === 'rejected' ? t(c,'csv.rejected') : t(c,'csv.completed')
      csv += `${s.id},"${s.email}","${s.name}","${s.country || ''}","${s.language || ''}",${s.amount},${status},${s.period_days || ''},${s.daily_rate ? (s.daily_rate * 100).toFixed(1) + '%' : ''},"${s.start_date || ''}","${s.end_date || ''}","${s.created_at}"\n`
    }

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="sales_export.csv"'
      }
    })
  } catch (error) {
    return c.json({ error: t(c, 'admin.export_sales_error') }, 500)
  }
})

// 엑셀 다운로드 API - CSV 형식 (전체 회원)
// 엑셀 다운로드 API - CSV 형식 (회원 명단 + 지갑주소만, 단순 백업용)
//   - id, 이름, 이메일(아이디), 전화번호, QKEY 지갑주소, USDT 지갑주소, 가입일자만 포함
//   - 잔액/스테이킹/추천코드 등은 포함하지 않음 (지갑 백업/일반 명단 용도)
app.get('/api/admin/export/wallets', async (c) => {
  try {
    const db = c.env.DB
    const users = await db.prepare(`
      SELECT id, name, email, phone, wallet_address, usdt_wallet_address, created_at
      FROM users
      ORDER BY id ASC
    `).all()

    // CSV 안전 처리 (쉼표/따옴표/줄바꿈 포함 시)
    const csvEsc = (v: any): string => {
      if (v === null || v === undefined) return ''
      const s = String(v).replace(/"/g, '""')
      return `"${s}"`
    }

    let csv = '\uFEFF' + ['ID','이름','아이디(이메일)','전화번호','QKEY 지갑주소','USDT 지갑주소','가입일자'].join(',') + '\n'
    for (const u of (users.results || []) as any[]) {
      csv += [
        u.id,
        csvEsc(u.name),
        csvEsc(u.email),
        csvEsc(u.phone || ''),
        csvEsc(u.wallet_address || ''),
        csvEsc(u.usdt_wallet_address || ''),
        csvEsc(u.created_at || '')
      ].join(',') + '\n'
    }

    // 파일명에 날짜 포함 (KST 기준)
    const today = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0,10)
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="members_wallets_${today}.csv"`
      }
    })
  } catch (error) {
    return c.json({ error: '회원 지갑주소 내보내기 실패' }, 500)
  }
})

app.get('/api/admin/export/users', async (c) => {
  try {
    const db = c.env.DB
    const users = await db.prepare(`
      SELECT u.id, u.email, u.name, u.phone, u.country, u.language, u.wallet_address, u.usdt_wallet_address,
        u.qta_balance, u.qx_balance, u.qkey_balance, u.usdt_balance, u.referral_code, u.created_at,
        COALESCE(SUM(CASE WHEN s.status IN ('active','completed') THEN s.amount ELSE 0 END), 0) as staking_amount
      FROM users u
      LEFT JOIN staking s ON u.id = s.user_id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `).all()

    let csv = '\uFEFF' + [t(c,'csv.id'),t(c,'csv.email'),t(c,'csv.name'),t(c,'csv.phone'),t(c,'csv.country'),t(c,'csv.language'),t(c,'csv.qkey_wallet'),t(c,'csv.usdt_wallet'),t(c,'csv.qta_balance'),t(c,'csv.qx_balance'),t(c,'csv.qkey_balance'),t(c,'csv.usdt_balance'),t(c,'csv.referral_code'),t(c,'csv.staking_amount'),t(c,'csv.join_date')].join(',') + '\n'
    for (const u of (users.results || []) as any[]) {
      csv += `${u.id},"${u.email}","${u.name}","${u.phone || ''}","${u.country || ''}","${u.language || ''}","${u.wallet_address}","${u.usdt_wallet_address || ''}",${u.qta_balance},${u.qx_balance},${u.qkey_balance},${u.usdt_balance},"${u.referral_code || ''}",${u.staking_amount},"${u.created_at}"\n`
    }

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="users_export.csv"'
      }
    })
  } catch (error) {
    return c.json({ error: t(c, 'admin.export_users_error') }, 500)
  }
})

// 엑셀 다운로드 API - CSV 형식 (회원 수당)
app.get('/api/admin/export/rewards', async (c) => {
  try {
    const db = c.env.DB
    const rewards = await db.prepare(`
      SELECT 
        u.id, u.email, u.name, u.country,
        u.qta_balance, u.qx_balance, u.qkey_balance, u.usdt_balance,
        COALESCE(SUM(CASE WHEN s.status IN ('active','completed') THEN s.amount ELSE 0 END), 0) as staking_amount,
        COALESCE(dr.daily_total, 0) as daily_reward_total,
        COALESCE(rr.referral_total, 0) as referral_reward_total
      FROM users u
      LEFT JOIN staking s ON u.id = s.user_id
      LEFT JOIN (SELECT user_id, SUM(usdt_amount) as daily_total FROM daily_rewards GROUP BY user_id) dr ON u.id = dr.user_id
      LEFT JOIN (SELECT referrer_id, SUM(reward_amount) as referral_total FROM referral_rewards GROUP BY referrer_id) rr ON u.id = rr.referrer_id
      GROUP BY u.id
      ORDER BY daily_reward_total DESC
    `).all()

    let csv = '\uFEFF' + [t(c,'csv.id'),t(c,'csv.email'),t(c,'csv.name'),t(c,'csv.country'),t(c,'csv.staking_amount'),t(c,'csv.daily_total'),t(c,'csv.referral_total'),t(c,'csv.total_reward'),t(c,'csv.qta_balance'),t(c,'csv.qx_balance'),t(c,'csv.qkey_balance'),t(c,'csv.usdt_balance')].join(',') + '\n'
    for (const r of (rewards.results || []) as any[]) {
      csv += `${r.id},"${r.email}","${r.name}","${r.country || ''}",${r.staking_amount},${Math.round(r.daily_reward_total)},${Math.round(r.referral_reward_total)},${Math.round(r.daily_reward_total + r.referral_reward_total)},${r.qta_balance},${r.qx_balance},${r.qkey_balance},${r.usdt_balance}\n`
    }

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="member_rewards_export.csv"'
      }
    })
  } catch (error) {
    return c.json({ error: t(c, 'admin.export_rewards_error') }, 500)
  }
})

// ============================================
// API Routes - Daily Rewards
// ============================================

// 한국 공휴일/국경일 목록 (2026년)
// 매년 업데이트 필요
function getKoreanHolidays(year: number): string[] {
  const holidays: Record<number, string[]> = {
    2025: [
      '2025-01-01','2025-01-28','2025-01-29','2025-01-30',
      '2025-03-01','2025-05-01','2025-05-05','2025-05-06','2025-06-06',
      '2025-08-15','2025-10-03','2025-10-05','2025-10-06','2025-10-07',
      '2025-10-09','2025-12-25'
    ],
    2026: [
      '2026-01-01',                        // 신정
      '2026-02-16','2026-02-17','2026-02-18', // 설날
      '2026-03-01',                        // 삼일절
      '2026-05-01',                        // 근로자의 날
      '2026-05-05',                        // 어린이날
      '2026-05-24',                        // 부처님오신날
      '2026-06-06',                        // 현충일
      '2026-08-15',                        // 광복절
      '2026-09-24','2026-09-25','2026-09-26', // 추석
      '2026-10-03',                        // 개천절
      '2026-10-09',                        // 한글날
      '2026-12-25'                         // 성탄절
    ],
    2027: [
      '2027-01-01',
      '2027-02-05','2027-02-06','2027-02-07',
      '2027-03-01','2027-05-01','2027-05-05','2027-05-13','2027-06-06',
      '2027-08-15','2027-10-03','2027-10-09',
      '2027-10-14','2027-10-15','2027-10-16',
      '2027-12-25'
    ]
  }
  return holidays[year] || holidays[2026]
}

function isKoreanBusinessDay(date: Date): { isBusinessDay: boolean, reason: string } {
  // KST 기준으로 변환
  const kst = new Date(date.getTime() + (9 * 60 * 60 * 1000))
  const day = kst.getUTCDay() // 0=일, 6=토
  const dateStr = kst.toISOString().split('T')[0]
  const year = kst.getUTCFullYear()

  // 토/일 체크
  if (day === 0) return { isBusinessDay: false, reason: 'sunday' }
  if (day === 6) return { isBusinessDay: false, reason: 'saturday' }

  // 공휴일 체크
  const holidays = getKoreanHolidays(year)
  if (holidays.includes(dateStr)) return { isBusinessDay: false, reason: 'holiday' }

  return { isBusinessDay: true, reason: 'business_day' }
}

// KST 기준 날짜 -> YYYY-MM-DD
function kstDateStr(d: Date): string {
  const kst = new Date(d.getTime() + (9 * 60 * 60 * 1000))
  return kst.toISOString().split('T')[0]
}

// 직전 영업일(KST) 계산 — 토/일/공휴일을 건너뛰며 어제, 그제 ... 로 거슬러 올라감
// 발생일/지급일 분리 정책: 영업일에 발생한 배당은 다음 영업일에 지급
// 예) 금요일 발생분 → 월요일 지급, 4/30 발생분 → 5/1~3 휴일 → 5/4(월) 지급
function getPrevBusinessDayKst(today: Date): { dateStr: string, daysBack: number } {
  // 최대 14일까지 거꾸로 탐색 (연휴 대비)
  for (let i = 1; i <= 14; i++) {
    const candidate = new Date(today.getTime() - i * 24 * 60 * 60 * 1000)
    const { isBusinessDay } = isKoreanBusinessDay(candidate)
    if (isBusinessDay) {
      return { dateStr: kstDateStr(candidate), daysBack: i }
    }
  }
  // 안전 fallback (일반적으로 도달 불가)
  return { dateStr: kstDateStr(new Date(today.getTime() - 24 * 60 * 60 * 1000)), daysBack: 1 }
}

// ★★ B 보강 (2026-05-06 확정) ★★
// 사장님 룰 (재확정):
//  1) 휴일/공휴일 매출도 직판수당은 즉시 지급 (이미 staking-approve 에서 처리)
//  2) 휴일/공휴일 staking 의 일일배당(본인+위/아래 매칭)은 "그 다음 첫 평일" 에 무조건 발생
//  3) 휴일/공휴일에 위·아래 매출이 전혀 없으면 일일배당 자체 0원 (기존 룰)
//
// "한 staking 에 대해 cron 이 채워야 할 reward_date 목록" 을 반환:
//  - lastRewardDate: 그 staking 의 daily_rewards 테이블 내 마지막 reward_date (없으면 NULL)
//  - startDateKst   : staking.start_date 의 KST 날짜 (YYYY-MM-DD)
//  - todayKst       : 오늘 KST 날짜 (cron 실행일, 평일임이 보장됨)
// 룰:
//  A. lastRewardDate 가 있으면 → "lastRewardDate 다음 영업일 ~ todayKst" 사이의 모든 영업일
//     (todayKst 포함; 오늘이 평일이므로 오늘분도 포함)
//  B. lastRewardDate 가 없으면 (첫 지급) → "startDateKst ~ todayKst" 사이 영업일 중
//     startDateKst 가 평일이면 그 평일 포함, 휴일이면 그 다음 첫 평일부터 todayKst 까지
//     → 단순히 "max(startDateKst, todayKst 까지) 영업일 전부"
//  안전 제한: 최대 30일 (연휴+버퍼)
function getStakingAccrualDatesKst(
  lastRewardDate: string | null,
  startDateKst: string,
  todayKst: string,
  firstBusinessDayKst?: string
): string[] {
  // 시작점: lastRewardDate 가 있으면 그 다음날, 없으면 startDateKst 부터
  let cursorStr: string
  if (lastRewardDate && /^\d{4}-\d{2}-\d{2}$/.test(lastRewardDate)) {
    const d = new Date(lastRewardDate + 'T00:00:00Z')
    cursorStr = new Date(d.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  } else {
    cursorStr = startDateKst
  }
  // 끝점: todayKst (포함) — 일반 백필 endDate (= yesterdayKst 가 전달됨)
  const endDate = new Date(todayKst + 'T00:00:00Z')
  let cursor = new Date(cursorStr + 'T00:00:00Z')
  const result: string[] = []
  let safety = 0
  while (cursor.getTime() <= endDate.getTime() && safety < 30) {
    const dateStr = cursor.toISOString().split('T')[0]
    // KST 영업일 판정: cursor 는 KST 00:00 의 UTC 표현 → 실제 UTC 시각은 -9h
    const checkDate = new Date(cursor.getTime() - 9 * 60 * 60 * 1000)
    const { isBusinessDay } = isKoreanBusinessDay(checkDate)
    if (isBusinessDay) result.push(dateStr)
    cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000)
    safety++
  }
  // ★ 사장님 정책 (2026-05-08 영구) — 휴일 진입자 첫 평일 데일리 1회 강제 지급 (B 방안) ★
  //   사장님 원문: "공휴일 진입자는 언제 진입하든 첫 평일에 딱 1회 지급"
  //   조건: lastRewardDate 가 NULL (첫 지급)
  //         AND startDateKst 가 휴일(토/일/공휴일)
  //         AND 정상 백필 결과가 0건 (yesterdayKst 까지 영업일이 없음)
  //         AND firstBusinessDayKst 가 전달됨 (cron 실행일 = 오늘 첫 평일)
  //   → firstBusinessDayKst 를 첫 reward_date 로 강제 push
  //   예: 5/11(월) cron 시
  //     - 5/9(토) 진입자: 결과 0건 → push [5/11] 1건
  //     - 5/10(일) 진입자: 결과 0건 → push [5/11] 1건
  //     - 5/8(금) 진입자: 결과 [5/8] 1건 → 강제 push 미발동 (8일 1회 정책 일치)
  if (!lastRewardDate && result.length === 0 && firstBusinessDayKst) {
    const startObj = new Date(startDateKst + 'T00:00:00Z')
    const fbdObj = new Date(firstBusinessDayKst + 'T00:00:00Z')
    if (startObj.getTime() <= fbdObj.getTime()) {
      const startCheck = new Date(startObj.getTime() - 9 * 60 * 60 * 1000)
      const { isBusinessDay: startIsBiz } = isKoreanBusinessDay(startCheck)
      const fbdCheck = new Date(fbdObj.getTime() - 9 * 60 * 60 * 1000)
      const { isBusinessDay: fbdIsBiz } = isKoreanBusinessDay(fbdCheck)
      if (!startIsBiz && fbdIsBiz) {
        // 휴일 진입자 + firstBusinessDayKst 가 평일 → 첫 평일 1건 강제 push
        result.push(firstBusinessDayKst)
      }
    }
  }
  return result
}

// 출금 신청 창 체크
// 룰: 매주 금요일 10:00~14:00 KST. 공휴일 여부 무관. 실제 지급 처리는 관리자가 수동으로 진행.
function isWithdrawalWindowOpen(d: Date): boolean {
  const kst = new Date(d.getTime() + (9 * 60 * 60 * 1000))
  const day = kst.getUTCDay() // 0=일, 5=금
  const hour = kst.getUTCHours()
  return day === 5 && hour >= 10 && hour < 14
}

// 일일 배당금 지급 (하루 1회 자동 지급)
// 정책: 승인일 익일부터, 거치기간 내 매일 지급, 금액별 차등 배당률
// 월~금만 지급 (토/일/공휴일/국경일 제외)
app.post('/api/rewards/daily', async (c) => {
  try {
    // ★ 사장님 2026-05-07 지시 ★ 강제 일괄 배당은 cron(GitHub Actions) 전용
    // GitHub Actions cron 호출은 'X-Cron-Trigger: github-actions' 헤더로 식별
    // 어드민 UI/사람이 호출하는 경우는 User-Agent 가 axios/Mozilla 등이므로 차단
    const cronTrigger = c.req.header('X-Cron-Trigger') || ''
    const userAgent = c.req.header('User-Agent') || ''
    const isCronCall = cronTrigger === 'github-actions' || /node|github-actions/i.test(userAgent)
    if (!isCronCall) {
      return c.json({
        success: false,
        error: '강제 일괄 배당은 비활성화되었습니다. 매 평일 KST 07:00 cron 자동 실행 전용입니다. 개별 보정은 /api/admin/rewards/manual-adjust 를 사용하세요.',
        blocked: true
      }, 403)
    }

    const db = c.env.DB
    const now = new Date()
    // ★ 사장님 2026-05-07 명확화 ★
    //   "한국시간으로 익일 01시 정도에 cron 이 돌면서 전날 24시간동안 매출을 점검해서
    //    아침 7시에 뿌려주라는 의미" — 즉, 기준일 = 어제 (KST 00:00:00 ~ 23:59:59)
    //   cron 실행 시각: KST 01:00 (UTC 16:00 전일 평일 0-4)
    //   reward_date = 어제(KST)  /  paid_date = 오늘(KST 01:00 처리, 사용자 UI 상 07시 지급 라벨)
    //
    //   기존 today 기준 → yesterdayKst 기준으로 전면 변경
    const today = kstDateStr(now)
    const yesterdayKst = kstDateStr(new Date(now.getTime() - 24 * 60 * 60 * 1000))

    // ★ 사장님 정책 (2026-05-08 영구) — 진입 차단 룰 변경 ★
    //   기존: 어제(KST)가 휴일이면 cron 전체 차단 → 휴일 진입자 첫 평일 데일리 누락 발생
    //   변경: "오늘(KST)이 평일이면" cron 진행 (어제가 휴일이어도 진행)
    //         → getStakingAccrualDatesKst 가 staking 별로 누락된 영업일만 백필
    //         → 휴일 진입자(예: 5/9·5/10 진입)는 첫 평일(5/11) cron 에서 [5/11] 1건 강제 지급
    //         → 평일 진입자(5/8) 는 [5/8] 1건만 지급 (사장님: "8일진입자는 좀 억울하겠지만")
    //   오늘 자체가 휴일이면 cron skip (룰 B 그대로)
    const todayDateObjKst = new Date(today + 'T00:00:00+09:00')
    const { isBusinessDay, reason } = isKoreanBusinessDay(todayDateObjKst)
    if (!isBusinessDay) {
      const reasonText = reason === 'saturday' ? '토요일' : reason === 'sunday' ? '일요일' : '공휴일/국경일'
      return c.json({
        success: true,
        message: `오늘(${today})은 ${reasonText}이므로 배당 처리 불가 (룰 B: 휴일 cron skip, 다음 평일 cron 에서 일괄 백필).`,
        rewarded: 0,
        totalQkey: 0,
        skipped: 0,
        reason: reason,
        targetDate: today
      })
    }

    // ★★ B 보강 (2026-05-06 확정) — 사장님 최종 룰 ★★
    //   1) 휴일/공휴일 매출도 직판수당은 즉시 지급 (staking-approve 단계)
    //   2) 휴일/공휴일 staking 의 일일배당(본인+위/아래 매칭)은 그 다음 첫 평일에 무조건 발생
    //   3) 휴일/공휴일에 위·아래 매출이 전혀 없으면 일일배당 0원 (cron 자체 미실행)
    //
    //   변경점: 기존엔 "직전 1영업일분" 만 처리 → 이제는 staking 별로
    //   "마지막 reward_date 다음 영업일 ~ 오늘" 의 모든 누락 평일을 일괄 처리.
    //   휴일에 시작한 staking 의 reward_date 는 자동으로 "그 다음 첫 평일" 부터 채워짐.

    // paid_date 컬럼 보장 (없으면 추가)
    try { await db.prepare(`ALTER TABLE daily_rewards ADD COLUMN paid_date TEXT`).run() } catch(e) {}
    try { await db.prepare(`ALTER TABLE referral_rewards ADD COLUMN paid_date TEXT`).run() } catch(e) {}

    // ★ 사장님 룰 (2026-05-07 명확화) ★
    //   기준일 = yesterdayKst (어제 KST 00:00:00 ~ 23:59:59 의 24시간 윈도우 매출 전체 포함)
    //   ⇒ start_date_kst <= yesterdayKst 인 staking 만 어제 매출로 인정 (휴일 가입자 포함, 룰 B 백필)
    //   ⇒ end_date_kst   >= yesterdayKst 인 staking 만 거치기간 내 (어제 시점 활성)
    //
    //   이렇게 하면 어제 KST 23:59:59 직전에 가입한 회원도 무조건 어제 매출로 잡혀서
    //   오늘 새벽 01:00 cron 에서 일일배당이 발생함 (영국시간/UTC 경계 문제 완전 차단).
    const activeStakings = await db.prepare(`
      SELECT
        s.user_id,
        s.id as staking_id,
        s.amount,
        s.period_days,
        s.period_months,
        s.daily_rate,
        s.start_date,
        s.end_date,
        s.reset_at,
        date(s.start_date, '+9 hours') as start_date_kst,
        (SELECT COUNT(*) FROM daily_rewards WHERE staking_id = s.id) as rewarded_count,
        (SELECT MAX(reward_date) FROM daily_rewards WHERE staking_id = s.id) as last_reward_date
      FROM staking s
      WHERE s.status = 'active'
        AND date(s.end_date, '+9 hours') >= date(?)
        AND date(s.start_date, '+9 hours') <= date(?)
    `).bind(yesterdayKst, yesterdayKst).all()

    if (activeStakings.results.length === 0) {
      return c.json({
        success: true,
        message: t(c, 'rewards.no_active'),
        rewarded: 0
      })
    }

    let rewardedCount = 0
    let totalQkeyRewarded = 0
    let skippedCount = 0
    let cappedSkipCount = 0
    let processedDates: { staking_id: any, dates: string[] }[] = []
    const cappedUsers: number[] = []

    // 환율: 1 USD = 1,500 KRW, 1 QKEY = 10 KRW → 1 USD = 150 QKEY
    const USD_TO_QKEY = 150

    // ★ 사장님 룰 (2026-05-07) — 200% cap 정책 (B안 사용자 단위 총 합산) ★
    //   사용자가 받은 모든 QKEY 수당 총합(daily_qkey + referral_reward)이
    //   사용자가 넣은 진입금액 합계 × 2 × 150(USD→QKEY) 도달 시
    //   해당 사용자의 모든 신규 수당(본인 daily + 받을 매칭) INSERT 차단.
    //   출금 무관, 잔액 변동 무관 — 누적 수령액만 추적.
    async function isUserCapped(userId: number): Promise<{ capped: boolean, paidTotal: number, target: number, percent: number }> {
      // user_stake_total: active+completed+capped 의 stake amount 합계
      const stakeRow = await db.prepare(`
        SELECT COALESCE(SUM(amount), 0) as total
        FROM staking WHERE user_id = ? AND status IN ('active','completed','capped')
      `).bind(userId).first() as any
      const stakeTotal = Number(stakeRow?.total || 0)
      if (stakeTotal <= 0) return { capped: false, paidTotal: 0, target: 0, percent: 0 }

      // user_paid_total: daily_qkey + referral_reward 의 amount 합계 (positive)
      const paidRow = await db.prepare(`
        SELECT COALESCE(SUM(amount), 0) as total
        FROM transactions
        WHERE user_id = ? AND coin_type = 'QKEY'
          AND type IN ('daily_qkey', 'referral_reward')
      `).bind(userId).first() as any
      const paidTotal = Number(paidRow?.total || 0)
      const target = stakeTotal * 2 * USD_TO_QKEY
      const percent = target > 0 ? (paidTotal / target * 100) : 0
      return { capped: paidTotal >= target, paidTotal, target, percent }
    }

    for (const staking of activeStakings.results) {
      try {
        const periodDays = staking.period_days || (staking.period_months * 30)

        // ★ 200% cap 사전 체크 ★ — 사용자가 이미 cap 도달이면 본인 daily 전체 skip
        const capState = await isUserCapped(staking.user_id as number)
        if (capState.capped) {
          cappedSkipCount++
          if (!cappedUsers.includes(staking.user_id as number)) cappedUsers.push(staking.user_id as number)
          // 자동으로 staking.status='capped' 표시 (해당 user 의 모든 active staking)
          try {
            await db.prepare(`UPDATE staking SET status='capped' WHERE user_id=? AND status='active'`).bind(staking.user_id).run()
          } catch(e) {}
          continue
        }

        // ★ 사장님 룰 (2026-05-07 명확화) ★
        //   reward_date 는 어제(yesterdayKst) 까지만 채움. 오늘 매출은 내일 01:00 cron 에서 처리.
        //   - lastRewardDate 가 있으면 그 다음 영업일 ~ yesterdayKst
        //   - 없으면 startDateKst ~ yesterdayKst (휴일이면 자동 skip 되어 첫 평일부터)
        //   ⇒ 어제 가입자(00시~23시59분)도 startDateKst <= yesterdayKst 라 무조건 포함
        // ★ 사장님 정책 (2026-05-08) — 4번째 인자 today 전달 (B 방안) ★
        //   휴일 진입자(5/9 토·5/10 일 등) 첫 평일 데일리 1회 강제 지급용
        //   일반 백필 endDate = yesterdayKst 그대로 유지 (5/8 진입자: [5/8] 1건만)
        const accrualDates = getStakingAccrualDatesKst(
          (staking.last_reward_date as string) || null,
          staking.start_date_kst as string,
          yesterdayKst,
          today
        )

        if (accrualDates.length === 0) {
          continue // 처리할 평일 없음
        }

        const stakingProcessed: string[] = []

        for (const accrualDate of accrualDates) {
          // 거치기간 일수 초과 시 종료
          const currentRewardedCount = staking.rewarded_count + stakingProcessed.length
          if (currentRewardedCount >= periodDays) {
            skippedCount++
            break
          }

          // 중복 방지 — 같은 (user, staking, reward_date) 가 이미 있으면 skip
          const exists = await db.prepare(`
            SELECT COUNT(*) as count FROM daily_rewards
            WHERE user_id = ? AND staking_id = ? AND reward_date = ?
          `).bind(staking.user_id, staking.staking_id, accrualDate).first()
          if (exists.count > 0) continue

          // 금액별 차등 배당률 적용
          const dailyRate = staking.daily_rate || getDailyRate(staking.amount)
          const usdAmount = staking.amount * dailyRate
          let qkeyAmount = Math.round(usdAmount * USD_TO_QKEY)

          // ★ 200% cap 부분 지급 체크 (B안) ★
          //   accrual loop 내에서 매 영업일마다 누적이 cap 에 닿는지 재계산
          //   cap 도달 시 정확한 잔여분만 지급하고 staking.status='capped' 처리 후 종료
          const capCheck = await isUserCapped(staking.user_id as number)
          if (capCheck.capped) {
            // 이미 cap 도달 — 본인 daily 더 이상 지급 X
            cappedSkipCount++
            if (!cappedUsers.includes(staking.user_id as number)) cappedUsers.push(staking.user_id as number)
            try { await db.prepare(`UPDATE staking SET status='capped' WHERE user_id=? AND status='active'`).bind(staking.user_id).run() } catch(e) {}
            break
          }
          // 잔여 한도 = target - paidTotal
          const remaining = capCheck.target - capCheck.paidTotal
          if (qkeyAmount > remaining) {
            // 부분 지급으로 cap 정확히 맞춤
            qkeyAmount = Math.max(0, Math.floor(remaining))
            if (qkeyAmount <= 0) {
              cappedSkipCount++
              if (!cappedUsers.includes(staking.user_id as number)) cappedUsers.push(staking.user_id as number)
              try { await db.prepare(`UPDATE staking SET status='capped' WHERE user_id=? AND status='active'`).bind(staking.user_id).run() } catch(e) {}
              break
            }
          }

          // [본인 배당 지급]
          //   reward_date = accrualDate (해당 평일)
          //   paid_date   = today       (오늘 cron 실행일)
          await db.prepare(`
            INSERT INTO daily_rewards (user_id, staking_id, usdt_amount, reward_date, paid_date)
            VALUES (?, ?, ?, ?, ?)
          `).bind(staking.user_id, staking.staking_id, qkeyAmount, accrualDate, today).run()

          await db.prepare(`
            UPDATE users SET qkey_balance = qkey_balance + ? WHERE id = ?
          `).bind(qkeyAmount, staking.user_id).run()

          const newCount = currentRewardedCount + 1
          // EXISTS 가드 — (user, type='daily_qkey', amount, KST date) 중복 INSERT 차단
          const dqExists2 = await db.prepare(`
            SELECT id FROM transactions
            WHERE user_id = ? AND type = 'daily_qkey' AND coin_type = 'QKEY'
              AND amount = ?
              AND date(created_at, '+9 hours') = ?
            LIMIT 1
          `).bind(staking.user_id, qkeyAmount, today).first()
          if (!dqExists2) {
            await db.prepare(`
              INSERT INTO transactions (user_id, type, coin_type, amount, description)
              VALUES (?, 'daily_qkey', 'QKEY', ?, ?)
            `).bind(staking.user_id, qkeyAmount, `Daily reward ${qkeyAmount.toLocaleString()} QKEY (${(dailyRate*100).toFixed(1)}%, ${newCount}/${periodDays}d, accrued ${accrualDate} paid ${today})`).run()
          }

          rewardedCount++
          totalQkeyRewarded += qkeyAmount
          stakingProcessed.push(accrualDate)

          // 매칭추천수당 (L1 20%, L2 10%) — 추천인이 accrualDate 시점 active 일 때만
          try {
            const level1Referrer = await db.prepare(`
              SELECT referrer_id FROM users WHERE id = ?
            `).bind(staking.user_id).first()

            if (level1Referrer && level1Referrer.referrer_id) {
              const level1Active = await db.prepare(`
                SELECT id FROM staking
                WHERE user_id = ?
                  AND status = 'active'
                  AND date(start_date, '+9 hours') <= date(?)
                  AND date(end_date, '+9 hours') >= date(?)
                LIMIT 1
              `).bind(level1Referrer.referrer_id, accrualDate, accrualDate).first()

              if (level1Active) {
                // 1대 중복 체크
                const l1Exists = await db.prepare(`
                  SELECT COUNT(*) as count FROM referral_rewards
                  WHERE referrer_id = ? AND referee_id = ? AND level = 1 AND reward_date = ?
                `).bind(level1Referrer.referrer_id, staking.user_id, accrualDate).first()

                if (l1Exists.count === 0) {
                  let level1Reward = Math.round(qkeyAmount * 0.20)

                  // ★ 200% cap 체크 (B안) — L1 받는 사람 cap 도달 시 부분 지급 또는 차단 ★
                  const l1Cap = await isUserCapped(level1Referrer.referrer_id as number)
                  if (l1Cap.capped) {
                    // L1 추천인 이미 cap → 매칭 수당 0건
                    try { await db.prepare(`UPDATE staking SET status='capped' WHERE user_id=? AND status='active'`).bind(level1Referrer.referrer_id).run() } catch(e) {}
                    if (!cappedUsers.includes(level1Referrer.referrer_id as number)) cappedUsers.push(level1Referrer.referrer_id as number)
                  } else {
                    const l1Remaining = l1Cap.target - l1Cap.paidTotal
                    if (level1Reward > l1Remaining) level1Reward = Math.max(0, Math.floor(l1Remaining))
                    if (level1Reward > 0) {
                      await db.prepare(`
                        UPDATE users SET qkey_balance = qkey_balance + ? WHERE id = ?
                      `).bind(level1Reward, level1Referrer.referrer_id).run()

                      await db.prepare(`
                        INSERT INTO referral_rewards (referrer_id, referee_id, level, original_amount, reward_amount, reward_date, paid_date)
                        VALUES (?, ?, 1, ?, ?, ?, ?)
                      `).bind(level1Referrer.referrer_id, staking.user_id, qkeyAmount, level1Reward, accrualDate, today).run()

                      // EXISTS 가드 — (referrer, type='referral_reward', amount, KST date) 중복 INSERT 차단
                      const l1TxExists2 = await db.prepare(`
                        SELECT id FROM transactions
                        WHERE user_id = ? AND type = 'referral_reward' AND coin_type = 'QKEY'
                          AND amount = ?
                          AND date(created_at, '+9 hours') = ?
                        LIMIT 1
                      `).bind(level1Referrer.referrer_id, level1Reward, today).first()
                      if (!l1TxExists2) {
                        await db.prepare(`
                          INSERT INTO transactions (user_id, type, coin_type, amount, description)
                          VALUES (?, 'referral_reward', 'QKEY', ?, ?)
                        `).bind(level1Referrer.referrer_id, level1Reward, `Level 1 referral bonus (${qkeyAmount.toLocaleString()} QKEY x 20%, accrued ${accrualDate} paid ${today})`).run()
                      }
                    }
                  }
                }

                // 2대 매칭추천수당 (10%)
                const level2Referrer = await db.prepare(`
                  SELECT referrer_id FROM users WHERE id = ?
                `).bind(level1Referrer.referrer_id).first()

                if (level2Referrer && level2Referrer.referrer_id) {
                  const level2Active = await db.prepare(`
                    SELECT id FROM staking
                    WHERE user_id = ?
                      AND status = 'active'
                      AND date(start_date, '+9 hours') <= date(?)
                      AND date(end_date, '+9 hours') >= date(?)
                    LIMIT 1
                  `).bind(level2Referrer.referrer_id, accrualDate, accrualDate).first()

                  if (level2Active) {
                    const l2Exists = await db.prepare(`
                      SELECT COUNT(*) as count FROM referral_rewards
                      WHERE referrer_id = ? AND referee_id = ? AND level = 2 AND reward_date = ?
                    `).bind(level2Referrer.referrer_id, staking.user_id, accrualDate).first()

                    if (l2Exists.count === 0) {
                      let level2Reward = Math.round(qkeyAmount * 0.10)

                      // ★ 200% cap 체크 (B안) — L2 받는 사람 cap 도달 시 부분 지급 또는 차단 ★
                      const l2Cap = await isUserCapped(level2Referrer.referrer_id as number)
                      if (l2Cap.capped) {
                        try { await db.prepare(`UPDATE staking SET status='capped' WHERE user_id=? AND status='active'`).bind(level2Referrer.referrer_id).run() } catch(e) {}
                        if (!cappedUsers.includes(level2Referrer.referrer_id as number)) cappedUsers.push(level2Referrer.referrer_id as number)
                      } else {
                        const l2Remaining = l2Cap.target - l2Cap.paidTotal
                        if (level2Reward > l2Remaining) level2Reward = Math.max(0, Math.floor(l2Remaining))
                        if (level2Reward > 0) {
                          await db.prepare(`
                            UPDATE users SET qkey_balance = qkey_balance + ? WHERE id = ?
                          `).bind(level2Reward, level2Referrer.referrer_id).run()

                          await db.prepare(`
                            INSERT INTO referral_rewards (referrer_id, referee_id, level, original_amount, reward_amount, reward_date, paid_date)
                            VALUES (?, ?, 2, ?, ?, ?, ?)
                          `).bind(level2Referrer.referrer_id, staking.user_id, qkeyAmount, level2Reward, accrualDate, today).run()

                          // EXISTS 가드 — (referrer, type='referral_reward', amount, KST date) 중복 INSERT 차단
                          const l2TxExists2 = await db.prepare(`
                            SELECT id FROM transactions
                            WHERE user_id = ? AND type = 'referral_reward' AND coin_type = 'QKEY'
                              AND amount = ?
                              AND date(created_at, '+9 hours') = ?
                            LIMIT 1
                          `).bind(level2Referrer.referrer_id, level2Reward, today).first()
                          if (!l2TxExists2) {
                            await db.prepare(`
                              INSERT INTO transactions (user_id, type, coin_type, amount, description)
                              VALUES (?, 'referral_reward', 'QKEY', ?, ?)
                            `).bind(level2Referrer.referrer_id, level2Reward, `Level 2 referral bonus (${qkeyAmount.toLocaleString()} QKEY x 10%, accrued ${accrualDate} paid ${today})`).run()
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          } catch (referralError) {
            console.error(`매칭추천수당 처리 오류 (user ${staking.user_id}, accrual ${accrualDate}):`, referralError)
          }
        }

        if (stakingProcessed.length > 0) {
          processedDates.push({ staking_id: staking.staking_id, dates: stakingProcessed })
        }
      } catch (err) {
        console.error(`보상 지급 오류 (user ${staking.user_id}):`, err)
      }
    }

    let message = `[기준일(어제) ${yesterdayKst} / 지급처리일 ${today}] ${rewardedCount} rewarded across ${processedDates.length} stakings (${totalQkeyRewarded.toLocaleString()} QKEY)`
    if (skippedCount > 0) {
      message += ` | ${skippedCount} completed`
    }
    if (cappedSkipCount > 0) {
      message += ` | ${cappedSkipCount} CAPPED-skip (200% reached)`
    }

    return c.json({
      success: true,
      message: message,
      targetDate: yesterdayKst,   // 기준일(어제 KST)
      paidDate: today,            // 처리일(오늘 KST 01:00)
      rewarded: rewardedCount,
      totalQkey: totalQkeyRewarded,
      skipped: skippedCount,
      cappedSkipCount: cappedSkipCount,
      cappedUsers: cappedUsers,
      processedDates: processedDates
    })
  } catch (error) {
    console.error('Daily reward error:', error)
    return c.json({ error: t(c, 'rewards.daily_error') }, 500)
  }
})

// ★ 200% Cap 진행률 조회 API (사용자/UI용) ★
//   사용자가 받은 모든 QKEY 수당 총합(daily_qkey + referral_reward)을
//   사용자 진입금액 합계 × 2 × 150 (target) 과 비교한 진행률 반환.
//   단계: <180% green / 180~200% red / >=200% capped
app.get('/api/staking/progress/:userId', async (c) => {
  try {
    const db = c.env.DB
    const userId = Number(c.req.param('userId'))
    if (!Number.isFinite(userId) || userId <= 0) {
      return c.json({ error: 'invalid userId' }, 400)
    }
    const USD_TO_QKEY = 150

    const stakeRow = await db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM staking WHERE user_id = ? AND status IN ('active','completed','capped')
    `).bind(userId).first() as any
    const stakeTotal = Number(stakeRow?.total || 0)

    const paidRow = await db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM transactions
      WHERE user_id = ? AND coin_type = 'QKEY'
        AND type IN ('daily_qkey', 'referral_reward')
    `).bind(userId).first() as any
    const paidTotal = Number(paidRow?.total || 0)

    const target = stakeTotal * 2 * USD_TO_QKEY
    const percent = target > 0 ? (paidTotal / target * 100) : 0

    // 단계 판정
    let stage: 'green' | 'red' | 'capped' = 'green'
    if (percent >= 200) stage = 'capped'
    else if (percent >= 180) stage = 'red'

    // staking 별 status 반환 (capped 표시용)
    const stakings = await db.prepare(`
      SELECT id, amount, daily_rate, start_date, end_date, status
      FROM staking WHERE user_id = ? AND status IN ('active','completed','capped')
      ORDER BY id ASC
    `).bind(userId).all()

    return c.json({
      success: true,
      user_id: userId,
      stake_total_usd: stakeTotal,
      target_qkey: target,
      paid_total_qkey: paidTotal,
      percent: Math.round(percent * 100) / 100,
      stage,
      capped: stage === 'capped',
      remaining_qkey: Math.max(0, target - paidTotal),
      stakings: stakings.results
    })
  } catch (error) {
    console.error('staking progress error:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// ★ 어드민 200% Cap 진단 — 53명 전체 진행률 일람 ★
app.get('/api/admin/diag/staking-progress', async (c) => {
  try {
    const db = c.env.DB
    const USD_TO_QKEY = 150

    const rows = await db.prepare(`
      SELECT
        u.id as user_id,
        u.email,
        COALESCE(SUM(CASE WHEN s.status IN ('active','completed','capped') THEN s.amount ELSE 0 END), 0) as stake_total,
        (SELECT COALESCE(SUM(amount), 0) FROM transactions
          WHERE user_id = u.id AND coin_type = 'QKEY'
            AND type IN ('daily_qkey','referral_reward')) as paid_total
      FROM users u
      LEFT JOIN staking s ON s.user_id = u.id
      GROUP BY u.id
      ORDER BY u.id ASC
    `).all()

    const list: any[] = []
    let cappedCount = 0
    let warnCount = 0
    for (const r of rows.results as any[]) {
      const stake = Number(r.stake_total || 0)
      if (stake <= 0) continue
      const paid = Number(r.paid_total || 0)
      const target = stake * 2 * USD_TO_QKEY
      const percent = target > 0 ? (paid / target * 100) : 0
      let stage: 'green' | 'red' | 'capped' = 'green'
      if (percent >= 200) { stage = 'capped'; cappedCount++ }
      else if (percent >= 180) { stage = 'red'; warnCount++ }
      list.push({
        user_id: r.user_id,
        email: r.email,
        stake_total_usd: stake,
        paid_total_qkey: paid,
        target_qkey: target,
        percent: Math.round(percent * 100) / 100,
        stage,
        remaining_qkey: Math.max(0, target - paid)
      })
    }

    return c.json({
      success: true,
      total_active_users: list.length,
      capped_count: cappedCount,
      warn_count: warnCount,
      list
    })
  } catch (error) {
    console.error('admin staking-progress error:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// 어드민 진단: 특정 날짜 + 특정 사용자의 transactions 조회 (중복지급 원인 파악용)
app.get('/api/admin/diag/transactions', async (c) => {
  try {
    const db = c.env.DB
    const date = c.req.query('date') || ''
    const userId = c.req.query('userId') || ''
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return c.json({ error: 'date=YYYY-MM-DD 필요' }, 400)
    }
    let rows
    if (userId) {
      rows = await db.prepare(
        `SELECT id, user_id, type, coin_type, amount, description, created_at
         FROM transactions
         WHERE user_id = ? AND date(created_at, '+9 hours') = ?
         ORDER BY id`
      ).bind(userId, date).all()
    } else {
      rows = await db.prepare(
        `SELECT id, user_id, type, coin_type, amount, description, created_at
         FROM transactions
         WHERE date(created_at, '+9 hours') = ?
         ORDER BY user_id, id`
      ).bind(date).all()
    }
    // type 별 집계
    const byType: Record<string, { count: number, total: number }> = {}
    for (const r of (rows.results || [])) {
      const t = String(r.type)
      if (!byType[t]) byType[t] = { count: 0, total: 0 }
      byType[t].count++
      byType[t].total += Number(r.amount) || 0
    }
    // 같은 (user_id, type, description) 중복 검출
    const dupes: any[] = []
    const seen: Record<string, any[]> = {}
    for (const r of (rows.results || [])) {
      const key = `${r.user_id}|${r.type}|${r.description}`
      if (!seen[key]) seen[key] = []
      seen[key].push(r)
    }
    for (const k of Object.keys(seen)) {
      if (seen[k].length > 1) dupes.push({ key: k, rows: seen[k] })
    }
    return c.json({
      success: true,
      date,
      userId: userId || 'all',
      total_rows: rows.results.length,
      by_type: byType,
      duplicates: dupes,
      rows: rows.results
    })
  } catch (error) {
    return c.json({ error: String(error) }, 500)
  }
})

// 어드민 진단: 특정 날짜의 daily_rewards / referral_rewards 행 조회 (디버깅용)
app.get('/api/admin/diag/rewards', async (c) => {
  try {
    const db = c.env.DB
    const date = c.req.query('date') || ''
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return c.json({ error: 'date=YYYY-MM-DD 필요' }, 400)
    }
    // reward_date 또는 paid_date 기준으로 조회
    const dailyByReward = await db.prepare(
      `SELECT id, user_id, staking_id, usdt_amount, reward_date, paid_date, created_at
       FROM daily_rewards WHERE reward_date = ? ORDER BY id`
    ).bind(date).all()
    const dailyByPaid = await db.prepare(
      `SELECT id, user_id, staking_id, usdt_amount, reward_date, paid_date, created_at
       FROM daily_rewards WHERE paid_date = ? ORDER BY id`
    ).bind(date).all()
    const refByReward = await db.prepare(
      `SELECT id, referrer_id, referee_id, level, reward_amount, reward_date, paid_date, created_at
       FROM referral_rewards WHERE reward_date = ? ORDER BY id`
    ).bind(date).all()
    const refByPaid = await db.prepare(
      `SELECT id, referrer_id, referee_id, level, reward_amount, reward_date, paid_date, created_at
       FROM referral_rewards WHERE paid_date = ? ORDER BY id`
    ).bind(date).all()
    // 같은 (user, staking, reward_date) 중복 검출
    const dupes = await db.prepare(
      `SELECT user_id, staking_id, reward_date, COUNT(*) as cnt
       FROM daily_rewards WHERE reward_date = ? OR paid_date = ?
       GROUP BY user_id, staking_id, reward_date HAVING cnt > 1`
    ).bind(date, date).all()

    // transactions 테이블에서 해당 날짜에 발생한 보상 관련 행 전체 조회
    // (date()는 SQLite에서 created_at의 날짜 부분 추출 → KST 저장 기준)
    const txRewards = await db.prepare(
      `SELECT id, user_id, type, coin_type, amount, description, created_at
       FROM transactions
       WHERE date(created_at, '+9 hours') = ?
         AND type IN ('daily_qkey','direct_referral','referral_reward','daily_reward_rollback','referral_reward_rollback','rollback_restore')
       ORDER BY id`
    ).bind(date).all()

    // type별 집계
    const txSummary = await db.prepare(
      `SELECT type,
              COUNT(*) as cnt,
              COALESCE(SUM(amount), 0) as total_amount
       FROM transactions
       WHERE date(created_at, '+9 hours') = ?
         AND type IN ('daily_qkey','direct_referral','referral_reward','daily_reward_rollback','referral_reward_rollback')
       GROUP BY type`
    ).bind(date).all()

    // referral_reward 중 description에 Level 1 / Level 2 포함 여부별 분리 집계
    const txReferralBreakdown = await db.prepare(
      `SELECT
         SUM(CASE WHEN description LIKE '%Level 1%' THEN 1 ELSE 0 END) as lvl1_cnt,
         SUM(CASE WHEN description LIKE '%Level 1%' THEN amount ELSE 0 END) as lvl1_amount,
         SUM(CASE WHEN description LIKE '%Level 2%' THEN 1 ELSE 0 END) as lvl2_cnt,
         SUM(CASE WHEN description LIKE '%Level 2%' THEN amount ELSE 0 END) as lvl2_amount,
         SUM(CASE WHEN description NOT LIKE '%Level 1%' AND description NOT LIKE '%Level 2%' THEN 1 ELSE 0 END) as other_cnt,
         SUM(CASE WHEN description NOT LIKE '%Level 1%' AND description NOT LIKE '%Level 2%' THEN amount ELSE 0 END) as other_amount
       FROM transactions
       WHERE date(created_at, '+9 hours') = ? AND type = 'referral_reward'`
    ).bind(date).all()

    return c.json({
      success: true,
      date,
      daily_by_reward_date: dailyByReward.results,
      daily_by_paid_date: dailyByPaid.results,
      referral_by_reward_date: refByReward.results,
      referral_by_paid_date: refByPaid.results,
      duplicates_daily: dupes.results,
      tx_rewards: txRewards.results,
      tx_summary: txSummary.results,
      tx_referral_breakdown: txReferralBreakdown.results
    })
  } catch (error) {
    return c.json({ error: String(error) }, 500)
  }
})

// ★★ 사장님 2026-05-07 지시 ★★ KST 24시간 윈도우 누락 매출자 진단/보충
// 룰 (재확정):
//   - KST 어제 00:00:00 ~ 23:59:59 사이에 staking-approve 된 회원 = 어제 매출자
//   - 가입 시간이 KST 00:01 이든 23:59 이든 무조건 같은 KST 날짜로 묶음
//   - 점검 cron 은 익일 KST 01:00, 지급 cron 은 익일 KST 07:00 으로 분리
// body:
//   { targetDate: 'YYYY-MM-DD' (KST, 점검 대상일, 기본=어제 KST),
//     paidDate:   'YYYY-MM-DD' (KST, 지급일,    기본=오늘 KST),
//     dryRun: true|false }
app.post('/api/admin/rewards/check-missing-by-kst', async (c) => {
  try {
    const db = c.env.DB
    const body = await c.req.json().catch(() => ({}))
    const dryRun = body.dryRun !== false  // 기본 true 안전

    // KST 기준 today / yesterday 계산
    const nowMs = Date.now()
    const todayKstStr = new Date(nowMs + 9*60*60*1000).toISOString().slice(0,10)
    const yKstMs = nowMs + 9*60*60*1000 - 24*60*60*1000
    const yKstStr = new Date(yKstMs).toISOString().slice(0,10)

    const targetDate = body.targetDate ? String(body.targetDate) : yKstStr
    const paidDate = body.paidDate ? String(body.paidDate) : todayKstStr

    // ★ 핵심: KST 24시간 윈도우 — date(start_date, '+9 hours') = targetDate (KST)
    // 즉 start_date(UTC) 를 KST 로 변환했을 때 targetDate 와 정확히 같은 날
    const candidates = await db.prepare(`
      SELECT 
        s.user_id, 
        s.id as staking_id, 
        s.amount, 
        s.period_days, 
        s.period_months, 
        s.daily_rate, 
        s.start_date,
        s.end_date,
        s.status,
        date(s.start_date, '+9 hours') as start_date_kst,
        date(s.end_date, '+9 hours') as end_date_kst,
        u.email, u.name,
        (SELECT COUNT(*) FROM daily_rewards dr 
          WHERE dr.staking_id = s.id AND dr.reward_date = ?) as already_paid_for_target,
        (SELECT COUNT(*) FROM daily_rewards dr WHERE dr.staking_id = s.id) as total_paid_count
      FROM staking s
      LEFT JOIN users u ON u.id = s.user_id
      WHERE s.status = 'active'
        AND date(s.start_date, '+9 hours') = ?
        AND date(s.end_date, '+9 hours') >= ?
      ORDER BY s.id ASC
    `).bind(targetDate, targetDate, paidDate).all()

    const all = (candidates.results || []) as any[]
    const missing = all.filter(r => Number(r.already_paid_for_target) === 0)
    const already = all.filter(r => Number(r.already_paid_for_target) > 0)

    // dryRun: 분석만
    if (dryRun) {
      return c.json({
        success: true,
        dryRun: true,
        kst: { today: todayKstStr, yesterday: yKstStr, targetDate, paidDate },
        scope_query: `KST 24시간: start_date_kst = ${targetDate}`,
        candidates_total: all.length,
        already_paid: already.length,
        missing: missing.length,
        rule: '본인 룰: 승인 다음 영업일 첫 배당. 어제 매출자(평일/휴일 무관) → 오늘이 영업일이면 오늘 reward_date=어제 로 보충 1회 지급.',
        sample_missing: missing.slice(0, 50),
        sample_already_paid: already.slice(0, 10)
      })
    }

    // 실제 보충 — KST 영업일 룰: paidDate 가 영업일이어야 지급 (휴일이면 다음 영업일까지 누적)
    const paidDateObj = new Date(paidDate + 'T00:00:00Z')
    paidDateObj.setUTCHours(paidDateObj.getUTCHours() - 9)  // KST→UTC 변환 후 영업일 체크
    const { isBusinessDay: paidIsBiz, reason: paidReason } = isKoreanBusinessDay(paidDateObj)
    if (!paidIsBiz) {
      return c.json({
        success: false,
        dryRun: false,
        message: `paidDate(${paidDate}) 가 KST 영업일이 아닙니다 (${paidReason}). 다음 영업일에 다시 시도해 주세요.`
      })
    }

    const USD_TO_QKEY = 150
    let inserted = 0
    let totalQkey = 0
    const inserts: any[] = []

    for (const s of missing) {
      const dailyRate = (s.daily_rate as number) || getDailyRate(s.amount as number)
      const usdAmount = (s.amount as number) * dailyRate
      const qkeyAmount = Math.round(usdAmount * USD_TO_QKEY)
      const periodDays = (s.period_days as number) || ((s.period_months as number) * 30)
      if (Number(s.total_paid_count) >= periodDays) continue

      // 1) daily_rewards 본인 배당 — reward_date = targetDate(어제 KST), paid_date = paidDate(오늘 KST)
      await db.prepare(`
        INSERT INTO daily_rewards (user_id, staking_id, usdt_amount, reward_date, paid_date)
        VALUES (?, ?, ?, ?, ?)
      `).bind(s.user_id, s.staking_id, qkeyAmount, targetDate, paidDate).run()

      // 2) 잔액 반영
      await db.prepare(`UPDATE users SET qkey_balance = qkey_balance + ? WHERE id = ?`)
        .bind(qkeyAmount, s.user_id).run()

      // 3) 거래내역 기록 — EXISTS 가드 (user_id, type='daily_qkey', amount, KST date) 중복 INSERT 차단
      const newCount = Number(s.total_paid_count) + 1
      const dqExists = await db.prepare(`
        SELECT id FROM transactions
        WHERE user_id = ? AND type = 'daily_qkey' AND coin_type = 'QKEY'
          AND amount = ?
          AND date(created_at, '+9 hours') = ?
        LIMIT 1
      `).bind(s.user_id, qkeyAmount, paidDate).first()
      if (!dqExists) {
        await db.prepare(`
          INSERT INTO transactions (user_id, type, coin_type, amount, description)
          VALUES (?, 'daily_qkey', 'QKEY', ?, ?)
        `).bind(s.user_id, qkeyAmount,
          `[KST 24h 보충] Daily ${qkeyAmount.toLocaleString()} QKEY (${(dailyRate*100).toFixed(1)}%, ${newCount}/${periodDays}d, KST매출일 ${targetDate} 지급일 ${paidDate})`).run()
      }

      inserted++
      totalQkey += qkeyAmount
      inserts.push({ user_id: s.user_id, staking_id: s.staking_id, qkey: qkeyAmount, email: s.email, name: s.name })

      // 4) L1 매칭 (20%)
      try {
        const lvl1 = await db.prepare(`SELECT referrer_id FROM users WHERE id = ?`).bind(s.user_id).first() as any
        if (lvl1?.referrer_id) {
          const l1Active = await db.prepare(`
            SELECT id FROM staking 
            WHERE user_id = ? AND status = 'active'
              AND date(start_date, '+9 hours') <= ? AND date(end_date, '+9 hours') >= ?
            LIMIT 1
          `).bind(lvl1.referrer_id, targetDate, targetDate).first()
          if (l1Active) {
            const l1Exists = await db.prepare(`
              SELECT COUNT(*) as count FROM referral_rewards
              WHERE referrer_id = ? AND referee_id = ? AND level = 1 AND reward_date = ?
            `).bind(lvl1.referrer_id, s.user_id, targetDate).first() as any
            if (Number(l1Exists?.count || 0) === 0) {
              const l1Reward = Math.round(qkeyAmount * 0.20)
              await db.prepare(`UPDATE users SET qkey_balance = qkey_balance + ? WHERE id = ?`)
                .bind(l1Reward, lvl1.referrer_id).run()
              await db.prepare(`
                INSERT INTO referral_rewards (referrer_id, referee_id, level, original_amount, reward_amount, reward_date, paid_date)
                VALUES (?, ?, 1, ?, ?, ?, ?)
              `).bind(lvl1.referrer_id, s.user_id, qkeyAmount, l1Reward, targetDate, paidDate).run()
              // EXISTS 가드 — (referrer, type='referral_reward', amount, KST date) 중복 INSERT 차단
              const l1TxExists = await db.prepare(`
                SELECT id FROM transactions
                WHERE user_id = ? AND type = 'referral_reward' AND coin_type = 'QKEY'
                  AND amount = ?
                  AND date(created_at, '+9 hours') = ?
                LIMIT 1
              `).bind(lvl1.referrer_id, l1Reward, paidDate).first()
              if (!l1TxExists) {
                await db.prepare(`
                  INSERT INTO transactions (user_id, type, coin_type, amount, description)
                  VALUES (?, 'referral_reward', 'QKEY', ?, ?)
                `).bind(lvl1.referrer_id, l1Reward,
                  `[KST 24h 보충] Level 1 referral bonus (${qkeyAmount.toLocaleString()} QKEY x 20%, KST매출일 ${targetDate} 지급일 ${paidDate})`).run()
              }

              // 5) L2 매칭 (10%)
              const lvl2 = await db.prepare(`SELECT referrer_id FROM users WHERE id = ?`).bind(lvl1.referrer_id).first() as any
              if (lvl2?.referrer_id) {
                const l2Active = await db.prepare(`
                  SELECT id FROM staking 
                  WHERE user_id = ? AND status = 'active'
                    AND date(start_date, '+9 hours') <= ? AND date(end_date, '+9 hours') >= ?
                  LIMIT 1
                `).bind(lvl2.referrer_id, targetDate, targetDate).first()
                if (l2Active) {
                  const l2Exists = await db.prepare(`
                    SELECT COUNT(*) as count FROM referral_rewards
                    WHERE referrer_id = ? AND referee_id = ? AND level = 2 AND reward_date = ?
                  `).bind(lvl2.referrer_id, s.user_id, targetDate).first() as any
                  if (Number(l2Exists?.count || 0) === 0) {
                    const l2Reward = Math.round(qkeyAmount * 0.10)
                    await db.prepare(`UPDATE users SET qkey_balance = qkey_balance + ? WHERE id = ?`)
                      .bind(l2Reward, lvl2.referrer_id).run()
                    await db.prepare(`
                      INSERT INTO referral_rewards (referrer_id, referee_id, level, original_amount, reward_amount, reward_date, paid_date)
                      VALUES (?, ?, 2, ?, ?, ?, ?)
                    `).bind(lvl2.referrer_id, s.user_id, qkeyAmount, l2Reward, targetDate, paidDate).run()
                    // EXISTS 가드 — (referrer, type='referral_reward', amount, KST date) 중복 INSERT 차단
                    const l2TxExists = await db.prepare(`
                      SELECT id FROM transactions
                      WHERE user_id = ? AND type = 'referral_reward' AND coin_type = 'QKEY'
                        AND amount = ?
                        AND date(created_at, '+9 hours') = ?
                      LIMIT 1
                    `).bind(lvl2.referrer_id, l2Reward, paidDate).first()
                    if (!l2TxExists) {
                      await db.prepare(`
                        INSERT INTO transactions (user_id, type, coin_type, amount, description)
                        VALUES (?, 'referral_reward', 'QKEY', ?, ?)
                      `).bind(lvl2.referrer_id, l2Reward,
                        `[KST 24h 보충] Level 2 referral bonus (${qkeyAmount.toLocaleString()} QKEY x 10%, KST매출일 ${targetDate} 지급일 ${paidDate})`).run()
                    }
                  }
                }
              }
            }
          }
        }
      } catch (e: any) {
        console.error('matching reward error:', e?.message || e)
      }
    }

    return c.json({
      success: true,
      dryRun: false,
      kst: { today: todayKstStr, yesterday: yKstStr, targetDate, paidDate },
      candidates_total: all.length,
      already_paid: already.length,
      inserted_self_daily: inserted,
      total_qkey_paid: totalQkey,
      inserts
    })
  } catch (error: any) {
    console.error('check-missing-by-kst error:', error)
    return c.json({ error: String(error?.message || error) }, 500)
  }
})

// ★★ 사장님 2026-05-07 지시 ★★
// "영국시간(UTC) 기준으로 reward_date 가 다른 날로 찍혀서 같은 KST 영업일 1회 지급이 2회로 중복 보이는 건 정리"
// 분석 로직:
//  1) daily_rewards 의 created_at(UTC 저장) 을 KST 로 변환 → kst_date
//  2) 같은 (user_id, staking_id) 에 대해 다른 reward_date 가 KST 기준 같은 영업일에 들어있으면 중복으로 식별
//  3) dryRun=true 이면 분석만, false 이면 가장 최근(id 큰) 것만 남기고 나머지는 삭제 + 잔액 차감 + transactions 회수 로그 기록
app.post('/api/admin/rewards/dedupe-kst-utc', async (c) => {
  try {
    const db = c.env.DB
    const body = await c.req.json().catch(() => ({}))
    const dryRun = body.dryRun !== false  // 기본값 true (안전)
    const targetUserId = body.userId ? Number(body.userId) : null
    const fromDate = body.fromDate ? String(body.fromDate) : '2026-04-01'
    const toDate = body.toDate ? String(body.toDate) : '2099-12-31'

    // 모든 daily_rewards 조회 (created_at + reward_date 둘 다)
    // SQLite datetime(created_at, '+9 hours') 로 KST 변환, KST 날짜만 추출
    const sql = `
      SELECT id, user_id, staking_id, usdt_amount, reward_date, paid_date, created_at,
             date(datetime(created_at, '+9 hours')) as kst_created_date
      FROM daily_rewards
      WHERE reward_date BETWEEN ? AND ?
      ${targetUserId ? 'AND user_id = ?' : ''}
      ORDER BY user_id, staking_id, kst_created_date, id
    `
    const args: any[] = [fromDate, toDate]
    if (targetUserId) args.push(targetUserId)
    const rows = await db.prepare(sql).bind(...args).all()
    const allRows = (rows.results || []) as any[]

    // KST 기준 중복 그룹핑: (user_id + staking_id + kst_created_date) 가 같으면 중복
    const groups: Record<string, any[]> = {}
    for (const r of allRows) {
      const key = `${r.user_id}|${r.staking_id}|${r.kst_created_date}`
      if (!groups[key]) groups[key] = []
      groups[key].push(r)
    }

    // 중복 그룹 (2개 이상) 만 추출
    const duplicateGroups: any[] = []
    let totalDuplicateRows = 0
    let totalDuplicateAmount = 0
    for (const key in groups) {
      const grp = groups[key]
      if (grp.length < 2) continue
      // reward_date 가 서로 다르면 UTC/KST 경계 문제로 의심
      const distinctRewardDates = Array.from(new Set(grp.map(r => r.reward_date)))
      const isUtcBoundaryIssue = distinctRewardDates.length > 1
      const keepRow = grp.reduce((a, b) => (b.id > a.id ? b : a))  // id 가장 큰 것 유지
      const removeRows = grp.filter(r => r.id !== keepRow.id)
      const removeAmount = removeRows.reduce((sum, r) => sum + Number(r.usdt_amount || 0), 0)
      totalDuplicateRows += removeRows.length
      totalDuplicateAmount += removeAmount
      duplicateGroups.push({
        key,
        user_id: grp[0].user_id,
        staking_id: grp[0].staking_id,
        kst_created_date: grp[0].kst_created_date,
        distinct_reward_dates: distinctRewardDates,
        is_utc_boundary_issue: isUtcBoundaryIssue,
        rows_total: grp.length,
        keep_row_id: keepRow.id,
        keep_row: keepRow,
        remove_rows: removeRows,
        remove_amount: removeAmount
      })
    }

    if (dryRun) {
      return c.json({
        success: true,
        dryRun: true,
        scope: { fromDate, toDate, userId: targetUserId },
        analyzed_rows: allRows.length,
        duplicate_groups: duplicateGroups.length,
        rows_to_remove: totalDuplicateRows,
        amount_to_subtract: totalDuplicateAmount,
        groups: duplicateGroups,
        note: 'dryRun=true 분석만 수행. 실제 삭제는 dryRun:false 로 다시 호출하세요.'
      })
    }

    // 실제 삭제 + 잔액 차감 + transactions 회수 로그
    let deletedCount = 0
    let balanceSubtracted = 0
    const txLogs: any[] = []
    for (const grp of duplicateGroups) {
      for (const r of grp.remove_rows) {
        // 1) daily_rewards 삭제
        const del = await db.prepare(`DELETE FROM daily_rewards WHERE id = ?`).bind(r.id).run()
        const removed = (del.meta?.changes || 0)
        deletedCount += removed
        if (removed > 0) {
          // 2) 잔액 차감
          await db.prepare(`UPDATE users SET qkey_balance = qkey_balance - ? WHERE id = ?`)
            .bind(Number(r.usdt_amount || 0), r.user_id).run()
          balanceSubtracted += Number(r.usdt_amount || 0)
          // 3) transactions 회수 로그
          const desc = `[KST/UTC 중복 정리] daily_reward_id=${r.id} reward_date=${r.reward_date} kst_date=${r.kst_created_date} amount=-${r.usdt_amount}`
          const ins = await db.prepare(`
            INSERT INTO transactions (user_id, type, coin_type, amount, description)
            VALUES (?, 'daily_reward_rollback', 'QKEY', ?, ?)
          `).bind(r.user_id, -Number(r.usdt_amount || 0), desc).run()
          txLogs.push({ user_id: r.user_id, deleted_id: r.id, tx_id: (ins.meta as any)?.last_row_id })
        }
      }
    }

    return c.json({
      success: true,
      dryRun: false,
      scope: { fromDate, toDate, userId: targetUserId },
      duplicate_groups: duplicateGroups.length,
      deleted_rows: deletedCount,
      balance_subtracted: balanceSubtracted,
      tx_logs: txLogs,
      groups: duplicateGroups
    })
  } catch (error) {
    console.error('dedupe-kst-utc error:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// 어드민: 특정 날짜의 일일 배당 + 1대/2대 매칭수당 전체 회수 (잘못 지급된 휴일 배당 롤백용)
//   - daily_rewards 의 해당 reward_date 행 전부 삭제
//   - users.qkey_balance 에서 해당 금액 차감
//   - referral_rewards 의 해당 reward_date 행 전부 삭제
//   - users.qkey_balance 에서 매칭수당 금액 차감
//   - transactions 에 회수 로그 INSERT (type='daily_reward_rollback' / 'referral_reward_rollback')
app.post('/api/admin/rewards/rollback-daily', async (c) => {
  try {
    const db = c.env.DB
    const body = await c.req.json().catch(() => ({}))
    const targetDate = (body && body.date) ? String(body.date) : ''
    if (!targetDate || !/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
      return c.json({ error: 'date 파라미터(YYYY-MM-DD)가 필요합니다' }, 400)
    }

    // 1) 본인 일일 배당 회수
    const dailyRows = await db.prepare(
      `SELECT id, user_id, staking_id, usdt_amount FROM daily_rewards WHERE reward_date = ?`
    ).bind(targetDate).all()

    let dailyCount = 0
    let dailyQkeyTotal = 0
    for (const r of (dailyRows.results || [])) {
      const amt = Number(r.usdt_amount) || 0
      try {
        await db.prepare(`UPDATE users SET qkey_balance = qkey_balance - ? WHERE id = ?`).bind(amt, r.user_id).run()
        await db.prepare(`DELETE FROM daily_rewards WHERE id = ?`).bind(r.id).run()
        await db.prepare(`
          INSERT INTO transactions (user_id, type, coin_type, amount, description)
          VALUES (?, 'daily_reward_rollback', 'QKEY', ?, ?)
        `).bind(r.user_id, -amt, `[휴일 회수] ${targetDate} 일일배당 회수 (-${amt.toLocaleString()} QKEY, staking #${r.staking_id})`).run()
        dailyCount++
        dailyQkeyTotal += amt
      } catch (e) {
        console.error('daily rollback row error:', e)
      }
    }

    // 2) 매칭수당(1대/2대) 회수
    const refRows = await db.prepare(
      `SELECT id, referrer_id, referee_id, level, reward_amount FROM referral_rewards WHERE reward_date = ?`
    ).bind(targetDate).all()

    let refCount = 0
    let refQkeyTotal = 0
    for (const r of (refRows.results || [])) {
      const amt = Number(r.reward_amount) || 0
      try {
        await db.prepare(`UPDATE users SET qkey_balance = qkey_balance - ? WHERE id = ?`).bind(amt, r.referrer_id).run()
        await db.prepare(`DELETE FROM referral_rewards WHERE id = ?`).bind(r.id).run()
        await db.prepare(`
          INSERT INTO transactions (user_id, type, coin_type, amount, description)
          VALUES (?, 'referral_reward_rollback', 'QKEY', ?, ?)
        `).bind(r.referrer_id, -amt, `[휴일 회수] ${targetDate} Level ${r.level} 매칭수당 회수 (-${amt.toLocaleString()} QKEY, referee #${r.referee_id})`).run()
        refCount++
        refQkeyTotal += amt
      } catch (e) {
        console.error('referral rollback row error:', e)
      }
    }

    return c.json({
      success: true,
      message: `${targetDate} 배당 회수 완료. 본인 ${dailyCount}건(-${dailyQkeyTotal.toLocaleString()} QKEY), 매칭 ${refCount}건(-${refQkeyTotal.toLocaleString()} QKEY)`,
      date: targetDate,
      dailyRolledBack: dailyCount,
      dailyQkeyTotal,
      referralRolledBack: refCount,
      referralQkeyTotal: refQkeyTotal,
      grandTotalQkey: dailyQkeyTotal + refQkeyTotal
    })
  } catch (error) {
    console.error('Rollback daily error:', error)
    return c.json({ error: '배당 회수 처리 중 오류가 발생했습니다' }, 500)
  }
})

// 어드민: transactions.created_at 기준 기간 회수 (휴일/주말에 잘못 찍힌 daily_qkey + referral_reward 회수)
//   - direct_referral 은 즉시지급 정책이므로 회수 대상에서 제외
//   - daily_rewards / referral_rewards 테이블 행은 reward_date 기준이라 별개로 두고,
//     여기서는 transactions 행 자체를 음수 보전 + 잔액 차감만 처리한다.
//   - 사용 예: { "fromDate": "2026-05-01", "toDate": "2026-05-03" }
app.post('/api/admin/rewards/rollback-tx-range', async (c) => {
  try {
    const db = c.env.DB
    const body = await c.req.json().catch(() => ({}))
    const fromDate = body && body.fromDate ? String(body.fromDate) : ''
    const toDate = body && body.toDate ? String(body.toDate) : ''
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fromDate) || !/^\d{4}-\d{2}-\d{2}$/.test(toDate)) {
      return c.json({ error: 'fromDate/toDate (YYYY-MM-DD) 필요' }, 400)
    }

    // 회수 대상: daily_qkey + referral_reward (direct_referral 제외)
    // 단, 이미 회수 로그(daily_reward_rollback / referral_reward_rollback)가 있는 사용자/금액은
    // 한 번 더 빼면 마이너스가 되므로, 같은 기간 회수 로그가 있으면 net 양수만 회수.
    const rows = await db.prepare(
      `SELECT id, user_id, type, amount, description, created_at
       FROM transactions
       WHERE date(created_at, '+9 hours') BETWEEN ? AND ?
         AND type IN ('daily_qkey','referral_reward')
       ORDER BY id`
    ).bind(fromDate, toDate).all()

    // 같은 기간에 이미 발생한 롤백 합계 (사용자별)
    const existingRollbacks = await db.prepare(
      `SELECT user_id, SUM(amount) as rolled
       FROM transactions
       WHERE date(created_at, '+9 hours') BETWEEN ? AND ?
         AND type IN ('daily_reward_rollback','referral_reward_rollback')
       GROUP BY user_id`
    ).bind(fromDate, toDate).all()
    const rolledMap: Record<string, number> = {}
    for (const r of (existingRollbacks.results || [])) {
      rolledMap[String(r.user_id)] = Number(r.rolled) || 0
    }

    // 회수해야 할 사용자별 amount 합계 (양수)
    const toRollback: Record<string, { daily: number; ref: number; ids: number[] }> = {}
    for (const r of (rows.results || [])) {
      const uid = String(r.user_id)
      if (!toRollback[uid]) toRollback[uid] = { daily: 0, ref: 0, ids: [] }
      const amt = Number(r.amount) || 0
      if (r.type === 'daily_qkey') toRollback[uid].daily += amt
      else if (r.type === 'referral_reward') toRollback[uid].ref += amt
      toRollback[uid].ids.push(Number(r.id))
    }

    let processedUsers = 0
    let totalDailyQkey = 0
    let totalRefQkey = 0
    const details: any[] = []

    for (const uid in toRollback) {
      const d = toRollback[uid]
      const grossPaid = d.daily + d.ref
      const alreadyRolled = -1 * (rolledMap[uid] || 0) // 롤백은 음수로 저장되므로 부호 반전 (양수=이미 회수된 금액)
      const netToRollback = Math.max(0, grossPaid - alreadyRolled)
      if (netToRollback <= 0) {
        details.push({ user_id: Number(uid), grossPaid, alreadyRolled, netToRollback, skipped: 'already_rolled' })
        continue
      }
      // daily / ref 비율로 분배
      const ratio = grossPaid > 0 ? d.daily / grossPaid : 0
      const dailyPart = Math.round(netToRollback * ratio)
      const refPart = netToRollback - dailyPart
      try {
        await db.prepare(`UPDATE users SET qkey_balance = qkey_balance - ? WHERE id = ?`).bind(netToRollback, Number(uid)).run()
        if (dailyPart > 0) {
          await db.prepare(`
            INSERT INTO transactions (user_id, type, coin_type, amount, description)
            VALUES (?, 'daily_reward_rollback', 'QKEY', ?, ?)
          `).bind(Number(uid), -dailyPart, `[휴일 회수] ${fromDate}~${toDate} 일일배당 회수 (-${dailyPart.toLocaleString()} QKEY)`).run()
          totalDailyQkey += dailyPart
        }
        if (refPart > 0) {
          await db.prepare(`
            INSERT INTO transactions (user_id, type, coin_type, amount, description)
            VALUES (?, 'referral_reward_rollback', 'QKEY', ?, ?)
          `).bind(Number(uid), -refPart, `[휴일 회수] ${fromDate}~${toDate} 매칭수당 회수 (-${refPart.toLocaleString()} QKEY)`).run()
          totalRefQkey += refPart
        }
        processedUsers++
        details.push({ user_id: Number(uid), grossPaid, alreadyRolled, netToRollback, dailyPart, refPart })
      } catch (e) {
        console.error('rollback-tx-range error for user', uid, e)
      }
    }

    return c.json({
      success: true,
      fromDate,
      toDate,
      processedUsers,
      totalDailyQkey,
      totalRefQkey,
      grandTotalQkey: totalDailyQkey + totalRefQkey,
      details
    })
  } catch (error) {
    console.error('rollback-tx-range error:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// 어드민: 기간 내 사용자별 net 정합성 자동 보정
//   - paid (daily_qkey + referral_reward) 합계 vs rollback 합계 비교
//   - net > 0 (미회수): qkey_balance 추가 차감 + 음수 트랜잭션 INSERT
//   - net < 0 (과회수): qkey_balance 복구 가산 + 양수 트랜잭션 INSERT
app.post('/api/admin/rewards/reconcile-tx-range', async (c) => {
  try {
    const db = c.env.DB
    const body = await c.req.json().catch(() => ({}))
    const fromDate = body && body.fromDate ? String(body.fromDate) : ''
    const toDate = body && body.toDate ? String(body.toDate) : ''
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fromDate) || !/^\d{4}-\d{2}-\d{2}$/.test(toDate)) {
      return c.json({ error: 'fromDate/toDate (YYYY-MM-DD) 필요' }, 400)
    }

    const paidRows = await db.prepare(
      `SELECT user_id, COALESCE(SUM(amount), 0) as total
       FROM transactions
       WHERE date(created_at, '+9 hours') BETWEEN ? AND ?
         AND type IN ('daily_qkey','referral_reward')
       GROUP BY user_id`
    ).bind(fromDate, toDate).all()

    const rolledRows = await db.prepare(
      `SELECT user_id, COALESCE(SUM(amount), 0) as total
       FROM transactions
       WHERE date(created_at, '+9 hours') BETWEEN ? AND ?
         AND type IN ('daily_reward_rollback','referral_reward_rollback','rollback_restore')
       GROUP BY user_id`
    ).bind(fromDate, toDate).all()

    const paidMap: Record<string, number> = {}
    for (const r of (paidRows.results || [])) paidMap[String(r.user_id)] = Number(r.total) || 0
    const rolledMap: Record<string, number> = {}
    for (const r of (rolledRows.results || [])) rolledMap[String(r.user_id)] = Number(r.total) || 0

    const allUids = new Set([...Object.keys(paidMap), ...Object.keys(rolledMap)])
    const details: any[] = []
    let underAdjustedCount = 0
    let overAdjustedCount = 0
    let totalUnderQkey = 0
    let totalOverQkey = 0

    for (const uid of allUids) {
      const paid = paidMap[uid] || 0
      const rolled = rolledMap[uid] || 0
      const net = paid + rolled
      if (net === 0) {
        details.push({ user_id: Number(uid), paid, rolled, net, action: 'ok' })
        continue
      }
      try {
        if (net > 0) {
          await db.prepare(`UPDATE users SET qkey_balance = qkey_balance - ? WHERE id = ?`).bind(net, Number(uid)).run()
          await db.prepare(`
            INSERT INTO transactions (user_id, type, coin_type, amount, description)
            VALUES (?, 'daily_reward_rollback', 'QKEY', ?, ?)
          `).bind(Number(uid), -net, `[정합성 보정] ${fromDate}~${toDate} 잔여 미회수 차감 (-${net.toLocaleString()} QKEY)`).run()
          underAdjustedCount++
          totalUnderQkey += net
          details.push({ user_id: Number(uid), paid, rolled, net, action: 'deducted', amount: net })
        } else {
          const restoreAmt = -net
          await db.prepare(`UPDATE users SET qkey_balance = qkey_balance + ? WHERE id = ?`).bind(restoreAmt, Number(uid)).run()
          await db.prepare(`
            INSERT INTO transactions (user_id, type, coin_type, amount, description)
            VALUES (?, 'rollback_restore', 'QKEY', ?, ?)
          `).bind(Number(uid), restoreAmt, `[정합성 보정] ${fromDate}~${toDate} 과회수 복구 (+${restoreAmt.toLocaleString()} QKEY)`).run()
          overAdjustedCount++
          totalOverQkey += restoreAmt
          details.push({ user_id: Number(uid), paid, rolled, net, action: 'restored', amount: restoreAmt })
        }
      } catch (e) {
        console.error('reconcile error for user', uid, e)
        details.push({ user_id: Number(uid), paid, rolled, net, action: 'error', error: String(e) })
      }
    }

    return c.json({
      success: true,
      fromDate,
      toDate,
      underAdjustedCount,
      totalUnderQkey,
      overAdjustedCount,
      totalOverQkey,
      netDelta: totalUnderQkey - totalOverQkey,
      details
    })
  } catch (error) {
    console.error('reconcile-tx-range error:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// 어드민: B-3 강화판 — 휴일 양수 행 100% 삭제 + 동일 금액 음수 매칭 삭제 + 잔여 음수 통합
//   1) positiveDates 의 양수 행(daily_qkey, referral_reward)을 사용자별로 모두 삭제
//   2) 사용자별 삭제된 양수 합계만큼, negativeDates 의 음수 회수 행에서 동일 금액으로 매칭하여 삭제
//      - 동일 금액 매칭 우선 (1:1)
//      - 동일 금액으로 못 채우면, 가장 큰 음수 행부터 부분 매칭 (전체 삭제 또는 일부 삭제 + 차액은 신규 보정 행)
//   3) 페어 매칭 후 남은 음수 잔여분은 사용자당 단일 [잔액 보정] 행 1개로 통합 (description만 변경, 금액 합산)
//   ★ direct_referral 은 type 필터에서 완전 제외 → 직접판매 수당은 절대 건드리지 않음
//   ★ dryRun=true 시 미리보기만
app.post('/api/admin/rewards/pair-purge-tx', async (c) => {
  try {
    const db = c.env.DB
    const body = await c.req.json().catch(() => ({}))
    const positiveDates: string[] = Array.isArray(body?.positiveDates) ? body.positiveDates : []
    const negativeDates: string[] = Array.isArray(body?.negativeDates) ? body.negativeDates : []
    const dryRun: boolean = body?.dryRun === true
    const renameOrphans: boolean = body?.renameOrphans !== false // 기본 true
    if (positiveDates.length === 0 || negativeDates.length === 0) {
      return c.json({ error: 'positiveDates, negativeDates 배열이 모두 필요합니다' }, 400)
    }

    // 1. 양수 후보: positiveDates KST 기준, daily_qkey + referral_reward (양수만)
    const posDateClause = positiveDates.map(() => `substr(datetime(created_at,'+9 hours'),1,10) = ?`).join(' OR ')
    const positives = await db.prepare(`
      SELECT id, user_id, type, amount, description, created_at
      FROM transactions
      WHERE type IN ('daily_qkey','referral_reward')
        AND coin_type = 'QKEY'
        AND amount > 0
        AND (${posDateClause})
      ORDER BY user_id, amount DESC, id ASC
    `).bind(...positiveDates).all()

    // 2. 회수/복구 후보: negativeDates KST 기준
    //    - daily_reward_rollback / referral_reward_rollback (음수) → 회수 행
    //    - rollback_restore (양수) → 과회수 복구 행 (이것도 잔액 차감 매칭 후보로 사용)
    //    잔액 변화 0 보장을 위해 양수+음수 모두 후보로 잡음.
    //    "음수 매칭" 처리 시 절댓값 기준이 아니라 amount 그대로 사용:
    //      양수 삭제로 줄어드는 잔액(posSum) = 회수(음수)+복구(양수) 합산해서 동일 부호로 상쇄해야 함
    //    → 실제 의미: 양수합 만큼 "(-회수-복구)"의 합이 -posSum 이 되도록 매칭 삭제하면 잔액 변화 0
    //    구현 단순화: 후보 행 amount 합 = -posSum 이 되도록 매칭하여 삭제
    const negDateClause = negativeDates.map(() => `substr(datetime(created_at,'+9 hours'),1,10) = ?`).join(' OR ')
    const negatives = await db.prepare(`
      SELECT id, user_id, type, amount, description, created_at
      FROM transactions
      WHERE type IN ('daily_reward_rollback','referral_reward_rollback','rollback_restore')
        AND coin_type = 'QKEY'
        AND (${negDateClause})
      ORDER BY user_id, amount ASC, id ASC
    `).bind(...negativeDates).all()

    // 3. 사용자별로 양수/음수 그룹화 (★ direct_referral 은 type 필터로 이미 제외됨)
    const posByUser: Record<number, any[]> = {}
    const negByUser: Record<number, any[]> = {}
    for (const r of (positives.results || []) as any[]) {
      const u = Number(r.user_id)
      if (!posByUser[u]) posByUser[u] = []
      posByUser[u].push(r)
    }
    for (const r of (negatives.results || []) as any[]) {
      const u = Number(r.user_id)
      if (!negByUser[u]) negByUser[u] = []
      negByUser[u].push(r)
    }

    // 4. B-3 강화판 (A안) — 사용자별 처리
    //    (1) 양수 행(5/1·5/3 daily_qkey + referral_reward) 100% 삭제 대상
    //    (2) 삭제로 줄어드는 잔액(posSum)을 5/4 회수/복구 후보 행들의 amount 합산으로 정확히 -posSum 만큼 매칭 삭제
    //        - 후보 amount 합 = -posSum 이 되도록 (음수 회수 + 양수 복구 모두 사용)
    //        - 그리디 알고리즘: |posSum + sumDeleted| 가 0 에 수렴하도록 반복 선택
    //    (3) 잔여 후보(삭제 안 된 행)는 사용자당 단일 [잔액 보정] 행 1개로 통합 (description + amount 합산)
    //    ★ 잔액 변화 0 보장: posSum + (삭제된 후보 amount 합) = 0
    //    ★ direct_referral 절대 미손상 (type 필터 제외)
    const allUserIds = new Set<number>([...Object.keys(posByUser).map(Number), ...Object.keys(negByUser).map(Number)])
    const userPlan: any[] = []   // 계획 수립용
    const userSummary: any[] = []

    for (const uid of Array.from(allUserIds)) {
      const posList = (posByUser[uid] || []).slice()
      const candList = (negByUser[uid] || []).slice() // 회수(-) + 복구(+) 후보
      const posSum = posList.reduce((s:number,p:any)=>s+Number(p.amount), 0)        // 양수 합 (삭제될 +)
      const candSumRaw = candList.reduce((s:number,c:any)=>s+Number(c.amount), 0)   // 후보 amount 합 (음수+양수 그대로)

      // 목표: 후보들 중에서 amount 합 = -posSum 이 되도록 부분집합을 골라 삭제
      //   현재 잔액 영향: 양수 행 삭제로 -posSum, 후보 행 삭제로 -(amount 합)
      //   잔액 변화 = -posSum - (삭제된 후보 amount 합) → 0 이려면 (삭제된 후보 amount 합) = -posSum
      //   즉 sumDeletedCandidates 가 -posSum 이 되어야 함
      const target = -posSum
      const candToDelete: any[] = []
      const candToKeep: any[] = []
      const usedIds = new Set<number>()
      let remaining = target  // 남은 목표값 (점차 0 으로 수렴)

      // 1차: 정확 매칭 — 양수 행 각각에 대해 amount = -p.amount 인 후보 우선 (= 음수 회수 행 절댓값 동일)
      const candByAmt: Record<string, any[]> = {}
      for (const c of candList) {
        const k = String(Math.round(Number(c.amount)))
        if (!candByAmt[k]) candByAmt[k] = []
        candByAmt[k].push(c)
      }
      for (const p of posList) {
        const need = -Number(p.amount)
        const k = String(Math.round(need))
        const bucket = candByAmt[k] || []
        const c = bucket.shift()
        if (c && !usedIds.has(Number(c.id))) {
          usedIds.add(Number(c.id))
          candToDelete.push(c)
          remaining -= Number(c.amount)
        }
      }

      // 2차: 그리디 — 남은 후보 중에서 |remaining - amount| 가 가장 작아지는 행을 반복 선택
      //   remaining 이 0 에 수렴하도록 (개선 없으면 즉시 종료)
      const epsilon = 0.5
      let safety = 0
      while (Math.abs(remaining) > epsilon && safety < 1000) {
        safety++
        let bestIdx = -1
        let bestAfterAbs = Math.abs(remaining)
        for (let i = 0; i < candList.length; i++) {
          const c = candList[i]
          if (usedIds.has(Number(c.id))) continue
          const after = remaining - Number(c.amount)
          const afterAbs = Math.abs(after)
          if (afterAbs < bestAfterAbs - epsilon) {
            bestAfterAbs = afterAbs
            bestIdx = i
          }
        }
        if (bestIdx < 0) break
        const c = candList[bestIdx]
        usedIds.add(Number(c.id))
        candToDelete.push(c)
        remaining -= Number(c.amount)
      }

      // 3차 (A2안 핵심): 잔여가 여전히 0이 아니면 — 잔여 후보 중 amount 부호가 remaining 과 같은 행 1건을 찾아 분할
      //   분할 split 행 1건 (amount = remaining) 을 신규 INSERT 후 즉시 삭제로 처리
      //   원래 후보 행은 amount = (원래 amount - remaining) 으로 UPDATE → orphan(통합 대상)에 잔류
      //   ※ remaining 부호와 동일한 부호의 후보 행이 있어야 분할 가능 (절댓값이 |remaining| 이상)
      let splitPlan: any = null  // {srcId, srcOriginalAmount, srcNewAmount, splitAmount}
      if (Math.abs(remaining) > epsilon) {
        const need = remaining // 부호 포함 — 이만큼 더 삭제해야 변화 0
        let bestSplitIdx = -1
        let bestSplitAbsRemainder = Infinity
        for (let i = 0; i < candList.length; i++) {
          const c = candList[i]
          if (usedIds.has(Number(c.id))) continue
          const a = Number(c.amount)
          // 분할 가능 조건: 부호가 같고, |a| > |need| (잔여가 남아야 통합 가능, 또는 같으면 분할 불필요였음)
          if ((a > 0 && need > 0 && a > need + epsilon) || (a < 0 && need < 0 && a < need - epsilon)) {
            const remainderAfter = a - need
            const absRem = Math.abs(remainderAfter)
            if (absRem < bestSplitAbsRemainder) {
              bestSplitAbsRemainder = absRem
              bestSplitIdx = i
            }
          }
        }
        if (bestSplitIdx >= 0) {
          const src = candList[bestSplitIdx]
          const srcAmt = Number(src.amount)
          splitPlan = {
            srcId: Number(src.id),
            srcOriginalAmount: srcAmt,
            srcNewAmount: srcAmt - need,   // 잔여로 남길 부분
            splitAmount: need,             // 분할 후 즉시 삭제 처리할 가상 행 amount
            srcType: String(src.type),
            srcCreatedAt: String(src.created_at)
          }
          // src 행은 분할 후 잔여(orphan 통합 대상)에 들어감 — usedIds 에 넣지 않음
          remaining = 0
        }
      }

      // 잔여 후보 = 삭제되지 않은 후보 (분할된 src 행도 잔여에 포함됨, amount 는 srcNewAmount 로 간주)
      for (const c of candList) {
        if (usedIds.has(Number(c.id))) continue
        if (splitPlan && Number(c.id) === splitPlan.srcId) {
          // 분할된 행 — 잔여에는 srcNewAmount 로 포함됨
          candToKeep.push({ ...c, amount: splitPlan.srcNewAmount, _splitFrom: splitPlan.srcOriginalAmount })
        } else {
          candToKeep.push(c)
        }
      }
      const candDeleteAmtSum = candToDelete.reduce((s:number,c:any)=>s+Number(c.amount), 0) + (splitPlan ? splitPlan.splitAmount : 0)
      // 잔액 변화 = -posSum - candDeleteAmtSum  →  0 이어야 안전
      const balanceDeltaForUser = -posSum - candDeleteAmtSum
      // 잔여 후보 통합 (description 통합 + 금액 합산하여 1행만 남기고 나머지는 삭제)
      const orphanSum = candToKeep.reduce((s:number,c:any)=>s+Number(c.amount), 0)
      const consolidateMasterId = candToKeep.length > 0 ? Number(candToKeep[0].id) : null
      const consolidateDeleteIds = candToKeep.length > 1 ? candToKeep.slice(1).map((c:any)=>Number(c.id)) : []

      userPlan.push({
        user_id: uid,
        posIds: posList.map((p:any)=>Number(p.id)),
        negDeleteIds: candToDelete.map((c:any)=>Number(c.id)),
        splitPlan,
        consolidateMasterId,
        consolidateDeleteIds,
        orphanSum,
        balanceDeltaForUser
      })
      userSummary.push({
        user_id: uid,
        positive_count: posList.length,
        positive_sum: posSum,
        candidate_count: candList.length,
        candidate_sum_raw: candSumRaw,
        deleted_positive_count: posList.length,
        deleted_candidate_count: candToDelete.length,
        deleted_candidate_amount_sum: candDeleteAmtSum,
        split_applied: splitPlan ? true : false,
        split_amount: splitPlan ? splitPlan.splitAmount : 0,
        balance_delta: balanceDeltaForUser,
        orphan_consolidated_sum: orphanSum,
        orphan_consolidated_count_deleted: consolidateDeleteIds.length,
        orphan_master_id: consolidateMasterId
      })
    }

    // 잔액 변화 0 검증 (전체 합)
    const totalDelta = userSummary.reduce((s:number,u:any)=>s+u.balance_delta, 0)
    const usersWithDelta = userSummary.filter((u:any)=>Math.abs(u.balance_delta) > 0.5).map((u:any)=>({user_id:u.user_id, delta:u.balance_delta}))

    if (dryRun) {
      return c.json({
        success: true,
        dryRun: true,
        mode: 'B3-A2',
        positiveDates,
        negativeDates,
        totalPositiveRows: (positives.results || []).length,
        totalNegativeRows: (negatives.results || []).length,
        userCount: userSummary.length,
        totalBalanceDelta: totalDelta,
        usersWithBalanceDelta: usersWithDelta,
        plannedPositiveDeletes: userPlan.reduce((s:number,p:any)=>s+p.posIds.length, 0),
        plannedNegativeMatchedDeletes: userPlan.reduce((s:number,p:any)=>s+p.negDeleteIds.length, 0),
        plannedConsolidationDeletes: userPlan.reduce((s:number,p:any)=>s+p.consolidateDeleteIds.length, 0),
        plannedConsolidationMasters: userPlan.filter((p:any)=>p.consolidateMasterId !== null).length,
        plannedSplits: userPlan.filter((p:any)=>p.splitPlan).length,
        perUserSummary: userSummary
      })
    }

    // ★ 실삭제 전 마지막 안전장치: 잔액 변화가 0이 아니면 중단
    if (Math.abs(totalDelta) > 0.5 || usersWithDelta.length > 0) {
      return c.json({
        success: false,
        error: '잔액 변화 0 검증 실패 — 실삭제 중단됨',
        totalBalanceDelta: totalDelta,
        usersWithBalanceDelta: usersWithDelta,
        perUserSummary: userSummary
      }, 400)
    }

    // 5. 실삭제 수행
    const CHUNK = 50
    let deletedPositives = 0
    let deletedNegMatched = 0
    let consolidatedDeleted = 0
    let consolidatedUpdated = 0
    let splitApplied = 0

    for (const plan of userPlan) {
      // (a) 양수 행 삭제
      if (plan.posIds.length > 0) {
        for (let i = 0; i < plan.posIds.length; i += CHUNK) {
          const chunk = plan.posIds.slice(i, i + CHUNK)
          const ph = chunk.map(() => '?').join(',')
          const r = await db.prepare(`DELETE FROM transactions WHERE id IN (${ph})`).bind(...chunk).run()
          deletedPositives += (r.meta?.changes || 0)
        }
      }
      // (b) 매칭된 음수/복구 후보 삭제
      if (plan.negDeleteIds.length > 0) {
        for (let i = 0; i < plan.negDeleteIds.length; i += CHUNK) {
          const chunk = plan.negDeleteIds.slice(i, i + CHUNK)
          const ph = chunk.map(() => '?').join(',')
          const r = await db.prepare(`DELETE FROM transactions WHERE id IN (${ph})`).bind(...chunk).run()
          deletedNegMatched += (r.meta?.changes || 0)
        }
      }
      // (b-2) 분할 적용: src 행을 srcNewAmount 로 UPDATE (분할된 splitAmount 만큼은 잔액 변화로 흡수됨)
      //       이 행은 이후 (c) 통합 단계에서 master 가 되거나 통합으로 흡수됨
      if (plan.splitPlan) {
        const sp = plan.splitPlan
        const ru = await db.prepare(`
          UPDATE transactions
          SET amount = ?, description = COALESCE(description,'') || ' [분할]'
          WHERE id = ?
        `).bind(sp.srcNewAmount, sp.srcId).run()
        splitApplied += (ru.meta?.changes || 0)
      }
      // (c) 잔여 후보 통합 — master 1행에 합산 amount + description 통합, 나머지 삭제
      //     ★ orphanSum 은 splitPlan 의 srcNewAmount 가 이미 반영된 값 (계획 단계에서 candToKeep 에 srcNewAmount 로 push)
      if (plan.consolidateMasterId !== null && renameOrphans) {
        if (Math.abs(plan.orphanSum) > 0.5) {
          // 통합 amount 가 0 이 아니면 master 행을 보정용으로 사용
          const ru = await db.prepare(`
            UPDATE transactions
            SET amount = ?, description = '[잔액 보정] 휴일 회수 잔여분 통합'
            WHERE id = ?
          `).bind(plan.orphanSum, plan.consolidateMasterId).run()
          consolidatedUpdated += (ru.meta?.changes || 0)
        } else {
          // 통합 amount 가 0 이면 master 까지 삭제 (사용자에게 0 행 표시 방지)
          const r = await db.prepare(`DELETE FROM transactions WHERE id = ?`).bind(plan.consolidateMasterId).run()
          consolidatedDeleted += (r.meta?.changes || 0)
        }
        // delete others
        if (plan.consolidateDeleteIds.length > 0) {
          for (let i = 0; i < plan.consolidateDeleteIds.length; i += CHUNK) {
            const chunk = plan.consolidateDeleteIds.slice(i, i + CHUNK)
            const ph = chunk.map(() => '?').join(',')
            const r = await db.prepare(`DELETE FROM transactions WHERE id IN (${ph})`).bind(...chunk).run()
            consolidatedDeleted += (r.meta?.changes || 0)
          }
        }
      }
    }

    return c.json({
      success: true,
      dryRun: false,
      mode: 'B3-enhanced',
      positiveDates,
      negativeDates,
      userCount: userSummary.length,
      totalBalanceDelta: totalDelta,
      deletedPositives,
      deletedNegMatched,
      consolidatedUpdated,
      consolidatedDeleted,
      perUserSummary: userSummary
    })
  } catch (error) {
    console.error('pair-purge-tx error:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// 어드민: 휴일 잘못 지급/회수 트랜잭션 흔적 완전 삭제 (5/1, 5/3 등)
//   - 안전장치: 사용자별 net=0 인 경우에만 삭제 (잔액 변화 0 보장)
//   - 대상 type: daily_qkey, referral_reward, daily_reward_rollback, referral_reward_rollback, rollback_restore
//   - 제외 type: direct_referral (직접판매는 즉시 지급되어 회수 대상 아님)
//   - dryRun=true 시 삭제하지 않고 영향 사용자/행 미리보기만 반환
app.post('/api/admin/rewards/purge-tx-by-dates', async (c) => {
  try {
    const db = c.env.DB
    const body = await c.req.json().catch(() => ({}))
    const dates: string[] = Array.isArray(body?.dates) ? body.dates : []
    const dryRun: boolean = body?.dryRun === true
    const includeRollbackCreatedDates: string[] = Array.isArray(body?.rollbackCreatedDates) ? body.rollbackCreatedDates : []
    if (dates.length === 0) return c.json({ error: 'dates 배열이 필요합니다 (예: ["2026-05-01","2026-05-03"])' }, 400)

    // 대상 type
    const TYPES = ['daily_qkey', 'referral_reward', 'daily_reward_rollback', 'referral_reward_rollback', 'rollback_restore']
    const placeholders = TYPES.map(() => '?').join(',')

    // 1. 양수 행: dates 의 created_at(KST date) 기준
    //    SQLite: substr(datetime(created_at,'+9 hours'),1,10) = ?
    const datePredicates = dates.map(() => `substr(datetime(created_at,'+9 hours'),1,10) = ?`).join(' OR ')

    // 2. 회수/복구 행: rollbackCreatedDates 의 created_at 기준 (없으면 동일 dates 사용)
    const rollbackDates = includeRollbackCreatedDates.length > 0 ? includeRollbackCreatedDates : dates
    const rollbackDatePredicates = rollbackDates.map(() => `substr(datetime(created_at,'+9 hours'),1,10) = ?`).join(' OR ')

    // 양수 후보
    const positiveQuery = `
      SELECT id, user_id, type, amount, description, created_at
      FROM transactions
      WHERE type IN (${placeholders})
        AND coin_type = 'QKEY'
        AND amount >= 0
        AND (${datePredicates})
    `
    const positiveParams: any[] = [...TYPES, ...dates]
    const positives = await db.prepare(positiveQuery).bind(...positiveParams).all()

    // 음수(회수) + rollback_restore 후보
    const negativeQuery = `
      SELECT id, user_id, type, amount, description, created_at
      FROM transactions
      WHERE type IN ('daily_reward_rollback','referral_reward_rollback','rollback_restore')
        AND coin_type = 'QKEY'
        AND (
          (${rollbackDatePredicates})
          OR description LIKE '%2026-05-01%'
          OR description LIKE '%2026-05-02%'
          OR description LIKE '%2026-05-03%'
          OR description LIKE '%5/1%'
          OR description LIKE '%5/3%'
        )
    `
    const negativeParams: any[] = [...rollbackDates]
    const negatives = await db.prepare(negativeQuery).bind(...negativeParams).all()

    // 사용자별 집계
    const perUser: Record<number, { positives: any[], negatives: any[], posSum: number, negSum: number }> = {}
    for (const r of (positives.results || []) as any[]) {
      // direct_referral 제외 보장 (이미 type 필터로 제외되어 있음)
      const uid = Number(r.user_id)
      if (!perUser[uid]) perUser[uid] = { positives: [], negatives: [], posSum: 0, negSum: 0 }
      perUser[uid].positives.push(r)
      perUser[uid].posSum += Number(r.amount) || 0
    }
    for (const r of (negatives.results || []) as any[]) {
      const uid = Number(r.user_id)
      if (!perUser[uid]) perUser[uid] = { positives: [], negatives: [], posSum: 0, negSum: 0 }
      perUser[uid].negatives.push(r)
      perUser[uid].negSum += Number(r.amount) || 0
    }

    const summary: any[] = []
    const eligibleIds: number[] = []
    const skippedUsers: any[] = []
    for (const uidStr of Object.keys(perUser)) {
      const uid = Number(uidStr)
      const u = perUser[uid]
      const net = u.posSum + u.negSum // negSum already negative
      const eligible = Math.abs(net) < 0.5
      summary.push({
        user_id: uid,
        positive_count: u.positives.length,
        positive_sum: u.posSum,
        negative_count: u.negatives.length,
        negative_sum: u.negSum,
        net,
        eligible
      })
      if (eligible) {
        for (const p of u.positives) eligibleIds.push(Number(p.id))
        for (const n of u.negatives) eligibleIds.push(Number(n.id))
      } else {
        skippedUsers.push({ user_id: uid, net, reason: 'net != 0' })
      }
    }

    if (dryRun) {
      return c.json({
        success: true,
        dryRun: true,
        dates,
        rollbackDates,
        totalPositiveRows: (positives.results || []).length,
        totalNegativeRows: (negatives.results || []).length,
        eligibleUsers: summary.filter((s:any) => s.eligible).length,
        skippedUsers: skippedUsers.length,
        deletableRowCount: eligibleIds.length,
        perUserSummary: summary,
        skipped: skippedUsers
      })
    }

    // 실제 삭제
    let deleted = 0
    if (eligibleIds.length > 0) {
      // 청크로 나눠 IN 절 길이 제한 회피
      const CHUNK = 50
      for (let i = 0; i < eligibleIds.length; i += CHUNK) {
        const chunk = eligibleIds.slice(i, i + CHUNK)
        const ph = chunk.map(() => '?').join(',')
        const r = await db.prepare(`DELETE FROM transactions WHERE id IN (${ph})`).bind(...chunk).run()
        deleted += (r.meta?.changes || 0)
      }
    }

    return c.json({
      success: true,
      dryRun: false,
      dates,
      rollbackDates,
      totalPositiveRows: (positives.results || []).length,
      totalNegativeRows: (negatives.results || []).length,
      eligibleUsers: summary.filter((s:any) => s.eligible).length,
      skippedUsers: skippedUsers.length,
      deletedRowCount: deleted,
      perUserSummary: summary,
      skipped: skippedUsers
    })
  } catch (error) {
    console.error('purge-tx-by-dates error:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// 어드민: 특정 컷오프(KST) 이후 거래 전부 삭제 + 잔액 재계산
//   - 사장님 명령: 4/30까지만 남기고 5/1 이후 모든 보상/회수/복구/보정 행 삭제
//   - 대상 type: 모든 type (daily_qkey, referral_reward, direct_referral,
//                daily_reward_rollback, referral_reward_rollback, rollback_restore 포함)
//   - 적용 컷오프: KST 기준 substr(datetime(created_at,'+9 hours'),1,10) > cutoffDate
//   - 잔액 처리: 삭제 후 users.qkey_balance = SUM(remaining tx.amount WHERE coin_type='QKEY')
//                (= 4/30까지의 정상 잔액으로 자동 복원)
//   - dryRun=true 시 영향 범위만 미리보기 반환
app.post('/api/admin/rewards/purge-after-date', async (c) => {
  try {
    const db = c.env.DB
    const body = await c.req.json().catch(() => ({}))
    const { cutoffDate, dryRun, coinType, excludeTypes } = body || {}
    if (!cutoffDate) return c.json({ error: 'cutoffDate 가 필요합니다 (예: "2026-04-30")' }, 400)
    const ct = String(coinType || 'QKEY')
    // 옵션 2: 직판/스테이킹 보존 — excludeTypes 지정 시 해당 type 은 삭제 대상에서 제외
    const excludeList: string[] = Array.isArray(excludeTypes) ? excludeTypes.map(String) : []
    const excludeClause = excludeList.length > 0
      ? ` AND type NOT IN (${excludeList.map(()=>'?').join(',')})`
      : ''

    // 1. 삭제 대상 조회 (KST 기준 cutoffDate 초과, excludeTypes 제외)
    const targets = await db.prepare(`
      SELECT id, user_id, type, coin_type, amount, description, created_at
      FROM transactions
      WHERE coin_type = ?
        AND substr(datetime(created_at,'+9 hours'),1,10) > ?
        ${excludeClause}
      ORDER BY user_id, created_at ASC
    `).bind(ct, String(cutoffDate), ...excludeList).all()
    const targetRows = (targets.results || []) as any[]

    // 2. 사용자별 영향 집계
    const byUser: Record<number, any> = {}
    for (const r of targetRows) {
      const u = Number(r.user_id)
      if (!byUser[u]) byUser[u] = { user_id: u, count: 0, sum: 0, by_type: {} }
      byUser[u].count++
      byUser[u].sum += Number(r.amount) || 0
      const t = String(r.type || '')
      byUser[u].by_type[t] = (byUser[u].by_type[t] || 0) + 1
    }

    // 3. 사용자별 4/30까지 잔액 합계(보존되는 행 합)
    const survived = await db.prepare(`
      SELECT user_id, COALESCE(SUM(amount),0) as kept_sum, COUNT(*) as kept_count
      FROM transactions
      WHERE coin_type = ?
        AND substr(datetime(created_at,'+9 hours'),1,10) <= ?
      GROUP BY user_id
    `).bind(ct, String(cutoffDate)).all()
    const keptByUser: Record<number, any> = {}
    for (const r of (survived.results || []) as any[]) {
      keptByUser[Number(r.user_id)] = { kept_sum: Number(r.kept_sum) || 0, kept_count: Number(r.kept_count) || 0 }
    }

    // 4. 현재 사용자 잔액 + 새 잔액(=kept_sum) 비교
    const userIds = Array.from(new Set([
      ...Object.keys(byUser).map(Number),
      ...Object.keys(keptByUser).map(Number)
    ]))
    const summary: any[] = []
    for (const uid of userIds) {
      const cur = await db.prepare(`SELECT id, email, name, qkey_balance FROM users WHERE id = ?`).bind(uid).first()
      if (!cur) continue
      const kept = keptByUser[uid] || { kept_sum: 0, kept_count: 0 }
      const tgt = byUser[uid] || { count: 0, sum: 0, by_type: {} }
      summary.push({
        user_id: uid,
        email: (cur as any).email,
        name: (cur as any).name,
        current_qkey_balance: Number((cur as any).qkey_balance) || 0,
        new_qkey_balance: kept.kept_sum,                  // 삭제 후 잔액
        balance_change: kept.kept_sum - (Number((cur as any).qkey_balance) || 0),
        delete_count: tgt.count,
        delete_sum: tgt.sum,
        delete_by_type: tgt.by_type,
        kept_count: kept.kept_count,
        kept_sum: kept.kept_sum
      })
    }
    summary.sort((a:any,b:any)=>a.user_id-b.user_id)

    if (dryRun) {
      return c.json({
        success: true,
        dryRun: true,
        cutoffDate,
        coinType: ct,
        totalDeleteRows: targetRows.length,
        totalDeleteSum: targetRows.reduce((s,r)=>s+(Number(r.amount)||0),0),
        affectedUserCount: summary.length,
        perUserSummary: summary
      })
    }

    // 5. 실삭제 — 청크 단위 batch
    const CHUNK = 100
    let deleted = 0
    const ids = targetRows.map(r => Number(r.id))
    for (let i = 0; i < ids.length; i += CHUNK) {
      const ch = ids.slice(i, i + CHUNK)
      const ph = ch.map(()=>'?').join(',')
      const r = await db.prepare(`DELETE FROM transactions WHERE id IN (${ph})`).bind(...ch).run()
      deleted += (r.meta?.changes || 0)
    }

    // 6. 사용자 잔액 동기화 — 각 사용자 qkey_balance = kept_sum
    let updatedUsers = 0
    for (const s of summary) {
      const r = await db.prepare(`UPDATE users SET qkey_balance = ? WHERE id = ?`)
        .bind(s.new_qkey_balance, s.user_id).run()
      updatedUsers += (r.meta?.changes || 0)
    }

    return c.json({
      success: true,
      dryRun: false,
      cutoffDate,
      coinType: ct,
      deletedRows: deleted,
      updatedUsers,
      affectedUserCount: summary.length,
      perUserSummary: summary
    })
  } catch (error) {
    console.error('purge-after-date error:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// 어드민: 사용자 QKEY 잔액 임의 수정 + admin_adjustment 거래 자동 기록
//   - body: { userId, amount, description?, mode? }
//     amount: 양수면 가산, 음수면 차감 (mode='delta' 기본)
//     mode='set' 사용 시 amount 를 잔액 그대로 세팅하고 차이값을 admin_adjustment 로 기록
//   - description 미지정 시 '관리자 보정' 사용
app.post('/api/admin/users/adjust-balance', async (c) => {
  try {
    const db = c.env.DB
    const body = await c.req.json().catch(() => ({}))
    const { userId, amount, description, mode, reason } = body || {}
    if (!userId || amount === undefined || amount === null) {
      return c.json({ error: 'userId, amount 가 필요합니다' }, 400)
    }
    // ★ 사장님 룰 (2026-05-06 확정): 어드민 잔액 수정 시 사유(reason) 필수
    const reasonRaw = String(reason || description || '').trim()
    if (!reasonRaw || reasonRaw === '관리자 보정') {
      return c.json({ error: '수정 사유(reason)를 구체적으로 입력해주세요. 사유 없이는 잔액을 변경할 수 없습니다.' }, 400)
    }
    const uid = Number(userId)
    const cur = await db.prepare(`SELECT id, email, name, qkey_balance FROM users WHERE id = ?`).bind(uid).first()
    if (!cur) return c.json({ error: '사용자를 찾을 수 없습니다' }, 404)
    const curBal = Number((cur as any).qkey_balance) || 0
    let delta = 0
    if (String(mode || 'delta') === 'set') {
      delta = Number(amount) - curBal
    } else {
      delta = Number(amount)
    }
    if (Math.abs(delta) < 0.0001) {
      return c.json({ success: true, message: '변경 사항 없음', currentBalance: curBal })
    }
    const newBal = curBal + delta
    // 풍부한 description 생성 (사용자/어드민 양측에 명확히 표시)
    //   형식: [어드민 수정] ▲증액 +500 QKEY (이전 2,000 → 이후 2,500) | 사유: <reason>
    //   또는: [어드민 수정] ▼차감 -300 QKEY (이전 2,000 → 이후 1,700) | 사유: <reason>
    const fmt = (n: number) => Math.round(n).toLocaleString('ko-KR')
    const arrow = delta >= 0 ? '▲증액' : '▼차감'
    const sign = delta >= 0 ? '+' : ''
    const richDesc = `[어드민 수정] ${arrow} ${sign}${fmt(delta)} QKEY (이전 ${fmt(curBal)} → 이후 ${fmt(newBal)}) | 사유: ${reasonRaw}`
    // 1) admin_adjustment 거래 기록 (description 에 사유+변동량 모두 포함)
    const ins = await db.prepare(
      `INSERT INTO transactions (user_id, type, coin_type, amount, description) VALUES (?, 'admin_adjustment', 'QKEY', ?, ?)`
    ).bind(uid, delta, richDesc).run()
    // 2) qkey_balance 업데이트 (기존 로직 유지 — 신규 set/update 코드 추가 없음)
    await db.prepare(`UPDATE users SET qkey_balance = ? WHERE id = ?`).bind(newBal, uid).run()
    return c.json({
      success: true,
      userId: uid,
      email: (cur as any).email,
      name: (cur as any).name,
      previousBalance: curBal,
      newBalance: newBal,
      delta,
      direction: delta >= 0 ? 'increase' : 'decrease',
      txId: ins.meta?.last_row_id,
      reason: reasonRaw,
      description: richDesc
    })
  } catch (error) {
    console.error('adjust-balance error:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// 어드민: daily_rewards / referral_rewards 테이블에서 특정 reward_date 행 삭제
//   - 옵션 A: 4/30 발생분 행 정리 후 cron 재트리거용
//   - body: { rewardDate: 'YYYY-MM-DD', dryRun?: boolean }
//   - transactions 테이블은 별도로 옵션 2에서 삭제 완료된 상태이므로 건드리지 않음
// ============================================================
// [신규 룰] KST 날짜 기준 당일 시작 = 당일 배당 자격 인정
//   - 기존: date(?) >= date(s.start_date, '+1 day')  (start_date 다음날부터)
//   - 신규: date(?, '+9 hours') >= date(s.start_date, '+9 hours')  (KST 같은 날도 자격)
//   - 한국시간 기준 23:59:59 까지 가입·staking 시작은 당일분 배당 대상
// ============================================================
// ============================================================
// [신규] 3종 코인 세트 (QTA + QX + QKEY) 누락 보정 — 5/4~5/10 진입자
//   - 사장님 지시 2026-05-04: 컷오프를 5/3 → 5/10 KST 23:59:59 로 연장
//   - 5/4 이후 진입한 staking 중 qx_reward=0 OR qkey_reward=0 인 행 추적
//   - staking.qx_reward, qkey_reward 값을 amount/1000 * 10000, *5000 으로 정정
//   - 사용자 잔액 보정 (qx_balance, qkey_balance 차이만큼 +)
//   - 중복 지급 방지: 이미 staking.qx_reward > 0 AND qkey_reward > 0 이면 스킵
//   - 중복 지급 방지: transactions 에 'three_set_supplement' type 로 기록 (이미 있으면 스킵)
// ============================================================
// ============================================================
// [신규] 단일 staking 3종 보정 — staking_id 명시 지정
//   - 사장님 지시: 5/4 진입자 중 정인숙(sela, staking_id=66) 만 보정
//   - body: { stakingId, dryRun? }
//   - 중복 방지: transactions(three_set_supplement) 같은 staking_id 이미 있으면 skip
// ============================================================
app.post('/api/admin/rewards/three-set-supplement-single', async (c) => {
  try {
    const db = c.env.DB
    const body = await c.req.json().catch(() => ({}))
    const { stakingId, dryRun } = body || {}
    if (!stakingId) return c.json({ error: 'stakingId 가 필요합니다' }, 400)

    const s: any = await db.prepare(`
      SELECT s.id, s.user_id, s.amount, s.status, s.qta_reward, s.qx_reward, s.qkey_reward,
             s.created_at, u.email, u.name, u.qx_balance, u.qkey_balance
      FROM staking s LEFT JOIN users u ON s.user_id = u.id
      WHERE s.id = ?
    `).bind(stakingId).first()
    if (!s) return c.json({ error: 'staking not found' }, 404)

    const correctQx = (s.amount / 1000) * 10000
    const correctQkey = (s.amount / 1000) * 5000
    const qxDelta = correctQx - (s.qx_reward || 0)
    const qkeyDelta = correctQkey - (s.qkey_reward || 0)

    // 중복 방지
    const dup = await db.prepare(`
      SELECT id FROM transactions
      WHERE user_id = ? AND type = 'three_set_supplement' AND description LIKE ?
      LIMIT 1
    `).bind(s.user_id, `%staking_id=${s.id}%`).first()

    const result: any = {
      stakingId: s.id, userId: s.user_id, email: s.email, name: s.name,
      amount: s.amount, status: s.status,
      before: { qx_reward: s.qx_reward || 0, qkey_reward: s.qkey_reward || 0,
                qx_balance: s.qx_balance || 0, qkey_balance: s.qkey_balance || 0 },
      delta: { qx: qxDelta, qkey: qkeyDelta },
      duplicate: !!dup,
      dryRun: !!dryRun
    }

    if (dup) {
      result.skipped = 'transactions(three_set_supplement) already exists for this staking_id'
      return c.json({ success: true, ...result })
    }

    if (!dryRun) {
      // staking 행 정정
      await db.prepare(`UPDATE staking SET qx_reward = ?, qkey_reward = ? WHERE id = ?`)
        .bind(correctQx, correctQkey, s.id).run()

      // status=active 만 잔액 즉시 +
      if (s.status === 'active') {
        if (qxDelta > 0) {
          await db.prepare(`UPDATE users SET qx_balance = COALESCE(qx_balance,0) + ? WHERE id = ?`)
            .bind(qxDelta, s.user_id).run()
          await db.prepare(`
            INSERT INTO transactions (user_id, type, coin_type, amount, description)
            VALUES (?, 'three_set_supplement', 'QX', ?, ?)
          `).bind(s.user_id, qxDelta,
            `3종 보정 QX (staking_id=${s.id}, amount=$${s.amount}, 사장님 지시)`).run()
        }
        if (qkeyDelta > 0) {
          await db.prepare(`UPDATE users SET qkey_balance = COALESCE(qkey_balance,0) + ? WHERE id = ?`)
            .bind(qkeyDelta, s.user_id).run()
          await db.prepare(`
            INSERT INTO transactions (user_id, type, coin_type, amount, description)
            VALUES (?, 'three_set_supplement', 'QKEY', ?, ?)
          `).bind(s.user_id, qkeyDelta,
            `3종 보정 QKEY (staking_id=${s.id}, amount=$${s.amount}, 사장님 지시)`).run()
        }
      }
    }
    return c.json({ success: true, ...result })
  } catch (error: any) {
    console.error('three-set-supplement-single error:', error)
    return c.json({ error: 'D1 error: ' + (error?.message || String(error)) }, 500)
  }
})

app.post('/api/admin/rewards/three-set-supplement', async (c) => {
  try {
    const db = c.env.DB
    const body = await c.req.json().catch(() => ({}))
    const { fromDate, toDate, dryRun } = body || {}
    const fd = fromDate || '2026-05-04'
    const td = toDate || '2026-05-10'

    // 대상 staking 조회: created_at KST 가 fromDate~toDate 범위 + status active 또는 pending
    //   + qx_reward 또는 qkey_reward 가 0 인 행 (Phase2 룰로 잘못 0 저장된 케이스)
    const targets = await db.prepare(`
      SELECT 
        s.id, s.user_id, s.amount, s.status, s.qta_reward, s.qx_reward, s.qkey_reward,
        s.start_date, s.created_at,
        u.email, u.name, u.qta_balance, u.qx_balance, u.qkey_balance
      FROM staking s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.status IN ('active','pending')
        AND date(s.created_at, '+9 hours') >= date(?)
        AND date(s.created_at, '+9 hours') <= date(?)
        AND ((COALESCE(s.qx_reward,0) = 0) OR (COALESCE(s.qkey_reward,0) = 0))
    `).bind(fd, td).all()

    const summary = {
      fromDate: fd, toDate: td, dryRun: !!dryRun,
      candidate_count: targets.results.length,
      processed: [] as any[],
      skipped_duplicate: [] as any[],
      total_qx_added: 0,
      total_qkey_added: 0
    }

    for (const s of targets.results) {
      const correctQx = ((s.amount as number) / 1000) * 10000
      const correctQkey = ((s.amount as number) / 1000) * 5000
      const currentQx = (s.qx_reward as number) || 0
      const currentQkey = (s.qkey_reward as number) || 0
      const qxDelta = correctQx - currentQx
      const qkeyDelta = correctQkey - currentQkey

      // 중복 방지: transactions 에 같은 staking_id 로 'three_set_supplement' 가 이미 있으면 스킵
      const dupCheck = await db.prepare(`
        SELECT id FROM transactions 
        WHERE user_id = ? AND type = 'three_set_supplement' 
          AND description LIKE ?
        LIMIT 1
      `).bind(s.user_id, `%staking_id=${s.id}%`).first()

      if (dupCheck) {
        summary.skipped_duplicate.push({
          staking_id: s.id, user_id: s.user_id, email: s.email,
          reason: 'transactions(three_set_supplement) already exists'
        })
        continue
      }

      summary.processed.push({
        staking_id: s.id, user_id: s.user_id, email: s.email, name: s.name,
        amount: s.amount, status: s.status,
        before: { qx_reward: currentQx, qkey_reward: currentQkey },
        after: { qx_reward: correctQx, qkey_reward: correctQkey },
        delta: { qx: qxDelta, qkey: qkeyDelta },
        created_at: s.created_at
      })
      summary.total_qx_added += qxDelta
      summary.total_qkey_added += qkeyDelta

      if (!dryRun) {
        // 1. staking 행의 qx_reward, qkey_reward 업데이트
        await db.prepare(`
          UPDATE staking SET qx_reward = ?, qkey_reward = ? WHERE id = ?
        `).bind(correctQx, correctQkey, s.id).run()

        // 2. status='active' 인 경우만 즉시 잔액 추가 (pending 은 승인 시 지급되므로 staking 행만 정정)
        if (s.status === 'active' && (qxDelta > 0 || qkeyDelta > 0)) {
          if (qxDelta > 0) {
            await db.prepare(`UPDATE users SET qx_balance = COALESCE(qx_balance,0) + ? WHERE id = ?`)
              .bind(qxDelta, s.user_id).run()
            await db.prepare(`
              INSERT INTO transactions (user_id, type, coin_type, amount, description)
              VALUES (?, 'three_set_supplement', 'QX', ?, ?)
            `).bind(s.user_id, qxDelta,
              `3종 보정 QX (staking_id=${s.id}, amount=$${s.amount}, 5/4-5/10 진입자 누락분)`
            ).run()
          }
          if (qkeyDelta > 0) {
            await db.prepare(`UPDATE users SET qkey_balance = COALESCE(qkey_balance,0) + ? WHERE id = ?`)
              .bind(qkeyDelta, s.user_id).run()
            await db.prepare(`
              INSERT INTO transactions (user_id, type, coin_type, amount, description)
              VALUES (?, 'three_set_supplement', 'QKEY', ?, ?)
            `).bind(s.user_id, qkeyDelta,
              `3종 보정 QKEY (staking_id=${s.id}, amount=$${s.amount}, 5/4-5/10 진입자 누락분)`
            ).run()
          }
        }
      }
    }

    return c.json({ success: true, ...summary })
  } catch (error: any) {
    console.error('three-set-supplement error:', error)
    return c.json({ error: 'D1 error: ' + (error?.message || String(error)) }, 500)
  }
})

app.post('/api/admin/rewards/recalc-by-kst-date', async (c) => {
  try {
    const db = c.env.DB
    const body = await c.req.json().catch(() => ({}))
    const { accrualDate, paidDate, dryRun } = body || {}
    if (!accrualDate || !paidDate) {
      return c.json({ error: 'accrualDate / paidDate 필요 (예: "2026-04-30", "2026-05-04")' }, 400)
    }

    // paid_date 컬럼 보장
    try { await db.prepare(`ALTER TABLE daily_rewards ADD COLUMN paid_date TEXT`).run() } catch(e) {}
    try { await db.prepare(`ALTER TABLE referral_rewards ADD COLUMN paid_date TEXT`).run() } catch(e) {}

    // ★ KST 날짜 기준 자격 staking 조회 (당일 시작 = 당일 자격)
    //   - status = active
    //   - end_date_kst >= accrualDate
    //   - start_date_kst <= accrualDate  (당일 포함)
    const eligibleStakings = await db.prepare(`
      SELECT
        s.user_id, s.id as staking_id, s.amount, s.period_days, s.period_months,
        s.daily_rate, s.start_date, s.end_date, s.reset_at,
        (SELECT COUNT(*) FROM daily_rewards WHERE staking_id = s.id) as rewarded_count,
        (SELECT COUNT(*) FROM daily_rewards WHERE staking_id = s.id AND reward_date = ?) as already_for_date
      FROM staking s
      WHERE s.status = 'active'
        AND date(s.end_date, '+9 hours') >= date(?)
        AND date(s.start_date, '+9 hours') <= date(?)
    `).bind(accrualDate, accrualDate, accrualDate).all()

    const USD_TO_QKEY = 150
    const summary = {
      accrualDate, paidDate, dryRun: !!dryRun,
      eligible_staking_count: eligibleStakings.results.length,
      already_paid_count: 0,
      newly_added_daily: [] as any[],
      newly_added_referral: [] as any[],
      total_new_daily_qkey: 0,
      total_new_referral_qkey: 0
    }

    for (const s of eligibleStakings.results) {
      const periodDays = s.period_days || ((s.period_months as number) * 30)
      if ((s.rewarded_count as number) >= periodDays) continue
      if ((s.already_for_date as number) > 0) {
        summary.already_paid_count++
        continue
      }
      const dailyRate = s.daily_rate as number
      const usdAmount = (s.amount as number) * dailyRate
      const qkeyAmount = Math.round(usdAmount * USD_TO_QKEY)

      summary.newly_added_daily.push({
        user_id: s.user_id, staking_id: s.staking_id, amount: s.amount,
        daily_rate: dailyRate, qkey: qkeyAmount, start_date: s.start_date
      })
      summary.total_new_daily_qkey += qkeyAmount

      if (!dryRun) {
        // daily_rewards 행 신규 삽입 (reward_date=accrualDate, paid_date=paidDate)
        await db.prepare(`
          INSERT INTO daily_rewards (user_id, staking_id, usdt_amount, reward_date, paid_date)
          VALUES (?, ?, ?, ?, ?)
        `).bind(s.user_id, s.staking_id, qkeyAmount, accrualDate, paidDate).run()

        // 잔액 업데이트
        await db.prepare(`UPDATE users SET qkey_balance = qkey_balance + ? WHERE id = ?`)
          .bind(qkeyAmount, s.user_id).run()

        // transactions 기록 — EXISTS 가드 (user, type='daily_qkey', amount, KST date) 중복 INSERT 차단
        const newCount = (s.rewarded_count as number) + 1
        const dqExists3 = await db.prepare(`
          SELECT id FROM transactions
          WHERE user_id = ? AND type = 'daily_qkey' AND coin_type = 'QKEY'
            AND amount = ?
            AND date(created_at, '+9 hours') = ?
          LIMIT 1
        `).bind(s.user_id, qkeyAmount, paidDate).first()
        if (!dqExists3) {
          await db.prepare(`
            INSERT INTO transactions (user_id, type, coin_type, amount, description)
            VALUES (?, 'daily_qkey', 'QKEY', ?, ?)
          `).bind(s.user_id, qkeyAmount,
            `Daily reward ${qkeyAmount.toLocaleString()} QKEY (${(dailyRate*100).toFixed(1)}%, ${newCount}/${periodDays}d, accrued ${accrualDate} paid ${paidDate}) [KST-rule recalc]`
          ).run()
        }
      }

      // 매칭수당 (L1 20%, L2 10%) — 추천인이 accrualDate 시점 active 일 때만
      try {
        const l1ref = await db.prepare(`SELECT referrer_id FROM users WHERE id = ?`).bind(s.user_id).first()
        if (l1ref && l1ref.referrer_id) {
          const l1Active = await db.prepare(`
            SELECT id FROM staking
            WHERE user_id = ? AND status = 'active'
              AND date(start_date, '+9 hours') <= date(?)
              AND date(end_date, '+9 hours') >= date(?)
            LIMIT 1
          `).bind(l1ref.referrer_id, accrualDate, accrualDate).first()
          if (l1Active) {
            // 중복 체크
            const dupL1 = await db.prepare(`
              SELECT id FROM referral_rewards
              WHERE referrer_id = ? AND referee_id = ? AND level = 1 AND reward_date = ?
            `).bind(l1ref.referrer_id, s.user_id, accrualDate).first()
            if (!dupL1) {
              const l1Reward = Math.round(qkeyAmount * 0.20)
              summary.newly_added_referral.push({
                referrer_id: l1ref.referrer_id, referee_id: s.user_id, level: 1, qkey: l1Reward
              })
              summary.total_new_referral_qkey += l1Reward
              if (!dryRun) {
                await db.prepare(`UPDATE users SET qkey_balance = qkey_balance + ? WHERE id = ?`)
                  .bind(l1Reward, l1ref.referrer_id).run()
                await db.prepare(`
                  INSERT INTO referral_rewards (referrer_id, referee_id, level, original_amount, reward_amount, reward_date, paid_date)
                  VALUES (?, ?, 1, ?, ?, ?, ?)
                `).bind(l1ref.referrer_id, s.user_id, qkeyAmount, l1Reward, accrualDate, paidDate).run()
                // EXISTS 가드 — (referrer, type='referral_reward', amount, KST date) 중복 INSERT 차단
                const l1TxExists3 = await db.prepare(`
                  SELECT id FROM transactions
                  WHERE user_id = ? AND type = 'referral_reward' AND coin_type = 'QKEY'
                    AND amount = ?
                    AND date(created_at, '+9 hours') = ?
                  LIMIT 1
                `).bind(l1ref.referrer_id, l1Reward, paidDate).first()
                if (!l1TxExists3) {
                  await db.prepare(`
                    INSERT INTO transactions (user_id, type, coin_type, amount, description)
                    VALUES (?, 'referral_reward', 'QKEY', ?, ?)
                  `).bind(l1ref.referrer_id, l1Reward,
                    `Level 1 referral bonus (${qkeyAmount.toLocaleString()} QKEY x 20%, accrued ${accrualDate} paid ${paidDate}) [KST-rule recalc]`
                  ).run()
                }
              }
            }
            // L2
            const l2ref = await db.prepare(`SELECT referrer_id FROM users WHERE id = ?`).bind(l1ref.referrer_id).first()
            if (l2ref && l2ref.referrer_id) {
              const l2Active = await db.prepare(`
                SELECT id FROM staking
                WHERE user_id = ? AND status = 'active'
                  AND date(start_date, '+9 hours') <= date(?)
                  AND date(end_date, '+9 hours') >= date(?)
                LIMIT 1
              `).bind(l2ref.referrer_id, accrualDate, accrualDate).first()
              if (l2Active) {
                const dupL2 = await db.prepare(`
                  SELECT id FROM referral_rewards
                  WHERE referrer_id = ? AND referee_id = ? AND level = 2 AND reward_date = ?
                `).bind(l2ref.referrer_id, s.user_id, accrualDate).first()
                if (!dupL2) {
                  const l2Reward = Math.round(qkeyAmount * 0.10)
                  summary.newly_added_referral.push({
                    referrer_id: l2ref.referrer_id, referee_id: s.user_id, level: 2, qkey: l2Reward
                  })
                  summary.total_new_referral_qkey += l2Reward
                  if (!dryRun) {
                    await db.prepare(`UPDATE users SET qkey_balance = qkey_balance + ? WHERE id = ?`)
                      .bind(l2Reward, l2ref.referrer_id).run()
                    await db.prepare(`
                      INSERT INTO referral_rewards (referrer_id, referee_id, level, original_amount, reward_amount, reward_date, paid_date)
                      VALUES (?, ?, 2, ?, ?, ?, ?)
                    `).bind(l2ref.referrer_id, s.user_id, qkeyAmount, l2Reward, accrualDate, paidDate).run()
                    // EXISTS 가드 — (referrer, type='referral_reward', amount, KST date) 중복 INSERT 차단
                    const l2TxExists3 = await db.prepare(`
                      SELECT id FROM transactions
                      WHERE user_id = ? AND type = 'referral_reward' AND coin_type = 'QKEY'
                        AND amount = ?
                        AND date(created_at, '+9 hours') = ?
                      LIMIT 1
                    `).bind(l2ref.referrer_id, l2Reward, paidDate).first()
                    if (!l2TxExists3) {
                      await db.prepare(`
                        INSERT INTO transactions (user_id, type, coin_type, amount, description)
                        VALUES (?, 'referral_reward', 'QKEY', ?, ?)
                      `).bind(l2ref.referrer_id, l2Reward,
                        `Level 2 referral bonus (${qkeyAmount.toLocaleString()} QKEY x 10%, accrued ${accrualDate} paid ${paidDate}) [KST-rule recalc]`
                      ).run()
                    }
                  }
                }
              }
            }
          }
        }
      } catch (refErr) {
        console.error('referral recalc error:', refErr)
      }
    }

    return c.json({ success: true, ...summary })
  } catch (error: any) {
    console.error('recalc-by-kst-date error:', error)
    return c.json({ error: 'D1 error: ' + (error?.message || String(error)) }, 500)
  }
})

app.post('/api/admin/rewards/cleanup-by-reward-date', async (c) => {
  try {
    const db = c.env.DB
    const body = await c.req.json().catch(() => ({}))
    const { rewardDate, dryRun } = body || {}
    if (!rewardDate) return c.json({ error: 'rewardDate 가 필요합니다 (예: "2026-04-30")' }, 400)

    // 1. daily_rewards 영향 행 조회 (실제 스키마: usdt_amount, staking_id)
    const dr = await db.prepare(
      `SELECT id, user_id, staking_id, usdt_amount, reward_date, created_at
       FROM daily_rewards WHERE reward_date = ?`
    ).bind(String(rewardDate)).all()
    const drRows = (dr.results || []) as any[]

    // 2. referral_rewards 영향 행 조회 (실제 스키마: referrer_id, referee_id, level, reward_amount)
    let rrRows: any[] = []
    try {
      const rr = await db.prepare(
        `SELECT id, referrer_id, referee_id, level, original_amount, reward_amount, reward_date, created_at
         FROM referral_rewards WHERE reward_date = ?`
      ).bind(String(rewardDate)).all()
      rrRows = (rr.results || []) as any[]
    } catch(e) {
      // 테이블 없으면 무시
    }

    // 3. 사용자별 영향 집계
    const byUser: Record<number, any> = {}
    for (const r of drRows) {
      const u = Number(r.user_id)
      if (!byUser[u]) byUser[u] = { user_id: u, daily_count: 0, daily_amount: 0, ref_count: 0, ref_amount: 0 }
      byUser[u].daily_count++
      byUser[u].daily_amount += Number(r.usdt_amount) || 0
    }
    for (const r of rrRows) {
      const u = Number(r.referrer_id)
      if (!byUser[u]) byUser[u] = { user_id: u, daily_count: 0, daily_amount: 0, ref_count: 0, ref_amount: 0 }
      byUser[u].ref_count++
      byUser[u].ref_amount += Number(r.reward_amount) || 0
    }
    const userSummary = Object.values(byUser).sort((a:any,b:any)=>a.user_id-b.user_id)

    if (dryRun) {
      return c.json({
        success: true,
        dryRun: true,
        rewardDate,
        dailyRewardsCount: drRows.length,
        dailyRewardsSum: drRows.reduce((s,r)=>s+(Number(r.usdt_amount)||0),0),
        referralRewardsCount: rrRows.length,
        referralRewardsSum: rrRows.reduce((s,r)=>s+(Number(r.reward_amount)||0),0),
        affectedUserCount: userSummary.length,
        perUserSummary: userSummary
      })
    }

    // 4. 실삭제
    const drDel = await db.prepare(`DELETE FROM daily_rewards WHERE reward_date = ?`).bind(String(rewardDate)).run()
    let rrDel: any = { meta: { changes: 0 } }
    try {
      rrDel = await db.prepare(`DELETE FROM referral_rewards WHERE reward_date = ?`).bind(String(rewardDate)).run()
    } catch(e) {}

    return c.json({
      success: true,
      dryRun: false,
      rewardDate,
      deletedDailyRewards: drDel.meta?.changes || 0,
      deletedReferralRewards: rrDel.meta?.changes || 0,
      affectedUserCount: userSummary.length,
      perUserSummary: userSummary
    })
  } catch (error) {
    console.error('cleanup-by-reward-date error:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// 어드민: referral_rewards 의 paid_date 를 일괄 갱신 (사용자단 화면 동기화용)
//   - body: { rewardDate: 'YYYY-MM-DD', paidDate?: 'YYYY-MM-DD'(default=오늘 KST), dryRun?: boolean }
//   - 효과: 해당 reward_date 의 referral_rewards 모든 행에 paid_date 를 지정해 사용자단에서도 정상 표시되도록 함
//   - transactions/잔액은 이미 발생 시점에 처리되어 있으므로 추가 변동 없음 (중복 지급 방지)
app.post('/api/admin/rewards/set-referral-paid-date', async (c) => {
  try {
    const db = c.env.DB
    const body = await c.req.json().catch(() => ({}))
    const { rewardDate, paidDate, dryRun } = body || {}
    if (!rewardDate) return c.json({ error: 'rewardDate 가 필요합니다 (예: "2026-05-05")' }, 400)

    const finalPaid = paidDate || new Date(Date.now() + 9*60*60*1000).toISOString().slice(0,10)

    const before = await db.prepare(
      `SELECT id, referrer_id, referee_id, level, reward_amount, reward_date, paid_date, created_at
       FROM referral_rewards WHERE reward_date = ? ORDER BY id`
    ).bind(String(rewardDate)).all()
    const rows = (before.results || []) as any[]
    const nullRows = rows.filter((r:any)=> r.paid_date == null || r.paid_date === '')

    if (dryRun) {
      return c.json({
        success: true, dryRun: true, rewardDate, paidDate: finalPaid,
        totalRows: rows.length, nullPaidRows: nullRows.length,
        targets: nullRows.map((r:any)=>({ id:r.id, referrer:r.referrer_id, referee:r.referee_id, amount:r.reward_amount, paid_date:r.paid_date }))
      })
    }

    let updated = 0
    for (const r of nullRows) {
      const u = await db.prepare(
        `UPDATE referral_rewards SET paid_date = ? WHERE id = ? AND (paid_date IS NULL OR paid_date = '')`
      ).bind(finalPaid, r.id).run()
      updated += (u.meta?.changes || 0)
    }

    const after = await db.prepare(
      `SELECT id, referrer_id, referee_id, reward_amount, reward_date, paid_date FROM referral_rewards WHERE reward_date = ? ORDER BY id`
    ).bind(String(rewardDate)).all()

    return c.json({
      success: true, dryRun: false, rewardDate, paidDate: finalPaid,
      totalRows: rows.length, nullBefore: nullRows.length, updatedCount: updated,
      after: after.results || []
    })
  } catch (error) {
    console.error('set-referral-paid-date error:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// 어드민: daily_rewards 의 paid_date 를 일괄 갱신 (사용자단 화면 동기화용)
//   - body: { rewardDate: 'YYYY-MM-DD', paidDate?: 'YYYY-MM-DD'(default=오늘 KST), dryRun?: boolean }
//   - 효과: 해당 reward_date 의 daily_rewards 모든 행에 paid_date 를 지정해 사용자단에서도 정상 표시되도록 함
//   - transactions/잔액은 이미 발생 시점에 처리되어 있으므로 추가 변동 없음 (중복 지급 방지)
app.post('/api/admin/rewards/set-daily-paid-date', async (c) => {
  try {
    const db = c.env.DB
    const body = await c.req.json().catch(() => ({}))
    const { rewardDate, paidDate, dryRun } = body || {}
    if (!rewardDate) return c.json({ error: 'rewardDate 가 필요합니다 (예: "2026-05-04")' }, 400)

    const finalPaid = paidDate || new Date(Date.now() + 9*60*60*1000).toISOString().slice(0,10)

    const before = await db.prepare(
      `SELECT id, user_id, staking_id, usdt_amount, reward_date, paid_date, created_at
       FROM daily_rewards WHERE reward_date = ? ORDER BY id`
    ).bind(String(rewardDate)).all()
    const rows = (before.results || []) as any[]
    const nullRows = rows.filter((r:any)=> r.paid_date == null || r.paid_date === '')

    if (dryRun) {
      return c.json({
        success: true, dryRun: true, rewardDate, paidDate: finalPaid,
        totalRows: rows.length, nullPaidRows: nullRows.length,
        targets: nullRows.map((r:any)=>({ id:r.id, user_id:r.user_id, staking_id:r.staking_id, amount:r.usdt_amount, paid_date:r.paid_date }))
      })
    }

    let updated = 0
    for (const r of nullRows) {
      const u = await db.prepare(
        `UPDATE daily_rewards SET paid_date = ? WHERE id = ? AND (paid_date IS NULL OR paid_date = '')`
      ).bind(finalPaid, r.id).run()
      updated += (u.meta?.changes || 0)
    }

    const after = await db.prepare(
      `SELECT id, user_id, staking_id, usdt_amount, reward_date, paid_date FROM daily_rewards WHERE reward_date = ? ORDER BY id`
    ).bind(String(rewardDate)).all()

    return c.json({
      success: true, dryRun: false, rewardDate, paidDate: finalPaid,
      totalRows: rows.length, nullBefore: nullRows.length, updatedCount: updated,
      after: after.results || []
    })
  } catch (error) {
    console.error('set-daily-paid-date error:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// ★★ 어드민 통합 수동 보정 엔드포인트 (2026-05-06 신설) ★★
// 사용처: 평일 KST 07:00 자동 cron 후 사장님이 임의 수정 필요 시 사용
//
// action 종류:
//  1) "update_amount"  — 특정 daily_rewards 또는 referral_rewards 행의 금액 수정 (잔액 자동 동기화)
//     body: { action:"update_amount", table:"daily_rewards"|"referral_rewards", id:N, newAmount:N, reason:"..." }
//
//  2) "delete_reward"  — 특정 reward 행 삭제 + 잔액 차감 + 매칭 transaction 삭제
//     body: { action:"delete_reward", table:"daily_rewards"|"referral_rewards", id:N, reason:"..." }
//
//  3) "manual_insert"  — 누락된 reward 수동 발행 (본인 daily 또는 매칭 L1/L2)
//     body: { action:"manual_insert", type:"daily"|"l1"|"l2",
//             userId:N, stakingId:N, refereeId:N(매칭일때),
//             amount:N, rewardDate:"YYYY-MM-DD", paidDate:"YYYY-MM-DD", reason:"..." }
//
// 모든 action 은 dryRun 지원 (기본 false). 실행 시 transactions 테이블도 자동 동기화.

// ===========================================================================
// 사장님 GO (2026-05-07): 1·2단계 보충 전용 엔드포인트
//   1단계: 5/7 accrued daily_qkey 누락 16명 보충 + 파생 매칭(1대 20% / 2대 10%) 자동 INSERT
//   2단계: 5/6 accrued (manual insert) → 5/7 paid 분의 referral 누락 26건 보충
//   3단계(balance_sync 차감)는 별도 GO 받은 후 진행 — 본 엔드포인트 미포함
//
// 룰:
//   - dryRun=true: 영향 명세만 반환, INSERT/UPDATE 없음
//   - dryRun=false: D1 트랜잭션으로 INSERT + qkey_balance 가산
//   - 동일 (user, type, amount, KST date) 중복 방지를 위해 EXISTS 가드 적용
//   - description 에 [audit-fill 2026-05-07] 마커로 식별 가능하게 기록
// ===========================================================================
app.post('/api/admin/rewards/repair-2026-05-07', async (c) => {
  try {
    const db = c.env.DB
    const body = await c.req.json().catch(() => ({}))
    const dryRun = body?.dryRun !== false  // 기본 dry-run (안전)
    const PAID = '2026-05-07'
    const ACCR_57 = '2026-05-07'
    const ACCR_56 = '2026-05-06'
    const USD_TO_QKEY = 150
    const MARKER = '[audit-fill 2026-05-07]'

    // === 1단계 데이터: 5/7 daily 누락 16명 (uid, sid, amount, rate) ===
    const stage1: Array<{uid:number, sid:number, amount:number, rate:number}> = [
      { uid: 2,  sid: 1,  amount: 10000, rate: 0.01  },
      { uid: 64, sid: 76, amount: 15000, rate: 0.01  },
      { uid: 68, sid: 81, amount: 1000,  rate: 0.005 },
      { uid: 69, sid: 80, amount: 2000,  rate: 0.005 },
      { uid: 70, sid: 82, amount: 7000,  rate: 0.007 },
      { uid: 71, sid: 87, amount: 1000,  rate: 0.005 },
      { uid: 72, sid: 78, amount: 2000,  rate: 0.005 },
      { uid: 75, sid: 86, amount: 2000,  rate: 0.005 },
      { uid: 77, sid: 75, amount: 5000,  rate: 0.007 },
      { uid: 78, sid: 85, amount: 1000,  rate: 0.005 },
      { uid: 79, sid: 83, amount: 1000,  rate: 0.005 },
      { uid: 80, sid: 79, amount: 5000,  rate: 0.007 },
      { uid: 83, sid: 88, amount: 1000,  rate: 0.005 },
      { uid: 84, sid: 89, amount: 10000, rate: 0.01  },
      { uid: 85, sid: 90, amount: 1000,  rate: 0.005 },
      { uid: 86, sid: 91, amount: 6000,  rate: 0.007 },
    ]

    // === 2단계 데이터: 5/6 accrued (paid 5/7) referral 누락 26건 ===
    // src_uid: 누구의 daily 가 source 인지 / l1: 1대 referrer / l2: 2대 referrer / src_amt: 그 daily 금액
    const stage2: Array<{src_uid:number, src_amt:number, l1:number, l2:number}> = [
      { src_uid: 68, src_amt: 750,   l1: 65, l2: 2  },
      { src_uid: 69, src_amt: 1500,  l1: 68, l2: 65 },
      { src_uid: 70, src_amt: 7350,  l1: 69, l2: 68 },
      { src_uid: 71, src_amt: 750,   l1: 70, l2: 69 },
      { src_uid: 72, src_amt: 1500,  l1: 70, l2: 69 },
      { src_uid: 75, src_amt: 1500,  l1: 70, l2: 69 },
      { src_uid: 78, src_amt: 750,   l1: 70, l2: 69 },
      { src_uid: 79, src_amt: 750,   l1: 70, l2: 69 },
      { src_uid: 80, src_amt: 5250,  l1: 70, l2: 69 },
      { src_uid: 83, src_amt: 750,   l1: 70, l2: 69 },
      { src_uid: 84, src_amt: 15000, l1: 76, l2: 45 },
      { src_uid: 85, src_amt: 750,   l1: 41, l2: 2  },
      { src_uid: 86, src_amt: 6300,  l1: 84, l2: 76 },
    ]

    // 1단계 파생 매칭 데이터: 5/7 accrued daily 의 1대(20%) / 2대(10%)
    // (referrer 트리는 사전 분석된 결과)
    const stage1Match: Array<{src_uid:number, src_amt:number, l1:number|null, l2:number|null}> = [
      { src_uid: 2,  src_amt: 15000, l1: 1,  l2: null }, // qtangel(1) referrer 없음
      { src_uid: 64, src_amt: 22500, l1: null, l2: null },
      { src_uid: 68, src_amt: 750,   l1: 65, l2: 2  },
      { src_uid: 69, src_amt: 1500,  l1: 68, l2: 65 },
      { src_uid: 70, src_amt: 7350,  l1: 69, l2: 68 },
      { src_uid: 71, src_amt: 750,   l1: 70, l2: 69 },
      { src_uid: 72, src_amt: 1500,  l1: 70, l2: 69 },
      { src_uid: 75, src_amt: 1500,  l1: 70, l2: 69 },
      { src_uid: 77, src_amt: 5250,  l1: 2,  l2: 1  },
      { src_uid: 78, src_amt: 750,   l1: 70, l2: 69 },
      { src_uid: 79, src_amt: 750,   l1: 70, l2: 69 },
      { src_uid: 80, src_amt: 5250,  l1: 70, l2: 69 },
      { src_uid: 83, src_amt: 750,   l1: 70, l2: 69 },
      { src_uid: 84, src_amt: 15000, l1: 76, l2: 45 },
      { src_uid: 85, src_amt: 750,   l1: 41, l2: 2  },
      { src_uid: 86, src_amt: 6300,  l1: 84, l2: 76 },
    ]

    // EXISTS 가드: (user_id, type, coin_type, amount, KST date)
    async function existsTx(uid:number, type:string, amt:number, kstDate:string) {
      const r = await db.prepare(`
        SELECT id FROM transactions
        WHERE user_id = ? AND type = ? AND coin_type = 'QKEY'
          AND amount = ? AND date(created_at, '+9 hours') = ?
        LIMIT 1
      `).bind(uid, type, amt, kstDate).first()
      return !!r
    }

    const plan: any[] = []
    let totalAdd = 0

    // 1단계 plan 생성
    for (const s of stage1) {
      const qkey = Math.round(s.amount * s.rate * USD_TO_QKEY)
      const exists = await existsTx(s.uid, 'daily_qkey', qkey, PAID)
      plan.push({ stage: 1, kind: 'daily', uid: s.uid, sid: s.sid, qkey, exists })
      if (!exists) totalAdd += qkey
    }
    // 1단계 파생 매칭 plan
    for (const m of stage1Match) {
      if (m.l1) {
        const l1Amt = Math.round(m.src_amt * 0.20)
        const ex = await existsTx(m.l1, 'referral_reward', l1Amt, PAID)
        plan.push({ stage: 1, kind: 'l1_match', referrer: m.l1, src_uid: m.src_uid, src_amt: m.src_amt, qkey: l1Amt, accrued: ACCR_57, exists: ex })
        if (!ex) totalAdd += l1Amt
      }
      if (m.l2) {
        const l2Amt = Math.round(m.src_amt * 0.10)
        const ex = await existsTx(m.l2, 'referral_reward', l2Amt, PAID)
        plan.push({ stage: 1, kind: 'l2_match', referrer: m.l2, src_uid: m.src_uid, src_amt: m.src_amt, qkey: l2Amt, accrued: ACCR_57, exists: ex })
        if (!ex) totalAdd += l2Amt
      }
    }
    // 2단계 plan
    for (const s of stage2) {
      const l1Amt = Math.round(s.src_amt * 0.20)
      const l2Amt = Math.round(s.src_amt * 0.10)
      const ex1 = await existsTx(s.l1, 'referral_reward', l1Amt, PAID)
      const ex2 = await existsTx(s.l2, 'referral_reward', l2Amt, PAID)
      plan.push({ stage: 2, kind: 'l1_match', referrer: s.l1, src_uid: s.src_uid, src_amt: s.src_amt, qkey: l1Amt, accrued: ACCR_56, exists: ex1 })
      plan.push({ stage: 2, kind: 'l2_match', referrer: s.l2, src_uid: s.src_uid, src_amt: s.src_amt, qkey: l2Amt, accrued: ACCR_56, exists: ex2 })
      if (!ex1) totalAdd += l1Amt
      if (!ex2) totalAdd += l2Amt
    }

    if (dryRun) {
      const insertPlan = plan.filter(p => !p.exists)
      const skipPlan = plan.filter(p => p.exists)
      // 사용자별 가산 합계
      const balanceDelta: Record<string, number> = {}
      for (const p of insertPlan) {
        const target = p.kind === 'daily' ? p.uid : p.referrer
        if (!target) continue
        balanceDelta[String(target)] = (balanceDelta[String(target)] || 0) + p.qkey
      }
      return c.json({
        success: true,
        dryRun: true,
        plan_total: plan.length,
        will_insert: insertPlan.length,
        will_skip: skipPlan.length,
        total_qkey_to_add: totalAdd,
        balance_delta_by_user: balanceDelta,
        details: plan
      })
    }

    // === 실제 실행 ===
    let inserted = 0
    let skipped = 0
    const auditIds: number[] = []

    for (const p of plan) {
      if (p.exists) { skipped++; continue }

      if (p.stage === 1 && p.kind === 'daily') {
        // 1) daily_rewards INSERT (qkey 단위로 usdt_amount 컬럼 사용 — 기존 스키마 그대로)
        await db.prepare(`
          INSERT INTO daily_rewards (user_id, staking_id, usdt_amount, reward_date, paid_date)
          VALUES (?, ?, ?, ?, ?)
        `).bind(p.uid, p.sid, p.qkey, ACCR_57, PAID).run()

        // 2) qkey_balance 가산
        await db.prepare(`UPDATE users SET qkey_balance = qkey_balance + ? WHERE id = ?`)
          .bind(p.qkey, p.uid).run()

        // 3) transactions audit
        const r:any = await db.prepare(`
          INSERT INTO transactions (user_id, type, coin_type, amount, description)
          VALUES (?, 'daily_qkey', 'QKEY', ?, ?)
        `).bind(p.uid, p.qkey,
          `Daily reward ${p.qkey.toLocaleString()} QKEY (accrued ${ACCR_57} paid ${PAID}) ${MARKER} stage1`
        ).run()
        if (r?.meta?.last_row_id) auditIds.push(Number(r.meta.last_row_id))
        inserted++
      } else if (p.kind === 'l1_match' || p.kind === 'l2_match') {
        const level = p.kind === 'l1_match' ? 1 : 2
        const pct = level === 1 ? '20%' : '10%'
        // 1) referral_rewards INSERT
        await db.prepare(`
          INSERT INTO referral_rewards (referrer_id, referee_id, level, original_amount, reward_amount, reward_date, paid_date)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(p.referrer, p.src_uid, level, p.src_amt, p.qkey, p.accrued, PAID).run()

        // 2) qkey_balance 가산
        await db.prepare(`UPDATE users SET qkey_balance = qkey_balance + ? WHERE id = ?`)
          .bind(p.qkey, p.referrer).run()

        // 3) transactions audit
        const r:any = await db.prepare(`
          INSERT INTO transactions (user_id, type, coin_type, amount, description)
          VALUES (?, 'referral_reward', 'QKEY', ?, ?)
        `).bind(p.referrer, p.qkey,
          `Level ${level} referral bonus (${p.src_amt.toLocaleString()} QKEY x ${pct}, accrued ${p.accrued} paid ${PAID}) ${MARKER} stage${p.stage}`
        ).run()
        if (r?.meta?.last_row_id) auditIds.push(Number(r.meta.last_row_id))
        inserted++
      }
    }

    return c.json({
      success: true,
      dryRun: false,
      plan_total: plan.length,
      inserted,
      skipped,
      total_qkey_added: totalAdd,
      audit_tx_ids: auditIds
    })
  } catch (error: any) {
    console.error('repair-2026-05-07 error:', error)
    return c.json({ error: 'D1 error: ' + (error?.message || String(error)) }, 500)
  }
})

app.post('/api/admin/rewards/manual-adjust', async (c) => {
  try {
    const db = c.env.DB
    const body = await c.req.json().catch(() => ({}))
    const { action, dryRun = false, reason = '' } = body || {}
    if (!action) return c.json({ error: 'action 이 필요합니다 (update_amount | delete_reward | manual_insert)' }, 400)

    const today = new Date(Date.now() + 9*60*60*1000).toISOString().slice(0,10)

    // === ACTION 1: update_amount ===
    if (action === 'update_amount') {
      const { table, id, newAmount } = body
      if (!table || !id || newAmount == null) return c.json({ error: 'table, id, newAmount 필요' }, 400)
      if (!['daily_rewards','referral_rewards'].includes(table)) return c.json({ error: 'table 은 daily_rewards 또는 referral_rewards' }, 400)

      const amountCol = table === 'daily_rewards' ? 'usdt_amount' : 'reward_amount'
      const userCol = table === 'daily_rewards' ? 'user_id' : 'referrer_id'
      const before = await db.prepare(
        `SELECT * FROM ${table} WHERE id = ?`
      ).bind(id).first()
      if (!before) return c.json({ error: `${table}#${id} not found` }, 404)

      const oldAmount = (before as any)[amountCol] || 0
      const userId = (before as any)[userCol]
      const diff = newAmount - oldAmount

      if (dryRun) {
        return c.json({ success: true, dryRun: true, action, table, id, oldAmount, newAmount, diff, userId, reason })
      }

      // reward 행 금액 수정
      await db.prepare(`UPDATE ${table} SET ${amountCol} = ? WHERE id = ?`).bind(newAmount, id).run()
      // 사용자 잔액 보정
      await db.prepare(`UPDATE users SET qkey_balance = qkey_balance + ? WHERE id = ?`).bind(diff, userId).run()
      // 보정 transaction 삽입 (감사 추적)
      await db.prepare(`
        INSERT INTO transactions (user_id, type, coin_type, amount, description)
        VALUES (?, 'admin_adjust', 'QKEY', ?, ?)
      `).bind(userId, diff, `Admin reward adjust ${table}#${id}: ${oldAmount} -> ${newAmount} (diff ${diff>=0?'+':''}${diff}) reason=${reason}`).run()

      return c.json({ success: true, action, table, id, oldAmount, newAmount, diff, userId, reason })
    }

    // === ACTION 2: delete_reward ===
    if (action === 'delete_reward') {
      const { table, id } = body
      if (!table || !id) return c.json({ error: 'table, id 필요' }, 400)
      if (!['daily_rewards','referral_rewards'].includes(table)) return c.json({ error: 'table 잘못됨' }, 400)

      const amountCol = table === 'daily_rewards' ? 'usdt_amount' : 'reward_amount'
      const userCol = table === 'daily_rewards' ? 'user_id' : 'referrer_id'
      const row = await db.prepare(`SELECT * FROM ${table} WHERE id = ?`).bind(id).first()
      if (!row) return c.json({ error: `${table}#${id} not found` }, 404)
      const amount = (row as any)[amountCol] || 0
      const userId = (row as any)[userCol]

      if (dryRun) {
        return c.json({ success: true, dryRun: true, action, table, id, amount, userId, reason })
      }

      await db.prepare(`DELETE FROM ${table} WHERE id = ?`).bind(id).run()
      await db.prepare(`UPDATE users SET qkey_balance = qkey_balance - ? WHERE id = ?`).bind(amount, userId).run()
      await db.prepare(`
        INSERT INTO transactions (user_id, type, coin_type, amount, description)
        VALUES (?, 'admin_adjust', 'QKEY', ?, ?)
      `).bind(userId, -amount, `Admin reward delete ${table}#${id}: -${amount} QKEY reason=${reason}`).run()

      return c.json({ success: true, action, table, id, deletedAmount: amount, userId, reason })
    }

    // === ACTION 3: manual_insert ===
    if (action === 'manual_insert') {
      const { type, userId, stakingId, refereeId, amount, rewardDate, paidDate } = body
      if (!type || !userId || amount == null || !rewardDate) {
        return c.json({ error: 'type(daily|l1|l2), userId, amount, rewardDate 필요' }, 400)
      }
      const finalPaid = paidDate || today

      if (dryRun) {
        return c.json({ success: true, dryRun: true, action, type, userId, stakingId, refereeId, amount, rewardDate, paidDate: finalPaid, reason })
      }

      let insertedId: any = null

      if (type === 'daily') {
        if (!stakingId) return c.json({ error: 'daily 는 stakingId 필요' }, 400)
        // 중복 체크
        const dup = await db.prepare(
          `SELECT id FROM daily_rewards WHERE user_id = ? AND staking_id = ? AND reward_date = ?`
        ).bind(userId, stakingId, rewardDate).first()
        if (dup) return c.json({ error: `daily_rewards already exists (id=${(dup as any).id})` }, 409)

        const r = await db.prepare(`
          INSERT INTO daily_rewards (user_id, staking_id, usdt_amount, reward_date, paid_date)
          VALUES (?, ?, ?, ?, ?)
        `).bind(userId, stakingId, amount, rewardDate, finalPaid).run()
        insertedId = r.meta?.last_row_id

        await db.prepare(`UPDATE users SET qkey_balance = qkey_balance + ? WHERE id = ?`).bind(amount, userId).run()
        await db.prepare(`
          INSERT INTO transactions (user_id, type, coin_type, amount, description)
          VALUES (?, 'daily_qkey', 'QKEY', ?, ?)
        `).bind(userId, amount, `Daily reward ${amount.toLocaleString()} QKEY (manual insert by admin, accrued ${rewardDate} paid ${finalPaid}) reason=${reason}`).run()

      } else if (type === 'l1' || type === 'l2') {
        if (!refereeId) return c.json({ error: 'l1/l2 는 refereeId 필요' }, 400)
        const level = type === 'l1' ? 1 : 2
        const dup = await db.prepare(
          `SELECT id FROM referral_rewards WHERE referrer_id = ? AND referee_id = ? AND level = ? AND reward_date = ?`
        ).bind(userId, refereeId, level, rewardDate).first()
        if (dup) return c.json({ error: `referral_rewards already exists (id=${(dup as any).id})` }, 409)

        const r = await db.prepare(`
          INSERT INTO referral_rewards (referrer_id, referee_id, level, original_amount, reward_amount, reward_date, paid_date)
          VALUES (?, ?, ?, 0, ?, ?, ?)
        `).bind(userId, refereeId, level, amount, rewardDate, finalPaid).run()
        insertedId = r.meta?.last_row_id

        await db.prepare(`UPDATE users SET qkey_balance = qkey_balance + ? WHERE id = ?`).bind(amount, userId).run()
        await db.prepare(`
          INSERT INTO transactions (user_id, type, coin_type, amount, description)
          VALUES (?, 'referral_reward', 'QKEY', ?, ?)
        `).bind(userId, amount, `Level ${level} referral bonus ${amount.toLocaleString()} QKEY (manual insert by admin, accrued ${rewardDate} paid ${finalPaid}) reason=${reason}`).run()
      } else {
        return c.json({ error: 'type 은 daily|l1|l2' }, 400)
      }

      return c.json({ success: true, action, type, insertedId, userId, stakingId, refereeId, amount, rewardDate, paidDate: finalPaid, reason })
    }

    return c.json({ error: 'unknown action' }, 400)
  } catch (error) {
    console.error('manual-adjust error:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// 어드민: 사용자별 잔액 vs 거래내역 전체 합계 정합성 진단
//   - users.qkey_balance vs SUM(transactions.amount WHERE coin_type='QKEY') 비교
//   - 차이가 있는 사용자 모두 반환 (사용자단/어드민단 일치 여부 확인용)
app.get('/api/admin/diag/balance-vs-tx', async (c) => {
  try {
    const db = c.env.DB
    const rows = await db.prepare(
      `SELECT u.id, u.email, u.qkey_balance,
              COALESCE((SELECT SUM(t.amount) FROM transactions t WHERE t.user_id = u.id AND t.coin_type='QKEY'), 0) as tx_sum,
              (SELECT COUNT(*) FROM transactions t WHERE t.user_id = u.id AND t.coin_type='QKEY') as tx_count
       FROM users u
       ORDER BY u.id`
    ).all()
    const all: any[] = []
    const mismatches: any[] = []
    for (const r of (rows.results || [])) {
      const bal = Number(r.qkey_balance) || 0
      const sum = Number(r.tx_sum) || 0
      const diff = bal - sum
      const item = { id: r.id, email: r.email, balance: bal, tx_sum: sum, diff, tx_count: r.tx_count }
      all.push(item)
      if (Math.abs(diff) > 0.5) mismatches.push(item)
    }
    return c.json({
      success: true,
      total_users: all.length,
      mismatch_count: mismatches.length,
      mismatches,
      total_diff: mismatches.reduce((s, m) => s + m.diff, 0)
    })
  } catch (error) {
    return c.json({ error: String(error) }, 500)
  }
})

// 어드민: 47명 전수 — 사용자별 reward type 분류 합계 + balance + tx_sum 한방 진단
//   - 사용자단 화면(referral-rewards stats)과 어드민단 잔액 비교를 한 번 호출로 수집
app.get('/api/admin/diag/full-audit', async (c) => {
  try {
    const db = c.env.DB
    const users = await db.prepare(
      `SELECT id, email, qkey_balance FROM users ORDER BY id`
    ).all()
    const txByUser = await db.prepare(
      `SELECT user_id, type,
              COALESCE(SUM(amount),0) as sum_amt,
              COUNT(*) as cnt
       FROM transactions
       WHERE coin_type='QKEY'
       GROUP BY user_id, type`
    ).all()
    // user_id -> type -> {sum, cnt}
    const m: Record<number, any> = {}
    for (const r of (txByUser.results || []) as any[]) {
      const uid = Number(r.user_id)
      if (!m[uid]) m[uid] = {}
      m[uid][String(r.type)] = { sum: Number(r.sum_amt) || 0, cnt: Number(r.cnt) || 0 }
    }
    const out: any[] = []
    for (const u of (users.results || []) as any[]) {
      const uid = Number(u.id)
      const bal = Number(u.qkey_balance) || 0
      const types = m[uid] || {}
      const get = (t: string) => types[t]?.sum || 0
      const getCnt = (t: string) => types[t]?.cnt || 0
      const daily = get('daily_qkey')
      const direct = get('direct_referral')
      const ref = get('referral_reward')        // L1+L2 합산
      const dRb = get('daily_reward_rollback')
      const rRb = get('referral_reward_rollback')
      const rs = get('rollback_restore')
      const adj = get('admin_adjustment')
      const stake = get('staking_reward')
      const stakeBuy = get('staking_buy') + get('staking') + get('purchase_staking')  // 가능한 명칭들
      const swap = get('swap') + get('qkey_swap') + get('qta_swap')
      const sync = get('balance_sync')
      // 그 외 known type 합계 외의 type 들
      const knownTypes = new Set([
        'daily_qkey','direct_referral','referral_reward',
        'daily_reward_rollback','referral_reward_rollback','rollback_restore',
        'admin_adjustment','staking_reward','staking_buy','staking','purchase_staking',
        'swap','qkey_swap','qta_swap','balance_sync'
      ])
      let other = 0
      const otherTypes: string[] = []
      for (const k of Object.keys(types)) {
        if (!knownTypes.has(k)) {
          other += types[k].sum
          otherTypes.push(`${k}:${types[k].sum}(${types[k].cnt})`)
        }
      }
      const txSum = Object.values(types).reduce((s: number, v: any) => s + (v.sum || 0), 0)
      const totalCnt = Object.values(types).reduce((s: number, v: any) => s + (v.cnt || 0), 0)
      out.push({
        id: uid, email: u.email,
        balance: bal,
        tx_sum: txSum,
        balance_minus_tx: bal - txSum,
        tx_count: totalCnt,
        daily, direct, ref, dRb, rRb, rs, adj,
        stake_reward: stake, stake_buy: stakeBuy, swap, sync, other,
        other_types: otherTypes,
        types: Object.keys(types).map(k => `${k}:${types[k].sum}(${types[k].cnt})`)
      })
    }
    return c.json({
      success: true,
      total_users: out.length,
      results: out,
      mismatches: out.filter(r => Math.abs(r.balance_minus_tx) > 0.5),
      total_balance: out.reduce((s, r) => s + r.balance, 0),
      total_tx_sum: out.reduce((s, r) => s + r.tx_sum, 0)
    })
  } catch (error) {
    return c.json({ error: String(error) }, 500)
  }
})

// 어드민: 특정 일자 마감(KST 23:59:59) 시점의 사용자별 잔액 (= 그 시점까지의 transactions amount 합)
//   - query: ?date=YYYY-MM-DD  (KST 기준)
//   - 4/30 당일 잔액 조회용
app.get('/api/admin/diag/balance-as-of', async (c) => {
  try {
    const db = c.env.DB
    const date = c.req.query('date') || ''
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return c.json({ error: 'date=YYYY-MM-DD 필요 (KST)' }, 400)
    // KST 23:59:59 = UTC 14:59:59 same day
    const cutoffUtc = `${date} 14:59:59`
    const users = await db.prepare(
      `SELECT u.id, u.email,
              COALESCE((SELECT SUM(t.amount) FROM transactions t
                        WHERE t.user_id = u.id AND t.coin_type='QKEY'
                              AND t.created_at <= ?), 0) as bal_as_of,
              (SELECT COUNT(*) FROM transactions t
                WHERE t.user_id = u.id AND t.coin_type='QKEY'
                      AND t.created_at <= ?) as tx_count
       FROM users u
       ORDER BY u.id`
    ).bind(cutoffUtc, cutoffUtc).all()
    const out = (users.results || []).map((r: any) => ({
      id: Number(r.id), email: r.email,
      balance_as_of: Number(r.bal_as_of) || 0,
      tx_count: Number(r.tx_count) || 0
    }))
    return c.json({
      success: true,
      date,
      cutoff_utc: cutoffUtc,
      total_users: out.length,
      total_balance: out.reduce((s: number, r: any) => s + r.balance_as_of, 0),
      results: out
    })
  } catch (error) {
    return c.json({ error: String(error) }, 500)
  }
})

// 어드민: 사용자별 잔액을 거래내역 합계로 강제 동기화 (사용자단=어드민단 일치 보장)
//   - 옵션: { "userIds": [17,18] } 또는 빈 body로 전체
app.post('/api/admin/diag/sync-balance-to-tx', async (c) => {
  try {
    const db = c.env.DB
    const body = await c.req.json().catch(() => ({}))
    const userIds: number[] = (body && Array.isArray(body.userIds)) ? body.userIds.map((x: any) => Number(x)) : []
    let rows
    if (userIds.length > 0) {
      const placeholders = userIds.map(() => '?').join(',')
      rows = await db.prepare(
        `SELECT u.id, u.qkey_balance,
                COALESCE((SELECT SUM(t.amount) FROM transactions t WHERE t.user_id = u.id AND t.coin_type='QKEY'), 0) as tx_sum
         FROM users u WHERE u.id IN (${placeholders})`
      ).bind(...userIds).all()
    } else {
      rows = await db.prepare(
        `SELECT u.id, u.qkey_balance,
                COALESCE((SELECT SUM(t.amount) FROM transactions t WHERE t.user_id = u.id AND t.coin_type='QKEY'), 0) as tx_sum
         FROM users u`
      ).all()
    }
    const updated: any[] = []
    let totalAdjustment = 0
    for (const r of (rows.results || [])) {
      const bal = Number(r.qkey_balance) || 0
      const sum = Number(r.tx_sum) || 0
      const diff = bal - sum
      if (Math.abs(diff) <= 0.5) continue
      try {
        // 핵심 원칙: 어드민 잔액(bal) = 사용자 거래내역 SUM(sum) 이 일치해야 함
        // 사용자가 본 거래내역의 SUM 이 진실 (사용자가 받은 보상 - 회수 = 진짜 받은 금액)
        // 잔액 bal 이 sum 보다 크면 = 잔액에 잡혀있는 가상 금액 → 거래내역에 'balance_sync' 행을 추가하면
        //                                       사용자 거래내역 SUM = bal 이 되고 잔액과 일치
        // 잔액 bal 이 sum 보다 작으면 = 거래내역엔 있으나 잔액엔 차감 → 똑같이 보정 행 추가
        const adjForTx = bal - sum  // tx 에 추가할 amount (양수면 +행, 음수면 -행)
        await db.prepare(`
          INSERT INTO transactions (user_id, type, coin_type, amount, description)
          VALUES (?, 'balance_sync', 'QKEY', ?, ?)
        `).bind(r.id, adjForTx, `[잔액 동기화] 사용자 거래내역 합계 보정 (tx_sum ${sum.toLocaleString()} → ${bal.toLocaleString()}, ${adjForTx >= 0 ? '+' : ''}${adjForTx.toLocaleString()})`).run()
        // 잔액 변경 없음 — 거래내역 SUM 이 잔액과 일치하도록 행만 추가
        updated.push({ id: r.id, balance: bal, old_tx_sum: sum, new_tx_sum: bal, adj_inserted: adjForTx })
        totalAdjustment += adjForTx
      } catch (e) {
        console.error('sync-balance-to-tx error for user', r.id, e)
      }
    }
    return c.json({ success: true, updatedCount: updated.length, totalAdjustment, updated })
  } catch (error) {
    console.error('sync-balance-to-tx error:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// ============================================================
// 어드민: swap_out / shop_purchase 부호 버그 정정 (사장님 지시 2026-05-07)
//   - 출금성 거래(swap_out, shop_purchase)는 amount 가 음수여야 정상이나
//     기존 INSERT 코드에서 양수로 저장된 row 들이 있어 transactions SUM 이 잔액과 불일치
//   - 잔액(qkey_balance)은 이미 정확히 차감되어 있음 → 잔액은 건드리지 않음
//   - 양수 row 의 amount 만 음수로 UPDATE → transactions SUM 이 잔액과 일치하게 됨
//   - 사용자 화면 영향 0 (사용자는 잔액과 reward 테이블만 봄, transactions 부호는 어드민 진단용)
// ============================================================
app.post('/api/admin/diag/fix-swap-sign', async (c) => {
  try {
    const db = c.env.DB
    const body = await c.req.json().catch(() => ({}))
    const dryRun = body.dryRun !== false

    // QKEY 출금성 거래 중 amount > 0 인 row 조회
    const rows = await db.prepare(`
      SELECT id, user_id, type, coin_type, amount, description, created_at
      FROM transactions
      WHERE coin_type = 'QKEY'
        AND type IN ('swap_out', 'shop_purchase')
        AND amount > 0
      ORDER BY user_id, id
    `).all()
    const targets = (rows.results || []) as any[]

    let totalAmount = 0
    const byUser: Record<number, number> = {}
    for (const r of targets) {
      totalAmount += Number(r.amount || 0)
      byUser[r.user_id] = (byUser[r.user_id] || 0) + Number(r.amount || 0)
    }

    if (dryRun) {
      return c.json({
        success: true,
        dryRun: true,
        targets_count: targets.length,
        total_amount_flipped: totalAmount,
        affected_users: Object.keys(byUser).length,
        by_user: byUser,
        targets,
        note: 'dryRun=true. 잔액은 변경되지 않음. amount 부호만 양수→음수로 정정됩니다.'
      })
    }

    // 실제 실행: amount 를 음수로 UPDATE
    let updatedCount = 0
    const updateLog: any[] = []
    for (const r of targets) {
      const newAmt = -Math.abs(Number(r.amount || 0))
      const upd = await db.prepare(`UPDATE transactions SET amount = ? WHERE id = ?`)
        .bind(newAmt, r.id).run()
      const changed = (upd.meta?.changes || 0)
      if (changed > 0) {
        updatedCount += changed
        updateLog.push({
          id: r.id, user_id: r.user_id, type: r.type,
          old_amount: r.amount, new_amount: newAmt,
          description: r.description
        })
      }
    }

    return c.json({
      success: true,
      dryRun: false,
      updated_count: updatedCount,
      total_amount_flipped: totalAmount,
      affected_users: Object.keys(byUser).length,
      by_user: byUser,
      updates: updateLog
    })
  } catch (error) {
    console.error('fix-swap-sign error:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// ============================================================
// 어드민: transactions 테이블 진짜 중복 정리 (사장님 지시 2026-05-07)
//   - 같은 (user_id, type, coin_type, description) 조합이 2번 이상 INSERT 된 경우
//     → 가장 큰 id (가장 최근) 1개만 KEEP, 나머지 모두 DELETE
//   - DELETE 시 users.qkey_balance 에서 해당 amount 만큼 차감 (과지급분 회수)
//   - 회수 transaction 은 type='_purge_internal' 로 기록 (사용자 화면에서 숨김 처리됨)
//   - 사용자 화면(rewards 섹션)은 daily_rewards/referral_rewards 테이블 기반 → 영향 없음
//   - 어드민 화면(transactions 섹션)에서 중복 row 사라짐 → 사용자 화면과 1:1 일치
// ============================================================
app.post('/api/admin/diag/purge-tx-duplicates', async (c) => {
  try {
    const db = c.env.DB
    const body = await c.req.json().catch(() => ({}))
    const dryRun = body.dryRun !== false  // 기본 true (안전)
    const fromDate = body.fromDate ? String(body.fromDate) : '2026-04-01'
    const toDate = body.toDate ? String(body.toDate) : '2099-12-31'

    // 같은 (user_id, type, coin_type, description) 그룹의 모든 row 조회
    const sql = `
      SELECT id, user_id, type, coin_type, amount, description, created_at
      FROM transactions
      WHERE coin_type = 'QKEY'
        AND date(datetime(created_at, '+9 hours')) BETWEEN ? AND ?
      ORDER BY user_id, type, description, id
    `
    const rows = await db.prepare(sql).bind(fromDate, toDate).all()
    const allRows = (rows.results || []) as any[]

    // 그룹핑
    const groups: Record<string, any[]> = {}
    for (const r of allRows) {
      const key = `${r.user_id}|${r.type}|${r.coin_type}|${r.description || ''}`
      if (!groups[key]) groups[key] = []
      groups[key].push(r)
    }

    // 중복 그룹 (2개 이상) 만 추출
    const duplicateGroups: any[] = []
    let totalDuplicateRows = 0
    let totalDuplicateAmount = 0
    const removeRowIds: number[] = []
    const balanceDeltaByUser: Record<number, number> = {}
    for (const key in groups) {
      const grp = groups[key]
      if (grp.length < 2) continue
      // id 가장 큰 것 KEEP (가장 최근)
      const keepRow = grp.reduce((a: any, b: any) => (b.id > a.id ? b : a))
      const removeRows = grp.filter((r: any) => r.id !== keepRow.id)
      const removeAmount = removeRows.reduce((sum: number, r: any) => sum + Number(r.amount || 0), 0)
      totalDuplicateRows += removeRows.length
      totalDuplicateAmount += removeAmount
      for (const r of removeRows) {
        removeRowIds.push(r.id)
        balanceDeltaByUser[r.user_id] = (balanceDeltaByUser[r.user_id] || 0) + Number(r.amount || 0)
      }
      duplicateGroups.push({
        key,
        user_id: grp[0].user_id,
        type: grp[0].type,
        description: grp[0].description,
        rows_total: grp.length,
        keep_row_id: keepRow.id,
        keep_row: keepRow,
        remove_rows: removeRows,
        remove_amount: removeAmount
      })
    }

    if (dryRun) {
      return c.json({
        success: true,
        dryRun: true,
        scope: { fromDate, toDate },
        analyzed_rows: allRows.length,
        duplicate_groups: duplicateGroups.length,
        rows_to_remove: totalDuplicateRows,
        amount_to_subtract: totalDuplicateAmount,
        affected_users: Object.keys(balanceDeltaByUser).length,
        balance_delta_by_user: balanceDeltaByUser,
        groups: duplicateGroups,
        note: 'dryRun=true 분석만 수행. 실제 정리는 dryRun:false 로 다시 호출하세요.'
      })
    }

    // 실제 실행: DELETE + 잔액 차감 + 감사 로그(_purge_internal)
    let deletedCount = 0
    let balanceSubtracted = 0
    const auditLogs: any[] = []
    for (const grp of duplicateGroups) {
      for (const r of grp.remove_rows) {
        // 1) transactions DELETE
        const del = await db.prepare(`DELETE FROM transactions WHERE id = ?`).bind(r.id).run()
        const removed = (del.meta?.changes || 0)
        deletedCount += removed
        if (removed > 0) {
          // 2) qkey_balance 차감
          await db.prepare(`UPDATE users SET qkey_balance = qkey_balance - ? WHERE id = ?`)
            .bind(Number(r.amount || 0), r.user_id).run()
          balanceSubtracted += Number(r.amount || 0)
          // 3) 감사 로그 (사용자 화면에서 숨김 처리되는 type='_purge_internal' 사용)
          //    잔액 변경분이 거래내역 SUM 과 자동 일치하도록 음수 row 1개 추가
          const desc = `[중복 거래 정리] tx_id=${r.id} type=${r.type} amount=-${r.amount} created=${r.created_at} keep=${grp.keep_row_id}`
          const ins = await db.prepare(`
            INSERT INTO transactions (user_id, type, coin_type, amount, description)
            VALUES (?, '_purge_internal', 'QKEY', ?, ?)
          `).bind(r.user_id, -Number(r.amount || 0), desc).run()
          auditLogs.push({ user_id: r.user_id, deleted_id: r.id, audit_id: (ins.meta as any)?.last_row_id, amount: r.amount })
        }
      }
    }

    return c.json({
      success: true,
      dryRun: false,
      scope: { fromDate, toDate },
      duplicate_groups: duplicateGroups.length,
      deleted_rows: deletedCount,
      balance_subtracted: balanceSubtracted,
      audit_logs_count: auditLogs.length,
      affected_users: Object.keys(balanceDeltaByUser).length,
      balance_delta_by_user: balanceDeltaByUser,
      audit_logs: auditLogs
    })
  } catch (error) {
    console.error('purge-tx-duplicates error:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// 진짜 중복 정리 — (user_id, type, coin_type, amount) 키 (description 무시)
// description 의 accrued 일자 표기만 다른 동일 보상 cron 다중 INSERT 잡기 위함
app.post('/api/admin/diag/purge-tx-duplicates-v2', async (c) => {
  try {
    const db = c.env.DB
    const body = await c.req.json().catch(() => ({}))
    const dryRun = body.dryRun !== false
    const fromDate = body.fromDate ? String(body.fromDate) : '2026-04-01'
    const toDate = body.toDate ? String(body.toDate) : '2099-12-31'
    const limitUser = body.userId ? Number(body.userId) : null  // 배치 처리: 특정 user_id 만
    const maxRows = body.maxRows ? Number(body.maxRows) : 0     // 배치 처리: 최대 삭제 행 수
    const keepBalance = body.keepBalance === true               // ★ 사장님 명령: 행만 삭제, 잔액 UPDATE 스킵
    // KST 같은 일자 내 (user_id, type, amount) 중복만 잡음 — 다른 일자의 정상 보상은 보호
    const sqlBase = `
      SELECT id, user_id, type, coin_type, amount, description, created_at,
             date(datetime(created_at, '+9 hours')) AS kst_date
      FROM transactions
      WHERE coin_type = 'QKEY'
        AND type IN ('referral_reward','daily_qkey','direct_referral')
        AND date(datetime(created_at, '+9 hours')) BETWEEN ? AND ?
        ${limitUser ? 'AND user_id = ?' : ''}
      ORDER BY user_id, type, amount, kst_date, id
    `
    const stmt = limitUser
      ? db.prepare(sqlBase).bind(fromDate, toDate, limitUser)
      : db.prepare(sqlBase).bind(fromDate, toDate)
    const rows = await stmt.all()
    const allRows = (rows.results || []) as any[]

    const groups: Record<string, any[]> = {}
    for (const r of allRows) {
      const key = `${r.user_id}|${r.type}|${r.coin_type}|${r.amount}|${r.kst_date}`
      if (!groups[key]) groups[key] = []
      groups[key].push(r)
    }

    const duplicateGroups: any[] = []
    let totalDuplicateRows = 0
    let totalDuplicateAmount = 0
    const balanceDeltaByUser: Record<number, number> = {}
    for (const key in groups) {
      const grp = groups[key]
      if (grp.length < 2) continue
      // id 가장 작은 것 KEEP (최초 정상 INSERT)
      const keepRow = grp.reduce((a: any, b: any) => (b.id < a.id ? b : a))
      const removeRows = grp.filter((r: any) => r.id !== keepRow.id)
      const removeAmount = removeRows.reduce((s: number, r: any) => s + Number(r.amount || 0), 0)
      totalDuplicateRows += removeRows.length
      totalDuplicateAmount += removeAmount
      for (const r of removeRows) {
        balanceDeltaByUser[r.user_id] = (balanceDeltaByUser[r.user_id] || 0) + Number(r.amount || 0)
      }
      duplicateGroups.push({
        key,
        user_id: grp[0].user_id,
        type: grp[0].type,
        amount: grp[0].amount,
        kst_date: grp[0].kst_date,
        rows_total: grp.length,
        keep_row_id: keepRow.id,
        remove_rows: removeRows.map((r: any) => ({ id: r.id, created_at: r.created_at, description: r.description })),
        remove_amount: removeAmount
      })
    }

    if (dryRun) {
      return c.json({
        success: true, dryRun: true, scope: { fromDate, toDate },
        analyzed_rows: allRows.length,
        duplicate_groups: duplicateGroups.length,
        rows_to_remove: totalDuplicateRows,
        amount_to_subtract: totalDuplicateAmount,
        affected_users: Object.keys(balanceDeltaByUser).length,
        balance_delta_by_user: balanceDeltaByUser,
        groups: duplicateGroups
      })
    }

    let deletedCount = 0
    let balanceSubtracted = 0
    const auditLogs: any[] = []
    let stoppedEarly = false
    for (const grp of duplicateGroups) {
      if (maxRows > 0 && deletedCount >= maxRows) { stoppedEarly = true; break }
      for (const r of grp.remove_rows) {
        if (maxRows > 0 && deletedCount >= maxRows) { stoppedEarly = true; break }
        const del = await db.prepare(`DELETE FROM transactions WHERE id = ?`).bind(r.id).run()
        const removed = (del.meta?.changes || 0)
        deletedCount += removed
        if (removed > 0) {
          if (!keepBalance) {
            await db.prepare(`UPDATE users SET qkey_balance = qkey_balance - ? WHERE id = ?`)
              .bind(Number(grp.amount || 0), grp.user_id).run()
            balanceSubtracted += Number(grp.amount || 0)
            const desc = `[중복v2 정리] tx_id=${r.id} type=${grp.type} amount=-${grp.amount} kst=${grp.kst_date} keep=${grp.keep_row_id}`
            const ins = await db.prepare(`
              INSERT INTO transactions (user_id, type, coin_type, amount, description)
              VALUES (?, '_purge_internal', 'QKEY', ?, ?)
            `).bind(grp.user_id, -Number(grp.amount || 0), desc).run()
            auditLogs.push({ user_id: grp.user_id, deleted_id: r.id, audit_id: (ins.meta as any)?.last_row_id, amount: grp.amount })
          } else {
            // keepBalance=true: 잔액 그대로, 행만 삭제 (사장님 명령)
            auditLogs.push({ user_id: grp.user_id, deleted_id: r.id, audit_id: null, amount: grp.amount, keepBalance: true })
          }
        }
      }
    }

    return c.json({
      success: true, dryRun: false, scope: { fromDate, toDate, userId: limitUser, maxRows },
      duplicate_groups: duplicateGroups.length,
      deleted_rows: deletedCount,
      balance_subtracted: balanceSubtracted,
      audit_logs_count: auditLogs.length,
      affected_users: Object.keys(balanceDeltaByUser).length,
      balance_delta_by_user: balanceDeltaByUser,
      stopped_early: stoppedEarly
    })
  } catch (error) {
    console.error('purge-tx-duplicates-v2 error:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// 옵션3 전용: 이미 삭제된 중복행에 대응하는 _purge_internal 보정행만 INSERT
//   - 행 삭제 없음, 잔액 UPDATE 없음
//   - balance-vs-tx 정합성 회복용 (잔액은 이미 정확, raw 합계만 -만큼 줄어든 상태)
//   - 사용자 화면은 _purge_internal 필터로 자동 숨김 → "정확히 받아야 할 1건"만 표시
//   - body: { dryRun?:bool, deltas: { [user_id:number]: amount:number }, reason?:string }
app.post('/api/admin/diag/insert-audit-compensation', async (c) => {
  try {
    const db = c.env.DB
    const body = await c.req.json().catch(() => ({})) as any
    const dryRun = body.dryRun !== false
    const deltas = body.deltas || {}
    const reason = String(body.reason || 'option3-hidden-compensation')

    const entries = Object.entries(deltas).map(([uid, amt]) => ({ user_id: Number(uid), amount: Number(amt) }))
    const validEntries = entries.filter(e => Number.isFinite(e.user_id) && Number.isFinite(e.amount) && e.amount > 0)
    const totalAmount = validEntries.reduce((s, e) => s + e.amount, 0)

    if (dryRun) {
      return c.json({
        success: true, dryRun: true,
        plan_users: validEntries.length,
        plan_total_amount: totalAmount,
        plan_rows_to_insert: validEntries.length,
        entries: validEntries
      })
    }

    let inserted = 0
    let totalSubtracted = 0
    const results: any[] = []
    for (const e of validEntries) {
      const desc = `[옵션3 은닉보정] user=${e.user_id} amount=-${e.amount} reason=${reason}`
      const ins = await db.prepare(`
        INSERT INTO transactions (user_id, type, coin_type, amount, description)
        VALUES (?, '_purge_internal', 'QKEY', ?, ?)
      `).bind(e.user_id, -e.amount, desc).run()
      inserted += 1
      totalSubtracted += e.amount
      results.push({ user_id: e.user_id, amount: -e.amount, audit_id: (ins.meta as any)?.last_row_id })
    }

    return c.json({
      success: true, dryRun: false,
      inserted_rows: inserted,
      total_compensated: -totalSubtracted,
      reason,
      results
    })
  } catch (error) {
    console.error('insert-audit-compensation error:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// 정책 정답값(referral_rewards/daily_rewards 진실)으로 잔액+transactions 동시 보정
//   - 14명 누락분만큼 qkey_balance += gap UPDATE + transactions INSERT 1건
//   - body: { dryRun?:bool, deltas: { [user_id]: { amount:number, type:'referral_reward'|'daily_qkey', desc?:string } }, kstDate?:string, reason?:string }
//   - 사장님 명시 GO 확보 (2026-05-07): "2700이 맞는걸 확인했으니 맞는쪽으로 전부 바꿔라"
app.post('/api/admin/diag/fix-missing-rewards-to-policy', async (c) => {
  try {
    const db = c.env.DB
    const body = await c.req.json().catch(() => ({})) as any
    const dryRun = body.dryRun !== false
    const deltas = body.deltas || {}
    const kstDate = String(body.kstDate || '2026-05-07')
    const reason = String(body.reason || 'policy-correction-2026-05-07')

    const entries = Object.entries(deltas).map(([uid, v]: [string, any]) => ({
      user_id: Number(uid),
      amount: Number(v?.amount ?? 0),
      tx_type: String(v?.type || 'referral_reward'),
      desc: String(v?.desc || `[정책보정-${kstDate}] gap=${v?.amount}`)
    }))
    const valid = entries.filter(e => Number.isFinite(e.user_id) && Number.isFinite(e.amount) && e.amount > 0)
    const totalAmount = valid.reduce((s, e) => s + e.amount, 0)

    if (dryRun) {
      return c.json({
        success: true, dryRun: true,
        plan_users: valid.length,
        plan_total_amount: totalAmount,
        plan_rows_to_insert: valid.length,
        plan_balance_updates: valid.length,
        kstDate, reason,
        entries: valid
      })
    }

    let inserted = 0
    let balanceUpdated = 0
    let totalAdded = 0
    const results: any[] = []
    for (const e of valid) {
      // 1) qkey_balance += gap (잔액 보정)
      const u = await db.prepare(`UPDATE users SET qkey_balance = qkey_balance + ? WHERE id = ?`).bind(e.amount, e.user_id).run()
      const updMeta = (u.meta as any) || {}
      if ((updMeta.changes ?? 1) > 0) balanceUpdated += 1

      // 2) transactions INSERT (표시 보정)
      const ins = await db.prepare(`
        INSERT INTO transactions (user_id, type, coin_type, amount, description)
        VALUES (?, ?, 'QKEY', ?, ?)
      `).bind(e.user_id, e.tx_type, e.amount, e.desc).run()
      inserted += 1
      totalAdded += e.amount

      results.push({
        user_id: e.user_id,
        amount: e.amount,
        tx_type: e.tx_type,
        tx_id: (ins.meta as any)?.last_row_id,
        balance_updated: true
      })
    }

    return c.json({
      success: true, dryRun: false,
      inserted_rows: inserted,
      balance_updates: balanceUpdated,
      total_added: totalAdded,
      kstDate, reason,
      results
    })
  } catch (error) {
    console.error('fix-missing-rewards-to-policy error:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// ★ 사장님 2026-05-07 명시 GO ★ 롤백 + IN-PLACE UPDATE (절대 새 보정 행 INSERT 금지)
//   STEP A: 직전 fix-missing-rewards-to-policy 보정 31건(tx_id 1585~1615) DELETE + qkey_balance −amount 환원
//   STEP B: 53명 기존 transactions/referral_rewards/daily_rewards 행의 amount를 정책 정확값으로 UPDATE
//           (예: 2,325 → 2,700 그 자리에 그대로 찍힘. 차액 행 별도 INSERT 절대 금지)
//   STEP C: qkey_balance를 UPDATE된 행의 차액만큼만 조정
//   행 자체가 없을 때만 신규 INSERT (cron 누락분만 보충)
//   body: {
//     dryRun?:bool, kstDate?:string,
//     rollback: [{tx_id, user_id, amount}],
//     updates: [{
//       user_id,
//       daily?: { tx_id, dr_id, target_amount, staking_id, daily_rate, period_days, accrued_count },
//       l1?: [{ tx_id, rr_id, referee_id, src_amt, target_amount }],
//       l2?: [{ tx_id, rr_id, referee_id, src_amt, target_amount }]
//     }]
//   }
app.post('/api/admin/diag/rollback-and-update-inplace', async (c) => {
  try {
    const db = c.env.DB
    const body = await c.req.json().catch(() => ({})) as any
    const dryRun = body.dryRun !== false
    const kstDate = String(body.kstDate || '2026-05-07')
    const rollback = Array.isArray(body.rollback) ? body.rollback : []
    const updates = Array.isArray(body.updates) ? body.updates : []
    // 중복/초과 행 DELETE (잔액도 차감)
    // rr_delete: [{rr_id, tx_id, user_id, amount}]  - referral_rewards 행 + 매칭 tx 행 동시 삭제
    // tx_delete: [{tx_id, user_id, amount}]         - transactions 단독 삭제 (잔액 -amount)
    // dr_delete: [{dr_id, tx_id, user_id, amount}]  - daily_rewards + 매칭 tx 동시 삭제
    const rrDelete = Array.isArray(body.rr_delete) ? body.rr_delete : []
    const txDelete = Array.isArray(body.tx_delete) ? body.tx_delete : []
    const drDelete = Array.isArray(body.dr_delete) ? body.dr_delete : []
    // direct_inserts: [{user_id, referee_id, stake_id, amount, kst_date, description}]
    //   - transactions(type=direct_referral) INSERT + qkey_balance += amount
    //   - 정책: 직접판매수당 = 하부 스테이크 원금 × 10% × 150 (USDT→QKEY 환산)
    //   - 중복 가드: 동일 (user_id + referee_id + stake_id) direct_referral 이미 존재 시 skip
    const directInserts = Array.isArray(body.direct_inserts) ? body.direct_inserts : []
    const reason = String(body.reason || 'rollback-and-update-inplace-2026-05-07')

    // === 검증 (dryRun 계획 수립) ===
    const rollbackTotal = rollback.reduce((s: number, r: any) => s + Number(r.amount || 0), 0)
    let plan_tx_updates = 0, plan_rr_updates = 0, plan_dr_updates = 0
    let plan_tx_inserts = 0, plan_rr_inserts = 0, plan_dr_inserts = 0
    let plan_balance_delta = 0
    const planEntries: any[] = []
    for (const up of updates) {
      const userId = Number(up.user_id)
      let userDelta = 0
      const detail: any = { user_id: userId, daily: null, l1: [], l2: [] }
      if (up.daily) {
        const tgt = Number(up.daily.target_amount || 0)
        const cur = Number(up.daily.current_amount || 0)
        const diff = tgt - cur
        userDelta += diff
        if (up.daily.tx_id) plan_tx_updates += 1; else if (tgt > 0) plan_tx_inserts += 1
        if (up.daily.dr_id) plan_dr_updates += 1; else if (tgt > 0) plan_dr_inserts += 1
        detail.daily = { tx_id: up.daily.tx_id || null, dr_id: up.daily.dr_id || null, current: cur, target: tgt, diff }
      }
      for (const r of (up.l1 || [])) {
        const tgt = Number(r.target_amount || 0)
        const cur = Number(r.current_amount || 0)
        const diff = tgt - cur
        userDelta += diff
        if (r.tx_id) plan_tx_updates += 1; else if (tgt > 0) plan_tx_inserts += 1
        if (r.rr_id) plan_rr_updates += 1; else if (tgt > 0) plan_rr_inserts += 1
        detail.l1.push({ tx_id: r.tx_id || null, rr_id: r.rr_id || null, referee_id: r.referee_id, current: cur, target: tgt, diff })
      }
      for (const r of (up.l2 || [])) {
        const tgt = Number(r.target_amount || 0)
        const cur = Number(r.current_amount || 0)
        const diff = tgt - cur
        userDelta += diff
        if (r.tx_id) plan_tx_updates += 1; else if (tgt > 0) plan_tx_inserts += 1
        if (r.rr_id) plan_rr_updates += 1; else if (tgt > 0) plan_rr_inserts += 1
        detail.l2.push({ tx_id: r.tx_id || null, rr_id: r.rr_id || null, referee_id: r.referee_id, current: cur, target: tgt, diff })
      }
      detail.user_balance_delta = userDelta
      plan_balance_delta += userDelta
      planEntries.push(detail)
    }

    // 중복/초과 행 DELETE 계획 합계
    const rrDeleteTotal = rrDelete.reduce((s: number, r: any) => s + Number(r.amount || 0), 0)
    const txDeleteTotal = txDelete.reduce((s: number, r: any) => s + Number(r.amount || 0), 0)
    const drDeleteTotal = drDelete.reduce((s: number, r: any) => s + Number(r.amount || 0), 0)
    const totalDeleteAmount = rrDeleteTotal + txDeleteTotal + drDeleteTotal

    // 직접판매수당 INSERT 계획 합계
    const directInsertTotal = directInserts.reduce((s: number, r: any) => s + Number(r.amount || 0), 0)

    if (dryRun) {
      return c.json({
        success: true, dryRun: true,
        kstDate, reason,
        plan_rollback_rows: rollback.length,
        plan_rollback_balance_revert: -rollbackTotal,
        plan_rr_delete_rows: rrDelete.length, plan_rr_delete_balance_revert: -rrDeleteTotal,
        plan_tx_delete_rows: txDelete.length, plan_tx_delete_balance_revert: -txDeleteTotal,
        plan_dr_delete_rows: drDelete.length, plan_dr_delete_balance_revert: -drDeleteTotal,
        plan_tx_updates, plan_tx_inserts,
        plan_rr_updates, plan_rr_inserts,
        plan_dr_updates, plan_dr_inserts,
        plan_direct_inserts: directInserts.length,
        plan_direct_inserts_total: directInsertTotal,
        plan_balance_delta_from_updates: plan_balance_delta,
        net_balance_change: plan_balance_delta - rollbackTotal - totalDeleteAmount + directInsertTotal,
        entries: planEntries
      })
    }

    // === STEP A: 롤백 (tx DELETE + qkey_balance 환원) ===
    let deletedRows = 0
    let revertedBalance = 0
    for (const r of rollback) {
      const txId = Number(r.tx_id)
      const userId = Number(r.user_id)
      const amount = Number(r.amount)
      if (!Number.isFinite(txId) || !Number.isFinite(userId) || !Number.isFinite(amount)) continue
      const exists = await db.prepare(`SELECT id, user_id, amount FROM transactions WHERE id = ?`).bind(txId).first() as any
      if (!exists) continue
      if (Number(exists.user_id) !== userId || Math.abs(Number(exists.amount) - amount) > 0.5) continue
      await db.prepare(`DELETE FROM transactions WHERE id = ?`).bind(txId).run()
      await db.prepare(`UPDATE users SET qkey_balance = qkey_balance - ? WHERE id = ?`).bind(amount, userId).run()
      deletedRows += 1
      revertedBalance += amount
    }

    // === STEP A2: 중복/초과 행 DELETE (rr_delete + 매칭 tx + 잔액 -amount) ===
    let rrDeleted = 0, rrDelTxDeleted = 0
    let totalRrDeletedAmount = 0
    for (const r of rrDelete) {
      const rrId = Number(r.rr_id)
      const txId = Number(r.tx_id || 0)
      const userId = Number(r.user_id)
      const amount = Number(r.amount)
      if (!Number.isFinite(rrId) || !Number.isFinite(userId) || !Number.isFinite(amount)) continue
      const rrExists = await db.prepare(`SELECT id, referrer_id, reward_amount FROM referral_rewards WHERE id = ?`).bind(rrId).first() as any
      if (!rrExists) continue
      if (Number(rrExists.referrer_id) !== userId || Math.abs(Number(rrExists.reward_amount) - amount) > 0.5) continue
      await db.prepare(`DELETE FROM referral_rewards WHERE id = ?`).bind(rrId).run()
      rrDeleted += 1
      // 매칭 transactions DELETE (tx_id 지정된 경우만, 안전)
      if (txId > 0) {
        const txExists = await db.prepare(`SELECT id, user_id, amount, type FROM transactions WHERE id = ?`).bind(txId).first() as any
        if (txExists && Number(txExists.user_id) === userId && Math.abs(Number(txExists.amount) - amount) < 0.5 && txExists.type === 'referral_reward') {
          await db.prepare(`DELETE FROM transactions WHERE id = ?`).bind(txId).run()
          rrDelTxDeleted += 1
        }
      }
      // 잔액 -amount
      await db.prepare(`UPDATE users SET qkey_balance = qkey_balance - ? WHERE id = ?`).bind(amount, userId).run()
      totalRrDeletedAmount += amount
    }

    // === STEP A3: tx_delete 단독 (잔액 -amount) ===
    let txDeleted = 0
    let totalTxDeletedAmount = 0
    for (const r of txDelete) {
      const txId = Number(r.tx_id)
      const userId = Number(r.user_id)
      const amount = Number(r.amount)
      if (!Number.isFinite(txId) || !Number.isFinite(userId) || !Number.isFinite(amount)) continue
      const exists = await db.prepare(`SELECT id, user_id, amount FROM transactions WHERE id = ?`).bind(txId).first() as any
      if (!exists) continue
      if (Number(exists.user_id) !== userId || Math.abs(Number(exists.amount) - amount) > 0.5) continue
      await db.prepare(`DELETE FROM transactions WHERE id = ?`).bind(txId).run()
      await db.prepare(`UPDATE users SET qkey_balance = qkey_balance - ? WHERE id = ?`).bind(amount, userId).run()
      txDeleted += 1
      totalTxDeletedAmount += amount
    }

    // === STEP A4: dr_delete (daily_rewards + 매칭 tx + 잔액 -amount) ===
    let drDeleted = 0, drDelTxDeleted = 0
    let totalDrDeletedAmount = 0
    for (const r of drDelete) {
      const drId = Number(r.dr_id)
      const txId = Number(r.tx_id || 0)
      const userId = Number(r.user_id)
      const amount = Number(r.amount)
      if (!Number.isFinite(drId) || !Number.isFinite(userId) || !Number.isFinite(amount)) continue
      const drExists = await db.prepare(`SELECT id, user_id, usdt_amount FROM daily_rewards WHERE id = ?`).bind(drId).first() as any
      if (!drExists) continue
      if (Number(drExists.user_id) !== userId || Math.abs(Number(drExists.usdt_amount) - amount) > 0.5) continue
      await db.prepare(`DELETE FROM daily_rewards WHERE id = ?`).bind(drId).run()
      drDeleted += 1
      if (txId > 0) {
        const txExists = await db.prepare(`SELECT id, user_id, amount, type FROM transactions WHERE id = ?`).bind(txId).first() as any
        if (txExists && Number(txExists.user_id) === userId && Math.abs(Number(txExists.amount) - amount) < 0.5 && txExists.type === 'daily_qkey') {
          await db.prepare(`DELETE FROM transactions WHERE id = ?`).bind(txId).run()
          drDelTxDeleted += 1
        }
      }
      await db.prepare(`UPDATE users SET qkey_balance = qkey_balance - ? WHERE id = ?`).bind(amount, userId).run()
      totalDrDeletedAmount += amount
    }

    // === STEP A5: 직접판매수당 INSERT (transactions(type=direct_referral) + qkey_balance +amount) ===
    //   - 정책: 하부 스테이크 원금 × 10% × 150 (USDT→QKEY 환산)
    //   - 원래 자리(스테이크 KST 일자)에 created_at 으로 박힘
    //   - 중복 가드: 동일 (user_id + amount + description) direct_referral 행 존재 시 skip
    let directInserted = 0
    let totalDirectInsertedAmount = 0
    const directInsertResults: any[] = []
    for (const r of directInserts) {
      const userId = Number(r.user_id)
      const refereeId = Number(r.referee_id || 0)
      const stakeId = Number(r.stake_id || 0)
      const amount = Number(r.amount || 0)
      const kstD = String(r.kst_date || kstDate)
      const desc = String(r.description || `Direct sales bonus (referee=${refereeId} stake=${stakeId} x 10%, paid ${kstD})`)
      if (!Number.isFinite(userId) || !Number.isFinite(amount) || amount <= 0) {
        directInsertResults.push({ user_id: userId, referee_id: refereeId, stake_id: stakeId, status: 'skip-invalid' })
        continue
      }
      // 중복 가드: 동일 user_id + amount + description (stake_id 식별자 기반)
      const existsTx = await db.prepare(`SELECT id FROM transactions WHERE user_id = ? AND type = 'direct_referral' AND amount = ? AND description = ? LIMIT 1`).bind(userId, amount, desc).first() as any
      if (existsTx) {
        directInsertResults.push({ user_id: userId, referee_id: refereeId, stake_id: stakeId, status: 'skip-duplicate', existing_tx_id: existsTx.id })
        continue
      }
      // KST 일자(YYYY-MM-DD) → UTC created_at (KST 12:00 = UTC 03:00 → 시각은 정오 기준으로 박음)
      // 단, KST 12:00 = UTC 03:00 (KST = UTC+9) 이므로 created_at = `${kstD} 03:00:00`
      const createdAt = `${kstD} 03:00:00`
      const insertRes = await db.prepare(`INSERT INTO transactions (user_id, type, coin_type, amount, description, created_at) VALUES (?, 'direct_referral', 'QKEY', ?, ?, ?)`).bind(userId, amount, desc, createdAt).run()
      await db.prepare(`UPDATE users SET qkey_balance = qkey_balance + ? WHERE id = ?`).bind(amount, userId).run()
      directInserted += 1
      totalDirectInsertedAmount += amount
      const newTxId = (insertRes as any)?.meta?.last_row_id || null
      directInsertResults.push({ user_id: userId, referee_id: refereeId, stake_id: stakeId, amount, kst_date: kstD, tx_id: newTxId, status: 'inserted' })
    }

    // === STEP B: IN-PLACE UPDATE (기존 행 amount → 정책 정확값) ===
    // === STEP C: qkey_balance를 차액만큼만 조정 ===
    let txUpdated = 0, rrUpdated = 0, drUpdated = 0
    let txInserted = 0, rrInserted = 0, drInserted = 0
    let totalBalanceDelta = 0
    const updResults: any[] = []
    for (const up of updates) {
      const userId = Number(up.user_id)
      let userDelta = 0
      const r: any = { user_id: userId }

      // (1) Daily 처리
      if (up.daily) {
        const tgt = Number(up.daily.target_amount || 0)
        const txId = Number(up.daily.tx_id || 0)
        const drId = Number(up.daily.dr_id || 0)
        const stakingId = Number(up.daily.staking_id || 0)
        const dailyRate = Number(up.daily.daily_rate || 0)
        const periodDays = Number(up.daily.period_days || 0)
        const accruedCount = Number(up.daily.accrued_count || 0)

        // transactions: 기존 행 UPDATE / 없으면 INSERT
        if (txId > 0) {
          const cur = await db.prepare(`SELECT amount FROM transactions WHERE id = ?`).bind(txId).first() as any
          if (cur) {
            const curAmt = Number(cur.amount)
            const desc = `Daily reward ${tgt.toLocaleString()} QKEY (${(dailyRate*100).toFixed(1)}%, ${accruedCount}/${periodDays}d, accrued ${kstDate} paid ${kstDate})`
            await db.prepare(`UPDATE transactions SET amount = ?, description = ? WHERE id = ?`).bind(tgt, desc, txId).run()
            userDelta += (tgt - curAmt)
            txUpdated += 1
          }
        } else if (tgt > 0 && stakingId > 0) {
          const desc = `Daily reward ${tgt.toLocaleString()} QKEY (${(dailyRate*100).toFixed(1)}%, ${accruedCount}/${periodDays}d, accrued ${kstDate} paid ${kstDate})`
          await db.prepare(`INSERT INTO transactions (user_id, type, coin_type, amount, description) VALUES (?, 'daily_qkey', 'QKEY', ?, ?)`).bind(userId, tgt, desc).run()
          userDelta += tgt
          txInserted += 1
        }

        // daily_rewards: 기존 행 UPDATE / 없으면 INSERT (5/8 cron 중복 가드용)
        if (drId > 0) {
          await db.prepare(`UPDATE daily_rewards SET usdt_amount = ? WHERE id = ?`).bind(tgt, drId).run()
          drUpdated += 1
        } else if (tgt > 0 && stakingId > 0) {
          const drExists = await db.prepare(`SELECT id FROM daily_rewards WHERE user_id=? AND staking_id=? AND reward_date=?`).bind(userId, stakingId, kstDate).first()
          if (!drExists) {
            await db.prepare(`INSERT INTO daily_rewards (user_id, staking_id, usdt_amount, reward_date, paid_date) VALUES (?, ?, ?, ?, ?)`).bind(userId, stakingId, tgt, kstDate, kstDate).run()
            drInserted += 1
          }
        }
        r.daily = { target: tgt, tx_id: txId, dr_id: drId }
      }

      // (2) L1 처리 (level=1)
      const l1Results: any[] = []
      for (const ref of (up.l1 || [])) {
        const tgt = Number(ref.target_amount || 0)
        const txId = Number(ref.tx_id || 0)
        const rrId = Number(ref.rr_id || 0)
        const refereeId = Number(ref.referee_id || 0)
        const srcAmt = Number(ref.src_amt || 0)

        if (txId > 0) {
          const cur = await db.prepare(`SELECT amount FROM transactions WHERE id = ?`).bind(txId).first() as any
          if (cur) {
            const curAmt = Number(cur.amount)
            const desc = `Level 1 referral bonus (${srcAmt.toLocaleString()} QKEY x 20%, accrued ${kstDate} paid ${kstDate})`
            await db.prepare(`UPDATE transactions SET amount = ?, description = ? WHERE id = ?`).bind(tgt, desc, txId).run()
            userDelta += (tgt - curAmt)
            txUpdated += 1
          }
        } else if (tgt > 0 && refereeId > 0) {
          const desc = `Level 1 referral bonus (${srcAmt.toLocaleString()} QKEY x 20%, accrued ${kstDate} paid ${kstDate})`
          await db.prepare(`INSERT INTO transactions (user_id, type, coin_type, amount, description) VALUES (?, 'referral_reward', 'QKEY', ?, ?)`).bind(userId, tgt, desc).run()
          userDelta += tgt
          txInserted += 1
        }

        if (rrId > 0) {
          await db.prepare(`UPDATE referral_rewards SET reward_amount = ?, original_amount = ? WHERE id = ?`).bind(tgt, srcAmt, rrId).run()
          rrUpdated += 1
        } else if (tgt > 0 && refereeId > 0) {
          const rrExists = await db.prepare(`SELECT id FROM referral_rewards WHERE referrer_id=? AND referee_id=? AND level=1 AND reward_date=?`).bind(userId, refereeId, kstDate).first()
          if (!rrExists) {
            await db.prepare(`INSERT INTO referral_rewards (referrer_id, referee_id, level, original_amount, reward_amount, reward_date, paid_date) VALUES (?, ?, 1, ?, ?, ?, ?)`).bind(userId, refereeId, srcAmt, tgt, kstDate, kstDate).run()
            rrInserted += 1
          }
        }
        l1Results.push({ referee_id: refereeId, target: tgt, tx_id: txId, rr_id: rrId })
      }
      r.l1 = l1Results

      // (3) L2 처리 (level=2)
      const l2Results: any[] = []
      for (const ref of (up.l2 || [])) {
        const tgt = Number(ref.target_amount || 0)
        const txId = Number(ref.tx_id || 0)
        const rrId = Number(ref.rr_id || 0)
        const refereeId = Number(ref.referee_id || 0)
        const srcAmt = Number(ref.src_amt || 0)

        if (txId > 0) {
          const cur = await db.prepare(`SELECT amount FROM transactions WHERE id = ?`).bind(txId).first() as any
          if (cur) {
            const curAmt = Number(cur.amount)
            const desc = `Level 2 referral bonus (${srcAmt.toLocaleString()} QKEY x 10%, accrued ${kstDate} paid ${kstDate})`
            await db.prepare(`UPDATE transactions SET amount = ?, description = ? WHERE id = ?`).bind(tgt, desc, txId).run()
            userDelta += (tgt - curAmt)
            txUpdated += 1
          }
        } else if (tgt > 0 && refereeId > 0) {
          const desc = `Level 2 referral bonus (${srcAmt.toLocaleString()} QKEY x 10%, accrued ${kstDate} paid ${kstDate})`
          await db.prepare(`INSERT INTO transactions (user_id, type, coin_type, amount, description) VALUES (?, 'referral_reward', 'QKEY', ?, ?)`).bind(userId, tgt, desc).run()
          userDelta += tgt
          txInserted += 1
        }

        if (rrId > 0) {
          await db.prepare(`UPDATE referral_rewards SET reward_amount = ?, original_amount = ? WHERE id = ?`).bind(tgt, srcAmt, rrId).run()
          rrUpdated += 1
        } else if (tgt > 0 && refereeId > 0) {
          const rrExists = await db.prepare(`SELECT id FROM referral_rewards WHERE referrer_id=? AND referee_id=? AND level=2 AND reward_date=?`).bind(userId, refereeId, kstDate).first()
          if (!rrExists) {
            await db.prepare(`INSERT INTO referral_rewards (referrer_id, referee_id, level, original_amount, reward_amount, reward_date, paid_date) VALUES (?, ?, 2, ?, ?, ?, ?)`).bind(userId, refereeId, srcAmt, tgt, kstDate, kstDate).run()
            rrInserted += 1
          }
        }
        l2Results.push({ referee_id: refereeId, target: tgt, tx_id: txId, rr_id: rrId })
      }
      r.l2 = l2Results

      // STEP C: 잔액을 차액만큼 조정
      if (userDelta !== 0) {
        await db.prepare(`UPDATE users SET qkey_balance = qkey_balance + ? WHERE id = ?`).bind(userDelta, userId).run()
      }
      r.balance_delta = userDelta
      totalBalanceDelta += userDelta
      updResults.push(r)
    }

    return c.json({
      success: true, dryRun: false,
      kstDate, reason,
      stepA: { deleted_rows: deletedRows, reverted_balance: -revertedBalance },
      stepA2_rr_delete: { rr_deleted: rrDeleted, matched_tx_deleted: rrDelTxDeleted, balance_revert: -totalRrDeletedAmount },
      stepA3_tx_delete: { tx_deleted: txDeleted, balance_revert: -totalTxDeletedAmount },
      stepA4_dr_delete: { dr_deleted: drDeleted, matched_tx_deleted: drDelTxDeleted, balance_revert: -totalDrDeletedAmount },
      stepA5_direct_inserts: { direct_inserted: directInserted, balance_added: totalDirectInsertedAmount, results: directInsertResults },
      stepB: { tx_updated: txUpdated, rr_updated: rrUpdated, dr_updated: drUpdated, tx_inserted: txInserted, rr_inserted: rrInserted, dr_inserted: drInserted },
      stepC: { total_balance_delta: totalBalanceDelta },
      net_balance_change: totalBalanceDelta - revertedBalance - totalRrDeletedAmount - totalTxDeletedAmount - totalDrDeletedAmount + totalDirectInsertedAmount,
      results: updResults
    })
  } catch (error) {
    console.error('rollback-and-update-inplace error:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// 사용자별 보상 내역 조회
app.get('/api/rewards/history/:userId', async (c) => {
  try {
    const userId = c.req.param('userId')
    const db = c.env.DB

    const rewards = await db.prepare(`
      SELECT usdt_amount, reward_date, created_at
      FROM daily_rewards
      WHERE user_id = ?
      ORDER BY reward_date DESC
      LIMIT 30
    `).bind(userId).all()

    return c.json({ 
      success: true, 
      rewards: rewards.results 
    })
  } catch (error) {
    return c.json({ error: t(c, 'rewards.history_error') }, 500)
  }
})

// ============================================
// API Routes - User
// ============================================

// 사용자 정보 조회
app.get('/api/user/:userId', async (c) => {
  try {
    const userId = c.req.param('userId')
    const db = c.env.DB

    const user = await db.prepare(`
      SELECT id, email, name, phone, wallet_address, usdt_wallet_address, qta_balance, qx_balance, qkey_balance, usdt_balance, created_at
      FROM users WHERE id = ?
    `).bind(userId).first()

    if (!user) {
      return c.json({ error: t(c, 'withdrawal.user_not_found') }, 404)
    }

    return c.json({ 
      success: true, 
      user 
    })
  } catch (error) {
    return c.json({ error: t(c, 'user.info_error') }, 500)
  }
})

// 거래 내역 조회 (사용자 화면)
//   ★ '_purge_internal' 타입은 어드민의 내부 정리용 감사 로그이므로 사용자 화면에서 숨김
//     (잔액 변동분만 거래내역 SUM 과 일치시키기 위한 보정 row, 사용자에겐 노출 X)
app.get('/api/transactions/:userId', async (c) => {
  try {
    const userId = c.req.param('userId')
    const db = c.env.DB

    // 사용자 화면 전용: 사용자가 실제 받은 QKEY 수량만 정확히 표시
    // - coin_type = 'QKEY' 만 반환 (QTA/QX/USDT staking 보상은 사용자 거래내역에서 제외 → 표시합 부풀림 방지)
    // - _purge_internal / balance_sync / admin_adjust 어드민 보정용은 사용자에게 숨김
    // - 어드민 화면(/api/admin/diag/transactions, /api/admin/user/:userId) 은 별도 raw 그대로 노출
    // - 모든 표시는 KST(+9h) 기준: GROUP BY 도 KST 일자, created_at 응답값도 KST 시각으로 변환
    // - 같은 KST 일자/type 거래는 SUM(amount) 으로 1줄 합산 표시
    const transactions = await db.prepare(`
      SELECT
        MAX(id) AS id,
        type,
        coin_type,
        SUM(amount) AS amount,
        MIN(description) AS description,
        datetime(MAX(created_at), '+9 hours') AS created_at,
        date(MAX(created_at), '+9 hours') AS kst_date
      FROM transactions
      WHERE user_id = ?
        AND coin_type = 'QKEY'
        AND type NOT IN ('_purge_internal', 'balance_sync', 'admin_adjust')
      GROUP BY date(created_at, '+9 hours'), type
      ORDER BY MAX(created_at) DESC
      LIMIT 50
    `).bind(userId).all()

    return c.json({ 
      success: true, 
      transactions: transactions.results 
    })
  } catch (error) {
    return c.json({ error: t(c, 'user.tx_error') }, 500)
  }
})

// 추천인 현황 조회
app.get('/api/referrals/:userId', async (c) => {
  try {
    const userId = c.req.param('userId')
    const db = c.env.DB

    // <span data-i18n="dash.level1_referral">Level 1 Referrals</span> (직접 추천)
    // 산하 회원의 staking_count/total_staking은 그 회원 본인의 진입현황을 그대로 표시
    const level1 = await db.prepare(`
      SELECT id, name, email, wallet_address, created_at, 
             (SELECT COUNT(*) FROM staking WHERE user_id = users.id AND status = 'active') as staking_count,
             (SELECT COALESCE(SUM(amount), 0) FROM staking WHERE user_id = users.id AND status = 'active') as total_staking
      FROM users
      WHERE referrer_id = ?
      ORDER BY created_at DESC
    `).bind(userId).all()

    // <span data-i18n="dash.level2_referral">Level 2 Referrals</span> (간접 추천)
    const level2 = await db.prepare(`
      SELECT u2.id, u2.name, u2.email, u2.wallet_address, u2.created_at,
             (SELECT COUNT(*) FROM staking WHERE user_id = u2.id AND status = 'active') as staking_count,
             (SELECT COALESCE(SUM(amount), 0) FROM staking WHERE user_id = u2.id AND status = 'active') as total_staking
      FROM users u1
      JOIN users u2 ON u2.referrer_id = u1.id
      WHERE u1.referrer_id = ?
      ORDER BY u2.created_at DESC
    `).bind(userId).all()

    // 추천 보상 총액 계산
    const rewardStats = await db.prepare(`
      SELECT 
        COALESCE(SUM(CASE WHEN description LIKE '%Level 1%' THEN amount ELSE 0 END), 0) as level1_rewards,
        COALESCE(SUM(CASE WHEN description LIKE '%Level 2%' THEN amount ELSE 0 END), 0) as level2_rewards
      FROM transactions
      WHERE user_id = ? AND type = 'referral_reward'
    `).bind(userId).first()

    return c.json({
      success: true,
      level1: level1.results || [],
      level2: level2.results || [],
      stats: {
        level1Count: level1.results?.length || 0,
        level2Count: level2.results?.length || 0,
        level1Rewards: rewardStats?.level1_rewards || 0,
        level2Rewards: rewardStats?.level2_rewards || 0,
        totalRewards: (rewardStats?.level1_rewards || 0) + (rewardStats?.level2_rewards || 0)
      }
    })
  } catch (error) {
    console.error('추천인 조회 오류:', error)
    return c.json({ error: t(c, 'referral.error') }, 500)
  }
})

// 추천인 보상 상세 내역 조회
app.get('/api/referral-rewards/:userId', async (c) => {
  try {
    const userId = c.req.param('userId')
    const db = c.env.DB

    // 전체 보상 내역 (배당금 + 직접판매 + 매칭추천수당 + 회수/복구 + 어드민 보정 포함, 누적)
    // ★ rollback/restore/admin_adjustment 타입도 포함시켜 사용자 화면이 어드민과 일치하도록 함
    // ★ 사장님 룰 (2026-05-06): 어드민 잔액 수정 내역(admin_adjustment) 도 사용자측에 명시 노출
    const rewards = await db.prepare(`
      SELECT 
        t.id,
        t.type,
        t.coin_type,
        t.amount,
        t.description,
        t.created_at,
        CASE 
          WHEN t.type = 'daily_qkey' THEN 'daily_qkey'
          WHEN t.type = 'direct_referral' THEN 'direct_referral'
          WHEN t.type = 'referral_reward' AND t.description LIKE '%Level 1%' THEN 'referral_level1'
          WHEN t.type = 'referral_reward' AND t.description LIKE '%Level 2%' THEN 'referral_level2'
          WHEN t.type = 'referral_reward' THEN 'referral_reward'
          WHEN t.type = 'daily_reward_rollback' THEN 'daily_reward_rollback'
          WHEN t.type = 'referral_reward_rollback' THEN 'referral_reward_rollback'
          WHEN t.type = 'rollback_restore' THEN 'rollback_restore'
          WHEN t.type = 'admin_adjustment' AND t.amount >= 0 THEN 'admin_adjustment_increase'
          WHEN t.type = 'admin_adjustment' AND t.amount < 0 THEN 'admin_adjustment_decrease'
          ELSE t.type
        END as reward_category
      FROM transactions t
      WHERE t.user_id = ? AND t.type IN ('daily_qkey', 'direct_referral', 'referral_reward', 'daily_reward_rollback', 'referral_reward_rollback', 'rollback_restore', 'admin_adjustment')
      ORDER BY t.created_at DESC
      LIMIT 300
    `).bind(userId).all()

    // 카테고리별 통계 계산 (rollback 차감 포함하여 net 합계)
    const stats = await db.prepare(`
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'daily_qkey' THEN amount ELSE 0 END), 0) as daily_total,
        COALESCE(SUM(CASE WHEN type = 'daily_qkey' THEN 1 ELSE 0 END), 0) as daily_count,
        COALESCE(SUM(CASE WHEN type = 'direct_referral' THEN amount ELSE 0 END), 0) as direct_total,
        COALESCE(SUM(CASE WHEN type = 'direct_referral' THEN 1 ELSE 0 END), 0) as direct_count,
        COALESCE(SUM(CASE WHEN type = 'referral_reward' AND description LIKE '%Level 1%' THEN amount ELSE 0 END), 0) as level1_total,
        COALESCE(SUM(CASE WHEN type = 'referral_reward' AND description LIKE '%Level 1%' THEN 1 ELSE 0 END), 0) as level1_count,
        COALESCE(SUM(CASE WHEN type = 'referral_reward' AND description LIKE '%Level 2%' THEN amount ELSE 0 END), 0) as level2_total,
        COALESCE(SUM(CASE WHEN type = 'referral_reward' AND description LIKE '%Level 2%' THEN 1 ELSE 0 END), 0) as level2_count,
        COALESCE(SUM(CASE WHEN type = 'daily_reward_rollback' THEN amount ELSE 0 END), 0) as daily_rollback_total,
        COALESCE(SUM(CASE WHEN type = 'referral_reward_rollback' THEN amount ELSE 0 END), 0) as ref_rollback_total,
        COALESCE(SUM(CASE WHEN type = 'rollback_restore' THEN amount ELSE 0 END), 0) as rollback_restore_total,
        COALESCE(SUM(amount), 0) as grand_total,
        COUNT(*) as total_count
      FROM transactions
      WHERE user_id = ? AND type IN ('daily_qkey', 'direct_referral', 'referral_reward', 'daily_reward_rollback', 'referral_reward_rollback', 'rollback_restore')
    `).bind(userId).first()

    // net = (paid) + (rollback) + (restore)  [rollback은 음수, restore는 양수]
    const dailyRollback = stats?.daily_rollback_total || 0
    const refRollback = stats?.ref_rollback_total || 0
    const rollbackRestore = stats?.rollback_restore_total || 0
    const dailyNet = (stats?.daily_total || 0) + dailyRollback // rollback은 이미 음수 저장
    const refLevel1Net = stats?.level1_total || 0
    const refLevel2Net = stats?.level2_total || 0
    // 매칭(level1+level2)에 대한 회수는 ref_rollback_total로 별도 표기
    return c.json({
      success: true,
      rewards: rewards.results || [],
      stats: {
        dailyTotal: dailyNet,
        dailyCount: stats?.daily_count || 0,
        directTotal: stats?.direct_total || 0,
        directCount: stats?.direct_count || 0,
        level1Total: refLevel1Net,
        level2Total: refLevel2Net,
        level1Count: stats?.level1_count || 0,
        level2Count: stats?.level2_count || 0,
        dailyRollback: dailyRollback,
        refRollback: refRollback,
        rollbackRestore: rollbackRestore,
        grandTotal: stats?.grand_total || 0,
        totalCount: stats?.total_count || 0
      }
    })
  } catch (error) {
    console.error('보상 내역 조회 오류:', error)
    return c.json({ error: t(c, 'rewards.history_error') }, 500)
  }
})

// ============================================
// Shop (QKEY 쇼핑몰) API
// ============================================

// DB 테이블 자동 생성
app.get('/api/shop/init', async (c) => {
  const db = c.env.DB
  await db.prepare(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price_krw INTEGER NOT NULL,
    image_url TEXT DEFAULT '',
    detail_image_url TEXT DEFAULT '',
    category TEXT DEFAULT '일반',
    stock INTEGER DEFAULT -1,
    is_active INTEGER DEFAULT 1,
    options TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`).run()
  // 기존 테이블에 컬럼 추가 (이미 있으면 무시)
  try { await db.prepare(`ALTER TABLE products ADD COLUMN detail_image_url TEXT DEFAULT ''`).run() } catch(e) {}
  try { await db.prepare(`ALTER TABLE products ADD COLUMN options TEXT DEFAULT ''`).run() } catch(e) {}
  await db.prepare(`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    price_krw INTEGER NOT NULL,
    qkey_used REAL NOT NULL,
    status TEXT DEFAULT 'paid',
    shipping_name TEXT DEFAULT '',
    shipping_phone TEXT DEFAULT '',
    shipping_address TEXT DEFAULT '',
    shipping_memo TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`).run()
  return c.json({ success: true, message: 'Shop tables created' })
})

// 상품 목록 (사용자용 - 활성 상품만)
app.get('/api/shop/products', async (c) => {
  const db = c.env.DB
  try {
    const products = await db.prepare(`SELECT * FROM products WHERE is_active = 1 ORDER BY created_at DESC`).all()
    return c.json({ success: true, products: products.results })
  } catch(e) {
    // 테이블이 없으면 자동 생성
    await db.prepare(`CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, description TEXT, price_krw INTEGER NOT NULL, image_url TEXT DEFAULT '', detail_image_url TEXT DEFAULT '', category TEXT DEFAULT '일반', stock INTEGER DEFAULT -1, is_active INTEGER DEFAULT 1, options TEXT DEFAULT '', created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`).run()
    try { await db.prepare(`ALTER TABLE products ADD COLUMN options TEXT DEFAULT ''`).run() } catch(eo) {}
    try { await db.prepare(`ALTER TABLE products ADD COLUMN detail_image_url TEXT DEFAULT ''`).run() } catch(e2) {}
    await db.prepare(`CREATE TABLE IF NOT EXISTS orders (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, product_id INTEGER NOT NULL, product_name TEXT NOT NULL, quantity INTEGER DEFAULT 1, price_krw INTEGER NOT NULL, qkey_used REAL NOT NULL, status TEXT DEFAULT 'paid', shipping_name TEXT DEFAULT '', shipping_phone TEXT DEFAULT '', shipping_address TEXT DEFAULT '', shipping_memo TEXT DEFAULT '', created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`).run()
    return c.json({ success: true, products: [] })
  }
})

// 상품 구매
app.post('/api/shop/order', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}))
    const { userId, productId, quantity, shippingName, shippingPhone, shippingAddress, shippingMemo, selectedOptions } = body || {}
    const db = c.env.DB
    const qty = quantity || 1

    // 입력 검증
    if (!userId || !productId) {
      return c.json({ error: '필수 정보(userId, productId)가 누락되었습니다' }, 400)
    }
    if (!shippingName || !shippingPhone || !shippingAddress) {
      return c.json({ error: '배송지 정보(이름/전화/주소)를 모두 입력해주세요' }, 400)
    }

    const product = await db.prepare(`SELECT * FROM products WHERE id = ? AND is_active = 1`).bind(productId).first()
    if (!product) return c.json({ error: '상품을 찾을 수 없습니다' }, 404)

    if (product.stock !== -1 && product.stock < qty) return c.json({ error: '재고가 부족합니다' }, 400)

    const totalKrw = (product.price_krw as number) * qty
    const qkeyNeeded = totalKrw / 10  // 1 QKEY = 10원

    const user = await db.prepare(`SELECT id, qkey_balance, name FROM users WHERE id = ?`).bind(userId).first()
    if (!user) return c.json({ error: '사용자를 찾을 수 없습니다' }, 404)

    if ((user.qkey_balance as number) < qkeyNeeded) {
      return c.json({ error: `QKEY 잔액이 부족합니다. 필요: ${qkeyNeeded.toLocaleString()} QKEY / 보유: ${(user.qkey_balance as number).toLocaleString()} QKEY` }, 400)
    }

    // QKEY 차감 - 경쟁조건 방지
    const purchaseResult = await db.prepare(`UPDATE users SET qkey_balance = qkey_balance - ? WHERE id = ? AND qkey_balance >= ?`).bind(qkeyNeeded, userId, qkeyNeeded).run()
    if (!purchaseResult.meta.changes || purchaseResult.meta.changes === 0) {
      return c.json({ error: `QKEY 잔액이 부족합니다 (concurrent request)` }, 400)
    }

    // 재고 차감 - 경쟁조건 방지
    if (product.stock !== -1) {
      const stockResult = await db.prepare(`UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?`).bind(qty, productId, qty).run()
      if (!stockResult.meta.changes || stockResult.meta.changes === 0) {
        // 재고 부족 시 QKEY 환불
        await db.prepare(`UPDATE users SET qkey_balance = qkey_balance + ? WHERE id = ?`).bind(qkeyNeeded, userId).run()
        return c.json({ error: '재고가 부족합니다 (동시 구매로 인한 재고 소진)' }, 400)
      }
    }

    // 주문 생성
    await db.prepare(`INSERT INTO orders (user_id, product_id, product_name, quantity, price_krw, qkey_used, shipping_name, shipping_phone, shipping_address, shipping_memo) VALUES (?,?,?,?,?,?,?,?,?,?)`).bind(
      userId, productId, product.name, qty, totalKrw, qkeyNeeded,
      shippingName || '', shippingPhone || '', shippingAddress || '', (selectedOptions ? '[옵션: ' + selectedOptions + '] ' : '') + (shippingMemo || '')
    ).run()

    // 거래 기록 — ★ 출금성 거래는 음수로 저장 (잔액=tx_sum 정합성)
    await db.prepare(`INSERT INTO transactions (user_id, type, coin_type, amount, description) VALUES (?, 'shop_purchase', 'QKEY', ?, ?)`).bind(
      userId, -Math.abs(qkeyNeeded), `쇼핑몰 구매: ${product.name} x${qty} (${totalKrw.toLocaleString()}원)`
    ).run()

    return c.json({ success: true, message: `${product.name} 구매 완료! (${qkeyNeeded.toLocaleString()} QKEY 사용)`, qkeyUsed: qkeyNeeded })
  } catch (error) {
    return c.json({ error: '구매 처리 중 오류가 발생했습니다' }, 500)
  }
})

// 내 주문 내역
app.get('/api/shop/orders/:userId', async (c) => {
  try {
    const db = c.env.DB
    const userId = c.req.param('userId')
    const orders = await db.prepare(`SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC`).bind(userId).all()
    return c.json({ success: true, orders: orders.results })
  } catch(e) {
    return c.json({ success: true, orders: [] })
  }
})

// 사용자: 주문 취소 (paid 상태에서만 가능, QKEY 환불 + 재고 복구)
app.post('/api/shop/order/:orderId/cancel', async (c) => {
  try {
    const db = c.env.DB
    const orderId = c.req.param('orderId')
    const body = await c.req.json().catch(() => ({}))
    const { userId } = body || {}
    if (!userId) return c.json({ error: '사용자 정보가 필요합니다' }, 400)

    const order = await db.prepare(`SELECT * FROM orders WHERE id = ? AND user_id = ?`).bind(orderId, userId).first()
    if (!order) return c.json({ error: '주문을 찾을 수 없습니다' }, 404)
    if (order.status !== 'paid') {
      const labelMap: Record<string,string> = { shipping:'배송중', delivered:'배송완료', cancelled:'이미 취소됨' }
      return c.json({ error: `취소할 수 없는 상태입니다 (현재: ${labelMap[order.status as string] || order.status}). 결제완료(paid) 상태에서만 취소 가능합니다.` }, 400)
    }

    // cancelled_at / cancelled_by / cancel_reason 컬럼 보장
    try { await db.prepare(`ALTER TABLE orders ADD COLUMN cancelled_at DATETIME`).run() } catch(e) {}
    try { await db.prepare(`ALTER TABLE orders ADD COLUMN cancelled_by TEXT`).run() } catch(e) {}
    try { await db.prepare(`ALTER TABLE orders ADD COLUMN cancel_reason TEXT`).run() } catch(e) {}

    // 상태 변경 (경쟁조건 방지: paid 상태에서만)
    const upd = await db.prepare(`UPDATE orders SET status = 'cancelled', cancelled_at = CURRENT_TIMESTAMP, cancelled_by = 'user', cancel_reason = '사용자 직접 취소' WHERE id = ? AND status = 'paid'`).bind(orderId).run()
    if (!upd.meta.changes) return c.json({ error: '이미 처리된 주문입니다' }, 400)

    // QKEY 환불
    await db.prepare(`UPDATE users SET qkey_balance = qkey_balance + ? WHERE id = ?`).bind(order.qkey_used, userId).run()

    // 재고 복구 (재고 관리하는 상품만)
    try {
      await db.prepare(`UPDATE products SET stock = stock + ? WHERE id = ? AND stock != -1`).bind(order.quantity, order.product_id).run()
    } catch(eStock) {}

    // 환불 거래 기록
    await db.prepare(`INSERT INTO transactions (user_id, type, coin_type, amount, description) VALUES (?, 'shop_refund', 'QKEY', ?, ?)`).bind(
      userId, order.qkey_used, `쇼핑몰 구매취소 환불: ${order.product_name} x${order.quantity}`
    ).run()

    return c.json({ success: true, message: `구매가 취소되었습니다. ${Number(order.qkey_used).toLocaleString()} QKEY가 환불되었습니다.`, refunded: order.qkey_used })
  } catch (error) {
    return c.json({ error: '주문 취소 처리 중 오류가 발생했습니다' }, 500)
  }
})

// 어드민: 상품 등록
app.post('/api/admin/shop/product', async (c) => {
  try {
    const { name, description, price_krw, image_url, detail_image_url, category, stock, options } = await c.req.json()
    if (!name || !price_krw) return c.json({ error: '상품명과 가격은 필수입니다' }, 400)
    // 이미지 크기 검증 (D1 row limit ~1MB, Base64 overhead 고려하여 500KB 제한)
    const imgSize = (image_url || '').length + (detail_image_url || '').length
    if (imgSize > 950 * 1024) {
      return c.json({ error: '이미지 용량이 너무 큽니다. 이미지를 줄여주세요.' }, 400)
    }
    const db = c.env.DB
    // 테이블 자동 생성 + 컬럼 마이그레이션
    await db.prepare(`CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, description TEXT, price_krw INTEGER NOT NULL, image_url TEXT DEFAULT '', detail_image_url TEXT DEFAULT '', category TEXT DEFAULT '일반', stock INTEGER DEFAULT -1, is_active INTEGER DEFAULT 1, options TEXT DEFAULT '', created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`).run()
    try { await db.prepare(`ALTER TABLE products ADD COLUMN options TEXT DEFAULT ''`).run() } catch(eo) {}
    try { await db.prepare(`ALTER TABLE products ADD COLUMN detail_image_url TEXT DEFAULT ''`).run() } catch(e2) {}
    const optionsStr = options ? (typeof options === 'string' ? options : JSON.stringify(options)) : ''
    await db.prepare(`INSERT INTO products (name, description, price_krw, image_url, detail_image_url, category, stock, options) VALUES (?,?,?,?,?,?,?,?)`).bind(
      name, description || '', price_krw, image_url || '', detail_image_url || '', category || '일반', stock ?? -1, optionsStr
    ).run()
    return c.json({ success: true, message: '상품이 등록되었습니다' })
  } catch(e: any) {
    const errMsg = e?.message || ''
    if (errMsg.includes('too large') || errMsg.includes('SQLITE_TOOBIG')) {
      return c.json({ error: '데이터가 너무 큽니다. 이미지 크기를 줄여주세요.' }, 400)
    }
    return c.json({ error: '상품 등록 중 오류가 발생했습니다: ' + errMsg }, 500)
  }
})

// 어드민: 상품 수정
app.put('/api/admin/shop/product/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const { name, description, price_krw, image_url, detail_image_url, category, stock, is_active, options } = await c.req.json()
    // 이미지 크기 검증
    const imgSize = (image_url || '').length + (detail_image_url || '').length
    if (imgSize > 950 * 1024) {
      return c.json({ error: '이미지 용량이 너무 큽니다. 이미지를 줄여주세요.' }, 400)
    }
    const db = c.env.DB
    try { await db.prepare(`ALTER TABLE products ADD COLUMN detail_image_url TEXT DEFAULT ''`).run() } catch(e2) {}
    try { await db.prepare(`ALTER TABLE products ADD COLUMN options TEXT DEFAULT ''`).run() } catch(eo) {}
    const optionsStr = options ? (typeof options === 'string' ? options : JSON.stringify(options)) : ''
    // 존재 여부 확인 (없는 ID에 대해 200을 반환하던 버그 수정)
    const existing = await db.prepare(`SELECT id FROM products WHERE id = ?`).bind(id).first()
    if (!existing) {
      return c.json({ error: '해당 상품을 찾을 수 없습니다' }, 404)
    }
    const result = await db.prepare(`UPDATE products SET name=?, description=?, price_krw=?, image_url=?, detail_image_url=?, category=?, stock=?, is_active=?, options=? WHERE id=?`).bind(
      name, description || '', price_krw, image_url || '', detail_image_url || '', category || '일반', stock ?? -1, is_active ?? 1, optionsStr, id
    ).run()
    const changes = (result as any)?.meta?.changes ?? 0
    if (!changes) {
      return c.json({ error: '상품 수정에 실패했습니다 (변경된 행 없음)' }, 404)
    }
    return c.json({ success: true, message: '상품이 수정되었습니다' })
  } catch(e: any) {
    const errMsg = e?.message || ''
    if (errMsg.includes('too large') || errMsg.includes('SQLITE_TOOBIG')) {
      return c.json({ error: '데이터가 너무 큽니다. 이미지 크기를 줄여주세요.' }, 400)
    }
    return c.json({ error: '상품 수정 중 오류가 발생했습니다: ' + errMsg }, 500)
  }
})

// 어드민: 상품 삭제
app.delete('/api/admin/shop/product/:id', async (c) => {
  try {
    const db = c.env.DB
    const id = c.req.param('id')

    // 존재 확인
    const exists = await db.prepare(`SELECT id FROM products WHERE id = ?`).bind(id).first()
    if (!exists) {
      return c.json({ error: '해당 상품을 찾을 수 없습니다' }, 404)
    }

    await db.prepare(`DELETE FROM products WHERE id = ?`).bind(id).run()
    return c.json({ success: true })
  } catch(e) {
    return c.json({ error: '상품 삭제 중 오류가 발생했습니다' }, 500)
  }
})

// 어드민: 전체 상품 목록 (비활성 포함)
app.get('/api/admin/shop/products', async (c) => {
  const db = c.env.DB
  try {
    const products = await db.prepare(`SELECT * FROM products ORDER BY created_at DESC`).all()
    return c.json({ success: true, products: products.results })
  } catch(e) {
    await db.prepare(`CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, description TEXT, price_krw INTEGER NOT NULL, image_url TEXT DEFAULT '', detail_image_url TEXT DEFAULT '', category TEXT DEFAULT '일반', stock INTEGER DEFAULT -1, is_active INTEGER DEFAULT 1, options TEXT DEFAULT '', created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`).run()
    try { await db.prepare(`ALTER TABLE products ADD COLUMN options TEXT DEFAULT ''`).run() } catch(eo) {}
    try { await db.prepare(`ALTER TABLE products ADD COLUMN detail_image_url TEXT DEFAULT ''`).run() } catch(e2) {}
    return c.json({ success: true, products: [] })
  }
})

// 어드민: 전체 주문 현황 (실시간)
app.get('/api/admin/shop/orders', async (c) => {
  const db = c.env.DB
  try {
    const orders = await db.prepare(`
      SELECT o.*, u.name as user_name, u.email as user_email, u.phone as user_phone
      FROM orders o JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC LIMIT 200
    `).all()

    const stats = await db.prepare(`
      SELECT COUNT(*) as total_orders, SUM(qkey_used) as total_qkey, SUM(price_krw) as total_krw,
      COUNT(DISTINCT user_id) as unique_buyers FROM orders
    `).first()

    return c.json({ success: true, orders: orders.results, stats })
  } catch(e) {
    await db.prepare(`CREATE TABLE IF NOT EXISTS orders (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, product_id INTEGER NOT NULL, product_name TEXT NOT NULL, quantity INTEGER DEFAULT 1, price_krw INTEGER NOT NULL, qkey_used REAL NOT NULL, status TEXT DEFAULT 'paid', shipping_name TEXT DEFAULT '', shipping_phone TEXT DEFAULT '', shipping_address TEXT DEFAULT '', shipping_memo TEXT DEFAULT '', created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`).run()
    return c.json({ success: true, orders: [], stats: { total_orders: 0, total_qkey: 0, total_krw: 0, unique_buyers: 0 } })
  }
})

// 어드민: 주문 상태 변경 (+송장번호)
app.put('/api/admin/shop/order/:id/status', async (c) => {
  try {
    const { status, trackingNo, courier } = await c.req.json()
    const db = c.env.DB
    const orderId = c.req.param('id')
    // 존재 여부 확인 (없는 ID에 대해 200을 반환하던 버그 수정)
    const order = await db.prepare(`SELECT * FROM orders WHERE id = ?`).bind(orderId).first() as any
    if (!order) {
      return c.json({ error: '해당 주문을 찾을 수 없습니다' }, 404)
    }
    // ★ cancelled 로 변경하는 경우: 자동 환불 + 재고 복구 (이미 취소된 주문은 중복환불 방지)
    let refundedQkey = 0
    if (status === 'cancelled' && order.status !== 'cancelled') {
      // cancelled_at / cancelled_by / cancel_reason 컬럼 보장
      try { await db.prepare(`ALTER TABLE orders ADD COLUMN cancelled_at DATETIME`).run() } catch(e) {}
      try { await db.prepare(`ALTER TABLE orders ADD COLUMN cancelled_by TEXT`).run() } catch(e) {}
      try { await db.prepare(`ALTER TABLE orders ADD COLUMN cancel_reason TEXT`).run() } catch(e) {}
      const upd = await db.prepare(`UPDATE orders SET status = 'cancelled', cancelled_at = CURRENT_TIMESTAMP, cancelled_by = 'admin', cancel_reason = '관리자 처리 취소' WHERE id = ? AND status != 'cancelled'`).bind(orderId).run()
      if (upd.meta.changes) {
        // QKEY 환불
        await db.prepare(`UPDATE users SET qkey_balance = qkey_balance + ? WHERE id = ?`).bind(order.qkey_used, order.user_id).run()
        // 재고 복구 (재고 관리하는 상품만)
        try {
          await db.prepare(`UPDATE products SET stock = stock + ? WHERE id = ? AND stock != -1`).bind(order.quantity, order.product_id).run()
        } catch(eStock) {}
        // 환불 거래 기록
        await db.prepare(`INSERT INTO transactions (user_id, type, coin_type, amount, description) VALUES (?, 'shop_refund', 'QKEY', ?, ?)`).bind(
          order.user_id, order.qkey_used, `[관리자] 쇼핑몰 구매취소 환불: ${order.product_name} x${order.quantity}`
        ).run()
        refundedQkey = order.qkey_used as number
      }
      return c.json({ success: true, refunded: refundedQkey, message: refundedQkey ? `취소 처리 완료. ${Number(refundedQkey).toLocaleString()} QKEY 환불됨.` : '취소 처리 완료' })
    }
    // shipping_memo에 송장정보 추가
    if (trackingNo) {
      const trackingInfo = (courier ? '[' + courier + '] ' : '') + '송장: ' + trackingNo
      const memo = order?.shipping_memo ? order.shipping_memo + ' | ' + trackingInfo : trackingInfo
      await db.prepare(`UPDATE orders SET status = ?, shipping_memo = ? WHERE id = ?`).bind(status, memo, orderId).run()
    } else {
      await db.prepare(`UPDATE orders SET status = ? WHERE id = ?`).bind(status, orderId).run()
    }
    return c.json({ success: true })
  } catch(e) {
    return c.json({ error: '상태 변경 중 오류가 발생했습니다' }, 500)
  }
})

// 어드민: 주문현황 CSV 다운로드
app.get('/api/admin/shop/export/orders', async (c) => {
  const db = c.env.DB
  try {
    const orders = await db.prepare(`
      SELECT o.id, u.name as user_name, u.email as user_email, u.phone as user_phone,
        o.product_name, o.quantity, o.price_krw, o.qkey_used, o.status,
        o.shipping_name, o.shipping_phone, o.shipping_address, o.shipping_memo, o.created_at
      FROM orders o JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC
    `).all()
    const statusLabels: Record<string,string> = {paid:'결제완료',shipping:'배송중',delivered:'배송완료',cancelled:'취소'}
    const header = '주문번호,주문자,이메일,전화번호,상품명,수량,금액(원),QKEY사용,상태,수령인,수령연락처,배송주소,배송메모,주문일시'
    const rows = (orders.results || []).map((o: any) =>
      [o.id, o.user_name, o.user_email, o.user_phone, o.product_name, o.quantity, o.price_krw, o.qkey_used,
       statusLabels[o.status]||o.status, o.shipping_name, o.shipping_phone,
       '"'+(o.shipping_address||'').replace(/"/g,'""')+'"', o.shipping_memo, o.created_at].join(',')
    )
    const csv = '\uFEFF' + header + '\n' + rows.join('\n')
    return new Response(csv, { headers: { 'Content-Type': 'text/csv;charset=utf-8', 'Content-Disposition': 'attachment;filename=shop_orders_export.csv' } })
  } catch(e) {
    return new Response('주문 데이터가 없습니다', { status: 404 })
  }
})

// ============================================
// Shop Inquiries (쇼핑몰 문의)
// ============================================

async function ensureInquiriesTable(db: any) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS shop_inquiries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    order_id INTEGER DEFAULT NULL,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    admin_reply TEXT DEFAULT '',
    replied_at DATETIME DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`).run()
}

// 사용자: 문의 등록
app.post('/api/shop/inquiry', async (c) => {
  try {
    const db = c.env.DB
    await ensureInquiriesTable(db)
    const body = await c.req.json().catch(() => ({}))
    const { userId, orderId, category, title, content } = body || {}
    if (!userId) return c.json({ error: '사용자 정보가 필요합니다' }, 400)
    if (!category || !['shipping','refund','other'].includes(String(category))) {
      return c.json({ error: '문의 유형을 선택해주세요 (배송/환불/기타)' }, 400)
    }
    if (!title || String(title).trim().length === 0) return c.json({ error: '제목을 입력해주세요' }, 400)
    if (!content || String(content).trim().length === 0) return c.json({ error: '문의 내용을 입력해주세요' }, 400)
    const r = await db.prepare(
      `INSERT INTO shop_inquiries (user_id, order_id, category, title, content) VALUES (?, ?, ?, ?, ?)`
    ).bind(Number(userId), orderId ? Number(orderId) : null, String(category), String(title).trim(), String(content).trim()).run()
    return c.json({ success: true, id: r.meta?.last_row_id, message: '문의가 등록되었습니다' })
  } catch (error) {
    console.error('inquiry create error:', error)
    return c.json({ error: '문의 등록 중 오류가 발생했습니다' }, 500)
  }
})

// 사용자: 본인 문의 목록 (본인만 조회 가능)
app.get('/api/shop/inquiries/:userId', async (c) => {
  try {
    const db = c.env.DB
    await ensureInquiriesTable(db)
    const userId = c.req.param('userId')
    if (!userId) return c.json({ error: '사용자 정보가 필요합니다' }, 400)
    const list = await db.prepare(
      `SELECT id, user_id, order_id, category, title, content, status, admin_reply, replied_at, created_at
       FROM shop_inquiries WHERE user_id = ? ORDER BY created_at DESC`
    ).bind(Number(userId)).all()
    return c.json({ success: true, inquiries: list.results })
  } catch (error) {
    console.error('inquiry list error:', error)
    return c.json({ error: '문의 조회 중 오류가 발생했습니다' }, 500)
  }
})

// 사용자: 본인 문의 단건 (본인 소유 검증)
app.get('/api/shop/inquiry/:id', async (c) => {
  try {
    const db = c.env.DB
    await ensureInquiriesTable(db)
    const id = c.req.param('id')
    const userId = c.req.query('userId')
    if (!userId) return c.json({ error: '사용자 정보가 필요합니다' }, 400)
    const row = await db.prepare(
      `SELECT id, user_id, order_id, category, title, content, status, admin_reply, replied_at, created_at
       FROM shop_inquiries WHERE id = ? AND user_id = ?`
    ).bind(Number(id), Number(userId)).first()
    if (!row) return c.json({ error: '문의를 찾을 수 없습니다' }, 404)
    return c.json({ success: true, inquiry: row })
  } catch (error) {
    return c.json({ error: '문의 조회 중 오류가 발생했습니다' }, 500)
  }
})

// 어드민: 모든 문의 목록 (어드민 토큰 미들웨어가 /api/admin/* 자동 보호)
app.get('/api/admin/shop/inquiries', async (c) => {
  try {
    const db = c.env.DB
    await ensureInquiriesTable(db)
    const list = await db.prepare(
      `SELECT i.id, i.user_id, u.name as user_name, u.email as user_email, u.phone as user_phone,
              i.order_id, i.category, i.title, i.content, i.status, i.admin_reply, i.replied_at, i.created_at
       FROM shop_inquiries i LEFT JOIN users u ON i.user_id = u.id
       ORDER BY i.created_at DESC`
    ).all()
    return c.json({ success: true, inquiries: list.results })
  } catch (error) {
    console.error('admin inquiry list error:', error)
    return c.json({ error: '문의 조회 중 오류가 발생했습니다' }, 500)
  }
})

// 어드민: 문의 답변 (pending → answered)
app.post('/api/admin/shop/inquiry/:id/reply', async (c) => {
  try {
    const db = c.env.DB
    await ensureInquiriesTable(db)
    const id = c.req.param('id')
    const body = await c.req.json().catch(() => ({}))
    const { reply } = body || {}
    if (!reply || String(reply).trim().length === 0) return c.json({ error: '답변 내용을 입력해주세요' }, 400)
    await db.prepare(
      `UPDATE shop_inquiries SET admin_reply = ?, replied_at = CURRENT_TIMESTAMP, status = 'answered' WHERE id = ?`
    ).bind(String(reply).trim(), Number(id)).run()
    return c.json({ success: true, message: '답변이 등록되었습니다' })
  } catch (error) {
    console.error('admin inquiry reply error:', error)
    return c.json({ error: '답변 등록 중 오류가 발생했습니다' }, 500)
  }
})

// 어드민: 문의 삭제
app.delete('/api/admin/shop/inquiry/:id', async (c) => {
  try {
    const db = c.env.DB
    await ensureInquiriesTable(db)
    const id = c.req.param('id')
    await db.prepare(`DELETE FROM shop_inquiries WHERE id = ?`).bind(Number(id)).run()
    return c.json({ success: true, message: '문의가 삭제되었습니다' })
  } catch (error) {
    return c.json({ error: '삭제 중 오류가 발생했습니다' }, 500)
  }
})

// ============================================
// Notices (공지사항)
// ============================================

// 공지사항 테이블 보장
async function ensureNoticesTable(db: any) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS notices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_pinned INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`).run()
}

// 공지사항 목록 (사용자용 - 활성만)
app.get('/api/notices', async (c) => {
  try {
    const db = c.env.DB
    await ensureNoticesTable(db)
    const list = await db.prepare(`
      SELECT id, title, content, is_pinned, created_at, updated_at
      FROM notices
      WHERE is_active = 1
      ORDER BY is_pinned DESC, created_at DESC
      LIMIT 50
    `).all()
    return c.json({ success: true, notices: list.results || [] })
  } catch (e: any) {
    return c.json({ success: false, error: e.message || 'notice_list_error' }, 500)
  }
})

// 공지사항 단건 조회 (사용자/어드민 공용)
app.get('/api/notices/:id', async (c) => {
  try {
    const db = c.env.DB
    await ensureNoticesTable(db)
    const id = c.req.param('id')
    const row = await db.prepare(`SELECT * FROM notices WHERE id = ?`).bind(id).first()
    if (!row) return c.json({ success: false, error: 'not_found' }, 404)
    return c.json({ success: true, notice: row })
  } catch (e: any) {
    return c.json({ success: false, error: e.message || 'notice_get_error' }, 500)
  }
})

// 어드민 - 전체 공지 (비활성 포함)
app.get('/api/admin/notices', async (c) => {
  try {
    const db = c.env.DB
    await ensureNoticesTable(db)
    const list = await db.prepare(`
      SELECT * FROM notices
      ORDER BY is_pinned DESC, created_at DESC
    `).all()
    return c.json({ success: true, notices: list.results || [] })
  } catch (e: any) {
    return c.json({ success: false, error: e.message || 'admin_notice_list_error' }, 500)
  }
})

// 어드민 - 공지 등록
app.post('/api/admin/notices', async (c) => {
  try {
    const db = c.env.DB
    await ensureNoticesTable(db)
    const { title, content, isPinned, isActive } = await c.req.json()
    if (!title || !content) return c.json({ success: false, error: 'title/content required' }, 400)
    const r = await db.prepare(`
      INSERT INTO notices (title, content, is_pinned, is_active)
      VALUES (?, ?, ?, ?)
    `).bind(String(title), String(content), isPinned ? 1 : 0, isActive === 0 ? 0 : 1).run()
    return c.json({ success: true, id: r.meta.last_row_id })
  } catch (e: any) {
    return c.json({ success: false, error: e.message || 'admin_notice_create_error' }, 500)
  }
})

// 어드민 - 공지 수정
app.put('/api/admin/notices/:id', async (c) => {
  try {
    const db = c.env.DB
    await ensureNoticesTable(db)
    const id = c.req.param('id')
    const { title, content, isPinned, isActive } = await c.req.json()
    await db.prepare(`
      UPDATE notices
      SET title = ?, content = ?, is_pinned = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(String(title || ''), String(content || ''), isPinned ? 1 : 0, isActive === 0 ? 0 : 1, id).run()
    return c.json({ success: true })
  } catch (e: any) {
    return c.json({ success: false, error: e.message || 'admin_notice_update_error' }, 500)
  }
})

// 어드민 - 공지 삭제
app.delete('/api/admin/notices/:id', async (c) => {
  try {
    const db = c.env.DB
    await ensureNoticesTable(db)
    const id = c.req.param('id')
    await db.prepare(`DELETE FROM notices WHERE id = ?`).bind(id).run()
    return c.json({ success: true })
  } catch (e: any) {
    return c.json({ success: false, error: e.message || 'admin_notice_delete_error' }, 500)
  }
})

// ============================================
// Frontend Routes
// ============================================

// 이용약관 페이지
app.get('/terms', (c) => {
  const userCountry = c.req.header('CF-IPCountry') || '';
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="user-country" content="${userCountry}">
        <title>이용약관 - QTA플랫폼</title>
        <link rel="icon" type="image/png" href="/static/quantarium-logo.png">
        <link rel="stylesheet" href="/static/tailwind.css">
        <link href="/static/fa/all.min.css" rel="stylesheet">
        <style>
          body { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; }
          .terms-content h2 { font-size: 1.1rem; font-weight: 700; margin-top: 1.5rem; margin-bottom: 0.5rem; color: #4a3780; }
          .terms-content p, .terms-content li { font-size: 0.9rem; line-height: 1.7; color: #374151; }
          .terms-content ul { list-style: disc; padding-left: 1.5rem; margin: 0.3rem 0; }
          .terms-content ol { list-style: decimal; padding-left: 1.5rem; }
          .terms-content ol > li { margin-bottom: 0.5rem; }
        </style>
    </head>
    <body>
        <div class="min-h-screen flex items-start justify-center py-6 px-3">
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-5 sm:p-8">
                <div class="flex items-center justify-between mb-6">
                    <div class="flex items-center gap-3">
                        <img src="/static/quantarium-logo.png" alt="Logo" class="w-10 h-10" onerror="this.style.display='none'">
                        <h1 class="text-xl sm:text-2xl font-bold text-purple-700">QTA플랫폼</h1>
                    </div>
                    <a href="/" class="text-purple-600 hover:text-purple-800 text-sm font-medium">
                        <i class="fas fa-arrow-left mr-1"></i>돌아가기
                    </a>
                </div>

                <h1 class="text-lg sm:text-xl font-bold text-gray-800 mb-4 text-center border-b pb-3">QTA플랫폼 서비스 이용약관</h1>

                <div class="terms-content">
                    <h2>제1조 (목적)</h2>
                    <p>본 약관은 QTA플랫폼(이하 "회사")이 운영하는 온라인 플랫폼을 통해 제공하는 <strong>기술관련 정보 제공 및 참여 지원 서비스</strong>(이하 "서비스")의 이용과 관련하여 회사와 이용자 간의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.</p>

                    <h2>제2조 (정의)</h2>
                    <ol>
                        <li>"서비스"란 회사가 운영하는 플랫폼을 통해 제공하는 프로젝트 관련 정보 열람, 참여 신청, 활동 내역 확인 등 <strong>비금융적 플랫폼 서비스</strong>를 의미합니다.</li>
                        <li>"이용자"란 본 약관에 동의하고 회사가 제공하는 서비스에 접속하여 이를 이용하는 자를 말합니다.</li>
                        <li>"참여"란 이용자가 회사가 안내하는 프로젝트에 자발적으로 참여 의사를 표시하는 행위를 의미하며, 이는 <strong>플랫폼 이용에 대한 수익 보장 또는 원금 보전을 의미하지 않습니다.</strong></li>
                        <li>플랫폼 관련 정보란 회사가 안내·콘텐츠·현황를 통하여 제공하는 서비스를 의미합니다.</li>
                    </ol>

                    <h2>제3조 (약관의 효력 및 변경)</h2>
                    <ol>
                        <li>본 약관은 회사의 웹사이트 또는 모바일 애플리케이션에 게시함으로써 효력이 발생합니다.</li>
                        <li>회사는 관계 법령을 위반하지 않는 범위 내에서 약관을 변경할 수 있으며, 변경된 약관은 공지한 날로부터 효력이 발생합니다.</li>
                    </ol>

                    <h2>제4조 (서비스 이용 신청 및 제한)</h2>
                    <ol>
                        <li>이용자는 회사가 정한 절차에 따라 본인 의사 결정으로 회원가입 및 본인 확인을 완료한 후 서비스를 이용할 수 있습니다.</li>
                        <li>회사는 다음 각 호에 해당하는 경우 서비스 이용을 제한하거나 거부할 수 있습니다.
                            <ul>
                                <li>타인의 명의 또는 정보 도용</li>
                                <li>허위 정보 기재</li>
                                <li>법령 또는 회사 운영정책 위반 이력 존재</li>
                            </ul>
                        </li>
                    </ol>

                    <h2>제5조 (서비스의 내용)</h2>
                    <ol>
                        <li>회사는 이용자에게 다음 각 호의 서비스를 제공합니다.
                            <ul>
                                <li>플랫폼내 정보 열람 및 참여 신청</li>
                                <li>참여 내역 및 활동 기록 조회</li>
                                <li>만기 참여 종료 신청</li>
                                <li>프로젝트 관련 일반적 정보 콘텐츠 제공</li>
                            </ul>
                        </li>
                        <li>회사는 <strong>"금융상품의 중개, 판매, 자문, 운용 행위를 수행하지 않습니다."</strong></li>
                        <li>서비스 제공 시간은 회사의 정책에 따라 변경될 수 있습니다.</li>
                    </ol>

                    <h2>제6조 (이용자의 책임 및 유의사항)</h2>
                    <ol>
                        <li>이용자는 서비스 이용과 관련된 모든 판단과 결정에 대해 전적인 책임을 부담합니다.</li>
                        <li>이용자는 회사의 이용 정책을 준수하여야 하며, 서비스의 안정적 운영을 방해하는 행위를 해서는 안 됩니다.</li>
                        <li>회사는 다음 사항을 <strong>"보장하거나 약속하지 않습니다."</strong>
                            <ul>
                                <li>수익 발생 여부</li>
                                <li>원금 보전</li>
                                <li>참여 결과에 따른 경제적 이익</li>
                            </ul>
                        </li>
                        <li>서비스는 정보 제공 및 참여 기회 제공을 목적으로 하며, 이용자는 이를 충분히 인지하고 신중히 이용해야 합니다.</li>
                    </ol>

                    <h2>제7조 (비용 및 부담)</h2>
                    <ol>
                        <li>서비스 이용 과정에서 발생하는 제반 비용은 이용자 본인의 책임과 부담으로 할 수 있습니다.</li>
                        <li>회사가 별도의 비용을 부과하는 경우, 그 내용과 조건을 사전에 명확히 고지합니다.</li>
                    </ol>

                    <h2>제8조 (개인정보 보호)</h2>
                    <p>회사는 「개인정보 보호법」 등 관계 법령을 준수하여 이용자의 개인정보를 보호하며, 개인정보 처리에 관한 사항은 별도의 「개인정보 처리방침」에 따릅니다.</p>
                    <p>회사는 서비스 제공 및 플랫폼 운영을 위하여 필요한 최소한의 개인정보만을 수집·이용합니다.</p>
                    <p>이 과정에서 회사는 이용자의 전화번호 및 디지털 자산 지갑주소만을 수집·관리하며, 성명, 주민등록번호 등 개인을 직접 식별할 수 있는 정보는 수집하지 않습니다.</p>

                    <h2>제9조 (책임의 제한)</h2>
                    <ol>
                        <li>회사는 천재지변, 시스템 장애, 통신 장애 등 불가항력적 사유로 인한 서비스 중단에 대해 책임을 지지 않습니다.</li>
                        <li>회사는 이용자의 참여 결과로 발생하는 직·간접적 손실에 대하여 책임을 부담하지 않습니다.</li>
                        <li>회사는 <strong>"금융업자, 투자자문업자 또는 자산운용사가 아니며"</strong>, 본 서비스는 금융행위에 해당하지 않습니다.</li>
                        <li>플랫폼 이용 손실에 대해서는 회사의 고의 또는 중과실이 없는 한 책임을 지지 않습니다.</li>
                    </ol>

                    <h2>제10조 (준거법 및 관할)</h2>
                    <p>본 약관은 대한민국 법령을 준거법으로 하며, 서비스 이용과 관련하여 발생하는 분쟁에 대해서는 회사 본점 소재지를 관할하는 법원을 전속 관할 법원으로 합니다.</p>

                    <div class="mt-6 pt-4 border-t border-gray-200">
                        <h2 class="text-base font-bold text-gray-800 mt-2">부칙</h2>
                        <ul class="list-none pl-0">
                            <li>공고일자: <strong>2026년 4월 01일</strong></li>
                            <li>시행일자: <strong>2026년 4월 01일</strong></li>
                        </ul>
                    </div>
                </div>

                <div class="mt-6 text-center">
                    <a href="/" class="inline-block bg-purple-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-purple-700 transition text-sm">
                        <i class="fas fa-arrow-left mr-2"></i>메인으로 돌아가기
                    </a>
                </div>
            </div>
        </div>
    </body>
    </html>
  `);
});

// 메인 페이지 (로그인 전)
app.get('/', (c) => {
  const userCountry = c.req.header('CF-IPCountry') || '';
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="user-country" content="${userCountry}">
        <title>QUANTARIUM STAKING</title>
        <link rel="icon" type="image/png" href="/static/quantarium-logo.png">
        <link rel="stylesheet" href="/static/tailwind.css">
        <link href="/static/fa/all.min.css" rel="stylesheet">
        <style>
          body { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
          }
          html, body { overflow-x: hidden; max-width: 100vw; }
          * { box-sizing: border-box; }
          button, a, input, select { min-height: 36px; }
        </style>
    </head>
    <body>
        <div class="min-h-screen flex items-center justify-center p-2 sm:p-4">
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-4 sm:p-8 overflow-hidden">
                <!-- Language Selector -->
                <div class="flex justify-end mb-2">
                    <div id="langSelector"></div>
                </div>

                <div class="text-center mb-6 sm:mb-8">
                    <img src="/static/quantarium-logo.png" alt="QUANTARIUM Logo" class="w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-4" onerror="this.style.display='none'">
                    <h1 class="text-2xl sm:text-3xl font-bold text-gray-800 mb-2" data-i18n="app.name">QUANTARIUM STAKING</h1>
                    <p class="text-sm sm:text-base text-gray-600" data-i18n="app.subtitle">안전한 코인 스테이킹 플랫폼</p>
                </div>

                <!-- 로그인 폼 -->
                <div id="loginForm">
                    <h2 class="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6" data-i18n="login.title">로그인</h2>
                    <form onsubmit="handleLogin(event)">
                        <div class="mb-4">
                            <label class="block text-gray-700 text-sm font-bold mb-2" data-i18n="login.id">아이디</label>
                            <input type="text" id="loginId" required
                                placeholder="example123"
                                pattern="[a-zA-Z][a-zA-Z0-9]*"
                                oninput="this.value = this.value.replace(/[^a-zA-Z0-9]/g, '')"
                                class="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 text-sm sm:text-base">
                            <p class="text-xs text-gray-500 mt-1" data-i18n="login.id_hint">영문 또는 영문+숫자</p>
                        </div>
                        <div class="mb-4 sm:mb-6">
                            <label class="block text-gray-700 text-sm font-bold mb-2" data-i18n="login.password">비밀번호</label>
                            <div class="relative">
                                <input type="password" id="loginPassword" required
                                    class="w-full px-3 py-2 sm:px-4 sm:py-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 text-sm sm:text-base">
                                <button type="button" onclick="togglePasswordVisibility('loginPassword', this)"
                                    class="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-gray-400 hover:text-purple-600 focus:outline-none"
                                    aria-label="비밀번호 표시/숨김" tabindex="-1">
                                    <i class="fas fa-eye"></i>
                                </button>
                            </div>
                        </div>
                        <button type="submit" 
                            class="w-full bg-purple-600 text-white py-2 sm:py-3 rounded-lg font-bold hover:bg-purple-700 transition text-sm sm:text-base" data-i18n="common.login">
                            로그인
                        </button>
                    </form>
                    <div class="flex justify-center gap-4 mt-4 text-xs sm:text-sm">
                        <a href="#" onclick="showFindId()" class="text-purple-600 hover:underline" data-i18n="login.find_id">아이디 찾기</a>
                        <span class="text-gray-400">|</span>
                        <a href="#" onclick="showFindPassword()" class="text-purple-600 hover:underline" data-i18n="login.find_password">비밀번호 찾기</a>
                    </div>
                    <p class="text-center mt-4 text-sm sm:text-base text-gray-600">
                        <span data-i18n="login.no_account">계정이 없으신가요?</span> 
                        <a href="#" onclick="showRegister()" class="text-purple-600 font-bold" data-i18n="common.register">회원가입</a>
                    </p>
                </div>

                <!-- 회원가입 폼 -->
                <div id="registerForm" class="hidden">
                    <h2 class="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6" data-i18n="register.title">회원가입</h2>
                    <form onsubmit="handleRegister(event)">
                        <div class="mb-3 sm:mb-4">
                            <label class="block text-gray-700 text-sm font-bold mb-2" data-i18n="register.name">이름</label>
                            <input type="text" id="registerName" required
                                class="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 text-sm sm:text-base">
                        </div>
                        <div class="mb-3 sm:mb-4">
                            <label class="block text-gray-700 text-sm font-bold mb-2" data-i18n="register.id">아이디</label>
                            <input type="text" id="registerId" required
                                placeholder="example123"
                                pattern="[a-zA-Z][a-zA-Z0-9]*"
                                oninput="this.value = this.value.replace(/[^a-zA-Z0-9]/g, '')"
                                class="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 text-sm sm:text-base">
                            <p class="text-xs text-gray-500 mt-1" data-i18n="register.id_hint">영문 또는 영문+숫자</p>
                        </div>
                        <div class="mb-3 sm:mb-4">
                            <label class="block text-gray-700 text-sm font-bold mb-2" data-i18n="register.password">비밀번호</label>
                            <div class="relative">
                                <input type="password" id="registerPassword" required
                                    minlength="4"
                                    data-i18n-placeholder="register.password_input"
                                    placeholder="비밀번호 입력"
                                    autocomplete="new-password"
                                    class="w-full px-3 py-2 sm:px-4 sm:py-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 text-sm sm:text-base">
                                <button type="button" onclick="togglePasswordVisibility('registerPassword', this)"
                                    class="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-gray-400 hover:text-purple-600 focus:outline-none"
                                    aria-label="비밀번호 표시/숨김" tabindex="-1">
                                    <i class="fas fa-eye"></i>
                                </button>
                            </div>
                        </div>
                        <div class="mb-3 sm:mb-4">
                            <label class="block text-gray-700 text-sm font-bold mb-2" data-i18n="register.password_confirm">비밀번호 확인</label>
                            <div class="relative">
                                <input type="password" id="registerPasswordConfirm" required
                                    minlength="4"
                                    data-i18n-placeholder="register.password_reinput"
                                    placeholder="비밀번호 재입력"
                                    autocomplete="new-password"
                                    class="w-full px-3 py-2 sm:px-4 sm:py-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 text-sm sm:text-base">
                                <button type="button" onclick="togglePasswordVisibility('registerPasswordConfirm', this)"
                                    class="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-gray-400 hover:text-purple-600 focus:outline-none"
                                    aria-label="비밀번호 표시/숨김" tabindex="-1">
                                    <i class="fas fa-eye"></i>
                                </button>
                            </div>
                        </div>
                        <div class="mb-3 sm:mb-4">
                            <label class="block text-gray-700 text-sm font-bold mb-2" data-i18n="register.phone">전화번호</label>
                            <div class="flex gap-1 sm:gap-2 w-full">
                                <input type="text" value="010" disabled
                                    class="w-1/3 px-2 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg bg-gray-100 text-center font-bold text-sm sm:text-base">
                                <input type="tel" id="registerPhone1" required
                                    placeholder="1234"
                                    maxlength="4"
                                    pattern="[0-9]{4}"
                                    inputmode="numeric"
                                    oninput="this.value = this.value.replace(/[^0-9]/g, '').slice(0, 4); if(this.value.length === 4) document.getElementById('registerPhone2').focus();"
                                    class="w-1/3 px-2 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 text-center text-sm sm:text-base">
                                <input type="tel" id="registerPhone2" required
                                    placeholder="5678"
                                    maxlength="4"
                                    pattern="[0-9]{4}"
                                    inputmode="numeric"
                                    oninput="this.value = this.value.replace(/[^0-9]/g, '').slice(0, 4);"
                                    class="w-1/3 px-2 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 text-center text-sm sm:text-base">
                            </div>
                            <p class="text-xs text-gray-500 mt-1" data-i18n="register.phone_hint">숫자만 입력하세요 (예: 010-1234-5678)</p>
                        </div>
                        <div class="mb-4 sm:mb-6">
                            <label class="block text-gray-700 text-sm font-bold mb-2" data-i18n="register.qkey_wallet">QKEY 지갑주소</label>
                            <input type="text" id="registerWallet" required
                                placeholder="0xE0c166B147a742E4FbCf5e5BCf73aCA631f14f0e"
                                class="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 text-xs sm:text-base break-all">
                            <p class="text-xs text-red-600 mt-1 font-medium" data-i18n="register.qkey_wallet_hint">퀀타리움(QUANTARIUM) 지갑주소를 입력하십시요</p>
                        </div>
                        <div class="mb-4 sm:mb-6">
                            <label class="block text-gray-700 text-sm font-bold mb-2" data-i18n="register.usdt_wallet">USDT 지갑주소</label>
                            <input type="text" id="registerUsdtWallet" required
                                placeholder="0x..."
                                class="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 text-xs sm:text-base break-all">
                            <p class="text-xs text-red-600 mt-1 font-medium" data-i18n="register.usdt_wallet_hint">바이낸스(BINANCE) 지갑주소를 입력하십시요</p>
                        </div>
                        <input type="hidden" id="registerCountry" value="">
                        <input type="hidden" id="registerLanguage" value="">
                        <div class="mb-4 sm:mb-6">
                            <label class="block text-gray-700 text-sm font-bold mb-2" data-i18n="register.referral_code">추천인 코드</label>
                            <input type="text" id="registerReferralCode" required
                                placeholder="QTA123456"
                                maxlength="9"
                                style="text-transform: uppercase"
                                class="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 text-sm sm:text-base">
                            <p class="text-xs text-red-500 mt-1" data-i18n="register.referral_required">추천인 코드는 필수입니다</p>
                        </div>
                        <div class="mb-4 sm:mb-6">
                            <label class="flex items-start gap-2 cursor-pointer">
                                <input type="checkbox" id="agreeTerms" 
                                    class="mt-1 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500">
                                <span class="text-xs sm:text-sm text-gray-700">
                                    <a href="/terms" target="_blank" class="text-purple-600 underline font-bold" data-i18n="register.terms_link">이용약관</a>
                                    <span data-i18n="register.terms_agree">에 동의합니다.</span>
                                    <span class="text-red-500">*</span>
                                </span>
                            </label>
                            <p id="termsError" class="text-xs text-red-500 mt-1 hidden" data-i18n="register.terms_required">이용약관에 동의해주세요.</p>
                        </div>
                        <button type="submit" 
                            class="w-full bg-purple-600 text-white py-2 sm:py-3 rounded-lg font-bold hover:bg-purple-700 transition text-sm sm:text-base" data-i18n="common.register">
                            회원가입
                        </button>
                    </form>
                    <p class="text-center mt-4 text-sm sm:text-base text-gray-600">
                        <span data-i18n="login.have_account">이미 계정이 있으신가요?</span> 
                        <a href="#" onclick="showLogin()" class="text-purple-600 font-bold" data-i18n="common.login">로그인</a>
                    </p>
                </div>

                <!-- 아이디 찾기 폼 -->
                <div id="findIdForm" class="hidden">
                    <h2 class="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6" data-i18n="find_id.title">아이디 찾기</h2>
                    <form onsubmit="handleFindId(event)">
                        <div class="mb-4 sm:mb-6">
                            <label class="block text-gray-700 text-sm font-bold mb-2" data-i18n="find_id.wallet">QKEY 지갑주소</label>
                            <input type="text" id="findIdWallet" required
                                placeholder="0xE0c166B147a742E4FbCf5e5BCf73aCA631f14f0e"
                                class="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 text-xs sm:text-base break-all">
                            <p class="text-xs text-gray-500 mt-1" data-i18n="find_id.wallet_hint">회원가입 시 등록한 QKEY 지갑주소를 입력하세요</p>
                        </div>
                        <button type="submit" 
                            class="w-full bg-purple-600 text-white py-2 sm:py-3 rounded-lg font-bold hover:bg-purple-700 transition text-sm sm:text-base" data-i18n="login.find_id">
                            아이디 찾기
                        </button>
                    </form>
                    <p class="text-center mt-4 text-sm sm:text-base text-gray-600">
                        <a href="#" onclick="showLogin()" class="text-purple-600 font-bold" data-i18n="common.back_to_login">로그인으로 돌아가기</a>
                    </p>
                </div>

                <!-- 비밀번호 찾기 폼 -->
                <div id="findPasswordForm" class="hidden">
                    <h2 class="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6" data-i18n="find_pw.title">비밀번호 찾기</h2>
                    <form onsubmit="handleFindPassword(event)">
                        <div class="mb-4 sm:mb-6">
                            <label class="block text-gray-700 text-sm font-bold mb-2" data-i18n="find_pw.wallet">QKEY 지갑주소</label>
                            <input type="text" id="findPasswordWallet" required
                                placeholder="0xE0c166B147a742E4FbCf5e5BCf73aCA631f14f0e"
                                class="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 text-xs sm:text-base break-all">
                            <p class="text-xs text-gray-500 mt-1" data-i18n="find_pw.wallet_hint">회원가입 시 등록한 QKEY 지갑주소를 입력하세요</p>
                        </div>
                        <button type="submit" 
                            class="w-full bg-purple-600 text-white py-2 sm:py-3 rounded-lg font-bold hover:bg-purple-700 transition text-sm sm:text-base" data-i18n="login.find_password">
                            비밀번호 찾기
                        </button>
                    </form>
                    <p class="text-center mt-4 text-sm sm:text-base text-gray-600">
                        <a href="#" onclick="showLogin()" class="text-purple-600 font-bold" data-i18n="common.back_to_login">로그인으로 돌아가기</a>
                    </p>
                </div>
            </div>
        </div>

        <!-- Footer with Terms Link -->
        <div class="text-center mt-4 mb-6">
            <a href="/terms" target="_blank" class="text-white/70 hover:text-white text-xs sm:text-sm underline" data-i18n="common.terms">이용약관</a>
            <span class="text-white/40 mx-2">|</span>
            <span class="text-white/50 text-xs">&copy; 2026 QTA Platform</span>
        </div>

        <script src="/static/axios.min.js"></script>
        <script src="/static/i18n.js?v=20260427c"></script>
        <script>
            // 비밀번호 표시/숨김 토글 (눈 아이콘 클릭)
            function togglePasswordVisibility(inputId, btn) {
                const input = document.getElementById(inputId);
                if (!input) return;
                const icon = btn ? btn.querySelector('i') : null;
                if (input.type === 'password') {
                    input.type = 'text';
                    if (icon) { icon.classList.remove('fa-eye'); icon.classList.add('fa-eye-slash'); }
                } else {
                    input.type = 'password';
                    if (icon) { icon.classList.remove('fa-eye-slash'); icon.classList.add('fa-eye'); }
                }
            }

            function showRegister() {
                document.getElementById('loginForm').classList.add('hidden');
                document.getElementById('registerForm').classList.remove('hidden');
            }

            function showLogin() {
                document.getElementById('registerForm').classList.add('hidden');
                document.getElementById('findIdForm').classList.add('hidden');
                document.getElementById('findPasswordForm').classList.add('hidden');
                document.getElementById('loginForm').classList.remove('hidden');
            }

            function showFindId() {
                document.getElementById('loginForm').classList.add('hidden');
                document.getElementById('registerForm').classList.add('hidden');
                document.getElementById('findPasswordForm').classList.add('hidden');
                document.getElementById('findIdForm').classList.remove('hidden');
            }

            function showFindPassword() {
                document.getElementById('loginForm').classList.add('hidden');
                document.getElementById('registerForm').classList.add('hidden');
                document.getElementById('findIdForm').classList.add('hidden');
                document.getElementById('findPasswordForm').classList.remove('hidden');
            }

            // 전화번호 자동 포커스 이동 함수
            function moveToNext(current, nextFieldId, maxLength) {
                // 숫자만 입력 허용
                current.value = current.value.replace(/[^0-9]/g, '');
                
                // maxLength 도달 시 다음 필드로 이동
                if (current.value.length >= maxLength) {
                    const nextField = document.getElementById(nextFieldId);
                    if (nextField) {
                        nextField.focus();
                    }
                }
            }

            async function handleLogin(e) {
                e.preventDefault();
                const email = document.getElementById('loginId').value.toLowerCase().trim();
                const password = document.getElementById('loginPassword').value;

                try {
                    const response = await axios.post('/api/auth/login', { email, password });
                    if (response.data.success) {
                        localStorage.setItem('user', JSON.stringify(response.data.user));
                        window.location.href = '/dashboard';
                    }
                } catch (error) {
                    alert(error.response?.data?.error || I18N.t('login.fail'));
                }
            }

            async function handleRegister(e) {
                e.preventDefault();
                console.log('회원가입 버튼 클릭됨');
                
                const name = document.getElementById('registerName').value;
                const email = document.getElementById('registerId').value.toLowerCase().trim();
                const phone1 = document.getElementById('registerPhone1').value;
                const phone2 = document.getElementById('registerPhone2').value;
                const phone = '010-' + phone1 + '-' + phone2;
                const walletAddress = document.getElementById('registerWallet').value;
                const usdtWalletAddress = document.getElementById('registerUsdtWallet').value;
                const password = document.getElementById('registerPassword').value;
                const passwordConfirm = document.getElementById('registerPasswordConfirm').value;
                const referralCode = document.getElementById('registerReferralCode').value.trim().toUpperCase();
                const country = navigator.language.split('-')[1] || '';
                const language = I18N.currentLang || navigator.language.split('-')[0] || '';

                console.log('입력값:', { name, email, phone, walletAddress, usdtWalletAddress, password, passwordConfirm, referralCode, country, language });

                // 이용약관 동의 검증
                const agreeTerms = document.getElementById('agreeTerms').checked;
                if (!agreeTerms) {
                    document.getElementById('termsError').classList.remove('hidden');
                    alert(I18N.t('register.terms_required'));
                    return;
                }
                document.getElementById('termsError').classList.add('hidden');

                // 추천인 코드 필수 검증
                if (!referralCode) {
                    alert(I18N.t('register.referral_required_alert'));
                    document.getElementById('registerReferralCode').focus();
                    return;
                }

                // 비밀번호 확인 검증
                if (password !== passwordConfirm) {
                    alert(I18N.t('register.password_mismatch'));
                    return;
                }

                // QKEY 지갑주소 형식 검증
                if (!walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
                    alert(I18N.t('register.qkey_wallet_hint'));
                    return;
                }

                // USDT 지갑주소 형식 검증
                if (!usdtWalletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
                    alert(I18N.t('register.usdt_wallet_hint'));
                    return;
                }

                try {
                    console.log('API 호출 시작');
                    const response = await axios.post('/api/auth/register', { 
                        name, 
                        email,
                        phone,
                        password, 
                        walletAddress,
                        usdtWalletAddress,
                        referralCode: referralCode,
                        country,
                        language
                    });
                    console.log('API 응답:', response.data);
                    
                    if (response.data.success) {
                        alert(I18N.t('register.success') + response.data.referralCode + I18N.t('register.success_login'));
                        showLogin();
                        // 폼 초기화
                        document.getElementById('registerName').value = '';
                        document.getElementById('registerId').value = '';
                        document.getElementById('registerPhone1').value = '';
                        document.getElementById('registerPhone2').value = '';
                        document.getElementById('registerWallet').value = '';
                        document.getElementById('registerUsdtWallet').value = '';
                        document.getElementById('registerPassword').value = '';
                        document.getElementById('registerPasswordConfirm').value = '';
                    }
                } catch (error) {
                    console.error('Registration error:', error);
                    alert(error.response?.data?.error || I18N.t('register.fail'));
                }
            }

            async function handleFindId(e) {
                e.preventDefault();
                const walletAddress = document.getElementById('findIdWallet').value.trim();

                if (!walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
                    alert(I18N.t('register.qkey_wallet_hint'));
                    return;
                }

                try {
                    const response = await axios.post('/api/auth/find-id', { walletAddress });
                    if (response.data.success) {
                        alert(I18N.t('find_id.result') + response.data.email);
                        showLogin();
                    }
                } catch (error) {
                    alert(error.response?.data?.error || I18N.t('find_id.fail'));
                }
            }

            // Initialize i18n
            I18N.init();
            createLangSelector('langSelector');

            // URL ?ref=CODE 파라미터로 추천인 자동 입력 + 회원가입 폼 표시
            (function() {
                var params = new URLSearchParams(window.location.search);
                var refCode = params.get('ref');
                if (refCode) {
                    var refInput = document.getElementById('registerReferralCode');
                    if (refInput) {
                        refInput.value = refCode.toUpperCase();
                        refInput.readOnly = true;
                        refInput.style.backgroundColor = '#f3f4f6';
                        refInput.style.cursor = 'not-allowed';
                    }
                    showRegister();
                }
            })();

            async function handleFindPassword(e) {
                e.preventDefault();
                const walletAddress = document.getElementById('findPasswordWallet').value.trim();

                if (!walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
                    alert(I18N.t('register.qkey_wallet_hint'));
                    return;
                }

                try {
                    const response = await axios.post('/api/auth/find-password', { walletAddress });
                    if (response.data.success) {
                        alert(I18N.t('find_pw.result') + response.data.tempPassword + I18N.t('find_pw.result_hint'));
                        showLogin();
                    }
                } catch (error) {
                    alert(error.response?.data?.error || I18N.t('find_pw.fail'));
                }
            }
        </script>
    </body>
    </html>
  `)
})

// 대시보드
app.get('/dashboard', (c) => {
  const userCountry = c.req.header('CF-IPCountry') || '';
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="user-country" content="${userCountry}">
        <title data-i18n="dash.title">대시보드 - QUANTARIUM STAKING</title>
        <link rel="icon" type="image/png" href="/static/quantarium-logo.png">
        <link rel="stylesheet" href="/static/tailwind.css">
        <link href="/static/fa/all.min.css" rel="stylesheet">
        <script src="/static/qrcode.min.js"></script>
        <style>
          body { background-color: #f3f4f6; }
          html, body { overflow-x: hidden; max-width: 100vw; }
          * { box-sizing: border-box; }
          /* Touch-friendly targets */
          button, a, input, select { min-height: 36px; }
          /* Prevent text overflow */
          .font-mono { word-break: break-all; }
        </style>
    </head>
    <body>
        <div class="min-h-screen">
            <!-- Header -->
            <header class="bg-white shadow-sm">
                <div class="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
                    <div class="flex justify-between items-center mb-2">
                        <div class="flex items-center gap-2">
                            <img src="/static/quantarium-logo.png" alt="QUANTARIUM Logo" class="w-8 h-8 sm:w-10 sm:h-10" onerror="this.style.display='none'">
                            <h1 class="text-lg sm:text-2xl font-bold text-purple-600">QUANTARIUM</h1>
                        </div>
                        <div class="flex items-center gap-2 sm:gap-3">
                            <div id="langSelector"></div>
                            <button onclick="showProfileSettings()" 
                                class="flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition text-sm sm:text-base">
                                <i class="fas fa-user-cog text-lg"></i>
                                <span class="hidden sm:inline" data-i18n="common.profile">프로필</span>
                            </button>
                            <button onclick="handleLogout()" 
                                class="flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition text-sm sm:text-base">
                                <i class="fas fa-sign-out-alt text-lg"></i>
                                <span class="hidden sm:inline" data-i18n="common.logout">로그아웃</span>
                            </button>
                        </div>
                    </div>
                    <div class="flex flex-col gap-1">
                        <span id="userName" class="text-sm sm:text-base text-gray-700 font-medium"></span>
                        <div class="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                            <i class="fas fa-wallet"></i>
                            <span id="userWallet" class="font-mono"></span>
                        </div>
                    </div>
                </div>
            </header>

            <!-- 상단 카테고리 네비게이션 -->
            <nav class="bg-white border-b shadow-sm sticky top-0 z-40">
                <div class="max-w-7xl mx-auto px-3 sm:px-4 flex">
                    <button onclick="switchDashPage('main')" id="dashNav-main"
                        class="flex items-center gap-1 px-4 py-3 text-sm font-bold text-purple-600 border-b-2 border-purple-600 transition">
                        <i class="fas fa-chart-line"></i><span>대시보드</span>
                    </button>
                    <button onclick="switchDashPage('shop')" id="dashNav-shop"
                        class="flex items-center gap-1 px-4 py-3 text-sm font-bold text-gray-400 hover:text-pink-600 transition">
                        <i class="fas fa-shopping-cart"></i><span>쇼핑몰</span>
                    </button>
                    <button onclick="switchDashPage('notice')" id="dashNav-notice"
                        class="flex items-center gap-1 px-4 py-3 text-sm font-bold text-gray-400 hover:text-blue-600 transition">
                        <i class="fas fa-bullhorn"></i><span>공지사항</span>
                        <span id="noticeUnreadBadge" class="hidden ml-1 px-1.5 py-0.5 text-[10px] bg-red-500 text-white rounded-full font-bold">N</span>
                    </button>
                </div>
            </nav>

            <!-- Main Content (대시보드) -->
            <main id="dashPage-main" class="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
                <!-- Balance Cards -->
                <div class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 mb-6 sm:mb-8">
                    <!-- 퀀타리움 스테이킹 현황 (첫 번째 - full width) -->
                    <div class="col-span-2 sm:col-span-2 lg:col-span-1 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 sm:p-6 text-white shadow-lg">
                        <div class="flex items-center justify-between mb-1 sm:mb-2">
                            <span class="text-xs sm:text-sm opacity-90" data-i18n="dash.purchase_transfer">퀀타리움구매(USDT)</span>
                            <i class="fas fa-chart-line text-xl sm:text-2xl"></i>
                        </div>
                        <p class="text-2xl sm:text-3xl font-bold" id="stakingStatus">0</p>
                        <p class="text-xs opacity-75 mt-1" id="stakingCount"></p>
                    </div>
                    
                    <!-- USDT Balance (두 번째) -->
                    <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 sm:p-6 text-white shadow-lg">
                        <div class="flex items-center justify-between mb-1 sm:mb-2">
                            <span class="text-xs sm:text-sm opacity-90" data-i18n="dash.usdt_balance">USDT 잔액</span>
                            <i class="fas fa-dollar-sign text-xl sm:text-2xl"></i>
                        </div>
                        <p class="text-xl sm:text-3xl font-bold" id="usdtBalance">0</p>
                    </div>
                    
                    <!-- QTA (세 번째) -->
                    <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 sm:p-6 text-white shadow-lg">
                        <div class="flex items-center justify-between mb-1 sm:mb-2">
                            <span class="text-xs sm:text-sm opacity-90" data-i18n="dash.qta_coin">QTA코인(지갑전송수량)</span>
                            <i class="fas fa-coins text-xl sm:text-2xl"></i>
                        </div>
                        <p class="text-xl sm:text-3xl font-bold" id="qtaBalance">0</p>
                    </div>
                    
                    <!-- QX (네 번째) -->
                    <div class="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 sm:p-6 text-white shadow-lg">
                        <div class="flex items-center justify-between mb-1 sm:mb-2">
                            <span class="text-xs sm:text-sm opacity-90" data-i18n="dash.qx_coin">QX 코인</span>
                            <i class="fas fa-coins text-xl sm:text-2xl"></i>
                        </div>
                        <p class="text-xl sm:text-3xl font-bold" id="qxBalance">0</p>
                    </div>
                    
                    <!-- QKEY (다섯 번째 - full width on mobile) -->
                    <div class="col-span-2 sm:col-span-2 lg:col-span-1 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-4 sm:p-6 text-white shadow-lg">
                        <div class="flex items-center justify-between mb-1 sm:mb-2">
                            <span class="text-xs sm:text-sm opacity-90" data-i18n="dash.qkey_coin">QKEY 코인</span>
                            <i class="fas fa-key text-xl sm:text-2xl"></i>
                        </div>
                        <p class="text-xl sm:text-3xl font-bold" id="qkeyBalance">0</p>
                    </div>
                </div>

                <!-- Staking Section -->
                <div class="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
                    <h2 class="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">
                        <i class="fas fa-lock mr-2 text-purple-600"></i><span data-i18n="dash.staking_title">QTA 구매 스테이킹</span>
                    </h2>
                    <form onsubmit="handleStaking(event)" class="space-y-4">
                        <div>
                            <label class="block text-gray-700 font-bold mb-2 text-sm sm:text-base" data-i18n="dash.staking_select">구매 수량 ($1,000 단위로 클릭하세요)</label>
                            
                            <!-- 현재 누적 금액 표시 -->
                            <div id="accumulatedDisplay" class="mb-3 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border-2 border-purple-300 shadow-sm">
                                <div class="flex justify-between items-center mb-2">
                                    <span class="text-sm font-bold text-purple-800" data-i18n="dash.current_selection">현재 선택 금액</span>
                                    <button type="button" onclick="resetAmount()" 
                                        class="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg text-xs font-bold transition">
                                        <i class="fas fa-undo mr-1"></i><span data-i18n="dash.reset">초기화</span>
                                    </button>
                                </div>
                                <p class="text-3xl sm:text-4xl font-bold text-purple-700" id="accumulatedAmountText">$0</p>
                                <div class="grid grid-cols-2 gap-2 mt-3">
                                    <div class="bg-white rounded-lg p-2 text-center">
                                        <p class="text-xs text-gray-500" data-i18n="dash.daily_rate">일일 배당률</p>
                                        <p class="text-lg font-bold text-green-600" id="autoRateDisplay">-</p>
                                    </div>
                                    <div class="bg-white rounded-lg p-2 text-center">
                                        <p class="text-xs text-gray-500" data-i18n="dash.staking_period">거치기간</p>
                                        <p class="text-lg font-bold text-blue-600" id="autoPeriodDisplay">-</p>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- $1,000 클릭 버튼 -->
                            <div class="mb-3">
                                <button type="button" onclick="addAmount(1000)"
                                    class="w-full border-2 border-purple-400 bg-purple-50 rounded-xl py-4 sm:py-5 text-center font-bold text-purple-700 hover:border-purple-600 hover:bg-purple-100 active:bg-purple-200 transition cursor-pointer text-lg sm:text-xl shadow-sm">
                                    <i class="fas fa-plus-circle mr-2"></i><span data-i18n="dash.add_1000">$1,000 추가</span>
                                </button>
                            </div>

                            <!-- 정책 안내 테이블 -->
                            <div class="mb-3 bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                                <table class="w-full text-xs sm:text-sm">
                                    <thead class="bg-gray-200">
                                        <tr>
                                            <th class="px-2 sm:px-3 py-2 text-left text-gray-700" data-i18n="dash.investment_amount">투자금액</th>
                                            <th class="px-2 sm:px-3 py-2 text-center text-gray-700" data-i18n="dash.rate">배당률</th>
                                            <th class="px-2 sm:px-3 py-2 text-center text-gray-700" data-i18n="dash.period">거치기간</th>
                                        </tr>
                                    </thead>
                                    <tbody id="policyTableBody" class="divide-y divide-gray-200">
                                        <!-- 정책 표는 클라이언트에서 V1/V2 시점에 따라 동적으로 렌더링됨 (renderPolicyTable) -->
                                    </tbody>
                                </table>
                            </div>

                            <input type="hidden" id="stakingAmount" value="0">
                            <div id="rewardPreview" class="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200 hidden">
                                <p class="text-sm font-bold text-purple-800 mb-1" data-i18n="dash.expected_reward">예상 보상 (관리자 승인 후 지급)</p>
                                <div class="flex justify-between text-sm">
                                    <span class="text-gray-600" data-i18n="dash.qta_preview">QTA 보상 :</span>
                                    <span id="qtaRewardPreview" class="font-bold text-blue-600">0</span>
                                </div>
                                <div id="qxPreviewRow" class="flex justify-between text-sm">
                                    <span class="text-gray-600" data-i18n="dash.qx_preview">QX 보상 :</span>
                                    <span id="qxRewardPreview" class="font-bold text-purple-600">0</span>
                                </div>
                                <div id="qkeyPreviewRow" class="flex justify-between text-sm">
                                    <span class="text-gray-600" data-i18n="dash.qkey_preview">QKEY 보상 :</span>
                                    <span id="qkeyRewardPreview" class="font-bold text-yellow-600">0</span>
                                </div>
                                <div class="flex justify-between text-sm mt-1 pt-1 border-t border-purple-200">
                                    <span class="text-gray-600" data-i18n="dash.daily_rate_label">일일 수익률 :</span>
                                    <span id="dailyRatePreview" class="font-bold text-green-600">0%</span>
                                </div>
                                <div class="flex justify-between text-sm mt-1 pt-1 border-t border-purple-200">
                                    <span class="text-gray-600" data-i18n="dash.period_label">기간 :</span>
                                    <span id="periodPreview" class="font-bold text-blue-600">-</span>
                                </div>
                            </div>
                        </div>

                        <!-- 회사 지갑주소 -->
                        <div class="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-3 sm:p-4 shadow-sm">
                            <div class="flex items-start gap-2 mb-2">
                                <i class="fas fa-info-circle text-blue-600 text-lg sm:text-xl mt-1"></i>
                                <div class="flex-1 min-w-0">
                                    <p class="font-bold text-gray-800 mb-1 text-sm sm:text-base" data-i18n="dash.deposit_info">입금 안내</p>
                                    <p class="text-xs sm:text-sm text-gray-700 mb-2"><span data-i18n="dash.deposit_desc">아래 회사 지갑주소로 구매 수량을 입금해주세요</span> <br><span class="text-xs font-bold text-orange-600" data-i18n="dash.deposit_warning">⚠️ USDT(BEP-20 / BNB Chain) 기반으로 입금하세요</span></p>
                                </div>
                            </div>
                            
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <!-- 지갑주소 입력 -->
                                <div class="bg-white rounded-lg p-3 border border-blue-200 shadow-sm">
                                    <label class="block text-xs text-gray-600 mb-1 font-medium" data-i18n="dash.company_wallet">회사 지갑주소 BEP-20 (BSC)</label>
                                    <div class="flex items-center gap-2 mb-2">
                                        <input type="text" id="companyWallet" 
                                            value="0x8b6E72e378A99aEBc291C2C6861766d519239100" 
                                            readonly
                                            class="flex-1 min-w-0 px-2 py-2 bg-gray-50 border border-gray-300 rounded font-mono text-xs sm:text-sm truncate">
                                        <button type="button" onclick="copyCompanyWallet()" 
                                            class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded font-medium transition">
                                            <i class="fas fa-copy mr-1"></i><span data-i18n="common.copy">복사</span>
                                        </button>
                                    </div>
                                    <button type="button" onclick="openTxidInput()" 
                                        class="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium transition">
                                        <i class="fas fa-receipt mr-1"></i><span data-i18n="dash.txid_entry">입금 확인 (TXID)</span>
                                    </button>
                                </div>

                                <!-- QR 코드 -->
                                <div class="bg-white rounded-lg p-3 border border-blue-200 shadow-sm flex flex-col items-center justify-center">
                                    <label class="block text-xs text-gray-600 mb-2 font-medium" data-i18n="dash.qr_label">QR 코드로 간편 입금</label>
                                    <div id="qrcode" class="bg-white p-2 rounded"></div>
                                    <p class="text-xs text-gray-500 mt-2 text-center" data-i18n="dash.qr_scan">BEP-20 (BSC)</p>
                                </div>
                            </div>
                        </div>

                        <button type="submit" 
                            class="w-full bg-purple-600 text-white py-3 sm:py-4 rounded-lg font-bold text-base sm:text-lg hover:bg-purple-700 transition">
                            <i class="fas fa-paper-plane mr-2"></i><span data-i18n="dash.staking_apply">스테이킹 신청</span>
                        </button>
                    </form>
                </div>

                <!-- Swap Section (코인 교환) - 2탭 UI -->
                <div class="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
                    <h2 class="text-xl sm:text-2xl font-bold text-gray-800 mb-4">
                        <i class="fas fa-exchange-alt mr-2 text-indigo-600"></i><span data-i18n="dash.swap_title">코인 교환 (Swap)</span>
                    </h2>

                    <!-- 탭 버튼 -->
                    <div class="flex rounded-lg overflow-hidden border-2 border-indigo-200 mb-4">
                        <button id="swapTabQkey" onclick="switchSwapTab('qkey')"
                            class="flex-1 py-3 text-sm sm:text-base font-bold transition bg-indigo-600 text-white">
                            <i class="fas fa-key mr-1"></i>QKEY <span data-i18n="dash.swap_from">로 교환</span>
                        </button>
                        <button id="swapTabUsdt" onclick="switchSwapTab('usdt')"
                            class="flex-1 py-3 text-sm sm:text-base font-bold transition bg-white text-gray-600 hover:bg-gray-50">
                            <i class="fas fa-dollar-sign mr-1"></i>USDT <span data-i18n="dash.swap_from">로 교환</span>
                        </button>
                    </div>

                    <!-- QKEY 탭 -->
                    <div id="swapPanelQkey">
                        <!-- 잔액 -->
                        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 flex items-center justify-between">
                            <span class="text-sm font-medium text-yellow-800"><i class="fas fa-key mr-1"></i>QKEY <span data-i18n="dash.balance">보유량</span></span>
                            <span id="swapQkeyBalance" class="text-lg font-bold text-yellow-700">0</span>
                        </div>
                        <!-- 교환 대상 선택 -->
                        <div class="mb-4">
                            <label class="block text-sm font-bold text-gray-700 mb-2" data-i18n="dash.swap_target">교환 대상</label>
                            <select id="swapQkeyTarget" onchange="updateSwapPreview('qkey')"
                                class="w-full px-4 py-3 border-2 border-indigo-200 rounded-lg text-sm sm:text-base font-medium focus:outline-none focus:border-indigo-500 bg-white">
                                <option value="qta">QTA (1 QKEY = 1 QTA)</option>
                                <option value="qx">QX (5 QKEY = 1 QX)</option>
                                <option value="usdt">USDT (150 QKEY = 1 USDT)</option>
                            </select>
                        </div>
                        <!-- 수량 입력 -->
                        <div class="mb-3">
                            <label class="block text-sm font-bold text-gray-700 mb-2" id="swapQkeyInputLabel">수량 입력</label>
                            <input type="number" id="swapQkeyAmount" min="1" placeholder="수량 입력" oninput="updateSwapPreview('qkey')"
                                class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm sm:text-base focus:outline-none focus:border-indigo-500">
                        </div>
                        <!-- 미리보기 -->
                        <div id="swapQkeyPreview" class="bg-indigo-50 border border-indigo-200 rounded-lg p-3 mb-4">
                            <div class="flex items-center justify-between">
                                <span class="text-sm text-gray-600" data-i18n="dash.swap_need">필요</span>
                                <span class="text-sm font-bold text-indigo-700" id="swapQkeyNeedText">0 QKEY</span>
                            </div>
                            <div class="flex items-center justify-center my-2">
                                <i class="fas fa-arrow-down text-indigo-400"></i>
                            </div>
                            <div class="flex items-center justify-between">
                                <span class="text-sm text-gray-600" data-i18n="dash.swap_receive">받는 수량</span>
                                <span class="text-sm font-bold text-green-600" id="swapQkeyGetText">0</span>
                            </div>
                        </div>
                        <!-- 교환 버튼 -->
                        <button onclick="executeSwapNew('qkey')" 
                            class="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-sm sm:text-base transition">
                            <i class="fas fa-exchange-alt mr-2"></i><span data-i18n="dash.swap_btn">교환</span>
                        </button>
                    </div>

                    <!-- USDT 탭 -->
                    <div id="swapPanelUsdt" style="display:none;">
                        <!-- 잔액 -->
                        <div class="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 flex items-center justify-between">
                            <span class="text-sm font-medium text-green-800"><i class="fas fa-dollar-sign mr-1"></i>USDT <span data-i18n="dash.balance">보유량</span></span>
                            <span id="swapUsdtBalance" class="text-lg font-bold text-green-700">0</span>
                        </div>
                        <!-- 교환 대상 선택 -->
                        <div class="mb-4">
                            <label class="block text-sm font-bold text-gray-700 mb-2" data-i18n="dash.swap_target">교환 대상</label>
                            <select id="swapUsdtTarget" onchange="updateSwapPreview('usdt')"
                                class="w-full px-4 py-3 border-2 border-green-200 rounded-lg text-sm sm:text-base font-medium focus:outline-none focus:border-green-500 bg-white">
                                <option value="qkey">QKEY (1 USDT = 150 QKEY)</option>
                                <option value="qta">QTA (1 USDT = 150 QTA)</option>
                                <option value="qx">QX (1 USDT = 30 QX)</option>
                            </select>
                        </div>
                        <!-- 수량 입력 -->
                        <div class="mb-3">
                            <label class="block text-sm font-bold text-gray-700 mb-2" id="swapUsdtInputLabel">USDT 수량 입력</label>
                            <input type="number" id="swapUsdtAmount" min="1" placeholder="USDT 수량 입력" oninput="updateSwapPreview('usdt')"
                                class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm sm:text-base focus:outline-none focus:border-green-500">
                        </div>
                        <!-- 미리보기 -->
                        <div id="swapUsdtPreview" class="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                            <div class="flex items-center justify-between">
                                <span class="text-sm text-gray-600" data-i18n="dash.swap_need">필요</span>
                                <span class="text-sm font-bold text-green-700" id="swapUsdtNeedText">0 USDT</span>
                            </div>
                            <div class="flex items-center justify-center my-2">
                                <i class="fas fa-arrow-down text-green-400"></i>
                            </div>
                            <div class="flex items-center justify-between">
                                <span class="text-sm text-gray-600" data-i18n="dash.swap_receive">받는 수량</span>
                                <span class="text-sm font-bold text-indigo-600" id="swapUsdtGetText">0</span>
                            </div>
                        </div>
                        <!-- 교환 버튼 -->
                        <button onclick="executeSwapNew('usdt')"
                            class="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-sm sm:text-base transition">
                            <i class="fas fa-exchange-alt mr-2"></i><span data-i18n="dash.swap_btn">교환</span>
                        </button>
                    </div>
                </div>

                <!-- Withdrawal Section (항상 표시, 금요일 10~14시 KST만 버튼 활성화) -->
                <div id="withdrawalSection" class="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
                    <h2 class="text-xl sm:text-2xl font-bold text-gray-800 mb-4">
                        <i class="fas fa-money-bill-wave mr-2 text-green-600"></i><span data-i18n="dash.withdrawal_title">코인 출금 신청</span>
                    </h2>
                    
                    <div class="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        <!-- 출금 시간 안내 -->
                        <div id="withdrawalTimeNotice" class="col-span-2 lg:col-span-4 mb-2">
                        </div>

                        <!-- QTA 출금 -->
                        <div class="border-2 border-blue-200 rounded-lg p-3 sm:p-4 hover:border-blue-400 transition">
                            <div class="flex items-center justify-between mb-2 sm:mb-3">
                                <h3 class="font-bold text-gray-800 text-sm sm:text-base">QTA</h3>
                                <i class="fas fa-coins text-blue-600 text-lg sm:text-2xl"></i>
                            </div>
                            <p class="text-xs sm:text-sm text-gray-600 mb-1" data-i18n="dash.balance">잔액</p>
                            <p class="text-lg sm:text-2xl font-bold text-blue-600 mb-3 sm:mb-4" id="withdrawQtaBalance">0</p>
                            <button onclick="requestWithdrawal('QTA')" id="withdrawBtn_QTA"
                                class="withdraw-btn w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition text-xs sm:text-sm">
                                <i class="fas fa-paper-plane mr-1"></i><span data-i18n="common.withdraw">출금</span>
                            </button>
                        </div>
                        
                        <!-- QX 출금 -->
                        <div class="border-2 border-purple-200 rounded-lg p-3 sm:p-4 hover:border-purple-400 transition">
                            <div class="flex items-center justify-between mb-2 sm:mb-3">
                                <h3 class="font-bold text-gray-800 text-sm sm:text-base">QX</h3>
                                <i class="fas fa-coins text-purple-600 text-lg sm:text-2xl"></i>
                            </div>
                            <p class="text-xs sm:text-sm text-gray-600 mb-1" data-i18n="dash.balance">잔액</p>
                            <p class="text-lg sm:text-2xl font-bold text-purple-600 mb-3 sm:mb-4" id="withdrawQxBalance">0</p>
                            <button onclick="requestWithdrawal('QX')" id="withdrawBtn_QX"
                                class="withdraw-btn w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg font-medium transition text-xs sm:text-sm">
                                <i class="fas fa-paper-plane mr-1"></i><span data-i18n="common.withdraw">출금</span>
                            </button>
                        </div>
                        
                        <!-- QKEY 출금 -->
                        <div class="border-2 border-yellow-200 rounded-lg p-3 sm:p-4 hover:border-yellow-400 transition">
                            <div class="flex items-center justify-between mb-2 sm:mb-3">
                                <h3 class="font-bold text-gray-800 text-sm sm:text-base">QKEY</h3>
                                <i class="fas fa-key text-yellow-600 text-lg sm:text-2xl"></i>
                            </div>
                            <p class="text-xs sm:text-sm text-gray-600 mb-1" data-i18n="dash.balance">잔액</p>
                            <p class="text-lg sm:text-2xl font-bold text-yellow-600 mb-3 sm:mb-4" id="withdrawQkeyBalance">0</p>
                            <button onclick="requestWithdrawal('QKEY')" id="withdrawBtn_QKEY"
                                class="withdraw-btn w-full bg-yellow-600 hover:bg-yellow-700 text-white py-2 rounded-lg font-medium transition text-xs sm:text-sm">
                                <i class="fas fa-paper-plane mr-1"></i><span data-i18n="common.withdraw">출금</span>
                            </button>
                        </div>
                        
                        <!-- USDT 출금 -->
                        <div class="border-2 border-green-200 rounded-lg p-3 sm:p-4 hover:border-green-400 transition">
                            <div class="flex items-center justify-between mb-2 sm:mb-3">
                                <h3 class="font-bold text-gray-800 text-sm sm:text-base">USDT</h3>
                                <i class="fas fa-dollar-sign text-green-600 text-lg sm:text-2xl"></i>
                            </div>
                            <p class="text-xs sm:text-sm text-gray-600 mb-1" data-i18n="dash.balance">잔액</p>
                            <p class="text-lg sm:text-2xl font-bold text-green-600 mb-3 sm:mb-4" id="withdrawUsdtBalance">0</p>
                            <button onclick="requestWithdrawal('USDT')" id="withdrawBtn_USDT"
                                class="withdraw-btn w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium transition text-xs sm:text-sm">
                                <i class="fas fa-paper-plane mr-1"></i><span data-i18n="common.withdraw">출금</span>
                            </button>
                        </div>
                    </div>

                    <!-- 출금 신청 내역 -->
                    <div class="mt-6 pt-4 border-t">
                        <div class="flex items-center justify-between mb-3">
                            <h3 class="font-bold text-gray-700 text-sm sm:text-base">
                                <i class="fas fa-history mr-1 text-gray-500"></i>출금 신청 내역
                                <span id="withdrawHistoryCount" class="text-xs text-gray-500 font-normal ml-1"></span>
                            </h3>
                            <button onclick="loadMyWithdrawals()" class="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs font-medium text-gray-700">
                                <i class="fas fa-sync-alt mr-1"></i>새로고침
                            </button>
                        </div>
                        <p class="text-xs text-gray-500 mb-2"><i class="fas fa-info-circle mr-1"></i>처리대기(pending) 상태에서만 취소가 가능하며, 취소 시 신청금액이 즉시 환불됩니다.</p>
                        <div id="myWithdrawList" class="space-y-2 max-h-[50vh] overflow-y-auto">
                            <p class="text-center text-gray-400 text-sm py-4">출금 신청 내역을 불러오는 중...</p>
                        </div>
                    </div>
                </div>

                <!-- Referral Section -->
                <div class="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
                    <h2 class="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">
                        <i class="fas fa-user-friends mr-2 text-indigo-600"></i><span data-i18n="dash.referral_title">추천인 현황</span>
                    </h2>
                    
                    <!-- 내 추천인 코드 -->
                    <div class="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
                        <div class="text-white">
                            <p class="text-xs sm:text-sm opacity-90 mb-2" data-i18n="dash.my_referral_code">내 추천인 코드</p>
                            <div class="flex items-center gap-2 sm:gap-3">
                                <p class="text-2xl sm:text-3xl font-bold tracking-wider" id="myReferralCode">-</p>
                                <button onclick="copyReferralCode()" 
                                    class="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg transition">
                                    <i class="fas fa-link mr-1"></i><span data-i18n="dash.copy_referral_link">추천링크 복사</span>
                                </button>
                            </div>
                            <p class="text-xs opacity-75 mt-2" data-i18n="dash.referral_invite">추천링크를 공유하고 보상을 받으세요!</p>
                        </div>
                    </div>

                    <!-- 추천 보상 통계 -->
                    <div class="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
                        <div class="bg-blue-50 rounded-lg p-3 sm:p-4 border border-blue-200">
                            <p class="text-xs sm:text-sm text-gray-600 mb-1" data-i18n="dash.level1_referral"><span data-i18n="dash.level1_referral">Level 1 Referrals</span></p>
                            <p class="text-lg sm:text-2xl font-bold text-blue-600" id="level1Count">0</p>
                        </div>
                        <div class="bg-purple-50 rounded-lg p-3 sm:p-4 border border-purple-200">
                            <p class="text-xs sm:text-sm text-gray-600 mb-1" data-i18n="dash.level2_referral"><span data-i18n="dash.level2_referral">Level 2 Referrals</span></p>
                            <p class="text-lg sm:text-2xl font-bold text-purple-600" id="level2Count">0</p>
                        </div>
                        <div class="bg-green-50 rounded-lg p-3 sm:p-4 border border-green-200">
                            <p class="text-xs sm:text-sm text-gray-600 mb-1" data-i18n="dash.total_rewards">총 추천 보상</p>
                            <p class="text-lg sm:text-2xl font-bold text-green-600" id="totalRewards">0 QKEY</p>
                        </div>
                    </div>

                    <!-- 추천인 목록 탭 + 검색 -->
                    <div class="mb-4">
                        <div class="flex gap-1 sm:gap-2 border-b overflow-x-auto -mx-2 px-2">
                            <button onclick="showReferralTab('level1')" 
                                id="tab-level1"
                                class="px-3 sm:px-6 py-2 sm:py-3 font-medium text-blue-600 border-b-2 border-blue-600 whitespace-nowrap text-sm sm:text-base" data-i18n="dash.level1_referral">
                                <span data-i18n="dash.level1_referral">Level 1 Referrals</span>
                            </button>
                            <button onclick="showReferralTab('level2')" 
                                id="tab-level2"
                                class="px-3 sm:px-6 py-2 sm:py-3 font-medium text-gray-500 hover:text-gray-700 whitespace-nowrap text-sm sm:text-base" data-i18n="dash.level2_referral">
                                <span data-i18n="dash.level2_referral">Level 2 Referrals</span>
                            </button>
                            <button onclick="showReferralTab('rewards')" 
                                id="tab-rewards"
                                class="px-3 sm:px-6 py-2 sm:py-3 font-medium text-gray-500 hover:text-gray-700 whitespace-nowrap text-sm sm:text-base">
                                <i class="fas fa-coins mr-1"></i><span data-i18n="dash.reward_history">보상 내역</span>
                            </button>
                        </div>
                        <!-- 추천인 검색창 -->
                        <div id="referralSearchBox" class="mt-3">
                            <div class="relative">
                                <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                                <input type="text" id="referralSearchInput" 
                                    placeholder="아이디 또는 이메일로 검색..." data-i18n-placeholder="dash.search_referral" 
                                    oninput="filterReferralList()"
                                    class="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500">
                                <button onclick="document.getElementById('referralSearchInput').value=''; filterReferralList();" 
                                    class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- <span data-i18n="dash.level1_referral">Level 1 Referrals</span> 목록 -->
                    <div id="level1-list" class="space-y-3">
                        <p class="text-gray-500 text-center py-8" data-i18n="common.loading">Loading...</p>
                    </div>

                    <!-- <span data-i18n="dash.level2_referral">Level 2 Referrals</span> 목록 (기본 숨김) -->
                    <div id="level2-list" class="space-y-3 hidden">
                        <p class="text-gray-500 text-center py-8" data-i18n="common.loading">Loading...</p>
                    </div>

                    <!-- 보상 내역 (기본 숨김) -->
                    <div id="rewards-list" class="hidden">
                        <!-- 보상 통계 카드 (4개) -->
                        <div class="grid grid-cols-2 gap-2 sm:gap-3 mb-4">
                            <div class="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3 border border-green-300">
                                <p class="text-xs text-gray-600 mb-1"><i class="fas fa-coins mr-1 text-green-500"></i><span data-i18n="dash.dividend">배당</span></p>
                                <p class="text-lg font-bold text-green-700" id="reward-daily-total">0 QKEY</p>
                                <p class="text-xs text-gray-500"><span id="reward-daily-count">0</span></p>
                            </div>
                            <div class="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-3 border border-orange-300">
                                <p class="text-xs text-gray-600 mb-1"><i class="fas fa-handshake mr-1 text-orange-500"></i><span data-i18n="dash.direct_sales">직판수당</span></p>
                                <p class="text-lg font-bold text-orange-700" id="reward-direct-total">0 QKEY</p>
                                <p class="text-xs text-gray-500"><span id="reward-direct-count">0</span></p>
                            </div>
                            <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 border border-blue-300">
                                <p class="text-xs text-gray-600 mb-1"><i class="fas fa-hand-holding-usd mr-1 text-blue-500"></i><span data-i18n="dash.level1_bonus">1대 보너스</span></p>
                                <p class="text-lg font-bold text-blue-700" id="reward-level1-total">0 QKEY</p>
                                <p class="text-xs text-gray-500"><span id="reward-level1-count">0</span></p>
                            </div>
                            <div class="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3 border border-purple-300">
                                <p class="text-xs text-gray-600 mb-1"><i class="fas fa-gifts mr-1 text-purple-500"></i><span data-i18n="dash.level2_bonus">2대 보너스</span></p>
                                <p class="text-lg font-bold text-purple-700" id="reward-level2-total">0 QKEY</p>
                                <p class="text-xs text-gray-500"><span id="reward-level2-count">0</span></p>
                            </div>
                        </div>

                        <!-- 누적 총 보상 -->
                        <div class="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg p-3 mb-4 border border-yellow-300 text-center">
                            <p class="text-xs text-gray-600 mb-1" data-i18n="dash.total_reward">누적 총 보상</p>
                            <p class="text-xl font-bold text-yellow-700" id="reward-grand-total">0 QKEY</p>
                        </div>

                        <!-- 보상 내역 테이블 -->
                        <div class="overflow-x-auto">
                            <table class="w-full text-xs sm:text-sm">
                                <thead class="bg-gray-100">
                                    <tr>
                                        <th class="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-700" data-i18n="common.date">날짜</th>
                                        <th class="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-700" data-i18n="common.category">분류</th>
                                        <th class="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-700" data-i18n="common.details">상세</th>
                                        <th class="px-2 sm:px-4 py-2 text-right text-xs font-medium text-gray-700" data-i18n="common.amount">금액</th>
                                    </tr>
                                </thead>
                                <tbody id="rewards-table-body" class="divide-y divide-gray-200">
                                    <tr>
                                        <td colspan="4" class="px-4 py-8 text-center text-gray-500" data-i18n="common.loading">로딩 중...</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- My Stakings -->
                <div class="bg-white rounded-xl shadow-lg p-4 sm:p-6">
                    <h2 class="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">
                        <i class="fas fa-list mr-2 text-purple-600"></i><span data-i18n="dash.my_staking_list">내 스테이킹 목록</span>
                    </h2>
                    <div id="stakingList" class="space-y-4">
                        <p class="text-gray-500 text-center py-8" data-i18n="common.loading">Loading...</p>
                    </div>
                </div>
            </main>

            <!-- 쇼핑몰 페이지 (별도) -->
            <div id="dashPage-shop" class="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8 hidden">
                <div class="bg-white rounded-xl shadow-lg p-4 sm:p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h2 class="text-xl sm:text-2xl font-bold text-gray-800">
                            <i class="fas fa-shopping-cart mr-2 text-pink-600"></i>QKEY 쇼핑몰
                        </h2>
                        <div class="flex items-center gap-2">
                            <span class="text-xs text-gray-500">(1 QKEY = 10원)</span>
                            <span id="shopQkeyBalance" class="text-sm font-bold text-pink-700 bg-pink-50 px-2 py-1 rounded">0 QKEY</span>
                        </div>
                    </div>
                    <!-- 탭 버튼 -->
                    <div class="flex border-b mb-4">
                        <button onclick="switchShopTab('products')" id="shopTab-products"
                            class="flex-1 py-2 text-sm font-bold text-pink-600 border-b-2 border-pink-600 transition">
                            <i class="fas fa-store mr-1"></i>상품목록
                        </button>
                        <button onclick="switchShopTab('orders')" id="shopTab-orders"
                            class="flex-1 py-2 text-sm font-bold text-gray-400 hover:text-gray-600 transition">
                            <i class="fas fa-receipt mr-1"></i>내 구매내역
                        </button>
                    </div>
                    <!-- 상품 패널 -->
                    <div id="shopPanel-products">
                        <!-- 카테고리 필터 -->
                        <div id="shopCategoryFilter" class="flex flex-wrap gap-2 mb-4">
                            <button onclick="filterShopCategory('전체')" class="shopCatBtn px-3 py-1 rounded-full text-xs font-bold bg-pink-600 text-white">전체</button>
                        </div>
                        <div id="shopProductList" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                            <p class="col-span-2 sm:col-span-3 lg:col-span-4 text-center text-gray-400 py-8 text-sm">상품을 불러오는 중...</p>
                        </div>
                    </div>
                    <!-- 구매내역 패널 -->
                    <div id="shopPanel-orders" class="hidden">
                        <div class="flex items-center justify-between mb-3">
                            <h3 class="font-bold text-gray-700 text-sm"><i class="fas fa-receipt mr-1 text-pink-500"></i>내 구매 내역</h3>
                            <div class="flex items-center gap-2">
                                <button onclick="openInquiryModal()" class="px-3 py-1 bg-blue-50 hover:bg-blue-100 rounded text-xs font-medium text-blue-700 border border-blue-200"><i class="fas fa-comment-dots mr-1"></i>문의하기</button>
                                <button onclick="loadMyInquiries()" class="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs font-medium text-gray-700"><i class="fas fa-clipboard-list mr-1"></i>내 문의내역</button>
                                <button onclick="loadMyOrders()" class="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs font-medium text-gray-700"><i class="fas fa-sync-alt mr-1"></i>새로고침</button>
                            </div>
                        </div>
                        <p class="text-xs text-gray-500 mb-3"><i class="fas fa-info-circle mr-1"></i>구매한 상품의 결제·배송 상태를 실시간으로 확인할 수 있습니다. 문의 내용은 본인과 쇼핑몰 관리자만 볼 수 있습니다.</p>
                        <div id="shopMyOrders" class="space-y-2 max-h-[70vh] overflow-y-auto">
                            <p class="text-center text-gray-400 text-sm py-8"><i class="fas fa-shopping-bag text-3xl text-gray-200 mb-2 block"></i>아직 구매 내역이 없습니다</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 쇼핑몰 문의 모달 (등록) -->
            <div id="inquiryModal" class="fixed inset-0 bg-black/50 z-[100] hidden items-center justify-center p-4">
                <div class="bg-white rounded-xl shadow-2xl max-w-md w-full p-5">
                    <div class="flex items-center justify-between mb-3">
                        <h3 class="text-lg font-bold text-gray-800"><i class="fas fa-comment-dots text-blue-600 mr-2"></i>쇼핑몰 문의하기</h3>
                        <button onclick="closeInquiryModal()" class="text-gray-400 hover:text-gray-600 text-xl"><i class="fas fa-times"></i></button>
                    </div>
                    <div class="space-y-3">
                        <div>
                            <label class="block text-xs font-medium text-gray-700 mb-1">문의 유형 <span class="text-red-500">*</span></label>
                            <select id="inquiryCategory" class="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                                <option value="">선택해주세요</option>
                                <option value="shipping">배송 문의</option>
                                <option value="refund">환불 문의</option>
                                <option value="other">기타 문의</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-xs font-medium text-gray-700 mb-1">관련 주문 (선택)</label>
                            <select id="inquiryOrderId" class="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                                <option value="">없음</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-xs font-medium text-gray-700 mb-1">제목 <span class="text-red-500">*</span></label>
                            <input id="inquiryTitle" type="text" maxlength="100" placeholder="문의 제목" class="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                        </div>
                        <div>
                            <label class="block text-xs font-medium text-gray-700 mb-1">내용 <span class="text-red-500">*</span></label>
                            <textarea id="inquiryContent" rows="5" maxlength="2000" placeholder="문의 내용을 자세히 적어주세요" class="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"></textarea>
                        </div>
                        <p class="text-[11px] text-gray-500"><i class="fas fa-lock mr-1"></i>문의 내용은 본인과 쇼핑몰 관리자만 열람 가능합니다.</p>
                    </div>
                    <div class="flex gap-2 mt-4">
                        <button onclick="closeInquiryModal()" class="flex-1 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm font-medium text-gray-700">취소</button>
                        <button onclick="submitInquiry()" class="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-bold"><i class="fas fa-paper-plane mr-1"></i>문의 등록</button>
                    </div>
                </div>
            </div>

            <!-- 쇼핑몰 문의 내역 모달 -->
            <div id="myInquiriesModal" class="fixed inset-0 bg-black/50 z-[100] hidden items-center justify-center p-4">
                <div class="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-5 max-h-[85vh] flex flex-col">
                    <div class="flex items-center justify-between mb-3">
                        <h3 class="text-lg font-bold text-gray-800"><i class="fas fa-clipboard-list text-blue-600 mr-2"></i>내 문의 내역</h3>
                        <button onclick="closeMyInquiriesModal()" class="text-gray-400 hover:text-gray-600 text-xl"><i class="fas fa-times"></i></button>
                    </div>
                    <p class="text-[11px] text-gray-500 mb-3"><i class="fas fa-lock mr-1"></i>본인이 작성한 문의만 표시됩니다.</p>
                    <div id="myInquiriesList" class="space-y-2 overflow-y-auto flex-1">
                        <p class="text-center text-gray-400 text-sm py-8">불러오는 중...</p>
                    </div>
                </div>
            </div>

            <!-- 공지사항 페이지 (별도) -->
            <div id="dashPage-notice" class="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8 hidden">
                <div class="bg-white rounded-xl shadow-lg p-4 sm:p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h2 class="text-xl sm:text-2xl font-bold text-gray-800">
                            <i class="fas fa-bullhorn mr-2 text-blue-600"></i>공지사항
                        </h2>
                        <button onclick="loadNotices()" class="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-xs font-medium text-gray-700">
                            <i class="fas fa-sync-alt mr-1"></i>새로고침
                        </button>
                    </div>
                    <p class="text-xs text-gray-500 mb-4"><i class="fas fa-info-circle mr-1"></i>중요 공지는 상단에 고정 표시됩니다. 항목을 클릭하면 전체 내용을 확인할 수 있습니다.</p>
                    <div id="noticeList" class="space-y-2">
                        <p class="text-center text-gray-400 text-sm py-8"><i class="fas fa-bullhorn text-3xl text-gray-200 mb-2 block"></i>공지사항을 불러오는 중...</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- 공지 상세 모달 -->
        <div id="noticeDetailModal" class="fixed inset-0 bg-black bg-opacity-60 z-[80] flex items-center justify-center p-4 hidden">
            <div class="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col">
                <div class="flex items-center justify-between px-4 py-3 border-b bg-blue-50">
                    <h3 id="noticeDetailTitle" class="text-base sm:text-lg font-bold text-gray-800 truncate flex-1 pr-2"></h3>
                    <button onclick="closeNoticeDetail()" class="text-gray-500 hover:text-gray-800 text-xl leading-none">&times;</button>
                </div>
                <div class="px-4 py-2 border-b bg-gray-50 flex items-center gap-2 text-[11px] text-gray-500">
                    <span id="noticeDetailDate"></span>
                    <span id="noticeDetailPin" class="hidden px-1.5 py-0.5 bg-red-100 text-red-700 rounded font-bold">중요</span>
                </div>
                <div id="noticeDetailContent" class="flex-1 overflow-y-auto p-4 text-sm text-gray-700 whitespace-pre-wrap break-words"></div>
            </div>
        </div>

        <script src="/static/axios.min.js"></script>
        <script src="/static/i18n.js?v=20260427c"></script>
        <script>
            let currentUser = null;
            let accumulatedAmount = 0;

            // HTML 이스케이프 (XSS 방지)
            function escapeHtml(str) {
                if (!str) return '';
                return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
            }

            // 로그인 체크
            function checkAuth() {
                const userStr = localStorage.getItem('user');
                if (!userStr) {
                    window.location.href = '/';
                    return null;
                }
                return JSON.parse(userStr);
            }

            // 페이지 로드
            async function loadDashboard() {
                currentUser = checkAuth();
                if (!currentUser) return;

                // 정책 표 동적 렌더링 (V1/V2 시점에 따라 자동 분기)
                try { renderPolicyTable(); } catch (e) { console.error('renderPolicyTable error:', e); }

                document.getElementById('userName').textContent = currentUser.name;
                // 추천인 코드 표시
                if (currentUser.referral_code) {
                    document.getElementById('myReferralCode').textContent = currentUser.referral_code;
                }
                // 지갑주소 표시 (앞 6자리...뒤 4자리)
                if (currentUser.wallet_address) {
                    const wallet = currentUser.wallet_address;
                    const shortWallet = wallet.substring(0, 6) + '...' + wallet.substring(wallet.length - 4);
                    document.getElementById('userWallet').textContent = shortWallet;
                    document.getElementById('userWallet').title = wallet; // 호버 시 전체 주소 표시
                }
                
                // QR 코드 생성
                generateQRCode();
                
                // 병렬 로딩 (빠른 로드)
                await Promise.allSettled([
                    loadUserInfo(),
                    loadStakings(),
                    loadReferrals()
                ]);
            }

            // 사용자 정보 로드
            async function loadUserInfo() {
                try {
                    const response = await axios.get(\`/api/user/\${currentUser.id}\`);
                    if (response.data.success) {
                        const user = response.data.user;
                        document.getElementById('qtaBalance').textContent = user.qta_balance.toLocaleString();
                        document.getElementById('qxBalance').textContent = user.qx_balance.toLocaleString();
                        document.getElementById('qkeyBalance').textContent = (user.qkey_balance || 0).toLocaleString();
                        document.getElementById('usdtBalance').textContent = user.usdt_balance.toFixed(2);
                        
                        // 스왑 가능 QKEY 잔액 업데이트
                        const swapEl = document.getElementById('swapQkeyBalance');
                        if (swapEl) swapEl.textContent = (user.qkey_balance || 0).toLocaleString();
                        
                        // 쇼핑몰 QKEY 잔액 업데이트
                        const shopBalEl = document.getElementById('shopQkeyBalance');
                        if (shopBalEl) shopBalEl.textContent = (user.qkey_balance || 0).toLocaleString() + ' QKEY';
                        
                        // currentUser 객체도 갱신
                        currentUser = user;
                        
                        // 로컬 스토리지 업데이트
                        localStorage.setItem('user', JSON.stringify(user));
                    }
                } catch (error) {
                    console.error('Failed to load user info:', error);
                }
            }

            // 스테이킹 현황 업데이트
            function updateStakingStatus(stakings) {
                // ★ 룰: 진입금액(USDT)과 진행중 건수는 리셋 여부와 상관없이 무조건 표시한다.
                //   리셋된 스테이킹도 본인이 입금한 금액이므로 메인 카드(퀀타리움구매)에 합산해 보여줘야 한다.
                //   코인 3종(QTA/QX/QKEY) 보상값만 리셋된 row에서 0으로 표시되도록 백엔드에서 이미 처리되어 있다.
                const activeStakings = stakings.filter(s => s.status === 'active');
                
                // 전체 위탁 수량 계산 (리셋된 건도 포함)
                const totalAmount = activeStakings.reduce((sum, s) => sum + s.amount, 0);
                
                // 스테이킹 현황 카드 업데이트
                document.getElementById('stakingStatus').textContent = totalAmount.toLocaleString();
                document.getElementById('stakingCount').textContent = I18N.t('dash.active') + ': ' + activeStakings.length + I18N.t('dash.cases');
            }

            // 스테이킹 목록 로드
            async function loadStakings() {
                try {
                    const response = await axios.get(\`/api/staking/list/\${currentUser.id}\`);
                    if (response.data.success) {
                        const stakings = response.data.stakings;
                        userStakings = stakings; // TXID 입력용 저장
                        const listEl = document.getElementById('stakingList');
                        
                        // 스테이킹 현황 업데이트
                        updateStakingStatus(stakings);
                        
                        // 기간 종료된 스테이킹이 있는지 체크
                        const now = new Date();
                        const hasCompletedStaking = stakings.some(s => {
                            if (s.status !== 'active' || !s.end_date) return false;
                            const endDate = new Date(s.end_date);
                            return endDate <= now;
                        });
                        
                        // 출금 섹션 항상 표시 + 잔액 업데이트 + 출금 신청 내역
                        updateWithdrawalBalances();
                        updateWithdrawalButtons();
                        loadMyWithdrawals();
                        
                        if (stakings.length === 0) {
                            listEl.innerHTML = '<p class="text-gray-500 text-center py-8">' + I18N.t('dash.no_staking') + '</p>';
                            return;
                        }

                        listEl.innerHTML = stakings.map(s => {
                            const startDate = s.start_date ? new Date(s.start_date).toLocaleDateString('ko-KR') : '-';
                            const endDate = s.end_date ? new Date(s.end_date).toLocaleDateString('ko-KR') : '-';
                            const endDateTime = s.end_date ? new Date(s.end_date) : null;
                            const isCompleted = s.status === 'active' && endDateTime && endDateTime <= now;
                            
                            let statusColor, statusText;
                            // ★ 어드민이 리셋 처리한 스테이킹은 진입금액 합계에서 제외되었으므로
                            //   사용자가 알아볼 수 있도록 별도의 회색 "리셋됨" 배지로 표시
                            const isReset = !!s.reset_at;
                            if (s.status === 'pending') {
                                statusColor = 'yellow';
                                statusText = I18N.t('dash.status_pending');
                            } else if (isReset) {
                                statusColor = 'gray';
                                statusText = '리셋됨';
                            } else if (s.status === 'active' && isCompleted) {
                                statusColor = 'blue';
                                statusText = I18N.t('dash.status_period_end');
                            } else if (s.status === 'active') {
                                statusColor = 'green';
                                statusText = I18N.t('dash.status_active');
                            } else if (s.status === 'rejected') {
                                statusColor = 'red';
                                statusText = I18N.t('dash.status_rejected');
                            } else {
                                statusColor = 'gray';
                                statusText = I18N.t('dash.status_completed');
                            }

                            return \`
                                <div class="border border-gray-200 rounded-lg p-4 \${isCompleted ? 'bg-blue-50 border-blue-300' : ''}">
                                    <div class="flex justify-between items-start mb-2">
                                        <div>
                                            <p class="font-bold text-lg text-gray-800">$\${s.amount.toLocaleString()}</p>
                                            <p class="text-sm text-gray-600">\${s.period_days || (s.period_months * 30)}\${I18N.t('dash.days')} \${I18N.t('dash.staking_term')}</p>
                                        </div>
                                        <span class="px-3 py-1 bg-\${statusColor}-100 text-\${statusColor}-700 rounded-full text-sm font-medium">
                                            \${statusText}
                                        </span>
                                    </div>
                                    \${isCompleted ? '<p class="text-sm text-blue-600 font-medium mb-2"><i class="fas fa-check-circle mr-1"></i>' + I18N.t('dash.withdraw_available') + '</p>' : ''}
                                    \${s.status === 'pending' ? '<div class="mb-2 p-2 rounded-lg ' + (s.txid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200') + '"><p class="text-xs font-medium ' + (s.txid ? 'text-green-700' : 'text-red-700') + '"><i class="fas ' + (s.txid ? 'fa-check-circle' : 'fa-exclamation-circle') + ' mr-1"></i>TXID: ' + (s.txid ? s.txid.substring(0, 20) + '...' : I18N.t('dash.txid_unregistered')) + '</p></div>' : ''}
                                    <div class="grid grid-cols-3 gap-3 text-sm mt-4">
                                        <div>
                                            <p class="text-gray-600">QTA</p>
                                            <p class="font-bold text-blue-600">\${s.qta_reward.toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p class="text-gray-600">QX</p>
                                            <p class="font-bold text-purple-600">\${s.qx_reward.toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p class="text-gray-600">QKEY</p>
                                            <p class="font-bold text-yellow-600">\${(s.qkey_reward || 0).toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p class="text-gray-600">\${I18N.t('dash.daily_rate')}</p>
                                            <p class="font-bold text-green-600">\${s.daily_rate ? (s.daily_rate * 100).toFixed(1) + '%' : '-'}</p>
                                        </div>
                                        <div>
                                            <p class="text-gray-600">\${I18N.t('dash.start_date')}</p>
                                            <p class="font-medium">\${startDate}</p>
                                        </div>
                                        <div>
                                            <p class="text-gray-600">\${I18N.t('dash.end_date')}</p>
                                            <p class="font-medium">\${endDate}</p>
                                        </div>
                                    </div>
                                </div>
                            \`;
                        }).join('');
                    }
                } catch (error) {
                    console.error('Failed to load stakings:', error);
                    var listEl = document.getElementById('stakingList');
                    if (listEl) listEl.innerHTML = '<p class="text-gray-500 text-center py-8">' + I18N.t('dash.no_staking') + '</p>';
                }
            }
            
            // ============================================
            // 스왑 (코인 교환) 기능 - 2탭 UI
            // ============================================

            function switchSwapTab(tab) {
                var qkeyTab = document.getElementById('swapTabQkey');
                var usdtTab = document.getElementById('swapTabUsdt');
                var qkeyPanel = document.getElementById('swapPanelQkey');
                var usdtPanel = document.getElementById('swapPanelUsdt');
                if (tab === 'qkey') {
                    qkeyTab.className = 'flex-1 py-3 text-sm sm:text-base font-bold transition bg-indigo-600 text-white';
                    usdtTab.className = 'flex-1 py-3 text-sm sm:text-base font-bold transition bg-white text-gray-600 hover:bg-gray-50';
                    qkeyPanel.style.display = '';
                    usdtPanel.style.display = 'none';
                } else {
                    usdtTab.className = 'flex-1 py-3 text-sm sm:text-base font-bold transition bg-green-600 text-white';
                    qkeyTab.className = 'flex-1 py-3 text-sm sm:text-base font-bold transition bg-white text-gray-600 hover:bg-gray-50';
                    usdtPanel.style.display = '';
                    qkeyPanel.style.display = 'none';
                }
            }

            var swapRates = {
                qkey: { qta: {need: 1, get: 1}, qx: {need: 5, get: 1}, usdt: {need: 150, get: 1} },
                usdt: { qkey: {need: 1, get: 150}, qta: {need: 1, get: 150}, qx: {need: 1, get: 30} }
            };

            function updateSwapPreview(from) {
                if (from === 'qkey') {
                    var target = document.getElementById('swapQkeyTarget').value;
                    var v = parseInt(document.getElementById('swapQkeyAmount').value) || 0;
                    var rate = swapRates.qkey[target];
                    var needAmount = v * rate.need;
                    var getAmount = v * rate.get;
                    document.getElementById('swapQkeyNeedText').textContent = needAmount.toLocaleString() + ' QKEY';
                    document.getElementById('swapQkeyGetText').textContent = getAmount.toLocaleString() + ' ' + target.toUpperCase();
                    // USDT일 때 label 힌트
                    var label = document.getElementById('swapQkeyInputLabel');
                    if (target === 'usdt') {
                        label.textContent = 'USDT ' + I18N.t('dash.swap_amount_label') + ' (Min 100, 100 unit)';
                    } else {
                        label.textContent = target.toUpperCase() + ' ' + I18N.t('dash.swap_amount_label');
                    }
                } else {
                    var target = document.getElementById('swapUsdtTarget').value;
                    var v = parseFloat(document.getElementById('swapUsdtAmount').value) || 0;
                    var rate = swapRates.usdt[target];
                    var needAmount = v * rate.need;
                    var getAmount = v * rate.get;
                    document.getElementById('swapUsdtNeedText').textContent = needAmount.toLocaleString() + ' USDT';
                    document.getElementById('swapUsdtGetText').textContent = getAmount.toLocaleString() + ' ' + target.toUpperCase();
                }
            }

            async function updateSwapBalances() {
                try {
                    const response = await axios.get('/api/user/' + currentUser.id);
                    if (response.data.success) {
                        var u = response.data.user;
                        var qkeyEl = document.getElementById('swapQkeyBalance');
                        var usdtEl = document.getElementById('swapUsdtBalance');
                        if (qkeyEl) qkeyEl.textContent = (u.qkey_balance || 0).toLocaleString();
                        if (usdtEl) usdtEl.textContent = (u.usdt_balance || 0).toFixed(2);
                    }
                } catch(e) {}
            }
            updateSwapBalances();

            // ============================================
            // QKEY 쇼핑몰
            // ============================================
            // 대시보드/쇼핑몰 페이지 전환
            function switchDashPage(page) {
                ['main','shop','notice'].forEach(function(p) {
                    var el = document.getElementById('dashPage-' + p);
                    var nav = document.getElementById('dashNav-' + p);
                    if (p === page) {
                        if (el) el.classList.remove('hidden');
                        if (nav) { nav.classList.remove('text-gray-400'); nav.classList.add('text-purple-600','border-b-2','border-purple-600'); }
                    } else {
                        if (el) el.classList.add('hidden');
                        if (nav) { nav.classList.add('text-gray-400'); nav.classList.remove('text-purple-600','border-b-2','border-purple-600'); }
                    }
                });
                if (page === 'shop') { loadShopProducts(); loadMyOrders(); }
                if (page === 'notice') { loadNotices(); markNoticesRead(); }
            }

            // ================== 공지사항 (사용자) ==================
            var _noticesCache = [];
            async function loadNotices() {
                var el = document.getElementById('noticeList');
                if (!el) return;
                try {
                    var res = await axios.get('/api/notices?t=' + Date.now());
                    var list = (res.data && res.data.notices) || [];
                    _noticesCache = list;
                    if (list.length === 0) {
                        el.innerHTML = '<p class="text-center text-gray-400 text-sm py-8"><i class="fas fa-bullhorn text-3xl text-gray-200 mb-2 block"></i>등록된 공지사항이 없습니다</p>';
                        return;
                    }
                    el.innerHTML = list.map(function(n) {
                        var date = n.created_at ? new Date(n.created_at).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'}) : '';
                        var pinTag = n.is_pinned ? '<span class="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-[10px] font-bold mr-1">중요</span>' : '';
                        var preview = String(n.content || '').replace(/<[^>]*>/g,'').substring(0,80);
                        return '<div onclick="openNoticeDetail(' + n.id + ')" class="border rounded-lg p-3 hover:bg-blue-50 cursor-pointer transition">' +
                            '<div class="flex items-center justify-between gap-2">' +
                                '<div class="flex-1 min-w-0">' +
                                    '<p class="text-sm font-bold text-gray-800 truncate">' + pinTag + escapeHtml(n.title) + '</p>' +
                                    '<p class="text-xs text-gray-500 mt-0.5 truncate">' + escapeHtml(preview) + '</p>' +
                                '</div>' +
                                '<span class="text-[10px] text-gray-400 whitespace-nowrap">' + date + '</span>' +
                            '</div>' +
                        '</div>';
                    }).join('');
                } catch(e) {
                    el.innerHTML = '<p class="text-center text-red-400 text-sm py-8">공지사항을 불러올 수 없습니다</p>';
                }
            }

            async function openNoticeDetail(id) {
                try {
                    var res = await axios.get('/api/notices/' + id);
                    if (!res.data || !res.data.success) return;
                    var n = res.data.notice;
                    var titleEl = document.getElementById('noticeDetailTitle');
                    var dateEl = document.getElementById('noticeDetailDate');
                    var pinEl = document.getElementById('noticeDetailPin');
                    var contentEl = document.getElementById('noticeDetailContent');
                    if (titleEl) titleEl.textContent = n.title || '';
                    if (dateEl) dateEl.textContent = n.created_at ? new Date(n.created_at).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'}) : '';
                    if (pinEl) { if (n.is_pinned) pinEl.classList.remove('hidden'); else pinEl.classList.add('hidden'); }
                    if (contentEl) contentEl.textContent = n.content || '';
                    var modal = document.getElementById('noticeDetailModal');
                    if (modal) modal.classList.remove('hidden');
                } catch(e) {}
            }
            function closeNoticeDetail() {
                var modal = document.getElementById('noticeDetailModal');
                if (modal) modal.classList.add('hidden');
            }

            // 새 공지 배지 표시 (마지막 확인 시간 이후 새 글이 있으면)
            async function checkNewNotices() {
                try {
                    var res = await axios.get('/api/notices?t=' + Date.now());
                    var list = (res.data && res.data.notices) || [];
                    if (!list.length) return;
                    var lastSeen = parseInt(localStorage.getItem('noticeLastSeen') || '0', 10);
                    var newest = 0;
                    list.forEach(function(n) {
                        var t = n.created_at ? new Date(n.created_at).getTime() : 0;
                        if (t > newest) newest = t;
                    });
                    var badge = document.getElementById('noticeUnreadBadge');
                    if (badge) {
                        if (newest > lastSeen) badge.classList.remove('hidden');
                        else badge.classList.add('hidden');
                    }
                } catch(e) {}
            }
            function markNoticesRead() {
                localStorage.setItem('noticeLastSeen', String(Date.now()));
                var badge = document.getElementById('noticeUnreadBadge');
                if (badge) badge.classList.add('hidden');
            }
            // 페이지 로드 직후 + 5분마다 새 공지 확인
            setTimeout(checkNewNotices, 1500);
            setInterval(checkNewNotices, 5 * 60 * 1000);

            function switchShopTab(tab) {
                ['products','orders'].forEach(function(t) {
                    var panel = document.getElementById('shopPanel-' + t);
                    var btn = document.getElementById('shopTab-' + t);
                    if (t === tab) {
                        panel.classList.remove('hidden');
                        btn.classList.remove('text-gray-400');
                        btn.classList.add('text-pink-600', 'border-b-2', 'border-pink-600');
                    } else {
                        panel.classList.add('hidden');
                        btn.classList.add('text-gray-400');
                        btn.classList.remove('text-pink-600', 'border-b-2', 'border-pink-600');
                    }
                });
                if (tab === 'orders') loadMyOrders();
            }

            var _currentShopCategory = '전체';

            async function loadShopProducts() {
                try {
                    const res = await axios.get('/api/shop/products');
                    if (!res.data.success) return;
                    var products = res.data.products || [];
                    // QKEY 잔액 표시
                    var balEl = document.getElementById('shopQkeyBalance');
                    if (balEl && currentUser) {
                        try {
                            var uRes = await axios.get('/api/user/' + currentUser.id);
                            if (uRes.data.success) balEl.textContent = (uRes.data.user.qkey_balance || 0).toLocaleString() + ' QKEY';
                        } catch(e){}
                    }
                    // 상품 데이터를 전역에 저장
                    window._shopProducts = products;
                    // 카테고리 필터 버튼 생성
                    var cats = ['전체'];
                    products.forEach(function(p) { if (p.category && cats.indexOf(p.category) < 0) cats.push(p.category); });
                    var filterEl = document.getElementById('shopCategoryFilter');
                    if (filterEl) {
                        filterEl.innerHTML = cats.map(function(c) {
                            var active = c === _currentShopCategory;
                            return '<button onclick="filterShopCategory(\\'' + c + '\\')" class="shopCatBtn px-3 py-1 rounded-full text-xs font-bold transition ' +
                                (active ? 'bg-pink-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-pink-100') + '">' + c + '</button>';
                        }).join('');
                    }
                    renderShopProducts(products);
                } catch(e) {
                    console.error('Shop load error:', e);
                }
            }

            function filterShopCategory(cat) {
                _currentShopCategory = cat;
                var products = window._shopProducts || [];
                // 필터 버튼 스타일 업데이트
                document.querySelectorAll('.shopCatBtn').forEach(function(btn) {
                    if (btn.textContent === cat) {
                        btn.className = 'shopCatBtn px-3 py-1 rounded-full text-xs font-bold transition bg-pink-600 text-white';
                    } else {
                        btn.className = 'shopCatBtn px-3 py-1 rounded-full text-xs font-bold transition bg-gray-200 text-gray-600 hover:bg-pink-100';
                    }
                });
                var filtered = cat === '전체' ? products : products.filter(function(p) { return p.category === cat; });
                renderShopProducts(filtered);
            }

            function renderShopProducts(products) {
                var el = document.getElementById('shopProductList');
                if (products.length === 0) {
                    el.innerHTML = '<p class="col-span-2 sm:col-span-3 lg:col-span-4 text-center text-gray-400 py-8 text-sm">등록된 상품이 없습니다</p>';
                    return;
                }
                el.innerHTML = '';
                products.forEach(function(p) {
                    try {
                    var priceQkey = Math.ceil(p.price_krw / 10);
                    var card = document.createElement('div');
                    card.className = 'border-2 border-pink-200 rounded-xl p-3 hover:border-pink-400 transition' + (p.stock === 0 ? ' opacity-50 pointer-events-none' : '');
                    // 이미지 영역
                    if (p.image_url) {
                        var img = document.createElement('img');
                        img.src = p.image_url;
                        img.className = 'w-full h-28 object-cover rounded-lg mb-2 cursor-pointer';
                        img.onerror = function(){ this.style.display='none'; };
                        img.onclick = function(){ showProductDetail(p.id); };
                        card.appendChild(img);
                    } else {
                        var ph = document.createElement('div');
                        ph.className = 'w-full h-28 bg-gradient-to-br from-pink-100 to-purple-100 rounded-lg mb-2 flex items-center justify-center';
                        ph.innerHTML = '<i class="fas fa-box text-4xl text-pink-300"></i>';
                        card.appendChild(ph);
                    }
                    // 텍스트 정보
                    var stockText = p.stock === -1 ? '' : (p.stock <= 0 ? '<span class="text-red-500 text-xs font-bold">품절</span>' : '<span class="text-xs text-gray-500">재고 ' + p.stock + '</span>');
                    var bal = currentUser ? (currentUser.qkey_balance || 0) : 0;
                    var shortageHtml = bal < priceQkey ? '<p class="text-xs text-red-500 font-bold mb-1"><i class="fas fa-exclamation-triangle mr-1"></i>QKEY 부족 (' + (priceQkey - bal).toLocaleString() + ' 부족)</p>' : '';
                    // 옵션 HTML
                    var optsHtml = '';
                    try { var opts=[]; if(p.options) opts=JSON.parse(p.options); optsHtml = opts.map(function(o,idx){ return '<div class="mt-1"><label class="text-xs text-gray-500">' + escapeHtml(o.name) + '</label><select id="opt_' + p.id + '_' + idx + '" class="w-full px-2 py-1 border rounded text-xs bg-white"><option value="">선택</option>' + (o.values||[]).map(function(v){ return '<option value="' + escapeHtml(v) + '">' + escapeHtml(v) + '</option>'; }).join('') + '</select></div>'; }).join(''); } catch(e){}
                    // 상세보기 버튼
                    var detailBtnHtml = p.detail_image_url ? '<button class="shopDetailBtn w-full mb-1 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs transition" data-pid="' + p.id + '"><i class="fas fa-search-plus mr-1"></i>상세보기</button>' : '';
                    var infoDiv = document.createElement('div');
                    infoDiv.innerHTML = '<h4 class="font-bold text-sm text-gray-800 truncate">' + escapeHtml(p.name) + '</h4>' +
                        '<p class="text-xs text-gray-500 truncate mb-1">' + escapeHtml((p.description||'').replace(/<[^>]*>/g,'').substring(0,80)) + '</p>' +
                        '<p class="text-xs text-gray-600 mb-1">' + Number(p.price_krw).toLocaleString() + '원</p>' +
                        '<p class="text-sm font-bold text-pink-600 mb-1">' + priceQkey.toLocaleString() + ' QKEY</p>' +
                        shortageHtml + stockText + optsHtml + detailBtnHtml;
                    card.appendChild(infoDiv);
                    // 상세보기 버튼 이벤트 바인딩
                    var detBtn = infoDiv.querySelector('.shopDetailBtn');
                    if (detBtn) { detBtn.onclick = function(){ showProductDetail(p.id); }; }
                    // 구매 버튼 (눈에 잘 띄게 진한 파란색 + 큰 글씨 + 그림자)
                    var buyBtn = document.createElement('button');
                    buyBtn.className = 'w-full mt-2 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-sm font-extrabold transition shadow-lg border-2 border-blue-700';
                    buyBtn.style.cssText = 'display:block !important; visibility:visible !important; opacity:1 !important;';
                    buyBtn.innerHTML = '<i class="fas fa-shopping-cart mr-2"></i>구매하기';
                    buyBtn.onclick = (function(pid, pname, pq){ return function(){ buyProduct(pid, pname, pq); }; })(p.id, p.name, priceQkey);
                    card.appendChild(buyBtn);
                    el.appendChild(card);
                    } catch(cardErr) { console.error('Card render error for product', p.id, cardErr); }
                });
            }

            async function loadMyOrders() {
                try {
                    var res = await axios.get('/api/shop/orders/' + currentUser.id);
                    if (!res.data.success) return;
                    var orders = res.data.orders || [];
                    var el = document.getElementById('shopMyOrders');
                    if (orders.length === 0) {
                        el.innerHTML = '<p class="text-center text-gray-400 text-sm py-4">구매 내역이 없습니다</p>';
                        return;
                    }
                    el.innerHTML = orders.map(function(o) {
                        var date = new Date(o.created_at).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'});
                        var statusMap = {paid:'결제완료',shipping:'배송중',delivered:'배송완료',cancelled:'취소완료'};
                        var statusColor = {paid:'green',shipping:'blue',delivered:'gray',cancelled:'red'};
                        // 결제완료(paid) 상태에서만 취소 버튼 노출
                        var cancelBtn = o.status === 'paid'
                            ? '<button onclick="cancelMyOrder(' + o.id + ', \\'' + escapeHtml(o.product_name).replace(/'/g,"\\\\'") + '\\', ' + Number(o.qkey_used) + ')" class="mt-2 w-full py-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-lg text-xs font-extrabold transition shadow border-2 border-red-700"><i class="fas fa-ban mr-1"></i>구매취소</button>'
                            : '';
                        // 취소된 주문의 경우: 취소 일시/사유/환불 정보 표시
                        var cancelInfo = '';
                        if (o.status === 'cancelled') {
                            var cDate = o.cancelled_at ? new Date(o.cancelled_at).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'}) : '-';
                            var cBy = o.cancelled_by === 'admin' ? '관리자' : (o.cancelled_by === 'user' ? '본인' : '시스템');
                            var cReason = o.cancel_reason || '-';
                            cancelInfo = '<div class="mt-2 p-2 bg-red-50 border border-red-200 rounded text-[11px] text-red-700">' +
                                '<p class="font-bold"><i class="fas fa-times-circle mr-1"></i>취소 처리됨</p>' +
                                '<p>· 취소일시: ' + cDate + '</p>' +
                                '<p>· 처리자: ' + cBy + '</p>' +
                                '<p>· 사유: ' + escapeHtml(cReason) + '</p>' +
                                '<p>· 환불: ' + Number(o.qkey_used).toLocaleString() + ' QKEY (즉시 반환됨)</p>' +
                            '</div>';
                        }
                        return '<div class="bg-gray-50 rounded-lg p-3 mb-2 ' + (o.status === 'cancelled' ? 'opacity-90' : '') + '">' +
                                '<div class="flex items-center justify-between">' +
                                    '<div class="flex-1 min-w-0"><p class="text-sm font-medium text-gray-800 truncate ' + (o.status === 'cancelled' ? 'line-through' : '') + '">' + escapeHtml(o.product_name) + ' x' + o.quantity + '</p>' +
                                    '<p class="text-xs text-gray-500">' + date + '</p></div>' +
                                    '<div class="text-right ml-2"><p class="text-sm font-bold text-pink-600">' + Number(o.qkey_used).toLocaleString() + ' QKEY</p>' +
                                    '<span class="text-xs px-2 py-0.5 bg-' + (statusColor[o.status]||'gray') + '-100 text-' + (statusColor[o.status]||'gray') + '-700 rounded-full">' + (statusMap[o.status]||o.status) + '</span></div>' +
                                '</div>' +
                                cancelInfo +
                                cancelBtn +
                            '</div>';
                    }).join('');
                } catch(e) {}
            }

            // 사용자: 내 주문 취소 (결제완료 상태에서만 가능, QKEY 자동 환불)
            async function cancelMyOrder(orderId, productName, qkeyAmount) {
                if (!confirm('정말 [' + productName + '] 주문을 취소하시겠습니까?\\n\\n취소 시 ' + Number(qkeyAmount).toLocaleString() + ' QKEY가 즉시 환불됩니다.\\n(배송중/배송완료 상태는 취소 불가)')) return;
                try {
                    var res = await axios.post('/api/shop/order/' + orderId + '/cancel', { userId: currentUser.id });
                    if (res.data.success) {
                        alert(res.data.message || '구매가 취소되었습니다.');
                        // QKEY 잔액 갱신
                        try {
                            var balRes = await axios.get('/api/user/' + currentUser.id);
                            if (balRes.data.success && balRes.data.user) {
                                currentUser.qkey_balance = balRes.data.user.qkey_balance;
                                if (typeof refreshDashboard === 'function') refreshDashboard();
                            }
                        } catch(eb) {}
                        loadMyOrders();
                        loadShopProducts();
                    } else {
                        alert(res.data.error || '취소 처리 실패');
                    }
                } catch(e) {
                    alert((e.response && e.response.data && e.response.data.error) || '취소 처리 중 오류가 발생했습니다');
                }
            }

            // ========== 쇼핑몰 문의 (사용자) ==========
            function openInquiryModal() {
                if (!currentUser || !currentUser.id) { alert('로그인이 필요합니다'); return; }
                // 폼 초기화
                document.getElementById('inquiryCategory').value = '';
                document.getElementById('inquiryTitle').value = '';
                document.getElementById('inquiryContent').value = '';
                // 주문 목록 옵션 채우기
                var sel = document.getElementById('inquiryOrderId');
                sel.innerHTML = '<option value="">없음</option>';
                (async function() {
                    try {
                        var res = await axios.get('/api/shop/orders/' + currentUser.id);
                        if (res.data.success && Array.isArray(res.data.orders)) {
                            res.data.orders.slice(0, 30).forEach(function(o) {
                                var opt = document.createElement('option');
                                opt.value = o.id;
                                opt.textContent = '#' + o.id + ' - ' + (o.product_name || '') + ' x' + o.quantity;
                                sel.appendChild(opt);
                            });
                        }
                    } catch(e) {}
                })();
                var m = document.getElementById('inquiryModal');
                m.classList.remove('hidden');
                m.classList.add('flex');
            }

            function closeInquiryModal() {
                var m = document.getElementById('inquiryModal');
                m.classList.add('hidden');
                m.classList.remove('flex');
            }

            async function submitInquiry() {
                if (!currentUser || !currentUser.id) { alert('로그인이 필요합니다'); return; }
                var category = document.getElementById('inquiryCategory').value;
                var title = document.getElementById('inquiryTitle').value.trim();
                var content = document.getElementById('inquiryContent').value.trim();
                var orderId = document.getElementById('inquiryOrderId').value;
                if (!category) { alert('문의 유형(배송/환불/기타)을 선택해주세요'); return; }
                if (!title) { alert('제목을 입력해주세요'); return; }
                if (!content) { alert('문의 내용을 입력해주세요'); return; }
                try {
                    var res = await axios.post('/api/shop/inquiry', {
                        userId: currentUser.id,
                        orderId: orderId ? Number(orderId) : null,
                        category: category,
                        title: title,
                        content: content
                    });
                    if (res.data.success) {
                        alert('문의가 등록되었습니다');
                        closeInquiryModal();
                        loadMyInquiries();
                    } else {
                        alert(res.data.error || '문의 등록 실패');
                    }
                } catch(e) {
                    alert((e.response && e.response.data && e.response.data.error) || '문의 등록 중 오류가 발생했습니다');
                }
            }

            async function loadMyInquiries() {
                if (!currentUser || !currentUser.id) { alert('로그인이 필요합니다'); return; }
                var m = document.getElementById('myInquiriesModal');
                m.classList.remove('hidden');
                m.classList.add('flex');
                var listEl = document.getElementById('myInquiriesList');
                listEl.innerHTML = '<p class="text-center text-gray-400 text-sm py-8">불러오는 중...</p>';
                try {
                    var res = await axios.get('/api/shop/inquiries/' + currentUser.id);
                    if (!res.data.success) { listEl.innerHTML = '<p class="text-center text-red-400 text-sm py-8">조회 실패</p>'; return; }
                    var items = res.data.inquiries || [];
                    if (items.length === 0) {
                        listEl.innerHTML = '<p class="text-center text-gray-400 text-sm py-8"><i class="fas fa-inbox text-3xl text-gray-200 mb-2 block"></i>등록된 문의가 없습니다</p>';
                        return;
                    }
                    var catLabel = { shipping:'배송', refund:'환불', other:'기타' };
                    var catColor = { shipping:'blue', refund:'orange', other:'gray' };
                    listEl.innerHTML = items.map(function(it) {
                        var date = new Date(it.created_at).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'});
                        var color = catColor[it.category] || 'gray';
                        var statusBadge = it.status === 'answered'
                            ? '<span class="text-[11px] px-2 py-0.5 bg-green-100 text-green-700 rounded-full">답변완료</span>'
                            : '<span class="text-[11px] px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">답변대기</span>';
                        var replyBlock = it.admin_reply
                            ? '<div class="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800"><p class="font-bold mb-1"><i class="fas fa-reply mr-1"></i>관리자 답변</p><p class="whitespace-pre-wrap">' + escapeHtml(it.admin_reply) + '</p>' + (it.replied_at ? '<p class="text-[10px] text-blue-500 mt-1">' + new Date(it.replied_at).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'}) + '</p>' : '') + '</div>'
                            : '';
                        var orderTag = it.order_id ? '<span class="text-[11px] text-gray-500 ml-2">주문 #' + it.order_id + '</span>' : '';
                        return '<div class="bg-gray-50 rounded-lg p-3 border border-gray-200">' +
                            '<div class="flex items-center justify-between mb-1">' +
                                '<div class="flex items-center gap-2">' +
                                    '<span class="text-[11px] px-2 py-0.5 bg-' + color + '-100 text-' + color + '-700 rounded-full">' + (catLabel[it.category]||it.category) + '</span>' +
                                    statusBadge +
                                    orderTag +
                                '</div>' +
                                '<span class="text-[11px] text-gray-400">' + date + '</span>' +
                            '</div>' +
                            '<p class="text-sm font-bold text-gray-800">' + escapeHtml(it.title) + '</p>' +
                            '<p class="text-xs text-gray-600 mt-1 whitespace-pre-wrap">' + escapeHtml(it.content) + '</p>' +
                            replyBlock +
                        '</div>';
                    }).join('');
                } catch(e) {
                    listEl.innerHTML = '<p class="text-center text-red-400 text-sm py-8">조회 중 오류가 발생했습니다</p>';
                }
            }

            function closeMyInquiriesModal() {
                var m = document.getElementById('myInquiriesModal');
                m.classList.add('hidden');
                m.classList.remove('flex');
            }

            async function buyProduct(productId, productName, priceQkey) {
                // 잔액 확인 (API에서 최신 잔액 가져오기)
                var myQkey = 0;
                try {
                    var balRes = await axios.get('/api/user/' + currentUser.id);
                    if (balRes.data.success) myQkey = balRes.data.user.qkey_balance || 0;
                } catch(e) { myQkey = currentUser.qkey_balance || 0; }
                
                if (myQkey < priceQkey) {
                    var shortage = priceQkey - myQkey;
                    alert('❌ QKEY 잔액이 부족합니다!\\n\\n' +
                        '상품가격: ' + priceQkey.toLocaleString() + ' QKEY\\n' +
                        '보유 잔액: ' + myQkey.toLocaleString() + ' QKEY\\n' +
                        '부족 금액: ' + shortage.toLocaleString() + ' QKEY\\n\\n' +
                        'QKEY를 충전하거나 스테이킹 배당으로 적립 후 다시 시도해주세요.');
                    return;
                }
                // 옵션 확인
                var products = window._shopProducts || [];
                var prod = products.find(function(x) { return x.id === productId; });
                var opts = []; try { if(prod && prod.options) opts = JSON.parse(prod.options); } catch(e){}
                var selectedOptions = [];
                for (var oi = 0; oi < opts.length; oi++) {
                    var selEl = document.getElementById('opt_' + productId + '_' + oi);
                    if (selEl) {
                        var val = selEl.value;
                        if (!val) { alert(opts[oi].name + '을(를) 선택해주세요.'); return; }
                        selectedOptions.push(opts[oi].name + ': ' + val);
                    }
                }
                var optionText = selectedOptions.length > 0 ? '\\n선택옵션: ' + selectedOptions.join(', ') : '';
                if (!confirm(productName + optionText + '\\n\\n' +
                    '상품가격: ' + priceQkey.toLocaleString() + ' QKEY\\n' +
                    '보유 잔액: ' + myQkey.toLocaleString() + ' QKEY\\n' +
                    '결제 후 잔액: ' + (myQkey - priceQkey).toLocaleString() + ' QKEY\\n\\n' +
                    '구매하시겠습니까?')) return;

                var shippingName = prompt('수령인 이름:');
                if (!shippingName) return;
                var shippingPhone = prompt('연락처:');
                if (!shippingPhone) return;
                var shippingAddress = prompt('배송주소:');
                if (!shippingAddress) return;
                var shippingMemo = prompt('배송메모 (선택):') || '';

                try {
                    var res = await axios.post('/api/shop/order', {
                        userId: currentUser.id, productId: productId, quantity: 1,
                        shippingName: shippingName, shippingPhone: shippingPhone,
                        shippingAddress: shippingAddress, shippingMemo: shippingMemo,
                        selectedOptions: selectedOptions.join(' / ')
                    });
                    if (res.data.success) {
                        alert(res.data.message);
                        await loadUserInfo();
                        await loadShopProducts();
                        await loadMyOrders();
                        await updateSwapBalances();
                    }
                } catch(e) {
                    alert(e.response?.data?.error || '구매 처리 중 오류');
                }
            }

            // 상품 상세 모달
            function showProductDetail(productId) {
                var products = window._shopProducts || [];
                var p = products.find(function(x) { return x.id === productId; });
                if (!p) return;
                var priceQkey = Math.ceil(p.price_krw / 10);
                var modal = document.createElement('div');
                modal.id = 'productDetailModal';
                // ★ 모바일: 화면 전체 점유, body 스크롤 방지. 푸터는 절대로 화면 밖에 안 나감
                modal.className = 'fixed inset-0 bg-black bg-opacity-60 z-50';
                modal.style.cssText = 'overflow: hidden;';
                modal.onclick = function(e) { if (e.target === modal) { modal.remove(); document.body.style.overflow=''; } };
                // 모바일에선 모달이 화면 100% 채우고, sm+ 데스크톱에선 가운데 정렬 카드
                // height: 100dvh (동적 viewport, 주소창 제외) 사용. 미지원 브라우저는 100vh로 폴백
                // 본문은 flex-1 + min-h-0로 진짜 스크롤 가능하게, 푸터는 flex-shrink-0로 항상 보임
                modal.innerHTML =
                    '<div class="absolute inset-0 sm:flex sm:items-center sm:justify-center sm:p-4">' +
                        '<div class="bg-white sm:rounded-2xl shadow-2xl w-full sm:max-w-md flex flex-col" ' +
                             'style="height: 100vh; height: 100dvh; max-height: 100vh; max-height: 100dvh;">' +
                            '<div class="bg-white p-4 border-b flex items-center justify-between sm:rounded-t-2xl flex-shrink-0">' +
                                '<h3 class="font-bold text-lg text-gray-800 truncate pr-2">' + escapeHtml(p.name) + '</h3>' +
                                '<button onclick="document.getElementById(\\'productDetailModal\\').remove(); document.body.style.overflow=\\'\\';" class="text-gray-400 hover:text-gray-600 text-3xl leading-none flex-shrink-0 w-10 h-10 flex items-center justify-center">&times;</button>' +
                            '</div>' +
                            '<div class="p-4 overflow-y-auto flex-1 min-h-0" style="-webkit-overflow-scrolling: touch;">' +
                                '<div id="pdImgArea"></div>' +
                                '<div id="pdDescArea" class="text-sm text-gray-600 mb-3"></div>' +
                                '<div class="flex items-center justify-between bg-pink-50 rounded-lg p-3 mb-3">' +
                                    '<span class="text-sm text-gray-700">가격</span>' +
                                    '<div class="text-right"><p class="text-lg font-bold text-pink-600">' + priceQkey.toLocaleString() + ' QKEY</p><p class="text-xs text-gray-500">' + Number(p.price_krw).toLocaleString() + '원</p></div>' +
                                '</div>' +
                                (p.stock !== -1 ? '<p class="text-xs text-gray-500 mb-2">재고: ' + (p.stock <= 0 ? '<span class="text-red-500 font-bold">품절</span>' : p.stock + '개') + '</p>' : '') +
                            '</div>' +
                            // 푸터: 화면 하단에 절대 고정, safe-area 대응
                            '<div class="bg-white p-4 border-t sm:rounded-b-2xl flex-shrink-0 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]" ' +
                                 'style="padding-bottom: calc(1rem + env(safe-area-inset-bottom, 0px));">' +
                                (p.stock === 0
                                    ? '<button disabled class="w-full py-4 bg-gray-300 text-gray-500 rounded-lg font-bold cursor-not-allowed text-base"><i class="fas fa-times-circle mr-1"></i>품절</button>'
                                    : '<button id="pdBuyBtn" style="display:block !important; visibility:visible !important; opacity:1 !important;" class="w-full py-5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg font-extrabold transition shadow-2xl text-lg border-2 border-blue-700"><i class="fas fa-shopping-cart mr-2"></i>구매하기 (' + priceQkey.toLocaleString() + ' QKEY)</button>') +
                            '</div>' +
                        '</div>' +
                    '</div>';
                var old = document.getElementById('productDetailModal');
                if (old) old.remove();
                document.body.appendChild(modal);
                document.body.style.overflow = 'hidden';
                // 구매 버튼 클릭 / 모달 제거 시 body 스크롤 복구
                // 이미지를 JS로 동적 삽입 (base64 따옴표 깨짐 방지)
                var imgArea = document.getElementById('pdImgArea');
                if (p.detail_image_url) {
                    var detailImgs = [];
                    try { var parsed = JSON.parse(p.detail_image_url); if (Array.isArray(parsed)) detailImgs = parsed; } catch(e) {}
                    if (detailImgs.length > 0) {
                        detailImgs.forEach(function(url) { var img = document.createElement('img'); img.src = url; img.className = 'w-full rounded-lg mb-2'; img.onerror = function(){this.style.display='none'}; imgArea.appendChild(img); });
                    } else {
                        var img = document.createElement('img'); img.src = p.detail_image_url; img.className = 'w-full rounded-lg mb-3'; img.onerror = function(){this.style.display='none'}; imgArea.appendChild(img);
                    }
                } else if (p.image_url) {
                    var img = document.createElement('img'); img.src = p.image_url; img.className = 'w-full rounded-lg mb-3'; img.onerror = function(){this.style.display='none'}; imgArea.appendChild(img);
                }
                // 설명: HTML 태그가 포함되어 있으면 HTML로, 아니면 텍스트로
                var descArea = document.getElementById('pdDescArea');
                var desc = p.description || '';
                if (desc.indexOf('<') >= 0 && desc.indexOf('>') >= 0) {
                    descArea.innerHTML = desc;
                } else {
                    descArea.textContent = desc;
                }
                // 구매 버튼 이벤트 — 모달 닫고 body 스크롤 복구 후 구매 진행
                var buyBtn = document.getElementById('pdBuyBtn');
                if (buyBtn) buyBtn.onclick = function() {
                    modal.remove();
                    document.body.style.overflow = '';
                    buyProduct(p.id, p.name, priceQkey);
                };
            }

            // 쇼핑몰 초기 로딩
            loadShopProducts();
            loadMyOrders();

            // 어드민에서 쇼핑몰 바로가기로 왔으면 자동 전환
            if (localStorage.getItem('openShop') === '1') {
                localStorage.removeItem('openShop');
                setTimeout(function() { switchDashPage('shop'); }, 300);
            }

            async function executeSwapNew(from) {
                var target, amt, endpoint, confirmMsg;

                if (from === 'qkey') {
                    target = document.getElementById('swapQkeyTarget').value;
                    amt = parseInt(document.getElementById('swapQkeyAmount').value) || 0;
                    if (amt <= 0) { alert(I18N.t('alert.enter_valid_amount')); return; }
                    // USDT 스왑은 최소 100, 100 단위
                    if (target === 'usdt') {
                        if (amt < 100) { alert(I18N.t('swap.min_amount')); return; }
                        if (amt % 100 !== 0) { alert(I18N.t('swap.unit_error')); return; }
                    }
                    endpoint = '/api/swap/qkey-to-' + target;
                    var rate = swapRates.qkey[target];
                    confirmMsg = (amt * rate.need).toLocaleString() + ' QKEY → ' + (amt * rate.get).toLocaleString() + ' ' + target.toUpperCase();
                } else {
                    target = document.getElementById('swapUsdtTarget').value;
                    amt = parseFloat(document.getElementById('swapUsdtAmount').value) || 0;
                    if (amt <= 0) { alert(I18N.t('alert.enter_valid_amount')); return; }
                    endpoint = '/api/swap/usdt-to-' + target;
                    var rate = swapRates.usdt[target];
                    confirmMsg = (amt * rate.need).toLocaleString() + ' USDT → ' + (amt * rate.get).toLocaleString() + ' ' + target.toUpperCase();
                }

                if (!confirm(confirmMsg + '\\n\\n' + I18N.t('dash.swap_confirm'))) return;

                try {
                    const response = await axios.post(endpoint, { userId: currentUser.id, amount: amt });
                    if (response.data.success) {
                        alert(response.data.message);
                        document.getElementById(from === 'qkey' ? 'swapQkeyAmount' : 'swapUsdtAmount').value = '';
                        updateSwapPreview(from);
                        await loadUserInfo();
                        await updateSwapBalances();
                        await updateWithdrawalBalances();
                    }
                } catch (error) {
                    alert(error.response?.data?.error || I18N.t('swap.error'));
                }
            }

            // 출금 가능 잔액 업데이트
            async function updateWithdrawalBalances() {
                try {
                    const response = await axios.get(\`/api/user/\${currentUser.id}\`);
                    if (response.data.success) {
                        const user = response.data.user;
                        document.getElementById('withdrawQtaBalance').textContent = user.qta_balance.toLocaleString();
                        document.getElementById('withdrawQxBalance').textContent = user.qx_balance.toLocaleString();
                        document.getElementById('withdrawQkeyBalance').textContent = (user.qkey_balance || 0).toLocaleString();
                        document.getElementById('withdrawUsdtBalance').textContent = user.usdt_balance.toFixed(2);
                    }

                } catch (error) {
                    console.error('Failed to load withdrawal balances:', error);
                }
            }

            // 사용자: 내 출금 신청 내역 조회 + 렌더링
            var _myWithdrawalsRefreshTimer = null;
            async function loadMyWithdrawals() {
                var listEl = document.getElementById('myWithdrawList');
                var countEl = document.getElementById('withdrawHistoryCount');
                if (!listEl || !currentUser || !currentUser.id) return;
                try {
                    var res = await axios.get('/api/withdrawal/list/' + currentUser.id + '?t=' + Date.now());
                    var items = (res.data && res.data.withdrawals) || [];
                    if (countEl) {
                        var pendingCount = items.filter(function(w){ return w.status === 'pending'; }).length;
                        countEl.textContent = '(' + items.length + '건' + (pendingCount > 0 ? ' / 대기 ' + pendingCount + ')' : ')');
                    }
                    if (items.length === 0) {
                        listEl.innerHTML = '<p class="text-center text-gray-400 text-sm py-4"><i class="fas fa-inbox text-2xl text-gray-200 mb-1 block"></i>출금 신청 내역이 없습니다</p>';
                        return;
                    }
                    var statusMap = {pending:'처리대기', approved:'승인완료', rejected:'거절됨', cancelled:'취소됨'};
                    var statusBg = {pending:'bg-yellow-100 text-yellow-800', approved:'bg-green-100 text-green-700', rejected:'bg-red-100 text-red-700', cancelled:'bg-gray-200 text-gray-600'};
                    var coinColor = {QTA:'text-blue-600', QX:'text-purple-600', QKEY:'text-yellow-600', USDT:'text-green-600'};
                    listEl.innerHTML = items.map(function(w) {
                        var date = w.created_at ? new Date(w.created_at).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'}) : '-';
                        var amountFmt = w.coin_type === 'USDT' ? Number(w.amount).toFixed(2) : Number(w.amount).toLocaleString();
                        var cancelBtn = '';
                        if (w.status === 'pending') {
                            cancelBtn = '<button onclick="cancelMyWithdrawal(' + w.id + ', \\'' + w.coin_type + '\\', ' + Number(w.amount) + ')" class="mt-2 w-full py-1.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded text-xs font-extrabold transition shadow border border-red-700"><i class="fas fa-ban mr-1"></i>출금 신청 취소</button>';
                        }
                        var cancelInfo = '';
                        if (w.status === 'cancelled') {
                            var cDate = w.cancelled_at ? new Date(w.cancelled_at).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'}) : '-';
                            var cBy = w.cancelled_by === 'admin' ? '관리자' : (w.cancelled_by === 'user' ? '본인' : '시스템');
                            cancelInfo = '<div class="mt-1 text-[11px] text-gray-500"><i class="fas fa-times-circle mr-1"></i>' + cBy + ' 취소 / ' + cDate + ' / ' + amountFmt + ' ' + w.coin_type + ' 환불완료</div>';
                        }
                        var walletShort = (w.wallet_address || '').length > 18 ? (w.wallet_address.substring(0,8) + '...' + w.wallet_address.substring(w.wallet_address.length-6)) : (w.wallet_address || '-');
                        return '<div class="bg-gray-50 rounded-lg p-3 border ' + (w.status === 'pending' ? 'border-yellow-300' : (w.status === 'cancelled' ? 'border-gray-200 opacity-90' : 'border-gray-200')) + '">' +
                                '<div class="flex items-start justify-between gap-2">' +
                                    '<div class="flex-1 min-w-0">' +
                                        '<p class="text-sm font-bold ' + (coinColor[w.coin_type] || 'text-gray-700') + ' ' + (w.status === 'cancelled' ? 'line-through' : '') + '">' + amountFmt + ' ' + w.coin_type + '</p>' +
                                        '<p class="text-[11px] text-gray-500 mt-0.5">신청일: ' + date + '</p>' +
                                        '<p class="text-[11px] text-gray-500 truncate" title="' + escapeHtml(w.wallet_address || '') + '">지갑: ' + escapeHtml(walletShort) + '</p>' +
                                    '</div>' +
                                    '<span class="text-[10px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap ' + (statusBg[w.status] || 'bg-gray-100 text-gray-700') + '">' + (statusMap[w.status] || w.status) + '</span>' +
                                '</div>' +
                                cancelInfo +
                                cancelBtn +
                            '</div>';
                    }).join('');
                } catch(e) {
                    listEl.innerHTML = '<p class="text-center text-red-400 text-sm py-4">출금 내역을 불러올 수 없습니다</p>';
                }
            }

            // 사용자: 출금 신청 내역 + 잔액 자동 새로고침 (15초마다)
            // 어드민의 승인/거절/취소 처리가 사용자 화면에 자동 반영
            var _myWithdrawAutoTimer = null;
            function startMyWithdrawAutoRefresh() {
                if (_myWithdrawAutoTimer) clearInterval(_myWithdrawAutoTimer);
                _myWithdrawAutoTimer = setInterval(async function() {
                    try {
                        if (!currentUser || !currentUser.id) return;
                        // 대시보드 페이지가 보일 때만 새로고침
                        var mainPage = document.getElementById('dashPage-main');
                        if (!mainPage || mainPage.classList.contains('hidden')) return;
                        await loadMyWithdrawals();
                        // 잔액 카드 동기화
                        try {
                            var u = await axios.get('/api/user/' + currentUser.id);
                            if (u.data && u.data.success && u.data.user) {
                                currentUser.qta_balance = u.data.user.qta_balance;
                                currentUser.qx_balance = u.data.user.qx_balance;
                                currentUser.qkey_balance = u.data.user.qkey_balance;
                                currentUser.usdt_balance = u.data.user.usdt_balance;
                            }
                        } catch(eu) {}
                        await updateWithdrawalBalances();
                    } catch(eAuto) {}
                }, 15000);
            }
            // 페이지 로드 후 자동 새로고침 시작
            try { startMyWithdrawAutoRefresh(); } catch(e) {}

            // 사용자: 내 출금 신청 취소 (pending 상태에서만, 즉시 환불)
            async function cancelMyWithdrawal(withdrawalId, coinType, amount) {
                var amountFmt = coinType === 'USDT' ? Number(amount).toFixed(2) : Number(amount).toLocaleString();
                if (!confirm('이 출금 신청을 취소하시겠습니까?\\n\\n· 코인: ' + coinType + '\\n· 금액: ' + amountFmt + ' ' + coinType + '\\n\\n취소 시 ' + amountFmt + ' ' + coinType + '가 즉시 환불됩니다.')) return;
                try {
                    var res = await axios.post('/api/withdrawal/cancel/' + withdrawalId, { userId: currentUser.id });
                    if (res.data && res.data.success) {
                        alert(res.data.message || '출금 신청이 취소되었습니다.');
                        // 잔액 즉시 갱신 + 출금 버튼 상태 갱신
                        try {
                            var u = await axios.get('/api/user/' + currentUser.id + '?t=' + Date.now());
                            if (u.data && u.data.success && u.data.user) {
                                currentUser.qta_balance = u.data.user.qta_balance;
                                currentUser.qx_balance = u.data.user.qx_balance;
                                currentUser.qkey_balance = u.data.user.qkey_balance;
                                currentUser.usdt_balance = u.data.user.usdt_balance;
                                if (typeof refreshDashboard === 'function') refreshDashboard();
                            }
                        } catch(eb) {}
                        try { if (typeof updateWithdrawalButtons === 'function') updateWithdrawalButtons(); } catch(eUB) {}
                        // 출금 잔액 카드 + 내역 동시 갱신
                        await updateWithdrawalBalances();
                        await loadMyWithdrawals();
                    } else {
                        alert((res.data && res.data.error) || '취소 처리 실패');
                    }
                } catch(e) {
                    alert((e.response && e.response.data && e.response.data.error) || '취소 처리 중 오류가 발생했습니다');
                }
            }
            
            // 서버에서 받은 출금 창 상태 캐시
            var _withdrawalWindowState = null;
            var _withdrawalWindowFetchedAt = 0;

            // 출금 가능 시간 체크
            // 룰: 매주 금요일 10:00~14:00 KST. 그 금요일이 한국 공휴일이면 직전 영업일로 이동.
            // 우선 서버 응답을 신뢰, 캐시 없을 때만 클라이언트 fallback 사용
            function isWithdrawalTime() {
                if (_withdrawalWindowState && typeof _withdrawalWindowState.isOpen === 'boolean') {
                    return _withdrawalWindowState.isOpen;
                }
                // fallback: 클라이언트 단독 체크 (공휴일 데이터 없음 - 서버 응답 도착 전 짧은 시간만 사용)
                var now = new Date();
                var kst = new Date(now.getTime() + (9 * 60 * 60 * 1000));
                var day = kst.getUTCDay();
                var hour = kst.getUTCHours();
                return (day === 5 && hour >= 10 && hour < 14);
            }

            async function fetchWithdrawalWindow() {
                try {
                    var res = await axios.get('/api/withdrawal/window?t=' + Date.now());
                    if (res.data && res.data.success) {
                        _withdrawalWindowState = res.data;
                        _withdrawalWindowFetchedAt = Date.now();
                    }
                } catch(e) {
                    console.error('Failed to fetch withdrawal window:', e);
                }
            }

            // 버튼 원래 색상 저장용
            var _withdrawBtnOriginalClasses = {};

            async function updateWithdrawalButtons() {
                // 30초 이상 지났으면 서버에서 다시 가져오기
                if (!_withdrawalWindowState || (Date.now() - _withdrawalWindowFetchedAt) > 30000) {
                    await fetchWithdrawalWindow();
                }
                const canWithdraw = isWithdrawalTime();
                var btns = document.querySelectorAll('.withdraw-btn');
                var notice = document.getElementById('withdrawalTimeNotice');
                
                if (canWithdraw) {
                    btns.forEach(function(btn) {
                        btn.disabled = false;
                        btn.classList.remove('cursor-not-allowed');
                        // 원래 색상 복원
                        if (_withdrawBtnOriginalClasses[btn.id]) {
                            btn.className = _withdrawBtnOriginalClasses[btn.id];
                        }
                    });
                    if (notice) notice.innerHTML = '<div class="bg-green-50 border border-green-300 rounded-lg p-2 text-center"><p class="text-xs sm:text-sm text-green-700 font-medium"><i class="fas fa-check-circle mr-1"></i>' + I18N.t('dash.withdrawal_open') + '</p></div>';
                } else {
                    btns.forEach(function(btn) {
                        // 원래 클래스 저장 (최초 1회만)
                        if (!_withdrawBtnOriginalClasses[btn.id]) {
                            _withdrawBtnOriginalClasses[btn.id] = btn.className;
                        }
                        btn.disabled = true;
                        // 완전 회색 버튼으로 변경
                        btn.className = 'withdraw-btn w-full bg-gray-400 text-white py-2 rounded-lg font-medium text-xs sm:text-sm cursor-not-allowed';
                    });
                    var extraInfo = '';
                    if (_withdrawalWindowState && _withdrawalWindowState.withdrawalDate) {
                        extraInfo = '<p class="text-[10px] sm:text-xs text-red-500 mt-1">다음 출금 신청일: ' + _withdrawalWindowState.withdrawalDate + ' (금) 10:00~14:00 KST</p>';
                    }
                    if (notice) notice.innerHTML = '<div class="bg-red-50 border border-red-300 rounded-lg p-2 text-center"><p class="text-xs sm:text-sm text-red-700 font-medium"><i class="fas fa-lock mr-1"></i>' + I18N.t('dash.withdrawal_closed') + '</p><p class="text-[10px] sm:text-xs text-red-500 mt-1">' + I18N.t('dash.withdrawal_schedule') + '</p>' + extraInfo + '</div>';
                }
            }

            // 페이지 로드 시 + 1분마다 체크
            updateWithdrawalButtons();
            setInterval(updateWithdrawalButtons, 60000);

            // 출금 신청
            async function requestWithdrawal(coinType) {
                // 클라이언트 시간 이중 체크
                if (!isWithdrawalTime()) {
                    alert(I18N.t('dash.withdrawal_closed'));
                    updateWithdrawalButtons();
                    return;
                }
                const balances = {
                    'QTA': parseFloat(document.getElementById('withdrawQtaBalance').textContent.replace(/,/g, '')),
                    'QX': parseFloat(document.getElementById('withdrawQxBalance').textContent.replace(/,/g, '')),
                    'QKEY': parseFloat(document.getElementById('withdrawQkeyBalance').textContent.replace(/,/g, '')),
                    'USDT': parseFloat(document.getElementById('withdrawUsdtBalance').textContent)
                };
                
                const balance = balances[coinType];
                
                if (balance <= 0) {
                    alert(I18N.t('alert.no_balance'));
                    return;
                }
                
                const amountStr = prompt(coinType + ' ' + I18N.t('dash.withdrawal_title') + '\\n\\n' + I18N.t('dash.balance') + ': ' + balance.toLocaleString() + '\\n\\n' + I18N.t('alert.enter_valid_amount') + ':');
                
                if (!amountStr) return;
                
                const amount = parseFloat(amountStr.replace(/,/g, ''));
                
                if (isNaN(amount) || amount <= 0) {
                    alert(I18N.t('alert.enter_valid_amount'));
                    return;
                }
                
                if (amount > balance) {
                    alert(I18N.t('alert.exceed_balance'));
                    return;
                }
                
                // USDT는 USDT 지갑주소 사용, 나머지는 QKEY 지갑주소 사용
                const withdrawWallet = (coinType === 'USDT') ? (currentUser.usdt_wallet_address || currentUser.wallet_address) : currentUser.wallet_address;
                const walletLabel = (coinType === 'USDT') ? 'USDT ' + I18N.t('profile.qkey_wallet') : 'QKEY ' + I18N.t('profile.qkey_wallet');
                if (confirm(coinType + ' ' + amount.toLocaleString() + ' ' + I18N.t('dash.withdrawal_title') + '?\\n\\n' + walletLabel + ': ' + withdrawWallet)) {
                    try {
                        const response = await axios.post('/api/withdrawal/request', {
                            userId: currentUser.id,
                            coinType: coinType,
                            amount: amount,
                            walletAddress: withdrawWallet
                        });
                        
                        if (response.data.success) {
                            alert(I18N.t('alert.withdrawal_applied'));
                            await loadUserInfo();
                            await updateWithdrawalBalances();
                            await loadMyWithdrawals();
                        }
                    } catch (error) {
                        alert(error.response?.data?.error || I18N.t('withdrawal.request_error'));
                    }
                }
            }

            // 회사 지갑주소 복사
            function copyCompanyWallet() {
                const walletInput = document.getElementById('companyWallet');
                walletInput.select();
                walletInput.setSelectionRange(0, 99999); // 모바일 지원
                
                // 클립보드에 복사
                navigator.clipboard.writeText(walletInput.value).then(() => {
                    alert(I18N.t('alert.copied') + '\\n\\n' + walletInput.value);
                }).catch(err => {
                    // fallback: execCommand 사용
                    try {
                        document.execCommand('copy');
                        alert(I18N.t('alert.copied') + '\\n\\n' + walletInput.value);
                    } catch (e) {
                        alert(I18N.t('alert.copy_fail'));
                    }
                });
            }

            // QR 코드 생성
            function generateQRCode() {
                const companyWallet = '0x8b6E72e378A99aEBc291C2C6861766d519239100';
                const qrcodeContainer = document.getElementById('qrcode');
                
                // 기존 QR 코드 제거
                qrcodeContainer.innerHTML = '';
                
                // 모바일에서는 더 작은 QR 코드
                const qrSize = window.innerWidth < 640 ? 120 : 150;
                
                // QR 코드 생성
                new QRCode(qrcodeContainer, {
                    text: companyWallet,
                    width: qrSize,
                    height: qrSize,
                    colorDark: '#000000',
                    colorLight: '#ffffff',
                    correctLevel: QRCode.CorrectLevel.H
                });
            }

            // TXID 입력 팝업 열기
            function openTxidInput() {
                // 최근 pending 스테이킹 찾기
                const pendingStaking = userStakings.find(s => s.status === 'pending');
                if (!pendingStaking) {
                    alert(I18N.t('txid.no_pending'));
                    return;
                }

                const modal = document.createElement('div');
                modal.id = 'txidModal';
                modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
                modal.innerHTML = \`
                    <div class="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-lg font-bold text-gray-800">
                                <i class="fas fa-receipt mr-2 text-green-600"></i>\${I18N.t('txid.title')}
                            </h3>
                            <button onclick="document.getElementById('txidModal').remove()" 
                                class="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
                        </div>
                        
                        <div class="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
                            <p class="text-xs text-orange-800 font-medium">
                                <i class="fas fa-exclamation-triangle mr-1"></i>
                                \${I18N.t('txid.info')}
                            </p>
                            <p class="text-xs text-orange-700 mt-1">
                                \${I18N.t('txid.bscscan_info')}
                            </p>
                        </div>

                        <div class="mb-4">
                            <label class="block text-sm font-bold text-gray-700 mb-2">\${I18N.t('txid.staking_application')}</label>
                            <p class="text-sm text-purple-600 font-bold">$\${pendingStaking.amount.toLocaleString()} (\${I18N.t('dash.status_pending')})</p>
                        </div>

                        <div class="mb-4">
                            <label class="block text-sm font-bold text-gray-700 mb-2">Transaction Hash (TXID)</label>
                            <input type="text" id="txidInput" 
                                placeholder="0x..." 
                                class="w-full px-3 py-3 border-2 border-gray-300 rounded-lg font-mono text-xs focus:border-green-500 focus:outline-none"
                                \${pendingStaking.txid ? 'value="' + pendingStaking.txid + '"' : ''}>
                            <p class="text-xs text-gray-500 mt-1">\${I18N.t('txid.hash_hint')}</p>
                        </div>

                        <div class="flex gap-3">
                            <button onclick="submitTxid(\${pendingStaking.id})" 
                                class="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold transition">
                                <i class="fas fa-check mr-2"></i>\${I18N.t('txid.register')}
                            </button>
                            <button onclick="document.getElementById('txidModal').remove()" 
                                class="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-3 rounded-lg font-bold transition">
                                \${I18N.t('common.cancel')}
                            </button>
                        </div>
                    </div>
                \`;
                document.body.appendChild(modal);
                document.getElementById('txidInput').focus();
            }

            // TXID 서버 전송
            async function submitTxid(stakingId) {
                const txid = document.getElementById('txidInput').value.trim();
                
                if (!txid) {
                    alert(I18N.t('txid.txid_required'));
                    return;
                }

                if (!/^0x[a-fA-F0-9]{64}$/.test(txid)) {
                    alert('⚠️ ' + I18N.t('txid.hash_hint') + '\\n\\n' + 'e.g.: 0x1a2b3c4d...');
                    return;
                }

                try {
                    const response = await axios.post('/api/staking/txid', {
                        stakingId: stakingId,
                        txid: txid
                    });

                    if (response.data.success) {
                        alert(I18N.t('txid.success'));
                        document.getElementById('txidModal').remove();
                        await loadStakings();
                    }
                } catch (error) {
                    alert(error.response?.data?.error || 'TXID error');
                }
            }

            // 유저 스테이킹 목록 저장용
            let userStakings = [];

            // 정책 V2 적용 시점: 2026-04-30 00:00 KST
            //   - $1,000~$4,000 구간: 0.5% / 90일 통일
            //   - 그 이전(V1): $1,000~$2,000=0.3%/60일, $3,000~$4,000=0.5%/90일
            var POLICY_V2_DATE = new Date('2026-04-30T00:00:00+09:00');
            function isPolicyV2() {
                return new Date() >= POLICY_V2_DATE;
            }

            // 금액별 정책 정보 반환
            function getPolicy(amount) {
                var v2 = isPolicyV2();
                if (amount >= 10000) return { rate: '1.0%', rateNum: 0.01, period: 180, periodText: '180' + I18N.t('dash.days') };
                if (amount >= 5000) return { rate: '0.7%', rateNum: 0.007, period: 120, periodText: '120' + I18N.t('dash.days') };
                if (v2) {
                    return { rate: '0.5%', rateNum: 0.005, period: 90, periodText: '90' + I18N.t('dash.days') };
                }
                if (amount >= 3000) return { rate: '0.5%', rateNum: 0.005, period: 90, periodText: '90' + I18N.t('dash.days') };
                return { rate: '0.3%', rateNum: 0.003, period: 60, periodText: '60' + I18N.t('dash.days') };
            }

            // 정책 표 동적 렌더링 (V1/V2 분기)
            function renderPolicyTable() {
                var tbody = document.getElementById('policyTableBody');
                if (!tbody) return;
                var v2 = isPolicyV2();
                var rows;
                if (v2) {
                    // V2: 1,000~4,000 통합
                    rows = [
                        { id: 'policyRow1', amount: '$1,000 ~ $4,000', rate: '0.5%', days: '90' },
                        { id: 'policyRow3', amount: '$5,000 ~ $9,000', rate: '0.7%', days: '120' },
                        { id: 'policyRow4', amount: '$10,000+',         rate: '1.0%', days: '180' }
                    ];
                } else {
                    // V1: 기존
                    rows = [
                        { id: 'policyRow1', amount: '$1,000 ~ $2,000', rate: '0.3%', days: '60' },
                        { id: 'policyRow2', amount: '$3,000 ~ $4,000', rate: '0.5%', days: '90' },
                        { id: 'policyRow3', amount: '$5,000 ~ $9,000', rate: '0.7%', days: '120' },
                        { id: 'policyRow4', amount: '$10,000+',         rate: '1.0%', days: '180' }
                    ];
                }
                var daysLabel = I18N.t('dash.days') || 'days';
                tbody.innerHTML = rows.map(function(r) {
                    return '<tr id="' + r.id + '" class="">' +
                           '<td class="px-2 sm:px-3 py-2 font-medium">' + r.amount + '</td>' +
                           '<td class="px-2 sm:px-3 py-2 text-center font-bold text-green-600">' + r.rate + '</td>' +
                           '<td class="px-2 sm:px-3 py-2 text-center font-bold text-blue-600">' + r.days + ' <span>' + daysLabel + '</span></td>' +
                           '</tr>';
                }).join('');
            }

            // $1,000 추가 (누적)
            function addAmount(step) {
                accumulatedAmount += step;
                updateAccumulatedDisplay();
            }

            // 초기화
            function resetAmount() {
                accumulatedAmount = 0;
                updateAccumulatedDisplay();
            }

            // 누적 금액 표시 업데이트
            function updateAccumulatedDisplay() {
                document.getElementById('stakingAmount').value = accumulatedAmount;
                document.getElementById('accumulatedAmountText').textContent = '$' + accumulatedAmount.toLocaleString();
                
                // 정책 테이블 하이라이트 초기화 (V1/V2 모두 처리: 존재하는 row만 초기화)
                ['policyRow1', 'policyRow2', 'policyRow3', 'policyRow4'].forEach(function(id) {
                    var el = document.getElementById(id);
                    if (el) el.className = '';
                });

                if (accumulatedAmount <= 0) {
                    document.getElementById('autoRateDisplay').textContent = '-';
                    document.getElementById('autoPeriodDisplay').textContent = '-';
                    document.getElementById('rewardPreview').classList.add('hidden');
                    return;
                }

                const policy = getPolicy(accumulatedAmount);
                document.getElementById('autoRateDisplay').textContent = policy.rate;
                document.getElementById('autoPeriodDisplay').textContent = policy.periodText;

                // 해당 정책 행 하이라이트 (V2: row1=$1,000~$4,000 통합 / V1: row1=$1,000~$2,000, row2=$3,000~$4,000)
                var v2 = isPolicyV2();
                var targetRowId = null;
                if (accumulatedAmount >= 10000) {
                    targetRowId = 'policyRow4';
                } else if (accumulatedAmount >= 5000) {
                    targetRowId = 'policyRow3';
                } else if (!v2 && accumulatedAmount >= 3000) {
                    targetRowId = 'policyRow2';
                } else {
                    targetRowId = 'policyRow1';
                }
                var targetEl = document.getElementById(targetRowId);
                if (targetEl) targetEl.className = 'bg-purple-100 font-bold';

                // 보상 미리보기 (날짜별 정책: ~5/3 QTA 75k + QX 10k + QKEY 5k, 5/4~ QTA 75k only)
                var PHASE2 = new Date('2026-05-04T00:00:00+09:00');
                var isPhase2 = new Date() >= PHASE2;
                var qtaReward = (accumulatedAmount / 1000) * 75000;
                var qxReward = isPhase2 ? 0 : (accumulatedAmount / 1000) * 10000;
                var qkeyReward = isPhase2 ? 0 : (accumulatedAmount / 1000) * 5000;
                document.getElementById('qtaRewardPreview').textContent = qtaReward.toLocaleString();
                document.getElementById('qxRewardPreview').textContent = qxReward.toLocaleString();
                document.getElementById('qkeyRewardPreview').textContent = qkeyReward.toLocaleString();

                // QX/QKEY 행 숨김 처리 (Phase2)
                var qxRow = document.getElementById('qxPreviewRow');
                var qkeyRow = document.getElementById('qkeyPreviewRow');
                if (qxRow) qxRow.style.display = isPhase2 ? 'none' : '';
                if (qkeyRow) qkeyRow.style.display = isPhase2 ? 'none' : '';
                document.getElementById('dailyRatePreview').textContent = policy.rate;
                document.getElementById('periodPreview').textContent = policy.periodText;
                document.getElementById('rewardPreview').classList.remove('hidden');
            }

            // 스테이킹 처리
            async function handleStaking(e) {
                e.preventDefault();

                const amount = accumulatedAmount;
                
                if (!amount || amount <= 0) {
                    alert(I18N.t('alert.select_amount'));
                    return;
                }

                // 입력값 검증: $1,000 미만 체크
                if (amount < 1000) {
                    alert(I18N.t('alert.min_1000'));
                    return;
                }
                
                const policy = getPolicy(amount);
                var _P2 = new Date('2026-05-04T00:00:00+09:00');
                var _isP2 = new Date() >= _P2;
                const qtaReward = (amount / 1000) * 75000;
                const qxReward = _isP2 ? 0 : (amount / 1000) * 10000;
                const qkeyReward = _isP2 ? 0 : (amount / 1000) * 5000;
                
                var _msg = '$' + amount.toLocaleString() + ' / ' + policy.periodText + '\\n\\n' + I18N.t('dash.daily_rate') + ': ' + policy.rate + '\\n' + I18N.t('dash.period') + ': ' + policy.periodText + '\\n\\n• QTA ' + qtaReward.toLocaleString();
                if (!_isP2) _msg += '\\n• QX ' + qxReward.toLocaleString() + '\\n• QKEY ' + qkeyReward.toLocaleString();
                _msg += '\\n\\n• ' + I18N.t('dash.daily_rate') + ' QKEY (' + policy.rate + ')';
                if (confirm(_msg)) {
                    try {
                        const response = await axios.post('/api/staking/create', {
                            userId: currentUser.id,
                            amount: amount
                        });

                        if (response.data.success) {
                            alert(I18N.t('alert.staking_applied'));
                            // 초기화
                            accumulatedAmount = 0;
                            updateAccumulatedDisplay();
                            await loadUserInfo();
                            await loadStakings();
                        }
                    } catch (error) {
                        alert(error.response?.data?.error || 'Staking error');
                    }
                }
            }

            // 프로필 설정 모달 표시
            function showProfileSettings() {
                const modal = document.createElement('div');
                modal.id = 'profileModal';
                modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
                modal.innerHTML = \`
                    <div class="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4">
                        <div class="flex justify-between items-center mb-6">
                            <h2 class="text-2xl font-bold text-gray-800">
                                <i class="fas fa-user-cog text-purple-600 mr-2"></i><span data-i18n="profile.settings">프로필 설정</span>
                            </h2>
                            <button onclick="closeProfileModal()" class="text-gray-500 hover:text-gray-700">
                                <i class="fas fa-times text-2xl"></i>
                            </button>
                        </div>
                        
                        <form id="profileForm" onsubmit="handleProfileUpdate(event)" class="space-y-4">
                            <!-- 이름 -->
                            <div>
                                <label class="block text-gray-700 font-medium mb-2">
                                    <i class="fas fa-user mr-2"></i><span data-i18n="profile.name">이름</span>
                                </label>
                                <input type="text" id="profileName" value="\${currentUser.name}" required
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500">
                            </div>
                            
                            <!-- 이메일 (읽기 전용) -->
                            <div>
                                <label class="block text-gray-700 font-medium mb-2">
                                    <i class="fas fa-envelope mr-2"></i><span data-i18n="profile.email_label">이메일</span>
                                </label>
                                <input type="email" value="\${currentUser.email}" readonly
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed">
                                <p class="text-xs text-gray-500 mt-1" data-i18n="profile.email_readonly">이메일은 변경할 수 없습니다</p>
                            </div>
                            
                            <!-- 휴대폰 번호 -->
                            <div>
                                <label class="block text-gray-700 font-medium mb-2">
                                    <i class="fas fa-phone mr-2"></i><span data-i18n="profile.phone_label">휴대폰 번호</span>
                                </label>
                                <input type="tel" id="profilePhone" value="\${currentUser.phone || ''}" 
                                    pattern="010[0-9]{8}" placeholder="01012345678"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500">
                            </div>
                            
                            <!-- QKEY 지갑주소 (읽기 전용) -->
                            <div>
                                <label class="block text-gray-700 font-medium mb-2">
                                    <i class="fas fa-wallet mr-2"></i><span data-i18n="profile.qkey_wallet">지갑 (QKEY)</span>
                                </label>
                                <div class="relative">
                                    <input type="text" value="\${currentUser.wallet_address}" readonly
                                        class="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed font-mono text-sm">
                                    <button type="button" onclick="alertWalletChange()" 
                                        class="absolute right-2 top-1/2 transform -translate-y-1/2 text-purple-600 hover:text-purple-700">
                                        <i class="fas fa-info-circle text-xl"></i>
                                    </button>
                                </div>
                                <p class="text-xs text-red-500 mt-1">
                                    <i class="fas fa-exclamation-triangle mr-1"></i>
                                    <span data-i18n="profile.wallet_contact_admin">지갑 주소 변경은 관리자에게 문의해주세요</span>
                                </p>
                            </div>
                            
                            <!-- USDT 지갑주소 (읽기 전용) -->
                            <div>
                                <label class="block text-gray-700 font-medium mb-2">
                                    <i class="fas fa-wallet mr-2"></i><span data-i18n="profile.usdt_wallet">지갑 (USDT)</span>
                                </label>
                                <div class="relative">
                                    <input type="text" value="\${currentUser.usdt_wallet_address || ''}" readonly
                                        class="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed font-mono text-sm">
                                    <button type="button" onclick="alertWalletChange()" 
                                        class="absolute right-2 top-1/2 transform -translate-y-1/2 text-purple-600 hover:text-purple-700">
                                        <i class="fas fa-info-circle text-xl"></i>
                                    </button>
                                </div>
                                <p class="text-xs text-gray-500 mt-1">
                                    <i class="fas fa-info-circle mr-1"></i>
                                    <span data-i18n="profile.binance_usdt">바이널스(BINANCE) USDT 지갑</span>
                                </p>
                            </div>
                            
                            <!-- 비밀번호 변경 -->
                            <div class="border-t pt-4">
                                <label class="block text-gray-700 font-medium mb-2">
                                    <i class="fas fa-lock mr-2"></i><span data-i18n="profile.change_password">비밀번호 변경 (선택)</span>
                                </label>
                                <input type="password" id="profilePassword" placeholder="새 비밀번호 (변경 시에만 입력)" data-i18n-placeholder="profile.new_password"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 mb-2">
                                <input type="password" id="profilePasswordConfirm" placeholder="새 비밀번호 확인" data-i18n-placeholder="profile.confirm_password"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500">
                            </div>
                            
                            <!-- 버튼 -->
                            <div class="flex gap-3 pt-4">
                                <button type="button" onclick="closeProfileModal()" 
                                    class="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">
                                    \${I18N.t('common.cancel')}
                                </button>
                                <button type="submit" 
                                    class="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium">
                                    \${I18N.t('common.save')}
                                </button>
                            </div>
                        </form>
                    </div>
                \`;
                document.body.appendChild(modal);
            }
            
            // 프로필 모달 닫기
            function closeProfileModal() {
                const modal = document.getElementById('profileModal');
                if (modal) {
                    modal.remove();
                }
            }
            
            // 지갑주소 변경 경고
            function alertWalletChange() {
                alert(I18N.t('profile.wallet_warning') + '\\n\\n📞 admin@quantarium.com');
            }
            
            // 프로필 업데이트
            async function handleProfileUpdate(e) {
                e.preventDefault();
                
                const name = document.getElementById('profileName').value;
                const phone = document.getElementById('profilePhone').value;
                const password = document.getElementById('profilePassword').value;
                const passwordConfirm = document.getElementById('profilePasswordConfirm').value;
                
                // 비밀번호 확인
                if (password && password !== passwordConfirm) {
                    alert(I18N.t('register.password_mismatch'));
                    return;
                }
                
                try {
                    const updateData = {
                        userId: currentUser.id,
                        name: name,
                        phone: phone
                    };
                    
                    // 비밀번호가 입력된 경우에만 추가
                    if (password) {
                        updateData.password = password;
                    }
                    
                    const response = await axios.post('/api/user/update-profile', updateData);
                    
                    if (response.data.success) {
                        alert(I18N.t('profile.updated'));
                        
                        // 로컬스토리지 업데이트
                        currentUser.name = name;
                        currentUser.phone = phone;
                        localStorage.setItem('user', JSON.stringify(currentUser));
                        
                        // UI 업데이트
                        document.getElementById('userName').textContent = name;
                        
                        closeProfileModal();
                    }
                } catch (error) {
                    alert(error.response?.data?.error || 'Profile update error');
                }
            }

            // 추천인 현황 로드
            // 추천인 데이터 저장 (검색 필터용)
            let allLevel1Referrals = [];
            let allLevel2Referrals = [];

            async function loadReferrals() {
                try {
                    const response = await axios.get('/api/referrals/' + currentUser.id);
                    if (response.data.success) {
                        const { level1, level2, stats } = response.data;
                        allLevel1Referrals = level1;
                        allLevel2Referrals = level2;
                        
                        // 통계 업데이트
                        document.getElementById('level1Count').textContent = stats.level1Count;
                        document.getElementById('level2Count').textContent = stats.level2Count;
                        document.getElementById('totalRewards').textContent = Math.round(stats.totalRewards).toLocaleString() + ' QKEY';
                        
                        // 1단계 / <span data-i18n="dash.level2_referral">Level 2 Referrals</span> 목록 렌더링
                        renderLevel1List(level1);
                        renderLevel2List(level2);
                    }
                } catch (error) {
                    console.error('Failed to load referrals:', error);
                    var l1 = document.getElementById('level1-list');
                    var l2 = document.getElementById('level2-list');
                    if (l1) l1.innerHTML = '<div class="text-center py-8 text-gray-500"><i class="fas fa-users text-4xl mb-3 opacity-50"></i><p>' + I18N.t('dash.no_level1') + '</p></div>';
                    if (l2) l2.innerHTML = '<div class="text-center py-8 text-gray-500"><i class="fas fa-users text-4xl mb-3 opacity-50"></i><p>' + I18N.t('dash.no_level2') + '</p></div>';
                }
            }

            // 추천인 검색 필터
            function filterReferralList() {
                var query = (document.getElementById('referralSearchInput').value || '').toLowerCase().trim();
                var currentTab = document.getElementById('tab-level1').className.indexOf('border-b-2') >= 0 ? 'level1' : 
                                 document.getElementById('tab-level2').className.indexOf('border-b-2') >= 0 ? 'level2' : 'rewards';
                
                if (currentTab === 'level1') {
                    var filtered = query ? allLevel1Referrals.filter(function(u) {
                        return u.name.toLowerCase().indexOf(query) >= 0 || u.email.toLowerCase().indexOf(query) >= 0;
                    }) : allLevel1Referrals;
                    renderLevel1List(filtered);
                } else if (currentTab === 'level2') {
                    var filtered = query ? allLevel2Referrals.filter(function(u) {
                        return u.name.toLowerCase().indexOf(query) >= 0 || u.email.toLowerCase().indexOf(query) >= 0;
                    }) : allLevel2Referrals;
                    renderLevel2List(filtered);
                }
            }

            function renderReferralCard(user, color) {
                var wallet = user.wallet_address || '';
                var walletShort = wallet ? (wallet.substring(0, 8) + '...' + wallet.substring(wallet.length - 6)) : I18N.t('dash.txid_unregistered').split(' ')[0];
                var staking = Number(user.total_staking || 0);
                return '<div class="bg-' + color + '-50 border border-' + color + '-200 rounded-lg p-3 sm:p-4">' +
                    '<div class="flex justify-between items-start mb-2">' +
                        '<div>' +
                            '<p class="font-bold text-gray-800 text-sm sm:text-base">' + user.email + '</p>' +
                            '<p class="text-xs text-gray-500">' + I18N.t('dash.joined') + ': ' + new Date(user.created_at).toLocaleDateString('ko-KR') + '</p>' +
                        '</div>' +
                        '<div class="text-right">' +
                            '<p class="text-xs text-gray-500">' + I18N.t('dash.entry_amount') + '</p>' +
                            '<p class="text-sm sm:text-base font-bold text-' + color + '-600">$' + staking.toLocaleString() + '</p>' +
                        '</div>' +
                    '</div>' +
                    '<div class="flex items-center gap-2 bg-white rounded-lg p-2 border border-gray-200">' +
                        '<i class="fas fa-wallet text-' + color + '-400 text-xs"></i>' +
                        '<span class="text-xs font-mono text-gray-600 flex-1 truncate" title="' + wallet + '">' + walletShort + '</span>' +
                        (wallet ? '<button data-wallet="' + wallet + '" onclick="copyWallet(this.getAttribute(&apos;data-wallet&apos;))" class="px-2 py-1 bg-' + color + '-100 hover:bg-' + color + '-200 text-' + color + '-700 rounded text-xs font-medium transition whitespace-nowrap"><i class="fas fa-copy mr-1"></i><span data-i18n="common.copy">복사</span></button>' : '') +
                    '</div>' +
                '</div>';
            }

            function renderLevel1List(list) {
                var el = document.getElementById('level1-list');
                if (list.length === 0) {
                    var q = document.getElementById('referralSearchInput').value;
                    el.innerHTML = '<div class="text-center py-8 text-gray-500">' +
                        '<i class="fas fa-' + (q ? 'search' : 'users') + ' text-4xl mb-3 opacity-50"></i>' +
                        '<p>' + (q ? I18N.t('dash.no_search_result') : I18N.t('dash.no_level1')) + '</p></div>';
                } else {
                    el.innerHTML = list.map(function(user) { return renderReferralCard(user, 'blue'); }).join('');
                }
            }

            function renderLevel2List(list) {
                var el = document.getElementById('level2-list');
                if (list.length === 0) {
                    var q = document.getElementById('referralSearchInput').value;
                    el.innerHTML = '<div class="text-center py-8 text-gray-500">' +
                        '<i class="fas fa-' + (q ? 'search' : 'users') + ' text-4xl mb-3 opacity-50"></i>' +
                        '<p>' + (q ? I18N.t('dash.no_search_result') : I18N.t('dash.no_level2')) + '</p></div>';
                } else {
                    el.innerHTML = list.map(function(user) { return renderReferralCard(user, 'purple'); }).join('');
                }
            }

            function copyWallet(address) {
                navigator.clipboard.writeText(address).then(function() {
                    alert(I18N.t('alert.copied') + '\\n\\n' + address);
                }).catch(function() {
                    prompt(I18N.t('common.copy') + ':', address);
                });
            }

            // 추천인 링크 복사
            function copyReferralCode() {
                const code = document.getElementById('myReferralCode').textContent;
                if (code && code !== '-') {
                    var referralLink = window.location.origin + '/?ref=' + code;
                    navigator.clipboard.writeText(referralLink).then(() => {
                        alert(I18N.t('alert.referral_link_copied'));
                    }).catch(() => {
                        // fallback for older browsers
                        var tmp = document.createElement('textarea');
                        tmp.value = referralLink;
                        document.body.appendChild(tmp);
                        tmp.select();
                        document.execCommand('copy');
                        document.body.removeChild(tmp);
                        alert(I18N.t('alert.referral_link_copied'));
                    });
                }
            }

            // 추천인 탭 전환
            function showReferralTab(level) {
                const level1Tab = document.getElementById('tab-level1');
                const level2Tab = document.getElementById('tab-level2');
                const rewardsTab = document.getElementById('tab-rewards');
                const level1List = document.getElementById('level1-list');
                const level2List = document.getElementById('level2-list');
                const rewardsList = document.getElementById('rewards-list');
                const searchBox = document.getElementById('referralSearchBox');

                // 검색창: 1단계/2단계에서만 보이고, 보상내역에서는 숨김
                if (level === 'rewards') {
                    searchBox.style.display = 'none';
                } else {
                    searchBox.style.display = 'block';
                }
                // 탭 전환 시 검색어 초기화
                document.getElementById('referralSearchInput').value = '';

                if (level === 'level1') {
                    level1Tab.className = 'px-3 sm:px-6 py-2 sm:py-3 font-medium text-blue-600 border-b-2 border-blue-600 whitespace-nowrap text-sm sm:text-base';
                    level2Tab.className = 'px-3 sm:px-6 py-2 sm:py-3 font-medium text-gray-500 hover:text-gray-700 whitespace-nowrap text-sm sm:text-base';
                    rewardsTab.className = 'px-3 sm:px-6 py-2 sm:py-3 font-medium text-gray-500 hover:text-gray-700 whitespace-nowrap text-sm sm:text-base';
                    level1List.classList.remove('hidden');
                    level2List.classList.add('hidden');
                    rewardsList.classList.add('hidden');
                } else if (level === 'level2') {
                    level1Tab.className = 'px-3 sm:px-6 py-2 sm:py-3 font-medium text-gray-500 hover:text-gray-700 whitespace-nowrap text-sm sm:text-base';
                    level2Tab.className = 'px-3 sm:px-6 py-2 sm:py-3 font-medium text-purple-600 border-b-2 border-purple-600 whitespace-nowrap text-sm sm:text-base';
                    rewardsTab.className = 'px-3 sm:px-6 py-2 sm:py-3 font-medium text-gray-500 hover:text-gray-700 whitespace-nowrap text-sm sm:text-base';
                    level1List.classList.add('hidden');
                    level2List.classList.remove('hidden');
                    rewardsList.classList.add('hidden');
                } else if (level === 'rewards') {
                    level1Tab.className = 'px-3 sm:px-6 py-2 sm:py-3 font-medium text-gray-500 hover:text-gray-700 whitespace-nowrap text-sm sm:text-base';
                    level2Tab.className = 'px-3 sm:px-6 py-2 sm:py-3 font-medium text-gray-500 hover:text-gray-700 whitespace-nowrap text-sm sm:text-base';
                    rewardsTab.className = 'px-3 sm:px-6 py-2 sm:py-3 font-medium text-green-600 border-b-2 border-green-600 whitespace-nowrap text-sm sm:text-base';
                    level1List.classList.add('hidden');
                    level2List.classList.add('hidden');
                    rewardsList.classList.remove('hidden');
                    // 보상 내역 로드
                    loadReferralRewards();
                }
            }

            // 전체 보상 내역 로드 (배당금 + 직접판매 + 성과금)
            async function loadReferralRewards() {
                try {
                    const response = await axios.get('/api/referral-rewards/' + currentUser.id);
                    if (response.data.success) {
                        const { rewards, stats } = response.data;
                        
                        // 통계 업데이트
                        document.getElementById('reward-daily-total').textContent = Math.round(stats.dailyTotal).toLocaleString() + ' QKEY';
                        document.getElementById('reward-daily-count').textContent = stats.dailyCount;
                        document.getElementById('reward-direct-total').textContent = Math.round(stats.directTotal).toLocaleString() + ' QKEY';
                        document.getElementById('reward-direct-count').textContent = stats.directCount;
                        document.getElementById('reward-level1-total').textContent = Math.round(stats.level1Total).toLocaleString() + ' QKEY';
                        document.getElementById('reward-level1-count').textContent = stats.level1Count;
                        document.getElementById('reward-level2-total').textContent = Math.round(stats.level2Total).toLocaleString() + ' QKEY';
                        document.getElementById('reward-level2-count').textContent = stats.level2Count;
                        document.getElementById('reward-grand-total').textContent = Math.round(stats.grandTotal).toLocaleString() + ' QKEY';

                        // 총 추천 보상 (상단 카드) 업데이트
                        var totalRewardsEl = document.getElementById('totalRewards');
                        if (totalRewardsEl) totalRewardsEl.textContent = Math.round(stats.grandTotal).toLocaleString() + ' QKEY';
                        
                        // 테이블 렌더링
                        var tableBody = document.getElementById('rewards-table-body');
                        if (rewards.length === 0) {
                            tableBody.innerHTML = '<tr><td colspan="4" class="px-4 py-8 text-center text-gray-500">' +
                                '<i class="fas fa-inbox text-4xl mb-3 opacity-50 block"></i>' +
                                '<p>' + I18N.t('dash.no_rewards') + '</p>' +
                                '</td></tr>';
                        } else {
                            tableBody.innerHTML = rewards.map(function(reward) {
                                var badgeClass = '';
                                var badgeText = reward.reward_category || reward.type;
                                var amountColor = '';
                                var amountPrefix = '+';
                                var amt = Number(reward.amount) || 0;
                                
                                if (reward.type === 'daily_qkey') {
                                    badgeClass = 'bg-green-100 text-green-700';
                                    badgeText = I18N.t('dash.reward_dividend');
                                    amountColor = 'text-green-600';
                                } else if (reward.type === 'direct_referral') {
                                    badgeClass = 'bg-orange-100 text-orange-700';
                                    badgeText = I18N.t('dash.reward_direct');
                                    amountColor = 'text-orange-600';
                                } else if (reward.type === 'referral_reward') {
                                    if (reward.description && reward.description.indexOf('Level 1') >= 0) {
                                        badgeClass = 'bg-blue-100 text-blue-700';
                                        badgeText = I18N.t('dash.reward_level1');
                                        amountColor = 'text-blue-600';
                                    } else {
                                        badgeClass = 'bg-purple-100 text-purple-700';
                                        badgeText = I18N.t('dash.reward_level2');
                                        amountColor = 'text-purple-600';
                                    }
                                } else if (reward.type === 'daily_reward_rollback') {
                                    badgeClass = 'bg-red-100 text-red-700';
                                    badgeText = '배당금 회수';
                                    amountColor = 'text-red-600';
                                    amountPrefix = '';
                                } else if (reward.type === 'referral_reward_rollback') {
                                    badgeClass = 'bg-red-100 text-red-700';
                                    badgeText = '성과금 회수';
                                    amountColor = 'text-red-600';
                                    amountPrefix = '';
                                } else if (reward.type === 'rollback_restore') {
                                    badgeClass = 'bg-teal-100 text-teal-700';
                                    badgeText = '회수 복구';
                                    amountColor = 'text-teal-600';
                                    amountPrefix = '+';
                                } else if (reward.type === 'admin_adjustment') {
                                    // ★ 어드민 잔액 보정 내역 (description 에 사유+변동량 포함)
                                    if (amt >= 0) {
                                        badgeClass = 'bg-emerald-100 text-emerald-700 border border-emerald-300';
                                        badgeText = '▲ 어드민 증액';
                                        amountColor = 'text-emerald-700 font-extrabold';
                                        amountPrefix = '+';
                                    } else {
                                        badgeClass = 'bg-rose-100 text-rose-700 border border-rose-300';
                                        badgeText = '▼ 어드민 차감';
                                        amountColor = 'text-rose-700 font-extrabold';
                                        amountPrefix = '';
                                    }
                                }
                                
                                var displayAmt = amt < 0 ? Math.round(amt).toLocaleString() : (amountPrefix + Math.round(amt).toLocaleString());

                                // ★ 어드민 보정(admin_adjustment) 행은 description 을 풀 노출 + 사유/변동량/이전·이후 잔액 강조
                                var detailsHtml = '';
                                if (reward.type === 'admin_adjustment') {
                                    var rawDesc = String(reward.description || '');
                                    // description 포맷: "[어드민 수정] ▲증액 +500 QKEY (이전 2,000 → 이후 2,500) | 사유: <reason>"
                                    var deltaMatch = rawDesc.match(/(▲증액|▼차감)\s*([+\-]?[\d,\.]+)\s*QKEY/);
                                    var prevAfterMatch = rawDesc.match(/이전\s*([\d,\.\-]+)\s*[→→]\s*이후\s*([\d,\.\-]+)/);
                                    var reasonMatch = rawDesc.match(/사유\s*[:：]\s*(.+?)\s*$/);
                                    var deltaTxt = deltaMatch ? (deltaMatch[1] + ' ' + deltaMatch[2] + ' QKEY') : '';
                                    var prevTxt = prevAfterMatch ? prevAfterMatch[1] : '';
                                    var afterTxt = prevAfterMatch ? prevAfterMatch[2] : '';
                                    var reasonTxt = reasonMatch ? reasonMatch[1] : '';
                                    var deltaColor = amt >= 0 ? 'text-emerald-700' : 'text-rose-700';
                                    detailsHtml =
                                        '<div class="space-y-1">' +
                                            (deltaTxt ? '<div class="text-xs font-extrabold ' + deltaColor + '">변동: ' + deltaTxt + '</div>' : '') +
                                            (prevTxt && afterTxt ? '<div class="text-[11px] text-gray-700">이전 <span class="font-semibold">' + prevTxt + '</span> → 이후 <span class="font-semibold">' + afterTxt + '</span></div>' : '') +
                                            (reasonTxt ? '<div class="text-[11px] text-gray-800 bg-yellow-50 border border-yellow-200 rounded px-1.5 py-0.5 break-words"><span class="font-semibold">사유:</span> ' + reasonTxt + '</div>' : '') +
                                            (!deltaTxt && !reasonTxt ? '<div class="text-xs text-gray-700 break-words">' + rawDesc + '</div>' : '') +
                                        '</div>';
                                } else {
                                    detailsHtml = '<div class="text-xs text-gray-700 break-words" title="' + (reward.description || '') + '">' + (reward.description || '-') + '</div>';
                                }

                                // 어드민 보정은 내용 칸 잘림 금지(전체 노출). 그 외는 모바일 가독성 유지.
                                var detailsTdClass = (reward.type === 'admin_adjustment')
                                    ? 'px-2 sm:px-4 py-2 text-xs text-gray-700 align-top min-w-[180px] max-w-[260px] whitespace-normal break-words'
                                    : 'px-2 sm:px-4 py-2 text-xs text-gray-700 align-top max-w-[180px] whitespace-normal break-words';

                                // ★ KST 강제 표시 (사장님 룰 2026-05-07): DB created_at 은 UTC 저장 → KST(Asia/Seoul) 로 변환해서 24h 표기
                                // SQLite CURRENT_TIMESTAMP 는 'YYYY-MM-DD HH:MM:SS' (UTC, 타임존 없음) → 'Z' 붙여 명시 파싱
                                var rawTs = String(reward.created_at || '');
                                var utcTs = rawTs.indexOf('Z') >= 0 || rawTs.indexOf('+') >= 0 ? rawTs : rawTs.replace(' ', 'T') + 'Z';
                                var dObj = new Date(utcTs);
                                var kstDateTxt = dObj.toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul', month: '2-digit', day: '2-digit' });
                                var kstTimeTxt = dObj.toLocaleTimeString('ko-KR', { timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', hour12: false });
                                return '<tr class="hover:bg-gray-50">' +
                                    '<td class="px-2 sm:px-4 py-2 text-xs text-gray-600 whitespace-nowrap align-top">' +
                                        kstDateTxt + ' ' + kstTimeTxt +
                                    '</td>' +
                                    '<td class="px-2 sm:px-4 py-2 align-top"><span class="inline-block px-2 py-0.5 ' + badgeClass + ' rounded text-xs font-medium whitespace-nowrap">' + badgeText + '</span></td>' +
                                    '<td class="' + detailsTdClass + '">' + detailsHtml + '</td>' +
                                    '<td class="px-2 sm:px-4 py-2 text-right text-xs font-bold ' + amountColor + ' whitespace-nowrap align-top">' +
                                        displayAmt + ' QKEY' +
                                    '</td>' +
                                '</tr>';
                            }).join('');
                        }
                    }
                } catch (error) {
                    console.error('Failed to load rewards:', error);
                    document.getElementById('rewards-table-body').innerHTML = 
                        '<tr><td colspan="4" class="px-4 py-8 text-center text-red-500">' + I18N.t('dash.no_rewards') + '</td></tr>';
                }
            }



            // 로그아웃
            function handleLogout() {
                localStorage.removeItem('user');
                window.location.href = '/';
            }

            // Initialize i18n
            I18N.init();
            createLangSelector('langSelector');

            // Language change callback
            function onLanguageChange(lang) {
                // Re-render dynamic content
                if (currentUser) {
                    loadStakings();
                    loadReferrals();
                }
            }

            // 페이지 로드 시 실행
            loadDashboard();
        </script>
    </body>
    </html>
  `)
})

// 관리자 로그인 페이지
app.get('/admin', (c) => {
  const userCountry = c.req.header('CF-IPCountry') || '';
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="user-country" content="${userCountry}">
        <title>관리자 로그인 - QUANTARIUM STAKING</title>
        <link rel="icon" type="image/png" href="/static/quantarium-logo.png">
        <link rel="stylesheet" href="/static/tailwind.css">
        <link href="/static/fa/all.min.css" rel="stylesheet">
        <style>
            body {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            html, body { overflow-x: hidden; max-width: 100vw; }
            * { box-sizing: border-box; }
            button, a, input, select { min-height: 36px; }
        </style>
    </head>
    <body class="min-h-screen flex items-center justify-center p-2 sm:p-4">
        <div class="bg-white rounded-2xl shadow-2xl p-4 sm:p-8 w-full max-w-md">
            <div class="flex justify-end mb-2">
                <div id="langSelector"></div>
            </div>
            <div class="text-center mb-8">
                <img src="/static/quantarium-logo.png" alt="QUANTARIUM Logo" class="w-24 h-24 mx-auto mb-4" onerror="this.style.display='none'">
                <h1 class="text-3xl font-bold text-gray-800 mb-2" data-i18n="admin.title">관리자 로그인</h1>
                <p class="text-gray-600" data-i18n="admin.subtitle">QUANTARIUM STAKING 관리자 페이지</p>
            </div>

            <form id="adminLoginForm" onsubmit="handleAdminLogin(event)" class="space-y-4">
                <div>
                    <label class="block text-gray-700 font-medium mb-2" data-i18n="admin.id">관리자 ID</label>
                    <input type="text" id="adminId" required 
                        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                        data-i18n-placeholder="admin.id_placeholder"
                        placeholder="관리자 ID를 입력하세요">
                </div>

                <div>
                    <label class="block text-gray-700 font-medium mb-2" data-i18n="admin.password">비밀번호</label>
                    <input type="password" id="adminPassword" required 
                        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                        data-i18n-placeholder="admin.password_placeholder"
                        placeholder="비밀번호를 입력하세요">
                </div>

                <button type="submit" 
                    class="w-full bg-purple-600 text-white py-3 rounded-lg font-bold hover:bg-purple-700 transition duration-200">
                    <i class="fas fa-sign-in-alt mr-2"></i><span data-i18n="admin.login">로그인</span>
                </button>
            </form>

            <div class="mt-6 text-center">
                <a href="/" class="text-purple-600 hover:text-purple-700">
                    <i class="fas fa-arrow-left mr-1"></i><span data-i18n="admin.back_to_user">사용자 페이지로 돌아가기</span>
                </a>
            </div>
        </div>

        <script src="/static/axios.min.js"></script>
        <script src="/static/i18n.js?v=20260427c"></script>
        <script>
            I18N.init();
            createLangSelector('langSelector');
        </script>
        <script>
            async function handleAdminLogin(e) {
                e.preventDefault();
                
                const adminId = document.getElementById('adminId').value;
                const password = document.getElementById('adminPassword').value;

                try {
                    const response = await axios.post('/api/auth/admin-login', { adminId, password });
                    if (response.data.success) {
                        localStorage.setItem('admin', JSON.stringify({ id: 'admin', role: 'admin', token: response.data.token }));
                        window.location.href = '/admin/dashboard';
                    }
                } catch (error) {
                    alert(error.response?.data?.error || I18N.t('admin.login_fail'));
                }
            }
        </script>
    </body>
    </html>
  `)
})

// 관리자 대시보드
app.get('/admin/dashboard', (c) => {
  const userCountry = c.req.header('CF-IPCountry') || '';
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="user-country" content="${userCountry}">
        <title data-i18n="admin.dashboard">관리자 대시보드 - QUANTARIUM STAKING</title>
        <link rel="icon" type="image/png" href="/static/quantarium-logo.png">
        <link rel="stylesheet" href="/static/tailwind.css">
        <link href="/static/fa/all.min.css" rel="stylesheet">
        <style>
            body { background-color: #f3f4f6; }
            html, body { overflow-x: hidden; max-width: 100vw; }
            * { box-sizing: border-box; }
            button, a, input, select { min-height: 36px; }
            .font-mono { word-break: break-all; }
        </style>
    </head>
    <body>
        <div class="min-h-screen">
            <!-- Header -->
            <header class="bg-white shadow-sm">
                <div class="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
                    <div class="flex justify-between items-center">
                        <div class="flex items-center gap-2 sm:gap-3 min-w-0">
                            <img src="/static/quantarium-logo.png" alt="QUANTARIUM Logo" class="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0" onerror="this.style.display='none'">
                            <div class="min-w-0">
                                <h1 class="text-lg sm:text-2xl font-bold text-purple-600 truncate">QUANTARIUM</h1>
                                <p class="text-xs sm:text-sm text-gray-600" data-i18n="admin.dashboard">관리자 대시보드</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-2 sm:gap-3">
                            <div id="langSelector"></div>
                            <a href="/dashboard" onclick="localStorage.setItem('openShop','1')" class="text-pink-600 hover:text-pink-700 flex-shrink-0 text-sm sm:text-base font-bold">
                                <i class="fas fa-shopping-cart mr-1"></i><span class="hidden sm:inline">쇼핑몰</span>
                            </a>
                            <button onclick="handleLogout()" class="text-red-600 hover:text-red-700 flex-shrink-0 text-sm sm:text-base">
                                <i class="fas fa-sign-out-alt mr-1"></i><span class="hidden sm:inline" data-i18n="admin.logout">로그아웃</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <!-- Main Content -->
            <main class="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
                <!-- 통계 카드 -->
                <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4 mb-6 sm:mb-8">
                    <div class="bg-white rounded-lg shadow-md p-3 sm:p-6">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-gray-600 text-xs sm:text-sm" data-i18n="admin.pending">승인 대기</p>
                                <p id="pendingCount" class="text-2xl sm:text-3xl font-bold text-yellow-600">0</p>
                            </div>
                            <i class="fas fa-clock text-2xl sm:text-4xl text-yellow-600 opacity-20"></i>
                        </div>
                    </div>

                    <div class="bg-white rounded-lg shadow-md p-3 sm:p-6">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-gray-600 text-xs sm:text-sm" data-i18n="admin.active_staking">진행 중</p>
                                <p id="activeCount" class="text-2xl sm:text-3xl font-bold text-green-600">0</p>
                            </div>
                            <i class="fas fa-check-circle text-2xl sm:text-4xl text-green-600 opacity-20"></i>
                        </div>
                    </div>

                    <div class="bg-white rounded-lg shadow-md p-3 sm:p-6">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-gray-600 text-xs sm:text-sm" data-i18n="admin.rejected">거절됨</p>
                                <p id="rejectedCount" class="text-2xl sm:text-3xl font-bold text-red-600">0</p>
                            </div>
                            <i class="fas fa-times-circle text-2xl sm:text-4xl text-red-600 opacity-20"></i>
                        </div>
                    </div>

                    <div class="bg-white rounded-lg shadow-md p-3 sm:p-6">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-gray-600 text-xs sm:text-sm" data-i18n="admin.total_users">총 사용자</p>
                                <p id="totalUsers" class="text-2xl sm:text-3xl font-bold text-purple-600">0</p>
                            </div>
                            <i class="fas fa-users text-2xl sm:text-4xl text-purple-600 opacity-20"></i>
                        </div>
                    </div>

                    <div class="col-span-2 sm:col-span-1 bg-white rounded-lg shadow-md p-3 sm:p-6">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-gray-600 text-xs sm:text-sm" data-i18n="admin.new_signups">신규 가입</p>
                                <p id="newUsersToday" class="text-2xl sm:text-3xl font-bold text-blue-600">0</p>
                                <p class="text-xs text-gray-500 mt-1" data-i18n="admin.today">오늘</p>
                            </div>
                            <i class="fas fa-user-plus text-2xl sm:text-4xl text-blue-600 opacity-20"></i>
                        </div>
                    </div>
                </div>

                <!-- 일일 배당 자동화 안내 (강제 일괄 지급 버튼 비활성화 — 사장님 2026-05-07 지시) -->
                <div class="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
                    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div>
                            <h3 class="text-lg font-bold text-gray-800"><i class="fas fa-clock text-blue-600 mr-2"></i>일일 배당 자동화 (KST 07:00)</h3>
                            <p class="text-sm text-gray-600 mt-1">매 평일 한국시간 오전 7시에 GitHub Actions cron 으로 자동 지급됩니다 (월~금)</p>
                            <p class="text-xs text-gray-500 mt-1">개별 회원 보정은 아래 회원관리 → '잔액 조정' 또는 '/api/admin/rewards/manual-adjust' 사용</p>
                        </div>
                        <button disabled
                            class="px-6 py-3 bg-gray-300 text-gray-500 rounded-lg font-bold cursor-not-allowed text-sm sm:text-base whitespace-nowrap"
                            title="강제 일괄 배당은 비활성화됨 (cron 자동 실행 전용)">
                            <i class="fas fa-lock mr-2"></i>자동 실행 전용
                        </button>
                    </div>
                </div>

                <!-- 탭 메뉴 -->
                <div class="bg-white rounded-lg shadow-md mb-4 sm:mb-6">
                    <div class="flex border-b overflow-x-auto -webkit-overflow-scrolling-touch">
                        <button onclick="showTab('pending')" id="tab-pending" 
                            class="px-3 sm:px-6 py-3 sm:py-4 font-medium text-purple-600 border-b-2 border-purple-600 whitespace-nowrap text-xs sm:text-base">
                            <i class="fas fa-clock mr-1 sm:mr-2"></i><span data-i18n="admin.tab_pending">승인대기</span>
                        </button>
                        <button onclick="showTab('all')" id="tab-all" 
                            class="px-3 sm:px-6 py-3 sm:py-4 font-medium text-gray-600 hover:text-purple-600 whitespace-nowrap text-xs sm:text-base">
                            <i class="fas fa-list mr-1 sm:mr-2"></i><span data-i18n="admin.tab_all">전체목록</span>
                        </button>
                        <button onclick="showTab('rewards')" id="tab-rewards" 
                            class="px-3 sm:px-6 py-3 sm:py-4 font-medium text-gray-600 hover:text-purple-600 whitespace-nowrap text-xs sm:text-base">
                            <i class="fas fa-coins mr-1 sm:mr-2"></i><span data-i18n="admin.tab_rewards">배당현황</span>
                        </button>
                        <button onclick="showTab('withdrawals')" id="tab-withdrawals" 
                            class="px-3 sm:px-6 py-3 sm:py-4 font-medium text-gray-600 hover:text-purple-600 whitespace-nowrap text-xs sm:text-base">
                            <i class="fas fa-money-bill-wave mr-1 sm:mr-2"></i><span data-i18n="admin.tab_withdrawals">출금관리</span>
                        </button>
                        <button onclick="showTab('users')" id="tab-users" 
                            class="px-3 sm:px-6 py-3 sm:py-4 font-medium text-gray-600 hover:text-purple-600 whitespace-nowrap text-xs sm:text-base">
                            <i class="fas fa-users mr-1 sm:mr-2"></i><span data-i18n="admin.tab_users">회원관리</span>
                        </button>
                        <button onclick="showTab('signups')" id="tab-signups" 
                            class="px-3 sm:px-6 py-3 sm:py-4 font-medium text-gray-600 hover:text-purple-600 whitespace-nowrap text-xs sm:text-base">
                            <i class="fas fa-user-plus mr-1 sm:mr-2"></i><span data-i18n="admin.tab_signups">가입현황</span>
                        </button>
                        <button onclick="showTab('sales')" id="tab-sales" 
                            class="px-3 sm:px-6 py-3 sm:py-4 font-medium text-gray-600 hover:text-purple-600 whitespace-nowrap text-xs sm:text-base">
                            <i class="fas fa-chart-bar mr-1 sm:mr-2"></i><span data-i18n="admin.tab_sales">매출현황</span>
                        </button>
                        <button onclick="showTab('swaps')" id="tab-swaps" 
                            class="px-3 sm:px-6 py-3 sm:py-4 font-medium text-gray-600 hover:text-purple-600 whitespace-nowrap text-xs sm:text-base">
                            <i class="fas fa-exchange-alt mr-1 sm:mr-2"></i><span data-i18n="admin.tab_swaps">스왑관리</span>
                        </button>
                        <button onclick="showTab('memberRewards')" id="tab-memberRewards" 
                            class="px-3 sm:px-6 py-3 sm:py-4 font-medium text-gray-600 hover:text-purple-600 whitespace-nowrap text-xs sm:text-base">
                            <i class="fas fa-gift mr-1 sm:mr-2"></i><span data-i18n="admin.tab_member_rewards">수당체크</span>
                        </button>
                        <button onclick="showTab('shop')" id="tab-shop" 
                            class="px-3 sm:px-6 py-3 sm:py-4 font-medium text-gray-600 hover:text-purple-600 whitespace-nowrap text-xs sm:text-base">
                            <i class="fas fa-shopping-cart mr-1 sm:mr-2"></i>쇼핑몰
                        </button>
                        <button onclick="showTab('notices')" id="tab-notices" 
                            class="px-3 sm:px-6 py-3 sm:py-4 font-medium text-gray-600 hover:text-purple-600 whitespace-nowrap text-xs sm:text-base">
                            <i class="fas fa-bullhorn mr-1 sm:mr-2"></i>공지사항
                        </button>
                    </div>
                </div>

                <!-- 승인 대기 목록 -->
                <div id="content-pending" class="bg-white rounded-lg shadow-md p-6">
                    <h2 class="text-xl font-bold text-gray-800 mb-4">
                        <i class="fas fa-clock text-yellow-600 mr-2"></i><span data-i18n="admin.pending_title">승인 대기 중인 스테이킹</span>
                    </h2>
                    <div id="pendingList" class="space-y-4">
                        <p class="text-center text-gray-500 py-8" data-i18n="admin.loading">로딩 중...</p>
                    </div>
                </div>

                <!-- 전체 목록 (숨김) -->
                <div id="content-all" class="bg-white rounded-lg shadow-md p-6 hidden">
                    <h2 class="text-xl font-bold text-gray-800 mb-4">
                        <i class="fas fa-list text-purple-600 mr-2"></i><span data-i18n="admin.all_title">전체 스테이킹 목록</span>
                    </h2>
                    <div id="allList" class="space-y-4">
                        <p class="text-center text-gray-500 py-8" data-i18n="admin.loading">로딩 중...</p>
                    </div>
                </div>

                <!-- 사용자 관리 (숨김) -->
                <div id="content-users" class="bg-white rounded-lg shadow-md p-6 hidden">
                    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
                        <h2 class="text-xl font-bold text-gray-800">
                            <i class="fas fa-users text-purple-600 mr-2"></i><span data-i18n="admin.user_list">사용자 목록</span>
                        </h2>
                        <div class="flex flex-wrap gap-2">
                            <button onclick="openDownlineModal()" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition">
                                <i class="fas fa-sitemap mr-1"></i><span data-i18n="admin.downline_sales_btn">산하매출 조회</span>
                            </button>
                            <button onclick="exportCSV('users')" class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-bold transition">
                                <i class="fas fa-file-excel mr-1"></i><span data-i18n="admin.export_csv">엑셀 다운로드</span>
                            </button>
                            <button onclick="exportCSV('wallets')" class="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-bold transition" title="회원 명단과 QKEY/USDT 지갑주소만 CSV로 다운로드">
                                <i class="fas fa-wallet mr-1"></i>회원명단+지갑주소
                            </button>
                        </div>
                    </div>
                    <!-- 회원 검색 -->
                    <div class="mb-3 sm:mb-4 flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                        <div class="relative flex-1">
                            <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                            <input type="text" id="usersSearchInput" 
                                placeholder="이름 / 아이디 / 전화번호 / 지갑주소 / 추천인코드로 검색"
                                oninput="filterUsersList(this.value)"
                                class="w-full pl-10 pr-10 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 text-sm sm:text-base">
                            <button type="button" onclick="clearUsersSearch()" 
                                class="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-gray-400 hover:text-gray-700 text-sm" title="검색어 지우기">
                                <i class="fas fa-times-circle"></i>
                            </button>
                        </div>
                        <div id="usersSearchCount" class="text-xs sm:text-sm text-gray-600 whitespace-nowrap px-2"></div>
                    </div>
                    <div id="usersList" class="space-y-4">
                        <p class="text-center text-gray-500 py-8" data-i18n="admin.loading">로딩 중...</p>
                    </div>
                </div>

                <!-- 배당 현황 (숨김) -->
                <div id="content-rewards" class="bg-white rounded-lg shadow-md p-4 sm:p-6 hidden">
                    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
                        <h2 class="text-xl font-bold text-gray-800">
                            <i class="fas fa-coins text-yellow-600 mr-2"></i><span data-i18n="admin.rewards_title">배당 현황</span>
                        </h2>
                        <div class="flex gap-2 flex-wrap">
                            <button onclick="exportDailyRewardsCSV()" class="px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-xs sm:text-sm font-bold transition shadow"><i class="fas fa-file-excel mr-1"></i>일일배당 엑셀</button>
                            <button onclick="exportReferralRewardsCSV()" class="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs sm:text-sm font-bold transition shadow"><i class="fas fa-file-excel mr-1"></i>직판/성과금 엑셀</button>
                            <button onclick="exportCSV('rewards')" class="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs sm:text-sm font-bold transition shadow"><i class="fas fa-file-excel mr-1"></i>회원별 합계 엑셀</button>
                            <button onclick="rollbackDailyRewards()" class="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs sm:text-sm font-bold transition shadow border-2 border-red-700"><i class="fas fa-undo mr-1"></i>휴일 배당 회수</button>
                        </div>
                    </div>
                    <!-- 배당 통계 -->
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
                        <div class="bg-yellow-50 rounded-lg p-3 sm:p-4 border border-yellow-200">
                            <p class="text-xs text-gray-600 mb-1" data-i18n="admin.total_qkey_paid">총 지급 QKEY</p>
                            <p id="rewardsTotalQkey" class="text-lg sm:text-xl font-bold text-yellow-700">0</p>
                        </div>
                        <div class="bg-green-50 rounded-lg p-3 sm:p-4 border border-green-200">
                            <p class="text-xs text-gray-600 mb-1" data-i18n="admin.today_paid">오늘 지급</p>
                            <p id="rewardsTodayQkey" class="text-lg sm:text-xl font-bold text-green-700">0</p>
                        </div>
                        <div class="bg-blue-50 rounded-lg p-3 sm:p-4 border border-blue-200">
                            <p class="text-xs text-gray-600 mb-1" data-i18n="admin.total_paid_count">총 지급 건수</p>
                            <p id="rewardsTotalCount" class="text-lg sm:text-xl font-bold text-blue-700">0</p>
                        </div>
                        <div class="bg-purple-50 rounded-lg p-3 sm:p-4 border border-purple-200">
                            <p class="text-xs text-gray-600 mb-1" data-i18n="admin.referral_total">추천 보상 합계</p>
                            <p id="rewardsReferralTotal" class="text-lg sm:text-xl font-bold text-purple-700">0</p>
                        </div>
                    </div>
                    <!-- 추천 보상 상세 -->
                    <div class="grid grid-cols-3 gap-2 mb-4">
                        <div class="bg-orange-50 rounded-lg p-2 sm:p-3 border border-orange-200 text-center">
                            <p class="text-xs text-gray-600" data-i18n="admin.direct_sale">직접판매</p>
                            <p id="rewardsDirectTotal" class="text-sm sm:text-base font-bold text-orange-600">0</p>
                        </div>
                        <div class="bg-blue-50 rounded-lg p-2 sm:p-3 border border-blue-200 text-center">
                            <p class="text-xs text-gray-600" data-i18n="admin.level1_matching">1대 매칭</p>
                            <p id="rewardsLevel1Total" class="text-sm sm:text-base font-bold text-blue-600">0</p>
                        </div>
                        <div class="bg-purple-50 rounded-lg p-2 sm:p-3 border border-purple-200 text-center">
                            <p class="text-xs text-gray-600" data-i18n="admin.level2_matching">2대 매칭</p>
                            <p id="rewardsLevel2Total" class="text-sm sm:text-base font-bold text-purple-600">0</p>
                        </div>
                    </div>
                    <!-- 최근 일일배당 내역 -->
                    <h3 class="text-base font-bold text-gray-700 mb-2"><i class="fas fa-coins text-yellow-600 mr-1"></i><span data-i18n="admin.recent_rewards">최근 배당 내역</span> <span class="text-xs text-gray-500 font-normal">(일일배당 최근 100건)</span></h3>
                    <div class="overflow-x-auto mb-6">
                        <table class="w-full text-xs sm:text-sm">
                            <thead class="bg-gray-100">
                                <tr>
                                    <th class="px-2 sm:px-3 py-2 text-left" data-i18n="admin.col_date">날짜</th>
                                    <th class="px-2 sm:px-3 py-2 text-left" data-i18n="admin.col_member">회원</th>
                                    <th class="px-2 sm:px-3 py-2 text-right" data-i18n="admin.col_investment">투자금액</th>
                                    <th class="px-2 sm:px-3 py-2 text-right" data-i18n="admin.col_rate">배당률</th>
                                    <th class="px-2 sm:px-3 py-2 text-right" data-i18n="admin.col_paid_qkey">지급 QKEY</th>
                                </tr>
                            </thead>
                            <tbody id="rewardsTableBody" class="divide-y divide-gray-200">
                                <tr><td colspan="5" class="text-center py-8 text-gray-500" data-i18n="admin.loading">로딩 중...</td></tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- 최근 직접판매/성과금 내역 -->
                    <div class="flex items-center justify-between mb-2 flex-wrap gap-2">
                        <h3 class="text-base font-bold text-gray-700"><i class="fas fa-users text-purple-600 mr-1"></i>직접판매 / 성과금(매칭) 내역 <span class="text-xs text-gray-500 font-normal">(최근 100건)</span></h3>
                        <select id="referralFilterLevel" onchange="renderReferralTable()" class="text-xs border rounded px-2 py-1">
                            <option value="">전체</option>
                            <option value="0">직접판매(레벨0)</option>
                            <option value="1">1대 성과금</option>
                            <option value="2">2대 성과금</option>
                        </select>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="w-full text-xs sm:text-sm">
                            <thead class="bg-gray-100">
                                <tr>
                                    <th class="px-2 sm:px-3 py-2 text-left">날짜</th>
                                    <th class="px-2 sm:px-3 py-2 text-center">구분</th>
                                    <th class="px-2 sm:px-3 py-2 text-left">수령자(추천인)</th>
                                    <th class="px-2 sm:px-3 py-2 text-left">피추천인</th>
                                    <th class="px-2 sm:px-3 py-2 text-right">원금(USD)</th>
                                    <th class="px-2 sm:px-3 py-2 text-right">지급 QKEY</th>
                                </tr>
                            </thead>
                            <tbody id="referralRewardsTableBody" class="divide-y divide-gray-200">
                                <tr><td colspan="6" class="text-center py-8 text-gray-500" data-i18n="admin.loading">로딩 중...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- 출금 관리 (숨김) -->
                <div id="content-withdrawals" class="bg-white rounded-lg shadow-md p-4 sm:p-6 hidden">
                    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
                        <h2 class="text-xl font-bold text-gray-800">
                            <i class="fas fa-money-bill-wave text-green-600 mr-2"></i><span data-i18n="admin.withdrawals_title">출금 관리</span>
                        </h2>
                        <button onclick="exportCSV('withdrawals')" class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-bold transition">
                            <i class="fas fa-file-excel mr-1"></i><span data-i18n="admin.export_csv">엑셀 다운로드</span>
                        </button>
                    </div>
                    <!-- 출금 통계 -->
                    <div class="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-4 mb-4 sm:mb-6">
                        <div class="bg-yellow-50 rounded-lg p-3 sm:p-4 border border-yellow-200">
                            <p class="text-xs text-gray-600 mb-1" data-i18n="admin.wd_pending">대기중</p>
                            <p id="wdPendingCount" class="text-lg sm:text-xl font-bold text-yellow-700">0</p>
                        </div>
                        <div class="bg-green-50 rounded-lg p-3 sm:p-4 border border-green-200">
                            <p class="text-xs text-gray-600 mb-1" data-i18n="admin.wd_approved">승인됨</p>
                            <p id="wdApprovedCount" class="text-lg sm:text-xl font-bold text-green-700">0</p>
                        </div>
                        <div class="bg-red-50 rounded-lg p-3 sm:p-4 border border-red-200">
                            <p class="text-xs text-gray-600 mb-1" data-i18n="admin.wd_rejected">거절됨</p>
                            <p id="wdRejectedCount" class="text-lg sm:text-xl font-bold text-red-700">0</p>
                        </div>
                        <div class="bg-gray-100 rounded-lg p-3 sm:p-4 border border-gray-300">
                            <p class="text-xs text-gray-600 mb-1">취소(환불완료)</p>
                            <p id="wdCancelledCount" class="text-lg sm:text-xl font-bold text-gray-700">0</p>
                        </div>
                        <div class="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
                            <p class="text-xs text-gray-600 mb-1" data-i18n="admin.wd_total">전체</p>
                            <p id="wdTotalCount" class="text-lg sm:text-xl font-bold text-gray-700">0</p>
                        </div>
                    </div>
                    <!-- 출금 목록 -->
                    <div id="withdrawalsList" class="space-y-3">
                        <p class="text-center text-gray-500 py-8" data-i18n="admin.loading">로딩 중...</p>
                    </div>
                </div>

                <!-- 회원 상세 모달 (숨김) -->
                <div id="userDetailModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 hidden">
                    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-lg font-bold text-gray-800"><i class="fas fa-user-circle text-purple-600 mr-2"></i><span data-i18n="admin.user_detail">회원 상세 정보</span></h3>
                            <button onclick="closeUserDetail()" class="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
                        </div>
                        <div id="userDetailContent">
                            <p class="text-center py-8 text-gray-500" data-i18n="admin.loading">로딩 중...</p>
                        </div>
                    </div>
                </div>

                <!-- QKEY 잔액 임의 수정 모달 (숨김) -->
                <div id="adjustBalanceModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 hidden">
                    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-lg font-bold text-gray-800"><i class="fas fa-coins text-yellow-500 mr-2"></i>QKEY 잔액 임의 수정</h3>
                            <button onclick="closeAdjustBalanceModal()" class="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
                        </div>
                        <div class="space-y-4">
                            <div class="bg-gray-50 rounded-lg p-3">
                                <p class="text-xs text-gray-500 mb-1">대상 회원</p>
                                <p class="text-sm font-bold text-gray-800" id="adjUserInfo">-</p>
                                <p class="text-xs text-gray-600 mt-2">현재 잔액</p>
                                <p class="text-lg font-bold text-yellow-600" id="adjCurrentBalance">- QKEY</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">수정 모드</label>
                                <select id="adjMode" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent" onchange="updateAdjPreview()">
                                    <option value="delta">가산/차감 (delta) — 입력 금액을 현재 잔액에 +/- 함</option>
                                    <option value="set">직접 설정 (set) — 입력 금액을 새 잔액으로 설정</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">금액 (QKEY)</label>
                                <input type="number" id="adjAmount" placeholder="예: 10000 또는 -5000" oninput="updateAdjPreview()"
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent" />
                                <p class="text-xs text-gray-500 mt-1">delta 모드: 양수=가산, 음수=차감 / set 모드: 새 잔액 값</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">
                                    수정 사유 <span class="text-red-500 font-bold">*</span> 
                                    <span class="text-xs text-gray-500 font-normal">(필수 — 사용자측 보상 내역에 노출됨)</span>
                                </label>
                                <textarea id="adjDescription" rows="2"
                                    placeholder="예: 5/5 휴일 매출 누락분 수동 입금 / 잘못 입금된 배당 회수 등 — 구체적으로 기재하세요"
                                    class="w-full px-3 py-2 border-2 border-red-200 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-sm resize-none"></textarea>
                                <p class="text-xs text-red-600 mt-1"><i class="fas fa-exclamation-triangle mr-1"></i>사유는 사용자측 "수당 보상 내역" 화면에 그대로 표시됩니다. 명확한 사유를 입력하세요.</p>
                            </div>
                            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                <p class="text-xs text-yellow-700 font-bold mb-1"><i class="fas fa-eye mr-1"></i>적용 미리보기</p>
                                <p class="text-sm text-gray-800" id="adjPreview">금액을 입력하면 미리보기가 표시됩니다</p>
                                <p class="text-xs text-gray-600 mt-2" id="adjDescPreview"></p>
                            </div>
                            <div class="flex gap-2 pt-2">
                                <button onclick="closeAdjustBalanceModal()" class="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium">취소</button>
                                <button onclick="submitAdjustBalance()" class="flex-1 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-bold"><i class="fas fa-check mr-1"></i>적용</button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 매출 현황 (숨김) -->
                <div id="content-sales" class="bg-white rounded-lg shadow-md p-4 sm:p-6 hidden">
                    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
                        <h2 class="text-xl font-bold text-gray-800">
                            <i class="fas fa-chart-bar text-blue-600 mr-2"></i><span data-i18n="admin.sales_title">전체 매출 현황</span>
                        </h2>
                        <button onclick="exportCSV('sales')" class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-bold transition">
                            <i class="fas fa-file-excel mr-1"></i><span data-i18n="admin.export_csv">엑셀 다운로드</span>
                        </button>
                    </div>
                    <!-- 매출 통계 -->
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-2 sm:mb-3">
                        <div class="bg-blue-50 rounded-lg p-3 sm:p-4 border border-blue-200">
                            <p class="text-xs text-gray-600 mb-1" data-i18n="admin.total_sales">총 매출</p>
                            <p id="salesTotalAmount" class="text-lg sm:text-xl font-bold text-blue-700">$0</p>
                            <p id="salesTotalCount" class="text-xs text-gray-500">0</p>
                        </div>
                        <div class="bg-green-50 rounded-lg p-3 sm:p-4 border border-green-200">
                            <p class="text-xs text-gray-600 mb-1" data-i18n="admin.today">오늘</p>
                            <p id="salesTodayAmount" class="text-lg sm:text-xl font-bold text-green-700">$0</p>
                            <p id="salesTodayCount" class="text-xs text-gray-500">0</p>
                        </div>
                        <div class="bg-yellow-50 rounded-lg p-3 sm:p-4 border border-yellow-200">
                            <p class="text-xs text-gray-600 mb-1" data-i18n="admin.this_week">이번 주</p>
                            <p id="salesWeekAmount" class="text-lg sm:text-xl font-bold text-yellow-700">$0</p>
                            <p id="salesWeekCount" class="text-xs text-gray-500">0</p>
                        </div>
                        <div class="bg-purple-50 rounded-lg p-3 sm:p-4 border border-purple-200">
                            <p class="text-xs text-gray-600 mb-1" data-i18n="admin.this_month">이번 달</p>
                            <p id="salesMonthAmount" class="text-lg sm:text-xl font-bold text-purple-700">$0</p>
                            <p id="salesMonthCount" class="text-xs text-gray-500">0</p>
                        </div>
                    </div>
                    <!-- 정상/리셋 분리 통계 -->
                    <div class="grid grid-cols-2 gap-2 sm:gap-4 mb-4 sm:mb-6">
                        <div class="bg-emerald-50 rounded-lg p-3 sm:p-4 border border-emerald-200">
                            <p class="text-xs text-gray-600 mb-1"><i class="fas fa-check-circle text-emerald-600 mr-1"></i>정상 매출 (사용자 화면 노출)</p>
                            <p id="salesActiveAmount" class="text-lg sm:text-xl font-bold text-emerald-700">$0</p>
                            <p id="salesActiveCount" class="text-xs text-gray-500">0건</p>
                        </div>
                        <div class="bg-red-50 rounded-lg p-3 sm:p-4 border border-red-200">
                            <p class="text-xs text-gray-600 mb-1"><i class="fas fa-undo-alt text-red-600 mr-1"></i>리셋된 매출 (사용자 화면 숨김, 배당은 계속 지급)</p>
                            <p id="salesResetAmount" class="text-lg sm:text-xl font-bold text-red-700">$0</p>
                            <p id="salesResetCount" class="text-xs text-gray-500">0건</p>
                        </div>
                    </div>
                    <!-- 매출 목록 -->
                    <div class="overflow-x-auto">
                        <table class="w-full text-xs sm:text-sm">
                            <thead class="bg-gray-100">
                                <tr>
                                    <th class="px-2 sm:px-3 py-2 text-left" data-i18n="admin.col_email">아이디(이메일)</th>
                                    <th class="px-2 sm:px-3 py-2 text-left" data-i18n="admin.col_name">이름</th>
                                    <th class="px-2 sm:px-3 py-2 text-center" data-i18n="admin.col_country">국가</th>
                                    <th class="px-2 sm:px-3 py-2 text-right" data-i18n="admin.col_sale_amount">판매금액</th>
                                    <th class="px-2 sm:px-3 py-2 text-center" data-i18n="admin.col_status">상태</th>
                                    <th class="px-2 sm:px-3 py-2 text-center">리셋</th>
                                    <th class="px-2 sm:px-3 py-2 text-left" data-i18n="admin.col_sale_date">판매일</th>
                                </tr>
                            </thead>
                            <tbody id="salesTableBody" class="divide-y divide-gray-200">
                                <tr><td colspan="7" class="text-center py-8 text-gray-500" data-i18n="admin.loading">로딩 중...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- 수당 체크 (숨김) -->
                <div id="content-memberRewards" class="bg-white rounded-lg shadow-md p-4 sm:p-6 hidden">
                    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
                        <h2 class="text-xl font-bold text-gray-800">
                            <i class="fas fa-gift text-purple-600 mr-2"></i><span data-i18n="admin.member_rewards_title">회원 전체 수당 체크</span>
                        </h2>
                        <button onclick="exportCSV('rewards')" class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-bold transition">
                            <i class="fas fa-file-excel mr-1"></i><span data-i18n="admin.export_csv">엑셀 다운로드</span>
                        </button>
                    </div>
                    <!-- 수당 총계 -->
                    <div class="grid grid-cols-3 gap-2 sm:gap-4 mb-4">
                        <div class="bg-yellow-50 rounded-lg p-3 border border-yellow-200 text-center">
                            <p class="text-xs text-gray-600" data-i18n="admin.daily_total">일일배당 합계</p>
                            <p id="mrDailyTotal" class="text-sm sm:text-lg font-bold text-yellow-700">0 QKEY</p>
                        </div>
                        <div class="bg-blue-50 rounded-lg p-3 border border-blue-200 text-center">
                            <p class="text-xs text-gray-600" data-i18n="admin.referral_reward_total">추천보상 합계</p>
                            <p id="mrReferralTotal" class="text-sm sm:text-lg font-bold text-blue-700">0 QKEY</p>
                        </div>
                        <div class="bg-green-50 rounded-lg p-3 border border-green-200 text-center">
                            <p class="text-xs text-gray-600" data-i18n="admin.grand_total">전체 합계</p>
                            <p id="mrGrandTotal" class="text-sm sm:text-lg font-bold text-green-700">0 QKEY</p>
                        </div>
                    </div>
                    <!-- 회원별 수당 검색 -->
                    <div class="mb-4 flex gap-2">
                        <input type="text" id="memberRewardSearch" data-i18n-placeholder="admin.search_email_name" placeholder="이메일/이름으로 검색..."
                            class="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-purple-500"
                            oninput="filterMemberRewards()">
                    </div>
                    <!-- 수당 목록 -->
                    <div class="overflow-x-auto">
                        <table class="w-full text-xs sm:text-sm">
                            <thead class="bg-gray-100">
                                <tr>
                                    <th class="px-2 py-2 text-left" data-i18n="admin.col_email_short">이메일</th>
                                    <th class="px-2 py-2 text-left" data-i18n="admin.col_name_short">이름</th>
                                    <th class="px-2 py-2 text-right" data-i18n="admin.col_investment">투자금액</th>
                                    <th class="px-2 py-2 text-right" data-i18n="admin.col_daily_reward">일일배당</th>
                                    <th class="px-2 py-2 text-right" data-i18n="admin.col_referral_reward">추천보상</th>
                                    <th class="px-2 py-2 text-right" data-i18n="admin.col_total_reward">총수당</th>
                                    <th class="px-2 py-2 text-center" data-i18n="admin.col_qkey_balance">QKEY잔액</th>
                                </tr>
                            </thead>
                            <tbody id="memberRewardsTableBody" class="divide-y divide-gray-200">
                                <tr><td colspan="7" class="text-center py-8 text-gray-500" data-i18n="admin.loading">로딩 중...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- 스왑 관리 -->
                <div id="content-swaps" class="bg-white rounded-lg shadow-md p-4 sm:p-6 hidden">
                    <h2 class="text-xl font-bold text-gray-800 mb-4">
                        <i class="fas fa-exchange-alt text-indigo-600 mr-2"></i><span data-i18n="admin.swaps_title">스왑 내역 관리</span>
                    </h2>
                    <!-- 스왑 통계 -->
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                        <div class="bg-indigo-50 rounded-lg p-3 text-center">
                            <p class="text-xs text-gray-500">총 스왑 건수</p>
                            <p class="text-xl font-bold text-indigo-600" id="swapStatCount">0</p>
                        </div>
                        <div class="bg-yellow-50 rounded-lg p-3 text-center">
                            <p class="text-xs text-gray-500">사용 QKEY</p>
                            <p class="text-xl font-bold text-yellow-600" id="swapStatQkeyUsed">0</p>
                        </div>
                        <div class="bg-green-50 rounded-lg p-3 text-center">
                            <p class="text-xs text-gray-500">사용 USDT</p>
                            <p class="text-xl font-bold text-green-600" id="swapStatUsdtUsed">0</p>
                        </div>
                        <div class="bg-blue-50 rounded-lg p-3 text-center">
                            <p class="text-xs text-gray-500">참여 회원수</p>
                            <p class="text-xl font-bold text-blue-600" id="swapStatUsers">0</p>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                        <div class="bg-blue-50 rounded-lg p-3 text-center">
                            <p class="text-xs text-gray-500">발행 QTA</p>
                            <p class="text-lg font-bold text-blue-600" id="swapStatQtaOut">0</p>
                        </div>
                        <div class="bg-purple-50 rounded-lg p-3 text-center">
                            <p class="text-xs text-gray-500">발행 QX</p>
                            <p class="text-lg font-bold text-purple-600" id="swapStatQxOut">0</p>
                        </div>
                        <div class="bg-green-50 rounded-lg p-3 text-center">
                            <p class="text-xs text-gray-500">발행 USDT</p>
                            <p class="text-lg font-bold text-green-600" id="swapStatUsdtOut">0</p>
                        </div>
                        <div class="bg-yellow-50 rounded-lg p-3 text-center">
                            <p class="text-xs text-gray-500">발행 QKEY</p>
                            <p class="text-lg font-bold text-yellow-600" id="swapStatQkeyOut">0</p>
                        </div>
                    </div>
                    <!-- 스왑 테이블 -->
                    <div class="overflow-x-auto">
                        <table class="w-full text-sm">
                            <thead class="bg-gray-100">
                                <tr>
                                    <th class="px-3 py-2 text-left">회원</th>
                                    <th class="px-3 py-2 text-left">유형</th>
                                    <th class="px-3 py-2 text-right">수량</th>
                                    <th class="px-3 py-2 text-left">코인</th>
                                    <th class="px-3 py-2 text-left">설명</th>
                                    <th class="px-3 py-2 text-left">일시</th>
                                </tr>
                            </thead>
                            <tbody id="swapTableBody" class="divide-y divide-gray-200">
                                <tr><td colspan="6" class="text-center py-8 text-gray-500">로딩 중...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- 쇼핑몰 관리 -->
                <div id="content-shop" class="bg-white rounded-lg shadow-md p-4 sm:p-6 hidden">
                    <h2 class="text-xl font-bold text-gray-800 mb-4">
                        <i class="fas fa-shopping-cart text-pink-600 mr-2"></i>쇼핑몰 관리
                    </h2>
                    
                    <!-- 주문 통계 -->
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                        <div class="bg-pink-50 rounded-lg p-3 text-center">
                            <p class="text-xs text-gray-500">총 주문</p>
                            <p class="text-xl font-bold text-pink-600" id="shopStatOrders">0</p>
                        </div>
                        <div class="bg-yellow-50 rounded-lg p-3 text-center">
                            <p class="text-xs text-gray-500">사용 QKEY</p>
                            <p class="text-xl font-bold text-yellow-600" id="shopStatQkey">0</p>
                        </div>
                        <div class="bg-green-50 rounded-lg p-3 text-center">
                            <p class="text-xs text-gray-500">총 매출(원)</p>
                            <p class="text-xl font-bold text-green-600" id="shopStatKrw">0</p>
                        </div>
                        <div class="bg-blue-50 rounded-lg p-3 text-center">
                            <p class="text-xs text-gray-500">구매 회원수</p>
                            <p class="text-xl font-bold text-blue-600" id="shopStatBuyers">0</p>
                        </div>
                    </div>

                    <!-- 상품 등록 -->
                    <div class="bg-gray-50 rounded-lg p-4 mb-4 border">
                        <h3 class="font-bold text-gray-700 mb-3"><i class="fas fa-plus-circle mr-1"></i>상품 등록</h3>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                            <input type="text" id="shopProdName" placeholder="상품명 *" class="px-3 py-2 border rounded-lg text-sm">
                            <input type="number" id="shopProdPrice" placeholder="가격 (원) *" class="px-3 py-2 border rounded-lg text-sm">
                            <div class="sm:col-span-2">
                                <div class="flex items-center gap-2 mb-1 flex-wrap">
                                    <label class="text-xs font-bold text-gray-600">상품 설명</label>
                                    <button type="button" onclick="toggleDescMode()" id="descModeBtn" class="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-bold">HTML 모드</button>
                                    <span class="text-xs text-gray-400">(텍스트 또는 HTML 태그 직접 입력 가능)</span>
                                </div>
                                <input type="text" id="shopProdDesc" placeholder="상품 설명 (텍스트)" class="w-full px-3 py-2 border rounded-lg text-sm">
                                <textarea id="shopProdDescHtml" placeholder="HTML 코드 직접 입력 — 예) &lt;h2&gt;상품 상세&lt;/h2&gt;&lt;p&gt;설명...&lt;/p&gt;&lt;img src=&quot;https://...&quot;/&gt;&lt;ul&gt;&lt;li&gt;특징1&lt;/li&gt;&lt;/ul&gt;" class="w-full px-3 py-2 border rounded-lg text-sm hidden" rows="6" style="font-family:monospace;font-size:12px"></textarea>
                            </div>
                            <select id="shopProdCategory" class="px-3 py-2 border rounded-lg text-sm bg-white">
                                <option value="일반">일반</option>
                                <option value="식품">식품</option>
                                <option value="건강">건강</option>
                                <option value="생활">생활</option>
                                <option value="패션">패션</option>
                                <option value="뷰티">뷰티</option>
                                <option value="전자기기">전자기기</option>
                                <option value="기타">기타</option>
                            </select>
                            <input type="number" id="shopProdStock" placeholder="재고 (-1=무제한)" class="px-3 py-2 border rounded-lg text-sm" value="-1">
                        </div>
                        <!-- 옵션 설정 -->
                        <div class="mb-3">
                            <label class="block text-xs font-bold text-gray-600 mb-1"><i class="fas fa-list-ul mr-1 text-orange-500"></i>옵션 설정 (선택)</label>
                            <p class="text-xs text-gray-400 mb-2">옵션명과 항목을 쉼표로 구분. 예: 사이즈:S,M,L,XL | 컬러:블랙,화이트,네이비</p>
                            <div id="shopProdOptions" class="space-y-2">
                                <div class="flex gap-2 items-center">
                                    <input type="text" placeholder="옵션명 (예: 사이즈)" class="shopOptName px-2 py-1.5 border rounded text-sm w-28">
                                    <input type="text" placeholder="항목 (쉼표 구분: S,M,L,XL)" class="shopOptValues px-2 py-1.5 border rounded text-sm flex-1">
                                    <button onclick="removeOptionRow(this)" class="text-red-400 hover:text-red-600 text-sm"><i class="fas fa-times-circle"></i></button>
                                </div>
                            </div>
                            <button onclick="addOptionRow()" class="mt-2 px-3 py-1 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded text-xs font-bold"><i class="fas fa-plus mr-1"></i>옵션 추가</button>
                        </div>
                        <!-- 이미지 업로드 영역 -->
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                            <!-- 썸네일 -->
                            <div>
                                <label class="block text-xs font-bold text-gray-600 mb-1"><i class="fas fa-image mr-1 text-blue-500"></i>썸네일 이미지 (목록용)</label>
                                <div id="thumbDropZone" class="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-pink-400 hover:bg-pink-50 transition relative"
                                    onclick="document.getElementById('thumbFileInput').click()">
                                    <input type="file" id="thumbFileInput" accept="image/*" class="hidden" onchange="handleImageUpload(this,'thumb')">
                                    <div id="thumbPreview" class="hidden overflow-hidden" style="max-height:120px"><img id="thumbPreviewImg" class="max-h-24 mx-auto rounded mb-1"><button onclick="event.stopPropagation();clearImage('thumb')" class="text-xs text-red-500 hover:text-red-700"><i class="fas fa-times mr-1"></i>제거</button></div>
                                    <div id="thumbPlaceholder"><i class="fas fa-cloud-upload-alt text-2xl text-gray-400 mb-1"></i><p class="text-xs text-gray-500">클릭 또는 드래그앤드롭</p><p class="text-xs text-gray-400">JPG, PNG (최대 2MB)</p></div>
                                </div>
                                <input type="hidden" id="shopProdImage">
                            </div>
                            <!-- 상세 이미지 (여러장) -->
                            <div class="sm:col-span-2">
                                <label class="block text-xs font-bold text-gray-600 mb-1"><i class="fas fa-file-image mr-1 text-purple-500"></i>상세페이지 이미지 (여러장 가능)</label>
                                <div id="detailDropZone" class="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition relative"
                                    onclick="document.getElementById('detailFileInput').click()">
                                    <input type="file" id="detailFileInput" accept="image/*" class="hidden" onchange="handleDetailImageAdd(this)" multiple>
                                    <div id="detailPlaceholder"><i class="fas fa-cloud-upload-alt text-2xl text-gray-400 mb-1"></i><p class="text-xs text-gray-500">클릭 또는 드래그앤드롭</p><p class="text-xs text-gray-400">JPG, PNG (여러장 선택 가능, 각 최대 5MB)</p></div>
                                </div>
                                <div id="detailImageList" class="mt-2 space-y-2"></div>
                            </div>
                        </div>
                        <button onclick="adminAddProduct()" class="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-base transition shadow-lg">
                            <i class="fas fa-save mr-2"></i>상품 저장
                        </button>
                    </div>

                    <!-- 상품 대량등록 -->
                    <div class="bg-yellow-50 rounded-lg p-4 mb-4 border border-yellow-200">
                        <h3 class="font-bold text-gray-700 mb-2"><i class="fas fa-file-upload mr-1 text-yellow-600"></i>상품 대량등록 (엑셀 .xlsx / .xls / CSV)</h3>
                        <p class="text-xs text-gray-600 mb-1"><strong>컬럼 순서:</strong> 상품명, 가격(원), 설명/HTML, 카테고리, 재고, 옵션, 이미지URL, 상세이미지URL</p>
                        <ul class="text-xs text-gray-500 mb-2 list-disc list-inside space-y-0.5">
                            <li><strong>설명/HTML</strong>: 일반 텍스트 또는 <code>&lt;h3&gt;...&lt;/h3&gt;&lt;p&gt;...&lt;/p&gt;</code> 같은 HTML 태그 직접 사용 가능</li>
                            <li><strong>옵션</strong>: <code>사이즈:S,M,L|컬러:블랙,화이트</code> 형식 (없으면 비움)</li>
                            <li><strong>재고</strong>: -1 = 무제한</li>
                            <li><strong>이미지URL</strong>: 외부 이미지 링크 (https://...) — 비우면 등록 후 개별 업로드 가능</li>
                        </ul>
                        <div class="flex gap-2 items-center flex-wrap">
                            <button onclick="downloadBulkTemplate()" class="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 rounded text-xs font-bold"><i class="fas fa-download mr-1"></i>엑셀 템플릿 다운로드</button>
                            <input type="file" id="bulkProductFile" accept=".csv,.xlsx,.xls" class="hidden" onchange="handleBulkProductUpload(this)">
                            <button onclick="document.getElementById('bulkProductFile').click()" class="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded text-xs font-bold"><i class="fas fa-upload mr-1"></i>엑셀/CSV 파일 업로드</button>
                            <span id="bulkProductStatus" class="text-xs text-gray-500"></span>
                        </div>
                    </div>

                    <!-- 등록된 상품 목록 -->
                    <div class="mb-6">
                        <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
                            <h3 class="font-bold text-gray-700"><i class="fas fa-box mr-1"></i>등록 상품 <span id="adminProductCount" class="text-xs text-gray-500 font-normal ml-1"></span></h3>
                            <div class="flex gap-2 items-center flex-wrap">
                                <div class="relative">
                                    <i class="fas fa-search absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
                                    <input type="text" id="adminProductSearch" placeholder="상품명/카테고리/설명 검색" class="pl-7 pr-7 py-1.5 border rounded text-xs w-56" oninput="onAdminProductSearchChange()">
                                    <button onclick="document.getElementById('adminProductSearch').value=''; onAdminProductSearchChange();" class="absolute right-1 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs px-1" title="검색 초기화"><i class="fas fa-times"></i></button>
                                </div>
                                <select id="adminProductFilterStatus" onchange="onAdminProductSearchChange()" class="text-xs border rounded px-2 py-1.5">
                                    <option value="">전체상태</option>
                                    <option value="active">판매중</option>
                                    <option value="inactive">비활성</option>
                                </select>
                                <select id="adminProductPageSize" onchange="onAdminProductPageSizeChange()" class="text-xs border rounded px-2 py-1.5">
                                    <option value="10">10개씩</option>
                                    <option value="20" selected>20개씩</option>
                                    <option value="50">50개씩</option>
                                    <option value="100">100개씩</option>
                                </select>
                                <button onclick="loadAdminShopProducts()" class="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 rounded text-xs font-bold"><i class="fas fa-sync-alt mr-1"></i>새로고침</button>
                            </div>
                        </div>
                        <div id="adminProductList" class="space-y-2">
                            <p class="text-gray-400 text-center py-4">로딩 중...</p>
                        </div>
                        <!-- 페이지네이션 -->
                        <div id="adminProductPagination" class="flex items-center justify-center gap-1 mt-4 flex-wrap"></div>
                    </div>

                    <!-- 실시간 주문 현황 -->
                    <div>
                        <div class="flex items-center justify-between mb-3">
                            <h3 class="font-bold text-gray-700"><i class="fas fa-receipt mr-1"></i>실시간 주문 현황</h3>
                            <div class="flex gap-2 flex-wrap">
                                <input type="file" id="trackingFile" accept=".csv,.xlsx,.xls" class="hidden" onchange="handleTrackingUpload(this)">
                                <button onclick="document.getElementById('trackingFile').click()" class="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs font-medium" title="엑셀(.xlsx/.xls) 또는 CSV 파일로 송장번호 일괄 등록"><i class="fas fa-file-excel mr-1"></i>송장 일괄등록 (엑셀)</button>
                                <button onclick="downloadTrackingTemplate()" class="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-xs font-medium"><i class="fas fa-download mr-1"></i>엑셀 템플릿</button>
                                <button onclick="exportShopOrders()" class="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-xs font-medium"><i class="fas fa-file-csv mr-1"></i>CSV 다운로드</button>
                                <button onclick="loadAdminShopOrders()" class="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-xs font-medium"><i class="fas fa-sync-alt mr-1"></i>새로고침</button>
                            </div>
                        </div>
                        <!-- 주문 통계 요약 카드 -->
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                            <div class="bg-blue-50 border border-blue-200 rounded-lg p-2 text-center">
                                <div class="text-xs text-gray-600">총 주문</div>
                                <div class="text-lg font-bold text-blue-700"><span id="shopStatOrders">0</span> 건</div>
                            </div>
                            <div class="bg-pink-50 border border-pink-200 rounded-lg p-2 text-center">
                                <div class="text-xs text-gray-600">사용 QKEY</div>
                                <div class="text-lg font-bold text-pink-700"><span id="shopStatQkey">0</span></div>
                            </div>
                            <div class="bg-green-50 border border-green-200 rounded-lg p-2 text-center">
                                <div class="text-xs text-gray-600">총 매출</div>
                                <div class="text-lg font-bold text-green-700"><span id="shopStatKrw">0</span>원</div>
                            </div>
                            <div class="bg-purple-50 border border-purple-200 rounded-lg p-2 text-center">
                                <div class="text-xs text-gray-600">구매자수</div>
                                <div class="text-lg font-bold text-purple-700"><span id="shopStatBuyers">0</span> 명</div>
                            </div>
                        </div>
                        <!-- 필터: 상태 + 주문자/상품 검색 -->
                        <div class="flex flex-wrap gap-2 mb-3 items-center bg-gray-50 rounded-lg p-2">
                            <select id="adminOrderFilterStatus" onchange="renderAdminOrders()" class="text-xs border rounded px-2 py-1 bg-white">
                                <option value="">전체 상태</option>
                                <option value="paid">결제완료</option>
                                <option value="shipping">배송중</option>
                                <option value="delivered">배송완료</option>
                                <option value="cancelled">취소</option>
                            </select>
                            <input id="adminOrderFilterText" oninput="renderAdminOrders()" type="text" placeholder="주문자/이메일/상품명 검색" class="text-xs border rounded px-2 py-1 flex-1 min-w-[160px] bg-white">
                            <span class="text-xs text-gray-500"><i class="fas fa-filter mr-1"></i>실시간 필터</span>
                        </div>
                        <div class="overflow-x-auto">
                            <table class="w-full text-sm">
                                <thead class="bg-gray-100">
                                    <tr>
                                        <th class="px-3 py-2 text-left">주문자</th>
                                        <th class="px-3 py-2 text-left">상품</th>
                                        <th class="px-3 py-2 text-right">금액</th>
                                        <th class="px-3 py-2 text-right">QKEY</th>
                                        <th class="px-3 py-2 text-left">배송정보</th>
                                        <th class="px-3 py-2 text-center">상태</th>
                                        <th class="px-3 py-2 text-left">일시</th>
                                    </tr>
                                </thead>
                                <tbody id="adminOrderTableBody" class="divide-y divide-gray-200">
                                    <tr><td colspan="7" class="text-center py-8 text-gray-400">로딩 중...</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- 쇼핑몰 문의 관리 (쇼핑몰 관리자 전용) -->
                    <div class="mt-6 border-t pt-6">
                        <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
                            <h3 class="font-bold text-gray-700"><i class="fas fa-comment-dots mr-1 text-blue-600"></i>쇼핑몰 문의 관리 <span id="adminInquiryCount" class="text-xs text-gray-500 font-normal ml-1"></span></h3>
                            <div class="flex gap-2 flex-wrap">
                                <select id="adminInquiryFilterStatus" onchange="renderAdminInquiries()" class="text-xs border rounded px-2 py-1 bg-white">
                                    <option value="">전체 상태</option>
                                    <option value="pending">답변대기</option>
                                    <option value="answered">답변완료</option>
                                </select>
                                <select id="adminInquiryFilterCategory" onchange="renderAdminInquiries()" class="text-xs border rounded px-2 py-1 bg-white">
                                    <option value="">전체 유형</option>
                                    <option value="shipping">배송</option>
                                    <option value="refund">환불</option>
                                    <option value="other">기타</option>
                                </select>
                                <button onclick="loadAdminInquiries()" class="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-xs font-medium"><i class="fas fa-sync-alt mr-1"></i>새로고침</button>
                            </div>
                        </div>
                        <p class="text-xs text-gray-500 mb-3"><i class="fas fa-lock mr-1"></i>쇼핑몰 관리자만 열람 가능합니다. 사용자 본인과 본 페이지 외에는 노출되지 않습니다.</p>
                        <div id="adminInquiryList" class="space-y-2">
                            <p class="text-center py-6 text-gray-400 text-sm">로딩 중...</p>
                        </div>
                    </div>
                </div>

                <!-- 산하매출 모달 -->
                <div id="downlineModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 hidden">
                    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-lg font-bold text-gray-800"><i class="fas fa-sitemap text-blue-600 mr-2"></i><span data-i18n="admin.downline_title">산하 매출 조회</span></h3>
                            <button onclick="closeDownlineModal()" class="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
                        </div>
                        <!-- 회원 검색 -->
                        <div class="mb-4 flex gap-2">
                            <input type="text" id="downlineSearchInput" data-i18n-placeholder="admin.downline_search_placeholder" placeholder="아이디/이름/추천코드로 검색..."
                                class="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-purple-500">
                            <button onclick="searchDownlineUser()" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold">
                                <i class="fas fa-search mr-1"></i><span data-i18n="admin.downline_search">검색</span>
                            </button>
                        </div>
                        <div id="downlineContent">
                            <p class="text-center py-8 text-gray-400" data-i18n="admin.downline_search_prompt">회원을 검색하세요</p>
                        </div>
                    </div>
                </div>

                <!-- 가입 현황 (숨김) -->
                <div id="content-signups" class="bg-white rounded-lg shadow-md p-6 hidden">
                    <h2 class="text-xl font-bold text-gray-800 mb-4">
                        <i class="fas fa-user-plus text-blue-600 mr-2"></i><span data-i18n="admin.signups_title">회원가입 현황</span>
                    </h2>
                    <div class="grid grid-cols-3 gap-2 sm:gap-6 mb-4 sm:mb-6">
                        <div class="bg-blue-50 rounded-lg p-3 sm:p-4 border border-blue-200">
                            <p class="text-xs sm:text-sm text-gray-600 mb-1" data-i18n="admin.today">오늘</p>
                            <p id="signupsToday" class="text-lg sm:text-2xl font-bold text-blue-600">0</p>
                        </div>
                        <div class="bg-green-50 rounded-lg p-3 sm:p-4 border border-green-200">
                            <p class="text-xs sm:text-sm text-gray-600 mb-1" data-i18n="admin.this_week">이번 주</p>
                            <p id="signupsWeek" class="text-lg sm:text-2xl font-bold text-green-600">0</p>
                        </div>
                        <div class="bg-purple-50 rounded-lg p-3 sm:p-4 border border-purple-200">
                            <p class="text-xs sm:text-sm text-gray-600 mb-1" data-i18n="admin.this_month">이번 달</p>
                            <p id="signupsMonth" class="text-lg sm:text-2xl font-bold text-purple-600">0</p>
                        </div>
                    </div>
                    <div id="signupsList" class="space-y-4">
                        <p class="text-center text-gray-500 py-8" data-i18n="admin.loading">로딩 중...</p>
                    </div>
                </div>

                <!-- 공지사항 관리 -->
                <div id="content-notices" class="bg-white rounded-lg shadow-md p-4 sm:p-6 hidden">
                    <h2 class="text-xl font-bold text-gray-800 mb-4">
                        <i class="fas fa-bullhorn text-blue-600 mr-2"></i>공지사항 관리
                    </h2>

                    <!-- 등록/수정 폼 -->
                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-4">
                        <h3 class="font-bold text-gray-700 mb-3 text-sm"><i class="fas fa-edit mr-1"></i><span id="noticeFormTitle">새 공지 작성</span></h3>
                        <input type="hidden" id="noticeEditId" value="">
                        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
                            <input type="text" id="noticeTitle" placeholder="제목" class="sm:col-span-2 border rounded px-3 py-2 text-sm" maxlength="200">
                            <div class="flex items-center gap-3 px-2">
                                <label class="flex items-center gap-1 text-xs text-gray-700">
                                    <input type="checkbox" id="noticePinned" class="w-4 h-4"> 상단고정(중요)
                                </label>
                                <label class="flex items-center gap-1 text-xs text-gray-700">
                                    <input type="checkbox" id="noticeActive" class="w-4 h-4" checked> 게시
                                </label>
                            </div>
                        </div>
                        <textarea id="noticeContent" placeholder="내용을 입력하세요. 줄바꿈 그대로 표시됩니다." rows="6" class="w-full border rounded px-3 py-2 text-sm"></textarea>
                        <div class="flex justify-end gap-2 mt-2">
                            <button onclick="resetNoticeForm()" class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded text-xs font-bold">초기화</button>
                            <button onclick="saveNotice()" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold"><i class="fas fa-save mr-1"></i>저장</button>
                        </div>
                    </div>

                    <!-- 목록 -->
                    <div class="flex items-center justify-between mb-2">
                        <h3 class="font-bold text-gray-700 text-sm"><i class="fas fa-list mr-1"></i>등록된 공지 <span id="adminNoticeCount" class="text-xs text-gray-500 font-normal ml-1"></span></h3>
                        <button onclick="loadAdminNotices()" class="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs font-medium"><i class="fas fa-sync-alt mr-1"></i>새로고침</button>
                    </div>
                    <div id="adminNoticeList" class="space-y-2">
                        <p class="text-center text-gray-400 text-sm py-4">로딩 중...</p>
                    </div>
                </div>
            </main>
        </div>

        <script src="/static/axios.min.js"></script>
        <script src="/static/i18n.js?v=20260427c"></script>
        <!-- SheetJS (xlsx) - 상품 대량등록/송장 엑셀 업로드용 -->
        <script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>
        <script>
            // Initialize i18n
            I18N.init();
            createLangSelector('langSelector');

            // 관리자 인증 확인
            const admin = JSON.parse(localStorage.getItem('admin') || 'null');
            if (!admin || !admin.token) {
                window.location.href = '/admin';
            }

            // axios 기본 헤더에 관리자 토큰 설정
            if (admin && admin.token) {
                axios.defaults.headers.common['Authorization'] = 'Bearer ' + admin.token;
            }

            // HTML 이스케이프 (XSS 방지)
            function esc(str) {
                if (!str) return '';
                return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
            }
            var escapeHtml = esc; // alias for consistency

            let currentTab = 'pending';

            // 탭 전환
            function showTab(tab) {
                currentTab = tab;
                
                // 탭 버튼 스타일 변경
                document.querySelectorAll('[id^="tab-"]').forEach(btn => {
                    btn.classList.remove('text-purple-600', 'border-b-2', 'border-purple-600');
                    btn.classList.add('text-gray-600');
                });
                document.getElementById(\`tab-\${tab}\`).classList.remove('text-gray-600');
                document.getElementById(\`tab-\${tab}\`).classList.add('text-purple-600', 'border-b-2', 'border-purple-600');

                // 콘텐츠 표시/숨김
                var sections = ['pending', 'all', 'rewards', 'withdrawals', 'users', 'signups', 'sales', 'swaps', 'memberRewards', 'shop', 'notices'];
                sections.forEach(function(s) {
                    var el = document.getElementById('content-' + s);
                    if (el) el.classList.add('hidden');
                });
                document.getElementById(\`content-\${tab}\`).classList.remove('hidden');

                // 데이터 로드
                if (tab === 'pending') loadPendingStakings();
                else if (tab === 'all') loadAllStakings();
                else if (tab === 'rewards') loadRewardsStatus();
                else if (tab === 'withdrawals') loadWithdrawals();
                else if (tab === 'users') loadUsers();
                else if (tab === 'signups') loadSignups();
                else if (tab === 'sales') loadSalesStatus();
                else if (tab === 'swaps') loadSwaps();
                else if (tab === 'memberRewards') loadMemberRewards();
                else if (tab === 'shop') { loadAdminShopProducts(); loadAdminShopOrders(); loadAdminInquiries(); }
                else if (tab === 'notices') loadAdminNotices();
            }

            // 통계 로드
            async function loadStatistics() {
                try {
                    const [pendingRes, allRes, usersRes, signupsRes] = await Promise.all([
                        axios.get('/api/admin/staking/pending'),
                        axios.get('/api/admin/staking/all'),
                        axios.get('/api/admin/users'),
                        axios.get('/api/admin/signups')
                    ]);

                    const pending = pendingRes.data.stakings || [];
                    const all = allRes.data.stakings || [];
                    const users = usersRes.data.users || [];
                    const signups = signupsRes.data;

                    document.getElementById('pendingCount').textContent = pending.length;
                    document.getElementById('activeCount').textContent = all.filter(s => s.status === 'active').length;
                    document.getElementById('rejectedCount').textContent = all.filter(s => s.status === 'rejected').length;
                    document.getElementById('totalUsers').textContent = users.length;
                    document.getElementById('newUsersToday').textContent = signups.today;
                } catch (error) {
                    console.error('Statistics load failed:', error);
                }
            }

            // 승인 대기 목록 로드
            async function loadPendingStakings() {
                console.log('Loading pending stakings...');
                try {
                    // ★ 캐시 우회: timestamp 쿼리 + no-store 헤더로 항상 최신 상태 fetch
                    const response = await axios.get('/api/admin/staking/pending?_t=' + Date.now(), {
                        headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
                    });
                    console.log('Pending stakings response:', response.data);
                    const stakings = response.data.stakings || [];
                    const listEl = document.getElementById('pendingList');
                    console.log('Found pendingList element:', listEl);

                    if (stakings.length === 0) {
                        listEl.innerHTML = '<p class="text-center text-gray-500 py-8">' + I18N.t('admin.no_pending') + '</p>';
                        return;
                    }

                    listEl.innerHTML = stakings.map(s => \`
                        <div class="border border-yellow-200 bg-yellow-50 rounded-lg p-6" data-staking-id="\${s.id}">
                            <div class="flex justify-between items-start mb-4">
                                <div class="flex-1">
                                    <div class="flex items-center gap-2 mb-2">
                                        <span class="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                                            <i class="fas fa-clock mr-1"></i>\${I18N.t('admin.status_pending')}
                                        </span>
                                        <span class="text-xs text-gray-500">\${new Date(s.created_at).toLocaleString(I18N.getLang())}</span>
                                    </div>
                                    <h3 class="text-xl font-bold text-gray-800 mb-1">\${esc(s.email)}</h3>
                                    <p class="text-sm text-gray-600"><i class="fas fa-user mr-1"></i>\${esc(s.name)}</p>
                                    <p class="text-xs sm:text-sm text-gray-600 font-mono truncate"><i class="fas fa-wallet mr-1"></i>\${esc(s.wallet_address)}</p>
                                </div>
                            </div>

                            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 mb-3 sm:mb-4 p-3 sm:p-4 bg-white rounded-lg">
                                <div>
                                    <p class="text-xs text-gray-600 mb-1">\${I18N.t('admin.investment_amount')}</p>
                                    <p class="font-bold text-purple-600">$\${s.amount.toLocaleString()}</p>
                                </div>
                                <div>
                                    <p class="text-xs text-gray-600 mb-1">\${I18N.t('admin.staking_period')}</p>
                                    <p class="font-bold text-gray-800">\${s.period_days || (s.period_months * 30)}\${I18N.t('admin.days_unit')}</p>
                                </div>
                                <div>
                                    <p class="text-xs text-gray-600 mb-1">\${I18N.t('admin.daily_rate')}</p>
                                    <p class="font-bold text-green-600">\${s.daily_rate ? (s.daily_rate * 100).toFixed(1) + '%' : '-'}</p>
                                </div>
                                <div>
                                    <p class="text-xs text-gray-600 mb-1">QTA</p>
                                    <p class="font-bold text-blue-600">\${s.qta_reward.toLocaleString()}</p>
                                </div>
                                <div>
                                    <p class="text-xs text-gray-600 mb-1">QX</p>
                                    <p class="font-bold text-purple-600">\${s.qx_reward.toLocaleString()}</p>
                                </div>
                                <div>
                                    <p class="text-xs text-gray-600 mb-1">QKEY</p>
                                    <p class="font-bold text-yellow-600">\${(s.qkey_reward || 0).toLocaleString()}</p>
                                </div>
                            </div>

                            <!-- TXID 표시 -->
                            <div class="mb-3 p-3 rounded-lg \${s.txid ? 'bg-green-50 border border-green-300' : 'bg-red-50 border border-red-300'}">
                                <div class="flex items-center justify-between">
                                    <div class="flex-1 min-w-0">
                                        <p class="text-xs font-bold \${s.txid ? 'text-green-800' : 'text-red-800'} mb-1">
                                            <i class="fas \${s.txid ? 'fa-check-circle' : 'fa-exclamation-triangle'} mr-1"></i>
                                            TXID (BNB Chain)
                                        </p>
                                        \${s.txid 
                                            ? '<a href="https://bscscan.com/tx/' + s.txid + '" target="_blank" class="text-xs font-mono text-green-700 hover:underline break-all">' + s.txid + '</a>'
                                            : '<p class="text-xs text-red-700">' + I18N.t('admin.txid_not_registered') + '</p>'
                                        }
                                    </div>
                                    \${s.txid ? '<a href="https://bscscan.com/tx/' + s.txid + '" target="_blank" class="ml-2 px-3 py-1 bg-green-600 text-white rounded text-xs font-bold hover:bg-green-700 whitespace-nowrap"><i class=\\"fas fa-external-link-alt mr-1\\"></i>BscScan</a>' : ''}
                                </div>
                            </div>

                            <div class="flex gap-3">
                                <button onclick="approveStaking(\${s.id})" 
                                    class="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold transition duration-200">
                                    <i class="fas fa-check mr-2"></i>\${I18N.t('admin.approve')}
                                </button>
                                <button onclick="rejectStaking(\${s.id})" 
                                    class="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-bold transition duration-200">
                                    <i class="fas fa-times mr-2"></i>\${I18N.t('admin.reject')}
                                </button>
                            </div>
                        </div>
                    \`).join('');
                } catch (error) {
                    console.error('Pending list load failed:', error);
                    console.error('Error details:', error.response);
                    const listEl = document.getElementById('pendingList');
                    if (listEl) {
                        listEl.innerHTML = '<p class="text-center text-red-500 py-8">' + I18N.t('admin.load_fail') + '</p>';
                    }
                }
            }

            // 전체 스테이킹 목록 로드
            async function loadAllStakings() {
                try {
                    const response = await axios.get('/api/admin/staking/all');
                    const stakings = response.data.stakings || [];
                    const listEl = document.getElementById('allList');

                    if (stakings.length === 0) {
                        listEl.innerHTML = '<p class="text-center text-gray-500 py-8">' + I18N.t('admin.no_stakings') + '</p>';
                        return;
                    }

                    listEl.innerHTML = stakings.map(s => {
                        let statusColor, statusText, statusIcon;
                        if (s.status === 'pending') {
                            statusColor = 'yellow';
                            statusText = I18N.t('admin.status_pending');
                            statusIcon = 'clock';
                        } else if (s.status === 'active') {
                            statusColor = 'green';
                            statusText = I18N.t('admin.status_active');
                            statusIcon = 'check-circle';
                        } else if (s.status === 'rejected') {
                            statusColor = 'red';
                            statusText = I18N.t('admin.status_rejected');
                            statusIcon = 'times-circle';
                        } else {
                            statusColor = 'gray';
                            statusText = I18N.t('admin.status_completed');
                            statusIcon = 'flag-checkered';
                        }

                        return \`
                            <div class="border border-gray-200 rounded-lg p-6">
                                <div class="flex justify-between items-start mb-4">
                                    <div class="flex-1">
                                        <div class="flex items-center gap-2 mb-2">
                                            <span class="px-3 py-1 bg-\${statusColor}-100 text-\${statusColor}-700 rounded-full text-sm font-medium">
                                                <i class="fas fa-\${statusIcon} mr-1"></i>\${statusText}
                                            </span>
                                            <span class="text-xs text-gray-500">\${new Date(s.created_at).toLocaleString(I18N.getLang())}</span>
                                        </div>
                                        <h3 class="text-lg font-bold text-gray-800">\${esc(s.email)}</h3>
                                        <p class="text-sm text-gray-600"><i class="fas fa-user mr-1"></i>\${esc(s.name)}</p>
                                    </div>
                                </div>

                                <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 sm:gap-3 text-sm">
                                    <div>
                                        <p class="text-gray-600">\${I18N.t('admin.investment_amount')}</p>
                                        <p class="font-bold">$\${s.amount.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p class="text-gray-600">\${I18N.t('admin.staking_period')}</p>
                                        <p class="font-bold">\${s.period_days || (s.period_months * 30)}\${I18N.t('admin.days_unit')}</p>
                                    </div>
                                    <div>
                                        <p class="text-gray-600">QTA</p>
                                        <p class="font-bold text-blue-600">\${s.qta_reward.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p class="text-gray-600">QX</p>
                                        <p class="font-bold text-purple-600">\${s.qx_reward.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p class="text-gray-600">QKEY</p>
                                        <p class="font-bold text-yellow-600">\${(s.qkey_reward || 0).toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p class="text-gray-600">\${I18N.t('admin.end_date')}</p>
                                        <p class="font-bold">\${s.end_date ? new Date(s.end_date).toLocaleDateString(I18N.getLang()) : '-'}</p>
                                    </div>
                                </div>
                                <div class="mt-2 pt-2 border-t border-gray-200">
                                    <p class="text-xs \${s.txid ? 'text-green-700' : 'text-gray-400'}">
                                        <i class="fas \${s.txid ? 'fa-check-circle text-green-600' : 'fa-minus-circle'} mr-1"></i>
                                        TXID: \${s.txid ? '<a href="https://bscscan.com/tx/' + s.txid + '" target="_blank" class="font-mono hover:underline">' + s.txid.substring(0, 30) + '...</a>' : I18N.t('admin.txid_unregistered')}
                                    </p>
                                </div>
                            </div>
                        \`;
                    }).join('');
                } catch (error) {
                    console.error('All stakings load failed:', error);
                }
            }

            // 사용자 목록 캐시 (검색 필터링용)
            let __allUsersCache = [];

            // 사용자 카드 HTML 생성 (검색 필터링 결과 렌더링에 재사용)
            function renderUsersCards(users) {
                const listEl = document.getElementById('usersList');
                if (!listEl) return;
                if (!users || users.length === 0) {
                    listEl.innerHTML = '<p class="text-center text-gray-500 py-8">' + I18N.t('admin.no_users') + '</p>';
                    return;
                }
                listEl.innerHTML = users.map(u => __renderUserCardHtml(u)).join('');
            }

            // 회원 검색 (이름/아이디/전화번호/지갑/추천인코드)
            function filterUsersList(query) {
                const q = (query || '').trim().toLowerCase();
                const countEl = document.getElementById('usersSearchCount');
                if (!__allUsersCache || __allUsersCache.length === 0) {
                    if (countEl) countEl.textContent = '';
                    return;
                }
                if (!q) {
                    renderUsersCards(__allUsersCache);
                    if (countEl) countEl.textContent = '전체 ' + __allUsersCache.length + '명';
                    return;
                }
                const filtered = __allUsersCache.filter(u => {
                    const fields = [
                        u.email, u.name, u.phone,
                        u.wallet_address, u.usdt_wallet_address,
                        u.referral_code, u.country
                    ];
                    return fields.some(f => f && String(f).toLowerCase().includes(q));
                });
                renderUsersCards(filtered);
                if (countEl) countEl.textContent = '검색결과 ' + filtered.length + '명 / 전체 ' + __allUsersCache.length + '명';
            }

            // 검색어 지우기
            function clearUsersSearch() {
                const input = document.getElementById('usersSearchInput');
                if (input) input.value = '';
                filterUsersList('');
            }

            // 사용자 목록 로드
            async function loadUsers() {
                try {
                    const response = await axios.get('/api/admin/users');
                    const users = response.data.users || [];
                    __allUsersCache = users;

                    const countEl = document.getElementById('usersSearchCount');
                    if (countEl) countEl.textContent = '전체 ' + users.length + '명';

                    // 기존 검색어가 있으면 검색 결과 유지, 없으면 전체 표시
                    const searchInput = document.getElementById('usersSearchInput');
                    const currentQuery = searchInput ? searchInput.value : '';
                    if (currentQuery && currentQuery.trim()) {
                        filterUsersList(currentQuery);
                    } else {
                        renderUsersCards(users);
                    }
                } catch (error) {
                    console.error('Users list load failed:', error);
                }
            }

            // 회원 카드 HTML 생성 (단일 사용자)
            function __renderUserCardHtml(u) {
                return \`
                        <div class="border border-gray-200 rounded-lg p-6">
                            <div class="flex justify-between items-start">
                                <div class="flex-1">
                                    <div class="flex items-center gap-2 mb-1">
                                        <h3 class="text-lg font-bold text-gray-800">\${esc(u.email)}</h3>
                                        \${u.country ? '<span class="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">' + esc(u.country) + '</span>' : ''}
                                        \${u.language ? '<span class="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs">' + esc(u.language) + '</span>' : ''}
                                    </div>
                                    <p class="text-sm text-gray-600 mb-1"><i class="fas fa-user mr-1"></i>\${esc(u.name)}</p>
                                    <p class="text-sm text-gray-600 mb-1"><i class="fas fa-phone mr-1"></i>\${esc(u.phone) || 'N/A'}</p>
                                    <div class="flex items-center gap-1 sm:gap-2 min-w-0 mb-1">
                                        <p class="text-xs text-gray-500 font-mono truncate"><i class="fas fa-wallet mr-1"></i><span class="text-purple-600 font-semibold">QKEY</span> \${esc(u.wallet_address)}</p>
                                        <button onclick="copyWalletAddress('\${u.wallet_address}')" 
                                            class="flex-shrink-0 px-2 py-1 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded text-xs transition duration-200"
                                            title="' + I18N.t('admin.copy_wallet_title_qkey') + '">
                                            <i class="fas fa-copy"></i>
                                        </button>
                                    </div>
                                    <div class="flex items-center gap-1 sm:gap-2 min-w-0">
                                        <p class="text-xs text-gray-500 font-mono truncate"><i class="fas fa-wallet mr-1"></i><span class="text-green-600 font-semibold">USDT</span> \${u.usdt_wallet_address || 'N/A'}</p>
                                        \${u.usdt_wallet_address ? \`<button onclick="copyWalletAddress('\${u.usdt_wallet_address}')" 
                                            class="flex-shrink-0 px-2 py-1 bg-green-100 hover:bg-green-200 text-green-700 rounded text-xs transition duration-200"
                                            title="' + I18N.t('admin.copy_wallet_title_usdt') + '">
                                            <i class="fas fa-copy"></i>
                                        </button>\` : ''}
                                    </div>
                                </div>
                                <div class="text-right">
                                    <p class="text-xs text-gray-600 mb-1">\${I18N.t('admin.join_date')}</p>
                                    <p class="text-sm font-medium">\${new Date(u.created_at).toLocaleDateString(I18N.getLang())}</p>
                                </div>
                            </div>

                            <div class="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t">
                                <div class="text-center">
                                    <p class="text-xs text-gray-600 mb-1">QTA</p>
                                    <p class="font-bold text-blue-600 text-sm">\${u.qta_balance.toLocaleString()}</p>
                                </div>
                                <div class="text-center">
                                    <p class="text-xs text-gray-600 mb-1">QX</p>
                                    <p class="font-bold text-purple-600 text-sm">\${u.qx_balance.toLocaleString()}</p>
                                </div>
                                <div class="text-center">
                                    <p class="text-xs text-gray-600 mb-1">QKEY</p>
                                    <p class="font-bold text-yellow-600 text-sm">\${(u.qkey_balance || 0).toLocaleString()}</p>
                                </div>
                                <div class="text-center">
                                    <p class="text-xs text-gray-600 mb-1">USDT</p>
                                    <p class="font-bold text-green-600 text-sm">\${(u.usdt_balance || 0).toFixed(2)}</p>
                                </div>
                                <div class="text-center">
                                    <p class="text-xs text-gray-600 mb-1">\${I18N.t('admin.investment_amount')}</p>
                                    <p class="font-bold text-orange-600 text-sm">$\${u.staking_amount.toLocaleString()}</p>
                                </div>
                            </div>

                            <div class="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t flex justify-end gap-2 flex-wrap">
                                <button onclick="showDownlineSales(\${u.id})" 
                                    class="px-3 sm:px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition duration-200 text-xs sm:text-sm">
                                    <i class="fas fa-sitemap mr-1 sm:mr-2"></i>\${I18N.t('admin.downline_sales')}
                                </button>
                                <button onclick="showUserDetail(\${u.id})" 
                                    class="px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition duration-200 text-xs sm:text-sm">
                                    <i class="fas fa-search mr-1 sm:mr-2"></i>\${I18N.t('admin.view_detail')}
                                </button>
                                <button onclick="openAdjustBalanceModal(\${u.id}, '\${esc(u.email)}', '\${esc(u.name)}', \${u.qkey_balance || 0})" 
                                    class="px-3 sm:px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition duration-200 text-xs sm:text-sm">
                                    <i class="fas fa-coins mr-1 sm:mr-2"></i>QKEY 잔액 수정
                                </button>
                                <button onclick="deleteUser(\${u.id}, '\${esc(u.name)}', '\${esc(u.email)}', \${u.staking_amount})" 
                                    class="px-3 sm:px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition duration-200 text-xs sm:text-sm">
                                    <i class="fas fa-user-times mr-1 sm:mr-2"></i>\${I18N.t('admin.force_delete')}
                                </button>
                            </div>
                        </div>
                    \`;
            }

            // 가입 현황 로드
            async function loadSignups() {
                try {
                    const response = await axios.get('/api/admin/signups');
                    const data = response.data;
                    
                    // 통계 업데이트
                    document.getElementById('signupsToday').textContent = data.today + I18N.t('admin.people_unit');
                    document.getElementById('signupsWeek').textContent = data.week + I18N.t('admin.people_unit');
                    document.getElementById('signupsMonth').textContent = data.month + I18N.t('admin.people_unit');
                    
                    const users = data.users || [];
                    const listEl = document.getElementById('signupsList');

                    if (users.length === 0) {
                        listEl.innerHTML = '<p class="text-center text-gray-500 py-8">' + I18N.t('admin.no_signups') + '</p>';
                        return;
                    }

                    listEl.innerHTML = users.map(u => \`
                        <div class="border border-gray-200 rounded-lg p-6">
                            <div class="flex justify-between items-start">
                                <div class="flex-1">
                                    <h3 class="text-lg font-bold text-gray-800 mb-1">\${esc(u.email)}</h3>
                                    <p class="text-sm text-gray-600 mb-1"><i class="fas fa-user mr-1"></i>\${esc(u.name)}</p>
                                    <p class="text-sm text-gray-600 mb-1"><i class="fas fa-phone mr-1"></i>\${esc(u.phone) || 'N/A'}</p>
                                    <p class="text-xs text-gray-500 font-mono truncate"><i class="fas fa-wallet mr-1"></i><span class="text-purple-600 font-semibold">QKEY</span> \${esc(u.wallet_address)}</p>
                                    <p class="text-xs text-gray-500 font-mono truncate"><i class="fas fa-wallet mr-1"></i><span class="text-green-600 font-semibold">USDT</span> \${esc(u.usdt_wallet_address) || 'N/A'}</p>
                                </div>
                                <div class="text-right">
                                    <p class="text-xs text-gray-600 mb-1">\${I18N.t('admin.join_date')}</p>
                                    <p class="text-sm font-medium">\${new Date(u.created_at).toLocaleDateString(I18N.getLang(), { 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}</p>
                                </div>
                            </div>
                        </div>
                    \`).join('');
                } catch (error) {
                    console.error('Signups load failed:', error);
                }
            }

            // 지갑주소 복사
            function copyWalletAddress(address) {
                // Clipboard API 사용 (최신 브라우저)
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(address).then(() => {
                        alert(I18N.t('admin.wallet_copied') + '\\n\\n' + address);
                    }).catch(err => {
                        console.error('Copy failed:', err);
                        fallbackCopy(address);
                    });
                } else {
                    // Fallback: execCommand 사용 (구형 브라우저)
                    fallbackCopy(address);
                }
            }

            // Fallback 복사 함수
            function fallbackCopy(text) {
                const textarea = document.createElement('textarea');
                textarea.value = text;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                
                try {
                    document.execCommand('copy');
                    alert(I18N.t('admin.wallet_copied') + '\\n\\n' + text);
                } catch (err) {
                    alert(I18N.t('admin.copy_fail'));
                }
                
                document.body.removeChild(textarea);
            }

            // ============================================
            // 배당 현황 로드
            // ============================================
            // 추천 보상 캐시 (필터링용)
            var _referralRewardsCache = [];

            async function loadRewardsStatus() {
                try {
                    const response = await axios.get('/api/admin/rewards');
                    if (!response.data.success) return;
                    const { stats, today, referralStats, rewards, referrals } = response.data;

                    document.getElementById('rewardsTotalQkey').textContent = Math.round(stats.totalQkey).toLocaleString() + ' QKEY';
                    document.getElementById('rewardsTodayQkey').textContent = Math.round(today.totalQkey).toLocaleString() + ' QKEY';
                    document.getElementById('rewardsTotalCount').textContent = stats.totalCount.toLocaleString() + I18N.t('admin.cases_unit');
                    document.getElementById('rewardsReferralTotal').textContent = Math.round(referralStats.totalQkey).toLocaleString() + ' QKEY';
                    document.getElementById('rewardsDirectTotal').textContent = Math.round(referralStats.directTotal).toLocaleString();
                    document.getElementById('rewardsLevel1Total').textContent = Math.round(referralStats.level1Total).toLocaleString();
                    document.getElementById('rewardsLevel2Total').textContent = Math.round(referralStats.level2Total).toLocaleString();

                    var tbody = document.getElementById('rewardsTableBody');
                    if (rewards.length === 0) {
                        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-8 text-gray-500">' + I18N.t('admin.no_reward_history') + '</td></tr>';
                    } else {
                        tbody.innerHTML = rewards.map(function(r) {
                            return '<tr class="hover:bg-gray-50">' +
                                '<td class="px-2 sm:px-3 py-2 whitespace-nowrap">' + r.reward_date + '</td>' +
                                '<td class="px-2 sm:px-3 py-2"><span class="font-medium">' + esc(r.name) + '</span><br><span class="text-xs text-gray-500">' + esc(r.email) + '</span></td>' +
                                '<td class="px-2 sm:px-3 py-2 text-right">$' + (r.staking_amount || 0).toLocaleString() + '</td>' +
                                '<td class="px-2 sm:px-3 py-2 text-right">' + (r.daily_rate ? (r.daily_rate * 100).toFixed(1) + '%' : '-') + '</td>' +
                                '<td class="px-2 sm:px-3 py-2 text-right font-bold text-yellow-600">' + Math.round(r.qkey_amount).toLocaleString() + '</td>' +
                            '</tr>';
                        }).join('');
                    }

                    // 직접판매/성과금 내역 렌더링
                    _referralRewardsCache = referrals || [];
                    renderReferralTable();
                } catch (error) {
                    console.error('Rewards status load failed:', error);
                }
            }

            // 직접판매/성과금 내역 렌더 (필터 적용)
            function renderReferralTable() {
                var tbody = document.getElementById('referralRewardsTableBody');
                if (!tbody) return;
                var filterEl = document.getElementById('referralFilterLevel');
                var filter = filterEl ? filterEl.value : '';
                var rows = _referralRewardsCache || [];
                if (filter !== '') {
                    var lv = parseInt(filter);
                    rows = rows.filter(function(r) { return Number(r.level) === lv; });
                }
                if (rows.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-gray-500">내역이 없습니다</td></tr>';
                    return;
                }
                var labels = { 0: '직접판매', 1: '1대성과금', 2: '2대성과금' };
                var colors = { 0: 'orange', 1: 'blue', 2: 'purple' };
                tbody.innerHTML = rows.map(function(r) {
                    var lv = Number(r.level);
                    var label = labels[lv] || ('레벨' + lv);
                    var color = colors[lv] || 'gray';
                    return '<tr class="hover:bg-gray-50">' +
                        '<td class="px-2 sm:px-3 py-2 whitespace-nowrap text-xs">' + esc(r.reward_date || '') + '</td>' +
                        '<td class="px-2 sm:px-3 py-2 text-center"><span class="text-xs px-2 py-0.5 bg-' + color + '-100 text-' + color + '-700 rounded-full font-bold">' + label + '</span></td>' +
                        '<td class="px-2 sm:px-3 py-2"><span class="font-medium">' + esc(r.referrer_name || '-') + '</span><br><span class="text-xs text-gray-500">' + esc(r.referrer_email || '') + '</span></td>' +
                        '<td class="px-2 sm:px-3 py-2"><span class="font-medium">' + esc(r.referee_name || '-') + '</span><br><span class="text-xs text-gray-500">' + esc(r.referee_email || '') + '</span></td>' +
                        '<td class="px-2 sm:px-3 py-2 text-right">$' + Number(r.original_amount || 0).toLocaleString() + '</td>' +
                        '<td class="px-2 sm:px-3 py-2 text-right font-bold text-' + color + '-600">' + Math.round(Number(r.reward_amount || 0)).toLocaleString() + '</td>' +
                    '</tr>';
                }).join('');
            }

            // 일일배당 CSV 다운로드
            function exportDailyRewardsCSV() {
                axios.get('/api/admin/export/daily-rewards', { responseType: 'blob' }).then(function(response) {
                    var blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
                    var link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    var now = new Date(Date.now() + 9*60*60*1000).toISOString().slice(0, 10);
                    link.download = 'daily_rewards_' + now + '.csv';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }).catch(function(e) { alert('일일배당 다운로드 실패'); });
            }

            // 직접판매/성과금 CSV 다운로드
            function exportReferralRewardsCSV() {
                axios.get('/api/admin/export/referrals', { responseType: 'blob' }).then(function(response) {
                    var blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
                    var link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    var now = new Date(Date.now() + 9*60*60*1000).toISOString().slice(0, 10);
                    link.download = 'referral_rewards_' + now + '.csv';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }).catch(function(e) { alert('직판/성과금 다운로드 실패'); });
            }

            // 휴일에 잘못 지급된 배당 회수 (본인 일일배당 + 1대/2대 매칭수당)
            //   - daily_rewards / referral_rewards 행 삭제
            //   - users.qkey_balance 차감
            //   - transactions 에 회수 로그 INSERT
            async function rollbackDailyRewards() {
                var todayKst = new Date(Date.now() + 9*60*60*1000).toISOString().slice(0,10);
                var dateStr = prompt('회수할 날짜를 입력하세요 (YYYY-MM-DD)\\n\\n예) 2026-05-01 (근로자의 날)\\n\\n해당 날짜의 본인 일일배당 + 1대/2대 매칭수당이 모두 회수되며,\\n각 회원의 QKEY 잔액에서 차감됩니다.', todayKst);
                if (!dateStr) return;
                if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(dateStr)) { alert('날짜 형식이 잘못되었습니다 (YYYY-MM-DD)'); return; }
                if (!confirm('정말 ' + dateStr + ' 의 모든 일일배당 + 매칭수당을 회수하시겠습니까?\\n\\n⚠️ 이 작업은 되돌릴 수 없습니다.\\n각 회원의 QKEY 잔액에서 즉시 차감됩니다.')) return;
                try {
                    var res = await axios.post('/api/admin/rewards/rollback-daily', { date: dateStr });
                    if (res.data && res.data.success) {
                        alert('✅ 회수 완료\\n\\n' + (res.data.message || '') +
                            '\\n\\n· 본인배당: ' + (res.data.dailyRolledBack || 0) + '건 / -' + Number(res.data.dailyQkeyTotal || 0).toLocaleString() + ' QKEY' +
                            '\\n· 매칭수당: ' + (res.data.referralRolledBack || 0) + '건 / -' + Number(res.data.referralQkeyTotal || 0).toLocaleString() + ' QKEY' +
                            '\\n· 합계: -' + Number(res.data.grandTotalQkey || 0).toLocaleString() + ' QKEY');
                        try { if (typeof loadRewards === 'function') loadRewards(); } catch(e) {}
                        try { if (typeof loadStatistics === 'function') loadStatistics(); } catch(e) {}
                    } else {
                        alert((res.data && res.data.error) || '회수 처리 실패');
                    }
                } catch(e) {
                    alert((e.response && e.response.data && e.response.data.error) || '회수 처리 중 오류가 발생했습니다');
                }
            }

            // ============================================
            // 출금 관리 로드
            // ============================================
            var _adminWithdrawalsRefreshTimer = null;
            async function loadWithdrawals() {
                try {
                    const response = await axios.get('/api/admin/withdrawals?t=' + Date.now());
                    if (!response.data.success) return;
                    const { stats, withdrawals } = response.data;

                    document.getElementById('wdPendingCount').textContent = stats.pendingCount;
                    document.getElementById('wdApprovedCount').textContent = stats.approvedCount;
                    document.getElementById('wdRejectedCount').textContent = stats.rejectedCount;
                    document.getElementById('wdTotalCount').textContent = stats.totalCount;
                    // 취소 카운트는 별도 표시 영역이 있으면 갱신
                    var cancEl = document.getElementById('wdCancelledCount');
                    if (cancEl) cancEl.textContent = stats.cancelledCount || 0;

                    var listEl = document.getElementById('withdrawalsList');
                    if (withdrawals.length === 0) {
                        listEl.innerHTML = '<p class="text-center text-gray-500 py-8">' + I18N.t('admin.no_withdrawal_history') + '</p>';
                        return;
                    }

                    listEl.innerHTML = withdrawals.map(function(w) {
                        var statusColor = w.status === 'pending' ? 'yellow' : w.status === 'approved' ? 'green' : w.status === 'cancelled' ? 'gray' : 'red';
                        var statusText = w.status === 'pending' ? I18N.t('admin.wd_pending')
                            : w.status === 'approved' ? I18N.t('admin.wd_approved')
                            : w.status === 'cancelled' ? '취소됨(환불완료)'
                            : I18N.t('admin.wd_rejected');
                        var coinColor = w.coin_type === 'QTA' ? 'blue' : w.coin_type === 'QX' ? 'purple' : w.coin_type === 'QKEY' ? 'yellow' : 'green';
                        var amountFmt = w.coin_type === 'USDT' ? Number(w.amount).toFixed(2) : parseFloat(w.amount).toLocaleString();

                        // 취소된 출금: 취소 메타 박스
                        var cancelInfo = '';
                        if (w.status === 'cancelled') {
                            var cDate = w.cancelled_at ? new Date(w.cancelled_at).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'}) : '-';
                            var cBy = w.cancelled_by === 'admin' ? '관리자' : (w.cancelled_by === 'user' ? '본인' : '시스템');
                            cancelInfo = '<div class="mt-2 p-2 bg-red-50 border border-red-200 rounded text-[11px] text-red-700">' +
                                '<i class="fas fa-times-circle mr-1"></i>' + cBy + ' 취소 / ' + cDate + ' / ' + amountFmt + ' ' + w.coin_type + ' 환불완료' +
                            '</div>';
                        }

                        return '<div class="border rounded-lg p-3 sm:p-4 border-' + statusColor + '-200 bg-' + statusColor + '-50' + (w.status === 'cancelled' ? ' opacity-90' : '') + '">' +
                            '<div class="flex flex-col sm:flex-row justify-between items-start gap-2 mb-2">' +
                                '<div class="flex-1">' +
                                    '<div class="flex items-center gap-2 mb-1">' +
                                        '<span class="px-2 py-0.5 bg-' + statusColor + '-100 text-' + statusColor + '-700 rounded text-xs font-bold">' + statusText + '</span>' +
                                        '<span class="px-2 py-0.5 bg-' + coinColor + '-100 text-' + coinColor + '-700 rounded text-xs font-bold">' + w.coin_type + '</span>' +
                                        '<span class="text-xs text-gray-500">' + new Date(w.created_at).toLocaleString(I18N.getLang()) + '</span>' +
                                    '</div>' +
                                    '<p class="text-sm font-medium text-gray-800">' + esc(w.name) + ' <span class="text-gray-500 font-normal">(' + esc(w.email) + ')</span></p>' +
                                '</div>' +
                                '<p class="text-xl sm:text-2xl font-bold text-' + coinColor + '-600 ' + (w.status === 'cancelled' ? 'line-through' : '') + '">' + amountFmt + ' ' + w.coin_type + '</p>' +
                            '</div>' +
                            '<div class="flex items-center gap-2 text-xs text-gray-600 mb-2">' +
                                '<i class="fas fa-wallet"></i>' +
                                '<span class="font-mono truncate">' + esc(w.wallet_address) + '</span>' +
                                '<button onclick="copyWalletAddress(\\'' + w.wallet_address + '\\')" class="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-xs"><i class="fas fa-copy"></i></button>' +
                            '</div>' +
                            cancelInfo +
                            (w.status === 'pending' ? 
                                '<div class="flex gap-2">' +
                                    '<button onclick="approveWithdrawal(' + w.id + ')" class="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-bold transition"><i class="fas fa-check mr-1"></i>' + I18N.t('admin.approve') + '</button>' +
                                    '<button onclick="rejectWithdrawal(' + w.id + ')" class="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold transition"><i class="fas fa-times mr-1"></i>' + I18N.t('admin.reject_refund') + '</button>' +
                                '</div>' 
                            : '') +
                        '</div>';
                    }).join('');
                } catch (error) {
                    console.error('Withdrawals load failed:', error);
                }

                // 실시간 자동 새로고침 (5초마다, 출금탭이 활성일 때만)
                // 사용자가 출금 취소하면 5초 이내 어드민 화면에 자동 반영
                if (_adminWithdrawalsRefreshTimer) clearInterval(_adminWithdrawalsRefreshTimer);
                if (currentTab === 'withdrawals') {
                    _adminWithdrawalsRefreshTimer = setInterval(function() {
                        if (currentTab === 'withdrawals') loadWithdrawals();
                        else { clearInterval(_adminWithdrawalsRefreshTimer); _adminWithdrawalsRefreshTimer = null; }
                    }, 5000);
                }
            }

            // 출금 승인
            async function approveWithdrawal(withdrawalId) {
                if (!confirm(I18N.t('admin.wd_approve_confirm'))) return;
                try {
                    const response = await axios.post('/api/admin/withdrawal/approve/' + withdrawalId);
                    if (response.data.success) {
                        alert(response.data.message);
                        loadWithdrawals();
                    }
                } catch (error) {
                    alert(error.response?.data?.error || I18N.t('admin.wd_approve_fail'));
                }
            }

            // 출금 거절 (환불)
            async function rejectWithdrawal(withdrawalId) {
                if (!confirm(I18N.t('admin.wd_reject_confirm'))) return;
                try {
                    const response = await axios.post('/api/admin/withdrawal/reject/' + withdrawalId);
                    if (response.data.success) {
                        alert(response.data.message);
                        loadWithdrawals();
                    }
                } catch (error) {
                    alert(error.response?.data?.error || I18N.t('admin.wd_reject_fail'));
                }
            }

            // ============================================
            // 일일 배당금 지급 실행 (사장님 2026-05-07 지시로 비활성화 — cron 자동 전용)
            // ============================================
            async function executeDailyReward() {
                alert('일일 배당은 매 평일 KST 07:00 cron 자동 실행 전용입니다. 개별 회원 보정은 회원관리 → 잔액 조정 또는 /api/admin/rewards/manual-adjust 를 사용해 주세요.');
                return;
            }

            // ============================================
            // 회원 상세 보기
            // ============================================
            async function showUserDetail(userId) {
                document.getElementById('userDetailModal').classList.remove('hidden');
                var content = document.getElementById('userDetailContent');
                content.innerHTML = '<p class="text-center py-8 text-gray-500"><i class="fas fa-spinner fa-spin mr-2"></i>' + I18N.t('admin.loading') + '</p>';

                try {
                    const response = await axios.get('/api/admin/user/' + userId);
                    if (!response.data.success) return;
                    var u = response.data.user;
                    var stakings = response.data.stakings || [];
                    var rewards = response.data.rewards || [];
                    var withdrawals = response.data.withdrawals || [];
                    var transactions = response.data.transactions || [];
                    var referrer = response.data.referrer;
                    var referralCount = response.data.referralCount || 0;

                    content.innerHTML = 
                        // 기본 정보
                        '<div class="mb-4">' +
                            '<h4 class="font-bold text-gray-800 text-lg mb-2">' + esc(u.email) + '</h4>' +
                            '<div class="grid grid-cols-2 gap-2 text-sm">' +
                                '<div><span class="text-gray-500">' + I18N.t('admin.col_name') + ':</span> ' + esc(u.name) + '</div>' +
                                '<div><span class="text-gray-500">' + I18N.t('admin.phone_label') + '</span> ' + esc(u.phone || 'N/A') + '</div>' +
                                '<div class="col-span-2"><span class="text-gray-500">' + I18N.t('admin.qkey_wallet_label') + '</span> <span class="font-mono text-xs">' + esc(u.wallet_address) + '</span></div>' +
                                '<div class="col-span-2"><span class="text-gray-500">' + I18N.t('admin.usdt_wallet_label') + '</span> <span class="font-mono text-xs">' + esc(u.usdt_wallet_address || 'N/A') + '</span></div>' +
                                '<div><span class="text-gray-500">' + I18N.t('admin.referral_code_label') + '</span> <span class="font-bold text-purple-600">' + esc(u.referral_code || '-') + '</span></div>' +
                                '<div><span class="text-gray-500">' + I18N.t('admin.referrer_label') + '</span> ' + (referrer ? esc(referrer.name) + ' (' + esc(referrer.email) + ')' : I18N.t('admin.referrer_none')) + '</div>' +
                                '<div><span class="text-gray-500">' + I18N.t('admin.referees_label') + '</span> ' + referralCount + I18N.t('admin.people_unit') + '</div>' +
                                '<div><span class="text-gray-500">' + I18N.t('admin.join_date') + ':</span> ' + new Date(u.created_at).toLocaleString(I18N.getLang()) + '</div>' +
                            '</div>' +
                        '</div>' +
                        // 잔액 + 리셋 버튼
                        '<div class="grid grid-cols-4 gap-2 mb-2">' +
                            '<div class="bg-blue-50 rounded-lg p-2 text-center border border-blue-200"><p class="text-xs text-gray-500">QTA</p><p class="font-bold text-blue-600 text-sm">' + (u.qta_balance || 0).toLocaleString() + '</p></div>' +
                            '<div class="bg-purple-50 rounded-lg p-2 text-center border border-purple-200"><p class="text-xs text-gray-500">QX</p><p class="font-bold text-purple-600 text-sm">' + (u.qx_balance || 0).toLocaleString() + '</p></div>' +
                            '<div class="bg-yellow-50 rounded-lg p-2 text-center border border-yellow-200"><p class="text-xs text-gray-500">QKEY</p><p class="font-bold text-yellow-600 text-sm">' + (u.qkey_balance || 0).toLocaleString() + '</p></div>' +
                            '<div class="bg-green-50 rounded-lg p-2 text-center border border-green-200"><p class="text-xs text-gray-500">USDT</p><p class="font-bold text-green-600 text-sm">' + (u.usdt_balance || 0).toFixed(2) + '</p></div>' +
                        '</div>' +
                        (((u.qta_balance || 0) > 0 || (u.qx_balance || 0) > 0 || (u.qkey_balance || 0) > 0) ? '<div class="text-center mb-4"><button onclick="resetAllCoins(' + u.id + ')" class="px-4 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 shadow"><i class="fas fa-undo mr-1"></i>코인 3종 리셋 (QTA/QX/QKEY + 추천수당 삭제)</button></div>' : '<div class="mb-4"></div>') +
                        // 스테이킹
                        '<h4 class="font-bold text-gray-700 mb-2 text-sm"><i class="fas fa-chart-line mr-1 text-purple-600"></i>' + I18N.t('admin.staking_section') + ' (' + stakings.length + I18N.t('admin.cases_unit') + ')</h4>' +
                        (stakings.length > 0 ? '<div class="overflow-x-auto mb-4"><table class="w-full text-xs"><thead class="bg-gray-100"><tr><th class="px-2 py-1 text-left">' + I18N.t('admin.amount_label') + '</th><th class="px-2 py-1">' + I18N.t('admin.status_label') + '</th><th class="px-2 py-1">' + I18N.t('admin.period_label') + '</th><th class="px-2 py-1">' + I18N.t('admin.rate_label') + '</th><th class="px-2 py-1">' + I18N.t('admin.start_date') + '</th><th class="px-2 py-1">' + I18N.t('admin.end_date') + '</th></tr></thead><tbody class="divide-y">' +
                            stakings.map(function(s) {
                                var stColor = s.status === 'active' ? 'green' : s.status === 'pending' ? 'yellow' : s.status === 'rejected' ? 'red' : 'gray';
                                var stText = s.status === 'active' ? I18N.t('admin.status_active') : s.status === 'pending' ? I18N.t('admin.status_pending') : s.status === 'rejected' ? I18N.t('admin.status_rejected') : I18N.t('admin.status_completed');
                                return '<tr><td class="px-2 py-1 font-bold">$' + s.amount.toLocaleString() + '</td><td class="px-2 py-1 text-center"><span class="px-1 py-0.5 bg-' + stColor + '-100 text-' + stColor + '-700 rounded text-xs">' + stText + '</span></td><td class="px-2 py-1 text-center">' + (s.period_days || 0) + I18N.t('admin.days_unit') + '</td><td class="px-2 py-1 text-center">' + (s.daily_rate ? (s.daily_rate * 100).toFixed(1) + '%' : '-') + '</td><td class="px-2 py-1">' + (s.start_date ? new Date(s.start_date).toLocaleDateString(I18N.getLang()) : '-') + '</td><td class="px-2 py-1">' + (s.end_date ? new Date(s.end_date).toLocaleDateString(I18N.getLang()) : '-') + '</td></tr>';
                            }).join('') +
                        '</tbody></table></div>' : '<p class="text-xs text-gray-500 mb-4">' + I18N.t('admin.no_staking') + '</p>') +
                        // Reward history
                        '<h4 class="font-bold text-gray-700 mb-2 text-sm"><i class="fas fa-coins mr-1 text-yellow-600"></i>' + I18N.t('admin.reward_section') + ' (' + rewards.length + I18N.t('admin.cases_unit') + ')</h4>' +
                        (rewards.length > 0 ? '<div class="overflow-x-auto mb-4"><table class="w-full text-xs"><thead class="bg-gray-100"><tr><th class="px-2 py-1 text-left">' + I18N.t('admin.date_label') + '</th><th class="px-2 py-1 text-right">QKEY</th><th class="px-2 py-1 text-right">' + I18N.t('admin.investment_amount') + '</th></tr></thead><tbody class="divide-y">' +
                            rewards.slice(0, 20).map(function(r) {
                                // ★ reward_date 는 이미 KST 'YYYY-MM-DD' 문자열 (백엔드 기록 시점부터 KST). 그대로 사용
                                //   사용자 화면과 동일한 reward_date 라벨을 표시해 어드민-사용자 간 1:1 일치 보장
                                return '<tr><td class="px-2 py-1">' + (r.reward_date || '-') + '</td><td class="px-2 py-1 text-right font-bold text-yellow-600">' + Math.round(r.usdt_amount).toLocaleString() + '</td><td class="px-2 py-1 text-right">$' + (r.staking_amount || 0).toLocaleString() + '</td></tr>';
                            }).join('') +
                        '</tbody></table></div>' : '<p class="text-xs text-gray-500 mb-4">' + I18N.t('admin.no_rewards') + '</p>') +
                        // Withdrawal history
                        '<h4 class="font-bold text-gray-700 mb-2 text-sm"><i class="fas fa-money-bill-wave mr-1 text-green-600"></i>' + I18N.t('admin.withdrawal_section') + ' (' + withdrawals.length + I18N.t('admin.cases_unit') + ')</h4>' +
                        (withdrawals.length > 0 ? '<div class="overflow-x-auto mb-4"><table class="w-full text-xs"><thead class="bg-gray-100"><tr><th class="px-2 py-1 text-left">' + I18N.t('admin.date_label') + '</th><th class="px-2 py-1">' + I18N.t('admin.coin_label') + '</th><th class="px-2 py-1 text-right">' + I18N.t('admin.qty_label') + '</th><th class="px-2 py-1">' + I18N.t('admin.status_label') + '</th></tr></thead><tbody class="divide-y">' +
                            withdrawals.map(function(w) {
                                var wColor = w.status === 'pending' ? 'yellow' : w.status === 'approved' ? 'green' : 'red';
                                var wText = w.status === 'pending' ? I18N.t('admin.wd_pending') : w.status === 'approved' ? I18N.t('admin.wd_approved') : I18N.t('admin.wd_rejected');
                                // ★ KST(Asia/Seoul) 강제 — 사용자 화면과 동일하게 표시 (UTC 보임 버그 수정)
                                var wRaw = w.created_at;
                                var wIso = (typeof wRaw === 'string' && wRaw.indexOf('T') === -1) ? (wRaw.replace(' ', 'T') + 'Z') : wRaw;
                                var wDate = new Date(wIso);
                                var wDateStr = isNaN(wDate.getTime()) ? (wRaw || '-') : wDate.toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' });
                                return '<tr><td class="px-2 py-1">' + wDateStr + '</td><td class="px-2 py-1 text-center font-bold">' + w.coin_type + '</td><td class="px-2 py-1 text-right">' + parseFloat(w.amount).toLocaleString() + '</td><td class="px-2 py-1 text-center"><span class="px-1 py-0.5 bg-' + wColor + '-100 text-' + wColor + '-700 rounded text-xs">' + wText + '</span></td></tr>';
                            }).join('') +
                        '</tbody></table></div>' : '<p class="text-xs text-gray-500 mb-4">' + I18N.t('admin.no_withdrawals') + '</p>') +
                        // Recent transactions
                        '<h4 class="font-bold text-gray-700 mb-2 text-sm"><i class="fas fa-exchange-alt mr-1 text-blue-600"></i>' + I18N.t('admin.tx_section') + ' (' + transactions.length + I18N.t('admin.cases_unit') + ')</h4>' +
                        (transactions.length > 0 ? '<div class="overflow-x-auto"><table class="w-full text-xs"><thead class="bg-gray-100"><tr><th class="px-2 py-1 text-left">' + I18N.t('admin.date_label') + '</th><th class="px-2 py-1">' + I18N.t('admin.type_label') + '</th><th class="px-2 py-1">' + I18N.t('admin.coin_label') + '</th><th class="px-2 py-1 text-right">' + I18N.t('admin.qty_label') + '</th><th class="px-2 py-1 text-left">' + I18N.t('admin.desc_label') + '</th></tr></thead><tbody class="divide-y">' +
                            transactions.slice(0, 20).map(function(t) {
                                // ★ KST(Asia/Seoul) 강제 — 사용자 화면과 동일하게 표시 (UTC 보임 버그 수정)
                                //   기존: new Date(t.created_at).toLocaleDateString() → 브라우저 로케일 의존, UTC 22:54 → 5/6 으로 잘못 표시
                                //   수정: 'YYYY-MM-DD HH:mm' KST 24h 풀표기 → 5/6 04:00 vs 5/7 07:54 명확 구분
                                var tRaw = t.created_at;
                                var tIso = (typeof tRaw === 'string' && tRaw.indexOf('T') === -1) ? (tRaw.replace(' ', 'T') + 'Z') : tRaw;
                                var tDate = new Date(tIso);
                                var tDateStr;
                                if (isNaN(tDate.getTime())) {
                                    tDateStr = (tRaw || '-');
                                } else {
                                    var parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(tDate);
                                    var p = {};
                                    for (var i = 0; i < parts.length; i++) { p[parts[i].type] = parts[i].value; }
                                    tDateStr = p.year + '-' + p.month + '-' + p.day + ' ' + (p.hour === '24' ? '00' : p.hour) + ':' + p.minute;
                                }
                                return '<tr><td class="px-2 py-1 whitespace-nowrap">' + tDateStr + '</td><td class="px-2 py-1 text-center">' + t.type + '</td><td class="px-2 py-1 text-center font-bold">' + t.coin_type + '</td><td class="px-2 py-1 text-right">' + parseFloat(t.amount).toLocaleString() + '</td><td class="px-2 py-1 truncate max-w-[150px]" title="' + esc(t.description || '') + '">' + esc(t.description || '-') + '</td></tr>';
                            }).join('') +
                        '</tbody></table></div>' : '<p class="text-xs text-gray-500">' + I18N.t('admin.no_tx') + '</p>');

                } catch (error) {
                    console.error('User detail load failed:', error);
                    content.innerHTML = '<p class="text-center py-8 text-red-500">' + I18N.t('admin.user_detail_fail') + '</p>';
                }
            }

            function closeUserDetail() {
                document.getElementById('userDetailModal').classList.add('hidden');
            }

            // 코인 3종 잔액 리셋 (QTA+QX+QKEY 잔액 0, 스테이킹/진입금액/데일리배당은 계속 진행)
            async function resetAllCoins(userId) {
                if (!confirm('이 사용자의 코인 3종(QTA/QX/QKEY) 잔액을 0으로 리셋하시겠습니까?\\n\\n⚠️ 0으로 리셋되는 항목:\\n  - QTA 잔액 → 0\\n  - QX 잔액 → 0\\n  - QKEY 잔액 → 0\\n  - 본인의 코인3종 거래내역 삭제\\n  - 본인이 받은 직판수당(direct_referral) 삭제\\n     → 사용자 화면 「Direct Sales」가 자동 0으로 표시됨\\n\\n✅ 그대로 유지되는 항목:\\n  - USDT 잔액\\n  - 스테이킹: 사용자 「내 스테이킹 목록」에 그대로 노출\\n  - 진입금액(\"퀀타리움구매\" 박스): 원래 금액 그대로\\n  - 데일리 배당: 매일 지급 → QKEY 잔액으로 누적\\n  - 추천인 매칭수당: 추천인에게 정상 지급\\n  - 출금내역 / 주문내역\\n\\n📊 어드민 매출 통계: 「리셋된 매출」로 별도 식별됨.\\n\\n이 작업은 되돌릴 수 없습니다.')) return;
                try {
                    var res = await axios.post('/api/admin/user/' + userId + '/reset-all');
                    if (res.data.success) {
                        var del = res.data.deletedRecords || {};
                        var prev = res.data.previousBalances || {};
                        var msg = '코인 3종 리셋 완료!\\n\\n';
                        msg += 'QTA: ' + (prev.QTA || 0).toLocaleString() + ' → 0\\n';
                        msg += 'QX: ' + (prev.QX || 0).toLocaleString() + ' → 0\\n';
                        msg += 'QKEY: ' + (prev.QKEY || 0).toLocaleString() + ' → 0\\n';
                        msg += '\\n처리된 기록:\\n';
                        msg += '  - 코인3종 거래내역 삭제: ' + (del.transactions || 0) + '건\\n';
                        msg += '  - 직판수당 삭제(본인이 받은): ' + (del.referralRewards || 0) + '건\\n';
                        msg += '  - 스테이킹 리셋 마킹(매출 통계용): ' + (del.markedStakings || 0) + '건\\n';
                        msg += '\\n그대로 유지되는 항목:\\n';
                        msg += '  - 「내 스테이킹 목록」 — 진입금액/데일리 진행 그대로 표시\\n';
                        msg += '  - 데일리 배당 — 매일 QKEY 잔액으로 누적\\n';
                        msg += '  - 추천인 매칭수당 — 추천인에게 정상 지급';
                        alert(msg);
                        showUserDetail(userId);
                        loadUsers();
                    }
                } catch (err) {
                    alert('코인 리셋 실패: ' + (err.response?.data?.error || err.message));
                }
            }

            // ============================================
            // QKEY 잔액 임의 수정 (관리자 보정)
            // ============================================
            let _adjCtx = { userId: 0, email: '', name: '', currentBalance: 0 };

            function openAdjustBalanceModal(userId, email, name, currentBalance) {
                _adjCtx = { userId: userId, email: email, name: name, currentBalance: Number(currentBalance) || 0 };
                document.getElementById('adjUserInfo').textContent = '#' + userId + ' ' + name + ' (' + email + ')';
                document.getElementById('adjCurrentBalance').textContent = (_adjCtx.currentBalance).toLocaleString() + ' QKEY';
                document.getElementById('adjMode').value = 'delta';
                document.getElementById('adjAmount').value = '';
                document.getElementById('adjDescription').value = '';
                document.getElementById('adjPreview').textContent = '금액을 입력하면 미리보기가 표시됩니다';
                var dp = document.getElementById('adjDescPreview');
                if (dp) dp.textContent = '';
                var m = document.getElementById('adjustBalanceModal');
                m.classList.remove('hidden');
                m.classList.add('flex');
            }

            function closeAdjustBalanceModal() {
                var m = document.getElementById('adjustBalanceModal');
                m.classList.add('hidden');
                m.classList.remove('flex');
            }

            function updateAdjPreview() {
                var mode = document.getElementById('adjMode').value;
                var amt = Number(document.getElementById('adjAmount').value);
                var preview = document.getElementById('adjPreview');
                var descPreview = document.getElementById('adjDescPreview');
                if (!amt && amt !== 0) { 
                    preview.textContent = '금액을 입력하면 미리보기가 표시됩니다'; 
                    if (descPreview) descPreview.textContent = '';
                    return; 
                }
                var cur = _adjCtx.currentBalance;
                var newBal, delta;
                if (mode === 'set') { newBal = amt; delta = amt - cur; }
                else { newBal = cur + amt; delta = amt; }
                var sign = delta >= 0 ? '+' : '';
                var arrow = delta >= 0 ? '▲증액' : '▼차감';
                var deltaColor = delta >= 0 ? 'text-emerald-700' : 'text-rose-700';
                var deltaBg = delta >= 0 ? 'bg-emerald-50' : 'bg-rose-50';
                preview.innerHTML = 
                    '<div class="' + deltaBg + ' rounded p-2 mb-1">' +
                    '<span class="font-bold ' + deltaColor + '">' + arrow + ' ' + sign + Math.abs(delta).toLocaleString() + ' QKEY</span>' +
                    '</div>' +
                    '이전 ' + cur.toLocaleString() + ' QKEY → 이후 <span class="font-bold text-yellow-700">' + newBal.toLocaleString() + ' QKEY</span>';
                // 사용자측에 표시될 description 미리보기
                var reason = (document.getElementById('adjDescription').value || '').trim();
                if (descPreview) {
                    if (reason) {
                        descPreview.innerHTML = '<span class="text-gray-500">사용자 화면 표시:</span> <span class="font-mono text-gray-700">[어드민 수정] ' + arrow + ' ' + sign + Math.abs(delta).toLocaleString() + ' QKEY (이전 ' + cur.toLocaleString() + ' → 이후 ' + newBal.toLocaleString() + ') | 사유: ' + reason + '</span>';
                    } else {
                        descPreview.innerHTML = '<span class="text-red-500">⚠️ 사유를 입력하면 사용자측 표시 형식이 미리보기됩니다</span>';
                    }
                }
            }

            async function submitAdjustBalance() {
                var mode = document.getElementById('adjMode').value;
                var amtRaw = document.getElementById('adjAmount').value;
                if (amtRaw === '' || amtRaw === null) { alert('금액을 입력해주세요'); return; }
                var amt = Number(amtRaw);
                if (isNaN(amt)) { alert('유효한 숫자를 입력해주세요'); return; }
                var reason = (document.getElementById('adjDescription').value || '').trim();
                if (!reason || reason === '관리자 보정' || reason.length < 3) {
                    alert('⚠️ 수정 사유를 구체적으로 입력해주세요 (최소 3자 이상).\\n\\n사유는 사용자측 보상 내역에 그대로 노출됩니다.');
                    document.getElementById('adjDescription').focus();
                    return;
                }
                var cur = _adjCtx.currentBalance;
                var newBal = (mode === 'set') ? amt : (cur + amt);
                var delta = (mode === 'set') ? (amt - cur) : amt;
                if (Math.abs(delta) < 0.0001) { alert('변경 사항이 없습니다'); return; }
                var sign = delta >= 0 ? '+' : '';
                var arrow = delta >= 0 ? '▲증액' : '▼차감';
                if (!confirm(
                    '★ QKEY 잔액 수정 확인 ★\\n\\n' +
                    '회원: #' + _adjCtx.userId + ' ' + _adjCtx.name + ' (' + _adjCtx.email + ')\\n' +
                    '─────────────────────────\\n' +
                    arrow + ' ' + sign + Math.abs(delta).toLocaleString() + ' QKEY\\n' +
                    '이전 잔액: ' + cur.toLocaleString() + ' QKEY\\n' +
                    '이후 잔액: ' + newBal.toLocaleString() + ' QKEY\\n' +
                    '─────────────────────────\\n' +
                    '사유: ' + reason + '\\n\\n' +
                    '※ 이 내역은 사용자측 "수당 보상 내역" 에 그대로 표시됩니다.\\n\\n' +
                    '적용하시겠습니까?'
                )) return;
                try {
                    var res = await axios.post('/api/admin/users/adjust-balance', {
                        userId: _adjCtx.userId,
                        amount: amt,
                        reason: reason,
                        description: reason,
                        mode: mode
                    });
                    if (res.data.success) {
                        var d = res.data.delta || 0;
                        var resArrow = d >= 0 ? '▲증액' : '▼차감';
                        alert(
                            '✅ 잔액 수정 완료\\n\\n' +
                            resArrow + ' ' + (d >= 0 ? '+' : '') + Math.abs(d).toLocaleString() + ' QKEY\\n' +
                            '이전: ' + (res.data.previousBalance || 0).toLocaleString() + ' QKEY\\n' +
                            '이후: ' + (res.data.newBalance || 0).toLocaleString() + ' QKEY\\n' +
                            '사유: ' + (res.data.reason || reason) + '\\n' +
                            'tx ID: ' + res.data.txId
                        );
                        closeAdjustBalanceModal();
                        loadUsers();
                    } else {
                        alert('실패: ' + (res.data.error || '원인 불명'));
                    }
                } catch (err) {
                    alert('잔액 수정 실패: ' + (err.response?.data?.error || err.message));
                }
            }

            // 사유 입력 시에도 미리보기 업데이트되도록 이벤트 위임 (DOMContentLoaded 후)
            document.addEventListener('DOMContentLoaded', function() {
                var d = document.getElementById('adjDescription');
                if (d && !d.__bound) {
                    d.addEventListener('input', updateAdjPreview);
                    d.__bound = true;
                }
            });

            // 사용자 강제 탈퇴
            async function deleteUser(userId, userName, userEmail, stakingAmount) {
                // 1차 확인 — 진행 중 스테이킹이 있어도 일단 경고만 띄우고 진행 가능하게 함
                let confirmMsg = (I18N.t('admin.delete_confirm1') || '회원을 삭제하시겠습니까?') + '\\n\\n' +
                                 (I18N.t('admin.delete_user_label') || '회원: ') + userName + '\\n' +
                                 (I18N.t('admin.delete_email_label') || '이메일: ') + userEmail + '\\n\\n';
                if (stakingAmount > 0) {
                    confirmMsg += '⚠️ 진행 중인 스테이킹: ' + stakingAmount.toLocaleString() + ' USDT\\n' +
                                  '   (강제 삭제 시 스테이킹/배당/추천관계까지 모두 영구 삭제됩니다)\\n\\n';
                }
                confirmMsg += (I18N.t('admin.delete_irreversible') || '이 작업은 되돌릴 수 없습니다.');
                if (!confirm(confirmMsg)) return;

                // 2차 확인 (강제 삭제 케이스에는 추가 확인)
                if (stakingAmount > 0) {
                    if (!confirm('정말로 진행 중 스테이킹을 가진 회원을 강제 삭제하시겠습니까?\\n\\n[' + userName + '] ' + userEmail)) {
                        return;
                    }
                } else {
                    if (!confirm(I18N.t('admin.delete_confirm2') || '한 번 더 확인합니다. 정말 삭제하시겠습니까?')) {
                        return;
                    }
                }

                try {
                    // 진행 중 스테이킹이 있으면 ?force=1 쿼리로 강제 삭제
                    const url = '/api/admin/user/' + userId + (stakingAmount > 0 ? '?force=1' : '');
                    const response = await axios.delete(url);
                    if (response.data.success) {
                        alert((I18N.t('admin.delete_success') || '삭제 완료') + '\\n\\n' +
                              (I18N.t('admin.delete_name_label') || '이름: ') + response.data.deletedUser.name + '\\n' +
                              (I18N.t('admin.delete_email_label') || '이메일: ') + response.data.deletedUser.email);
                        await loadUsers();
                        await loadSignups();
                    }
                } catch (error) {
                    console.error('User delete failed:', error);
                    if (error.response && error.response.data && error.response.data.error) {
                        alert((I18N.t('admin.delete_fail') || '삭제 실패: ') + error.response.data.error + 
                              (error.response.data.activeStakingCount ? 
                               '\\n진행 중 스테이킹: ' + error.response.data.activeStakingCount + '건' : '') +
                              (error.response.data.hint ? '\\n\\n' + error.response.data.hint : ''));
                    } else {
                        alert(I18N.t('admin.delete_error') || '삭제 중 오류가 발생했습니다.');
                    }
                }
            }

            // 스테이킹 승인 — 즉시 카드 제거 + 통계 갱신 + 이중 재검증으로 카드 부활 차단
            async function approveStaking(stakingId) {
                if (!confirm(I18N.t('admin.approve_confirm'))) {
                    return;
                }

                // ★ 1단계: 사용자가 승인 버튼을 한 번 더 못 누르도록 즉시 비활성화 + 카드 제거
                const cardEl = document.querySelector('[data-staking-id="' + stakingId + '"]');
                if (cardEl) {
                    cardEl.style.opacity = '0.4';
                    cardEl.style.pointerEvents = 'none';
                    const btns = cardEl.querySelectorAll('button');
                    btns.forEach(b => { b.disabled = true; });
                }

                try {
                    const response = await axios.post(\`/api/admin/staking/approve/\${stakingId}?_t=\` + Date.now(), null, {
                        headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
                    });
                    if (response.data.success) {
                        // ★ 2단계: 즉시 DOM에서 카드 완전 제거 (재조회 결과를 기다리지 않음)
                        if (cardEl) cardEl.remove();

                        // ★ 3단계: 메시지/통계 갱신 (병렬)
                        alert(response.data.message);
                        loadStatistics();

                        // ★ 4단계: D1 write→read 일관성 보장을 위한 이중 재조회
                        //   첫 재조회에서 같은 id가 또 나오면 1초 후 한 번 더 (write 전파 지연 보정)
                        await new Promise(r => setTimeout(r, 400));
                        await loadPendingStakings();

                        // 5단계: 1초 후 같은 id가 여전히 보이면 강제로 또 제거 후 재조회
                        setTimeout(async function() {
                            const stillThere = document.querySelector('[data-staking-id="' + stakingId + '"]');
                            if (stillThere) {
                                stillThere.remove();
                                await loadPendingStakings();
                            }
                        }, 1000);
                    } else {
                        // 응답은 받았지만 success=false인 경우 카드 복구
                        if (cardEl) {
                            cardEl.style.opacity = '';
                            cardEl.style.pointerEvents = '';
                            cardEl.querySelectorAll('button').forEach(b => { b.disabled = false; });
                        }
                        alert(response.data.error || I18N.t('admin.approve_fail'));
                    }
                } catch (error) {
                    // 네트워크/서버 에러: 카드 복구
                    if (cardEl) {
                        cardEl.style.opacity = '';
                        cardEl.style.pointerEvents = '';
                        cardEl.querySelectorAll('button').forEach(b => { b.disabled = false; });
                    }
                    alert(error.response?.data?.error || I18N.t('admin.approve_fail'));
                    await loadPendingStakings();
                }
            }

            // 스테이킹 거절 — 승인과 동일 패턴: 즉시 비활성화 + 카드 제거 + 이중 재검증
            async function rejectStaking(stakingId) {
                if (!confirm(I18N.t('admin.reject_confirm'))) {
                    return;
                }

                const cardEl = document.querySelector('[data-staking-id="' + stakingId + '"]');
                if (cardEl) {
                    cardEl.style.opacity = '0.4';
                    cardEl.style.pointerEvents = 'none';
                    cardEl.querySelectorAll('button').forEach(b => { b.disabled = true; });
                }

                try {
                    const response = await axios.post(\`/api/admin/staking/reject/\${stakingId}?_t=\` + Date.now(), null, {
                        headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
                    });
                    if (response.data.success) {
                        if (cardEl) cardEl.remove();
                        alert(response.data.message);
                        loadStatistics();
                        await new Promise(r => setTimeout(r, 400));
                        await loadPendingStakings();
                        setTimeout(async function() {
                            const stillThere = document.querySelector('[data-staking-id="' + stakingId + '"]');
                            if (stillThere) {
                                stillThere.remove();
                                await loadPendingStakings();
                            }
                        }, 1000);
                    } else {
                        if (cardEl) {
                            cardEl.style.opacity = '';
                            cardEl.style.pointerEvents = '';
                            cardEl.querySelectorAll('button').forEach(b => { b.disabled = false; });
                        }
                        alert(response.data.error || I18N.t('admin.reject_fail'));
                    }
                } catch (error) {
                    if (cardEl) {
                        cardEl.style.opacity = '';
                        cardEl.style.pointerEvents = '';
                        cardEl.querySelectorAll('button').forEach(b => { b.disabled = false; });
                    }
                    alert(error.response?.data?.error || I18N.t('admin.reject_fail'));
                    await loadPendingStakings();
                }
            }

            // ============================================
            // 매출 현황 로드
            // ============================================
            async function loadSalesStatus() {
                try {
                    const response = await axios.get('/api/admin/sales');
                    if (!response.data.success) return;
                    var stats = response.data.stats;
                    var sales = response.data.sales || [];

                    document.getElementById('salesTotalAmount').textContent = '$' + stats.totalAmount.toLocaleString();
                    document.getElementById('salesTotalCount').textContent = stats.totalCount + I18N.t('admin.cases_unit');
                    document.getElementById('salesTodayAmount').textContent = '$' + stats.todayAmount.toLocaleString();
                    document.getElementById('salesTodayCount').textContent = stats.todayCount + I18N.t('admin.cases_unit');
                    document.getElementById('salesWeekAmount').textContent = '$' + stats.weekAmount.toLocaleString();
                    document.getElementById('salesWeekCount').textContent = stats.weekCount + I18N.t('admin.cases_unit');
                    document.getElementById('salesMonthAmount').textContent = '$' + stats.monthAmount.toLocaleString();
                    document.getElementById('salesMonthCount').textContent = stats.monthCount + I18N.t('admin.cases_unit');

                    // 리셋 분리 통계
                    var activeAmtEl = document.getElementById('salesActiveAmount');
                    var activeCntEl = document.getElementById('salesActiveCount');
                    var resetAmtEl = document.getElementById('salesResetAmount');
                    var resetCntEl = document.getElementById('salesResetCount');
                    if (activeAmtEl) activeAmtEl.textContent = '$' + (stats.activeAmount || 0).toLocaleString();
                    if (activeCntEl) activeCntEl.textContent = (stats.activeCount || 0) + '건';
                    if (resetAmtEl) resetAmtEl.textContent = '$' + (stats.resetAmount || 0).toLocaleString();
                    if (resetCntEl) resetCntEl.textContent = (stats.resetCount || 0) + '건';

                    var tbody = document.getElementById('salesTableBody');
                    if (sales.length === 0) {
                        tbody.innerHTML = '<tr><td colspan="7" class="text-center py-8 text-gray-500">' + I18N.t('admin.no_sales') + '</td></tr>';
                    } else {
                        tbody.innerHTML = sales.map(function(s) {
                            var stColor = s.status === 'active' ? 'green' : 'gray';
                            var stText = s.status === 'active' ? I18N.t('admin.status_active') : I18N.t('admin.status_completed');
                            var rowClass = s.reset_at ? 'hover:bg-gray-50 bg-red-50' : 'hover:bg-gray-50';
                            var resetCell = s.reset_at
                                ? '<span class="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-bold" title="' + esc(s.reset_at) + '"><i class="fas fa-undo-alt mr-1"></i>리셋</span>'
                                : '<span class="text-gray-300 text-xs">-</span>';
                            return '<tr class="' + rowClass + '">' +
                                '<td class="px-2 sm:px-3 py-2"><span class="text-xs">' + esc(s.email) + '</span></td>' +
                                '<td class="px-2 sm:px-3 py-2 font-medium">' + esc(s.name) + '</td>' +
                                '<td class="px-2 sm:px-3 py-2 text-center text-xs">' + esc(s.country || '-') + '</td>' +
                                '<td class="px-2 sm:px-3 py-2 text-right font-bold text-blue-600">$' + s.amount.toLocaleString() + '</td>' +
                                '<td class="px-2 sm:px-3 py-2 text-center"><span class="px-2 py-0.5 bg-' + stColor + '-100 text-' + stColor + '-700 rounded text-xs">' + stText + '</span></td>' +
                                '<td class="px-2 sm:px-3 py-2 text-center">' + resetCell + '</td>' +
                                '<td class="px-2 sm:px-3 py-2 whitespace-nowrap text-xs">' + (s.sale_date ? new Date(s.sale_date).toLocaleDateString(I18N.getLang()) : '-') + '</td>' +
                            '</tr>';
                        }).join('');
                    }
                } catch (error) {
                    console.error('Sales status load failed:', error);
                }
            }

            // ============================================
            // 스왑 내역 로드
            // ============================================
            async function loadSwaps() {
                try {
                    const response = await axios.get('/api/admin/swaps');
                    if (response.data.success) {
                        var swaps = response.data.swaps || [];
                        var stats = response.data.stats || {};
                        
                        // 통계 업데이트
                        document.getElementById('swapStatCount').textContent = Math.floor((stats.total_count || 0) / 2);
                        document.getElementById('swapStatQkeyUsed').textContent = (stats.total_qkey_used || 0).toLocaleString();
                        document.getElementById('swapStatUsdtUsed').textContent = (stats.total_usdt_used || 0).toLocaleString();
                        document.getElementById('swapStatUsers').textContent = (stats.unique_users || 0).toLocaleString();
                        document.getElementById('swapStatQtaOut').textContent = (stats.total_qta_received || 0).toLocaleString();
                        document.getElementById('swapStatQxOut').textContent = (stats.total_qx_received || 0).toLocaleString();
                        document.getElementById('swapStatUsdtOut').textContent = (stats.total_usdt_received || 0).toLocaleString();
                        document.getElementById('swapStatQkeyOut').textContent = (stats.total_qkey_received || 0).toLocaleString();
                        
                        // 테이블 렌더링 (swap_in만 표시 - swap_out과 쌍이므로)
                        var tbody = document.getElementById('swapTableBody');
                        if (swaps.length === 0) {
                            tbody.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-gray-500">스왑 내역이 없습니다</td></tr>';
                            return;
                        }
                        
                        tbody.innerHTML = swaps.map(function(s) {
                            var typeLabel = s.type === 'swap_in' ? '<span class="text-green-600 font-medium">입금</span>' : '<span class="text-red-600 font-medium">출금</span>';
                            var coinColor = s.coin_type === 'QTA' ? 'blue' : s.coin_type === 'QX' ? 'purple' : s.coin_type === 'QKEY' ? 'yellow' : 'green';
                            var date = new Date(s.created_at).toLocaleString('ko-KR', {timeZone:'Asia/Seoul'});
                            return '<tr class="hover:bg-gray-50">' +
                                '<td class="px-3 py-2">' + escapeHtml(s.name) + '<br><span class="text-xs text-gray-400">' + escapeHtml(s.email) + '</span></td>' +
                                '<td class="px-3 py-2">' + typeLabel + '</td>' +
                                '<td class="px-3 py-2 text-right font-bold">' + s.amount.toLocaleString() + '</td>' +
                                '<td class="px-3 py-2"><span class="px-2 py-1 bg-' + coinColor + '-100 text-' + coinColor + '-700 rounded text-xs font-bold">' + s.coin_type + '</span></td>' +
                                '<td class="px-3 py-2 text-xs text-gray-500 max-w-[200px] truncate">' + escapeHtml(s.description || '') + '</td>' +
                                '<td class="px-3 py-2 text-xs text-gray-500 whitespace-nowrap">' + date + '</td>' +
                            '</tr>';
                        }).join('');
                    }
                } catch (error) {
                    console.error('Failed to load swaps:', error);
                    document.getElementById('swapTableBody').innerHTML = '<tr><td colspan="6" class="text-center py-8 text-red-500">로드 실패</td></tr>';
                }
            }

            // 수당 체크 로드
            // ============================================
            var allMemberRewards = [];
            async function loadMemberRewards() {
                try {
                    const response = await axios.get('/api/admin/member-rewards');
                    if (!response.data.success) return;
                    var totals = response.data.totals;
                    allMemberRewards = response.data.members || [];

                    document.getElementById('mrDailyTotal').textContent = Math.round(totals.totalDailyQkey).toLocaleString() + ' QKEY';
                    document.getElementById('mrReferralTotal').textContent = Math.round(totals.totalReferralQkey).toLocaleString() + ' QKEY';
                    document.getElementById('mrGrandTotal').textContent = Math.round(totals.totalCombined).toLocaleString() + ' QKEY';

                    renderMemberRewards(allMemberRewards);
                } catch (error) {
                    console.error('Member rewards load failed:', error);
                }
            }

            function renderMemberRewards(members) {
                var tbody = document.getElementById('memberRewardsTableBody');
                if (members.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="7" class="text-center py-8 text-gray-500">' + I18N.t('admin.no_data') + '</td></tr>';
                    return;
                }
                tbody.innerHTML = members.map(function(m) {
                    var total = (m.daily_reward_total || 0) + (m.referral_reward_total || 0);
                    return '<tr class="hover:bg-gray-50 cursor-pointer" onclick="showDownlineSales(' + m.id + ')">' +
                        '<td class="px-2 py-2 text-xs">' + esc(m.email) + '</td>' +
                        '<td class="px-2 py-2 font-medium text-sm">' + esc(m.name) + '</td>' +
                        '<td class="px-2 py-2 text-right text-sm">$' + (m.staking_amount || 0).toLocaleString() + '</td>' +
                        '<td class="px-2 py-2 text-right text-yellow-600 font-bold">' + Math.round(m.daily_reward_total || 0).toLocaleString() + '</td>' +
                        '<td class="px-2 py-2 text-right text-blue-600 font-bold">' + Math.round(m.referral_reward_total || 0).toLocaleString() + '</td>' +
                        '<td class="px-2 py-2 text-right text-green-600 font-bold">' + Math.round(total).toLocaleString() + '</td>' +
                        '<td class="px-2 py-2 text-center">' + (m.qkey_balance || 0).toLocaleString() + '</td>' +
                    '</tr>';
                }).join('');
            }

            function filterMemberRewards() {
                var query = (document.getElementById('memberRewardSearch').value || '').toLowerCase();
                if (!query) {
                    renderMemberRewards(allMemberRewards);
                    return;
                }
                var filtered = allMemberRewards.filter(function(m) {
                    return (m.email || '').toLowerCase().indexOf(query) >= 0 || 
                           (m.name || '').toLowerCase().indexOf(query) >= 0;
                });
                renderMemberRewards(filtered);
            }

            // ============================================
            // 산하 매출 조회
            // ============================================
            function openDownlineModal() {
                document.getElementById('downlineModal').classList.remove('hidden');
                document.getElementById('downlineSearchInput').value = '';
                document.getElementById('downlineContent').innerHTML = '<p class="text-center py-8 text-gray-400">' + I18N.t('admin.downline_search_prompt') + '</p>';
                document.getElementById('downlineSearchInput').focus();
            }

            function closeDownlineModal() {
                document.getElementById('downlineModal').classList.add('hidden');
            }

            async function searchDownlineUser() {
                var query = document.getElementById('downlineSearchInput').value.trim();
                if (!query) { alert(I18N.t('admin.downline_enter_query')); return; }
                try {
                    var res = await axios.get('/api/admin/search-user?q=' + encodeURIComponent(query));
                    if (!res.data.success || !res.data.users.length) {
                        document.getElementById('downlineContent').innerHTML = '<p class="text-center py-4 text-gray-500">' + I18N.t('admin.downline_no_result') + '</p>';
                        return;
                    }
                    var users = res.data.users;
                    document.getElementById('downlineContent').innerHTML = '<div class="space-y-2">' +
                        users.map(function(u) {
                            return '<div class="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer flex justify-between items-center" onclick="showDownlineSales(' + u.id + ')">' +
                                '<div><p class="font-medium">' + esc(u.name) + '</p><p class="text-xs text-gray-500">' + I18N.t('login.id') + ': ' + esc(u.email) + '</p></div>' +
                                '<div class="text-right"><p class="font-bold text-blue-600">$' + (u.staking_amount || 0).toLocaleString() + '</p><p class="text-xs text-gray-500">' + I18N.t('admin.referral_code_short') + esc(u.referral_code || '-') + '</p></div>' +
                            '</div>';
                        }).join('') +
                    '</div>';
                } catch (error) {
                    console.error('Search failed:', error);
                }
            }

            async function showDownlineSales(userId) {
                // 모달 열기
                document.getElementById('downlineModal').classList.remove('hidden');
                var content = document.getElementById('downlineContent');
                content.innerHTML = '<p class="text-center py-8 text-gray-500"><i class="fas fa-spinner fa-spin mr-2"></i>' + I18N.t('admin.loading') + '</p>';

                try {
                    var res = await axios.get('/api/admin/downline-sales/' + userId);
                    if (!res.data.success) return;
                    var data = res.data;
                    var user = data.user;
                    var level1 = data.level1;
                    var level2 = data.level2;

                    content.innerHTML = 
                        '<div class="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-200">' +
                            '<h4 class="font-bold text-purple-800">' + esc(user.email) + ' <span class="text-sm font-normal text-gray-600">(' + esc(user.name) + ')</span></h4>' +
                            '<p class="text-xs text-gray-600 mt-1">' + I18N.t('admin.referral_code_short') + '<span class="font-bold text-purple-600">' + esc(user.referral_code || '-') + '</span></p>' +
                        '</div>' +
                        // 산하 매출 통계
                        '<div class="grid grid-cols-3 gap-2 sm:gap-4 mb-4">' +
                            '<div class="bg-blue-50 rounded-lg p-3 border border-blue-200 text-center">' +
                                '<p class="text-xs text-gray-600">' + I18N.t('admin.level1_sales') + '</p>' +
                                '<p class="text-lg font-bold text-blue-700">$' + level1.totalAmount.toLocaleString() + '</p>' +
                                '<p class="text-xs text-gray-500">' + level1.count + I18N.t('admin.people_unit') + '</p>' +
                            '</div>' +
                            '<div class="bg-green-50 rounded-lg p-3 border border-green-200 text-center">' +
                                '<p class="text-xs text-gray-600">' + I18N.t('admin.level2_sales') + '</p>' +
                                '<p class="text-lg font-bold text-green-700">$' + level2.totalAmount.toLocaleString() + '</p>' +
                                '<p class="text-xs text-gray-500">' + level2.count + I18N.t('admin.people_unit') + '</p>' +
                            '</div>' +
                            '<div class="bg-purple-50 rounded-lg p-3 border border-purple-200 text-center">' +
                                '<p class="text-xs text-gray-600">' + I18N.t('admin.total_sales_all') + '</p>' +
                                '<p class="text-lg font-bold text-purple-700">$' + data.grandTotal.toLocaleString() + '</p>' +
                                '<p class="text-xs text-gray-500">' + (level1.count + level2.count) + I18N.t('admin.people_unit') + '</p>' +
                            '</div>' +
                        '</div>' +
                        // 1대 목록
                        '<h4 class="font-bold text-gray-700 mb-2 text-sm"><i class="fas fa-user-friends mr-1 text-blue-600"></i>' + I18N.t('admin.level1_downline') + ' (' + level1.count + I18N.t('admin.people_unit') + ') - $' + level1.totalAmount.toLocaleString() + '</h4>' +
                        (level1.users && level1.users.length > 0 ? 
                            '<div class="overflow-x-auto mb-4"><table class="w-full text-xs"><thead class="bg-gray-100"><tr><th class="px-2 py-1 text-left">' + I18N.t('admin.col_name') + '</th><th class="px-2 py-1 text-left">' + I18N.t('admin.col_email') + '</th><th class="px-2 py-1 text-center">' + I18N.t('admin.col_country') + '</th><th class="px-2 py-1 text-right">' + I18N.t('admin.col_entry_amount') + '</th><th class="px-2 py-1 text-left">' + I18N.t('admin.join_date') + '</th></tr></thead><tbody class="divide-y">' +
                            level1.users.map(function(u) {
                                return '<tr class="hover:bg-gray-50 cursor-pointer" onclick="showDownlineSales(' + u.id + ')"><td class="px-2 py-1 font-medium">' + esc(u.name) + '</td><td class="px-2 py-1">' + esc(u.email) + '</td><td class="px-2 py-1 text-center">' + esc(u.country || '-') + '</td><td class="px-2 py-1 text-right font-bold text-blue-600">$' + (u.staking_amount || 0).toLocaleString() + '</td><td class="px-2 py-1">' + new Date(u.created_at).toLocaleDateString(I18N.getLang()) + '</td></tr>';
                            }).join('') +
                            '</tbody></table></div>'
                        : '<p class="text-xs text-gray-500 mb-4">' + I18N.t('admin.no_level1') + '</p>') +
                        // Level 2 list
                        '<h4 class="font-bold text-gray-700 mb-2 text-sm"><i class="fas fa-users mr-1 text-green-600"></i>' + I18N.t('admin.level2_downline') + ' (' + level2.count + I18N.t('admin.people_unit') + ') - $' + level2.totalAmount.toLocaleString() + '</h4>' +
                        (level2.users && level2.users.length > 0 ? 
                            '<div class="overflow-x-auto"><table class="w-full text-xs"><thead class="bg-gray-100"><tr><th class="px-2 py-1 text-left">' + I18N.t('admin.col_name') + '</th><th class="px-2 py-1 text-left">' + I18N.t('admin.col_email') + '</th><th class="px-2 py-1 text-center">' + I18N.t('admin.col_referrer') + '</th><th class="px-2 py-1 text-right">' + I18N.t('admin.col_entry_amount') + '</th><th class="px-2 py-1 text-left">' + I18N.t('admin.join_date') + '</th></tr></thead><tbody class="divide-y">' +
                            level2.users.map(function(u) {
                                return '<tr class="hover:bg-gray-50"><td class="px-2 py-1 font-medium">' + esc(u.name) + '</td><td class="px-2 py-1">' + esc(u.email) + '</td><td class="px-2 py-1 text-center text-purple-600">' + esc(u.referrer_name || '-') + '</td><td class="px-2 py-1 text-right font-bold text-green-600">$' + (u.staking_amount || 0).toLocaleString() + '</td><td class="px-2 py-1">' + new Date(u.created_at).toLocaleDateString(I18N.getLang()) + '</td></tr>';
                            }).join('') +
                            '</tbody></table></div>'
                        : '<p class="text-xs text-gray-500">' + I18N.t('admin.no_level2') + '</p>');
                } catch (error) {
                    console.error('Downline sales load failed:', error);
                    content.innerHTML = '<p class="text-center py-8 text-red-500">' + I18N.t('admin.downline_fail') + '</p>';
                }
            }

            // ============================================
            // 쇼핑몰 관리 (Admin Shop)
            // ============================================

            // 이미지 업로드 (드래그앤드롭 + 파일선택)
            function setupDropZone(zoneId, type) {
                var zone = document.getElementById(zoneId);
                if (!zone) return;
                zone.addEventListener('dragover', function(e) { e.preventDefault(); zone.classList.add('border-pink-500','bg-pink-50'); });
                zone.addEventListener('dragleave', function(e) { e.preventDefault(); zone.classList.remove('border-pink-500','bg-pink-50'); });
                zone.addEventListener('drop', function(e) {
                    e.preventDefault(); zone.classList.remove('border-pink-500','bg-pink-50');
                    var files = e.dataTransfer.files;
                    if (files.length > 0) processImageFile(files[0], type);
                });
            }
            setupDropZone('thumbDropZone', 'thumb');
            // 상세이미지 드롭존은 여러장 처리
            (function() {
                var zone = document.getElementById('detailDropZone');
                if (!zone) return;
                zone.addEventListener('dragover', function(e) { e.preventDefault(); zone.classList.add('border-purple-500','bg-purple-50'); });
                zone.addEventListener('dragleave', function(e) { e.preventDefault(); zone.classList.remove('border-purple-500','bg-purple-50'); });
                zone.addEventListener('drop', function(e) {
                    e.preventDefault(); zone.classList.remove('border-purple-500','bg-purple-50');
                    Array.from(e.dataTransfer.files).forEach(function(file) {
                        compressImage(file, 1000, 8000, 450*1024, function(dataUrl) {
                            detailImagesArray.push(dataUrl);
                            renderDetailImageList();
                        });
                    });
                });
            })();

            function handleImageUpload(input, type) {
                if (input.files && input.files[0]) processImageFile(input.files[0], type);
            }

            // 상세 이미지 배열 (여러장)
            var detailImagesArray = [];

            function compressImage(file, maxW, maxH, maxBytes, callback) {
                if (!file.type.startsWith('image/')) { alert('이미지 파일만 업로드 가능합니다'); return; }
                if (file.size > 10*1024*1024) { alert('파일 크기가 너무 큽니다 (최대 10MB)'); return; }
                var reader = new FileReader();
                reader.onload = function(e) {
                    var img = new Image();
                    img.onload = function() {
                        var w = img.width, h = img.height;
                        if (w > maxW) { h = Math.round(h * maxW / w); w = maxW; }
                        if (h > maxH) { w = Math.round(w * maxH / h); h = maxH; }
                        var canvas = document.createElement('canvas');
                        canvas.width = w; canvas.height = h;
                        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                        var quality = 0.8;
                        var dataUrl = canvas.toDataURL('image/jpeg', quality);
                        while (dataUrl.length > maxBytes && quality > 0.3) { quality -= 0.1; dataUrl = canvas.toDataURL('image/jpeg', quality); }
                        console.log('Image compressed: ' + img.width + 'x' + img.height + ' -> ' + w + 'x' + h + ', ' + Math.round(dataUrl.length/1024) + 'KB');
                        callback(dataUrl);
                    };
                    img.src = e.target.result;
                };
                reader.readAsDataURL(file);
            }

            function processImageFile(file, type) {
                if (type === 'thumb') {
                    compressImage(file, 600, 600, 300*1024, function(dataUrl) {
                        document.getElementById('shopProdImage').value = dataUrl;
                        document.getElementById('thumbPreviewImg').src = dataUrl;
                        document.getElementById('thumbPreview').classList.remove('hidden');
                        document.getElementById('thumbPlaceholder').classList.add('hidden');
                    });
                }
            }

            // 상세이미지 여러장 추가
            function handleDetailImageAdd(input) {
                if (!input.files) return;
                Array.from(input.files).forEach(function(file) {
                    compressImage(file, 1000, 8000, 450*1024, function(dataUrl) {
                        detailImagesArray.push(dataUrl);
                        renderDetailImageList();
                    });
                });
                input.value = '';
            }

            function renderDetailImageList() {
                var container = document.getElementById('detailImageList');
                if (!container) return;
                container.innerHTML = '';
                detailImagesArray.forEach(function(url, idx) {
                    var row = document.createElement('div');
                    row.className = 'flex items-center gap-2 bg-gray-50 rounded p-2 border';
                    var imgWrap = document.createElement('div');
                    imgWrap.className = 'w-16 h-16 flex-shrink-0 rounded overflow-hidden bg-gray-200';
                    var img = document.createElement('img');
                    img.src = url;
                    img.className = 'w-full h-full object-cover';
                    imgWrap.appendChild(img);
                    row.appendChild(imgWrap);
                    var info = document.createElement('span');
                    info.className = 'text-xs text-gray-600 flex-1';
                    info.textContent = '상세이미지 ' + (idx+1) + ' (' + Math.round(url.length/1024) + 'KB)';
                    row.appendChild(info);
                    var delBtn = document.createElement('button');
                    delBtn.className = 'px-2 py-1 bg-red-100 hover:bg-red-200 text-red-600 rounded text-xs font-bold';
                    delBtn.innerHTML = '<i class="fas fa-trash mr-1"></i>삭제';
                    delBtn.onclick = (function(i){ return function(){ removeDetailImage(i); }; })(idx);
                    row.appendChild(delBtn);
                    container.appendChild(row);
                });
            }

            function removeDetailImage(idx) {
                detailImagesArray.splice(idx, 1);
                renderDetailImageList();
            }

            function clearImage(type) {
                if (type === 'thumb') {
                    document.getElementById('shopProdImage').value = '';
                    document.getElementById('thumbPreview').classList.add('hidden');
                    document.getElementById('thumbPlaceholder').classList.remove('hidden');
                    document.getElementById('thumbFileInput').value = '';
                }
            }

            // 옵션 행 추가/제거
            function addOptionRow() {
                var container = document.getElementById('shopProdOptions');
                var row = document.createElement('div');
                row.className = 'flex gap-2 items-center';
                row.innerHTML = '<input type="text" placeholder="옵션명 (예: 사이즈)" class="shopOptName px-2 py-1.5 border rounded text-sm w-28"><input type="text" placeholder="항목 (쉼표 구분: S,M,L,XL)" class="shopOptValues px-2 py-1.5 border rounded text-sm flex-1"><button onclick="removeOptionRow(this)" class="text-red-400 hover:text-red-600 text-sm"><i class="fas fa-times-circle"></i></button>';
                container.appendChild(row);
            }
            function removeOptionRow(btn) {
                var container = document.getElementById('shopProdOptions');
                if (container.children.length > 1) { btn.parentElement.remove(); }
                else { btn.parentElement.querySelectorAll('input').forEach(function(i){i.value='';}); }
            }
            function collectOptions() {
                var opts = [];
                document.querySelectorAll('#shopProdOptions > div').forEach(function(row) {
                    var name = row.querySelector('.shopOptName').value.trim();
                    var vals = row.querySelector('.shopOptValues').value.trim();
                    if (name && vals) {
                        opts.push({ name: name, values: vals.split(',').map(function(v){return v.trim();}).filter(function(v){return v;}) });
                    }
                });
                return opts.length > 0 ? JSON.stringify(opts) : '';
            }

            // 수정 모달 전용 상세이미지 배열
            var editDetailImagesArray = [];

            // 상품 수정 모달
            function adminEditProduct(productId) {
                var products = [];
                axios.get('/api/admin/shop/products').then(function(res) {
                    products = res.data.products || [];
                    var p = products.find(function(x) { return x.id === productId; });
                    if (!p) { alert('상품을 찾을 수 없습니다'); return; }
                    var opts = [];
                    try { if(p.options) opts = JSON.parse(p.options); } catch(e) {}
                    var optsHtml = (opts.length > 0 ? opts : [{ name: '', values: [] }]).map(function(o) {
                        return '<div class="flex gap-2 items-center"><input type="text" value="' + esc(o.name||'') + '" placeholder="옵션명" class="editOptName px-2 py-1.5 border rounded text-sm w-28"><input type="text" value="' + esc((o.values||[]).join(',')) + '" placeholder="항목 (쉼표 구분)" class="editOptValues px-2 py-1.5 border rounded text-sm flex-1"><button onclick="this.parentElement.remove()" class="text-red-400 hover:text-red-600 text-sm"><i class="fas fa-times-circle"></i></button></div>';
                    }).join('');
                    // 기존 상세이미지 파싱 (JSON 배열 또는 단일 문자열)
                    editDetailImagesArray = [];
                    if (p.detail_image_url) {
                        try {
                            var parsed = JSON.parse(p.detail_image_url);
                            if (Array.isArray(parsed)) editDetailImagesArray = parsed;
                            else editDetailImagesArray = [p.detail_image_url];
                        } catch(e) { editDetailImagesArray = [p.detail_image_url]; }
                    }
                    var modal = document.createElement('div');
                    modal.id = 'editProductModal';
                    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
                    modal.innerHTML = '<div class="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-5">' +
                        '<div class="flex justify-between items-center mb-4"><h3 class="font-bold text-lg"><i class="fas fa-edit mr-2 text-blue-600"></i>상품 수정</h3><button onclick="document.getElementById(\\'editProductModal\\').remove()" class="text-gray-400 hover:text-gray-600 text-xl">&times;</button></div>' +
                        '<div class="space-y-3">' +
                        '<input type="text" id="editProdName" placeholder="상품명 *" class="w-full px-3 py-2 border rounded-lg text-sm">' +
                        '<input type="number" id="editProdPrice" placeholder="가격 (원) *" class="w-full px-3 py-2 border rounded-lg text-sm">' +
                        '<div><div class="flex items-center gap-2 mb-1"><label class="text-xs font-bold text-gray-600">상품 설명</label><button type="button" id="editDescModeBtn" class="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-bold">HTML 모드</button></div><input type="text" id="editProdDesc" placeholder="상품 설명 (텍스트)" class="w-full px-3 py-2 border rounded-lg text-sm"><textarea id="editProdDescHtml" placeholder="HTML 코드 직접 입력" class="w-full px-3 py-2 border rounded-lg text-sm hidden" rows="5" style="font-family:monospace;font-size:12px"></textarea></div>' +
                        '<select id="editProdCategory" class="w-full px-3 py-2 border rounded-lg text-sm bg-white"><option value="일반">일반</option><option value="식품">식품</option><option value="건강">건강</option><option value="생활">생활</option><option value="패션">패션</option><option value="뷰티">뷰티</option><option value="전자기기">전자기기</option><option value="기타">기타</option></select>' +
                        '<input type="number" id="editProdStock" placeholder="재고 (-1=무제한)" class="w-full px-3 py-2 border rounded-lg text-sm">' +
                        '<div><label class="block text-xs font-bold text-gray-600 mb-1"><i class="fas fa-list-ul mr-1 text-orange-500"></i>옵션 설정</label><div id="editProdOptions" class="space-y-2">' + optsHtml + '</div>' +
                        '<button onclick="var c=document.getElementById(\\'editProdOptions\\');var r=document.createElement(\\'div\\');r.className=\\'flex gap-2 items-center\\';r.innerHTML=\\'<input type=text placeholder=옵션명 class=editOptName px-2 py-1.5 border rounded text-sm w-28><input type=text placeholder=항목(쉼표구분) class=editOptValues px-2 py-1.5 border rounded text-sm flex-1><button onclick=this.parentElement.remove() class=text-red-400 hover:text-red-600 text-sm><i class=fas fa-times-circle></i></button>\\';c.appendChild(r)" class="mt-2 px-3 py-1 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded text-xs font-bold"><i class="fas fa-plus mr-1"></i>옵션 추가</button></div>' +
                        '<!-- 이미지 수정 영역 -->' +
                        '<div class="border rounded-lg p-3 bg-gray-50">' +
                        '<label class="block text-xs font-bold text-gray-600 mb-2"><i class="fas fa-image mr-1 text-blue-500"></i>썸네일 이미지</label>' +
                        '<div id="editThumbDropZone" class="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition mb-2" onclick="document.getElementById(\\'editThumbFileInput\\').click()">' +
                        '<input type="file" id="editThumbFileInput" accept="image/*" class="hidden" onchange="handleEditThumbUpload(this)">' +
                        '<div id="editThumbPreview" class="hidden overflow-hidden" style="max-height:100px"><img id="editThumbPreviewImg" class="max-h-20 mx-auto rounded mb-1"><button onclick="event.stopPropagation();clearEditThumb()" class="text-xs text-red-500 hover:text-red-700 block mx-auto"><i class="fas fa-trash mr-1"></i>썸네일 삭제</button></div>' +
                        '<div id="editThumbPlaceholder"><i class="fas fa-cloud-upload-alt text-xl text-gray-400 mb-1"></i><p class="text-xs text-gray-500">클릭하여 썸네일 업로드</p></div>' +
                        '</div>' +
                        '<input type="hidden" id="editProdThumbData" value="">' +
                        '</div>' +
                        '<div class="border rounded-lg p-3 bg-gray-50">' +
                        '<label class="block text-xs font-bold text-gray-600 mb-2"><i class="fas fa-file-image mr-1 text-purple-500"></i>상세페이지 이미지 (여러장 가능)</label>' +
                        '<div id="editDetailDropZone" class="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition mb-2" onclick="document.getElementById(\\'editDetailFileInput\\').click()">' +
                        '<input type="file" id="editDetailFileInput" accept="image/*" class="hidden" onchange="handleEditDetailAdd(this)" multiple>' +
                        '<div><i class="fas fa-cloud-upload-alt text-xl text-gray-400 mb-1"></i><p class="text-xs text-gray-500">클릭하여 상세이미지 추가</p></div>' +
                        '</div>' +
                        '<div id="editDetailImageList" class="space-y-2"></div>' +
                        '</div>' +
                        '<div class="flex gap-2 pt-3"><button onclick="saveEditProduct(' + p.id + ')" class="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm"><i class="fas fa-save mr-1"></i>저장</button><button onclick="document.getElementById(\\'editProductModal\\').remove()" class="flex-1 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-bold text-sm">취소</button></div>' +
                        '</div></div>';
                    document.body.appendChild(modal);
                    // JS로 값 설정 (base64를 HTML attribute에 직접 넣으면 깨짐)
                    document.getElementById('editProdName').value = p.name || '';
                    document.getElementById('editProdPrice').value = p.price_krw || 0;
                    var descVal = p.description || '';
                    var isHtml = descVal.indexOf('<') >= 0 && descVal.indexOf('>') >= 0;
                    var _editDescHtmlMode = false;
                    document.getElementById('editProdDesc').value = descVal;
                    document.getElementById('editProdDescHtml').value = descVal;
                    if (isHtml) {
                        _editDescHtmlMode = true;
                        document.getElementById('editProdDesc').classList.add('hidden');
                        document.getElementById('editProdDescHtml').classList.remove('hidden');
                        document.getElementById('editDescModeBtn').textContent = '텍스트 모드';
                        document.getElementById('editDescModeBtn').className = 'px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-bold';
                    }
                    document.getElementById('editDescModeBtn').onclick = function() {
                        _editDescHtmlMode = !_editDescHtmlMode;
                        var btn = document.getElementById('editDescModeBtn');
                        var txtEl = document.getElementById('editProdDesc');
                        var htmlEl = document.getElementById('editProdDescHtml');
                        if (_editDescHtmlMode) {
                            btn.textContent = '텍스트 모드'; btn.className = 'px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-bold';
                            htmlEl.value = txtEl.value; txtEl.classList.add('hidden'); htmlEl.classList.remove('hidden');
                        } else {
                            btn.textContent = 'HTML 모드'; btn.className = 'px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-bold';
                            txtEl.value = htmlEl.value; htmlEl.classList.add('hidden'); txtEl.classList.remove('hidden');
                        }
                    };
                    document.getElementById('editProdCategory').value = p.category || '일반';
                    document.getElementById('editProdStock').value = p.stock != null ? p.stock : -1;
                    // 썸네일 미리보기 설정
                    if (p.image_url) {
                        document.getElementById('editProdThumbData').value = '__KEEP__';
                        document.getElementById('editThumbPreviewImg').src = p.image_url;
                        document.getElementById('editThumbPreview').classList.remove('hidden');
                        document.getElementById('editThumbPlaceholder').classList.add('hidden');
                    }
                    // 상세이미지 목록 렌더
                    renderEditDetailImageList();
                    // 드래그앤드롭
                    (function() {
                        var tz = document.getElementById('editThumbDropZone');
                        if (tz) {
                            tz.addEventListener('dragover', function(e) { e.preventDefault(); });
                            tz.addEventListener('drop', function(e) { e.preventDefault(); if (e.dataTransfer.files.length > 0) handleEditThumbFile(e.dataTransfer.files[0]); });
                        }
                        var dz = document.getElementById('editDetailDropZone');
                        if (dz) {
                            dz.addEventListener('dragover', function(e) { e.preventDefault(); });
                            dz.addEventListener('drop', function(e) { e.preventDefault(); Array.from(e.dataTransfer.files).forEach(function(f) { handleEditDetailFile(f); }); });
                        }
                    })();
                });
            }

            function handleEditThumbUpload(input) { if (input.files && input.files[0]) handleEditThumbFile(input.files[0]); }
            function handleEditThumbFile(file) {
                compressImage(file, 600, 600, 300*1024, function(dataUrl) {
                    document.getElementById('editProdThumbData').value = dataUrl;
                    document.getElementById('editThumbPreviewImg').src = dataUrl;
                    document.getElementById('editThumbPreview').classList.remove('hidden');
                    document.getElementById('editThumbPlaceholder').classList.add('hidden');
                });
            }
            function clearEditThumb() {
                document.getElementById('editProdThumbData').value = '';
                document.getElementById('editThumbPreview').classList.add('hidden');
                document.getElementById('editThumbPlaceholder').classList.remove('hidden');
                document.getElementById('editThumbFileInput').value = '';
            }

            function handleEditDetailAdd(input) {
                if (!input.files) return;
                Array.from(input.files).forEach(function(f) { handleEditDetailFile(f); });
                input.value = '';
            }
            function handleEditDetailFile(file) {
                compressImage(file, 1000, 8000, 450*1024, function(dataUrl) {
                    editDetailImagesArray.push(dataUrl);
                    renderEditDetailImageList();
                });
            }
            function renderEditDetailImageList() {
                var container = document.getElementById('editDetailImageList');
                if (!container) return;
                container.innerHTML = editDetailImagesArray.map(function(url, idx) {
                    return '<div class="flex items-center gap-2 bg-white rounded p-2 border">' +
                        '<div class="w-14 h-14 flex-shrink-0 rounded overflow-hidden bg-gray-200"><img src="' + url + '" class="w-full h-full object-cover"></div>' +
                        '<span class="text-xs text-gray-600 flex-1">상세 ' + (idx+1) + ' (' + Math.round(url.length/1024) + 'KB)</span>' +
                        '<button onclick="removeEditDetailImage(' + idx + ')" class="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-600 rounded text-xs font-bold"><i class="fas fa-trash mr-1"></i>삭제</button>' +
                        '</div>';
                }).join('');
            }
            function removeEditDetailImage(idx) {
                editDetailImagesArray.splice(idx, 1);
                renderEditDetailImageList();
            }

            async function saveEditProduct(productId) {
                var name = document.getElementById('editProdName').value.trim();
                var price = parseInt(document.getElementById('editProdPrice').value) || 0;
                if (!name || price <= 0) { alert('상품명과 가격은 필수입니다.'); return; }
                var opts = [];
                document.querySelectorAll('#editProdOptions > div').forEach(function(row) {
                    var n = row.querySelector('.editOptName').value.trim();
                    var v = row.querySelector('.editOptValues').value.trim();
                    if (n && v) { opts.push({ name: n, values: v.split(',').map(function(x){return x.trim();}).filter(function(x){return x;}) }); }
                });
                try {
                    var prodRes = await axios.get('/api/admin/shop/products');
                    var existing = (prodRes.data.products || []).find(function(p) { return p.id === productId; });
                    // 썸네일 처리
                    var thumbVal = document.getElementById('editProdThumbData').value;
                    var finalThumb = thumbVal === '__KEEP__' ? (existing ? existing.image_url : '') : thumbVal;
                    // 상세이미지 처리 (여러장 → JSON, 1장 → 그대로)
                    var finalDetail = '';
                    if (editDetailImagesArray.length > 1) {
                        finalDetail = JSON.stringify(editDetailImagesArray);
                    } else if (editDetailImagesArray.length === 1) {
                        finalDetail = editDetailImagesArray[0];
                    }
                    // 설명: HTML 모드 확인 후 적절한 필드에서 가져오기
                    var editDescHtmlEl = document.getElementById('editProdDescHtml');
                    var editDescTxtEl = document.getElementById('editProdDesc');
                    var editDesc = (editDescHtmlEl && !editDescHtmlEl.classList.contains('hidden')) ? editDescHtmlEl.value.trim() : editDescTxtEl.value.trim();
                    await axios.put('/api/admin/shop/product/' + productId, {
                        name: name,
                        description: editDesc,
                        price_krw: price,
                        image_url: finalThumb,
                        detail_image_url: finalDetail,
                        category: document.getElementById('editProdCategory').value,
                        stock: parseInt(document.getElementById('editProdStock').value) || -1,
                        is_active: existing ? existing.is_active : 1,
                        options: opts.length > 0 ? JSON.stringify(opts) : ''
                    });
                    alert('상품이 수정되었습니다!');
                    document.getElementById('editProductModal').remove();
                    loadAdminShopProducts();
                } catch(e) {
                    alert('수정 실패: ' + (e.response?.data?.error || e.message));
                }
            }

            // HTML/텍스트 모드 전환
            var _descHtmlMode = false;
            function toggleDescMode() {
                _descHtmlMode = !_descHtmlMode;
                var btn = document.getElementById('descModeBtn');
                var txtEl = document.getElementById('shopProdDesc');
                var htmlEl = document.getElementById('shopProdDescHtml');
                if (_descHtmlMode) {
                    btn.textContent = '텍스트 모드';
                    btn.className = 'px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-bold';
                    txtEl.classList.add('hidden');
                    htmlEl.classList.remove('hidden');
                    htmlEl.value = txtEl.value;
                } else {
                    btn.textContent = 'HTML 모드';
                    btn.className = 'px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-bold';
                    htmlEl.classList.add('hidden');
                    txtEl.classList.remove('hidden');
                    txtEl.value = htmlEl.value;
                }
            }

            // 대량등록 템플릿 다운로드
            // ============================================
            // 대량등록 / 송장 일괄등록 (CSV + 엑셀 xlsx/xls 지원)
            // ============================================
            // CSV 한 줄 파싱 (큰따옴표 안의 쉼표/줄바꿈 안전 처리)
            function _parseCsvLine(line) {
                var out = []; var cur = ''; var inQ = false;
                for (var i = 0; i < line.length; i++) {
                    var ch = line[i];
                    if (ch === '"') {
                        if (inQ && line[i+1] === '"') { cur += '"'; i++; }
                        else { inQ = !inQ; }
                    } else if (ch === ',' && !inQ) {
                        out.push(cur); cur = '';
                    } else { cur += ch; }
                }
                out.push(cur);
                return out.map(function(s){ return s.trim(); });
            }
            // CSV 텍스트 → 행 배열(2D)
            function _parseCsv(text) {
                // BOM 제거 + 줄바꿈 정규화 (정규식은 RegExp 생성자로 만들어 백틱 이스케이프 회피)
                var BOM = String.fromCharCode(0xFEFF);
                if (text.charAt(0) === BOM) text = text.slice(1);
                var CR = String.fromCharCode(13);
                var LF = String.fromCharCode(10);
                // CRLF, CR → LF 단일화
                var out = '';
                for (var k = 0; k < text.length; k++) {
                    var c = text.charAt(k);
                    if (c === CR) { out += LF; if (text.charAt(k+1) === LF) k++; }
                    else { out += c; }
                }
                text = out;
                var rows = []; var cur = ''; var inQ = false;
                for (var i = 0; i < text.length; i++) {
                    var ch = text[i];
                    if (ch === '"') {
                        if (inQ && text[i+1] === '"') { cur += '""'; i++; }
                        else { cur += ch; inQ = !inQ; }
                    } else if (ch === LF && !inQ) {
                        rows.push(_parseCsvLine(cur)); cur = '';
                    } else { cur += ch; }
                }
                if (cur.trim()) rows.push(_parseCsvLine(cur));
                return rows.filter(function(r){ return r.length > 0 && r.some(function(c){ return c && c.length; }); });
            }
            // 엑셀(.xlsx/.xls) 또는 CSV 통합 읽기 → 행 배열(2D) 반환
            function _readSpreadsheet(file) {
                return new Promise(function(resolve, reject) {
                    var name = (file.name || '').toLowerCase();
                    var isExcel = name.endsWith('.xlsx') || name.endsWith('.xls');
                    var reader = new FileReader();
                    if (isExcel) {
                        if (typeof XLSX === 'undefined') {
                            return reject(new Error('엑셀 라이브러리(XLSX)가 로드되지 않았습니다. 페이지를 새로고침하세요.'));
                        }
                        reader.onload = function(e) {
                            try {
                                var data = new Uint8Array(e.target.result);
                                var wb = XLSX.read(data, { type: 'array' });
                                var ws = wb.Sheets[wb.SheetNames[0]];
                                var rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: false });
                                resolve(rows.filter(function(r){ return r && r.some(function(c){ return c !== null && c !== undefined && (''+c).length; }); }));
                            } catch(err) { reject(err); }
                        };
                        reader.onerror = function(){ reject(reader.error); };
                        reader.readAsArrayBuffer(file);
                    } else {
                        reader.onload = function(e) {
                            try { resolve(_parseCsv(e.target.result)); } catch(err) { reject(err); }
                        };
                        reader.onerror = function(){ reject(reader.error); };
                        reader.readAsText(file, 'UTF-8');
                    }
                });
            }

            // 상품 대량등록 템플릿 다운로드 (확장: 이미지URL, 상세설명HTML 컬럼 추가)
            function downloadBulkTemplate() {
                var rows = [
                    ['상품명','가격(원)','설명/HTML','카테고리','재고','옵션','이미지URL','상세이미지URL'],
                    ['예시상품A',15000,'<h3>좋은 상품</h3><p>설명</p>','뷰티',-1,'사이즈:S,M,L|컬러:블랙,화이트','https://example.com/thumb.jpg','https://example.com/detail.jpg'],
                    ['예시상품B',9900,'간단 텍스트 설명도 OK','식품',100,'','','']
                ];
                if (typeof XLSX !== 'undefined') {
                    var ws = XLSX.utils.aoa_to_sheet(rows);
                    var wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, '상품');
                    XLSX.writeFile(wb, 'bulk_product_template.xlsx');
                } else {
                    // fallback CSV
                    var csvBody = rows.map(function(r){
                        return r.map(function(c){
                            var s = (c == null ? '' : String(c));
                            if (/[,"\\n]/.test(s)) s = '"' + s.replace(/"/g,'""') + '"';
                            return s;
                        }).join(',');
                    }).join('\\n');
                    var blob = new Blob(['\\uFEFF' + csvBody], {type:'text/csv;charset=utf-8'});
                    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'bulk_product_template.csv'; a.click();
                }
            }

            // 상품 대량등록 (CSV + 엑셀 통합) — HTML 설명, 이미지URL, 옵션 모두 지원
            // ★ 헤더 자동 감지: 첫 행이 헤더(상품명/가격...)인지 데이터인지 자동 판별
            // ★ 빈 행 자동 스킵 + 상세 진단 메시지로 누락 원인 정확히 안내
            function handleBulkProductUpload(input) {
                if (!input.files || !input.files[0]) return;
                var file = input.files[0];
                var statusEl = document.getElementById('bulkProductStatus');
                if (statusEl) statusEl.textContent = '읽는 중...';
                _readSpreadsheet(file).then(async function(rows) {
                    if (!rows || rows.length === 0) {
                        alert('파일에 읽을 수 있는 데이터가 없습니다.\\n\\n확인사항:\\n• 엑셀 첫 시트에 데이터가 있는지\\n• 셀이 텍스트/숫자로 채워져 있는지\\n• 빈 시트가 아닌지');
                        if(statusEl) statusEl.textContent='';
                        return;
                    }

                    // ★ 헤더 자동 감지: 첫 행 1번 컬럼이 '상품명' 또는 가격이 0/문자면 헤더로 간주
                    var firstRow = rows[0] || [];
                    var firstColRaw = (firstRow[0]||'').toString().trim();
                    var firstPriceRaw = (firstRow[1]||'').toString().trim();
                    var firstPriceNum = parseInt(firstPriceRaw.replace(/[^\\d-]/g,'')) || 0;
                    var headerKeywords = ['상품명','상품 명','품명','이름','name','product','product name'];
                    var looksLikeHeader = headerKeywords.indexOf(firstColRaw.toLowerCase()) !== -1
                                          || firstColRaw === '상품명'
                                          || (firstPriceRaw && firstPriceNum === 0 && !/^\\d/.test(firstPriceRaw));
                    var startIdx = looksLikeHeader ? 1 : 0;

                    if (rows.length - startIdx < 1) {
                        alert('헤더 행은 있지만 데이터 행이 없습니다.\\n\\n첫 행에 헤더(상품명, 가격, ...)을 두고\\n두 번째 행부터 실제 상품 데이터를 입력하세요.');
                        if(statusEl) statusEl.textContent='';
                        return;
                    }

                    var count = 0; var errors = []; var skippedEmpty = 0;
                    var processed = 0;
                    var totalDataRows = rows.length - startIdx;

                    for (var i = startIdx; i < rows.length; i++) {
                        var r = rows[i] || [];
                        // 행 자체가 완전히 비어있으면 조용히 스킵
                        var hasAnyValue = r.some(function(c){ return c !== null && c !== undefined && (''+c).trim().length; });
                        if (!hasAnyValue) { skippedEmpty++; continue; }

                        var pName = (r[0]||'').toString().trim();
                        var priceRaw = (r[1]||'').toString().trim();
                        var pPrice = parseInt(priceRaw.replace(/[^\\d-]/g,'')) || 0;
                        var pDesc = (r[2]||'').toString();  // HTML 또는 텍스트 모두 허용
                        var pCat = (r[3]||'').toString().trim() || '일반';
                        var pStockRaw = (r[4]||'').toString().trim();
                        var pStock = pStockRaw === '' ? -1 : parseInt(pStockRaw);
                        if (isNaN(pStock)) pStock = -1;
                        var pOptsRaw = (r[5]||'').toString().trim();
                        var pImage = (r[6]||'').toString().trim();
                        var pDetail = (r[7]||'').toString().trim();
                        var pOpts = '';
                        if (pOptsRaw) {
                            try {
                                var optArr = pOptsRaw.split('|').map(function(g){ var p=g.split(':'); return {name:(p[0]||'').trim(), values:(p[1]||'').split(',').map(function(x){return x.trim();}).filter(function(x){return x;})}; }).filter(function(o){return o.name && o.values.length;});
                                if (optArr.length) pOpts = JSON.stringify(optArr);
                            } catch(e) {}
                        }

                        // 상세 진단 메시지
                        if (!pName && !priceRaw) {
                            errors.push((i+1)+'행: 상품명, 가격 모두 비어있음');
                            continue;
                        }
                        if (!pName) {
                            errors.push((i+1)+'행: 상품명(A열)이 비어있음');
                            continue;
                        }
                        if (pPrice <= 0) {
                            if (!priceRaw) errors.push((i+1)+'행: 가격(B열)이 비어있음 [상품명: ' + pName + ']');
                            else errors.push((i+1)+'행: 가격(B열) 인식 실패 "' + priceRaw + '" → 숫자만 입력하세요 [상품명: ' + pName + ']');
                            continue;
                        }

                        processed++;
                        if (statusEl) statusEl.textContent = '등록 중... (' + processed + '/' + totalDataRows + ')';
                        try {
                            await axios.post('/api/admin/shop/product', {
                                name: pName, description: pDesc, price_krw: pPrice,
                                image_url: pImage, detail_image_url: pDetail,
                                category: pCat, stock: pStock, options: pOpts
                            });
                            count++;
                        } catch(e) { errors.push((i+1)+'행: ' + ((e.response && e.response.data && e.response.data.error) || '서버 오류') + ' [상품명: ' + pName + ']'); }
                    }

                    var summary = count + '개 상품 등록 완료!';
                    if (skippedEmpty > 0) summary += '\\n빈 행 ' + skippedEmpty + '건 자동 스킵.';
                    if (errors.length > 0) {
                        summary += '\\n\\n오류 ' + errors.length + '건:\\n' + errors.slice(0,10).join('\\n') + (errors.length>10?'\\n... 외 ' + (errors.length-10) + '건':'');
                        summary += '\\n\\n💡 도움말:\\n• 「엑셀 템플릿 다운로드」 버튼으로 정확한 컬럼 순서 확인\\n• A열=상품명, B열=가격(숫자만), C열=설명, D열=카테고리\\n• 가격은 콤마/원 표시 없이 숫자만 (예: 15000)';
                    }
                    alert(summary);
                    if (statusEl) statusEl.textContent = count + '개 등록됨' + (errors.length ? ' / 오류 ' + errors.length + '건' : '');
                    loadAdminShopProducts();
                }).catch(function(err) {
                    alert('파일 읽기 실패: ' + (err.message || err) + '\\n\\n• 엑셀(.xlsx/.xls) 또는 CSV 파일만 지원\\n• 페이지 새로고침 후 다시 시도하세요');
                    if (statusEl) statusEl.textContent = '';
                });
                input.value = '';
            }

            // 송장 템플릿 다운로드 (엑셀 우선)
            function downloadTrackingTemplate() {
                var rows = [
                    ['주문번호','송장번호','택배사'],
                    [1,'1234567890','CJ대한통운'],
                    [2,'9876543210','우체국택배']
                ];
                if (typeof XLSX !== 'undefined') {
                    var ws = XLSX.utils.aoa_to_sheet(rows);
                    var wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, '송장');
                    XLSX.writeFile(wb, 'tracking_template.xlsx');
                } else {
                    var csvBody = rows.map(function(r){ return r.join(','); }).join('\\n');
                    var blob = new Blob(['\\uFEFF' + csvBody], {type:'text/csv;charset=utf-8'});
                    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'tracking_template.csv'; a.click();
                }
            }

            // 송장 일괄등록 (CSV + 엑셀 통합)
            function handleTrackingUpload(input) {
                if (!input.files || !input.files[0]) return;
                var file = input.files[0];
                _readSpreadsheet(file).then(async function(rows) {
                    if (!rows || rows.length < 2) { alert('데이터가 없습니다 (헤더 1행 + 데이터 1행 이상 필요)'); return; }
                    var count = 0; var errors = [];
                    for (var i = 1; i < rows.length; i++) {
                        var r = rows[i];
                        var orderId = (r[0]||'').toString().trim();
                        var trackingNo = (r[1]||'').toString().trim();
                        var courier = (r[2]||'').toString().trim();
                        if (!orderId || !trackingNo) { errors.push((i+1)+'행: 주문번호/송장번호 누락'); continue; }
                        try {
                            await axios.put('/api/admin/shop/order/' + orderId + '/status', {status:'shipping', trackingNo:trackingNo, courier:courier});
                            count++;
                        } catch(e) { errors.push((i+1)+'행: ' + (e.response?.data?.error || '오류')); }
                    }
                    alert(count + '건 송장 등록 완료!' + (errors.length > 0 ? '\\n\\n오류 ' + errors.length + '건:\\n' + errors.slice(0,10).join('\\n') + (errors.length>10?'\\n...':'') : ''));
                    loadAdminShopOrders();
                }).catch(function(err) {
                    alert('파일 읽기 실패: ' + (err.message || err));
                });
                input.value = '';
            }

            async function adminAddProduct() {
                var name = document.getElementById('shopProdName').value.trim();
                var price = parseInt(document.getElementById('shopProdPrice').value) || 0;
                var desc = _descHtmlMode ? document.getElementById('shopProdDescHtml').value.trim() : document.getElementById('shopProdDesc').value.trim();
                var image = document.getElementById('shopProdImage').value.trim();
                // 상세이미지: 여러장이면 JSON 배열, 1장이면 그대로
                var detailImage = '';
                if (detailImagesArray.length > 1) {
                    detailImage = JSON.stringify(detailImagesArray);
                } else if (detailImagesArray.length === 1) {
                    detailImage = detailImagesArray[0];
                }
                var category = document.getElementById('shopProdCategory').value.trim() || '일반';
                var stock = parseInt(document.getElementById('shopProdStock').value);
                if (isNaN(stock)) stock = -1;
                var options = collectOptions();

                if (!name || price <= 0) {
                    alert('상품명과 가격(원)은 필수입니다.');
                    return;
                }
                // 프론트 크기 검증
                var totalImgSize = image.length + detailImage.length;
                if (totalImgSize > 900 * 1024) {
                    alert('이미지 용량이 너무 큽니다 (' + Math.round(totalImgSize/1024) + 'KB). 이미지를 줄여주세요.');
                    return;
                }
                try {
                    var res = await axios.post('/api/admin/shop/product', {
                        name: name, description: desc, price_krw: price,
                        image_url: image, detail_image_url: detailImage, category: category, stock: stock, options: options
                    });
                    if (res.data.success) {
                        alert('상품이 등록되었습니다!');
                        document.getElementById('shopProdName').value = '';
                        document.getElementById('shopProdPrice').value = '';
                        document.getElementById('shopProdDesc').value = '';
                        document.getElementById('shopProdDescHtml').value = '';
                        if (_descHtmlMode) { toggleDescMode(); } // reset to text mode
                        document.getElementById('shopProdImage').value = '';
                        document.getElementById('shopProdCategory').value = '';
                        document.getElementById('shopProdStock').value = '-1';
                        clearImage('thumb');
                        detailImagesArray = [];
                        renderDetailImageList();
                        document.getElementById('shopProdOptions').innerHTML = '<div class="flex gap-2 items-center"><input type="text" placeholder="옵션명 (예: 사이즈)" class="shopOptName px-2 py-1.5 border rounded text-sm w-28"><input type="text" placeholder="항목 (쉼표 구분: S,M,L,XL)" class="shopOptValues px-2 py-1.5 border rounded text-sm flex-1"><button onclick="removeOptionRow(this)" class="text-red-400 hover:text-red-600 text-sm"><i class="fas fa-times-circle"></i></button></div>';
                        loadAdminShopProducts();
                    }
                } catch(e) {
                    alert(e.response?.data?.error || '상품 등록 중 오류');
                }
            }

            // 어드민 상품 캐시 (검색/필터링/페이지네이션 위해 클라이언트에 보관)
            var _adminProductsCache = [];
            var _adminProductPage = 1;
            var _adminProductPageSize = 20;

            async function loadAdminShopProducts() {
                try {
                    var res = await axios.get('/api/admin/shop/products');
                    if (!res.data.success) return;
                    _adminProductsCache = res.data.products || [];
                    _adminProductPage = 1;
                    renderAdminProducts();
                } catch(e) {
                    console.error('Admin products load error:', e);
                }
            }

            // 검색/필터 변경 시 1페이지로 리셋
            function onAdminProductSearchChange() {
                _adminProductPage = 1;
                renderAdminProducts();
            }

            // 페이지 사이즈 변경
            function onAdminProductPageSizeChange() {
                var sel = document.getElementById('adminProductPageSize');
                _adminProductPageSize = parseInt(sel ? sel.value : '20') || 20;
                _adminProductPage = 1;
                renderAdminProducts();
            }

            // 페이지 이동
            function gotoAdminProductPage(p) {
                _adminProductPage = p;
                renderAdminProducts();
                // 상품 목록 상단으로 스크롤
                var listTop = document.getElementById('adminProductList');
                if (listTop) listTop.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }

            function renderAdminProducts() {
                var el = document.getElementById('adminProductList');
                if (!el) return;
                var countEl = document.getElementById('adminProductCount');
                var pagEl = document.getElementById('adminProductPagination');
                var q = ((document.getElementById('adminProductSearch') || {}).value || '').toLowerCase().trim();
                var statusF = (document.getElementById('adminProductFilterStatus') || {}).value || '';

                var filtered = _adminProductsCache.filter(function(p) {
                    if (statusF === 'active' && !p.is_active) return false;
                    if (statusF === 'inactive' && p.is_active) return false;
                    if (q) {
                        var hay = ((p.name||'') + ' ' + (p.category||'') + ' ' + ((p.description||'').replace(/<[^>]*>/g,''))).toLowerCase();
                        if (hay.indexOf(q) === -1) return false;
                    }
                    return true;
                });

                var total = filtered.length;
                var pageSize = _adminProductPageSize || 20;
                var totalPages = Math.max(1, Math.ceil(total / pageSize));
                if (_adminProductPage > totalPages) _adminProductPage = totalPages;
                if (_adminProductPage < 1) _adminProductPage = 1;

                if (countEl) {
                    countEl.textContent = '(' + total + '/' + _adminProductsCache.length + ' / ' + _adminProductPage + '/' + totalPages + ' 페이지)';
                }

                if (_adminProductsCache.length === 0) {
                    el.innerHTML = '<p class="text-gray-400 text-center py-4">등록된 상품이 없습니다</p>';
                    if (pagEl) pagEl.innerHTML = '';
                    return;
                }
                if (filtered.length === 0) {
                    el.innerHTML = '<p class="text-gray-400 text-center py-4">검색/필터 조건에 맞는 상품이 없습니다</p>';
                    if (pagEl) pagEl.innerHTML = '';
                    return;
                }

                // 현재 페이지 슬라이스
                var startIdx = (_adminProductPage - 1) * pageSize;
                var endIdx = Math.min(startIdx + pageSize, total);
                var pageItems = filtered.slice(startIdx, endIdx);

                el.innerHTML = pageItems.map(function(p) {
                    var qkeyPrice = Math.ceil(p.price_krw / 10);
                    var activeLabel = p.is_active ? '<span class="text-green-600 text-xs font-bold">판매중</span>' : '<span class="text-red-500 text-xs font-bold">비활성</span>';
                    var stockLabel = p.stock === -1 ? '무제한' : p.stock;
                    return '<div class="flex items-center justify-between border rounded-lg p-3 hover:bg-gray-50">' +
                        '<div class="flex-1 min-w-0">' +
                            '<div class="flex items-center gap-2 mb-1">' +
                                '<span class="font-bold text-sm text-gray-800">' + esc(p.name) + '</span>' +
                                activeLabel +
                                '<span class="text-xs text-gray-400">[' + esc(p.category) + ']</span>' +
                            '</div>' +
                            '<p class="text-xs text-gray-500 truncate">' + esc((p.description || '-').replace(/<[^>]*>/g,'').substring(0,100)) + '</p>' +
                            '<p class="text-xs text-gray-600 mt-1">' + Number(p.price_krw).toLocaleString() + '원 / ' + qkeyPrice.toLocaleString() + ' QKEY | 재고: ' + stockLabel + '</p>' +
                            '<p class="text-xs mt-1">' +
                                (p.image_url ? '<span class="text-blue-500"><i class="fas fa-image mr-1"></i>썸네일✓</span> ' : '<span class="text-gray-300">썸네일✗</span> ') +
                                (p.detail_image_url ? '<span class="text-purple-500"><i class="fas fa-file-image mr-1"></i>상세이미지✓</span>' : '<span class="text-gray-300">상세이미지✗</span>') +
                            '</p>' +
                            (p.options ? '<p class="text-xs mt-1 text-orange-600"><i class="fas fa-list-ul mr-1"></i>' + (function(){ try { var opts=JSON.parse(p.options); return opts.map(function(o){return o.name+':'+o.values.join(',')}).join(' | '); } catch(e){ return p.options; } })() + '</p>' : '') +
                        '</div>' +
                        '<div class="flex flex-col gap-1 ml-3">' +
                            '<button onclick="adminEditProduct(' + p.id + ')" class="px-3 py-2 text-xs bg-blue-600 text-white hover:bg-blue-700 rounded font-bold shadow"><i class="fas fa-edit mr-1"></i>수정/저장</button>' +
                            '<button onclick="adminToggleProduct(' + p.id + ',' + (p.is_active ? 0 : 1) + ',this)" class="px-2 py-1 text-xs rounded ' + (p.is_active ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-green-100 text-green-600 hover:bg-green-200') + '">' +
                                (p.is_active ? '<i class="fas fa-ban mr-1"></i>비활성' : '<i class="fas fa-check mr-1"></i>활성화') +
                            '</button>' +
                            '<button onclick="adminDeleteProduct(' + p.id + ')" class="px-2 py-1 text-xs bg-gray-100 text-gray-600 hover:bg-gray-200 rounded"><i class="fas fa-trash mr-1"></i>삭제</button>' +
                        '</div>' +
                    '</div>';
                }).join('');

                // 페이지네이션 컨트롤 렌더링
                if (pagEl) {
                    pagEl.innerHTML = buildPaginationHtml(_adminProductPage, totalPages, 'gotoAdminProductPage');
                }
            }

            // 공용 페이지네이션 HTML 빌더 (이전/다음/페이지번호/처음/끝)
            function buildPaginationHtml(currentPage, totalPages, fnName) {
                if (totalPages <= 1) {
                    return '<span class="text-xs text-gray-500">' + (totalPages === 1 ? '1 페이지' : '내역 없음') + '</span>';
                }
                var html = '';
                var btnBase = 'min-w-[36px] px-3 py-1.5 text-xs font-bold rounded transition border';
                var btnActive = 'bg-blue-600 text-white border-blue-600 shadow';
                var btnIdle = 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100';
                var btnDisabled = 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed';

                // 처음
                if (currentPage > 1) {
                    html += '<button onclick="' + fnName + '(1)" class="' + btnBase + ' ' + btnIdle + '" title="처음"><i class="fas fa-angle-double-left"></i></button>';
                } else {
                    html += '<button disabled class="' + btnBase + ' ' + btnDisabled + '"><i class="fas fa-angle-double-left"></i></button>';
                }
                // 이전
                if (currentPage > 1) {
                    html += '<button onclick="' + fnName + '(' + (currentPage - 1) + ')" class="' + btnBase + ' ' + btnIdle + '" title="이전"><i class="fas fa-angle-left mr-1"></i>이전</button>';
                } else {
                    html += '<button disabled class="' + btnBase + ' ' + btnDisabled + '"><i class="fas fa-angle-left mr-1"></i>이전</button>';
                }

                // 페이지 번호 (현재 ±2 범위)
                var startP = Math.max(1, currentPage - 2);
                var endP = Math.min(totalPages, currentPage + 2);
                if (startP > 1) html += '<span class="px-1 text-xs text-gray-400">...</span>';
                for (var pn = startP; pn <= endP; pn++) {
                    if (pn === currentPage) {
                        html += '<button class="' + btnBase + ' ' + btnActive + '">' + pn + '</button>';
                    } else {
                        html += '<button onclick="' + fnName + '(' + pn + ')" class="' + btnBase + ' ' + btnIdle + '">' + pn + '</button>';
                    }
                }
                if (endP < totalPages) html += '<span class="px-1 text-xs text-gray-400">...</span>';

                // 다음
                if (currentPage < totalPages) {
                    html += '<button onclick="' + fnName + '(' + (currentPage + 1) + ')" class="' + btnBase + ' ' + btnIdle + '" title="다음">다음<i class="fas fa-angle-right ml-1"></i></button>';
                } else {
                    html += '<button disabled class="' + btnBase + ' ' + btnDisabled + '">다음<i class="fas fa-angle-right ml-1"></i></button>';
                }
                // 끝
                if (currentPage < totalPages) {
                    html += '<button onclick="' + fnName + '(' + totalPages + ')" class="' + btnBase + ' ' + btnIdle + '" title="끝"><i class="fas fa-angle-double-right"></i></button>';
                } else {
                    html += '<button disabled class="' + btnBase + ' ' + btnDisabled + '"><i class="fas fa-angle-double-right"></i></button>';
                }

                html += '<span class="ml-2 text-xs text-gray-500">' + currentPage + ' / ' + totalPages + '</span>';
                return html;
            }

            async function adminToggleProduct(id, newActive, btnEl) {
                try {
                    // 기존 상품 정보를 가져와서 is_active만 변경 (options/description 포함 모든 필드 유지)
                    var res = await axios.get('/api/admin/shop/products');
                    var product = (res.data.products || []).find(function(p) { return p.id === id; });
                    if (!product) { alert('상품을 찾을 수 없습니다'); return; }
                    await axios.put('/api/admin/shop/product/' + id, {
                        name: product.name,
                        description: product.description,
                        price_krw: product.price_krw,
                        image_url: product.image_url || '',
                        detail_image_url: product.detail_image_url || '',
                        category: product.category,
                        stock: product.stock,
                        is_active: newActive,
                        options: product.options || ''  // ★ 옵션 보존 (누락 시 기존 옵션 손실)
                    });
                    loadAdminShopProducts();
                } catch(e) {
                    alert('상태 변경 중 오류');
                }
            }

            async function adminDeleteProduct(id) {
                if (!confirm('이 상품을 삭제하시겠습니까?')) return;
                try {
                    await axios.delete('/api/admin/shop/product/' + id);
                    loadAdminShopProducts();
                } catch(e) {
                    alert('삭제 중 오류');
                }
            }

            var shopOrderRefreshTimer = null;
            // 캐시: 최근 fetch한 주문 원본 (필터링은 클라이언트에서)
            var _adminShopOrdersCache = [];

            async function loadAdminShopOrders() {
                try {
                    var res = await axios.get('/api/admin/shop/orders');
                    if (!res.data.success) return;
                    var orders = res.data.orders || [];
                    var stats = res.data.stats || {};
                    _adminShopOrdersCache = orders;

                    // 통계 업데이트 (전체 기준)
                    document.getElementById('shopStatOrders').textContent = (stats.total_orders || 0).toLocaleString();
                    document.getElementById('shopStatQkey').textContent = Math.round(stats.total_qkey || 0).toLocaleString();
                    document.getElementById('shopStatKrw').textContent = Number(stats.total_krw || 0).toLocaleString();
                    document.getElementById('shopStatBuyers').textContent = (stats.unique_buyers || 0).toLocaleString();

                    renderAdminOrders();
                } catch(e) {
                    console.error('Admin orders load error:', e);
                }

                // 실시간 자동 새로고침 (10초마다)
                if (shopOrderRefreshTimer) clearInterval(shopOrderRefreshTimer);
                if (currentTab === 'shop') {
                    shopOrderRefreshTimer = setInterval(function() {
                        if (currentTab === 'shop') loadAdminShopOrders();
                        else clearInterval(shopOrderRefreshTimer);
                    }, 10000);
                }
            }

            // ================== 어드민: 쇼핑몰 문의 관리 ==================
            var _adminInquiriesCache = [];
            var shopInquiryRefreshTimer = null;

            async function loadAdminInquiries() {
                try {
                    var res = await axios.get('/api/admin/shop/inquiries');
                    if (!res.data.success) return;
                    _adminInquiriesCache = res.data.inquiries || [];
                    renderAdminInquiries();
                } catch(e) {
                    console.error('Admin inquiries load error:', e);
                    var el = document.getElementById('adminInquiryList');
                    if (el) el.innerHTML = '<p class="text-center py-6 text-red-400 text-sm">조회 중 오류가 발생했습니다</p>';
                }
                if (shopInquiryRefreshTimer) clearInterval(shopInquiryRefreshTimer);
                if (currentTab === 'shop') {
                    shopInquiryRefreshTimer = setInterval(function() {
                        if (currentTab === 'shop') loadAdminInquiries();
                        else clearInterval(shopInquiryRefreshTimer);
                    }, 30000);
                }
            }

            function renderAdminInquiries() {
                var el = document.getElementById('adminInquiryList');
                var countEl = document.getElementById('adminInquiryCount');
                if (!el) return;
                var fStatus = (document.getElementById('adminInquiryFilterStatus') || {}).value || '';
                var fCat = (document.getElementById('adminInquiryFilterCategory') || {}).value || '';
                var items = (_adminInquiriesCache || []).filter(function(it) {
                    if (fStatus && it.status !== fStatus) return false;
                    if (fCat && it.category !== fCat) return false;
                    return true;
                });
                if (countEl) countEl.textContent = '(' + items.length + '건)';
                if (items.length === 0) {
                    el.innerHTML = '<p class="text-center py-6 text-gray-400 text-sm"><i class="fas fa-inbox text-2xl text-gray-200 mb-1 block"></i>조회된 문의가 없습니다</p>';
                    return;
                }
                var catLabel = { shipping:'배송', refund:'환불', other:'기타' };
                var catColor = { shipping:'blue', refund:'orange', other:'gray' };
                el.innerHTML = items.map(function(it) {
                    var date = new Date(it.created_at).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'});
                    var color = catColor[it.category] || 'gray';
                    var statusBadge = it.status === 'answered'
                        ? '<span class="text-[11px] px-2 py-0.5 bg-green-100 text-green-700 rounded-full">답변완료</span>'
                        : '<span class="text-[11px] px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">답변대기</span>';
                    var orderTag = it.order_id ? '<span class="text-[11px] text-gray-500 ml-1">주문 #' + it.order_id + '</span>' : '';
                    var replyBlock = it.admin_reply
                        ? '<div class="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800"><p class="font-bold mb-1"><i class="fas fa-reply mr-1"></i>관리자 답변</p><p class="whitespace-pre-wrap">' + escapeHtml(it.admin_reply) + '</p>' + (it.replied_at ? '<p class="text-[10px] text-blue-500 mt-1">' + new Date(it.replied_at).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'}) + '</p>' : '') + '</div>'
                        : '';
                    return '<div class="bg-white border border-gray-200 rounded-lg p-3">' +
                        '<div class="flex items-center justify-between mb-2 flex-wrap gap-1">' +
                            '<div class="flex items-center gap-2 flex-wrap">' +
                                '<span class="text-[11px] px-2 py-0.5 bg-' + color + '-100 text-' + color + '-700 rounded-full">' + (catLabel[it.category]||it.category) + '</span>' +
                                statusBadge +
                                '<span class="text-xs text-gray-700 font-medium">' + escapeHtml(it.user_name || '') + '</span>' +
                                '<span class="text-[11px] text-gray-400">' + escapeHtml(it.user_email || '') + '</span>' +
                                orderTag +
                            '</div>' +
                            '<span class="text-[11px] text-gray-400">' + date + '</span>' +
                        '</div>' +
                        '<p class="text-sm font-bold text-gray-800">' + escapeHtml(it.title) + '</p>' +
                        '<p class="text-xs text-gray-600 mt-1 whitespace-pre-wrap">' + escapeHtml(it.content) + '</p>' +
                        replyBlock +
                        '<div class="mt-2 flex gap-2">' +
                            '<button onclick="adminReplyInquiry(' + it.id + ')" class="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold"><i class="fas fa-reply mr-1"></i>' + (it.admin_reply ? '답변 수정' : '답변 작성') + '</button>' +
                            '<button onclick="adminDeleteInquiry(' + it.id + ')" class="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded text-xs font-bold border border-red-200"><i class="fas fa-trash mr-1"></i>삭제</button>' +
                        '</div>' +
                    '</div>';
                }).join('');
            }

            async function adminReplyInquiry(id) {
                var existing = (_adminInquiriesCache || []).find(function(x){return x.id===id;});
                var prev = existing && existing.admin_reply ? existing.admin_reply : '';
                var reply = prompt('답변 내용을 입력하세요:', prev);
                if (reply === null) return;
                reply = String(reply).trim();
                if (!reply) { alert('답변 내용을 입력해주세요'); return; }
                try {
                    var res = await axios.post('/api/admin/shop/inquiry/' + id + '/reply', { reply: reply });
                    if (res.data.success) {
                        alert('답변이 등록되었습니다');
                        loadAdminInquiries();
                    } else {
                        alert(res.data.error || '답변 등록 실패');
                    }
                } catch(e) {
                    alert((e.response && e.response.data && e.response.data.error) || '답변 등록 중 오류가 발생했습니다');
                }
            }

            async function adminDeleteInquiry(id) {
                if (!confirm('이 문의를 삭제하시겠습니까?')) return;
                try {
                    await axios.delete('/api/admin/shop/inquiry/' + id);
                    loadAdminInquiries();
                } catch(e) {
                    alert('삭제 중 오류가 발생했습니다');
                }
            }

            // ================== 어드민: 공지사항 관리 ==================
            var _adminNoticesCache = [];

            async function loadAdminNotices() {
                var listEl = document.getElementById('adminNoticeList');
                var countEl = document.getElementById('adminNoticeCount');
                if (!listEl) return;
                try {
                    var res = await axios.get('/api/admin/notices?t=' + Date.now());
                    var items = (res.data && res.data.notices) || [];
                    _adminNoticesCache = items;
                    if (countEl) countEl.textContent = '(' + items.length + '건)';
                    if (items.length === 0) {
                        listEl.innerHTML = '<p class="text-center text-gray-400 text-sm py-6">등록된 공지가 없습니다</p>';
                        return;
                    }
                    listEl.innerHTML = items.map(function(n) {
                        var date = n.created_at ? new Date(n.created_at).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'}) : '-';
                        var pinTag = n.is_pinned ? '<span class="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-[10px] font-bold mr-1">중요</span>' : '';
                        var statusTag = n.is_active ? '<span class="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-bold">게시중</span>' : '<span class="px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded text-[10px] font-bold">숨김</span>';
                        var preview = String(n.content || '').replace(/<[^>]*>/g,'').substring(0,100);
                        return '<div class="border rounded-lg p-3 hover:bg-gray-50">' +
                            '<div class="flex items-start justify-between gap-2 mb-1">' +
                                '<div class="flex-1 min-w-0">' +
                                    '<p class="text-sm font-bold text-gray-800 truncate">' + pinTag + esc(n.title) + ' ' + statusTag + '</p>' +
                                    '<p class="text-xs text-gray-500 mt-0.5 truncate">' + esc(preview) + '</p>' +
                                    '<p class="text-[10px] text-gray-400 mt-1">' + date + '</p>' +
                                '</div>' +
                                '<div class="flex flex-col gap-1">' +
                                    '<button onclick="editNotice(' + n.id + ')" class="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-bold"><i class="fas fa-edit mr-1"></i>수정</button>' +
                                    '<button onclick="toggleNoticeActive(' + n.id + ',' + (n.is_active ? 0 : 1) + ')" class="px-2 py-1 ' + (n.is_active ? 'bg-gray-200 hover:bg-gray-300 text-gray-700' : 'bg-green-100 hover:bg-green-200 text-green-700') + ' rounded text-[11px] font-bold">' + (n.is_active ? '<i class="fas fa-eye-slash mr-1"></i>숨김' : '<i class="fas fa-eye mr-1"></i>게시') + '</button>' +
                                    '<button onclick="deleteNotice(' + n.id + ')" class="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-[11px] font-bold"><i class="fas fa-trash mr-1"></i>삭제</button>' +
                                '</div>' +
                            '</div>' +
                        '</div>';
                    }).join('');
                } catch(e) {
                    listEl.innerHTML = '<p class="text-center text-red-400 text-sm py-6">공지를 불러올 수 없습니다</p>';
                }
            }

            function resetNoticeForm() {
                var idEl = document.getElementById('noticeEditId');
                var titleEl = document.getElementById('noticeTitle');
                var contentEl = document.getElementById('noticeContent');
                var pinEl = document.getElementById('noticePinned');
                var actEl = document.getElementById('noticeActive');
                var formTitleEl = document.getElementById('noticeFormTitle');
                if (idEl) idEl.value = '';
                if (titleEl) titleEl.value = '';
                if (contentEl) contentEl.value = '';
                if (pinEl) pinEl.checked = false;
                if (actEl) actEl.checked = true;
                if (formTitleEl) formTitleEl.textContent = '새 공지 작성';
            }

            function editNotice(id) {
                var n = _adminNoticesCache.find(function(x){ return x.id === id; });
                if (!n) return;
                document.getElementById('noticeEditId').value = String(id);
                document.getElementById('noticeTitle').value = n.title || '';
                document.getElementById('noticeContent').value = n.content || '';
                document.getElementById('noticePinned').checked = !!n.is_pinned;
                document.getElementById('noticeActive').checked = !!n.is_active;
                document.getElementById('noticeFormTitle').textContent = '공지 수정 (#' + id + ')';
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }

            async function saveNotice() {
                var id = (document.getElementById('noticeEditId').value || '').trim();
                var title = (document.getElementById('noticeTitle').value || '').trim();
                var content = (document.getElementById('noticeContent').value || '').trim();
                var isPinned = document.getElementById('noticePinned').checked;
                var isActive = document.getElementById('noticeActive').checked;
                if (!title) { alert('제목을 입력해주세요'); return; }
                if (!content) { alert('내용을 입력해주세요'); return; }
                try {
                    var payload = { title: title, content: content, isPinned: isPinned ? 1 : 0, isActive: isActive ? 1 : 0 };
                    if (id) {
                        await axios.put('/api/admin/notices/' + id, payload);
                        alert('공지가 수정되었습니다');
                    } else {
                        await axios.post('/api/admin/notices', payload);
                        alert('공지가 등록되었습니다');
                    }
                    resetNoticeForm();
                    loadAdminNotices();
                } catch(e) {
                    alert((e.response && e.response.data && e.response.data.error) || '저장 실패');
                }
            }

            async function toggleNoticeActive(id, newActive) {
                var n = _adminNoticesCache.find(function(x){ return x.id === id; });
                if (!n) return;
                try {
                    await axios.put('/api/admin/notices/' + id, { title: n.title, content: n.content, isPinned: n.is_pinned ? 1 : 0, isActive: newActive });
                    loadAdminNotices();
                } catch(e) {
                    alert('상태 변경 실패');
                }
            }

            async function deleteNotice(id) {
                if (!confirm('이 공지를 삭제하시겠습니까? 복구할 수 없습니다.')) return;
                try {
                    await axios.delete('/api/admin/notices/' + id);
                    loadAdminNotices();
                } catch(e) {
                    alert('삭제 실패');
                }
            }

            // 클라이언트 사이드 필터링/렌더링
            function renderAdminOrders() {
                var tbody = document.getElementById('adminOrderTableBody');
                if (!tbody) return;
                var statusFilter = (document.getElementById('adminOrderFilterStatus') || {}).value || '';
                var textFilter = ((document.getElementById('adminOrderFilterText') || {}).value || '').toLowerCase().trim();

                var filtered = _adminShopOrdersCache.filter(function(o) {
                    if (statusFilter && o.status !== statusFilter) return false;
                    if (textFilter) {
                        var hay = ((o.user_name||'') + ' ' + (o.user_email||'') + ' ' + (o.product_name||'')).toLowerCase();
                        if (hay.indexOf(textFilter) === -1) return false;
                    }
                    return true;
                });

                if (filtered.length === 0) {
                    var msg = (statusFilter || textFilter)
                        ? '필터 조건에 맞는 주문이 없습니다'
                        : '주문 내역이 없습니다';
                    tbody.innerHTML = '<tr><td colspan="7" class="text-center py-8 text-gray-400">' + msg + '</td></tr>';
                    return;
                }
                tbody.innerHTML = filtered.map(function(o) {
                    var date = new Date(o.created_at).toLocaleString('ko-KR', {timeZone: 'Asia/Seoul'});
                    var statusOptions = ['paid','shipping','delivered','cancelled'];
                    var statusLabels = {paid:'결제완료',shipping:'배송중',delivered:'배송완료',cancelled:'취소완료'};
                    var statusColors = {paid:'green',shipping:'blue',delivered:'gray',cancelled:'red'};
                    var selectHtml = '<select onchange="adminUpdateOrderStatus(' + o.id + ', this.value)" class="text-xs border rounded px-1 py-0.5 bg-' + (statusColors[o.status]||'gray') + '-50">';
                    statusOptions.forEach(function(s) {
                        selectHtml += '<option value="' + s + '"' + (o.status === s ? ' selected' : '') + '>' + statusLabels[s] + '</option>';
                    });
                    selectHtml += '</select>';
                    // 취소된 주문: 처리자/사유/일시 표시
                    var cancelMeta = '';
                    if (o.status === 'cancelled') {
                        var cDate = o.cancelled_at ? new Date(o.cancelled_at).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'}) : '-';
                        var cBy = o.cancelled_by === 'admin' ? '관리자' : (o.cancelled_by === 'user' ? '본인' : '시스템');
                        cancelMeta = '<div class="text-[10px] text-red-600 mt-1 leading-tight"><i class="fas fa-times-circle mr-1"></i>' + cBy + ' 취소 / ' + cDate + (o.cancel_reason ? ' / ' + esc(o.cancel_reason) : '') + '</div>';
                    }
                    var shippingInfo = [o.shipping_name, o.shipping_phone, o.shipping_address].filter(Boolean).join(' / ') || '-';
                    // 송장 정보 추출 (shipping_memo에 "[택배사] 송장: 번호" 형식으로 저장됨)
                    // ★ 정규식 대신 안전한 문자열 파싱 사용 (백틱 템플릿 이스케이프 문제 회피)
                    var trackingDisplay = '';
                    var memo = o.shipping_memo || '';
                    var trackInfo = parseTrackingFromMemo(memo);
                    if (trackInfo.no) {
                        trackingDisplay = '<div class="text-xs text-blue-600 mt-1"><i class="fas fa-truck mr-1"></i>' + (trackInfo.courier ? '[' + esc(trackInfo.courier) + '] ' : '') + esc(trackInfo.no) + '</div>';
                    }
                    // 개별 송장 등록/수정 버튼
                    var trackBtnLabel = trackInfo.no ? '<i class="fas fa-edit mr-1"></i>송장수정' : '<i class="fas fa-truck mr-1"></i>송장등록';
                    var trackBtnColor = trackInfo.no ? 'bg-purple-500 hover:bg-purple-600' : 'bg-blue-500 hover:bg-blue-600';
                    var trackBtn = '<button onclick="openTrackingModal(' + o.id + ')" class="px-2 py-1 text-xs ' + trackBtnColor + ' text-white rounded font-bold shadow mt-1 w-full">' + trackBtnLabel + '</button>';
                    return '<tr class="hover:bg-gray-50' + (o.status === 'cancelled' ? ' bg-red-50' : '') + '">' +
                        '<td class="px-3 py-2 text-xs"><span class="font-medium">' + esc(o.user_name || '-') + '</span><br><span class="text-gray-400">' + esc(o.user_email || '') + '</span></td>' +
                        '<td class="px-3 py-2 text-xs font-medium ' + (o.status === 'cancelled' ? 'line-through text-gray-500' : '') + '">' + esc(o.product_name) + ' x' + o.quantity + '</td>' +
                        '<td class="px-3 py-2 text-xs text-right">' + Number(o.price_krw).toLocaleString() + '원</td>' +
                        '<td class="px-3 py-2 text-xs text-right font-bold text-pink-600">' + Number(o.qkey_used).toLocaleString() + '</td>' +
                        '<td class="px-3 py-2 text-xs max-w-[200px]"><div class="truncate" title="' + esc(shippingInfo) + '">' + esc(shippingInfo) + '</div>' + trackingDisplay + '</td>' +
                        '<td class="px-3 py-2 text-center">' + selectHtml + trackBtn + cancelMeta + '</td>' +
                        '<td class="px-3 py-2 text-xs text-gray-500">' + date + '</td>' +
                    '</tr>';
                }).join('');
            }

            async function adminUpdateOrderStatus(orderId, newStatus) {
                try {
                    await axios.put('/api/admin/shop/order/' + orderId + '/status', { status: newStatus });
                    loadAdminShopOrders();
                } catch(e) {
                    alert('상태 변경 중 오류');
                }
            }

            // 개별 송장 등록 모달
            // 송장 메모에서 택배사/송장번호 안전 파싱
            // 정규식/이스케이프 이슈 완전 회피 - charCode로 공백문자 비교
            function parseTrackingFromMemo(memo) {
                var result = { courier: '', no: '' };
                if (!memo) return result;
                var keyword = '\uC1A1\uC7A5:'; // '송장:'
                var idx = memo.indexOf(keyword);
                if (idx === -1) return result;
                // 택배사 추출: '송장:' 앞쪽에서 [택배사] 패턴 찾기
                var prefix = memo.substring(0, idx);
                var lb = prefix.lastIndexOf('[');
                var rb = prefix.lastIndexOf(']');
                if (lb !== -1 && rb !== -1 && rb > lb) {
                    result.courier = prefix.substring(lb + 1, rb).trim();
                }
                // 송장번호 추출: '송장:' 뒤 공백 제거 후 다음 공백/탭/개행/| 이전까지
                var rest = memo.substring(idx + keyword.length);
                // 앞쪽 공백류(스페이스/탭/개행) 제거
                var startI = 0;
                while (startI < rest.length) {
                    var c0 = rest.charCodeAt(startI);
                    if (c0 === 32 || c0 === 9 || c0 === 10 || c0 === 13) { startI++; } else { break; }
                }
                rest = rest.substring(startI);
                var endIdx = rest.length;
                for (var i = 0; i < rest.length; i++) {
                    var c = rest.charCodeAt(i);
                    // 32:space 9:tab 10:LF 13:CR 124:|
                    if (c === 32 || c === 9 || c === 10 || c === 13 || c === 124) { endIdx = i; break; }
                }
                result.no = rest.substring(0, endIdx).trim();
                return result;
            }

            function openTrackingModal(orderId) {
                var order = (_adminShopOrdersCache || []).find(function(x){ return x.id === orderId; });
                if (!order) { alert('주문 정보를 찾을 수 없습니다'); return; }

                // 기존 송장 정보 파싱
                var memo = order.shipping_memo || '';
                var parsed = parseTrackingFromMemo(memo);
                var existingNo = parsed.no;
                var existingCourier = parsed.courier;

                var courierList = ['CJ대한통운','한진택배','롯데택배','우체국택배','로젠택배','경동택배','쿠팡로지스틱스','GS택배','직접배송','기타'];
                var courierOpts = courierList.map(function(c) {
                    return '<option value="' + c + '"' + (existingCourier === c ? ' selected' : '') + '>' + c + '</option>';
                }).join('');

                var modal = document.createElement('div');
                modal.id = 'trackingEditModal';
                modal.className = 'fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4';
                modal.onclick = function(e){ if (e.target === modal) modal.remove(); };
                modal.innerHTML =
                    '<div class="bg-white rounded-2xl shadow-2xl w-full max-w-md">' +
                        '<div class="p-4 border-b flex items-center justify-between">' +
                            '<h3 class="font-bold text-lg text-gray-800"><i class="fas fa-truck mr-2 text-blue-600"></i>송장 ' + (m ? '수정' : '등록') + '</h3>' +
                            '<button onclick="document.getElementById(\\'trackingEditModal\\').remove()" class="text-gray-400 hover:text-gray-600 text-3xl leading-none">&times;</button>' +
                        '</div>' +
                        '<div class="p-4 space-y-3">' +
                            '<div class="bg-gray-50 rounded-lg p-3 text-xs space-y-1">' +
                                '<p><span class="text-gray-500">주문번호:</span> <span class="font-bold">#' + order.id + '</span></p>' +
                                '<p><span class="text-gray-500">수령인:</span> ' + esc(order.shipping_name || '-') + ' / ' + esc(order.shipping_phone || '-') + '</p>' +
                                '<p><span class="text-gray-500">주소:</span> ' + esc(order.shipping_address || '-') + '</p>' +
                                '<p><span class="text-gray-500">상품:</span> ' + esc(order.product_name) + ' x' + order.quantity + '</p>' +
                            '</div>' +
                            '<div>' +
                                '<label class="block text-xs font-bold text-gray-700 mb-1">택배사</label>' +
                                '<select id="trkCourier" class="w-full px-3 py-2 border rounded-lg text-sm">' + courierOpts + '</select>' +
                            '</div>' +
                            '<div>' +
                                '<label class="block text-xs font-bold text-gray-700 mb-1">송장번호 <span class="text-red-500">*</span></label>' +
                                '<input id="trkNumber" type="text" value="' + esc(existingNo) + '" placeholder="송장번호 입력" class="w-full px-3 py-2 border rounded-lg text-sm">' +
                            '</div>' +
                            '<div class="flex items-center gap-2 pt-2">' +
                                '<input type="checkbox" id="trkAutoShipping" checked class="w-4 h-4">' +
                                '<label for="trkAutoShipping" class="text-xs text-gray-600">송장 등록 시 상태를 <span class="font-bold text-blue-600">배송중</span>으로 자동 변경</label>' +
                            '</div>' +
                        '</div>' +
                        '<div class="p-4 border-t flex gap-2">' +
                            '<button onclick="document.getElementById(\\'trackingEditModal\\').remove()" class="flex-1 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-bold text-sm">취소</button>' +
                            '<button onclick="submitTracking(' + orderId + ')" class="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm shadow"><i class="fas fa-save mr-1"></i>저장</button>' +
                        '</div>' +
                    '</div>';
                document.body.appendChild(modal);
                setTimeout(function(){ var inp = document.getElementById('trkNumber'); if (inp) inp.focus(); }, 100);
            }

            async function submitTracking(orderId) {
                var trackingNo = (document.getElementById('trkNumber').value || '').trim();
                var courier = (document.getElementById('trkCourier').value || '').trim();
                var autoShipping = document.getElementById('trkAutoShipping').checked;
                if (!trackingNo) { alert('송장번호를 입력해주세요'); return; }
                try {
                    var order = (_adminShopOrdersCache || []).find(function(x){ return x.id === orderId; });
                    var newStatus = autoShipping ? 'shipping' : (order ? order.status : 'shipping');
                    await axios.put('/api/admin/shop/order/' + orderId + '/status', {
                        status: newStatus,
                        trackingNo: trackingNo,
                        courier: courier
                    });
                    var modalEl = document.getElementById('trackingEditModal');
                    if (modalEl) modalEl.remove();
                    alert('송장 등록 완료!\\n[' + courier + '] ' + trackingNo + (autoShipping ? '\\n주문 상태: 배송중' : ''));
                    loadAdminShopOrders();
                } catch(e) {
                    alert('송장 등록 중 오류: ' + ((e.response && e.response.data && e.response.data.error) || e.message || ''));
                }
            }

            function exportShopOrders() {
                axios.get('/api/admin/shop/export/orders', { responseType: 'blob' }).then(function(response) {
                    var blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
                    var link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    var now = new Date(Date.now() + 9*60*60*1000).toISOString().slice(0,10);
                    link.download = 'shop_orders_' + now + '.csv';
                    link.click();
                    URL.revokeObjectURL(link.href);
                }).catch(function(error) {
                    alert('다운로드 실패');
                });
            }

            // ============================================
            // 엑셀(CSV) 다운로드
            // ============================================
            function exportCSV(type) {
                var url = '/api/admin/export/' + type;
                // Authorization 헤더 포함 다운로드
                axios.get(url, { responseType: 'blob' }).then(function(response) {
                    var blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
                    var link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    var now = new Date(Date.now() + 9*60*60*1000).toISOString().slice(0,10);
                    // 타입별 파일명 매핑
                    var fileNameMap = {
                        'users': 'users_export_' + now + '.csv',
                        'rewards': 'member_rewards_' + now + '.csv',
                        'sales': 'sales_export_' + now + '.csv',
                        'withdrawals': 'withdrawals_export_' + now + '.csv',
                        'wallets': 'members_wallets_' + now + '.csv'
                    };
                    link.download = fileNameMap[type] || (type + '_export_' + now + '.csv');
                    link.click();
                    URL.revokeObjectURL(link.href);
                }).catch(function(error) {
                    console.error('Download failed:', error);
                    alert(I18N.t('admin.download_fail'));
                });
            }

            // 로그아웃
            function handleLogout() {
                localStorage.removeItem('admin');
                window.location.href = '/admin';
            }

            // 페이지 로드 시 실행
            document.addEventListener('DOMContentLoaded', function() {
                console.log('DOM loaded, starting initialization...');
                console.log('Admin auth:', localStorage.getItem('admin'));
                loadStatistics();
                loadPendingStakings();
            });
        </script>
    </body>
    </html>
  `)
})

// SSL/Connection diagnostic page
app.get('/check', (c) => {
  const cfRay = c.req.header('CF-Ray') || 'N/A';
  const cfCountry = c.req.header('CF-IPCountry') || 'N/A';
  const cfConnectingIP = c.req.header('CF-Connecting-IP') || 'N/A';
  const cfVisitor = c.req.header('CF-Visitor') || 'N/A';
  const proto = c.req.header('X-Forwarded-Proto') || 'N/A';
  const tlsVersion = c.req.header('CF-TLS-Version') || 'N/A';
  const tlsCipher = c.req.header('CF-TLS-Cipher') || 'N/A';
  const ua = c.req.header('User-Agent') || 'N/A';
  
  return c.html(`<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>연결 상태 확인</title>
<style>
body { font-family: -apple-system, sans-serif; padding: 20px; background: #f0f0f0; }
.card { background: white; border-radius: 12px; padding: 20px; margin: 10px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
.ok { color: #16a34a; font-weight: bold; }
.warn { color: #ea580c; font-weight: bold; }
.err { color: #dc2626; font-weight: bold; }
h1 { font-size: 1.5em; text-align: center; }
h2 { font-size: 1.1em; margin-top: 0; border-bottom: 1px solid #eee; padding-bottom: 8px; }
.row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f5f5f5; }
.label { color: #666; font-size: 0.9em; }
.value { font-weight: 500; font-size: 0.9em; text-align: right; max-width: 60%; word-break: break-all; }
#js-results .row { opacity: 0; animation: fadeIn 0.3s forwards; }
@keyframes fadeIn { to { opacity: 1; } }
</style>
</head>
<body>
<h1>QUANTARIUM 연결 상태 확인</h1>
<div class="card">
  <h2>서버 정보</h2>
  <div class="row"><span class="label">상태</span><span class="value ok">정상 연결됨</span></div>
  <div class="row"><span class="label">프로토콜</span><span class="value">${proto}</span></div>
  <div class="row"><span class="label">TLS 버전</span><span class="value">${tlsVersion || 'N/A'}</span></div>
  <div class="row"><span class="label">국가</span><span class="value">${cfCountry}</span></div>
  <div class="row"><span class="label">CF-Ray</span><span class="value">${cfRay}</span></div>
  <div class="row"><span class="label">방문자</span><span class="value">${cfVisitor}</span></div>
</div>
<div class="card">
  <h2>클라이언트 정보</h2>
  <div class="row"><span class="label">IP</span><span class="value">${cfConnectingIP}</span></div>
  <div class="row"><span class="label">User-Agent</span><span class="value" style="font-size:0.75em">${ua}</span></div>
</div>
<div class="card" id="js-results">
  <h2>브라우저 SSL 점검</h2>
  <div id="ssl-status"><span class="label">확인 중...</span></div>
</div>
<div class="card">
  <h2>도움말</h2>
  <p style="font-size:0.85em; color:#555; line-height:1.6;">
    이 페이지가 보인다면 QUANTARIUM 연결은 <span class="ok">정상 작동 중</span>입니다.<br><br>
    메인 페이지에 보안 경고가 표시되면:<br>
    1. Chrome > 설정 > 개인정보 > 인터넷 사용 기록 삭제 > 전체 기간 > 삭제<br>
    2. 비행기 모드 5초간 ON 후 OFF<br>
    3. 다시 시도: <a href="https://quantarium.co.kr/">quantarium.co.kr</a>
  </p>
</div>
<script>
(function(){
  var el = document.getElementById('ssl-status');
  var html = '';
  
  // Check if page loaded over HTTPS
  var isHttps = location.protocol === 'https:';
  html += '<div class="row"><span class="label">HTTPS</span><span class="value ' + (isHttps ? 'ok' : 'err') + '">' + (isHttps ? 'YES' : 'NO') + '</span></div>';
  
  // Check page load time
  if (window.performance) {
    var nav = performance.getEntriesByType('navigation')[0];
    if (nav) {
      var dns = Math.round(nav.domainLookupEnd - nav.domainLookupStart);
      var ssl = Math.round(nav.secureConnectionStart > 0 ? nav.connectEnd - nav.secureConnectionStart : 0);
      var ttfb = Math.round(nav.responseStart - nav.requestStart);
      var total = Math.round(nav.loadEventEnd - nav.startTime);
      html += '<div class="row"><span class="label">DNS</span><span class="value">' + dns + 'ms</span></div>';
      html += '<div class="row"><span class="label">SSL Handshake</span><span class="value">' + ssl + 'ms</span></div>';
      html += '<div class="row"><span class="label">TTFB</span><span class="value">' + ttfb + 'ms</span></div>';
      html += '<div class="row"><span class="label">전체 로드 시간</span><span class="value">' + total + 'ms</span></div>';
    }
  }
  
  // Test fetch to main page
  fetch('/', {method: 'HEAD'}).then(function(r) {
    html += '<div class="row"><span class="label">Fetch 테스트</span><span class="value ' + (r.ok ? 'ok' : 'err') + '">' + r.status + '</span></div>';
    el.innerHTML = html;
  }).catch(function(e) {
    html += '<div class="row"><span class="label">Fetch 오류</span><span class="value err">' + e.message + '</span></div>';
    el.innerHTML = html;
  });
  
  setTimeout(function(){ if(!el.innerHTML.includes('Fetch')) el.innerHTML = html || '<div class="row"><span class="value warn">시간 초과</span></div>'; }, 5000);
})();
</script>
</body>
</html>`);
})

export default app
