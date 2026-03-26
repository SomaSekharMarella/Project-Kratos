import { BrowserProvider, Contract, formatEther } from "ethers";

import addresses from "../contracts/addresses.json";
import electionAbi from "../contracts/ElectionManager.abi.json";
import tokenAbi from "../contracts/VotingToken.abi.json";

export function hasDeployedAddresses() {
  return (
    addresses?.ElectionManager &&
    addresses?.VotingToken &&
    addresses.ElectionManager !== "0x0000000000000000000000000000000000000000" &&
    addresses.VotingToken !== "0x0000000000000000000000000000000000000000" &&
    Array.isArray(electionAbi) &&
    electionAbi.length > 0 &&
    Array.isArray(tokenAbi) &&
    tokenAbi.length > 0
  );
}

export async function getBrowserSigner() {
  if (!window.ethereum) throw new Error("MetaMask not found (window.ethereum missing)");
  const provider = new BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  return await provider.getSigner();
}

export async function getBrowserNetwork() {
  if (!window.ethereum) throw new Error("MetaMask not found (window.ethereum missing)");
  const provider = new BrowserProvider(window.ethereum);
  return await provider.getNetwork();
}

export function getExpectedChainId() {
  return typeof addresses?.chainId === "number" ? addresses.chainId : null;
}

export async function getContracts() {
  const signer = await getBrowserSigner();
  const electionManager = new Contract(addresses.ElectionManager, electionAbi, signer);
  const votingToken = new Contract(addresses.VotingToken, tokenAbi, signer);
  return { signer, electionManager, votingToken };
}

export async function getConnectedAddress() {
  const signer = await getBrowserSigner();
  return await signer.getAddress();
}

export async function getTokenBalanceHuman(votingToken, address) {
  const bal = await votingToken.balanceOf(address);
  return formatEther(bal);
}

