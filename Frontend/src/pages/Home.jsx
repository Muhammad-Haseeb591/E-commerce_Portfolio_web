import {
  ScrollProgress,
  HeroBanner,
  PromiseStrip,
  TrustStats,
  CategoryGrid,
  LiveStock,
  ReviewsMarquee,
} from "../assets/components/home"

export default function Home() {
  return (
    <main className="bg-white text-[#333333] relative top-[15px]">
      <ScrollProgress />
      <HeroBanner />
      <PromiseStrip />
      <TrustStats />
      <CategoryGrid />
      <LiveStock />
      <ReviewsMarquee />
    </main>
  )
}
