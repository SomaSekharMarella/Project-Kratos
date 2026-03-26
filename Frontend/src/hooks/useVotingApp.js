import { useEffect, useMemo, useState } from "react";
import { cidToGatewayUrl, uploadToFilebaseIpfs } from "../lib/ipfs";
import { getBrowserNetwork, getContracts, getExpectedChainId, getTokenBalanceHuman, hasDeployedAddresses } from "../lib/web3";
import { useErrorMessage } from "./useErrorMessage";

export function useVotingApp() {
  const { getReadableError } = useErrorMessage();

  const [status, setStatus] = useState("");
  const [address, setAddress] = useState("");
  const [isDao, setIsDao] = useState(false);
  const [tokenBal, setTokenBal] = useState("0");
  const [daoCount, setDaoCount] = useState(null);
  const [daoThreshold, setDaoThreshold] = useState(null);
  const [chainInfo, setChainInfo] = useState({ connected: null, expected: getExpectedChainId() });
  const [electionId, setElectionId] = useState("1");
  const [electionInfo, setElectionInfo] = useState(null);
  const [candidateForm, setCandidateForm] = useState({ name: "", symbol: "", imageFile: null, docsFile: null });
  const [candidates, setCandidates] = useState([]);
  const [voterToAssign, setVoterToAssign] = useState("");
  const [daoToAdd, setDaoToAdd] = useState("");
  const [winner, setWinner] = useState(null);

  const canUseContracts = useMemo(() => hasDeployedAddresses(), []);
  const electionExists = Boolean(electionInfo?.exists);
  const networkMismatch = Boolean(chainInfo.connected) && Boolean(chainInfo.expected) && chainInfo.connected !== chainInfo.expected;

  const statusLabel = (statusNum) => (statusNum === 0 ? "Pending" : statusNum === 1 ? "Approved" : statusNum === 2 ? "Rejected" : `Unknown(${statusNum})`);

  async function ensureElectionExists(id, electionManager) {
    const e = await electionManager.elections(id);
    if (!e[0]) throw new Error(`Election ${id.toString()} does not exist. Ask DAO to create it first.`);
  }

  async function refreshAll() {
    if (!canUseContracts) return;
    const net = await getBrowserNetwork();
    setChainInfo({ connected: Number(net.chainId), expected: getExpectedChainId() });

    const { signer, electionManager, votingToken } = await getContracts();
    const addr = await signer.getAddress();
    setAddress(addr);
    setIsDao(await electionManager.isDAO(addr));
    setTokenBal(await getTokenBalanceHuman(votingToken, addr));
    setDaoCount(Number(await electionManager.daoCount()));
    setDaoThreshold(Number(await electionManager.majorityThreshold()));

    const id = BigInt(electionId || "0");
    if (id > 0n) {
      const e = await electionManager.elections(id);
      setElectionInfo({ exists: e[0], votingActive: e[1], deadline: e[2].toString(), candidateCount: Number(e[3]) });
      const list = [];
      for (let i = 1; i <= Number(e[3]); i++) {
        const c = await electionManager.getCandidate(id, i);
        list.push({ id: i, applicant: c[0], name: c[1], symbol: c[2], imageCid: c[3], docsCid: c[4], status: Number(c[5]), voteCount: Number(c[6]) });
      }
      setCandidates(list);
    }
  }

  useEffect(() => {
    if (!canUseContracts) return;
    refreshAll().catch((e) => setStatus(getReadableError(e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [electionId, canUseContracts]);

  async function txWrap(action) {
    try {
      setStatus("");
      await action();
      await refreshAll();
    } catch (e) {
      setStatus(getReadableError(e));
    }
  }

  async function connect() {
    await refreshAll().catch((e) => setStatus(getReadableError(e)));
  }

  async function createElection() {
    await txWrap(async () => (await (await (await getContracts()).electionManager.createElection(0)).wait()));
  }

  async function startVoting() {
    await txWrap(async () => (await (await (await getContracts()).electionManager.startVoting(BigInt(electionId))).wait()));
  }

  async function endVoting() {
    await txWrap(async () => (await (await (await getContracts()).electionManager.endVoting(BigInt(electionId))).wait()));
  }

  async function addDaoMember() {
    await txWrap(async () => (await (await (await getContracts()).electionManager.addDaoMember(daoToAdd)).wait()));
    setDaoToAdd("");
  }

  async function assignVotingPower() {
    await txWrap(async () => (await (await (await getContracts()).electionManager.assignVotingPower(voterToAssign)).wait()));
    setVoterToAssign("");
  }

  async function decideCandidate(candidateId, approve) {
    await txWrap(async () => (await (await (await getContracts()).electionManager.castCandidateDecision(BigInt(electionId), candidateId, approve)).wait()));
  }

  async function applyCandidate() {
    await txWrap(async () => {
      if (networkMismatch) throw new Error("Wrong network in MetaMask.");
      const id = BigInt(electionId);
      const { electionManager } = await getContracts();
      await ensureElectionExists(id, electionManager);
      const imageCid = await uploadToFilebaseIpfs(candidateForm.imageFile);
      const docsCid = await uploadToFilebaseIpfs(candidateForm.docsFile);
      await (await electionManager.applyCandidate(id, candidateForm.name, candidateForm.symbol, imageCid, docsCid)).wait();
      setCandidateForm({ name: "", symbol: "", imageFile: null, docsFile: null });
    });
  }

  async function vote(candidateId) {
    await txWrap(async () => (await (await (await getContracts()).electionManager.vote(BigInt(electionId), candidateId)).wait()));
  }

  async function declareResult() {
    await txWrap(async () => {
      const { electionManager } = await getContracts();
      const tx = await electionManager.declareResult(BigInt(electionId));
      const rcpt = await tx.wait();
      const evt = rcpt.logs?.find((l) => l.fragment && l.fragment.name === "WinnerDeclared");
      if (evt) setWinner({ winnerCandidateId: Number(evt.args.winnerCandidateId), winnerVotes: Number(evt.args.winnerVotes) });
    });
  }

  return {
    status,
    setStatus,
    address,
    isDao,
    tokenBal,
    daoCount,
    daoThreshold,
    chainInfo,
    electionId,
    setElectionId,
    electionInfo,
    candidateForm,
    setCandidateForm,
    candidates,
    voterToAssign,
    setVoterToAssign,
    daoToAdd,
    setDaoToAdd,
    winner,
    canUseContracts,
    electionExists,
    networkMismatch,
    statusLabel,
    connect,
    refreshAll,
    createElection,
    startVoting,
    endVoting,
    addDaoMember,
    assignVotingPower,
    decideCandidate,
    applyCandidate,
    vote,
    declareResult,
    cidToGatewayUrl,
  };
}

