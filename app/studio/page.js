"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "../../lib/supabase";

export default function Studio() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null);
  const [pieces, setPieces] = useState([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [msg, setMsg] = useState("");

  async function load(sb, uid) {
    const { data } = await sb.from("atelier_pieces").select("*").eq("author_id", uid).order("created_at", { ascending: false });
    setPieces(data || []);
  }

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    sb.auth.getSession().then(async ({ data }) => {
      if (!data.session) { router.replace("/login"); return; }
      setUser(data.session.user);
      const { data: prof } = await sb.from("atelier_profiles").select("*").eq("id", data.session.user.id).maybeSingle();
      if (!prof) {
        const handle = (data.session.user.email || "guest").split("@")[0].slice(0, 24);
        await sb.from("atelier_profiles").insert({ id: data.session.user.id, handle, display_name: handle });
      }
      await load(sb, data.session.user.id);
      setReady(true);
    });
  }, [router]);

  async function save(e) {
    e.preventDefault();
    const sb = getSupabase();
    if (!sb || !user) return;
    setMsg("saving…");
    const { error } = await sb.from("atelier_pieces").insert({
      author_id: user.id,
      title: title.trim() || "untitled",
      body: body.trim(),
      is_public: isPublic,
    });
    if (error) return setMsg(error.message);
    setTitle(""); setBody(""); setIsPublic(false);
    setMsg(isPublic ? "hung on the wall." : "kept in the drawer.");
    await load(sb, user.id);
  }

  async function toggle(p) {
    const sb = getSupabase();
    await sb.from("atelier_pieces").update({ is_public: !p.is_public, updated_at: new Date().toISOString() }).eq("id", p.id);
    await load(sb, user.id);
  }

  async function remove(p) {
    const sb = getSupabase();
    await sb.from("atelier_pieces").delete().eq("id", p.id);
    await load(sb, user.id);
  }

  if (!ready) return <div className="wrap">unlocking desk…</div>;

  return (
    <div className="wrap">
      <p className="kicker"><Link href="/">← wall</Link></p>
      <h1 style={{ fontWeight: 400, fontSize: 48 }}>your drawer</h1>
      <p className="lede" style={{ animation: "none" }}>
        Write here. Leave the public box unchecked and only you see it. Check it and the piece appears on the wall downstairs.
      </p>
      <form className="sheet" onSubmit={save}>
        <input placeholder="title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea placeholder="the piece itself" value={body} onChange={(e) => setBody(e.target.value)} required />
        <label className="chk">
          <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
          hang this on the public wall
        </label>
        <button className="ink" type="submit">save</button>
        {msg && <p className="meta">{msg}</p>}
      </form>
      {pieces.map((p) => (
        <article className="card" key={p.id}>
          <h3>{p.title}</h3>
          <p>{p.body}</p>
          <div className="meta">{p.is_public ? "on the wall" : "private"} · {new Date(p.created_at).toLocaleString()}</div>
          <div className="row" style={{ marginTop: 10 }}>
            <button type="button" onClick={() => toggle(p)}>{p.is_public ? "take down" : "make public"}</button>
            <button type="button" onClick={() => remove(p)}>burn</button>
          </div>
        </article>
      ))}
    </div>
  );
}
