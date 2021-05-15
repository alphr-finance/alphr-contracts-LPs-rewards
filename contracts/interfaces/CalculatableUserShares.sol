pragma solidity >=0.7.0 <0.9.0;

abstract contract CalculatableUserShares {
  function recalculateUserShares() public virtual;
}
