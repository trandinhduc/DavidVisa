import ApplicationForm from "@/components/form/ApplicationForm";

export default function Home() {
  return (
    <main className="px-4 py-8 sm:px-0 sm:py-12">
      <div className="mx-auto w-full max-w-[640px]">
        <h1 className="text-2xl font-semibold mb-8">Vietnam Visa Application</h1>
        <ApplicationForm />
      </div>
    </main>
  );
}
