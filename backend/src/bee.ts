import { Bee } from '@ethersphere/bee-js'

export const bee = new Bee(process.env.BEE_URL ?? 'http://localhost:1633')
