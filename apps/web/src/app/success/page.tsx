import { CircleCheck } from 'lucide-react'
import Link from 'next/link'
import { SiteHeader } from '@/components/SiteHeader'

export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const params = await searchParams
  const appId = params.id || 'UNKNOWN'

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <SiteHeader />
      <main className="flex-1 flex flex-col items-center px-4 py-8 sm:px-4 sm:py-10">
        <div className="bg-white border border-border rounded-xl shadow-sm p-8 sm:p-10 w-full max-w-[560px] text-center">
          
          {/* Checkmark icon */}
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
            <CircleCheck className="w-8 h-8 text-green-600" strokeWidth={2.4} />
          </div>

          <h2 className="text-[22px] font-bold text-slate-900 mb-1.5 tracking-tight">Application Received!</h2>
          <p className="text-[13px] text-slate-500 mb-2.5">Your application ID is:</p>
          
          <div className="font-mono text-2xl sm:text-[28px] font-bold text-primary tracking-wide bg-slate-50 border border-slate-200 rounded-lg px-5 py-3 inline-block mb-5">
            {appId}
          </div>

          <p className="text-sm text-slate-500 mb-2">
            We have sent a confirmation to <strong className="text-slate-900 font-semibold">your email</strong>
          </p>

          <p className="text-[13px] text-slate-400 leading-relaxed mb-7">
            Our team will process your application and notify you via email. Typical processing time is 1–2 business days.
          </p>

          <hr className="border-t border-slate-100 my-6" />

          {/* What happens next */}
          <div className="text-left bg-slate-50 border border-slate-200 rounded-lg px-4 py-4 mb-6">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">What happens next</p>

            <div className="flex items-start gap-3 mb-3">
              <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-500 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</div>
              <div className="text-[13px] text-slate-700 leading-snug">
                <strong className="text-slate-900 font-semibold block">Application review</strong>
                Our team verifies your documents and passport details.
              </div>
            </div>

            <div className="flex items-start gap-3 mb-3">
              <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-500 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</div>
              <div className="text-[13px] text-slate-700 leading-snug">
                <strong className="text-slate-900 font-semibold block">E-visa issuance</strong>
                We submit your application to the Vietnam Immigration Department.
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-500 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</div>
              <div className="text-[13px] text-slate-700 leading-snug">
                <strong className="text-slate-900 font-semibold block">Delivery</strong>
                Your approved e-visa is sent to your email as a PDF.
              </div>
            </div>
          </div>

          <Link href="/" className="text-sm text-primary font-semibold hover:underline">
            Submit Another Application
          </Link>
        </div>
      </main>
    </div>
  )
}
