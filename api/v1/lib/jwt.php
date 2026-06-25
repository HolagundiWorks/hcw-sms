<?php
// HCW-SMS API v1 — dependency-free HS256 JWT.

function jwt_secret(): string
{
    $s = getenv('HCWSMS_JWT_SECRET');
    return ($s !== false && $s !== '') ? $s : 'dev-insecure-secret-change-me';
}

function b64url(string $d): string
{
    return rtrim(strtr(base64_encode($d), '+/', '-_'), '=');
}

function b64url_decode(string $d): string
{
    return (string) base64_decode(strtr($d, '-_', '+/'));
}

function jwt_encode(array $payload): string
{
    $h = b64url(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
    $p = b64url(json_encode($payload));
    $sig = b64url(hash_hmac('sha256', "$h.$p", jwt_secret(), true));
    return "$h.$p.$sig";
}

function jwt_decode(string $jwt): ?array
{
    $parts = explode('.', $jwt);
    if (count($parts) !== 3) {
        return null;
    }
    [$h, $p, $s] = $parts;
    $expected = b64url(hash_hmac('sha256', "$h.$p", jwt_secret(), true));
    if (!hash_equals($expected, $s)) {
        return null;
    }
    $payload = json_decode(b64url_decode($p), true);
    if (!is_array($payload)) {
        return null;
    }
    if (isset($payload['exp']) && time() >= (int) $payload['exp']) {
        return null;
    }
    return $payload;
}
