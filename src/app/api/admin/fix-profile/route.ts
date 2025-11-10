import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * Utility endpoint to fix admin users that were created without proper profiles
 * Call this with the admin's email to create/update their profile
 */
export async function POST(req: Request) {
    const body = await req.json();
    const { email, adminCode } = body;

    // Verify admin code for security
    if (!adminCode || adminCode !== process.env.ADMIN_CODE) {
        return NextResponse.json({ error: "Invalid admin access code" }, { status: 403 });
    }

    const admin = getSupabaseAdmin();

    // Find the user by email
    const { data: { users }, error: listError } = await admin.auth.admin.listUsers();
    
    if (listError) {
        return NextResponse.json({ error: listError.message }, { status: 400 });
    }

    const user = users.find(u => u.email === email);
    
    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if profile exists
    const { data: existingProfile } = await admin
        .from("profiles")
        .select("*")
        .eq("auth_user_id", user.id)
        .maybeSingle();

    if (existingProfile) {
        // Update existing profile to admin role
        const { error: updateError } = await admin
            .from("profiles")
            .update({ role: "admin" })
            .eq("auth_user_id", user.id);

        if (updateError) {
            return NextResponse.json({ error: "Failed to update profile: " + updateError.message }, { status: 400 });
        }

        return NextResponse.json({ 
            success: true, 
            message: "Profile updated to admin role",
            profile: existingProfile 
        });
    } else {
        // Create new profile with admin role
        const { error: insertError } = await admin
            .from("profiles")
            .insert({
                auth_user_id: user.id,
                email: user.email,
                role: "admin",
                display_name: user.user_metadata?.display_name || user.email,
            });

        if (insertError) {
            return NextResponse.json({ error: "Failed to create profile: " + insertError.message }, { status: 400 });
        }

        return NextResponse.json({ 
            success: true, 
            message: "Admin profile created successfully" 
        });
    }
}
