"use client";

import { useEffect, useState } from "react";

type User = { email: string; name: string | null; role: string; created_at?: string };

export default function AdminUsersClient({ myEmail }: { myEmail: string }) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("member");
  const [busy, setBusy] = useState(false);

  async function load() {
    const r = await fetch("/api/admin/users").then((r) => r.json()).catch(() => ({ users: [] }));
    setUsers(r.users ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function save(payload: { email: string; name?: string; role?: string }) {
    setBusy(true);
    try {
      const r = await fetch("/api/admin/users", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      const d = await r.json();
      if (!r.ok || !d.ok) throw new Error(d.error || "저장 실패");
      await load();
    } catch (e) { alert(e instanceof Error ? e.message : "저장 실패"); }
    finally { setBusy(false); }
  }

  async function addUser() {
    if (!email.trim()) return;
    await save({ email: email.trim(), name: name.trim(), role });
    setEmail(""); setName(""); setRole("member");
  }

  async function changeRole(u: User, newRole: string) {
    await save({ email: u.email, name: u.name ?? "", role: newRole });
  }

  async function remove(u: User) {
    if (!confirm(`${u.email} 계정을 삭제할까요? (로그인 차단됩니다)`)) return;
    setBusy(true);
    try {
      const r = await fetch("/api/admin/users", {
        method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: u.email }),
      });
      const d = await r.json();
      if (!r.ok || !d.ok) throw new Error(d.error || "삭제 실패");
      await load();
    } catch (e) { alert(e instanceof Error ? e.message : "삭제 실패"); }
    finally { setBusy(false); }
  }

  return (
    <div className="flex flex-col gap-5 max-w-2xl">
      {/* 추가 폼 */}
      <div className="rounded-xl border border-edge bg-surface p-5 flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-secondary uppercase">계정 추가</h2>
        <div className="flex gap-2 flex-wrap">
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="구글 이메일"
            className="flex-1 min-w-[200px] rounded-lg border border-edge bg-base px-3 py-2 text-sm text-primary placeholder:text-secondary/40 focus:outline-none focus:ring-1 focus:ring-accent" />
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="이름(선택)"
            className="w-32 rounded-lg border border-edge bg-base px-3 py-2 text-sm text-primary placeholder:text-secondary/40 focus:outline-none focus:ring-1 focus:ring-accent" />
          <select value={role} onChange={(e) => setRole(e.target.value)}
            className="rounded-lg border border-edge bg-base px-3 py-2 text-sm text-primary focus:outline-none focus:ring-1 focus:ring-accent">
            <option value="member">멤버</option>
            <option value="admin">관리자</option>
          </select>
          <button onClick={addUser} disabled={busy || !email.trim()}
            className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover disabled:opacity-40">
            추가
          </button>
        </div>
      </div>

      {/* 목록 */}
      <div className="rounded-xl border border-edge bg-surface overflow-hidden">
        <div className="px-4 py-2.5 bg-elevated border-b border-edge text-xs text-secondary">
          허용 계정 {users.length}명
        </div>
        {loading ? (
          <div className="p-6 text-center text-sm text-secondary">불러오는 중…</div>
        ) : (
          <div className="divide-y divide-edge/60">
            {users.map((u) => (
              <div key={u.email} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-primary truncate">
                    {u.email}{u.email === myEmail && <span className="ml-2 text-xs text-accent">(나)</span>}
                  </p>
                  {u.name && <p className="text-xs text-secondary truncate">{u.name}</p>}
                </div>
                <select
                  value={u.role}
                  onChange={(e) => changeRole(u, e.target.value)}
                  disabled={busy}
                  className="rounded-lg border border-edge bg-base px-2 py-1.5 text-sm text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  <option value="member">멤버</option>
                  <option value="admin">관리자</option>
                </select>
                <button
                  onClick={() => remove(u)}
                  disabled={busy || u.email === myEmail}
                  className="px-3 py-1.5 rounded-lg border border-edge text-xs text-secondary hover:bg-elevated hover:text-negative transition-colors disabled:opacity-30"
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <p className="text-xs text-secondary/70">
        ※ 계정 변경은 해당 사용자가 다음 로그인(또는 재로그인) 시 반영됩니다. 역할/허용은 최대 5분 캐시됩니다.
      </p>
    </div>
  );
}
