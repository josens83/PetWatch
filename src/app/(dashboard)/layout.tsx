import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import Sidebar from "@/components/layout/sidebar"
import MobileNav from "@/components/layout/mobile-nav"
import Providers from "@/components/providers/session-provider"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  return (
    <Providers>
      <div className="min-h-screen bg-background">
        <Sidebar />
        <div className="lg:pl-64">
          <main className="pb-20 lg:pb-0">{children}</main>
        </div>
        <MobileNav />
      </div>
    </Providers>
  )
}
