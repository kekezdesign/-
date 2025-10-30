<?php
/**
 * Binance Futures API Proxy
 * Прокси для получения данных с Binance Futures API
 */

// Разрешаем CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Обработка preflight запросов
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Базовый URL Binance Futures API
define('BINANCE_API_BASE', 'https://fapi.binance.com');

// Получение параметров запроса
$endpoint = isset($_GET['endpoint']) ? $_GET['endpoint'] : '';
$symbol = isset($_GET['symbol']) ? strtoupper($_GET['symbol']) : 'BTCUSDT';
$interval = isset($_GET['interval']) ? $_GET['interval'] : '15m';
$limit = isset($_GET['limit']) ? intval($_GET['limit']) : 100;

/**
 * Выполняет запрос к Binance API
 */
function makeBinanceRequest($url) {
    $ch = curl_init();

    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'User-Agent: Mozilla/5.0'
        ]
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);

    curl_close($ch);

    if ($error) {
        return [
            'error' => 'Ошибка соединения: ' . $error,
            'code' => 500
        ];
    }

    if ($httpCode !== 200) {
        return [
            'error' => 'HTTP ошибка: ' . $httpCode,
            'code' => $httpCode,
            'response' => $response
        ];
    }

    return json_decode($response, true);
}

/**
 * Получение тикера (24hr ticker price change statistics)
 */
function getTicker($symbol) {
    $url = BINANCE_API_BASE . '/fapi/v1/ticker/24hr?symbol=' . $symbol;
    return makeBinanceRequest($url);
}

/**
 * Получение свечных данных (Kline/Candlestick data)
 */
function getKlines($symbol, $interval, $limit) {
    $url = BINANCE_API_BASE . '/fapi/v1/klines?symbol=' . $symbol .
           '&interval=' . $interval . '&limit=' . $limit;
    return makeBinanceRequest($url);
}

/**
 * Получение стакана заказов (Order Book)
 */
function getOrderBook($symbol, $limit) {
    $url = BINANCE_API_BASE . '/fapi/v1/depth?symbol=' . $symbol . '&limit=' . $limit;
    return makeBinanceRequest($url);
}

/**
 * Получение последних сделок (Recent Trades List)
 */
function getRecentTrades($symbol, $limit) {
    $url = BINANCE_API_BASE . '/fapi/v1/trades?symbol=' . $symbol . '&limit=' . $limit;
    return makeBinanceRequest($url);
}

/**
 * Получение информации об обменных парах
 */
function getExchangeInfo() {
    $url = BINANCE_API_BASE . '/fapi/v1/exchangeInfo';
    return makeBinanceRequest($url);
}

/**
 * Получение информации о цене символа
 */
function getSymbolPrice($symbol) {
    $url = BINANCE_API_BASE . '/fapi/v1/ticker/price?symbol=' . $symbol;
    return makeBinanceRequest($url);
}

// Маршрутизация запросов
try {
    $result = null;

    switch ($endpoint) {
        case 'ticker':
            $result = getTicker($symbol);
            break;

        case 'klines':
            $result = getKlines($symbol, $interval, $limit);
            break;

        case 'depth':
            $result = getOrderBook($symbol, $limit);
            break;

        case 'trades':
            $result = getRecentTrades($symbol, $limit);
            break;

        case 'exchangeInfo':
            $result = getExchangeInfo();
            break;

        case 'price':
            $result = getSymbolPrice($symbol);
            break;

        default:
            $result = [
                'error' => 'Неизвестный endpoint',
                'available_endpoints' => [
                    'ticker' => 'Статистика тикера за 24 часа',
                    'klines' => 'Свечные данные',
                    'depth' => 'Стакан заказов',
                    'trades' => 'Последние сделки',
                    'exchangeInfo' => 'Информация о бирже',
                    'price' => 'Текущая цена символа'
                ],
                'usage' => 'api/binance.php?endpoint=ticker&symbol=BTCUSDT'
            ];
            http_response_code(400);
    }

    // Кэширование для снижения нагрузки
    if (!isset($result['error'])) {
        header('Cache-Control: public, max-age=1');
    }

    echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Внутренняя ошибка сервера',
        'message' => $e->getMessage()
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
}
