import { DefaultSession } from "next-auth"
import { SubscriptionPlan, SubscriptionStatus } from "@prisma/client"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      subscriptionPlan?: SubscriptionPlan
      subscriptionStatus?: SubscriptionStatus
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    subscriptionPlan?: SubscriptionPlan
    subscriptionStatus?: SubscriptionStatus
  }
}
