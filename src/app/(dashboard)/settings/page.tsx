"use client"

import { useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  User,
  Bell,
  Shield,
  CreditCard,
  LogOut,
  ChevronRight,
  Moon,
  Sun,
  Smartphone,
  Mail,
  Crown,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function SettingsPage() {
  const { data: session } = useSession()
  const [notifications, setNotifications] = useState({
    health: true,
    meal: true,
    walk: false,
    marketing: false,
  })

  const settingsSections = [
    {
      title: "계정",
      items: [
        {
          icon: User,
          label: "프로필 수정",
          description: "이름, 이메일, 프로필 사진 변경",
          href: "/settings/profile",
        },
        {
          icon: Shield,
          label: "비밀번호 변경",
          description: "계정 보안을 위해 정기적으로 변경하세요",
          href: "/settings/password",
        },
      ],
    },
    {
      title: "구독",
      items: [
        {
          icon: Crown,
          label: "구독 관리",
          description: "플랜 변경, 결제 정보 관리",
          href: "/subscription",
          badge: "무료",
        },
        {
          icon: CreditCard,
          label: "결제 내역",
          description: "이전 결제 내역 확인",
          href: "/settings/billing",
        },
      ],
    },
    {
      title: "앱 설정",
      items: [
        {
          icon: Bell,
          label: "알림 설정",
          description: "푸시 알림, 이메일 알림 관리",
          href: "/settings/notifications",
        },
        {
          icon: Smartphone,
          label: "연결된 기기",
          description: "IoT 기기 및 로그인된 기기 관리",
          href: "/settings/devices",
        },
      ],
    },
  ]

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">설정</h1>
        <p className="text-muted-foreground">계정 및 앱 설정을 관리합니다</p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={session?.user?.image || ""} />
              <AvatarFallback className="text-lg">
                {session?.user?.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-xl font-semibold">{session?.user?.name}</h2>
              <p className="text-muted-foreground">{session?.user?.email}</p>
              <Badge variant="secondary" className="mt-2">
                <Crown className="h-3 w-3 mr-1" />
                무료 플랜
              </Badge>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/subscription">업그레이드</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Settings Sections */}
      {settingsSections.map((section) => (
        <div key={section.title} className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground px-1">
            {section.title}
          </h3>
          <Card>
            <CardContent className="p-0 divide-y">
              {section.items.map((item, index) => (
                <Link
                  key={index}
                  href={item.href}
                  className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    <item.icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{item.label}</p>
                      {item.badge && (
                        <Badge variant="outline" className="text-xs">
                          {item.badge}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {item.description}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      ))}

      {/* Quick Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">빠른 알림 설정</CardTitle>
          <CardDescription>주요 알림을 빠르게 켜고 끌 수 있습니다</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: "health", label: "건강 알림", description: "이상 징후 감지 시 알림" },
            { key: "meal", label: "식사 알림", description: "식사 시간 알림" },
            { key: "walk", label: "산책 알림", description: "산책 시간 알림" },
            { key: "marketing", label: "마케팅 알림", description: "이벤트 및 프로모션 알림" },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between">
              <div>
                <p className="font-medium">{item.label}</p>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
              <button
                onClick={() =>
                  setNotifications((prev) => ({
                    ...prev,
                    [item.key]: !prev[item.key as keyof typeof notifications],
                  }))
                }
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                  notifications[item.key as keyof typeof notifications]
                    ? "bg-primary"
                    : "bg-muted"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform",
                    notifications[item.key as keyof typeof notifications]
                      ? "translate-x-6"
                      : "translate-x-1"
                  )}
                />
              </button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-lg text-red-600">계정</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            <LogOut className="mr-2 h-4 w-4" />
            로그아웃
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            계정 삭제
          </Button>
        </CardContent>
      </Card>

      {/* App Info */}
      <div className="text-center text-sm text-muted-foreground pt-4">
        <p>PetWatch v1.0.0</p>
        <div className="flex items-center justify-center gap-4 mt-2">
          <Link href="/terms" className="hover:underline">
            이용약관
          </Link>
          <Link href="/privacy" className="hover:underline">
            개인정보처리방침
          </Link>
          <Link href="/support" className="hover:underline">
            고객센터
          </Link>
        </div>
      </div>
    </div>
  )
}
