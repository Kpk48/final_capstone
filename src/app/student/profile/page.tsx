"use client";
import { useEffect, useState } from "react";
import { Card, Button, Input, Label, Textarea } from "@/components/ui";
import { User2, GraduationCap, School, FileText, Loader2, CheckCircle2, Edit, Trash2, Upload, Download, X, AtSign, Save, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function StudentProfilePage() {
    const [loading, setLoading] = useState(false);
    const [initializing, setInitializing] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deletePassword, setDeletePassword] = useState("");
    const [showVisibilityConfirm, setShowVisibilityConfirm] = useState(false);
    const [visibilityPassword, setVisibilityPassword] = useState("");
    const [pendingVisibility, setPendingVisibility] = useState(false);
    
    // Profile data
    const [username, setUsername] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [email, setEmail] = useState("");
    const [isPublic, setIsPublic] = useState(false);
    const [university, setUniversity] = useState("");
    const [degree, setDegree] = useState("");
    const [graduationYear, setGraduationYear] = useState<number | undefined>();
    const [bio, setBio] = useState("");
    const [resumeText, setResumeText] = useState("");
    const [resumeUrl, setResumeUrl] = useState("");
    
    // PDF upload
    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const response = await fetch('/api/student/profile');
            if (!response.ok) throw new Error('Failed to load profile');
            
            const data = await response.json();
            console.log('Loaded profile data:', data);
            
            setUsername(data.profile.username || "");
            setDisplayName(data.profile.display_name || "");
            setEmail(data.profile.email || "");
            setIsPublic(data.profile.is_public ?? false);
            
            if (data.student) {
                console.log('Student data found:', data.student);
                setUniversity(data.student.university || "");
                setDegree(data.student.degree || "");
                setGraduationYear(data.student.graduation_year);
                setBio(data.student.bio || "");
                setResumeText(data.student.resume_text || "");
                setResumeUrl(data.student.resume_url || "");
            } else {
                console.log('No student record found');
            }
        } catch (error) {
            console.error('Load profile error:', error);
            toast.error('Failed to load profile');
        } finally {
            setInitializing(false);
        }
    };

    const handleVisibilityToggle = () => {
        // Store the pending visibility state and show confirmation
        setPendingVisibility(!isPublic);
        setShowVisibilityConfirm(true);
    };

    const confirmVisibilityChange = async () => {
        if (!visibilityPassword.trim()) {
            toast.error('Please enter your password');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/student/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    is_public: pendingVisibility,
                    password: visibilityPassword,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to update visibility');
            }
            
            setIsPublic(pendingVisibility);
            setShowVisibilityConfirm(false);
            setVisibilityPassword("");
            toast.success(`Profile is now ${pendingVisibility ? 'Public' : 'Private'}`);
        } catch (error: any) {
            toast.error(error.message || 'Failed to update visibility');
        } finally {
            setLoading(false);
        }
    };

    const onSave = async () => {
        setLoading(true);
        try {
            const payload = {
                display_name: displayName,
                university,
                degree,
                graduation_year: graduationYear,
                bio,
                resume_text: resumeText,
                resume_url: resumeUrl || undefined,
            };
            
            console.log('Saving profile with data:', payload);
            
            const response = await fetch('/api/student/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to save profile');
            }
            
            console.log('Save successful:', data);
            toast.success('Profile updated successfully!');
            setIsEditing(false);
            await loadProfile();
        } catch (error: any) {
            console.error('Save error:', error);
            toast.error(error.message || 'Failed to save profile');
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.type !== 'application/pdf') {
                toast.error('Only PDF files are allowed');
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                toast.error('File size must be less than 5MB');
                return;
            }
            setSelectedFile(file);
        }
    };

    const uploadResume = async () => {
        if (!selectedFile) return;
        
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', selectedFile);

            const response = await fetch('/api/student/resume-upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error('Upload failed');
            
            const data = await response.json();
            setResumeUrl(data.url);
            setSelectedFile(null);
            
            if (data.textExtracted) {
                toast.success(`Resume uploaded! Extracted ${data.textLength} characters for AI matching.`);
            } else {
                toast.success('Resume uploaded! (Text extraction failed - manual resume text recommended)');
            }
            
            // Reload profile to get updated resume_text
            loadProfile();
        } catch (error) {
            toast.error('Failed to upload resume');
        } finally {
            setUploading(false);
        }
    };

    const deleteProfile = async () => {
        if (!deletePassword.trim()) {
            toast.error('Please enter your password');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/student/profile', {
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
                        <h1 className="page-title">Student Profile</h1>
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
                        {isEditing ? 'Update your profile information' : 'View and manage your profile'}
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
                                    <AtSign className="h-4 w-4" /> Your Unique Username
                                </Label>
                                <div className="flex items-center gap-3">
                                    <code className="text-lg font-mono font-bold text-white bg-black/30 px-4 py-3 rounded-lg flex-1">
                                        @{username}
                                    </code>
                                    <Button
                                        onClick={() => {
                                            navigator.clipboard.writeText(username);
                                            toast.success('Username copied!');
                                        }}
                                        className="bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-200 px-4 py-2"
                                    >
                                        Copy
                                    </Button>
                                </div>
                                <p className="text-xs text-purple-200/60 mt-3">This is your unique identifier on the platform</p>
                            </div>
                        )}

                        {/* Profile Visibility Toggle */}
                        <div className="rounded-xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 p-5">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <Label className="text-sm text-blue-200 flex items-center gap-2 mb-2">
                                        {isPublic ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                        Profile Visibility
                                    </Label>
                                    <p className="text-xs text-blue-200/60">
                                        {isPublic 
                                            ? "Your profile is visible to everyone. Others can see your details and resume." 
                                            : "Your profile is private. Others can only see your username."}
                                    </p>
                                </div>
                                <Button
                                    onClick={handleVisibilityToggle}
                                    className={`ml-4 px-4 py-2 transition ${
                                        isPublic
                                            ? 'bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-200'
                                            : 'bg-zinc-500/20 hover:bg-zinc-500/30 border border-zinc-500/30 text-zinc-300'
                                    }`}
                                >
                                    {isPublic ? 'Make Private' : 'Make Public'}
                                </Button>
                            </div>
                        </div>

                        {/* Display Name */}
                        <div>
                            <Label className="text-sm text-zinc-300 flex items-center gap-2 mb-2">
                                <User2 className="h-4 w-4 text-purple-400" /> Display Name
                            </Label>
                            {isEditing ? (
                                <Input
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    placeholder="Your full name"
                                    className="bg-white/10 border-white/20 text-white placeholder-zinc-400 focus:border-purple-400 focus:ring-purple-400 h-11"
                                />
                            ) : (
                                <div className="px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white">
                                    {displayName || 'Not set'}
                                </div>
                            )}
                        </div>

                        {/* Education Section */}
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 pt-2">
                            <div>
                                <Label className="text-sm text-zinc-300 flex items-center gap-2 mb-2">
                                    <School className="h-4 w-4 text-pink-400" /> University
                                </Label>
                                {isEditing ? (
                                    <Input
                                        value={university}
                                        onChange={(e) => setUniversity(e.target.value)}
                                        placeholder="e.g., IIT Madras"
                                        className="bg-white/10 border-white/20 text-white placeholder-zinc-400 focus:border-purple-400 focus:ring-purple-400 h-11"
                                    />
                                ) : (
                                    <div className="px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white">
                                        {university || 'Not set'}
                                    </div>
                                )}
                            </div>
                            <div>
                                <Label className="text-sm text-zinc-300 flex items-center gap-2 mb-2">
                                    <GraduationCap className="h-4 w-4 text-purple-400" /> Degree
                                </Label>
                                {isEditing ? (
                                    <Input
                                        value={degree}
                                        onChange={(e) => setDegree(e.target.value)}
                                        placeholder="e.g., B.Tech in CSE"
                                        className="bg-white/10 border-white/20 text-white placeholder-zinc-400 focus:border-purple-400 focus:ring-purple-400 h-11"
                                    />
                                ) : (
                                    <div className="px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white">
                                        {degree || 'Not set'}
                                    </div>
                                )}
                            </div>
                            <div>
                                <Label className="text-sm text-zinc-300 flex items-center gap-2 mb-2">
                                    <CheckCircle2 className="h-4 w-4 text-pink-400" /> Graduation Year
                                </Label>
                                {isEditing ? (
                                    <Input
                                        type="number"
                                        value={graduationYear ?? ""}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val === "") {
                                                setGraduationYear(undefined);
                                            } else {
                                                const parsed = parseInt(val);
                                                setGraduationYear(isNaN(parsed) ? undefined : parsed);
                                            }
                                        }}
                                        placeholder="e.g., 2025"
                                        className="bg-white/10 border-white/20 text-white placeholder-zinc-400 focus:border-purple-400 focus:ring-purple-400 h-11"
                                    />
                                ) : (
                                    <div className="px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white">
                                        {graduationYear || 'Not set'}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Bio */}
                        <div className="pt-2">
                            <Label className="text-sm text-zinc-300 flex items-center gap-2 mb-2">
                                <FileText className="h-4 w-4 text-purple-400" /> Bio
                            </Label>
                            {isEditing ? (
                                <Textarea
                                    rows={4}
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    placeholder="Tell us about yourself"
                                    className="bg-white/10 border-white/20 text-white placeholder-zinc-400 focus:border-purple-400 focus:ring-purple-400"
                                />
                            ) : (
                                <div className="px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white min-h-[5rem]">
                                    {bio || 'No bio added'}
                                </div>
                            )}
                        </div>

                        {/* Resume Upload Section */}
                        <div className="space-y-4 pt-2">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                                <Label className="text-sm text-zinc-300 flex items-center gap-2">
                                    <Upload className="h-4 w-4 text-purple-400" /> Resume (PDF)
                                </Label>
                                <span className="text-xs text-purple-300 bg-purple-500/10 px-3 py-1.5 rounded-md border border-purple-500/20">
                                    🤖 AI Auto-Extract
                                </span>
                            </div>
                            <p className="text-xs text-zinc-500 leading-relaxed">
                                Upload your resume PDF and text will be automatically extracted for AI matching
                            </p>
                            
                            {resumeUrl && (
                                <div className="flex items-center gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                                    <FileText className="h-5 w-5 text-green-400 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <span className="text-sm text-green-300 block font-medium">Resume uploaded & processed</span>
                                        {resumeText && (
                                            <span className="text-xs text-green-400/70 block mt-1">
                                                {resumeText.length} characters extracted for AI matching
                                            </span>
                                        )}
                                    </div>
                                    <a
                                        href={resumeUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 text-xs text-green-400 hover:text-green-300 transition px-3 py-2 rounded-md bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 flex-shrink-0"
                                    >
                                        <Download className="h-3.5 w-3.5" /> View PDF
                                    </a>
                                </div>
                            )}

                            {isEditing && (
                                <div className="space-y-3">
                                    <input
                                        type="file"
                                        accept="application/pdf"
                                        onChange={handleFileSelect}
                                        className="hidden"
                                        id="resume-upload"
                                    />
                                    <label
                                        htmlFor="resume-upload"
                                        className="flex items-center justify-center gap-2 px-5 py-4 rounded-lg border-2 border-dashed border-white/20 hover:border-purple-400/50 bg-white/5 hover:bg-white/10 cursor-pointer transition text-sm text-zinc-300 font-medium"
                                    >
                                        <Upload className="h-5 w-5" />
                                        {selectedFile ? selectedFile.name : 'Choose PDF file (max 5MB)'}
                                    </label>
                                    {selectedFile && (
                                        <div className="flex gap-3">
                                            <Button
                                                onClick={uploadResume}
                                                disabled={uploading}
                                                className="flex-1 bg-purple-500 hover:bg-purple-600 h-11"
                                            >
                                                {uploading ? 'Uploading...' : 'Upload Resume'}
                                            </Button>
                                            <Button
                                                onClick={() => setSelectedFile(null)}
                                                className="bg-white/10 hover:bg-white/20 h-11 px-4"
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}
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

                {/* Visibility Change Confirmation Modal */}
                {showVisibilityConfirm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
                        <div className="relative w-full max-w-md rounded-2xl border border-blue-500/30 bg-black/90 p-6 text-white shadow-2xl">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="rounded-full bg-blue-500/20 p-3">
                                    {pendingVisibility ? <Eye className="h-6 w-6 text-blue-400" /> : <EyeOff className="h-6 w-6 text-blue-400" />}
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold">
                                        Change Profile Visibility?
                                    </h3>
                                    <p className="text-sm text-zinc-400">Password confirmation required</p>
                                </div>
                            </div>
                            <p className="text-sm text-zinc-300 mb-4">
                                {pendingVisibility ? (
                                    <>
                                        You are about to make your profile <strong className="text-blue-300">PUBLIC</strong>. 
                                        Everyone will be able to see your details, education, bio, and resume.
                                    </>
                                ) : (
                                    <>
                                        You are about to make your profile <strong className="text-zinc-300">PRIVATE</strong>. 
                                        Only your username will be visible to others. Your details and resume will be hidden.
                                    </>
                                )}
                            </p>
                            
                            {/* Password Verification */}
                            <div className="mb-6">
                                <Label className="text-sm text-zinc-300 mb-2 block">
                                    Enter your password to confirm
                                </Label>
                                <Input
                                    type="password"
                                    value={visibilityPassword}
                                    onChange={(e) => setVisibilityPassword(e.target.value)}
                                    placeholder="Your password"
                                    className="bg-white/10 border-blue-500/30 text-white placeholder-zinc-400 focus:border-blue-400 focus:ring-blue-400 h-11"
                                    disabled={loading}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !loading) {
                                            confirmVisibilityChange();
                                        }
                                    }}
                                />
                            </div>
                            
                            <div className="flex gap-3">
                                <Button
                                    onClick={confirmVisibilityChange}
                                    disabled={loading}
                                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <><Loader2 className="h-4 w-4 animate-spin" /> Updating...</>
                                    ) : (
                                        <>{pendingVisibility ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />} Yes, Change</>
                                    )}
                                </Button>
                                <Button
                                    onClick={() => {
                                        setShowVisibilityConfirm(false);
                                        setVisibilityPassword("");
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

                {/* Delete Confirmation Modal */}
                {showDeleteConfirm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
                        <div className="relative w-full max-w-md rounded-2xl border border-red-500/30 bg-black/90 p-6 text-white shadow-2xl">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="rounded-full bg-red-500/20 p-3">
                                    <Trash2 className="h-6 w-6 text-red-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold">Delete Profile?</h3>
                                    <p className="text-sm text-zinc-400">This action cannot be undone</p>
                                </div>
                            </div>
                            <p className="text-sm text-zinc-300 mb-4">
                                Are you sure you want to delete your profile? All your data, including applications and saved information, will be permanently removed.
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
