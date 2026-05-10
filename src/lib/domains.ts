export const DOMAINS = [
  "Portugal — Origens e Império",
  "Portugal — Ditadura e Estado Novo",
  "Portugal — Revolução e Democracia",
  "Segunda Guerra Mundial",
  "Europa — Guerras e Política",
  "Médio Oriente, Ásia e África",
  "Américas e Mundo Atlântico",
  "Sociedade, Cultura e Ideias",
] as const;

export type Domain = (typeof DOMAINS)[number];

export function slugifyDomain(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/—/g, "-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function domainFromSlug(slug: string): Domain | null {
  return (DOMAINS.find((d) => slugifyDomain(d) === slug) as Domain) ?? null;
}

export function slugifyTheme(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
