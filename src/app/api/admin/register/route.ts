import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
    const body = await req.json();
    const { email, password, displayName, adminCode } = body;

    // check against the secret ADMIN_CODE stored in .env
    if (!adminCode || adminCode !== process.env.ADMIN_CODE) {
        return NextResponse.json({ error: "Invalid admin access code" }, { status: 403 });
    }

    const admin = getSupabaseAdmin();

    // create user with admin role
    const { data, error } = await admin.auth.admin.createUser({
        email,
        password,
        user_metadata: { role: "admin", display_name: displayName },
        email_confirm: true,
    });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Create profile with admin role in database
    const { error: profileError } = await admin
        .from("profiles")
        .insert({
            auth_user_id: data.user.id,
            email: email,
            role: "admin",
            display_name: displayName,
        });

    if (profileError) {
        // If profile creation fails, clean up the user
        await admin.auth.admin.deleteUser(data.user.id);
        return NextResponse.json({ error: "Failed to create admin profile: " + profileError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, user: data.user });
}
