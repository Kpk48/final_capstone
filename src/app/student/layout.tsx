import { redirect } from "next/navigation";
import { getRole } from "@/lib/access";

export default async function StudentLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const role = await getRole();
    
    // RBAC: Only students and admins can access student routes
    if (!role || (role !== "student" && role !== "admin")) {
        redirect("/forbidden");
    }

    return <>{children}</>;
}
