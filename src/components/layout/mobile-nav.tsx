"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, Dog, Plus, LineChart, User } from "lucide-react"

const navigation = [
  { name: "홈", href: "/dashboard", icon: Home },
  { name: "반려동물", href: "/pets", icon: Dog },
  { name: "기록", href: "/health/quick", icon: Plus, highlight: true },
  { name: "리포트", href: "/reports", icon: LineChart },
  { name: "내 정보", href: "/settings", icon: User },
]

export default function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-card">
      <div className="flex items-center justify-around h-16">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href))

          if (item.highlight) {
            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex flex-col items-center justify-center -mt-5"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
                  <item.icon className="h-6 w-6" />
                </div>
                <span className="text-[10px] mt-1 text-muted-foreground">
                  {item.name}
                </span>
              </Link>
            )
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] mt-1">{item.name}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
