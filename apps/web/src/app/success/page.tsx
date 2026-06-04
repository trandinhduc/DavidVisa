import { CircleCheck } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const params = await searchParams
  const appId = params.id || 'UNKNOWN'

  return (
    <main className="px-4 py-16 sm:px-0 sm:py-24 flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="bg-success/10 text-success rounded-full p-4 mb-6">
        <CircleCheck className="w-12 h-12" />
      </div>
      
      <h1 className="text-3xl font-bold mb-4 text-foreground">Application Received</h1>
      
      <p className="text-muted-foreground mb-8 max-w-md">
        Your application has been received. We&apos;ll be in touch within 24 hours. Please keep your Application ID for your records.
      </p>

      <div className="bg-muted rounded-md px-6 py-4 mb-10 flex flex-col items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Application ID</span>
        <span className="font-mono text-3xl font-bold tracking-tight text-foreground">{appId}</span>
      </div>

      <Button asChild variant="outline">
        <Link href="/">Submit Another Application</Link>
      </Button>
    </main>
  )
}
