import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-3xl mx-auto">
      <h1 className="text-5xl md:text-6xl font-serif text-vault-navy mb-6">
        Precision in Pitch Evaluation
      </h1>
      <p className="text-lg md:text-xl text-vault-muted mb-10 leading-relaxed font-sans max-w-2xl">
        PitchVault accelerates the judging process. Designed for clarity, structure, and impartial evaluation in high-stakes campus and venture competitions.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <Link
          href="/login"
          className="bg-vault-copper text-white px-8 py-3 rounded-md font-medium hover:bg-vault-copper-dark transition-colors"
        >
          Sign In
        </Link>
        <Link
          href="/register"
          className="bg-white text-vault-ink archival-border px-8 py-3 rounded-md font-medium hover:bg-vault-card transition-colors archival-shadow"
        >
          Create Account
        </Link>
      </div>

      <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
        <div className="p-6 bg-white archival-border rounded-lg archival-shadow">
          <h3 className="text-lg mb-2">Structured Rubrics</h3>
          <p className="text-sm text-vault-muted">Weights must sum to 100%. Ensures absolute mathematical precision in scoring.</p>
        </div>
        <div className="p-6 bg-white archival-border rounded-lg archival-shadow">
          <h3 className="text-lg mb-2">Blind Review</h3>
          <p className="text-sm text-vault-muted">Mask team identities. Judges see only the problem, solution, and anonymized bios.</p>
        </div>
        <div className="p-6 bg-white archival-border rounded-lg archival-shadow">
          <h3 className="text-lg mb-2">Immutable Results</h3>
          <p className="text-sm text-vault-muted">Once judging commences, the rubric is frozen. Once published, the results are permanent.</p>
        </div>
      </div>
    </div>
  );
}
