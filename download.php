<?php
session_start();
$uploadDir = __DIR__.'/converted_files';
if(!isset($_GET['file'])) { http_response_code(400); exit('Brak pliku'); }

$file = basename($_GET['file']);
$fullPath = "$uploadDir/$file";

if(file_exists($fullPath)){
    header('Content-Type: application/octet-stream');
    header('Content-Disposition: attachment; filename="'.$file.'"');
    header('Content-Length: '.filesize($fullPath));
    readfile($fullPath);
    exit;
} else {
    http_response_code(404);
    exit('Plik nie istnieje');
}
