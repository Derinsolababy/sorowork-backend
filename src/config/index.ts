export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  stellarNetwork: process.env.STELLAR_NETWORK || 'testnet',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
  database: {
    url: process.env.DATABASE_URL || '',
  },
  escrow: {
    contractId: process.env.ESCROW_CONTRACT_ID || '',
    treasuryContractId: process.env.TREASURY_CONTRACT_ID || '',
    registryContractId: process.env.REGISTRY_CONTRACT_ID || '',
  },
} as const
