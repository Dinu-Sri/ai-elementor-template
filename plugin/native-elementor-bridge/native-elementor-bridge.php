<?php
/**
 * Plugin Name: Native Elementor Bridge
 * Description: REST bridge for native-first AI Elementor generation. Pushes editable Elementor container/widget JSON and exports saved templates for feedback learning.
 * Version: 0.6.0
 * Author: Deshtech Global Pvt Ltd
 * License: GPL v2 or later
 * Requires PHP: 7.4
 * Requires at least: 6.0
 */

if (!defined('ABSPATH')) {
    exit;
}

define('NEB_VERSION', '0.6.0');

class Native_Elementor_Bridge {
    private static $instance = null;
    private $namespace = 'native-elementor/v1';

    public static function instance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        add_action('rest_api_init', [$this, 'register_routes']);
        add_action('admin_menu', [$this, 'add_settings_page']);
        add_action('wp_head', [$this, 'render_faq_schema'], 30);
        register_activation_hook(__FILE__, [$this, 'activate']);
    }

    public function activate() {
        if (!get_option('native_elementor_bridge_api_key')) {
            update_option('native_elementor_bridge_api_key', wp_generate_password(40, false));
        }
    }

    public function add_settings_page() {
        add_options_page(
            'Native Elementor Bridge',
            'Native Elementor Bridge',
            'manage_options',
            'native-elementor-bridge',
            [$this, 'render_settings_page']
        );
    }

    public function render_settings_page() {
        if (isset($_POST['neb_regenerate_key']) && check_admin_referer('neb_regenerate_key')) {
            update_option('native_elementor_bridge_api_key', wp_generate_password(40, false));
            echo '<div class="notice notice-success"><p>API key regenerated.</p></div>';
        }

        $api_key = get_option('native_elementor_bridge_api_key');
        ?>
        <div class="wrap">
            <h1>Native Elementor Bridge</h1>
            <p>Use this key from local tooling to push compiled Elementor JSON.</p>
            <table class="form-table">
                <tr>
                    <th>API Key</th>
                    <td>
                        <input id="neb-api-key" class="regular-text" type="text" readonly value="<?php echo esc_attr($api_key); ?>" />
                        <button type="button" class="button" onclick="navigator.clipboard.writeText(document.getElementById('neb-api-key').value)">Copy</button>
                    </td>
                </tr>
                <tr>
                    <th>REST Base</th>
                    <td><code><?php echo esc_html(rest_url($this->namespace)); ?></code></td>
                </tr>
                <tr>
                    <th>Elementor</th>
                    <td><?php echo class_exists('\Elementor\Plugin') ? 'Active' : 'Not active'; ?></td>
                </tr>
            </table>
            <form method="post">
                <?php wp_nonce_field('neb_regenerate_key'); ?>
                <button class="button button-secondary" name="neb_regenerate_key" value="1">Regenerate API Key</button>
            </form>
        </div>
        <?php
    }

    public function register_routes() {
        register_rest_route($this->namespace, '/status', [
            'methods' => 'GET',
            'callback' => [$this, 'status'],
            'permission_callback' => [$this, 'permission_check'],
        ]);

        register_rest_route($this->namespace, '/pages', [
            'methods' => 'POST',
            'callback' => [$this, 'create_page'],
            'permission_callback' => [$this, 'permission_check'],
        ]);

        register_rest_route($this->namespace, '/pages', [
            'methods' => 'GET',
            'callback' => [$this, 'list_pages'],
            'permission_callback' => [$this, 'permission_check'],
        ]);

        register_rest_route($this->namespace, '/pages/(?P<id>\d+)', [
            'methods' => 'PUT',
            'callback' => [$this, 'update_page'],
            'permission_callback' => [$this, 'permission_check'],
        ]);

        register_rest_route($this->namespace, '/pages/(?P<id>\d+)', [
            'methods' => 'GET',
            'callback' => [$this, 'get_page'],
            'permission_callback' => [$this, 'permission_check'],
        ]);

        register_rest_route($this->namespace, '/templates', [
            'methods' => 'POST',
            'callback' => [$this, 'create_template'],
            'permission_callback' => [$this, 'permission_check'],
        ]);

        register_rest_route($this->namespace, '/templates', [
            'methods' => 'GET',
            'callback' => [$this, 'list_templates'],
            'permission_callback' => [$this, 'permission_check'],
        ]);

        register_rest_route($this->namespace, '/templates/(?P<id>\d+)', [
            'methods' => 'PUT',
            'callback' => [$this, 'update_template'],
            'permission_callback' => [$this, 'permission_check'],
        ]);

        register_rest_route($this->namespace, '/templates/(?P<id>\d+)', [
            'methods' => 'GET',
            'callback' => [$this, 'get_page'],
            'permission_callback' => [$this, 'permission_check'],
        ]);

        register_rest_route($this->namespace, '/theme-builder', [
            'methods' => 'GET',
            'callback' => [$this, 'theme_builder_status'],
            'permission_callback' => [$this, 'permission_check'],
        ]);

        register_rest_route($this->namespace, '/clear-cache', [
            'methods' => 'POST',
            'callback' => [$this, 'clear_cache_endpoint'],
            'permission_callback' => [$this, 'permission_check'],
        ]);

        register_rest_route($this->namespace, '/menus', [
            'methods' => 'GET',
            'callback' => [$this, 'list_menus'],
            'permission_callback' => [$this, 'permission_check'],
        ]);

        register_rest_route($this->namespace, '/menus', [
            'methods' => 'POST',
            'callback' => [$this, 'upsert_menu'],
            'permission_callback' => [$this, 'permission_check'],
        ]);

        register_rest_route($this->namespace, '/site-snapshot', [
            'methods' => 'GET',
            'callback' => [$this, 'site_snapshot'],
            'permission_callback' => [$this, 'permission_check'],
        ]);

        register_rest_route($this->namespace, '/posts', [
            'methods' => 'GET',
            'callback' => [$this, 'list_blog_posts'],
            'permission_callback' => [$this, 'permission_check'],
        ]);

        register_rest_route($this->namespace, '/posts', [
            'methods' => 'POST',
            'callback' => [$this, 'create_blog_post'],
            'permission_callback' => [$this, 'permission_check'],
        ]);

        register_rest_route($this->namespace, '/posts/(?P<id>\d+)', [
            'methods' => 'GET',
            'callback' => [$this, 'get_blog_post'],
            'permission_callback' => [$this, 'permission_check'],
        ]);

        register_rest_route($this->namespace, '/posts/(?P<id>\d+)', [
            'methods' => 'PUT',
            'callback' => [$this, 'update_blog_post'],
            'permission_callback' => [$this, 'permission_check'],
        ]);

        register_rest_route($this->namespace, '/media/upload', [
            'methods' => 'POST',
            'callback' => [$this, 'upload_media'],
            'permission_callback' => [$this, 'permission_check'],
        ]);

        register_rest_route($this->namespace, '/media', [
            'methods' => 'GET',
            'callback' => [$this, 'list_media'],
            'permission_callback' => [$this, 'permission_check'],
        ]);

        register_rest_route($this->namespace, '/media/(?P<id>\d+)', [
            'methods' => 'PUT',
            'callback' => [$this, 'update_media'],
            'permission_callback' => [$this, 'permission_check'],
        ]);

        register_rest_route($this->namespace, '/categories', [
            'methods' => 'GET',
            'callback' => [$this, 'list_blog_categories'],
            'permission_callback' => [$this, 'permission_check'],
        ]);

        register_rest_route($this->namespace, '/categories', [
            'methods' => 'POST',
            'callback' => [$this, 'upsert_blog_category'],
            'permission_callback' => [$this, 'permission_check'],
        ]);

        register_rest_route($this->namespace, '/authors', [
            'methods' => 'GET',
            'callback' => [$this, 'list_blog_authors'],
            'permission_callback' => [$this, 'permission_check'],
        ]);
    }

    public function permission_check($request) {
        $provided = $request->get_header('X-API-Key');
        $stored = get_option('native_elementor_bridge_api_key');

        if (!$provided || !$stored || !hash_equals($stored, $provided)) {
            return new WP_Error('neb_unauthorized', 'Invalid or missing API key.', ['status' => 401]);
        }

        return true;
    }

    public function status() {
        return [
            'ok' => true,
            'bridge_version' => NEB_VERSION,
            'site_name' => get_bloginfo('name'),
            'site_url' => get_site_url(),
            'wp_version' => get_bloginfo('version'),
            'php_version' => phpversion(),
            'elementor' => class_exists('\Elementor\Plugin'),
            'elementor_version' => defined('ELEMENTOR_VERSION') ? ELEMENTOR_VERSION : null,
            'elementor_pro' => defined('ELEMENTOR_PRO_VERSION'),
            'elementor_pro_version' => defined('ELEMENTOR_PRO_VERSION') ? ELEMENTOR_PRO_VERSION : null,
        ];
    }

    private function get_json_params($request) {
        $params = $request->get_json_params();
        return is_array($params) ? $params : [];
    }

    private function normalize_elementor_data($data) {
        if (!is_array($data)) {
            return [];
        }

        if (!isset($data[0]) && !empty($data)) {
            $data = [$data];
        }

        $data = array_values($data);
        return $this->assign_element_ids($data);
    }

    private function assign_element_ids($elements) {
        $normalized = [];

        foreach ($elements as $element) {
            if (!is_array($element)) {
                continue;
            }

            if (empty($element['id'])) {
                $element['id'] = substr(md5(wp_json_encode($element) . microtime(true) . wp_rand()), 0, 7);
            }

            if (!isset($element['elements']) || !is_array($element['elements'])) {
                $element['elements'] = [];
            }

            $element['elements'] = $this->assign_element_ids($element['elements']);
            $normalized[] = $element;
        }

        return $normalized;
    }

    private function save_elementor_meta($post_id, $elementor_data, $template = 'elementor_header_footer', $page_settings = []) {
        $elementor_data = $this->normalize_elementor_data($elementor_data);

        update_post_meta($post_id, '_elementor_edit_mode', 'builder');
        update_post_meta($post_id, '_elementor_template_type', $template === 'elementor_canvas' ? 'canvas' : 'wp-page');
        update_post_meta($post_id, '_wp_page_template', $template);
        update_post_meta($post_id, '_elementor_version', defined('ELEMENTOR_VERSION') ? ELEMENTOR_VERSION : '3.0.0');
        update_post_meta($post_id, '_elementor_data', wp_slash(wp_json_encode($elementor_data)));

        if (is_array($page_settings) && !empty($page_settings)) {
            update_post_meta($post_id, '_elementor_page_settings', $page_settings);
        }

        $this->clear_elementor_cache($post_id);

        return $elementor_data;
    }

    private function clear_elementor_cache($post_id = 0) {
        $results = [
            'elementor_files' => false,
            'theme_builder_conditions' => false,
            'post_cache' => false,
            'object_cache' => false,
        ];

        if (class_exists('\Elementor\Plugin')) {
            \Elementor\Plugin::$instance->files_manager->clear_cache();
            $results['elementor_files'] = true;
        }

        if (class_exists('\ElementorPro\Modules\ThemeBuilder\Module')) {
            try {
                $theme_builder = \ElementorPro\Modules\ThemeBuilder\Module::instance();
                if (method_exists($theme_builder, 'get_conditions_manager')) {
                    $conditions_manager = $theme_builder->get_conditions_manager();
                    if ($conditions_manager && method_exists($conditions_manager, 'get_cache')) {
                        $cache = $conditions_manager->get_cache();
                        if ($cache && method_exists($cache, 'regenerate')) {
                            $cache->regenerate();
                            $results['theme_builder_conditions'] = true;
                        }
                    }
                }
            } catch (\Throwable $error) {
                $results['theme_builder_conditions_error'] = $error->getMessage();
            }
        }

        if ($post_id) {
            clean_post_cache($post_id);
            $results['post_cache'] = true;
        }

        wp_cache_flush();
        $results['object_cache'] = true;

        return $results;
    }

    public function clear_cache_endpoint() {
        return [
            'ok' => true,
            'cache' => $this->clear_elementor_cache(0),
        ];
    }

    private function default_template_conditions($type) {
        if (in_array($type, ['header', 'footer'], true)) {
            return ['include/general'];
        }

        if ($type === 'single-post') {
            return ['include/singular/post'];
        }

        return [];
    }

    private function sanitize_conditions($conditions) {
        if (!is_array($conditions)) {
            return [];
        }

        $clean = [];
        foreach ($conditions as $condition) {
            if (is_string($condition) && $condition !== '') {
                $clean[] = sanitize_text_field($condition);
            }
        }

        return array_values(array_unique($clean));
    }

    private function apply_template_type_and_conditions($post_id, $type, $conditions = null) {
        $type = sanitize_key($type ?: 'section');
        update_post_meta($post_id, '_elementor_template_type', $type);
        wp_set_object_terms($post_id, $type, 'elementor_library_type');

        $clean_conditions = $conditions === null
            ? $this->default_template_conditions($type)
            : $this->sanitize_conditions($conditions);

        if (!empty($clean_conditions)) {
            update_post_meta($post_id, '_elementor_conditions', $clean_conditions);
        } else {
            delete_post_meta($post_id, '_elementor_conditions');
        }

        return [
            'type' => $type,
            'conditions' => $clean_conditions,
        ];
    }

    public function create_page($request) {
        $body = $this->get_json_params($request);
        $title = sanitize_text_field($body['title'] ?? 'Native Generated Page');
        $status = in_array(($body['status'] ?? 'draft'), ['draft', 'publish'], true) ? $body['status'] : 'draft';

        $post_id = wp_insert_post([
            'post_title' => $title,
            'post_status' => $status,
            'post_type' => 'page',
            'post_name' => sanitize_title($body['slug'] ?? $title),
        ], true);

        if (is_wp_error($post_id)) {
            return $post_id;
        }

        $saved_data = $this->save_elementor_meta(
            $post_id,
            $body['elementor_data'] ?? [],
            $body['template'] ?? 'elementor_header_footer',
            $body['page_settings'] ?? []
        );

        $this->apply_page_seo_fields($post_id, $body);
        clean_post_cache($post_id);

        return $this->format_post_response($post_id, $saved_data);
    }

    public function update_page($request) {
        $post_id = absint($request['id']);
        $body = $this->get_json_params($request);

        if (!get_post($post_id)) {
            return new WP_Error('neb_not_found', 'Page not found.', ['status' => 404]);
        }

        $post_update = ['ID' => $post_id];
        if (!empty($body['title'])) {
            $post_update['post_title'] = sanitize_text_field($body['title']);
        }
        if (!empty($body['status']) && in_array($body['status'], ['draft', 'publish'], true)) {
            $post_update['post_status'] = $body['status'];
        }
        if (!empty($body['slug'])) {
            $post_update['post_name'] = sanitize_title($body['slug']);
        }
        wp_update_post($post_update);

        $elementor_data = array_key_exists('elementor_data', $body)
            ? $body['elementor_data']
            : $this->get_elementor_data($post_id);
        $page_settings = array_key_exists('page_settings', $body)
            ? $body['page_settings']
            : get_post_meta($post_id, '_elementor_page_settings', true);
        $saved_data = $this->save_elementor_meta(
            $post_id,
            $elementor_data,
            $body['template'] ?? get_post_meta($post_id, '_wp_page_template', true),
            is_array($page_settings) ? $page_settings : []
        );

        $this->apply_page_seo_fields($post_id, $body);
        clean_post_cache($post_id);

        return $this->format_post_response($post_id, $saved_data);
    }

    public function list_pages($request) {
        $include_data = filter_var($request->get_param('include_data'), FILTER_VALIDATE_BOOLEAN);
        $posts = get_posts([
            'post_type' => 'page',
            'post_status' => ['publish', 'draft', 'pending', 'private'],
            'posts_per_page' => min(absint($request->get_param('per_page') ?: 100), 250),
            'orderby' => 'menu_order title',
            'order' => 'ASC',
        ]);

        return [
            'ok' => true,
            'pages' => array_map(function ($post) use ($include_data) {
                return $this->format_post_summary($post, $include_data);
            }, $posts),
        ];
    }

    public function create_template($request) {
        $body = $this->get_json_params($request);
        $title = sanitize_text_field($body['title'] ?? 'Native Template');
        $type = sanitize_key($body['type'] ?? 'section');

        $post_id = wp_insert_post([
            'post_title' => $title,
            'post_status' => 'publish',
            'post_type' => 'elementor_library',
        ], true);

        if (is_wp_error($post_id)) {
            return $post_id;
        }

        $saved_data = $this->normalize_elementor_data($body['elementor_data'] ?? []);

        update_post_meta($post_id, '_elementor_edit_mode', 'builder');
        update_post_meta($post_id, '_elementor_version', defined('ELEMENTOR_VERSION') ? ELEMENTOR_VERSION : '3.0.0');
        update_post_meta($post_id, '_elementor_data', wp_slash(wp_json_encode($saved_data)));
        $this->apply_template_type_and_conditions(
            $post_id,
            $type,
            array_key_exists('conditions', $body) ? $body['conditions'] : null
        );

        $this->clear_elementor_cache($post_id);

        return $this->format_post_response($post_id, $saved_data);
    }

    public function update_template($request) {
        $post_id = absint($request['id']);
        $body = $this->get_json_params($request);

        $post = get_post($post_id);
        if (!$post || $post->post_type !== 'elementor_library') {
            return new WP_Error('neb_not_found', 'Template not found.', ['status' => 404]);
        }

        if (!empty($body['title'])) {
            wp_update_post([
                'ID' => $post_id,
                'post_title' => sanitize_text_field($body['title']),
            ]);
        }

        if (array_key_exists('elementor_data', $body)) {
            $saved_data = $this->normalize_elementor_data($body['elementor_data']);
            update_post_meta($post_id, '_elementor_data', wp_slash(wp_json_encode($saved_data)));
        } else {
            $raw = get_post_meta($post_id, '_elementor_data', true);
            $existing_data = $raw ? json_decode($raw, true) : [];
            $saved_data = is_array($existing_data) ? $existing_data : [];
        }

        if (!empty($body['type']) || array_key_exists('conditions', $body)) {
            $type = !empty($body['type'])
                ? sanitize_key($body['type'])
                : get_post_meta($post_id, '_elementor_template_type', true);
            $this->apply_template_type_and_conditions(
                $post_id,
                $type,
                array_key_exists('conditions', $body) ? $body['conditions'] : null
            );
        }

        $this->clear_elementor_cache($post_id);

        return $this->format_post_response($post_id, $saved_data);
    }

    public function list_templates($request) {
        $include_data = filter_var($request->get_param('include_data'), FILTER_VALIDATE_BOOLEAN);
        $posts = get_posts([
            'post_type' => 'elementor_library',
            'post_status' => ['publish', 'draft', 'pending', 'private'],
            'posts_per_page' => min(absint($request->get_param('per_page') ?: 100), 250),
            'orderby' => 'date',
            'order' => 'DESC',
        ]);

        return [
            'ok' => true,
            'templates' => array_map(function ($post) use ($include_data) {
                return $this->format_post_summary($post, $include_data);
            }, $posts),
        ];
    }

    public function get_page($request) {
        $post_id = absint($request['id']);
        $post = get_post($post_id);

        if (!$post) {
            return new WP_Error('neb_not_found', 'Post not found.', ['status' => 404]);
        }

        $raw = get_post_meta($post_id, '_elementor_data', true);
        $data = $raw ? json_decode($raw, true) : [];

        return $this->format_post_response($post_id, is_array($data) ? $data : []);
    }

    private function get_elementor_data($post_id) {
        $raw = get_post_meta($post_id, '_elementor_data', true);
        $data = $raw ? json_decode($raw, true) : [];
        return is_array($data) ? $data : [];
    }

    private function format_post_summary($post, $include_data = false) {
        $post_id = $post->ID;
        $summary = [
            'id' => $post_id,
            'post_id' => $post_id,
            'title' => get_the_title($post_id),
            'slug' => $post->post_name,
            'status' => $post->post_status,
            'type' => $post->post_type,
            'url' => get_permalink($post_id),
            'edit_url' => admin_url('post.php?post=' . $post_id . '&action=elementor'),
            'template' => get_post_meta($post_id, '_wp_page_template', true),
            'elementor_template_type' => get_post_meta($post_id, '_elementor_template_type', true),
            'has_elementor_data' => get_post_meta($post_id, '_elementor_data', true) !== '',
            'seo_title' => get_post_meta($post_id, 'rank_math_title', true) ?: '',
            'seo_description' => get_post_meta($post_id, 'rank_math_description', true) ?: '',
            'focus_keyword' => get_post_meta($post_id, 'rank_math_focus_keyword', true) ?: '',
            'canonical_url' => get_post_meta($post_id, 'rank_math_canonical_url', true) ?: '',
            'robots' => get_post_meta($post_id, 'rank_math_robots', true) ?: [],
        ];

        if ($include_data) {
            $summary['elementor_data'] = $this->get_elementor_data($post_id);
            $summary['page_settings'] = get_post_meta($post_id, '_elementor_page_settings', true);
        }

        return $summary;
    }

    private function format_post_response($post_id, $elementor_data) {
        $post = get_post($post_id);
        $terms = wp_get_post_terms($post_id, 'elementor_library_type', ['fields' => 'slugs']);

        return [
            'id' => $post_id,
            'post_id' => $post_id,
            'title' => get_the_title($post_id),
            'slug' => $post ? $post->post_name : '',
            'status' => $post ? $post->post_status : '',
            'type' => $post ? $post->post_type : '',
            'url' => get_permalink($post_id),
            'edit_url' => admin_url('post.php?post=' . $post_id . '&action=elementor'),
            'template' => get_post_meta($post_id, '_wp_page_template', true),
            'elementor_template_type' => get_post_meta($post_id, '_elementor_template_type', true),
            'elementor_library_terms' => is_wp_error($terms) ? [] : $terms,
            'elementor_conditions' => get_post_meta($post_id, '_elementor_conditions', true),
            'elementor_data' => $elementor_data,
            'seo_title' => get_post_meta($post_id, 'rank_math_title', true) ?: '',
            'seo_description' => get_post_meta($post_id, 'rank_math_description', true) ?: '',
            'focus_keyword' => get_post_meta($post_id, 'rank_math_focus_keyword', true) ?: '',
            'canonical_url' => get_post_meta($post_id, 'rank_math_canonical_url', true) ?: '',
            'robots' => get_post_meta($post_id, 'rank_math_robots', true) ?: [],
            'og_title' => get_post_meta($post_id, 'rank_math_facebook_title', true) ?: '',
            'og_description' => get_post_meta($post_id, 'rank_math_facebook_description', true) ?: '',
        ];
    }

    private function apply_page_seo_fields($post_id, $body) {
        $seo_fields = [
            'seo_title' => 'rank_math_title',
            'seo_description' => 'rank_math_description',
            'focus_keyword' => 'rank_math_focus_keyword',
            'canonical_url' => 'rank_math_canonical_url',
            'og_title' => 'rank_math_facebook_title',
            'og_description' => 'rank_math_facebook_description',
        ];

        foreach ($seo_fields as $field => $meta_key) {
            if (!array_key_exists($field, $body)) {
                continue;
            }
            $value = in_array($field, ['seo_description', 'og_description'], true)
                ? sanitize_textarea_field($body[$field])
                : sanitize_text_field($body[$field]);
            update_post_meta($post_id, $meta_key, $value);
        }

        if (array_key_exists('robots', $body)) {
            $robots = is_array($body['robots'])
                ? $body['robots']
                : explode(',', (string) $body['robots']);
            $allowed = ['index', 'noindex', 'follow', 'nofollow', 'noarchive', 'noimageindex', 'nosnippet'];
            $robots = array_values(array_unique(array_intersect(
                $allowed,
                array_filter(array_map(function ($directive) {
                    return sanitize_key(trim((string) $directive));
                }, $robots))
            )));
            if ($robots) {
                update_post_meta($post_id, 'rank_math_robots', $robots);
            } else {
                delete_post_meta($post_id, 'rank_math_robots');
            }
        }
    }

    private function format_menu($menu) {
        $items = wp_get_nav_menu_items($menu->term_id);
        return [
            'id' => $menu->term_id,
            'name' => $menu->name,
            'slug' => $menu->slug,
            'count' => $menu->count,
            'items' => array_map(function ($item) {
                return [
                    'id' => $item->ID,
                    'title' => $item->title,
                    'url' => $item->url,
                    'menu_order' => $item->menu_order,
                    'parent' => $item->menu_item_parent,
                ];
            }, is_array($items) ? $items : []),
        ];
    }

    public function list_menus() {
        return [
            'ok' => true,
            'menus' => array_map([$this, 'format_menu'], wp_get_nav_menus()),
        ];
    }

    public function upsert_menu($request) {
        $body = $this->get_json_params($request);
        $name = sanitize_text_field($body['name'] ?? 'Native Generated Menu');
        $slug = sanitize_title($body['slug'] ?? $name);
        $items = is_array($body['items'] ?? null) ? $body['items'] : [];

        $menu = wp_get_nav_menu_object($slug);
        if (!$menu) {
            $menu = wp_get_nav_menu_object($name);
        }

        if (!$menu) {
            $menu_id = wp_create_nav_menu($name);
            if (is_wp_error($menu_id)) {
                return $menu_id;
            }
            wp_update_term($menu_id, 'nav_menu', ['slug' => $slug, 'name' => $name]);
            $menu = wp_get_nav_menu_object($menu_id);
        } else {
            $menu_id = $menu->term_id;
            wp_update_term($menu_id, 'nav_menu', ['slug' => $slug, 'name' => $name]);
        }

        $existing_items = wp_get_nav_menu_items($menu_id);
        if (is_array($existing_items)) {
            foreach ($existing_items as $existing_item) {
                wp_delete_post($existing_item->ID, true);
            }
        }

        foreach ($items as $index => $item) {
            $title = sanitize_text_field($item['label'] ?? $item['title'] ?? 'Menu Item');
            $url = esc_url_raw($item['url'] ?? '/');
            wp_update_nav_menu_item($menu_id, 0, [
                'menu-item-title' => $title,
                'menu-item-url' => $url,
                'menu-item-status' => 'publish',
                'menu-item-type' => 'custom',
                'menu-item-position' => $index + 1,
            ]);
        }

        return [
            'ok' => true,
            'menu' => $this->format_menu(wp_get_nav_menu_object($menu_id)),
        ];
    }

    public function site_snapshot($request) {
        $include_data = filter_var($request->get_param('include_data'), FILTER_VALIDATE_BOOLEAN);
        return [
            'ok' => true,
            'status' => $this->status(),
            'pages' => $this->list_pages($request)['pages'],
            'templates' => $this->list_templates($request)['templates'],
            'menus' => $this->list_menus()['menus'],
            'theme_builder' => $this->theme_builder_status(),
            'include_data' => $include_data,
        ];
    }

    public function theme_builder_status() {
        $query = new WP_Query([
            'post_type' => 'elementor_library',
            'post_status' => ['publish', 'draft'],
            'posts_per_page' => 100,
            'orderby' => 'date',
            'order' => 'DESC',
        ]);

        $templates = [];
        foreach ($query->posts as $post) {
            $terms = wp_get_post_terms($post->ID, 'elementor_library_type', ['fields' => 'slugs']);
            $templates[] = [
                'id' => $post->ID,
                'title' => get_the_title($post->ID),
                'status' => $post->post_status,
                'type' => get_post_meta($post->ID, '_elementor_template_type', true),
                'terms' => is_wp_error($terms) ? [] : $terms,
                'conditions' => get_post_meta($post->ID, '_elementor_conditions', true),
                'edit_url' => admin_url('post.php?post=' . $post->ID . '&action=elementor'),
            ];
        }

        return [
            'ok' => true,
            'elementor_pro_theme_builder' => class_exists('\ElementorPro\Modules\ThemeBuilder\Module'),
            'templates' => $templates,
        ];
    }

    private function blog_post_response($post_id, $include_content = false) {
        $post = get_post($post_id);
        if (!$post || $post->post_type !== 'post') {
            return null;
        }

        $thumbnail_id = get_post_thumbnail_id($post_id);
        $response = [
            'id' => $post_id,
            'title' => $post->post_title,
            'slug' => $post->post_name,
            'status' => $post->post_status,
            'date' => $post->post_date,
            'url' => get_permalink($post_id),
            'edit_url' => admin_url('post.php?post=' . $post_id . '&action=edit'),
            'excerpt' => $post->post_excerpt,
            'category_ids' => wp_get_post_categories($post_id),
            'tags' => wp_get_post_tags($post_id, ['fields' => 'names']),
            'author_id' => (int) $post->post_author,
            'author' => get_the_author_meta('display_name', $post->post_author),
            'featured_image_id' => (int) $thumbnail_id,
            'featured_image_url' => $thumbnail_id ? wp_get_attachment_url($thumbnail_id) : '',
            'seo_title' => get_post_meta($post_id, 'rank_math_title', true) ?: '',
            'seo_description' => get_post_meta($post_id, 'rank_math_description', true) ?: '',
            'focus_keyword' => get_post_meta($post_id, 'rank_math_focus_keyword', true) ?: '',
            'canonical_url' => get_post_meta($post_id, 'rank_math_canonical_url', true) ?: '',
            'robots' => get_post_meta($post_id, 'rank_math_robots', true) ?: [],
            'og_title' => get_post_meta($post_id, 'rank_math_facebook_title', true) ?: '',
            'og_description' => get_post_meta($post_id, 'rank_math_facebook_description', true) ?: '',
            'faq_schema' => get_post_meta($post_id, '_neb_faq_schema', true) ?: [],
        ];

        if ($include_content) {
            $response['content'] = $post->post_content;
        }

        return $response;
    }

    private function apply_blog_post_fields($post_id, $body) {
        if (array_key_exists('categories', $body) && is_array($body['categories'])) {
            wp_set_post_categories($post_id, array_map('absint', $body['categories']));
        }

        if (array_key_exists('tags', $body) && is_array($body['tags'])) {
            $tags = array_values(array_filter(array_map('sanitize_text_field', $body['tags'])));
            wp_set_post_tags($post_id, $tags, false);
        }

        $seo_fields = [
            'seo_title' => 'rank_math_title',
            'seo_description' => 'rank_math_description',
            'focus_keyword' => 'rank_math_focus_keyword',
            'canonical_url' => 'rank_math_canonical_url',
            'og_title' => 'rank_math_facebook_title',
            'og_description' => 'rank_math_facebook_description',
        ];

        foreach ($seo_fields as $field => $meta_key) {
            if (!array_key_exists($field, $body)) {
                continue;
            }
            $value = in_array($field, ['seo_description', 'og_description'], true)
                ? sanitize_textarea_field($body[$field])
                : sanitize_text_field($body[$field]);
            update_post_meta($post_id, $meta_key, $value);
        }

        if (array_key_exists('robots', $body)) {
            $robots = is_array($body['robots'])
                ? $body['robots']
                : explode(',', (string) $body['robots']);
            $allowed = ['index', 'noindex', 'follow', 'nofollow', 'noarchive', 'noimageindex', 'nosnippet'];
            $robots = array_values(array_unique(array_intersect(
                $allowed,
                array_filter(array_map(function ($directive) {
                    return sanitize_key(trim((string) $directive));
                }, $robots))
            )));

            if ($robots) {
                update_post_meta($post_id, 'rank_math_robots', $robots);
            } else {
                delete_post_meta($post_id, 'rank_math_robots');
            }
        }

        if (array_key_exists('og_title', $body)) {
            update_post_meta($post_id, 'rank_math_og_title', sanitize_text_field($body['og_title']));
        }
        if (array_key_exists('og_description', $body)) {
            update_post_meta($post_id, 'rank_math_og_description', sanitize_textarea_field($body['og_description']));
        }

        if (array_key_exists('featured_image_id', $body)) {
            $attachment_id = absint($body['featured_image_id']);
            if ($attachment_id && wp_attachment_is_image($attachment_id)) {
                set_post_thumbnail($post_id, $attachment_id);
            }
        }

        if (array_key_exists('faq_schema', $body)) {
            $faq_items = [];
            foreach ((array) $body['faq_schema'] as $item) {
                $question = sanitize_text_field($item['question'] ?? '');
                $answer = wp_kses_post($item['answer'] ?? '');
                if ($question && $answer) {
                    $faq_items[] = ['question' => $question, 'answer' => $answer];
                }
            }
            if ($faq_items) {
                update_post_meta($post_id, '_neb_faq_schema', $faq_items);
            } else {
                delete_post_meta($post_id, '_neb_faq_schema');
            }
        }
    }

    public function render_faq_schema() {
        if (!is_singular('post')) {
            return;
        }

        $faq_items = get_post_meta(get_queried_object_id(), '_neb_faq_schema', true);
        if (!is_array($faq_items) || !$faq_items) {
            return;
        }

        $schema = [
            '@context' => 'https://schema.org',
            '@type' => 'FAQPage',
            'mainEntity' => array_map(function ($item) {
                return [
                    '@type' => 'Question',
                    'name' => wp_strip_all_tags($item['question']),
                    'acceptedAnswer' => [
                        '@type' => 'Answer',
                        'text' => wp_strip_all_tags($item['answer']),
                    ],
                ];
            }, $faq_items),
        ];

        echo '<script type="application/ld+json" class="neb-faq-schema">'
            . wp_json_encode($schema, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)
            . '</script>' . "\n";
    }

    private function resolve_author_id($body) {
        if (!empty($body['author_id'])) {
            $user = get_user_by('id', absint($body['author_id']));
            return $user ? (int) $user->ID : 0;
        }

        if (empty($body['author'])) {
            return 0;
        }

        $needle = sanitize_text_field($body['author']);
        foreach (get_users(['fields' => ['ID', 'display_name', 'user_login', 'user_nicename']]) as $user) {
            if (in_array($needle, [$user->display_name, $user->user_login, $user->user_nicename], true)) {
                return (int) $user->ID;
            }
        }

        return 0;
    }

    public function list_blog_posts($request) {
        $posts = get_posts([
            'post_type' => 'post',
            'post_status' => ['publish', 'draft', 'pending', 'private'],
            'posts_per_page' => min(absint($request->get_param('per_page') ?: 100), 250),
            'orderby' => 'date',
            'order' => 'DESC',
        ]);

        return [
            'ok' => true,
            'posts' => array_values(array_filter(array_map(function ($post) {
                return $this->blog_post_response($post->ID);
            }, $posts))),
        ];
    }

    public function create_blog_post($request) {
        $body = $this->get_json_params($request);
        if (empty($body['title'])) {
            return new WP_Error('neb_invalid_post', 'Post title is required.', ['status' => 400]);
        }

        $status = in_array(($body['status'] ?? 'draft'), ['draft', 'publish', 'pending'], true)
            ? $body['status']
            : 'draft';
        $post_data = [
            'post_type' => 'post',
            'post_title' => sanitize_text_field($body['title']),
            'post_name' => sanitize_title($body['slug'] ?? $body['title']),
            'post_content' => wp_kses_post($body['content'] ?? ''),
            'post_excerpt' => sanitize_textarea_field($body['excerpt'] ?? ''),
            'post_status' => $status,
        ];
        $author_id = $this->resolve_author_id($body);
        if ($author_id) {
            $post_data['post_author'] = $author_id;
        }
        $post_id = wp_insert_post(wp_slash($post_data), true);

        if (is_wp_error($post_id)) {
            return $post_id;
        }

        $this->apply_blog_post_fields($post_id, $body);
        clean_post_cache($post_id);
        return $this->blog_post_response($post_id, true);
    }

    public function get_blog_post($request) {
        $post = $this->blog_post_response(absint($request['id']), true);
        return $post ?: new WP_Error('neb_not_found', 'Blog post not found.', ['status' => 404]);
    }

    public function update_blog_post($request) {
        $post_id = absint($request['id']);
        if (!$this->blog_post_response($post_id)) {
            return new WP_Error('neb_not_found', 'Blog post not found.', ['status' => 404]);
        }

        $body = $this->get_json_params($request);
        $update = ['ID' => $post_id];
        if (array_key_exists('title', $body)) $update['post_title'] = sanitize_text_field($body['title']);
        if (array_key_exists('slug', $body)) $update['post_name'] = sanitize_title($body['slug']);
        if (array_key_exists('content', $body)) $update['post_content'] = wp_kses_post($body['content']);
        if (array_key_exists('excerpt', $body)) $update['post_excerpt'] = sanitize_textarea_field($body['excerpt']);
        $author_id = $this->resolve_author_id($body);
        if ($author_id) $update['post_author'] = $author_id;
        if (!empty($body['status']) && in_array($body['status'], ['draft', 'publish', 'pending'], true)) {
            $update['post_status'] = $body['status'];
        }

        if (count($update) > 1) {
            $result = wp_update_post(wp_slash($update), true);
            if (is_wp_error($result)) return $result;
        }

        $this->apply_blog_post_fields($post_id, $body);
        clean_post_cache($post_id);
        return $this->blog_post_response($post_id, true);
    }

    private function format_media_response($attachment_id) {
        $attachment = get_post($attachment_id);
        $metadata = wp_get_attachment_metadata($attachment_id);
        return [
            'id' => (int) $attachment_id,
            'title' => $attachment ? $attachment->post_title : '',
            'slug' => $attachment ? $attachment->post_name : '',
            'caption' => $attachment ? $attachment->post_excerpt : '',
            'description' => $attachment ? $attachment->post_content : '',
            'alt' => get_post_meta($attachment_id, '_wp_attachment_image_alt', true) ?: '',
            'url' => wp_get_attachment_url($attachment_id) ?: '',
            'mime_type' => $attachment ? $attachment->post_mime_type : '',
            'parent_id' => $attachment ? (int) $attachment->post_parent : 0,
            'width' => is_array($metadata) ? (int) ($metadata['width'] ?? 0) : 0,
            'height' => is_array($metadata) ? (int) ($metadata['height'] ?? 0) : 0,
        ];
    }

    public function list_media($request) {
        $page = max(1, absint($request->get_param('page') ?: 1));
        $per_page = min(max(1, absint($request->get_param('per_page') ?: 100)), 250);
        $query_args = [
            'post_type' => 'attachment',
            'post_status' => ['inherit', 'private'],
            'post_mime_type' => 'image',
            'posts_per_page' => $per_page,
            'paged' => $page,
            'orderby' => 'ID',
            'order' => 'DESC',
        ];
        $search = sanitize_text_field($request->get_param('search') ?: '');
        if ($search !== '') {
            $query_args['s'] = $search;
        }

        $query = new WP_Query($query_args);
        return [
            'ok' => true,
            'page' => $page,
            'per_page' => $per_page,
            'total' => (int) $query->found_posts,
            'total_pages' => (int) $query->max_num_pages,
            'media' => array_map(function ($post) {
                return $this->format_media_response($post->ID);
            }, $query->posts),
        ];
    }

    public function update_media($request) {
        $attachment_id = absint($request['id']);
        $attachment = get_post($attachment_id);
        if (!$attachment || $attachment->post_type !== 'attachment' || !wp_attachment_is_image($attachment_id)) {
            return new WP_Error('neb_media_not_found', 'Image attachment not found.', ['status' => 404]);
        }

        $body = $this->get_json_params($request);
        $post_update = ['ID' => $attachment_id];
        if (array_key_exists('title', $body)) {
            $post_update['post_title'] = sanitize_text_field($body['title']);
        }
        if (array_key_exists('caption', $body)) {
            $post_update['post_excerpt'] = sanitize_text_field($body['caption']);
        }
        if (array_key_exists('description', $body)) {
            $post_update['post_content'] = wp_kses_post($body['description']);
        }
        if (count($post_update) > 1) {
            $result = wp_update_post(wp_slash($post_update), true);
            if (is_wp_error($result)) {
                return $result;
            }
        }
        if (array_key_exists('alt', $body)) {
            update_post_meta($attachment_id, '_wp_attachment_image_alt', sanitize_text_field($body['alt']));
        }

        clean_post_cache($attachment_id);
        return ['ok' => true, 'media' => $this->format_media_response($attachment_id)];
    }

    public function upload_media($request) {
        $body = $this->get_json_params($request);
        if (empty($body['data']) || empty($body['filename'])) {
            return new WP_Error('neb_invalid_media', 'Base64 data and filename are required.', ['status' => 400]);
        }

        $binary = base64_decode($body['data'], true);
        if ($binary === false) {
            return new WP_Error('neb_invalid_media', 'Invalid base64 image data.', ['status' => 400]);
        }

        $filename = sanitize_file_name($body['filename']);
        $upload = wp_upload_bits($filename, null, $binary);
        if (!empty($upload['error'])) {
            return new WP_Error('neb_upload_failed', $upload['error'], ['status' => 500]);
        }

        $filetype = wp_check_filetype($upload['file'], null);
        if (strpos((string) ($filetype['type'] ?? ''), 'image/') !== 0) {
            @unlink($upload['file']);
            return new WP_Error('neb_invalid_media', 'Uploaded file must be an image.', ['status' => 400]);
        }

        $attachment_id = wp_insert_attachment([
            'post_mime_type' => $filetype['type'],
            'post_title' => sanitize_text_field($body['title'] ?? pathinfo($filename, PATHINFO_FILENAME)),
            'post_content' => '',
            'post_excerpt' => sanitize_text_field($body['caption'] ?? ''),
            'post_status' => 'inherit',
        ], $upload['file'], absint($body['post_id'] ?? 0), true);

        if (is_wp_error($attachment_id)) {
            @unlink($upload['file']);
            return $attachment_id;
        }

        require_once ABSPATH . 'wp-admin/includes/image.php';
        wp_update_attachment_metadata($attachment_id, wp_generate_attachment_metadata($attachment_id, $upload['file']));
        update_post_meta($attachment_id, '_wp_attachment_image_alt', sanitize_text_field($body['alt'] ?? ''));

        $post_id = absint($body['post_id'] ?? 0);
        $set_featured = !array_key_exists('set_featured', $body) || filter_var($body['set_featured'], FILTER_VALIDATE_BOOLEAN);
        if ($post_id && $set_featured) {
            set_post_thumbnail($post_id, $attachment_id);
            clean_post_cache($post_id);
        }

        return [
            'ok' => true,
            'attachment_id' => $attachment_id,
            'url' => wp_get_attachment_url($attachment_id),
            'post_id' => $post_id,
            'set_featured' => $set_featured,
        ];
    }

    private function blog_category_response($term) {
        return [
            'id' => (int) $term->term_id,
            'name' => $term->name,
            'slug' => $term->slug,
            'count' => (int) $term->count,
            'description' => $term->description,
            'seo_title' => get_term_meta($term->term_id, 'rank_math_title', true) ?: '',
            'seo_description' => get_term_meta($term->term_id, 'rank_math_description', true) ?: '',
        ];
    }

    public function list_blog_categories() {
        $terms = get_terms([
            'taxonomy' => 'category',
            'hide_empty' => false,
            'orderby' => 'name',
            'order' => 'ASC',
        ]);
        if (is_wp_error($terms)) {
            return $terms;
        }

        return [
            'ok' => true,
            'categories' => array_map([$this, 'blog_category_response'], $terms),
        ];
    }

    public function upsert_blog_category($request) {
        $body = $this->get_json_params($request);
        $name = sanitize_text_field($body['name'] ?? '');
        $slug = sanitize_title($body['slug'] ?? $name);
        if (!$name || !$slug) {
            return new WP_Error('neb_invalid_category', 'Category name and slug are required.', ['status' => 400]);
        }

        $existing = get_term_by('slug', $slug, 'category');
        $args = [
            'name' => $name,
            'slug' => $slug,
            'description' => wp_kses_post($body['description'] ?? ''),
        ];
        $result = $existing
            ? wp_update_term($existing->term_id, 'category', $args)
            : wp_insert_term($name, 'category', $args);
        if (is_wp_error($result)) {
            return $result;
        }

        $term_id = (int) ($existing ? $existing->term_id : $result['term_id']);
        if (array_key_exists('seo_title', $body)) {
            update_term_meta($term_id, 'rank_math_title', sanitize_text_field($body['seo_title']));
        }
        if (array_key_exists('seo_description', $body)) {
            update_term_meta($term_id, 'rank_math_description', sanitize_textarea_field($body['seo_description']));
        }

        return [
            'ok' => true,
            'action' => $existing ? 'updated' : 'created',
            'category' => $this->blog_category_response(get_term($term_id, 'category')),
        ];
    }

    public function list_blog_authors() {
        return [
            'ok' => true,
            'authors' => array_map(function ($user) {
                return [
                    'id' => (int) $user->ID,
                    'display_name' => $user->display_name,
                    'slug' => $user->user_nicename,
                    'login' => $user->user_login,
                ];
            }, get_users(['who' => 'authors'])),
        ];
    }
}

Native_Elementor_Bridge::instance();
