<?php

namespace RankMath {
    class Helper {
        public static $redirections_active = true;

        public static function is_module_active($module) {
            return $module === 'redirections' && self::$redirections_active;
        }

        public static function clear_cache($context = '') {}
    }
}

namespace RankMath\Redirections {
    class DB {}
    class Redirection {}
}

namespace {
    define('ABSPATH', __DIR__);
    define('RANK_MATH_VERSION', 'test');

    class WP_Error {
        private $code;

        public function __construct($code, $message = '', $data = []) {
            $this->code = $code;
        }

        public function get_error_code() {
            return $this->code;
        }
    }

    function add_action(...$args) {}
    function add_filter(...$args) {}
    function register_activation_hook(...$args) {}
    function register_rest_route($namespace, $route, $args) {
        if (!is_callable($args['callback']) || !is_callable($args['permission_callback'])) {
            throw new \RuntimeException('Invalid REST callback for ' . $route);
        }
        $GLOBALS['neb_test_routes'][] = $namespace . $route;
    }
    function is_wp_error($value) {
        return $value instanceof WP_Error;
    }
    function wp_parse_url($value, $component = -1) {
        return parse_url($value, $component);
    }
    function home_url($path = '/') {
        return 'https://example.test/' . ltrim($path, '/');
    }
    function trailingslashit($value) {
        return rtrim($value, '/') . '/';
    }
    function untrailingslashit($value) {
        return rtrim($value, '/');
    }
    function sanitize_key($value) {
        return preg_replace('/[^a-z0-9_-]/', '', strtolower((string) $value));
    }
    function sanitize_text_field($value) {
        return trim(strip_tags((string) $value));
    }
    function absint($value) {
        return abs((int) $value);
    }

    function neb_assert($condition, $message) {
        if (!$condition) {
            throw new \RuntimeException($message);
        }
    }

    require dirname(__DIR__) . '/plugin/native-elementor-bridge/native-elementor-bridge.php';

    $bridge = Native_Elementor_Bridge::instance();
    $bridge->register_routes();
    neb_assert(in_array('native-elementor/v1/status', $GLOBALS['neb_test_routes'], true), 'Status route is missing.');
    neb_assert(in_array('native-elementor/v1/rank-math/redirections', $GLOBALS['neb_test_routes'], true), 'Rank Math route is missing.');
    neb_assert(in_array('native-elementor/v1/rank-math/local-business', $GLOBALS['neb_test_routes'], true), 'Rank Math Local Business route is missing.');

    $availability = new \ReflectionMethod($bridge, 'rank_math_redirections_available');
    $availability->setAccessible(true);
    neb_assert($availability->invoke($bridge) === true, 'Active Rank Math Redirections module was not detected.');
    \RankMath\Helper::$redirections_active = false;
    neb_assert($availability->invoke($bridge) === false, 'Inactive Rank Math Redirections module was treated as available.');
    \RankMath\Helper::$redirections_active = true;

    $hours_sanitizer = new \ReflectionMethod($bridge, 'sanitize_rank_math_opening_hours');
    $hours_sanitizer->setAccessible(true);
    $valid_hours = $hours_sanitizer->invoke($bridge, [['day' => 'Monday', 'time' => '12:30-23:00']]);
    neb_assert(is_array($valid_hours) && $valid_hours[0]['time'] === '12:30-23:00', 'Valid opening hours were rejected.');
    $invalid_hours = $hours_sanitizer->invoke($bridge, [['day' => 'Monday', 'time' => '12.30-23.00']]);
    neb_assert(is_wp_error($invalid_hours) && $invalid_hours->get_error_code() === 'neb_invalid_opening_time', 'Invalid opening-hours format was accepted.');

    $planner = new \ReflectionMethod($bridge, 'prepare_rank_math_redirect_plan');
    $planner->setAccessible(true);
    $existing = [[
        'id' => 10,
        'sources' => [[
            'route' => '/old/',
            'comparison' => 'exact',
            'ignore_case' => false,
        ]],
        'destination' => 'https://example.test/new/',
        'type' => 301,
        'status' => 'active',
    ]];

    $unchanged = $planner->invoke($bridge, [[
        'source' => '/old/',
        'destination' => '/new/',
        'type' => 301,
        'status' => 'active',
        'ignore_case' => false,
    ]], $existing);
    neb_assert($unchanged[0]['operation'] === 'unchanged', 'Equivalent redirect was not left unchanged.');

    $case_update = $planner->invoke($bridge, [[
        'source' => '/old/',
        'destination' => '/new/',
        'type' => 301,
        'status' => 'active',
        'ignore_case' => true,
    ]], $existing);
    neb_assert($case_update[0]['operation'] === 'update', 'Case-sensitivity change was not planned as an update.');

    $chain = $planner->invoke($bridge, [
        ['source' => '/a/', 'destination' => '/b/'],
        ['source' => '/b/', 'destination' => '/c/'],
    ], []);
    neb_assert(is_wp_error($chain) && $chain->get_error_code() === 'neb_redirect_chain', 'Redirect chain was not rejected.');

    echo json_encode([
        'ok' => true,
        'routes' => count($GLOBALS['neb_test_routes']),
        'module_detection' => true,
        'planner_checks' => 3,
        'opening_hours_checks' => 2,
    ], JSON_PRETTY_PRINT) . PHP_EOL;
}
