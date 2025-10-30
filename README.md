# Торговая Панель Фьючерсов

Веб-панель для торговли фьючерсами с реальными данными через Binance Futures API.

## Возможности

- **Реальные данные в режиме реального времени** через WebSocket
- **Интерактивные графики** цен с различными таймфреймами
- **Стакан заказов** (Order Book) с актуальными данными
- **Последние сделки** в реальном времени
- **Множество торговых пар**: BTC/USDT, ETH/USDT, BNB/USDT, SOL/USDT, ADA/USDT
- **Различные таймфреймы**: 1м, 5м, 15м, 1ч, 4ч, 1д
- **Адаптивный дизайн** для различных устройств

## Технологии

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: PHP 7.4+
- **API**: Binance Futures API
- **Графики**: Chart.js
- **WebSocket**: Binance WebSocket Stream

## Структура проекта

```
/
├── index.html          # Главная страница
├── css/
│   └── style.css      # Стили
├── js/
│   └── trading.js     # Логика приложения
├── api/
│   └── binance.php    # PHP прокси для API
└── README.md          # Документация
```

## Требования

- PHP 7.4 или выше
- Веб-сервер (Apache, Nginx, или встроенный PHP сервер)
- PHP расширение cURL
- Доступ к интернету для API запросов

## Установка

### 1. Клонирование/Скачивание проекта

```bash
git clone <repository-url>
cd trading-panel
```

### 2. Проверка PHP и cURL

```bash
php -v
php -m | grep curl
```

Если cURL не установлен:

**Ubuntu/Debian:**
```bash
sudo apt-get install php-curl
```

**CentOS/RHEL:**
```bash
sudo yum install php-curl
```

**macOS (Homebrew):**
```bash
brew install php
```

### 3. Запуск

#### Вариант A: Встроенный PHP сервер (для разработки)

```bash
php -S localhost:8000
```

Откройте в браузере: `http://localhost:8000`

#### Вариант B: Apache

1. Скопируйте файлы в директорию веб-сервера:
```bash
sudo cp -r . /var/www/html/trading-panel/
```

2. Настройте права доступа:
```bash
sudo chmod -R 755 /var/www/html/trading-panel/
```

3. Откройте в браузере: `http://localhost/trading-panel/`

#### Вариант C: Nginx

1. Создайте конфигурацию:
```nginx
server {
    listen 80;
    server_name localhost;
    root /var/www/trading-panel;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php7.4-fpm.sock;
        fastcgi_index index.php;
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    }
}
```

2. Перезапустите Nginx:
```bash
sudo systemctl restart nginx
```

## Использование

### Основные функции

1. **Выбор инструмента**: Кликните на торговую пару в левой панели
2. **Смена таймфрейма**: Выберите нужный таймфрейм (1м, 5м, 15м, 1ч, 4ч, 1д)
3. **Просмотр графика**: График автоматически обновляется
4. **Стакан заказов**: Отображает текущие заявки на покупку/продажу
5. **Последние сделки**: Показывает последние выполненные сделки

### Доступные торговые пары

- BTC/USDT - Bitcoin
- ETH/USDT - Ethereum
- BNB/USDT - Binance Coin
- SOL/USDT - Solana
- ADA/USDT - Cardano

### Индикаторы

- **Зеленый цвет**: Рост цены/покупка
- **Красный цвет**: Падение цены/продажа
- **● Подключено**: WebSocket активен
- **● Отключено**: WebSocket не активен

## API Endpoints

PHP прокси предоставляет следующие endpoints:

### Тикер (24-часовая статистика)
```
GET /api/binance.php?endpoint=ticker&symbol=BTCUSDT
```

### Свечные данные (Klines)
```
GET /api/binance.php?endpoint=klines&symbol=BTCUSDT&interval=15m&limit=100
```

### Стакан заказов (Order Book)
```
GET /api/binance.php?endpoint=depth&symbol=BTCUSDT&limit=10
```

### Последние сделки
```
GET /api/binance.php?endpoint=trades&symbol=BTCUSDT&limit=50
```

### Информация о бирже
```
GET /api/binance.php?endpoint=exchangeInfo
```

### Текущая цена
```
GET /api/binance.php?endpoint=price&symbol=BTCUSDT
```

## Настройка

### Добавление новых торговых пар

В файле `index.html` добавьте новый блок в `.instrument-list`:

```html
<div class="instrument-item" data-symbol="XRPUSDT">
    <div class="instrument-name">XRP/USDT</div>
    <div class="instrument-price" id="price-XRPUSDT">--</div>
    <div class="instrument-change" id="change-XRPUSDT">--%</div>
</div>
```

### Изменение интервала обновления

В файле `js/trading.js` в конце файла:

```javascript
// Стакан заказов и сделки - каждые 3 секунды
setInterval(() => {
    loadOrderBook();
    loadRecentTrades();
}, 3000);

// Тикер - каждые 5 секунд
setInterval(() => {
    loadTicker();
}, 5000);

// График - каждую минуту
setInterval(() => {
    loadChartData();
}, 60000);
```

## Безопасность

- API прокси использует только публичные endpoints (не требуется API ключ)
- CORS настроен для работы с любыми доменами
- Нет хранения личных данных пользователей
- Все запросы идут через серверный прокси

## Ограничения Binance API

Binance имеет лимиты на количество запросов:
- 1200 запросов в минуту
- 10 запросов в секунду для WebSocket

Приложение автоматически соблюдает эти лимиты.

## Устранение проблем

### Ошибка "Failed to fetch"

1. Убедитесь, что PHP сервер запущен
2. Проверьте консоль браузера (F12)
3. Проверьте, что cURL установлен: `php -m | grep curl`

### WebSocket не подключается

1. Проверьте интернет-соединение
2. Убедитесь, что брандмауэр не блокирует WebSocket
3. Попробуйте другой браузер

### График не отображается

1. Убедитесь, что Chart.js загружен (проверьте консоль)
2. Очистите кэш браузера
3. Проверьте, что данные приходят от API

### PHP ошибки

Включите отображение ошибок в `api/binance.php`:
```php
error_reporting(E_ALL);
ini_set('display_errors', 1);
```

## Разработка

### Добавление новых функций

1. **Новый индикатор**: Добавьте в `instrument-info` в HTML
2. **Новый график**: Создайте новый Chart.js instance
3. **Новый API endpoint**: Добавьте функцию в `api/binance.php`

### Тестирование API

```bash
# Тест тикера
curl "http://localhost:8000/api/binance.php?endpoint=ticker&symbol=BTCUSDT"

# Тест графика
curl "http://localhost:8000/api/binance.php?endpoint=klines&symbol=BTCUSDT&interval=15m&limit=10"
```

## Ресурсы

- [Binance Futures API Documentation](https://binance-docs.github.io/apidocs/futures/en/)
- [Chart.js Documentation](https://www.chartjs.org/docs/latest/)
- [WebSocket API Documentation](https://binance-docs.github.io/apidocs/futures/en/#websocket-market-streams)

## Лицензия

MIT License

## Отказ от ответственности

Это приложение предназначено только для образовательных целей. Торговля криптовалютами и фьючерсами сопряжена с высокими рисками. Авторы не несут ответственности за финансовые потери.

## Поддержка

При возникновении проблем:
1. Проверьте раздел "Устранение проблем"
2. Проверьте консоль браузера на наличие ошибок
3. Убедитесь, что все требования выполнены

## Благодарности

- Binance за предоставление API
- Chart.js за библиотеку графиков
- Сообщество разработчиков

---

**Версия**: 1.0.0
**Дата**: 2025
**Автор**: Trading Panel Team
