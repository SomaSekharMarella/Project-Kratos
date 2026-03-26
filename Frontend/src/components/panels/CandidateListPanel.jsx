import Card from "../ui/Card";
import Button from "../ui/Button";
import Badge from "../ui/Badge";

export default function CandidateListPanel({ app, votingOnly = false, adminOnly = false }) {
  const filtered = app.candidates.filter((c) => {
    if (votingOnly) return c.status === 1;
    if (adminOnly) return c.status === 0;
    return true;
  });

  return (
    <Card title="Candidates">
      {filtered.length === 0 ? (
        <div className="helper-text">No candidates found for this election.</div>
      ) : (
        <div className="candidateList">
          {filtered.map((c) => (
            <div key={c.id} className="candidate">
              <div className="row space">
                <div className="title">#{c.id} {c.name} ({c.symbol})</div>
                <Badge>{app.statusLabel(c.status)}</Badge>
              </div>
              <div className="meta mono">Applicant: {c.applicant}</div>
              <div className="row">
                {c.imageCid && <a href={app.cidToGatewayUrl(c.imageCid)} target="_blank" rel="noreferrer">View Photo</a>}
                {c.docsCid && <a href={app.cidToGatewayUrl(c.docsCid)} target="_blank" rel="noreferrer">View Docs</a>}
                <Badge>Votes: {c.voteCount}</Badge>
              </div>
              <div className="row">
                {app.isDao && c.status === 0 && (
                  <>
                    <Button onClick={() => app.decideCandidate(c.id, true)}>Approve</Button>
                    <Button variant="danger" onClick={() => app.decideCandidate(c.id, false)}>Reject</Button>
                  </>
                )}
                {!app.isDao && c.status === 1 && (
                  <Button variant="primary" onClick={() => app.vote(c.id)} disabled={!app.address}>Vote</Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

