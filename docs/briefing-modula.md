# Modula

## Visão do produto

Modula é uma ferramenta editorial para criar gráficos modulares e consistentes, pensada para publicação.  
Em vez de desenhar gráficos isolados, você constrói sistemas: página, grid, módulo e gráfico.  
O output é um PDF previsível e pronto para InDesign.

Gráficos não são objetos soltos. São módulos dentro de um sistema espacial.

---

## Estrutura geral do sistema

### 1. Conceito de Projeto (obrigatório)

Tudo acontece dentro de um projeto. Não existe gráfico solto.

Um projeto define:
- Tamanho da página (preset ou canvas customizado)
- Grid modular visual
- Unidade base do módulo
- Paleta de cores
- Fontes (Google Fonts)
- Tamanho padrão de labels
- Margens e área útil do gráfico
- Idioma dos labels

O grid é sempre visível e funciona como referência estrutural.

---

## Fluxo principal

### Fase de Ensaio
- Grid visível e editável
- Gráficos em rascunho
- Módulos não travados
- Pré-visualização com dados simulados
- Sugestão de tipos de gráfico compatíveis
- Avisos de densidade sem bloqueio

### Fase de Publicação
- Grid travado
- Módulos fixados por gráfico
- Validações ativas
- Versionamento editorial
- Gráficos podem ser marcados como publicados

---

## Tipos de gráfico

### Básicos
- Barra vertical
- Barra horizontal
- Coluna agrupada
- Coluna empilhada
- Linha simples
- Linha múltipla
- Área
- Área empilhada
- Pizza
- Donut

### Analíticos
- Dispersão (scatter)
- Bolhas
- Histograma
- Boxplot

### Comparativos editoriais
- Ranking simples
- Ranking com destaque
- Antes vs depois
- Série temporal com marco

### Híbridos
- Barra + linha
- Coluna + média

### Radiais
- Radar (spider chart)

### Customizados / autorais
- Gráfico de bolinhas
- Gráfico de círculos concêntricos

---

## Sistema modular

- Página de referência: A4
- Grid sugerido inicial: 4 × 4 (16 módulos)
- O módulo é a unidade mínima editorial

Cada tipo de gráfico possui limites mínimos e máximos de módulos.

---

## Labels e metadados

- Labels com tamanho fixo por projeto
- Sem títulos visuais no gráfico
- Nome interno e referência editorial por gráfico

### Anotações invisíveis
- Campo livre por gráfico
- Não aparecem visualmente
- Exportadas como texto pesquisável no PDF

### Status do gráfico
- Rascunho
- Pronto
- Publicado

### Legibilidade
- Aviso quando labels ficam abaixo de um tamanho mínimo configurável

---

## Export

- PDF vetorial
- Texto editável no InDesign
- Export individual
- Export em lote por capítulo, página ou módulo

### Export como evento
Cada export registra:
- versão
- status do gráfico
- usuário
- data e contexto

---

## Arquitetura técnica

### Front-end
- React + Next.js
- SVG como base de renderização
- Editor visual com grid
- Estado via Zustand ou Redux Toolkit

### Dashboard
- Interface editorial e silenciosa
- Fundo neutro
- Tipografia discreta
- Grid visível e funcional
- Animações apenas para mudança de estado
- Toast messages elegantes para eventos relevantes

### Back-end
- Firebase
- Firestore
- Firebase Auth
- Firebase Storage
- Cloud Functions para export

---

## Sistema de dados

Armazena:
- Projetos
- Configurações visuais
- Gráficos
- Dados
- Textos e labels
- Versões
- Eventos de export