"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dog, Cat, Loader2, Check } from "lucide-react"

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const passwordRequirements = [
    { met: password.length >= 8, text: "8자 이상" },
    { met: /[A-Za-z]/.test(password), text: "영문자 포함" },
    { met: /[0-9]/.test(password), text: "숫자 포함" },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage("")

    if (password !== confirmPassword) {
      setErrorMessage("비밀번호가 일치하지 않습니다.")
      setIsLoading(false)
      return
    }

    if (!passwordRequirements.every((req) => req.met)) {
      setErrorMessage("비밀번호 요구사항을 모두 충족해주세요.")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "회원가입에 실패했습니다.")
      }

      router.push("/login?registered=true")
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "회원가입 중 오류가 발생했습니다.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Dog className="h-8 w-8 text-blue-500" />
            <span className="text-2xl font-bold text-orange-500">PetWatch</span>
            <Cat className="h-8 w-8 text-purple-500" />
          </div>
          <CardTitle className="text-2xl font-bold">회원가입</CardTitle>
          <CardDescription>
            우리 아이 건강, AI가 24시간 지켜봐요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div className="p-3 text-sm text-red-500 bg-red-50 rounded-lg">
                {errorMessage}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">이름</Label>
              <Input
                id="name"
                type="text"
                placeholder="홍길동"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {passwordRequirements.map((req, index) => (
                  <span
                    key={index}
                    className={`text-xs flex items-center gap-1 ${
                      req.met ? "text-green-600" : "text-muted-foreground"
                    }`}
                  >
                    <Check className={`h-3 w-3 ${req.met ? "opacity-100" : "opacity-30"}`} />
                    {req.text}
                  </span>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">비밀번호 확인</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-500">비밀번호가 일치하지 않습니다.</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  가입 중...
                </>
              ) : (
                "무료로 시작하기"
              )}
            </Button>
          </form>
          <p className="text-xs text-center text-muted-foreground mt-4">
            가입하시면{" "}
            <Link href="/terms" className="underline">
              이용약관
            </Link>{" "}
            및{" "}
            <Link href="/privacy" className="underline">
              개인정보처리방침
            </Link>
            에 동의하게 됩니다.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            이미 계정이 있으신가요?{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">
              로그인
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
