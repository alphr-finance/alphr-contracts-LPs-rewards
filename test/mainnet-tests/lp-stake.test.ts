// @ts-ignore
import { ethers, network } from 'hardhat';
import { providers, utils } from 'ethers';
import { ContractReceipt, ContractTransaction } from 'ethers';
import { Rewards } from './../../typechain/Rewards';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import {
    UNISWAP_V3_FACTORY,
    UNISWAP_V3_NFT_HANDLER,
} from '../../constants/uniswap';
import { TX_RECEIPT_OK } from '../../constants/tx-receipt-status';
import { IERC721Permit } from '../../typechain/IERC721Permit';
import { INonfungiblePositionManager } from '../../typechain/INonfungiblePositionManager';
import { ALPHR_TOKEN, WETH9 } from '../../constants/tokens';
import { FeeAmount, MaxUint128, TICK_SPACINGS } from '../shared/constants';
import { getMinTick, getMaxTick } from '../shared/ticks';
import { encodePriceSqrt } from '../shared/encodePriceSqrt';
import { IERC20 } from '../../typechain/IERC20';

describe('Reward :: test reward contract', () => {
    let deployer, owner: SignerWithAddress;
    let rew: Rewards;
    let lpDeployTxr: providers.TransactionReceipt;
    let tx: ContractTransaction;
    let txr: ContractReceipt;

    before('init signers', async () => {
        [deployer, owner] = await ethers.getSigners();
    });

    before('deploy rewards contract', async () => {
        const Rewards = await ethers.getContractFactory('Rewards');
        rew = (await Rewards.connect(deployer).deploy(
            UNISWAP_V3_FACTORY,
            UNISWAP_V3_NFT_HANDLER
        )) as Rewards;
        await rew.deployed();
        lpDeployTxr = await rew.deployTransaction.wait();
    });

    it('contract status', async () => {
        console.log(rew.address);
        expect(lpDeployTxr.status).eq(TX_RECEIPT_OK);
    });

    describe('Reward :: test stake method', async () => {
        it('test stake method', async () => {
            const nftToken = (await ethers.getContractAt(
                'IERC721Permit',
                UNISWAP_V3_NFT_HANDLER
            )) as IERC721Permit;
            const nftHolderAddress =
                '0x72d4d59f31d0cb4a4213a5dc81fc0108241ecc71';

            await network.provider.send('hardhat_impersonateAccount', [
                nftHolderAddress,
            ]);
            const holder = await ethers.provider.getSigner(nftHolderAddress);
            tx = await nftToken.connect(holder).approve(rew.address, 12447);
            txr = await tx.wait();

            //console.log(await txr.events)
            await rew.connect(holder).stake(12447);
            expect(await nftToken.ownerOf(12447)).eq(rew.address);
        });
    });

    // describe('Reward :: test stake within alphr token', async () => {
    //     let nonFungibleManager: INonfungiblePositionManager
    //     before('mint nft token for pair alphr/WETH9', async () => {
    //         nonFungibleManager = await ethers.getContractAt('INonfungiblePositionManager', UNISWAP_V3_NFT_HANDLER) as INonfungiblePositionManager
    //         await nonFungibleManager.createAndInitializePoolIfNecessary(
    //             await nonFungibleManager.WETH9(),
    //             ALPHR_TOKEN,
    //             FeeAmount.MEDIUM,
    //             encodePriceSqrt(1, 1)
    //         )
    //         before('get ERC20 tokens', async () => {
    //             await network.provider.send("hardhat_impersonateAccount", [ALPHR_TOKEN])
    //             const alphrTokenHolder = await ethers.provider.getSigner(ALPHR_TOKEN)
    //             const alphr = await ethers.getContractAt("IERC20", ALPHR_TOKEN) as IERC20
    //             await alphr.approve(nonFungibleManager.address, MaxUint128)
    //             await alphr.approve(owner.address, MaxUint128)
    //             await owner.sendTransaction({from: owner.address, to: alphr.address, value: utils.parseEther('5')})
    //             await alphr.connect(alphrTokenHolder).transfer(owner.address, utils.parseEther('5'))

    //             await network.provider.send("hardhat_impersonateAccount", [WETH9])
    //             const wethTokenHolder = await ethers.provider.getSigner(WETH9)
    //             const weth = await ethers.getContractAt("IERC20", WETH9) as IERC20

    //             await weth.approve(nonFungibleManager.address, MaxUint128)
    //             await weth.approve(owner.address, MaxUint128)
    //             await weth.sendTransaction({from: owner.address, to: alphr.address, value: utils.parseEther('5')})
    //             await weth.connect(wethTokenHolder).transfer(owner.address, utils.parseEther('5'))

    //             await alphr.approve(deployer.address, MaxUint128)
    //             await weth.approve(deployer.address, MaxUint128)
    //         })

    //     })
    //     it('test stake method', async () => {
    //      const mintData = nonFungibleManager.interface.encodeFunctionData('mint', [
    //         {
    //         token0: WETH9,
    //         token1: ALPHR_TOKEN,
    //         tickLower: getMinTick(TICK_SPACINGS[FeeAmount.MEDIUM]),
    //         tickUpper: getMaxTick(TICK_SPACINGS[FeeAmount.MEDIUM]),
    //         fee: FeeAmount.MEDIUM,
    //         recipient: deployer.address,
    //         amount0Desired: 100,
    //         amount1Desired: 100,
    //         amount0Min: 0,
    //         amount1Min: 0,
    //         deadline: utils.parseEther('100'),
    //         },
    //      ])
    //         console.log(mintData)
    //         // console.log(owner.address)
    //         // console.log(deployer.address)
    //         // await nonFungibleManager.connect(owner).mint({
    //         //     token0: WETH9,
    //         //     token1: ALPHR_TOKEN,
    //         //     tickLower: getMinTick(TICK_SPACINGS[FeeAmount.MEDIUM]),
    //         //     tickUpper: getMaxTick(TICK_SPACINGS[FeeAmount.MEDIUM]),
    //         //     fee: FeeAmount.MEDIUM,
    //         //     recipient: deployer.address,
    //         //     amount0Desired: 100,
    //         //     amount1Desired: 100,
    //         //     amount0Min: 0,
    //         //     amount1Min: 0,
    //         //     deadline: utils.parseEther('100'),
    //         // })
    //     })
    // })
});
