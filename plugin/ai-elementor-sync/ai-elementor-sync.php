<?php
/**
 * Plugin Name: AI Elementor Sync
 * Plugin URI: https://github.com/ai-elementor-sync
 * Description: REST API bridge for AI-powered Elementor template management. Includes Schema Engine for comprehensive JSON-LD structured data (Google Knowledge Panel, Rich Results, AI engines). Supports Iconify icons in Elementor via custom widget. Developed for Deshtech Global Pvt Ltd.
 * Version: 1.8.0
 * Author: Dr. Dinu Sri Madusanka
 * Author URI: https://deshtech.co
 * License: GPL v2 or later
 * Requires PHP: 7.4
 * Requires at least: 5.6
 */


if (!defined('ABSPATH')) {
    exit;
}

// Load Iconify support (enqueue script)
require_once __DIR__ . '/iconify-support.php';
// Register Iconify Elementor widget
require_once __DIR__ . '/iconify-elementor-widget.php';
// Schema Engine — comprehensive JSON-LD structured data
require_once __DIR__ . '/schema-engine.php';

define('AI_ELEMENTOR_SYNC_VERSION', '1.8.0');
define('AI_ELEMENTOR_SYNC_LOG_DIR', WP_CONTENT_DIR . '/ai-sync-logs');

class AI_Elementor_Sync {

    private static $instance = null;
    private $log_file;

    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        // Ensure log directory exists
        if (!file_exists(AI_ELEMENTOR_SYNC_LOG_DIR)) {
            wp_mkdir_p(AI_ELEMENTOR_SYNC_LOG_DIR);
            // Protect logs from web access
            file_put_contents(AI_ELEMENTOR_SYNC_LOG_DIR . '/.htaccess', 'Deny from all');
            file_put_contents(AI_ELEMENTOR_SYNC_LOG_DIR . '/index.php', '<?php // Silence is golden');
        }
        $this->log_file = AI_ELEMENTOR_SYNC_LOG_DIR . '/sync-' . date('Y-m-d') . '.log';

        add_action('rest_api_init', [$this, 'register_routes']);
        add_action('admin_menu', [$this, 'add_admin_menu']);
        add_action('admin_init', [$this, 'register_settings']);
        register_activation_hook(__FILE__, [$this, 'activate']);

        // Register global error handler for REST API requests
        add_filter('rest_request_before_callbacks', [$this, 'setup_error_capture'], 10, 3);

        // Initialize Schema Engine (JSON-LD structured data)
        AI_Schema_Engine::get_instance();
    }

    /**
     * Log a message to the daily log file
     */
    private function log($level, $message, $context = []) {
        $timestamp = date('Y-m-d H:i:s');
        $context_str = !empty($context) ? ' | ' . wp_json_encode($context, JSON_UNESCAPED_SLASHES) : '';
        $entry = "[{$timestamp}] [{$level}] {$message}{$context_str}\n";
        error_log($entry, 3, $this->log_file);
    }

    /**
     * Capture PHP errors during REST API execution
     */
    public function setup_error_capture($response, $handler, $request) {
        // Only capture errors for our plugin's routes
        if (strpos($request->get_route(), '/ai-elementor/') === false) {
            return $response;
        }

        set_error_handler(function($errno, $errstr, $errfile, $errline) {
            $this->log('PHP_ERROR', $errstr, [
                'errno' => $errno,
                'file'  => $errfile,
                'line'  => $errline,
            ]);
            return false; // Let PHP handle it normally too
        });

        return $response;
    }

    /**
     * On activation, generate a unique API key
     */
    public function activate() {
        if (!get_option('ai_elementor_sync_api_key')) {
            update_option('ai_elementor_sync_api_key', wp_generate_password(40, false));
        }
    }

    /**
     * Admin menu page to view/regenerate API key
     */
    public function add_admin_menu() {
        add_options_page(
            'AI Elementor Sync',
            'AI Elementor Sync',
            'manage_options',
            'ai-elementor-sync',
            [$this, 'render_settings_page']
        );
    }

    public function register_settings() {
        register_setting('ai_elementor_sync', 'ai_elementor_sync_api_key');
    }

    public function render_settings_page() {
        $api_key = get_option('ai_elementor_sync_api_key');
        ?>
        <div class="wrap">
            <h1>AI Elementor Sync</h1>
            <p>Use this API key to connect your AI tools to this WordPress site.</p>

            <table class="form-table">
                <tr>
                    <th>API Key</th>
                    <td>
                        <input type="text" value="<?php echo esc_attr($api_key); ?>" class="regular-text" readonly id="api-key-field" />
                        <button type="button" class="button" onclick="navigator.clipboard.writeText(document.getElementById('api-key-field').value).then(()=>alert('Copied!'))">Copy</button>
                    </td>
                </tr>
                <tr>
                    <th>Site URL</th>
                    <td><code><?php echo esc_html(rest_url('ai-elementor/v1/')); ?></code></td>
                </tr>
                <tr>
                    <th>Status</th>
                    <td>
                        <?php if (class_exists('\Elementor\Plugin')): ?>
                            <span style="color: green;">&#10004; Elementor is active</span>
                        <?php else: ?>
                            <span style="color: red;">&#10008; Elementor is NOT active — plugin requires Elementor</span>
                        <?php endif; ?>
                    </td>
                </tr>
            </table>

            <form method="post" action="">
                <?php wp_nonce_field('ai_elementor_regenerate_key'); ?>
                <p>
                    <input type="submit" name="regenerate_key" class="button button-secondary" value="Regenerate API Key" />
                </p>
            </form>

            <hr />
            <h2>Quick Test</h2>
            <p>Run this in PowerShell to verify the connection:</p>
            <pre style="background:#23282d;color:#eee;padding:15px;border-radius:4px;max-width:800px;">
$headers = @{ "X-API-Key" = "<?php echo esc_html($api_key); ?>" }
Invoke-RestMethod -Uri "<?php echo esc_html(rest_url('ai-elementor/v1/status')); ?>" -Headers $headers
            </pre>
        </div>
        <?php

        // Handle key regeneration
        if (isset($_POST['regenerate_key']) && wp_verify_nonce($_POST['_wpnonce'], 'ai_elementor_regenerate_key')) {
            $new_key = wp_generate_password(40, false);
            update_option('ai_elementor_sync_api_key', $new_key);
            echo '<script>location.reload();</script>';
        }
    }

    /**
     * Authenticate API requests via X-API-Key header
     */
    private function authenticate($request) {
        $provided_key = $request->get_header('X-API-Key');
        $stored_key = get_option('ai_elementor_sync_api_key');

        if (empty($provided_key) || $provided_key !== $stored_key) {
            return new WP_Error('unauthorized', 'Invalid or missing API key', ['status' => 401]);
        }

        return true;
    }

    /**
     * Permission callback for all routes
     */
    public function permission_check($request) {
        $auth = $this->authenticate($request);
        if (is_wp_error($auth)) {
            return $auth;
        }
        return true;
    }

    /**
     * Register all REST API routes
     */
    public function register_routes() {
        $namespace = 'ai-elementor/v1';

        // Status check
        register_rest_route($namespace, '/status', [
            'methods'  => 'GET',
            'callback' => [$this, 'get_status'],
            'permission_callback' => [$this, 'permission_check'],
        ]);

        // Create a new page/template
        register_rest_route($namespace, '/pages', [
            'methods'  => 'POST',
            'callback' => [$this, 'create_page'],
            'permission_callback' => [$this, 'permission_check'],
        ]);

        // Update an existing page
        register_rest_route($namespace, '/pages/(?P<id>\d+)', [
            'methods'  => 'PUT',
            'callback' => [$this, 'update_page'],
            'permission_callback' => [$this, 'permission_check'],
        ]);

        // Get page info
        register_rest_route($namespace, '/pages/(?P<id>\d+)', [
            'methods'  => 'GET',
            'callback' => [$this, 'get_page'],
            'permission_callback' => [$this, 'permission_check'],
        ]);

        // List all Elementor pages
        register_rest_route($namespace, '/pages', [
            'methods'  => 'GET',
            'callback' => [$this, 'list_pages'],
            'permission_callback' => [$this, 'permission_check'],
        ]);

        // Delete a page
        register_rest_route($namespace, '/pages/(?P<id>\d+)', [
            'methods'  => 'DELETE',
            'callback' => [$this, 'delete_page'],
            'permission_callback' => [$this, 'permission_check'],
        ]);

        // Bulk create/update multiple pages
        register_rest_route($namespace, '/pages/bulk', [
            'methods'  => 'POST',
            'callback' => [$this, 'bulk_create_pages'],
            'permission_callback' => [$this, 'permission_check'],
        ]);

        // Import Elementor template (same format as Elementor export)
        register_rest_route($namespace, '/templates', [
            'methods'  => 'POST',
            'callback' => [$this, 'import_template'],
            'permission_callback' => [$this, 'permission_check'],
        ]);

        // List templates
        register_rest_route($namespace, '/templates', [
            'methods'  => 'GET',
            'callback' => [$this, 'list_templates'],
            'permission_callback' => [$this, 'permission_check'],
        ]);

        // Get site info (theme, active plugins, etc.)
        register_rest_route($namespace, '/site-info', [
            'methods'  => 'GET',
            'callback' => [$this, 'get_site_info'],
            'permission_callback' => [$this, 'permission_check'],
        ]);

        // Diagnostics — full system health check
        register_rest_route($namespace, '/diagnostics', [
            'methods'  => 'GET',
            'callback' => [$this, 'run_diagnostics'],
            'permission_callback' => [$this, 'permission_check'],
        ]);

        // Retrieve error logs
        register_rest_route($namespace, '/logs', [
            'methods'  => 'GET',
            'callback' => [$this, 'get_logs'],
            'permission_callback' => [$this, 'permission_check'],
        ]);

        // Clear error logs
        register_rest_route($namespace, '/logs', [
            'methods'  => 'DELETE',
            'callback' => [$this, 'clear_logs'],
            'permission_callback' => [$this, 'permission_check'],
        ]);

        // Test a specific operation without side effects
        register_rest_route($namespace, '/test', [
            'methods'  => 'POST',
            'callback' => [$this, 'run_test'],
            'permission_callback' => [$this, 'permission_check'],
        ]);

        // Clear all Elementor caches (CSS, conditions)
        register_rest_route($namespace, '/clear-cache', [
            'methods'  => 'POST',
            'callback' => [$this, 'clear_elementor_cache'],
            'permission_callback' => [$this, 'permission_check'],
        ]);

        // ---------------------------------------------------------------
        // WooCommerce SEO endpoints (v1.3.0)
        // ---------------------------------------------------------------

        // List WooCommerce product categories with descriptions and SEO meta
        register_rest_route($namespace, '/wc-categories', [
            'methods'             => 'GET',
            'callback'            => [$this, 'list_wc_categories'],
            'permission_callback' => [$this, 'permission_check'],
        ]);

        // Update WC category description + SiteSEO meta
        register_rest_route($namespace, '/wc-categories/(?P<id>\d+)', [
            'methods'             => 'PUT',
            'callback'            => [$this, 'update_wc_category'],
            'permission_callback' => [$this, 'permission_check'],
        ]);

        // Update WC product description + SiteSEO meta
        register_rest_route($namespace, '/wc-products/(?P<id>\d+)', [
            'methods'             => 'PUT',
            'callback'            => [$this, 'update_wc_product'],
            'permission_callback' => [$this, 'permission_check'],
        ]);

        // List all WooCommerce products with IDs, slugs, and SEO meta
        register_rest_route($namespace, '/wc-products', [
            'methods'             => 'GET',
            'callback'            => [$this, 'list_wc_products'],
            'permission_callback' => [$this, 'permission_check'],
        ]);

        // ---------------------------------------------------------------
        // Blog Post Management endpoints (v1.4.0)
        // ---------------------------------------------------------------

        // List blog posts
        register_rest_route($namespace, '/blog-posts', [
            'methods'  => 'GET',
            'callback' => [$this, 'list_blog_posts'],
            'permission_callback' => [$this, 'permission_check'],
        ]);

        // Create blog post
        register_rest_route($namespace, '/blog-posts', [
            'methods'  => 'POST',
            'callback' => [$this, 'create_blog_post'],
            'permission_callback' => [$this, 'permission_check'],
        ]);

        // Get single blog post
        register_rest_route($namespace, '/blog-posts/(?P<id>\d+)', [
            'methods'  => 'GET',
            'callback' => [$this, 'get_blog_post'],
            'permission_callback' => [$this, 'permission_check'],
        ]);

        // Update blog post
        register_rest_route($namespace, '/blog-posts/(?P<id>\d+)', [
            'methods'  => 'PUT',
            'callback' => [$this, 'update_blog_post'],
            'permission_callback' => [$this, 'permission_check'],
        ]);

        // Delete blog post
        register_rest_route($namespace, '/blog-posts/(?P<id>\d+)', [
            'methods'  => 'DELETE',
            'callback' => [$this, 'delete_blog_post'],
            'permission_callback' => [$this, 'permission_check'],
        ]);

        // List blog categories
        register_rest_route($namespace, '/blog-categories', [
            'methods'  => 'GET',
            'callback' => [$this, 'list_blog_categories'],
            'permission_callback' => [$this, 'permission_check'],
        ]);

        // Create blog category
        register_rest_route($namespace, '/blog-categories', [
            'methods'  => 'POST',
            'callback' => [$this, 'create_blog_category'],
            'permission_callback' => [$this, 'permission_check'],
        ]);

        // Sideload media from URL
        register_rest_route($namespace, '/media/sideload', [
            'methods'  => 'POST',
            'callback' => [$this, 'sideload_media'],
            'permission_callback' => [$this, 'permission_check'],
        ]);

        // Upload media from base64 data
        register_rest_route($namespace, '/media/upload', [
            'methods'  => 'POST',
            'callback' => [$this, 'upload_media_base64'],
            'permission_callback' => [$this, 'permission_check'],
        ]);

        // Set featured image on a post
        register_rest_route($namespace, '/posts/(?P<id>\d+)/featured-image', [
            'methods'  => 'PUT',
            'callback' => [$this, 'set_featured_image'],
            'permission_callback' => [$this, 'permission_check'],
        ]);
    }

    /**
     * POST /clear-cache — Clear Elementor CSS and conditions caches
     */
    public function clear_elementor_cache($request) {
        $this->log('INFO', 'Clearing all Elementor caches');
        $results = [];

        // Clear CSS cache
        if (class_exists('\Elementor\Plugin')) {
            \Elementor\Plugin::$instance->files_manager->clear_cache();
            $results['css_cache'] = 'cleared';
            $this->log('INFO', 'Elementor CSS cache cleared');
        }

        // Regenerate conditions cache
        if (class_exists('\ElementorPro\Modules\ThemeBuilder\Module')) {
            try {
                $theme_builder = \ElementorPro\Modules\ThemeBuilder\Module::instance();
                if (method_exists($theme_builder, 'get_conditions_manager')) {
                    $theme_builder->get_conditions_manager()->get_cache()->regenerate();
                    $results['conditions_cache'] = 'regenerated';
                    $this->log('INFO', 'Elementor conditions cache regenerated');
                }
            } catch (\Exception $e) {
                $results['conditions_cache'] = 'error: ' . $e->getMessage();
                $this->log('WARN', 'Failed to regenerate conditions cache', ['error' => $e->getMessage()]);
            }
        }

        // Clear WordPress object cache
        wp_cache_flush();
        $results['wp_object_cache'] = 'flushed';

        return [
            'success'   => true,
            'timestamp' => date('Y-m-d H:i:s'),
            'results'   => $results,
        ];
    }

    /**
     * Generate a unique Elementor element ID
     */
    private function generate_element_id() {
        return substr(md5(uniqid(mt_rand(), true)), 0, 7);
    }

    /**
     * Recursively assign unique IDs to elements if missing
     */
    private function assign_element_ids($elements) {
        if (!is_array($elements)) {
            return $elements;
        }

        foreach ($elements as &$element) {
            if (!is_array($element)) {
                continue;
            }
            if (empty($element['id'])) {
                $element['id'] = $this->generate_element_id();
            }
            if (!empty($element['elements']) && is_array($element['elements'])) {
                $element['elements'] = $this->assign_element_ids($element['elements']);
            }
        }

        return $elements;
    }

    /**
     * GET /status — Health check
     */
    public function get_status($request) {
        $elementor_active = class_exists('\Elementor\Plugin');
        $elementor_pro = class_exists('\ElementorPro\Plugin');

        return [
            'status'        => 'connected',
            'plugin_version' => AI_ELEMENTOR_SYNC_VERSION,
            'wp_version'    => get_bloginfo('version'),
            'site_name'     => get_bloginfo('name'),
            'site_url'      => get_site_url(),
            'elementor'     => $elementor_active,
            'elementor_pro' => $elementor_pro,
            'php_version'   => phpversion(),
        ];
    }

    /**
     * POST /pages — Create a new Elementor page
     *
     * Body: {
     *   "title": "Page Title",
     *   "slug": "page-slug",              // optional
     *   "status": "draft|publish",         // default: draft
     *   "template": "elementor_canvas",    // default: elementor_canvas
     *   "elementor_data": [ ... ],         // Elementor JSON content
     *   "page_settings": { ... }           // optional Elementor page settings
     * }
     */
    public function create_page($request) {
        $data = $request->get_json_params();

        if (empty($data['title'])) {
            return new WP_Error('missing_title', 'Page title is required', ['status' => 400]);
        }

        $this->log('INFO', 'Creating page', ['title' => $data['title']]);

        try {
            $elementor_data = $data['elementor_data'] ?? [];

            // If elementor_data was sent as a JSON string, decode it
            if (is_string($elementor_data)) {
                $elementor_data = json_decode($elementor_data, true);
            }

            // Ensure it's a sequential array (not an associative object)
            if (is_array($elementor_data) && !isset($elementor_data[0]) && !empty($elementor_data)) {
                $elementor_data = [$elementor_data];
            }
            if (is_array($elementor_data)) {
                $elementor_data = array_values($elementor_data);
            }

            $elementor_data = $this->assign_element_ids($elementor_data);

            $post_args = [
                'post_title'   => sanitize_text_field($data['title']),
                'post_status'  => sanitize_text_field($data['status'] ?? 'draft'),
                'post_type'    => 'page',
            ];

            if (!empty($data['slug'])) {
                $post_args['post_name'] = sanitize_title($data['slug']);
            }

            $post_id = wp_insert_post($post_args, true);

            if (is_wp_error($post_id)) {
                $this->log('ERROR', 'wp_insert_post failed', ['error' => $post_id->get_error_message()]);
                return new WP_Error('create_failed', $post_id->get_error_message(), ['status' => 500]);
            }

            $this->log('INFO', 'Post created', ['post_id' => $post_id]);

            // Set Elementor metadata
            // CRITICAL: array_values ensures wp_json_encode produces [...] not {...}
            update_post_meta($post_id, '_elementor_data', wp_slash(wp_json_encode(array_values($elementor_data))));
            update_post_meta($post_id, '_elementor_edit_mode', 'builder');
            update_post_meta($post_id, '_elementor_template_type', 'wp-page');
            update_post_meta($post_id, '_elementor_version', '3.0.0');

            $template = sanitize_text_field($data['template'] ?? 'elementor_canvas');
            update_post_meta($post_id, '_wp_page_template', $template);

            // Page settings
            if (!empty($data['page_settings'])) {
                update_post_meta($post_id, '_elementor_page_settings', $data['page_settings']);
            }

            // Regenerate Elementor CSS for this post
            if (class_exists('\Elementor\Plugin')) {
                \Elementor\Plugin::$instance->files_manager->clear_cache();
                // Generate per-page CSS file (critical for frontend rendering)
                if (class_exists('\Elementor\Core\Files\CSS\Post')) {
                    $css_file = new \Elementor\Core\Files\CSS\Post($post_id);
                    $css_file->update();
                    $this->log('INFO', 'Post CSS regenerated', ['post_id' => $post_id]);
                }
            }

            $this->log('INFO', 'Page created successfully', ['post_id' => $post_id, 'title' => get_the_title($post_id)]);

            return [
                'success'  => true,
                'post_id'  => $post_id,
                'title'    => get_the_title($post_id),
                'url'      => get_permalink($post_id),
                'edit_url' => admin_url("post.php?post={$post_id}&action=elementor"),
            ];
        } catch (\Throwable $e) {
            $this->log('FATAL', 'Exception in create_page', [
                'message' => $e->getMessage(),
                'file'    => $e->getFile(),
                'line'    => $e->getLine(),
                'trace'   => array_slice(explode("\n", $e->getTraceAsString()), 0, 10),
            ]);
            return new WP_Error('create_exception', $e->getMessage(), ['status' => 500]);
        }
    }

    /**
     * PUT /pages/{id} — Update an existing Elementor page
     */
    public function update_page($request) {
        $post_id = (int) $request['id'];

        // WordPress REST API doesn't reliably parse large PUT JSON bodies
        // Use raw body parsing as primary method, with fallback to get_json_params()
        $data = $request->get_json_params();
        if (empty($data) || !is_array($data)) {
            $raw_body = $request->get_body();
            if (!empty($raw_body)) {
                $data = json_decode($raw_body, true);
            }
        }
        // Final fallback: read directly from php://input
        if (empty($data) || !is_array($data)) {
            $raw_input = file_get_contents('php://input');
            if (!empty($raw_input)) {
                $data = json_decode($raw_input, true);
            }
        }

        if (empty($data) || !is_array($data)) {
            return new WP_Error('invalid_body', 'Could not parse request body as JSON', ['status' => 400]);
        }

        $post = get_post($post_id);
        if (!$post) {
            return new WP_Error('not_found', 'Page not found', ['status' => 404]);
        }

        // Update post title/status if provided
        $update_args = ['ID' => $post_id];
        if (!empty($data['title'])) {
            $update_args['post_title'] = sanitize_text_field($data['title']);
        }
        if (!empty($data['status'])) {
            $update_args['post_status'] = sanitize_text_field($data['status']);
        }
        if (!empty($data['slug'])) {
            $update_args['post_name'] = sanitize_title($data['slug']);
        }

        wp_update_post($update_args);

        $elementor_updated = false;

        // Update Elementor data
        if (isset($data['elementor_data'])) {
            $elementor_data = $data['elementor_data'];

            // If elementor_data was sent as a JSON string, decode it
            if (is_string($elementor_data)) {
                $elementor_data = json_decode($elementor_data, true);
            }

            // Ensure it's a sequential array (not an associative object)
            if (is_array($elementor_data) && !isset($elementor_data[0]) && !empty($elementor_data)) {
                $elementor_data = [$elementor_data];
            }
            if (is_array($elementor_data)) {
                $elementor_data = array_values($elementor_data);
            }

            if (is_array($elementor_data)) {
                $elementor_data = $this->assign_element_ids($elementor_data);
                // CRITICAL: array_values ensures wp_json_encode produces [...] not {...}
                $json_str = wp_json_encode(array_values($elementor_data));
                update_post_meta($post_id, '_elementor_data', wp_slash($json_str));
                update_post_meta($post_id, '_elementor_edit_mode', 'builder');
                update_post_meta($post_id, '_elementor_template_type', 'wp-page');
                update_post_meta($post_id, '_elementor_version', '3.0.0');
                $elementor_updated = true;
            }
        }

        // Update template
        if (!empty($data['template'])) {
            update_post_meta($post_id, '_wp_page_template', sanitize_text_field($data['template']));
        }

        // Update page settings
        if (!empty($data['page_settings'])) {
            update_post_meta($post_id, '_elementor_page_settings', $data['page_settings']);
        }

        // Regenerate Elementor CSS for this post
        if (class_exists('\Elementor\Plugin')) {
            \Elementor\Plugin::$instance->files_manager->clear_cache();
            // Generate per-page CSS file (critical for frontend rendering)
            if ($elementor_updated && class_exists('\Elementor\Core\Files\CSS\Post')) {
                $css_file = new \Elementor\Core\Files\CSS\Post($post_id);
                $css_file->update();
            }
        }

        return [
            'success'          => true,
            'post_id'          => $post_id,
            'title'            => get_the_title($post_id),
            'url'              => get_permalink($post_id),
            'edit_url'         => admin_url("post.php?post={$post_id}&action=elementor"),
            'elementor_updated' => $elementor_updated,
            'data_elements'    => $elementor_updated ? count($elementor_data) : 0,
        ];
    }

    /**
     * GET /pages/{id} — Get page details and Elementor data
     */
    public function get_page($request) {
        $post_id = (int) $request['id'];
        $post = get_post($post_id);

        if (!$post) {
            return new WP_Error('not_found', 'Page not found', ['status' => 404]);
        }

        $elementor_data = get_post_meta($post_id, '_elementor_data', true);
        $page_settings = get_post_meta($post_id, '_elementor_page_settings', true);

        return [
            'post_id'        => $post_id,
            'title'          => $post->post_title,
            'slug'           => $post->post_name,
            'status'         => $post->post_status,
            'url'            => get_permalink($post_id),
            'edit_url'       => admin_url("post.php?post={$post_id}&action=elementor"),
            'template'       => get_post_meta($post_id, '_wp_page_template', true),
            'elementor_data' => json_decode($elementor_data, true),
            'page_settings'  => $page_settings,
            'modified'       => $post->post_modified,
        ];
    }

    /**
     * GET /pages — List all Elementor-built pages
     */
    public function list_pages($request) {
        $args = [
            'post_type'      => 'page',
            'posts_per_page' => -1,
            'meta_key'       => '_elementor_edit_mode',
            'meta_value'     => 'builder',
            'orderby'        => 'modified',
            'order'          => 'DESC',
        ];

        $status = $request->get_param('status');
        if ($status) {
            $args['post_status'] = $status;
        } else {
            $args['post_status'] = ['publish', 'draft', 'pending', 'private'];
        }

        $query = new WP_Query($args);
        $pages = [];

        foreach ($query->posts as $post) {
            $pages[] = [
                'post_id'  => $post->ID,
                'title'    => $post->post_title,
                'slug'     => $post->post_name,
                'status'   => $post->post_status,
                'url'      => get_permalink($post->ID),
                'edit_url' => admin_url("post.php?post={$post->ID}&action=elementor"),
                'modified' => $post->post_modified,
            ];
        }

        return [
            'total' => count($pages),
            'pages' => $pages,
        ];
    }

    /**
     * DELETE /pages/{id} — Delete a page or template
     */
    public function delete_page($request) {
        $post_id = (int) $request['id'];
        $post = get_post($post_id);

        if (!$post) {
            return new WP_Error('not_found', 'Page not found', ['status' => 404]);
        }

        // Check if this is an Elementor library template (header/footer/etc.)
        $is_template = ($post->post_type === 'elementor_library');
        $template_type = $is_template ? get_post_meta($post_id, '_elementor_template_type', true) : null;

        // Remove display conditions BEFORE deleting
        if ($is_template) {
            delete_post_meta($post_id, '_elementor_conditions');
            $this->log('INFO', 'Removed display conditions before delete', ['post_id' => $post_id, 'type' => $template_type]);
        }

        $force = $request->get_param('force') === 'true';
        $result = wp_delete_post($post_id, $force);

        if (!$result) {
            return new WP_Error('delete_failed', 'Failed to delete page', ['status' => 500]);
        }

        // Regenerate Elementor conditions cache after template deletion
        if ($is_template && class_exists('\ElementorPro\Modules\ThemeBuilder\Module')) {
            try {
                $theme_builder = \ElementorPro\Modules\ThemeBuilder\Module::instance();
                if (method_exists($theme_builder, 'get_conditions_manager')) {
                    $theme_builder->get_conditions_manager()->get_cache()->regenerate();
                    $this->log('INFO', 'Elementor conditions cache regenerated after delete');
                }
            } catch (\Exception $e) {
                $this->log('WARN', 'Failed to regenerate conditions cache after delete', ['error' => $e->getMessage()]);
            }
        }

        // Clear Elementor CSS cache
        if (class_exists('\Elementor\Plugin')) {
            \Elementor\Plugin::$instance->files_manager->clear_cache();
        }

        $this->log('INFO', 'Deleted post', ['post_id' => $post_id, 'type' => $template_type ?: 'page', 'action' => $force ? 'permanent' : 'trashed']);

        return [
            'success' => true,
            'post_id' => $post_id,
            'action'  => $force ? 'permanently_deleted' : 'trashed',
        ];
    }

    /**
     * POST /pages/bulk — Create/update multiple pages at once
     */
    public function bulk_create_pages($request) {
        $data = $request->get_json_params();
        $pages = $data['pages'] ?? [];
        $results = [];

        foreach ($pages as $page_data) {
            $sub_request = new WP_REST_Request('POST', '/ai-elementor/v1/pages');
            $sub_request->set_header('Content-Type', 'application/json');
            $sub_request->set_body(wp_json_encode($page_data));
            $sub_request->set_header('X-API-Key', $request->get_header('X-API-Key'));

            if (!empty($page_data['post_id'])) {
                // Update existing
                $sub_request = new WP_REST_Request('PUT', '/ai-elementor/v1/pages/' . $page_data['post_id']);
                $sub_request->set_header('Content-Type', 'application/json');
                $sub_request->set_body(wp_json_encode($page_data));
            }

            $response = $this->create_page($sub_request);
            if (!empty($page_data['post_id'])) {
                $sub_request->set_route('/ai-elementor/v1/pages/' . $page_data['post_id']);
                $sub_request['id'] = $page_data['post_id'];
                $response = $this->update_page($sub_request);
            }

            $results[] = $response;
        }

        return [
            'success' => true,
            'count'   => count($results),
            'results' => $results,
        ];
    }

    /**
     * POST /templates — Create an Elementor library template
     */
    public function import_template($request) {
        $data = $request->get_json_params();

        $title = sanitize_text_field($data['title'] ?? 'AI Template');
        $type = sanitize_text_field($data['type'] ?? 'page');

        $this->log('INFO', 'Creating template', ['title' => $title, 'type' => $type]);

        try {
            $elementor_data = $data['elementor_data'] ?? $data['content'] ?? [];

            // If elementor_data was sent as a JSON string, decode it
            if (is_string($elementor_data)) {
                $elementor_data = json_decode($elementor_data, true);
            }

            // Ensure it's a sequential array (not an associative object)
            // This fixes the bug where a single-element array gets decoded as an object
            if (is_array($elementor_data) && !isset($elementor_data[0]) && !empty($elementor_data)) {
                // It's an associative array (single element unwrapped) — wrap it back
                $elementor_data = [$elementor_data];
                $this->log('INFO', 'Wrapped single element into array');
            }
            if (is_array($elementor_data)) {
                $elementor_data = array_values($elementor_data);
            }

            $element_count = is_array($elementor_data) ? count($elementor_data) : 0;
            $this->log('INFO', 'Assigning element IDs', ['top_level_elements' => $element_count]);

            $elementor_data = $this->assign_element_ids($elementor_data);

            // Display conditions for header/footer templates
            $conditions = $data['conditions'] ?? [];

            $this->log('INFO', 'Inserting post into elementor_library');
            $post_id = wp_insert_post([
                'post_title'  => $title,
                'post_status' => 'publish',
                'post_type'   => 'elementor_library',
            ], true);

            if (is_wp_error($post_id)) {
                $this->log('ERROR', 'wp_insert_post failed for template', ['error' => $post_id->get_error_message()]);
                return new WP_Error('create_failed', $post_id->get_error_message(), ['status' => 500]);
            }

            $this->log('INFO', 'Template post created', ['post_id' => $post_id]);

            // CRITICAL: array_values ensures wp_json_encode produces [...] not {...}
            $json_data = wp_json_encode(array_values($elementor_data));
            $this->log('INFO', 'Elementor data JSON size', ['bytes' => strlen($json_data)]);

            update_post_meta($post_id, '_elementor_data', wp_slash($json_data));
            update_post_meta($post_id, '_elementor_edit_mode', 'builder');
            update_post_meta($post_id, '_elementor_template_type', $type);
            update_post_meta($post_id, '_elementor_version', '3.0.0');

            $this->log('INFO', 'Setting taxonomy terms', ['type' => $type]);
            $term_result = wp_set_object_terms($post_id, $type, 'elementor_library_type');
            if (is_wp_error($term_result)) {
                $this->log('ERROR', 'wp_set_object_terms failed', ['error' => $term_result->get_error_message()]);
            }

            // Set display conditions for Theme Builder templates
            if (!empty($conditions)) {
                update_post_meta($post_id, '_elementor_conditions', $conditions);
                $this->log('INFO', 'Set custom display conditions', ['conditions' => $conditions]);
            } elseif (in_array($type, ['header', 'footer', 'single', 'archive', 'single-post', 'error-404'])) {
                update_post_meta($post_id, '_elementor_conditions', ['include/general']);
                $this->log('INFO', 'Set default display conditions', ['conditions' => ['include/general']]);
            }

            // Refresh Elementor conditions cache if available
            if (class_exists('\ElementorPro\Modules\ThemeBuilder\Module')) {
                try {
                    $theme_builder = \ElementorPro\Modules\ThemeBuilder\Module::instance();
                    if (method_exists($theme_builder, 'get_conditions_manager')) {
                        $theme_builder->get_conditions_manager()->get_cache()->regenerate();
                        $this->log('INFO', 'Elementor conditions cache regenerated');
                    }
                } catch (\Exception $e) {
                    $this->log('WARN', 'Failed to regenerate conditions cache', ['error' => $e->getMessage()]);
                }
            }

            // Clear Elementor CSS cache
            if (class_exists('\Elementor\Plugin')) {
                \Elementor\Plugin::$instance->files_manager->clear_cache();
            }

            $this->log('INFO', 'Template created successfully', ['template_id' => $post_id, 'type' => $type]);

            return [
                'success'     => true,
                'template_id' => $post_id,
                'title'       => $title,
                'type'        => $type,
                'edit_url'    => admin_url("post.php?post={$post_id}&action=elementor"),
            ];
        } catch (\Throwable $e) {
            $this->log('FATAL', 'Exception in import_template', [
                'message' => $e->getMessage(),
                'file'    => $e->getFile(),
                'line'    => $e->getLine(),
                'trace'   => array_slice(explode("\n", $e->getTraceAsString()), 0, 10),
            ]);
            return new WP_Error('template_exception', $e->getMessage(), ['status' => 500]);
        }
    }

    /**
     * GET /templates — List all Elementor library templates
     */
    public function list_templates($request) {
        $args = [
            'post_type'      => 'elementor_library',
            'posts_per_page' => -1,
            'post_status'    => 'publish',
            'orderby'        => 'modified',
            'order'          => 'DESC',
        ];

        $type = $request->get_param('type');
        if ($type) {
            $args['tax_query'] = [[
                'taxonomy' => 'elementor_library_type',
                'field'    => 'slug',
                'terms'    => $type,
            ]];
        }

        $query = new WP_Query($args);
        $templates = [];

        foreach ($query->posts as $post) {
            $templates[] = [
                'template_id' => $post->ID,
                'title'       => $post->post_title,
                'type'        => get_post_meta($post->ID, '_elementor_template_type', true),
                'edit_url'    => admin_url("post.php?post={$post->ID}&action=elementor"),
                'modified'    => $post->post_modified,
            ];
        }

        return [
            'total'     => count($templates),
            'templates' => $templates,
        ];
    }

    /**
     * GET /site-info — Get WordPress/Elementor site information
     */
    public function get_site_info($request) {
        $theme = wp_get_theme();
        $active_plugins = get_option('active_plugins', []);

        $plugins = [];
        foreach ($active_plugins as $plugin) {
            $plugin_data = get_plugin_data(WP_PLUGIN_DIR . '/' . $plugin);
            $plugins[] = [
                'name'    => $plugin_data['Name'],
                'version' => $plugin_data['Version'],
            ];
        }

        return [
            'site_name'   => get_bloginfo('name'),
            'site_url'    => get_site_url(),
            'wp_version'  => get_bloginfo('version'),
            'php_version' => phpversion(),
            'theme'       => [
                'name'    => $theme->get('Name'),
                'version' => $theme->get('Version'),
                'parent'  => $theme->parent() ? $theme->parent()->get('Name') : null,
            ],
            'plugins'     => $plugins,
            'elementor'   => class_exists('\Elementor\Plugin'),
            'elementor_pro' => class_exists('\ElementorPro\Plugin'),
            'memory_limit'  => ini_get('memory_limit'),
            'max_upload'    => size_format(wp_max_upload_size()),
        ];
    }

    /**
     * GET /diagnostics — Full system health check for debugging
     */
    public function run_diagnostics($request) {
        $this->log('INFO', 'Running diagnostics');
        $checks = [];

        // 1. PHP Environment
        $checks['php'] = [
            'version'         => phpversion(),
            'memory_limit'    => ini_get('memory_limit'),
            'memory_usage'    => size_format(memory_get_usage(true)),
            'memory_peak'     => size_format(memory_get_peak_usage(true)),
            'max_execution'   => ini_get('max_execution_time'),
            'max_input_vars'  => ini_get('max_input_vars'),
            'post_max_size'   => ini_get('post_max_size'),
            'upload_max_size' => ini_get('upload_max_filesize'),
            'error_reporting' => ini_get('error_reporting'),
            'display_errors'  => ini_get('display_errors'),
        ];

        // 2. WordPress
        global $wpdb;
        $checks['wordpress'] = [
            'version'      => get_bloginfo('version'),
            'debug_mode'   => defined('WP_DEBUG') && WP_DEBUG,
            'debug_log'    => defined('WP_DEBUG_LOG') && WP_DEBUG_LOG,
            'site_url'     => get_site_url(),
            'active_theme' => wp_get_theme()->get('Name'),
            'db_prefix'    => $wpdb->prefix,
            'is_multisite' => is_multisite(),
        ];

        // 3. Elementor
        $elementor_ok = class_exists('\Elementor\Plugin');
        $elementor_pro_ok = class_exists('\ElementorPro\Plugin');
        $checks['elementor'] = [
            'installed'     => $elementor_ok,
            'pro_installed' => $elementor_pro_ok,
            'version'       => $elementor_ok ? ELEMENTOR_VERSION : null,
            'pro_version'   => $elementor_pro_ok && defined('ELEMENTOR_PRO_VERSION') ? ELEMENTOR_PRO_VERSION : null,
        ];

        // 4. Elementor Library taxonomy check
        $taxonomy_exists = taxonomy_exists('elementor_library_type');
        $checks['elementor_library'] = [
            'taxonomy_registered' => $taxonomy_exists,
            'post_type_exists'    => post_type_exists('elementor_library'),
        ];

        if ($taxonomy_exists) {
            $terms = get_terms(['taxonomy' => 'elementor_library_type', 'hide_empty' => false]);
            $checks['elementor_library']['registered_types'] = is_array($terms) ? array_map(function($t) { return $t->slug; }, $terms) : [];
        }

        // 5. Theme Builder check (Elementor Pro)
        $checks['theme_builder'] = ['available' => false];
        if ($elementor_pro_ok && class_exists('\ElementorPro\Modules\ThemeBuilder\Module')) {
            $checks['theme_builder']['available'] = true;
            try {
                $theme_builder = \ElementorPro\Modules\ThemeBuilder\Module::instance();
                $conditions_manager = $theme_builder->get_conditions_manager();
                $checks['theme_builder']['conditions_manager'] = true;

                // List active theme builder templates
                $theme_templates = get_posts([
                    'post_type'      => 'elementor_library',
                    'posts_per_page' => -1,
                    'post_status'    => 'publish',
                    'meta_query'     => [
                        ['key' => '_elementor_template_type', 'value' => ['header', 'footer', 'single', 'archive', 'error-404'], 'compare' => 'IN'],
                    ],
                ]);
                $active_templates = [];
                foreach ($theme_templates as $tmpl) {
                    $conditions = get_post_meta($tmpl->ID, '_elementor_conditions', true);
                    $active_templates[] = [
                        'id'         => $tmpl->ID,
                        'title'      => $tmpl->post_title,
                        'type'       => get_post_meta($tmpl->ID, '_elementor_template_type', true),
                        'conditions' => $conditions ?: 'none',
                    ];
                }
                $checks['theme_builder']['active_templates'] = $active_templates;
            } catch (\Throwable $e) {
                $checks['theme_builder']['error'] = $e->getMessage();
            }
        }

        // 6. WP Debug log (last 50 lines)
        $wp_debug_log = WP_CONTENT_DIR . '/debug.log';
        $checks['wp_debug_log'] = ['exists' => file_exists($wp_debug_log)];
        if (file_exists($wp_debug_log)) {
            $checks['wp_debug_log']['size'] = size_format(filesize($wp_debug_log));
            $lines = file($wp_debug_log, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            $checks['wp_debug_log']['last_50_lines'] = array_slice($lines, -50);
        }

        // 7. Plugin sync logs
        $checks['sync_logs'] = ['dir_exists' => file_exists(AI_ELEMENTOR_SYNC_LOG_DIR)];
        if (file_exists(AI_ELEMENTOR_SYNC_LOG_DIR)) {
            $log_files = glob(AI_ELEMENTOR_SYNC_LOG_DIR . '/sync-*.log');
            $checks['sync_logs']['files'] = [];
            foreach ($log_files as $lf) {
                $checks['sync_logs']['files'][] = [
                    'name' => basename($lf),
                    'size' => size_format(filesize($lf)),
                ];
            }
        }

        // 8. Disk space
        $checks['disk'] = [
            'free_space'  => size_format(disk_free_space(ABSPATH)),
            'uploads_dir' => [
                'path'     => wp_upload_dir()['basedir'],
                'writable' => is_writable(wp_upload_dir()['basedir']),
            ],
        ];

        // 9. REST API health
        $checks['rest_api'] = [
            'url'    => rest_url('ai-elementor/v1/'),
            'prefix' => rest_get_url_prefix(),
        ];

        $this->log('INFO', 'Diagnostics complete');

        return [
            'success'     => true,
            'timestamp'   => date('Y-m-d H:i:s'),
            'diagnostics' => $checks,
        ];
    }

    /**
     * GET /logs — Retrieve sync log entries
     * Params: ?date=YYYY-MM-DD (default: today), ?lines=50 (default: 50), ?level=ERROR (filter by level)
     */
    public function get_logs($request) {
        $date = $request->get_param('date') ?: date('Y-m-d');
        $max_lines = (int) ($request->get_param('lines') ?: 50);
        $level_filter = $request->get_param('level') ?: null;

        $log_file = AI_ELEMENTOR_SYNC_LOG_DIR . '/sync-' . $date . '.log';

        if (!file_exists($log_file)) {
            // List available log files
            $available = [];
            $log_files = glob(AI_ELEMENTOR_SYNC_LOG_DIR . '/sync-*.log');
            foreach ($log_files as $lf) {
                $available[] = basename($lf, '.log');
            }
            return [
                'success'   => false,
                'message'   => "No log file found for date: {$date}",
                'available' => $available,
            ];
        }

        $lines = file($log_file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

        // Filter by level if specified
        if ($level_filter) {
            $level_filter = strtoupper($level_filter);
            $lines = array_values(array_filter($lines, function($line) use ($level_filter) {
                return strpos($line, "[{$level_filter}]") !== false;
            }));
        }

        // Return last N lines
        $lines = array_slice($lines, -$max_lines);

        return [
            'success'  => true,
            'date'     => $date,
            'total'    => count($lines),
            'entries'  => $lines,
        ];
    }

    /**
     * DELETE /logs — Clear all log files
     */
    public function clear_logs($request) {
        $log_files = glob(AI_ELEMENTOR_SYNC_LOG_DIR . '/sync-*.log');
        $cleared = 0;

        foreach ($log_files as $lf) {
            if (unlink($lf)) {
                $cleared++;
            }
        }

        $this->log('INFO', 'Logs cleared', ['files_deleted' => $cleared]);

        return [
            'success' => true,
            'cleared' => $cleared,
        ];
    }

    /**
     * POST /test — Run a specific test to verify functionality
     * Body: { "test": "template_create" | "elementor_check" | "memory" | "json_parse" }
     */
    public function run_test($request) {
        $data = $request->get_json_params();
        $test_name = $data['test'] ?? 'all';
        $results = [];

        $this->log('INFO', 'Running test', ['test' => $test_name]);

        try {
            // Test: Elementor environment
            if ($test_name === 'all' || $test_name === 'elementor_check') {
                $el = class_exists('\Elementor\Plugin');
                $elp = class_exists('\ElementorPro\Plugin');
                $lpt = post_type_exists('elementor_library');
                $ltx = taxonomy_exists('elementor_library_type');
                $results['elementor_check'] = [
                    'success'              => $el && $lpt && $ltx,
                    'elementor_loaded'     => $el,
                    'elementor_pro_loaded' => $elp,
                    'library_post_type'    => $lpt,
                    'library_taxonomy'     => $ltx,
                ];
            }

            // Test: Template creation (dry-run — creates and immediately deletes)
            if ($test_name === 'all' || $test_name === 'template_create') {
                $test_post_id = wp_insert_post([
                    'post_title'  => '__ai_sync_test_' . time(),
                    'post_status' => 'draft',
                    'post_type'   => 'elementor_library',
                ], true);

                if (is_wp_error($test_post_id)) {
                    $results['template_create'] = [
                        'success' => false,
                        'error'   => $test_post_id->get_error_message(),
                    ];
                } else {
                    // Try setting meta and taxonomy
                    $meta_ok = update_post_meta($test_post_id, '_elementor_template_type', 'section');
                    $term_result = wp_set_object_terms($test_post_id, 'section', 'elementor_library_type');
                    $term_ok = !is_wp_error($term_result);

                    // Try setting conditions
                    $conditions_ok = update_post_meta($test_post_id, '_elementor_conditions', ['include/general']);

                    // Clean up
                    wp_delete_post($test_post_id, true);

                    $results['template_create'] = [
                        'success'         => true,
                        'post_created'    => true,
                        'meta_saved'      => (bool) $meta_ok,
                        'taxonomy_set'    => $term_ok,
                        'taxonomy_error'  => is_wp_error($term_result) ? $term_result->get_error_message() : null,
                        'conditions_set'  => (bool) $conditions_ok,
                        'cleanup'         => true,
                    ];
                }
            }

            // Test: Memory available for large JSON
            if ($test_name === 'all' || $test_name === 'memory') {
                $before = memory_get_usage(true);
                // Simulate a large JSON payload (~500KB)
                $items = array_fill(0, 1000, '{"elType":"container","settings":{},"elements":[]}');
                $test_data = '[' . implode(',', $items) . ']';
                $parsed = json_decode($test_data, true);
                $after = memory_get_usage(true);

                $results['memory'] = [
                    'success'          => $parsed !== null,
                    'memory_before'    => size_format($before),
                    'memory_after'     => size_format($after),
                    'memory_used'      => size_format($after - $before),
                    'memory_limit'     => ini_get('memory_limit'),
                    'memory_remaining' => size_format($this->get_memory_limit_bytes() - $after),
                ];
                unset($test_data, $parsed);
            }

            // Test: JSON parsing from request body
            if ($test_name === 'json_parse') {
                $test_payload = $data['payload'] ?? null;
                if ($test_payload) {
                    $json_str = wp_json_encode($test_payload);
                    $results['json_parse'] = [
                        'success'       => true,
                        'payload_size'  => strlen($json_str) . ' bytes',
                        'element_count' => is_array($test_payload) ? count($test_payload) : 'not_array',
                    ];
                } else {
                    $results['json_parse'] = [
                        'success' => true,
                        'note'    => 'No payload provided. Send {"test":"json_parse","payload":[...]} to test.',
                    ];
                }
            }

        } catch (\Throwable $e) {
            $this->log('FATAL', 'Exception in run_test', [
                'test'    => $test_name,
                'message' => $e->getMessage(),
                'file'    => $e->getFile(),
                'line'    => $e->getLine(),
            ]);
            $results['exception'] = [
                'message' => $e->getMessage(),
                'file'    => basename($e->getFile()),
                'line'    => $e->getLine(),
            ];
        }

        return [
            'success'   => true,
            'timestamp' => date('Y-m-d H:i:s'),
            'tests'     => $results,
        ];
    }

    /**
     * GET /wc-categories — List all WooCommerce product categories with current descriptions and SEO meta
     */
    public function list_wc_categories($request) {
        $this->log('INFO', 'Listing WooCommerce product categories');

        if (!function_exists('get_terms')) {
            return new WP_Error('wc_missing', 'WooCommerce not available', ['status' => 500]);
        }

        $terms = get_terms([
            'taxonomy'   => 'product_cat',
            'hide_empty' => false,
        ]);

        if (is_wp_error($terms)) {
            return new WP_Error('wc_categories_error', 'Failed to retrieve categories: ' . $terms->get_error_message(), ['status' => 500]);
        }

        $categories = [];
        foreach ($terms as $term) {
            $seo_title = get_term_meta($term->term_id, '_seopress_titles_title', true);
            $seo_desc  = get_term_meta($term->term_id, '_seopress_titles_desc', true);

            $categories[] = [
                'id'              => $term->term_id,
                'name'            => $term->name,
                'slug'            => $term->slug,
                'count'           => (int) $term->count,
                'description'     => $term->description,
                'seo_title'       => $seo_title ?: '',
                'seo_description' => $seo_desc ?: '',
            ];
        }

        return [
            'success'    => true,
            'count'      => count($categories),
            'categories' => $categories,
        ];
    }

    /**
     * PUT /wc-categories/{id} — Update WooCommerce category description and SiteSEO meta
     * Body: { "description": "...", "seo_title": "...", "seo_description": "..." }
     */
    public function update_wc_category($request) {
        $term_id = (int) $request['id'];
        $params  = $request->get_json_params();

        $this->log('INFO', 'Updating WC category', ['term_id' => $term_id]);

        if (!$params) {
            return new WP_Error('invalid_params', 'Request body must be valid JSON', ['status' => 400]);
        }

        $term = get_term($term_id, 'product_cat');
        if (!$term || is_wp_error($term)) {
            return new WP_Error('not_found', 'Product category not found (id: ' . $term_id . ')', ['status' => 404]);
        }

        $results = [];

        // Update the category description
        if (isset($params['description'])) {
            $update = wp_update_term($term_id, 'product_cat', [
                'description' => wp_kses_post($params['description']),
            ]);
            if (is_wp_error($update)) {
                return new WP_Error('update_failed', 'Failed to update category description: ' . $update->get_error_message(), ['status' => 500]);
            }
            $results['description'] = 'updated';
            $this->log('INFO', 'Category description updated', ['term_id' => $term_id]);
        }

        // Update SiteSEO meta title
        if (isset($params['seo_title'])) {
            update_term_meta($term_id, '_seopress_titles_title', sanitize_text_field($params['seo_title']));
            $results['seo_title'] = 'updated';
        }

        // Update SiteSEO meta description
        if (isset($params['seo_description'])) {
            update_term_meta($term_id, '_seopress_titles_desc', sanitize_textarea_field($params['seo_description']));
            $results['seo_description'] = 'updated';
        }

        $this->log('INFO', 'WC category update complete', ['term_id' => $term_id, 'results' => $results]);

        return [
            'success'   => true,
            'term_id'   => $term_id,
            'name'      => $term->name,
            'slug'      => $term->slug,
            'updated'   => $results,
            'timestamp' => date('Y-m-d H:i:s'),
        ];
    }

    /**
     * PUT /wc-products/{id} — Update WooCommerce product descriptions and SiteSEO meta
     * Body: { "description": "...", "short_description": "...", "seo_title": "...", "seo_description": "..." }
     */
    public function update_wc_product($request) {
        $post_id = (int) $request['id'];
        $params  = $request->get_json_params();

        $this->log('INFO', 'Updating WC product', ['post_id' => $post_id]);

        if (!$params) {
            return new WP_Error('invalid_params', 'Request body must be valid JSON', ['status' => 400]);
        }

        $post = get_post($post_id);
        if (!$post || $post->post_type !== 'product') {
            return new WP_Error('not_found', 'Product not found (id: ' . $post_id . ')', ['status' => 404]);
        }

        $update_args = ['ID' => $post_id];
        $results     = [];

        // Update main product description (post_content)
        if (isset($params['description'])) {
            $update_args['post_content'] = wp_kses_post($params['description']);
            $results['description'] = 'updated';
        }

        // Update short description (post_excerpt)
        if (isset($params['short_description'])) {
            $update_args['post_excerpt'] = wp_kses_post($params['short_description']);
            $results['short_description'] = 'updated';
        }

        if (count($update_args) > 1) {
            $updated = wp_update_post(wp_slash($update_args), true);
            if (is_wp_error($updated)) {
                return new WP_Error('update_failed', 'Failed to update product: ' . $updated->get_error_message(), ['status' => 500]);
            }
        }

        // Update total_sales (sold count)
        if (isset($params['total_sales'])) {
            $sales = max(0, (int) $params['total_sales']);
            update_post_meta($post_id, 'total_sales', $sales);
            $results['total_sales'] = $sales;
        }

        // Update SiteSEO meta title
        if (isset($params['seo_title'])) {
            update_post_meta($post_id, '_seopress_titles_title', sanitize_text_field($params['seo_title']));
            $results['seo_title'] = 'updated';
        }

        // Update SiteSEO meta description
        if (isset($params['seo_description'])) {
            update_post_meta($post_id, '_seopress_titles_desc', sanitize_textarea_field($params['seo_description']));
            $results['seo_description'] = 'updated';
        }

        $this->log('INFO', 'WC product update complete', ['post_id' => $post_id, 'results' => $results]);

        return [
            'success'   => true,
            'post_id'   => $post_id,
            'name'      => $post->post_title,
            'updated'   => $results,
            'timestamp' => date('Y-m-d H:i:s'),
        ];
    }

    /**
     * GET /wc-products — List all WooCommerce products with IDs, slugs, prices and SEO meta
     */
    public function list_wc_products($request) {
        $this->log('INFO', 'Listing WC products');

        $posts = get_posts([
            'post_type'      => 'product',
            'post_status'    => 'publish',
            'posts_per_page' => -1,
            'orderby'        => 'title',
            'order'          => 'ASC',
        ]);

        $products = [];
        foreach ($posts as $post) {
            $price      = get_post_meta($post->ID, '_price', true);
            $categories = wp_get_post_terms($post->ID, 'product_cat', ['fields' => 'names']);
            $seo_title  = get_post_meta($post->ID, '_seopress_titles_title', true);
            $seo_desc   = get_post_meta($post->ID, '_seopress_titles_desc', true);

            $products[] = [
                'id'              => $post->ID,
                'name'            => $post->post_title,
                'slug'            => $post->post_name,
                'price'           => $price ?: '',
                'categories'      => $categories,
                'has_description' => !empty(trim(strip_tags($post->post_content))),
                'has_seo_title'   => !empty($seo_title),
                'has_seo_desc'    => !empty($seo_desc),
            ];
        }

        return [
            'success' => true,
            'count'   => count($products),
            'products' => $products,
        ];
    }

    /**
     * Get memory limit in bytes
     */
    private function get_memory_limit_bytes() {
        $limit = ini_get('memory_limit');
        if ($limit === '-1') return PHP_INT_MAX;
        $value = (int) $limit;
        $unit = strtolower(substr($limit, -1));
        switch ($unit) {
            case 'g': $value *= 1024;
            case 'm': $value *= 1024;
            case 'k': $value *= 1024;
        }
        return $value;
    }

    // ===================================================================
    // Blog Post Management (v1.4.0)
    // ===================================================================

    /**
     * GET /blog-posts — List all blog posts with categories, SEO meta, and featured images
     */
    public function list_blog_posts($request) {
        $this->log('INFO', 'Listing blog posts');

        $posts = get_posts([
            'post_type'      => 'post',
            'post_status'    => ['publish', 'draft', 'pending'],
            'posts_per_page' => -1,
            'orderby'        => 'date',
            'order'          => 'DESC',
        ]);

        $result = [];
        foreach ($posts as $post) {
            $cats = wp_get_post_categories($post->ID, ['fields' => 'all']);
            $cat_list = array_map(function($c) {
                return ['id' => $c->term_id, 'name' => $c->name, 'slug' => $c->slug];
            }, $cats);
            $thumbnail_id  = get_post_thumbnail_id($post->ID);
            $thumbnail_url = $thumbnail_id ? wp_get_attachment_url($thumbnail_id) : '';
            $seo_title     = get_post_meta($post->ID, '_seopress_titles_title', true);
            $seo_desc      = get_post_meta($post->ID, '_seopress_titles_desc', true);

            $result[] = [
                'id'                => $post->ID,
                'title'             => $post->post_title,
                'slug'              => $post->post_name,
                'status'            => $post->post_status,
                'date'              => $post->post_date,
                'link'              => get_permalink($post->ID),
                'categories'        => $cat_list,
                'featured_image'    => $thumbnail_url,
                'featured_image_id' => (int) $thumbnail_id,
                'seo_title'         => $seo_title ?: '',
                'seo_description'   => $seo_desc ?: '',
                'excerpt'           => $post->post_excerpt,
            ];
        }

        return ['success' => true, 'count' => count($result), 'posts' => $result];
    }

    /**
     * POST /blog-posts — Create a new blog post
     * Body: { "title": "...", "content": "<html>...", "excerpt": "...",
     *         "categories": [93, 94], "status": "publish",
     *         "seo_title": "...", "seo_description": "...",
     *         "featured_image_url": "https://..." }
     */
    public function create_blog_post($request) {
        $params = $request->get_json_params();
        if (!$params || empty($params['title'])) {
            return new WP_Error('invalid_params', 'title is required', ['status' => 400]);
        }

        $this->log('INFO', 'Creating blog post', ['title' => $params['title']]);

        $post_data = [
            'post_type'    => 'post',
            'post_title'   => sanitize_text_field($params['title']),
            'post_content' => wp_kses_post($params['content'] ?? ''),
            'post_excerpt' => sanitize_textarea_field($params['excerpt'] ?? ''),
            'post_status'  => sanitize_text_field($params['status'] ?? 'draft'),
        ];

        if (isset($params['author'])) {
            $post_data['post_author'] = (int) $params['author'];
        }

        $post_id = wp_insert_post(wp_slash($post_data), true);
        if (is_wp_error($post_id)) {
            $this->log('ERROR', 'Failed to create blog post', ['error' => $post_id->get_error_message()]);
            return new WP_Error('create_failed', $post_id->get_error_message(), ['status' => 500]);
        }

        $results = ['post_created' => $post_id];

        // Assign categories
        if (!empty($params['categories'])) {
            $cat_ids = array_map('intval', (array) $params['categories']);
            wp_set_post_categories($post_id, $cat_ids);
            $results['categories_set'] = $cat_ids;
        }

        // Set SiteSEO meta
        if (isset($params['seo_title'])) {
            update_post_meta($post_id, '_seopress_titles_title', sanitize_text_field($params['seo_title']));
            $results['seo_title'] = 'set';
        }
        if (isset($params['seo_description'])) {
            update_post_meta($post_id, '_seopress_titles_desc', sanitize_textarea_field($params['seo_description']));
            $results['seo_description'] = 'set';
        }

        // Sideload featured image from URL
        if (!empty($params['featured_image_url'])) {
            $attach_id = $this->sideload_image_from_url(
                $params['featured_image_url'],
                $post_id,
                $params['featured_image_title'] ?? '',
                $params['featured_image_alt'] ?? ''
            );
            if (is_wp_error($attach_id)) {
                $results['featured_image'] = 'failed: ' . $attach_id->get_error_message();
            } else {
                set_post_thumbnail($post_id, $attach_id);
                $results['featured_image'] = 'set (attachment: ' . $attach_id . ')';
            }
        }

        $this->log('INFO', 'Blog post created', ['post_id' => $post_id, 'results' => $results]);

        return [
            'success'   => true,
            'post_id'   => $post_id,
            'link'      => get_permalink($post_id),
            'results'   => $results,
            'timestamp' => date('Y-m-d H:i:s'),
        ];
    }

    /**
     * GET /blog-posts/{id} — Get a single blog post with full content
     */
    public function get_blog_post($request) {
        $post_id = (int) $request['id'];
        $post = get_post($post_id);
        if (!$post || $post->post_type !== 'post') {
            return new WP_Error('not_found', 'Blog post not found', ['status' => 404]);
        }

        $cats = wp_get_post_categories($post_id, ['fields' => 'all']);
        $cat_list = array_map(function($c) {
            return ['id' => $c->term_id, 'name' => $c->name, 'slug' => $c->slug];
        }, $cats);
        $thumbnail_id = get_post_thumbnail_id($post_id);

        return [
            'success' => true,
            'post'    => [
                'id'              => $post->ID,
                'title'           => $post->post_title,
                'slug'            => $post->post_name,
                'status'          => $post->post_status,
                'date'            => $post->post_date,
                'content'         => $post->post_content,
                'excerpt'         => $post->post_excerpt,
                'link'            => get_permalink($post_id),
                'categories'      => $cat_list,
                'featured_image'  => $thumbnail_id ? wp_get_attachment_url($thumbnail_id) : '',
                'featured_image_id' => (int) $thumbnail_id,
                'seo_title'       => get_post_meta($post_id, '_seopress_titles_title', true) ?: '',
                'seo_description' => get_post_meta($post_id, '_seopress_titles_desc', true) ?: '',
            ],
        ];
    }

    /**
     * PUT /blog-posts/{id} — Update an existing blog post
     * Body: any subset of { title, content, excerpt, status, categories, seo_title, seo_description, featured_image_url }
     */
    public function update_blog_post($request) {
        $post_id = (int) $request['id'];
        $params  = $request->get_json_params();

        $this->log('INFO', 'Updating blog post', ['post_id' => $post_id]);

        $post = get_post($post_id);
        if (!$post || $post->post_type !== 'post') {
            return new WP_Error('not_found', 'Blog post not found', ['status' => 404]);
        }

        $update_args = ['ID' => $post_id];
        $results     = [];

        if (isset($params['title'])) {
            $update_args['post_title'] = sanitize_text_field($params['title']);
            $results['title'] = 'updated';
        }
        if (isset($params['content'])) {
            $update_args['post_content'] = wp_kses_post($params['content']);
            $results['content'] = 'updated';
        }
        if (isset($params['excerpt'])) {
            $update_args['post_excerpt'] = sanitize_textarea_field($params['excerpt']);
            $results['excerpt'] = 'updated';
        }
        if (isset($params['status'])) {
            $update_args['post_status'] = sanitize_text_field($params['status']);
            $results['status'] = 'updated';
        }

        if (count($update_args) > 1) {
            $updated = wp_update_post(wp_slash($update_args), true);
            if (is_wp_error($updated)) {
                return new WP_Error('update_failed', $updated->get_error_message(), ['status' => 500]);
            }
        }

        if (!empty($params['categories'])) {
            $cat_ids = array_map('intval', (array) $params['categories']);
            wp_set_post_categories($post_id, $cat_ids);
            $results['categories'] = 'updated';
        }

        if (isset($params['seo_title'])) {
            update_post_meta($post_id, '_seopress_titles_title', sanitize_text_field($params['seo_title']));
            $results['seo_title'] = 'updated';
        }
        if (isset($params['seo_description'])) {
            update_post_meta($post_id, '_seopress_titles_desc', sanitize_textarea_field($params['seo_description']));
            $results['seo_description'] = 'updated';
        }

        if (!empty($params['featured_image_url'])) {
            $attach_id = $this->sideload_image_from_url($params['featured_image_url'], $post_id);
            if (!is_wp_error($attach_id)) {
                set_post_thumbnail($post_id, $attach_id);
                $results['featured_image'] = 'set (attachment: ' . $attach_id . ')';
            } else {
                $results['featured_image'] = 'failed: ' . $attach_id->get_error_message();
            }
        }

        $this->log('INFO', 'Blog post updated', ['post_id' => $post_id, 'results' => $results]);

        return [
            'success'   => true,
            'post_id'   => $post_id,
            'link'      => get_permalink($post_id),
            'updated'   => $results,
            'timestamp' => date('Y-m-d H:i:s'),
        ];
    }

    /**
     * DELETE /blog-posts/{id} — Delete (trash) a blog post. Add ?force=true to permanently delete.
     */
    public function delete_blog_post($request) {
        $post_id = (int) $request['id'];
        $force   = $request->get_param('force') === 'true';

        $post = get_post($post_id);
        if (!$post || $post->post_type !== 'post') {
            return new WP_Error('not_found', 'Blog post not found', ['status' => 404]);
        }

        $this->log('INFO', 'Deleting blog post', ['post_id' => $post_id, 'force' => $force]);

        if ($force) {
            wp_delete_post($post_id, true);
        } else {
            wp_trash_post($post_id);
        }

        return ['success' => true, 'post_id' => $post_id, 'action' => $force ? 'deleted' : 'trashed'];
    }

    // ===================================================================
    // Blog Category Management (v1.4.0)
    // ===================================================================

    /**
     * GET /blog-categories — List all post categories
     */
    public function list_blog_categories($request) {
        $terms = get_terms([
            'taxonomy'   => 'category',
            'hide_empty' => false,
        ]);

        if (is_wp_error($terms)) {
            return new WP_Error('failed', $terms->get_error_message(), ['status' => 500]);
        }

        $categories = [];
        foreach ($terms as $term) {
            $categories[] = [
                'id'          => $term->term_id,
                'name'        => $term->name,
                'slug'        => $term->slug,
                'count'       => (int) $term->count,
                'parent'      => (int) $term->parent,
                'description' => $term->description,
            ];
        }

        return ['success' => true, 'count' => count($categories), 'categories' => $categories];
    }

    /**
     * POST /blog-categories — Create a new post category
     * Body: { "name": "...", "slug": "...", "description": "...", "parent": 0 }
     */
    public function create_blog_category($request) {
        $params = $request->get_json_params();
        if (!$params || empty($params['name'])) {
            return new WP_Error('invalid_params', 'name is required', ['status' => 400]);
        }

        $this->log('INFO', 'Creating blog category', ['name' => $params['name']]);

        $args = [
            'description' => sanitize_textarea_field($params['description'] ?? ''),
            'slug'        => sanitize_title($params['slug'] ?? $params['name']),
        ];
        if (isset($params['parent'])) {
            $args['parent'] = (int) $params['parent'];
        }

        $result = wp_insert_term(sanitize_text_field($params['name']), 'category', $args);
        if (is_wp_error($result)) {
            // If category already exists, return the existing one
            if ($result->get_error_code() === 'term_exists') {
                $existing_id = $result->get_error_data();
                return [
                    'success'        => true,
                    'term_id'        => (int) $existing_id,
                    'already_exists' => true,
                    'name'           => $params['name'],
                ];
            }
            return new WP_Error('create_failed', $result->get_error_message(), ['status' => 500]);
        }

        // Set SiteSEO meta if provided
        if (isset($params['seo_title'])) {
            update_term_meta($result['term_id'], '_seopress_titles_title', sanitize_text_field($params['seo_title']));
        }
        if (isset($params['seo_description'])) {
            update_term_meta($result['term_id'], '_seopress_titles_desc', sanitize_textarea_field($params['seo_description']));
        }

        return [
            'success'          => true,
            'term_id'          => $result['term_id'],
            'term_taxonomy_id' => $result['term_taxonomy_id'],
            'name'             => $params['name'],
            'slug'             => $args['slug'],
        ];
    }

    // ===================================================================
    // Media Management (v1.4.0+)
    // ===================================================================

    /**
     * POST /media/upload — Upload image from base64 data to WordPress media library
     * Body: { "data": "base64...", "filename": "image.webp", "post_id": 123, "title": "Image Title", "alt": "Alt text", "caption": "", "description": "" }
     */
    public function upload_media_base64($request) {
        $params = $request->get_json_params();
        if (!$params || empty($params['data']) || empty($params['filename'])) {
            return new WP_Error('invalid_params', 'data (base64) and filename are required', ['status' => 400]);
        }

        $this->log('INFO', 'Uploading media from base64', ['filename' => $params['filename']]);

        require_once ABSPATH . 'wp-admin/includes/media.php';
        require_once ABSPATH . 'wp-admin/includes/file.php';
        require_once ABSPATH . 'wp-admin/includes/image.php';

        // Decode base64 data
        $image_data = base64_decode($params['data']);
        if ($image_data === false) {
            return new WP_Error('invalid_data', 'Failed to decode base64 data', ['status' => 400]);
        }

        // Write to temp file
        $tmp_file = wp_tempnam($params['filename']);
        file_put_contents($tmp_file, $image_data);

        // Detect MIME type
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mime  = finfo_file($finfo, $tmp_file);
        finfo_close($finfo);

        $file_array = [
            'name'     => sanitize_file_name($params['filename']),
            'type'     => $mime,
            'tmp_name' => $tmp_file,
            'error'    => 0,
            'size'     => strlen($image_data),
        ];

        $post_id = isset($params['post_id']) ? (int) $params['post_id'] : 0;
        $title   = $params['title'] ?? '';

        // Upload to media library
        $attach_id = media_handle_sideload($file_array, $post_id, $title ?: '');

        if (is_wp_error($attach_id)) {
            @unlink($tmp_file);
            $this->log('ERROR', 'Media upload failed', ['error' => $attach_id->get_error_message()]);
            return new WP_Error('upload_failed', $attach_id->get_error_message(), ['status' => 500]);
        }

        // Set alt text
        if (!empty($params['alt'])) {
            update_post_meta($attach_id, '_wp_attachment_image_alt', sanitize_text_field($params['alt']));
        }

        // Set caption and description
        $update_args = [];
        if (!empty($params['caption'])) {
            $update_args['post_excerpt'] = sanitize_textarea_field($params['caption']);
        }
        if (!empty($params['description'])) {
            $update_args['post_content'] = sanitize_textarea_field($params['description']);
        }
        if (!empty($params['title'])) {
            $update_args['post_title'] = sanitize_text_field($params['title']);
        }
        if (!empty($update_args)) {
            $update_args['ID'] = $attach_id;
            wp_update_post($update_args);
        }

        // Auto-set as featured image if post_id is provided
        if ($post_id > 0) {
            set_post_thumbnail($post_id, $attach_id);
            $this->log('INFO', 'Featured image set', ['post_id' => $post_id, 'attachment_id' => $attach_id]);
        }

        $this->log('INFO', 'Media uploaded', ['attachment_id' => $attach_id, 'url' => wp_get_attachment_url($attach_id)]);

        return [
            'success'       => true,
            'attachment_id' => $attach_id,
            'url'           => wp_get_attachment_url($attach_id),
            'post_id'       => $post_id,
            'featured_set'  => $post_id > 0,
        ];
    }

    /**
     * PUT /posts/{id}/featured-image — Set a media attachment as a post's featured image
     * Body: { "attachment_id": 456 }
     */
    public function set_featured_image($request) {
        $post_id = (int) $request['id'];
        $params  = $request->get_json_params();

        if (!$params || empty($params['attachment_id'])) {
            return new WP_Error('invalid_params', 'attachment_id is required', ['status' => 400]);
        }

        $attach_id = (int) $params['attachment_id'];

        // Verify post exists
        $post = get_post($post_id);
        if (!$post) {
            return new WP_Error('not_found', 'Post not found', ['status' => 404]);
        }

        // Verify attachment exists
        $attachment = get_post($attach_id);
        if (!$attachment || $attachment->post_type !== 'attachment') {
            return new WP_Error('not_found', 'Attachment not found', ['status' => 404]);
        }

        $result = set_post_thumbnail($post_id, $attach_id);

        if ($result === false) {
            return new WP_Error('failed', 'Failed to set featured image', ['status' => 500]);
        }

        $this->log('INFO', 'Featured image set', ['post_id' => $post_id, 'attachment_id' => $attach_id]);

        return [
            'success'       => true,
            'post_id'       => $post_id,
            'attachment_id' => $attach_id,
            'url'           => wp_get_attachment_url($attach_id),
        ];
    }

    /**
     * POST /media/sideload — Download an image from a URL and add to WordPress media library
     * Body: { "url": "https://...", "post_id": 123, "title": "...", "alt": "..." }
     */
    public function sideload_media($request) {
        $params = $request->get_json_params();
        if (!$params || empty($params['url'])) {
            return new WP_Error('invalid_params', 'url is required', ['status' => 400]);
        }

        $this->log('INFO', 'Sideloading media', ['url' => $params['url']]);

        $post_id  = isset($params['post_id']) ? (int) $params['post_id'] : 0;
        $attach_id = $this->sideload_image_from_url(
            $params['url'],
            $post_id,
            $params['title'] ?? '',
            $params['alt'] ?? ''
        );

        if (is_wp_error($attach_id)) {
            return new WP_Error('sideload_failed', $attach_id->get_error_message(), ['status' => 500]);
        }

        return [
            'success'       => true,
            'attachment_id' => $attach_id,
            'url'           => wp_get_attachment_url($attach_id),
        ];
    }

    /**
     * Download an image from URL and add to WP media library
     */
    private function sideload_image_from_url($url, $post_id = 0, $title = '', $alt = '') {
        require_once ABSPATH . 'wp-admin/includes/media.php';
        require_once ABSPATH . 'wp-admin/includes/file.php';
        require_once ABSPATH . 'wp-admin/includes/image.php';

        // Download file to temp location
        $tmp = download_url($url, 60);
        if (is_wp_error($tmp)) {
            $this->log('ERROR', 'Failed to download image', ['url' => $url, 'error' => $tmp->get_error_message()]);
            return $tmp;
        }

        // Detect filename from URL
        $filename = basename(parse_url($url, PHP_URL_PATH));
        if (empty($filename) || strpos($filename, '.') === false) {
            $filename = 'image-' . time() . '.webp';
        }

        $file_array = [
            'name'     => sanitize_file_name($filename),
            'tmp_name' => $tmp,
        ];

        // Sideload the file into the media library
        $attach_id = media_handle_sideload($file_array, $post_id, $title ?: '');

        // Clean up temp file if sideload failed
        if (is_wp_error($attach_id)) {
            @unlink($tmp);
            $this->log('ERROR', 'Media sideload failed', ['error' => $attach_id->get_error_message()]);
            return $attach_id;
        }

        // Set alt text if provided
        if ($alt) {
            update_post_meta($attach_id, '_wp_attachment_image_alt', sanitize_text_field($alt));
        }

        $this->log('INFO', 'Media sideloaded', ['attachment_id' => $attach_id, 'url' => wp_get_attachment_url($attach_id)]);
        return $attach_id;
    }
}

// Initialize
AI_Elementor_Sync::get_instance();
