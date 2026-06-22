import React from "react";
import Header from "./components/Header";
import Hero from "./components/Hero";
import BentoGrid from "./components/BentoGrid";
import Integrations from "./components/Integrations";
import Playground from "./components/Playground";
import Pricing from "./components/Pricing";
import Faq from "./components/Faq";
import Footer from "./components/Footer";
import ChatWidget from "./components/ChatWidget";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-[#030014] text-zinc-100 selection:bg-violet-500/30 selection:text-white">
      {/* Header Navigation */}
      <Header />

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <Hero />

        {/* Features Bento Grid */}
        <BentoGrid />

        {/* Interactive App Connection Connector */}
        <Integrations />

        {/* AI Playground Sandbox */}
        <Playground />

        {/* Pricing Grid */}
        <Pricing />

        {/* Accordion FAQ */}
        <Faq />
      </main>

      {/* Footer Block */}
      <Footer />

      {/* Floating AI Chatbox */}
      <ChatWidget />
    </div>
  );
}
