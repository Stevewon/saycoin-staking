import { useState, useEffect } from 'react'
import { useWeb3ModalProvider, useWeb3ModalAccount } from '@web3modal/ethers/react'
import { BrowserProvider, Contract, formatEther, parseEther } from 'ethers'
import { STAKING_CONTRACT_ABI, STAKING_CONTRACT_ADDRESS } from '../contracts/stakingContract'

export function useStaking() {
  const { address, chainId, isConnected } = useWeb3ModalAccount()
  const { walletProvider } = useWeb3ModalProvider()
  
  const [stakedBalance, setStakedBalance] = useState('0')
  const [rewards, setRewards] = useState('0')
  const [apr, setApr] = useState('0')
  const [totalStaked, setTotalStaked] = useState('0')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // 컨트랙트 인스턴스 가져오기
  const getContract = async () => {
    if (!walletProvider) return null
    
    try {
      const provider = new BrowserProvider(walletProvider)
      const signer = await provider.getSigner()
      return new Contract(STAKING_CONTRACT_ADDRESS, STAKING_CONTRACT_ABI, signer)
    } catch (err) {
      console.error('Contract error:', err)
      return null
    }
  }

  // 데이터 로드
  const loadData = async () => {
    if (!isConnected || !address) return

    try {
      const contract = await getContract()
      if (!contract) return

      const [staked, reward, aprValue, total] = await Promise.all([
        contract.getStakedBalance(address),
        contract.getRewards(address),
        contract.getAPR(),
        contract.getTotalStaked()
      ])

      setStakedBalance(formatEther(staked))
      setRewards(formatEther(reward))
      setApr(aprValue.toString())
      setTotalStaked(formatEther(total))
    } catch (err) {
      console.error('Load data error:', err)
      // 테스트 데이터 사용 (컨트랙트가 없을 때)
      setStakedBalance('0')
      setRewards('0')
      setApr('12.5')
      setTotalStaked('0')
    }
  }

  // 스테이킹
  const stake = async (amount) => {
    if (!amount || parseFloat(amount) <= 0) {
      throw new Error('올바른 금액을 입력해주세요')
    }

    setIsLoading(true)
    setError(null)

    try {
      const contract = await getContract()
      if (!contract) throw new Error('지갑을 연결해주세요')

      const tx = await contract.stake({ value: parseEther(amount) })
      await tx.wait()
      
      await loadData()
      return tx
    } catch (err) {
      const errorMessage = err.reason || err.message || '스테이킹 실패'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // 언스테이킹
  const unstake = async (amount) => {
    if (!amount || parseFloat(amount) <= 0) {
      throw new Error('올바른 금액을 입력해주세요')
    }

    setIsLoading(true)
    setError(null)

    try {
      const contract = await getContract()
      if (!contract) throw new Error('지갑을 연결해주세요')

      const tx = await contract.unstake(parseEther(amount))
      await tx.wait()
      
      await loadData()
      return tx
    } catch (err) {
      const errorMessage = err.reason || err.message || '언스테이킹 실패'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // 보상 청구
  const claimRewards = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const contract = await getContract()
      if (!contract) throw new Error('지갑을 연결해주세요')

      const tx = await contract.claimRewards()
      await tx.wait()
      
      await loadData()
      return tx
    } catch (err) {
      const errorMessage = err.reason || err.message || '보상 청구 실패'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [isConnected, address, chainId])

  // 30초마다 데이터 갱신
  useEffect(() => {
    if (!isConnected) return

    const interval = setInterval(() => {
      loadData()
    }, 30000)

    return () => clearInterval(interval)
  }, [isConnected, address])

  return {
    stakedBalance,
    rewards,
    apr,
    totalStaked,
    isLoading,
    error,
    stake,
    unstake,
    claimRewards,
    refresh: loadData
  }
}
