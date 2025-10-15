# On-chain Charger Creation (Devnet)

## Env

`TOPCHARGER_PROGRAM_ID=<YourProgramPubkey>
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_PAYER_SECRET_FILE=/absolute/path/to/apps/backend/payer.json`

## Flow
1. Host creates charger via `POST /api/hosts/chargers`.
2. Backend:
   - Creates charger in DB.
   - Computes `chainId = hashToU64(charger.id)`.
   - Calls `create_charger` on Solana devnet with:
     - seeds: `["charger", sha256(userId)[0..32], charger_id(u64 LE)]`
     - args: `user_id_hash (32)`, `charger_id (u64)`, `power_kw (u16)`, `supply_type (u8)`, `price (u64 microusd/kWh)`
   - Persists `solanaChargerPda`, `solanaCreateTx`.

## Notes
- Unit for `price` is **microusd/kWh** (u64).
- `chainId` is a deterministic u64 derived from Prisma `charger.id` and saved back to DB.
- MVP uses `payer` as both `wallet` and `authority`.
- Failures to write on-chain are **non-blocking** for the API; UI can show a "sync failed" state.