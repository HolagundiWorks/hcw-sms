<?php
/**
 * HCW-SMS — standalone demo of a React/Mantine island embedded in a PHP page.
 *
 *   Dev (HMR):   set HCW_UI_DEV=1 for the web container and run `npm run dev`
 *                in /frontend, then open http://localhost:8080/ui-demo.php
 *   Production:  run `npm run build` in /frontend, then open the same URL.
 *
 * This page is intentionally minimal — it shows the integration without the
 * legacy HCW-SMS chrome. Real pages keep their PHP header/footer and just add
 * the hcw_ui_assets() + hcw_ui_island() calls.
 */
require_once __DIR__ . '/functions/ReactAssets.php';
?>
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>HCW-SMS — UI demo</title>
    <?php hcw_ui_assets(); ?>
</head>
<body style="margin:0">
    <?php
    hcw_ui_island('DashboardPage', [
        'user' => [
            'name'  => 'Priya Menon',
            'role'  => 'admin',
            'email' => 'priya@hcw.school',
        ],
    ]);
    ?>
</body>
</html>
