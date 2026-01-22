import React, { useState } from 'react'
import './StakingPanel.css'

function StakingPanel({ 
  type, 
  balance, 
  onSubmit, 
  isLoading, 
  isConnected 
}) {
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!amount || parseFloat(amount) <= 0) {
      setError('올바른 금액을 입력해주세요')
      return
    }

    if (parseFloat(amount) > parseFloat(balance)) {
      setError('잔액이 부족합니다')
      return
    }

    try {
      await onSubmit(amount)
      setAmount('')
    } catch (err) {
      setError(err.message)
    }
  }

  const handleMaxClick = () => {
    setAmount(balance)
  }

  const isStake = type === 'stake'

  return (
    <div className="staking-panel">
      <div className="panel-header">
        <h2 className="panel-title">
          {isStake ? '💎 스테이킹' : '🔓 언스테이킹'}
        </h2>
        <div className="balance-info">
          사용 가능: <span className="balance-value">{parseFloat(balance).toFixed(4)}</span> ETH
        </div>
      </div>

      <form onSubmit={handleSubmit} className="panel-form">
        <div className="input-group">
          <input
            type="number"
            step="0.0001"
            min="0"
            placeholder="0.0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={!isConnected || isLoading}
            className="amount-input"
          />
          <button
            type="button"
            onClick={handleMaxClick}
            disabled={!isConnected || isLoading}
            className="max-button"
          >
            MAX
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <button
          type="submit"
          disabled={!isConnected || isLoading || !amount}
          className={`submit-button ${isStake ? 'submit-stake' : 'submit-unstake'}`}
        >
          {isLoading ? (
            <span className="loading-spinner">⏳</span>
          ) : isConnected ? (
            isStake ? '스테이킹 하기' : '언스테이킹 하기'
          ) : (
            '지갑을 먼저 연결해주세요'
          )}
        </button>
      </form>

      {isStake && (
        <div className="panel-info">
          <div className="info-item">
            <span className="info-label">최소 스테이킹</span>
            <span className="info-value">0.01 ETH</span>
          </div>
          <div className="info-item">
            <span className="info-label">락업 기간</span>
            <span className="info-value">없음</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default StakingPanel
