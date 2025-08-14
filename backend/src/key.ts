import { NULL_IDENTIFIER, PrivateKey } from '@ethersphere/bee-js'
import { Types } from 'cafe-utility'
import { bee } from './bee'
import { log } from './logger'

export const MB_SIGNER = Types.asString(process.env.MB_SIGNER, { name: 'MB_SIGNER' })
export const MB_STAMP = Types.asString(process.env.MB_STAMP, { name: 'MB_STAMP' })

export async function getConsensualPrivateKey(): Promise<PrivateKey> {
    const addresses = await bee.getNodeAddresses()
    log('Mining GSOC signer...')
    return bee.gsocMine(addresses.overlay, NULL_IDENTIFIER)
}
