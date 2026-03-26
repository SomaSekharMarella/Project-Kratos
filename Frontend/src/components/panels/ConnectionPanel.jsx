import Card from "../ui/Card";
import Button from "../ui/Button";
import Badge from "../ui/Badge";

function Info({ label, value, mono = false }) {
  return (
    <div>
      <div className="label">{label}</div>
      <div className={mono ? "mono" : ""}>{value}</div>
    </div>
  );
}

export default function ConnectionPanel({ app }) {
  return (
    <Card title="Connection">
      <Button onClick={app.connect}>Connect Wallet</Button>
      <div className="grid">
        <Info label="Address" value={app.address || "-"} mono />
        <Info label="Role" value={app.address ? (app.isDao ? "DAO" : "Voter/Candidate") : "-"} />
        <Info label="VotingToken balance" value={app.address ? `${app.tokenBal} VOTE` : "-"} />
      </div>
      <div className="row mt">
        <Badge>DAO count: {app.daoCount ?? "-"}</Badge>
        <Badge>Majority threshold: {app.daoThreshold ?? "-"}</Badge>
        <Badge>Connected chainId: {app.chainInfo.connected ?? "-"}</Badge>
        <Badge>Expected chainId: {app.chainInfo.expected ?? "-"}</Badge>
        {app.networkMismatch && <Badge tone="warn">Wrong network in MetaMask</Badge>}
        {app.address && !app.isDao && <Badge tone="warn">Not a DAO member for this deployment</Badge>}
      </div>
    </Card>
  );
}

