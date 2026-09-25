"use client";
import { useState, useEffect } from "react";
import Guarda from "@/components/Guarda";
import { contraste, sanitizarSVG, validarLogo } from "@/lib/branding";

const PADRAO = {
  nm: "Expresso Vitória",
  y: "#f5b800", th: "#17212b", bg: "#f4f5f2", card: "#ffffff",
  ink: "#17212b", mut: "#5d6b78", line: "#dfe3e0", lg: ""
};

const CORES: { k: keyof typeof PADRAO; rot: string; area: string }[] = [
  { k: "y", rot: "Destaque", area: "faixa do cabeçalho, botões, foco" },
  { k: "th", rot: "Tabela", area: "cabeçalho das tabelas" },
  { k: "bg", rot: "Fundo", area: "fundo de todas as telas" },
  { k: "card", rot: "Cartão", area: "cartões, tabelas e painéis" },
  { k: "ink", rot: "Texto", area: "textos e números" },
  { k: "mut", rot: "Texto secundário", area: "legendas e descrições" },
  { k: "line", rot: "Bordas", area: "linhas de tabelas e cartões" }
];

export default function ConfigPage() {
  const [cfg, setCfg] = useState(PADRAO);
  const [msg, setMsg] = useState("");
  const [logoName, setLogoName] = useState("");

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem("cfg") || "{}");
      setCfg({ ...PADRAO, ...s });
    } catch {}
  }, []);

  function aplicar(v: typeof PADRAO) {
    const st = document.documentElement.style;
    const mapa: Record<string, string> = {
      y: "--y", th: "--th", bg: "--bg", card: "--card",
      ink: "--ink", mut: "--mut", line: "--line"
    };
    for (const [k, css] of Object.entries(mapa)) st.setProperty(css, v[k as keyof typeof v] as string);
  }

  function mudar(k: keyof typeof PADRAO, v: string) {
    const n = { ...cfg, [k]: v };
    setCfg(n); aplicar(n);
  }

  function escolherLogo(f: File) {
    setMsg("");
    try {
      validarLogo(f.type, f.size);
    } catch (e) { setMsg((e as Error).message); return; }
    const fr = new FileReader();
    fr.onload = () => {
      try {
        let url = String(fr.result);
        if (f.type === "image/svg+xml") url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(sanitizarSVG(url.startsWith("data:") ? decodeURIComponent(url.split(",")[1] ?? "") : url));
        const n = { ...cfg, lg: url };
        setCfg(n); setLogoName(f.name); aplicar(n);
        setMsg(`Logo "${f.name}" pronta. Clique em Salvar.`);
      } catch (e) { setMsg((e as Error).message); }
    };
    if (f.type === "image/svg+xml") fr.readAsText(f); else fr.readAsDataURL(f);
  }

  async function salvar() {
    const r = await fetch("/api/configuracoes/aparencia", {
      method: "PUT", headers: { "content-type": "application/json" },
      body: JSON.stringify({
        cor_primaria: cfg.y, cor_secundaria: cfg.th, nome_exibicao: cfg.nm,
        fundo: cfg.bg, cartao: cfg.card, texto: cfg.ink, secundario: cfg.mut, borda: cfg.line
      })
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { setMsg("Servidor recusou: " + (j.error ?? r.status)); return; }
    try { localStorage.setItem("cfg", JSON.stringify(cfg)); } catch {}
    setMsg("Aparência salva — vale para todas as áreas e todos os usuários da empresa.");
  }

  function restaurar() {
    setCfg(PADRAO); setLogoName(""); aplicar(PADRAO);
    try { localStorage.removeItem("cfg"); } catch {}
    document.documentElement.style.cssText = "";
    setMsg("Padrão restaurado.");
  }

  return (
    <Guarda aba="configuracoes">
    <main style={{ maxWidth: 860, margin: "0 auto", padding: "20px 16px 48px" }}>
      <h1 className="font-cond" style={{ fontSize: 28, margin: "0 0 4px" }}>Configurações · Aparência (§5)</h1>
      <p style={{ color: "var(--mut)", marginTop: 0 }}>Cores de todas as áreas + logo. Prévia ao vivo; ao salvar vale para toda a empresa (tabela <code>tenant_branding</code>).</p>

      <h2 className="font-cond" style={{ fontSize: 20 }}>Empresa</h2>
      <label>Nome de exibição <input value={cfg.nm} onChange={(e) => mudar("nm", e.target.value)} aria-label="Nome de exibição"
        style={{ padding: "8px 10px", border: "1px solid var(--line)", borderRadius: 6, background: "var(--card)", color: "var(--ink)", minWidth: 240 }} /></label>

      <h2 className="font-cond" style={{ fontSize: 20, marginTop: 20 }}>Cores de todas as áreas</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 10 }}>
        {CORES.map((c) => {
          const v = cfg[c.k] as string;
          const ct = contraste(v);
          return (
            <div key={c.k} style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 6, padding: 10, display: "flex", gap: 10, alignItems: "center" }}>
              <input type="color" value={v} onChange={(e) => mudar(c.k, e.target.value)} aria-label={c.rot} style={{ width: 52, height: 40, padding: 2 }} />
              <div style={{ fontSize: 13 }}>
                <b>{c.rot}</b> <code>{v}</code><br />
                <span style={{ color: "var(--mut)" }}>{c.area}</span><br />
                <span style={{ color: ct.aa ? "var(--ok)" : "var(--bad)" }}>
                  texto {ct.texto === "#ffffff" ? "claro" : "escuro"} · {ct.ratio}:1 · {ct.aa ? "contraste OK" : "contraste baixo"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <p style={{ color: "var(--mut)", fontSize: 13 }}>As cores de situação (verde, âmbar, vermelho, cinza) são fixas e não mudam, para o semáforo continuar reconhecível.</p>

      <h2 className="font-cond" style={{ fontSize: 20, marginTop: 20 }}>Logo</h2>
      <p style={{ color: "var(--mut)", marginTop: 0 }}>PNG, JPG ou SVG até 300 KB (SVG é sanitizado). Exibida com altura máxima de 48 px no cabeçalho, no login e nos PDFs.</p>
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        {cfg.lg ? <img src={cfg.lg} alt="Prévia da logo" style={{ maxHeight: 48, maxWidth: 200, background: "var(--card)", border: "1px solid var(--line)", borderRadius: 6, padding: 4 }} /> : <span style={{ color: "var(--mut)" }}>Sem logo</span>}
        <label>Escolher arquivo <input type="file" accept="image/png,image/jpeg,image/svg+xml" aria-label="Logo"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) escolherLogo(f); }} /></label>
        {cfg.lg ? <button onClick={() => { const n = { ...cfg, lg: "" }; setCfg(n); setLogoName(""); aplicar(n); }}>Remover logo</button> : null}
      </div>
      {logoName ? <p style={{ fontSize: 13 }}>Arquivo: {logoName}</p> : null}

      <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
        <button onClick={salvar} style={{ fontWeight: 700 }}>Salvar aparência</button>
        <button onClick={restaurar}>Restaurar padrão</button>
      </div>
      {msg ? <p role="status">{msg}</p> : null}
    </main>
    </Guarda>
  );
}
