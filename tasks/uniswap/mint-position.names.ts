// Rewards deploy task names
export const UNISWAP_MINT = {
  // task name and desc
  NAME: 'uni:mint-positions',
  DESC: 'Create and init Uniswap v3 pool via nft position manager',

  // task params
  TOKEN0_ADDRESS: 'token0',
  TOKEN0_ADDRESS_DESC: 'Token0 Address',
  TOKEN1_ADDRESS: 'token1',
  TOKEN1_ADDRESS_DESC: 'Token1 Address',
  FEE_AMOUNT: 'fee',
  FEE_AMOUNT_DESC: 'fee amount. it could in range of [500 , 3000 , 10000]',
  TICK_LOWER: 'low',
  TICK_LOWER_DESC: '',
  TICK_UPPER: 'up',
  TICK_UPPER_DESC: '',
  FROM: 'from',
  FROM_DESC: '',
  RECIPIENT: 'recipient',
  RECIPIENT_DESC: 'nft token holder',
  AMOUNT0_DESIRED: 'des0',
  AMOUNT0_DESIRED_DESC: 'desired amount of token 0',
  AMOUNT1_DESIRED: 'des1',
  AMOUNT1_DESIRED_DESC: 'desired amount of token 1',
  AMOUNT0_MIN: 'min0',
  AMOUNT0_MIN_DESC: 'minium amount of token 0',
  AMOUNT1_MIN: 'min1',
  AMOUNT1_MIN_DESC: 'minium amount of token 1',
  DEADLINE: 'deadline',
  DEADLINE_DESC: 'lifetime of pool',
};
