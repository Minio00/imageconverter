<?php
session_start();
header("Content-Type: application/json");

$uploadDir = __DIR__ . '/converted_files';
$baseUrl = './converted_files';

if (!isset($_SESSION['files'])) {
    echo json_encode([]);
    exit;
}

$out = [];
foreach ($_SESSION['files'] as $file) {
    $path = $uploadDir . '/' . $file;

    if (file_exists($path)) {
        $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
        $canPreview = in_array($ext, ['jpg','jpeg','png','webp','gif','avif']);

        $out[] = [
            "file" => $file,
            "url"  => $baseUrl . '/' . $file,
            "preview" => $canPreview
        ];
    }
}

echo json_encode($out);
