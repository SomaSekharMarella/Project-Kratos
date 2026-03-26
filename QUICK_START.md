# QUICK START - DAO Voting System

This file gives the fastest complete path to run the project from scratch.

---

## 1) Prerequisites

Install these first:

- **Node.js 16+** (project is currently configured and tested with Node 16)
- **npm**
- **MetaMask extension**
- **Ganache** (desktop app recommended)

Open project folder:

```bash
cd "c:\Users\MARELLA SOMA SEKHAR\OneDrive\Desktop\Voting System"
```

---

## 2) Project Structure

- `Backend/` -> Hardhat + Solidity contracts
- `Frontend/` -> React (Vite) app

---

## 3) Configure Backend Environment

Create or update:

- `Backend/.env`

Use this template:

```env
# Ganache local network
GANACHE_RPC_URL=http://127.0.0.1:7545
GANACHE_CHAIN_ID=1337

# Optional: if you want to deploy from a specific private key
# (must match an account funded on Ganache)
# GANACHE_PRIVATE_KEY=0xYOUR_PRIVATE_KEY

# Optional fallback keys/urls (Sepolia)
ALCHEMY_SEPOLIA_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
PRIVATE_KEY=0xYOUR_PRIVATE_KEY
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
SEPOLIA_PRIVATE_KEY=0xYOUR_PRIVATE_KEY

# Optional: force 5 DAO members manually
# INITIAL_DAO_MEMBERS=0xDao2,0xDao3,0xDao4,0xDao5
```

Important:
- Never share private keys publicly.
- If a private key was exposed before, generate a new one.

---

## 4) Configure Frontend Environment

Create or update:

- `Frontend/.env`

Use:

```env
VITE_IPFS_GATEWAY=https://ipfs.filebase.io/ipfs/
VITE_IPFS_RPC_URL=https://rpc.filebase.io
VITE_IPFS_RPC_AUTH=YOUR_FILEBASE_BEARER_TOKEN
VITE_PUBLIC_WEB_URL=https://supply-chain-management-system-steel.vercel.app/
```

Note:
- File uploads use:
  - `POST ${VITE_IPFS_RPC_URL}/api/v0/add`
  - Header: `Authorization: Bearer ${VITE_IPFS_RPC_AUTH}`

---

## 5) Install Dependencies

Install backend deps:

```bash
cd Backend
npm install
```

Install frontend deps:

```bash
cd ../Frontend
npm install
```

---

## 6) Start Ganache

Open Ganache app and start a local chain on:

- `http://127.0.0.1:7545`

Keep Ganache running.

---

## 7) Deploy Contracts (Ganache)

From backend:

```bash
cd ../Backend
npm run deploy:ganache
```

What this does:
1. Deploys `VotingToken`
2. Deploys `ElectionManager`
3. Sets token minter to `ElectionManager`
4. Writes frontend contract files automatically:
   - `Frontend/src/contracts/addresses.json`
   - `Frontend/src/contracts/VotingToken.abi.json`
   - `Frontend/src/contracts/ElectionManager.abi.json`

Check deploy output for:
- Deployer address
- Contract addresses
- DAO members initialized

---

## 8) Configure MetaMask

### Add Ganache network

- Network Name: `Ganache Local`
- RPC URL: `http://127.0.0.1:7545`
- Chain ID: `1337`
- Currency symbol: `ETH`

### Import account(s)

Import Ganache accounts using private keys from Ganache.

Important:
- DAO dashboard appears only for addresses where `isDAO(address) == true`.
- If not DAO, connect with deployer/DAO wallet or add your address from DAO panel.

---

## 9) Run Frontend

From frontend:

```bash
cd ../Frontend
npm run dev
```

Open:

- `http://localhost:5173`

---

## 10) First-Time Functional Test (End-to-End)

Follow exactly in UI:

1. Connect wallet.
2. Go to **Dashboard**.
3. Click **Create New Election** (as DAO).
4. Ensure `Election ID` exists (usually `1` first time).
5. In **Candidate Application**, enter:
   - name
   - symbol
   - image file
   - document file
6. Submit candidate application.
7. As DAO, approve candidate in candidate list.
8. In DAO panel, assign voting power to voter address.
9. Start voting.
10. Switch to non-DAO voter account.
11. Vote for approved candidate.
12. Switch back to DAO.
13. End voting.
14. Declare result.

---

## 11) Useful Commands

### Backend

```bash
cd Backend
npm test
npm run compile
npm run deploy:ganache
npm run deploy:localhost
npm run deploy:sepolia
```

### Frontend

```bash
cd Frontend
npm run dev
npm run build
npm run lint
```

---

## 12) Common Issues and Fixes

### A) DAO/Admin dashboard not visible

Cause:
- Connected wallet is not a DAO member.

Fix:
- Switch to deployer/DAO wallet.
- Or add your wallet from DAO panel (`Add DAO member`).

### B) `missing revert data` / estimateGas error

Usually:
- election ID does not exist
- wrong network in MetaMask
- role restriction failure

Fix:
- Create election first.
- Use existing election ID.
- Ensure connected chain matches deployed chain.

### C) Candidate apply fails

Check:
- IPFS env vars are correct
- `VITE_IPFS_RPC_AUTH` is valid
- Election exists

### D) Frontend talking to old contracts

Fix:
1. Redeploy backend (`npm run deploy:ganache`)
2. Restart frontend dev server

---

## 13) Sepolia Deployment (Optional)

Set in `Backend/.env`:

```env
SEPOLIA_RPC_URL=...
SEPOLIA_PRIVATE_KEY=0x...
```

Deploy:

```bash
cd Backend
npm run deploy:sepolia
```

Then use the generated addresses/ABIs in frontend (deploy script writes them automatically).

---

## 14) Final Checklist

Before using the app:

- [ ] Ganache running on `7545`
- [ ] Backend deployed successfully
- [ ] Frontend `src/contracts/*.json` updated
- [ ] MetaMask on Ganache chain
- [ ] Connected account is DAO when doing admin actions
- [ ] `Frontend/.env` has valid Filebase IPFS credentials

You are ready to use the project end-to-end.

