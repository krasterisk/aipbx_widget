# AI Voice Widget

Встраиваемый JavaScript-виджет для голосового взаимодействия с AI-ассистентом.

## Установка зависимостей

```bash
npm install
```

## Сборка

### Development (с source maps)
```bash
npm run dev
```

### Production (минимизированный)
```bash
npm run build
```

Результат: `dist/widget.min.js` (prod) или `dist/widget.js` (dev)

## Использование

### Базовая интеграция

```html
<!-- Production (via jsDelivr) -->
<script 
  src="https://cdn.jsdelivr.net/gh/krasterisk/aipbx_widget@latest/dist/widget.min.js"
  data-key="wk_your_public_key_here"
></script>

<!-- Development (local) -->
<script 
  src="./dist/widget.js"
  data-key="wk_your_public_key_here"
  data-api="http://localhost:3000"
></script>
```

### Атрибуты

- `data-key` (обязательно) - публичный ключ виджета (получить в админке)
- `data-api` (опционально) - URL backend API (по умолчанию: http://localhost:3000)

### Программное управление

```javascript
// Глобальный API доступен после инициализации
window.aiPBXWidget.show();      // Показать модальное окно
window.aiPBXWidget.hide();     // Скрыть модальное окно
window.aiPBXWidget.start();     // Начать разговор
window.aiPBXWidget.stop();      // Остановить разговор
window.aiPBXWidget.isActive();  // Проверить статус сессии
```

## Development

### Локальный сервер для тестирования

```bash
npm run serve
```

Откройте `test.html` в браузере.

## Структура проекта

```
public/widget/
├── src/
│   ├── main.js              # Главный файл, auto-init
│   ├── api-client.js        # HTTP клиент
│   ├── webrtc-manager.js    # WebRTC управление
│   ├── styles.css           # Все стили
│   ├── components/
│   │   ├── floating-button.js
│   │   ├── modal-window.js
│   │   └── audio-visualizer.js
│   └── utils/
│       ├── events.js        # EventEmitter
│       └── logger.js        # Logger
├── dist/
│   ├── widget.min.js        # Production bundle (minified)
│   └── widget.js            # Development bundle (with sourcemaps)
├── package.json
├── rollup.config.js
└── README.md
```

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 14+
- Edge 80+

## Features

✅ WebRTC для real-time аудио  
✅ Автоматическая инициализация  
✅ Красивый современный UI  
✅ Audio визуализация  
✅ Mobile responsive  
✅ Error handling  
✅ Production-ready build (<50KB gzipped)

## License

MIT
