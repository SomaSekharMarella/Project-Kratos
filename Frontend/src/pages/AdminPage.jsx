import CandidateListPanel from "../components/panels/CandidateListPanel";
import ConnectionPanel from "../components/panels/ConnectionPanel";
import DaoPanel from "../components/panels/DaoPanel";
import ElectionPanel from "../components/panels/ElectionPanel";
import { useVotingAppContext } from "../hooks/VotingAppContext";

export default function AdminPage() {
  const app = useVotingAppContext();
  return (
    <div className="container">
      {!app.canUseContracts && <div className="warning">Deploy contracts first. Missing ABI/address files in `src/contracts`.</div>}
      <ConnectionPanel app={app} />
      {app.status && <div className="status">{app.status}</div>}
      <ElectionPanel app={app} />
      <DaoPanel app={app} />
      <CandidateListPanel app={app} adminOnly />
    </div>
  );
}

