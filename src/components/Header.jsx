import React from 'react'
import { useWeb3Modal } from '@web3modal/ethers/react'
import './Header.css'

function Header({ address, isConnected, chainId }) {
  const { open } = useWeb3Modal()

  const formatAddress = (addr) => {
    if (!addr) return ''
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const getChainName = (id) => {
    const chains = {
      1: 'Ethereum',
      11155111: 'Sepolia',
      137: 'Polygon'
    }
    return chains[id] || `Chain ${id}`
  }

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-logo">
          <div className="logo-icon">🔷</div>
          <h1 className="logo-text">Staking DApp</h1>
        </div>
        
        <button 
          className="connect-button"
          onClick={() => open()}
        >
          {isConnected ? (
            <div className="wallet-info">
              <div className="chain-badge">{getChainName(chainId)}</div>
              <span className="address">{formatAddress(address)}</span>
            </div>
          ) : (
            <span>지갑 연결</span>
          )}
        </button>
      </div>
    </header>
  )
}

export default Header
