import type { Metadata } from "next";
import AdminApp from "@/components/admin/AdminApp";

export const metadata: Metadata = {
  title: "Admin — Masterclass Clock",
  description: "Espace de gestion de Masterclass Clock.",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminApp />;
}