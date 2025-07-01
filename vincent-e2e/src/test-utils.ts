import { ethers } from "ethers";
import { AAVE_V3_SEPOLIA_ADDRESSES } from "../../vincent-packages/tools/aave/dist/lib/helpers/index.js";

const AAVE_BASE_DEBT_ASSET_DECIMALS = 8;

// Enhanced AAVE State interface for tracking changes
export interface AaveAccountData {
  totalCollateralBase: ethers.BigNumber;
  totalDebtBase: ethers.BigNumber;
  availableBorrowsBase: ethers.BigNumber;
  currentLiquidationThreshold: ethers.BigNumber;
  ltv: ethers.BigNumber;
  healthFactor: ethers.BigNumber;
}

// Global state tracking for AAVE operations
let previousAaveState: AaveAccountData | null = null;

export async function getAaveUserAccountData(
  provider: ethers.providers.Provider,
  userAddress: string
) {
  const aavePoolContract = new ethers.Contract(
    AAVE_V3_SEPOLIA_ADDRESSES.POOL,
    [
      {
        inputs: [{ internalType: "address", name: "user", type: "address" }],
        name: "getUserAccountData",
        outputs: [
          {
            internalType: "uint256",
            name: "totalCollateralBase",
            type: "uint256",
          },
          { internalType: "uint256", name: "totalDebtBase", type: "uint256" },
          {
            internalType: "uint256",
            name: "availableBorrowsBase",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "currentLiquidationThreshold",
            type: "uint256",
          },
          { internalType: "uint256", name: "ltv", type: "uint256" },
          { internalType: "uint256", name: "healthFactor", type: "uint256" },
        ],
        stateMutability: "view",
        type: "function",
      },
    ],
    provider
  );

  const accountData = await aavePoolContract.getUserAccountData(userAddress);
  return {
    totalCollateralBase: accountData.totalCollateralBase,
    totalDebtBase: accountData.totalDebtBase,
    availableBorrowsBase: accountData.availableBorrowsBase,
    currentLiquidationThreshold: accountData.currentLiquidationThreshold,
    ltv: accountData.ltv,
    healthFactor: accountData.healthFactor,
  };
}

export async function verifyAaveState(
  provider: ethers.providers.Provider,
  userAddress: string,
  operation: string,
  expectedChanges: {
    collateralIncrease?: boolean;
    collateralDecrease?: boolean;
    debtIncrease?: boolean;
    debtDecrease?: boolean;
    minCollateral?: string;
    maxCollateral?: string;
    minDebt?: string;
    maxDebt?: string;
    minCollateralChange?: string;
    maxCollateralChange?: string;
    minDebtChange?: string;
    maxDebtChange?: string;
  }
) {
  const currentAccountData = await getAaveUserAccountData(
    provider,
    userAddress
  );

  console.log(`🔍 AAVE State Verification (${operation.toUpperCase()})`);
  console.log(
    `   Total Collateral: ${ethers.utils.formatUnits(
      currentAccountData.totalCollateralBase,
      AAVE_BASE_DEBT_ASSET_DECIMALS
    )} USD`
  );
  console.log(
    `   Total Debt: ${ethers.utils.formatUnits(
      currentAccountData.totalDebtBase,
      AAVE_BASE_DEBT_ASSET_DECIMALS
    )} USD`
  );
  console.log(
    `   Available Borrow: ${ethers.utils.formatUnits(
      currentAccountData.availableBorrowsBase,
      AAVE_BASE_DEBT_ASSET_DECIMALS
    )} USD`
  );
  console.log(
    `   Health Factor: ${ethers.utils.formatEther(
      currentAccountData.healthFactor
    )}`
  );

  // If we have previous state, show the changes
  if (previousAaveState && operation !== "initial") {
    const collateralChange = currentAccountData.totalCollateralBase.sub(
      previousAaveState.totalCollateralBase
    );
    const debtChange = currentAccountData.totalDebtBase.sub(
      previousAaveState.totalDebtBase
    );

    console.log(`   📊 Changes from previous state:`);
    console.log(
      `      Collateral Change: ${
        collateralChange.gte(0) ? "+" : ""
      }${ethers.utils.formatUnits(
        collateralChange,
        AAVE_BASE_DEBT_ASSET_DECIMALS
      )} USD`
    );
    console.log(
      `      Debt Change: ${
        debtChange.gte(0) ? "+" : ""
      }${ethers.utils.formatUnits(
        debtChange,
        AAVE_BASE_DEBT_ASSET_DECIMALS
      )} USD`
    );

    // Verify collateral changes with previous state comparison
    if (expectedChanges.collateralIncrease) {
      if (collateralChange.lte(0)) {
        throw new Error(
          `Expected collateral increase but got change of ${ethers.utils.formatUnits(
            collateralChange,
            AAVE_BASE_DEBT_ASSET_DECIMALS
          )} USD`
        );
      }
      console.log(
        `   ✅ Collateral increased by ${ethers.utils.formatUnits(
          collateralChange,
          AAVE_BASE_DEBT_ASSET_DECIMALS
        )} USD`
      );

      // Check minimum collateral change if specified
      if (expectedChanges.minCollateralChange) {
        const minChange = ethers.utils.parseUnits(
          expectedChanges.minCollateralChange,
          AAVE_BASE_DEBT_ASSET_DECIMALS
        );
        if (collateralChange.lt(minChange)) {
          throw new Error(
            `Collateral increase ${ethers.utils.formatUnits(
              collateralChange,
              AAVE_BASE_DEBT_ASSET_DECIMALS
            )} USD is less than expected minimum ${
              expectedChanges.minCollateralChange
            } USD`
          );
        }
      }
    }

    if (expectedChanges.collateralDecrease) {
      if (collateralChange.gte(0)) {
        throw new Error(
          `Expected collateral decrease but got change of ${ethers.utils.formatUnits(
            collateralChange,
            AAVE_BASE_DEBT_ASSET_DECIMALS
          )} USD`
        );
      }
      console.log(
        `   ✅ Collateral decreased by ${ethers.utils.formatUnits(
          collateralChange.abs(),
          AAVE_BASE_DEBT_ASSET_DECIMALS
        )} USD`
      );

      // Check minimum collateral change if specified
      if (expectedChanges.minCollateralChange) {
        const minChange = ethers.utils.parseUnits(
          expectedChanges.minCollateralChange,
          AAVE_BASE_DEBT_ASSET_DECIMALS
        );
        if (collateralChange.abs().lt(minChange)) {
          throw new Error(
            `Collateral decrease ${ethers.utils.formatUnits(
              collateralChange.abs(),
              AAVE_BASE_DEBT_ASSET_DECIMALS
            )} USD is less than expected minimum ${
              expectedChanges.minCollateralChange
            } USD`
          );
        }
      }
    }

    // Verify debt changes with previous state comparison
    if (expectedChanges.debtIncrease) {
      if (debtChange.lte(0)) {
        throw new Error(
          `Expected debt increase but got change of ${ethers.utils.formatUnits(
            debtChange,
            AAVE_BASE_DEBT_ASSET_DECIMALS
          )} USD`
        );
      }
      console.log(
        `   ✅ Debt increased by ${ethers.utils.formatUnits(
          debtChange,
          AAVE_BASE_DEBT_ASSET_DECIMALS
        )} USD`
      );

      // Check minimum debt change if specified
      if (expectedChanges.minDebtChange) {
        const minChange = ethers.utils.parseUnits(
          expectedChanges.minDebtChange,
          AAVE_BASE_DEBT_ASSET_DECIMALS
        );
        if (debtChange.lt(minChange)) {
          throw new Error(
            `Debt increase ${ethers.utils.formatUnits(
              debtChange,
              AAVE_BASE_DEBT_ASSET_DECIMALS
            )} USD is less than expected minimum ${
              expectedChanges.minDebtChange
            } USD`
          );
        }
      }
    }

    if (expectedChanges.debtDecrease) {
      if (debtChange.gte(0)) {
        throw new Error(
          `Expected debt decrease but got change of ${ethers.utils.formatUnits(
            debtChange,
            AAVE_BASE_DEBT_ASSET_DECIMALS
          )} USD`
        );
      }
      console.log(
        `   ✅ Debt decreased by ${ethers.utils.formatUnits(
          debtChange.abs(),
          AAVE_BASE_DEBT_ASSET_DECIMALS
        )} USD`
      );

      // Check minimum debt change if specified
      if (expectedChanges.minDebtChange) {
        const minChange = ethers.utils.parseUnits(
          expectedChanges.minDebtChange,
          AAVE_BASE_DEBT_ASSET_DECIMALS
        );
        if (debtChange.abs().lt(minChange)) {
          throw new Error(
            `Debt decrease ${ethers.utils.formatUnits(
              debtChange.abs(),
              AAVE_BASE_DEBT_ASSET_DECIMALS
            )} USD is less than expected minimum ${
              expectedChanges.minDebtChange
            } USD`
          );
        }
      }
    }
  } else {
    // For initial state or when no previous state, do basic validation
    if (expectedChanges.collateralIncrease) {
      if (currentAccountData.totalCollateralBase.eq(0)) {
        throw new Error("Expected collateral increase but collateral is zero");
      }
    }

    if (expectedChanges.debtIncrease) {
      if (currentAccountData.totalDebtBase.eq(0)) {
        throw new Error("Expected debt increase but debt is zero");
      }
    }
  }

  // Verify absolute minimum/maximum values if provided
  if (expectedChanges.minCollateral) {
    const minCollateral = ethers.utils.parseUnits(
      expectedChanges.minCollateral,
      AAVE_BASE_DEBT_ASSET_DECIMALS
    );
    if (currentAccountData.totalCollateralBase.lt(minCollateral)) {
      throw new Error(
        `Collateral ${ethers.utils.formatUnits(
          currentAccountData.totalCollateralBase,
          AAVE_BASE_DEBT_ASSET_DECIMALS
        )} USD is less than expected minimum ${
          expectedChanges.minCollateral
        } USD`
      );
    }
  }

  if (expectedChanges.maxCollateral) {
    const maxCollateral = ethers.utils.parseUnits(
      expectedChanges.maxCollateral,
      AAVE_BASE_DEBT_ASSET_DECIMALS
    );
    if (currentAccountData.totalCollateralBase.gt(maxCollateral)) {
      throw new Error(
        `Collateral ${ethers.utils.formatUnits(
          currentAccountData.totalCollateralBase,
          AAVE_BASE_DEBT_ASSET_DECIMALS
        )} USD exceeds expected maximum ${expectedChanges.maxCollateral} USD`
      );
    }
  }

  if (expectedChanges.minDebt) {
    const minDebt = ethers.utils.parseUnits(
      expectedChanges.minDebt,
      AAVE_BASE_DEBT_ASSET_DECIMALS
    );
    if (currentAccountData.totalDebtBase.lt(minDebt)) {
      throw new Error(
        `Debt ${ethers.utils.formatUnits(
          currentAccountData.totalDebtBase,
          AAVE_BASE_DEBT_ASSET_DECIMALS
        )} USD is less than expected minimum ${expectedChanges.minDebt} USD`
      );
    }
  }

  if (expectedChanges.maxDebt) {
    const maxDebt = ethers.utils.parseUnits(
      expectedChanges.maxDebt,
      AAVE_BASE_DEBT_ASSET_DECIMALS
    );
    if (currentAccountData.totalDebtBase.gt(maxDebt)) {
      throw new Error(
        `Debt ${ethers.utils.formatUnits(
          currentAccountData.totalDebtBase,
          AAVE_BASE_DEBT_ASSET_DECIMALS
        )} USD exceeds expected maximum ${expectedChanges.maxDebt} USD`
      );
    }
  }

  // Health factor should be > 1 for healthy positions
  if (currentAccountData.totalDebtBase.gt(0)) {
    const healthFactorNumber = parseFloat(
      ethers.utils.formatEther(currentAccountData.healthFactor)
    );
    if (healthFactorNumber <= 1.0) {
      console.warn(
        `⚠️  Warning: Health factor is ${healthFactorNumber.toFixed(
          4
        )}, position may be at risk`
      );
    }
  }

  // Store current state as previous state for next comparison
  previousAaveState = { ...currentAccountData };

  return currentAccountData;
}

// Helper function to reset state tracking (useful for test isolation)
export function resetAaveStateTracking() {
  previousAaveState = null;
}