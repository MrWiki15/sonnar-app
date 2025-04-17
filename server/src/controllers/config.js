export const config = {
  networkConfig: (network) => {
    switch (network) {
      case "mainnet":
        return {
          // Hedera contract IDs for SaucerSwap V1
          SAUCERSWAP_V1_ROUTER: "0.0.3045981", // SaucerSwapV1RouterV3
          SAUCERSWAP_V1_FACTORY: "0.0.1062784", // SaucerSwapV1Factory
          WHBAR_TOKEN_ID: "0.0.1456985", // WHBAR on mainnet
          DEFAULT_GAS_LIMITS: {
            feeCheck: 100_000,
            poolCheck: 100_000,
            addLiquidity: 240_000,
            createPool: 3_200_000,
          },
          POOL_CREATION_DEADLINE: 1800,
        };
      case "testnet":
        return {
          // Hedera contract IDs for SaucerSwap V1 on Testnet
          SAUCERSWAP_V1_ROUTER: "0.0.19264", // SaucerSwapV1RouterV3
          SAUCERSWAP_V1_FACTORY: "0.0.9959", // SaucerSwapV1Factory
          WHBAR_TOKEN_ID: "0.0.15058", // WHBAR on Testnet
          DEFAULT_GAS_LIMITS: {
            feeCheck: 100_000,
            poolCheck: 100_000,
            addLiquidity: 240_000,
            createPool: 3_200_000,
          },
          POOL_CREATION_DEADLINE: 1800,
        };
      default:
        throw new Error("Unsupported network");
    }
  },
};
