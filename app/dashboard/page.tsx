import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <main className="mx-auto max-w-4xl py-10">
      <h1 className="mb-4 text-2xl font-semibold">Dashboard</h1>
      <p>Welcome. Your plant API keys and usage will live here.</p>
    </main>
  );
}
