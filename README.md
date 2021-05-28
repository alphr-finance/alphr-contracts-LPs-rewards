# ALPHR smart contracts

install dependencies 

    yarn

build project

    yarn build

test

    yarn test

Gas reports are generated by default with:

    yarn hardhat test

To disable gas report when running tests, use:

    env REPORT_GAS=false yarn hardhat test

## DEV ENV
### Rinkeby
set rinkeby URL and your mnemonic in hh config first;

Deployed Mock ALPHR tokens:

    0xfF59E7f7bC71c50DaF970B140df356359acA5Dcc

Deployed Mock WETH tokens: 

    0xaD94edE5fAaac6f75E6D9Aa286a3FC1AA8aF38fb
Deployed LPs rewards contract: 

    0x4Ea4e80dba5E21591e11B5c774b9e80D53b9C84B


### mint ERC 20

    yarn hardhat --network rinkeby erc20mock:mintTo --address 0xfF59E7f7bC71c50DaF970B140df356359acA5Dcc --amount AMOUNT --to YOUR_ADDRESS

    yarn hardhat --network rinkeby erc20mock:mintTo --address 0xaD94edE5fAaac6f75E6D9Aa286a3FC1AA8aF38fb --amount AMOUNT --to YOUR_ADDRESS

### Local bootstrap

#### start node

> yarn hardhat node

use ganache for subscriptions via web socket

> ganache-cli -d --fork https://node.endpoint@12472213



####run dev bootstrap

> yarn hardhat lps-rewards:bootstrap:local  --network localhost

OR with ganache flag

>  yarn hardhat lps-rewards:bootstrap:local  --network localhost --ganache true

NOTE: import this address to wallet provider

    Account #1: 0x70997970c51812dc3a010c7d01b50e0d17dc79c8 (10000 ETH)
    Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
