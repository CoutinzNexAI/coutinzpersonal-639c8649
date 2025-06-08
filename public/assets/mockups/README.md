# 📐 PicTuz x Gelato - Estrutura de Mockups

Este diretório contém todos os mockups organizados por categoria de produto para a integração com a Gelato.

## 📁 Estrutura de Pastas

```
mockups/
├── canvas/          # Quadros e telas
├── tshirt/          # T-shirts e apparel
├── poster/          # Posters e prints
├── mug/             # Canecas e drinkware
└── phone-case/      # Capas de telemóvel
```

## 🎯 Requisitos dos Mockups

### Formato e Qualidade
- **Formato:** PNG com transparência ou JPG de alta qualidade
- **Resolução:** Mínimo 800x800px (recomendado 1200x1200px ou superior)
- **Qualidade:** 90%+ para JPG, PNG-24 para transparências

### Naming Convention
```
{categoria}_{tamanho}_{cor}_mockup_{vista}.{extensão}

Exemplos:
- canvas_20x20_mockup_blank_front.png
- tshirt_s_white_mockup_front.png
- poster_a4_mockup_blank.png
- mug_white_mockup_blank.png
```

### Vistas Requeridas
- **front** - Vista frontal principal
- **side** - Vista lateral (se aplicável)
- **back** - Vista traseira (se aplicável)
- **blank** - Versão em branco sem design

## 🖼️ Canvas Products

### Ficheiros Necessários:
- `canvas_20x20_mockup_blank_front.png` (800x800px)
- `canvas_30x40_mockup_blank_front.png` (600x800px)

### Coordenadas de Print Area:
As coordenadas exatas devem ser medidas nos mockups e atualizadas em `src/lib/gelato/gelatoProducts.ts`:

```typescript
printAreaCoords: { x: 50, y: 50, width: 700, height: 700 }
```

## 👕 T-shirt Products

### Ficheiros Necessários:
- `tshirt_s_white_mockup_front.png` (800x1200px)
- `tshirt_m_white_mockup_front.png` (800x1200px)
- `tshirt_l_white_mockup_front.png` (800x1200px)

### Print Area:
Zona do peito para impressão - coordenadas típicas:
```typescript
printAreaCoords: { x: 250, y: 350, width: 300, height: 250 }
```

## 📄 Poster Products

### Ficheiros Necessários:
- `poster_a4_mockup_blank.png` (600x848px)
- `poster_a3_mockup_blank.png` (848x1200px)

### Print Area:
Área completa do poster:
```typescript
printAreaCoords: { x: 0, y: 0, width: 600, height: 848 }
```

## ☕ Mug Products

### Ficheiros Necessários:
- `mug_white_mockup_blank.png` (800x600px)
- `mug_black_mockup_blank.png` (800x600px)

### Print Area:
Zona lateral da caneca para impressão:
```typescript
printAreaCoords: { x: 200, y: 150, width: 400, height: 300 }
```

## 📱 Phone Case Products

### Ficheiros Necessários:
- `iphone_15_case_mockup_blank.png` (400x800px)
- `iphone_14_case_mockup_blank.png` (400x800px)

### Print Area:
Parte traseira da capa:
```typescript
printAreaCoords: { x: 50, y: 100, width: 300, height: 600 }
```

## 🎨 Como Medir Coordenadas

1. **Abrir mockup no editor de imagem** (Photoshop, GIMP, etc.)
2. **Identificar área de impressão** - onde o design do utilizador será colocado
3. **Medir coordenadas** usando a ferramenta de seleção:
   - `x`: Distância do lado esquerdo
   - `y`: Distância do topo
   - `width`: Largura da área de impressão
   - `height`: Altura da área de impressão
4. **Atualizar em `gelatoProducts.ts`** com as coordenadas corretas

## 🔄 Workflow de Atualização

1. **Adicionar novo mockup** ao diretório apropriado
2. **Medir coordenadas** da print area
3. **Atualizar `gelatoProducts.ts`** com novo produto e coordenadas
4. **Testar no frontend** com preview do design
5. **Validar** que o posicionamento está correto

## 📋 Checklist de Qualidade

- [ ] Mockup em alta resolução (min 800px)
- [ ] Fundo transparente ou neutro
- [ ] Print area claramente definida
- [ ] Coordenadas medidas e atualizadas
- [ ] Testado no frontend
- [ ] Compatível com produtos Gelato

---

**Nota:** Os mockups devem representar fielmente os produtos reais da Gelato para que os utilizadores tenham uma pré-visualização precisa do resultado final. 