/** Conteúdo editorial longo (resumo + tópicos) para Investimentos e Empreendedorismo — alinhado ao nível de Finanças na app. */

export type ExtendedBookContent = { summary: string; topics: string[] };

export const INVESTMENTS_CONTENT_BY_ID: Record<string, ExtendedBookContent> = {
  'i-1': {
    summary:
      'Benjamin Graham define o investidor inteligente como alguém que protege capital, busca retorno adequado e evita especulação emocional. ' +
      'O conceito de "Mr. Market" ensina a tratar cotações como parceiro bipolar: use as ofertas dele, nao seja escravo do humor dele. ' +
      'A margem de segurança compra erro de calculo e imprevistos. O livro distingue investidor defensivo e empreendedor, com estrategias diferentes de diversificacao e esforço.\n\n' +
      'Ilustracao mental: o mercado e um taxi que passa a cada dia oferecendo precos; voce decide quando entrar ou ignorar, nao precisa aceitar todas as corridas.',
    topics: ['Mr. Market e disciplina', 'Margem de seguranca', 'Investidor defensivo x empreendedor', 'Preco x valor', 'Longo prazo racional'],
  },
  'i-2': {
    summary:
      'Philip Fisher defende investigacao profunda em empresas de qualidade com gestao excepcional e vantagens duradouras. ' +
      'O metodo "scuttlebutt" sugere falar com clientes, fornecedores e concorrentes para validar tese. ' +
      'Preferir poucos investimentos bem estudados a muitos superficiais. O foco e crescimento sustentavel e integridade da liderança.\n\n' +
      'Ilustracao mental: em vez de comprar 50 sementes ao acaso, regar e observar poucas arvores ate saber que raiz e forte.',
    topics: ['Pesquisa qualitativa', 'Scuttlebutt', 'Gestao e cultura', 'Crescimento sustentavel', 'Concentracao informada'],
  },
  'i-3': {
    summary:
      'Peter Lynch populariza "invista no que voce conhece": tendencias do dia a dia podem revelar bons negocios antes do consenso. ' +
      'Classifica acoes (lentas, rapidas, ciclicas, turnaround, hidden assets) e alerta para o perigo de confundir historia com tese. ' +
      'Trabalho e curiosidade substituem formulas magicas; ainda assim exige controle emocional e diversificacao razoavel.\n\n' +
      'Ilustracao mental: o investidor como jornalista de bairro que conecta pistas reais antes da manchete nacional.',
    topics: ['Invista no que conhece', 'Tipos de acoes', 'Paciencia e curiosidade', 'Evitar hype cego', 'Fundamentos locais'],
  },
  'i-4': {
    summary:
      'Obra fundacional com Graham e Dodd sobre analise de valores mobiliarios: balanços, rendimentos fixos e acoes com rigor. ' +
      'E denso e academico, mas ensina a ler demonstracoes como um detetive le evidencias. ' +
      'Ideal para quem quer base tecnica seria, nao atalhos. O espirito e conservadorismo e evidencia.\n\n' +
      'Ilustracao mental: um manual de engenharia para pontes financeiras — exige estudo, mas evita colapsos.',
    topics: ['Demonstracoes financeiras', 'Risco e retorno teorico', 'Valor intrinseco', 'Rigor academico', 'Paciencia de leitura'],
  },
  'i-5': {
    summary:
      'John Bogle defende indexacao de baixo custo: capturar retorno de mercado em vez de tentar batê-lo repetidamente. ' +
      'Custos e turnover corroem retorno composto ao longo de decadas. A simplicidade reduz erros comportamentais. ' +
      'A mensagem central: "nao procure a agulha no palheiro, compre o palheiro" (o mercado amplo).\n\n' +
      'Ilustracao mental: em vez de apostar em um cavalo, ser dono modesto de toda a corrida com taxa minima.',
    topics: ['Indexacao', 'Custos baixos', 'Menos é mais', 'Longo prazo', 'Comportamento do investidor'],
  },
  'i-6': {
    summary:
      'Malkiel percorre teorias de mercado e evidencia empirica: dificuldade de previsao consistente e poder da diversificacao. ' +
      'Critica excesso de confianca em "especialistas" e promove carteiras eficientes por custo e simplicidade. ' +
      'Atualizacoes ao longo das edições incorporam novos instrumentos, mas o nucleo permanece racional e cético.\n\n' +
      'Ilustracao mental: caminhar com guarda-chuva diversificado em clima imprevisivel em vez de adivinhar cada rajada.',
    topics: ['Hipótese de mercados', 'Diversificacao', 'Critica a timing', 'ETFs e index', 'Ceticismo saudavel'],
  },
  'i-7': {
    summary:
      'Siegel argumenta com dados historicos que acoes superam alternativas no longo prazo, apesar de crises assustadoras. ' +
      'Explica fatores, dividendos, valor e momentum em linguagem acessivel. ' +
      'Util para ancorar expectativas realistas e resistir ao panico de curto prazo.\n\n' +
      'Ilustracao mental: o mercado como rio com corrente ascendente secular, mesmo com pedras e cachoeiras no percurso.',
    topics: ['Retorno historico', 'Longo prazo', 'Crises e recuperacao', 'Fatores de retorno', 'Expectativas realistas'],
  },
  'i-8': {
    summary:
      'Mohnish Pabrai resume o investimento Dhandho: apostar em situacoes com retorno assimétrico — ganhar muito se der certo, perder pouco se falhar. ' +
      'Inspiracao em empreendedores conservadores que buscam "heads I win, tails I do not lose much". ' +
      'Combina paciencia, foco e clareza de upside/downside.\n\n' +
      'Ilustracao mental: jogar dardos onde o alvo paga 10x e o erro so custa o preço de um dardo.',
    topics: ['Assimetria risco/retorno', 'Foco e paciencia', 'Downside limitado', 'Filosofia Dhandho', 'Decisoes repetiveis'],
  },
  'i-9': {
    summary:
      'Continuacao pratica de Lynch: como montar uma carteira pessoal, quando vender, erros comuns e leitura de relatorios. ' +
      'Reforca que trabalho e observacao vencem fórmulas, mas disciplina importa. ' +
      'Bom complemento para quem ja leu "Um Passo à Frente".\n\n' +
      'Ilustracao mental: um diario de campo do investidor amador que vira profissional em metodo.',
    topics: ['Montagem de carteira', 'Quando vender', 'Erros comuns', 'Relatorios e números', 'Disciplina pratica'],
  },
  'i-10': {
    summary:
      'Howard Marks foca no que outros livros subestimam: ciclo, risco psicologico e "second-level thinking". ' +
      'O preço ja reflete expectativas; o diferencial e antever onde o consenso esta errado. ' +
      'Defende humildade, faixas de incerteza e gestao de risco antes de buscar retorno maximo.\n\n' +
      'Ilustracao mental: xadrez em varias jogadas — a jogada obvia nem sempre e a vencedora.',
    topics: ['Second-level thinking', 'Ciclos de mercado', 'Risco percebido x real', 'Humildade intelectual', 'Posicionamento contrarian moderado'],
  },
  'i-11': {
    summary:
      'Hagstrom sintetiza principios associados a Buffett: vantagem competitiva duradoura, gestao alinhada, paciencia e concentracao informada. ' +
      'Nao substitui leitura das cartas originais, mas organiza conceitos para iniciantes em value quality.\n\n' +
      'Ilustracao mental: um mapa tematico das ideias de Omaha, nao o terreno completo.',
    topics: ['Economic moat', 'Gestao e alinhamento', 'Qualidade empresarial', 'Paciencia', 'Carteiras concentradas'],
  },
  'i-12': {
    summary:
      'Compilacao das cartas de Buffett: capital allocation, honestidade com acionistas, aquisicoes, erros admitidos e longo prazo. ' +
      'Leitura essencial para entender raciocinio de dono de negocio aplicado a mercado de capitais.\n\n' +
      'Ilustracao mental: aulas anuais do mesmo professor durante decadas — consistencia de principios.',
    topics: ['Alocacao de capital', 'Transparencia', 'Erros e aprendizado', 'Longo prazo', 'Mindset de dono'],
  },
  'i-13': {
    summary:
      'Klarman defende investimento em valor com forte margem de seguranca e ceticismo a moda de mercado. ' +
      'Texto raro e denso; enfatiza liquidez, catalisadores e disciplina quando poucos ativos parecem baratos. ' +
      'Ideal para quem quer mentalidade institucional conservadora.\n\n' +
      'Ilustracao mental: ponte com pilares largos — so atravessa com peso quando a estrutura aguenta.',
    topics: ['Margem de seguranca extrema', 'Ceticismo', 'Catalisadores', 'Liquidez', 'Oportunidade seletiva'],
  },
  'i-14': {
    summary:
      'Marks aprofunda ciclos: onde estamos na onda de otimismo/pessimismo e como ajustar risco sem prever o futuro. ' +
      'Combina experiencia de credito e equities. Ensina a calibrar agressividade defensiva conforme o ambiente.\n\n' +
      'Ilustracao mental: surfista que ajusta prancha e distancia da praia conforme o tamanho da onda.',
    topics: ['Ciclos emocionais', 'Calibragem de risco', 'Indicadores qualitativos', 'Humildade', 'Timing moderado'],
  },
  'i-15': {
    summary:
      'Brandon Turner foca buy-and-hold de imoveis para aluguel: analise de mercado, financiamento, screening de inquilinos e operacao. ' +
      'Diferencia investimento de especulacao imobiliaria e enfatiza fluxo de caixa e alavancagem responsavel.\n\n' +
      'Ilustracao mental: maquina de lavar que precisa de manutencao — fluxo positivo exige gestao ativa.',
    topics: ['Fluxo de caixa', 'Alavancagem responsavel', 'Screening de inquilinos', 'Mercado local', 'Longo prazo real'],
  },
  'i-16': {
    summary:
      'Danielle Town mistura jornada pessoal com introducao a investimento em valor e DCF simplificado, combatendo ansiedade. ' +
      'Util para quem sente medo de comecar: passos pequenos, checklists e autocompaixao no aprendizado.\n\n' +
      'Ilustracao mental: aprender a nadar com boia antes de mergulhar no fundo.',
    topics: ['Ansiedade e dinheiro', 'Checklists', 'Introducao a valuation', 'Passos pequenos', 'Consistencia'],
  },
  'i-17': {
    summary:
      'Gautam Baid compila sabedoria de grandes investidores: compostagem intelectual, leitura profunda, paciencia e etica. ' +
      'Menos uma tecnica unica e mais um manifesto de habitos que sustentam resultado ao longo de vida.\n\n' +
      'Ilustracao mental: horta que precisa de solo rico (conhecimento) e rega diaria (habitos).',
    topics: ['Habitos de leitura', 'Paciencia composta', 'Etica profissional', 'Mental models', 'Longevidade'],
  },
  'i-18': {
    summary:
      'Bernstein narra a historia do risco, probabilidade e mercados financeiros modernos. ' +
      'Contextualiza por que ferramentas quantitativas importam e como supersticao deu lugar a modelos — com limitacoes.\n\n' +
      'Ilustracao mental: evolucao de mapas nauticos; cada geracao navega melhor, mas nunca elimina tempestades.',
    topics: ['Historia do risco', 'Probabilidade', 'Modelos e limites', 'Contexto de mercados', 'Pensamento quantitativo'],
  },
  'i-19': {
    summary:
      'Dalio resume maquina economica, divida de curto/longo prazo e ciclos. Ajuda a enquadrar noticias macro sem panico. ' +
      'Versao acessivel de ideias que aparecem em "Principles" e videos educativos do autor.\n\n' +
      'Ilustracao mental: painel de instrumentos de um aviao — varios indicadores, uma altitude (saude economica) a vigilar.',
    topics: ['Ciclos de credito', 'Macro simplificado', 'Divida boa x ruim', 'Politica monetaria basica', 'Enquadramento de noticias'],
  },
  'i-20': {
    summary:
      'Biografia autorizada de Buffett: infancia, parceria com Munger, erros, disciplina e doacoes. ' +
      'Mostra o homem por tras do mito e reforca que habitos e caracter importam tanto quanto formulas.\n\n' +
      'Ilustracao mental: filme em longa duracao onde o enredo e consistencia, nao um unico truque.',
    topics: ['Historia pessoal', 'Parceria e erros', 'Carater e disciplina', 'Filantropia', 'Mito x realidade'],
  },
};

export const ENTREPRENEURSHIP_CONTENT_BY_ID: Record<string, ExtendedBookContent> = {
  'e-1': {
    summary:
      'Eric Ries propoe ciclo construir-medir-aprender com MVP para reduzir desperdicio de ideias nao validadas. ' +
      'Métricas acionáveis vencem vanity metrics. Pivotar com dados e coragem, nao com teimosia. ' +
      'A mentalidade e startup como laboratorio continuo.\n\n' +
      'Ilustracao mental: volante de bicicleta que so ajusta rota quando olhas para o chao (feedback real).',
    topics: ['MVP', 'Build-measure-learn', 'Pivot', 'Metricas acionaveis', 'Reduzir desperdicio'],
  },
  'e-2': {
    summary:
      'Thiel defende inovacao de 0 a 1: criar mercados novos em vez de copiar competicao infinita. ' +
      'Monopolios benevolentes vs competicao destrutiva; busca de segredos e timing. ' +
      'Provocador e util para questionar "por que este negocio deve existir".\n\n' +
      'Ilustracao mental: plantar uma especie nova no jardim em vez de mais uma fileira de alface igual.',
    topics: ['Monopolio x competicao', 'Segredos e tese', 'Inovacao vertical', 'Timing', 'Visao de longo prazo'],
  },
  'e-3': {
    summary:
      'Ben Horowitz fala do CEO em situacoes dificeis: demissoes, cultura em guerra, transparencia e decisoes impopulares. ' +
      'Sem romantismo; foca em lideranca sob pressao e apoio a outros fundadores.\n\n' +
      'Ilustracao mental: manual de primeiros socorros para incendios corporativos.',
    topics: ['Lideranca em crise', 'Cultura dura', 'Demissoes e etica', 'Transparencia', 'Apoio entre fundadores'],
  },
  'e-4': {
    summary:
      'Fried e Hansson defendem empresa enxuta: menos reunioes, menos planos infinitos, mais execucao e autonomia. ' +
      'Questiona dogmas de "startup sempre gigante" e celebra sustentabilidade humana no trabalho.\n\n' +
      'Ilustracao mental: oficina com poucas ferramentas mas afiadas, em vez de armazem de gadgets.',
    topics: ['Simplicidade operacional', 'Menos burocracia', 'Execucao', 'Remote e autonomia', 'Sustentabilidade'],
  },
  'e-5': {
    summary:
      'Gerber explica por que tecnicos excelentes falham como donos: falta de sistemas, papel do empreendedor e do gerente. ' +
      'O negocio precisa funcionar sem o dono no dia a dia — franquia mental. ' +
      'Processos, manuals e delegacao sao o antidoto ao burnout do "faco tudo".\n\n' +
      'Ilustracao mental: orquestra com partitura; sem partitura, so resta improviso cansativo.',
    topics: ['Tres papéis E-Myth', 'Sistemas e processos', 'Trabalhar no negocio', 'Escalabilidade', 'Delegacao'],
  },
  'e-6': {
    summary:
      'Wickman apresenta EOS: Visao, Tracao, Saude — alinhar lideranca, metricas semanais e cultura. ' +
      'Reunioes ritmadas e scorecards claros reduzem friccao em PMEs em crescimento.\n\n' +
      'Ilustracao mental: trilhos para trem: sem trilhos alinhados, cada vagao puxa para um lado.',
    topics: ['EOS', 'Scorecard', 'Reunioes ritmadas', 'Visao compartilhada', 'Cultura saudavel'],
  },
  'e-7': {
    summary:
      'Rob Fitzpatrick ensina a falar com clientes sem perguntas que so geram elogios inuteis (ex.: "achas boa a ideia?"). ' +
      'Foco em comportamento passado, pagamento e problemas reais. Essencial para discovery honesto.\n\n' +
      'Ilustracao mental: entrevista de detective, nao de fã clube.',
    topics: ['Entrevistas validas', 'Evitar compliments falsos', 'Fatos vs opinioes', 'Mom Test', 'Discovery'],
  },
  'e-8': {
    summary:
      'Knapp descreve sprint de design de 5 dias para prototipar e testar com usuarios reais. ' +
      'Reduz debates infinitos em decisao concentrada e evidencia rapida.\n\n' +
      'Ilustracao mental: maratona de cozinha de restaurante — menu fechado, prato testado no fim da semana.',
    topics: ['Design sprint', 'Prototipo rapido', 'Teste com users', 'Decisao em time', 'Cinco dias'],
  },
  'e-9': {
    summary:
      'Nir Eyal explora gatilhos, acao, recompensa variable e investimento para habitos de produto — com etica em discussao. ' +
      'Util para entender retencao e dependencia comportamental em apps e servicos.\n\n' +
      'Ilustracao mental: roda dentada que liga motor de habito ao utilizador.',
    topics: ['Hook model', 'Retencao', 'Recompensa variavel', 'Etica de produto', 'Gatilhos'],
  },
  'e-10': {
    summary:
      'Kim e Mauborgne propoem criar espacos de mercado novos em vez de sangrar competicao em oceanos vermelhos. ' +
      'Canvas de estrategia ajuda a sistematizar proposta de valor inovadora.\n\n' +
      'Ilustracao mental: deixar a briga do pier e abrir uma praia vazia com servico unico.',
    topics: ['Oceano azul', 'Canvas de estrategia', 'Inovacao de valor', 'Menos competicao direta', 'Proposta unica'],
  },
  'e-11': {
    summary:
      'Warrillow ensina a construir empresa vendavel: processos, menos dependencia do fundador, metricas que compradores valorizam. ' +
      'Mesmo sem vender cedo, o negocio fica mais saudavel.\n\n' +
      'Ilustracao mental: casa com documentacao de obras em ordem — vende mais facil e habita-se melhor.',
    topics: ['Negocio vendavel', 'Reduzir dependencia do dono', 'Processos claros', 'Metricas de comprador', 'Valor de saida'],
  },
  'e-12': {
    summary:
      'Jarvis defende crescimento intencional: lucro, autonomia e qualidade de vida em vez de escala cega. ' +
      'Ferramentas modernas permitem negocios pequenos fortes; diz "nao" a clientes errados.\n\n' +
      'Ilustracao mental: bonsai em vez de sequoia — proposito e forma, nao so altura.',
    topics: ['Crescimento intencional', 'Autonomia', 'Lucro x escala', 'Clientes certos', 'Ferramentas enxutas'],
  },
  'e-13': {
    summary:
      'Bill Aulet estrutura 24 passos disciplinados desde ideia ate mercado, com foco em evidencia e iteracao. ' +
      'Inspiracao MIT; util para programas de aceleracao e fundadores tecnicos.\n\n' +
      'Ilustracao mental: GPS com checkpoints — cada etapa valida antes de acelerar.',
    topics: ['24 passos', 'Disciplina de mercado', 'Iteracao', 'Evidencia', 'De ideia a escala'],
  },
  'e-14': {
    summary:
      'Steve Blank e Dorf descrevem desenvolvimento de clientes, hipoteses e pivots — base do lean startup aplicado a vendas B2B. ' +
      'Manual extenso para quem quer playbook operacional de discovery.\n\n' +
      'Ilustracao mental: caderno de campo cientifico para startups.',
    topics: ['Customer development', 'Hipoteses', 'Playbook B2B', 'Pivot', 'Manual operacional'],
  },
  'e-15': {
    summary:
      'Maurya conecta lean canvas a experimentos rapidos e metricas. ' +
      'Ferramentas visuais para nao perder o fio ao produto enquanto se valida mercado.\n\n' +
      'Ilustracao mental: mapa de aventura com rotas alternativas marcadas.',
    topics: ['Lean canvas', 'Experimentos', 'Métricas', 'Foco', 'Iteracao visual'],
  },
  'e-16': {
    summary:
      'John Doerr populariza OKRs: objetivos ambiciosos e resultados mensuraveis com ritmo trimestral. ' +
      'Casos de Google e outros mostram alinhamento vertical e transparencia.\n\n' +
      'Ilustracao mental: bússola (objetivo) + mapa com marcos (key results).',
    topics: ['OKRs', 'Alinhamento', 'Transparencia', 'Ambicao mensuravel', 'Ritmo trimestral'],
  },
  'e-17': {
    summary:
      'Sinek explica o circulo de ouro: por que, como, o que. Marcas fortes comunicam proposito antes de produto. ' +
      'Inspiracao e lealdade nascem de crenca compartilhada.\n\n' +
      'Ilustracao mental: nucleo magnetico que atrai quem compartilha valores.',
    topics: ['Circulo de ouro', 'Proposito', 'Lideranca inspiradora', 'Comunicacao', 'Lealdade'],
  },
  'e-18': {
    summary:
      'Jessica Livingston entrevista fundadores de empresas iconicas nos primordios da internet. ' +
      'Historias reais de duvida, sorte e persistencia — util para normalizar a jornada.\n\n' +
      'Ilustracao mental: arquivo oral de pioneiros; cada capitulo e uma trilha diferente.',
    topics: ['Historias reais', 'Primordios tech', 'Persistencia', 'Sorte e preparo', 'Aprendizado por narrativa'],
  },
  'e-19': {
    summary:
      'Ed Catmull revela cultura Pixar: candidade, feedback, falha como dados e protecao da equipa criativa. ' +
      'Lideranca que equilibra ambicao artistica e entrega comercial.\n\n' +
      'Ilustracao mental: oficina onde errar cedo e barato e acertar no ecran e o objetivo.',
    topics: ['Cultura criativa', 'Candidade', 'Feedback seguro', 'Inovacao e entrega', 'Lideranca servidora'],
  },
  'e-20': {
    summary:
      'Josh Kaufman sintetiza MBA pratico: valor, marketing, vendas, operacoes, finanças e estrategia sem anos de aula. ' +
      'Ideal para autodidatas que querem mapa mental de negocio completo.\n\n' +
      'Ilustracao mental: kit de ferramentas portatil versus oficina industrial de ensino.',
    topics: ['Mapa mental de negocio', 'Valor e precos', 'Marketing e vendas', 'Operacoes', 'Autodidatismo estruturado'],
  },
};
