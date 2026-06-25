<?php
// HCW-SMS API v1 — HTTP helpers (CORS, JSON in/out).

function cors(): void
{
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    // Reflect the caller's origin so the Vite dev server (5174) and the Tauri
    // app (custom scheme) both work. Auth is bearer-token, not cookies.
    header('Access-Control-Allow-Origin: ' . ($origin !== '' ? $origin : '*'));
    header('Vary: Origin');
    header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Access-Control-Max-Age: 86400');
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

function json_out($data, int $code = 200): void
{
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function fail(string $message, int $code = 400): void
{
    json_out(['error' => $message], $code);
}

function body_json(): array
{
    $raw = file_get_contents('php://input');
    $data = json_decode((string) $raw, true);
    return is_array($data) ? $data : [];
}
