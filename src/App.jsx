import React, { useState, useEffect } from 'react'
import { useWeb3ModalAccount, useWeb3ModalProvider } from '@web3modal/ethers/react'
import { BrowserProvider, formatEther } from 'ethers'
import Header from './components/Header'
import StatsCard from './components/StatsCard'
import StakingPanel from './components/StakingPanel'
import RewardsPanel from './components/RewardsPanel'
import { useStaking } from './hooks/useStaking'
import './utils/web3Config'
import './App.css'

function App() {
  const { address, chainId, isConnected } = useWeb3ModalAccount()
  const { walletProvider } = useWeb3ModalProvider()
  const [ethBalance, setEthBalance] = useState('0')
  
  const {
    stakedBalance,
    rewards,
    apr,
    totalStaked,
    isLoading,
    error,
    stake,
    unstake,
    claimRewards
  } = useStaking()

  // ETH 잔액 조회
  useEffect(() => {
    const getBalance = async () => {
      if (!isConnected || !walletProvider || !address) {
        setEthBalance('0')
        return
      }

      try {
        const provider = new BrowserProvider(walletProvider)
        const balance = await provider.getBalance(address)
        setEthBalance(formatEther(balance))
      } catch (err) {
        console.error('Balance error:', err)
        setEthBalance('0')
      }
    }

    getBalance()
  }, [isConnected, walletProvider, address, chainId])

  return (
    <div className="app">
      <Header 
        address={address} 
        isConnected={isConnected} 
        chainId={chainId} 
      />

      <main className="main-content">
        <div className="container">
          {/* Hero 섹션 */}
          <section className="hero-section">
            <h1 className="hero-title">
              간편한 모바일 스테이킹 🚀
            </h1>
            <p className="hero-subtitle">
              언제 어디서나 쉽고 안전하게 스테이킹하고 보상을 받으세요
            </p>
          </section>

          {/* 통계 카드 그리드 */}
          <section className="stats-grid">
            <StatsCard
              title="내 스테이킹"
              value={`${parseFloat(stakedBalance).toFixed(4)} ETH`}
              subtitle="현재 스테이킹 중"
              icon="💎"
              color="primary"
            />
            <StatsCard
              title="APR"
              value={`${apr}%`}
              subtitle="연간 수익률"
              icon="📈"
              color="success"
            />
            <StatsCard
              title="총 스테이킹"
              value={`${parseFloat(totalStaked).toFixed(2)} ETH`}
              subtitle="전체 네트워크"
              icon="🌐"
              color="secondary"
            />
            <StatsCard
              title="지갑 잔액"
              value={`${parseFloat(ethBalance).toFixed(4)} ETH`}
              subtitle="사용 가능"
              icon="💰"
              color="warning"
            />
          </section>

          {/* 스테이킹 패널 */}
          <section className="panels-grid">
            <StakingPanel
              type="stake"
              balance={ethBalance}
              onSubmit={stake}
              isLoading={isLoading}
              isConnected={isConnected}
            />
            <StakingPanel
              type="unstake"
              balance={stakedBalance}
              onSubmit={unstake}
              isLoading={isLoading}
              isConnected={isConnected}
            />
          </section>

          {/* 보상 패널 */}
          <section className="rewards-section">
            <RewardsPanel
              rewards={rewards}
              isLoading={isLoading}
              onClaim={claimRewards}
              isConnected={isConnected}
            />
          </section>

          {/* 에러 메시지 */}
          {error && (
            <div className="error-banner">
              ⚠️ {error}
            </div>
          )}

          {/* 정보 섹션 */}
          <section className="info-section">
            <h2 className="info-title">📱 모바일 최적화 DApp</h2>
            <div className="info-grid">
              <div className="info-card">
                <div className="info-icon">🔒</div>
                <h3>안전한 연결</h3>
                <p>MetaMask, WalletConnect 등 다양한 지갑 지원</p>
              </div>
              <div className="info-card">
                <div className="info-icon">⚡</div>
                <h3>빠른 처리</h3>
                <p>즉시 스테이킹 및 언스테이킹 가능</p>
              </div>
              <div className="info-card">
                <div className="info-icon">💰</div>
                <h3>실시간 보상</h3>
                <p>언제든지 보상을 청구할 수 있습니다</p>
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="footer">
        <div className="container">
          <p>© 2026 Staking DApp. All rights reserved.</p>
          <p className="footer-note">
            ⚠️ 테스트용 DApp입니다. 실제 자산을 사용하지 마세요.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App
