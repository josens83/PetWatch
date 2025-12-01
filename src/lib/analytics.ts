/**
 * Analytics System
 * User behavior tracking and business metrics
 */

// ============================================================================
// Types
// ============================================================================

interface AnalyticsUser {
  id: string
  email?: string
  name?: string
  plan?: 'FREE' | 'PREMIUM' | 'PREMIUM_PLUS'
  createdAt?: string
}

interface AnalyticsEvent {
  name: string
  properties?: Record<string, unknown>
  timestamp?: number
}

interface PageViewEvent {
  path: string
  title?: string
  referrer?: string
}

// ============================================================================
// Analytics Provider Interface
// ============================================================================

interface AnalyticsProvider {
  identify(user: AnalyticsUser): void
  track(event: AnalyticsEvent): void
  page(event: PageViewEvent): void
  reset(): void
}

// ============================================================================
// Console Provider (Development)
// ============================================================================

const consoleProvider: AnalyticsProvider = {
  identify(user) {
    console.log('[Analytics] Identify:', user)
  },
  track(event) {
    console.log('[Analytics] Track:', event.name, event.properties)
  },
  page(event) {
    console.log('[Analytics] Page:', event.path)
  },
  reset() {
    console.log('[Analytics] Reset')
  },
}

// ============================================================================
// Mixpanel Provider
// ============================================================================

function createMixpanelProvider(): AnalyticsProvider | null {
  if (typeof window === 'undefined') return null

  const mixpanelToken = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN
  if (!mixpanelToken) return null

  // Lazy load mixpanel
  let mixpanel: unknown = null
  const getMixpanel = async () => {
    if (!mixpanel) {
      const mp = await import('mixpanel-browser')
      mp.default.init(mixpanelToken, {
        track_pageview: false,
        persistence: 'localStorage',
      })
      mixpanel = mp.default
    }
    return mixpanel as {
      identify: (id: string) => void
      people: { set: (props: Record<string, unknown>) => void }
      track: (name: string, props?: Record<string, unknown>) => void
      reset: () => void
    }
  }

  return {
    async identify(user) {
      const mp = await getMixpanel()
      mp.identify(user.id)
      mp.people.set({
        $email: user.email,
        $name: user.name,
        plan: user.plan,
        createdAt: user.createdAt,
      })
    },
    async track(event) {
      const mp = await getMixpanel()
      mp.track(event.name, {
        ...event.properties,
        timestamp: event.timestamp || Date.now(),
      })
    },
    async page(event) {
      const mp = await getMixpanel()
      mp.track('Page View', {
        path: event.path,
        title: event.title,
        referrer: event.referrer,
      })
    },
    async reset() {
      const mp = await getMixpanel()
      mp.reset()
    },
  }
}

// ============================================================================
// Analytics Class
// ============================================================================

class Analytics {
  private providers: AnalyticsProvider[] = []
  private initialized = false
  private queue: (() => void)[] = []

  constructor() {
    // Add console provider in development
    if (process.env.NODE_ENV === 'development') {
      this.providers.push(consoleProvider)
    }
  }

  init() {
    if (this.initialized) return

    // Add Mixpanel in production
    const mixpanel = createMixpanelProvider()
    if (mixpanel) {
      this.providers.push(mixpanel)
    }

    // Process queued events
    this.queue.forEach((fn) => fn())
    this.queue = []

    this.initialized = true
  }

  private execute(fn: () => void) {
    if (this.initialized) {
      fn()
    } else {
      this.queue.push(fn)
    }
  }

  /**
   * Identify a user
   */
  identify(user: AnalyticsUser) {
    this.execute(() => {
      this.providers.forEach((provider) => provider.identify(user))
    })
  }

  /**
   * Track a custom event
   */
  track(name: string, properties?: Record<string, unknown>) {
    this.execute(() => {
      const event: AnalyticsEvent = {
        name,
        properties,
        timestamp: Date.now(),
      }
      this.providers.forEach((provider) => provider.track(event))
    })
  }

  /**
   * Track a page view
   */
  page(path: string, title?: string) {
    this.execute(() => {
      const event: PageViewEvent = {
        path,
        title,
        referrer: typeof document !== 'undefined' ? document.referrer : undefined,
      }
      this.providers.forEach((provider) => provider.page(event))
    })
  }

  /**
   * Reset user identity
   */
  reset() {
    this.execute(() => {
      this.providers.forEach((provider) => provider.reset())
    })
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const analytics = new Analytics()

// ============================================================================
// Predefined Events
// ============================================================================

export const AnalyticsEvents = {
  // Authentication
  SIGNUP_STARTED: 'Signup Started',
  SIGNUP_COMPLETED: 'Signup Completed',
  LOGIN: 'Login',
  LOGOUT: 'Logout',
  PASSWORD_RESET_REQUESTED: 'Password Reset Requested',
  PASSWORD_RESET_COMPLETED: 'Password Reset Completed',

  // Pet Management
  PET_REGISTRATION_STARTED: 'Pet Registration Started',
  PET_REGISTRATION_COMPLETED: 'Pet Registration Completed',
  PET_PROFILE_UPDATED: 'Pet Profile Updated',
  PET_DELETED: 'Pet Deleted',

  // Health Logging
  HEALTH_LOG_CREATED: 'Health Log Created',
  MEAL_LOGGED: 'Meal Logged',
  WATER_LOGGED: 'Water Logged',
  ELIMINATION_LOGGED: 'Elimination Logged',
  WALK_LOGGED: 'Walk Logged',

  // AI Features
  AI_ANALYSIS_REQUESTED: 'AI Analysis Requested',
  AI_ANALYSIS_VIEWED: 'AI Analysis Viewed',
  AI_CHAT_STARTED: 'AI Chat Started',
  AI_CHAT_MESSAGE_SENT: 'AI Chat Message Sent',

  // Reports
  REPORT_VIEWED: 'Report Viewed',
  REPORT_SHARED: 'Report Shared',
  REPORT_EXPORTED: 'Report Exported',

  // Subscription
  SUBSCRIPTION_PAGE_VIEWED: 'Subscription Page Viewed',
  CHECKOUT_STARTED: 'Checkout Started',
  CHECKOUT_COMPLETED: 'Checkout Completed',
  SUBSCRIPTION_CANCELLED: 'Subscription Cancelled',
  SUBSCRIPTION_RESUMED: 'Subscription Resumed',

  // Engagement
  NOTIFICATION_CLICKED: 'Notification Clicked',
  FEATURE_DISCOVERED: 'Feature Discovered',
  HELP_ACCESSED: 'Help Accessed',
  FEEDBACK_SUBMITTED: 'Feedback Submitted',
} as const

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Track pet-related events with pet context
 */
export function trackPetEvent(
  event: string,
  petId: string,
  species: 'DOG' | 'CAT',
  additionalProps?: Record<string, unknown>
) {
  analytics.track(event, {
    petId,
    species,
    ...additionalProps,
  })
}

/**
 * Track health logging events
 */
export function trackHealthLog(
  logType: 'meal' | 'water' | 'elimination' | 'walk',
  petId: string,
  additionalProps?: Record<string, unknown>
) {
  const eventMap = {
    meal: AnalyticsEvents.MEAL_LOGGED,
    water: AnalyticsEvents.WATER_LOGGED,
    elimination: AnalyticsEvents.ELIMINATION_LOGGED,
    walk: AnalyticsEvents.WALK_LOGGED,
  }

  analytics.track(eventMap[logType], {
    petId,
    logType,
    ...additionalProps,
  })
}

/**
 * Track subscription funnel
 */
export function trackSubscriptionFunnel(
  step: 'viewed' | 'started' | 'completed' | 'cancelled',
  plan?: string,
  additionalProps?: Record<string, unknown>
) {
  const eventMap = {
    viewed: AnalyticsEvents.SUBSCRIPTION_PAGE_VIEWED,
    started: AnalyticsEvents.CHECKOUT_STARTED,
    completed: AnalyticsEvents.CHECKOUT_COMPLETED,
    cancelled: AnalyticsEvents.SUBSCRIPTION_CANCELLED,
  }

  analytics.track(eventMap[step], {
    plan,
    ...additionalProps,
  })
}

/**
 * Track timing metrics
 */
export function trackTiming(
  category: string,
  variable: string,
  duration: number,
  label?: string
) {
  analytics.track('Timing', {
    category,
    variable,
    duration,
    label,
  })
}
