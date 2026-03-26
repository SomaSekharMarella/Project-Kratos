// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {VotingToken} from "./VotingToken.sol";

contract ElectionManager {
    enum CandidateStatus {
        Pending,
        Approved,
        Rejected
    }

    struct Candidate {
        address applicant;
        string name;
        string symbol;
        string ipfsImageCid;
        string ipfsDocsCid;
        CandidateStatus status;
        uint256 voteCount;
    }

    struct Election {
        bool exists;
        bool votingActive;
        uint64 deadline;
        uint32 candidateCount;
    }

    event DaoMemberAdded(address indexed member);
    event DaoMemberRemoved(address indexed member);

    event ElectionCreated(uint256 indexed electionId, uint64 deadline);
    event CandidateApplied(uint256 indexed electionId, uint256 indexed candidateId, address indexed applicant);
    event CandidateApproved(uint256 indexed electionId, uint256 indexed candidateId);
    event CandidateRejected(uint256 indexed electionId, uint256 indexed candidateId);
    event VotingStarted(uint256 indexed electionId);
    event VoteCast(uint256 indexed electionId, address indexed voter, uint256 indexed candidateId);
    event VotingEnded(uint256 indexed electionId);
    event WinnerDeclared(uint256 indexed electionId, uint256 indexed winnerCandidateId, uint256 winnerVotes);

    error NotDao();
    error DaoCannotBeVoter();
    error ZeroAddress();
    error ElectionNotFound();
    error VotingAlreadyActive();
    error VotingNotActive();
    error CandidateNotFound();
    error CandidateNotPending();
    error CandidateNotApproved();
    error AlreadyDecided();
    error NotEligibleVoter();
    error AlreadyVoted();
    error VotingPowerAlreadyAssigned();
    error CannotRemoveLastDao();
    error CannotRemoveSelf();

    VotingToken public immutable votingToken;

    mapping(address => bool) public isDAO;
    uint256 public daoCount;

    uint256 public electionCount;
    mapping(uint256 => Election) public elections; // electionId => Election

    mapping(uint256 => mapping(uint256 => Candidate)) private _candidates; // electionId => candidateId => Candidate

    // voter assignment (mint only once, reusable across elections)
    mapping(address => bool) public votingPowerAssigned;

    // logical token lock: one vote per voter per election
    mapping(uint256 => mapping(address => bool)) public hasVoted; // electionId => voter => bool

    // DAO majority approvals/rejections per candidate per election
    mapping(uint256 => mapping(uint256 => uint256)) public approvals; // electionId => candidateId => approvals
    mapping(uint256 => mapping(uint256 => uint256)) public rejections; // electionId => candidateId => rejections
    mapping(uint256 => mapping(uint256 => mapping(address => uint8))) public daoDecision; // 0 none, 1 approve, 2 reject

    modifier onlyDAO() {
        if (!isDAO[msg.sender]) revert NotDao();
        _;
    }

    constructor(address tokenAddress, address[] memory initialDaoMembers) {
        if (tokenAddress == address(0)) revert ZeroAddress();
        votingToken = VotingToken(tokenAddress);

        _addDaoMember(msg.sender);
        for (uint256 i = 0; i < initialDaoMembers.length; i++) {
            address member = initialDaoMembers[i];
            if (member == address(0)) revert ZeroAddress();
            if (member == msg.sender) continue;
            if (!isDAO[member]) _addDaoMember(member);
        }
    }

    function addDaoMember(address member) external onlyDAO {
        if (member == address(0)) revert ZeroAddress();
        if (isDAO[member]) return;
        _addDaoMember(member);
    }

    function removeDaoMember(address member) external onlyDAO {
        if (!isDAO[member]) return;
        if (daoCount <= 1) revert CannotRemoveLastDao();
        if (member == msg.sender) revert CannotRemoveSelf();

        isDAO[member] = false;
        daoCount -= 1;
        emit DaoMemberRemoved(member);
    }

    function _addDaoMember(address member) internal {
        isDAO[member] = true;
        daoCount += 1;
        emit DaoMemberAdded(member);
    }

    function majorityThreshold() public view returns (uint256) {
        return (daoCount / 2) + 1;
    }

    function createElection(uint64 deadline) external onlyDAO returns (uint256 electionId) {
        electionId = ++electionCount;
        elections[electionId] = Election({exists: true, votingActive: false, deadline: deadline, candidateCount: 0});
        emit ElectionCreated(electionId, deadline);
    }

    function assignVotingPower(address voter) external onlyDAO {
        if (voter == address(0)) revert ZeroAddress();
        if (isDAO[voter]) revert DaoCannotBeVoter();
        if (votingPowerAssigned[voter]) revert VotingPowerAlreadyAssigned();

        votingPowerAssigned[voter] = true;
        votingToken.mint(voter, 1e18);
    }

    function applyCandidate(
        uint256 electionId,
        string calldata name,
        string calldata symbol,
        string calldata ipfsImageCid,
        string calldata ipfsDocsCid
    ) external returns (uint256 candidateId) {
        Election storage e = elections[electionId];
        if (!e.exists) revert ElectionNotFound();

        candidateId = ++e.candidateCount;
        _candidates[electionId][candidateId] = Candidate({
            applicant: msg.sender,
            name: name,
            symbol: symbol,
            ipfsImageCid: ipfsImageCid,
            ipfsDocsCid: ipfsDocsCid,
            status: CandidateStatus.Pending,
            voteCount: 0
        });

        emit CandidateApplied(electionId, candidateId, msg.sender);
    }

    function getCandidate(uint256 electionId, uint256 candidateId) external view returns (Candidate memory) {
        if (!elections[electionId].exists) revert ElectionNotFound();
        if (candidateId == 0 || candidateId > elections[electionId].candidateCount) revert CandidateNotFound();
        return _candidates[electionId][candidateId];
    }

    function castCandidateDecision(uint256 electionId, uint256 candidateId, bool approve) external onlyDAO {
        Election storage e = elections[electionId];
        if (!e.exists) revert ElectionNotFound();
        if (candidateId == 0 || candidateId > e.candidateCount) revert CandidateNotFound();

        Candidate storage c = _candidates[electionId][candidateId];
        if (c.status != CandidateStatus.Pending) revert CandidateNotPending();

        if (daoDecision[electionId][candidateId][msg.sender] != 0) revert AlreadyDecided();

        uint8 decision = approve ? 1 : 2;
        daoDecision[electionId][candidateId][msg.sender] = decision;

        uint256 threshold = majorityThreshold();
        if (approve) {
            uint256 newApprovals = ++approvals[electionId][candidateId];
            if (newApprovals >= threshold) {
                c.status = CandidateStatus.Approved;
                emit CandidateApproved(electionId, candidateId);
            }
        } else {
            uint256 newRejections = ++rejections[electionId][candidateId];
            if (newRejections >= threshold) {
                c.status = CandidateStatus.Rejected;
                emit CandidateRejected(electionId, candidateId);
            }
        }
    }

    function startVoting(uint256 electionId) external onlyDAO {
        Election storage e = elections[electionId];
        if (!e.exists) revert ElectionNotFound();
        if (e.votingActive) revert VotingAlreadyActive();
        e.votingActive = true;
        emit VotingStarted(electionId);
    }

    function endVoting(uint256 electionId) external onlyDAO {
        Election storage e = elections[electionId];
        if (!e.exists) revert ElectionNotFound();
        if (!e.votingActive) revert VotingNotActive();
        e.votingActive = false;
        emit VotingEnded(electionId);
    }

    function vote(uint256 electionId, uint256 candidateId) external {
        Election storage e = elections[electionId];
        if (!e.exists) revert ElectionNotFound();
        if (!e.votingActive) revert VotingNotActive();

        // Future feature: enable automatic deadline enforcement
        // require(block.timestamp <= e.deadline, "Voting deadline passed");

        if (isDAO[msg.sender]) revert DaoCannotBeVoter();
        if (votingToken.balanceOf(msg.sender) < 1e18) revert NotEligibleVoter();
        if (hasVoted[electionId][msg.sender]) revert AlreadyVoted();
        if (candidateId == 0 || candidateId > e.candidateCount) revert CandidateNotFound();

        Candidate storage c = _candidates[electionId][candidateId];
        if (c.status != CandidateStatus.Approved) revert CandidateNotApproved();

        hasVoted[electionId][msg.sender] = true;
        c.voteCount += 1;
        emit VoteCast(electionId, msg.sender, candidateId);
    }

    function getWinner(uint256 electionId) public view returns (uint256 winnerCandidateId, uint256 winnerVotes) {
        Election storage e = elections[electionId];
        if (!e.exists) revert ElectionNotFound();

        uint256 count = e.candidateCount;
        for (uint256 i = 1; i <= count; i++) {
            Candidate storage c = _candidates[electionId][i];
            if (c.status != CandidateStatus.Approved) continue;
            uint256 v = c.voteCount;
            if (v > winnerVotes) {
                winnerVotes = v;
                winnerCandidateId = i;
            }
        }
    }

    function declareResult(uint256 electionId)
        external
        onlyDAO
        returns (uint256 winnerCandidateId, uint256 winnerVotes)
    {
        (winnerCandidateId, winnerVotes) = getWinner(electionId);
        emit WinnerDeclared(electionId, winnerCandidateId, winnerVotes);
    }
}

