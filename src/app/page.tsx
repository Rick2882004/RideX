import Navbar from "../components/navbar/Navbar";
import Hero from "../components/sections/Hero";
import Features from "@/components/Features";
import Stats from "@/components/Stats";
import LiveDemo from "@/components/LiveDemo";
import Pricing from "../components/LiveDemo/Pricing";
import Testimonials from "@/components/Testimonials";
import BackgroundEffects from "@/components/BackgroundEffects";

export default function Home() {
  return (
   <>
   <BackgroundEffects />
  <Navbar />
  <Hero />
  <Features />
  <Stats />
  <LiveDemo />
  <Pricing />
  <Testimonials />
</>
  );
}