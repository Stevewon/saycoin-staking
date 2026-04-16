import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'

type Bindings = {
  DB: D1Database;
}

const app = new Hono<{ Bindings: Bindings }>()

// Enable CORS
app.use('/api/*', cors())

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }))

// ============================================
// Admin Auth Helpers
// ============================================
const ADMIN_ID = 'admin'
const ADMIN_PW = 'admin1234'

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
    'admin.search_required': '검색어를 입력해주세요',
    'admin.search_error': '회원 검색 중 오류가 발생했습니다',
    'admin.member_rewards_error': '수당 현황 조회 중 오류가 발생했습니다',
    'admin.export_wd_error': '출금내역 내보내기 실패',
    'admin.export_sales_error': '매출내역 내보내기 실패',
    'admin.export_users_error': '회원목록 내보내기 실패',
    'admin.export_rewards_error': '수당내역 내보내기 실패',
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
    const referrer = await db.prepare('SELECT id FROM users WHERE referral_code = ?')
      .bind(referralCode.trim().toUpperCase())
      .first()
    
    if (!referrer) {
      return c.json({ error: t(c, 'auth.invalid_referral') }, 400)
    }
    referrerId = referrer.id

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

    // referral_code가 없으면 생성
    let referralCode = user.referral_code
    if (!referralCode) {
      referralCode = 'QTA' + Math.random().toString(36).substring(2, 7).toUpperCase()
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

// 아이디 찾기 (이름 + 전화번호)
app.post('/api/auth/find-id', async (c) => {
  try {
    const { name, phone } = await c.req.json()

    if (!name || !phone) {
      return c.json({ error: t(c, 'auth.name_phone_required') }, 400)
    }

    const db = c.env.DB

    const user = await db.prepare(`
      SELECT email FROM users WHERE name = ? AND phone = ?
    `).bind(name, phone).first()

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

// 비밀번호 찾기 (이메일 + 전화번호)
app.post('/api/auth/find-password', async (c) => {
  try {
    const { email, phone } = await c.req.json()

    if (!email || !phone) {
      return c.json({ error: t(c, 'auth.email_phone_required') }, 400)
    }

    const db = c.env.DB

    const user = await db.prepare(`
      SELECT id FROM users WHERE email = ? AND phone = ?
    `).bind(email, phone).first()

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

// 출금 신청
app.post('/api/withdrawal/request', async (c) => {
  try {
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

    // 잔액 확인
    const balanceField = coinType === 'QTA' ? 'qta_balance' : 
                         coinType === 'QX' ? 'qx_balance' : 
                         coinType === 'QKEY' ? 'qkey_balance' : 'usdt_balance'
    const currentBalance = user[balanceField]

    // 이미 pending 상태인 출금 합산 확인 (Race Condition 방지)
    const pendingWithdrawals = await db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as pending_total FROM withdrawals
      WHERE user_id = ? AND coin_type = ? AND status = 'pending'
    `).bind(userId, coinType).first()
    const pendingTotal = (pendingWithdrawals?.pending_total || 0) as number

    if (currentBalance - pendingTotal < amount) {
      return c.json({ error: t(c, 'withdrawal.insufficient_balance') }, 400)
    }

    // 잔액 즉시 차감 (출금 신청 시점)
    await db.prepare(`
      UPDATE users SET ${balanceField} = ${balanceField} - ? WHERE id = ? AND ${balanceField} >= ?
    `).bind(amount, userId, amount).run()

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

    // QKEY 차감 & USDT 증가 (150 QKEY = 1 USDT)
    await db.prepare(`
      UPDATE users 
      SET qkey_balance = qkey_balance - ?,
          usdt_balance = usdt_balance + ?
      WHERE id = ?
    `).bind(requiredQkey, amount, userId).run()

    // 거래 내역 기록 (QKEY 차감)
    await db.prepare(`
      INSERT INTO transactions (user_id, type, coin_type, amount, description)
      VALUES (?, 'swap_out', 'QKEY', ?, ?)
    `).bind(userId, requiredQkey, `QKEY → USDT swap (${requiredQkey.toLocaleString()} QKEY → ${amount.toLocaleString()} USDT)`).run()

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

// ============================================
// API Routes - Staking
// ============================================

// 투자금액별 일일 배당률 계산
function getDailyRate(amount: number): number {
  if (amount >= 10000) return 0.01    // $10,000+: 1.0%
  if (amount >= 5000) return 0.007    // $5,000~$9,000: 0.7%
  if (amount >= 3000) return 0.005    // $3,000~$4,000: 0.5%
  return 0.003                         // $1,000~$2,000: 0.3%
}

// 투자금액별 자동 거치기간 결정
function getAutoPeriodDays(amount: number): number {
  if (amount >= 10000) return 180     // $10,000+: 180일
  if (amount >= 5000) return 120      // $5,000~$9,000: 120일
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

    // 코인 지급 수량 계산: $1,000 기준 QTA 15만개, QX 2만개, QKEY 5천개
    const qtaReward = (amount / 1000) * 150000
    const qxReward = (amount / 1000) * 20000
    const qkeyReward = (amount / 1000) * 5000

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

    const stakings = await db.prepare(`
      SELECT id, amount, period_months, period_days, qta_reward, qx_reward, qkey_reward, daily_rate, start_date, end_date, status, txid, created_at
      FROM staking
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).bind(userId).all()

    return c.json({ 
      success: true, 
      stakings: stakings.results 
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

    // 사용자 잔액 업데이트 (QTA, QX, QKEY 지급)
    const qkeyReward = staking.qkey_reward || 0
    await db.prepare(`
      UPDATE users 
      SET qta_balance = qta_balance + ?, 
          qx_balance = qx_balance + ?,
          qkey_balance = qkey_balance + ?
      WHERE id = ?
    `).bind(staking.qta_reward, staking.qx_reward, qkeyReward, staking.user_id).run()

    // 거래 내역 기록 (QTA)
    await db.prepare(`
      INSERT INTO transactions (user_id, type, coin_type, amount, description)
      VALUES (?, 'staking_reward', 'QTA', ?, ?)
    `).bind(staking.user_id, staking.qta_reward, `Staking reward (${periodDays}d)`).run()

    // Transaction record (QX)
    await db.prepare(`
      INSERT INTO transactions (user_id, type, coin_type, amount, description)
      VALUES (?, 'staking_reward', 'QX', ?, ?)
    `).bind(staking.user_id, staking.qx_reward, `Staking reward (${periodDays}d)`).run()

    // Transaction record (QKEY)
    if (qkeyReward > 0) {
      await db.prepare(`
        INSERT INTO transactions (user_id, type, coin_type, amount, description)
        VALUES (?, 'staking_reward', 'QKEY', ?, ?)
      `).bind(staking.user_id, qkeyReward, `Staking reward (${periodDays}d)`).run()
    }

    // 직접추천수당 지급 (1회성, 매출의 10%, QKEY로 지급)
    // 환율: 1 USD = 1,500 KRW, 1 QKEY = 10 KRW → 1 USD = 150 QKEY
    try {
      const referrer = await db.prepare(`
        SELECT referrer_id FROM users WHERE id = ?
      `).bind(staking.user_id).first()

      if (referrer && referrer.referrer_id) {
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

        await db.prepare(`
          INSERT INTO referral_rewards (referrer_id, referee_id, level, original_amount, reward_amount, reward_date)
          VALUES (?, ?, 0, ?, ?, date('now'))
        `).bind(referrer.referrer_id, staking.user_id, staking.amount, directBonusQkey).run()
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
    
    const stakings = await db.prepare(`
      SELECT s.*, u.name, u.email, u.wallet_address
      FROM staking s
      JOIN users u ON s.user_id = u.id
      WHERE s.status = 'pending'
      ORDER BY s.created_at DESC
    `).all()

    return c.json({ 
      success: true, 
      stakings: stakings.results 
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
    
    // 사용자 목록 조회 (스테이킹 총 수량 포함)
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
        u.created_at,
        COALESCE(SUM(CASE WHEN s.status = 'active' THEN s.amount ELSE 0 END), 0) as staking_amount
      FROM users u
      LEFT JOIN staking s ON u.id = s.user_id
      GROUP BY u.id, u.name, u.email, u.phone, u.wallet_address, u.usdt_wallet_address,
               u.qta_balance, u.qx_balance, u.qkey_balance, u.usdt_balance, u.country, u.language, u.created_at
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

    // 사용자 존재 확인
    const user = await db.prepare(`
      SELECT id, name, email FROM users WHERE id = ?
    `).bind(userId).first()

    if (!user) {
      return c.json({ error: t(c, 'admin.user_not_found') }, 404)
    }

    // 진행 중인 스테이킹 확인
    const activeStaking = await db.prepare(`
      SELECT COUNT(*) as count FROM staking 
      WHERE user_id = ? AND status = 'active'
    `).bind(userId).first()

    if (activeStaking && activeStaking.count > 0) {
      return c.json({ 
        error: t(c, 'admin.active_staking_block'),
        activeStakingCount: activeStaking.count
      }, 400)
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
app.post('/api/admin/users/bulk-delete', async (c) => {
  try {
    const { keepEmails } = await c.req.json()
    const db = c.env.DB

    // 보호할 이메일 목록 (기본값: 관리자)
    const protectedEmails = keepEmails || ['admin@quantarium.com']
    
    // 삭제할 사용자 목록 조회
    const placeholders = protectedEmails.map(() => '?').join(',')
    const usersToDelete = await db.prepare(`
      SELECT id, name, email FROM users WHERE email NOT IN (${placeholders})
    `).bind(...protectedEmails).all()

    if (usersToDelete.results.length === 0) {
      return c.json({ 
        success: true, 
        message: t(c, 'admin.no_users_to_delete'),
        deletedCount: 0,
        keptEmails: protectedEmails
      })
    }

    const userIds = usersToDelete.results.map(u => u.id)
    let deletedCount = 0

    // 각 사용자 삭제
    for (const user of usersToDelete.results) {
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

        // 5. staking 삭제
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
        console.error(`사용자 ${user.email} 삭제 실패:`, error)
      }
    }

    return c.json({ 
      success: true, 
      message: `${deletedCount}${t(c, 'admin.bulk_delete_success')}`,
      deletedCount: deletedCount,
      deletedUsers: usersToDelete.results.map(u => ({ name: u.name, email: u.email })),
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
      WHERE reward_date = date('now')
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
      rewards: recentRewards.results
    })
  } catch (error) {
    console.error('배당 현황 조회 오류:', error)
    return c.json({ error: t(c, 'admin.rewards_error') }, 500)
  }
})

// 관리자: 출금 관리 (전체 출금 신청 목록)
app.get('/api/admin/withdrawals', async (c) => {
  try {
    const db = c.env.DB

    // 출금 통계
    const stats = await db.prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END), 0) as pending_count,
        COALESCE(SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END), 0) as approved_count,
        COALESCE(SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END), 0) as rejected_count,
        COUNT(*) as total_count
      FROM withdrawals
    `).first()

    // 전체 출금 목록 (사용자 정보 포함)
    const withdrawals = await db.prepare(`
      SELECT 
        w.id, w.user_id, w.coin_type, w.amount, w.wallet_address, w.status, w.created_at,
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

    // 배당 내역
    const rewards = await db.prepare(`
      SELECT d.*, s.amount as staking_amount
      FROM daily_rewards d
      LEFT JOIN staking s ON d.staking_id = s.id
      WHERE d.user_id = ?
      ORDER BY d.created_at DESC
      LIMIT 50
    `).bind(userId).all()

    // 출금 내역
    const withdrawals = await db.prepare(`
      SELECT * FROM withdrawals WHERE user_id = ? ORDER BY created_at DESC
    `).bind(userId).all()

    // 거래 내역
    const transactions = await db.prepare(`
      SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 50
    `).bind(userId).all()

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

// 관리자: 회원가입 현황 조회
app.get('/api/admin/signups', async (c) => {
  try {
    const db = c.env.DB
    
    // 오늘 가입자
    const todayUsers = await db.prepare(`
      SELECT COUNT(*) as count
      FROM users
      WHERE date(created_at) = date('now')
    `).first()

    // 이번 주 가입자 (최근 7일)
    const weekUsers = await db.prepare(`
      SELECT COUNT(*) as count
      FROM users
      WHERE date(created_at) >= date('now', '-7 days')
    `).first()

    // 이번 달 가입자 (최근 30일)
    const monthUsers = await db.prepare(`
      SELECT COUNT(*) as count
      FROM users
      WHERE date(created_at) >= date('now', '-30 days')
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
        s.daily_rate
      FROM staking s
      JOIN users u ON s.user_id = u.id
      WHERE s.status IN ('active', 'completed')
      ORDER BY s.created_at DESC
    `).all()

    // 총 매출 집계
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
        monthCount: monthSales?.count || 0
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
        SELECT to_user_id, SUM(qkey_amount) as referral_total FROM referral_rewards GROUP BY to_user_id
      ) rr ON u.id = rr.to_user_id
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
      SELECT COALESCE(SUM(qkey_amount), 0) as total_referral_qkey
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

    let csv = '\\uFEFF' + [t(c,'csv.id'),t(c,'csv.email'),t(c,'csv.name'),t(c,'csv.coin_type'),t(c,'csv.amount'),t(c,'csv.wallet_address'),t(c,'csv.status'),t(c,'csv.request_date'),t(c,'csv.process_date')].join(',') + '\\n'
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

    let csv = '\\uFEFF' + [t(c,'csv.id'),t(c,'csv.email'),t(c,'csv.name'),t(c,'csv.country'),t(c,'csv.language'),t(c,'csv.sale_amount'),t(c,'csv.status'),t(c,'csv.period_days'),t(c,'csv.daily_rate'),t(c,'csv.start_date'),t(c,'csv.end_date'),t(c,'csv.request_date')].join(',') + '\\n'
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

    let csv = '\\uFEFF' + [t(c,'csv.id'),t(c,'csv.email'),t(c,'csv.name'),t(c,'csv.phone'),t(c,'csv.country'),t(c,'csv.language'),t(c,'csv.qkey_wallet'),t(c,'csv.usdt_wallet'),t(c,'csv.qta_balance'),t(c,'csv.qx_balance'),t(c,'csv.qkey_balance'),t(c,'csv.usdt_balance'),t(c,'csv.referral_code'),t(c,'csv.staking_amount'),t(c,'csv.join_date')].join(',') + '\\n'
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
      LEFT JOIN (SELECT to_user_id, SUM(qkey_amount) as referral_total FROM referral_rewards GROUP BY to_user_id) rr ON u.id = rr.to_user_id
      GROUP BY u.id
      ORDER BY daily_reward_total DESC
    `).all()

    let csv = '\\uFEFF' + [t(c,'csv.id'),t(c,'csv.email'),t(c,'csv.name'),t(c,'csv.country'),t(c,'csv.staking_amount'),t(c,'csv.daily_total'),t(c,'csv.referral_total'),t(c,'csv.total_reward'),t(c,'csv.qta_balance'),t(c,'csv.qx_balance'),t(c,'csv.qkey_balance'),t(c,'csv.usdt_balance')].join(',') + '\\n'
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

// 일일 배당금 지급 (하루 1회 자동 지급)
// 정책: 승인일 익일부터, 거치기간 내 매일 지급, 금액별 차등 배당률
app.post('/api/rewards/daily', async (c) => {
  try {
    const db = c.env.DB
    const now = new Date()
    const today = now.toISOString().split('T')[0]

    // 활성 투자 조회 (승인일 익일부터 거치기간 종료일까지)
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
        (SELECT COUNT(*) FROM daily_rewards WHERE staking_id = s.id) as rewarded_count
      FROM staking s
      WHERE s.status = 'active' 
        AND date(s.end_date) >= date('now')
        AND date('now') >= date(s.start_date, '+1 day')
    `).all()

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

    // 환율: 1 USD = 1,500 KRW, 1 QKEY = 10 KRW → 1 USD = 150 QKEY
    const USD_TO_QKEY = 150

    for (const staking of activeStakings.results) {
      try {
        const periodDays = staking.period_days || (staking.period_months * 30)
        
        // 총 지급 횟수 제한: 거치기간 일수
        if (staking.rewarded_count >= periodDays) {
          skippedCount++
          continue
        }

        // 오늘 이미 지급받았는지 확인 (하루 1회만)
        const todayRewards = await db.prepare(`
          SELECT COUNT(*) as count FROM daily_rewards
          WHERE user_id = ? AND staking_id = ? AND reward_date = ?
        `).bind(staking.user_id, staking.staking_id, today).first()

        if (todayRewards.count === 0) {
          // 금액별 차등 배당률 적용
          const dailyRate = staking.daily_rate || getDailyRate(staking.amount)
          const usdAmount = staking.amount * dailyRate
          // USD를 QKEY로 변환 (1 USD = 150 QKEY)
          const qkeyAmount = Math.round(usdAmount * USD_TO_QKEY)

          // 일일 보상 기록 (usdt_amount 컬럼에 QKEY 수량 저장)
          await db.prepare(`
            INSERT INTO daily_rewards (user_id, staking_id, usdt_amount, reward_date)
            VALUES (?, ?, ?, ?)
          `).bind(staking.user_id, staking.staking_id, qkeyAmount, today).run()

          // 사용자 QKEY 잔액 업데이트
          await db.prepare(`
            UPDATE users SET qkey_balance = qkey_balance + ? WHERE id = ?
          `).bind(qkeyAmount, staking.user_id).run()

          const newCount = staking.rewarded_count + 1
          await db.prepare(`
            INSERT INTO transactions (user_id, type, coin_type, amount, description)
            VALUES (?, 'daily_qkey', 'QKEY', ?, ?)
          `).bind(staking.user_id, qkeyAmount, `Daily reward ${qkeyAmount.toLocaleString()} QKEY (${(dailyRate*100).toFixed(1)}%, ${newCount}/${periodDays}d)`).run()

          rewardedCount++
          totalQkeyRewarded += qkeyAmount

          // 매칭추천수당 지급 (QKEY)
          try {
            // 1대 매칭추천수당 (20%)
            const level1Referrer = await db.prepare(`
              SELECT referrer_id FROM users WHERE id = ?
            `).bind(staking.user_id).first()

            if (level1Referrer && level1Referrer.referrer_id) {
              const level1Reward = Math.round(qkeyAmount * 0.20)
              
              await db.prepare(`
                UPDATE users SET qkey_balance = qkey_balance + ? WHERE id = ?
              `).bind(level1Reward, level1Referrer.referrer_id).run()

              await db.prepare(`
                INSERT INTO referral_rewards (referrer_id, referee_id, level, original_amount, reward_amount, reward_date)
                VALUES (?, ?, 1, ?, ?, ?)
              `).bind(level1Referrer.referrer_id, staking.user_id, qkeyAmount, level1Reward, today).run()

              await db.prepare(`
                INSERT INTO transactions (user_id, type, coin_type, amount, description)
                VALUES (?, 'referral_reward', 'QKEY', ?, ?)
              `).bind(level1Referrer.referrer_id, level1Reward, `Level 1 referral bonus (${qkeyAmount.toLocaleString()} QKEY x 20%)`).run()

              // 2대 매칭추천수당 (10%)
              const level2Referrer = await db.prepare(`
                SELECT referrer_id FROM users WHERE id = ?
              `).bind(level1Referrer.referrer_id).first()

              if (level2Referrer && level2Referrer.referrer_id) {
                const level2Reward = Math.round(qkeyAmount * 0.10)
                
                await db.prepare(`
                  UPDATE users SET qkey_balance = qkey_balance + ? WHERE id = ?
                `).bind(level2Reward, level2Referrer.referrer_id).run()

                await db.prepare(`
                  INSERT INTO referral_rewards (referrer_id, referee_id, level, original_amount, reward_amount, reward_date)
                  VALUES (?, ?, 2, ?, ?, ?)
                `).bind(level2Referrer.referrer_id, staking.user_id, qkeyAmount, level2Reward, today).run()

                await db.prepare(`
                  INSERT INTO transactions (user_id, type, coin_type, amount, description)
                  VALUES (?, 'referral_reward', 'QKEY', ?, ?)
                `).bind(level2Referrer.referrer_id, level2Reward, `Level 2 referral bonus (${qkeyAmount.toLocaleString()} QKEY x 10%)`).run()
              }
            }
          } catch (referralError) {
            console.error(`매칭추천수당 처리 오류 (user ${staking.user_id}):`, referralError)
          }
        }
      } catch (err) {
        console.error(`보상 지급 오류 (user ${staking.user_id}):`, err)
      }
    }

    let message = `${rewardedCount} rewarded (${totalQkeyRewarded.toLocaleString()} QKEY)`
    if (skippedCount > 0) {
      message += ` | ${skippedCount} completed`
    }

    return c.json({ 
      success: true, 
      message: message,
      rewarded: rewardedCount,
      totalQkey: totalQkeyRewarded,
      skipped: skippedCount
    })
  } catch (error) {
    console.error('Daily reward error:', error)
    return c.json({ error: t(c, 'rewards.daily_error') }, 500)
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

// 거래 내역 조회
app.get('/api/transactions/:userId', async (c) => {
  try {
    const userId = c.req.param('userId')
    const db = c.env.DB

    const transactions = await db.prepare(`
      SELECT id, type, coin_type, amount, description, created_at
      FROM transactions
      WHERE user_id = ?
      ORDER BY created_at DESC
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

    // 전체 보상 내역 (배당금 + 직접판매 + 매칭추천수당 + 누적)
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
          ELSE t.type
        END as reward_category
      FROM transactions t
      WHERE t.user_id = ? AND t.type IN ('daily_qkey', 'direct_referral', 'referral_reward')
      ORDER BY t.created_at DESC
      LIMIT 200
    `).bind(userId).all()

    // 카테고리별 통계 계산
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
        COALESCE(SUM(amount), 0) as grand_total,
        COUNT(*) as total_count
      FROM transactions
      WHERE user_id = ? AND type IN ('daily_qkey', 'direct_referral', 'referral_reward')
    `).bind(userId).first()

    return c.json({
      success: true,
      rewards: rewards.results || [],
      stats: {
        dailyTotal: stats?.daily_total || 0,
        dailyCount: stats?.daily_count || 0,
        directTotal: stats?.direct_total || 0,
        directCount: stats?.direct_count || 0,
        level1Total: stats?.level1_total || 0,
        level2Total: stats?.level2_total || 0,
        level1Count: stats?.level1_count || 0,
        level2Count: stats?.level2_count || 0,
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
// Frontend Routes
// ============================================

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
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
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
                            <label class="block text-gray-700 text-sm font-bold mb-2" data-i18n="login.email">이메일</label>
                            <div class="flex gap-1 items-center w-full">
                                <input type="text" id="loginEmailId" required
                                    placeholder="example"
                                    class="flex-1 min-w-0 px-2 py-2 sm:px-3 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 text-xs sm:text-base">
                                <span class="text-gray-600 text-sm">@</span>
                                <select id="loginEmailDomain" required
                                    class="flex-1 min-w-0 px-1 py-2 sm:px-3 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 text-xs sm:text-base">
                                    <option value="gmail.com" selected>gmail.com</option>
                                    <option value="naver.com">naver.com</option>
                                </select>
                            </div>
                        </div>
                        <div class="mb-4 sm:mb-6">
                            <label class="block text-gray-700 text-sm font-bold mb-2" data-i18n="login.password">비밀번호</label>
                            <input type="password" id="loginPassword" required
                                class="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 text-sm sm:text-base">
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
                            <label class="block text-gray-700 text-sm font-bold mb-2" data-i18n="register.email">이메일</label>
                            <div class="flex gap-1 items-center w-full">
                                <input type="text" id="registerEmailId" required
                                    placeholder="example"
                                    class="flex-1 min-w-0 px-2 py-2 sm:px-3 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 text-xs sm:text-base">
                                <span class="text-gray-600 text-sm">@</span>
                                <select id="registerEmailDomain" required
                                    class="flex-1 min-w-0 px-1 py-2 sm:px-3 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 text-xs sm:text-base">
                                    <option value="gmail.com" selected>gmail.com</option>
                                    <option value="naver.com">naver.com</option>
                                </select>
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
                        <div class="mb-3 sm:mb-4">
                            <label class="block text-gray-700 text-sm font-bold mb-2" data-i18n="register.password">비밀번호</label>
                            <input type="password" id="registerPassword" required
                                minlength="4"
                                data-i18n-placeholder="register.password_input"
                                placeholder="비밀번호 입력"
                                autocomplete="new-password"
                                class="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 text-sm sm:text-base">
                        </div>
                        <div class="mb-3 sm:mb-4">
                            <label class="block text-gray-700 text-sm font-bold mb-2" data-i18n="register.password_confirm">비밀번호 확인</label>
                            <input type="password" id="registerPasswordConfirm" required
                                minlength="4"
                                data-i18n-placeholder="register.password_reinput"
                                placeholder="비밀번호 재입력"
                                autocomplete="new-password"
                                class="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 text-sm sm:text-base">
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
                        <div class="mb-3 sm:mb-4">
                            <label class="block text-gray-700 text-sm font-bold mb-2" data-i18n="find_id.name">이름</label>
                            <input type="text" id="findIdName" required
                                class="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 text-sm sm:text-base">
                        </div>
                        <div class="mb-4 sm:mb-6">
                            <label class="block text-gray-700 text-sm font-bold mb-2" data-i18n="find_id.phone">전화번호</label>
                            <div class="flex gap-1 sm:gap-2 w-full">
                                <input type="text" value="010" disabled
                                    class="w-1/3 px-2 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg bg-gray-100 text-center font-bold text-sm sm:text-base">
                                <input type="tel" id="findIdPhone1" required
                                    placeholder="1234"
                                    maxlength="4"
                                    pattern="[0-9]{4}"
                                    inputmode="numeric"
                                    oninput="this.value = this.value.replace(/[^0-9]/g, '').slice(0, 4); if(this.value.length === 4) document.getElementById('findIdPhone2').focus();"
                                    class="w-1/3 px-2 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 text-center text-sm sm:text-base">
                                <input type="tel" id="findIdPhone2" required
                                    placeholder="5678"
                                    maxlength="4"
                                    pattern="[0-9]{4}"
                                    inputmode="numeric"
                                    oninput="this.value = this.value.replace(/[^0-9]/g, '').slice(0, 4);"
                                    class="w-1/3 px-2 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 text-center text-sm sm:text-base">
                            </div>
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
                        <div class="mb-3 sm:mb-4">
                            <label class="block text-gray-700 text-sm font-bold mb-2" data-i18n="find_pw.email">이메일</label>
                            <div class="flex gap-1 items-center w-full">
                                <input type="text" id="findPasswordEmailId" required
                                    placeholder="example"
                                    class="flex-1 min-w-0 px-2 py-2 sm:px-3 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 text-xs sm:text-base">
                                <span class="text-gray-600 text-sm">@</span>
                                <select id="findPasswordEmailDomain" required
                                    class="flex-1 min-w-0 px-1 py-2 sm:px-3 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 text-xs sm:text-base">
                                    <option value="gmail.com" selected>gmail.com</option>
                                    <option value="naver.com">naver.com</option>
                                </select>
                            </div>
                        </div>
                        <div class="mb-4 sm:mb-6">
                            <label class="block text-gray-700 text-sm font-bold mb-2" data-i18n="find_pw.phone">전화번호</label>
                            <div class="flex gap-1 sm:gap-2 w-full">
                                <input type="text" value="010" disabled
                                    class="w-1/3 px-2 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg bg-gray-100 text-center font-bold text-sm sm:text-base">
                                <input type="tel" id="findPasswordPhone1" required
                                    placeholder="1234"
                                    maxlength="4"
                                    pattern="[0-9]{4}"
                                    inputmode="numeric"
                                    oninput="this.value = this.value.replace(/[^0-9]/g, '').slice(0, 4); if(this.value.length === 4) document.getElementById('findPasswordPhone2').focus();"
                                    class="w-1/3 px-2 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 text-center text-sm sm:text-base">
                                <input type="tel" id="findPasswordPhone2" required
                                    placeholder="5678"
                                    maxlength="4"
                                    pattern="[0-9]{4}"
                                    inputmode="numeric"
                                    oninput="this.value = this.value.replace(/[^0-9]/g, '').slice(0, 4);"
                                    class="w-1/3 px-2 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 text-center text-sm sm:text-base">
                            </div>
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

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/i18n.js?v=20260416"></script>
        <script>
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
                const emailId = document.getElementById('loginEmailId').value;
                const emailDomain = document.getElementById('loginEmailDomain').value;
                const email = emailId + '@' + emailDomain;
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
                const emailId = document.getElementById('registerEmailId').value;
                const emailDomain = document.getElementById('registerEmailDomain').value;
                const email = emailId + '@' + emailDomain;
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
                        document.getElementById('registerEmailId').value = '';
                        document.getElementById('registerEmailDomain').value = '';
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
                const name = document.getElementById('findIdName').value;
                const phone1 = document.getElementById('findIdPhone1').value;
                const phone2 = document.getElementById('findIdPhone2').value;
                const phone = '010-' + phone1 + '-' + phone2;

                try {
                    const response = await axios.post('/api/auth/find-id', { name, phone });
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
                const emailId = document.getElementById('findPasswordEmailId').value;
                const emailDomain = document.getElementById('findPasswordEmailDomain').value;
                const email = emailId + '@' + emailDomain;
                const phone1 = document.getElementById('findPasswordPhone1').value;
                const phone2 = document.getElementById('findPasswordPhone2').value;
                const phone = '010-' + phone1 + '-' + phone2;

                try {
                    const response = await axios.post('/api/auth/find-password', { email, phone });
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
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js"></script>
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

            <!-- Main Content -->
            <main class="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
                <!-- Balance Cards -->
                <div class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 mb-6 sm:mb-8">
                    <!-- 퀀타리움 스테이킹 현황 (첫 번째 - full width) -->
                    <div class="col-span-2 sm:col-span-2 lg:col-span-1 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 sm:p-6 text-white shadow-lg">
                        <div class="flex items-center justify-between mb-1 sm:mb-2">
                            <span class="text-xs sm:text-sm opacity-90" data-i18n="dash.purchase_transfer">퀀타리움구매 → 지갑 전송수량</span>
                            <i class="fas fa-chart-line text-xl sm:text-2xl"></i>
                        </div>
                        <p class="text-2xl sm:text-3xl font-bold" id="stakingStatus">0</p>
                        <p class="text-xs opacity-75 mt-1" id="stakingCount"></p>
                    </div>
                    
                    <!-- USDT Balance (두 번째) -->
                    <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 sm:p-6 text-white shadow-lg">
                        <div class="flex items-center justify-between mb-1 sm:mb-2">
                            <span class="text-xs sm:text-sm opacity-90" data-i18n="dash.usdt_balance">USDT Balance</span>
                            <i class="fas fa-dollar-sign text-xl sm:text-2xl"></i>
                        </div>
                        <p class="text-xl sm:text-3xl font-bold" id="usdtBalance">0</p>
                    </div>
                    
                    <!-- QTA (세 번째) -->
                    <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 sm:p-6 text-white shadow-lg">
                        <div class="flex items-center justify-between mb-1 sm:mb-2">
                            <span class="text-xs sm:text-sm opacity-90" data-i18n="dash.qta_coin">QTA 코인</span>
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

                <!-- Swap Section (QKEY → USDT) -->
                <div class="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
                    <h2 class="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">
                        <i class="fas fa-exchange-alt mr-2 text-green-600"></i><span data-i18n="dash.swap_title">QKEY → USDT 스왑</span>
                    </h2>
                    <div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                        <div class="flex items-start gap-2">
                            <i class="fas fa-info-circle text-green-600 text-lg mt-0.5"></i>
                            <div>
                                <p class="text-sm text-green-800 font-medium" data-i18n="dash.swap_info">보유한 QKEY를 USDT로 스왑할 수 있습니다</p>
                                <p class="text-xs text-green-700 mt-1" data-i18n="dash.swap_rate">교환 비율: 150 QKEY = 1 USDT | 최소 100 USDT | 100 단위</p>
                            </div>
                        </div>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                        <div>
                            <label class="block text-gray-700 font-bold mb-2 text-sm" data-i18n="dash.swap_available">스왑 가능 QKEY 잔액</label>
                            <p class="text-2xl font-bold text-yellow-600" id="swapQkeyBalance">0</p>
                        </div>
                        <div>
                            <label class="block text-gray-700 font-bold mb-2 text-sm" data-i18n="dash.swap_amount">스왑 수량 (USDT)</label>
                            <div class="flex gap-2">
                                <input type="number" id="swapAmount" 
                                    min="100" step="100" placeholder="Min 100, units of 100" data-i18n-placeholder="dash.swap_placeholder"
                                    class="flex-1 px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 text-sm sm:text-base">
                                <button type="button" onclick="handleSwap()"
                                    class="px-4 py-2 sm:px-6 sm:py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition text-sm sm:text-base whitespace-nowrap">
                                    <i class="fas fa-exchange-alt mr-1"></i><span data-i18n="dash.swap_btn">Swap</span>
                                </button>
                            </div>
                            <p class="text-xs text-gray-500 mt-1"><span data-i18n="dash.swap_hint">Min 100, in units of 100</span></p>
                        </div>
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
                                    <tbody class="divide-y divide-gray-200">
                                        <tr id="policyRow1" class="">
                                            <td class="px-2 sm:px-3 py-2 font-medium">$1,000 ~ $2,000</td>
                                            <td class="px-2 sm:px-3 py-2 text-center font-bold text-green-600">0.3%</td>
                                            <td class="px-2 sm:px-3 py-2 text-center font-bold text-blue-600">60 <span data-i18n="dash.days">days</span></td>
                                        </tr>
                                        <tr id="policyRow2" class="">
                                            <td class="px-2 sm:px-3 py-2 font-medium">$3,000 ~ $4,000</td>
                                            <td class="px-2 sm:px-3 py-2 text-center font-bold text-green-600">0.5%</td>
                                            <td class="px-2 sm:px-3 py-2 text-center font-bold text-blue-600">90 <span data-i18n="dash.days">days</span></td>
                                        </tr>
                                        <tr id="policyRow3" class="">
                                            <td class="px-2 sm:px-3 py-2 font-medium">$5,000 ~ $9,000</td>
                                            <td class="px-2 sm:px-3 py-2 text-center font-bold text-green-600">0.7%</td>
                                            <td class="px-2 sm:px-3 py-2 text-center font-bold text-blue-600">120 <span data-i18n="dash.days">days</span></td>
                                        </tr>
                                        <tr id="policyRow4" class="">
                                            <td class="px-2 sm:px-3 py-2 font-medium">$10,000+</td>
                                            <td class="px-2 sm:px-3 py-2 text-center font-bold text-green-600">1.0%</td>
                                            <td class="px-2 sm:px-3 py-2 text-center font-bold text-blue-600">180 <span data-i18n="dash.days">days</span></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <input type="hidden" id="stakingAmount" value="0">
                            <div id="rewardPreview" class="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200 hidden">
                                <p class="text-sm font-bold text-purple-800 mb-1" data-i18n="dash.expected_reward">예상 보상 (관리자 승인 후 지급)</p>
                                <div class="flex justify-between text-sm">
                                    <span class="text-gray-600" data-i18n="dash.qta_preview">QTA Reward :</span>
                                    <span id="qtaRewardPreview" class="font-bold text-blue-600">0</span>
                                </div>
                                <div class="flex justify-between text-sm">
                                    <span class="text-gray-600" data-i18n="dash.qx_preview">QX Reward :</span>
                                    <span id="qxRewardPreview" class="font-bold text-purple-600">0</span>
                                </div>
                                <div class="flex justify-between text-sm">
                                    <span class="text-gray-600" data-i18n="dash.qkey_preview">QKEY Reward :</span>
                                    <span id="qkeyRewardPreview" class="font-bold text-yellow-600">0</span>
                                </div>
                                <div class="flex justify-between text-sm mt-1 pt-1 border-t border-purple-200">
                                    <span class="text-gray-600" data-i18n="dash.daily_rate_label">Daily Rate :</span>
                                    <span id="dailyRatePreview" class="font-bold text-green-600">0%</span>
                                </div>
                                <div class="flex justify-between text-sm mt-1 pt-1 border-t border-purple-200">
                                    <span class="text-gray-600" data-i18n="dash.period_label">Period :</span>
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
                                    <label class="block text-xs text-gray-600 mb-1 font-medium" data-i18n="dash.company_wallet">회사 지갑주소 (QUANTARIUM)</label>
                                    <div class="flex items-center gap-2 mb-2">
                                        <input type="text" id="companyWallet" 
                                            value="0xE0c166B147a742E4FbCf5e5BCf73aCA631f14f0e" 
                                            readonly
                                            class="flex-1 min-w-0 px-2 py-2 bg-gray-50 border border-gray-300 rounded font-mono text-xs sm:text-sm truncate">
                                        <button type="button" onclick="copyCompanyWallet()" 
                                            class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded font-medium transition">
                                            <i class="fas fa-copy mr-1"></i><span data-i18n="common.copy">Copy</span>
                                        </button>
                                    </div>
                                    <button type="button" onclick="openTxidInput()" 
                                        class="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium transition">
                                        <i class="fas fa-receipt mr-1"></i><span data-i18n="dash.txid_entry">Deposit Confirm (TXID)</span>
                                    </button>
                                </div>

                                <!-- QR 코드 -->
                                <div class="bg-white rounded-lg p-3 border border-blue-200 shadow-sm flex flex-col items-center justify-center">
                                    <label class="block text-xs text-gray-600 mb-2 font-medium" data-i18n="dash.qr_label">Easy deposit via QR code</label>
                                    <div id="qrcode" class="bg-white p-2 rounded"></div>
                                    <p class="text-xs text-gray-500 mt-2 text-center" data-i18n="dash.qr_scan">Scan QR with wallet app</p>
                                </div>
                            </div>
                        </div>

                        <button type="submit" 
                            class="w-full bg-purple-600 text-white py-3 sm:py-4 rounded-lg font-bold text-base sm:text-lg hover:bg-purple-700 transition">
                            <i class="fas fa-paper-plane mr-2"></i><span data-i18n="dash.staking_apply">스테이킹 신청</span>
                        </button>
                    </form>
                </div>

                <!-- Withdrawal Section (스테이킹 기간 종료 시 표시) -->
                <div id="withdrawalSection" class="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8" style="display: none;">
                    <h2 class="text-xl sm:text-2xl font-bold text-gray-800 mb-4">
                        <i class="fas fa-money-bill-wave mr-2 text-green-600"></i><span data-i18n="dash.withdrawal_title">코인 출금 신청</span>
                    </h2>
                    <div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                        <p class="text-sm text-green-800">
                            <i class="fas fa-check-circle mr-2"></i>
                            <span data-i18n="dash.withdrawal_available">거치기간이 종료되었습니다. 보유하신 코인을 출금 신청하실 수 있습니다.</span>
                        </p>
                    </div>
                    
                    <div class="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        <!-- QTA 출금 -->
                        <div class="border-2 border-blue-200 rounded-lg p-3 sm:p-4 hover:border-blue-400 transition">
                            <div class="flex items-center justify-between mb-2 sm:mb-3">
                                <h3 class="font-bold text-gray-800 text-sm sm:text-base">QTA</h3>
                                <i class="fas fa-coins text-blue-600 text-lg sm:text-2xl"></i>
                            </div>
                            <p class="text-xs sm:text-sm text-gray-600 mb-1" data-i18n="dash.balance">Balance</p>
                            <p class="text-lg sm:text-2xl font-bold text-blue-600 mb-3 sm:mb-4" id="withdrawQtaBalance">0</p>
                            <button onclick="requestWithdrawal('QTA')" 
                                class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition text-xs sm:text-sm">
                                <i class="fas fa-paper-plane mr-1"></i><span data-i18n="common.withdraw">Withdraw</span>
                            </button>
                        </div>
                        
                        <!-- QX 출금 -->
                        <div class="border-2 border-purple-200 rounded-lg p-3 sm:p-4 hover:border-purple-400 transition">
                            <div class="flex items-center justify-between mb-2 sm:mb-3">
                                <h3 class="font-bold text-gray-800 text-sm sm:text-base">QX</h3>
                                <i class="fas fa-coins text-purple-600 text-lg sm:text-2xl"></i>
                            </div>
                            <p class="text-xs sm:text-sm text-gray-600 mb-1" data-i18n="dash.balance">Balance</p>
                            <p class="text-lg sm:text-2xl font-bold text-purple-600 mb-3 sm:mb-4" id="withdrawQxBalance">0</p>
                            <button onclick="requestWithdrawal('QX')" 
                                class="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg font-medium transition text-xs sm:text-sm">
                                <i class="fas fa-paper-plane mr-1"></i><span data-i18n="common.withdraw">Withdraw</span>
                            </button>
                        </div>
                        
                        <!-- QKEY 출금 -->
                        <div class="border-2 border-yellow-200 rounded-lg p-3 sm:p-4 hover:border-yellow-400 transition">
                            <div class="flex items-center justify-between mb-2 sm:mb-3">
                                <h3 class="font-bold text-gray-800 text-sm sm:text-base">QKEY</h3>
                                <i class="fas fa-key text-yellow-600 text-lg sm:text-2xl"></i>
                            </div>
                            <p class="text-xs sm:text-sm text-gray-600 mb-1" data-i18n="dash.balance">Balance</p>
                            <p class="text-lg sm:text-2xl font-bold text-yellow-600 mb-3 sm:mb-4" id="withdrawQkeyBalance">0</p>
                            <button onclick="requestWithdrawal('QKEY')" 
                                class="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-2 rounded-lg font-medium transition text-xs sm:text-sm">
                                <i class="fas fa-paper-plane mr-1"></i><span data-i18n="common.withdraw">Withdraw</span>
                            </button>
                        </div>
                        
                        <!-- USDT 출금 -->
                        <div class="border-2 border-green-200 rounded-lg p-3 sm:p-4 hover:border-green-400 transition">
                            <div class="flex items-center justify-between mb-2 sm:mb-3">
                                <h3 class="font-bold text-gray-800 text-sm sm:text-base">USDT</h3>
                                <i class="fas fa-dollar-sign text-green-600 text-lg sm:text-2xl"></i>
                            </div>
                            <p class="text-xs sm:text-sm text-gray-600 mb-1" data-i18n="dash.balance">Balance</p>
                            <p class="text-lg sm:text-2xl font-bold text-green-600 mb-3 sm:mb-4" id="withdrawUsdtBalance">0</p>
                            <button onclick="requestWithdrawal('USDT')" 
                                class="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium transition text-xs sm:text-sm">
                                <i class="fas fa-paper-plane mr-1"></i><span data-i18n="common.withdraw">Withdraw</span>
                            </button>
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
                                    placeholder="Search by name or email..." data-i18n-placeholder="dash.search_referral" 
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
                                <p class="text-xs text-gray-600 mb-1"><i class="fas fa-coins mr-1 text-green-500"></i><span data-i18n="dash.dividend">Dividend</span></p>
                                <p class="text-lg font-bold text-green-700" id="reward-daily-total">0 QKEY</p>
                                <p class="text-xs text-gray-500"><span id="reward-daily-count">0</span></p>
                            </div>
                            <div class="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-3 border border-orange-300">
                                <p class="text-xs text-gray-600 mb-1"><i class="fas fa-handshake mr-1 text-orange-500"></i><span data-i18n="dash.direct_sales">Direct Sales</span></p>
                                <p class="text-lg font-bold text-orange-700" id="reward-direct-total">0 QKEY</p>
                                <p class="text-xs text-gray-500"><span id="reward-direct-count">0</span></p>
                            </div>
                            <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 border border-blue-300">
                                <p class="text-xs text-gray-600 mb-1"><i class="fas fa-hand-holding-usd mr-1 text-blue-500"></i><span data-i18n="dash.level1_bonus">Level 1 Bonus</span></p>
                                <p class="text-lg font-bold text-blue-700" id="reward-level1-total">0 QKEY</p>
                                <p class="text-xs text-gray-500"><span id="reward-level1-count">0</span></p>
                            </div>
                            <div class="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3 border border-purple-300">
                                <p class="text-xs text-gray-600 mb-1"><i class="fas fa-gifts mr-1 text-purple-500"></i><span data-i18n="dash.level2_bonus">Level 2 Bonus</span></p>
                                <p class="text-lg font-bold text-purple-700" id="reward-level2-total">0 QKEY</p>
                                <p class="text-xs text-gray-500"><span id="reward-level2-count">0</span></p>
                            </div>
                        </div>

                        <!-- 누적 총 보상 -->
                        <div class="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg p-3 mb-4 border border-yellow-300 text-center">
                            <p class="text-xs text-gray-600 mb-1" data-i18n="dash.total_reward">Total Accumulated Reward</p>
                            <p class="text-xl font-bold text-yellow-700" id="reward-grand-total">0 QKEY</p>
                        </div>

                        <!-- 보상 내역 테이블 -->
                        <div class="overflow-x-auto">
                            <table class="w-full text-xs sm:text-sm">
                                <thead class="bg-gray-100">
                                    <tr>
                                        <th class="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-700" data-i18n="common.date">Date</th>
                                        <th class="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-700" data-i18n="common.category">Category</th>
                                        <th class="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-700" data-i18n="common.details">Details</th>
                                        <th class="px-2 sm:px-4 py-2 text-right text-xs font-medium text-gray-700" data-i18n="common.amount">Amount</th>
                                    </tr>
                                </thead>
                                <tbody id="rewards-table-body" class="divide-y divide-gray-200">
                                    <tr>
                                        <td colspan="4" class="px-4 py-8 text-center text-gray-500" data-i18n="common.loading">Loading...</td>
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
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/i18n.js?v=20260416"></script>
        <script>
            let currentUser = null;
            let accumulatedAmount = 0;

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
                        
                        // 로컬 스토리지 업데이트
                        localStorage.setItem('user', JSON.stringify(user));
                    }
                } catch (error) {
                    console.error('Failed to load user info:', error);
                }
            }

            // 스테이킹 현황 업데이트
            function updateStakingStatus(stakings) {
                // 진행중인 스테이킹 (active) 필터링
                const activeStakings = stakings.filter(s => s.status === 'active');
                
                // 전체 위탁 수량 계산
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
                        
                        // 출금 섹션 표시 여부
                        const withdrawalSection = document.getElementById('withdrawalSection');
                        if (hasCompletedStaking) {
                            withdrawalSection.style.display = 'block';
                            // 출금 가능 잔액 업데이트
                            updateWithdrawalBalances();
                        } else {
                            withdrawalSection.style.display = 'none';
                        }
                        
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
                            if (s.status === 'pending') {
                                statusColor = 'yellow';
                                statusText = I18N.t('dash.status_pending');
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
            
            // 출금 신청
            async function requestWithdrawal(coinType) {
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
                        }
                    } catch (error) {
                        alert(error.response?.data?.error || I18N.t('alert.withdrawal_applied'));
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
                const companyWallet = '0xE0c166B147a742E4FbCf5e5BCf73aCA631f14f0e';
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

            // 금액별 정책 정보 반환
            function getPolicy(amount) {
                if (amount >= 10000) return { rate: '1.0%', rateNum: 0.01, period: 180, periodText: '180' + I18N.t('dash.days') };
                if (amount >= 5000) return { rate: '0.7%', rateNum: 0.007, period: 120, periodText: '120' + I18N.t('dash.days') };
                if (amount >= 3000) return { rate: '0.5%', rateNum: 0.005, period: 90, periodText: '90' + I18N.t('dash.days') };
                return { rate: '0.3%', rateNum: 0.003, period: 60, periodText: '60' + I18N.t('dash.days') };
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
                
                // 정책 테이블 하이라이트 초기화
                ['policyRow1', 'policyRow2', 'policyRow3', 'policyRow4'].forEach(id => {
                    document.getElementById(id).className = '';
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

                // 해당 정책 행 하이라이트
                if (accumulatedAmount >= 10000) {
                    document.getElementById('policyRow4').className = 'bg-purple-100 font-bold';
                } else if (accumulatedAmount >= 5000) {
                    document.getElementById('policyRow3').className = 'bg-purple-100 font-bold';
                } else if (accumulatedAmount >= 3000) {
                    document.getElementById('policyRow2').className = 'bg-purple-100 font-bold';
                } else {
                    document.getElementById('policyRow1').className = 'bg-purple-100 font-bold';
                }

                // 보상 미리보기
                const qtaReward = (accumulatedAmount / 1000) * 150000;
                const qxReward = (accumulatedAmount / 1000) * 20000;
                const qkeyReward = (accumulatedAmount / 1000) * 5000;
                document.getElementById('qtaRewardPreview').textContent = qtaReward.toLocaleString();
                document.getElementById('qxRewardPreview').textContent = qxReward.toLocaleString();
                document.getElementById('qkeyRewardPreview').textContent = qkeyReward.toLocaleString();
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
                const qtaReward = (amount / 1000) * 150000;
                const qxReward = (amount / 1000) * 20000;
                const qkeyReward = (amount / 1000) * 5000;
                
                if (confirm('$' + amount.toLocaleString() + ' / ' + policy.periodText + '\\n\\n' + I18N.t('dash.daily_rate') + ': ' + policy.rate + '\\n' + I18N.t('dash.period') + ': ' + policy.periodText + '\\n\\n• QTA ' + qtaReward.toLocaleString() + '\\n• QX ' + qxReward.toLocaleString() + '\\n• QKEY ' + qkeyReward.toLocaleString())) {
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
                                <i class="fas fa-user-cog text-purple-600 mr-2"></i><span data-i18n="profile.settings">Profile Settings</span>
                            </h2>
                            <button onclick="closeProfileModal()" class="text-gray-500 hover:text-gray-700">
                                <i class="fas fa-times text-2xl"></i>
                            </button>
                        </div>
                        
                        <form id="profileForm" onsubmit="handleProfileUpdate(event)" class="space-y-4">
                            <!-- 이름 -->
                            <div>
                                <label class="block text-gray-700 font-medium mb-2">
                                    <i class="fas fa-user mr-2"></i><span data-i18n="profile.name">Name</span>
                                </label>
                                <input type="text" id="profileName" value="\${currentUser.name}" required
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500">
                            </div>
                            
                            <!-- 이메일 (읽기 전용) -->
                            <div>
                                <label class="block text-gray-700 font-medium mb-2">
                                    <i class="fas fa-envelope mr-2"></i><span data-i18n="profile.email_label">Email</span>
                                </label>
                                <input type="email" value="\${currentUser.email}" readonly
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed">
                                <p class="text-xs text-gray-500 mt-1" data-i18n="profile.email_readonly">Email cannot be changed</p>
                            </div>
                            
                            <!-- 휴대폰 번호 -->
                            <div>
                                <label class="block text-gray-700 font-medium mb-2">
                                    <i class="fas fa-phone mr-2"></i><span data-i18n="profile.phone_label">Phone Number</span>
                                </label>
                                <input type="tel" id="profilePhone" value="\${currentUser.phone || ''}" 
                                    pattern="010[0-9]{8}" placeholder="01012345678"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500">
                            </div>
                            
                            <!-- QKEY 지갑주소 (읽기 전용) -->
                            <div>
                                <label class="block text-gray-700 font-medium mb-2">
                                    <i class="fas fa-wallet mr-2"></i><span data-i18n="profile.qkey_wallet">Wallet (QKEY)</span>
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
                                    <span data-i18n="profile.wallet_contact_admin">Contact admin to change wallet address</span>
                                </p>
                            </div>
                            
                            <!-- USDT 지갑주소 (읽기 전용) -->
                            <div>
                                <label class="block text-gray-700 font-medium mb-2">
                                    <i class="fas fa-wallet mr-2"></i><span data-i18n="profile.usdt_wallet">Wallet (USDT)</span>
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
                                    <span data-i18n="profile.binance_usdt">Binance (BINANCE) USDT Wallet</span>
                                </p>
                            </div>
                            
                            <!-- 비밀번호 변경 -->
                            <div class="border-t pt-4">
                                <label class="block text-gray-700 font-medium mb-2">
                                    <i class="fas fa-lock mr-2"></i><span data-i18n="profile.change_password">Change Password (Optional)</span>
                                </label>
                                <input type="password" id="profilePassword" placeholder="New password (only if changing)" data-i18n-placeholder="profile.new_password"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 mb-2">
                                <input type="password" id="profilePasswordConfirm" placeholder="Confirm new password" data-i18n-placeholder="profile.confirm_password"
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
                            '<p class="font-bold text-gray-800 text-sm sm:text-base">' + user.name + '</p>' +
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
                        (wallet ? '<button data-wallet="' + wallet + '" onclick="copyWallet(this.getAttribute(&apos;data-wallet&apos;))" class="px-2 py-1 bg-' + color + '-100 hover:bg-' + color + '-200 text-' + color + '-700 rounded text-xs font-medium transition whitespace-nowrap"><i class="fas fa-copy mr-1"></i><span data-i18n="common.copy">Copy</span></button>' : '') +
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
                                }
                                
                                return '<tr class="hover:bg-gray-50">' +
                                    '<td class="px-2 sm:px-4 py-2 text-xs text-gray-600 whitespace-nowrap">' + 
                                        new Date(reward.created_at).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' }) +
                                        ' ' + new Date(reward.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) +
                                    '</td>' +
                                    '<td class="px-2 sm:px-4 py-2"><span class="px-2 py-0.5 ' + badgeClass + ' rounded text-xs font-medium whitespace-nowrap">' + badgeText + '</span></td>' +
                                    '<td class="px-2 sm:px-4 py-2 text-xs text-gray-700 truncate max-w-[120px]" title="' + (reward.description || '') + '">' + (reward.description || '-') + '</td>' +
                                    '<td class="px-2 sm:px-4 py-2 text-right text-xs font-bold ' + amountColor + ' whitespace-nowrap">+' + 
                                        Math.round(reward.amount).toLocaleString() + ' QKEY' +
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

            // QKEY → USDT 스왑
            async function handleSwap() {
                const amountInput = document.getElementById('swapAmount');
                const amount = parseInt(amountInput.value);

                if (!amount || isNaN(amount)) {
                    alert(I18N.t('alert.enter_valid_amount'));
                    return;
                }

                if (amount < 100) {
                    alert(I18N.t('dash.swap_rate'));
                    return;
                }

                if (amount % 100 !== 0) {
                    alert(I18N.t('dash.swap_unit_hint'));
                    return;
                }

                const qkeyBalance = parseInt((document.getElementById('swapQkeyBalance').textContent || '0').replace(/,/g, ''));
                var requiredQkey = amount * 150;
                if (requiredQkey > qkeyBalance) {
                    alert(I18N.t('alert.insufficient_balance'));
                    return;
                }

                if (!confirm(requiredQkey.toLocaleString() + ' QKEY → ' + amount.toLocaleString() + ' USDT\\n\\n' + I18N.t('dash.swap_rate'))) {
                    return;
                }

                try {
                    const response = await axios.post('/api/swap/qkey-to-usdt', {
                        userId: currentUser.id,
                        amount: amount
                    });

                    if (response.data.success) {
                        alert(I18N.t('alert.swap_complete') + '\\n\\n' + requiredQkey.toLocaleString() + ' QKEY → ' + amount.toLocaleString() + ' USDT');
                        amountInput.value = '';
                        await loadUserInfo();
                    }
                } catch (error) {
                    alert(error.response?.data?.error || 'Swap error');
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
        <title>Admin Login - QUANTARIUM STAKING</title>
        <link rel="icon" type="image/png" href="/static/quantarium-logo.png">
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
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

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/i18n.js?v=20260416"></script>
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
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
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
                        <div class="flex items-center gap-2">
                            <div id="langSelector"></div>
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

                <!-- 일일 배당 지급 버튼 -->
                <div class="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
                    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div>
                            <h3 class="text-lg font-bold text-gray-800"><i class="fas fa-coins text-yellow-600 mr-2"></i><span data-i18n="admin.daily_reward_title">일일 배당금 지급</span></h3>
                            <p class="text-sm text-gray-600 mt-1" data-i18n="admin.daily_reward_desc">활성 투자 건에 대한 일일 QKEY 배당금을 지급합니다</p>
                        </div>
                        <button onclick="executeDailyReward()" id="dailyRewardBtn"
                            class="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-bold transition text-sm sm:text-base whitespace-nowrap">
                            <i class="fas fa-play mr-2"></i><span data-i18n="admin.daily_reward_btn">배당금 지급 실행</span>
                        </button>
                    </div>
                    <div id="dailyRewardResult" class="mt-3 hidden">
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
                        <button onclick="showTab('memberRewards')" id="tab-memberRewards" 
                            class="px-3 sm:px-6 py-3 sm:py-4 font-medium text-gray-600 hover:text-purple-600 whitespace-nowrap text-xs sm:text-base">
                            <i class="fas fa-gift mr-1 sm:mr-2"></i><span data-i18n="admin.tab_member_rewards">수당체크</span>
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
                        <div class="flex gap-2">
                            <button onclick="openDownlineModal()" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition">
                                <i class="fas fa-sitemap mr-1"></i><span data-i18n="admin.downline_sales_btn">산하매출 조회</span>
                            </button>
                            <button onclick="exportCSV('users')" class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-bold transition">
                                <i class="fas fa-file-excel mr-1"></i><span data-i18n="admin.export_csv">엑셀 다운로드</span>
                            </button>
                        </div>
                    </div>
                    <div id="usersList" class="space-y-4">
                        <p class="text-center text-gray-500 py-8" data-i18n="admin.loading">로딩 중...</p>
                    </div>
                </div>

                <!-- 배당 현황 (숨김) -->
                <div id="content-rewards" class="bg-white rounded-lg shadow-md p-4 sm:p-6 hidden">
                    <h2 class="text-xl font-bold text-gray-800 mb-4">
                        <i class="fas fa-coins text-yellow-600 mr-2"></i><span data-i18n="admin.rewards_title">배당 현황</span>
                    </h2>
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
                    <!-- 최근 배당 내역 -->
                    <h3 class="text-base font-bold text-gray-700 mb-2" data-i18n="admin.recent_rewards">최근 배당 내역</h3>
                    <div class="overflow-x-auto">
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
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
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
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
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
                                    <th class="px-2 sm:px-3 py-2 text-left" data-i18n="admin.col_sale_date">판매일</th>
                                </tr>
                            </thead>
                            <tbody id="salesTableBody" class="divide-y divide-gray-200">
                                <tr><td colspan="6" class="text-center py-8 text-gray-500" data-i18n="admin.loading">로딩 중...</td></tr>
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

                <!-- 산하매출 모달 -->
                <div id="downlineModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 hidden">
                    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-lg font-bold text-gray-800"><i class="fas fa-sitemap text-blue-600 mr-2"></i><span data-i18n="admin.downline_title">산하 매출 조회</span></h3>
                            <button onclick="closeDownlineModal()" class="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
                        </div>
                        <!-- 회원 검색 -->
                        <div class="mb-4 flex gap-2">
                            <input type="text" id="downlineSearchInput" data-i18n-placeholder="admin.downline_search_placeholder" placeholder="이메일/이름/추천코드로 검색..."
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
            </main>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/i18n.js?v=20260416"></script>
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
                var sections = ['pending', 'all', 'rewards', 'withdrawals', 'users', 'signups', 'sales', 'memberRewards'];
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
                else if (tab === 'memberRewards') loadMemberRewards();
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
                    const response = await axios.get('/api/admin/staking/pending');
                    console.log('Pending stakings response:', response.data);
                    const stakings = response.data.stakings || [];
                    const listEl = document.getElementById('pendingList');
                    console.log('Found pendingList element:', listEl);

                    if (stakings.length === 0) {
                        listEl.innerHTML = '<p class="text-center text-gray-500 py-8">' + I18N.t('admin.no_pending') + '</p>';
                        return;
                    }

                    listEl.innerHTML = stakings.map(s => \`
                        <div class="border border-yellow-200 bg-yellow-50 rounded-lg p-6">
                            <div class="flex justify-between items-start mb-4">
                                <div class="flex-1">
                                    <div class="flex items-center gap-2 mb-2">
                                        <span class="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                                            <i class="fas fa-clock mr-1"></i>\${I18N.t('admin.status_pending')}
                                        </span>
                                        <span class="text-xs text-gray-500">\${new Date(s.created_at).toLocaleString(I18N.getLang())}</span>
                                    </div>
                                    <h3 class="text-xl font-bold text-gray-800 mb-1">\${esc(s.name)}</h3>
                                    <p class="text-sm text-gray-600"><i class="fas fa-envelope mr-1"></i>\${esc(s.email)}</p>
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
                                        <h3 class="text-lg font-bold text-gray-800">\${esc(s.name)}</h3>
                                        <p class="text-sm text-gray-600">\${esc(s.email)}</p>
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

            // 사용자 목록 로드
            async function loadUsers() {
                try {
                    const response = await axios.get('/api/admin/users');
                    const users = response.data.users || [];
                    const listEl = document.getElementById('usersList');

                    if (users.length === 0) {
                        listEl.innerHTML = '<p class="text-center text-gray-500 py-8">' + I18N.t('admin.no_users') + '</p>';
                        return;
                    }

                    listEl.innerHTML = users.map(u => \`
                        <div class="border border-gray-200 rounded-lg p-6">
                            <div class="flex justify-between items-start">
                                <div class="flex-1">
                                    <div class="flex items-center gap-2 mb-1">
                                        <h3 class="text-lg font-bold text-gray-800">\${esc(u.name)}</h3>
                                        \${u.country ? '<span class="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">' + esc(u.country) + '</span>' : ''}
                                        \${u.language ? '<span class="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs">' + esc(u.language) + '</span>' : ''}
                                    </div>
                                    <p class="text-sm text-gray-600 mb-1"><i class="fas fa-envelope mr-1"></i>\${esc(u.email)}</p>
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

                            <div class="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t flex justify-end gap-2">
                                <button onclick="showDownlineSales(\${u.id})" 
                                    class="px-3 sm:px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition duration-200 text-xs sm:text-sm">
                                    <i class="fas fa-sitemap mr-1 sm:mr-2"></i>\${I18N.t('admin.downline_sales')}
                                </button>
                                <button onclick="showUserDetail(\${u.id})" 
                                    class="px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition duration-200 text-xs sm:text-sm">
                                    <i class="fas fa-search mr-1 sm:mr-2"></i>\${I18N.t('admin.view_detail')}
                                </button>
                                <button onclick="deleteUser(\${u.id}, '\${esc(u.name)}', '\${esc(u.email)}', \${u.staking_amount})" 
                                    class="px-3 sm:px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition duration-200 text-xs sm:text-sm">
                                    <i class="fas fa-user-times mr-1 sm:mr-2"></i>\${I18N.t('admin.force_delete')}
                                </button>
                            </div>
                        </div>
                    \`).join('');
                } catch (error) {
                    console.error('Users list load failed:', error);
                }
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
                                    <h3 class="text-lg font-bold text-gray-800 mb-1">\${esc(u.name)}</h3>
                                    <p class="text-sm text-gray-600 mb-1"><i class="fas fa-envelope mr-1"></i>\${esc(u.email)}</p>
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
            async function loadRewardsStatus() {
                try {
                    const response = await axios.get('/api/admin/rewards');
                    if (!response.data.success) return;
                    const { stats, today, referralStats, rewards } = response.data;

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
                } catch (error) {
                    console.error('Rewards status load failed:', error);
                }
            }

            // ============================================
            // 출금 관리 로드
            // ============================================
            async function loadWithdrawals() {
                try {
                    const response = await axios.get('/api/admin/withdrawals');
                    if (!response.data.success) return;
                    const { stats, withdrawals } = response.data;

                    document.getElementById('wdPendingCount').textContent = stats.pendingCount;
                    document.getElementById('wdApprovedCount').textContent = stats.approvedCount;
                    document.getElementById('wdRejectedCount').textContent = stats.rejectedCount;
                    document.getElementById('wdTotalCount').textContent = stats.totalCount;

                    var listEl = document.getElementById('withdrawalsList');
                    if (withdrawals.length === 0) {
                        listEl.innerHTML = '<p class="text-center text-gray-500 py-8">' + I18N.t('admin.no_withdrawal_history') + '</p>';
                        return;
                    }

                    listEl.innerHTML = withdrawals.map(function(w) {
                        var statusColor = w.status === 'pending' ? 'yellow' : w.status === 'approved' ? 'green' : 'red';
                        var statusText = w.status === 'pending' ? I18N.t('admin.wd_pending') : w.status === 'approved' ? I18N.t('admin.wd_approved') : I18N.t('admin.wd_rejected');
                        var coinColor = w.coin_type === 'QTA' ? 'blue' : w.coin_type === 'QX' ? 'purple' : w.coin_type === 'QKEY' ? 'yellow' : 'green';
                        
                        return '<div class="border rounded-lg p-3 sm:p-4 border-' + statusColor + '-200 bg-' + statusColor + '-50">' +
                            '<div class="flex flex-col sm:flex-row justify-between items-start gap-2 mb-2">' +
                                '<div class="flex-1">' +
                                    '<div class="flex items-center gap-2 mb-1">' +
                                        '<span class="px-2 py-0.5 bg-' + statusColor + '-100 text-' + statusColor + '-700 rounded text-xs font-bold">' + statusText + '</span>' +
                                        '<span class="px-2 py-0.5 bg-' + coinColor + '-100 text-' + coinColor + '-700 rounded text-xs font-bold">' + w.coin_type + '</span>' +
                                        '<span class="text-xs text-gray-500">' + new Date(w.created_at).toLocaleString(I18N.getLang()) + '</span>' +
                                    '</div>' +
                                    '<p class="text-sm font-medium text-gray-800">' + esc(w.name) + ' <span class="text-gray-500 font-normal">(' + esc(w.email) + ')</span></p>' +
                                '</div>' +
                                '<p class="text-xl sm:text-2xl font-bold text-' + coinColor + '-600">' + parseFloat(w.amount).toLocaleString() + ' ' + w.coin_type + '</p>' +
                            '</div>' +
                            '<div class="flex items-center gap-2 text-xs text-gray-600 mb-2">' +
                                '<i class="fas fa-wallet"></i>' +
                                '<span class="font-mono truncate">' + esc(w.wallet_address) + '</span>' +
                                '<button onclick="copyWalletAddress(\\'' + w.wallet_address + '\\')" class="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-xs"><i class="fas fa-copy"></i></button>' +
                            '</div>' +
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
            // 일일 배당금 지급 실행
            // ============================================
            async function executeDailyReward() {
                if (!confirm(I18N.t('admin.daily_reward_confirm'))) return;
                
                var btn = document.getElementById('dailyRewardBtn');
                btn.disabled = true;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>' + I18N.t('admin.daily_reward_processing');

                try {
                    const response = await axios.post('/api/rewards/daily');
                    if (response.data.success) {
                        var resultEl = document.getElementById('dailyRewardResult');
                        resultEl.classList.remove('hidden');
                        resultEl.innerHTML = '<div class="bg-green-50 border border-green-300 rounded-lg p-3">' +
                            '<p class="text-sm font-bold text-green-800"><i class="fas fa-check-circle mr-1"></i>' + response.data.message + '</p>' +
                            '<div class="grid grid-cols-3 gap-2 mt-2 text-center">' +
                                '<div><p class="text-xs text-gray-600">' + I18N.t('admin.daily_reward_people') + '</p><p class="font-bold text-green-600">' + (response.data.rewarded || 0) + I18N.t('admin.people_unit') + '</p></div>' +
                                '<div><p class="text-xs text-gray-600">' + I18N.t('admin.daily_reward_total_qkey') + '</p><p class="font-bold text-yellow-600">' + (response.data.totalQkey || 0).toLocaleString() + '</p></div>' +
                                '<div><p class="text-xs text-gray-600">' + I18N.t('admin.daily_reward_skipped') + '</p><p class="font-bold text-gray-600">' + (response.data.skipped || 0) + I18N.t('admin.cases_unit') + '</p></div>' +
                            '</div>' +
                        '</div>';
                        await loadStatistics();
                    }
                } catch (error) {
                    alert(error.response?.data?.error || I18N.t('admin.daily_reward_fail'));
                }

                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-play mr-2"></i>' + I18N.t('admin.daily_reward_btn');
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
                            '<h4 class="font-bold text-gray-800 text-lg mb-2">' + esc(u.name) + '</h4>' +
                            '<div class="grid grid-cols-2 gap-2 text-sm">' +
                                '<div><span class="text-gray-500">' + I18N.t('admin.email_label') + '</span> ' + esc(u.email) + '</div>' +
                                '<div><span class="text-gray-500">' + I18N.t('admin.phone_label') + '</span> ' + esc(u.phone || 'N/A') + '</div>' +
                                '<div class="col-span-2"><span class="text-gray-500">' + I18N.t('admin.qkey_wallet_label') + '</span> <span class="font-mono text-xs">' + esc(u.wallet_address) + '</span></div>' +
                                '<div class="col-span-2"><span class="text-gray-500">' + I18N.t('admin.usdt_wallet_label') + '</span> <span class="font-mono text-xs">' + esc(u.usdt_wallet_address || 'N/A') + '</span></div>' +
                                '<div><span class="text-gray-500">' + I18N.t('admin.referral_code_label') + '</span> <span class="font-bold text-purple-600">' + esc(u.referral_code || '-') + '</span></div>' +
                                '<div><span class="text-gray-500">' + I18N.t('admin.referrer_label') + '</span> ' + (referrer ? esc(referrer.name) + ' (' + esc(referrer.email) + ')' : I18N.t('admin.referrer_none')) + '</div>' +
                                '<div><span class="text-gray-500">' + I18N.t('admin.referees_label') + '</span> ' + referralCount + I18N.t('admin.people_unit') + '</div>' +
                                '<div><span class="text-gray-500">' + I18N.t('admin.join_date') + ':</span> ' + new Date(u.created_at).toLocaleString(I18N.getLang()) + '</div>' +
                            '</div>' +
                        '</div>' +
                        // 잔액
                        '<div class="grid grid-cols-4 gap-2 mb-4">' +
                            '<div class="bg-blue-50 rounded-lg p-2 text-center border border-blue-200"><p class="text-xs text-gray-500">QTA</p><p class="font-bold text-blue-600 text-sm">' + (u.qta_balance || 0).toLocaleString() + '</p></div>' +
                            '<div class="bg-purple-50 rounded-lg p-2 text-center border border-purple-200"><p class="text-xs text-gray-500">QX</p><p class="font-bold text-purple-600 text-sm">' + (u.qx_balance || 0).toLocaleString() + '</p></div>' +
                            '<div class="bg-yellow-50 rounded-lg p-2 text-center border border-yellow-200"><p class="text-xs text-gray-500">QKEY</p><p class="font-bold text-yellow-600 text-sm">' + (u.qkey_balance || 0).toLocaleString() + '</p></div>' +
                            '<div class="bg-green-50 rounded-lg p-2 text-center border border-green-200"><p class="text-xs text-gray-500">USDT</p><p class="font-bold text-green-600 text-sm">' + (u.usdt_balance || 0).toFixed(2) + '</p></div>' +
                        '</div>' +
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
                                return '<tr><td class="px-2 py-1">' + r.reward_date + '</td><td class="px-2 py-1 text-right font-bold text-yellow-600">' + Math.round(r.usdt_amount).toLocaleString() + '</td><td class="px-2 py-1 text-right">$' + (r.staking_amount || 0).toLocaleString() + '</td></tr>';
                            }).join('') +
                        '</tbody></table></div>' : '<p class="text-xs text-gray-500 mb-4">' + I18N.t('admin.no_rewards') + '</p>') +
                        // Withdrawal history
                        '<h4 class="font-bold text-gray-700 mb-2 text-sm"><i class="fas fa-money-bill-wave mr-1 text-green-600"></i>' + I18N.t('admin.withdrawal_section') + ' (' + withdrawals.length + I18N.t('admin.cases_unit') + ')</h4>' +
                        (withdrawals.length > 0 ? '<div class="overflow-x-auto mb-4"><table class="w-full text-xs"><thead class="bg-gray-100"><tr><th class="px-2 py-1 text-left">' + I18N.t('admin.date_label') + '</th><th class="px-2 py-1">' + I18N.t('admin.coin_label') + '</th><th class="px-2 py-1 text-right">' + I18N.t('admin.qty_label') + '</th><th class="px-2 py-1">' + I18N.t('admin.status_label') + '</th></tr></thead><tbody class="divide-y">' +
                            withdrawals.map(function(w) {
                                var wColor = w.status === 'pending' ? 'yellow' : w.status === 'approved' ? 'green' : 'red';
                                var wText = w.status === 'pending' ? I18N.t('admin.wd_pending') : w.status === 'approved' ? I18N.t('admin.wd_approved') : I18N.t('admin.wd_rejected');
                                return '<tr><td class="px-2 py-1">' + new Date(w.created_at).toLocaleDateString(I18N.getLang()) + '</td><td class="px-2 py-1 text-center font-bold">' + w.coin_type + '</td><td class="px-2 py-1 text-right">' + parseFloat(w.amount).toLocaleString() + '</td><td class="px-2 py-1 text-center"><span class="px-1 py-0.5 bg-' + wColor + '-100 text-' + wColor + '-700 rounded text-xs">' + wText + '</span></td></tr>';
                            }).join('') +
                        '</tbody></table></div>' : '<p class="text-xs text-gray-500 mb-4">' + I18N.t('admin.no_withdrawals') + '</p>') +
                        // Recent transactions
                        '<h4 class="font-bold text-gray-700 mb-2 text-sm"><i class="fas fa-exchange-alt mr-1 text-blue-600"></i>' + I18N.t('admin.tx_section') + ' (' + transactions.length + I18N.t('admin.cases_unit') + ')</h4>' +
                        (transactions.length > 0 ? '<div class="overflow-x-auto"><table class="w-full text-xs"><thead class="bg-gray-100"><tr><th class="px-2 py-1 text-left">' + I18N.t('admin.date_label') + '</th><th class="px-2 py-1">' + I18N.t('admin.type_label') + '</th><th class="px-2 py-1">' + I18N.t('admin.coin_label') + '</th><th class="px-2 py-1 text-right">' + I18N.t('admin.qty_label') + '</th><th class="px-2 py-1 text-left">' + I18N.t('admin.desc_label') + '</th></tr></thead><tbody class="divide-y">' +
                            transactions.slice(0, 20).map(function(t) {
                                return '<tr><td class="px-2 py-1 whitespace-nowrap">' + new Date(t.created_at).toLocaleDateString(I18N.getLang()) + '</td><td class="px-2 py-1 text-center">' + t.type + '</td><td class="px-2 py-1 text-center font-bold">' + t.coin_type + '</td><td class="px-2 py-1 text-right">' + parseFloat(t.amount).toLocaleString() + '</td><td class="px-2 py-1 truncate max-w-[150px]" title="' + esc(t.description || '') + '">' + esc(t.description || '-') + '</td></tr>';
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

            // 사용자 강제 탈퇴
            async function deleteUser(userId, userName, userEmail, stakingAmount) {
                // 진행 중인 스테이킹이 있는지 확인
                if (stakingAmount > 0) {
                    alert(I18N.t('admin.delete_has_staking') + '\\n\\n' + 
                          I18N.t('admin.delete_user_label') + userName + '\\n' +
                          I18N.t('admin.delete_email_label') + userEmail + '\\n' +
                          I18N.t('admin.delete_staking_label') + stakingAmount.toLocaleString());
                    return;
                }

                if (!confirm(I18N.t('admin.delete_confirm1') + '\\n\\n' + 
                             I18N.t('admin.delete_user_label') + userName + '\\n' +
                             I18N.t('admin.delete_email_label') + userEmail + '\\n\\n' +
                             I18N.t('admin.delete_irreversible'))) {
                    return;
                }

                // 두 번째 확인
                if (!confirm(I18N.t('admin.delete_confirm2'))) {
                    return;
                }

                try {
                    const response = await axios.delete('/api/admin/user/' + userId);
                    if (response.data.success) {
                        alert(I18N.t('admin.delete_success') + '\\n\\n' +
                              I18N.t('admin.delete_name_label') + response.data.deletedUser.name + '\\n' +
                              I18N.t('admin.delete_email_label') + response.data.deletedUser.email);
                        await loadUsers();
                        await loadSignups();
                    }
                } catch (error) {
                    console.error('User delete failed:', error);
                    if (error.response && error.response.data && error.response.data.error) {
                        alert(I18N.t('admin.delete_fail') + error.response.data.error + 
                              (error.response.data.activeStakingCount ? 
                               '\\n' + I18N.t('admin.delete_active_staking') + error.response.data.activeStakingCount + I18N.t('admin.cases_unit') : ''));
                    } else {
                        alert(I18N.t('admin.delete_error'));
                    }
                }
            }

            // 스테이킹 승인
            async function approveStaking(stakingId) {
                if (!confirm(I18N.t('admin.approve_confirm'))) {
                    return;
                }

                try {
                    const response = await axios.post(\`/api/admin/staking/approve/\${stakingId}\`);
                    if (response.data.success) {
                        alert(response.data.message);
                        await loadStatistics();
                        await loadPendingStakings();
                    }
                } catch (error) {
                    alert(error.response?.data?.error || I18N.t('admin.approve_fail'));
                }
            }

            // 스테이킹 거절
            async function rejectStaking(stakingId) {
                if (!confirm(I18N.t('admin.reject_confirm'))) {
                    return;
                }

                try {
                    const response = await axios.post(\`/api/admin/staking/reject/\${stakingId}\`);
                    if (response.data.success) {
                        alert(response.data.message);
                        await loadStatistics();
                        await loadPendingStakings();
                    }
                } catch (error) {
                    alert(error.response?.data?.error || I18N.t('admin.reject_fail'));
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

                    var tbody = document.getElementById('salesTableBody');
                    if (sales.length === 0) {
                        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-gray-500">' + I18N.t('admin.no_sales') + '</td></tr>';
                    } else {
                        tbody.innerHTML = sales.map(function(s) {
                            var stColor = s.status === 'active' ? 'green' : 'gray';
                            var stText = s.status === 'active' ? I18N.t('admin.status_active') : I18N.t('admin.status_completed');
                            return '<tr class="hover:bg-gray-50">' +
                                '<td class="px-2 sm:px-3 py-2"><span class="text-xs">' + esc(s.email) + '</span></td>' +
                                '<td class="px-2 sm:px-3 py-2 font-medium">' + esc(s.name) + '</td>' +
                                '<td class="px-2 sm:px-3 py-2 text-center text-xs">' + esc(s.country || '-') + '</td>' +
                                '<td class="px-2 sm:px-3 py-2 text-right font-bold text-blue-600">$' + s.amount.toLocaleString() + '</td>' +
                                '<td class="px-2 sm:px-3 py-2 text-center"><span class="px-2 py-0.5 bg-' + stColor + '-100 text-' + stColor + '-700 rounded text-xs">' + stText + '</span></td>' +
                                '<td class="px-2 sm:px-3 py-2 whitespace-nowrap text-xs">' + (s.sale_date ? new Date(s.sale_date).toLocaleDateString(I18N.getLang()) : '-') + '</td>' +
                            '</tr>';
                        }).join('');
                    }
                } catch (error) {
                    console.error('Sales status load failed:', error);
                }
            }

            // ============================================
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
                                '<div><p class="font-medium">' + esc(u.name) + '</p><p class="text-xs text-gray-500">' + esc(u.email) + '</p></div>' +
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
                            '<h4 class="font-bold text-purple-800">' + esc(user.name) + ' <span class="text-sm font-normal text-gray-600">(' + esc(user.email) + ')</span></h4>' +
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
            // 엑셀(CSV) 다운로드
            // ============================================
            function exportCSV(type) {
                var url = '/api/admin/export/' + type;
                // Authorization 헤더 포함 다운로드
                axios.get(url, { responseType: 'blob' }).then(function(response) {
                    var blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
                    var link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    var now = new Date().toISOString().slice(0,10);
                    link.download = type + '_export_' + now + '.csv';
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

export default app
