'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { SectionHeading } from '@/components/SectionHeading';
import { Camera, Trash2 } from 'lucide-react';
import { parseMarkdownSections, deduplicateIssues, parseDetectedIssue } from '@/lib/analysisUtils';
import ReactMarkdown from 'react-markdown';

interface AnalysisResult {
  problem: string;
  confidence?: number;
}

interface HistoryItem {
  id: string;
  user_id: string;
  email: string;
  age: number;
  gender: string;
  detected_issues: string[];
  recommendations: string;
  created_at: string;
}

// Normalize label names
function normalizeLabel(label: string): string {
  const normalized: Record<string, string> = {
    whitehead: 'Whiteheads',
    whiteheads: 'Whiteheads',
    wrinkle: 'Wrinkles',
    wrinkles: 'Wrinkles',
    'dark spot': 'Dark Spots',
    'dark spots': 'Dark Spots',
    acne: 'Acne',
    'acne scar': 'Acne Scars',
    blackhead: 'Blackheads',
    blackheads: 'Blackheads',
    freckle: 'Freckles',
    freckles: 'Freckles',
    melasma: 'Melasma',
    nodule: 'Nodules',
    nodules: 'Nodules',
    papule: 'Papules',
    papules: 'Papules',
    pustule: 'Pustules',
    pustules: 'Pustules',
    'skin redness': 'Skin Redness',
    vascular: 'Vascular',
    'dark circle': 'Dark Circles',
    eyebag: 'Eyebags',
  };
  return normalized[label.toLowerCase()] || label;
}

function deduplicateResults(results: AnalysisResult[]): AnalysisResult[] {
  const bestResults = new Map<string, AnalysisResult>();

  for (const result of results) {
    const problem = normalizeLabel(result.problem);
    const existing = bestResults.get(problem);

    if (!existing || (result.confidence ?? 0) > (existing.confidence ?? 0)) {
      bestResults.set(problem, { ...result, problem });
    }
  }

  return Array.from(bestResults.values()).sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0));
}

export function SkinAnalysis() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
  const { session, user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('female');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [predictedProblems, setPredictedProblems] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !session) {
      router.push('/login');
    }
  }, [session, authLoading, router]);

  // Fetch history on mount and after successful analysis
  useEffect(() => {
    if (session && user) {
      fetchHistory();
    }
  }, [session, user]);

  const fetchHistory = async () => {
    try {
      setHistoryLoading(true);
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (!currentSession) {
        setHistory([]);
        return;
      }

      const { data, error } = await supabase
        .from('skin_analyses')
        .select('*')
        .eq('user_id', currentSession.user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching history:', error);
        setHistory([]);
      } else {
        setHistory(data || []);
      }
    } catch (err) {
      console.error('Error:', err);
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const deleteAnalysis = async (id: string) => {
    try {
      const { error } = await supabase
        .from('skin_analyses')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting:', error);
      } else {
        setHistory(history.filter(item => item.id !== id));
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(imageFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  useEffect(() => {
    if (videoRef.current && mediaStream) {
      videoRef.current.srcObject = mediaStream;
      videoRef.current.play().catch(() => {
        /* ignore autoplay errors */
      });
    }
  }, [mediaStream]);

  useEffect(() => {
    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [mediaStream]);

  if (authLoading) {
    return <div className="text-center">Loading...</div>;
  }

  if (!session) {
    return null;
  }

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (file) {
      setImageFile(file);
      setError(null);
    }
  };

  const stopCamera = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setMediaStream(null);
    setCameraActive(false);
  };

  const openCamera = async () => {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Camera is not available in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });

      setMediaStream(stream);
      setCameraActive(true);
    } catch (err) {
      setError('Unable to open camera. Please allow camera access or use upload.');
    }
  };

  const captureFromCamera = async () => {
    if (!videoRef.current) {
      setError('Camera is not ready.');
      return;
    }

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');

    if (!context) {
      setError('Unable to capture image.');
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg'));

    if (!blob) {
      setError('Unable to capture image.');
      return;
    }

    const file = new File([blob], 'camera-capture.jpg', { type: blob.type });
    setImageFile(file);
    setError(null);
    stopCamera();
  };

  const handleAnalyze = async () => {
    if (!apiUrl) {
      setError('Backend API URL is not configured.');
      return;
    }

    if (!imageFile) {
      setError('Please select an image before analyzing.');
      return;
    }

    if (!age.trim() || !gender.trim()) {
      setError('Please provide age and gender.');
      return;
    }

    setError(null);
    setLoading(true);
    setResults([]);
    setPredictedProblems([]);
    setRecommendations('');

    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('age', age);
    formData.append('gender', gender);

    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (!currentSession || !currentSession.access_token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${apiUrl}/upload`, {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${currentSession.access_token}`,
        },
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const message = payload?.error || response.statusText;
        throw new Error(`Upload failed: ${message}`);
      }

      const data = await response.json();
      
      // Prefer LLM-verified concerns when available; fallback to raw YOLO results
      if (Array.isArray(data.verified_results) && data.verified_results.length > 0) {
        const normalizedVerified: AnalysisResult[] = data.verified_results.map((r: any) => ({
          problem: normalizeLabel(String(r.problem)),
          confidence: r.confidence ?? undefined,
        } as AnalysisResult));
        setResults(deduplicateResults(normalizedVerified));
        setPredictedProblems(
          Array.from(new Set(normalizedVerified.map((r) => normalizeLabel(r.problem)))) as string[]
        );
      } else {
        const normalizedInputResults = (Array.isArray(data.results) ? data.results : []).map(
          (r: AnalysisResult) => ({
            ...r,
            problem: normalizeLabel(r.problem),
          })
        );
        const dedupedResults = deduplicateResults(normalizedInputResults);
        setResults(dedupedResults);

        const normalizedProblems = Array.from(
          new Set(
            (Array.isArray(data.predicted_problems) ? data.predicted_problems : []).map((p: string) => normalizeLabel(String(p)))
          )
        );
        setPredictedProblems(normalizedProblems as string[]);
      }

      setRecommendations(data.recommendations ?? 'No recommendations returned.');

      // Refresh history
      await fetchHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis request failed.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <>
      <SectionHeading
        eyebrow="AI Skin Analysis"
        title="Upload a selfie to receive fast AI-powered skincare insights"
        description="Select an image, enter your age and gender, and get a detailed analysis with personalized recommendations."
      />

      <div className="mt-10 grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="glass-card rounded-[2rem] border border-slate-200/80 p-8 shadow-soft">
          <div className="space-y-6">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-pink-600/80">Step 1</p>
              <h3 className="mt-4 text-2xl font-semibold text-slate-950">Choose your photo</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Upload a clear selfie for the skin condition detector. We currently support JPG and PNG images.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="group block rounded-[1.75rem] border border-slate-200 bg-white/90 p-5 text-center transition hover:border-pink-300/50 hover:bg-white cursor-pointer">
                <span className="mb-3 inline-flex text-sm font-semibold text-slate-700">Upload image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <span className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800">
                  Browse files
                </span>
              </label>

              <div className="group block rounded-[1.75rem] border border-slate-200 bg-white/90 p-5 text-center transition hover:border-pink-300/50 hover:bg-white">
                <span className="mb-3 inline-flex text-sm font-semibold text-slate-700">Take photo</span>
                <button
                  type="button"
                  onClick={openCamera}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                >
                  <Camera className="h-4 w-4" />
                  Open camera
                </button>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-slate-200 bg-slate-950/5 p-5">
              {cameraActive ? (
                <div className="relative overflow-hidden rounded-[1.5rem] bg-black">
                  <video
                    ref={videoRef}
                    className="h-full w-full object-cover"
                    autoPlay
                    muted
                    playsInline
                  />
                </div>
              ) : previewUrl ? (
                <img src={previewUrl} alt="Image preview" className="w-full rounded-[1.5rem] object-cover" />
              ) : (
                <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                  Image preview will appear here after selection.
                </div>
              )}

              {cameraActive ? (
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={captureFromCamera}
                    className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-pink-500/20 transition hover:-translate-y-0.5"
                  >
                    Capture photo
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                  >
                    Close camera
                  </button>
                </div>
              ) : null}
            </div>

            {!cameraActive && !previewUrl ? (
              <p className="mt-3 text-sm text-slate-500">You can open your webcam to take a photo directly or upload any jpg/png image.</p>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-900">Age</span>
                <input
                  type="number"
                  min="1"
                  value={age}
                  onChange={(event) => setAge(event.target.value)}
                  placeholder="e.g. 29"
                  className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-900">Gender</span>
                <select
                  value={gender}
                  onChange={(event) => setGender(event.target.value)}
                  className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                >
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
                </select>
              </label>
            </div>

            <button
              type="button"
              onClick={handleAnalyze}
              disabled={loading}
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-purple-600 px-8 py-4 text-sm font-semibold text-white shadow-lg shadow-pink-500/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Analyzing...' : 'Analyze skin'}
            </button>

            {error ? (
              <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            ) : null}
          </div>
        </div>

        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="glass-card rounded-[2rem] border border-slate-200/80 p-8 shadow-soft"
          >
            <p className="text-sm uppercase tracking-[0.3em] text-pink-600/80">Results</p>
            <h3 className="mt-4 text-2xl font-semibold text-slate-950">Detected skin issues</h3>

            {results.length > 0 ? (
              <div className="mt-6 space-y-4">
                {results.map((item) => {
                  return (
                    <div key={item.problem} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <p className="font-semibold text-slate-950">{item.problem}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="mt-6 text-sm leading-7 text-slate-600">Results from the last analysis will appear here.</p>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="glass-card rounded-[2rem] border border-slate-200/80 p-8 shadow-soft"
          >
            <p className="text-sm uppercase tracking-[0.3em] text-pink-600/80">Recommendations</p>
            <h3 className="mt-4 text-2xl font-semibold text-slate-950">AI skincare guidance</h3>
            <div className="mt-6 rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6">
              {recommendations ? (
                <div className="prose max-w-none text-sm leading-7 text-slate-700">
                  <ReactMarkdown>{recommendations}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-sm leading-7 text-slate-700">Your personalized skincare recommendations will show here after analysis.</p>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="glass-card rounded-[2rem] border border-slate-200/80 p-8 shadow-soft"
          >
            <p className="text-sm uppercase tracking-[0.3em] text-pink-600/80">History</p>
            <h3 className="mt-4 text-2xl font-semibold text-slate-950">Your analyses</h3>

            {historyLoading ? (
              <p className="mt-6 text-sm text-slate-600">Loading history...</p>
            ) : history.length > 0 ? (
              <div className="mt-6 space-y-4">
                {history.map((item) => {
                  const issues = deduplicateIssues(item.detected_issues.map(parseDetectedIssue));
                  const topIssue = issues[0];
                  const previewSection = parseMarkdownSections(item.recommendations)[0];
                  return (
                    <div key={item.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
                        <div>
                          <p className="font-semibold text-slate-950">{topIssue?.name || 'No detected issues'}</p>
                          <p className="mt-2 text-sm text-slate-500">
                            {new Intl.DateTimeFormat('en-US', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            }).format(new Date(item.created_at))}
                          </p>
                          <div className="mt-3 space-y-1 text-sm text-slate-600">
                            <p>Detected Issues: <span className="font-semibold text-slate-950">{issues.length}</span></p>
                            {/* Severity display removed per UI requirements */}
                          </div>
                        </div>
                        <button
                          onClick={() => deleteAnalysis(item.id)}
                          className="self-start rounded-full bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                        >
                          Delete
                        </button>
                      </div>

                      <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                        {previewSection ? (
                          <div className="prose max-w-none text-sm leading-7 text-slate-700">
                            <ReactMarkdown>{previewSection.title ? `**${previewSection.title}**\n\n${previewSection.items.join('\n')}` : previewSection.items.join('\n')}</ReactMarkdown>
                          </div>
                        ) : (
                          <p className="text-sm leading-6 text-slate-600">No recommendations available.</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="mt-6 text-sm leading-7 text-slate-600">
                No analyses yet. Complete your first analysis above to see it here.
              </p>
            )}
          </motion.div>
        </div>
      </div>
    </>
  );
}
