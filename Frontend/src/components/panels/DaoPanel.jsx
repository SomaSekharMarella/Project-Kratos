import Card from "../ui/Card";
import Button from "../ui/Button";

export default function DaoPanel({ app }) {
  if (!app.isDao) return null;

  return (
    <Card title="DAO Panel">
      <div className="row">
        <label>
          Add DAO member address
          <input value={app.daoToAdd} onChange={(e) => app.setDaoToAdd(e.target.value)} placeholder="0x..." />
        </label>
        <Button onClick={app.addDaoMember} disabled={!app.daoToAdd}>Add DAO</Button>
      </div>
      <div className="row">
        <label>
          Assign voting power (1 token)
          <input value={app.voterToAssign} onChange={(e) => app.setVoterToAssign(e.target.value)} placeholder="0x..." />
        </label>
        <Button onClick={app.assignVotingPower} disabled={!app.voterToAssign}>Assign</Button>
      </div>
    </Card>
  );
}

