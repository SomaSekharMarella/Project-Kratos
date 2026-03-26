## DAO-Controlled Decentralized Voting System

This project implements a full voting dApp using:
- **Smart contracts**: Hardhat + Solidity + OpenZeppelin
- **Frontend**: React (Vite) + ethers.js
- **Storage**: Filebase IPFS (for candidate image and documents)
- **Networks**: Ganache/local and Sepolia-ready configuration

The system follows your exact design decisions:
- DAO members and voters are separate roles
- DAO majority approval for candidates
- 1 voting token per voter (assigned manually by DAO)
- Token is reusable across elections
- Logical vote lock via `hasVoted[electionId][voter]`
- On-demand winner declaration
- Multi-election architecture with `electionId`

---

## 1) Project Architecture

### 1.1 High-level layers
1. **Frontend (React/Vite)**: user interaction, wallet connection, form handling, IPFS uploads
2. **Smart contracts (Ethereum/Ganache)**: governance rules and election logic
3. **Token layer (ERC-20)**: voter eligibility and voting power
4. **IPFS layer (Filebase)**: candidate media/documents off-chain storage

### 1.2 Repository structure
- `Backend/`
  - `contracts/VotingToken.sol`
  - `contracts/ElectionManager.sol`
  - `scripts/deploy.js`
  - `test/ElectionManager.test.js`
  - `hardhat.config.js`
- `Frontend/`
  - `src/App.jsx` (main dApp flow)
  - `src/lib/web3.js` (ethers + contract instances)
  - `src/lib/ipfs.js` (Filebase upload helpers)
  - `src/contracts/*.json` (generated addresses + ABIs)
  - `.env` (Vite env variables for IPFS)

---

## 2) Smart Contract Design (In Depth)

## 2.1 `VotingToken.sol`
Purpose:
- ERC-20 token used strictly as voting eligibility token

Key behavior:
- Token has one trusted minter (`ElectionManager`)
- `setMinter()` can be set only once by token owner
- `mint(to, amount)` callable only by configured minter

Design reason:
- DAO members do **not** mint directly on token contract
- They call `ElectionManager.assignVotingPower()`, and manager mints internally
- This keeps role control centralized in the manager logic

## 2.2 `ElectionManager.sol`
Purpose:
- Core governance + election lifecycle

Core data model:
- `isDAO[address]`: DAO membership
- `daoCount`: active DAO members
- `elections[electionId]`: election metadata
  - `exists`
  - `votingActive`
  - `deadline` (future feature)
  - `candidateCount`
- `Candidate` per election:
  - `name`, `symbol`
  - `ipfsImageCid`, `ipfsDocsCid`
  - `status`: Pending / Approved / Rejected
  - `voteCount`
- `hasVoted[electionId][voter]`: logical lock (one vote per election)
- DAO decision tracking:
  - `approvals[electionId][candidateId]`
  - `rejections[electionId][candidateId]`
  - `daoDecision[electionId][candidateId][dao]` (single decision per DAO member)

Key rules implemented:
1. **DAO-only actions**
   - add/remove DAO member
   - create election
   - candidate approve/reject decision
   - start/end voting
   - assign voting power
   - declare result
2. **Role separation**
   - DAO cannot become voter (`assignVotingPower` rejects DAO addresses)
   - DAO cannot cast votes (`vote` rejects DAO addresses)
3. **Majority logic**
   - threshold is dynamic: `(daoCount / 2) + 1`
4. **Vote constraints**
   - election must exist and be active
   - voter must hold at least 1 token
   - voter must not have already voted in that election
   - candidate must be approved
5. **Deadline future support**
   - `deadline` field stored
   - commented require for future auto-enforcement
6. **Result**
   - `getWinner(electionId)` computes winner on-demand
   - `declareResult(electionId)` emits `WinnerDeclared`

### 2.3 Events emitted (for frontend observability)
- `DaoMemberAdded`
- `DaoMemberRemoved`
- `ElectionCreated`
- `CandidateApplied`
- `CandidateApproved`
- `CandidateRejected`
- `VotingStarted`
- `VoteCast`
- `VotingEnded`
- `WinnerDeclared`

---

## 3) Frontend Flow (In Depth)

Main UI file: `Frontend/src/App.jsx`

## 3.1 Wallet and network bootstrap
When user clicks **Connect Wallet**:
1. Connects MetaMask
2. Reads connected address
3. Checks `isDAO(address)` from contract
4. Reads token balance
5. Reads DAO count and majority threshold
6. Reads election details for selected `electionId`
7. Loads candidate list for that election
8. Shows connected `chainId` vs expected `chainId`

This helps detect:
- wrong network in MetaMask
- non-DAO role (hence no DAO panel)
- non-existing election selection

## 3.2 DAO panel flow
Visible only when connected address is DAO.

Actions:
1. **Add DAO member**
   - calls `addDaoMember(address)`
2. **Assign voting power**
   - calls `assignVotingPower(voterAddress)`
   - internally mints 1 token for that non-DAO voter
3. **Create election**
   - calls `createElection(deadline)`
4. **Start/End voting**
   - `startVoting(electionId)`
   - `endVoting(electionId)`
5. **Declare result**
   - `declareResult(electionId)`

## 3.3 Candidate application flow
For selected election:
1. User fills candidate name and symbol
2. Uploads image file and document file
3. Frontend uploads both files to Filebase IPFS
4. Receives CIDs (`Hash`)
5. Calls `applyCandidate(electionId, name, symbol, imageCid, docsCid)`

Validation improvements:
- Frontend checks election exists before sending tx
- Gives readable errors for revert/estimateGas failures

## 3.4 Candidate decision flow (DAO)
1. DAO member sees pending candidates
2. Approves or rejects candidate
3. Contract counts approvals/rejections
4. Status flips automatically when threshold reached

## 3.5 Voting flow (voter)
1. Voter (non-DAO) with token chooses approved candidate
2. Calls `vote(electionId, candidateId)`
3. Contract sets `hasVoted[electionId][voter] = true`
4. Candidate vote count increments

---

## 4) IPFS/Filebase Integration

Frontend env vars used:
- `VITE_IPFS_GATEWAY=https://ipfs.filebase.io/ipfs/`
- `VITE_IPFS_RPC_URL=https://rpc.filebase.io`
- `VITE_IPFS_RPC_AUTH=...`
- `VITE_PUBLIC_WEB_URL=...`

Upload logic (`Frontend/src/lib/ipfs.js`):
1. Build `FormData` with `file`
2. POST to `${VITE_IPFS_RPC_URL}/api/v0/add`
3. Add header:
   - `Authorization: Bearer ${VITE_IPFS_RPC_AUTH}`
4. Read `res.data.Hash` as CID

Display URLs:
- image/docs URL = `${VITE_IPFS_GATEWAY}${cid}`

---

## 5) Deployment and Environment

## 5.1 `hardhat.config.js`
Configured networks:
- `localhost`: `http://127.0.0.1:8545`
- `ganache`: defaults to `http://127.0.0.1:7545` (env-overridable)
- `sepolia`: env-driven RPC + private key

Notes:
- `PRIVATE_KEY` fallback is supported
- dedicated `GANACHE_PRIVATE_KEY` / `SEPOLIA_PRIVATE_KEY` also supported

## 5.2 Deploy script behavior
`Backend/scripts/deploy.js`:
1. Deploys `VotingToken`
2. Deploys `ElectionManager(tokenAddress, initialDaoMembers)`
3. Sets token minter to election manager
4. Writes frontend artifacts:
   - `Frontend/src/contracts/addresses.json`
   - `Frontend/src/contracts/VotingToken.abi.json`
   - `Frontend/src/contracts/ElectionManager.abi.json`

Local helper:
- If no `INITIAL_DAO_MEMBERS` and network is local, script tries to auto-add up to 4 extra DAO members from available signers.

---

## 6) How to Run (Recommended Flow)

### 6.1 Backend
From `Backend/`:

```bash
npm install
npm test
```

Deploy to Ganache:

```bash
npm run deploy:ganache
```

### 6.2 Frontend
From `Frontend/`:

```bash
npm install
npm run dev
```

Open:
- `http://localhost:5173`

---

## 7) Functional Usage Walkthrough

1. Connect MetaMask on correct network
2. Ensure connected wallet is DAO (or switch to DAO address)
3. DAO creates election
4. Candidate applies (name, symbol, image, docs)
5. DAO approves candidate by majority
6. DAO assigns voting token to voter addresses
7. DAO starts voting
8. Voters cast one vote each
9. DAO ends voting
10. DAO declares result

---

## 8) Testing Coverage

`Backend/test/ElectionManager.test.js` validates:
- DAO setup and threshold
- DAO/voter role separation
- one-time voting power assignment
- only DAO can start/end voting
- majority approval logic
- one vote per voter per election

---

## 9) Common Issues and Fixes

## 9.1 DAO dashboard not visible
Cause:
- Connected wallet is not DAO on current contract deployment

Fix:
- Switch to deployer/DAO wallet
- Or use DAO wallet to add your address via **Add DAO member**

## 9.2 `missing revert data` / estimateGas error on `applyCandidate`
Most likely causes:
- selected `electionId` does not exist
- wrong network in MetaMask

Fix:
- Create election first
- choose valid election ID
- ensure connected chain matches expected chain

## 9.3 Contract mismatch in frontend
Cause:
- frontend still has old ABIs/addresses

Fix:
- redeploy backend
- verify `Frontend/src/contracts/addresses.json` got updated

---

## 10) Security and Production Notes

- Never commit real private keys
- Rotate keys if exposed
- For production, use:
  - event-indexing service (The Graph/custom backend)
  - stronger validation + access governance policies
  - optional deadline auto-close activation
  - audit pass for contracts

---

## 11) Current Feature Completion vs Requirements

Implemented:
- DAO-controlled election lifecycle
- ERC-20 voting token with manager-controlled mint
- Role separation: DAO vs voters
- multi-election with election IDs
- candidate IPFS image/docs storage via CID
- majority approve/reject
- one-vote-per-election lock
- manual start/end voting
- on-demand winner declaration
- required event emissions
- basic frontend flows for DAO/candidate/voter

Not included by design:
- NFT identity
- commit-reveal anonymous voting


