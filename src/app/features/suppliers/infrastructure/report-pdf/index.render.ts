const PLACEHOLDER = /\{\{(\w+)\}\}/g;

/** Troca cada `{{chave}}` do template pelo valor; chave ausente ou vazia vira "—". */
export function render(template: string, vars: Record<string, string>): string {
  return template.replace(PLACEHOLDER, (_, key: string) => vars[key] || '—');
}

export function placeholdersOf(template: string): string[] {
  return [...template.matchAll(PLACEHOLDER)].map(([, key]) => key);
}

/** Neutraliza Markdown e HTML de um valor vindo da API para não quebrar tabelas nem injetar marcação. */
export function escapeMarkdown(value: string): string {
  return value
    .replace(/\s*[\r\n]+\s*/g, ' ')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/[\\`*_[\]|~]/g, '\\$&');
}
