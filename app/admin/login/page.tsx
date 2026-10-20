import { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/app/lib/auth";
import { ensureTablesExist } from "@/app/lib/actions/admin";
import { isCanonicalAdmin } from "@/app/lib/security";
import AdminLoginForm from "./(components)/AdminLoginForm";

export const metadata: Metadata = {
  title: "Admin Login | Bellaro",
  description: "Sign in to the Bellaro Store Operations Console",
  robots: {
    index: false,
    follow: false,
  },
};

export const instant = false;

interface Props {
  searchParams: Promise<{ error?: string }>;
}

export default async function AdminLoginPage({ searchParams }: Props) {
  await ensureTablesExist();

  const resolvedSearchParams = await searchParams;
  const reqHeaders = await headers();
  const session = await auth.api.getSession({
    headers: reqHeaders,
  });

  if (session?.user && isCanonicalAdmin(session.user as any)) {
    redirect("/admin");
  }

  return (
    <AdminLoginForm
      initialError={resolvedSearchParams?.error}
      currentUserRole={session?.user ? ((session.user as any).role || "user") : undefined}
      currentUserEmail={session?.user?.email}
    />
  );
}
