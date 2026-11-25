import * as StellarSdk from '@stellar/stellar-sdk'

const NETWORK = process.env.STELLAR_NETWORK === 'mainnet' ? 'mainnet' : 'testnet'

const HORIZON_URL =
  NETWORK === 'mainnet'
    ? 'https://horizon.stellar.org'
    : 'https://horizon-testnet.stellar.org'

const NETWORK_PASSPHRASE =
  NETWORK === 'mainnet'
    ? StellarSdk.Networks.PUBLIC
    : StellarSdk.Networks.TESTNET

const server = new StellarSdk.Horizon.Server(HORIZON_URL)

export async function getAccount(publicKey: string) {
  try {
    const account = await server.loadAccount(publicKey)
    return account
  } catch (err) {
    if (err instanceof StellarSdk.NotFoundError) {
      throw new Error(`Stellar account not found: ${publicKey}`)
    }
    throw err
  }
}

export function verifySignature(
  message: string,
  signatureBase64: string,
  publicKey: string
): boolean {
  try {
    const keypair = StellarSdk.Keypair.fromPublicKey(publicKey)
    const msgBuffer = Buffer.from(message, 'utf8')
    const sigBuffer = Buffer.from(signatureBase64, 'base64')
    return keypair.verify(msgBuffer, sigBuffer)
  } catch {
    return false
  }
}

export interface EscrowTxParams {
  creatorPublicKey: string
  contractId: string
  taskId: number
  amount: string
  tokenContractId: string
  sequence?: string
}

export async function buildEscrowTx(params: EscrowTxParams): Promise<string> {
  const { creatorPublicKey, contractId, taskId, amount, tokenContractId } = params

  const account = await getAccount(creatorPublicKey)
  const sorobanServer = new StellarSdk.SorobanRpc.Server(
    NETWORK === 'mainnet'
      ? 'https://soroban-rpc.mainnet.stellar.gateway.fm'
      : 'https://soroban-testnet.stellar.org'
  )

  const contract = new StellarSdk.Contract(contractId)
  const tokenContract = new StellarSdk.Contract(tokenContractId)

  const amountInStroops = BigInt(Math.round(parseFloat(amount) * 1e7))

  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: '100000',
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      contract.call(
        'create_bounty',
        StellarSdk.nativeToScVal(creatorPublicKey, { type: 'address' }),
        StellarSdk.nativeToScVal(tokenContract.address(), { type: 'address' }),
        StellarSdk.nativeToScVal(amountInStroops, { type: 'i128' })
      )
    )
    .setTimeout(300)
    .build()

  const preparedTx = await sorobanServer.prepareTransaction(tx)
  return preparedTx.toXDR()
}

export { NETWORK_PASSPHRASE, server as horizonServer }
