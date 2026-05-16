import Hero from "@/components/Hero";
import MenuSection from "@/components/MenuSection";
import StoreOrderSection from "@/components/StoreOrderSection";
import FranchiseSection from "@/components/FranchiseSection";

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <Hero />
      <MenuSection />
      <StoreOrderSection />
      <FranchiseSection />
    </main>
  );
}
