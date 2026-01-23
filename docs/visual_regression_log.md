# Log de Regressão Visual - Smart Layout

## Caso 1: Bar Chart (Infographic Mode) - Layout Espacial
**Data**: 23/01/2026
**Contexto**: Teste de verificação da Fase 2.5.

![Bar Chart Layout Issues](/Users/leoruas/.gemini/antigravity/brain/1cbd9303-d2c2-4fef-a045-651c2e53891b/uploaded_image_1769182519233.png)

### Problemas Identificados

#### 1. Desperdício de Espaço na Esquerda (Left Margin)
*   **Observação**: Existe uma área vazia significativa entre a borda esquerda do container (linha azul) e o início das barras/texto.
*   **Sintoma**: "Aproveitamento ruim de espaço", "diminuir a largura na esquerda".
*   **Análise Preliminar**:
    *   O `SmartLayoutEngine` parece estar reservando espaço para um Eixo Y que não existe visualmente (ou está invisível).
    *   Se o gráfico é "Grouped" (Barras agrupadas com títulos "GRUPO A", "GRUPO B"), os labels de categoria estão *acima* das barras, não à esquerda.
    *   **Causa Provável**: O Engine assume `marginPriority.includes('left')` e calcula margem baseada no texto, mesmo que o layout visual do `BarChart` (nesse modo específico) não use o eixo Y lateral.

#### 2. Overflow Superior (Clip no Topo)
*   **Observação**: O label "GRUPO A" está tocando ou ultrapassando a linha superior do grid.
*   **Sintoma**: "Passando do grid".
*   **Análise Preliminar**:
    *   O `marginTop` calculado é insuficiente para acomodar os labels de grupo que ficam *acima* da primeira barra.
    *   O Engine reserva espaço fixo (`baseFontSize * 2`), mas labels de grupo podem exigir mais altura.

#### 3. Distância Excessiva da Legenda (Bottom Gap)
*   **Observação**: A legenda está ancorada no fundo do container, mas o gráfico de barras termina muito antes, criando um grande vazio vertical.
*   **Sintoma**: "Legenda muito longe".
*   **Análise Preliminar**:
    *   O `plotZone` calculado ocupa toda a altura disponível (menos margens), mas o componente `BarChart` internamente pode estar limitando a altura das barras (max-height ou scaling) e não preenchendo a zona.
    *   Ou o `marginBottom` calculado foi excessivo? (Pouco provável, visualmente o espaço parece estar DENTRO da área de plotagem, não na margem).

---

## Caso 2: Bar Chart (Left Legend Mode) - Layout Vertical e Gap Lateral
**Data**: 23/01/2026

![Bar Chart Left Legend Issues](/Users/leoruas/.gemini/antigravity/brain/1cbd9303-d2c2-4fef-a045-651c2e53891b/uploaded_image_1769182607602.png)

### Problemas Identificados

#### 1. Falta de Preenchimento Vertical (Collapse)
*   **Observação**: O gráfico está "espremido" no centro verticalmente, deixando enormes áreas vazias (brancas) no topo e no fundo, dentro do container azul.
*   **Sintoma**: "Não ocupa o espaço vertical que tem".
*   **Análise**:
    *   Confirma a suspeita do Caso 1: O `BarChart` não está respeitando a altura disponibilizada pelo `plotZone`.
    *   Possível hardcoding de `naturalHeight` ou falta de scaling (`flex-grow`) nas barras. O engine calcula `availableHeight`, mas o componente não se expande para ocupá-lo.

#### 2. Gap Excessivo Legenda-Gráfico
*   **Observação**: Há um "fosso" entre a legenda (na esquerda) e o início das barras/labels.
*   **Sintoma**: "Legenda bem longe do texto".
*   **Análise**:
    *   O `SmartLayoutEngine` calcula `marginRight` (ou Left no caso da legenda na esquerda) de forma conservadora demais?
    *   Ou o container da legenda (flex item) tem um `width` fixo exagerado (30%?) e o conteúdo dentro dele flutua para a esquerda, criando o gap?
    *   **Diagnóstico**: Provavelmente a `legendZone` tem largura fixa grande, e a `plotZone` começa apenas depois dela, somando-se a margens internas do gráfico.

#### 3. Inconsistência de "Legend Right" (Correção Fase 2.5 falhou?)
*   **Observação do Usuário**: "Quando coloco legenda no lado direito..." (A imagem mostra na ESQUERDA, mas o problema de gap deve ser simétrico).
*   **Ponto de Atenção**: O engine deve diferenciar `marginRight` de `legendZone`. Se a legenda é um bloco separado, ela não deveria estar "dentro" da margem do gráfico, mas sim reduzindo o `availableWidth` do plot. A integração atual pode estar somando os dois.

---
