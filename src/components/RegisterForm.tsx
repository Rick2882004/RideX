"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { User, Mail, Lock, Car } from "lucide-react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function RegisterForm() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "RIDER",
  });

  async function register() {
    if (!form.name || !form.email || !form.password || !form.role) {
      alert("All fields are required");
      return;
    }

    try {
      setLoading(true);

      const res = await (authClient.signUp.email as any)({
        email: form.email,
        password: form.password,
        name: form.name,
        role: form.role, // Passes role to server-side auth config
      });

      if (res.error) {
        alert(res.error.message || "Registration Failed");
        return;
      }

      alert("Registration Successful 🎉");
      router.push("/login");

    } catch (err: any) {
      console.error("Registration Error:", err);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md rounded-[35px] border border-white/10 bg-white/5 backdrop-blur-3xl p-10 shadow-[0_0_60px_rgba(0,255,255,.15)]"
    >

      <h1 className="text-4xl font-black text-white">
        Create Account 🚀
      </h1>

      <p className="mt-2 text-gray-400">
        Join RideX today
      </p>

      <div className="mt-10 space-y-5">

        <div className="relative">
          <User className="absolute left-4 top-4 text-cyan-400" />
          <input
            placeholder="Full Name"
            className="w-full rounded-2xl border border-white/10 bg-white/5 py-4 pl-12 text-white outline-none"
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
          />
        </div>

        <div className="relative">
          <Mail className="absolute left-4 top-4 text-cyan-400" />
          <input
            placeholder="Email"
            type="email"
            className="w-full rounded-2xl border border-white/10 bg-white/5 py-4 pl-12 text-white outline-none"
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-4 top-4 text-cyan-400" />
          <input
            placeholder="Password"
            type="password"
            className="w-full rounded-2xl border border-white/10 bg-white/5 py-4 pl-12 text-white outline-none"
            onChange={(e) =>
              setForm({ ...form, password: e.target.value })
            }
          />
        </div>

        <div className="relative">
          <Car className="absolute left-4 top-4 text-cyan-400" />

          <select
            className="w-full rounded-2xl border border-white/10 bg-white/5 py-4 pl-12 text-white outline-none"
            value={form.role}
            onChange={(e) =>
              setForm({ ...form, role: e.target.value })
            }
          >
            <option value="RIDER" className="bg-black">
              Rider
            </option>

            <option value="DRIVER" className="bg-black">
              Driver
            </option>
          </select>

        </div>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.95 }}
          onClick={register}
          disabled={loading}
          className="w-full rounded-2xl bg-gradient-to-r from-purple-600 to-cyan-500 py-4 font-bold text-white cursor-pointer"
        >
          {loading ? "Creating Account..." : "Register"}
        </motion.button>

      </div>

      <p className="mt-8 text-center text-gray-400">
        Already have an account?{" "}
        <span
          onClick={() => router.push("/login")}
          className="cursor-pointer text-cyan-400 hover:underline"
        >
          Login
        </span>
      </p>

    </motion.div>
  );
}