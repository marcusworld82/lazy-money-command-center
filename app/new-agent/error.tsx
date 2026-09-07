"use client";

export default function NewAgentError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="zy-modal-scrim">
      <div className="zy-agent-modal">
        <h1>Could not open this agent</h1>
        <p className="zy-agent-note">The demo roster or a missing Supabase row tripped the page. Open a new agent instead of this broken edit link.</p>
        <footer>
          <a href="/new-agent">New agent</a>
          <button type="button" onClick={() => reset()}>Try again</button>
        </footer>
      </div>
    </div>
  );
}
