"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Home,
  Dog,
  ClipboardList,
  LineChart,
  MessageSquare,
  CreditCard,
  Settings,
  LogOut,
  Cat,
  Crown,
} from "lucide-react"

const navigation = [
  { name: "홈", href: "/dashboard", icon: Home },
  { name: "반려동물", href: "/pets", icon: Dog },
  { name: "건강 기록", href: "/health", icon: ClipboardList },
  { name: "건강 리포트", href: "/reports", icon: LineChart },
  { name: "AI 상담", href: "/chat", icon: MessageSquare },
  { name: "구독 관리", href: "/subscription", icon: CreditCard },
  { name: "설정", href: "/settings", icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  return (
    <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r bg-card px-6 pb-4">
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center gap-2">
          <Dog className="h-8 w-8 text-blue-500" />
          <span className="text-2xl font-bold text-primary">PetWatch</span>
          <Cat className="h-8 w-8 text-purple-500" />
        </div>

        {/* User Info */}
        <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
          <Avatar>
            <AvatarImage src={session?.user?.image || ""} />
            <AvatarFallback>
              {session?.user?.name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {session?.user?.name || "사용자"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {session?.user?.email}
            </p>
          </div>
        </div>

        {/* Subscription Badge */}
        <div className="flex items-center justify-between rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 p-3 text-white">
          <div>
            <p className="text-xs opacity-90">현재 플랜</p>
            <p className="font-semibold flex items-center gap-1">
              <Crown className="h-4 w-4" />
              무료
            </p>
          </div>
          <Button size="sm" variant="secondary" asChild>
            <Link href="/subscription">업그레이드</Link>
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-1">
            {navigation.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href))
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    {item.name}
                  </Link>
                </li>
              )
            })}
          </ul>

          {/* Logout */}
          <Button
            variant="ghost"
            className="justify-start gap-x-3 text-muted-foreground hover:text-foreground"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            <LogOut className="h-5 w-5" />
            로그아웃
          </Button>
        </nav>
      </div>
    </aside>
  )
}
