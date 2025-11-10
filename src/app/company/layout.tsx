import { redirect } from "next/navigation";
import { getRole } from "@/lib/access";

export default async function CompanyLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const role = await getRole();
    
    // RBAC: Only companies and admins can access company routes
    if (!role || (role !== "company" && role !== "admin")) {
        redirect("/forbidden");
    }

    return <>{children}</>;
}
