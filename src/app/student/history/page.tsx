"use client";
import { useEffect, useState } from "react";
import { Card, Button } from "@/components/ui";
import { History, Calendar, Building, MapPin, DollarSign, Loader2, FileText, Award } from "lucide-react";

interface InternshipHistory {
  id: string;
  status: string;
  start_date: string;
  end_date: string;
  feedback: string | null;
  rating: number | null;
  certificate_url: string | null;
  internships: {
    title: string;
    location: string;
    stipend: number | null;
    description: string;
    companies: {
      name: string;
    };
  };
}

export default function InternshipHistoryPage() {
  const [history, setHistory] = useState<InternshipHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const res = await fetch("/api/student/internship-history");
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history || []);
      }
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "ongoing":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "terminated":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-zinc-500/20 text-zinc-400 border-zinc-500/30";
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-purple-950 via-black to-black px-6 py-12 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.25),transparent_60%),radial-gradient(circle_at_bottom_right,rgba(219,39,119,0.15),transparent_70%)]" />

      <div className="relative z-10 mx-auto w-full max-w-6xl space-y-8">
        {/* Header */}
        <section>
          <h1 className="flex items-center gap-3 text-3xl font-semibold">
            <History className="h-8 w-8 text-purple-400" />
            Internship{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              History
            </span>
          </h1>
          <p className="mt-2 text-sm text-zinc-300/80">
            Track your past and ongoing internships, certificates, and feedback
          </p>
        </section>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
          </div>
        )}

        {/* History List */}
        {!loading && history.length === 0 && (
          <Card className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center">
            <History className="mx-auto h-16 w-16 text-zinc-600 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Internship History</h3>
            <p className="text-zinc-400 text-sm">
              Your completed and ongoing internships will appear here
            </p>
          </Card>
        )}

        {!loading && history.length > 0 && (
          <div className="space-y-6">
            {history.map((item) => (
              <Card key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:bg-white/10">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Main Info */}
                  <div className="flex-1 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-2xl font-bold text-white">
                          {item.internships.title}
                        </h3>
                        <p className="text-purple-400 font-medium mt-1">
                          {item.internships.companies.name}
                        </p>
                      </div>
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border capitalize ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-zinc-300">
                        <Calendar className="h-4 w-4 text-purple-400" />
                        <span>
                          {new Date(item.start_date).toLocaleDateString()} - {" "}
                          {item.end_date ? new Date(item.end_date).toLocaleDateString() : "Ongoing"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-zinc-300">
                        <MapPin className="h-4 w-4 text-purple-400" />
                        <span>{item.internships.location || "Remote"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-zinc-300">
                        <DollarSign className="h-4 w-4 text-purple-400" />
                        <span>
                          {item.internships.stipend 
                            ? `₹${item.internships.stipend.toLocaleString()}/month` 
                            : "Unpaid"}
                        </span>
                      </div>
                      {item.rating && (
                        <div className="flex items-center gap-2 text-zinc-300">
                          <Award className="h-4 w-4 text-yellow-400" />
                          <span>{item.rating}/5 Rating</span>
                        </div>
                      )}
                    </div>

                    {item.feedback && (
                      <div className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10">
                        <p className="text-xs text-zinc-500 uppercase mb-2">Company Feedback</p>
                        <p className="text-zinc-300 text-sm leading-relaxed">
                          {item.feedback}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Certificate */}
                  {item.certificate_url && (
                    <div className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl min-w-[180px]">
                      <FileText className="h-12 w-12 text-purple-400 mb-2" />
                      <p className="text-sm text-zinc-400 mb-3 text-center">Certificate Available</p>
                      <a
                        href={item.certificate_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center w-full px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-sm font-medium transition"
                      >
                        View Certificate
                      </a>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
