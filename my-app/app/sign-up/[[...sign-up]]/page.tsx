import { SignUp } from '@clerk/nextjs'
import { LessonPlayBrand } from '@/components/shared/lessonplay-brand'

export default function SignUpPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-gradient-to-br from-indigo-50 via-white to-orange-50 px-4 py-12 dark:from-indigo-950/30 dark:via-black dark:to-orange-950/20">
      <div className="flex flex-col items-center gap-8">
        <LessonPlayBrand />
        <SignUp />
      </div>
    </main>
  )
}
