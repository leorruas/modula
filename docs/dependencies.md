# Projeto Modula - Dependências

Este documento lista e descreve as principais dependências do projeto Modula, suas funções e justificativas de uso, conforme os requisitos de engenharia e regras de negócio.

## 1. Core Framework & UI
- **Next.js (v16.1.1)**: Framework React para produção, utilizado para roteamento, renderização no servidor e otimizações de performance.
- **React (v19.2.3)**: Biblioteca base para construção da interface.
- **Zustand (v5.0.10)**: Gerenciamento de estado global. Utilizado para o `editorStore`, controlando o estado do canvas, seleções, modo de pré-visualização e triggers de atualização.

## 2. Backend & Persistência
- **Firebase (v12.7.0)**: Plataforma backend utilizada para:
  - **Firestore**: Banco de dados NoSQL para salvar projetos, gráficos e configurações.
  - **Authentication**: Gestão de usuários e permissões.

## 3. Exportação & Geração de Arquivos
- **jsPDF (v4.0.0)**: Biblioteca principal para geração de PDFs.
- **svg2pdf.js (v2.7.0)**: Conversão de elementos SVG para PDF mantendo a fidelidade vetorial.
- **html2canvas** (Nota: Geralmente usado em conjunto com jsPDF para rasterização de alta fidelidade, conforme mencionado no Engineering Handbook).
- **JSZip (v3.10.1)**: Utilizado para compactar múltiplos gráficos em um único arquivo ZIP na exportação em lote (Bulk Export).
- **File-Saver (v2.0.5)**: Facilita o download de arquivos gerados no lado do cliente.

## 4. UI/UX & Estilo
- **Lucide React (v0.562.0)**: Conjunto de ícones vetoriais.
- **@heroicons/react (v2.2.0)**: Ícones secundários.
- **Sonner (v2.0.7)**: Sistema de notificações (Toasts) rico e não obstrutivo.
- **Clsx (v2.1.1)**: Utilitário para manipulação condicional de classes CSS.

## 5. Ferramentas de Desenvolvimento
- **TypeScript (v5)**: Tipagem estática para maior robustez do código.
- **ESLint (v9)**: Linter para manter padrões de código.
- **Tailwind CSS / CSS Modules**: (Verificar uso específico no projeto - o Style Guide menciona CSS puro e módulos).

---
*Este documento deve ser atualizado sempre que uma nova dependência for adicionada ou removida.*
