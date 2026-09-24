// §5 white-label: validações, contraste WCAG AA e sanitização de SVG.
export function ehHex(v: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(v);
}

function lum(hex: string): number {
  const c = hex.replace("#", "");
  const f = (i: number) => {
    const v = parseInt(c.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(0) + 0.7152 * f(2) + 0.0722 * f(4);
}

/** Escolhe texto claro/escuro sobre a cor e avisa se abaixo de AA (4.5:1). */
export function contraste(corFundo: string): { texto: "#ffffff" | "#17212b"; ratio: number; aa: boolean } {
  const l = lum(corFundo);
  // branco (lum 1) vs #17212b
  const ratioClaro = (Math.max(l, 1) + 0.05) / (Math.min(l, 1) + 0.05);
  const ratioEscuro = (Math.max(l, lum("#17212b")) + 0.05) / (Math.min(l, lum("#17212b")) + 0.05);
  const texto = ratioClaro >= ratioEscuro ? "#ffffff" : "#17212b";
  const ratio = Math.max(ratioClaro, ratioEscuro);
  return { texto, ratio: Math.round(ratio * 100) / 100, aa: ratio >= 4.5 };
}

/** Sanitiza SVG: remove scripts, event handlers, links externos, object/iframe. */
export function sanitizarSVG(svg: string): string {
  let s = svg
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/<object[\s\S]*?<\/object>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*')/gi, "")
    .replace(/href\s*=\s*"(http|https):[^"]*"/gi, 'href="#"')
    .replace(/xlink:href\s*=\s*"(http|https):[^"]*"/gi, 'xlink:href="#"');
  if (!/<svg[\s>]/i.test(s)) throw new Error("Arquivo não é um SVG válido.");
  return s;
}

export function validarLogo(mime: string, bytes: number): void {
  const ok = ["image/png", "image/jpeg", "image/svg+xml"].includes(mime);
  if (!ok) throw new Error("Logo deve ser PNG, JPG ou SVG.");
  if (bytes > 300 * 1024) throw new Error("Logo acima de 300 KB.");
}
