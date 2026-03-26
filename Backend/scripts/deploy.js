const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

function parseInitialDaoMembers() {
  const raw = process.env.INITIAL_DAO_MEMBERS || "";
  const parts = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return parts;
}

async function defaultLocalDaoMembers(deployerAddress) {
  // For local networks, if INITIAL_DAO_MEMBERS isn't provided,
  // automatically use the next 4 accounts so you get 5 DAO members total.
  // (deployer is always included inside the contract constructor)
  const signers = await hre.ethers.getSigners();
  const members = [];
  for (let i = 0; i < signers.length && members.length < 4; i++) {
    const addr = await signers[i].getAddress();
    if (addr.toLowerCase() === deployerAddress.toLowerCase()) continue;
    members.push(addr);
  }
  return members;
}

async function writeFrontendArtifacts({ tokenAddress, electionManagerAddress }) {
  const outDir = path.resolve(__dirname, "..", "..", "Frontend", "src", "contracts");
  fs.mkdirSync(outDir, { recursive: true });

  const tokenArtifact = await hre.artifacts.readArtifact("VotingToken");
  const electionArtifact = await hre.artifacts.readArtifact("ElectionManager");
  const net = await hre.ethers.provider.getNetwork();

  fs.writeFileSync(
    path.join(outDir, "addresses.json"),
    JSON.stringify(
      {
        VotingToken: tokenAddress,
        ElectionManager: electionManagerAddress,
        chainId: Number(net.chainId),
        network: hre.network.name,
      },
      null,
      2
    )
  );

  fs.writeFileSync(path.join(outDir, "VotingToken.abi.json"), JSON.stringify(tokenArtifact.abi, null, 2));
  fs.writeFileSync(
    path.join(outDir, "ElectionManager.abi.json"),
    JSON.stringify(electionArtifact.abi, null, 2)
  );
}

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("Network:", hre.network.name);

  const VotingToken = await hre.ethers.getContractFactory("VotingToken");
  const votingToken = await VotingToken.deploy("VotingToken", "VOTE");
  await votingToken.waitForDeployment();

  const tokenAddress = await votingToken.getAddress();
  console.log("VotingToken deployed:", tokenAddress);

  let initialDaoMembers = parseInitialDaoMembers();
  if (initialDaoMembers.length === 0 && ["hardhat", "localhost", "ganache"].includes(hre.network.name)) {
    initialDaoMembers = await defaultLocalDaoMembers(deployer.address);
    console.log("Auto initial DAO members:", initialDaoMembers);
  } else {
    console.log("Env initial DAO members:", initialDaoMembers);
  }

  const ElectionManager = await hre.ethers.getContractFactory("ElectionManager");
  const electionManager = await ElectionManager.deploy(tokenAddress, initialDaoMembers);
  await electionManager.waitForDeployment();

  const electionManagerAddress = await electionManager.getAddress();
  console.log("ElectionManager deployed:", electionManagerAddress);

  const setMinterTx = await votingToken.setMinter(electionManagerAddress);
  await setMinterTx.wait();
  console.log("VotingToken minter set to ElectionManager");

  await writeFrontendArtifacts({ tokenAddress, electionManagerAddress });
  console.log("Frontend artifacts written to Frontend/src/contracts/");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

