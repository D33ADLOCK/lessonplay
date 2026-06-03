export interface MissingEnvVar {
  name: string
  description: string
  example: string
  required: boolean
}

export function checkRequiredEnvVars(): MissingEnvVar[] {
  const requiredVars: MissingEnvVar[] = [
    {
      name: 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
      description: 'Publishable key for Clerk authentication',
      example: 'pk_test_...',
      required: true,
    },
    {
      name: 'CLERK_SECRET_KEY',
      description: 'Secret key for Clerk authentication',
      example: 'sk_test_...',
      required: true,
    },
    {
      name: 'POSTGRES_URL',
      description: 'PostgreSQL database connection string',
      example: '', // No example - user needs to provide their own
      required: true,
    },
  ]

  const missing = requiredVars.filter((envVar) => {
    const value = process.env[envVar.name]
    return !value || value.trim() === ''
  })

  return missing
}

export function hasAllRequiredEnvVars(): boolean {
  return checkRequiredEnvVars().length === 0
}

export const hasEnvVars = !!(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  process.env.CLERK_SECRET_KEY &&
  process.env.POSTGRES_URL
)
