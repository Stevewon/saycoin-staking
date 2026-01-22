import React from 'react'
import './RewardsPanel.css'

function RewardsPanel({ rewards, isLoading, onClaim, isConnected }) {
  const handleClaim = async () => {
    if (parseFloat(rewards) <= 0) return
    
    try {
      await onClaim()
    } catch (err) {
      console.error('Claim error:', err)
    }
  }

  return (
    <div className="rewards-panel">
      <div className="rewards-header">
        <h2 className="rewards-title">🎁 보상</h2>
      </div>

      <div className="rewards-display">
        <div className="rewards-amount">
          {parseFloat(rewards).toFixed(6)}
        </div>
        <div className="rewards-currency">ETH</div>
      </div>

      <button
        onClick={handleClaim}
        disabled={!isConnected || isLoading || parseFloat(rewards) <= 0}
        className="claim-button"
      >
        {isLoading ? (
          <span className="loading-spinner">⏳</span>
        ) : parseFloat(rewards) > 0 ? (
          '보상 청구하기'
        ) : (
          '청구 가능한 보상 없음'
        )}
      </button>

      <div className="rewards-info">
        <p className="info-text">
          ⚡ 보상은 실시간으로 누적됩니다
        </p>
        <p className="info-text">
          💰 언제든지 청구 가능합니다
        </p>
      </div>
    </div>
  )
}

export default RewardsPanel
