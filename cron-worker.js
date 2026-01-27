// Cloudflare Workers Cron Trigger
// 매일 오전 9시(KST)에 실행 = 매일 오전 0시(UTC)에 실행

export default {
  async scheduled(event, env, ctx) {
    try {
      // API 엔드포인트 호출 (2회)
      const apiUrl = 'https://webapp.pages.dev/api/rewards/daily'
      
      console.log('Starting daily USDT rewards distribution at', new Date().toISOString())
      
      // 첫 번째 지급
      const response1 = await fetch(apiUrl, { method: 'POST' })
      const result1 = await response1.json()
      console.log('First payment:', result1)
      
      // 2초 대기
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // 두 번째 지급
      const response2 = await fetch(apiUrl, { method: 'POST' })
      const result2 = await response2.json()
      console.log('Second payment:', result2)
      
      console.log('Daily rewards distribution completed')
    } catch (error) {
      console.error('Cron job failed:', error)
    }
  }
}
