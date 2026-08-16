<?php
/**
 * Plugin Name: Native Elementor Bridge
 * Description: REST bridge for native-first AI Elementor generation. Pushes editable Elementor container/widget JSON and exports saved templates for feedback learning.
 * Version: 0.9.0
 * Author: Deshtech Global Pvt Ltd
 * License: GPL v2 or later
 * Requires PHP: 7.4
 * Requires at least: 6.0
 */

if (!defined('ABSPATH')) {
    exit;
}

define('NEB_VERSION', '0.9.0');

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
        add_filter('jet-woo-builder/custom-single-template', [$this, 'resolve_jetwoo_single_template'], 20, 1);
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
                <tr>
                    <th>WooCommerce</th>
                    <td><?php echo class_exists('WooCommerce') ? 'Active' : 'Not active'; ?></td>
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

        register_rest_route($this->namespace, '/rank-math/redirections', [
            'methods' => 'GET',
            'callback' => [$this, 'list_rank_math_redirections'],
            'permission_callback' => [$this, 'permission_check'],
        ]);

        register_rest_route($this->namespace, '/rank-math/redirections', [
            'methods' => 'POST',
            'callback' => [$this, 'upsert_rank_math_redirections'],
            'permission_callback' => [$this, 'permission_check'],
        ]);

        register_rest_route($this->namespace, '/rank-math/local-business', [
            'methods' => 'GET',
            'callback' => [$this, 'get_rank_math_local_business'],
            'permission_callback' => [$this, 'permission_check'],
        ]);

        register_rest_route($this->namespace, '/rank-math/local-business', [
            'methods' => 'PUT',
            'callback' => [$this, 'update_rank_math_local_business'],
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

        register_rest_route($this->namespace, '/woocommerce/categories', [
            'methods' => 'GET',
            'callback' => [$this, 'list_woo_categories'],
            'permission_callback' => [$this, 'permission_check'],
        ]);

        register_rest_route($this->namespace, '/woocommerce/categories', [
            'methods' => 'POST',
            'callback' => [$this, 'upsert_woo_category'],
            'permission_callback' => [$this, 'permission_check'],
        ]);

        register_rest_route($this->namespace, '/woocommerce/products', [
            'methods' => 'GET',
            'callback' => [$this, 'list_woo_products'],
            'permission_callback' => [$this, 'permission_check'],
        ]);

        register_rest_route($this->namespace, '/woocommerce/products', [
            'methods' => 'POST',
            'callback' => [$this, 'upsert_woo_product'],
            'permission_callback' => [$this, 'permission_check'],
        ]);

        register_rest_route($this->namespace, '/woocommerce/products/(?P<id>\d+)', [
            'methods' => 'GET',
            'callback' => [$this, 'get_woo_product'],
            'permission_callback' => [$this, 'permission_check'],
        ]);

        register_rest_route($this->namespace, '/woocommerce/products/(?P<id>\d+)', [
            'methods' => 'PUT',
            'callback' => [$this, 'update_woo_product'],
            'permission_callback' => [$this, 'permission_check'],
        ]);

        register_rest_route($this->namespace, '/jetwoo/templates', [
            'methods' => 'GET',
            'callback' => [$this, 'list_jetwoo_templates'],
            'permission_callback' => [$this, 'permission_check'],
        ]);

        register_rest_route($this->namespace, '/jetwoo/templates', [
            'methods' => 'POST',
            'callback' => [$this, 'create_jetwoo_template'],
            'permission_callback' => [$this, 'permission_check'],
        ]);

        register_rest_route($this->namespace, '/jetwoo/templates/(?P<id>\d+)', [
            'methods' => 'GET',
            'callback' => [$this, 'get_jetwoo_template'],
            'permission_callback' => [$this, 'permission_check'],
        ]);

        register_rest_route($this->namespace, '/jetwoo/templates/(?P<id>\d+)', [
            'methods' => 'PUT',
            'callback' => [$this, 'update_jetwoo_template'],
            'permission_callback' => [$this, 'permission_check'],
        ]);

        register_rest_route($this->namespace, '/jetwoo/single-rules', [
            'methods' => 'GET',
            'callback' => [$this, 'get_jetwoo_single_rules'],
            'permission_callback' => [$this, 'permission_check'],
        ]);

        register_rest_route($this->namespace, '/jetwoo/single-rules', [
            'methods' => 'PUT',
            'callback' => [$this, 'update_jetwoo_single_rules'],
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
            'woocommerce' => class_exists('WooCommerce') && class_exists('WC_Product'),
            'woocommerce_version' => defined('WC_VERSION') ? WC_VERSION : null,
            'jetwoo_builder' => post_type_exists('jet-woo-builder'),
            'jetwoo_single_rules' => count($this->read_jetwoo_single_rules()),
            'rank_math' => defined('RANK_MATH_VERSION'),
            'rank_math_version' => defined('RANK_MATH_VERSION') ? RANK_MATH_VERSION : null,
            'rank_math_redirections' => $this->rank_math_redirections_available(),
            'rank_math_local_business' => $this->rank_math_local_business_available(),
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
            'rank_math_sitemap' => false,
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

        if (class_exists('\\RankMath\\Sitemap\\Cache') && method_exists('\\RankMath\\Sitemap\\Cache', 'invalidate_storage')) {
            try {
                \RankMath\Sitemap\Cache::invalidate_storage();
                $results['rank_math_sitemap'] = true;
            } catch (\Throwable $error) {
                $results['rank_math_sitemap_error'] = $error->getMessage();
            }
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
        $parent_id = absint($body['parent_id'] ?? ($body['parent'] ?? 0));

        if ($parent_id) {
            $parent = get_post($parent_id);
            if (!$parent || $parent->post_type !== 'page') {
                return new WP_Error('neb_invalid_parent', 'Parent page not found.', ['status' => 400]);
            }
        }

        $post_id = wp_insert_post([
            'post_title' => $title,
            'post_status' => $status,
            'post_type' => 'page',
            'post_name' => sanitize_title($body['slug'] ?? $title),
            'post_parent' => $parent_id,
            'menu_order' => array_key_exists('menu_order', $body) ? intval($body['menu_order']) : 0,
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
        if (array_key_exists('parent_id', $body) || array_key_exists('parent', $body)) {
            $parent_id = absint($body['parent_id'] ?? ($body['parent'] ?? 0));
            if ($parent_id) {
                $parent = get_post($parent_id);
                if (!$parent || $parent->post_type !== 'page') {
                    return new WP_Error('neb_invalid_parent', 'Parent page not found.', ['status' => 400]);
                }
            }
            $post_update['post_parent'] = $parent_id;
        }
        if (array_key_exists('menu_order', $body)) {
            $post_update['menu_order'] = intval($body['menu_order']);
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
            'parent_id' => (int) $post->post_parent,
            'menu_order' => (int) $post->menu_order,
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
            'parent_id' => $post ? (int) $post->post_parent : 0,
            'menu_order' => $post ? (int) $post->menu_order : 0,
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
        $formatted_items = array_map(function ($item) {
            return $this->format_menu_item($item);
        }, is_array($items) ? $items : []);
        return [
            'id' => $menu->term_id,
            'name' => $menu->name,
            'slug' => $menu->slug,
            'count' => $menu->count,
            'locations' => $this->get_menu_locations($menu->term_id),
            'items' => $formatted_items,
            'tree' => $this->build_menu_tree($formatted_items),
        ];
    }

    private function format_menu_item($item) {
        return [
            'id' => (int) $item->ID,
            'db_id' => (int) $item->db_id,
            'title' => html_entity_decode($item->title, ENT_QUOTES, get_bloginfo('charset')),
            'url' => $item->url,
            'menu_order' => (int) $item->menu_order,
            'parent' => (string) $item->menu_item_parent,
            'parent_id' => (int) $item->menu_item_parent,
            'type' => $item->type,
            'object' => $item->object,
            'object_id' => (int) $item->object_id,
            'target' => $item->target,
            'attr_title' => $item->attr_title,
            'description' => $item->description,
            'classes' => is_array($item->classes) ? array_values(array_filter($item->classes)) : [],
            'xfn' => $item->xfn,
            'source_key' => get_post_meta($item->ID, '_neb_menu_source_key', true),
        ];
    }

    private function get_menu_locations($menu_id) {
        $locations = get_nav_menu_locations();
        $matched = [];
        foreach ($locations as $location => $assigned_menu_id) {
            if ((int) $assigned_menu_id === (int) $menu_id) {
                $matched[] = $location;
            }
        }
        return $matched;
    }

    private function build_menu_tree($items, $parent_id = 0) {
        $branch = [];
        foreach ($items as $item) {
            if ((int) $item['parent_id'] !== (int) $parent_id) {
                continue;
            }
            $children = $this->build_menu_tree($items, $item['id']);
            if ($children) {
                $item['children'] = $children;
            }
            $branch[] = $item;
        }
        usort($branch, function ($a, $b) {
            return ($a['menu_order'] <=> $b['menu_order']);
        });
        return $branch;
    }

    public function list_menus() {
        return [
            'ok' => true,
            'menus' => array_map([$this, 'format_menu'], wp_get_nav_menus()),
        ];
    }

    public function upsert_menu($request) {
        $body = $this->get_json_params($request);
        $has_name = array_key_exists('name', $body);
        $has_slug = array_key_exists('slug', $body);
        $name = sanitize_text_field($body['name'] ?? 'Native Generated Menu');
        $slug = sanitize_title($body['slug'] ?? $name);
        $items = is_array($body['items'] ?? null) ? $body['items'] : [];
        $menu_id = isset($body['menu_id']) ? intval($body['menu_id']) : 0;
        $dry_run = filter_var($body['dry_run'] ?? false, FILTER_VALIDATE_BOOLEAN);
        $mode = sanitize_key($body['mode'] ?? 'replace');
        if (!in_array($mode, ['replace', 'append'], true)) {
            return new WP_Error('neb_invalid_menu_mode', 'Menu mode must be replace or append.', ['status' => 400]);
        }

        $menu = $menu_id > 0 ? wp_get_nav_menu_object($menu_id) : null;
        if (!$menu && $slug) {
            $menu = wp_get_nav_menu_object($slug);
        }
        if (!$menu) {
            $menu = wp_get_nav_menu_object($name);
        }
        if ($menu) {
            if (!$has_name) {
                $name = $menu->name;
            }
            if (!$has_slug) {
                $slug = $menu->slug;
            }
        }

        $existing_menu_items = $menu ? wp_get_nav_menu_items($menu->term_id) : [];
        $plan = $this->plan_menu_items($items, is_array($existing_menu_items) ? $existing_menu_items : [], $mode);

        if ($dry_run) {
            return [
                'ok' => true,
                'dry_run' => true,
                'mode' => $mode,
                'menu' => $menu ? $this->format_menu($menu) : null,
                'planned_menu' => [
                    'name' => $name,
                    'slug' => $slug,
                    'items' => $plan['items'],
                    'delete_ids' => $plan['delete_ids'],
                ],
                'summary' => $plan['summary'],
            ];
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
        $existing_items = is_array($existing_items) ? $existing_items : [];
        $state = [
            'used_ids' => [],
            'order' => 1,
            'operations' => [],
        ];

        foreach ($items as $item) {
            $result = $this->upsert_menu_item_tree($menu_id, $item, 0, $existing_items, $state);
            if (is_wp_error($result)) {
                return $result;
            }
        }

        $deleted_ids = [];
        if ($mode === 'replace') {
            foreach ($existing_items as $existing_item) {
                $existing_id = (int) $existing_item->ID;
                if (!in_array($existing_id, $state['used_ids'], true)) {
                    wp_delete_post($existing_id, true);
                    $deleted_ids[] = $existing_id;
                }
            }
        }

        return [
            'ok' => true,
            'dry_run' => false,
            'mode' => $mode,
            'operations' => $state['operations'],
            'deleted_ids' => $deleted_ids,
            'menu' => $this->format_menu(wp_get_nav_menu_object($menu_id)),
        ];
    }

    private function plan_menu_items($items, $existing_items, $mode) {
        $flat = [];
        $summary = [
            'input_count' => 0,
            'create_count' => 0,
            'update_count' => 0,
            'delete_count' => 0,
        ];
        $used_ids = [];
        $this->plan_menu_item_tree($items, $existing_items, 0, $flat, $summary, $used_ids);
        if ($mode === 'replace') {
            foreach ($existing_items as $existing_item) {
                if (!in_array((int) $existing_item->ID, $used_ids, true)) {
                    $summary['delete_count'] += 1;
                }
            }
        }
        return [
            'items' => $flat,
            'delete_ids' => $mode === 'replace'
                ? array_values(array_filter(array_map(function ($existing_item) use ($used_ids) {
                    return in_array((int) $existing_item->ID, $used_ids, true) ? null : (int) $existing_item->ID;
                }, $existing_items)))
                : [],
            'summary' => $summary,
        ];
    }

    private function plan_menu_item_tree($items, $existing_items, $parent_hint, &$flat, &$summary, &$used_ids) {
        foreach ($items as $item) {
            $summary['input_count'] += 1;
            $existing_item = $this->find_existing_menu_item($existing_items, $item, $used_ids);
            if ($existing_item) {
                $used_ids[] = (int) $existing_item->ID;
                $summary['update_count'] += 1;
            } else {
                $summary['create_count'] += 1;
            }
            $prepared = $this->prepare_menu_item_args($item, $parent_hint, count($flat) + 1);
            if (is_wp_error($prepared)) {
                $flat[] = [
                    'error' => $prepared->get_error_message(),
                    'input' => $item,
                ];
                continue;
            }
            $flat[] = [
                'action' => $existing_item ? 'update' : 'create',
                'existing_id' => $existing_item ? (int) $existing_item->ID : null,
                'title' => $prepared['menu-item-title'],
                'url' => $prepared['menu-item-url'] ?? '',
                'type' => $prepared['menu-item-type'],
                'object' => $prepared['menu-item-object'] ?? '',
                'object_id' => $prepared['menu-item-object-id'] ?? 0,
                'parent_hint' => $parent_hint,
            ];
            if (isset($item['children']) && is_array($item['children'])) {
                $this->plan_menu_item_tree($item['children'], $existing_items, $existing_item ? (int) $existing_item->ID : 0, $flat, $summary, $used_ids);
            }
        }
    }

    private function upsert_menu_item_tree($menu_id, $item, $parent_id, $existing_items, &$state) {
        $existing_item = $this->find_existing_menu_item($existing_items, $item, $state['used_ids']);
        $db_id = $existing_item ? (int) $existing_item->ID : 0;
        $args = $this->prepare_menu_item_args($item, $parent_id, $state['order']);
        if (is_wp_error($args)) {
            return $args;
        }
        $item_id = wp_update_nav_menu_item($menu_id, $db_id, $args);
        if (is_wp_error($item_id)) {
            return $item_id;
        }
        $item_id = (int) $item_id;
        $state['used_ids'][] = $item_id;
        $state['operations'][] = [
            'action' => $db_id ? 'updated' : 'created',
            'id' => $item_id,
            'title' => $args['menu-item-title'],
            'parent_id' => (int) $parent_id,
            'position' => (int) $state['order'],
        ];
        if (!empty($item['source_key'])) {
            update_post_meta($item_id, '_neb_menu_source_key', sanitize_key($item['source_key']));
        }
        $state['order'] += 1;

        if (isset($item['children']) && is_array($item['children'])) {
            foreach ($item['children'] as $child_item) {
                $child_result = $this->upsert_menu_item_tree($menu_id, $child_item, $item_id, $existing_items, $state);
                if (is_wp_error($child_result)) {
                    return $child_result;
                }
            }
        }
        return $item_id;
    }

    private function find_existing_menu_item($existing_items, $item, $used_ids) {
        $requested_id = intval($item['id'] ?? $item['menu_item_id'] ?? $item['existing_id'] ?? 0);
        if ($requested_id > 0) {
            foreach ($existing_items as $existing_item) {
                if ((int) $existing_item->ID === $requested_id && !in_array($requested_id, $used_ids, true)) {
                    return $existing_item;
                }
            }
        }

        $source_key = sanitize_key($item['source_key'] ?? '');
        if ($source_key) {
            foreach ($existing_items as $existing_item) {
                $existing_id = (int) $existing_item->ID;
                if (in_array($existing_id, $used_ids, true)) {
                    continue;
                }
                if (get_post_meta($existing_id, '_neb_menu_source_key', true) === $source_key) {
                    return $existing_item;
                }
            }
        }

        $object_id = intval($item['object_id'] ?? $item['page_id'] ?? 0);
        if ($object_id > 0) {
            foreach ($existing_items as $existing_item) {
                $existing_id = (int) $existing_item->ID;
                if (!in_array($existing_id, $used_ids, true) && (int) $existing_item->object_id === $object_id) {
                    return $existing_item;
                }
            }
        }

        $url = esc_url_raw($item['url'] ?? '');
        if ($url) {
            foreach ($existing_items as $existing_item) {
                $existing_id = (int) $existing_item->ID;
                if (!in_array($existing_id, $used_ids, true) && untrailingslashit($existing_item->url) === untrailingslashit($url)) {
                    return $existing_item;
                }
            }
        }

        return null;
    }

    private function prepare_menu_item_args($item, $parent_id, $position) {
        $title = sanitize_text_field($item['label'] ?? $item['title'] ?? 'Menu Item');
        $object_id = intval($item['object_id'] ?? $item['page_id'] ?? 0);
        $type = sanitize_key($item['type'] ?? ($object_id > 0 ? 'post_type' : 'custom'));
        $object = sanitize_key($item['object'] ?? ($object_id > 0 ? 'page' : 'custom'));
        $classes = $item['classes'] ?? [];
        if (!is_array($classes)) {
            $classes = preg_split('/\s+/', (string) $classes);
        }

        $args = [
            'menu-item-title' => $title,
            'menu-item-status' => sanitize_key($item['status'] ?? 'publish'),
            'menu-item-position' => intval($item['position'] ?? $position),
            'menu-item-parent-id' => intval($item['parent_id'] ?? $parent_id),
            'menu-item-target' => sanitize_text_field($item['target'] ?? ''),
            'menu-item-attr-title' => sanitize_text_field($item['attr_title'] ?? ''),
            'menu-item-description' => sanitize_textarea_field($item['description'] ?? ''),
            'menu-item-classes' => implode(' ', array_map('sanitize_html_class', array_filter($classes))),
            'menu-item-xfn' => sanitize_text_field($item['xfn'] ?? ''),
        ];

        if ($type === 'post_type') {
            if ($object_id <= 0) {
                return new WP_Error('neb_missing_menu_object_id', 'post_type menu items require object_id or page_id.', ['status' => 400]);
            }
            $post = get_post($object_id);
            if (!$post) {
                return new WP_Error('neb_invalid_menu_object_id', 'Menu object_id does not reference an existing post.', ['status' => 400]);
            }
            $args['menu-item-type'] = 'post_type';
            $args['menu-item-object'] = $object ?: $post->post_type;
            $args['menu-item-object-id'] = $object_id;
            $args['menu-item-url'] = get_permalink($object_id);
            if (($item['label'] ?? $item['title'] ?? '') === '') {
                $args['menu-item-title'] = get_the_title($object_id);
            }
            return $args;
        }

        $args['menu-item-type'] = 'custom';
        $args['menu-item-url'] = esc_url_raw($item['url'] ?? '/');
        return $args;
    }

    private function rank_math_redirections_available() {
        return defined('RANK_MATH_VERSION')
            && class_exists('\\RankMath\\Helper')
            && method_exists('\\RankMath\\Helper', 'is_module_active')
            && \RankMath\Helper::is_module_active('redirections')
            && class_exists('\\RankMath\\Redirections\\DB')
            && class_exists('\\RankMath\\Redirections\\Redirection');
    }

    private function rank_math_local_business_available() {
        return defined('RANK_MATH_VERSION')
            && class_exists('\\RankMath\\Helper')
            && method_exists('\\RankMath\\Helper', 'clear_cache');
    }

    private function sanitize_rank_math_opening_hours($hours) {
        if (!is_array($hours) || empty($hours)) {
            return new WP_Error('neb_invalid_opening_hours', 'opening_hours must be a non-empty array.', ['status' => 400]);
        }
        if (count($hours) > 14) {
            return new WP_Error('neb_too_many_opening_hours', 'opening_hours cannot contain more than 14 entries.', ['status' => 400]);
        }

        $valid_days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        $clean = [];
        $seen = [];
        foreach ($hours as $index => $hour) {
            if (!is_array($hour)) {
                return new WP_Error('neb_invalid_opening_hour', 'Each opening-hours entry must be an object.', ['status' => 400, 'index' => $index]);
            }
            $day = sanitize_text_field($hour['day'] ?? '');
            $time = sanitize_text_field($hour['time'] ?? '');
            if (!in_array($day, $valid_days, true)) {
                return new WP_Error('neb_invalid_opening_day', 'Invalid opening-hours day.', ['status' => 400, 'index' => $index, 'day' => $day]);
            }
            if (!preg_match('/^(?:[01]\\d|2[0-3]):[0-5]\\d-(?:[01]\\d|2[0-3]):[0-5]\\d$/', $time)) {
                return new WP_Error('neb_invalid_opening_time', 'Opening-hours time must use HH:MM-HH:MM in 24-hour format.', ['status' => 400, 'index' => $index]);
            }
            $key = $day . '|' . $time;
            if (isset($seen[$key])) {
                return new WP_Error('neb_duplicate_opening_hour', 'Duplicate opening-hours entry.', ['status' => 400, 'index' => $index]);
            }
            $seen[$key] = true;
            $clean[] = ['day' => $day, 'time' => $time];
        }
        return $clean;
    }

    public function get_rank_math_local_business() {
        if (!$this->rank_math_local_business_available()) {
            return new WP_Error('neb_rank_math_local_business_unavailable', 'Rank Math Local Business settings are unavailable.', ['status' => 409]);
        }
        $options = get_option('rank-math-options-titles', []);
        $options = is_array($options) ? $options : [];
        return [
            'ok' => true,
            'opening_hours' => is_array($options['opening_hours'] ?? null) ? array_values($options['opening_hours']) : [],
            'opening_hours_format' => ($options['opening_hours_format'] ?? 'off') === 'on' ? 'on' : 'off',
        ];
    }

    public function update_rank_math_local_business($request) {
        if (!$this->rank_math_local_business_available()) {
            return new WP_Error('neb_rank_math_local_business_unavailable', 'Rank Math Local Business settings are unavailable.', ['status' => 409]);
        }
        $body = $this->get_json_params($request);
        $hours = $this->sanitize_rank_math_opening_hours($body['opening_hours'] ?? null);
        if (is_wp_error($hours)) {
            return $hours;
        }
        $format = sanitize_key($body['opening_hours_format'] ?? 'on');
        if (!in_array($format, ['on', 'off'], true)) {
            return new WP_Error('neb_invalid_opening_hours_format', 'opening_hours_format must be on or off.', ['status' => 400]);
        }
        $dry_run = filter_var($body['dry_run'] ?? true, FILTER_VALIDATE_BOOLEAN);
        $options = get_option('rank-math-options-titles', []);
        $options = is_array($options) ? $options : [];
        $current_hours = is_array($options['opening_hours'] ?? null) ? array_values($options['opening_hours']) : [];
        $current_format = ($options['opening_hours_format'] ?? 'off') === 'on' ? 'on' : 'off';
        $changed = $current_hours !== $hours || $current_format !== $format;
        $plan = [
            'opening_hours' => ['current' => $current_hours, 'requested' => $hours],
            'opening_hours_format' => ['current' => $current_format, 'requested' => $format],
            'operation' => $changed ? 'update' : 'unchanged',
        ];
        if ($dry_run || !$changed) {
            return ['ok' => true, 'dry_run' => $dry_run, 'plan' => $plan];
        }

        $options['opening_hours'] = $hours;
        $options['opening_hours_format'] = $format;
        if (!update_option('rank-math-options-titles', $options, false)) {
            return new WP_Error('neb_rank_math_local_business_save_failed', 'Rank Math Local Business settings could not be saved.', ['status' => 500]);
        }
        \RankMath\Helper::clear_cache('native-elementor-bridge/local-business');
        $this->clear_elementor_cache(0);

        $verified = get_option('rank-math-options-titles', []);
        $verified_hours = is_array($verified['opening_hours'] ?? null) ? array_values($verified['opening_hours']) : [];
        $verified_format = ($verified['opening_hours_format'] ?? 'off') === 'on' ? 'on' : 'off';
        if ($verified_hours !== $hours || $verified_format !== $format) {
            return new WP_Error('neb_rank_math_local_business_verification_failed', 'Rank Math Local Business settings did not match after save.', ['status' => 500]);
        }
        return ['ok' => true, 'dry_run' => false, 'plan' => $plan, 'verified' => true];
    }

    private function normalize_redirect_route($value, $allow_home = false) {
        $value = trim((string) $value);
        if ($value === '') {
            return false;
        }

        $parts = wp_parse_url($value);
        if ($parts === false) {
            return false;
        }

        if (!empty($parts['host'])) {
            $home_host = strtolower((string) wp_parse_url(home_url('/'), PHP_URL_HOST));
            if (strtolower((string) $parts['host']) !== $home_host) {
                return false;
            }
        }

        $path = isset($parts['path']) ? '/' . ltrim($parts['path'], '/') : '/';
        $path = preg_replace('#/+#', '/', $path);
        if ($path !== '/') {
            $path = trailingslashit($path);
        }
        if (!$allow_home && $path === '/') {
            return false;
        }

        if (!empty($parts['query'])) {
            $path .= '?' . $parts['query'];
        }
        return $path;
    }

    private function format_rank_math_redirection($item) {
        $sources = maybe_unserialize($item['sources'] ?? []);
        if (!is_array($sources)) {
            $sources = [];
        }

        $formatted_sources = [];
        foreach ($sources as $source) {
            $pattern = (string) ($source['pattern'] ?? '');
            $formatted_sources[] = [
                'pattern' => $pattern,
                'route' => $this->normalize_redirect_route($pattern, false),
                'comparison' => sanitize_key($source['comparison'] ?? 'exact'),
                'ignore_case' => ($source['ignore'] ?? '') === 'case',
            ];
        }

        return [
            'id' => absint($item['id'] ?? 0),
            'sources' => $formatted_sources,
            'destination' => esc_url_raw($item['url_to'] ?? ''),
            'destination_route' => $this->normalize_redirect_route($item['url_to'] ?? '', true),
            'type' => absint($item['header_code'] ?? 301),
            'status' => sanitize_key($item['status'] ?? 'inactive'),
            'hits' => absint($item['hits'] ?? 0),
            'created' => sanitize_text_field($item['created'] ?? ''),
            'updated' => sanitize_text_field($item['updated'] ?? ''),
            'last_accessed' => sanitize_text_field($item['last_accessed'] ?? ''),
        ];
    }

    private function read_rank_math_redirections() {
        if (!$this->rank_math_redirections_available()) {
            return new WP_Error(
                'neb_rank_math_redirections_unavailable',
                'Rank Math Redirections is unavailable. Activate the Rank Math Redirections module first.',
                ['status' => 409]
            );
        }

        $result = \RankMath\Redirections\DB::get_redirections([
            'limit' => 10000,
            'paged' => 1,
            'status' => 'any',
            'orderby' => 'id',
            'order' => 'ASC',
        ]);
        $items = is_array($result['redirections'] ?? null) ? $result['redirections'] : [];
        return array_map([$this, 'format_rank_math_redirection'], $items);
    }

    public function list_rank_math_redirections($request) {
        $items = $this->read_rank_math_redirections();
        if (is_wp_error($items)) {
            return $items;
        }

        $status = sanitize_key($request->get_param('status') ?? 'any');
        if (in_array($status, ['active', 'inactive', 'trashed'], true)) {
            $items = array_values(array_filter($items, function($item) use ($status) {
                return $item['status'] === $status;
            }));
        }

        return [
            'ok' => true,
            'rank_math_version' => defined('RANK_MATH_VERSION') ? RANK_MATH_VERSION : null,
            'redirections_available' => true,
            'count' => count($items),
            'redirections' => $items,
        ];
    }

    private function prepare_rank_math_redirect_plan($requested, $existing) {
        $allowed_types = [301, 302, 307];
        $allowed_statuses = ['active', 'inactive'];
        $existing_by_source = [];

        foreach ($existing as $redirection) {
            foreach ($redirection['sources'] as $source) {
                if ($source['comparison'] !== 'exact' || !$source['route']) {
                    continue;
                }
                if (isset($existing_by_source[$source['route']])) {
                    return new WP_Error(
                        'neb_duplicate_existing_redirect_source',
                        'Multiple existing Rank Math rules use the same exact source: ' . $source['route'],
                        ['status' => 409]
                    );
                }
                $existing_by_source[$source['route']] = $redirection;
            }
        }

        $prepared = [];
        $requested_sources = [];
        foreach ($requested as $index => $item) {
            if (!is_array($item)) {
                return new WP_Error('neb_invalid_redirect', 'Each redirect must be an object.', ['status' => 400]);
            }

            $source = $this->normalize_redirect_route($item['source'] ?? '', false);
            $destination_route = $this->normalize_redirect_route($item['destination'] ?? '', false);
            $type = absint($item['type'] ?? 301);
            $status = sanitize_key($item['status'] ?? 'active');
            $ignore_case = filter_var($item['ignore_case'] ?? false, FILTER_VALIDATE_BOOLEAN);

            if (!$source) {
                return new WP_Error('neb_invalid_redirect_source', 'Redirect source must be a non-homepage URL on this site.', ['status' => 400, 'index' => $index]);
            }
            if (!$destination_route) {
                return new WP_Error('neb_invalid_redirect_destination', 'Redirect destination must be a non-homepage URL on this site.', ['status' => 400, 'index' => $index]);
            }
            if ($source === $destination_route) {
                return new WP_Error('neb_redirect_loop', 'Redirect source and destination cannot be identical: ' . $source, ['status' => 409]);
            }
            if (!in_array($type, $allowed_types, true)) {
                return new WP_Error('neb_invalid_redirect_type', 'Redirect type must be 301, 302, or 307.', ['status' => 400, 'index' => $index]);
            }
            if (!in_array($status, $allowed_statuses, true)) {
                return new WP_Error('neb_invalid_redirect_status', 'Redirect status must be active or inactive.', ['status' => 400, 'index' => $index]);
            }
            if (isset($requested_sources[$source])) {
                return new WP_Error('neb_duplicate_redirect_source', 'Duplicate redirect source in request: ' . $source, ['status' => 409]);
            }

            $requested_sources[$source] = true;
            $prepared[] = [
                'source' => $source,
                'destination' => home_url($destination_route),
                'destination_route' => $destination_route,
                'type' => $type,
                'status' => $status,
                'ignore_case' => $ignore_case,
            ];
        }

        foreach ($prepared as $item) {
            if (isset($requested_sources[$item['destination_route']])) {
                return new WP_Error(
                    'neb_redirect_chain',
                    'The batch would create a redirect chain through ' . $item['destination_route'],
                    ['status' => 409]
                );
            }
            $existing_destination = $existing_by_source[$item['destination_route']] ?? null;
            if ($existing_destination && $existing_destination['status'] === 'active') {
                return new WP_Error(
                    'neb_existing_redirect_chain',
                    'The destination already redirects through Rank Math: ' . $item['destination_route'],
                    ['status' => 409, 'existing_id' => $existing_destination['id']]
                );
            }
        }

        $operations = [];
        foreach ($prepared as $item) {
            $existing_item = $existing_by_source[$item['source']] ?? null;
            if (!$existing_item) {
                $operations[] = array_merge($item, ['operation' => 'create', 'id' => 0]);
                continue;
            }

            $same = untrailingslashit($existing_item['destination']) === untrailingslashit($item['destination'])
                && (int) $existing_item['type'] === (int) $item['type']
                && $existing_item['status'] === $item['status']
                && (bool) ($existing_item['sources'][0]['ignore_case'] ?? false) === $item['ignore_case'];
            if ($same) {
                $operations[] = array_merge($item, ['operation' => 'unchanged', 'id' => $existing_item['id']]);
                continue;
            }

            if (count($existing_item['sources']) !== 1) {
                return new WP_Error(
                    'neb_shared_redirect_conflict',
                    'Cannot safely update source ' . $item['source'] . ' because its existing Rank Math rule has multiple sources.',
                    ['status' => 409, 'existing_id' => $existing_item['id']]
                );
            }
            $operations[] = array_merge($item, ['operation' => 'update', 'id' => $existing_item['id']]);
        }

        return $operations;
    }

    public function upsert_rank_math_redirections($request) {
        $body = $this->get_json_params($request);
        $requested = is_array($body['redirections'] ?? null) ? array_values($body['redirections']) : [];
        $dry_run = filter_var($body['dry_run'] ?? true, FILTER_VALIDATE_BOOLEAN);
        if (empty($requested)) {
            return new WP_Error('neb_empty_redirect_batch', 'redirections must contain at least one item.', ['status' => 400]);
        }

        $existing = $this->read_rank_math_redirections();
        if (is_wp_error($existing)) {
            return $existing;
        }
        $operations = $this->prepare_rank_math_redirect_plan($requested, $existing);
        if (is_wp_error($operations)) {
            return $operations;
        }

        $summary = [
            'create' => count(array_filter($operations, function($item) { return $item['operation'] === 'create'; })),
            'update' => count(array_filter($operations, function($item) { return $item['operation'] === 'update'; })),
            'unchanged' => count(array_filter($operations, function($item) { return $item['operation'] === 'unchanged'; })),
        ];
        if ($dry_run) {
            return [
                'ok' => true,
                'dry_run' => true,
                'summary' => $summary,
                'operations' => $operations,
            ];
        }

        global $wpdb;
        $wpdb->query('START TRANSACTION');
        $saved = [];
        try {
            foreach ($operations as $operation) {
                if ($operation['operation'] === 'unchanged') {
                    $saved[] = $operation;
                    continue;
                }

                $data = [
                    'sources' => [[
                        'pattern' => $operation['source'],
                        'comparison' => 'exact',
                        'ignore' => $operation['ignore_case'] ? 'case' : '',
                    ]],
                    'url_to' => $operation['destination'],
                    'header_code' => $operation['type'],
                    'status' => $operation['status'],
                ];
                if ($operation['id'] > 0) {
                    $data['id'] = $operation['id'];
                }

                $redirection = \RankMath\Redirections\Redirection::from($data);
                if ($redirection->is_infinite_loop()) {
                    throw new Exception('Rank Math detected an infinite loop for ' . $operation['source']);
                }
                $saved_id = $redirection->save();
                if (!$saved_id) {
                    throw new Exception('Rank Math failed to save redirect for ' . $operation['source']);
                }
                do_action('rank_math/redirection/saved', $redirection, $data);
                $operation['id'] = absint($saved_id);
                $saved[] = $operation;
            }
            $wpdb->query('COMMIT');
        } catch (Throwable $error) {
            $wpdb->query('ROLLBACK');
            return new WP_Error('neb_redirect_batch_failed', $error->getMessage(), ['status' => 500]);
        }

        $verified = $this->read_rank_math_redirections();
        if (is_wp_error($verified)) {
            return $verified;
        }
        $verification_by_source = [];
        foreach ($verified as $item) {
            foreach ($item['sources'] as $source) {
                if ($source['comparison'] === 'exact' && $source['route']) {
                    $verification_by_source[$source['route']] = $item;
                }
            }
        }

        $failures = [];
        foreach ($operations as $operation) {
            $actual = $verification_by_source[$operation['source']] ?? null;
            if (!$actual
                || untrailingslashit($actual['destination']) !== untrailingslashit($operation['destination'])
                || (int) $actual['type'] !== (int) $operation['type']
                || $actual['status'] !== $operation['status']
                || (bool) ($actual['sources'][0]['ignore_case'] ?? false) !== $operation['ignore_case']) {
                $failures[] = ['expected' => $operation, 'actual' => $actual];
            }
        }
        if (!empty($failures)) {
            return new WP_Error(
                'neb_redirect_verification_failed',
                'One or more redirects did not match after save.',
                ['status' => 500, 'failures' => $failures]
            );
        }

        return [
            'ok' => true,
            'dry_run' => false,
            'summary' => $summary,
            'operations' => $saved,
            'verified' => count($operations),
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
            'date_gmt' => $post->post_date_gmt,
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

    private function sanitize_blog_status($status, $fallback = 'draft') {
        $status = sanitize_key((string) $status);
        return in_array($status, ['draft', 'publish', 'pending', 'future'], true)
            ? $status
            : $fallback;
    }

    private function apply_blog_dates(&$post_data, $body) {
        $has_date = false;
        if (!empty($body['date'])) {
            $timestamp = strtotime((string) $body['date']);
            if ($timestamp !== false) {
                $post_data['post_date'] = date('Y-m-d H:i:s', $timestamp);
                $has_date = true;
            }
        }

        if (!empty($body['date_gmt'])) {
            $timestamp_gmt = strtotime((string) $body['date_gmt']);
            if ($timestamp_gmt !== false) {
                $post_data['post_date_gmt'] = gmdate('Y-m-d H:i:s', $timestamp_gmt);
                $has_date = true;
            }
        }

        if ($has_date) {
            $post_data['edit_date'] = true;
        }
    }

    public function list_blog_posts($request) {
        $posts = get_posts([
            'post_type' => 'post',
            'post_status' => ['publish', 'draft', 'pending', 'future', 'private'],
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

        $status = $this->sanitize_blog_status($body['status'] ?? 'draft');
        $post_data = [
            'post_type' => 'post',
            'post_title' => sanitize_text_field($body['title']),
            'post_name' => sanitize_title($body['slug'] ?? $body['title']),
            'post_content' => wp_kses_post($body['content'] ?? ''),
            'post_excerpt' => sanitize_textarea_field($body['excerpt'] ?? ''),
            'post_status' => $status,
        ];
        $this->apply_blog_dates($post_data, $body);
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
        if (!empty($body['status'])) {
            $update['post_status'] = $this->sanitize_blog_status($body['status']);
        }
        $this->apply_blog_dates($update, $body);

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
        if (!$attachment || $attachment->post_type !== 'attachment') {
            return new WP_Error('neb_media_not_found', 'Media attachment not found.', ['status' => 404]);
        }

        $body = $this->get_json_params($request);
        $post_update = ['ID' => $attachment_id];
        if (array_key_exists('title', $body)) {
            $post_update['post_title'] = sanitize_text_field($body['title']);
        }
        if (array_key_exists('slug', $body)) {
            $post_update['post_name'] = sanitize_title($body['slug']);
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

    private function require_woocommerce() {
        if (!class_exists('WooCommerce') || !class_exists('WC_Product')) {
            return new WP_Error(
                'neb_woocommerce_unavailable',
                'WooCommerce must be active to use this endpoint.',
                ['status' => 503]
            );
        }

        return true;
    }

    private function woo_bool($value, $default = false) {
        if ($value === null) {
            return $default;
        }

        return filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? $default;
    }

    private function woo_category_response($term) {
        if (!$term || is_wp_error($term)) {
            return null;
        }

        $thumbnail_id = (int) get_term_meta($term->term_id, 'thumbnail_id', true);
        $link = get_term_link($term);
        return [
            'id' => (int) $term->term_id,
            'name' => $term->name,
            'slug' => $term->slug,
            'parent_id' => (int) $term->parent,
            'count' => (int) $term->count,
            'description' => $term->description,
            'thumbnail_id' => $thumbnail_id,
            'thumbnail_url' => $thumbnail_id ? (wp_get_attachment_url($thumbnail_id) ?: '') : '',
            'url' => is_wp_error($link) ? '' : $link,
        ];
    }

    public function list_woo_categories() {
        $available = $this->require_woocommerce();
        if (is_wp_error($available)) {
            return $available;
        }

        $terms = get_terms([
            'taxonomy' => 'product_cat',
            'hide_empty' => false,
            'orderby' => 'name',
            'order' => 'ASC',
        ]);
        if (is_wp_error($terms)) {
            return $terms;
        }

        return [
            'ok' => true,
            'categories' => array_values(array_filter(array_map([$this, 'woo_category_response'], $terms))),
        ];
    }

    public function upsert_woo_category($request) {
        $available = $this->require_woocommerce();
        if (is_wp_error($available)) {
            return $available;
        }

        $body = $this->get_json_params($request);
        $name = sanitize_text_field($body['name'] ?? '');
        $slug = sanitize_title($body['slug'] ?? $name);
        if (!$name || !$slug) {
            return new WP_Error('neb_invalid_product_category', 'Category name and slug are required.', ['status' => 400]);
        }

        $parent_id = absint($body['parent_id'] ?? 0);
        if ($parent_id && !term_exists($parent_id, 'product_cat')) {
            return new WP_Error('neb_invalid_product_category_parent', 'Parent product category was not found.', ['status' => 400]);
        }

        $existing = get_term_by('slug', $slug, 'product_cat');
        $args = [
            'name' => $name,
            'slug' => $slug,
            'description' => wp_kses_post($body['description'] ?? ''),
            'parent' => $parent_id,
        ];
        $result = $existing
            ? wp_update_term($existing->term_id, 'product_cat', $args)
            : wp_insert_term($name, 'product_cat', $args);
        if (is_wp_error($result)) {
            return $result;
        }

        $term_id = (int) ($existing ? $existing->term_id : $result['term_id']);
        if (array_key_exists('thumbnail_id', $body)) {
            $thumbnail_id = absint($body['thumbnail_id']);
            if ($thumbnail_id && !wp_attachment_is_image($thumbnail_id)) {
                return new WP_Error('neb_invalid_product_category_image', 'Category thumbnail must be an image attachment.', ['status' => 400]);
            }
            update_term_meta($term_id, 'thumbnail_id', $thumbnail_id);
        }

        clean_term_cache($term_id, 'product_cat');
        return [
            'ok' => true,
            'action' => $existing ? 'updated' : 'created',
            'category' => $this->woo_category_response(get_term($term_id, 'product_cat')),
        ];
    }

    private function resolve_woo_category_ids($categories) {
        if (!is_array($categories)) {
            return [];
        }

        $ids = [];
        foreach ($categories as $category) {
            $term = null;
            if (is_numeric($category)) {
                $term = get_term(absint($category), 'product_cat');
            } elseif (is_string($category)) {
                $term = get_term_by('slug', sanitize_title($category), 'product_cat');
                if (!$term) {
                    $term = get_term_by('name', sanitize_text_field($category), 'product_cat');
                }
            } elseif (is_array($category)) {
                if (!empty($category['id'])) {
                    $term = get_term(absint($category['id']), 'product_cat');
                } elseif (!empty($category['slug'])) {
                    $term = get_term_by('slug', sanitize_title($category['slug']), 'product_cat');
                } elseif (!empty($category['name'])) {
                    $term = get_term_by('name', sanitize_text_field($category['name']), 'product_cat');
                }
            }

            if (!$term || is_wp_error($term)) {
                return new WP_Error('neb_product_category_not_found', 'A requested product category was not found.', ['status' => 400]);
            }
            $ids[] = (int) $term->term_id;
        }

        return array_values(array_unique($ids));
    }

    private function normalize_woo_image_ids($images) {
        if (!is_array($images)) {
            return [];
        }

        $ids = [];
        foreach ($images as $image) {
            $id = is_array($image) ? absint($image['id'] ?? 0) : absint($image);
            if (!$id || !wp_attachment_is_image($id)) {
                return new WP_Error('neb_invalid_product_image', 'Every product image must be a valid image attachment.', ['status' => 400]);
            }
            $ids[] = $id;
        }

        return array_values(array_unique($ids));
    }

    private function find_woo_object_by_source_key($source_key, $post_type, $parent_id = 0) {
        if (!$source_key) {
            return 0;
        }

        $args = [
            'post_type' => $post_type,
            'post_status' => ['publish', 'draft', 'pending', 'private'],
            'posts_per_page' => 1,
            'fields' => 'ids',
            'meta_key' => '_neb_source_key',
            'meta_value' => sanitize_text_field($source_key),
            'no_found_rows' => true,
        ];
        if ($parent_id) {
            $args['post_parent'] = absint($parent_id);
        }

        $ids = get_posts($args);
        return $ids ? (int) $ids[0] : 0;
    }

    private function woo_attribute_response($attribute) {
        return [
            'id' => (int) $attribute->get_id(),
            'name' => $attribute->get_name(),
            'slug' => sanitize_title($attribute->get_name()),
            'options' => array_values($attribute->get_options()),
            'position' => (int) $attribute->get_position(),
            'visible' => (bool) $attribute->get_visible(),
            'variation' => (bool) $attribute->get_variation(),
        ];
    }

    private function woo_variation_response($variation) {
        if (!$variation || !is_a($variation, 'WC_Product_Variation')) {
            return null;
        }

        return [
            'id' => (int) $variation->get_id(),
            'source_key' => get_post_meta($variation->get_id(), '_neb_source_key', true) ?: '',
            'parent_id' => (int) $variation->get_parent_id(),
            'status' => $variation->get_status(),
            'sku' => $variation->get_sku(),
            'regular_price' => $variation->get_regular_price(),
            'sale_price' => $variation->get_sale_price(),
            'price' => $variation->get_price(),
            'manage_stock' => (bool) $variation->get_manage_stock(),
            'stock_quantity' => $variation->get_stock_quantity(),
            'stock_status' => $variation->get_stock_status(),
            'attributes' => $variation->get_attributes(),
            'image_id' => (int) $variation->get_image_id(),
            'image_url' => $variation->get_image_id() ? (wp_get_attachment_url($variation->get_image_id()) ?: '') : '',
            'description' => $variation->get_description(),
        ];
    }

    private function woo_product_response($product_id, $include_variations = true) {
        $product = wc_get_product(absint($product_id));
        if (!$product || $product->get_parent_id()) {
            return null;
        }

        $categories = [];
        foreach ($product->get_category_ids() as $term_id) {
            $category = $this->woo_category_response(get_term($term_id, 'product_cat'));
            if ($category) {
                $categories[] = $category;
            }
        }

        $response = [
            'id' => (int) $product->get_id(),
            'source_key' => get_post_meta($product->get_id(), '_neb_source_key', true) ?: '',
            'name' => $product->get_name(),
            'slug' => $product->get_slug(),
            'status' => $product->get_status(),
            'type' => $product->get_type(),
            'sku' => $product->get_sku(),
            'permalink' => get_permalink($product->get_id()) ?: '',
            'regular_price' => $product->get_regular_price(),
            'sale_price' => $product->get_sale_price(),
            'price' => $product->get_price(),
            'manage_stock' => (bool) $product->get_manage_stock(),
            'stock_quantity' => $product->get_stock_quantity(),
            'stock_status' => $product->get_stock_status(),
            'description' => $product->get_description(),
            'short_description' => $product->get_short_description(),
            'category_ids' => array_map('intval', $product->get_category_ids()),
            'categories' => $categories,
            'image_id' => (int) $product->get_image_id(),
            'image_url' => $product->get_image_id() ? (wp_get_attachment_url($product->get_image_id()) ?: '') : '',
            'gallery_image_ids' => array_map('intval', $product->get_gallery_image_ids()),
            'attributes' => array_values(array_map([$this, 'woo_attribute_response'], $product->get_attributes())),
            'variation_ids' => $product->is_type('variable') ? array_map('intval', $product->get_children()) : [],
        ];

        if ($include_variations && $product->is_type('variable')) {
            $response['variations'] = array_values(array_filter(array_map(function ($variation_id) {
                return $this->woo_variation_response(wc_get_product($variation_id));
            }, $product->get_children())));
        }

        return $response;
    }

    private function sanitize_woo_product_status($status, $default = 'draft') {
        return in_array($status, ['draft', 'pending', 'private', 'publish'], true) ? $status : $default;
    }

    private function ensure_unique_woo_sku($sku, $object_id = 0) {
        $sku = wc_clean($sku);
        if ($sku === '') {
            return true;
        }

        $existing_id = (int) wc_get_product_id_by_sku($sku);
        if ($existing_id && $existing_id !== (int) $object_id) {
            return new WP_Error('neb_duplicate_product_sku', sprintf('SKU "%s" is already in use.', $sku), ['status' => 409]);
        }

        return true;
    }

    private function build_woo_attributes($attributes) {
        if (!is_array($attributes)) {
            return [];
        }

        $result = [];
        foreach (array_values($attributes) as $position => $item) {
            if (!is_array($item)) {
                continue;
            }
            $name = sanitize_text_field($item['name'] ?? '');
            $options = is_array($item['options'] ?? null)
                ? array_values(array_unique(array_filter(array_map('sanitize_text_field', $item['options']))))
                : [];
            if ($name === '' || !$options) {
                continue;
            }

            $attribute = new WC_Product_Attribute();
            $attribute->set_id(0);
            $attribute->set_name($name);
            $attribute->set_options($options);
            $attribute->set_position(absint($item['position'] ?? $position));
            $attribute->set_visible($this->woo_bool($item['visible'] ?? null, true));
            $attribute->set_variation($this->woo_bool($item['variation'] ?? null, false));
            $result[sanitize_title($name)] = $attribute;
        }

        return $result;
    }

    private function apply_woo_product_fields($product, $body, $is_new = false) {
        try {
            if (array_key_exists('name', $body)) {
                $product->set_name(sanitize_text_field($body['name']));
            }
            if (array_key_exists('slug', $body)) {
                $product->set_slug(sanitize_title($body['slug']));
            }
            if (array_key_exists('status', $body) || $is_new) {
                $product->set_status($this->sanitize_woo_product_status($body['status'] ?? 'draft'));
            }
            if (array_key_exists('description', $body)) {
                $product->set_description(wp_kses_post($body['description']));
            }
            if (array_key_exists('short_description', $body)) {
                $product->set_short_description(wp_kses_post($body['short_description']));
            }
            if (array_key_exists('sku', $body)) {
                $sku = wc_clean($body['sku']);
                $unique = $this->ensure_unique_woo_sku($sku, $product->get_id());
                if (is_wp_error($unique)) {
                    return $unique;
                }
                $product->set_sku($sku);
            }
            if (array_key_exists('regular_price', $body)) {
                $product->set_regular_price($body['regular_price'] === '' ? '' : wc_format_decimal($body['regular_price']));
            }
            if (array_key_exists('sale_price', $body)) {
                $product->set_sale_price($body['sale_price'] === '' ? '' : wc_format_decimal($body['sale_price']));
            }

            if (array_key_exists('manage_stock', $body)) {
                $product->set_manage_stock($this->woo_bool($body['manage_stock']));
            } elseif (array_key_exists('stock_quantity', $body)) {
                $product->set_manage_stock(true);
            }
            if (array_key_exists('stock_quantity', $body) && $body['stock_quantity'] !== '') {
                $product->set_stock_quantity(wc_stock_amount($body['stock_quantity']));
            }
            if (!empty($body['stock_status']) && in_array($body['stock_status'], ['instock', 'outofstock', 'onbackorder'], true)) {
                $product->set_stock_status($body['stock_status']);
            }
            if (!empty($body['backorders']) && in_array($body['backorders'], ['no', 'notify', 'yes'], true)) {
                $product->set_backorders($body['backorders']);
            }
            if (array_key_exists('sold_individually', $body)) {
                $product->set_sold_individually($this->woo_bool($body['sold_individually']));
            }
            if (array_key_exists('virtual', $body)) {
                $product->set_virtual($this->woo_bool($body['virtual']));
            }

            foreach (['weight', 'length', 'width', 'height'] as $dimension) {
                if (array_key_exists($dimension, $body)) {
                    $setter = 'set_' . $dimension;
                    $product->{$setter}($body[$dimension] === '' ? '' : wc_format_decimal($body[$dimension]));
                }
            }
            if (!empty($body['tax_status']) && in_array($body['tax_status'], ['taxable', 'shipping', 'none'], true)) {
                $product->set_tax_status($body['tax_status']);
            }
            if (array_key_exists('tax_class', $body)) {
                $product->set_tax_class(sanitize_title($body['tax_class']));
            }

            if (array_key_exists('categories', $body) || array_key_exists('category_ids', $body)) {
                $category_ids = $this->resolve_woo_category_ids($body['categories'] ?? $body['category_ids']);
                if (is_wp_error($category_ids)) {
                    return $category_ids;
                }
                $product->set_category_ids($category_ids);
            }
            if (array_key_exists('attributes', $body)) {
                $product->set_attributes($this->build_woo_attributes($body['attributes']));
            }

            if (array_key_exists('images', $body)) {
                $image_ids = $this->normalize_woo_image_ids($body['images']);
                if (is_wp_error($image_ids)) {
                    return $image_ids;
                }
                $product->set_image_id($image_ids ? array_shift($image_ids) : 0);
                $product->set_gallery_image_ids($image_ids);
            } else {
                if (array_key_exists('image_id', $body)) {
                    $image_id = absint($body['image_id']);
                    if ($image_id && !wp_attachment_is_image($image_id)) {
                        return new WP_Error('neb_invalid_product_image', 'Featured image must be an image attachment.', ['status' => 400]);
                    }
                    $product->set_image_id($image_id);
                }
                if (array_key_exists('gallery_image_ids', $body)) {
                    $gallery_ids = $this->normalize_woo_image_ids($body['gallery_image_ids']);
                    if (is_wp_error($gallery_ids)) {
                        return $gallery_ids;
                    }
                    $product->set_gallery_image_ids($gallery_ids);
                }
            }

            if (array_key_exists('menu_order', $body)) {
                $product->set_menu_order((int) $body['menu_order']);
            }
        } catch (Throwable $error) {
            return new WP_Error('neb_invalid_product_data', $error->getMessage(), ['status' => 400]);
        }

        return true;
    }

    private function normalize_woo_variation_attributes($attributes) {
        $normalized = [];
        if (!is_array($attributes)) {
            return $normalized;
        }

        foreach ($attributes as $key => $value) {
            if (is_array($value) && isset($value['name'])) {
                $name = $value['name'];
                $option = $value['option'] ?? $value['value'] ?? '';
            } else {
                $name = is_string($key) ? $key : '';
                $option = $value;
            }
            $name = sanitize_title($name);
            if ($name !== '') {
                $normalized[$name] = sanitize_text_field($option);
            }
        }

        return $normalized;
    }

    private function upsert_woo_variations($product_id, $variations) {
        if (!is_array($variations)) {
            return [];
        }

        $results = [];
        foreach ($variations as $index => $body) {
            if (!is_array($body)) {
                continue;
            }
            $source_key = sanitize_text_field($body['source_key'] ?? '');
            $sku = wc_clean($body['sku'] ?? '');
            if (!$source_key && !$sku) {
                return new WP_Error(
                    'neb_invalid_variation_identity',
                    sprintf('Variation %d needs a source_key or SKU.', $index + 1),
                    ['status' => 400]
                );
            }

            $variation_id = $source_key
                ? $this->find_woo_object_by_source_key($source_key, 'product_variation', $product_id)
                : 0;
            if (!$variation_id && $sku) {
                $sku_id = (int) wc_get_product_id_by_sku($sku);
                if ($sku_id) {
                    $sku_product = wc_get_product($sku_id);
                    if (!$sku_product || !$sku_product->is_type('variation') || (int) $sku_product->get_parent_id() !== (int) $product_id) {
                        return new WP_Error('neb_duplicate_product_sku', sprintf('SKU "%s" is already in use.', $sku), ['status' => 409]);
                    }
                    $variation_id = $sku_id;
                }
            }

            $is_new = !$variation_id;
            $variation = $variation_id ? wc_get_product($variation_id) : new WC_Product_Variation();
            if (!$variation || !is_a($variation, 'WC_Product_Variation')) {
                return new WP_Error('neb_invalid_variation', 'Existing variation could not be loaded.', ['status' => 500]);
            }

            try {
                $variation->set_parent_id($product_id);
                $variation_status = $body['status'] ?? 'publish';
                $variation->set_status(in_array($variation_status, ['publish', 'private'], true) ? $variation_status : 'publish');
                if (array_key_exists('sku', $body)) {
                    $unique = $this->ensure_unique_woo_sku($sku, $variation->get_id());
                    if (is_wp_error($unique)) {
                        return $unique;
                    }
                    $variation->set_sku($sku);
                }
                if (array_key_exists('regular_price', $body)) {
                    $variation->set_regular_price($body['regular_price'] === '' ? '' : wc_format_decimal($body['regular_price']));
                }
                if (array_key_exists('sale_price', $body)) {
                    $variation->set_sale_price($body['sale_price'] === '' ? '' : wc_format_decimal($body['sale_price']));
                }
                if (array_key_exists('manage_stock', $body)) {
                    $variation->set_manage_stock($this->woo_bool($body['manage_stock']));
                } elseif (array_key_exists('stock_quantity', $body)) {
                    $variation->set_manage_stock(true);
                }
                if (array_key_exists('stock_quantity', $body) && $body['stock_quantity'] !== '') {
                    $variation->set_stock_quantity(wc_stock_amount($body['stock_quantity']));
                }
                if (!empty($body['stock_status']) && in_array($body['stock_status'], ['instock', 'outofstock', 'onbackorder'], true)) {
                    $variation->set_stock_status($body['stock_status']);
                }
                if (array_key_exists('attributes', $body)) {
                    $variation->set_attributes($this->normalize_woo_variation_attributes($body['attributes']));
                }
                if (array_key_exists('description', $body)) {
                    $variation->set_description(wp_kses_post($body['description']));
                }
                if (array_key_exists('image_id', $body)) {
                    $image_id = absint($body['image_id']);
                    if ($image_id && !wp_attachment_is_image($image_id)) {
                        return new WP_Error('neb_invalid_variation_image', 'Variation image must be an image attachment.', ['status' => 400]);
                    }
                    $variation->set_image_id($image_id);
                }
                $variation_id = $variation->save();
            } catch (Throwable $error) {
                return new WP_Error('neb_invalid_variation_data', $error->getMessage(), ['status' => 400]);
            }

            if ($source_key) {
                update_post_meta($variation_id, '_neb_source_key', $source_key);
            }
            $results[] = [
                'action' => $is_new ? 'created' : 'updated',
                'variation' => $this->woo_variation_response(wc_get_product($variation_id)),
            ];
        }

        WC_Product_Variable::sync($product_id);
        wc_delete_product_transients($product_id);
        return $results;
    }

    private function save_woo_product($body, $forced_id = 0) {
        $available = $this->require_woocommerce();
        if (is_wp_error($available)) {
            return $available;
        }

        $source_key = sanitize_text_field($body['source_key'] ?? '');
        $product_id = absint($forced_id);
        if (!$product_id && $source_key) {
            $product_id = $this->find_woo_object_by_source_key($source_key, 'product');
        }
        if (!$product_id && !empty($body['sku'])) {
            $sku_id = (int) wc_get_product_id_by_sku(wc_clean($body['sku']));
            if ($sku_id) {
                $sku_product = wc_get_product($sku_id);
                if ($sku_product && !$sku_product->get_parent_id()) {
                    $product_id = $sku_id;
                }
            }
        }

        $is_new = !$product_id;
        $existing_product = $product_id ? wc_get_product($product_id) : null;
        $requested_type = sanitize_key($body['type'] ?? ($existing_product ? $existing_product->get_type() : 'simple'));
        if (!in_array($requested_type, ['simple', 'variable'], true)) {
            return new WP_Error('neb_invalid_product_type', 'Product type must be simple or variable.', ['status' => 400]);
        }
        if ($is_new && !$source_key) {
            return new WP_Error('neb_product_source_key_required', 'New products require a stable source_key.', ['status' => 400]);
        }
        if ($is_new && empty($body['name'])) {
            return new WP_Error('neb_product_name_required', 'New products require a name.', ['status' => 400]);
        }

        if ($is_new) {
            $product = $requested_type === 'variable' ? new WC_Product_Variable() : new WC_Product_Simple();
        } else {
            $product = $existing_product;
            if (!$product || $product->get_parent_id()) {
                return new WP_Error('neb_product_not_found', 'WooCommerce product not found.', ['status' => 404]);
            }
            if ($product->get_type() !== $requested_type) {
                return new WP_Error(
                    'neb_product_type_conflict',
                    sprintf('Existing product type is %s; type changes are not applied automatically.', $product->get_type()),
                    ['status' => 409]
                );
            }
        }

        if ($requested_type !== 'variable' && !empty($body['variations'])) {
            return new WP_Error('neb_variations_require_variable_product', 'Variations require a variable product.', ['status' => 400]);
        }

        $applied = $this->apply_woo_product_fields($product, $body, $is_new);
        if (is_wp_error($applied)) {
            return $applied;
        }

        try {
            $product_id = $product->save();
        } catch (Throwable $error) {
            return new WP_Error('neb_product_save_failed', $error->getMessage(), ['status' => 500]);
        }
        if ($source_key) {
            update_post_meta($product_id, '_neb_source_key', $source_key);
        }

        $variation_results = [];
        if ($requested_type === 'variable' && array_key_exists('variations', $body)) {
            $variation_results = $this->upsert_woo_variations($product_id, $body['variations']);
            if (is_wp_error($variation_results)) {
                return $variation_results;
            }
        }

        clean_post_cache($product_id);
        wc_delete_product_transients($product_id);
        return [
            'ok' => true,
            'action' => $is_new ? 'created' : 'updated',
            'product' => $this->woo_product_response($product_id, true),
            'variation_results' => $variation_results,
        ];
    }

    public function upsert_woo_product($request) {
        return $this->save_woo_product($this->get_json_params($request));
    }

    public function update_woo_product($request) {
        return $this->save_woo_product($this->get_json_params($request), absint($request['id']));
    }

    public function get_woo_product($request) {
        $available = $this->require_woocommerce();
        if (is_wp_error($available)) {
            return $available;
        }

        $product = $this->woo_product_response(absint($request['id']), true);
        return $product ?: new WP_Error('neb_product_not_found', 'WooCommerce product not found.', ['status' => 404]);
    }

    public function list_woo_products($request) {
        $available = $this->require_woocommerce();
        if (is_wp_error($available)) {
            return $available;
        }

        $page = max(1, absint($request->get_param('page') ?: 1));
        $per_page = min(max(1, absint($request->get_param('per_page') ?: 50)), 100);
        $status = sanitize_key($request->get_param('status') ?: '');
        $query_args = [
            'post_type' => 'product',
            'post_status' => $status && in_array($status, ['draft', 'pending', 'private', 'publish'], true)
                ? $status
                : ['draft', 'pending', 'private', 'publish'],
            'posts_per_page' => $per_page,
            'paged' => $page,
            'orderby' => 'ID',
            'order' => 'DESC',
        ];
        $search = sanitize_text_field($request->get_param('search') ?: '');
        if ($search !== '') {
            $query_args['s'] = $search;
        }
        $source_key = sanitize_text_field($request->get_param('source_key') ?: '');
        if ($source_key !== '') {
            $query_args['meta_key'] = '_neb_source_key';
            $query_args['meta_value'] = $source_key;
        }

        $query = new WP_Query($query_args);
        $include_variations = $this->woo_bool($request->get_param('include_variations'), false);
        return [
            'ok' => true,
            'page' => $page,
            'per_page' => $per_page,
            'total' => (int) $query->found_posts,
            'total_pages' => (int) $query->max_num_pages,
            'products' => array_values(array_filter(array_map(function ($post) use ($include_variations) {
                return $this->woo_product_response($post->ID, $include_variations);
            }, $query->posts))),
        ];
    }

    private function require_jetwoo_builder() {
        if (!post_type_exists('jet-woo-builder')) {
            return new WP_Error(
                'neb_jetwoo_unavailable',
                'JetWooBuilder must be active to use this endpoint.',
                ['status' => 503]
            );
        }
        return true;
    }

    private function jetwoo_template_response($post_id, $include_data = true) {
        $post = get_post($post_id);
        if (!$post || $post->post_type !== 'jet-woo-builder') {
            return null;
        }

        $response = [
            'id' => (int) $post_id,
            'title' => get_the_title($post_id),
            'slug' => $post->post_name,
            'status' => $post->post_status,
            'template_type' => get_post_meta($post_id, '_jet_woo_builder_template_type', true) ?: '',
            'elementor_template_type' => get_post_meta($post_id, '_elementor_template_type', true) ?: '',
            'edit_url' => admin_url('post.php?post=' . $post_id . '&action=elementor'),
        ];
        if ($include_data) {
            $response['elementor_data'] = $this->get_elementor_data($post_id);
            $response['page_settings'] = get_post_meta($post_id, '_elementor_page_settings', true);
        }
        return $response;
    }

    private function copy_jetwoo_template_state($source_id, $target_id) {
        foreach (get_post_meta($source_id) as $key => $values) {
            if (in_array($key, ['_edit_lock', '_edit_last'], true)) {
                continue;
            }
            delete_post_meta($target_id, $key);
            foreach ($values as $value) {
                add_post_meta($target_id, $key, maybe_unserialize($value));
            }
        }

        foreach (get_object_taxonomies('jet-woo-builder') as $taxonomy) {
            $term_ids = wp_get_object_terms($source_id, $taxonomy, ['fields' => 'ids']);
            if (!is_wp_error($term_ids)) {
                wp_set_object_terms($target_id, array_map('intval', $term_ids), $taxonomy);
            }
        }
    }

    public function list_jetwoo_templates($request) {
        $available = $this->require_jetwoo_builder();
        if (is_wp_error($available)) {
            return $available;
        }
        $include_data = filter_var($request->get_param('include_data'), FILTER_VALIDATE_BOOLEAN);
        $posts = get_posts([
            'post_type' => 'jet-woo-builder',
            'post_status' => ['publish', 'draft', 'pending', 'private'],
            'posts_per_page' => min(absint($request->get_param('per_page') ?: 100), 250),
            'orderby' => 'ID',
            'order' => 'DESC',
        ]);
        return [
            'ok' => true,
            'templates' => array_values(array_filter(array_map(function ($post) use ($include_data) {
                return $this->jetwoo_template_response($post->ID, $include_data);
            }, $posts))),
        ];
    }

    public function get_jetwoo_template($request) {
        $available = $this->require_jetwoo_builder();
        if (is_wp_error($available)) {
            return $available;
        }
        $template = $this->jetwoo_template_response(absint($request['id']), true);
        return $template ?: new WP_Error('neb_jetwoo_template_not_found', 'JetWooBuilder template not found.', ['status' => 404]);
    }

    public function create_jetwoo_template($request) {
        $available = $this->require_jetwoo_builder();
        if (is_wp_error($available)) {
            return $available;
        }
        $body = $this->get_json_params($request);
        $source_id = absint($body['source_id'] ?? 0);
        if ($source_id) {
            $source = get_post($source_id);
            if (!$source || $source->post_type !== 'jet-woo-builder') {
                return new WP_Error('neb_jetwoo_source_not_found', 'JetWooBuilder source template not found.', ['status' => 404]);
            }
        }

        $status = sanitize_key($body['status'] ?? 'draft');
        if (!in_array($status, ['publish', 'draft', 'pending', 'private'], true)) {
            $status = 'draft';
        }
        $post_id = wp_insert_post([
            'post_title' => sanitize_text_field($body['title'] ?? 'Native JetWoo Single Product'),
            'post_status' => $status,
            'post_type' => 'jet-woo-builder',
        ], true);
        if (is_wp_error($post_id)) {
            return $post_id;
        }

        if ($source_id) {
            $this->copy_jetwoo_template_state($source_id, $post_id);
        }
        update_post_meta($post_id, '_elementor_edit_mode', 'builder');
        update_post_meta($post_id, '_elementor_version', defined('ELEMENTOR_VERSION') ? ELEMENTOR_VERSION : '3.0.0');
        update_post_meta($post_id, '_jet_woo_builder_template_type', sanitize_key($body['template_type'] ?? 'single'));
        if (array_key_exists('elementor_data', $body)) {
            $saved_data = $this->normalize_elementor_data($body['elementor_data']);
            update_post_meta($post_id, '_elementor_data', wp_slash(wp_json_encode($saved_data)));
        }
        $this->clear_elementor_cache($post_id);
        return [
            'ok' => true,
            'action' => 'created',
            'template' => $this->jetwoo_template_response($post_id, true),
        ];
    }

    public function update_jetwoo_template($request) {
        $post_id = absint($request['id']);
        $post = get_post($post_id);
        if (!$post || $post->post_type !== 'jet-woo-builder') {
            return new WP_Error('neb_jetwoo_template_not_found', 'JetWooBuilder template not found.', ['status' => 404]);
        }
        $body = $this->get_json_params($request);
        $post_update = ['ID' => $post_id];
        if (array_key_exists('title', $body)) {
            $post_update['post_title'] = sanitize_text_field($body['title']);
        }
        if (array_key_exists('status', $body)) {
            $status = sanitize_key($body['status']);
            if (!in_array($status, ['publish', 'draft', 'pending', 'private'], true)) {
                return new WP_Error('neb_invalid_jetwoo_status', 'Unsupported template status.', ['status' => 400]);
            }
            $post_update['post_status'] = $status;
        }
        if (count($post_update) > 1) {
            $updated = wp_update_post($post_update, true);
            if (is_wp_error($updated)) {
                return $updated;
            }
        }
        if (array_key_exists('template_type', $body)) {
            update_post_meta($post_id, '_jet_woo_builder_template_type', sanitize_key($body['template_type']));
        }
        if (array_key_exists('elementor_data', $body)) {
            $saved_data = $this->normalize_elementor_data($body['elementor_data']);
            update_post_meta($post_id, '_elementor_data', wp_slash(wp_json_encode($saved_data)));
        }
        if (array_key_exists('page_settings', $body)) {
            update_post_meta($post_id, '_elementor_page_settings', $body['page_settings']);
        }
        $this->clear_elementor_cache($post_id);
        return [
            'ok' => true,
            'action' => 'updated',
            'template' => $this->jetwoo_template_response($post_id, true),
        ];
    }

    private function read_jetwoo_single_rules() {
        $rules = get_option('native_elementor_bridge_jetwoo_single_rules', []);
        return is_array($rules) ? $rules : [];
    }

    public function get_jetwoo_single_rules() {
        return ['ok' => true, 'rules' => $this->read_jetwoo_single_rules()];
    }

    public function update_jetwoo_single_rules($request) {
        $available = $this->require_jetwoo_builder();
        if (is_wp_error($available)) {
            return $available;
        }
        $body = $this->get_json_params($request);
        if (!is_array($body['rules'] ?? null)) {
            return new WP_Error('neb_invalid_jetwoo_rules', 'Rules must be an array.', ['status' => 400]);
        }
        $rules = [];
        foreach ($body['rules'] as $rule) {
            $category_id = absint($rule['category_id'] ?? 0);
            $template_id = absint($rule['template_id'] ?? 0);
            $term = $category_id ? get_term($category_id, 'product_cat') : null;
            $template = $template_id ? get_post($template_id) : null;
            if (!$term || is_wp_error($term) || !$template || $template->post_type !== 'jet-woo-builder') {
                return new WP_Error('neb_invalid_jetwoo_rule_target', 'Every rule needs an existing product category and JetWooBuilder template.', ['status' => 400]);
            }
            $rules[$category_id] = ['category_id' => $category_id, 'template_id' => $template_id];
        }
        $rules = array_values($rules);
        update_option('native_elementor_bridge_jetwoo_single_rules', $rules, false);
        return ['ok' => true, 'rules' => $rules];
    }

    public function resolve_jetwoo_single_template($template_id) {
        if (!function_exists('is_product') || !is_product()) {
            return $template_id;
        }
        $product_id = get_queried_object_id();
        if (!$product_id) {
            return $template_id;
        }
        foreach ($this->read_jetwoo_single_rules() as $rule) {
            $category_id = absint($rule['category_id'] ?? 0);
            $candidate_id = absint($rule['template_id'] ?? 0);
            if ($category_id && $candidate_id && get_post_status($candidate_id) === 'publish' && has_term($category_id, 'product_cat', $product_id)) {
                return $candidate_id;
            }
        }
        return $template_id;
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
