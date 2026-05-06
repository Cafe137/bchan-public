# Context

-   This project is called "bchan", and it is hosted at https://beechan.eth.limo
-   This is the "backend" counterpart of the project

## Technology

It is not a traditional backend because we are in web3 space. This "backend" is a sidecar application to a Bee node, and gets notified of chunk events from the Bee node through a websocket endpoint. It does not have an API on its own, and is not callable from the outside world; it communicates by receiving chunk events, and by uploading data to Swarm.

The one exception is a health check endpoint (`GET /health`) served on localhost only (default port `3000`, configurable via `HEALTH_PORT`). It exists solely for infrastructure monitoring and returns `{"status":"ok"}` when the service is running.

Precisely, it uses "GSOC" to listen to chunk events, and "feeds" for uploading data to Swarm.

## Product Domain

-   It is a message board, built for Ethereum Swarm (the decentralized storage) as a DApp (decentralized application)
-   User identities are stored in browser localStorage
-   The two main concepts are threads and posts
-   Posts may have text, or an image, or both
-   There are cryptographic proofs that threads are authentic and that posts are authentic (e.g. their proof must refer to the previous thread or post)
