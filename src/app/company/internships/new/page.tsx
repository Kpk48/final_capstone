"use client";
import { useState } from "react";
import { Button, Card, Input, Label, Textarea } from "@/components/ui";
import { Briefcase, MapPin, Laptop, Coins, Users, CheckCircle2 } from "lucide-react";

export default function NewInternshipPage() {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [location, setLocation] = useState("");
    const [isRemote, setIsRemote] = useState(true);
    const [stipend, setStipend] = useState<number | undefined>();
    const [openings, setOpenings] = useState<number>(1);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        const res = await fetch("/api/company/internships/new", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                title,
                description,
                location,
                is_remote: isRemote,
                stipend,
                openings,
            }),
        });
        const json = await res.json();
        if (!res.ok) setMessage(json.error || "Failed to post internship");
        else {
            setMessage("✅ Internship posted successfully!");
            setTitle("");
            setDescription("");
            setLocation("");
            setIsRemote(true);
            setStipend(undefined);
            setOpenings(1);
        }
        setLoading(false);
    };

    return (
        <div className="relative min-h-screen bg-gradient-to-br from-purple-950 via-black to-black px-6 py-12 text-white">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.2),transparent_60%),radial-gradient(circle_at_bottom_right,rgba(219,39,119,0.15),transparent_70%)]" />

            <div className="relative z-10 mx-auto w-full max-w-3xl space-y-8">
                {/* Header */}
                <div className="text-center space-y-3">
                    <h1 className="text-3xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                        Post a New Internship
                    </h1>
                    <p className="text-sm text-zinc-400">
                        Fill in the details below to list a new internship opportunity for students.
                    </p>
                </div>

                {/* Form */}
                <Card className="rounded-2xl border border-white/10 bg-white/10 backdrop-blur-xl p-8 shadow-2xl space-y-6">
                    <form onSubmit={submit} className="space-y-6">
                        {/* Title */}
                        <div>
                            <Label className="text-sm text-zinc-300 flex items-center gap-2">
                                <Briefcase className="h-4 w-4 text-purple-400" /> Internship Title
                            </Label>
                            <Input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                placeholder="e.g., Frontend Developer Intern"
                                className="mt-2 bg-white/10 border-white/20 text-white placeholder-zinc-400 focus:border-purple-400 focus:ring-purple-400"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <Label className="text-sm text-zinc-300 flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-pink-400" /> Description
                            </Label>
                            <Textarea
                                rows={6}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                required
                                placeholder="Describe the internship responsibilities, requirements, and expectations..."
                                className="mt-2 bg-white/10 border-white/20 text-white placeholder-zinc-400 focus:border-purple-400 focus:ring-purple-400"
                            />
                        </div>

                        {/* Grid Section */}
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                            {/* Location */}
                            <div>
                                <Label className="text-sm text-zinc-300 flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-purple-400" /> Location
                                </Label>
                                <Input
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    placeholder="e.g., Bangalore"
                                    className="mt-2 bg-white/10 border-white/20 text-white placeholder-zinc-400 focus:border-purple-400 focus:ring-purple-400"
                                />
                            </div>

                            {/* Remote */}
                            <div>
                                <Label className="text-sm text-zinc-300 flex items-center gap-2">
                                    <Laptop className="h-4 w-4 text-pink-400" /> Remote Option
                                </Label>
                                <div className="flex items-center gap-2 mt-2">
                                    <input
                                        id="remote"
                                        type="checkbox"
                                        checked={isRemote}
                                        onChange={(e) => setIsRemote(e.target.checked)}
                                        className="h-4 w-4 accent-purple-500 cursor-pointer"
                                    />
                                    <label htmlFor="remote" className="text-sm text-zinc-300">
                                        Work remotely
                                    </label>
                                </div>
                            </div>

                            {/* Openings */}
                            <div>
                                <Label className="text-sm text-zinc-300 flex items-center gap-2">
                                    <Users className="h-4 w-4 text-purple-400" /> Openings
                                </Label>
                                <Input
                                    type="number"
                                    min={1}
                                    value={openings}
                                    onChange={(e) => setOpenings(parseInt(e.target.value) || 1)}
                                    className="mt-2 bg-white/10 border-white/20 text-white placeholder-zinc-400 focus:border-purple-400 focus:ring-purple-400"
                                />
                            </div>
                        </div>

                        {/* Stipend */}
                        <div>
                            <Label className="text-sm text-zinc-300 flex items-center gap-2">
                                <Coins className="h-4 w-4 text-pink-400" /> Stipend (optional)
                            </Label>
                            <Input
                                type="number"
                                value={stipend ?? ""}
                                onChange={(e) => setStipend(parseFloat(e.target.value))}
                                placeholder="Enter stipend amount"
                                className="mt-2 bg-white/10 border-white/20 text-white placeholder-zinc-400 focus:border-purple-400 focus:ring-purple-400"
                            />
                        </div>

                        {/* Message */}
                        {message && (
                            <p
                                className={`text-sm px-3 py-2 rounded-md ${
                                    message.includes("success")
                                        ? "text-green-400 bg-green-500/10 border border-green-500/20"
                                        : "text-red-400 bg-red-500/10 border border-red-500/20"
                                }`}
                            >
                                {message}
                            </p>
                        )}

                        {/* Button */}
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold shadow-lg shadow-purple-500/20"
                        >
                            {loading ? "Posting..." : "Post Internship"}
                        </Button>
                    </form>
                </Card>
            </div>
        </div>
    );
}
