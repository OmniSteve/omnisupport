import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { APP_NAME, SUPPORT_EMAIL } from "@/lib/constants";

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState("alex@omnisolutions.mt");
  const [password, setPassword] = useState("demo");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.message || "Login failed");
      toast.error(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left brand panel */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 30%, white 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
            <span className="text-white font-bold">O</span>
          </div>
          <span className="text-white font-semibold">Omni Solutions</span>
        </div>
        <div className="relative">
          <h1 className="text-4xl font-bold text-white tracking-tight leading-tight">
            Enterprise support,<br />beautifully organised.
          </h1>
          <p className="mt-4 text-slate-300 max-w-md">
            The central helpdesk for Omni Solutions and its clients — manage tickets, SLAs, customers and knowledge in one place.
          </p>
        </div>
        <p className="relative text-xs text-slate-400">© {new Date().getFullYear()} Omni Solutions. All rights reserved.</p>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center">
              <span className="text-white font-bold text-sm">O</span>
            </div>
            <span className="font-semibold text-slate-900 dark:text-white">Omni Solutions</span>
          </div>

          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Sign in to {APP_NAME}</h2>
          <p className="text-sm text-slate-500 mt-1">Use any seeded account email to enter the demo.</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" loading={loading} className="w-full">Sign in</Button>
          </form>

          <p className="mt-6 text-xs text-slate-400 text-center">
            Demo mode · Email {SUPPORT_EMAIL} for help
          </p>
        </div>
      </div>
    </div>
  );
}