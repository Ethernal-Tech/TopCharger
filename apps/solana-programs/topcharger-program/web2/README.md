# Topcharger Web2 API

Simple Express server that provides endpoints to call the Anchor program instructions:

- POST /register — register_user
- POST /create-charger — create_charger
- POST /reserve — reserve_charger
- POST /confirm — confirm_charge

Setup

1. Install dependencies:

```bash
cd web2
npm install
```

2. Ensure your environment has the Anchor provider variables set (or `anchor test` will start a validator for testing).

3. Start the server:

```bash
npm run start
```

Body formats

- register:
  - role: number (0|1)
  - userIdHash: array[32] or base64 string

- create-charger:
  - userIdHash: array[32] or base64 string
  - chargerId: number
  - powerKw: number
  - supplyType: number
  - price: number
  - location: string

- reserve:
  - chargerPda: base58 string
  - driverUserHash: array[32] or base64 string

- confirm:
  - matchPda: base58 string
  - wasCorrect: boolean
