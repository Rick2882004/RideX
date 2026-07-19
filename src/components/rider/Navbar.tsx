"use client";

import { useState } from "react";
import { Bell, Menu, UserCircle2, Wallet, Moon, Sun, Settings, HelpCircle, X, Check, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useRide } from "@/context/RideContext";

export default function Navbar() {
  const router = useRouter();
  const { isDarkMode, setIsDarkMode, walletBalance, setWalletBalance } = useRide();

  const [activeModal, setActiveModal] = useState<"wallet" | "profile" | "help" | null>(null);
  
  // Profile settings state
  const userJson = typeof window !== "undefined" ? localStorage.getItem("user") : null;
  const loggedInUser = userJson ? JSON.parse(userJson) : { name: "Rider User", email: "rider@ridex.com" };
  const [profileName, setProfileName] = useState(loggedInUser?.name || "Rider User");
  const [profileEmail, setProfileEmail] = useState(loggedInUser?.email || "rider@ridex.com");
  const [profileSaved, setProfileSaved] = useState(false);

  // Help Center State
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [supportMessage, setSupportMessage] = useState("");
  const [supportSent, setSupportSent] = useState(false);

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      localStorage.removeItem("user");
      router.push("/login");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const handleSaveProfile = () => {
    const updated = { ...loggedInUser, name: profileName, email: profileEmail };
    localStorage.setItem("user", JSON.stringify(updated));
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  };

  const handleDeposit = (amount: number) => {
    setWalletBalance(walletBalance + amount);
  };

  return (
    <>
      <motion.div
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="h-20 rounded-3xl border border-white/10 glass-panel px-6 flex items-center justify-between shadow-[0_8px_32px_rgba(0,0,0,0.37)] z-40 relative"
      >
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setActiveModal(activeModal === "help" ? null : "help")}
            className="rounded-xl bg-white/5 border border-white/5 p-3 hover:bg-white/10 text-white transition cursor-pointer"
          >
            <HelpCircle size={20} />
          </button>

          <div>
            <h1 className="text-white text-xl lg:text-2xl font-black tracking-tight leading-none">
              RideX
            </h1>
            <p className="text-cyan-400 text-[10px] tracking-[4px] font-bold mt-1 uppercase">
              Rider Panel
            </p>
          </div>
        </div>

        {/* Navigation actions */}
        <div className="flex items-center gap-2 lg:gap-4">
          {/* Wallet Trigger */}
          <button
            onClick={() => setActiveModal("wallet")}
            className="flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/25 px-3 py-2 rounded-xl text-cyan-400 hover:bg-cyan-500/20 transition text-xs font-bold cursor-pointer"
          >
            <Wallet size={16} />
            <span>₹{walletBalance.toFixed(0)}</span>
          </button>

          {/* Theme Switcher */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="rounded-xl bg-white/5 border border-white/5 p-2.5 hover:bg-white/10 text-white transition cursor-pointer"
          >
            {isDarkMode ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} className="text-indigo-400" />}
          </button>

          {/* Notifications */}
          <button className="relative rounded-xl bg-white/5 border border-white/5 p-2.5 hover:bg-white/10 text-white transition cursor-pointer">
            <Bell size={18} />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-cyan-400" />
          </button>

          {/* Profile Droplist Trigger */}
          <div className="relative group">
            <button className="rounded-full bg-gradient-to-r from-purple-600 to-cyan-500 p-0.5 cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <div className="h-10 w-10 rounded-full bg-black flex items-center justify-center text-white text-sm font-bold border border-black overflow-hidden">
                {profileName.substring(0, 2).toUpperCase()}
              </div>
            </button>

            <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-white/10 bg-black/95 p-2 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
              <button
                onClick={() => setActiveModal("profile")}
                className="w-full text-left rounded-xl px-4 py-2.5 text-xs text-gray-300 hover:bg-white/5 transition cursor-pointer font-semibold flex items-center gap-2"
              >
                <Settings size={14} /> Profile Settings
              </button>
              <div className="h-px bg-white/10 my-1"></div>
              <button
                onClick={handleSignOut}
                className="w-full text-left rounded-xl px-4 py-2.5 text-xs text-red-400 hover:bg-white/5 transition cursor-pointer font-bold"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* MODAL OVERLAYS */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-[35px] border border-white/10 bg-[#121212] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] text-white relative z-50 overflow-hidden"
            >
              {/* Close Button */}
              <button 
                onClick={() => setActiveModal(null)}
                className="absolute right-6 top-6 rounded-full bg-white/5 border border-white/5 p-2 hover:bg-white/10 cursor-pointer"
              >
                <X size={18} />
              </button>

              {/* 1. WALLET MODAL */}
              {activeModal === "wallet" && (
                <div>
                  <h3 className="text-2xl font-bold flex items-center gap-3">
                    <Wallet size={24} className="text-cyan-400" /> Wallet Balance
                  </h3>
                  <p className="text-gray-400 text-sm mt-1">Manage payment and promotional funds</p>

                  <div className="mt-8 rounded-3xl bg-cyan-500/10 border border-cyan-500/20 p-6 text-center">
                    <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Total Funds Available</p>
                    <p className="text-4xl font-black text-cyan-400 mt-2">₹{walletBalance.toFixed(2)}</p>
                  </div>

                  <h4 className="text-xs uppercase tracking-wider text-gray-400 font-bold mt-8 mb-4">Add Test Funds</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {[100, 500, 1000].map((amt) => (
                      <button
                        key={amt}
                        onClick={() => handleDeposit(amt)}
                        className="py-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-cyan-500/40 text-xs font-bold transition cursor-pointer"
                      >
                        +₹{amt}
                      </button>
                    ))}
                  </div>

                  <p className="text-[10px] text-gray-500 text-center mt-6">This is a simulated digital wallet. No real currency is processed.</p>
                </div>
              )}

              {/* 2. PROFILE MODAL */}
              {activeModal === "profile" && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold flex items-center gap-3">
                    <Settings size={24} className="text-purple-400" /> Profile Settings
                  </h3>
                  <p className="text-gray-400 text-sm mt-1">Customize account configuration details</p>

                  <div className="space-y-4 pt-4">
                    <div>
                      <label className="text-xs text-gray-400 font-semibold mb-1.5 block">Full Name</label>
                      <input 
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        className="w-full rounded-xl border border-white/5 bg-white/5 px-4 py-3 outline-none focus:border-cyan-500/50 transition text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 font-semibold mb-1.5 block">Email Address</label>
                      <input 
                        value={profileEmail}
                        onChange={(e) => setProfileEmail(e.target.value)}
                        className="w-full rounded-xl border border-white/5 bg-white/5 px-4 py-3 outline-none focus:border-cyan-500/50 transition text-sm"
                        type="email"
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex justify-between items-center">
                    {profileSaved ? (
                      <span className="text-xs text-green-400 font-semibold flex items-center gap-1.5 animate-pulse">
                        <Check size={14} /> Profile Saved Successfully
                      </span>
                    ) : <span></span>}

                    <button
                      onClick={handleSaveProfile}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 text-xs font-bold hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer"
                    >
                      Save Configuration
                    </button>
                  </div>
                </div>
              )}

              {/* 3. HELP CENTER MODAL */}
              {activeModal === "help" && (
                <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-1">
                  <h3 className="text-2xl font-bold flex items-center gap-3">
                    <HelpCircle size={24} className="text-yellow-400" /> Help Center
                  </h3>
                  
                  {/* Collapsible FAQ Block */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Frequently Asked Questions</h4>
                    
                    <div className="space-y-2">
                      {[
                        { q: "How is the dynamic fare calculated?", a: "Fares are calculated using standard base costs plus multiplier parameters linked to demand, active supply, distance, and current weather coefficients." },
                        { q: "Is emergency service contact integrated?", a: "Yes, when you are in an active ride, clicking the SOS button automatically notifies emergency coordinators and shares your simulated location coordinates." },
                        { q: "Can I use discount coupon promo codes?", a: "Definitely. In the Ride Booking Details card, paste coupons like WELCOME20 or RIDEX50 to deduct the applied percent discount from your transaction fare." }
                      ].map((item, idx) => (
                        <div key={idx} className="rounded-2xl border border-white/5 bg-white/5 overflow-hidden">
                          <button
                            onClick={() => setFaqOpen(faqOpen === idx ? null : idx)}
                            className="w-full text-left px-5 py-4 text-xs font-bold flex justify-between items-center hover:bg-white/5 transition"
                          >
                            <span>{item.q}</span>
                            <span className="text-cyan-400 text-sm font-semibold">{faqOpen === idx ? "−" : "+"}</span>
                          </button>
                          {faqOpen === idx && (
                            <div className="px-5 pb-4 text-xs text-gray-400 border-t border-white/5 pt-3 leading-relaxed">
                              {item.a}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Support Form */}
                  <div className="border-t border-white/5 pt-4">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Contact Support</h4>
                    {supportSent ? (
                      <p className="text-xs text-cyan-400 font-semibold flex items-center gap-1.5 animate-pulse mt-2 bg-cyan-400/5 p-4 rounded-xl border border-cyan-400/10">
                        <Check size={14} /> Support Ticket Submitted. We will respond shortly!
                      </p>
                    ) : (
                      <div className="space-y-3">
                        <textarea
                          placeholder="Describe your issue or feedback..."
                          value={supportMessage}
                          onChange={(e) => setSupportMessage(e.target.value)}
                          className="w-full h-24 rounded-xl border border-white/5 bg-white/5 p-3 outline-none focus:border-cyan-500/50 text-xs transition resize-none"
                        />
                        <button
                          onClick={() => {
                            if (supportMessage.trim()) {
                              setSupportSent(true);
                              setTimeout(() => {
                                setSupportSent(false);
                                setSupportMessage("");
                                setActiveModal(null);
                              }, 2500);
                            }
                          }}
                          className="w-full h-11 rounded-xl bg-yellow-500 text-black font-bold text-xs hover:opacity-90 flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          Submit Ticket <ArrowRight size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}