/* ── Solana Programs mock data ──
 *
 * Solana programs are fundamentally different from web services:
 * - Pull-based: programs emit logs, clients/indexers scrape them
 * - No outbound requests: all data comes from on-chain transaction logs
 * - Compute-unit budgeted, not latency-measured
 * - Slot-relative timing instead of wall-clock
 * - Program accounts have fixed sizes and authority chains
 */

export type ProgramHealth = "nominal" | "elevated-failures" | "degraded" | "halted"
export type InstructionStatus = "success" | "failed"
export type LogLevel = "info" | "warn" | "error" | "program"
export type AccountWatcherStatus = "watching" | "stale" | "closed"
export type UpgradeStatus = "live" | "pending" | "revoked"

/* ── Program overview ── */
export interface SolanaProgram {
  programId: string
  label: string
  authority: string
  deploySlot: number
  lastUpgradeSlot: number
  programSize: number // bytes
  executableDataSize: number
  health: ProgramHealth
  upgradeStatus: UpgradeStatus
}

export const MOCK_PROGRAM: SolanaProgram = {
  programId: "HPXd3K...v7Wq2M",
  label: "hyperpush-rewards-v2",
  authority: "9xQeW...bTNv",
  deploySlot: 248_102_441,
  lastUpgradeSlot: 251_847_220,
  programSize: 284_672,
  executableDataSize: 241_408,
  health: "nominal",
  upgradeStatus: "live",
}

/* ── Top-level stats ── */
export interface ProgramStats {
  totalInstructions24h: number
  successRate: number
  avgComputeUnits: number
  maxComputeUnits: number
  cuBudgetUtilization: number // percentage of 200k default
  uniqueSigners24h: number
  failedTxns24h: number
  logEventsIngested: number
  lastIndexedSlot: number
  currentSlot: number
  indexLag: number // slots behind
  activeWatchers: number
}

export const MOCK_PROGRAM_STATS: ProgramStats = {
  totalInstructions24h: 84_291,
  successRate: 96.8,
  avgComputeUnits: 48_320,
  maxComputeUnits: 189_440,
  cuBudgetUtilization: 24.2,
  uniqueSigners24h: 3_412,
  failedTxns24h: 2_698,
  logEventsIngested: 341_820,
  lastIndexedSlot: 251_890_102,
  currentSlot: 251_890_108,
  indexLag: 6,
  activeWatchers: 8,
}

/* ── Instruction breakdown ── */
export interface InstructionType {
  name: string
  discriminator: string // first 8 bytes hex
  count24h: number
  successRate: number
  avgCU: number
  p95CU: number
  trend: number // pct change vs previous 24h
  topError?: string
  topErrorCount?: number
}

export const MOCK_INSTRUCTIONS: InstructionType[] = [
  { name: "claim_reward", discriminator: "0xa1b2c3d4", count24h: 32_140, successRate: 98.2, avgCU: 42_100, p95CU: 68_400, trend: 12, topError: "InsufficientFunds", topErrorCount: 412 },
  { name: "stake_tokens", discriminator: "0xe5f6a7b8", count24h: 18_920, successRate: 97.4, avgCU: 56_800, p95CU: 94_200, trend: -3, topError: "StakeAccountFull", topErrorCount: 287 },
  { name: "unstake", discriminator: "0xc9d0e1f2", count24h: 12_480, successRate: 95.1, avgCU: 38_600, p95CU: 62_100, trend: 8, topError: "CooldownActive", topErrorCount: 512 },
  { name: "update_metadata", discriminator: "0x34567890", count24h: 8_210, successRate: 99.6, avgCU: 28_400, p95CU: 41_800, trend: -15 },
  { name: "initialize_account", discriminator: "0xabcdef01", count24h: 6_840, successRate: 94.2, avgCU: 72_300, p95CU: 128_600, trend: 45, topError: "AccountAlreadyExists", topErrorCount: 341 },
  { name: "close_account", discriminator: "0x12345678", count24h: 3_420, successRate: 99.1, avgCU: 22_100, p95CU: 34_800, trend: -8 },
  { name: "transfer_authority", discriminator: "0xfedcba98", count24h: 2_281, successRate: 91.8, avgCU: 31_200, p95CU: 48_900, trend: 2, topError: "UnauthorizedSigner", topErrorCount: 148 },
]

/* ── Compute Unit time series (slot-bucketed) ── */
export const MOCK_CU_SERIES = Array.from({ length: 40 }, (_, i) => {
  const base = 45000 + Math.sin(i * 0.4) * 12000
  return {
    slot: `${251_890_100 - (39 - i) * 150}`,
    slotLabel: `${(39 - i) * 5}m`,
    avgCU: Math.floor(base + Math.random() * 8000),
    p95CU: Math.floor(base * 1.6 + Math.random() * 20000),
    maxCU: Math.floor(base * 2.8 + Math.random() * 40000),
    budget: 200_000,
  }
})

/* ── Instruction volume series ── */
export const MOCK_INSTRUCTION_VOLUME_SERIES = Array.from({ length: 40 }, (_, i) => ({
  slotLabel: `${(39 - i) * 5}m`,
  success: Math.floor(Math.random() * 180 + 60),
  failed: Math.floor(Math.random() * 15 + 2),
}))

/* ── Parsed log events (from program log scraping) ── */
export interface ParsedLogEvent {
  id: string
  slot: number
  signature: string
  timestamp: string // relative
  instruction: string
  status: InstructionStatus
  computeUnits: number
  logLines: string[]
  errorCode?: string
  errorMessage?: string
  signerKey: string
  accounts: string[] // involved account keys (truncated)
}

export const MOCK_LOG_EVENTS: ParsedLogEvent[] = [
  {
    id: "log-1",
    slot: 251_890_102,
    signature: "5xKpN...8vWq",
    timestamp: "4s ago",
    instruction: "claim_reward",
    status: "success",
    computeUnits: 44_820,
    logLines: [
      "Program HPXd3K...v7Wq2M invoke [1]",
      "Program log: Instruction: ClaimReward",
      "Program log: Reward amount: 1,420 HPX",
      "Program log: Recipient: 7kFm2...pRdL",
      "Program HPXd3K...v7Wq2M consumed 44820 of 200000 compute units",
      "Program HPXd3K...v7Wq2M success",
    ],
    signerKey: "7kFm2...pRdL",
    accounts: ["7kFm2...pRdL", "HPXd3K...v7Wq2M", "TokenkegQ...dtWN"],
  },
  {
    id: "log-2",
    slot: 251_890_098,
    signature: "3mRtY...nLp7",
    timestamp: "18s ago",
    instruction: "stake_tokens",
    status: "failed",
    computeUnits: 62_400,
    logLines: [
      "Program HPXd3K...v7Wq2M invoke [1]",
      "Program log: Instruction: StakeTokens",
      "Program log: Amount: 50,000 HPX",
      "Program log: Error: StakeAccountFull — max capacity reached",
      "Program HPXd3K...v7Wq2M consumed 62400 of 200000 compute units",
      "Program HPXd3K...v7Wq2M failed: custom program error: 0x1771",
    ],
    errorCode: "0x1771",
    errorMessage: "StakeAccountFull — max capacity reached",
    signerKey: "4pLsT...kQ9m",
    accounts: ["4pLsT...kQ9m", "HPXd3K...v7Wq2M", "StakePool...8fNx"],
  },
  {
    id: "log-3",
    slot: 251_890_094,
    signature: "9wBcE...4hTz",
    timestamp: "32s ago",
    instruction: "unstake",
    status: "failed",
    computeUnits: 34_100,
    logLines: [
      "Program HPXd3K...v7Wq2M invoke [1]",
      "Program log: Instruction: Unstake",
      "Program log: Error: CooldownActive — 2h 14m remaining",
      "Program HPXd3K...v7Wq2M consumed 34100 of 200000 compute units",
      "Program HPXd3K...v7Wq2M failed: custom program error: 0x1772",
    ],
    errorCode: "0x1772",
    errorMessage: "CooldownActive — 2h 14m remaining",
    signerKey: "BnR8x...5dWe",
    accounts: ["BnR8x...5dWe", "HPXd3K...v7Wq2M"],
  },
  {
    id: "log-4",
    slot: 251_890_090,
    signature: "Kd7mX...2rPf",
    timestamp: "48s ago",
    instruction: "claim_reward",
    status: "success",
    computeUnits: 41_200,
    logLines: [
      "Program HPXd3K...v7Wq2M invoke [1]",
      "Program log: Instruction: ClaimReward",
      "Program log: Reward amount: 890 HPX",
      "Program HPXd3K...v7Wq2M consumed 41200 of 200000 compute units",
      "Program HPXd3K...v7Wq2M success",
    ],
    signerKey: "Fh4kQ...9nTv",
    accounts: ["Fh4kQ...9nTv", "HPXd3K...v7Wq2M", "TokenkegQ...dtWN"],
  },
  {
    id: "log-5",
    slot: 251_890_082,
    signature: "LxPm8...7wVn",
    timestamp: "1m ago",
    instruction: "initialize_account",
    status: "failed",
    computeUnits: 89_200,
    logLines: [
      "Program HPXd3K...v7Wq2M invoke [1]",
      "Program log: Instruction: InitializeAccount",
      "Program log: Error: AccountAlreadyExists — PDA collision at seed [user, stake]",
      "Program HPXd3K...v7Wq2M consumed 89200 of 200000 compute units",
      "Program HPXd3K...v7Wq2M failed: custom program error: 0x1773",
    ],
    errorCode: "0x1773",
    errorMessage: "AccountAlreadyExists — PDA collision at seed [user, stake]",
    signerKey: "2mVkL...pR4x",
    accounts: ["2mVkL...pR4x", "HPXd3K...v7Wq2M", "SysvarRent..."],
  },
  {
    id: "log-6",
    slot: 251_890_076,
    signature: "Nq3Rk...hYm2",
    timestamp: "1m ago",
    instruction: "transfer_authority",
    status: "failed",
    computeUnits: 28_400,
    logLines: [
      "Program HPXd3K...v7Wq2M invoke [1]",
      "Program log: Instruction: TransferAuthority",
      "Program log: Error: UnauthorizedSigner — expected 9xQeW...bTNv",
      "Program HPXd3K...v7Wq2M consumed 28400 of 200000 compute units",
      "Program HPXd3K...v7Wq2M failed: custom program error: 0x1774",
    ],
    errorCode: "0x1774",
    errorMessage: "UnauthorizedSigner — expected 9xQeW...bTNv",
    signerKey: "5tGhP...wK8n",
    accounts: ["5tGhP...wK8n", "HPXd3K...v7Wq2M", "9xQeW...bTNv"],
  },
  {
    id: "log-7",
    slot: 251_890_068,
    signature: "Yw4Hf...mL5t",
    timestamp: "2m ago",
    instruction: "claim_reward",
    status: "success",
    computeUnits: 46_100,
    logLines: [
      "Program HPXd3K...v7Wq2M invoke [1]",
      "Program log: Instruction: ClaimReward",
      "Program log: Reward amount: 2,100 HPX",
      "Program HPXd3K...v7Wq2M consumed 46100 of 200000 compute units",
      "Program HPXd3K...v7Wq2M success",
    ],
    signerKey: "Rm9Bz...cN7q",
    accounts: ["Rm9Bz...cN7q", "HPXd3K...v7Wq2M", "TokenkegQ...dtWN"],
  },
  {
    id: "log-8",
    slot: 251_890_060,
    signature: "Tp2Wx...kJ9s",
    timestamp: "2m ago",
    instruction: "update_metadata",
    status: "success",
    computeUnits: 26_800,
    logLines: [
      "Program HPXd3K...v7Wq2M invoke [1]",
      "Program log: Instruction: UpdateMetadata",
      "Program log: Field: display_name → \"HPX Staking v2.1\"",
      "Program HPXd3K...v7Wq2M consumed 26800 of 200000 compute units",
      "Program HPXd3K...v7Wq2M success",
    ],
    signerKey: "9xQeW...bTNv",
    accounts: ["9xQeW...bTNv", "HPXd3K...v7Wq2M"],
  },
]

/* ── Account watchers ── */
export interface AccountWatcher {
  id: string
  label: string
  address: string
  dataSize: number // bytes
  lamports: number
  owner: string
  status: AccountWatcherStatus
  lastChangeSlot: number
  changesDetected24h: number
  watchFields: string[] // specific fields being tracked
}

export const MOCK_ACCOUNT_WATCHERS: AccountWatcher[] = [
  { id: "aw-1", label: "Reward Pool", address: "RwdPo...8kNm", dataSize: 512, lamports: 24_890_000_000, owner: "HPXd3K...v7Wq2M", status: "watching", lastChangeSlot: 251_890_098, changesDetected24h: 842, watchFields: ["total_staked", "reward_rate", "last_distribution_slot"] },
  { id: "aw-2", label: "Config Account", address: "CfgAc...3pLx", dataSize: 256, lamports: 1_461_600, owner: "HPXd3K...v7Wq2M", status: "watching", lastChangeSlot: 251_847_220, changesDetected24h: 2, watchFields: ["fee_bps", "authority", "paused"] },
  { id: "aw-3", label: "Fee Vault", address: "FeeVt...7wQr", dataSize: 165, lamports: 8_420_000_000, owner: "TokenkegQ...dtWN", status: "watching", lastChangeSlot: 251_890_076, changesDetected24h: 1_248, watchFields: ["amount"] },
  { id: "aw-4", label: "Stake Counter", address: "StkCt...2mBv", dataSize: 64, lamports: 946_560, owner: "HPXd3K...v7Wq2M", status: "watching", lastChangeSlot: 251_890_094, changesDetected24h: 18_920, watchFields: ["total_stakers", "total_staked_amount"] },
  { id: "aw-5", label: "Treasury Mint", address: "HPXmn...4tKw", dataSize: 82, lamports: 1_461_600, owner: "TokenkegQ...dtWN", status: "watching", lastChangeSlot: 251_890_102, changesDetected24h: 32_140, watchFields: ["supply", "decimals"] },
  { id: "aw-6", label: "Old V1 Pool", address: "V1Pol...9xRn", dataSize: 512, lamports: 890_000, owner: "HPXd3K...v7Wq2M", status: "stale", lastChangeSlot: 248_102_441, changesDetected24h: 0, watchFields: ["total_staked"] },
]

/* ── Error breakdown ── */
export interface ProgramError {
  code: string
  hexCode: string
  name: string
  count24h: number
  trend: number // pct change
  affectedInstruction: string
  lastSeen: string
}

export const MOCK_PROGRAM_ERRORS: ProgramError[] = [
  { code: "6001", hexCode: "0x1771", name: "StakeAccountFull", count24h: 287, trend: 14, affectedInstruction: "stake_tokens", lastSeen: "18s ago" },
  { code: "6002", hexCode: "0x1772", name: "CooldownActive", count24h: 512, trend: -8, affectedInstruction: "unstake", lastSeen: "32s ago" },
  { code: "6003", hexCode: "0x1773", name: "AccountAlreadyExists", count24h: 341, trend: 45, affectedInstruction: "initialize_account", lastSeen: "1m ago" },
  { code: "6004", hexCode: "0x1774", name: "UnauthorizedSigner", count24h: 148, trend: 2, affectedInstruction: "transfer_authority", lastSeen: "1m ago" },
  { code: "6005", hexCode: "0x1775", name: "InsufficientFunds", count24h: 412, trend: -12, affectedInstruction: "claim_reward", lastSeen: "3m ago" },
  { code: "6006", hexCode: "0x1776", name: "InvalidAccountData", count24h: 34, trend: 180, affectedInstruction: "initialize_account", lastSeen: "8m ago" },
]

/* ── Deploy / upgrade history ── */
export interface DeployEvent {
  slot: number
  timestamp: string
  authority: string
  programSize: number
  executableSize: number
  type: "deploy" | "upgrade" | "authority-change"
  txSignature: string
  note?: string
}

export const MOCK_DEPLOY_HISTORY: DeployEvent[] = [
  { slot: 251_847_220, timestamp: "14h ago", authority: "9xQeW...bTNv", programSize: 284_672, executableSize: 241_408, type: "upgrade", txSignature: "Hk8mN...4wPz", note: "v2.1.0 — added batch claiming" },
  { slot: 250_912_100, timestamp: "3d ago", authority: "9xQeW...bTNv", programSize: 278_528, executableSize: 236_800, type: "upgrade", txSignature: "Qw3Rt...7yBn", note: "v2.0.1 — fixed CooldownActive edge case" },
  { slot: 249_100_800, timestamp: "8d ago", authority: "9xQeW...bTNv", programSize: 276_480, executableSize: 234_496, type: "upgrade", txSignature: "Lm9Pk...2hVx", note: "v2.0.0 — major staking overhaul" },
  { slot: 248_102_441, timestamp: "14d ago", authority: "9xQeW...bTNv", programSize: 198_656, executableSize: 164_864, type: "deploy", txSignature: "Xn4Wk...8cLt", note: "Initial deployment" },
]
