import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

// GET company profile with all details
export async function GET() {
  try {
    const server = await getSupabaseServer();
    const admin = getSupabaseAdmin();

    const { data: { user } } = await server.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await admin
      .from("profiles")
      .select("*")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const { data: company } = await admin
      .from("companies")
      .select("*")
      .eq("profile_id", profile.id)
      .maybeSingle();

    return NextResponse.json({
      profile,
      company: company || null,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST/PUT update company profile
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, website, description, logo_url } = body;

    const server = await getSupabaseServer();
    const admin = getSupabaseAdmin();

    const { data: { user } } = await server.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get profile to get company record
    const { data: profile } = await admin
      .from("profiles")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    if (profile) {
      const { data: existingCompany } = await admin
        .from("companies")
        .select("id")
        .eq("profile_id", profile.id)
        .maybeSingle();

      const companyUpdates: any = {};
      if (name !== undefined) companyUpdates.name = name;
      if (website !== undefined) companyUpdates.website = website;
      if (description !== undefined) companyUpdates.description = description;
      if (logo_url !== undefined) companyUpdates.logo_url = logo_url;

      if (existingCompany) {
        // Update existing company
        await admin
          .from("companies")
          .update(companyUpdates)
          .eq("id", existingCompany.id);
      } else {
        // Create new company record
        await admin
          .from("companies")
          .insert({
            profile_id: profile.id,
            ...companyUpdates,
          });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE company profile
export async function DELETE(req: NextRequest) {
  try {
    const { password } = await req.json();

    if (!password) {
      return NextResponse.json({ error: "Password is required" }, { status: 400 });
    }

    const server = await getSupabaseServer();
    const admin = getSupabaseAdmin();

    const { data: { user } } = await server.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify password by attempting to sign in
    const { error: signInError } = await admin.auth.signInWithPassword({
      email: user.email!,
      password: password,
    });

    if (signInError) {
      return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
    }

    // Delete profile (cascade will delete related records)
    await admin
      .from("profiles")
      .delete()
      .eq("auth_user_id", user.id);

    // Delete auth user
    await admin.auth.admin.deleteUser(user.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
