// Pet Types
export type Species = 'dog' | 'cat'
export type Gender = 'male' | 'female'
export type PetSize = 'small' | 'medium' | 'large' | 'giant'
export type ActivityLevel = 'low' | 'moderate' | 'high'
export type DietType = 'dry_food' | 'wet_food' | 'raw' | 'homemade' | 'prescription' | 'mixed'

export interface Pet {
  id: string
  ownerId: string
  name: string
  species: Species
  breed: string
  birthDate: Date
  gender: Gender
  neutered: boolean
  weight: number
  bodyConditionScore: number
  size: PetSize
  profileImage?: string
  furColor?: string
  distinctiveFeatures?: string
  activityLevel: ActivityLevel
  dietType: DietType
  healthConditions: HealthCondition[]
  allergies: string[]
  medications: Medication[]
  vaccinations: Vaccination[]
  createdAt: Date
  updatedAt: Date
}

export interface HealthCondition {
  id: string
  petId: string
  name: string
  diagnosedDate: Date
  severity: 'mild' | 'moderate' | 'severe'
  status: 'active' | 'managed' | 'resolved'
  notes?: string
  vetVerified: boolean
}

export interface Medication {
  id: string
  petId: string
  name: string
  dosage: string
  frequency: string
  startDate: Date
  endDate?: Date
  reminders: boolean
  reminderTimes: string[]
}

export interface Vaccination {
  id: string
  petId: string
  name: string
  dateAdministered: Date
  nextDueDate: Date
  vetClinic?: string
  certificate?: string
}

// Health Log Types
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'treat'
export type EliminationType = 'urine' | 'feces'
export type FecesConsistency = 1 | 2 | 3 | 4 | 5 | 6 | 7
export type FecesColor = 'brown' | 'black' | 'red' | 'yellow' | 'green' | 'white'
export type UrineColor = 'clear' | 'yellow' | 'dark' | 'orange' | 'red' | 'cloudy'
export type UrineAmount = 'small' | 'normal' | 'large'
export type BehaviorType =
  | 'scratching'
  | 'licking_excessive'
  | 'hiding'
  | 'aggression'
  | 'vocalization'
  | 'lethargy'
  | 'pacing'
  | 'shaking'
  | 'coughing'
  | 'sneezing'
  | 'limping'
  | 'head_shaking'
  | 'scooting'

export interface DailyHealthLog {
  id: string
  petId: string
  date: Date
  meals: MealLog[]
  waterIntake?: number
  eliminations: EliminationLog[]
  activity: ActivityLog
  weight?: number
  overallCondition: number
  energyLevel: number
  appetiteLevel: number
  observations?: string
  photos: string[]
  aiAnalysis?: HealthAnalysis
  alerts: HealthAlert[]
  createdAt: Date
  source: 'manual' | 'iot' | 'mixed'
}

export interface MealLog {
  id: string
  healthLogId: string
  time: Date
  type: MealType
  foodBrand?: string
  foodProduct?: string
  foodType: DietType
  isNewFood: boolean
  amount: number
  consumedPercent: number
  enthusiasm: number
  vomitedAfter: boolean
  notes?: string
}

export interface EliminationLog {
  id: string
  healthLogId: string
  time: Date
  type: EliminationType
  fecesConsistency?: FecesConsistency
  fecesColor?: FecesColor
  urineColor?: UrineColor
  urineAmount?: UrineAmount
  straining: boolean
  frequency: 'normal' | 'frequent' | 'infrequent'
  usedLitterBox?: boolean
  hadAccident?: boolean
  notes?: string
  photo?: string
}

export interface ActivityLog {
  id: string
  healthLogId: string
  walks: WalkLog[]
  playTime: number
  restTime: number
  steps?: number
  activeMinutes?: number
  sleepHours?: number
  sleepQuality?: number
  behaviors: BehaviorObservation[]
}

export interface WalkLog {
  id: string
  activityLogId: string
  startTime: Date
  endTime: Date
  duration: number
  distance?: number
  poopCount: number
  peeCount: number
  notes?: string
}

export interface BehaviorObservation {
  id: string
  activityLogId: string
  behavior: BehaviorType
  frequency: 'once' | 'occasional' | 'frequent' | 'constant'
  notes?: string
}

// Health Analysis Types
export interface HealthAnalysis {
  id: string
  petId: string
  date: Date
  overallHealthScore: number
  categories: {
    nutrition: CategoryAnalysis
    digestion: CategoryAnalysis
    activity: CategoryAnalysis
    hydration: CategoryAnalysis
    behavior: CategoryAnalysis
  }
  anomalies: Anomaly[]
  trends: HealthTrend[]
  recommendations: string[]
  vetVisitRecommended: boolean
  vetVisitUrgency?: 'routine' | 'soon' | 'urgent' | 'emergency'
  vetVisitReason?: string
}

export interface CategoryAnalysis {
  score: number
  status: 'excellent' | 'good' | 'fair' | 'concerning' | 'critical'
  details: string
  change: 'improving' | 'stable' | 'declining'
}

export interface Anomaly {
  id: string
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  detectedAt: Date
  dataPoints: string[]
  possibleCauses: string[]
  recommendedActions: string[]
}

export interface HealthTrend {
  metric: string
  direction: 'up' | 'down' | 'stable'
  percentChange: number
  period: string
}

export interface HealthAlert {
  id: string
  petId: string
  type: string
  severity: 'info' | 'warning' | 'critical'
  title: string
  message: string
  createdAt: Date
  readAt?: Date
  actionTaken?: boolean
}

// Subscription Types
export type SubscriptionPlan = 'free' | 'premium' | 'premium_plus'
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'expired'

export interface Subscription {
  id: string
  userId: string
  plan: SubscriptionPlan
  status: SubscriptionStatus
  currentPeriodStart: Date
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
  stripeCustomerId?: string
  stripeSubscriptionId?: string
}

// User Types
export interface User {
  id: string
  email: string
  name: string
  image?: string
  phone?: string
  subscription?: Subscription
  pets: Pet[]
  createdAt: Date
  updatedAt: Date
}

// Breed Database Types
export interface BreedInfo {
  breed: string
  species: Species
  avgWeight: { min: number; max: number }
  avgLifespan: { min: number; max: number }
  size: PetSize
  commonHealthIssues: string[]
  geneticConditions: string[]
  exerciseNeeds: ActivityLevel
  groomingNeeds: 'low' | 'moderate' | 'high'
  dietaryConsiderations: string[]
}
