import HomeHeader from "@/components/HomeHeader";
import Dashboard from "@/components/Dashboard";
import ServiceButtons from "@/components/ServiceButtons";
import QuickMenu from "@/components/QuickMenu";
import BottomNav from "@/components/BottomNav";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      <HomeHeader />

      <div className="relative -mt-6 z-10">
        <Dashboard />
        <ServiceButtons />
        <QuickMenu />
      </div>

      <BottomNav />
    </main>
  );
}
