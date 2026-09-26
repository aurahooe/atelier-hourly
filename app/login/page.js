"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "../../lib/supabase";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [handle, setHandle] = useState("");
  const [mode, setMode] = useState("in");
  const [msg, setMsg] = useState("");

  async function submit(e) {
    e.preventDefault();
    const sb = getSupabase();
    if (!sb) { setMsg("missing supabase env"); return; }
    setMsg("working…");
    if (mode === "in") {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) return setMsg(error.message);
      router.push("/studio");
      return;
    }
    const { data, error } = await sb.auth.signUp({ email, password });
    if (error) return setMsg(error.message);
    const user = data.user;
    if (user) {
      const clean = (handle || email.split("@")[0]).replace(/[^a-z0-9_]/gi, "").slice(0, 24) || "guest";
      await sb.from("atelier_profiles").insert({ id: user.id, handle: clean.toLowerCase(), display_name: clean });
    }
    setMsg(data.session ? "desk unlocked." : "check your email to confirm, then come back.");
    if (data.session) router.push("/studio");
  }

  return (
    <div className="wrap">
      <p className="kicker"><Link href="/">← wall</Link></p>
      <h1 style={{ fontWeight: 400, fontSize: 48, marginTop: 8 }}>{mode === "in" ? "come in." : "take a key."}</h1>
      <p className="lede" style={{ animation: "none" }}>
        Email and a password. No third-party circus. After you join, your work stays in a private drawer until you mark it public.
      </p>
      <form className="sheet" onSubmit={submit}>
        {mode === "up" && (
          <input placeholder="handle" value={handle} onChange={(e) => setHandle(e.target.value)} />
        )}
        <input type="email" required placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type="password" required minLength={8} placeholder="password (8+)" value={password} onChange={(e) => setPassword(e.target.value)} />
        <div className="row">
          <button className="ink" type="submit">{mode === "in" ? "enter" : "create desk"}</button>
          <button type="button" onClick={() => setMode(mode === "in" ? "up" : "in")}>
            {mode === "in" ? "need a key?" : "already have one"}
          </button>
        </div>
        {msg && <p className="meta">{msg}</p>}
      </form>
    </div>
  );
}
