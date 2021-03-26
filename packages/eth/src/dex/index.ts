import { ethers } from 'ethers'
import * as UniswapFactoryAbi from '../abis/UniswapFactory.abi.json'
import * as UniswapPair from '../abis/UniswapPair.abi.json'
;(async () => {
  try {
    const provider = new ethers.providers.InfuraProvider(
      'mainnet',
      'f9943db4650d46d382a3c490b0a5c113'
    )
    const uniswapFactoryAddress = '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f'

    const getUniswapContract = async address =>
      await new ethers.Contract(address, UniswapFactoryAbi, provider)

    const getUniswapPairContract = async address =>
      await new ethers.Contract(address, UniswapPair, provider)

    const contract = await getUniswapContract(uniswapFactoryAddress)
    const contractPair = await getUniswapPairContract(
      await contract.allPairs(0)
    )

    const reserves = await contractPair.getReserves()
    const symbol = await contractPair.symbol()
    const price =
      (Number(reserves._reserve0) / Number(reserves._reserve1)) * 1e12
    console.info(`${price} ${symbol}`)
  } catch (error) {
    console.log(error)
  }
})()
