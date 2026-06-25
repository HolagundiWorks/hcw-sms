<?php
// HCW-SMS API v1 — MariaDB access via mysqli (PDO_mysql isn't built into the
// image; mysqli is). Tiny prepared-statement helpers.

function get_db(): mysqli
{
    static $conn = null;
    if ($conn instanceof mysqli) {
        return $conn;
    }
    // Data.php (repo root) defines $DatabaseServer/Username/Password/Name/Port.
    require __DIR__ . '/../../../Data.php';
    mysqli_report(MYSQLI_REPORT_OFF);
    $conn = @mysqli_connect(
        $DatabaseServer,
        $DatabaseUsername,
        $DatabasePassword,
        $DatabaseName,
        (int) $DatabasePort
    );
    if (!$conn) {
        fail('database connection failed', 500);
    }
    mysqli_set_charset($conn, 'utf8mb4');
    return $conn;
}

/** Run a prepared SELECT and return all rows (assoc). Params bound as strings. */
function db_rows(string $sql, array $params = []): array
{
    $conn = get_db();
    $stmt = mysqli_prepare($conn, $sql);
    if (!$stmt) {
        fail('query preparation failed', 500);
    }
    if ($params) {
        mysqli_stmt_bind_param($stmt, str_repeat('s', count($params)), ...$params);
    }
    mysqli_stmt_execute($stmt);
    $res = mysqli_stmt_get_result($stmt);
    $rows = $res ? mysqli_fetch_all($res, MYSQLI_ASSOC) : [];
    mysqli_stmt_close($stmt);
    return $rows;
}

/** First column of the first row (or null). */
function db_scalar(string $sql, array $params = [])
{
    $rows = db_rows($sql, $params);
    if (!$rows) {
        return null;
    }
    return array_values($rows[0])[0];
}

/** First row (or null). */
function db_row(string $sql, array $params = []): ?array
{
    $rows = db_rows($sql, $params);
    return $rows[0] ?? null;
}
