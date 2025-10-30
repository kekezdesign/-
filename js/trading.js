// Глобальные переменные
let currentSymbol = 'BTCUSDT';
let currentInterval = '15m';
let priceChart = null;
let websocket = null;
let updateInterval = null;

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    initializeChart();
    initializeEventListeners();
    loadInitialData();
    startWebSocket();
    updateTime();
    setInterval(updateTime, 1000);
});

// Инициализация графика
function initializeChart() {
    const ctx = document.getElementById('priceChart').getContext('2d');

    priceChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: 'Цена',
                data: [],
                borderColor: '#2196f3',
                backgroundColor: 'rgba(33, 150, 243, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 5,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index',
            },
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        color: '#e0e0e0',
                        font: {
                            size: 14
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#e0e0e0',
                    borderColor: '#2196f3',
                    borderWidth: 1,
                }
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'minute',
                        displayFormats: {
                            minute: 'HH:mm',
                            hour: 'HH:mm'
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)',
                    },
                    ticks: {
                        color: '#9e9e9e',
                    }
                },
                y: {
                    position: 'right',
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)',
                    },
                    ticks: {
                        color: '#9e9e9e',
                    }
                }
            }
        }
    });
}

// Инициализация обработчиков событий
function initializeEventListeners() {
    // Выбор инструмента
    document.querySelectorAll('.instrument-item').forEach(item => {
        item.addEventListener('click', function() {
            document.querySelectorAll('.instrument-item').forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            currentSymbol = this.dataset.symbol;
            loadInitialData();
            restartWebSocket();
        });
    });

    // Выбор таймфрейма
    document.querySelectorAll('.tf-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.tf-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentInterval = this.dataset.interval;
            loadChartData();
        });
    });
}

// Загрузка начальных данных
async function loadInitialData() {
    try {
        await Promise.all([
            loadTicker(),
            loadChartData(),
            loadOrderBook(),
            loadRecentTrades()
        ]);
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
    }
}

// Загрузка тикера (текущая цена и статистика)
async function loadTicker() {
    try {
        const response = await fetch(`api/binance.php?endpoint=ticker&symbol=${currentSymbol}`);
        const data = await response.json();

        if (data.error) {
            console.error('Ошибка API:', data.error);
            return;
        }

        updateTickerDisplay(data);
        updateInstrumentList(data);
    } catch (error) {
        console.error('Ошибка загрузки тикера:', error);
    }
}

// Обновление отображения тикера
function updateTickerDisplay(data) {
    const price = parseFloat(data.lastPrice);
    const change = parseFloat(data.priceChangePercent);
    const volume = parseFloat(data.volume);
    const high = parseFloat(data.highPrice);
    const low = parseFloat(data.lowPrice);

    document.getElementById('current-symbol').textContent = currentSymbol.replace('USDT', '/USDT');
    document.getElementById('current-price').textContent = formatPrice(price);

    const changeElement = document.getElementById('current-change');
    changeElement.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
    changeElement.className = 'info-value ' + (change >= 0 ? 'positive' : 'negative');

    document.getElementById('current-volume').textContent = formatVolume(volume);
    document.getElementById('current-high').textContent = formatPrice(high);
    document.getElementById('current-low').textContent = formatPrice(low);
}

// Обновление списка инструментов
function updateInstrumentList(data) {
    const price = parseFloat(data.lastPrice);
    const change = parseFloat(data.priceChangePercent);

    const priceElement = document.getElementById(`price-${currentSymbol}`);
    const changeElement = document.getElementById(`change-${currentSymbol}`);

    if (priceElement) {
        priceElement.textContent = formatPrice(price);
    }

    if (changeElement) {
        changeElement.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
        changeElement.className = 'instrument-change ' + (change >= 0 ? 'positive' : 'negative');
    }
}

// Загрузка данных для графика
async function loadChartData() {
    try {
        const response = await fetch(`api/binance.php?endpoint=klines&symbol=${currentSymbol}&interval=${currentInterval}&limit=100`);
        const data = await response.json();

        if (data.error) {
            console.error('Ошибка API:', data.error);
            return;
        }

        const chartData = data.map(candle => ({
            x: candle[0],
            y: parseFloat(candle[4])
        }));

        priceChart.data.datasets[0].data = chartData;
        priceChart.data.datasets[0].label = `Цена ${currentSymbol.replace('USDT', '/USDT')} (${currentInterval})`;
        priceChart.update();
    } catch (error) {
        console.error('Ошибка загрузки данных графика:', error);
    }
}

// Загрузка стакана заказов
async function loadOrderBook() {
    try {
        const response = await fetch(`api/binance.php?endpoint=depth&symbol=${currentSymbol}&limit=10`);
        const data = await response.json();

        if (data.error) {
            console.error('Ошибка API:', data.error);
            return;
        }

        displayOrderBook(data);
    } catch (error) {
        console.error('Ошибка загрузки стакана:', error);
    }
}

// Отображение стакана заказов
function displayOrderBook(data) {
    const asksContainer = document.getElementById('orderbook-asks');
    const bidsContainer = document.getElementById('orderbook-bids');

    // Asks (продажи) - в обратном порядке
    asksContainer.innerHTML = data.asks.reverse().map(([price, amount]) => {
        const total = (parseFloat(price) * parseFloat(amount)).toFixed(2);
        return `
            <div class="orderbook-row ask">
                <span>${formatPrice(parseFloat(price))}</span>
                <span>${parseFloat(amount).toFixed(4)}</span>
                <span>${total}</span>
            </div>
        `;
    }).join('');

    // Спред
    const bestAsk = parseFloat(data.asks[0][0]);
    const bestBid = parseFloat(data.bids[0][0]);
    const spread = ((bestAsk - bestBid) / bestBid * 100).toFixed(4);
    document.getElementById('spread-value').textContent = `Спред: ${spread}%`;

    // Bids (покупки)
    bidsContainer.innerHTML = data.bids.map(([price, amount]) => {
        const total = (parseFloat(price) * parseFloat(amount)).toFixed(2);
        return `
            <div class="orderbook-row bid">
                <span>${formatPrice(parseFloat(price))}</span>
                <span>${parseFloat(amount).toFixed(4)}</span>
                <span>${total}</span>
            </div>
        `;
    }).join('');
}

// Загрузка последних сделок
async function loadRecentTrades() {
    try {
        const response = await fetch(`api/binance.php?endpoint=trades&symbol=${currentSymbol}&limit=50`);
        const data = await response.json();

        if (data.error) {
            console.error('Ошибка API:', data.error);
            return;
        }

        displayRecentTrades(data);
    } catch (error) {
        console.error('Ошибка загрузки сделок:', error);
    }
}

// Отображение последних сделок
function displayRecentTrades(trades) {
    const container = document.getElementById('trades-container');

    container.innerHTML = trades.reverse().map(trade => {
        const price = parseFloat(trade.price);
        const qty = parseFloat(trade.qty);
        const time = new Date(trade.time).toLocaleTimeString('ru-RU');
        const isBuy = trade.isBuyerMaker === false;

        return `
            <div class="trade-row ${isBuy ? 'buy' : 'sell'}">
                <span>${formatPrice(price)}</span>
                <span>${qty.toFixed(4)}</span>
                <span class="trade-time">${time}</span>
            </div>
        `;
    }).join('');
}

// WebSocket для real-time обновлений
function startWebSocket() {
    const wsUrl = `wss://fstream.binance.com/ws/${currentSymbol.toLowerCase()}@ticker`;

    websocket = new WebSocket(wsUrl);

    websocket.onopen = function() {
        console.log('WebSocket подключен');
        document.getElementById('connection-status').textContent = '● Подключено';
        document.getElementById('connection-status').className = 'status-connected';
    };

    websocket.onmessage = function(event) {
        const data = JSON.parse(event.data);
        updateTickerDisplay({
            lastPrice: data.c,
            priceChangePercent: data.P,
            volume: data.v,
            highPrice: data.h,
            lowPrice: data.l
        });
    };

    websocket.onerror = function(error) {
        console.error('WebSocket ошибка:', error);
        document.getElementById('connection-status').textContent = '● Ошибка';
        document.getElementById('connection-status').className = 'status-disconnected';
    };

    websocket.onclose = function() {
        console.log('WebSocket отключен');
        document.getElementById('connection-status').textContent = '● Отключено';
        document.getElementById('connection-status').className = 'status-disconnected';

        // Переподключение через 5 секунд
        setTimeout(startWebSocket, 5000);
    };
}

// Перезапуск WebSocket
function restartWebSocket() {
    if (websocket) {
        websocket.close();
    }
    startWebSocket();
}

// Обновление времени
function updateTime() {
    const now = new Date();
    document.getElementById('current-time').textContent = now.toLocaleString('ru-RU');
}

// Форматирование цены
function formatPrice(price) {
    if (price >= 1000) {
        return price.toFixed(2);
    } else if (price >= 1) {
        return price.toFixed(4);
    } else {
        return price.toFixed(6);
    }
}

// Форматирование объема
function formatVolume(volume) {
    if (volume >= 1000000) {
        return (volume / 1000000).toFixed(2) + 'M';
    } else if (volume >= 1000) {
        return (volume / 1000).toFixed(2) + 'K';
    } else {
        return volume.toFixed(2);
    }
}

// Периодическое обновление данных
setInterval(() => {
    loadOrderBook();
    loadRecentTrades();
}, 3000);

setInterval(() => {
    loadTicker();
}, 5000);

setInterval(() => {
    loadChartData();
}, 60000);
