"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSupabase } from "../lib/supabase";

export default function Home() {
  const [pieces, setPieces] = useState([]);
  const [hours, setHours] = useState([]);
  const [session, setSession] = useState(null);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    sb.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => setSession(s));
    sb.from("atelier_pieces")
      .select("id,title,body,created_at,atelier_profiles(handle,display_name)")
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(24)
      .then(({ data }) => setPieces(data || []));
    sb.from("atelier_hours")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(12)
      .then(({ data }) => setHours(data || []));
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <>
      <header className="top">
        <div className="mark">Atelier · hourly</div>
        <nav className="topnav">
          <Link href="/studio">studio</Link>
          {session ? (
            <a href="#out" onClick={async (e) => { e.preventDefault(); await getSupabase()?.auth.signOut(); }}>leave</a>
          ) : (
            <Link href="/login">enter</Link>
          )}
        </nav>
      </header>
      <section className="hero">
        <h1>the wall only holds what you let it.</h1>
        <p className="lede">
          A quiet room that gets a new fixture every hour. Sign in, keep drafts in a drawer, or pin a piece to the public wall. Nothing here is a feed. It is a noticeboard with better paper.
        </p>
      </section>
      <div className="grid">
        <section className="wall">
          <p className="kicker">public wall</p>
          {pieces.length === 0 && <p className="meta">empty for now. that is allowed.</p>}
          {pieces.map((p, i) => (
            <article className="card" key={p.id} style={{ animationDelay: `${i * 40}ms` }}>
              <h3>{p.title}</h3>
              <p>{p.body}</p>
              <div className="meta">
                {(p.atelier_profiles && (p.atelier_profiles.display_name || p.atelier_profiles.handle)) || "anon"} · {new Date(p.created_at).toLocaleString()}
              </div>
            </article>
          ))}
        </section>
        <aside className="hours">
          <p className="kicker">this hour / last hours</p>
          {hours.map((h) => (
            <article className="card" key={h.id}>
              <h3>{h.title}</h3>
              <p>{h.body}</p>
              <div className="meta">{h.hour_stamp}</div>
            </article>
          ))}
        </aside>
      </div>
    </>
  );
}
