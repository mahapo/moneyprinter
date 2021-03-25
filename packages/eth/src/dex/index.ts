import { ethers } from "ethers";
const { ethereum } = window;
if (ethereum) {
    var provider = new ethers.providers.Web3Provider(ethereum);
}

const uniswapUsdcAddress = "0xb4e16d0168e52d35cacd2c6185b44281ec28c9dc";
const uniswapAbi = ... // get the abi from https://etherscan.io/address/0xb4e16d0168e52d35cacd2c6185b44281ec28c9dc#code

const getUniswapContract = async address => await new ethers.Contract(address, uniswapAbi, provider);

const getEthUsdPrice = async () => await getUniswapContract(uniswapUsdcAddress)
    .then(contract => contract.getReserves())
    .then(reserves => Number(reserves._reserve0) / Number(reserves._reserve1) * 1e12); // times 10^12 because usdc only has 6 decimals