'use client'

/**
 * Application Providers
 * Combines all providers in the correct order
 */

import { ReactNode, useState } from 'react'
import { SessionProvider } from 'next-auth/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { createQueryClient } from '@/lib/query-client'
import { AppErrorBoundary } from '@/components/error-boundary'
import { Toaster } from '@/components/ui/toaster'

interface ProvidersProps {
  children: ReactNode
}

export default function Providers({ children }: ProvidersProps) {
  // Create query client once per session
  const [queryClient] = useState(() => createQueryClient())

  return (
    <AppErrorBoundary>
      <SessionProvider>
        <QueryClientProvider client={queryClient}>
          {children}
          <Toaster />
          {process.env.NODE_ENV === 'development' && (
            <ReactQueryDevtools initialIsOpen={false} />
          )}
        </QueryClientProvider>
      </SessionProvider>
    </AppErrorBoundary>
  )
}

// Re-export for backward compatibility
export { Providers }
