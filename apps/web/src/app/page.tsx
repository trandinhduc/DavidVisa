import ApplicationForm from "@/components/form/ApplicationForm";
import { SiteHeader } from "@/components/SiteHeader";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <SiteHeader />
      <main className="flex-1 flex flex-col items-center px-4 py-8 sm:px-4 sm:py-10">
        <div className="bg-white border border-border rounded-xl shadow-sm p-6 sm:p-8 w-full max-w-[560px]">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">Visa Application Form</h1>
          <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
            Please fill in all fields carefully. All information must match your passport.
          </p>
          <ApplicationForm />
        </div>
      </main>
    </div>
  );
}
