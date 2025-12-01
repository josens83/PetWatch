/**
 * Circuit Breaker Pattern Implementation
 * Netflix Hystrix-inspired resilience pattern
 */

import { CircuitOpenError } from './errors'

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN'

export interface CircuitBreakerOptions {
  name: string
  failureThreshold: number      // Number of failures before opening
  successThreshold: number      // Number of successes to close from half-open
  timeout: number               // Time in ms before trying again (half-open)
  volumeThreshold: number       // Minimum requests before calculating failure rate
  failureRateThreshold: number  // Percentage (0-100) of failures to open
  onStateChange?: (from: CircuitState, to: CircuitState, name: string) => void
  onFailure?: (error: Error, name: string) => void
  onSuccess?: (name: string) => void
}

interface CircuitStats {
  failures: number
  successes: number
  requests: number
  lastFailureTime: number | null
  consecutiveSuccesses: number
}

const defaultOptions: Omit<CircuitBreakerOptions, 'name'> = {
  failureThreshold: 5,
  successThreshold: 3,
  timeout: 30000, // 30 seconds
  volumeThreshold: 10,
  failureRateThreshold: 50,
}

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED'
  private stats: CircuitStats = {
    failures: 0,
    successes: 0,
    requests: 0,
    lastFailureTime: null,
    consecutiveSuccesses: 0,
  }
  private options: CircuitBreakerOptions
  private resetTimer: NodeJS.Timeout | null = null

  constructor(options: Partial<CircuitBreakerOptions> & { name: string }) {
    this.options = { ...defaultOptions, ...options }
  }

  get currentState(): CircuitState {
    return this.state
  }

  get statistics() {
    return {
      ...this.stats,
      state: this.state,
      failureRate: this.calculateFailureRate(),
    }
  }

  private calculateFailureRate(): number {
    if (this.stats.requests === 0) return 0
    return (this.stats.failures / this.stats.requests) * 100
  }

  private setState(newState: CircuitState) {
    if (this.state !== newState) {
      const previousState = this.state
      this.state = newState
      this.options.onStateChange?.(previousState, newState, this.options.name)

      if (newState === 'HALF_OPEN') {
        this.stats.consecutiveSuccesses = 0
      }
    }
  }

  private recordSuccess() {
    this.stats.successes++
    this.stats.requests++
    this.stats.consecutiveSuccesses++
    this.options.onSuccess?.(this.options.name)

    if (this.state === 'HALF_OPEN') {
      if (this.stats.consecutiveSuccesses >= this.options.successThreshold) {
        this.reset()
      }
    }
  }

  private recordFailure(error: Error) {
    this.stats.failures++
    this.stats.requests++
    this.stats.lastFailureTime = Date.now()
    this.stats.consecutiveSuccesses = 0
    this.options.onFailure?.(error, this.options.name)

    if (this.state === 'HALF_OPEN') {
      this.trip()
    } else if (this.state === 'CLOSED') {
      if (
        this.stats.requests >= this.options.volumeThreshold &&
        (this.stats.failures >= this.options.failureThreshold ||
          this.calculateFailureRate() >= this.options.failureRateThreshold)
      ) {
        this.trip()
      }
    }
  }

  private trip() {
    this.setState('OPEN')

    if (this.resetTimer) {
      clearTimeout(this.resetTimer)
    }

    this.resetTimer = setTimeout(() => {
      this.setState('HALF_OPEN')
    }, this.options.timeout)
  }

  private reset() {
    if (this.resetTimer) {
      clearTimeout(this.resetTimer)
      this.resetTimer = null
    }

    this.stats = {
      failures: 0,
      successes: 0,
      requests: 0,
      lastFailureTime: null,
      consecutiveSuccesses: 0,
    }
    this.setState('CLOSED')
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      throw new CircuitOpenError(this.options.name)
    }

    try {
      const result = await fn()
      this.recordSuccess()
      return result
    } catch (error) {
      this.recordFailure(error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  // Force circuit to specific state (for testing/admin purposes)
  forceState(state: CircuitState) {
    if (state === 'CLOSED') {
      this.reset()
    } else {
      this.setState(state)
    }
  }

  // Manually reset the circuit
  manualReset() {
    this.reset()
  }
}

// Circuit Breaker Registry for managing multiple circuits
class CircuitBreakerRegistry {
  private circuits: Map<string, CircuitBreaker> = new Map()

  get(name: string, options?: Partial<Omit<CircuitBreakerOptions, 'name'>>): CircuitBreaker {
    if (!this.circuits.has(name)) {
      this.circuits.set(name, new CircuitBreaker({ name, ...options }))
    }
    return this.circuits.get(name)!
  }

  getAll(): Map<string, CircuitBreaker> {
    return new Map(this.circuits)
  }

  getAllStats() {
    const stats: Record<string, ReturnType<CircuitBreaker['statistics']>> = {}
    this.circuits.forEach((circuit, name) => {
      stats[name] = circuit.statistics
    })
    return stats
  }

  reset(name: string) {
    const circuit = this.circuits.get(name)
    if (circuit) {
      circuit.manualReset()
    }
  }

  resetAll() {
    this.circuits.forEach((circuit) => circuit.manualReset())
  }
}

// Singleton registry instance
export const circuitBreakerRegistry = new CircuitBreakerRegistry()

// Convenience function to get/create a circuit breaker
export function getCircuitBreaker(
  name: string,
  options?: Partial<Omit<CircuitBreakerOptions, 'name'>>
): CircuitBreaker {
  return circuitBreakerRegistry.get(name, options)
}

// Decorator/wrapper function for easy circuit breaker usage
export function withCircuitBreaker<T extends (...args: unknown[]) => Promise<unknown>>(
  name: string,
  fn: T,
  options?: Partial<Omit<CircuitBreakerOptions, 'name'>>
): T {
  const circuit = getCircuitBreaker(name, options)

  return ((...args: Parameters<T>) => {
    return circuit.execute(() => fn(...args))
  }) as T
}
