import Card from "../components/ui/Card";
import ConnectionPanel from "../components/panels/ConnectionPanel";
import ElectionPanel from "../components/panels/ElectionPanel";
import Button from "../components/ui/Button";
import { useVotingAppContext } from "../hooks/VotingAppContext";

export default function ResultsPage() {
  const app = useVotingAppContext();
  return (
    <div className="container">
      {!app.canUseContracts && <div className="warning">Deploy contracts first. Missing ABI/address files in `src/contracts`.</div>}
      <ConnectionPanel app={app} />
      {app.status && <div className="status">{app.status}</div>}
      <ElectionPanel app={app} />
      <Card title="Results">
        <div className="row">
          <Button variant="secondary" onClick={app.declareResult} disabled={!app.isDao}>Declare Result (DAO)</Button>
          {app.winner ? (
            <div className="badge badge-success">
              Winner: Candidate #{app.winner.winnerCandidateId} with {app.winner.winnerVotes} votes
            </div>
          ) : (
            <div className="helper-text">No winner declared yet for this election.</div>
          )}
        </div>
      </Card>
    </div>
  );
}

