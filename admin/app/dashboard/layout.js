"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, api } from "../../lib/api";
import Sidebar from "../../components/Sidebar";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    api("/users/me")
      .then((user) => {
        if (user.role !== "admin") {
          router.replace("/login");
        } else {
          setReady(true);
        }
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  if (!ready) return <div className="min-h-screen bg-gray-900 flex items-center justify-center"><p className="text-gray-500">Loading...</p></div>;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}
