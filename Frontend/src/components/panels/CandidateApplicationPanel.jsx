import Card from "../ui/Card";
import Button from "../ui/Button";

export default function CandidateApplicationPanel({ app }) {
  return (
    <Card title="Candidate Application">
      <div className="grid2">
        <label>Name<input value={app.candidateForm.name} onChange={(e) => app.setCandidateForm((p) => ({ ...p, name: e.target.value }))} /></label>
        <label>Symbol<input value={app.candidateForm.symbol} onChange={(e) => app.setCandidateForm((p) => ({ ...p, symbol: e.target.value }))} /></label>
        <label>Photo (IPFS)<input type="file" accept="image/*" onChange={(e) => app.setCandidateForm((p) => ({ ...p, imageFile: e.target.files?.[0] || null }))} /></label>
        <label>Documents (IPFS)<input type="file" onChange={(e) => app.setCandidateForm((p) => ({ ...p, docsFile: e.target.files?.[0] || null }))} /></label>
      </div>
      <Button
        variant="primary"
        onClick={app.applyCandidate}
        disabled={!app.address || !app.candidateForm.name || !app.candidateForm.symbol || !app.candidateForm.imageFile || !app.candidateForm.docsFile}
      >
        Apply as Candidate
      </Button>
      {!app.electionExists && <div className="helper-text">Selected election does not exist yet.</div>}
    </Card>
  );
}

