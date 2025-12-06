<?php
session_start();
header('Content-Type: application/json');

$uploadDir = __DIR__ . '/converted_files';
if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);
$logFile = $uploadDir . '/converted.log';
if (!file_exists($logFile)) file_put_contents($logFile, "");

// --- SPRAWDZENIE PLIKU ---
if (!isset($_FILES['image'])) {
    echo json_encode(['status' => 'error', 'message' => 'Brak pliku']);
    exit;
}

$tmpFile = $_FILES['image']['tmp_name'];
$origName = $_FILES['image']['name'];
$format = $_POST['format'] ?? 'webp';

if (!file_exists($tmpFile)) {
    echo json_encode(['status' => 'error', 'message' => 'Plik tymczasowy nie istnieje']);
    exit;
}

// --- WYSYŁKA DO NODE.JS ---
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "http://srvvila.vilapolska.pl:8082/convert?format=" . urlencode($format));
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, [
    'image' => new CURLFile($tmpFile, mime_content_type($tmpFile), $origName)
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);

$response = curl_exec($ch);
$error = curl_error($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
curl_close($ch);

if ($error || $httpCode !== 200) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $error ?: 'Błąd API']);
    exit;
}

// --- ROZDZIEL NAGŁÓWKI I CIAŁO ODPOWIEDZI ---
$rawHeaders = substr($response, 0, $headerSize);
$body = substr($response, $headerSize);

// --- WYCIĄGANIE DANYCH Z NAGŁÓWKÓW ---
preg_match('/X-Original-Size:\s*(\d+)/i', $rawHeaders, $m1);
preg_match('/X-Converted-Size:\s*(\d+)/i', $rawHeaders, $m2);

$origSize = $m1[1] ?? 0;
$convSize = $m2[1] ?? strlen($body);
$savedPercent = $origSize > 0 ? round(100 - ($convSize / $origSize * 100), 2) : 0;

// --- ZAPIS WYNIKOWEGO PLIKU ---
$generatedFile = uniqid('conv_') . '.' . $format;
$outPath = $uploadDir . '/' . $generatedFile;
file_put_contents($outPath, $body);

// --- LOG ---
$timestamp = time();
$deleteAt = $timestamp + 1800;

$logEntry = json_encode([
    'original' => $origName,
    'file' => $generatedFile,
    'format' => $format,
    'created' => $timestamp,
    'delete_at' => $deleteAt
]) . PHP_EOL;

file_put_contents($logFile, $logEntry, FILE_APPEND);

// --- SESYJNY CACHE ---
if (!isset($_SESSION['files'])) $_SESSION['files'] = [];
$_SESSION['files'][] = $generatedFile;

// --- ODPOWIEDŹ ---
echo json_encode([
    'status' => 'ok',
    'file' => $generatedFile,
    'original' => $origName,
    'size_original' => $origSize,
    'size_converted' => $convSize,
    'saved_percent' => $savedPercent
]);

