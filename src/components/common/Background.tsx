"use client";

export default function Background() {
  return (
    <>
      <div className="fixed inset-0 -z-50 bg-[#09090B]" />

      <div className="fixed left-20 top-20 h-72 w-72 rounded-full bg-violet-600/20 blur-[140px]" />

      <div className="fixed right-20 top-52 h-80 w-80 rounded-full bg-cyan-500/20 blur-[150px]" />

      <div className="fixed bottom-20 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-fuchsia-500/10 blur-[180px]" />
    </>
  );
}