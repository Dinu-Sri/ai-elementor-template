<?php
/**
 * AI Elementor Sync - Shop Filters Module v1.1
 * 
 * Shortcodes:
 *   [siconart_price_filter]             - Min/Max price inputs (vertical for sidebar)
 *   [siconart_category_filter]          - Category list with links (hides Uncategorized)
 *   [siconart_category_filter_dropdown] - Category dropdown (for top bar)
 * 
 * Also forces product grid columns via loop_shop_columns filter.
 * 
 * @since 1.3.0
 */

if (!defined('ABSPATH')) {
    exit;
}

class AI_Sync_Shop_Filters {

    private static $instance = null;
    private static $css_printed = false;

    public static function init() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private static $shipping_countries = [
        'VN', 'TW', 'TH', 'JP', 'SG', 'MY', 'KR', 'PH', 'ID', 'TR',
        'AZ', 'GE', 'FR', 'GB', 'DE', 'IT', 'ES', 'PT', 'NL', 'CH',
        'SE', 'NO', 'DK', 'FI', 'GR', 'AT', 'BE', 'PL', 'BY', 'RU',
        'US', 'CA', 'MX', 'BR', 'AR', 'AU', 'NZ', 'ZA', 'IN',
    ];

    private function __construct() {
        add_shortcode('siconart_price_filter', [$this, 'render_price_filter']);
        add_shortcode('siconart_category_filter', [$this, 'render_category_filter']);
        add_shortcode('siconart_category_filter_dropdown', [$this, 'render_category_dropdown']);

        // Force columns on product archives
        add_filter('loop_shop_columns', [$this, 'shop_columns'], 999);

        // Change "Read More" / "Add to Cart" button text to "Buy Now"
        add_filter('woocommerce_product_add_to_cart_text', [$this, 'custom_add_to_cart_text'], 10, 2);

        // Custom message when no shipping methods available for a country
        add_filter('woocommerce_no_shipping_available_html', [$this, 'custom_no_shipping_message']);
        add_filter('woocommerce_cart_no_shipping_available_html', [$this, 'custom_no_shipping_message']);

        // Restrict checkout countries to only those with shipping zones
        add_filter('woocommerce_countries_allowed_countries', [$this, 'restrict_checkout_countries']);

        // Change "Billing Details" to "Billing and Shipping Details"
        add_filter('gettext', [$this, 'rename_billing_details'], 20, 3);

        // Custom CSS for checkout dropdown hover fix
        add_action('wp_head', [$this, 'checkout_dropdown_css']);
    }

    /**
     * Change product archive button text to "Buy Now".
     */
    public function custom_add_to_cart_text($text, $product) {
        return 'Buy Now';
    }

    /**
     * Restrict checkout country dropdown to only countries with shipping zones.
     */
    public function restrict_checkout_countries($countries) {
        $allowed = [];
        foreach (self::$shipping_countries as $code) {
            if (isset($countries[$code])) {
                $allowed[$code] = $countries[$code];
            }
        }
        return $allowed;
    }

    /**
     * Change "Billing details" heading to "Billing and Shipping Details".
     */
    public function rename_billing_details($translated, $text, $domain) {
        if ($domain === 'woocommerce' && $text === 'Billing details') {
            return 'Billing and Shipping Details';
        }
        return $translated;
    }

    /**
     * Fix checkout dropdown hover: white text on blue background.
     */
    public function checkout_dropdown_css() {
        if (!function_exists('is_checkout') || !is_checkout()) return;
        echo '<style>
            .select2-results__option--highlighted[aria-selected],
            .select2-results__option--highlighted {
                background-color: #A67146 !important;
                color: #FFFFFF !important;
            }
            .select2-results__option {
                font-family: Poppins, sans-serif;
                font-size: 14px;
                color: #523A27;
            }
            .select2-container--default .select2-results__option--highlighted[aria-selected] {
                background-color: #A67146 !important;
                color: #FFFFFF !important;
            }
        </style>';
    }

    /**
     * Custom message for countries without shipping zones.
     */
    public function custom_no_shipping_message($message) {
        return '<p style="margin:0 0 8px;font-family:Poppins,sans-serif;font-size:14px;color:#523A27;">'
             . 'Shipping to your country is available! Please contact us for a quote:'
             . '</p>'
             . '<p style="margin:0;font-family:Poppins,sans-serif;font-size:13px;line-height:1.8;">'
             . '<a href="mailto:support@siconart.com" style="color:#A67146;text-decoration:none;">&#9993; support@siconart.com</a><br>'
             . '<a href="https://www.facebook.com/siconart" target="_blank" rel="noopener" style="color:#A67146;text-decoration:none;">&#x1F310; Facebook</a> &nbsp;|&nbsp; '
             . '<a href="https://www.instagram.com/siconarts/" target="_blank" rel="noopener" style="color:#A67146;text-decoration:none;">&#x1F4F7; Instagram</a>'
             . '</p>';
    }

    /**
     * Force 4 columns (sidebar layout with percentage widths).
     */
    public function shop_columns($columns) {
        return 4;
    }

    /**
     * Print CSS inline — called once from the first shortcode that renders.
     * This guarantees CSS loads even when wp_head conditionals fail on Elementor templates.
     */
    private function maybe_print_inline_css() {
        if (self::$css_printed) return '';
        self::$css_printed = true;
        return '<style id="sico-shop-filters">' . $this->get_filter_css() . '</style>';
    }

    /**
     * [siconart_price_filter] - Vertical layout for sidebar
     */
    public function render_price_filter($atts) {
        $atts = shortcode_atts([
            'min'         => 0,
            'max'         => 500,
            'button_text' => 'Apply',
        ], $atts);

        $current_min = isset($_GET['min_price']) ? intval($_GET['min_price']) : '';
        $current_max = isset($_GET['max_price']) ? intval($_GET['max_price']) : '';
        $base_url = remove_query_arg(['min_price', 'max_price']);

        ob_start();
        echo $this->maybe_print_inline_css();
        ?>
        <form method="GET" action="<?php echo esc_url($base_url); ?>" class="sico-pf">
            <?php
            foreach ($_GET as $key => $value) {
                if ($key === 'min_price' || $key === 'max_price') continue;
                echo '<input type="hidden" name="' . esc_attr($key) . '" value="' . esc_attr($value) . '">';
            }
            ?>
            <div class="sico-pf-row">
                <div class="sico-pf-input">
                    <span>$</span>
                    <input type="number" name="min_price" 
                           value="<?php echo esc_attr($current_min); ?>" 
                           placeholder="Min"
                           min="<?php echo esc_attr($atts['min']); ?>" 
                           max="<?php echo esc_attr($atts['max']); ?>">
                </div>
                <span class="sico-pf-sep">to</span>
                <div class="sico-pf-input">
                    <span>$</span>
                    <input type="number" name="max_price" 
                           value="<?php echo esc_attr($current_max); ?>" 
                           placeholder="Max"
                           min="<?php echo esc_attr($atts['min']); ?>" 
                           max="<?php echo esc_attr($atts['max']); ?>">
                </div>
            </div>
            <button type="submit" class="sico-pf-btn"><?php echo esc_html($atts['button_text']); ?></button>
            <?php if ($current_min !== '' || $current_max !== '') : ?>
                <a href="<?php echo esc_url(remove_query_arg(['min_price', 'max_price'])); ?>" class="sico-pf-clear">Clear</a>
            <?php endif; ?>
        </form>
        <?php
        return ob_get_clean();
    }

    /**
     * [siconart_category_filter] - List format for sidebar
     */
    public function render_category_filter($atts) {
        $atts = shortcode_atts([
            'all_text'    => 'All Products',
            'hide_empty'  => 1,
        ], $atts);

        $categories = get_terms([
            'taxonomy'   => 'product_cat',
            'hide_empty' => (bool) $atts['hide_empty'],
            'parent'     => 0,
            'orderby'    => 'name',
            'order'      => 'ASC',
        ]);

        if (is_wp_error($categories) || empty($categories)) {
            return $this->maybe_print_inline_css();
        }

        $current_cat = '';
        if (is_product_category()) {
            $queried = get_queried_object();
            if ($queried) $current_cat = $queried->slug;
        }

        $shop_url = get_permalink(wc_get_page_id('shop'));

        ob_start();
        echo $this->maybe_print_inline_css();
        ?>
        <ul class="sico-catlist">
            <li class="<?php echo empty($current_cat) ? 'sico-cat-active' : ''; ?>">
                <a href="<?php echo esc_url($shop_url); ?>"><?php echo esc_html($atts['all_text']); ?></a>
            </li>
            <?php foreach ($categories as $cat) : ?>
                <?php if ($cat->slug === 'uncategorized') continue; ?>
                <?php
                $cat_url = get_term_link($cat);
                if (is_wp_error($cat_url)) continue;
                $active = ($current_cat === $cat->slug) ? 'sico-cat-active' : '';
                ?>
                <li class="<?php echo $active; ?>">
                    <a href="<?php echo esc_url($cat_url); ?>">
                        <?php echo esc_html($cat->name); ?>
                        <span class="sico-cat-count"><?php echo intval($cat->count); ?></span>
                    </a>
                </li>
            <?php endforeach; ?>
        </ul>
        <?php
        return ob_get_clean();
    }

    /**
     * [siconart_category_filter_dropdown] - Dropdown for top bar
     */
    public function render_category_dropdown($atts) {
        $atts = shortcode_atts([
            'all_text' => 'All Categories',
            'hide_empty' => 1,
        ], $atts);

        $categories = get_terms([
            'taxonomy'   => 'product_cat',
            'hide_empty' => (bool) $atts['hide_empty'],
            'parent'     => 0,
        ]);

        if (is_wp_error($categories) || empty($categories)) return '';

        $current_cat = '';
        if (is_product_category()) {
            $queried = get_queried_object();
            if ($queried) $current_cat = $queried->slug;
        }

        $shop_url = get_permalink(wc_get_page_id('shop'));

        ob_start();
        ?>
        <select class="sico-cat-select" onchange="if(this.value)window.location.href=this.value">
            <option value="<?php echo esc_url($shop_url); ?>"<?php echo empty($current_cat) ? ' selected' : ''; ?>>
                <?php echo esc_html($atts['all_text']); ?>
            </option>
            <?php foreach ($categories as $cat) : ?>
                <?php if ($cat->slug === 'uncategorized') continue; ?>
                <?php
                $cat_url = get_term_link($cat);
                if (is_wp_error($cat_url)) continue;
                ?>
                <option value="<?php echo esc_url($cat_url); ?>"<?php echo ($current_cat === $cat->slug) ? ' selected' : ''; ?>>
                    <?php echo esc_html($cat->name); ?> (<?php echo intval($cat->count); ?>)
                </option>
            <?php endforeach; ?>
        </select>
        <?php
        return ob_get_clean();
    }

    /**
     * All CSS for filters and shop styling
     */
    private function get_filter_css() {
        return '
/* === Price Filter === */
.sico-pf {
    display: flex;
    flex-direction: column;
    gap: 10px;
}
.sico-pf-row {
    display: flex;
    align-items: center;
    gap: 6px;
}
.sico-pf-input {
    display: flex;
    align-items: center;
    gap: 3px;
    background: #fff;
    border: 1px solid #EBDACD;
    border-radius: 6px;
    padding: 6px 8px;
    flex: 1;
}
.sico-pf-input span {
    font-family: "Poppins", sans-serif;
    font-size: 13px;
    color: #8B7355;
}
.sico-pf-input input[type="number"] {
    width: 100%;
    border: none;
    outline: none;
    font-family: "Poppins", sans-serif;
    font-size: 13px;
    color: #523A27;
    background: transparent;
    -moz-appearance: textfield;
}
.sico-pf-input input::-webkit-outer-spin-button,
.sico-pf-input input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
}
.sico-pf-sep {
    font-family: "Poppins", sans-serif;
    font-size: 12px;
    color: #8B7355;
    flex-shrink: 0;
}
.sico-pf-btn {
    background: #A67146 !important;
    color: #fff !important;
    border: none !important;
    border-radius: 6px !important;
    padding: 6px 0 !important;
    font-family: "Poppins", sans-serif !important;
    font-size: 12px !important;
    font-weight: 600 !important;
    cursor: pointer;
    transition: background 0.2s;
    width: 100%;
    text-align: center;
    line-height: 1.4 !important;
    letter-spacing: 0 !important;
    text-transform: none !important;
    box-shadow: none !important;
    min-height: unset !important;
    height: auto !important;
}
.sico-pf-btn:hover {
    background: #523A27;
}
.sico-pf-clear {
    font-family: "Poppins", sans-serif;
    font-size: 12px;
    color: #8B7355;
    text-decoration: underline;
    text-align: center;
    display: block;
}
.sico-pf-clear:hover {
    color: #523A27;
}

/* === Category List === */
.sico-catlist {
    list-style: none !important;
    padding: 0 !important;
    margin: 0 !important;
}
.sico-catlist li {
    padding: 0 !important;
    margin: 0 !important;
}
.sico-catlist li a {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 10px;
    font-family: "Poppins", sans-serif;
    font-size: 14px;
    color: #523A27;
    text-decoration: none;
    border-radius: 6px;
    transition: all 0.2s;
}
.sico-catlist li a:hover {
    background: rgba(166,113,70,0.08);
    color: #A67146;
}
.sico-catlist li.sico-cat-active a {
    background: #A67146;
    color: #fff;
    font-weight: 600;
}
.sico-catlist li.sico-cat-active .sico-cat-count {
    color: rgba(255,255,255,0.7);
}
.sico-cat-count {
    font-size: 12px;
    color: #8B7355;
    flex-shrink: 0;
}

/* === Category Dropdown === */
.sico-cat-select {
    font-family: "Poppins", sans-serif;
    font-size: 13px;
    color: #523A27;
    border: 1px solid #EBDACD;
    border-radius: 6px;
    padding: 7px 28px 7px 12px;
    background: #fff url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%23523A27\' d=\'M6 8L1 3h10z\'/%3E%3C/svg%3E") no-repeat right 10px center;
    cursor: pointer;
    min-width: 160px;
    outline: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
}
.sico-cat-select:hover,
.sico-cat-select:focus {
    border-color: #A67146;
}

/* === WooCommerce overrides === */
.woocommerce .woocommerce-result-count {
    font-family: "Poppins", sans-serif !important;
    font-size: 13px !important;
    color: #8B7355 !important;
}
.woocommerce .woocommerce-ordering select {
    font-family: "Poppins", sans-serif !important;
    font-size: 13px !important;
    color: #523A27 !important;
    border: 1px solid #EBDACD !important;
    border-radius: 6px !important;
    padding: 6px 10px !important;
    background: #FEF9EF !important;
}

/* === Responsive === */
@media (max-width: 767px) {
    .sico-pf-row { flex-wrap: nowrap; }
    .sico-cat-select { min-width: 100%; }
}
';
    }
}

AI_Sync_Shop_Filters::init();
