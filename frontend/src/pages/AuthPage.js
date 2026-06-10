import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const BG_IMG =
  "https://images.unsplash.com/photo-1533135091724-62cc5402aa20?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxODl8MHwxfHNlYXJjaHwyfHxhYnN0cmFjdCUyMG1pbmltYWwlMjB3aGl0ZSUyMGFuZCUyMGJsYWNrJTIwdGV4dHVyZXxlbnwwfHx8fDE3ODEwNjE2OTV8MA&ixlib=rb-4.1.0&q=85";

export default function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res =
      mode === "login" ? await login(email, password) : await register(name, email, password);
    setLoading(false);
    if (!res.ok) setError(res.error);
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left brand panel */}
      <div className="hidden lg:flex w-1/2 relative bg-black text-white flex-col justify-between p-12 overflow-hidden">
        <img
          src={BG_IMG}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-25"
        />
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10"
        >
          <span className="font-heading font-extrabold text-2xl tracking-tight">margin.</span>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="relative z-10 max-w-md"
        >
          <h1 className="font-heading font-extrabold text-4xl sm:text-5xl tracking-tight leading-[1.05]">
            Know your numbers.
            <br />
            Plainly.
          </h1>
          <p className="mt-6 text-neutral-300 text-base leading-relaxed">
            Figure out if your business makes money — without the finance degree. Simple words,
            real numbers, zero jargon.
          </p>
        </motion.div>
        <p className="relative z-10 text-xs text-neutral-500">
          Built on the ideas behind $100M offers & money models.
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          <div className="lg:hidden mb-10">
            <span className="font-heading font-extrabold text-2xl tracking-tight">margin.</span>
          </div>
          <h2 className="font-heading font-extrabold text-3xl tracking-tight">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h2>
          <p className="mt-2 text-sm text-neutral-500">
            {mode === "login"
              ? "Log in to keep working on your numbers."
              : "Free to start. No credit card, no fine print."}
          </p>

          <form onSubmit={submit} className="mt-8 space-y-5">
            {mode === "register" && (
              <div className="space-y-1.5">
                <Label htmlFor="name">Your name</Label>
                <Input
                  id="name"
                  data-testid="auth-name-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex"
                  required
                  className="h-11 focus-visible:ring-black"
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                data-testid="auth-email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@business.com"
                required
                className="h-11 focus-visible:ring-black"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                data-testid="auth-password-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
                minLength={6}
                className="h-11 focus-visible:ring-black"
              />
            </div>

            {error && (
              <p data-testid="auth-error-message" className="text-sm text-red-600">
                {error}
              </p>
            )}

            <Button
              type="submit"
              data-testid="auth-submit-button"
              disabled={loading}
              className="w-full h-11 bg-black text-white hover:bg-black/80 active:scale-[0.98] transition-all duration-200"
            >
              {loading ? "One moment..." : mode === "login" ? "Log in" : "Create account"}
            </Button>
          </form>

          <button
            type="button"
            data-testid="auth-toggle-mode"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError("");
            }}
            className="mt-6 text-sm text-neutral-500 hover:text-black transition-colors duration-200"
          >
            {mode === "login"
              ? "New here? Create an account →"
              : "Already have an account? Log in →"}
          </button>
        </motion.div>
      </div>
    </div>
  );
}
