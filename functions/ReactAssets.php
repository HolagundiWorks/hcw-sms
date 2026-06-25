<?php
/**
 * HCW-SMS — React/Mantine island integration for the legacy HCW-SMS pages.
 *
 * Usage inside any PHP page (e.g. between <head> or before </body>):
 *
 *     require_once 'functions/ReactAssets.php';
 *     hcw_ui_assets();                       // load the bundle once per page
 *     hcw_ui_island('DashboardPage', [       // mount a React screen
 *         'user' => ['name' => $name, 'role' => 'teacher'],
 *     ]);
 *
 * Dev vs. production is controlled by the HCW_UI_DEV environment variable:
 *   - HCW_UI_DEV=1  -> load modules from the Vite dev server (HMR).
 *   - unset/0       -> load the hashed build from /assets/hcw-ui (run `npm run build`).
 */

if (!function_exists('hcw_ui_is_dev')) {
    function hcw_ui_is_dev(): bool
    {
        return getenv('HCW_UI_DEV') === '1'
            || (defined('HCW_UI_DEV') && HCW_UI_DEV);
    }

    function hcw_ui_dev_server(): string
    {
        $url = getenv('HCW_UI_DEV_SERVER');
        return rtrim($url !== false && $url !== '' ? $url : 'http://localhost:5174', '/');
    }

    /** Public base URL the built assets are served from. */
    function hcw_ui_base(): string
    {
        return '/assets/hcw-ui';
    }

    /**
     * Emit the <script>/<link> tags that load the islands bundle.
     * Safe to call multiple times per request — only the first call emits.
     */
    function hcw_ui_assets(): void
    {
        static $done = false;
        if ($done) {
            return;
        }
        $done = true;

        if (hcw_ui_is_dev()) {
            $dev = hcw_ui_dev_server();
            // React Fast Refresh preamble (required by @vitejs/plugin-react
            // when the host HTML is not served by Vite itself).
            echo "\n<script type=\"module\">\n"
                . "  import RefreshRuntime from '{$dev}/@react-refresh'\n"
                . "  RefreshRuntime.injectIntoGlobalHook(window)\n"
                . "  window.\$RefreshReg\$ = () => {}\n"
                . "  window.\$RefreshSig\$ = () => (type) => type\n"
                . "  window.__vite_plugin_react_preamble_installed__ = true\n"
                . "</script>\n";
            echo "<script type=\"module\" src=\"{$dev}/@vite/client\"></script>\n";
            echo "<script type=\"module\" src=\"{$dev}/src/embed.tsx\"></script>\n";
            return;
        }

        $base = hcw_ui_base();
        $manifestPath = __DIR__ . '/../assets/hcw-ui/.vite/manifest.json';
        if (!is_file($manifestPath)) {
            echo "\n<!-- hcw-ui: build missing — run `npm run build` in /frontend -->\n";
            return;
        }

        $manifest = json_decode((string) file_get_contents($manifestPath), true);
        $entry = $manifest['src/embed.tsx'] ?? null;
        if (!is_array($entry)) {
            echo "\n<!-- hcw-ui: embed entry not found in manifest -->\n";
            return;
        }

        foreach (($entry['css'] ?? []) as $css) {
            echo "<link rel=\"stylesheet\" href=\"{$base}/" . htmlspecialchars($css, ENT_QUOTES) . "\">\n";
        }
        if (!empty($entry['file'])) {
            echo "<script type=\"module\" src=\"{$base}/"
                . htmlspecialchars($entry['file'], ENT_QUOTES) . "\"></script>\n";
        }
    }

    /**
     * Render a mount point for a React island. The bundle picks it up on load
     * (or call window.HcwUi.mountAll() after injecting markup via AJAX).
     */
    function hcw_ui_island(string $name, array $props = [], array $attrs = []): void
    {
        $json = json_encode($props, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        $extra = '';
        foreach ($attrs as $k => $v) {
            $extra .= ' ' . htmlspecialchars($k, ENT_QUOTES)
                . '="' . htmlspecialchars((string) $v, ENT_QUOTES) . '"';
        }
        echo '<div data-hcw-island="' . htmlspecialchars($name, ENT_QUOTES) . '"'
            . ' data-hcw-props="' . htmlspecialchars((string) $json, ENT_QUOTES) . '"'
            . $extra . "></div>\n";
    }
}
