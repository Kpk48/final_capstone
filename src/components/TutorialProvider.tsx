"use client";
import { useEffect, useState } from "react";
import Tutorial from "./Tutorial";

export default function TutorialProvider() {
  const [role, setRole] = useState<"student" | "company" | "admin" | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRole() {
      try {
        const response = await fetch("/api/me");
        if (response.ok) {
          const data = await response.json();
          const userRole = data?.profile?.role;
          if (userRole === "student" || userRole === "company" || userRole === "admin") {
            setRole(userRole);
          }
        }
      } catch (error) {
        console.error("Failed to fetch user role:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchRole();
  }, []);

  if (loading || !role) {
    return null;
  }

  return <Tutorial role={role} />;
}
