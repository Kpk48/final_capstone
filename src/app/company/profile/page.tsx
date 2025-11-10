"use client";
import { useEffect, useState } from "react";
import { Card, Button, Input, Label, Textarea } from "@/components/ui";
import { Building2, Globe2, FileText, Loader2, Edit, Trash2, X, AtSign, Save, Image } from "lucide-react";
import { toast } from "sonner";

export default function CompanyProfilePage() {
    const [loading, setLoading] = useState(false);
    const [initializing, setInitializing] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deletePassword, setDeletePassword] = useState("");
    
    // Profile data
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [website, setWebsite] = useState("");
    const [description, setDescription] = useState("");
    const [logoUrl, setLogoUrl] = useState("");

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const response = await fetch('/api/company/profile');
            if (!response.ok) throw new Error('Failed to load profile');
            
            const data = await response.json();
            
            setUsername(data.profile.username || "");
            setEmail(data.profile.email || "");
            
            if (data.company) {
                setName(data.company.name || "");
                setWebsite(data.company.website || "");
                setDescription(data.company.description || "");
                setLogoUrl(data.company.logo_url || "");
            }
        } catch (error) {
            toast.error('Failed to load profile');
        } finally {
            setInitializing(false);
        }
    };

    const onSave = async () => {
        if (!name.trim()) {
            toast.error('Company name is required');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/company/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    website,
                    description,
                    logo_url: logoUrl,
                }),
            });

            if (!response.ok) throw new Error('Failed to save profile');
            
            toast.success('Profile updated successfully!');
            setIsEditing(false);
            loadProfile();
        } catch (error) {
            toast.error('Failed to save profile');
        } finally {
            setLoading(false);
        }
    };

    const deleteProfile = async () => {
        if (!deletePassword.trim()) {
            toast.error('Please enter your password');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/company/profile', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: deletePassword }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to delete profile');
            }
            
            toast.success('Profile deleted successfully');
            window.location.href = '/';
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete profile');
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen text-white">
            <div className="absolute inset-0 -z-10 bg-gradient-to-br from-purple-950 via-black to-black" />
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.25),transparent_60%),radial-gradient(circle_at_bottom_right,rgba(219,39,119,0.2),transparent_70%)]" />

            <div className="page-shell max-w-3xl">
                <div className="page-hero text-center">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <h1 className="page-title">Company Profile</h1>
                        {!isEditing && !initializing && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="rounded-lg p-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 transition"
                                title="Edit Profile"
                            >
                                <Edit className="h-5 w-5 text-purple-300" />
                            </button>
                        )}
                    </div>
                    <p className="page-subtitle mt-3">
                        {isEditing ? 'Update your company information' : 'View and manage your company profile'}
                    </p>
                </div>

                {initializing ? (
                    <div className="flex h-48 items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 text-sm text-zinc-300">
                        <Loader2 className="h-5 w-5 animate-spin text-purple-300" />
                        Loading profile…
                    </div>
                ) : (
                    <Card className="section-card space-y-8">
                        {/* Username - Display Only */}
                        {username && (
                            <div className="rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 p-5">
                                <Label className="text-sm text-purple-200 flex items-center gap-2 mb-3">
                                    <AtSign className="h-4 w-4" /> Your Unique Company ID
                                </Label>
                                <div className="flex items-center gap-3">
                                    <code className="text-lg font-mono font-bold text-white bg-black/30 px-4 py-3 rounded-lg flex-1">
                                        @{username}
                                    </code>
                                    <Button
                                        onClick={() => {
                                            navigator.clipboard.writeText(username);
                                            toast.success('Company ID copied!');
                                        }}
                                        className="bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-200 px-4 py-2"
                                    >
                                        Copy
                                    </Button>
                                </div>
                                <p className="text-xs text-purple-200/60 mt-3">This is your unique company identifier on the platform</p>
                            </div>
                        )}

                        {/* Company Name */}
                        <div>
                            <Label className="text-sm text-zinc-300 flex items-center gap-2 mb-2">
                                <Building2 className="h-4 w-4 text-purple-400" /> Company Name
                            </Label>
                            {isEditing ? (
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g., Acme Technologies Pvt Ltd"
                                    required
                                    className="bg-white/10 border-white/20 text-white placeholder-zinc-400 focus:border-purple-400 focus:ring-purple-400 h-11"
                                />
                            ) : (
                                <div className="px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white">
                                    {name || 'Not set'}
                                </div>
                            )}
                        </div>

                        {/* Website */}
                        <div>
                            <Label className="text-sm text-zinc-300 flex items-center gap-2 mb-2">
                                <Globe2 className="h-4 w-4 text-pink-400" /> Website
                            </Label>
                            {isEditing ? (
                                <Input
                                    type="url"
                                    value={website}
                                    onChange={(e) => setWebsite(e.target.value)}
                                    placeholder="https://www.company.com"
                                    className="bg-white/10 border-white/20 text-white placeholder-zinc-400 focus:border-purple-400 focus:ring-purple-400 h-11"
                                />
                            ) : (
                                <div className="px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white">
                                    {website ? (
                                        <a href={website} target="_blank" rel="noopener noreferrer" className="text-purple-300 hover:text-purple-200 transition underline">
                                            {website}
                                        </a>
                                    ) : (
                                        'No website'
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Logo URL */}
                        <div>
                            <Label className="text-sm text-zinc-300 flex items-center gap-2 mb-2">
                                <Image className="h-4 w-4 text-purple-400" /> Logo URL
                            </Label>
                            {isEditing ? (
                                <Input
                                    type="url"
                                    value={logoUrl}
                                    onChange={(e) => setLogoUrl(e.target.value)}
                                    placeholder="https://example.com/logo.png"
                                    className="bg-white/10 border-white/20 text-white placeholder-zinc-400 focus:border-purple-400 focus:ring-purple-400 h-11"
                                />
                            ) : logoUrl ? (
                                <div className="px-4 py-3 rounded-lg bg-white/5 border border-white/10">
                                    <img src={logoUrl} alt="Company logo" className="h-16 object-contain" />
                                </div>
                            ) : (
                                <div className="px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-zinc-500">
                                    No logo
                                </div>
                            )}
                        </div>

                        {/* Description */}
                        <div className="pt-2">
                            <Label className="text-sm text-zinc-300 flex items-center gap-2 mb-2">
                                <FileText className="h-4 w-4 text-purple-400" /> Company Description
                            </Label>
                            {isEditing ? (
                                <Textarea
                                    rows={6}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Describe your company, work culture, and focus areas..."
                                    className="bg-white/10 border-white/20 text-white placeholder-zinc-400 focus:border-purple-400 focus:ring-purple-400"
                                />
                            ) : (
                                <div className="px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white min-h-[8rem]">
                                    {description || 'No description added'}
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-6 mt-2 border-t border-white/10">
                            {isEditing ? (
                                <>
                                    <Button
                                        onClick={onSave}
                                        disabled={loading}
                                        className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2"
                                    >
                                        {loading ? (
                                            <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
                                        ) : (
                                            <><Save className="h-4 w-4" /> Save Changes</>
                                        )}
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            setIsEditing(false);
                                            loadProfile();
                                        }}
                                        className="bg-white/10 hover:bg-white/20 text-white"
                                    >
                                        Cancel
                                    </Button>
                                </>
                            ) : (
                                <Button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 hover:text-red-200 flex items-center gap-2"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Delete Profile
                                </Button>
                            )}
                        </div>
                    </Card>
                )}

                {/* Delete Confirmation Modal */}
                {showDeleteConfirm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
                        <div className="relative w-full max-w-md rounded-2xl border border-red-500/30 bg-black/90 p-6 text-white shadow-2xl">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="rounded-full bg-red-500/20 p-3">
                                    <Trash2 className="h-6 w-6 text-red-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold">Delete Company Profile?</h3>
                                    <p className="text-sm text-zinc-400">This action cannot be undone</p>
                                </div>
                            </div>
                            <p className="text-sm text-zinc-300 mb-4">
                                Are you sure you want to delete your company profile? All your data, including posted internships and applications, will be permanently removed.
                            </p>
                            
                            {/* Password Verification */}
                            <div className="mb-6">
                                <Label className="text-sm text-zinc-300 mb-2 block">
                                    Enter your password to confirm
                                </Label>
                                <Input
                                    type="password"
                                    value={deletePassword}
                                    onChange={(e) => setDeletePassword(e.target.value)}
                                    placeholder="Your password"
                                    className="bg-white/10 border-red-500/30 text-white placeholder-zinc-400 focus:border-red-400 focus:ring-red-400 h-11"
                                    disabled={loading}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !loading) {
                                            deleteProfile();
                                        }
                                    }}
                                />
                            </div>
                            
                            <div className="flex gap-3">
                                <Button
                                    onClick={deleteProfile}
                                    disabled={loading}
                                    className="flex-1 bg-red-500 hover:bg-red-600 text-white flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <><Loader2 className="h-4 w-4 animate-spin" /> Deleting...</>
                                    ) : (
                                        <><Trash2 className="h-4 w-4" /> Yes, Delete</>
                                    )}
                                </Button>
                                <Button
                                    onClick={() => {
                                        setShowDeleteConfirm(false);
                                        setDeletePassword("");
                                    }}
                                    disabled={loading}
                                    className="flex-1 bg-white/10 hover:bg-white/20 text-white"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
