

# Integração Progressiva com Cypress — Plano

## Visão Geral

Implementar integração com Cypress em 3 fases: exportação ZIP organizada, API REST para sync de cenários, e recebimento de resultados de execução.

---

## Fase 1 — Exportação ZIP Organizada

**O que**: Substituir o download de múltiplos arquivos individuais por um único `.zip` com a estrutura de pastas do Cypress.

**Mudanças**:
- Instalar `jszip` como dependência
- Atualizar `cypressExport.ts` para gerar ZIP com estrutura:
  ```text
  cypress/
    e2e/
      features/
        autenticacao/
          login-com-credenciais-validas.feature
        carrinho/
          adicionar-produto.feature
    support/
      step_definitions/
        steps.ts
    cypress.config.ts
  ```
- Atualizar `ExportDialog.tsx` com botão "Baixar tudo como ZIP"

---

## Fase 2 — Edge Function: API REST para Cenários

**O que**: Criar uma Edge Function que expõe os cenários via API autenticada pela `api_key` da empresa. O Cypress do cliente faz fetch antes de rodar os testes.

**Edge Function `cypress-sync`**:
- `GET /cypress-sync?api_key=<company_api_key>` — retorna todos os `.feature` da empresa como JSON
- Valida a `api_key` contra a tabela `companies`
- Retorna cenários formatados em Gherkin prontos para escrita em disco

**Frontend**: Na página de Settings, mostrar a `api_key` da empresa com botão de copiar e instruções de uso no CI/CD.

---

## Fase 3 — Edge Function: Receber Resultados

**O que**: Criar endpoint que recebe resultados de execução do Cypress e atualiza o dashboard.

**Edge Function `cypress-results`**:
- `POST /cypress-results` — recebe array de resultados (scenario_id, status, duration, error_message)
- Autenticação via `api_key` da empresa
- Insere registros na tabela `test_runs` e atualiza `status` dos cenários

**Frontend**: Exibir na Settings um snippet de configuração do reporter customizado que envia resultados para a API.

---

## Detalhes Técnicos

| Item | Tecnologia |
|------|-----------|
| ZIP | `jszip` (client-side) |
| Edge Functions | Deno, Supabase Edge Functions |
| Autenticação API | `api_key` (UUID) da tabela `companies` |
| CORS | Headers padrão Supabase |

**Arquivos a criar/editar**:
1. `src/utils/cypressExport.ts` — adicionar geração de ZIP
2. `src/components/export/ExportDialog.tsx` — botão ZIP
3. `supabase/functions/cypress-sync/index.ts` — API de cenários
4. `supabase/functions/cypress-results/index.ts` — API de resultados
5. `src/views/SettingsView.tsx` — mostrar API key + instruções de integração

