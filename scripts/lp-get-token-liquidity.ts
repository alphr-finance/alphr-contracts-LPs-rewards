import { ethers, network } from 'hardhat';
import { Rewards } from '../typechain/Rewards';
//import { INonfungiblePositionManager } from './../typechain/INonfungiblePositionManager';

async function main() {
    const [deployer] = await ethers.getSigners();

    // step 0: deploy mirror pool
    const factoryAddress = '0x1F98431c8aD98523631AE4a59f267346ea31F984'; // uniswap factory v3
    const nftManager = '0xC36442b4a4522E871399CD717aBDD847Ab11FE88'; // nft position manager
    const Rewards = await ethers.getContractFactory('Rewards', deployer);
    const rew = (await Rewards.deploy(factoryAddress, nftManager)) as Rewards;
    await rew.deployed();
    // const uni = await ethers.getContractAt("INonfungiblePositionManager", "0xC36442b4a4522E871399CD717aBDD847Ab11FE88") as INonfungiblePositionManager

    const nftHolderAddress = '0xccb65599610d22135e632b0f9ca85ebebcdecf6f';
    await network.provider.send('hardhat_impersonateAccount', [
        nftHolderAddress,
    ]);

    console.log(await (await rew.stake('69')).toString());
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
