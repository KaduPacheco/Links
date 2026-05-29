const mojibakeReplacements: Array<[string, string]> = [
  ["\u00c3\u00a1", "\u00e1"],
  ["\u00c3\u00a0", "\u00e0"],
  ["\u00c3\u00a2", "\u00e2"],
  ["\u00c3\u00a3", "\u00e3"],
  ["\u00c3\u00a9", "\u00e9"],
  ["\u00c3\u00aa", "\u00ea"],
  ["\u00c3\u00ad", "\u00ed"],
  ["\u00c3\u00b3", "\u00f3"],
  ["\u00c3\u00b4", "\u00f4"],
  ["\u00c3\u00b5", "\u00f5"],
  ["\u00c3\u00ba", "\u00fa"],
  ["\u00c3\u00a7", "\u00e7"],
  ["\u00c3\u0081", "\u00c1"],
  ["\u00c3\u0080", "\u00c0"],
  ["\u00c3\u0082", "\u00c2"],
  ["\u00c3\u0083", "\u00c3"],
  ["\u00c3\u0089", "\u00c9"],
  ["\u00c3\u008a", "\u00ca"],
  ["\u00c3\u008d", "\u00cd"],
  ["\u00c3\u0093", "\u00d3"],
  ["\u00c3\u0094", "\u00d4"],
  ["\u00c3\u0095", "\u00d5"],
  ["\u00c3\u009a", "\u00da"],
  ["\u00c3\u0087", "\u00c7"]
];

const legacyExactReplacements = new Map<string, string>([
  ["Ponto Eletronico", "Ponto Eletr\u00f4nico"],
  [
    "Sistema inteligente para controle de jornada, ponto online e gestao de equipes.",
    "Sistema inteligente para controle de jornada, ponto online e gest\u00e3o de equipes."
  ],
  [
    "Apresente sua empresa, servicos e principais diferenciais.",
    "Apresente sua empresa, servi\u00e7os e principais diferenciais."
  ],
  ["Solicitar orcamento", "Solicitar or\u00e7amento"],
  ["Canal rapido para novos contatos comerciais.", "Canal r\u00e1pido para novos contatos comerciais."],
  ['Ola! Vim pelo link "{{origem}}" e gostaria de solicitar um orcamento.', 'Ol\u00e1! Vim pelo link "{{origem}}" e gostaria de solicitar um or\u00e7amento.'],
  ['Ola! Vim pelo link "{{origem}}" e preciso de atendimento.', 'Ol\u00e1! Vim pelo link "{{origem}}" e preciso de atendimento.'],
  ["Publique artigos, noticias e materiais educativos.", "Publique artigos, not\u00edcias e materiais educativos."]
]);

export function repairCommonMojibake(value: string) {
  return mojibakeReplacements.reduce(
    (current, [broken, fixed]) => current.replaceAll(broken, fixed),
    value
  );
}

export function normalizeLegacyCopy(value: string | null | undefined) {
  if (typeof value !== "string" || value.length === 0) {
    return value ?? null;
  }

  const repaired = repairCommonMojibake(value);
  return legacyExactReplacements.get(repaired) ?? repaired;
}
