const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("ElectionManager", function () {
  async function deployFixture() {
    const signers = await ethers.getSigners();
    const [deployer, dao2, dao3, dao4, dao5, voter1, voter2, candidate1] = signers;

    const VotingToken = await ethers.getContractFactory("VotingToken");
    const token = await VotingToken.deploy("VotingToken", "VOTE");
    await token.waitForDeployment();

    const ElectionManager = await ethers.getContractFactory("ElectionManager");
    const manager = await ElectionManager.deploy(await token.getAddress(), [
      dao2.address,
      dao3.address,
      dao4.address,
      dao5.address,
    ]);
    await manager.waitForDeployment();

    await (await token.setMinter(await manager.getAddress())).wait();

    return { token, manager, deployer, dao2, dao3, dao4, dao5, voter1, voter2, candidate1 };
  }

  it("sets deployer and initial DAO members", async function () {
    const { manager, deployer, dao2 } = await loadFixture(deployFixture);
    expect(await manager.isDAO(deployer.address)).to.equal(true);
    expect(await manager.isDAO(dao2.address)).to.equal(true);
    expect(await manager.daoCount()).to.equal(5);
    expect(await manager.majorityThreshold()).to.equal(3);
  });

  it("prevents assigning voting power to DAO members", async function () {
    const { manager, dao2 } = await loadFixture(deployFixture);
    await expect(manager.assignVotingPower(dao2.address)).to.be.revertedWithCustomError(
      manager,
      "DaoCannotBeVoter"
    );
  });

  it("allows DAO to assign exactly once and voter must hold token", async function () {
    const { manager, token, dao2, voter1 } = await loadFixture(deployFixture);

    await expect(manager.connect(dao2).assignVotingPower(voter1.address)).not.to.be.reverted;
    expect(await token.balanceOf(voter1.address)).to.equal(ethers.parseEther("1"));

    await expect(manager.connect(dao2).assignVotingPower(voter1.address)).to.be.revertedWithCustomError(
      manager,
      "VotingPowerAlreadyAssigned"
    );
  });

  it("requires DAO to start/end voting; non-DAO cannot", async function () {
    const { manager, voter1, dao2 } = await loadFixture(deployFixture);
    const tx = await manager.connect(dao2).createElection(0);
    const receipt = await tx.wait();
    const electionId = receipt.logs.find((l) => l.fragment && l.fragment.name === "ElectionCreated").args.electionId;

    await expect(manager.connect(voter1).startVoting(electionId)).to.be.revertedWithCustomError(manager, "NotDao");
    await expect(manager.connect(dao2).startVoting(electionId)).not.to.be.reverted;
    await expect(manager.connect(voter1).endVoting(electionId)).to.be.revertedWithCustomError(manager, "NotDao");
    await expect(manager.connect(dao2).endVoting(electionId)).not.to.be.reverted;
  });

  it("approves a candidate via DAO majority (>= threshold) and enforces one vote per election", async function () {
    const { manager, dao2, dao3, dao4, voter1, token, candidate1 } = await loadFixture(deployFixture);

    const createTx = await manager.connect(dao2).createElection(0);
    const createRcpt = await createTx.wait();
    const electionId = createRcpt.logs.find((l) => l.fragment && l.fragment.name === "ElectionCreated").args
      .electionId;

    const applyTx = await manager
      .connect(candidate1)
      .applyCandidate(electionId, "Alice", "A", "cidImage", "cidDocs");
    const applyRcpt = await applyTx.wait();
    const candidateId = applyRcpt.logs.find((l) => l.fragment && l.fragment.name === "CandidateApplied").args
      .candidateId;

    await expect(manager.connect(dao2).castCandidateDecision(electionId, candidateId, true)).not.to.be.reverted;
    await expect(manager.connect(dao3).castCandidateDecision(electionId, candidateId, true)).not.to.be.reverted;
    await expect(manager.connect(dao4).castCandidateDecision(electionId, candidateId, true))
      .to.emit(manager, "CandidateApproved")
      .withArgs(electionId, candidateId);

    await (await manager.connect(dao2).assignVotingPower(voter1.address)).wait();
    expect(await token.balanceOf(voter1.address)).to.equal(ethers.parseEther("1"));

    await (await manager.connect(dao2).startVoting(electionId)).wait();

    await expect(manager.connect(voter1).vote(electionId, candidateId)).to.emit(manager, "VoteCast");
    await expect(manager.connect(voter1).vote(electionId, candidateId)).to.be.revertedWithCustomError(
      manager,
      "AlreadyVoted"
    );
  });
});

