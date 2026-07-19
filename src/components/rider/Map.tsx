"use client";

import dynamic from "next/dynamic";

const LeafletMap = dynamic(
  () => import("@/components/LeafletMap"),
  {
    ssr: false,
  }
);

export default function Map() {
  return (
    <div className="h-[650px] overflow-hidden rounded-[40px] border border-white/10">
      <LeafletMap />
    </div>
  );
}