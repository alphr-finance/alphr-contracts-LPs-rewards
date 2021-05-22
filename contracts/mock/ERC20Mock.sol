pragma solidity >=0.7.5;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

contract ERC20Mock is ERC20 {
  constructor(
    string memory name,
    string memory symbol,
    uint8 decimals
  ) payable ERC20(name, symbol) {
    _setupDecimals(decimals);
  }

  function mint(uint256 amount) public {
    _mint(msg.sender, amount);
  }

  function mintTo(uint256 amount, address to) public {
    _mint(to, amount);
  }
}
