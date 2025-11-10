import { redirect } from "next/navigation";
import { getRole } from "@/lib/access";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const role = await getRole();
    
    // RBAC: Only admins can access admin routes
    if (!role || role !== "admin") {
        redirect("/forbidden");
    }

    return <>{children}</>;
}
