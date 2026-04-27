# Calculadora de Leilão

App web para auxiliar usuários a calcular custos e viabilidade de arremates em leilões judiciais brasileiros.

**Stack:** React 18 + Vite, TailwindCSS, Supabase (auth + persistence), jsPDF.

**Estado atual (2026-04-27):** App funcional com cálculo de arremate único (entrada 25% + comissão do leiloeiro), histórico no Supabase, exportação PDF e WhatsApp, perfil/configurações por usuário. Calculadora opera no modelo "valor de arremate já decidido → custo".

**Lacuna identificada:** Usuários reais (referência: planilha "Calculadora De Viabilidade" usada por leiloeiros) precisam decidir o lance ANTES de arrematar, partindo do valor de avaliação do bem e simulando múltiplos cenários de desconto. O app atual não suporta esse fluxo de decisão pré-lance, e ignora "carta de fiança" — componente real do custo inicial em muitos editais.

**Direção do milestone atual:** Aproximar o app do fluxo real de decisão de leiloeiros profissionais, em 3 fases incrementais.
