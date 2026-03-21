import { ENTREPRENEURSHIP_CONTENT_BY_ID, INVESTMENTS_CONTENT_BY_ID } from './academyExtendedContent';

export type AcademyBookCategory = 'finance' | 'investments' | 'entrepreneurship';
export type AcademyBookLevel = 'Beginner' | 'Intermediate' | 'Advanced';
export type AcademyBookLanguage = 'EN' | 'PT';

export type AcademyBook = {
  id: string;
  title: string;
  titleEn?: string;
  author: string;
  level: AcademyBookLevel;
  category: AcademyBookCategory;
  language: AcademyBookLanguage;
  durationHours: number;
  rating: number;
  popularity: number;
  summary: string;
  topics: string[];
  /** HTTPS URL do resumo em áudio (ex.: Supabase Storage). Se vazio, o player não é mostrado. */
  summaryAudioUrl?: string | null;
};

type Seed = { title: string; titleEn: string; author: string };
type BookContent = { summary: string; topics: string[] };

const FINANCE_SEED: Seed[] = [
  { title: 'A Psicologia do Dinheiro', titleEn: 'The Psychology of Money', author: 'Morgan Housel' },
  { title: 'Seu Dinheiro ou Sua Vida', titleEn: 'Your Money or Your Life', author: 'Vicki Robin' },
  { title: 'Pai Rico, Pai Pobre', titleEn: 'Rich Dad Poor Dad', author: 'Robert Kiyosaki' },
  { title: 'Eu Vou Ensinar Você a Ficar Rico', titleEn: 'I Will Teach You to Be Rich', author: 'Ramit Sethi' },
  { title: 'O Homem Mais Rico da Babilônia', titleEn: 'The Richest Man in Babylon', author: 'George S. Clason' },
  { title: 'O Milionário Mora ao Lado', titleEn: 'The Millionaire Next Door', author: 'Thomas J. Stanley' },
  { title: 'Liberdade Financeira', titleEn: 'Financial Freedom', author: 'Grant Sabatier' },
  { title: 'A Transformação Total do Dinheiro', titleEn: 'The Total Money Makeover', author: 'Dave Ramsey' },
  { title: 'Morra com Zero', titleEn: 'Die With Zero', author: 'Bill Perkins' },
  { title: 'O Caminho Simples para a Riqueza', titleEn: 'The Simple Path to Wealth', author: 'JL Collins' },
  { title: 'Fique Bem com o Dinheiro', titleEn: 'Get Good with Money', author: 'Tiffany Aliche' },
  { title: 'O Cartão-Índice', titleEn: 'The Index Card', author: 'Helaine Olen' },
  { title: 'Mulheres Inteligentes Ficam Ricas', titleEn: 'Smart Women Finish Rich', author: 'David Bach' },
  { title: 'O Plano Financeiro de Uma Página', titleEn: 'The One-Page Financial Plan', author: 'Carl Richards' },
  { title: 'Millennial Quebrado', titleEn: 'Broke Millennial', author: 'Erin Lowry' },
  { title: 'Dinheiro: Domine o Jogo', titleEn: 'Money Master the Game', author: 'Tony Robbins' },
  { title: 'A Lacuna do Comportamento', titleEn: 'The Behavior Gap', author: 'Carl Richards' },
  { title: 'Guia de Dinheiro por um Passeio Aleatório', titleEn: 'A Random Walk Guide to Money', author: 'Burton Malkiel' },
  { title: 'Finanças para Mulheres Inteligentes', titleEn: 'Clever Girl Finance', author: 'Bola Sokunbi' },
  { title: 'O Fator Latte', titleEn: 'The Latte Factor', author: 'David Bach' },
];

const INVESTMENTS_SEED: Seed[] = [
  { title: 'O Investidor Inteligente', titleEn: 'The Intelligent Investor', author: 'Benjamin Graham' },
  { title: 'Ações Comuns, Lucros Extraordinários', titleEn: 'Common Stocks and Uncommon Profits', author: 'Philip Fisher' },
  { title: 'Um Passo à Frente de Wall Street', titleEn: 'One Up On Wall Street', author: 'Peter Lynch' },
  { title: 'Análise de Investimentos', titleEn: 'Security Analysis', author: 'Benjamin Graham' },
  { title: 'O Pequeno Livro do Investimento de Bom Senso', titleEn: 'The Little Book of Common Sense Investing', author: 'John C. Bogle' },
  { title: 'Um Passeio Aleatório por Wall Street', titleEn: 'A Random Walk Down Wall Street', author: 'Burton Malkiel' },
  { title: 'Ações para o Longo Prazo', titleEn: 'Stocks for the Long Run', author: 'Jeremy Siegel' },
  { title: 'O Investidor Dhandho', titleEn: 'The Dhandho Investor', author: 'Mohnish Pabrai' },
  { title: 'Vencendo Wall Street', titleEn: 'Beating the Street', author: 'Peter Lynch' },
  { title: 'A Coisa Mais Importante', titleEn: 'The Most Important Thing', author: 'Howard Marks' },
  { title: 'O Jeito Warren Buffett de Investir', titleEn: 'The Warren Buffett Way', author: 'Robert Hagstrom' },
  { title: 'Os Ensaios de Warren Buffett', titleEn: 'The Essays of Warren Buffett', author: 'Warren Buffett' },
  { title: 'Margem de Segurança', titleEn: 'Margin of Safety', author: 'Seth Klarman' },
  { title: 'Dominando o Ciclo de Mercado', titleEn: 'Mastering the Market Cycle', author: 'Howard Marks' },
  { title: 'O Livro do Investimento em Imóveis para Aluguel', titleEn: 'The Book on Rental Property Investing', author: 'Brandon Turner' },
  { title: 'Investido', titleEn: 'Invested', author: 'Danielle Town' },
  { title: 'As Alegrias dos Juros Compostos', titleEn: 'The Joys of Compounding', author: 'Gautam Baid' },
  { title: 'Contra os Deuses', titleEn: 'Against the Gods', author: 'Peter L. Bernstein' },
  { title: 'Princípios para Lidar com Mudanças', titleEn: 'Principles for Dealing with Change', author: 'Ray Dalio' },
  { title: 'A Bola de Neve', titleEn: 'The Snowball', author: 'Alice Schroeder' },
];

const ENTREPRENEURSHIP_SEED: Seed[] = [
  { title: 'A Startup Enxuta', titleEn: 'The Lean Startup', author: 'Eric Ries' },
  { title: 'De Zero a Um', titleEn: 'Zero to One', author: 'Peter Thiel' },
  { title: 'A Coisa Difícil sobre Coisas Difíceis', titleEn: 'The Hard Thing About Hard Things', author: 'Ben Horowitz' },
  { title: 'Rework', titleEn: 'Rework', author: 'Jason Fried' },
  { title: 'O Mito do Empreendedor Revisitado', titleEn: 'The E-Myth Revisited', author: 'Michael Gerber' },
  { title: 'Tração', titleEn: 'Traction', author: 'Gino Wickman' },
  { title: 'O Teste da Mãe', titleEn: 'The Mom Test', author: 'Rob Fitzpatrick' },
  { title: 'Sprint', titleEn: 'Sprint', author: 'Jake Knapp' },
  { title: 'Hooked', titleEn: 'Hooked', author: 'Nir Eyal' },
  { title: 'A Estratégia do Oceano Azul', titleEn: 'Blue Ocean Strategy', author: 'W. Chan Kim' },
  { title: 'Construído para Vender', titleEn: 'Built to Sell', author: 'John Warrillow' },
  { title: 'Empresa de Uma Pessoa', titleEn: 'Company of One', author: 'Paul Jarvis' },
  { title: 'Empreendedorismo Disciplinado', titleEn: 'Disciplined Entrepreneurship', author: 'Bill Aulet' },
  { title: 'Manual do Dono de Startup', titleEn: 'The Startup Owner’s Manual', author: 'Steve Blank' },
  { title: 'Rodando Lean', titleEn: 'Running Lean', author: 'Ash Maurya' },
  { title: 'Meça o Que Importa', titleEn: 'Measure What Matters', author: 'John Doerr' },
  { title: 'Comece pelo Porquê', titleEn: 'Start with Why', author: 'Simon Sinek' },
  { title: 'Fundadores em Ação', titleEn: 'Founders at Work', author: 'Jessica Livingston' },
  { title: 'Criatividade S.A.', titleEn: 'Creativity, Inc.', author: 'Ed Catmull' },
  { title: 'O MBA Pessoal', titleEn: 'The Personal MBA', author: 'Josh Kaufman' },
];

const FINANCE_CONTENT_BY_ID: Record<string, BookContent> = {
  'f-1': {
    summary:
      'Este livro mostra que o sucesso financeiro depende menos de planilhas perfeitas e mais de como voce se comporta nos momentos de euforia e de medo. ' +
      'Morgan Housel usa historias reais para explicar por que duas pessoas com a mesma renda podem construir resultados totalmente diferentes: uma foca em status e consumo imediato; outra prioriza margem de seguranca, paciencia e consistencia.\n\n' +
      'Um ponto central e que dinheiro nao serve apenas para "ter mais". Ele serve para comprar tempo, tranquilidade e poder de escolha. ' +
      'Quando voce entende isso, para de correr atras de atalhos e passa a construir um plano que consegue sustentar por anos. ' +
      'No livro, fica claro que evitar grandes erros costuma ser mais importante do que buscar o investimento "perfeito".\n\n' +
      'Na pratica, o autor reforca tres habitos simples: gastar menos do que ganha com regularidade, manter reserva para imprevistos e investir por longos periodos sem interromper a estrategia a cada noticia do mercado. ' +
      'Com isso, os juros compostos trabalham a seu favor de forma silenciosa e poderosa.\n\n' +
      'Ilustracao mental: imagine uma arvore. A rentabilidade e o tronco visivel, mas o comportamento financeiro e a raiz. ' +
      'Se a raiz e fraca, qualquer crise derruba a estrutura. Se a raiz e profunda, o crescimento continua mesmo durante tempestades.\n\n' +
      'Resumo didatico: "A psicologia do dinheiro" ensina que enriquecer nao e sobre prever tudo, e sim sobre criar um sistema financeiro pessoal robusto, simples e repetivel.',
    topics: ['Comportamento > conhecimento tecnico', 'Juros compostos precisam de tempo', 'Margem de seguranca na vida financeira', 'Risco real x risco percebido', 'Liberdade financeira e opcionalidade'],
  },
  'f-2': {
    summary:
      'A obra propoe uma pergunta direta: sua vida esta alinhada com a forma como voce ganha e gasta dinheiro? ' +
      'Os autores mostram que independencia financeira nao nasce de salario alto, mas de consciencia sobre o custo real de cada escolha.\n\n' +
      'O metodo principal e converter tudo em "horas de vida". Em vez de perguntar "quanto custa?", voce pergunta "quantas horas de trabalho isso representa?". ' +
      'Essa mudanca de lente reduz compras por impulso e melhora a qualidade das decisoes financeiras.\n\n' +
      'O livro tambem defende registrar gastos, revisar categorias e identificar desperdicios invisiveis. ' +
      'Com dados reais, fica mais facil montar um plano de reducao de despesas sem sacrificar o que importa para voce.\n\n' +
      'Ilustracao mental: seu dinheiro e um rio. Se voce nao mede o fluxo, ele escapa em pequenos vazamentos. Ao mapear entradas e saidas, voce construi canais para levar esse rio ate seus objetivos.',
    topics: ['Dinheiro como energia de vida', 'Consumo consciente', 'Mapa de gastos mensais', 'Independencia financeira progressiva', 'Alinhamento entre valores e dinheiro'],
  },
  'f-3': {
    summary:
      'Apesar de controverso em alguns pontos, o livro e util para iniciantes por separar dois conceitos: ativos e passivos. ' +
      'A ideia-chave e simples: ativos colocam dinheiro no seu bolso; passivos tiram.\n\n' +
      'Kiyosaki reforca educacao financeira como habilidade pratica, nao apenas teoria escolar. ' +
      'Ele incentiva desenvolver mentalidade empreendedora, pensamento de longo prazo e autonomia na tomada de decisoes.\n\n' +
      'No uso didatico, vale focar em tres aprendizados: construir fontes de renda, evitar inflacao de estilo de vida e aprender continuamente sobre dinheiro. ' +
      'Com esse tripé, o crescimento financeiro tende a ser mais consistente.\n\n' +
      'Ilustracao mental: pense em dois baldes. Um recebe salario, o outro recebe rendas de ativos. O objetivo e aumentar o segundo balde ate que ele sustente seu padrao de vida.',
    topics: ['Ativos x passivos', 'Educacao financeira continua', 'Mentalidade de longo prazo', 'Renda recorrente', 'Inflacao de estilo de vida'],
  },
  'f-4': {
    summary:
      'Ramit Sethi combina automacao com psicologia para simplificar a vida financeira. ' +
      'O foco nao e cortar tudo, mas gastar com intencao no que gera valor e eliminar o que nao importa.\n\n' +
      'O autor propoe "sistemas automaticos": contas separadas, transferencias programadas e metas claras para investir sem depender de motivacao diaria. ' +
      'Com isso, voce reduz friccao e evita procrastinacao financeira.\n\n' +
      'O livro tambem aborda negociacao de tarifas, uso inteligente de credito e planejamento de grandes objetivos. ' +
      'A abordagem e pragmatica: pequenas melhorias recorrentes geram impacto grande ao longo do tempo.\n\n' +
      'Ilustracao mental: seu financeiro como piloto automatico. Voce define rota e parametros uma vez; depois, faz apenas correcoes periodicas em vez de pilotar no caos.',
    topics: ['Automacao financeira', 'Gastos conscientes', 'Planejamento por prioridades', 'Uso inteligente de credito', 'Sistemas simples e repetiveis'],
  },
  'f-5': {
    summary:
      'Em formato de fabulas, o livro apresenta principios atemporais de riqueza: poupar primeiro, controlar gastos e fazer o dinheiro trabalhar para voce. ' +
      'A linguagem simples facilita a aplicacao imediata.\n\n' +
      'O ensino central "pague-se primeiro" significa reservar parte da renda antes de gastar. ' +
      'Esse habito muda a estrutura financeira no longo prazo porque transforma poupanca em compromisso fixo.\n\n' +
      'Outro ponto forte e buscar orientacao de quem tem experiencia real, evitando atalhos e especulacao sem base. ' +
      'Com disciplina e paciência, o progresso torna-se previsivel.\n\n' +
      'Ilustracao mental: imagine que seu dinheiro e um exercito. Se voce manda tudo para o consumo, nao sobra tropa para conquistar novos territorios financeiros.',
    topics: ['Pague-se primeiro', 'Disciplina financeira', 'Aprender com especialistas', 'Evitar atalhos perigosos', 'Construir patrimonio gradualmente'],
  },
  'f-6': {
    summary:
      'Este livro analisa habitos de pessoas que acumularam patrimonio de forma consistente, muitas vezes sem ostentacao. ' +
      'A principal mensagem: riqueza real e o que voce nao gastou.\n\n' +
      'Os autores mostram que muitas familias ricas vivem abaixo do que poderiam consumir, priorizando liberdade futura. ' +
      'Em contraste, alta renda sem controle costuma gerar fragilidade financeira.\n\n' +
      'Didaticamente, a obra ajuda a separar aparencia de solidez: carro caro e casa luxuosa nao garantem patrimonio. ' +
      'O que conta e taxa de poupanca, investimentos e baixa dependencia de dividas de consumo.\n\n' +
      'Ilustracao mental: duas casas vizinhas. Uma brilhante por fora e endividada por dentro; outra discreta por fora e forte no caixa. O livro ensina a construir a segunda.',
    topics: ['Riqueza invisivel', 'Vida abaixo dos meios', 'Patrimonio x status', 'Taxa de poupanca', 'Consumo estrategico'],
  },
  'f-7': {
    summary:
      'Grant Sabatier descreve um caminho acelerado para independencia financeira, focando em aumento de renda, controle de gastos e investimento agressivo no inicio da jornada. ' +
      'A abordagem e energica, voltada para execucao.\n\n' +
      'O autor mostra que a velocidade de acumulacao depende de duas alavancas: quanto voce ganha e quanto consegue investir. ' +
      'Trabalhar apenas o corte de despesas tem limite; crescer renda amplia o potencial.\n\n' +
      'O livro inclui estrategias de carreira, projetos paralelos e organizacao da rotina para manter consistencia. ' +
      'O objetivo nao e trabalhar para sempre, mas ganhar opcao de escolher como usar seu tempo.\n\n' +
      'Ilustracao mental: independência como uma escada rolante. Quanto maior o aporte e a taxa de crescimento, mais rapido voce sobe sem depender apenas de sorte.',
    topics: ['Independencia financeira acelerada', 'Aumento de renda', 'Aporte elevado no inicio', 'Projetos paralelos', 'Tempo como ativo'],
  },
  'f-8': {
    summary:
      'Com linguagem direta, Dave Ramsey apresenta um plano de recuperacao e construcao financeira para quem quer sair do ciclo de dividas. ' +
      'A estrutura em etapas facilita implementar sem confusao.\n\n' +
      'A prioridade inicial e criar colchao de emergencia e eliminar dividas de consumo com foco e intensidade. ' +
      'Ao reduzir juros e ansiedade, a pessoa ganha folego para investir melhor.\n\n' +
      'O livro valoriza comportamento, rotina e compromisso familiar no processo. ' +
      'Mais do que tecnica, trata de disciplina coletiva e clareza de objetivos.\n\n' +
      'Ilustracao mental: sua vida financeira como uma casa em reforma. Primeiro voce estanca infiltracoes (dividas), depois reforca estrutura (reserva), e so entao decora (objetivos avancados).',
    topics: ['Plano em etapas', 'Quitacao de dividas', 'Reserva de emergencia', 'Disciplina familiar', 'Reconstrucao financeira'],
  },
  'f-9': {
    summary:
      'Bill Perkins traz uma perspectiva diferente: acumular patrimonio sem viver experiencias importantes pode gerar arrependimentos no futuro. ' +
      'A proposta e equilibrar seguranca financeira com qualidade de vida ao longo das fases da vida.\n\n' +
      'O conceito de "picos de experiencia" sugere investir dinheiro em momentos certos, quando voce pode aproveitar melhor certas atividades. ' +
      'Isso nao significa irresponsabilidade, mas planejamento com intencao.\n\n' +
      'Didaticamente, o livro ajuda a pensar em horizonte de vida, energia e prioridades, evitando extremos de consumo impulsivo ou poupanca sem sentido. ' +
      'A chave e usar dinheiro para maximizar bem-estar total, nao apenas saldo final.\n\n' +
      'Ilustracao mental: seu capital e um combustivel limitado para a viagem da vida. O objetivo nao e chegar com tanque cheio, mas fazer o melhor roteiro.',
    topics: ['Equilibrio entre poupar e viver', 'Planejamento por fases da vida', 'Experiencias com intencao', 'Risco de arrependimento', 'Uso inteligente do patrimonio'],
  },
  'f-10': {
    summary:
      'JL Collins defende simplicidade extrema para acumular riqueza: viver abaixo da renda, evitar complexidade desnecessaria e investir de forma consistente no longo prazo. ' +
      'A obra e especialmente forte para quem busca clareza.\n\n' +
      'O livro combate ruido financeiro, promessas de enriquecimento rapido e excesso de produtos. ' +
      'A principal vantagem da simplicidade e reduzir erros comportamentais e custos invisiveis.\n\n' +
      'Com foco em disciplina e horizonte longo, o metodo torna-se facil de manter, mesmo em periodos de volatilidade. ' +
      'A consistencia vira o diferencial competitivo do investidor comum.\n\n' +
      'Ilustracao mental: em vez de montar uma maquina complexa com muitas pecas, voce usa uma alavanca forte e confiavel repetidamente por anos.',
    topics: ['Simplicidade financeira', 'Longo prazo', 'Consistencia de aportes', 'Reducao de custos e ruido', 'Resistencia emocional'],
  },
  'f-11': {
    summary:
      'Tiffany Aliche apresenta um guia prático para organizar as finanças pessoais com linguagem acessivel e foco em autonomia. ' +
      'A obra ajuda especialmente quem quer estruturar base financeira do zero.\n\n' +
      'Ela aborda orcamento realista, fundo de emergencia, protecao financeira e metas por etapas. ' +
      'O diferencial e transformar temas complexos em planos executaveis no cotidiano.\n\n' +
      'Didaticamente, o livro incentiva registrar progresso, celebrar marcos e ajustar rota sem culpa. ' +
      'A constancia importa mais do que perfeicao.\n\n' +
      'Ilustracao mental: pense em um painel de controle com poucos indicadores-chave. Ao acompanhar os numeros certos, voce dirige melhor sua vida financeira.',
    topics: ['Base financeira do zero', 'Orcamento pratico', 'Fundo de emergencia', 'Protecao e estabilidade', 'Plano executavel'],
  },
  'f-12': {
    summary:
      'O livro resume em poucos principios o que realmente move bons resultados financeiros no longo prazo. ' +
      'A proposta e reduzir a confusao e focar no essencial.\n\n' +
      'Com regras claras e simples, a obra ajuda a construir rotina de poupanca, investimento e controle de risco sem dependencia de previsoes. ' +
      'Isso aumenta aderencia e reduz ansiedade.\n\n' +
      'A mensagem pedagogica e poderosa: voce nao precisa saber tudo para comecar; precisa de um sistema basico e disciplina para manter esse sistema. ' +
      'A complexidade pode vir depois, se necessario.\n\n' +
      'Ilustracao mental: um cartao pequeno com poucas regras valiosas pode orientar melhor do que um manual enorme que ninguem segue.',
    topics: ['Regras essenciais', 'Simplicidade operacional', 'Controle de risco', 'Disciplina pratica', 'Menos ruído, mais execucao'],
  },
  'f-13': {
    summary:
      'David Bach direciona o livro para a realidade feminina, abordando independencia, planejamento e seguranca financeira de forma objetiva. ' +
      'A obra incentiva protagonismo e decisao informada.\n\n' +
      'Temas como aposentadoria, protecao familiar e organizacao de metas aparecem de forma aplicada, com foco em acoes concretas. ' +
      'A mensagem central e nao terceirizar sua vida financeira.\n\n' +
      'No aspecto didatico, o livro reforca que pequenas decisoes repetidas ao longo dos anos criam grande impacto patrimonial. ' +
      'A consistencia supera grandes movimentos esporadicos.\n\n' +
      'Ilustracao mental: cada decisao financeira e um voto no futuro que voce quer construir. Ao votar bem repetidamente, o resultado aparece.',
    topics: ['Protagonismo financeiro', 'Planejamento de longo prazo', 'Aposentadoria e seguranca', 'Habitos consistentes', 'Autonomia nas decisoes'],
  },
  'f-14': {
    summary:
      'Carl Richards defende que um bom plano financeiro pode caber em uma pagina, desde que seja claro, realista e alinhado com seus valores. ' +
      'A simplicidade aqui e estrategica.\n\n' +
      'O autor mostra que planos complexos falham porque nao sao executados. ' +
      'Quando voce reduz para objetivos, prioridades e regras basicas, aumenta muito a chance de manter o plano em qualquer cenario.\n\n' +
      'A obra e valiosa para quem quer transformar metas vagas em acao concreta, com checkpoints periodicos e ajustes conscientes. ' +
      'Planejar vira um processo vivo, nao um documento esquecido.\n\n' +
      'Ilustracao mental: um mapa simples e legivel leva voce mais longe do que um atlas detalhado que nunca sai da gaveta.',
    topics: ['Planejamento simples', 'Alinhamento com valores', 'Execucao acima da complexidade', 'Revisao periodica', 'Clareza de prioridades'],
  },
  'f-15': {
    summary:
      'Erin Lowry aborda dores comuns de jovens adultos: dividas, falta de organizacao e inseguranca com o futuro. ' +
      'O tom pratico e direto ajuda a tirar culpa e entrar em modo de acao.\n\n' +
      'O livro cobre credito, negociacao de contas, fundo de emergencia e comeco dos investimentos de forma objetiva. ' +
      'A ideia e construir base robusta antes de buscar estrategias avancadas.\n\n' +
      'Didaticamente, e forte por traduzir linguagem financeira para o dia a dia, com exemplos concretos de escolhas melhores. ' +
      'Pequenos ajustes de comportamento geram grande alivio financeiro em meses.\n\n' +
      'Ilustracao mental: organizar as financas como arrumar um quarto baguncado: voce nao resolve tudo em 1 hora, mas cada area arrumada muda o ambiente inteiro.',
    topics: ['Financas para iniciantes', 'Saida do ciclo de dividas', 'Credito consciente', 'Organizacao do dia a dia', 'Base para investir'],
  },
  'f-16': {
    summary:
      'Tony Robbins compila principios de planejamento financeiro e investimento com foco em visao de longo prazo. ' +
      'A leitura mistura motivacao com estrategias para estruturar patrimonio.\n\n' +
      'Um ponto relevante e a importancia de custos, taxas e disciplina no retorno final. ' +
      'Muitos investidores perdem performance nao por escolha ruim de ativo, mas por estrutura cara e desorganizada.\n\n' +
      'O livro tambem incentiva planejamento por objetivos de vida, protegendo downside e mantendo consistencia de aportes. ' +
      'A abordagem e construir um jogo sustentavel, nao apostar em tacadas isoladas.\n\n' +
      'Ilustracao mental: seu plano financeiro como maratona com hidratação e ritmo certo; quem dispara sem estrategia dificilmente completa bem.',
    topics: ['Visao de longo prazo', 'Custos e taxas importam', 'Protecao de downside', 'Planejamento por objetivos', 'Consistencia de aportes'],
  },
  'f-17': {
    summary:
      'Carl Richards explica por que o maior inimigo do investidor costuma ser seu proprio comportamento. ' +
      'A lacuna entre retorno do mercado e retorno do investidor nasce de decisoes emocionais fora de hora.\n\n' +
      'O livro mostra como medo e ganancia levam a comprar caro e vender barato, corroendo resultados. ' +
      'Para combater isso, ele propoe regras simples e rotina previsivel.\n\n' +
      'Didaticamente, a obra reforca que "ficar no plano" e uma habilidade treinavel. ' +
      'Quanto menor o numero de decisoes impulsivas, maior a chance de capturar o retorno que a estrategia promete.\n\n' +
      'Ilustracao mental: ter um plano de voo evita que voce tente pilotar no reflexo durante turbulencias.',
    topics: ['Comportamento do investidor', 'Disciplina emocional', 'Aderencia ao plano', 'Evitar timing impulsivo', 'Retorno real x teorico'],
  },
  'f-18': {
    summary:
      'Burton Malkiel traduz conceitos de investimento para o publico geral com foco em diversificacao e racionalidade. ' +
      'A mensagem central e evitar excesso de confianca em previsoes.\n\n' +
      'O livro mostra por que mercados sao dificeis de bater de forma consistente e como a simplicidade pode proteger o investidor comum. ' +
      'Diversificar e reduzir custos aparecem como pilares recorrentes.\n\n' +
      'Como material didatico, ajuda a entender risco, retorno e horizonte temporal sem jargao excessivo. ' +
      'Isso permite montar estrategia coerente com perfil e objetivos.\n\n' +
      'Ilustracao mental: em vez de tentar adivinhar a proxima onda, voce aprende a navegar em mar aberto com barco equilibrado.',
    topics: ['Diversificacao', 'Racionalidade de mercado', 'Reducao de custos', 'Risco x retorno', 'Estrategia de longo prazo'],
  },
  'f-19': {
    summary:
      'Bola Sokunbi oferece um guia pratico para mulheres fortalecerem controle financeiro e acelerarem autonomia. ' +
      'A obra cobre organizacao, poupanca, quitacao de dividas e investimento com linguagem clara.\n\n' +
      'O diferencial e combinar educacao financeira com empoderamento: entender dinheiro para tomar decisoes sem dependencia de terceiros. ' +
      'A perspectiva e muito util para quem quer sair da inercia.\n\n' +
      'Didaticamente, o livro incentiva criar metas mensuraveis e processos simples para acompanha-las. ' +
      'Com visibilidade do progresso, a motivacao aumenta e o plano fica sustentavel.\n\n' +
      'Ilustracao mental: construir liberdade financeira como montar um mosaico: cada pequena peca (habito) parece simples, mas juntas formam uma estrutura forte.',
    topics: ['Empoderamento financeiro', 'Planejamento pratico', 'Quitacao de dividas', 'Metas mensuraveis', 'Autonomia e confianca'],
  },
  'f-20': {
    summary:
      'David Bach usa o conceito do "latte factor" para mostrar como pequenos gastos recorrentes podem atrasar grandes objetivos quando passam despercebidos. ' +
      'A proposta nao e cortar prazer, mas tornar escolhas conscientes.\n\n' +
      'O livro destaca que automatizar poupanca e investimento transforma pequenas economias em resultado relevante no tempo. ' +
      'A regularidade e mais poderosa do que tentativas heroicas ocasionais.\n\n' +
      'Como abordagem didatica, ajuda a ligar decisoes diarias ao futuro patrimonial, criando disciplina sem sofrimento extremo. ' +
      'Voce decide o que manter e o que reduzir com base em prioridades reais.\n\n' +
      'Ilustracao mental: pense em gotas caindo diariamente em um reservatorio. Sozinhas parecem pouco, mas no fim do ano o nivel muda completamente.',
    topics: ['Pequenos gastos recorrentes', 'Consumo consciente', 'Automacao de poupanca', 'Prioridades financeiras', 'Efeito acumulado no longo prazo'],
  },
};

/**
 * MP3s HTTPS públicos só para testar o player sem Supabase (2 livros).
 * Quando EXPO_PUBLIC_ACADEMY_AUDIO_BASE_URL estiver definida, todos os livros usam o Storage e isto é ignorado.
 */
const PREVIEW_SUMMARY_AUDIO_BY_ID: Record<string, string> = {
  'f-1': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  'i-1': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
};

/** Base URL pública até à pasta dos MP3 (ex. .../academy-audio/summaries). Cada livro usa `{id}.mp3`. Ver docs/academy-audio.md */
function resolveSummaryAudioUrl(bookId: string): string | undefined {
  const raw = process.env.EXPO_PUBLIC_ACADEMY_AUDIO_BASE_URL?.trim();
  if (raw) {
    const base = raw.replace(/\/+$/, '');
    return `${base}/${bookId}.mp3`;
  }
  return PREVIEW_SUMMARY_AUDIO_BY_ID[bookId];
}

function buildBooks(category: AcademyBookCategory, prefix: 'f' | 'i' | 'e', list: Seed[]): AcademyBook[] {
  return list.map((item, idx) => {
    const i = idx + 1;
    const level: AcademyBookLevel = i % 3 === 0 ? 'Advanced' : i % 2 === 0 ? 'Intermediate' : 'Beginner';
    const language: AcademyBookLanguage = i % 4 === 0 ? 'PT' : 'EN';
    const book: AcademyBook = {
      id: `${prefix}-${i}`,
      title: item.title,
      titleEn: item.titleEn,
      author: item.author,
      level,
      category,
      language,
      durationHours: 5 + (i % 8),
      rating: Number((4.0 + (i % 10) * 0.09).toFixed(1)),
      popularity: 70 + (i % 30),
      summary: '',
      topics: [],
    };
    if (category === 'finance') {
      const content = FINANCE_CONTENT_BY_ID[book.id];
      if (content) {
        book.summary = content.summary;
        book.topics = content.topics;
      }
    }
    if (category === 'investments') {
      const content = INVESTMENTS_CONTENT_BY_ID[book.id];
      if (content) {
        book.summary = content.summary;
        book.topics = content.topics;
      }
    }
    if (category === 'entrepreneurship') {
      const content = ENTREPRENEURSHIP_CONTENT_BY_ID[book.id];
      if (content) {
        book.summary = content.summary;
        book.topics = content.topics;
      }
    }
    const audioUrl = resolveSummaryAudioUrl(book.id);
    if (audioUrl) book.summaryAudioUrl = audioUrl;
    return book;
  });
}

export const ACADEMY_BOOKS: AcademyBook[] = [
  ...buildBooks('finance', 'f', FINANCE_SEED),
  ...buildBooks('investments', 'i', INVESTMENTS_SEED),
  ...buildBooks('entrepreneurship', 'e', ENTREPRENEURSHIP_SEED),
];

export function getBooksByCategory(category: AcademyBookCategory): AcademyBook[] {
  return ACADEMY_BOOKS.filter((book) => book.category === category);
}

export function getBookById(bookId: string): AcademyBook | undefined {
  return ACADEMY_BOOKS.find((book) => book.id === bookId);
}

export function getReadableBookSummary(book: AcademyBook): string {
  const base = (book.summary || '').trim();
  if (!base) return '';

  const topicHighlights = (book.topics || []).slice(0, 5);
  const practicalLines = topicHighlights.length > 0
    ? topicHighlights.map((topic) => `- ${topic}`).join('\n')
    : '- Organizar prioridades\n- Definir metas claras\n- Executar com consistencia\n- Medir progresso\n- Ajustar estrategia';

  const categoryGuideTitle =
    book.category === 'finance'
      ? 'Como aplicar no dia a dia (guia prático)'
      : book.category === 'investments'
        ? 'Como aplicar na sua estrategia de investimento (guia prático)'
        : 'Como aplicar na construcao do seu projeto/negocio (guia prático)';

  const categoryPlan =
    book.category === 'finance'
      ? 'Semana 1: organize orçamento e corte vazamentos evidentes.\nSemana 2: defina meta principal e valor de aporte mensal.\nSemana 3: automatize investimentos e padronize rotina financeira.\nSemana 4: revise resultados, ajuste o plano e mantenha a disciplina.'
      : book.category === 'investments'
        ? 'Semana 1: revise perfil de risco, horizonte e objetivos.\nSemana 2: monte alocacao base e regras de aporte.\nSemana 3: execute aportes e registre tese por ativo.\nSemana 4: avalie resultados por processo (nao por emoção) e refine a carteira.'
        : 'Semana 1: valide problema real e perfil do publico.\nSemana 2: ajuste proposta de valor e oferta inicial.\nSemana 3: execute testes de aquisição e feedback de clientes.\nSemana 4: revise métricas, corte fricções e priorize proximo ciclo.';

  const categorySteps =
    book.category === 'finance'
      ? '1) Diagnóstico financeiro: durante 30 dias, mapeie para onde o dinheiro está indo e classifique gastos em essenciais, importantes e dispensáveis.\n2) Estrutura de proteção: monte ou reforce sua reserva de emergência para evitar que imprevistos virem dívida cara.\n3) Plano de execução: transforme objetivos em números e prazos (quanto, em quanto tempo e qual aporte mensal).\n4) Sistema automático: programe transferências para investimento no dia seguinte ao recebimento da renda.\n5) Revisão mensal: ajuste rota sem culpa, mantendo foco em consistência e não em perfeição.'
      : book.category === 'investments'
        ? '1) Diagnóstico da carteira: defina objetivo, prazo e tolerância a risco para saber o papel de cada ativo.\n2) Tese por decisão: antes de investir, escreva em 2-3 linhas por que entrou e qual condição invalida a tese.\n3) Regras de execução: padronize aportes, limites de concentração e critérios de rebalanceamento.\n4) Gestão emocional: diferencie volatilidade normal de mudança estrutural do ativo.\n5) Revisão periódica: compare resultado com sua estratégia e ajuste processo, não por impulso.'
        : '1) Diagnóstico de problema: identifique dor real do cliente e contexto onde ela aparece.\n2) Proposta de valor: descreva solução, benefício principal e diferencial percebido.\n3) Teste rápido: valide oferta mínima com feedback direto de usuários reais.\n4) Operação enxuta: priorize métricas de tração, retenção e receita, evitando dispersão.\n5) Ciclo de melhoria: aprenda com dados, refine proposta e escale apenas o que funciona.';

  const categoryErrors =
    book.category === 'finance'
      ? '- Tentar enriquecer rápido sem gestão de risco.\n- Aumentar padrão de vida toda vez que a renda sobe.\n- Investir sem reserva e precisar resgatar em mau momento.\n- Mudar de estratégia a cada notícia do mercado.\n- Não medir progresso, operando no “achismo”.'
      : book.category === 'investments'
        ? '- Entrar em ativos sem tese clara.\n- Concentrar demais sem diversificacao consciente.\n- Trocar de estrategia por volatilidade de curto prazo.\n- Ignorar custo, taxa e imposto no retorno real.\n- Confundir sorte momentanea com habilidade.'
        : '- Construir produto sem validar problema real.\n- Escalar antes de ter oferta minimamente ajustada.\n- Medir vaidade em vez de indicadores de tração.\n- Centralizar decisões e travar execução.\n- Mudar foco toda semana sem aprendizado acumulado.';

  const expanded =
    `${base}\n\n` +
    `${categoryGuideTitle}:\n` +
    `${categorySteps}\n\n` +
    `Pontos-chave deste livro para colocar em prática agora:\n` +
    `${practicalLines}\n\n` +
    `Erros comuns que este livro ajuda a evitar:\n` +
    `${categoryErrors}\n\n` +
    `Plano de 30 dias (versão simples):\n` +
    `${categoryPlan}\n\n` +
    `Resumo final: o aprendizado central de "${book.title}" é construir um sistema financeiro que funcione mesmo nos dias difíceis. ` +
    `Comportamento consistente, gestão de risco e visão de longo prazo tendem a produzir resultados superiores ao longo dos anos.`;

  return expanded;
}
