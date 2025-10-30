# TopCharger
We’re building an **open**, **on-chain** network where *anyone* — homeowners, hotels, gas stations — can host a charger, and anyone can charge without special cards or memberships.

Our app finds the **best charger for you** based on what matters most: **Closest, Cheapest, Fastest, Greenest, or Most Reliable**. You can even **book your spot ahead** and skip the wait entirely.

**Hosts earn rewards** for uptime, using renewable energy, and supporting underserved areas. **Drivers earn points** for feedback and loyalty — turning good behavior into real benefits.

Payments are **smooth**, onboarding is **instant**, and the experience is **frictionless** — no passwords, no cards, no confusion. All charging data is stored securely on **Solana**, ensuring transparency and trust for drivers, hosts, cities, and utilities alike.


---
## Features
- **User authentication** via Google or Solana wallet  
- **Role selection** after first login (Host or Driver)  
- **Charger discovery** and booking by drivers  
- **Session management** for both hosts and drivers  
- **Reward system** for renewable energy use and underserved coverage  
- **Dynamic pricing** and transparent data on Solana  
- **Community-driven energy economy** with on-chain verifiability 
> :warning: Some features are under development and may be listed here for planning purposes.
---
## User Roles

### **Host**
- Add and manage charging stations  
- Set pricing and monitor availability  
- Track sessions and revenue  
- Earn rewards for uptime, renewable energy, and serving underserved areas  

### **Driver**
- Search chargers by **price, distance, speed, or green energy**  
- Start and stop charging sessions  
- Book chargers in advance  
- Track charging history and spending  
- Earn loyalty points and provide feedback  

---

## TopCharger System Flows (Solana Devnet)

The TopCharger on-chain program runs on **Solana devnet**. Diagrams below reflect the current API + on-chain flows.

---

### Register User (Driver or Host)

<details>
<summary>View Diagram</summary>

```mermaid
sequenceDiagram
    autonumber
    participant FE as Frontend (App)
    participant API as Backend (Next.js)
    participant DB as PostgreSQL
    participant RPC as Solana RPC (devnet)
    participant PROG as TopCharger Program (devnet)

    %% Register user (role = DRIVER | HOST)
    FE->>API: POST /api/\{role\}/profile
    API->>DB: upsert \{role\}Profile
    alt first-time \{role\}
        API->>RPC: register_user(role)
        RPC->>PROG: invoke register_user
        PROG-->>RPC: userPda, signature
        RPC-->>API: userPda, signature
        API->>DB: save solanaUserPda, solanaRegisterTx
    end
    API-->>FE: 201 \{role\}
```
</details>

### Register Charger (Host only)

<details>
<summary>View Diagram</summary>

```mermaid
sequenceDiagram
    autonumber
    participant FE as Frontend (App)
    participant API as Backend (Next.js)
    participant DB as PostgreSQL
    participant RPC as Solana RPC (devnet)
    participant PROG as TopCharger Program (devnet)

    FE->>API: POST /api/hosts/chargers
    API->>DB: create Charger (Web2)
    alt first-time chain sync
        API->>RPC: create_charger(...)
        RPC->>PROG: invoke create_charger
        PROG-->>RPC: chargerPda, signature
        RPC-->>API: chargerPda, signature
        API->>DB: update charger (pda + tx)
    end
    API-->>FE: 201 created
```
</details>

### Start Charging Session
<details>
<summary>View Diagram</summary>

```mermaid
sequenceDiagram
    autonumber
    participant FE as Frontend (App)
    participant API as Backend (Next.js)
    participant DB as PostgreSQL
    participant RPC as Solana RPC (devnet)
    participant PROG as TopCharger Program (devnet)

    FE->>API: POST /api/chargers/:id/start
    API->>API: requireDriverContext()
    API->>DB: get Charger by id (exists & available?)
    API->>DB: ensure no ACTIVE (driver & charger)
    API->>DB: tx: create ChargingSession(ACTIVE) + set charger.available=false
    alt charger has solanaChargerPda
        API->>API: matchId32 = hash32(session.id)
        API->>RPC: reserve_charger(matchId32, chargerPda)
        RPC->>PROG: invoke reserve_charger
        PROG-->>RPC: matchPda, signature
        RPC-->>API: matchPda, signature
        API->>DB: save solanaMatchPda, startTxSig
    end
    API-->>FE: 201 created { session }
```
</details>

### Start Charging Session
<details>
<summary>View Diagram</summary>

```mermaid
sequenceDiagram
    autonumber
    participant FE as Frontend (App)
    participant API as Backend (Next.js)
    participant DB as PostgreSQL
    participant RPC as Solana RPC (devnet)
    participant PROG as TopCharger Program (devnet)

    FE->>API: POST /api/sessions/:id/stop
    API->>API: requireDriverContext()
    API->>DB: get Session by id (belongs to driver & ACTIVE?)
    API->>API: compute hours, energyKwh, costTotal
    API->>DB: tx: update Session(STOPPED, metrics) + set charger.available=true
    alt has solanaMatchPda & chargerPda
        API->>RPC: confirm_charge(matchPda, chargerPda, wasCorrect=true)
        RPC->>PROG: invoke confirm_charge
        PROG-->>RPC: signature
        RPC-->>API: signature
        API->>DB: save stopTxSig
    end
    API-->>FE: 200 ok { session }
```
</details>

## Local development

1. **Clone**
```bash
git clone https://github.com/Ethernal-Tech/TopCharger.git
cd TopCharger
```

2. **Env files**

Create backend env: `apps/backend/.env`
```env
# apps/backend/.env (example)
DATABASE_URL="postgresql://tc:tcpass@localhost:5432/topcharger"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="replace_with_a_long_random_secret"

# Google OAuth (set in Google Cloud console)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Solana / Anchor
SOLANA_RPC_URL="https://api.devnet.solana.com"
ANCHOR_PROVIDER_URL="https://api.devnet.solana.com"
SOLANA_PAYER_SECRET_FILE="payer.json"
TOPCHARGER_PROGRAM_ID="7hPKe9TQqE3CpNk5XK5jGgpanBj9DAq314sLLztpE8Wa"
ANCHOR_WALLET="payer.json"

# Frontend/backed origins used by the app
VITE_BACKEND_URL="http://localhost:3000"
VITE_FRONTEND_URL="http://localhost:5173"
```

Create frontend env: `apps/frontend/.env`
```env
# apps/frontend/.env (example)
VITE_BACKEND_URL="http://localhost:3000"
VITE_FRONTEND_URL="http://localhost:5173"
```

Important Google OAuth redirect URIs (register in Google Cloud):
- `http://localhost:3000/api/auth/callback/google`

3. **Start database**
```bash
docker compose up -d
```

4. **Install and prepare**

Backend
```bash
npm --prefix apps/backend ci
cd apps/backend
npx prisma generate --schema prisma/schema.prisma
npx prisma migrate dev --name init_all --schema prisma/schema.prisma
cd ../..
```

Frontend
```bash
npm --prefix apps/frontend ci
```

5. **Run apps**

Backend (dev)
```bash
npm --prefix apps/backend run dev
```

Frontend (dev)
```bash
npm --prefix apps/frontend run dev
```

**Useful commands**
- Prisma Studio: `npx prisma studio --schema apps/backend/prisma/schema.prisma`


