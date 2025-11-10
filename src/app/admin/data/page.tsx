"use client";
import { useEffect, useState } from "react";
import { Card, Button, Input } from "@/components/ui";
import { Briefcase, FileText, Loader2, Trash2, Search, Filter, Eye, X, Mail, Phone, MapPin, Calendar, Building, User } from "lucide-react";

interface Internship {
  id: string;
  title: string;
  location: string;
  stipend: number | null;
  companies: { name: string };
  created_at: string;
  _count: { applications: number };
}

interface Application {
  id: string;
  status: string;
  created_at: string;
  updated_at: string;
  internships: { 
    title: string; 
    location: string;
    stipend: number | null;
    description: string;
    companies: { name: string; profiles: { display_name: string; email: string } };
  };
  students: { 
    profiles: { 
      display_name: string; 
      email: string; 
    };
    education: string;
    skills: string;
    resume_url: string;
  };
}

interface Company {
  id: string;
  name: string;
  profile_id: string;
  created_at: string;
  profiles: { email: string; display_name: string };
  _count: { internships: number };
}

interface UserProfile {
  id: string;
  email: string;
  display_name: string | null;
  role: string;
  created_at: string;
  student_data: {
    id: string;
    university: string | null;
    degree: string | null;
    graduation_year: number | null;
    bio: string | null;
  } | null;
  company_data: {
    id: string;
    name: string;
    website: string | null;
    description: string | null;
  } | null;
}

export default function AdminDataPage() {
  const [activeTab, setActiveTab] = useState<"internships" | "applications" | "companies" | "users">("internships");
  const [internships, setInternships] = useState<Internship[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === "internships") {
        const res = await fetch("/api/admin/internships");
        const data = await res.json();
        setInternships(data.internships || []);
      } else if (activeTab === "applications") {
        const res = await fetch("/api/admin/applications");
        const data = await res.json();
        setApplications(data.applications || []);
      } else if (activeTab === "companies") {
        const res = await fetch("/api/admin/companies");
        const data = await res.json();
        setCompanies(data.companies || []);
      } else if (activeTab === "users") {
        const res = await fetch("/api/admin/users");
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  };

  const deleteInternship = async (id: string, title: string) => {
    if (!confirm(`Delete internship: "${title}"?\n\nThis will also delete all applications. This cannot be undone.`)) {
      return;
    }

    setDeleting(id);
    try {
      const res = await fetch("/api/admin/delete-internship", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ internshipId: id }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to delete");
        return;
      }

      setInternships(internships.filter(i => i.id !== id));
    } catch (err) {
      alert("Failed to delete internship");
    } finally {
      setDeleting(null);
    }
  };

  const deleteApplication = async (id: string) => {
    if (!confirm("Delete this application?\n\nThis cannot be undone.")) {
      return;
    }

    setDeleting(id);
    try {
      const res = await fetch("/api/admin/delete-application", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: id }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to delete");
        return;
      }

      setApplications(applications.filter(a => a.id !== id));
    } catch (err) {
      alert("Failed to delete application");
    } finally {
      setDeleting(null);
    }
  };

  const deleteCompany = async (profileId: string, name: string) => {
    if (!confirm(`Delete company: "${name}"?\n\nThis will delete the company and all their internships and applications. This cannot be undone.`)) {
      return;
    }

    setDeleting(profileId);
    try {
      const res = await fetch("/api/admin/delete-user", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: profileId }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to delete");
        return;
      }

      setCompanies(companies.filter(c => c.profile_id !== profileId));
    } catch (err) {
      alert("Failed to delete company");
    } finally {
      setDeleting(null);
    }
  };

  const filteredInternships = internships.filter(i =>
    i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.companies.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredApplications = applications.filter(a =>
    a.internships.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.students.profiles.display_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCompanies = companies.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.profiles.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = users.filter(u =>
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.display_name && u.display_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (u.student_data?.university && u.student_data.university.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (u.company_data?.name && u.company_data.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-purple-950 via-black to-black px-6 py-12 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.25),transparent_60%),radial-gradient(circle_at_bottom_right,rgba(219,39,119,0.15),transparent_70%)]" />

      <div className="relative z-10 mx-auto w-full max-w-7xl space-y-8">
        {/* Header */}
        <section>
          <h1 className="text-3xl font-semibold">
            Data{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              Management
            </span>
          </h1>
          <p className="mt-2 text-sm text-zinc-300/80">
            Manage internships and applications with search and delete capabilities
          </p>
        </section>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("internships")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
              activeTab === "internships"
                ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                : "bg-white/5 text-zinc-400 border border-white/10 hover:bg-white/10"
            }`}
          >
            <Briefcase className="h-4 w-4" />
            Internships ({internships.length})
          </button>
          <button
            onClick={() => setActiveTab("companies")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
              activeTab === "companies"
                ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                : "bg-white/5 text-zinc-400 border border-white/10 hover:bg-white/10"
            }`}
          >
            <Briefcase className="h-4 w-4" />
            Companies ({companies.length})
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
              activeTab === "users"
                ? "bg-green-500/20 text-green-300 border border-green-500/30"
                : "bg-white/5 text-zinc-400 border border-white/10 hover:bg-white/10"
            }`}
          >
            <User className="h-4 w-4" />
            Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab("applications")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
              activeTab === "applications"
                ? "bg-pink-500/20 text-pink-300 border border-pink-500/30"
                : "bg-white/5 text-zinc-400 border border-white/10 hover:bg-white/10"
            }`}
          >
            <FileText className="h-4 w-4" />
            Applications ({applications.length})
          </button>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${activeTab}...`}
              className="pl-10"
            />
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
          </div>
        )}

        {/* Internships Table */}
        {!loading && activeTab === "internships" && (
          <Card className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/10 backdrop-blur-xl shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-white/10 bg-white/5">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-zinc-300">Title</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-zinc-300">Company</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-zinc-300">Location</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-zinc-300">Stipend</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-zinc-300">Applications</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-zinc-300">Posted</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-zinc-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredInternships.map((internship) => (
                    <tr key={internship.id} className="transition-colors hover:bg-white/5">
                      <td className="px-6 py-4">
                        <div className="font-medium text-white">{internship.title}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-300">{internship.companies.name}</td>
                      <td className="px-6 py-4 text-sm text-zinc-400">{internship.location || "Remote"}</td>
                      <td className="px-6 py-4 text-sm text-zinc-400">
                        {internship.stipend ? `₹${internship.stipend}` : "Unpaid"}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-full bg-purple-500/20 px-3 py-1 text-sm font-medium text-purple-300">
                          {internship._count?.applications || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-400">
                        {new Date(internship.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <Button
                          onClick={() => deleteInternship(internship.id, internship.title)}
                          disabled={deleting === internship.id}
                          className="h-8 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 text-xs"
                        >
                          {deleting === internship.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <>
                              <Trash2 className="h-3 w-3 mr-1" />
                              Delete
                            </>
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredInternships.length === 0 && (
                <div className="py-12 text-center text-zinc-400">
                  {searchQuery ? "No internships match your search" : "No internships found"}
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Applications Table */}
        {!loading && activeTab === "applications" && (
          <Card className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/10 backdrop-blur-xl shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-white/10 bg-white/5">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-zinc-300">Student</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-zinc-300">Internship</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-zinc-300">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-zinc-300">Applied</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-zinc-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredApplications.map((app) => (
                    <tr key={app.id} className="transition-colors hover:bg-white/5">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-white">
                            {app.students.profiles.display_name || "No Name"}
                          </div>
                          <div className="text-xs text-zinc-400">{app.students.profiles.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-300">{app.internships.title}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border ${
                          app.status === "accepted" ? "bg-green-500/20 text-green-400 border-green-500/30" :
                          app.status === "rejected" ? "bg-red-500/20 text-red-400 border-red-500/30" :
                          "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                        }`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-400">
                        {new Date(app.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <Button
                            onClick={() => setSelectedApplication(app)}
                            className="h-8 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 text-xs"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View Details
                          </Button>
                          <Button
                            onClick={() => deleteApplication(app.id)}
                            disabled={deleting === app.id}
                            className="h-8 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 text-xs"
                          >
                            {deleting === app.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <>
                                <Trash2 className="h-3 w-3 mr-1" />
                                Delete
                              </>
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredApplications.length === 0 && (
                <div className="py-12 text-center text-zinc-400">
                  {searchQuery ? "No applications match your search" : "No applications found"}
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Companies Table */}
        {!loading && activeTab === "companies" && (
          <Card className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/10 backdrop-blur-xl shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-white/10 bg-white/5">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-zinc-300">Company Name</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-zinc-300">Email</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-zinc-300">Contact Person</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-zinc-300">Internships Posted</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-zinc-300">Joined</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-zinc-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredCompanies.map((company) => (
                    <tr key={company.id} className="transition-colors hover:bg-white/5">
                      <td className="px-6 py-4">
                        <div className="font-medium text-white">{company.name}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-300">{company.profiles.email}</td>
                      <td className="px-6 py-4 text-sm text-zinc-400">{company.profiles.display_name || "N/A"}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-full bg-indigo-500/20 px-3 py-1 text-sm font-medium text-indigo-300">
                          {company._count?.internships || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-400">
                        {new Date(company.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <Button
                          onClick={() => deleteCompany(company.profile_id, company.name)}
                          disabled={deleting === company.profile_id}
                          className="h-8 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 text-xs"
                        >
                          {deleting === company.profile_id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <>
                              <Trash2 className="h-3 w-3 mr-1" />
                              Delete
                            </>
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredCompanies.length === 0 && (
                <div className="py-12 text-center text-zinc-400">
                  {searchQuery ? "No companies match your search" : "No companies found"}
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Users Table */}
        {!loading && activeTab === "users" && (
          <Card className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/10 backdrop-blur-xl shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-white/10 bg-white/5">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-zinc-300">Name</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-zinc-300">Email</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-zinc-300">Role</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-zinc-300">Details</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-zinc-300">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="transition-colors hover:bg-white/5">
                      <td className="px-6 py-4">
                        <div className="font-medium text-white">{user.display_name || "No Name"}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-300">{user.email}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border ${
                          user.role === "student" ? "bg-purple-500/20 text-purple-400 border-purple-500/30" :
                          user.role === "company" ? "bg-indigo-500/20 text-indigo-400 border-indigo-500/30" :
                          "bg-pink-500/20 text-pink-400 border-pink-500/30"
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-400">
                        {user.role === "student" && user.student_data && (
                          <div className="space-y-1">
                            {user.student_data.university && (
                              <div className="text-xs">🎓 {user.student_data.university}</div>
                            )}
                            {user.student_data.degree && (
                              <div className="text-xs">📚 {user.student_data.degree}</div>
                            )}
                            {user.student_data.graduation_year && (
                              <div className="text-xs">📅 Class of {user.student_data.graduation_year}</div>
                            )}
                          </div>
                        )}
                        {user.role === "company" && user.company_data && (
                          <div className="space-y-1">
                            <div className="font-medium text-white">{user.company_data.name}</div>
                            {user.company_data.website && (
                              <a
                                href={user.company_data.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-400 hover:text-blue-300"
                              >
                                {user.company_data.website}
                              </a>
                            )}
                          </div>
                        )}
                        {user.role === "admin" && (
                          <div className="text-xs text-pink-400">Admin Account</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-400">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredUsers.length === 0 && (
                <div className="py-12 text-center text-zinc-400">
                  {searchQuery ? "No users match your search" : "No users found"}
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Application Detail Modal */}
        {selectedApplication && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-950 via-black to-black shadow-2xl">
              {/* Header */}
              <div className="sticky top-0 flex items-center justify-between border-b border-white/10 bg-black/80 backdrop-blur-xl px-6 py-4">
                <h2 className="text-2xl font-bold text-white">Application Details</h2>
                <button
                  onClick={() => setSelectedApplication(null)}
                  className="rounded-lg p-2 text-zinc-400 transition hover:bg-white/10 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Status Banner */}
                <div className={`rounded-xl border p-4 ${
                  selectedApplication.status === "accepted" ? "bg-green-500/10 border-green-500/30" :
                  selectedApplication.status === "rejected" ? "bg-red-500/10 border-red-500/30" :
                  "bg-yellow-500/10 border-yellow-500/30"
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-zinc-400">Application Status</p>
                      <p className={`text-2xl font-bold capitalize ${
                        selectedApplication.status === "accepted" ? "text-green-400" :
                        selectedApplication.status === "rejected" ? "text-red-400" :
                        "text-yellow-400"
                      }`}>
                        {selectedApplication.status}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-zinc-400">Application ID</p>
                      <p className="text-sm font-mono text-white">{selectedApplication.id.slice(0, 8)}...</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Student Information */}
                  <Card className="rounded-xl border border-white/10 bg-white/5 p-6">
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-white mb-4">
                      <User className="h-5 w-5 text-purple-400" />
                      Student Information
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-zinc-500 uppercase">Name</p>
                        <p className="text-white font-medium">
                          {selectedApplication.students.profiles.display_name || "No Name Provided"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500 uppercase flex items-center gap-1">
                          <Mail className="h-3 w-3" /> Email
                        </p>
                        <p className="text-zinc-300 text-sm">
                          {selectedApplication.students.profiles.email}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500 uppercase">Education</p>
                        <p className="text-zinc-300 text-sm">
                          {selectedApplication.students.education || "Not specified"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500 uppercase">Skills</p>
                        <p className="text-zinc-300 text-sm">
                          {selectedApplication.students.skills || "No skills listed"}
                        </p>
                      </div>
                      {selectedApplication.students.resume_url && (
                        <div>
                          <p className="text-xs text-zinc-500 uppercase mb-1">Resume</p>
                          <a
                            href={selectedApplication.students.resume_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 underline"
                          >
                            <FileText className="h-3 w-3" />
                            View Resume
                          </a>
                        </div>
                      )}
                    </div>
                  </Card>

                  {/* Company & Internship Information */}
                  <Card className="rounded-xl border border-white/10 bg-white/5 p-6">
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-white mb-4">
                      <Building className="h-5 w-5 text-indigo-400" />
                      Internship Details
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-zinc-500 uppercase">Internship Title</p>
                        <p className="text-white font-medium">
                          {selectedApplication.internships.title}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500 uppercase">Company Name</p>
                        <p className="text-zinc-300 text-sm">
                          {selectedApplication.internships.companies.name}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500 uppercase flex items-center gap-1">
                          <Mail className="h-3 w-3" /> Company Email
                        </p>
                        <p className="text-zinc-300 text-sm">
                          {selectedApplication.internships.companies.profiles.email}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500 uppercase">Contact Person</p>
                        <p className="text-zinc-300 text-sm">
                          {selectedApplication.internships.companies.profiles.display_name || "Not specified"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500 uppercase flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> Location
                        </p>
                        <p className="text-zinc-300 text-sm">
                          {selectedApplication.internships.location || "Remote"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500 uppercase">Stipend</p>
                        <p className="text-white font-medium">
                          {selectedApplication.internships.stipend 
                            ? `₹${selectedApplication.internships.stipend.toLocaleString()}/month` 
                            : "Unpaid"}
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Internship Description */}
                <Card className="rounded-xl border border-white/10 bg-white/5 p-6">
                  <h3 className="text-lg font-semibold text-white mb-3">Internship Description</h3>
                  <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">
                    {selectedApplication.internships.description || "No description provided"}
                  </p>
                </Card>

                {/* Timeline */}
                <Card className="rounded-xl border border-white/10 bg-white/5 p-6">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-white mb-4">
                    <Calendar className="h-5 w-5 text-pink-400" />
                    Timeline
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400 text-sm">Applied On</span>
                      <span className="text-white font-medium">
                        {new Date(selectedApplication.created_at).toLocaleString('en-IN', {
                          dateStyle: 'medium',
                          timeStyle: 'short'
                        })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400 text-sm">Last Updated</span>
                      <span className="text-white font-medium">
                        {new Date(selectedApplication.updated_at).toLocaleString('en-IN', {
                          dateStyle: 'medium',
                          timeStyle: 'short'
                        })}
                      </span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
