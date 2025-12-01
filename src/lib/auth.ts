import { PrismaAdapter } from "@auth/prisma-adapter"
import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { prisma } from "@/lib/db"
import { compare, hash } from "bcryptjs"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions["adapter"],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    signUp: "/register",
    error: "/login",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("이메일과 비밀번호를 입력해주세요.")
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { accounts: true },
        })

        if (!user) {
          throw new Error("등록되지 않은 이메일입니다.")
        }

        // Check if user has a password (for credentials login)
        const passwordAccount = user.accounts.find(
          (account) => account.provider === "credentials"
        )

        if (!passwordAccount?.access_token) {
          throw new Error("소셜 로그인으로 가입한 계정입니다.")
        }

        const isPasswordValid = await compare(
          credentials.password,
          passwordAccount.access_token
        )

        if (!isPasswordValid) {
          throw new Error("비밀번호가 일치하지 않습니다.")
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        }
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.name = token.name
        session.user.email = token.email
        session.user.image = token.picture as string | undefined
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }

      // Fetch subscription status
      const dbUser = await prisma.user.findUnique({
        where: { id: token.id as string },
        include: { subscription: true },
      })

      if (dbUser?.subscription) {
        token.subscriptionPlan = dbUser.subscription.plan
        token.subscriptionStatus = dbUser.subscription.status
      }

      return token
    },
  },
}

export async function createUser(
  email: string,
  password: string,
  name: string
) {
  const existingUser = await prisma.user.findUnique({
    where: { email },
  })

  if (existingUser) {
    throw new Error("이미 등록된 이메일입니다.")
  }

  const hashedPassword = await hash(password, 12)

  const user = await prisma.user.create({
    data: {
      email,
      name,
      accounts: {
        create: {
          type: "credentials",
          provider: "credentials",
          providerAccountId: email,
          access_token: hashedPassword,
        },
      },
      subscription: {
        create: {
          plan: "FREE",
          status: "ACTIVE",
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      },
    },
  })

  return user
}
