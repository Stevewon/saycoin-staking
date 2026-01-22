export const STAKING_CONTRACT_ABI = [
  "function stake() external payable",
  "function unstake(uint256 amount) external",
  "function getStakedBalance(address account) external view returns (uint256)",
  "function getRewards(address account) external view returns (uint256)",
  "function claimRewards() external",
  "function getAPR() external view returns (uint256)",
  "function getTotalStaked() external view returns (uint256)",
  "event Staked(address indexed user, uint256 amount)",
  "event Unstaked(address indexed user, uint256 amount)",
  "event RewardsClaimed(address indexed user, uint256 amount)"
]

// 테스트용 컨트랙트 주소 (실제 프로젝트에서는 배포된 컨트랙트 주소 사용)
export const STAKING_CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000000"

export const SUPPORTED_CHAINS = {
  1: {
    name: "Ethereum Mainnet",
    symbol: "ETH",
    decimals: 18
  },
  11155111: {
    name: "Sepolia Testnet",
    symbol: "ETH",
    decimals: 18
  },
  137: {
    name: "Polygon",
    symbol: "MATIC",
    decimals: 18
  }
}
