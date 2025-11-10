"use client";
import { useEffect, useState } from "react";
import { Card, Button } from "@/components/ui";
import { Users, User2, Briefcase, ShieldCheck, Loader2 } from "lucide-react";

interface User {
  id: string;
  email: string;
  display_name: string | null;
  role: "student" | "company" | "admin";
  created_at: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadUsers = () => {
    setLoading(true);
    fetch("/api/admin/users")
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) setError(j.error || "Failed to load users");
        else setUsers(j.users || []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const deleteUser = async (userId: string, email: string) => {
    if (!confirm(`Are you sure you want to delete user: ${email}?\n\nThis action cannot be undone.`)) {
      return;
    }

    setDeleting(userId);
    try {
      const res = await fetch("/api/admin/delete-user", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to delete user");
        return;
      }

      // Remove from list
      setUsers(users.filter(u => u.id !== userId));
    } catch (err) {
      alert("Failed to delete user");
    } finally {
      setDeleting(null);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "student":
        return <User2 className="h-4 w-4 text-blue-400" />;
      case "company":
        return <Briefcase className="h-4 w-4 text-purple-400" />;
      case "admin":
        return <ShieldCheck className="h-4 w-4 text-pink-400" />;
      default:
        return <Users className="h-4 w-4 text-gray-400" />;
    }
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case "student":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "company":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "admin":
        return "bg-pink-500/10 text-pink-400 border-pink-500/20";
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/20";
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-purple-950 via-black to-black px-6 py-12 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.25),transparent_60%),radial-gradient(circle_at_bottom_right,rgba(219,39,119,0.15),transparent_70%)]" />

      <div className="relative z-10 mx-auto w-full max-w-6xl space-y-8">
        {/* Header */}
        <section className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold">
              User{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                Management
              </span>
            </h1>
            <p className="mt-2 text-sm text-zinc-300/80">
              View and manage all registered users on the platform.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-2 backdrop-blur-xl">
            <Users className="h-5 w-5 text-purple-400" />
            <span className="text-xl font-semibold">{users.length}</span>
            <span className="text-sm text-zinc-400">Users</span>
          </div>
        </section>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
          </div>
        )}

        {/* Users Table */}
        {!loading && !error && (
          <Card className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/10 backdrop-blur-xl shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-white/10 bg-white/5">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-zinc-300">
                      User
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-zinc-300">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-zinc-300">
                      Role
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-zinc-300">
                      Joined
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-zinc-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="transition-colors hover:bg-white/5"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-white/10">
                            {getRoleIcon(user.role)}
                          </div>
                          <div>
                            <div className="font-medium text-white">
                              {user.display_name || "No Name"}
                            </div>
                            <div className="text-xs text-zinc-400">
                              ID: {user.id.slice(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-300">
                        {user.email}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${getRoleBadgeClass(
                            user.role
                          )}`}
                        >
                          {getRoleIcon(user.role)}
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-400">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        {user.role === "admin" ? (
                          <span className="text-xs text-zinc-500">Protected</span>
                        ) : (
                          <Button
                            onClick={() => deleteUser(user.id, user.email)}
                            disabled={deleting === user.id}
                            className="h-8 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 text-xs"
                          >
                            {deleting === user.id ? (
                              <>
                                <Loader2 className="h-3 w-3 animate-spin" />
                              </>
                            ) : (
                              "Delete"
                            )}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {users.length === 0 && (
                <div className="py-12 text-center text-zinc-400">
                  No users found
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
