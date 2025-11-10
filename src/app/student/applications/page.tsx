"use client";

import { useEffect, useState } from "react";
import { Briefcase, Check, Clock, FileText, XCircle, Loader2, MapPin, DollarSign, X, Building2, Calendar, Target, TrendingUp, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { MessageButton } from "@/components/MessageButton";

type ApplicationStatus = 'applied' | 'under_review' | 'selected' | 'rejected';

interface Application {
  id: string;
  status: ApplicationStatus;
  created_at: string;
  cover_letter?: string;
  internships: {
    id: string;
    title: string;
    description: string;
    location: string;
    is_remote: boolean;
    stipend: number;
    openings: number;
    created_at: string;
    companies: {
      id: string;
      name: string;
      logo_url?: string;
      profile_id?: string;
    };
  };
}

export default function StudentApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [matchScore, setMatchScore] = useState<number | null>(null);
  const [loadingScore, setLoadingScore] = useState(false);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const response = await fetch('/api/student/applications');
        if (!response.ok) {
          throw new Error('Failed to fetch applications');
        }
        const data = await response.json();
        setApplications(data);
      } catch (error) {
        console.error('Error fetching applications:', error);
        toast.error('Failed to load applications');
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  const fetchMatchScore = async (internshipId: string) => {
    setLoadingScore(true);
    try {
      const response = await fetch(`/api/recommendations/student?limit=100`);
      if (response.ok) {
        const recommendations = await response.json();
        const match = recommendations.find((r: any) => r.internship?.id === internshipId);
        setMatchScore(match?.score || null);
      }
    } catch (error) {
      console.error('Error fetching match score:', error);
    } finally {
      setLoadingScore(false);
    }
  };

  const openApplicationDetails = (application: Application) => {
    setSelectedApplication(application);
    setMatchScore(null);
    fetchMatchScore(application.internships.id);
  };

  const closeApplicationDetails = () => {
    setSelectedApplication(null);
    setMatchScore(null);
  };

  const getStatusBadge = (status: ApplicationStatus) => {
    const styles: Record<ApplicationStatus, { bg: string; text: string; border: string; icon: React.ReactNode }> = {
      'applied': {
        bg: 'bg-gray-500/20',
        text: 'text-gray-300',
        border: 'border-gray-500/30',
        icon: <FileText className="w-3 h-3" />
      },
      'under_review': {
        bg: 'bg-blue-500/20',
        text: 'text-blue-300',
        border: 'border-blue-500/30',
        icon: <Clock className="w-3 h-3" />
      },
      'selected': {
        bg: 'bg-green-500/20',
        text: 'text-green-300',
        border: 'border-green-500/30',
        icon: <Check className="w-3 h-3" />
      },
      'rejected': {
        bg: 'bg-red-500/20',
        text: 'text-red-300',
        border: 'border-red-500/30',
        icon: <XCircle className="w-3 h-3" />
      }
    };

    const style = styles[status];
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${style.bg} ${style.text} ${style.border}`}>
        {style.icon}
        {status.replace('_', ' ')}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="relative min-h-screen text-white flex items-center justify-center">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-purple-950 via-black to-black" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.2),transparent_60%),radial-gradient(circle_at_bottom_right,rgba(219,39,119,0.15),transparent_70%)]" />
        <div className="flex items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
          <span className="text-lg text-zinc-300">Loading your applications...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen text-white">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-purple-950 via-black to-black" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.2),transparent_60%),radial-gradient(circle_at_bottom_right,rgba(219,39,119,0.15),transparent_70%)]" />

      <div className="page-shell max-w-5xl">
        <section className="page-hero text-center">
          <h1 className="page-title">My Applications</h1>
          <p className="page-subtitle mt-3">
            Track the status of your internship applications
          </p>
        </section>

        {applications.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-lg p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-500/20 mb-4">
              <Briefcase className="h-8 w-8 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No applications yet</h3>
            <p className="text-zinc-400 mb-6">You haven't applied to any internships yet.</p>
            <a
              href="/student/browse"
              className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-purple-500/25"
            >
              Browse Internships
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((application) => (
              <div
                key={application.id}
                onClick={() => openApplicationDetails(application)}
                className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-lg overflow-hidden hover:border-purple-400/30 transition-all duration-200 cursor-pointer"
              >
                <div className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                          <Briefcase className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white mb-1">
                            {application.internships.title}
                          </h3>
                          <p className="text-sm text-zinc-400 mb-2">
                            {application.internships.companies.name}
                          </p>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {application.internships.is_remote ? 'Remote' : application.internships.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              ₹{application.internships.stipend?.toLocaleString() || 'Unpaid'}
                            </span>
                            <span>
                              {application.internships.openings} opening{application.internships.openings !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getStatusBadge(application.status)}
                      <p className="text-xs text-zinc-500">
                        Applied on {formatDate(application.created_at)}
                      </p>
                    </div>
                  </div>

                  {application.cover_letter && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <h4 className="text-sm font-medium text-purple-200 mb-2">Your Cover Letter</h4>
                      <div className="rounded-lg bg-white/5 border border-white/10 p-3 text-sm text-zinc-300 leading-relaxed">
                        <p className="whitespace-pre-line">{application.cover_letter}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Application Details Modal */}
        {selectedApplication && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
            <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-black/90 p-6 text-white shadow-2xl backdrop-blur-xl">
              <button
                onClick={closeApplicationDetails}
                className="absolute right-4 top-4 rounded-lg p-2 text-zinc-400 transition hover:bg-white/10 hover:text-white"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="mb-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                      {selectedApplication.internships.title}
                    </h2>
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Building2 className="w-4 h-4" />
                      <span className="text-lg">{selectedApplication.internships.companies.name}</span>
                    </div>
                  </div>
                  {getStatusBadge(selectedApplication.status)}
                </div>

                {/* Match Score */}
                {loadingScore ? (
                  <div className="rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 p-4 mb-6">
                    <div className="flex items-center gap-2 text-sm text-purple-200">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Calculating match score...
                    </div>
                  </div>
                ) : matchScore !== null ? (
                  <div className="rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 p-4 mb-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Target className="w-5 h-5 text-purple-300" />
                        <span className="text-sm font-medium text-purple-200">AI Match Score</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className={`w-5 h-5 ${
                          matchScore > 0.8 ? 'text-green-400' :
                          matchScore > 0.5 ? 'text-yellow-400' : 'text-red-400'
                        }`} />
                        <span className={`text-2xl font-bold ${
                          matchScore > 0.8 ? 'text-green-400' :
                          matchScore > 0.5 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {(matchScore * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-purple-200/70 mt-2">
                      {matchScore > 0.8 ? 'Excellent match! Your skills align very well with this role.' :
                       matchScore > 0.5 ? 'Good match. You have relevant skills for this position.' :
                       'Moderate match. Consider highlighting transferable skills.'}
                    </p>
                  </div>
                ) : null}
              </div>

              {/* Internship Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <h3 className="text-sm font-medium text-purple-200 mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Location
                  </h3>
                  <p className="text-white">
                    {selectedApplication.internships.is_remote ? 'Remote' : selectedApplication.internships.location || 'Not specified'}
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <h3 className="text-sm font-medium text-purple-200 mb-3 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Stipend
                  </h3>
                  <p className="text-white text-lg font-semibold">
                    {selectedApplication.internships.stipend 
                      ? `₹${selectedApplication.internships.stipend.toLocaleString()}/month`
                      : 'Unpaid'}
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <h3 className="text-sm font-medium text-purple-200 mb-3 flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    Openings
                  </h3>
                  <p className="text-white">
                    {selectedApplication.internships.openings} position{selectedApplication.internships.openings !== 1 ? 's' : ''} available
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <h3 className="text-sm font-medium text-purple-200 mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Application Date
                  </h3>
                  <p className="text-white">
                    {formatDate(selectedApplication.created_at)}
                  </p>
                </div>
              </div>

              {/* Description */}
              {selectedApplication.internships.description && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 mb-6">
                  <h3 className="text-sm font-medium text-purple-200 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Job Description
                  </h3>
                  <p className="text-zinc-300 leading-relaxed whitespace-pre-line">
                    {selectedApplication.internships.description}
                  </p>
                </div>
              )}

              {/* Cover Letter */}
              {selectedApplication.cover_letter && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 mb-6">
                  <h3 className="text-sm font-medium text-purple-200 mb-3">Your Cover Letter</h3>
                  <p className="text-zinc-300 leading-relaxed whitespace-pre-line">
                    {selectedApplication.cover_letter}
                  </p>
                </div>
              )}

              {/* Company Info */}
              <div className="rounded-xl border border-white/10 bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-4">
                <h3 className="text-sm font-medium text-purple-200 mb-3 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  About {selectedApplication.internships.companies.name}
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400 text-sm">Company</span>
                    <span className="text-white font-medium">{selectedApplication.internships.companies.name}</span>
                  </div>
                  {selectedApplication.internships.companies.logo_url && (
                    <div className="mt-3">
                      <img 
                        src={selectedApplication.internships.companies.logo_url} 
                        alt={`${selectedApplication.internships.companies.name} logo`}
                        className="h-12 object-contain"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-between items-center">
                {selectedApplication.internships.companies.profile_id && (
                  <MessageButton
                    recipientProfileId={selectedApplication.internships.companies.profile_id}
                    recipientName={selectedApplication.internships.companies.name}
                    applicationId={selectedApplication.id}
                    variant="outline"
                  />
                )}
                <div className="flex-1" />
                  <button
                    onClick={closeApplicationDetails}
                    className="rounded-xl border border-white/10 bg-white/5 px-6 py-2 text-sm text-white transition hover:bg-white/10"
                  >
                    Close
                  </button>
                </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
