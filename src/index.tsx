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
// API Routes - Auth
// ============================================

// 회원가입
app.post('/api/auth/register', async (c) => {
  try {
    const { email, password, name, phone, walletAddress, usdtWalletAddress, referralCode } = await c.req.json()

    if (!email || !password || !name || !phone || !walletAddress || !usdtWalletAddress) {
      return c.json({ error: '모든 필드를 입력해주세요' }, 400)
    }

    // 이메일을 소문자로 변환 (대소문자 구분 제거)
    const normalizedEmail = email.toLowerCase().trim()

    // 전화번호에서 하이픈 제거 및 형식 검증 (010 + 8자리 숫자)
    const cleanPhone = phone.replace(/-/g, '')
    if (!cleanPhone.match(/^010\d{8}$/)) {
      return c.json({ error: '올바른 전화번호 형식이 아닙니다 (010-XXXX-XXXX)' }, 400)
    }

    // QKEY 지갑주소 형식 검증 (0x로 시작하는 42자리)
    if (!walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return c.json({ error: '올바른 QKEY 지갑주소 형식이 아닙니다 (예: 0xE0c1...f0e)' }, 400)
    }

    // USDT 지갑주소 형식 검증 (0x로 시작하는 42자리)
    if (!usdtWalletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return c.json({ error: '올바른 USDT 지갑주소 형식이 아닙니다 (예: 0xE0c1...f0e)' }, 400)
    }

    const db = c.env.DB

    // 추천인 코드 검증 (선택사항)
    let referrerId = null
    if (referralCode && referralCode.trim()) {
      const referrer = await db.prepare('SELECT id FROM users WHERE referral_code = ?')
        .bind(referralCode.trim().toUpperCase())
        .first()
      
      if (!referrer) {
        return c.json({ error: '유효하지 않은 추천인 코드입니다' }, 400)
      }
      referrerId = referrer.id
    }

    // 이메일 중복 체크 (소문자로 비교)
    const existingEmail = await db.prepare('SELECT id FROM users WHERE LOWER(email) = ?')
      .bind(normalizedEmail)
      .first()

    if (existingEmail) {
      return c.json({ error: '이미 존재하는 이메일입니다' }, 400)
    }

    // 전화번호 중복 체크
    const existingPhone = await db.prepare('SELECT id FROM users WHERE phone = ?')
      .bind(cleanPhone)
      .first()

    if (existingPhone) {
      return c.json({ error: '이미 등록된 전화번호입니다' }, 400)
    }

    // 지갑주소 중복 체크
    const existingWallet = await db.prepare('SELECT id FROM users WHERE wallet_address = ?')
      .bind(walletAddress)
      .first()

    if (existingWallet) {
      return c.json({ error: '이미 등록된 지갑주소입니다' }, 400)
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

    // 사용자 생성
    const result = await db.prepare(`
      INSERT INTO users (email, password, name, phone, wallet_address, usdt_wallet_address, qta_balance, qx_balance, qkey_balance, usdt_balance, referral_code, referrer_id)
      VALUES (?, ?, ?, ?, ?, ?, 0, 0, 0, 0, ?, ?)
    `).bind(normalizedEmail, password, name, cleanPhone, walletAddress, usdtWalletAddress, newReferralCode, referrerId).run()

    return c.json({ 
      success: true, 
      message: '회원가입이 완료되었습니다',
      userId: result.meta.last_row_id,
      referralCode: newReferralCode
    })
  } catch (error) {
    return c.json({ error: '회원가입 중 오류가 발생했습니다' }, 500)
  }
})

// 로그인
app.post('/api/auth/login', async (c) => {
  try {
    const { email, password } = await c.req.json()

    if (!email || !password) {
      return c.json({ error: '이메일과 비밀번호를 입력해주세요' }, 400)
    }

    // 이메일을 소문자로 변환 (대소문자 구분 제거)
    const normalizedEmail = email.toLowerCase().trim()

    const db = c.env.DB

    const user = await db.prepare(`
      SELECT id, email, name, phone, wallet_address, usdt_wallet_address, qta_balance, qx_balance, qkey_balance, usdt_balance, referral_code, created_at
      FROM users WHERE LOWER(email) = ? AND password = ?
    `).bind(normalizedEmail, password).first()

    if (!user) {
      return c.json({ error: '이메일 또는 비밀번호가 일치하지 않습니다' }, 401)
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
      message: '로그인 성공',
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
    return c.json({ error: '로그인 중 오류가 발생했습니다' }, 500)
  }
})

// 아이디 찾기 (이름 + 전화번호)
app.post('/api/auth/find-id', async (c) => {
  try {
    const { name, phone } = await c.req.json()

    if (!name || !phone) {
      return c.json({ error: '이름과 전화번호를 입력해주세요' }, 400)
    }

    const db = c.env.DB

    const user = await db.prepare(`
      SELECT email FROM users WHERE name = ? AND phone = ?
    `).bind(name, phone).first()

    if (!user) {
      return c.json({ error: '일치하는 계정을 찾을 수 없습니다' }, 404)
    }

    return c.json({ 
      success: true, 
      email: user.email
    })
  } catch (error) {
    return c.json({ error: '아이디 찾기 중 오류가 발생했습니다' }, 500)
  }
})

// 비밀번호 찾기 (이메일 + 전화번호)
app.post('/api/auth/find-password', async (c) => {
  try {
    const { email, phone } = await c.req.json()

    if (!email || !phone) {
      return c.json({ error: '이메일과 전화번호를 입력해주세요' }, 400)
    }

    const db = c.env.DB

    const user = await db.prepare(`
      SELECT id FROM users WHERE email = ? AND phone = ?
    `).bind(email, phone).first()

    if (!user) {
      return c.json({ error: '일치하는 계정을 찾을 수 없습니다' }, 404)
    }

    // 임시 비밀번호 생성 (실제 서비스에서는 이메일/SMS로 전송)
    const tempPassword = Math.random().toString(36).slice(-8)

    await db.prepare(`
      UPDATE users SET password = ? WHERE id = ?
    `).bind(tempPassword, user.id).run()

    return c.json({ 
      success: true, 
      tempPassword: tempPassword,
      message: '임시 비밀번호가 발급되었습니다'
    })
  } catch (error) {
    return c.json({ error: '비밀번호 찾기 중 오류가 발생했습니다' }, 500)
  }
})

// 사용자 프로필 업데이트
app.post('/api/user/update-profile', async (c) => {
  try {
    const { userId, name, phone, password } = await c.req.json()

    if (!userId || !name) {
      return c.json({ error: '필수 정보를 입력해주세요' }, 400)
    }

    const db = c.env.DB

    // 비밀번호 변경이 있는 경우
    if (password) {
      await db.prepare(`
        UPDATE users 
        SET name = ?, phone = ?, password = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(name, phone || null, password, userId).run()
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
      message: '프로필이 업데이트되었습니다'
    })
  } catch (error) {
    return c.json({ error: '프로필 업데이트 중 오류가 발생했습니다' }, 500)
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
      return c.json({ error: '필수 정보를 입력해주세요' }, 400)
    }

    if (!['QTA', 'QX', 'QKEY', 'USDT'].includes(coinType)) {
      return c.json({ error: '유효하지 않은 코인 타입입니다' }, 400)
    }

    if (amount <= 0) {
      return c.json({ error: '유효한 수량을 입력해주세요' }, 400)
    }

    const db = c.env.DB

    // 사용자 잔액 확인
    const user = await db.prepare(`
      SELECT qta_balance, qx_balance, qkey_balance, usdt_balance FROM users WHERE id = ?
    `).bind(userId).first()

    if (!user) {
      return c.json({ error: '사용자를 찾을 수 없습니다' }, 404)
    }

    // 잔액 확인
    const balanceField = coinType === 'QTA' ? 'qta_balance' : 
                         coinType === 'QX' ? 'qx_balance' : 
                         coinType === 'QKEY' ? 'qkey_balance' : 'usdt_balance'
    const currentBalance = user[balanceField]

    if (currentBalance < amount) {
      return c.json({ error: '잔액이 부족합니다' }, 400)
    }

    // 출금 신청 생성
    const withdrawalResult = await db.prepare(`
      INSERT INTO withdrawals (user_id, coin_type, amount, wallet_address, status)
      VALUES (?, ?, ?, ?, 'pending')
    `).bind(userId, coinType, amount, walletAddress).run()

    return c.json({ 
      success: true, 
      message: '출금 신청이 완료되었습니다',
      withdrawal: {
        id: withdrawalResult.meta.last_row_id,
        coinType: coinType,
        amount: amount,
        status: 'pending'
      }
    })
  } catch (error) {
    return c.json({ error: '출금 신청 중 오류가 발생했습니다' }, 500)
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
    return c.json({ error: '출금 신청 목록 조회 중 오류가 발생했습니다' }, 500)
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
      return c.json({ error: '필수 정보를 입력해주세요' }, 400)
    }

    // 최소 100 USDT 검증
    if (amount < 100) {
      return c.json({ error: '최소 스왑 수량은 100 USDT입니다' }, 400)
    }

    // 100 단위 검증
    if (amount % 100 !== 0) {
      return c.json({ error: '스왑 수량은 100 단위로만 가능합니다 (예: 100, 200, 300...)' }, 400)
    }

    const requiredQkey = amount * QKEY_PER_USDT // 필요한 QKEY 수량

    const db = c.env.DB

    // 사용자 QKEY 잔액 확인
    const user = await db.prepare(`
      SELECT qkey_balance FROM users WHERE id = ?
    `).bind(userId).first()

    if (!user) {
      return c.json({ error: '사용자를 찾을 수 없습니다' }, 404)
    }

    const qkeyBalance = user.qkey_balance || 0

    // QKEY 잔액 부족 체크
    if (qkeyBalance < requiredQkey) {
      return c.json({ error: `QKEY 잔액이 부족합니다 (보유: ${qkeyBalance.toLocaleString()} QKEY, 필요: ${requiredQkey.toLocaleString()} QKEY)` }, 400)
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
    `).bind(userId, requiredQkey, `QKEY → USDT 스왑 (${requiredQkey.toLocaleString()} QKEY → ${amount.toLocaleString()} USDT)`).run()

    // 거래 내역 기록 (USDT 증가)
    await db.prepare(`
      INSERT INTO transactions (user_id, type, coin_type, amount, description)
      VALUES (?, 'swap_in', 'USDT', ?, ?)
    `).bind(userId, amount, `QKEY → USDT 스왑 (${requiredQkey.toLocaleString()} QKEY → ${amount.toLocaleString()} USDT)`).run()

    return c.json({ 
      success: true, 
      message: `${requiredQkey.toLocaleString()} QKEY가 ${amount.toLocaleString()} USDT로 스왑되었습니다`,
      swap: {
        from: 'QKEY',
        to: 'USDT',
        qkeyUsed: requiredQkey,
        usdtReceived: amount
      }
    })
  } catch (error) {
    console.error('Swap error:', error)
    return c.json({ error: '스왑 중 오류가 발생했습니다' }, 500)
  }
})

// ============================================
// API Routes - Staking
// ============================================

// 투자금액별 일일 배당률 계산
function getDailyRate(amount: number): number {
  if (amount >= 10000) return 0.01    // $10,000 이상: 1.0%
  if (amount >= 5000) return 0.007    // $5,000~$9,000: 0.7%
  if (amount >= 3000) return 0.005    // $3,000~$4,000: 0.5%
  return 0.003                         // $1,000~$2,000: 0.3%
}

// 투자금액별 자동 거치기간 결정
function getAutoPeriodDays(amount: number): number {
  if (amount >= 10000) return 180     // $10,000 이상: 180일
  if (amount >= 5000) return 120      // $5,000~$9,000: 120일
  if (amount >= 3000) return 90       // $3,000~$4,000: 90일
  return 60                            // $1,000~$2,000: 60일
}

// 스테이킹 생성
app.post('/api/staking/create', async (c) => {
  try {
    const { userId, amount } = await c.req.json()

    if (!userId || !amount) {
      return c.json({ error: '필수 정보를 입력해주세요' }, 400)
    }

    if (amount <= 0) {
      return c.json({ error: '유효한 금액을 입력해주세요' }, 400)
    }

    // 최소 투자금액 검증 ($1,000)
    if (amount < 1000) {
      return c.json({ error: '최소 투자금액은 $1,000입니다' }, 400)
    }

    // $1,000 단위 검증
    if (amount % 1000 !== 0) {
      return c.json({ error: '투자금액은 $1,000 단위로만 입력 가능합니다' }, 400)
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
      message: '투자 신청이 완료되었습니다. 관리자 승인 후 코인이 지급됩니다.',
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
    return c.json({ error: '투자 신청 중 오류가 발생했습니다' }, 500)
  }
})

// TXID 저장 API
app.post('/api/staking/txid', async (c) => {
  try {
    const { stakingId, txid } = await c.req.json()
    
    if (!stakingId || !txid) {
      return c.json({ error: 'TXID를 입력해주세요' }, 400)
    }

    // TXID 형식 검증 (0x로 시작하는 64자리 hex + 0x = 66자)
    const txidTrimmed = txid.trim()
    if (!/^0x[a-fA-F0-9]{64}$/.test(txidTrimmed)) {
      return c.json({ error: '올바른 TXID 형식이 아닙니다 (0x로 시작하는 66자리)' }, 400)
    }

    const db = c.env.DB

    await db.prepare(`
      UPDATE staking SET txid = ? WHERE id = ?
    `).bind(txidTrimmed, stakingId).run()

    return c.json({ success: true, message: 'TXID가 등록되었습니다' })
  } catch (error) {
    return c.json({ error: 'TXID 저장 중 오류가 발생했습니다' }, 500)
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
    return c.json({ error: '스테이킹 목록 조회 중 오류가 발생했습니다' }, 500)
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
      return c.json({ error: '승인 대기 중인 투자를 찾을 수 없습니다' }, 404)
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
    `).bind(staking.user_id, staking.qta_reward, `투자 보상 승인 (거치 ${periodDays}일)`).run()

    // 거래 내역 기록 (QX)
    await db.prepare(`
      INSERT INTO transactions (user_id, type, coin_type, amount, description)
      VALUES (?, 'staking_reward', 'QX', ?, ?)
    `).bind(staking.user_id, staking.qx_reward, `투자 보상 승인 (거치 ${periodDays}일)`).run()

    // 거래 내역 기록 (QKEY)
    if (qkeyReward > 0) {
      await db.prepare(`
        INSERT INTO transactions (user_id, type, coin_type, amount, description)
        VALUES (?, 'staking_reward', 'QKEY', ?, ?)
      `).bind(staking.user_id, qkeyReward, `투자 보상 승인 (거치 ${periodDays}일)`).run()
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
        `).bind(referrer.referrer_id, directBonusQkey, `직접추천수당 ($${staking.amount.toLocaleString()} 투자의 10% = ${directBonusQkey.toLocaleString()} QKEY, 1회성)`).run()

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
      message: '투자가 승인되었습니다. 코인이 지급되었습니다.',
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
    return c.json({ error: '투자 승인 중 오류가 발생했습니다' }, 500)
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
      return c.json({ error: '승인 대기 중인 스테이킹을 찾을 수 없습니다' }, 404)
    }

    // 스테이킹 상태를 rejected로 변경
    await db.prepare(`
      UPDATE staking SET status = 'rejected' WHERE id = ?
    `).bind(stakingId).run()

    return c.json({ 
      success: true, 
      message: '스테이킹이 거절되었습니다.'
    })
  } catch (error) {
    return c.json({ error: '스테이킹 거절 중 오류가 발생했습니다' }, 500)
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
    return c.json({ error: '승인 대기 목록 조회 중 오류가 발생했습니다' }, 500)
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
    return c.json({ error: '전체 목록 조회 중 오류가 발생했습니다' }, 500)
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
        u.created_at,
        COALESCE(SUM(CASE WHEN s.status = 'active' THEN s.amount ELSE 0 END), 0) as staking_amount
      FROM users u
      LEFT JOIN staking s ON u.id = s.user_id
      GROUP BY u.id, u.name, u.email, u.phone, u.wallet_address, u.usdt_wallet_address,
               u.qta_balance, u.qx_balance, u.qkey_balance, u.usdt_balance, u.created_at
      ORDER BY u.created_at DESC
    `).all()

    return c.json({ 
      success: true, 
      users: users.results 
    })
  } catch (error) {
    return c.json({ error: '사용자 목록 조회 중 오류가 발생했습니다' }, 500)
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
      return c.json({ error: '존재하지 않는 사용자입니다' }, 404)
    }

    // 진행 중인 스테이킹 확인
    const activeStaking = await db.prepare(`
      SELECT COUNT(*) as count FROM staking 
      WHERE user_id = ? AND status = 'active'
    `).bind(userId).first()

    if (activeStaking && activeStaking.count > 0) {
      return c.json({ 
        error: '진행 중인 스테이킹이 있는 사용자는 탈퇴시킬 수 없습니다',
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
      message: '사용자가 성공적으로 탈퇴 처리되었습니다',
      deletedUser: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    })
  } catch (error) {
    console.error('사용자 탈퇴 처리 오류:', error)
    return c.json({ error: '사용자 탈퇴 처리 중 오류가 발생했습니다' }, 500)
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
        message: '삭제할 사용자가 없습니다',
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
      message: `${deletedCount}명의 사용자가 삭제되었습니다`,
      deletedCount: deletedCount,
      deletedUsers: usersToDelete.results.map(u => ({ name: u.name, email: u.email })),
      keptEmails: protectedEmails
    })
  } catch (error) {
    console.error('일괄 삭제 오류:', error)
    return c.json({ error: '일괄 삭제 중 오류가 발생했습니다' }, 500)
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
    return c.json({ error: '가입 현황 조회 중 오류가 발생했습니다' }, 500)
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
        message: '활성 투자가 없거나 아직 첫 지급일이 아닙니다',
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
          `).bind(staking.user_id, qkeyAmount, `일일 배당금 ${qkeyAmount.toLocaleString()} QKEY (${(dailyRate*100).toFixed(1)}%, ${newCount}/${periodDays}일)`).run()

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
              `).bind(level1Referrer.referrer_id, level1Reward, `1대 매칭추천수당 (${qkeyAmount.toLocaleString()} QKEY의 20%)`).run()

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
                `).bind(level2Referrer.referrer_id, level2Reward, `2대 매칭추천수당 (${qkeyAmount.toLocaleString()} QKEY의 10%)`).run()
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

    let message = `${rewardedCount}명에게 일일 배당금을 지급했습니다 (총 ${totalQkeyRewarded.toLocaleString()} QKEY)`
    if (skippedCount > 0) {
      message += ` | ${skippedCount}건은 거치기간 완료`
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
    return c.json({ error: '일일 배당금 지급 중 오류가 발생했습니다' }, 500)
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
    return c.json({ error: '보상 내역 조회 중 오류가 발생했습니다' }, 500)
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
      return c.json({ error: '사용자를 찾을 수 없습니다' }, 404)
    }

    return c.json({ 
      success: true, 
      user 
    })
  } catch (error) {
    return c.json({ error: '사용자 정보 조회 중 오류가 발생했습니다' }, 500)
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
    return c.json({ error: '거래 내역 조회 중 오류가 발생했습니다' }, 500)
  }
})

// 추천인 현황 조회
app.get('/api/referrals/:userId', async (c) => {
  try {
    const userId = c.req.param('userId')
    const db = c.env.DB

    // 1단계 추천인 (직접 추천)
    const level1 = await db.prepare(`
      SELECT id, name, email, wallet_address, created_at, 
             (SELECT COUNT(*) FROM staking WHERE user_id = users.id AND status = 'active') as staking_count,
             (SELECT COALESCE(SUM(amount), 0) FROM staking WHERE user_id = users.id AND status = 'active') as total_staking
      FROM users
      WHERE referrer_id = ?
      ORDER BY created_at DESC
    `).bind(userId).all()

    // 2단계 추천인 (간접 추천)
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
        COALESCE(SUM(CASE WHEN description LIKE '%1대%' THEN amount ELSE 0 END), 0) as level1_rewards,
        COALESCE(SUM(CASE WHEN description LIKE '%2대%' THEN amount ELSE 0 END), 0) as level2_rewards
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
    return c.json({ error: '추천인 현황 조회 중 오류가 발생했습니다' }, 500)
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
          WHEN t.type = 'daily_qkey' THEN '배당금'
          WHEN t.type = 'direct_referral' THEN '직접판매'
          WHEN t.type = 'referral_reward' AND t.description LIKE '%1대%' THEN '직접판매성과금(1대)'
          WHEN t.type = 'referral_reward' AND t.description LIKE '%2대%' THEN '직접판매성과금(2대)'
          WHEN t.type = 'referral_reward' THEN '직접판매성과금'
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
        COALESCE(SUM(CASE WHEN type = 'referral_reward' AND description LIKE '%1대%' THEN amount ELSE 0 END), 0) as level1_total,
        COALESCE(SUM(CASE WHEN type = 'referral_reward' AND description LIKE '%1대%' THEN 1 ELSE 0 END), 0) as level1_count,
        COALESCE(SUM(CASE WHEN type = 'referral_reward' AND description LIKE '%2대%' THEN amount ELSE 0 END), 0) as level2_total,
        COALESCE(SUM(CASE WHEN type = 'referral_reward' AND description LIKE '%2대%' THEN 1 ELSE 0 END), 0) as level2_count,
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
    return c.json({ error: '보상 내역 조회 중 오류가 발생했습니다' }, 500)
  }
})

// ============================================
// Frontend Routes
// ============================================

// 메인 페이지 (로그인 전)
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
                <div class="text-center mb-6 sm:mb-8">
                    <img src="/static/quantarium-logo.png" alt="QUANTARIUM Logo" class="w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-4" onerror="this.style.display='none'">
                    <h1 class="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">QUANTARIUM STAKING</h1>
                    <p class="text-sm sm:text-base text-gray-600">안전한 코인 스테이킹 플랫폼</p>
                </div>

                <!-- 로그인 폼 -->
                <div id="loginForm">
                    <h2 class="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">로그인</h2>
                    <form onsubmit="handleLogin(event)">
                        <div class="mb-4">
                            <label class="block text-gray-700 text-sm font-bold mb-2">이메일</label>
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
                            <label class="block text-gray-700 text-sm font-bold mb-2">비밀번호</label>
                            <input type="password" id="loginPassword" required
                                class="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 text-sm sm:text-base">
                        </div>
                        <button type="submit" 
                            class="w-full bg-purple-600 text-white py-2 sm:py-3 rounded-lg font-bold hover:bg-purple-700 transition text-sm sm:text-base">
                            로그인
                        </button>
                    </form>
                    <div class="flex justify-center gap-4 mt-4 text-xs sm:text-sm">
                        <a href="#" onclick="showFindId()" class="text-purple-600 hover:underline">아이디 찾기</a>
                        <span class="text-gray-400">|</span>
                        <a href="#" onclick="showFindPassword()" class="text-purple-600 hover:underline">비밀번호 찾기</a>
                    </div>
                    <p class="text-center mt-4 text-sm sm:text-base text-gray-600">
                        계정이 없으신가요? 
                        <a href="#" onclick="showRegister()" class="text-purple-600 font-bold">회원가입</a>
                    </p>
                </div>

                <!-- 회원가입 폼 -->
                <div id="registerForm" class="hidden">
                    <h2 class="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">회원가입</h2>
                    <form onsubmit="handleRegister(event)">
                        <div class="mb-3 sm:mb-4">
                            <label class="block text-gray-700 text-sm font-bold mb-2">이름</label>
                            <input type="text" id="registerName" required
                                class="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 text-sm sm:text-base">
                        </div>
                        <div class="mb-3 sm:mb-4">
                            <label class="block text-gray-700 text-sm font-bold mb-2">이메일</label>
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
                            <label class="block text-gray-700 text-sm font-bold mb-2">전화번호</label>
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
                            <p class="text-xs text-gray-500 mt-1">숫자만 입력하세요 (예: 010-1234-5678)</p>
                        </div>
                        <div class="mb-3 sm:mb-4">
                            <label class="block text-gray-700 text-sm font-bold mb-2">비밀번호</label>
                            <input type="password" id="registerPassword" required
                                minlength="4"
                                placeholder="비밀번호 입력"
                                autocomplete="new-password"
                                class="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 text-sm sm:text-base">
                        </div>
                        <div class="mb-3 sm:mb-4">
                            <label class="block text-gray-700 text-sm font-bold mb-2">비밀번호 확인</label>
                            <input type="password" id="registerPasswordConfirm" required
                                minlength="4"
                                placeholder="비밀번호 재입력"
                                autocomplete="new-password"
                                class="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 text-sm sm:text-base">
                        </div>
                        <div class="mb-4 sm:mb-6">
                            <label class="block text-gray-700 text-sm font-bold mb-2">QKEY 지갑주소</label>
                            <input type="text" id="registerWallet" required
                                placeholder="0xE0c166B147a742E4FbCf5e5BCf73aCA631f14f0e"
                                class="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 text-xs sm:text-base break-all">
                            <p class="text-xs text-red-600 mt-1 font-medium">퀀타리움(QUANTARIUM) 지갑주소를 입력하십시요</p>
                        </div>
                        <div class="mb-4 sm:mb-6">
                            <label class="block text-gray-700 text-sm font-bold mb-2">USDT 지갑주소</label>
                            <input type="text" id="registerUsdtWallet" required
                                placeholder="0x..."
                                class="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 text-xs sm:text-base break-all">
                            <p class="text-xs text-red-600 mt-1 font-medium">바이낸스(BINANCE) 지갑주소를 입력하십시요</p>
                        </div>
                        <div class="mb-4 sm:mb-6">
                            <label class="block text-gray-700 text-sm font-bold mb-2">추천인 코드 (선택사항)</label>
                            <input type="text" id="registerReferralCode"
                                placeholder="QTA123456"
                                maxlength="9"
                                style="text-transform: uppercase"
                                class="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 text-sm sm:text-base">
                            <p class="text-xs text-gray-500 mt-1">추천인이 있다면 추천인 코드를 입력하세요</p>
                        </div>
                        <button type="submit" 
                            class="w-full bg-purple-600 text-white py-2 sm:py-3 rounded-lg font-bold hover:bg-purple-700 transition text-sm sm:text-base">
                            회원가입
                        </button>
                    </form>
                    <p class="text-center mt-4 text-sm sm:text-base text-gray-600">
                        이미 계정이 있으신가요? 
                        <a href="#" onclick="showLogin()" class="text-purple-600 font-bold">로그인</a>
                    </p>
                </div>

                <!-- 아이디 찾기 폼 -->
                <div id="findIdForm" class="hidden">
                    <h2 class="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">아이디 찾기</h2>
                    <form onsubmit="handleFindId(event)">
                        <div class="mb-3 sm:mb-4">
                            <label class="block text-gray-700 text-sm font-bold mb-2">이름</label>
                            <input type="text" id="findIdName" required
                                class="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 text-sm sm:text-base">
                        </div>
                        <div class="mb-4 sm:mb-6">
                            <label class="block text-gray-700 text-sm font-bold mb-2">전화번호</label>
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
                            class="w-full bg-purple-600 text-white py-2 sm:py-3 rounded-lg font-bold hover:bg-purple-700 transition text-sm sm:text-base">
                            아이디 찾기
                        </button>
                    </form>
                    <p class="text-center mt-4 text-sm sm:text-base text-gray-600">
                        <a href="#" onclick="showLogin()" class="text-purple-600 font-bold">로그인으로 돌아가기</a>
                    </p>
                </div>

                <!-- 비밀번호 찾기 폼 -->
                <div id="findPasswordForm" class="hidden">
                    <h2 class="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">비밀번호 찾기</h2>
                    <form onsubmit="handleFindPassword(event)">
                        <div class="mb-3 sm:mb-4">
                            <label class="block text-gray-700 text-sm font-bold mb-2">이메일</label>
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
                            <label class="block text-gray-700 text-sm font-bold mb-2">전화번호</label>
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
                            class="w-full bg-purple-600 text-white py-2 sm:py-3 rounded-lg font-bold hover:bg-purple-700 transition text-sm sm:text-base">
                            비밀번호 찾기
                        </button>
                    </form>
                    <p class="text-center mt-4 text-sm sm:text-base text-gray-600">
                        <a href="#" onclick="showLogin()" class="text-purple-600 font-bold">로그인으로 돌아가기</a>
                    </p>
                </div>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
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
                    alert(error.response?.data?.error || '로그인 실패');
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

                console.log('입력값:', { name, email, phone, walletAddress, usdtWalletAddress, password, passwordConfirm, referralCode });

                // 비밀번호 확인 검증
                if (password !== passwordConfirm) {
                    alert('비밀번호가 일치하지 않습니다');
                    return;
                }

                // QKEY 지갑주소 형식 검증
                if (!walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
                    alert('올바른 QKEY 지갑주소 형식이 아닙니다\\n(예: 0xE0c166B147a742E4FbCf5e5BCf73aCA631f14f0e)');
                    return;
                }

                // USDT 지갑주소 형식 검증
                if (!usdtWalletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
                    alert('올바른 USDT 지갑주소 형식이 아닙니다\\n(예: 0xE0c166B147a742E4FbCf5e5BCf73aCA631f14f0e)');
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
                        referralCode: referralCode || null
                    });
                    console.log('API 응답:', response.data);
                    
                    if (response.data.success) {
                        alert('회원가입 성공!\\n\\n내 추천인 코드: ' + response.data.referralCode + '\\n\\n로그인해주세요.');
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
                    console.error('회원가입 오류:', error);
                    alert(error.response?.data?.error || '회원가입 실패');
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
                        alert('회원님의 이메일: ' + response.data.email);
                        showLogin();
                    }
                } catch (error) {
                    alert(error.response?.data?.error || '아이디 찾기 실패');
                }
            }

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
                        alert('임시 비밀번호가 발급되었습니다: ' + response.data.tempPassword + '\\n로그인 후 비밀번호를 변경해주세요.');
                        showLogin();
                    }
                } catch (error) {
                    alert(error.response?.data?.error || '비밀번호 찾기 실패');
                }
            }
        </script>
    </body>
    </html>
  `)
})

// 대시보드
app.get('/dashboard', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>대시보드 - QUANTARIUM STAKING</title>
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
                            <button onclick="showProfileSettings()" 
                                class="flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition text-sm sm:text-base">
                                <i class="fas fa-user-cog text-lg"></i>
                                <span class="hidden sm:inline">프로필</span>
                            </button>
                            <button onclick="handleLogout()" 
                                class="flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition text-sm sm:text-base">
                                <i class="fas fa-sign-out-alt text-lg"></i>
                                <span class="hidden sm:inline">로그아웃</span>
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
                            <span class="text-xs sm:text-sm opacity-90">퀀타리움구매 → 지갑 전송수량</span>
                            <i class="fas fa-chart-line text-xl sm:text-2xl"></i>
                        </div>
                        <p class="text-2xl sm:text-3xl font-bold" id="stakingStatus">0개</p>
                        <p class="text-xs opacity-75 mt-1" id="stakingCount">진행중: 0건</p>
                    </div>
                    
                    <!-- QKEY Balance (두 번째) -->
                    <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 sm:p-6 text-white shadow-lg">
                        <div class="flex items-center justify-between mb-1 sm:mb-2">
                            <span class="text-xs sm:text-sm opacity-90">QKEY Balance</span>
                            <i class="fas fa-key text-xl sm:text-2xl"></i>
                        </div>
                        <p class="text-xl sm:text-3xl font-bold" id="usdtBalance">0</p>
                    </div>
                    
                    <!-- QTA (세 번째) -->
                    <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 sm:p-6 text-white shadow-lg">
                        <div class="flex items-center justify-between mb-1 sm:mb-2">
                            <span class="text-xs sm:text-sm opacity-90">QTA 코인</span>
                            <i class="fas fa-coins text-xl sm:text-2xl"></i>
                        </div>
                        <p class="text-xl sm:text-3xl font-bold" id="qtaBalance">0</p>
                    </div>
                    
                    <!-- QX (네 번째) -->
                    <div class="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 sm:p-6 text-white shadow-lg">
                        <div class="flex items-center justify-between mb-1 sm:mb-2">
                            <span class="text-xs sm:text-sm opacity-90">QX 코인</span>
                            <i class="fas fa-coins text-xl sm:text-2xl"></i>
                        </div>
                        <p class="text-xl sm:text-3xl font-bold" id="qxBalance">0</p>
                    </div>
                    
                    <!-- QKEY (다섯 번째 - full width on mobile) -->
                    <div class="col-span-2 sm:col-span-2 lg:col-span-1 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-4 sm:p-6 text-white shadow-lg">
                        <div class="flex items-center justify-between mb-1 sm:mb-2">
                            <span class="text-xs sm:text-sm opacity-90">QKEY 코인</span>
                            <i class="fas fa-key text-xl sm:text-2xl"></i>
                        </div>
                        <p class="text-xl sm:text-3xl font-bold" id="qkeyBalance">0</p>
                    </div>
                </div>

                <!-- Swap Section (QKEY → USDT) -->
                <div class="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
                    <h2 class="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">
                        <i class="fas fa-exchange-alt mr-2 text-green-600"></i>QKEY → USDT 스왑
                    </h2>
                    <div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                        <div class="flex items-start gap-2">
                            <i class="fas fa-info-circle text-green-600 text-lg mt-0.5"></i>
                            <div>
                                <p class="text-sm text-green-800 font-medium">보유한 QKEY를 USDT로 스왑할 수 있습니다</p>
                                <p class="text-xs text-green-700 mt-1">교환 비율: 150 QKEY = 1 USDT | 최소 100 USDT | 100 단위</p>
                            </div>
                        </div>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                        <div>
                            <label class="block text-gray-700 font-bold mb-2 text-sm">스왑 가능 QKEY 잔액</label>
                            <p class="text-2xl font-bold text-yellow-600" id="swapQkeyBalance">0</p>
                        </div>
                        <div>
                            <label class="block text-gray-700 font-bold mb-2 text-sm">스왑 수량 (USDT)</label>
                            <div class="flex gap-2">
                                <input type="number" id="swapAmount" 
                                    min="100" step="100" placeholder="최소 100, 100 단위"
                                    class="flex-1 px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 text-sm sm:text-base">
                                <button type="button" onclick="handleSwap()"
                                    class="px-4 py-2 sm:px-6 sm:py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition text-sm sm:text-base whitespace-nowrap">
                                    <i class="fas fa-exchange-alt mr-1"></i>스왑
                                </button>
                            </div>
                            <p class="text-xs text-gray-500 mt-1">100 단위로 입력 (예: 100, 200, 300...)</p>
                        </div>
                    </div>
                </div>

                <!-- Staking Section -->
                <div class="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
                    <h2 class="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">
                        <i class="fas fa-lock mr-2 text-purple-600"></i>QTA 구매 스테이킹
                    </h2>
                    <form onsubmit="handleStaking(event)" class="space-y-4">
                        <div>
                            <label class="block text-gray-700 font-bold mb-2 text-sm sm:text-base">구매 수량 ($1,000 단위로 클릭하세요)</label>
                            
                            <!-- 현재 누적 금액 표시 -->
                            <div id="accumulatedDisplay" class="mb-3 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border-2 border-purple-300 shadow-sm">
                                <div class="flex justify-between items-center mb-2">
                                    <span class="text-sm font-bold text-purple-800">현재 선택 금액</span>
                                    <button type="button" onclick="resetAmount()" 
                                        class="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg text-xs font-bold transition">
                                        <i class="fas fa-undo mr-1"></i>초기화
                                    </button>
                                </div>
                                <p class="text-3xl sm:text-4xl font-bold text-purple-700" id="accumulatedAmountText">$0</p>
                                <div class="grid grid-cols-2 gap-2 mt-3">
                                    <div class="bg-white rounded-lg p-2 text-center">
                                        <p class="text-xs text-gray-500">일일 배당률</p>
                                        <p class="text-lg font-bold text-green-600" id="autoRateDisplay">-</p>
                                    </div>
                                    <div class="bg-white rounded-lg p-2 text-center">
                                        <p class="text-xs text-gray-500">거치기간</p>
                                        <p class="text-lg font-bold text-blue-600" id="autoPeriodDisplay">-</p>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- $1,000 클릭 버튼 -->
                            <div class="mb-3">
                                <button type="button" onclick="addAmount(1000)"
                                    class="w-full border-2 border-purple-400 bg-purple-50 rounded-xl py-4 sm:py-5 text-center font-bold text-purple-700 hover:border-purple-600 hover:bg-purple-100 active:bg-purple-200 transition cursor-pointer text-lg sm:text-xl shadow-sm">
                                    <i class="fas fa-plus-circle mr-2"></i>$1,000 추가
                                </button>
                            </div>

                            <!-- 정책 안내 테이블 -->
                            <div class="mb-3 bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                                <table class="w-full text-xs sm:text-sm">
                                    <thead class="bg-gray-200">
                                        <tr>
                                            <th class="px-2 sm:px-3 py-2 text-left text-gray-700">투자금액</th>
                                            <th class="px-2 sm:px-3 py-2 text-center text-gray-700">배당률</th>
                                            <th class="px-2 sm:px-3 py-2 text-center text-gray-700">거치기간</th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-gray-200">
                                        <tr id="policyRow1" class="">
                                            <td class="px-2 sm:px-3 py-2 font-medium">$1,000 ~ $2,000</td>
                                            <td class="px-2 sm:px-3 py-2 text-center font-bold text-green-600">0.3%</td>
                                            <td class="px-2 sm:px-3 py-2 text-center font-bold text-blue-600">60일</td>
                                        </tr>
                                        <tr id="policyRow2" class="">
                                            <td class="px-2 sm:px-3 py-2 font-medium">$3,000 ~ $4,000</td>
                                            <td class="px-2 sm:px-3 py-2 text-center font-bold text-green-600">0.5%</td>
                                            <td class="px-2 sm:px-3 py-2 text-center font-bold text-blue-600">90일</td>
                                        </tr>
                                        <tr id="policyRow3" class="">
                                            <td class="px-2 sm:px-3 py-2 font-medium">$5,000 ~ $9,000</td>
                                            <td class="px-2 sm:px-3 py-2 text-center font-bold text-green-600">0.7%</td>
                                            <td class="px-2 sm:px-3 py-2 text-center font-bold text-blue-600">120일</td>
                                        </tr>
                                        <tr id="policyRow4" class="">
                                            <td class="px-2 sm:px-3 py-2 font-medium">$10,000 이상</td>
                                            <td class="px-2 sm:px-3 py-2 text-center font-bold text-green-600">1.0%</td>
                                            <td class="px-2 sm:px-3 py-2 text-center font-bold text-blue-600">180일</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <input type="hidden" id="stakingAmount" value="0">
                            <div id="rewardPreview" class="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200 hidden">
                                <p class="text-sm font-bold text-purple-800 mb-1">예상 보상 (관리자 승인 후 지급)</p>
                                <div class="flex justify-between text-sm">
                                    <span class="text-gray-600">양자내성 암호화폐 QTA :</span>
                                    <span id="qtaRewardPreview" class="font-bold text-blue-600">0개</span>
                                </div>
                                <div class="flex justify-between text-sm">
                                    <span class="text-gray-600">양자내성 코인거래소 QX :</span>
                                    <span id="qxRewardPreview" class="font-bold text-purple-600">0개</span>
                                </div>
                                <div class="flex justify-between text-sm">
                                    <span class="text-gray-600">양자암호 키코인 QKEY :</span>
                                    <span id="qkeyRewardPreview" class="font-bold text-yellow-600">0개</span>
                                </div>
                                <div class="flex justify-between text-sm mt-1 pt-1 border-t border-purple-200">
                                    <span class="text-gray-600">일일 배당률 :</span>
                                    <span id="dailyRatePreview" class="font-bold text-green-600">0%</span>
                                </div>
                                <div class="flex justify-between text-sm mt-1 pt-1 border-t border-purple-200">
                                    <span class="text-gray-600">거치기간 :</span>
                                    <span id="periodPreview" class="font-bold text-blue-600">-</span>
                                </div>
                            </div>
                        </div>

                        <!-- 회사 지갑주소 -->
                        <div class="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-3 sm:p-4 shadow-sm">
                            <div class="flex items-start gap-2 mb-2">
                                <i class="fas fa-info-circle text-blue-600 text-lg sm:text-xl mt-1"></i>
                                <div class="flex-1 min-w-0">
                                    <p class="font-bold text-gray-800 mb-1 text-sm sm:text-base">입금 안내</p>
                                    <p class="text-xs sm:text-sm text-gray-700 mb-2">아래 회사 지갑주소로 구매 수량을 입금해주세요 <br><span class="text-xs font-bold text-orange-600">⚠️ USDT(BEP-20 / BNB Chain) 기반으로 입금하세요</span></p>
                                </div>
                            </div>
                            
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <!-- 지갑주소 입력 -->
                                <div class="bg-white rounded-lg p-3 border border-blue-200 shadow-sm">
                                    <label class="block text-xs text-gray-600 mb-1 font-medium">회사 지갑주소 (QUANTARIUM)</label>
                                    <div class="flex items-center gap-2 mb-2">
                                        <input type="text" id="companyWallet" 
                                            value="0xE0c166B147a742E4FbCf5e5BCf73aCA631f14f0e" 
                                            readonly
                                            class="flex-1 min-w-0 px-2 py-2 bg-gray-50 border border-gray-300 rounded font-mono text-xs sm:text-sm truncate">
                                        <button type="button" onclick="copyCompanyWallet()" 
                                            class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded font-medium transition">
                                            <i class="fas fa-copy mr-1"></i>복사
                                        </button>
                                    </div>
                                    <button type="button" onclick="openTxidInput()" 
                                        class="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium transition">
                                        <i class="fas fa-receipt mr-1"></i>입금 확인 (TXID 입력)
                                    </button>
                                </div>

                                <!-- QR 코드 -->
                                <div class="bg-white rounded-lg p-3 border border-blue-200 shadow-sm flex flex-col items-center justify-center">
                                    <label class="block text-xs text-gray-600 mb-2 font-medium">QR 코드로 간편 입금</label>
                                    <div id="qrcode" class="bg-white p-2 rounded"></div>
                                    <p class="text-xs text-gray-500 mt-2 text-center">지갑 앱에서 QR 스캔</p>
                                </div>
                            </div>
                        </div>

                        <button type="submit" 
                            class="w-full bg-purple-600 text-white py-3 sm:py-4 rounded-lg font-bold text-base sm:text-lg hover:bg-purple-700 transition">
                            <i class="fas fa-paper-plane mr-2"></i>스테이킹 신청
                        </button>
                    </form>
                </div>

                <!-- Withdrawal Section (스테이킹 기간 종료 시 표시) -->
                <div id="withdrawalSection" class="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8" style="display: none;">
                    <h2 class="text-xl sm:text-2xl font-bold text-gray-800 mb-4">
                        <i class="fas fa-money-bill-wave mr-2 text-green-600"></i>코인 출금 신청
                    </h2>
                    <div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                        <p class="text-sm text-green-800">
                            <i class="fas fa-check-circle mr-2"></i>
                            거치기간이 종료되었습니다. 보유하신 코인을 출금 신청하실 수 있습니다.
                        </p>
                    </div>
                    
                    <div class="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        <!-- QTA 출금 -->
                        <div class="border-2 border-blue-200 rounded-lg p-3 sm:p-4 hover:border-blue-400 transition">
                            <div class="flex items-center justify-between mb-2 sm:mb-3">
                                <h3 class="font-bold text-gray-800 text-sm sm:text-base">QTA</h3>
                                <i class="fas fa-coins text-blue-600 text-lg sm:text-2xl"></i>
                            </div>
                            <p class="text-xs sm:text-sm text-gray-600 mb-1">보유량</p>
                            <p class="text-lg sm:text-2xl font-bold text-blue-600 mb-3 sm:mb-4" id="withdrawQtaBalance">0</p>
                            <button onclick="requestWithdrawal('QTA')" 
                                class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition text-xs sm:text-sm">
                                <i class="fas fa-paper-plane mr-1"></i>출금
                            </button>
                        </div>
                        
                        <!-- QX 출금 -->
                        <div class="border-2 border-purple-200 rounded-lg p-3 sm:p-4 hover:border-purple-400 transition">
                            <div class="flex items-center justify-between mb-2 sm:mb-3">
                                <h3 class="font-bold text-gray-800 text-sm sm:text-base">QX</h3>
                                <i class="fas fa-coins text-purple-600 text-lg sm:text-2xl"></i>
                            </div>
                            <p class="text-xs sm:text-sm text-gray-600 mb-1">보유량</p>
                            <p class="text-lg sm:text-2xl font-bold text-purple-600 mb-3 sm:mb-4" id="withdrawQxBalance">0</p>
                            <button onclick="requestWithdrawal('QX')" 
                                class="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg font-medium transition text-xs sm:text-sm">
                                <i class="fas fa-paper-plane mr-1"></i>출금
                            </button>
                        </div>
                        
                        <!-- QKEY 출금 -->
                        <div class="border-2 border-yellow-200 rounded-lg p-3 sm:p-4 hover:border-yellow-400 transition">
                            <div class="flex items-center justify-between mb-2 sm:mb-3">
                                <h3 class="font-bold text-gray-800 text-sm sm:text-base">QKEY</h3>
                                <i class="fas fa-key text-yellow-600 text-lg sm:text-2xl"></i>
                            </div>
                            <p class="text-xs sm:text-sm text-gray-600 mb-1">보유량</p>
                            <p class="text-lg sm:text-2xl font-bold text-yellow-600 mb-3 sm:mb-4" id="withdrawQkeyBalance">0</p>
                            <button onclick="requestWithdrawal('QKEY')" 
                                class="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-2 rounded-lg font-medium transition text-xs sm:text-sm">
                                <i class="fas fa-paper-plane mr-1"></i>출금
                            </button>
                        </div>
                        
                        <!-- USDT 출금 -->
                        <div class="border-2 border-green-200 rounded-lg p-3 sm:p-4 hover:border-green-400 transition">
                            <div class="flex items-center justify-between mb-2 sm:mb-3">
                                <h3 class="font-bold text-gray-800 text-sm sm:text-base">USDT</h3>
                                <i class="fas fa-dollar-sign text-green-600 text-lg sm:text-2xl"></i>
                            </div>
                            <p class="text-xs sm:text-sm text-gray-600 mb-1">보유량</p>
                            <p class="text-lg sm:text-2xl font-bold text-green-600 mb-3 sm:mb-4" id="withdrawUsdtBalance">0</p>
                            <button onclick="requestWithdrawal('USDT')" 
                                class="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium transition text-xs sm:text-sm">
                                <i class="fas fa-paper-plane mr-1"></i>출금
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Referral Section -->
                <div class="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
                    <h2 class="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">
                        <i class="fas fa-user-friends mr-2 text-indigo-600"></i>추천인 현황
                    </h2>
                    
                    <!-- 내 추천인 코드 -->
                    <div class="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
                        <div class="text-white">
                            <p class="text-xs sm:text-sm opacity-90 mb-2">내 추천인 코드</p>
                            <div class="flex items-center gap-2 sm:gap-3">
                                <p class="text-2xl sm:text-3xl font-bold tracking-wider" id="myReferralCode">-</p>
                                <button onclick="copyReferralCode()" 
                                    class="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg transition">
                                    <i class="fas fa-copy mr-1"></i>복사
                                </button>
                            </div>
                            <p class="text-xs opacity-75 mt-2">이 코드로 친구를 초대하고 보상을 받으세요!</p>
                        </div>
                    </div>

                    <!-- 추천 보상 통계 -->
                    <div class="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
                        <div class="bg-blue-50 rounded-lg p-3 sm:p-4 border border-blue-200">
                            <p class="text-xs sm:text-sm text-gray-600 mb-1">1단계 추천인</p>
                            <p class="text-lg sm:text-2xl font-bold text-blue-600" id="level1Count">0명</p>
                        </div>
                        <div class="bg-purple-50 rounded-lg p-3 sm:p-4 border border-purple-200">
                            <p class="text-xs sm:text-sm text-gray-600 mb-1">2단계 추천인</p>
                            <p class="text-lg sm:text-2xl font-bold text-purple-600" id="level2Count">0명</p>
                        </div>
                        <div class="bg-green-50 rounded-lg p-3 sm:p-4 border border-green-200">
                            <p class="text-xs sm:text-sm text-gray-600 mb-1">총 추천 보상</p>
                            <p class="text-lg sm:text-2xl font-bold text-green-600" id="totalRewards">0 QKEY</p>
                        </div>
                    </div>

                    <!-- 추천인 목록 탭 + 검색 -->
                    <div class="mb-4">
                        <div class="flex gap-1 sm:gap-2 border-b overflow-x-auto -mx-2 px-2">
                            <button onclick="showReferralTab('level1')" 
                                id="tab-level1"
                                class="px-3 sm:px-6 py-2 sm:py-3 font-medium text-blue-600 border-b-2 border-blue-600 whitespace-nowrap text-sm sm:text-base">
                                1단계 추천인
                            </button>
                            <button onclick="showReferralTab('level2')" 
                                id="tab-level2"
                                class="px-3 sm:px-6 py-2 sm:py-3 font-medium text-gray-500 hover:text-gray-700 whitespace-nowrap text-sm sm:text-base">
                                2단계 추천인
                            </button>
                            <button onclick="showReferralTab('rewards')" 
                                id="tab-rewards"
                                class="px-3 sm:px-6 py-2 sm:py-3 font-medium text-gray-500 hover:text-gray-700 whitespace-nowrap text-sm sm:text-base">
                                <i class="fas fa-coins mr-1"></i>보상 내역
                            </button>
                        </div>
                        <!-- 추천인 검색창 -->
                        <div id="referralSearchBox" class="mt-3">
                            <div class="relative">
                                <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                                <input type="text" id="referralSearchInput" 
                                    placeholder="이름 또는 이메일로 검색..." 
                                    oninput="filterReferralList()"
                                    class="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500">
                                <button onclick="document.getElementById('referralSearchInput').value=''; filterReferralList();" 
                                    class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- 1단계 추천인 목록 -->
                    <div id="level1-list" class="space-y-3">
                        <p class="text-gray-500 text-center py-8">로딩 중...</p>
                    </div>

                    <!-- 2단계 추천인 목록 (기본 숨김) -->
                    <div id="level2-list" class="space-y-3 hidden">
                        <p class="text-gray-500 text-center py-8">로딩 중...</p>
                    </div>

                    <!-- 보상 내역 (기본 숨김) -->
                    <div id="rewards-list" class="hidden">
                        <!-- 보상 통계 카드 (4개) -->
                        <div class="grid grid-cols-2 gap-2 sm:gap-3 mb-4">
                            <div class="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3 border border-green-300">
                                <p class="text-xs text-gray-600 mb-1"><i class="fas fa-coins mr-1 text-green-500"></i>배당금</p>
                                <p class="text-lg font-bold text-green-700" id="reward-daily-total">0 QKEY</p>
                                <p class="text-xs text-gray-500"><span id="reward-daily-count">0</span>건</p>
                            </div>
                            <div class="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-3 border border-orange-300">
                                <p class="text-xs text-gray-600 mb-1"><i class="fas fa-handshake mr-1 text-orange-500"></i>직접판매</p>
                                <p class="text-lg font-bold text-orange-700" id="reward-direct-total">0 QKEY</p>
                                <p class="text-xs text-gray-500"><span id="reward-direct-count">0</span>건</p>
                            </div>
                            <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 border border-blue-300">
                                <p class="text-xs text-gray-600 mb-1"><i class="fas fa-hand-holding-usd mr-1 text-blue-500"></i>성과금(1대)</p>
                                <p class="text-lg font-bold text-blue-700" id="reward-level1-total">0 QKEY</p>
                                <p class="text-xs text-gray-500"><span id="reward-level1-count">0</span>건</p>
                            </div>
                            <div class="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3 border border-purple-300">
                                <p class="text-xs text-gray-600 mb-1"><i class="fas fa-gifts mr-1 text-purple-500"></i>성과금(2대)</p>
                                <p class="text-lg font-bold text-purple-700" id="reward-level2-total">0 QKEY</p>
                                <p class="text-xs text-gray-500"><span id="reward-level2-count">0</span>건</p>
                            </div>
                        </div>

                        <!-- 누적 총 보상 -->
                        <div class="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg p-3 mb-4 border border-yellow-300 text-center">
                            <p class="text-xs text-gray-600 mb-1">누적 총 보상</p>
                            <p class="text-xl font-bold text-yellow-700" id="reward-grand-total">0 QKEY</p>
                        </div>

                        <!-- 보상 내역 테이블 -->
                        <div class="overflow-x-auto">
                            <table class="w-full text-xs sm:text-sm">
                                <thead class="bg-gray-100">
                                    <tr>
                                        <th class="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-700">날짜</th>
                                        <th class="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-700">구분</th>
                                        <th class="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-700">내용</th>
                                        <th class="px-2 sm:px-4 py-2 text-right text-xs font-medium text-gray-700">금액</th>
                                    </tr>
                                </thead>
                                <tbody id="rewards-table-body" class="divide-y divide-gray-200">
                                    <tr>
                                        <td colspan="4" class="px-4 py-8 text-center text-gray-500">로딩 중...</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- My Stakings -->
                <div class="bg-white rounded-xl shadow-lg p-4 sm:p-6">
                    <h2 class="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">
                        <i class="fas fa-list mr-2 text-purple-600"></i>내 스테이킹 목록
                    </h2>
                    <div id="stakingList" class="space-y-4">
                        <p class="text-gray-500 text-center py-8">로딩 중...</p>
                    </div>
                </div>
            </main>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
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
                document.getElementById('stakingStatus').textContent = totalAmount.toLocaleString() + '개';
                document.getElementById('stakingCount').textContent = \`진행중: \${activeStakings.length}건\`;
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
                            listEl.innerHTML = '<p class="text-gray-500 text-center py-8">아직 스테이킹 내역이 없습니다</p>';
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
                                statusText = '승인대기';
                            } else if (s.status === 'active' && isCompleted) {
                                statusColor = 'blue';
                                statusText = '기간종료';
                            } else if (s.status === 'active') {
                                statusColor = 'green';
                                statusText = '진행중';
                            } else if (s.status === 'rejected') {
                                statusColor = 'red';
                                statusText = '거절됨';
                            } else {
                                statusColor = 'gray';
                                statusText = '완료';
                            }

                            return \`
                                <div class="border border-gray-200 rounded-lg p-4 \${isCompleted ? 'bg-blue-50 border-blue-300' : ''}">
                                    <div class="flex justify-between items-start mb-2">
                                        <div>
                                            <p class="font-bold text-lg text-gray-800">$\${s.amount.toLocaleString()}</p>
                                            <p class="text-sm text-gray-600">\${s.period_days || (s.period_months * 30)}일 거치</p>
                                        </div>
                                        <span class="px-3 py-1 bg-\${statusColor}-100 text-\${statusColor}-700 rounded-full text-sm font-medium">
                                            \${statusText}
                                        </span>
                                    </div>
                                    \${isCompleted ? '<p class="text-sm text-blue-600 font-medium mb-2"><i class="fas fa-check-circle mr-1"></i>출금 신청이 가능합니다</p>' : ''}
                                    \${s.status === 'pending' ? '<div class="mb-2 p-2 rounded-lg ' + (s.txid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200') + '"><p class="text-xs font-medium ' + (s.txid ? 'text-green-700' : 'text-red-700') + '"><i class="fas ' + (s.txid ? 'fa-check-circle' : 'fa-exclamation-circle') + ' mr-1"></i>TXID: ' + (s.txid ? s.txid.substring(0, 20) + '...' : '미등록 - 입금 확인 버튼을 눌러 TXID를 입력하세요') + '</p></div>' : ''}
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
                                            <p class="text-gray-600">일일 배당률</p>
                                            <p class="font-bold text-green-600">\${s.daily_rate ? (s.daily_rate * 100).toFixed(1) + '%' : '-'}</p>
                                        </div>
                                        <div>
                                            <p class="text-gray-600">시작일</p>
                                            <p class="font-medium">\${startDate}</p>
                                        </div>
                                        <div>
                                            <p class="text-gray-600">종료일</p>
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
                    if (listEl) listEl.innerHTML = '<p class="text-gray-500 text-center py-8">스테이킹 내역이 없습니다</p>';
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
                    alert(\`출금 가능한 \${coinType} 잔액이 없습니다.\`);
                    return;
                }
                
                const amountStr = prompt(\`\${coinType} 출금 신청\\n\\n보유량: \${balance.toLocaleString()}\\n\\n출금하실 수량을 입력하세요:\`);
                
                if (!amountStr) return;
                
                const amount = parseFloat(amountStr.replace(/,/g, ''));
                
                if (isNaN(amount) || amount <= 0) {
                    alert('올바른 수량을 입력해주세요');
                    return;
                }
                
                if (amount > balance) {
                    alert('보유량보다 많은 수량은 출금할 수 없습니다');
                    return;
                }
                
                // USDT는 USDT 지갑주소 사용, 나머지는 QKEY 지갑주소 사용
                const withdrawWallet = (coinType === 'USDT') ? (currentUser.usdt_wallet_address || currentUser.wallet_address) : currentUser.wallet_address;
                const walletLabel = (coinType === 'USDT') ? 'USDT 지갑주소' : 'QKEY 지갑주소';
                if (confirm(\`\${coinType} \${amount.toLocaleString()}개를 출금 신청하시겠습니까?\\n\\n\${walletLabel}: \${withdrawWallet}\`)) {
                    try {
                        const response = await axios.post('/api/withdrawal/request', {
                            userId: currentUser.id,
                            coinType: coinType,
                            amount: amount,
                            walletAddress: withdrawWallet
                        });
                        
                        if (response.data.success) {
                            alert('출금 신청이 완료되었습니다!\\n\\n관리자 승인 후 처리됩니다.');
                            await loadUserInfo();
                            await updateWithdrawalBalances();
                        }
                    } catch (error) {
                        alert(error.response?.data?.error || '출금 신청 실패');
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
                    alert('지갑주소가 복사되었습니다!\\n\\n' + walletInput.value);
                }).catch(err => {
                    // fallback: execCommand 사용
                    try {
                        document.execCommand('copy');
                        alert('지갑주소가 복사되었습니다!\\n\\n' + walletInput.value);
                    } catch (e) {
                        alert('복사 실패. 수동으로 복사해주세요.');
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
                    alert('⚠️ TXID를 등록할 스테이킹 신청이 없습니다.\\n\\n먼저 스테이킹을 신청해주세요.');
                    return;
                }

                const modal = document.createElement('div');
                modal.id = 'txidModal';
                modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
                modal.innerHTML = \`
                    <div class="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-lg font-bold text-gray-800">
                                <i class="fas fa-receipt mr-2 text-green-600"></i>TXID 입력
                            </h3>
                            <button onclick="document.getElementById('txidModal').remove()" 
                                class="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
                        </div>
                        
                        <div class="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
                            <p class="text-xs text-orange-800 font-medium">
                                <i class="fas fa-exclamation-triangle mr-1"></i>
                                USDT(BEP-20 / BNB Chain) 입금 후 받은 Transaction Hash(TXID)를 입력하세요
                            </p>
                            <p class="text-xs text-orange-700 mt-1">
                                BscScan에서 거래 확인 후 TXID를 복사하세요
                            </p>
                        </div>

                        <div class="mb-4">
                            <label class="block text-sm font-bold text-gray-700 mb-2">스테이킹 신청</label>
                            <p class="text-sm text-purple-600 font-bold">$\${pendingStaking.amount.toLocaleString()} (승인대기)</p>
                        </div>

                        <div class="mb-4">
                            <label class="block text-sm font-bold text-gray-700 mb-2">Transaction Hash (TXID)</label>
                            <input type="text" id="txidInput" 
                                placeholder="0x..." 
                                class="w-full px-3 py-3 border-2 border-gray-300 rounded-lg font-mono text-xs focus:border-green-500 focus:outline-none"
                                \${pendingStaking.txid ? 'value="' + pendingStaking.txid + '"' : ''}>
                            <p class="text-xs text-gray-500 mt-1">0x로 시작하는 66자리 해시값</p>
                        </div>

                        <div class="flex gap-3">
                            <button onclick="submitTxid(\${pendingStaking.id})" 
                                class="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold transition">
                                <i class="fas fa-check mr-2"></i>TXID 등록
                            </button>
                            <button onclick="document.getElementById('txidModal').remove()" 
                                class="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-3 rounded-lg font-bold transition">
                                취소
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
                    alert('TXID를 입력해주세요');
                    return;
                }

                if (!/^0x[a-fA-F0-9]{64}$/.test(txid)) {
                    alert('⚠️ 올바른 TXID 형식이 아닙니다\\n\\n0x로 시작하는 66자리 해시값을 입력해주세요\\n\\n예시: 0x1a2b3c4d...');
                    return;
                }

                try {
                    const response = await axios.post('/api/staking/txid', {
                        stakingId: stakingId,
                        txid: txid
                    });

                    if (response.data.success) {
                        alert('✅ TXID가 성공적으로 등록되었습니다!\\n\\n관리자가 입금을 확인한 후 스테이킹이 승인됩니다.');
                        document.getElementById('txidModal').remove();
                        await loadStakings();
                    }
                } catch (error) {
                    alert(error.response?.data?.error || 'TXID 저장 중 오류가 발생했습니다');
                }
            }

            // 유저 스테이킹 목록 저장용
            let userStakings = [];

            // 금액별 정책 정보 반환
            function getPolicy(amount) {
                if (amount >= 10000) return { rate: '1.0%', rateNum: 0.01, period: 180, periodText: '180일' };
                if (amount >= 5000) return { rate: '0.7%', rateNum: 0.007, period: 120, periodText: '120일' };
                if (amount >= 3000) return { rate: '0.5%', rateNum: 0.005, period: 90, periodText: '90일' };
                return { rate: '0.3%', rateNum: 0.003, period: 60, periodText: '60일' };
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
                document.getElementById('qtaRewardPreview').textContent = qtaReward.toLocaleString() + '개';
                document.getElementById('qxRewardPreview').textContent = qxReward.toLocaleString() + '개';
                document.getElementById('qkeyRewardPreview').textContent = qkeyReward.toLocaleString() + '개';
                document.getElementById('dailyRatePreview').textContent = policy.rate;
                document.getElementById('periodPreview').textContent = policy.periodText;
                document.getElementById('rewardPreview').classList.remove('hidden');
            }

            // 스테이킹 처리
            async function handleStaking(e) {
                e.preventDefault();

                const amount = accumulatedAmount;
                
                if (!amount || amount <= 0) {
                    alert('⚠️ $1,000 추가 버튼을 클릭하여 구매 수량을 선택해주세요.');
                    return;
                }

                // 입력값 검증: $1,000 미만 체크
                if (amount < 1000) {
                    alert('⚠️ 신청 불가\\n\\n최소 구매 수량은 $1,000입니다.');
                    return;
                }
                
                const policy = getPolicy(amount);
                const qtaReward = (amount / 1000) * 150000;
                const qxReward = (amount / 1000) * 20000;
                const qkeyReward = (amount / 1000) * 5000;
                
                if (confirm('$' + amount.toLocaleString() + '을 ' + policy.periodText + '간 투자하시겠습니까?\\n\\n일일 배당률: ' + policy.rate + '\\n거치기간: ' + policy.periodText + '\\n\\n관리자 승인 후 지급:\\n• QTA ' + qtaReward.toLocaleString() + '개\\n• QX ' + qxReward.toLocaleString() + '개\\n• QKEY ' + qkeyReward.toLocaleString() + '개')) {
                    try {
                        const response = await axios.post('/api/staking/create', {
                            userId: currentUser.id,
                            amount: amount
                        });

                        if (response.data.success) {
                            alert(response.data.message || '스테이킹 신청이 완료되었습니다! 관리자 승인 후 코인이 지급됩니다.');
                            // 초기화
                            accumulatedAmount = 0;
                            updateAccumulatedDisplay();
                            await loadUserInfo();
                            await loadStakings();
                        }
                    } catch (error) {
                        alert(error.response?.data?.error || '스테이킹 실패');
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
                                <i class="fas fa-user-cog text-purple-600 mr-2"></i>프로필 설정
                            </h2>
                            <button onclick="closeProfileModal()" class="text-gray-500 hover:text-gray-700">
                                <i class="fas fa-times text-2xl"></i>
                            </button>
                        </div>
                        
                        <form id="profileForm" onsubmit="handleProfileUpdate(event)" class="space-y-4">
                            <!-- 이름 -->
                            <div>
                                <label class="block text-gray-700 font-medium mb-2">
                                    <i class="fas fa-user mr-2"></i>이름
                                </label>
                                <input type="text" id="profileName" value="\${currentUser.name}" required
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500">
                            </div>
                            
                            <!-- 이메일 (읽기 전용) -->
                            <div>
                                <label class="block text-gray-700 font-medium mb-2">
                                    <i class="fas fa-envelope mr-2"></i>이메일
                                </label>
                                <input type="email" value="\${currentUser.email}" readonly
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed">
                                <p class="text-xs text-gray-500 mt-1">이메일은 변경할 수 없습니다</p>
                            </div>
                            
                            <!-- 휴대폰 번호 -->
                            <div>
                                <label class="block text-gray-700 font-medium mb-2">
                                    <i class="fas fa-phone mr-2"></i>휴대폰 번호
                                </label>
                                <input type="tel" id="profilePhone" value="\${currentUser.phone || ''}" 
                                    pattern="010[0-9]{8}" placeholder="01012345678"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500">
                            </div>
                            
                            <!-- QKEY 지갑주소 (읽기 전용) -->
                            <div>
                                <label class="block text-gray-700 font-medium mb-2">
                                    <i class="fas fa-wallet mr-2"></i>지갑주소 (QKEY)
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
                                    지갑주소 변경은 관리자에게 문의하세요
                                </p>
                            </div>
                            
                            <!-- USDT 지갑주소 (읽기 전용) -->
                            <div>
                                <label class="block text-gray-700 font-medium mb-2">
                                    <i class="fas fa-wallet mr-2"></i>지갑주소 (USDT)
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
                                    바이낸스(BINANCE) USDT 지갑주소
                                </p>
                            </div>
                            
                            <!-- 비밀번호 변경 -->
                            <div class="border-t pt-4">
                                <label class="block text-gray-700 font-medium mb-2">
                                    <i class="fas fa-lock mr-2"></i>비밀번호 변경 (선택사항)
                                </label>
                                <input type="password" id="profilePassword" placeholder="새 비밀번호 (변경 시에만 입력)"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 mb-2">
                                <input type="password" id="profilePasswordConfirm" placeholder="새 비밀번호 확인"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500">
                            </div>
                            
                            <!-- 버튼 -->
                            <div class="flex gap-3 pt-4">
                                <button type="button" onclick="closeProfileModal()" 
                                    class="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">
                                    취소
                                </button>
                                <button type="submit" 
                                    class="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium">
                                    저장
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
                alert('⚠️ 지갑주소 변경 안내\\n\\n지갑주소는 보안상의 이유로 직접 변경하실 수 없습니다.\\n\\n지갑주소 변경이 필요하신 경우 관리자에게 문의해주시기 바랍니다.\\n\\n📞 관리자 문의: admin@quantarium.com');
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
                    alert('비밀번호가 일치하지 않습니다');
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
                        alert('프로필이 업데이트되었습니다');
                        
                        // 로컬스토리지 업데이트
                        currentUser.name = name;
                        currentUser.phone = phone;
                        localStorage.setItem('user', JSON.stringify(currentUser));
                        
                        // UI 업데이트
                        document.getElementById('userName').textContent = name + '님';
                        
                        closeProfileModal();
                    }
                } catch (error) {
                    alert(error.response?.data?.error || '프로필 업데이트 실패');
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
                        document.getElementById('level1Count').textContent = stats.level1Count + '명';
                        document.getElementById('level2Count').textContent = stats.level2Count + '명';
                        document.getElementById('totalRewards').textContent = Math.round(stats.totalRewards).toLocaleString() + ' QKEY';
                        
                        // 1단계 / 2단계 추천인 목록 렌더링
                        renderLevel1List(level1);
                        renderLevel2List(level2);
                    }
                } catch (error) {
                    console.error('Failed to load referrals:', error);
                    var l1 = document.getElementById('level1-list');
                    var l2 = document.getElementById('level2-list');
                    if (l1) l1.innerHTML = '<div class="text-center py-8 text-gray-500"><i class="fas fa-users text-4xl mb-3 opacity-50"></i><p>추천인이 없습니다</p></div>';
                    if (l2) l2.innerHTML = '<div class="text-center py-8 text-gray-500"><i class="fas fa-users text-4xl mb-3 opacity-50"></i><p>추천인이 없습니다</p></div>';
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
                var walletShort = wallet ? (wallet.substring(0, 8) + '...' + wallet.substring(wallet.length - 6)) : '미등록';
                var staking = Number(user.total_staking || 0);
                return '<div class="bg-' + color + '-50 border border-' + color + '-200 rounded-lg p-3 sm:p-4">' +
                    '<div class="flex justify-between items-start mb-2">' +
                        '<div>' +
                            '<p class="font-bold text-gray-800 text-sm sm:text-base">' + user.name + '</p>' +
                            '<p class="text-xs text-gray-500">가입: ' + new Date(user.created_at).toLocaleDateString('ko-KR') + '</p>' +
                        '</div>' +
                        '<div class="text-right">' +
                            '<p class="text-xs text-gray-500">진입금액</p>' +
                            '<p class="text-sm sm:text-base font-bold text-' + color + '-600">$' + staking.toLocaleString() + '</p>' +
                        '</div>' +
                    '</div>' +
                    '<div class="flex items-center gap-2 bg-white rounded-lg p-2 border border-gray-200">' +
                        '<i class="fas fa-wallet text-' + color + '-400 text-xs"></i>' +
                        '<span class="text-xs font-mono text-gray-600 flex-1 truncate" title="' + wallet + '">' + walletShort + '</span>' +
                        (wallet ? '<button data-wallet="' + wallet + '" onclick="copyWallet(this.getAttribute(&apos;data-wallet&apos;))" class="px-2 py-1 bg-' + color + '-100 hover:bg-' + color + '-200 text-' + color + '-700 rounded text-xs font-medium transition whitespace-nowrap"><i class="fas fa-copy mr-1"></i>복사</button>' : '') +
                    '</div>' +
                '</div>';
            }

            function renderLevel1List(list) {
                var el = document.getElementById('level1-list');
                if (list.length === 0) {
                    var q = document.getElementById('referralSearchInput').value;
                    el.innerHTML = '<div class="text-center py-8 text-gray-500">' +
                        '<i class="fas fa-' + (q ? 'search' : 'users') + ' text-4xl mb-3 opacity-50"></i>' +
                        '<p>' + (q ? '검색 결과가 없습니다' : '아직 1단계 추천인이 없습니다') + '</p></div>';
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
                        '<p>' + (q ? '검색 결과가 없습니다' : '아직 2단계 추천인이 없습니다') + '</p></div>';
                } else {
                    el.innerHTML = list.map(function(user) { return renderReferralCard(user, 'purple'); }).join('');
                }
            }

            function copyWallet(address) {
                navigator.clipboard.writeText(address).then(function() {
                    alert('✅ 지갑주소가 복사되었습니다!\\n\\n' + address);
                }).catch(function() {
                    prompt('지갑주소를 복사하세요:', address);
                });
            }

            // 추천인 코드 복사
            function copyReferralCode() {
                const code = document.getElementById('myReferralCode').textContent;
                if (code && code !== '-') {
                    navigator.clipboard.writeText(code).then(() => {
                        alert('추천인 코드가 복사되었습니다!');
                    }).catch(() => {
                        alert('복사에 실패했습니다. 다시 시도해주세요.');
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
                                '<p>아직 받은 보상이 없습니다</p>' +
                                '</td></tr>';
                        } else {
                            tableBody.innerHTML = rewards.map(function(reward) {
                                var badgeClass = '';
                                var badgeText = reward.reward_category || reward.type;
                                var amountColor = '';
                                
                                if (reward.type === 'daily_qkey') {
                                    badgeClass = 'bg-green-100 text-green-700';
                                    badgeText = '배당금';
                                    amountColor = 'text-green-600';
                                } else if (reward.type === 'direct_referral') {
                                    badgeClass = 'bg-orange-100 text-orange-700';
                                    badgeText = '직접판매';
                                    amountColor = 'text-orange-600';
                                } else if (reward.type === 'referral_reward') {
                                    if (reward.description && reward.description.indexOf('1대') >= 0) {
                                        badgeClass = 'bg-blue-100 text-blue-700';
                                        badgeText = '성과금(1대)';
                                        amountColor = 'text-blue-600';
                                    } else {
                                        badgeClass = 'bg-purple-100 text-purple-700';
                                        badgeText = '성과금(2대)';
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
                        '<tr><td colspan="4" class="px-4 py-8 text-center text-red-500">보상 내역을 불러오는데 실패했습니다</td></tr>';
                }
            }

            // QKEY → USDT 스왑
            async function handleSwap() {
                const amountInput = document.getElementById('swapAmount');
                const amount = parseInt(amountInput.value);

                if (!amount || isNaN(amount)) {
                    alert('스왑 수량을 입력해주세요');
                    return;
                }

                if (amount < 100) {
                    alert('⚠️ 최소 스왑 수량은 100 USDT입니다\\n\\n입력하신 수량: ' + amount);
                    return;
                }

                if (amount % 100 !== 0) {
                    alert('⚠️ 스왑 수량은 100 단위로만 가능합니다\\n\\n입력하신 수량: ' + amount + '\\n\\n올바른 예시: 100, 200, 300, 400...');
                    return;
                }

                const qkeyBalance = parseInt((document.getElementById('swapQkeyBalance').textContent || '0').replace(/,/g, ''));
                var requiredQkey = amount * 150;
                if (requiredQkey > qkeyBalance) {
                    alert('⚠️ QKEY 잔액이 부족합니다\\n\\n보유 QKEY: ' + qkeyBalance.toLocaleString() + '\\n필요 QKEY: ' + requiredQkey.toLocaleString() + ' (150 QKEY × ' + amount + ' USDT)');
                    return;
                }

                if (!confirm(requiredQkey.toLocaleString() + ' QKEY를 ' + amount.toLocaleString() + ' USDT로 스왑하시겠습니까?\\n\\n교환 비율: 150 QKEY = 1 USDT')) {
                    return;
                }

                try {
                    const response = await axios.post('/api/swap/qkey-to-usdt', {
                        userId: currentUser.id,
                        amount: amount
                    });

                    if (response.data.success) {
                        alert('✅ 스왑 완료!\\n\\n' + requiredQkey.toLocaleString() + ' QKEY → ' + amount.toLocaleString() + ' USDT');
                        amountInput.value = '';
                        await loadUserInfo();
                    }
                } catch (error) {
                    alert(error.response?.data?.error || '스왑 처리 중 오류가 발생했습니다');
                }
            }

            // 로그아웃
            function handleLogout() {
                localStorage.removeItem('user');
                window.location.href = '/';
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
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>관리자 로그인 - QUANTARIUM STAKING</title>
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
            <div class="text-center mb-8">
                <img src="/static/quantarium-logo.png" alt="QUANTARIUM Logo" class="w-24 h-24 mx-auto mb-4" onerror="this.style.display='none'">
                <h1 class="text-3xl font-bold text-gray-800 mb-2">관리자 로그인</h1>
                <p class="text-gray-600">QUANTARIUM STAKING 관리자 페이지</p>
            </div>

            <form id="adminLoginForm" onsubmit="handleAdminLogin(event)" class="space-y-4">
                <div>
                    <label class="block text-gray-700 font-medium mb-2">관리자 ID</label>
                    <input type="text" id="adminId" required 
                        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                        placeholder="관리자 ID를 입력하세요">
                </div>

                <div>
                    <label class="block text-gray-700 font-medium mb-2">비밀번호</label>
                    <input type="password" id="adminPassword" required 
                        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                        placeholder="비밀번호를 입력하세요">
                </div>

                <button type="submit" 
                    class="w-full bg-purple-600 text-white py-3 rounded-lg font-bold hover:bg-purple-700 transition duration-200">
                    <i class="fas fa-sign-in-alt mr-2"></i>로그인
                </button>
            </form>

            <div class="mt-6 text-center">
                <a href="/" class="text-purple-600 hover:text-purple-700">
                    <i class="fas fa-arrow-left mr-1"></i>사용자 페이지로 돌아가기
                </a>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
            async function handleAdminLogin(e) {
                e.preventDefault();
                
                const adminId = document.getElementById('adminId').value;
                const password = document.getElementById('adminPassword').value;

                // 간단한 관리자 인증 (실제로는 서버에서 검증해야 함)
                if (adminId === 'admin' && password === 'admin1234') {
                    localStorage.setItem('admin', JSON.stringify({ id: 'admin', role: 'admin' }));
                    window.location.href = '/admin/dashboard';
                } else {
                    alert('관리자 ID 또는 비밀번호가 일치하지 않습니다.');
                }
            }
        </script>
    </body>
    </html>
  `)
})

// 관리자 대시보드
app.get('/admin/dashboard', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>관리자 대시보드 - QUANTARIUM STAKING</title>
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
                                <p class="text-xs sm:text-sm text-gray-600">관리자 대시보드</p>
                            </div>
                        </div>
                        <button onclick="handleLogout()" class="text-red-600 hover:text-red-700 flex-shrink-0 text-sm sm:text-base">
                            <i class="fas fa-sign-out-alt mr-1"></i><span class="hidden sm:inline">로그아웃</span>
                        </button>
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
                                <p class="text-gray-600 text-xs sm:text-sm">승인 대기</p>
                                <p id="pendingCount" class="text-2xl sm:text-3xl font-bold text-yellow-600">0</p>
                            </div>
                            <i class="fas fa-clock text-2xl sm:text-4xl text-yellow-600 opacity-20"></i>
                        </div>
                    </div>

                    <div class="bg-white rounded-lg shadow-md p-3 sm:p-6">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-gray-600 text-xs sm:text-sm">진행 중</p>
                                <p id="activeCount" class="text-2xl sm:text-3xl font-bold text-green-600">0</p>
                            </div>
                            <i class="fas fa-check-circle text-2xl sm:text-4xl text-green-600 opacity-20"></i>
                        </div>
                    </div>

                    <div class="bg-white rounded-lg shadow-md p-3 sm:p-6">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-gray-600 text-xs sm:text-sm">거절됨</p>
                                <p id="rejectedCount" class="text-2xl sm:text-3xl font-bold text-red-600">0</p>
                            </div>
                            <i class="fas fa-times-circle text-2xl sm:text-4xl text-red-600 opacity-20"></i>
                        </div>
                    </div>

                    <div class="bg-white rounded-lg shadow-md p-3 sm:p-6">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-gray-600 text-xs sm:text-sm">총 사용자</p>
                                <p id="totalUsers" class="text-2xl sm:text-3xl font-bold text-purple-600">0</p>
                            </div>
                            <i class="fas fa-users text-2xl sm:text-4xl text-purple-600 opacity-20"></i>
                        </div>
                    </div>

                    <div class="col-span-2 sm:col-span-1 bg-white rounded-lg shadow-md p-3 sm:p-6">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-gray-600 text-xs sm:text-sm">신규 가입</p>
                                <p id="newUsersToday" class="text-2xl sm:text-3xl font-bold text-blue-600">0</p>
                                <p class="text-xs text-gray-500 mt-1">오늘</p>
                            </div>
                            <i class="fas fa-user-plus text-2xl sm:text-4xl text-blue-600 opacity-20"></i>
                        </div>
                    </div>
                </div>

                <!-- 탭 메뉴 -->
                <div class="bg-white rounded-lg shadow-md mb-4 sm:mb-6">
                    <div class="flex border-b overflow-x-auto -webkit-overflow-scrolling-touch">
                        <button onclick="showTab('pending')" id="tab-pending" 
                            class="px-3 sm:px-6 py-3 sm:py-4 font-medium text-purple-600 border-b-2 border-purple-600 whitespace-nowrap text-xs sm:text-base">
                            <i class="fas fa-clock mr-1 sm:mr-2"></i>승인 대기
                        </button>
                        <button onclick="showTab('all')" id="tab-all" 
                            class="px-3 sm:px-6 py-3 sm:py-4 font-medium text-gray-600 hover:text-purple-600 whitespace-nowrap text-xs sm:text-base">
                            <i class="fas fa-list mr-1 sm:mr-2"></i>전체 목록
                        </button>
                        <button onclick="showTab('users')" id="tab-users" 
                            class="px-3 sm:px-6 py-3 sm:py-4 font-medium text-gray-600 hover:text-purple-600 whitespace-nowrap text-xs sm:text-base">
                            <i class="fas fa-users mr-1 sm:mr-2"></i>사용자
                        </button>
                        <button onclick="showTab('signups')" id="tab-signups" 
                            class="px-3 sm:px-6 py-3 sm:py-4 font-medium text-gray-600 hover:text-purple-600 whitespace-nowrap text-xs sm:text-base">
                            <i class="fas fa-user-plus mr-1 sm:mr-2"></i>가입
                        </button>
                    </div>
                </div>

                <!-- 승인 대기 목록 -->
                <div id="content-pending" class="bg-white rounded-lg shadow-md p-6">
                    <h2 class="text-xl font-bold text-gray-800 mb-4">
                        <i class="fas fa-clock text-yellow-600 mr-2"></i>승인 대기 중인 스테이킹
                    </h2>
                    <div id="pendingList" class="space-y-4">
                        <p class="text-center text-gray-500 py-8">로딩 중...</p>
                    </div>
                </div>

                <!-- 전체 목록 (숨김) -->
                <div id="content-all" class="bg-white rounded-lg shadow-md p-6 hidden">
                    <h2 class="text-xl font-bold text-gray-800 mb-4">
                        <i class="fas fa-list text-purple-600 mr-2"></i>전체 스테이킹 목록
                    </h2>
                    <div id="allList" class="space-y-4">
                        <p class="text-center text-gray-500 py-8">로딩 중...</p>
                    </div>
                </div>

                <!-- 사용자 관리 (숨김) -->
                <div id="content-users" class="bg-white rounded-lg shadow-md p-6 hidden">
                    <h2 class="text-xl font-bold text-gray-800 mb-4">
                        <i class="fas fa-users text-purple-600 mr-2"></i>사용자 목록
                    </h2>
                    <div id="usersList" class="space-y-4">
                        <p class="text-center text-gray-500 py-8">로딩 중...</p>
                    </div>
                </div>

                <!-- 가입 현황 (숨김) -->
                <div id="content-signups" class="bg-white rounded-lg shadow-md p-6 hidden">
                    <h2 class="text-xl font-bold text-gray-800 mb-4">
                        <i class="fas fa-user-plus text-blue-600 mr-2"></i>회원가입 현황
                    </h2>
                    <div class="grid grid-cols-3 gap-2 sm:gap-6 mb-4 sm:mb-6">
                        <div class="bg-blue-50 rounded-lg p-3 sm:p-4 border border-blue-200">
                            <p class="text-xs sm:text-sm text-gray-600 mb-1">오늘</p>
                            <p id="signupsToday" class="text-lg sm:text-2xl font-bold text-blue-600">0명</p>
                        </div>
                        <div class="bg-green-50 rounded-lg p-3 sm:p-4 border border-green-200">
                            <p class="text-xs sm:text-sm text-gray-600 mb-1">이번 주</p>
                            <p id="signupsWeek" class="text-lg sm:text-2xl font-bold text-green-600">0명</p>
                        </div>
                        <div class="bg-purple-50 rounded-lg p-3 sm:p-4 border border-purple-200">
                            <p class="text-xs sm:text-sm text-gray-600 mb-1">이번 달</p>
                            <p id="signupsMonth" class="text-lg sm:text-2xl font-bold text-purple-600">0명</p>
                        </div>
                    </div>
                    <div id="signupsList" class="space-y-4">
                        <p class="text-center text-gray-500 py-8">로딩 중...</p>
                    </div>
                </div>
            </main>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
            // 관리자 인증 확인
            const admin = JSON.parse(localStorage.getItem('admin') || 'null');
            if (!admin) {
                window.location.href = '/admin';
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
                document.getElementById('content-pending').classList.add('hidden');
                document.getElementById('content-all').classList.add('hidden');
                document.getElementById('content-users').classList.add('hidden');
                document.getElementById('content-signups').classList.add('hidden');
                document.getElementById(\`content-\${tab}\`).classList.remove('hidden');

                // 데이터 로드
                if (tab === 'pending') {
                    loadPendingStakings();
                } else if (tab === 'all') {
                    loadAllStakings();
                } else if (tab === 'users') {
                    loadUsers();
                } else if (tab === 'signups') {
                    loadSignups();
                }
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
                    console.error('통계 로드 실패:', error);
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
                        listEl.innerHTML = '<p class="text-center text-gray-500 py-8">승인 대기 중인 스테이킹이 없습니다</p>';
                        return;
                    }

                    listEl.innerHTML = stakings.map(s => \`
                        <div class="border border-yellow-200 bg-yellow-50 rounded-lg p-6">
                            <div class="flex justify-between items-start mb-4">
                                <div class="flex-1">
                                    <div class="flex items-center gap-2 mb-2">
                                        <span class="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                                            <i class="fas fa-clock mr-1"></i>승인대기
                                        </span>
                                        <span class="text-xs text-gray-500">\${new Date(s.created_at).toLocaleString('ko-KR')}</span>
                                    </div>
                                    <h3 class="text-xl font-bold text-gray-800 mb-1">\${s.name}</h3>
                                    <p class="text-sm text-gray-600"><i class="fas fa-envelope mr-1"></i>\${s.email}</p>
                                    <p class="text-xs sm:text-sm text-gray-600 font-mono truncate"><i class="fas fa-wallet mr-1"></i>\${s.wallet_address}</p>
                                </div>
                            </div>

                            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 mb-3 sm:mb-4 p-3 sm:p-4 bg-white rounded-lg">
                                <div>
                                    <p class="text-xs text-gray-600 mb-1">투자금액</p>
                                    <p class="font-bold text-purple-600">$\${s.amount.toLocaleString()}</p>
                                </div>
                                <div>
                                    <p class="text-xs text-gray-600 mb-1">거치기간</p>
                                    <p class="font-bold text-gray-800">\${s.period_days || (s.period_months * 30)}일</p>
                                </div>
                                <div>
                                    <p class="text-xs text-gray-600 mb-1">일일 배당률</p>
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
                                            : '<p class="text-xs text-red-700">미등록 - 사용자가 아직 TXID를 입력하지 않음</p>'
                                        }
                                    </div>
                                    \${s.txid ? '<a href="https://bscscan.com/tx/' + s.txid + '" target="_blank" class="ml-2 px-3 py-1 bg-green-600 text-white rounded text-xs font-bold hover:bg-green-700 whitespace-nowrap"><i class=\\"fas fa-external-link-alt mr-1\\"></i>BscScan</a>' : ''}
                                </div>
                            </div>

                            <div class="flex gap-3">
                                <button onclick="approveStaking(\${s.id})" 
                                    class="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold transition duration-200">
                                    <i class="fas fa-check mr-2"></i>승인
                                </button>
                                <button onclick="rejectStaking(\${s.id})" 
                                    class="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-bold transition duration-200">
                                    <i class="fas fa-times mr-2"></i>거절
                                </button>
                            </div>
                        </div>
                    \`).join('');
                } catch (error) {
                    console.error('승인 대기 목록 로드 실패:', error);
                    console.error('Error details:', error.response);
                    const listEl = document.getElementById('pendingList');
                    if (listEl) {
                        listEl.innerHTML = '<p class="text-center text-red-500 py-8">목록을 불러오는데 실패했습니다</p>';
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
                        listEl.innerHTML = '<p class="text-center text-gray-500 py-8">스테이킹 내역이 없습니다</p>';
                        return;
                    }

                    listEl.innerHTML = stakings.map(s => {
                        let statusColor, statusText, statusIcon;
                        if (s.status === 'pending') {
                            statusColor = 'yellow';
                            statusText = '승인대기';
                            statusIcon = 'clock';
                        } else if (s.status === 'active') {
                            statusColor = 'green';
                            statusText = '진행중';
                            statusIcon = 'check-circle';
                        } else if (s.status === 'rejected') {
                            statusColor = 'red';
                            statusText = '거절됨';
                            statusIcon = 'times-circle';
                        } else {
                            statusColor = 'gray';
                            statusText = '완료';
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
                                            <span class="text-xs text-gray-500">\${new Date(s.created_at).toLocaleString('ko-KR')}</span>
                                        </div>
                                        <h3 class="text-lg font-bold text-gray-800">\${s.name}</h3>
                                        <p class="text-sm text-gray-600">\${s.email}</p>
                                    </div>
                                </div>

                                <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 sm:gap-3 text-sm">
                                    <div>
                                        <p class="text-gray-600">투자금액</p>
                                        <p class="font-bold">$\${s.amount.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p class="text-gray-600">거치기간</p>
                                        <p class="font-bold">\${s.period_days || (s.period_months * 30)}일</p>
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
                                        <p class="text-gray-600">종료일</p>
                                        <p class="font-bold">\${new Date(s.end_date).toLocaleDateString('ko-KR')}</p>
                                    </div>
                                </div>
                                <div class="mt-2 pt-2 border-t border-gray-200">
                                    <p class="text-xs \${s.txid ? 'text-green-700' : 'text-gray-400'}">
                                        <i class="fas \${s.txid ? 'fa-check-circle text-green-600' : 'fa-minus-circle'} mr-1"></i>
                                        TXID: \${s.txid ? '<a href="https://bscscan.com/tx/' + s.txid + '" target="_blank" class="font-mono hover:underline">' + s.txid.substring(0, 30) + '...</a>' : '미등록'}
                                    </p>
                                </div>
                            </div>
                        \`;
                    }).join('');
                } catch (error) {
                    console.error('전체 목록 로드 실패:', error);
                }
            }

            // 사용자 목록 로드
            async function loadUsers() {
                try {
                    const response = await axios.get('/api/admin/users');
                    const users = response.data.users || [];
                    const listEl = document.getElementById('usersList');

                    if (users.length === 0) {
                        listEl.innerHTML = '<p class="text-center text-gray-500 py-8">사용자가 없습니다</p>';
                        return;
                    }

                    listEl.innerHTML = users.map(u => \`
                        <div class="border border-gray-200 rounded-lg p-6">
                            <div class="flex justify-between items-start">
                                <div class="flex-1">
                                    <h3 class="text-lg font-bold text-gray-800 mb-1">\${u.name}</h3>
                                    <p class="text-sm text-gray-600 mb-1"><i class="fas fa-envelope mr-1"></i>\${u.email}</p>
                                    <p class="text-sm text-gray-600 mb-1"><i class="fas fa-phone mr-1"></i>\${u.phone || 'N/A'}</p>
                                    <div class="flex items-center gap-1 sm:gap-2 min-w-0 mb-1">
                                        <p class="text-xs text-gray-500 font-mono truncate"><i class="fas fa-wallet mr-1"></i><span class="text-purple-600 font-semibold">QKEY</span> \${u.wallet_address}</p>
                                        <button onclick="copyWalletAddress('\${u.wallet_address}')" 
                                            class="flex-shrink-0 px-2 py-1 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded text-xs transition duration-200"
                                            title="QKEY 지갑주소 복사">
                                            <i class="fas fa-copy"></i>
                                        </button>
                                    </div>
                                    <div class="flex items-center gap-1 sm:gap-2 min-w-0">
                                        <p class="text-xs text-gray-500 font-mono truncate"><i class="fas fa-wallet mr-1"></i><span class="text-green-600 font-semibold">USDT</span> \${u.usdt_wallet_address || 'N/A'}</p>
                                        \${u.usdt_wallet_address ? \`<button onclick="copyWalletAddress('\${u.usdt_wallet_address}')" 
                                            class="flex-shrink-0 px-2 py-1 bg-green-100 hover:bg-green-200 text-green-700 rounded text-xs transition duration-200"
                                            title="USDT 지갑주소 복사">
                                            <i class="fas fa-copy"></i>
                                        </button>\` : ''}
                                    </div>
                                </div>
                                <div class="text-right">
                                    <p class="text-xs text-gray-600 mb-1">가입일</p>
                                    <p class="text-sm font-medium">\${new Date(u.created_at).toLocaleDateString('ko-KR')}</p>
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
                                    <p class="text-xs text-gray-600 mb-1">투자금액</p>
                                    <p class="font-bold text-orange-600 text-sm">$\${u.staking_amount.toLocaleString()}</p>
                                </div>
                            </div>

                            <div class="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t flex justify-end">
                                <button onclick="deleteUser(\${u.id}, '\${u.name}', '\${u.email}', \${u.staking_amount})" 
                                    class="px-3 sm:px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition duration-200 text-xs sm:text-sm">
                                    <i class="fas fa-user-times mr-1 sm:mr-2"></i>강제 탈퇴
                                </button>
                            </div>
                        </div>
                    \`).join('');
                } catch (error) {
                    console.error('사용자 목록 로드 실패:', error);
                }
            }

            // 가입 현황 로드
            async function loadSignups() {
                try {
                    const response = await axios.get('/api/admin/signups');
                    const data = response.data;
                    
                    // 통계 업데이트
                    document.getElementById('signupsToday').textContent = data.today + '명';
                    document.getElementById('signupsWeek').textContent = data.week + '명';
                    document.getElementById('signupsMonth').textContent = data.month + '명';
                    
                    const users = data.users || [];
                    const listEl = document.getElementById('signupsList');

                    if (users.length === 0) {
                        listEl.innerHTML = '<p class="text-center text-gray-500 py-8">가입 회원이 없습니다</p>';
                        return;
                    }

                    listEl.innerHTML = users.map(u => \`
                        <div class="border border-gray-200 rounded-lg p-6">
                            <div class="flex justify-between items-start">
                                <div class="flex-1">
                                    <h3 class="text-lg font-bold text-gray-800 mb-1">\${u.name}</h3>
                                    <p class="text-sm text-gray-600 mb-1"><i class="fas fa-envelope mr-1"></i>\${u.email}</p>
                                    <p class="text-sm text-gray-600 mb-1"><i class="fas fa-phone mr-1"></i>\${u.phone || 'N/A'}</p>
                                    <p class="text-xs text-gray-500 font-mono truncate"><i class="fas fa-wallet mr-1"></i><span class="text-purple-600 font-semibold">QKEY</span> \${u.wallet_address}</p>
                                    <p class="text-xs text-gray-500 font-mono truncate"><i class="fas fa-wallet mr-1"></i><span class="text-green-600 font-semibold">USDT</span> \${u.usdt_wallet_address || 'N/A'}</p>
                                </div>
                                <div class="text-right">
                                    <p class="text-xs text-gray-600 mb-1">가입일</p>
                                    <p class="text-sm font-medium">\${new Date(u.created_at).toLocaleDateString('ko-KR', { 
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
                    console.error('가입 현황 로드 실패:', error);
                }
            }

            // 지갑주소 복사
            function copyWalletAddress(address) {
                // Clipboard API 사용 (최신 브라우저)
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(address).then(() => {
                        alert('지갑주소가 복사되었습니다!\\n\\n' + address);
                    }).catch(err => {
                        console.error('복사 실패:', err);
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
                    alert('지갑주소가 복사되었습니다!\\n\\n' + text);
                } catch (err) {
                    alert('복사에 실패했습니다. 수동으로 복사해주세요.');
                }
                
                document.body.removeChild(textarea);
            }

            // 일일 보상 지급 실행
            // 사용자 강제 탈퇴
            async function deleteUser(userId, userName, userEmail, stakingAmount) {
                // 진행 중인 스테이킹이 있는지 확인
                if (stakingAmount > 0) {
                    alert('진행 중인 스테이킹이 있는 사용자는 탈퇴시킬 수 없습니다.\\n\\n' + 
                          '사용자: ' + userName + '\\n' +
                          '이메일: ' + userEmail + '\\n' +
                          '스테이킹 수량: ' + stakingAmount.toLocaleString() + '개');
                    return;
                }

                if (!confirm('정말로 이 사용자를 강제 탈퇴시키겠습니까?\\n\\n' + 
                             '사용자: ' + userName + '\\n' +
                             '이메일: ' + userEmail + '\\n\\n' +
                             '이 작업은 되돌릴 수 없습니다!')) {
                    return;
                }

                // 두 번째 확인
                if (!confirm('마지막 확인입니다.\\n\\n사용자의 모든 데이터(스테이킹 내역, 거래 내역, 보상 내역 등)가 영구적으로 삭제됩니다.\\n\\n계속하시겠습니까?')) {
                    return;
                }

                try {
                    const response = await axios.delete('/api/admin/user/' + userId);
                    if (response.data.success) {
                        alert('사용자가 성공적으로 탈퇴 처리되었습니다.\\n\\n' +
                              '이름: ' + response.data.deletedUser.name + '\\n' +
                              '이메일: ' + response.data.deletedUser.email);
                        await loadUsers();
                        await loadSignups();
                    }
                } catch (error) {
                    console.error('사용자 탈퇴 처리 실패:', error);
                    if (error.response && error.response.data && error.response.data.error) {
                        alert('탈퇴 처리 실패: ' + error.response.data.error + 
                              (error.response.data.activeStakingCount ? 
                               '\\n진행 중인 스테이킹: ' + error.response.data.activeStakingCount + '건' : ''));
                    } else {
                        alert('사용자 탈퇴 처리 중 오류가 발생했습니다.');
                    }
                }
            }

            // 스테이킹 승인
            async function approveStaking(stakingId) {
                if (!confirm('이 스테이킹을 승인하시겠습니까? 코인이 즉시 지급됩니다.')) {
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
                    alert(error.response?.data?.error || '승인 실패');
                }
            }

            // 스테이킹 거절
            async function rejectStaking(stakingId) {
                if (!confirm('이 스테이킹을 거절하시겠습니까?')) {
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
                    alert(error.response?.data?.error || '거절 실패');
                }
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
