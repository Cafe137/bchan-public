# bchan Protocol

bchan is a decentralized message board built on [Ethereum Swarm](https://www.ethswarm.org/). This document describes the wire protocol used for threads and posts.

## Overview

All communication happens through two Swarm primitives:

- **GSOC** (Graffiti Single-Owner Chunk) — used to submit new threads and posts
- **Feeds** — used to publish and discover the list of threads and posts

A designated Bee node acts as the **service node**. It runs a sidecar application that listens on GSOC, validates incoming messages, stores the raw payloads to Swarm, and republishes the reference lists via feeds. This node is effectively the server, but it operates entirely within the Ethereum Swarm network — there is no traditional backend outside of it.

---

## GSOC Channel

The frontend sends messages to a pre-agreed signer key called `WRITER`:

```
WRITER = 0x00000000000000000000000000000000000000000000000000000000000016ca
```

This is a private key mined by the backend node such that GSOC chunks land near its overlay address. The backend subscribes to the corresponding Ethereum address and receives all incoming messages.

There are two message types, distinguished by an opcode byte at the start of each GSOC payload.

---

## Message Byte Layouts

### Thread (opcode `0x01`)

Sent via `gsocSend(batchId, WRITER, NULL_ADDRESS, payload)`.

#### GSOC payload

```
Offset  Size   Field
------  -----  -----
0       1      opcode = 0x01
1       65     signature (secp256k1, recoverable)
66      20     owner (Ethereum address)
86      32     previousHash (reference of the most recent thread, or 32 zero bytes if none)
118     var    JSON payload (UTF-8)
```

#### Signed digest

The signature covers bytes at offset 66 onwards (everything after the signature itself):

```
owner (20) || previousHash (32) || JSON (var)
```

#### JSON payload

```json
{ "title": "string", "body": "string" }
```

#### Stored format (uploaded to Swarm)

The opcode byte is stripped before uploading. The Swarm reference returned becomes the thread's canonical identifier.

```
Offset  Size   Field
------  -----  -----
0       65     signature
65      20     owner
85      32     previousHash
117     var    JSON payload (UTF-8)
```

---

### Post (opcode `0x00`)

Sent via `gsocSend(batchId, WRITER, NULL_IDENTIFIER, payload)`.

#### GSOC payload

```
Offset  Size   Field
------  -----  -----
0       1      opcode = 0x00
1       65     signature (secp256k1, recoverable)
66      20     owner (Ethereum address)
86      32     previousHash (reference of the most recent post in this thread, or 32 zero bytes)
118     32     threadReference (Swarm reference of the parent thread)
150     8      timestamp (milliseconds since Unix epoch, little-endian uint64)
158     var    JSON payload (UTF-8)
```

#### Signed digest

The signature covers bytes at offset 66 onwards:

```
owner (20) || previousHash (32) || threadReference (32) || timestamp (8) || JSON (var)
```

#### JSON payload

```json
{ "message": "string (optional)", "image": "hex-encoded Swarm reference (optional)" }
```

At least one of `message` or `image` must be present.

#### Stored format (uploaded to Swarm)

```
Offset  Size   Field
------  -----  -----
0       65     signature
65      20     owner
85      32     previousHash
117     32     threadReference
149     8      timestamp (ms, little-endian uint64)
157     var    JSON payload (UTF-8)
```

---

## Feed Structure

After processing a message the backend republishes two Swarm feeds, both signed by the `MB_SIGNER` key (Ethereum address `bc322a23377d4f71e7aa41d303b2391cb28c937c`).

### Board feed (thread list)

| Property | Value |
|----------|-------|
| Topic    | rolling feed over base topic `bchan/board` (see rolling feeds below) |
| Signer   | `bc322a23377d4f71e7aa41d303b2391cb28c937c` |
| Payload  | 4096 bytes — up to 128 × 32-byte Swarm references, newest first |

### Thread feed (post list)

| Property | Value |
|----------|-------|
| Topic    | rolling feed over base topic `bchan/thread/{threadReferenceHex}` |
| Signer   | `bc322a23377d4f71e7aa41d303b2391cb28c937c` |
| Payload  | 4096 bytes — up to 128 × 32-byte Swarm references, newest first |

#### Feed payload layout

```
Offset  Size   Field
------  -----  -----
0       32     reference[0]  (most recent)
32      32     reference[1]
...
n*32    32     reference[n]
(n+1)*32 ...   zero-padded to 4096 bytes
```

Both feeds hold at most 128 references. Older entries are dropped when the limit is exceeded.

---

## Rolling Feeds

Swarm feeds are sequential: a reader must walk the update chain from the beginning to find the latest version. As a feed accumulates updates, lookup time grows linearly with the number of updates. Feed topics are therefore rotated every period — each rotation starts a fresh chain, bounding lookup time to the number of updates within a single period.

Rotation is handled by bee-js's rolling feed (`bee.rollingFeed`). Both sides derive the same topic from a period-independent base topic and the current period index:

```
period = floor( unix_timestamp_seconds / 675 )
topic  = keccak256( baseTopic || uint64_be(period) )
```

The period is **675 seconds** (~11 minutes 15 seconds). Since 86400 / 675 = 128, there are 128 periods per day and every period boundary falls on a UTC day boundary.

Base topics, the period length and the signer address live in the `shared` workspace package, which both the backend and the frontend import. A mismatch between the two sides does not raise an error — it derives a topic nobody publishes to, and the board renders empty.

### Writing

Every publish writes the payload to **both** the current period and the next one. The next period is therefore already populated when rotation happens, so an active feed needs no work at the boundary.

### Reading

A reader reads the current period, and falls back to the previous period once if it is empty, which absorbs clock skew between writer and reader.

### Silence

Mirroring forward only covers one period, so a writer that goes quiet for two consecutive periods leaves a gap. Once per period the backend checks each feed and, if it has fallen behind:

1. republishes the current payload to the live period (the heartbeat — only a normal publish may write the live period), and
2. backfills every period strictly between the last populated one and the live one by copying the last known chunk forward.

Both run concurrently; their period ranges are disjoint. Backfill is best effort — it has nothing to copy on a first-ever publish.

---

## Validation Rules

The backend enforces the following before accepting a message:

| Rule | Thread | Post |
|------|--------|------|
| Opcode byte present | `0x01` | `0x00` |
| Signature recovers to `owner` | yes | yes |
| `previousHash` equals current tip | latest thread reference | latest post reference in thread |
| Timestamp within bounds | — | `now - 60 000 ms ≤ timestamp ≤ now` |
| Required fields in JSON | `title`, `body` | `message` or `image` (at least one) |

The chain invariant (`previousHash` must equal the current tip) ensures strict ordering and prevents replay or fork attacks. A zero hash (`0x000...000`) is the valid `previousHash` when no prior item exists.

---

## Data Flow

```
Frontend                   GSOC                  Backend sidecar         Swarm
   |                         |                         |                    |
   |-- gsocSend(thread) ---> |                         |                    |
   |                         |--- onMessage(bytes) --> |                    |
   |                         |                         |-- validate ------> |
   |                         |                         |<- Swarm ref ------  |
   |                         |                         |-- publishFeed ---> |
   |                         |                         |                    |
   |-- gsocSend(post) -----> |                         |                    |
   |                         |--- onMessage(bytes) --> |                    |
   |                         |                         |-- validate ------> |
   |                         |                         |<- Swarm ref ------  |
   |                         |                         |-- publishFeed ---> |
   |                         |                         |                    |
   |<-- rollingFeed.downloadPayload() ---------------------------- feed -- |
   |<-- data.download(ref) --------------------------------------- data -- |
```

---

## Identity

User identities are secp256k1 key pairs stored in browser `localStorage`. The Ethereum address derived from the public key serves as the user identifier (`owner` field). Signatures use the standard Ethereum personal-sign scheme as implemented by `bee-js`.
