import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen">
      <section className="max-w-5xl mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl font-bold mb-6">Rebook AI</h1>
        <p className="text-xl text-gray-600 mb-8">
          Automatically remind existing customers when they are due to book their next appointment.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/login" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700">
            Business Login
          </Link>
          <Link href="/demo" className="border border-gray-300 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100">
            Request a Demo
          </Link>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-12 grid md:grid-cols-3 gap-8">
        {[
          { title: "Automated Reminders", desc: "21-day default interval, configurable per business." },
          { title: "Booking Suppression", desc: "Pending reminders cancel automatically when a customer rebooks." },
          { title: "Unsubscribe Built In", desc: "Secure, verified opt-out that is always honored." },
        ].map((f) => (
          <div key={f.title} className="bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
            <p className="text-gray-600 text-sm">{f.desc}</p>
          </div>
        ))}
      </section>

      <section className="max-w-5xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-bold mb-4">Pricing</h2>
        <div className="bg-white p-6 rounded-xl shadow-sm border inline-block">
          <p className="text-3xl font-bold">$299 <span className="text-base font-normal text-gray-500">setup</span></p>
          <p className="text-3xl font-bold mt-2">$99 <span className="text-base font-normal text-gray-500">/ month</span></p>
        </div>
      </section>
    </main>
  );
}