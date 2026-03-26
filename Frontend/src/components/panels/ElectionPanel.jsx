import Card from "../ui/Card";
import Button from "../ui/Button";
import Badge from "../ui/Badge";

function Info({ label, value }) {
  return (
    <div>
      <div className="label">{label}</div>
      <div>{value}</div>
    </div>
  );
}

export default function ElectionPanel({ app }) {
  return (
    <Card title="Election">
      <div className="row">
        <label>
          Election ID
          <input value={app.electionId} onChange={(e) => app.setElectionId(e.target.value)} />
        </label>
        <Button onClick={app.refreshAll} disabled={!app.address}>Refresh</Button>
        {app.isDao && <Button onClick={app.createElection} disabled={!app.address}>Create New Election</Button>}
      </div>
      <div className="grid">
        <Info label="Exists" value={app.electionInfo ? String(app.electionInfo.exists) : "-"} />
        <Info label="Voting active" value={app.electionInfo ? String(app.electionInfo.votingActive) : "-"} />
        <Info label="Candidate count" value={app.electionInfo ? app.electionInfo.candidateCount : "-"} />
      </div>
      {app.isDao && (
        <div className="row mt">
          <Button onClick={app.startVoting}>Start Voting</Button>
          <Button onClick={app.endVoting}>End Voting</Button>
          <Button variant="secondary" onClick={app.declareResult}>Declare Result</Button>
          {app.winner && <Badge tone="success">Winner #{app.winner.winnerCandidateId} ({app.winner.winnerVotes} votes)</Badge>}
        </div>
      )}
    </Card>
  );
}

