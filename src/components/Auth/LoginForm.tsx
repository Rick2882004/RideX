"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock } from "lucide-react";
import { authClient } from "@/lib/auth-client";

export default function LoginForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      alert("Email and Password are required");
      return;
    }

    try {
      setLoading(true);

      const res = await authClient.signIn.email({
        email,
        password,
      });

      if (res.error) {
        alert(res.error.message || "Login Failed");
        return;
      }

      alert("Login Successful 🎉");

      const user = res.data?.user as any;
      // Redirect according to role
      if (user?.role === "RIDER") {
        router.push("/rider");
      } else if (user?.role === "DRIVER") {
        router.push("/driver");
      } else if (user?.role === "ADMIN") {
        router.push("/admin");
      } else {
        router.push("/rider");
      }

    } catch (error: any) {
      console.error("Login Error:", error);
      alert("Login Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/rider", // The middleware/sync logic will redirect according to role
      });
    } catch (error: any) {
      console.error("Google Login Error:", error);
      alert("Google Sign-In failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="
        w-full
        max-w-md
        rounded-[35px]
        border
        border-white/10
        bg-white/5
        backdrop-blur-3xl
        p-10
        shadow-[0_0_60px_rgba(0,255,255,.15)]
      "
    >
      <h1 className="text-4xl font-black text-white">
        Welcome Back 👋
      </h1>

      <p className="mt-2 text-gray-400">
        Login to your RideX account
      </p>

      <div className="mt-10 space-y-6">

        <div className="relative">
          <Mail
            className="absolute left-4 top-4 text-cyan-400"
            size={20}
          />

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="
              w-full
              rounded-2xl
              border
              border-white/10
              bg-white/5
              py-4
              pl-12
              pr-4
              text-white
              outline-none
              focus:border-cyan-400
            "
          />
        </div>

        <div className="relative">
          <Lock
            className="absolute left-4 top-4 text-cyan-400"
            size={20}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="
              w-full
              rounded-2xl
              border
              border-white/10
              bg-white/5
              py-4
              pl-12
              pr-4
              text-white
              outline-none
              focus:border-cyan-400
            "
          />
        </div>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
          onClick={handleLogin}
          disabled={loading}
          className="
            w-full
            rounded-2xl
            bg-gradient-to-r
            from-purple-600
            to-cyan-500
            py-4
            font-bold
            text-white
            disabled:opacity-60
            cursor-pointer
          "
        >
          {loading ? "Logging in..." : "Login"}
        </motion.button>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-white/10"></div>
          <span className="flex-shrink mx-4 text-gray-500 text-xs uppercase">Or continue with</span>
          <div className="flex-grow border-t border-white/10"></div>
        </div>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
          onClick={handleGoogleLogin}
          disabled={loading}
          type="button"
          className="
            w-full
            rounded-2xl
            border
            border-white/15
            bg-white/5
            hover:bg-white/10
            py-4
            font-bold
            text-white
            flex
            items-center
            justify-center
            gap-3
            transition-colors
            disabled:opacity-60
            cursor-pointer
          "
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          Google
        </motion.button>

      </div>

      <p className="mt-8 text-center text-gray-400">
        Don't have an account?{" "}
        <span
          onClick={() => router.push("/register")}
          className="cursor-pointer text-cyan-400 hover:underline"
        >
          Register
        </span>
      </p>
    </motion.div>
  );
}