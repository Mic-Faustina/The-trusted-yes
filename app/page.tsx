import Link from "next/link";

const ROUTES = [
  {
    href: "/register",
    label: "Register",
    who: "Registry",
    description: "Enrol a citizen into the mock national ID database.",
  },
  {
    href: "/wallet",
    label: "Wallet",
    who: "Citizen",
    description: "Look up your record and answer a question that's been asked of you.",
  },
  {
    href: "/counter",
    label: "Counter",
    who: "Business",
    description: "Ask a question and check someone's proof.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-10 p-8">
      <div className="text-center max-w-md">
        <h1 className="text-3xl font-semibold">One Question</h1>
        <p className="text-gray-400 mt-2 text-sm">
          Answer a single question about a citizen — without ever seeing
          their record.
        </p>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-sm">
        {ROUTES.map((r) => (
          <Link
            key={r.href}
            href={r.href}
            className="border border-gray-700 rounded px-4 py-3 hover:border-gray-400 transition-colors"
          >
            <div className="flex items-baseline justify-between">
              <span className="font-medium">{r.label}</span>
              <span className="text-xs text-gray-500">{r.who}</span>
            </div>
            <p className="text-sm text-gray-400 mt-1">{r.description}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}