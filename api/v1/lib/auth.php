<?php
// HCW-SMS API v1 — auth against openSIS login_authentication (bcrypt passwords).

function login_user(string $username, string $password): ?array
{
    $row = db_row(
        'SELECT user_id, profile_id, username, password
           FROM login_authentication WHERE UPPER(username)=UPPER(?) LIMIT 1',
        [$username]
    );
    if (!$row || !password_verify($password, (string) $row['password'])) {
        return null;
    }
    $profile = db_scalar('SELECT PROFILE FROM user_profiles WHERE ID=? LIMIT 1', [$row['profile_id']]) ?: 'admin';
    return [
        'id' => (int) $row['user_id'],
        'username' => $row['username'],
        'profile' => $profile,
        'name' => resolve_name($profile, (int) $row['user_id']),
    ];
}

function resolve_name(string $profile, int $userId): string
{
    if ($profile === 'student') {
        $n = db_scalar("SELECT CONCAT(FIRST_NAME,' ',LAST_NAME) FROM students WHERE STUDENT_ID=? LIMIT 1", [$userId]);
    } else {
        $n = db_scalar("SELECT CONCAT(FIRST_NAME,' ',LAST_NAME) FROM staff WHERE STAFF_ID=? LIMIT 1", [$userId]);
    }
    return $n !== null ? trim((string) $n) : '';
}

function issue_token(array $user): string
{
    return jwt_encode([
        'sub' => $user['id'],
        'username' => $user['username'],
        'profile' => $user['profile'],
        'name' => $user['name'],
        'iat' => time(),
        'exp' => time() + 60 * 60 * 12, // 12 hours
    ]);
}

function bearer_token(): string
{
    $hdr = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    if ($hdr === '' && function_exists('getallheaders')) {
        foreach (getallheaders() as $k => $v) {
            if (strcasecmp($k, 'Authorization') === 0) {
                $hdr = $v;
                break;
            }
        }
    }
    return preg_match('/Bearer\s+(.+)/i', $hdr, $m) ? trim($m[1]) : '';
}

function require_user(): array
{
    $token = bearer_token();
    if ($token === '') {
        fail('missing bearer token', 401);
    }
    $payload = jwt_decode($token);
    if (!$payload) {
        fail('invalid or expired token', 401);
    }
    return $payload;
}
