import Link from "next/link";

async function fetchInternship(id: string) {
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const res = await fetch(`${origin}/api/internships/${id}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return null;
  }

  return res.json();
}

export default async function InternshipDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const internship = await fetchInternship(id);

  if (!internship) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center gap-4 text-center text-white">
        <h1 className="text-3xl font-semibold">Internship not found</h1>
        <p className="text-sm text-zinc-400">
          The internship you were looking for doesn&apos;t exist or may have been removed.
        </p>
        <Link
          href="/student/browse"
          className="rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 px-4 py-2 text-sm font-medium text-white transition hover:from-purple-600 hover:to-pink-700"
        >
          Browse internships
        </Link>
      </div>
    );
  }

  const {
    title,
    description,
    location,
    is_remote,
    stipend,
    openings,
    duration_weeks,
    requirements,
    created_at,
    deadline,
    topics = [],
    company,
  } = internship;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 text-white">
      <header className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-400">Internship</p>
            <h1 className="text-3xl font-semibold text-white">{title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-zinc-300">
              {is_remote ? (
                <span className="rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-purple-200">Remote</span>
              ) : location ? (
                <span className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-blue-200">{location}</span>
              ) : null}
              {stipend && (
                <span className="rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-1 text-green-200">
                  Stipend: {stipend}
                </span>
              )}
              {typeof openings === "number" && (
                <span className="rounded-lg border border-zinc-500/30 bg-zinc-500/10 px-3 py-1 text-zinc-200">
                  {openings} openings
                </span>
              )}
            </div>
          </div>
          {company && (
            <div className="flex flex-col items-end gap-2 text-sm text-zinc-300">
              <span className="text-xs uppercase tracking-wide text-zinc-500">Company</span>
              <span className="text-base font-medium text-white">{company.name}</span>
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                {company.website && (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-white/10 bg-white/10 px-2 py-1 text-purple-200 hover:text-purple-100"
                  >
                    Website
                  </a>
                )}
                {company.username && (
                  <Link
                    href={`/profile/${company.username}`}
                    className="rounded-lg border border-white/10 bg-white/10 px-2 py-1 text-purple-200 hover:text-purple-100"
                  >
                    View profile
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-zinc-500">
          <span>Posted {created_at ? new Date(created_at).toLocaleDateString() : "recently"}</span>
          {deadline && <span>Apply before {new Date(deadline).toLocaleDateString()}</span>}
          {duration_weeks && <span>Duration: {duration_weeks} weeks</span>}
        </div>
      </header>

      <section className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-xl">
        <h2 className="text-lg font-semibold text-white">Description</h2>
        <p className="whitespace-pre-line text-sm leading-relaxed text-zinc-200">{description ?? "No description provided."}</p>
      </section>

      {requirements && (
        <section className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-xl">
          <h2 className="text-lg font-semibold text-white">Requirements</h2>
          <p className="whitespace-pre-line text-sm leading-relaxed text-zinc-200">{requirements}</p>
        </section>
      )}

      {topics.length > 0 && (
        <section className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-xl">
          <h2 className="text-lg font-semibold text-white">Related Topics</h2>
          <div className="flex flex-wrap gap-2">
            {topics.map((topic: any) => (
              <span
                key={topic.id ?? topic.name}
                className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs text-purple-200"
              >
                {topic.name}
                {topic.relevance_score ? (
                  <span className="text-[10px] text-purple-300/70">
                    {(topic.relevance_score * 100).toFixed(0)}%
                  </span>
                ) : null}
              </span>
            ))}
          </div>
        </section>
      )}

      <footer className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm text-zinc-300 shadow-xl backdrop-blur-xl">
        <div>
          <p className="text-xs uppercase tracking-wide text-zinc-500">Next steps</p>
          <p className="text-sm text-zinc-200">
            Ready to apply? Go back to the internships list to submit your application.
          </p>
        </div>
        <Link
          href="/student/browse"
          className="rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 px-4 py-2 text-sm font-medium text-white transition hover:from-purple-600 hover:to-pink-700"
        >
          Browse more internships
        </Link>
      </footer>
    </div>
  );
}
