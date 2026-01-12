import Hero from "@/components/Hero";
import MenuSection from "@/components/MenuSection";
import FranchiseSection from "@/components/FranchiseSection";

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <Hero />
      <MenuSection />
      <FranchiseSection />
    </main>
  );
}
