import axios from "axios";

export async function uploadToFilebaseIpfs(file) {
  if (!file) throw new Error("No file provided");

  const rpcUrl = import.meta.env.VITE_IPFS_RPC_URL;
  const auth = import.meta.env.VITE_IPFS_RPC_AUTH;
  if (!rpcUrl) throw new Error("Missing VITE_IPFS_RPC_URL");
  if (!auth) throw new Error("Missing VITE_IPFS_RPC_AUTH");

  const formData = new FormData();
  formData.append("file", file);

  const res = await axios.post(`${rpcUrl}/api/v0/add`, formData, {
    headers: {
      Authorization: `Bearer ${auth}`,
    },
  });

  const cid = res?.data?.Hash;
  if (!cid) throw new Error("IPFS upload did not return a CID");
  return cid;
}

export function cidToGatewayUrl(cid) {
  const gateway = import.meta.env.VITE_IPFS_GATEWAY;
  if (!gateway) throw new Error("Missing VITE_IPFS_GATEWAY");
  return `${gateway}${cid}`;
}

