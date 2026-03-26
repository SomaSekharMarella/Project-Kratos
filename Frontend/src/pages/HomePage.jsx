import Card from "../components/ui/Card";

export default function HomePage() {
  return (
    <Card title="Welcome">
      <p className="helper-text">
        This is a DAO-governed decentralized voting app. Use the sidebar to navigate to Dashboard, Admin, Voting, and Results.
      </p>
    </Card>
  );
}

