import { createWeb3Modal, defaultConfig } from '@web3modal/ethers/react'

// 1. WalletConnect 프로젝트 ID (실제 프로젝트에서는 https://cloud.walletconnect.com 에서 발급받아야 함)
const projectId = 'YOUR_PROJECT_ID'

// 2. 메타데이터 설정
const metadata = {
  name: 'Staking DApp',
  description: 'Mobile-friendly Staking Application',
  url: 'https://mystaking.app',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
}

// 3. 지원할 체인 설정
const chains = [
  {
    chainId: 1,
    name: 'Ethereum',
    currency: 'ETH',
    explorerUrl: 'https://etherscan.io',
    rpcUrl: 'https://cloudflare-eth.com'
  },
  {
    chainId: 11155111,
    name: 'Sepolia',
    currency: 'ETH',
    explorerUrl: 'https://sepolia.etherscan.io',
    rpcUrl: 'https://rpc.sepolia.org'
  },
  {
    chainId: 137,
    name: 'Polygon',
    currency: 'MATIC',
    explorerUrl: 'https://polygonscan.com',
    rpcUrl: 'https://polygon-rpc.com'
  }
]

// 4. Ethers config
const ethersConfig = defaultConfig({
  metadata,
  enableEIP6963: true,
  enableInjected: true,
  enableCoinbase: true,
  rpcUrl: 'https://cloudflare-eth.com',
  defaultChainId: 1
})

// 5. Web3Modal 생성
export const web3Modal = createWeb3Modal({
  ethersConfig,
  chains,
  projectId,
  enableAnalytics: false,
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#6366f1',
    '--w3m-border-radius-master': '2px'
  }
})
