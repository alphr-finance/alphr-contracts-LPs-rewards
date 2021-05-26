// @ts-ignore
import { ethers, upgrades } from 'hardhat';

async function main() {
  const proxyAddress = '';
  const Rewards = await ethers.getContractFactory('Rewards');
  const rewards = await upgrades.upgradeProxy(proxyAddress, Rewards);
  console.log('Rewards contract upgraded: %s', rewards.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
