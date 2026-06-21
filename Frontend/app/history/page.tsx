"use client";

import { useEffect, useState } from 'react';
import { Footer } from '@/components/Footer';
import { Navbar } from '@/components/Navbar';
import { SectionHeading } from '@/components/SectionHeading';
import { useAuth } from '@/lib/AuthContext';
import { getSeverityColorClass, getSeverityLabel, parseDetectedIssue, parseMarkdownSections, deduplicateIssues } from '@/lib/analysisUtils';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, X } from 'lucide-react';

interface HistoryItem {
  id: string;
  user_id: string;
  email: string;
  age: number;
  gender: string;
  detected_issues: string[];
  recommendations: string;
  created_at: string;
  image_url?: string;
}

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));

export default function HistoryPage() {
  const { session, loading: authLoading } = useAuth();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState<HistoryItem | null>(null);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

  // Lock background scroll and handle escape key when modal is open
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedAnalysis(null);
    };

    if (selectedAnalysis) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKey);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKey);
    };
  }, [selectedAnalysis]);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!session?.user?.id) {
        setHistory([]);
        return;
      }

      if (!apiUrl) {
        setError('API URL is not configured.');
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(`${apiUrl}/api/history`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(payload?.error || response.statusText || 'Failed to load history');
        }

        const data = (await response.json()) as HistoryItem[];
        setHistory(data || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load history.');
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && session) {
      fetchHistory();
    }
  }, [authLoading, session, apiUrl]);

  if (authLoading) {
    return (
      <main className="overflow-hidden bg-slate-50">
        <Navbar />
        <section className="bg-white py-24 px-6 sm:px-8">
          <div className="mx-auto max-w-6xl text-center text-slate-700">Loading history...</div>
        </section>
        <Footer />
      </main>
    );
  }

  return (
    <main className="overflow-hidden bg-slate-50">
      <Navbar onNavigate={() => setSelectedAnalysis(null)} />
      <section className="bg-white py-24 px-6 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            eyebrow="History"
            title="Review your past skin analyses"
            description="Access your completed analyses, recommendations, and date stamps in one place."
          />

          <div className="mt-12 space-y-6">
            <div className="rounded-[2rem] border border-slate-200/80 bg-slate-50 p-10 shadow-soft">
              <p className="text-lg leading-8 text-slate-700">
                Your analysis history is stored securely with Supabase and scoped to your logged-in account. Click a card to review the full image, recommendations, and issue severity labels.
              </p>
            </div>

            {error ? (
              <div className="rounded-[1.75rem] border border-red-200 bg-red-50 p-6 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            {!loading && history.length === 0 ? (
              <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
                <p className="text-xl font-semibold text-slate-950">No previous analyses found.</p>
                <p className="mt-3 text-sm leading-7 text-slate-600">Complete your first skin analysis to see history cards here.</p>
              </div>
            ) : null}

            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {history.map((item) => {
                const issues = deduplicateIssues(item.detected_issues.map(parseDetectedIssue));
                const previewSection = parseMarkdownSections(item.recommendations)[0];
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedAnalysis(item)}
                    className="group flex flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-50 p-4 text-left transition hover:-translate-y-1 hover:shadow-xl"
                  >
                    <div className="relative h-40 overflow-hidden rounded-[1.5rem] bg-slate-200">
                      {item.image_url ? (
                        <img src={item.image_url} alt="Analysis thumbnail" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-slate-500">No image available</div>
                      )}
                    </div>

                    <div className="mt-4 grid gap-3 text-left sm:grid-cols-[1fr_auto]">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">{formatDate(item.created_at)}</p>
                        <p className="mt-2 text-lg font-semibold text-slate-950">Top Issue: {issues.length > 0 ? issues[0].name : '—'}</p>
                        <p className="mt-2 text-sm text-slate-600">Detected Issues: <span className="font-semibold text-slate-950">{issues.length}</span></p>
                        {issues.length > 0 && issues[0].confidence !== undefined ? (
                          <p className="text-sm text-slate-600">
                            Severity: <span className="font-semibold text-slate-950">{getSeverityLabel(issues[0].confidence)}</span>
                          </p>
                        ) : null}
                      </div>
                      <div className="flex items-center justify-end">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">View Details</span>
                      </div>
                    </div>

                    {previewSection ? (
                      <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4">
                        <p className="text-sm font-semibold text-slate-950">Recommendation preview</p>
                        <div className="mt-2 prose max-w-none text-sm leading-7 text-slate-600">
                          <ReactMarkdown>{previewSection.title ? `**${previewSection.title}**\n\n${previewSection.items.join('\n')}` : previewSection.items.join('\n')}</ReactMarkdown>
                        </div>
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>
      <Footer />

      {selectedAnalysis ? (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/60 px-4 py-8"
          onClick={() => setSelectedAnalysis(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-[2rem] bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div className="flex items-center gap-4">
                <button
                  aria-label="Back"
                  onClick={() => setSelectedAnalysis(null)}
                  className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-pink-600/80">Detailed analysis</p>
                  <p className="mt-1 text-lg font-semibold text-slate-950">{formatDate(selectedAnalysis.created_at)}</p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setSelectedAnalysis(null)}
                className="rounded-full bg-slate-100 p-2 text-slate-700 hover:bg-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-6 p-6 lg:grid-cols-[0.95fr_0.9fr]">
              <div className="space-y-6">
                <div>
                  {selectedAnalysis.image_url ? (
                    <img src={selectedAnalysis.image_url} alt="Analysis full image" className="w-full max-h-[350px] rounded-[1rem] object-cover" />
                  ) : (
                    <div className="flex h-64 items-center justify-center rounded-[1rem] bg-white text-slate-500">No image available</div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6">
                  <h3 className="text-xl font-semibold text-slate-950">Detected issues</h3>
                  <div className="mt-4 space-y-3">
                    {deduplicateIssues(selectedAnalysis.detected_issues.map(parseDetectedIssue)).map((issue) => {
                      const severity = getSeverityLabel(issue.confidence);
                      return (
                        <div key={issue.name} className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-semibold text-slate-950">{issue.name}</p>
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${getSeverityColorClass(severity)}`}>
                              {severity}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6">
                  <h3 className="text-xl font-semibold text-slate-950">Analysis summary</h3>
                  <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                    <p>
                      <span className="font-semibold text-slate-950">Gender:</span> {selectedAnalysis.gender}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-950">Age:</span> {selectedAnalysis.age}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-950">Timestamp:</span> {formatDate(selectedAnalysis.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6">
              <h3 className="text-xl font-semibold text-slate-950">Full recommendation</h3>
              <div className="mt-4 prose max-w-none text-sm leading-7 text-slate-700">
                <ReactMarkdown>{selectedAnalysis.recommendations}</ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}