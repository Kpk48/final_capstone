import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const { applicationId, status } = await req.json();
    
    if (!applicationId || !['applied', 'under_review', 'selected', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: "Invalid request parameters" },
        { status: 400 }
      );
    }

    const server = await getSupabaseServer();
    const admin = getSupabaseAdmin();
    
    // Get current user
    const { data: { user } } = await server.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get company profile
    const { data: profile } = await admin
      .from('profiles')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 403 }
      );
    }

    // Get company
    const { data: company } = await admin
      .from('companies')
      .select('id')
      .eq('profile_id', profile.id)
      .single();

    if (!company) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 403 }
      );
    }

    // Get application with internship details and current status
    const { data: application } = await admin
      .from('applications')
      .select('*, internships!inner(id, company_id, openings)')
      .eq('id', applicationId)
      .single();

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    // Check if company owns the internship
    if (application.internships.company_id !== company.id) {
      return NextResponse.json(
        { error: "Not authorized to update this application" },
        { status: 403 }
      );
    }

    const oldStatus = application.status;
    const newStatus = status;
    const internshipId = application.internships.id;

    // If changing to selected, check available seats
    if (newStatus === 'selected' && oldStatus !== 'selected') {
      // Count currently selected applications
      const { count } = await admin
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .eq('internship_id', internshipId)
        .eq('status', 'selected');

      if (count !== null && count >= application.internships.openings) {
        return NextResponse.json(
          { error: "No seats available for this internship" },
          { status: 400 }
        );
      }
    }

    // Update application status
    const { error: updateError } = await admin
      .from('applications')
      .update({ status: newStatus })
      .eq('id', applicationId);

    if (updateError) {
      throw updateError;
    }

    // Update internship openings count
    let openingsDelta = 0;
    
    if (oldStatus !== 'selected' && newStatus === 'selected') {
      // Newly selected - decrease openings
      openingsDelta = -1;
    } else if (oldStatus === 'selected' && newStatus !== 'selected') {
      // Deselected - increase openings
      openingsDelta = 1;
    }

    if (openingsDelta !== 0) {
      const { data: currentInternship } = await admin
        .from('internships')
        .select('openings')
        .eq('id', internshipId)
        .single();

      if (currentInternship) {
        const newOpenings = Math.max(0, currentInternship.openings + openingsDelta);
        await admin
          .from('internships')
          .update({ openings: newOpenings })
          .eq('id', internshipId);
      }
    }

    return NextResponse.json({ 
      success: true,
      openingsDelta 
    });
  } catch (error: any) {
    console.error('Error updating application status:', error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
