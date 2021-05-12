// @ts-ignore
import { ethers, network } from 'hardhat';
import { providers } from 'ethers';
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
// import { INonfungiblePositionManager } from '../../typechain/INonfungiblePositionManager';
// import { ALPHR_TOKEN, WETH9 } from '../../constants/tokens';
// import { FeeAmount, TICK_SPACINGS } from '../shared/constants';
// import { getMinTick, getMaxTick } from '../shared/ticks';
// import { encodePriceSqrt } from '../shared/encodePriceSqrt';

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
    //     before('mint nft token for pair alphr/WETH9', async () => {
    //         const nonFungibleManager = await ethers.getContractAt('INonfungiblePositionManager', UNISWAP_V3_NFT_HANDLER) as INonfungiblePositionManager
    //         await nonFungibleManager.createAndInitializePoolIfNecessary(
    //             ALPHR_TOKEN,
    //             await nonFungibleManager.WETH9(),
    //             FeeAmount.MEDIUM,
    //             encodePriceSqrt(1, 1)
    //         )
    //         console.log(await (await nonFungibleManager.WETH9()).toString())
    //         await nonFungibleManager.mint({
    //             token0: ALPHR_TOKEN,
    //             token1: await nonFungibleManager.WETH9(),
    //             tickLower: getMinTick(TICK_SPACINGS[FeeAmount.MEDIUM]),
    //             tickUpper: getMaxTick(TICK_SPACINGS[FeeAmount.MEDIUM]),
    //             fee: FeeAmount.MEDIUM,
    //             recipient: owner.address,
    //             amount0Desired: 15,
    //             amount1Desired: 15,
    //             amount0Min: 0,
    //             amount1Min: 0,
    //             deadline: 10,
    //         })
    //     })
    //     it('test stake method', async () => {
    //     })
    // })
});
