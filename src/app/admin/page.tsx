import type { Metadata } from "next";
import AdminApp from "@/components/admin/AdminApp";

export const metadata: Metadata = {
  title: "Admin — MS-END",
  description: "Espace de gestion du compte à rebours.",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminApp />;
}