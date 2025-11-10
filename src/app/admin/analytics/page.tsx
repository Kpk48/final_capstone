"use client";
import { useEffect, useState } from "react";
import { Card, Button } from "@/components/ui";
import {
    Users,
    Briefcase,
    FileText,
    TrendingUp,
    Calendar,
    AlertCircle,
    Sparkles,
    Loader2
} from "lucide-react";
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface AIInsight {
    title: string;
    description: string;
    type: "positive" | "warning" | "info";
    metric?: string;
}

interface AIInsightsData {
    summary: string;
    insights: AIInsight[];
    recommendations: string[];
}

export default function AdminAnalyticsPage() {
    const [basicData, setBasicData] = useState<any | null>(null);
    const [detailedData, setDetailedData] = useState<any | null>(null);
    const [aiInsights, setAiInsights] = useState<AIInsightsData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingInsights, setLoadingInsights] = useState(false);

    useEffect(() => {
        Promise.all([
            fetch("/api/admin/analytics").then(r => r.json()),
            fetch("/api/admin/analytics-detailed").then(r => r.json())
        ])
            .then(([basic, detailed]) => {
                if (basic.error) setError(basic.error);
                else {
                    setBasicData(basic);
                    setDetailedData(detailed);
                }
            })
            .catch(() => setError("Failed to load analytics"))
            .finally(() => setLoading(false));
    }, []);

    const generateAIInsights = async () => {
        setLoadingInsights(true);
        try {
            const analyticsData = {
                totalUsers: basicData?.total_users || 0,
                students: detailedData?.roleCounts?.find((r: any) => r.name === "Students")?.value || 0,
                companies: detailedData?.roleCounts?.find((r: any) => r.name === "Companies")?.value || 0,
                internships: basicData?.total_internships || 0,
                applications: basicData?.total_applications || 0,
                userGrowth: detailedData?.userTimeSeries || [],
                applicationTrends: detailedData?.applicationTimeSeries || [],
                topSkills: detailedData?.topSkills || [],
                topInternships: detailedData?.internshipsWithApplications?.slice(0, 5) || [],
            };

            const res = await fetch("/api/admin/ai-insights", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ analyticsData }),
            });

            const data = await res.json();
            if (data.insights) {
                setAiInsights(data.insights);
            }
        } catch (err) {
            console.error("Failed to generate insights:", err);
        } finally {
            setLoadingInsights(false);
        }
    };

    const getInsightColor = (type: string) => {
        switch (type) {
            case "positive": return "border-green-500/20 bg-green-500/10 text-green-400";
            case "warning": return "border-yellow-500/20 bg-yellow-500/10 text-yellow-400";
            default: return "border-blue-500/20 bg-blue-500/10 text-blue-400";
        }
    };

    return (
        <div className="relative min-h-screen bg-gradient-to-br from-purple-950 via-black to-black px-6 py-12 text-white">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.25),transparent_60%),radial-gradient(circle_at_bottom_right,rgba(219,39,119,0.15),transparent_70%)]" />

            <div className="relative z-10 mx-auto w-full max-w-7xl space-y-8">
                {/* Header */}
                <section className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-semibold">
                            Admin{" "}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                                Analytics Dashboard
                            </span>
                        </h1>
                        <p className="mt-2 text-sm text-zinc-300/80">
                            Comprehensive insights with AI-powered recommendations
                        </p>
                    </div>
                    <Button
                        onClick={generateAIInsights}
                        disabled={loadingInsights || !basicData}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    >
                        {loadingInsights ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Analyzing...
                            </>
                        ) : (
                            <>
                                <Sparkles className="h-4 w-4 mr-2" />
                                Generate AI Insights
                            </>
                        )}
                    </Button>
                </section>

                {/* Error */}
                {error && (
                    <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
                        <AlertCircle className="h-4 w-4" /> {error}
                    </div>
                )}

                {/* Stats Grid */}
                <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <Card className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur-xl">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm text-purple-400 font-medium">Total Users</span>
                            <Users className="h-5 w-5 text-purple-400" />
                        </div>
                        <div className="text-3xl font-semibold">
                            {loading ? (
                                <div className="h-8 w-16 animate-pulse rounded bg-white/20" />
                            ) : (
                                basicData?.total_users ?? "–"
                            )}
                        </div>
                    </Card>

                    <Card className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur-xl">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm text-pink-400 font-medium">Total Internships</span>
                            <Briefcase className="h-5 w-5 text-pink-400" />
                        </div>
                        <div className="text-3xl font-semibold">
                            {loading ? (
                                <div className="h-8 w-16 animate-pulse rounded bg-white/20" />
                            ) : (
                                basicData?.total_internships ?? "–"
                            )}
                        </div>
                    </Card>

                    <Card className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur-xl">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm text-indigo-400 font-medium">Total Applications</span>
                            <FileText className="h-5 w-5 text-indigo-400" />
                        </div>
                        <div className="text-3xl font-semibold">
                            {loading ? (
                                <div className="h-8 w-16 animate-pulse rounded bg-white/20" />
                            ) : (
                                basicData?.total_applications ?? "–"
                            )}
                        </div>
                    </Card>
                </section>

                {/* AI Insights */}
                {aiInsights && (
                    <Card className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-6 backdrop-blur-xl shadow-2xl">
                        <div className="mb-4 flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-purple-400" />
                            <h2 className="text-xl font-semibold text-purple-300">AI-Generated Insights</h2>
                        </div>
                        <p className="mb-4 text-sm text-zinc-300">{aiInsights.summary}</p>
                        
                        <div className="space-y-3 mb-4">
                            {aiInsights.insights.map((insight, idx) => (
                                <div
                                    key={idx}
                                    className={`rounded-lg border p-3 ${getInsightColor(insight.type)}`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h3 className="font-medium">{insight.title}</h3>
                                            <p className="mt-1 text-sm opacity-90">{insight.description}</p>
                                        </div>
                                        {insight.metric && (
                                            <span className="ml-3 text-2xl font-bold">{insight.metric}</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        {aiInsights.recommendations && aiInsights.recommendations.length > 0 && (
                            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                                <h3 className="mb-2 font-medium text-zinc-200">Recommendations:</h3>
                                <ul className="list-disc space-y-1 pl-5 text-sm text-zinc-300">
                                    {aiInsights.recommendations.map((rec, idx) => (
                                        <li key={idx}>{rec}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </Card>
                )}

                {/* Charts Grid */}
                {!loading && detailedData && (
                    <>
                        {/* Role Distribution */}
                        <Card className="rounded-2xl border border-white/10 bg-white/10 p-6 backdrop-blur-xl shadow-2xl">
                            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                                <Users className="h-5 w-5 text-purple-400" />
                                Role Distribution
                            </h2>
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie
                                        data={detailedData.roleCounts}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({name, percent}: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {detailedData.roleCounts.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </Card>

                        {/* Time Series */}
                        <Card className="rounded-2xl border border-white/10 bg-white/10 p-6 backdrop-blur-xl shadow-2xl">
                            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                                <TrendingUp className="h-5 w-5 text-green-400" />
                                Activity Trends (Last 30 Days)
                            </h2>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart
                                    data={detailedData.applicationTimeSeries.map((app: any, i: number) => ({
                                        date: app.date,
                                        applications: app.applications,
                                        users: detailedData.userTimeSeries[i]?.users || 0,
                                    }))}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                                    <XAxis dataKey="date" stroke="#ffffff80" fontSize={12} />
                                    <YAxis stroke="#ffffff80" fontSize={12} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "#1a1a2e",
                                            border: "1px solid #ffffff20",
                                            borderRadius: "8px",
                                        }}
                                    />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="users"
                                        stroke="#3b82f6"
                                        strokeWidth={2}
                                        name="New Users"
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="applications"
                                        stroke="#ec4899"
                                        strokeWidth={2}
                                        name="Applications"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </Card>

                        {/* Internships with Applications Table */}
                        <Card className="rounded-2xl border border-white/10 bg-white/10 p-6 backdrop-blur-xl shadow-2xl">
                            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                                <Calendar className="h-5 w-5 text-indigo-400" />
                                Internships with Application Counts
                            </h2>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="border-b border-white/10 bg-white/5">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-zinc-300">Title</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-zinc-300">Company</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-zinc-300">Location</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-zinc-300">Stipend</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-zinc-300">Applications</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/10">
                                        {detailedData.internshipsWithApplications.slice(0, 10).map((int: any) => (
                                            <tr key={int.id} className="transition-colors hover:bg-white/5">
                                                <td className="px-4 py-3 text-sm font-medium text-white">{int.title}</td>
                                                <td className="px-4 py-3 text-sm text-zinc-300">{int.company}</td>
                                                <td className="px-4 py-3 text-sm text-zinc-400">{int.location || "Remote"}</td>
                                                <td className="px-4 py-3 text-sm text-zinc-400">
                                                    {int.stipend ? `₹${int.stipend}` : "Unpaid"}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="inline-flex items-center rounded-full bg-purple-500/20 px-3 py-1 text-sm font-medium text-purple-300">
                                                        {int.applications}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {detailedData.internshipsWithApplications.length === 0 && (
                                    <div className="py-8 text-center text-zinc-400">No internships found</div>
                                )}
                            </div>
                        </Card>
                    </>
                )}
            </div>
        </div>
    );
}
