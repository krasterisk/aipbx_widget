# AI Prompt: Widget Management UI

Создай React админ-панель для управления AI voice виджетами.

## UI Компоненты

### 1. WidgetList - Таблица виджетов
- Колонки: Name, Assistant, Domains, Sessions, Status, Actions
- Кнопка "Create Widget"
- Actions: Edit, Get Code, Delete

### 2. CreateWidgetDialog - Форма создания

**Basic Settings:**
- Widget Name (обязательно)
- AI Assistant (select из /assistants)
- Allowed Domains (chips input) 
- Max Sessions (number, default: 10)

**Appearance (для генерации кода):**
- Button Position: bottom-right/left, top-right/left
- Button Color (color picker)
- Theme: light/dark/auto
- Primary/Accent colors
- Language: en/ru/es

### 3. GetCodeDialog - Генерация кода

```html
<script 
  src="https://cdn.yourdomain.com/widget.js"
  data-key="wk_xxxxx"
  data-api="https://api.yourdomain.com"
  data-position="bottom-right"
  data-theme="light"
></script>
```

- Syntax highlighting
- Copy button
- Installation instructions

## Backend API

```typescript
GET /widget-keys - список виджетов
POST /widget-keys - создать {name, assistantId, allowedDomains[], maxConcurrentSessions}
PUT /widget-keys/:id - обновить
DELETE /widget-keys/:id - удалить
GET /assistants - для dropdown
```

## Tech Stack
- React + TypeScript
- Material-UI или Ant Design
- React Query for API
- React Hook Form + Zod
- react-syntax-highlighter

## generateEmbedCode()

```typescript
function generateEmbedCode(widget, settings) {
  return `<script
  src="https://cdn.yourdomain.com/widget.js"
  data-key="${widget.publicKey}"
  data-position="${settings.position}"
  data-theme="${settings.theme}"
></script>`;
}
```

Начни с WidgetList и CreateWidgetDialog!
