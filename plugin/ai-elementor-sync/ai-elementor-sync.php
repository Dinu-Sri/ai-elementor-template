<?php
/**
 * Plugin Name: AI Elementor Sync
 * Plugin URI: https://github.com/ai-elementor-sync
 * Description: REST API bridge for AI-powered Elementor template management. Allows external tools to create, update, list, and delete Elementor pages/templates.
 * Version: 1.0.0
 * Author: AI Elementor Sync
 * License: GPL v2 or later
 * Requires PHP: 7.4
 * Requires at least: 5.6
 */

if (!defined('ABSPATH')) {
    exit;
}

define('AI_ELEMENTOR_SYNC_VERSION', '1.0.0');

class AI_Elementor_Sync {

    private static $instance = null;

    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        add_action('rest_api_init', [$this, 'register_routes']);
        add_action('admin_menu', [$this, 'add_admin_menu']);
        add_action('admin_init', [$this, 'register_settings']);
        register_activation_hook(__FILE__, [$this, 'activate']);
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
            if (empty($element['id'])) {
                $element['id'] = $this->generate_element_id();
            }
            if (!empty($element['elements'])) {
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

        $elementor_data = $data['elementor_data'] ?? [];
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
            return new WP_Error('create_failed', $post_id->get_error_message(), ['status' => 500]);
        }

        // Set Elementor metadata — wp_slash prevents WordPress from stripping backslashes in JSON
        update_post_meta($post_id, '_elementor_data', wp_slash(wp_json_encode($elementor_data)));
        update_post_meta($post_id, '_elementor_edit_mode', 'builder');
        update_post_meta($post_id, '_elementor_template_type', 'wp-page');
        update_post_meta($post_id, '_elementor_version', '3.0.0');

        $template = sanitize_text_field($data['template'] ?? 'elementor_canvas');
        update_post_meta($post_id, '_wp_page_template', $template);

        // Page settings
        if (!empty($data['page_settings'])) {
            update_post_meta($post_id, '_elementor_page_settings', $data['page_settings']);
        }

        // Clear Elementor CSS cache for this post
        if (class_exists('\Elementor\Plugin')) {
            \Elementor\Plugin::$instance->files_manager->clear_cache();
        }

        return [
            'success'  => true,
            'post_id'  => $post_id,
            'title'    => get_the_title($post_id),
            'url'      => get_permalink($post_id),
            'edit_url' => admin_url("post.php?post={$post_id}&action=elementor"),
        ];
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

            if (is_array($elementor_data)) {
                $elementor_data = $this->assign_element_ids($elementor_data);
                $json_str = wp_json_encode($elementor_data);
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

        // Clear Elementor CSS cache
        if (class_exists('\Elementor\Plugin')) {
            \Elementor\Plugin::$instance->files_manager->clear_cache();
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
     * DELETE /pages/{id} — Delete a page
     */
    public function delete_page($request) {
        $post_id = (int) $request['id'];
        $post = get_post($post_id);

        if (!$post) {
            return new WP_Error('not_found', 'Page not found', ['status' => 404]);
        }

        $force = $request->get_param('force') === 'true';
        $result = wp_delete_post($post_id, $force);

        if (!$result) {
            return new WP_Error('delete_failed', 'Failed to delete page', ['status' => 500]);
        }

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
        $type = sanitize_text_field($data['type'] ?? 'page'); // page, section, header, footer
        $elementor_data = $data['elementor_data'] ?? $data['content'] ?? [];
        $elementor_data = $this->assign_element_ids($elementor_data);

        $post_id = wp_insert_post([
            'post_title'  => $title,
            'post_status' => 'publish',
            'post_type'   => 'elementor_library',
        ], true);

        if (is_wp_error($post_id)) {
            return new WP_Error('create_failed', $post_id->get_error_message(), ['status' => 500]);
        }

        update_post_meta($post_id, '_elementor_data', wp_slash(wp_json_encode($elementor_data)));
        update_post_meta($post_id, '_elementor_edit_mode', 'builder');
        update_post_meta($post_id, '_elementor_template_type', $type);
        update_post_meta($post_id, '_elementor_version', '3.0.0');

        // Set template type taxonomy
        wp_set_object_terms($post_id, $type, 'elementor_library_type');

        return [
            'success'     => true,
            'template_id' => $post_id,
            'title'       => $title,
            'type'        => $type,
            'edit_url'    => admin_url("post.php?post={$post_id}&action=elementor"),
        ];
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
}

// Initialize
AI_Elementor_Sync::get_instance();
