const mojibakeReplacements: Array<[string, string]> = [
  ["Ã¡", "á"],
  ["Ã ", "à"],
  ["Ã¢", "â"],
  ["Ã£", "ã"],
  ["Ã©", "é"],
  ["Ãª", "ê"],
  ["Ã­", "í"],
  ["Ã³", "ó"],
  ["Ã´", "ô"],
  ["Ãµ", "õ"],
  ["Ãº", "ú"],
  ["Ã§", "ç"],
  ["Ã�", "Á"],
  ["Ã€", "À"],
  ["Ã‚", "Â"],
  ["Ãƒ", "Ã"],
  ["Ã‰", "É"],
  ["ÃŠ", "Ê"],
  ["Ã�", "Í"],
  ["Ã“", "Ó"],
  ["Ã”", "Ô"],
  ["Ã•", "Õ"],
  ["Ãš", "Ú"],
  ["Ã‡", "Ç"]
];

const legacyExactReplacements = new Map<string, string>([
  ["Ponto Eletronico", "Jornada"],
  ["Ponto Eletrônico", "Jornada"],
  ["Conheca o Ponto Eletronico", "Conheça a Jornada"],
  ["Conheça o Ponto Eletrônico", "Conheça a Jornada"],
  ["Links oficiais", "Canais oficiais"],
  ["Gestão de ponto simplificada", "Mais controle. Menos retrabalho."],
  ["Controle de jornada simples, seguro e inteligente", "Mais controle. Menos retrabalho."],
  [
    "Sistema inteligente para controle de jornada, ponto online e gestão de equipes.",
    "Controle de ponto simples, seguro e rastreável para sua empresa."
  ],
  [
    "Sistema inteligente para controle de jornada, ponto online e gestao de equipes.",
    "Controle de ponto simples, seguro e rastreável para sua empresa."
  ],
  [
    "Veja como simplificar controle de jornada e gestão de equipes.",
    "Veja como simplificar o controle de ponto e a gestão da sua equipe."
  ],
  ["Apresente sua empresa, servicos e principais diferenciais.", "Apresente sua empresa, serviços e principais diferenciais."],
  ["Solicitar orcamento", "Solicitar orçamento"],
  ["Canal rapido para novos contatos comerciais.", "Canal rápido para novos contatos comerciais."],
  ['Ola! Vim pelo link "{{origem}}" e gostaria de solicitar um orcamento.', 'Olá! Vim pelo link "{{origem}}" e gostaria de solicitar um orçamento.'],
  ['Ola! Vim pelo link "{{origem}}" e preciso de atendimento.', 'Olá! Vim pelo link "{{origem}}" e preciso de atendimento.'],
  ["Publique artigos, noticias e materiais educativos.", "Publique artigos, notícias e materiais educativos."]
]);

export function repairCommonMojibake(value: string) {
  return mojibakeReplacements.reduce((current, [broken, fixed]) => current.replaceAll(broken, fixed), value);
}

export function normalizeLegacyCopy(value: string | null | undefined) {
  if (typeof value !== "string" || value.length === 0) {
    return value ?? null;
  }

  const repaired = repairCommonMojibake(value);
  return legacyExactReplacements.get(repaired) ?? repaired;
}
