// Cloudflare Workers Cron Trigger
// 매일 오전 9시(KST) = 매일 오전 0시(UTC)에 실행
// pqcpay.co.kr/api/rewards/daily 호출 (관리자 토큰 인증)

export default {
  async scheduled(event, env, ctx) {
    try {
      const apiBase = env.API_BASE_URL || 'https://pqcpay.co.kr'
      const adminId = env.ADMIN_ID
      const adminPw = env.ADMIN_PW

      console.log('[CRON] Starting daily QKEY rewards distribution at', new Date().toISOString())

      if (!adminId || !adminPw) {
        console.error('[CRON] ADMIN_ID/ADMIN_PW secret not set – aborting')
        return
      }

      // 1) 관리자 로그인 → 토큰 발급
      const loginRes = await fetch(apiBase + '/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId, password: adminPw })
      })
      const loginJson = await loginRes.json()
      if (!loginJson.success || !loginJson.token) {
        console.error('[CRON] Admin login failed:', loginJson)
        return
      }
      const token = loginJson.token
      console.log('[CRON] Admin login OK, token length =', token.length)

      // 2) 일일 배당 지급 호출 (1회만 – 중복 호출은 같은 날에는 스킵되지만 트래픽 낭비)
      const rewardRes = await fetch(apiBase + '/api/rewards/daily', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        }
      })
      const rewardJson = await rewardRes.json()
      console.log('[CRON] Daily reward result:', JSON.stringify(rewardJson))

      console.log('[CRON] Daily rewards distribution completed')
    } catch (error) {
      console.error('[CRON] Cron job failed:', error && error.stack ? error.stack : error)
    }
  }
}
