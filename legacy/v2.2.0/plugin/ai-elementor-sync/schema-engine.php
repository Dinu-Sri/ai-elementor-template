<?php
/**
 * Schema Engine — Comprehensive JSON-LD Structured Data for Google, Bing & AI Engines
 *
 * Generates and injects rich schema markup into <head> for:
 * - Google Knowledge Panel, Rich Results, Product snippets, Sitelinks Searchbox
 * - Bing Webmaster structured data
 * - AI engines (ChatGPT, Claude, Gemini, Perplexity) entity understanding
 *
 * Schema types: Organization, LocalBusiness, WebSite, WebPage, Product, Offer,
 * BreadcrumbList, ItemList, BlogPosting, Article, FAQPage, CollectionPage,
 * SearchAction, Speakable, ContactPoint, PostalAddress, ImageObject
 *
 * @package AI_Elementor_Sync
 * @since   1.5.0
 * @version 1.8.1
 */

if (!defined('ABSPATH')) {
    exit;
}

class AI_Schema_Engine {

    private static $instance = null;
    private $debug_mode = false;
    private $schemas = [];
    private $config = [];

    // ─── Singleton ───────────────────────────────────────────────
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        // Load config from DB (set via REST API or admin)
        $this->config = get_option('ai_schema_config', $this->get_default_config());
        $this->debug_mode = !empty($this->config['debug_mode']);

        // Inject schemas into <head>
        add_action('wp_head', [$this, 'output_schemas'], 1);

        // Admin bar debug indicator
        if ($this->debug_mode) {
            add_action('admin_bar_menu', [$this, 'admin_bar_debug'], 999);
        }

        // Register REST API routes for schema management
        add_action('rest_api_init', [$this, 'register_schema_routes']);

        // Strip SiteSEO/SEOPress duplicate JSON-LD via output buffering
        // Filter approach doesn't work — SiteSEO ignores the hooks
        // Instead, capture final HTML and remove their JSON-LD blocks
        add_action('template_redirect', [$this, 'start_schema_cleanup_buffer'], 0);

        // Custom avatar support — serve avatars from wp_user_avatar meta
        add_filter('get_avatar_url', [$this, 'filter_avatar_url'], 10, 3);
    }

    /**
     * Start output buffering to strip SiteSEO/SEOPress JSON-LD from final HTML.
     * Our schema engine outputs comprehensive JSON-LD; SiteSEO outputs broken
     * @type:Thing instead of @type:Product, causing Google Rich Results errors.
     */
    public function start_schema_cleanup_buffer() {
        if (is_admin()) return;
        if (empty($this->config['enabled'])) return;

        ob_start([$this, 'cleanup_duplicate_schemas']);
    }

    /**
     * OB callback: Remove all JSON-LD <script> blocks EXCEPT ours (which has @graph).
     * SiteSEO outputs standalone JSON-LD blocks (Organization, Thing) that conflict.
     */
    public function cleanup_duplicate_schemas($html) {
        if (empty($html)) return $html;

        // Match all JSON-LD script blocks
        $pattern = '#<script\s+type=["\']application/ld\+json["\']>\s*(.*?)\s*</script>#si';

        $html = preg_replace_callback($pattern, function ($match) {
            $json = trim($match[1]);

            // Keep our schema block — it always contains @graph
            if (strpos($json, '"@graph"') !== false) {
                return $match[0]; // Keep it
            }

            // Remove any other JSON-LD blocks (SiteSEO Organization, Thing, etc.)
            return '<!-- SiteSEO schema removed by AI Schema Engine -->';
        }, $html);

        return $html;
    }

    /**
     * Filter avatar URL to use custom uploaded avatars stored in wp_user_avatar meta
     */
    public function filter_avatar_url($url, $id_or_email, $args) {
        $user_id = 0;
        if (is_numeric($id_or_email)) {
            $user_id = (int) $id_or_email;
        } elseif (is_object($id_or_email) && isset($id_or_email->user_id)) {
            $user_id = (int) $id_or_email->user_id;
        } elseif (is_string($id_or_email)) {
            $user = get_user_by('email', $id_or_email);
            if ($user) $user_id = $user->ID;
        }

        if ($user_id > 0) {
            $avatar_id = get_user_meta($user_id, 'wp_user_avatar', true);
            if ($avatar_id) {
                $custom_url = wp_get_attachment_url($avatar_id);
                if ($custom_url) return $custom_url;
            }
        }
        return $url;
    }

    // ─── Default Configuration ───────────────────────────────────
    private function get_default_config() {
        // Dynamic defaults — portable across any WordPress site
        // Site-specific values (org name, address, etc.) should be set via the
        // REST API: PUT /wp-json/ai-elementor/v1/schema/config
        // These defaults use WordPress core functions so the plugin works
        // out-of-the-box on any new install without hardcoded URLs.
        $site_url  = home_url();
        $site_name = get_bloginfo('name') ?: 'My Website';
        $site_desc = get_bloginfo('description') ?: '';
        $admin_email = get_option('admin_email', '');

        // Try to detect logo from customizer or site icon
        $logo_id  = get_theme_mod('custom_logo');
        $logo_url = $logo_id ? wp_get_attachment_url($logo_id) : '';
        if (!$logo_url) {
            $site_icon = get_site_icon_url(512);
            $logo_url = $site_icon ?: '';
        }

        // Detect currency if WooCommerce is active
        $currency = function_exists('get_woocommerce_currency') ? get_woocommerce_currency() : 'USD';

        return [
            'debug_mode'    => false,
            'enabled'       => true,

            // Organization / Business info — CONFIGURE THESE via REST API for each site
            'org_name'           => $site_name,
            'org_legal_name'     => $site_name,
            'org_description'    => $site_desc,
            'org_url'            => $site_url,
            'org_logo'           => $logo_url,
            'org_founding_date'  => '',
            'org_founder'        => '',
            'org_email'          => $admin_email,
            'org_phone'          => '',
            'org_address'        => [
                'street'   => '',
                'city'     => '',
                'region'   => '',
                'zip'      => '',
                'country'  => '',
            ],
            'org_geo'            => [
                'latitude'  => '',
                'longitude' => '',
            ],
            'org_social'         => [],
            'org_languages'      => ['en'],
            'org_area_served'    => '',
            'org_currency'       => $currency,
            'org_price_range'    => '',
            'org_payment_accepted' => [],
            'org_slogan'         => '',
            'org_keywords'       => '',

            // Search action
            'search_url_template' => $site_url . '/?s={search_term_string}',

            // Schema toggles — granular control
            'enable_organization'   => true,
            'enable_local_business' => false, // Off by default — enable for physical stores
            'enable_website'        => true,
            'enable_webpage'        => true,
            'enable_breadcrumb'     => true,
            'enable_product'        => function_exists('WC'), // Auto-detect WooCommerce
            'enable_product_list'   => function_exists('WC'),
            'enable_blog_posting'   => true,
            'enable_faq'            => true,
            'enable_speakable'      => true,
            'enable_site_navigation'=> true,

            // AI Engine optimizations — set per site
            'ai_entity_description' => $site_desc,
            'ai_entity_type'        => function_exists('WC') ? ['OnlineStore', 'ECommerceWebsite'] : ['Website'],
        ];
    }

    // ═══════════════════════════════════════════════════════════════
    //  SCHEMA GENERATION — Each method returns a schema array
    // ═══════════════════════════════════════════════════════════════

    /**
     * Organization + LocalBusiness — The core entity for Knowledge Panel
     */
    private function build_organization() {
        if (!$this->config['enable_organization']) return null;

        $c = $this->config;

        $org = [
            '@type'       => ['Organization', 'OnlineStore'],
            '@id'         => $c['org_url'] . '/#organization',
            'name'        => $c['org_name'],
            'legalName'   => $c['org_legal_name'],
            'description' => $c['org_description'],
            'url'         => $c['org_url'],
            'logo'        => [
                '@type'      => 'ImageObject',
                '@id'        => $c['org_url'] . '/#logo',
                'url'        => $c['org_logo'],
                'contentUrl' => $c['org_logo'],
                'caption'    => $c['org_name'] . ' Logo',
                'inLanguage' => 'en',
            ],
            'image'       => ['@id' => $c['org_url'] . '/#logo'],
            'foundingDate'=> $c['org_founding_date'],
            'founder'     => [
                '@type' => 'Person',
                'name'  => $c['org_founder'],
            ],
            'slogan'      => $c['org_slogan'],
            'email'       => $c['org_email'],
            'telephone'   => $c['org_phone'],
            'address'     => [
                '@type'           => 'PostalAddress',
                'streetAddress'   => $c['org_address']['street'],
                'addressLocality' => $c['org_address']['city'],
                'addressRegion'   => $c['org_address']['region'],
                'postalCode'      => $c['org_address']['zip'],
                'addressCountry'  => $c['org_address']['country'],
            ],
            'contactPoint' => [
                [
                    '@type'             => 'ContactPoint',
                    'telephone'         => $c['org_phone'],
                    'contactType'       => 'customer service',
                    'email'             => $c['org_email'],
                    'availableLanguage' => $c['org_languages'] ?: ['en'],
                    'areaServed'        => $c['org_area_served'],
                ],
            ],
            'sameAs'       => $c['org_social'],
            'areaServed'   => [
                '@type' => 'Country',
                'name'  => 'Sri Lanka',
            ],
            'knowsLanguage' => $c['org_languages'],
            'currenciesAccepted' => $c['org_currency'],
            'paymentAccepted'    => implode(', ', $c['org_payment_accepted']),
            'priceRange'         => $c['org_price_range'],
            'keywords'     => $c['org_keywords'],
            // AI-friendly: additional context for LLMs
            'additionalType' => 'https://www.wikidata.org/wiki/Q4830453', // business enterprise
        ];

        // Add geo coordinates if available
        if (!empty($c['org_geo']['latitude'])) {
            $org['geo'] = [
                '@type'     => 'GeoCoordinates',
                'latitude'  => $c['org_geo']['latitude'],
                'longitude' => $c['org_geo']['longitude'],
            ];
        }

        // LocalBusiness variant (separate node, linked)
        if ($this->config['enable_local_business']) {
            $local = $org;
            $local['@type'] = ['LocalBusiness', 'Store'];
            $local['@id']   = $c['org_url'] . '/#localbusiness';
            $local['parentOrganization'] = ['@id' => $c['org_url'] . '/#organization'];

            // Build offer catalog dynamically from WooCommerce categories
            if (function_exists('WC') && taxonomy_exists('product_cat')) {
                $cats = get_terms(['taxonomy' => 'product_cat', 'hide_empty' => true, 'parent' => 0, 'number' => 10]);
                if ($cats && !is_wp_error($cats)) {
                    $catalog_items = [];
                    foreach ($cats as $cat) {
                        if ($cat->slug === 'uncategorized') continue;
                        $catalog_items[] = ['@type' => 'OfferCatalog', 'name' => $cat->name];
                    }
                    if (!empty($catalog_items)) {
                        $local['hasOfferCatalog'] = [
                            '@type' => 'OfferCatalog',
                            'name'  => $c['org_name'] . ' Products',
                            'itemListElement' => $catalog_items,
                        ];
                    }
                }
            }

            $this->schemas[] = $local;
        }

        return $org;
    }

    /**
     * WebSite schema — Sitelinks searchbox + publisher info
     */
    private function build_website() {
        if (!$this->config['enable_website']) return null;
        $c = $this->config;

        return [
            '@type'       => 'WebSite',
            '@id'         => $c['org_url'] . '/#website',
            'name'        => $c['org_name'],
            'description' => $c['org_description'],
            'url'         => $c['org_url'],
            'publisher'   => ['@id' => $c['org_url'] . '/#organization'],
            'inLanguage'  => $c['org_languages'] ?: ['en'],
            'potentialAction' => [
                '@type'  => 'SearchAction',
                'target' => [
                    '@type'       => 'EntryPoint',
                    'urlTemplate' => $c['search_url_template'],
                ],
                'query-input' => 'required name=search_term_string',
            ],
            // Copyrights
            'copyrightHolder' => ['@id' => $c['org_url'] . '/#organization'],
            'copyrightYear'   => date('Y'),
        ];
    }

    /**
     * WebPage schema — for any page
     */
    private function build_webpage() {
        if (!$this->config['enable_webpage']) return null;
        if (is_admin()) return null;

        $c = $this->config;
        $page_type = 'WebPage';

        // Determine specific page type
        if (is_front_page()) {
            $page_type = ['WebPage', 'CollectionPage'];
        } elseif (function_exists('is_shop') && is_shop()) {
            $page_type = ['WebPage', 'CollectionPage', 'SearchResultsPage'];
        } elseif (function_exists('is_product_category') && is_product_category()) {
            $page_type = ['WebPage', 'CollectionPage'];
        } elseif (function_exists('is_product') && is_product()) {
            $page_type = ['WebPage', 'ItemPage'];
        } elseif (is_singular('post')) {
            $page_type = ['WebPage', 'BlogPosting'];
        } elseif (is_page()) {
            // Check for specific pages
            if (is_page('about')) {
                $page_type = ['WebPage', 'AboutPage'];
            } elseif (is_page('contact-us') || is_page('contact')) {
                $page_type = ['WebPage', 'ContactPage'];
            } elseif (is_page('faq')) {
                $page_type = ['WebPage', 'FAQPage'];
            }
        } elseif (is_search()) {
            $page_type = ['WebPage', 'SearchResultsPage'];
        }

        $schema = [
            '@type'          => $page_type,
            '@id'            => $this->get_current_url() . '#webpage',
            'url'            => $this->get_current_url(),
            'name'           => $this->get_page_title(),
            'isPartOf'       => ['@id' => $c['org_url'] . '/#website'],
            'about'          => ['@id' => $c['org_url'] . '/#organization'],
            'inLanguage'     => 'en',
        ];

        // Add dates only when available (singular pages)
        $date_published = is_singular() ? get_the_date('c') : false;
        $date_modified  = is_singular() ? get_the_modified_date('c') : false;
        if ($date_published) $schema['datePublished'] = $date_published;
        if ($date_modified)  $schema['dateModified']  = $date_modified;

        // Add description from SiteSEO or fallback
        $meta_desc = $this->get_seo_description();
        if ($meta_desc) {
            $schema['description'] = $meta_desc;
        }

        // Add breadcrumb reference — but NOT on front page (breadcrumb builder skips it)
        if ($this->config['enable_breadcrumb'] && !is_front_page()) {
            $schema['breadcrumb'] = ['@id' => $this->get_current_url() . '#breadcrumb'];
        }

        // Speakable for AI voice assistants
        if ($this->config['enable_speakable'] && (is_singular('post') || is_singular('product'))) {
            $schema['speakable'] = [
                '@type'         => 'SpeakableSpecification',
                'cssSelector'   => ['.entry-title', '.product_title', '.woocommerce-product-details__short-description', '.entry-content p:first-of-type'],
            ];
        }

        // Primary image (only on singular pages)
        if (is_singular() && has_post_thumbnail()) {
            $thumb_id  = get_post_thumbnail_id();
            if ($thumb_id) {
                $thumb_url = wp_get_attachment_url($thumb_id);
                $thumb_alt = (string) get_post_meta($thumb_id, '_wp_attachment_image_alt', true);
                if ($thumb_url) {
                    $schema['primaryImageOfPage'] = [
                        '@type'      => 'ImageObject',
                        'url'        => $thumb_url,
                        'contentUrl' => $thumb_url,
                        'caption'    => $thumb_alt !== '' ? $thumb_alt : $this->get_page_title(),
                    ];
                }
            }
        }

        return $schema;
    }

    /**
     * BreadcrumbList — Structured navigation path
     */
    private function build_breadcrumb() {
        if (!$this->config['enable_breadcrumb']) return null;
        if (is_front_page() || is_admin()) return null;

        $items = [];
        $position = 1;

        // Home
        $items[] = [
            '@type'    => 'ListItem',
            'position' => $position++,
            'name'     => 'Home',
            'item'     => home_url('/'),
        ];

        if (function_exists('is_product') && is_product()) {
            // Product > Category > Product name
            global $post;
            $terms = get_the_terms($post->ID, 'product_cat');
            if ($terms && !is_wp_error($terms)) {
                // Get deepest category
                $cat = $this->get_deepest_term($terms);
                // Add parent categories
                $parents = $this->get_term_parents($cat);
                foreach ($parents as $parent_cat) {
                    $items[] = [
                        '@type'    => 'ListItem',
                        'position' => $position++,
                        'name'     => $parent_cat->name,
                        'item'     => get_term_link($parent_cat),
                    ];
                }
                $items[] = [
                    '@type'    => 'ListItem',
                    'position' => $position++,
                    'name'     => $cat->name,
                    'item'     => get_term_link($cat),
                ];
            }
            $items[] = [
                '@type'    => 'ListItem',
                'position' => $position++,
                'name'     => get_the_title(),
            ];

        } elseif (function_exists('is_product_category') && is_product_category()) {
            $term = get_queried_object();
            // Shop
            $items[] = [
                '@type'    => 'ListItem',
                'position' => $position++,
                'name'     => 'Shop',
                'item'     => wc_get_page_permalink('shop'),
            ];
            // Parent categories
            if ($term->parent) {
                $parents = $this->get_term_parents($term);
                foreach ($parents as $parent_cat) {
                    $items[] = [
                        '@type'    => 'ListItem',
                        'position' => $position++,
                        'name'     => $parent_cat->name,
                        'item'     => get_term_link($parent_cat),
                    ];
                }
            }
            $items[] = [
                '@type'    => 'ListItem',
                'position' => $position++,
                'name'     => $term->name,
            ];

        } elseif (function_exists('is_shop') && is_shop()) {
            $items[] = [
                '@type'    => 'ListItem',
                'position' => $position++,
                'name'     => 'Shop',
            ];

        } elseif (is_singular('post')) {
            // Blog > Category > Post
            $items[] = [
                '@type'    => 'ListItem',
                'position' => $position++,
                'name'     => 'Blog',
                'item'     => home_url('/blog/'),
            ];
            $cats = get_the_category();
            if ($cats) {
                $items[] = [
                    '@type'    => 'ListItem',
                    'position' => $position++,
                    'name'     => $cats[0]->name,
                    'item'     => get_category_link($cats[0]->term_id),
                ];
            }
            $items[] = [
                '@type'    => 'ListItem',
                'position' => $position++,
                'name'     => get_the_title(),
            ];

        } elseif (is_page() && !is_front_page()) {
            global $post;
            // Page ancestors
            $ancestors = array_reverse(get_post_ancestors($post));
            foreach ($ancestors as $ancestor_id) {
                $items[] = [
                    '@type'    => 'ListItem',
                    'position' => $position++,
                    'name'     => get_the_title($ancestor_id),
                    'item'     => get_permalink($ancestor_id),
                ];
            }
            $items[] = [
                '@type'    => 'ListItem',
                'position' => $position++,
                'name'     => get_the_title(),
            ];

        } elseif (is_category()) {
            $items[] = [
                '@type'    => 'ListItem',
                'position' => $position++,
                'name'     => 'Blog',
                'item'     => home_url('/blog/'),
            ];
            $items[] = [
                '@type'    => 'ListItem',
                'position' => $position++,
                'name'     => single_cat_title('', false),
            ];
        }

        if (count($items) < 2) return null; // Breadcrumb needs at least 2 items

        return [
            '@type'           => 'BreadcrumbList',
            '@id'             => $this->get_current_url() . '#breadcrumb',
            'itemListElement' => $items,
        ];
    }

    /**
     * Product schema — WooCommerce product with Offers, Reviews, Images
     */
    private function build_product() {
        if (!$this->config['enable_product']) return null;
        if (!function_exists('is_product') || !is_product()) return null;

        global $product;
        if (!$product || !is_a($product, 'WC_Product')) {
            $pid = get_the_ID();
            if (!$pid) return null;
            $product = wc_get_product($pid);
        }
        if (!$product || !is_a($product, 'WC_Product')) return null;

        $c = $this->config;

        $desc = (string) $product->get_description();
        $short_desc = (string) $product->get_short_description();
        $description = wp_strip_all_tags($desc !== '' ? $desc : $short_desc);

        $schema = [
            '@type'       => 'Product',
            '@id'         => get_permalink() . '#product',
            'name'        => $product->get_name(),
            'url'         => get_permalink(),
            'description' => $description ?: $product->get_name(),
            'sku'         => $product->get_sku() ?: 'WC-' . $product->get_id(),
            'brand'       => [
                '@type' => 'Brand',
                'name'  => $this->get_product_brand($product),
            ],
            'manufacturer' => [
                '@type' => 'Organization',
                'name'  => $this->get_product_brand($product),
            ],
            'category'    => $this->get_product_category_names($product),
            'image'       => $this->get_product_images($product),
        ];

        // Offers
        if ($product->is_type('variable')) {
            $min = $product->get_variation_price('min');
            $max = $product->get_variation_price('max');
            $schema['offers'] = [
                '@type'           => 'AggregateOffer',
                'url'             => get_permalink(),
                'priceCurrency'   => get_woocommerce_currency(),
                'lowPrice'        => $min,
                'highPrice'       => $max,
                'offerCount'      => count($product->get_children()),
                'availability'    => $product->is_in_stock()
                    ? 'https://schema.org/InStock'
                    : 'https://schema.org/OutOfStock',
                'seller'          => ['@id' => $c['org_url'] . '/#organization'],
                'priceValidUntil' => date('Y-m-d', strtotime('+1 year')),
                'itemCondition'   => 'https://schema.org/NewCondition',
                'shippingDetails' => $this->build_shipping_details(),
                'hasMerchantReturnPolicy' => $this->build_return_policy(),
            ];
        } else {
            $price = $product->get_price();
            $sale  = $product->get_sale_price();
            $schema['offers'] = [
                '@type'           => 'Offer',
                'url'             => get_permalink(),
                'priceCurrency'   => get_woocommerce_currency(),
                'price'           => $price,
                'availability'    => $product->is_in_stock()
                    ? 'https://schema.org/InStock'
                    : 'https://schema.org/OutOfStock',
                'seller'          => ['@id' => $c['org_url'] . '/#organization'],
                'priceValidUntil' => date('Y-m-d', strtotime('+1 year')),
                'itemCondition'   => 'https://schema.org/NewCondition',
                'shippingDetails' => $this->build_shipping_details(),
                'hasMerchantReturnPolicy' => $this->build_return_policy(),
            ];
        }

        // Reviews & Ratings — bridge WC native + JetReview
        $review_data  = $this->get_combined_review_data($product);
        $review_count = $review_data['count'];
        $average      = $review_data['average'];
        if ($review_count > 0 && $average > 0) {
            $schema['aggregateRating'] = [
                '@type'       => 'AggregateRating',
                'ratingValue' => $average,
                'reviewCount' => $review_count,
                'bestRating'  => '5',
                'worstRating' => '1',
            ];
            if (!empty($review_data['reviews'])) {
                $schema['review'] = $review_data['reviews'];
            }
        }

        // Weight
        if ($product->has_weight()) {
            $schema['weight'] = [
                '@type'    => 'QuantitativeValue',
                'value'    => $product->get_weight(),
                'unitCode' => get_option('woocommerce_weight_unit', 'kg'),
            ];
        }

        // Dimensions
        if ($product->has_dimensions()) {
            $schema['depth'] = [
                '@type'    => 'QuantitativeValue',
                'value'    => $product->get_length(),
                'unitCode' => get_option('woocommerce_dimension_unit', 'cm'),
            ];
            $schema['width'] = [
                '@type'    => 'QuantitativeValue',
                'value'    => $product->get_width(),
                'unitCode' => get_option('woocommerce_dimension_unit', 'cm'),
            ];
            $schema['height'] = [
                '@type'    => 'QuantitativeValue',
                'value'    => $product->get_height(),
                'unitCode' => get_option('woocommerce_dimension_unit', 'cm'),
            ];
        }

        // GTIN / MPN from custom fields
        $gtin = get_post_meta($product->get_id(), '_gtin', true);
        if ($gtin) $schema['gtin13'] = $gtin;
        $mpn = get_post_meta($product->get_id(), '_mpn', true);
        if ($mpn) $schema['mpn'] = $mpn;

        return $schema;
    }

    /**
     * ItemList schema for shop/category pages (product listing)
     */
    private function build_product_list() {
        if (!$this->config['enable_product_list']) return null;
        if (!function_exists('is_shop') && !function_exists('is_product_category')) return null;

        $is_shop = function_exists('is_shop') && is_shop();
        $is_cat  = function_exists('is_product_category') && is_product_category();

        if (!$is_shop && !$is_cat) return null;

        global $wp_query;
        $products = $wp_query->posts;
        if (empty($products)) return null;

        $items = [];
        $position = 1;
        foreach ($products as $post) {
            $prod = wc_get_product($post->ID ?? ($post->id ?? 0));
            if (!$prod || !is_a($prod, 'WC_Product')) continue;

            $img_id = $prod->get_image_id();
            $items[] = [
                '@type'    => 'ListItem',
                'position' => $position++,
                'url'      => get_permalink($post->ID ?? $post->id ?? 0),
                'name'     => $prod->get_name(),
                'image'    => $img_id ? wp_get_attachment_url($img_id) : '',
            ];

            if ($position > 50) break; // Limit to 50
        }

        $name = $is_cat ? single_term_title('', false) . ' Products' : 'All Products';

        return [
            '@type'           => 'ItemList',
            '@id'             => $this->get_current_url() . '#itemlist',
            'name'            => $name,
            'numberOfItems'   => count($items),
            'itemListOrder'   => 'https://schema.org/ItemListOrderDescending',
            'itemListElement' => $items,
        ];
    }

    /**
     * BlogPosting / Article schema for blog posts
     */
    private function build_blog_posting() {
        if (!$this->config['enable_blog_posting']) return null;
        if (!is_singular('post')) return null;

        global $post;
        $c = $this->config;

        $schema = [
            '@type'          => 'BlogPosting',
            '@id'            => get_permalink() . '#article',
            'headline'       => get_the_title(),
            'url'            => get_permalink(),
            'datePublished'  => get_the_date('c'),
            'dateModified'   => get_the_modified_date('c'),
            'author'         => [
                '@type' => 'Person',
                'name'  => get_the_author(),
                'url'   => get_author_posts_url(get_the_author_meta('ID')),
            ],
            'publisher'      => ['@id' => $c['org_url'] . '/#organization'],
            'isPartOf'       => ['@id' => $c['org_url'] . '/#website'],
            'mainEntityOfPage' => ['@id' => get_permalink() . '#webpage'],
            'inLanguage'     => 'en',
            'wordCount'      => str_word_count(strip_tags($post->post_content)),
        ];

        // Description
        $desc = $this->get_seo_description();
        if ($desc) {
            $schema['description'] = $desc;
        } else {
            $schema['description'] = wp_trim_words(strip_tags($post->post_content), 30);
        }

        // Featured image
        if (has_post_thumbnail()) {
            $thumb_id  = get_post_thumbnail_id();
            $img_data  = wp_get_attachment_image_src($thumb_id, 'full');
            $schema['image'] = [
                '@type'  => 'ImageObject',
                'url'    => $img_data[0],
                'width'  => $img_data[1],
                'height' => $img_data[2],
            ];
        }

        // Categories
        $cats = get_the_category();
        if ($cats) {
            $schema['articleSection'] = wp_list_pluck($cats, 'name');
        }

        // Tags
        $tags = get_the_tags();
        if ($tags) {
            $schema['keywords'] = implode(', ', wp_list_pluck($tags, 'name'));
        }

        // Speakable for AI voice
        if ($this->config['enable_speakable']) {
            $schema['speakable'] = [
                '@type'       => 'SpeakableSpecification',
                'cssSelector' => ['.entry-title', '.entry-content p:first-of-type', '.entry-content h2'],
            ];
        }

        return $schema;
    }

    /**
     * FAQPage schema — automatically extracts from page content or custom field
     */
    private function build_faq() {
        if (!$this->config['enable_faq']) return null;

        // Check for custom FAQ meta field
        $faq_data = get_post_meta(get_the_ID(), '_schema_faq', true);
        if (!empty($faq_data) && is_array($faq_data)) {
            $questions = [];
            foreach ($faq_data as $faq) {
                $questions[] = [
                    '@type'          => 'Question',
                    'name'           => $faq['question'],
                    'acceptedAnswer' => [
                        '@type' => 'Answer',
                        'text'  => $faq['answer'],
                    ],
                ];
            }
            return [
                '@type'      => 'FAQPage',
                '@id'        => $this->get_current_url() . '#faq',
                'mainEntity' => $questions,
            ];
        }

        // Auto-detect FAQ from Elementor toggle/accordion widgets
        // This works by scanning post meta for Elementor data
        if (is_page('faq') || is_page('frequently-asked-questions')) {
            $elementor_data = get_post_meta(get_the_ID(), '_elementor_data', true);
            if ($elementor_data) {
                $faqs = $this->extract_faqs_from_elementor($elementor_data);
                if (!empty($faqs)) {
                    return [
                        '@type'      => 'FAQPage',
                        '@id'        => $this->get_current_url() . '#faq',
                        'mainEntity' => $faqs,
                    ];
                }
            }
        }

        return null;
    }

    /**
     * SiteNavigationElement — helps search engines understand site structure
     */
    private function build_site_navigation() {
        if (!$this->config['enable_site_navigation']) return null;
        if (!is_front_page()) return null;

        $nav_items = [];

        // Try to read from WordPress primary nav menu (portable across sites)
        $menu_locations = get_nav_menu_locations();
        $menu_slug = !empty($menu_locations['primary']) ? $menu_locations['primary'] : null;
        if (!$menu_slug) {
            // Try common menu location names
            foreach (['main-menu', 'header', 'header-menu', 'main', 'top'] as $loc) {
                if (!empty($menu_locations[$loc])) {
                    $menu_slug = $menu_locations[$loc];
                    break;
                }
            }
        }

        if ($menu_slug) {
            $items = wp_get_nav_menu_items($menu_slug);
            if ($items) {
                foreach ($items as $item) {
                    if ((int) $item->menu_item_parent === 0) { // Top-level only
                        $nav_items[] = ['name' => $item->title, 'url' => $item->url];
                    }
                }
            }
        }

        // Fallback: auto-generate from site structure
        if (empty($nav_items)) {
            // Add shop if WooCommerce is active
            if (function_exists('wc_get_page_permalink')) {
                $nav_items[] = ['name' => 'Shop', 'url' => wc_get_page_permalink('shop')];
                // Top-level product categories
                $cats = get_terms(['taxonomy' => 'product_cat', 'hide_empty' => true, 'parent' => 0, 'number' => 6]);
                if ($cats && !is_wp_error($cats)) {
                    foreach ($cats as $cat) {
                        if ($cat->slug === 'uncategorized') continue;
                        $nav_items[] = ['name' => $cat->name, 'url' => get_term_link($cat)];
                    }
                }
            }
            // Standard pages
            foreach (['blog', 'about', 'contact', 'contact-us'] as $slug) {
                $page = get_page_by_path($slug);
                if ($page && $page->post_status === 'publish') {
                    $nav_items[] = ['name' => $page->post_title, 'url' => get_permalink($page)];
                }
            }
        }

        if (empty($nav_items)) return null;

        $elements = [];
        foreach ($nav_items as $item) {
            $elements[] = [
                '@type' => 'SiteNavigationElement',
                'name'  => $item['name'],
                'url'   => $item['url'],
            ];
        }

        return [
            '@type'           => 'ItemList',
            '@id'             => home_url('/') . '#site-navigation',
            'name'            => 'Main Navigation',
            'itemListElement' => $elements,
        ];
    }

    // ═══════════════════════════════════════════════════════════════
    //  SHIPPING & RETURN POLICY (Google Merchant compliance)
    // ═══════════════════════════════════════════════════════════════

    private function build_shipping_details() {
        return [
            '@type'              => 'OfferShippingDetails',
            'shippingRate'       => [
                '@type'    => 'MonetaryAmount',
                'value'    => '0',
                'currency' => 'LKR',
            ],
            'shippingDestination' => [
                '@type'          => 'DefinedRegion',
                'addressCountry' => 'LK',
            ],
            'deliveryTime'       => [
                '@type'                 => 'ShippingDeliveryTime',
                'handlingTime'          => [
                    '@type'    => 'QuantitativeValue',
                    'minValue' => 1,
                    'maxValue' => 2,
                    'unitCode' => 'd',
                ],
                'transitTime'           => [
                    '@type'    => 'QuantitativeValue',
                    'minValue' => 1,
                    'maxValue' => 5,
                    'unitCode' => 'd',
                ],
            ],
        ];
    }

    private function build_return_policy() {
        return [
            '@type'                    => 'MerchantReturnPolicy',
            'applicableCountry'        => 'LK',
            'returnPolicyCategory'     => 'https://schema.org/MerchantReturnFiniteReturnWindow',
            'merchantReturnDays'       => 7,
            'returnMethod'             => 'https://schema.org/ReturnByMail',
            'returnFees'               => 'https://schema.org/FreeReturn',
            'returnPolicySeasonalOverride' => false,
        ];
    }

    // ═══════════════════════════════════════════════════════════════
    //  MAIN OUTPUT — Assembles graph and injects into <head>
    // ═══════════════════════════════════════════════════════════════

    public function output_schemas() {
        if (empty($this->config['enabled'])) return;
        if (is_admin()) return;

        // Top-level safety net — NEVER let schema engine crash the page
        try {
            $this->_render_schemas();
        } catch (\Throwable $e) {
            if ($this->debug_mode) {
                echo '<!-- AI Schema Engine FATAL ERROR: ' . esc_html($e->getMessage())
                   . ' in ' . esc_html(basename($e->getFile())) . ':' . $e->getLine() . " -->\n";
            }
            // Silently fail — page continues to render normally
        }
    }

    /**
     * Internal renderer — separated so top-level catch covers everything
     */
    private function _render_schemas() {
        $this->schemas = [];
        $errors = [];

        // Build all applicable schemas for current page
        $builders = [
            'build_organization',
            'build_website',
            'build_webpage',
            'build_breadcrumb',
            'build_product',
            'build_product_list',
            'build_blog_posting',
            'build_faq',
            'build_site_navigation',
        ];

        foreach ($builders as $method) {
            try {
                $schema = $this->$method();
                if ($schema) {
                    $this->schemas[] = $schema;
                }
            } catch (\Throwable $e) {
                $errors[] = $method . ': ' . $e->getMessage() . ' in ' . basename($e->getFile()) . ':' . $e->getLine();
            }
        }

        // Filter empty schemas
        $this->schemas = array_filter($this->schemas);

        if (empty($this->schemas)) return;

        // Build the @graph structure (Google & Bing preferred format)
        $graph = [
            '@context' => 'https://schema.org',
            '@graph'   => array_values($this->schemas),
        ];

        // Debug comments
        $output = '';
        if ($this->debug_mode) {
            $output .= "<!-- AI Schema Engine v1.6.0 | Debug Mode ON -->\n";
            $output .= "<!-- Page type: " . $this->get_page_type_label() . " -->\n";
            $output .= "<!-- Schemas: " . count($this->schemas) . " entities in @graph -->\n";
            $output .= "<!-- Entities: " . implode(', ', array_map(function($s) {
                $type = $s['@type'] ?? 'unknown';
                return is_array($type) ? implode('/', $type) : $type;
            }, $this->schemas)) . " -->\n";
            if (!empty($errors)) {
                foreach ($errors as $err) {
                    $output .= "<!-- SCHEMA ERROR: " . esc_html($err) . " -->\n";
                }
            }
        }

        $json = wp_json_encode($graph, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        $output .= '<script type="application/ld+json">' . "\n" . $json . "\n" . '</script>' . "\n";

        if ($this->debug_mode) {
            $output .= "<!-- /AI Schema Engine -->\n";
        }

        echo $output;
    }

    // ═══════════════════════════════════════════════════════════════
    //  REST API — Review Management (for rich snippet star ratings)
    // ═══════════════════════════════════════════════════════════════

    /**
     * POST /schema/reviews/{product_id} — Add a product review
     * Body: { "author": "Name", "email": "...", "rating": 5, "content": "..." }
     *   or: { "reviews": [ { ... }, { ... } ] } for bulk import
     */
    public function api_add_review($request) {
        $product_id = (int) $request['id'];

        if (!function_exists('wc_get_product')) {
            return new WP_REST_Response(['success' => false, 'error' => 'WooCommerce not active'], 400);
        }

        $product = wc_get_product($product_id);
        if (!$product) {
            return new WP_REST_Response(['success' => false, 'error' => "Product {$product_id} not found"], 404);
        }

        $body = $request->get_json_params();
        $reviews_input = $body['reviews'] ?? [$body]; // Support single or bulk
        $results = [];

        foreach ($reviews_input as $review_data) {
            $author  = sanitize_text_field($review_data['author'] ?? 'Customer');
            $email   = sanitize_email($review_data['email'] ?? 'customer@' . wp_parse_url(home_url(), PHP_URL_HOST));
            $rating  = max(1, min(5, intval($review_data['rating'] ?? 5)));
            $content = sanitize_textarea_field($review_data['content'] ?? '');
            $date    = !empty($review_data['date']) ? sanitize_text_field($review_data['date']) : current_time('mysql');

            if (empty($content)) {
                $results[] = ['success' => false, 'author' => $author, 'error' => 'Review content is required'];
                continue;
            }

            // Create the WooCommerce review (stored as a WordPress comment)
            $comment_data = [
                'comment_post_ID'      => $product_id,
                'comment_author'       => $author,
                'comment_author_email' => $email,
                'comment_content'      => $content,
                'comment_type'         => 'review',
                'comment_approved'     => 1, // Auto-approve
                'comment_date'         => $date,
                'comment_date_gmt'     => get_gmt_from_date($date),
            ];

            $comment_id = wp_insert_comment($comment_data);

            if ($comment_id && !is_wp_error($comment_id)) {
                // Set the star rating meta (WooCommerce standard)
                update_comment_meta($comment_id, 'rating', $rating);
                // Mark as verified purchase if specified
                if (!empty($review_data['verified'])) {
                    update_comment_meta($comment_id, 'verified', 1);
                }

                // ── JetReview dual-write ──
                $jr_id = $this->insert_jetreview($product_id, $author, $email, $rating, $content, '', $date);

                $results[] = [
                    'success'    => true,
                    'comment_id' => $comment_id,
                    'author'     => $author,
                    'rating'     => $rating,
                    'jetreview'  => $jr_id ? "synced (id:{$jr_id})" : ($this->detect_jetreview() ? 'write failed' : 'not installed'),
                ];
            } else {
                $error_msg = is_wp_error($comment_id) ? $comment_id->get_error_message() : 'Failed to insert comment';
                $results[] = ['success' => false, 'author' => $author, 'error' => $error_msg];
            }
        }

        // Force WooCommerce to recalculate product average rating
        if (function_exists('wc_get_product')) {
            // Clear transients so ratings update immediately
            $product_obj = wc_get_product($product_id);
            if ($product_obj) {
                // WC recalculates ratings on comment changes
                WC_Comments::clear_transients($product_id);
            }
        }

        $success_count = count(array_filter($results, fn($r) => $r['success']));
        $jr_detected = $this->detect_jetreview() ? true : false;

        return new WP_REST_Response([
            'success' => $success_count > 0,
            'message' => "{$success_count} review(s) added to '{$product->get_name()}'",
            'product' => [
                'id'             => $product_id,
                'name'           => $product->get_name(),
                'new_review_count' => $product->get_review_count() + $success_count,
            ],
            'jetreview_detected' => $jr_detected,
            'results' => $results,
        ], 200);
    }

    /**
     * GET /schema/reviews/{product_id} — List reviews for a product
     */
    public function api_list_reviews($request) {
        $product_id = (int) $request['id'];

        if (!function_exists('wc_get_product')) {
            return new WP_REST_Response(['success' => false, 'error' => 'WooCommerce not active'], 400);
        }

        $product = wc_get_product($product_id);
        if (!$product) {
            return new WP_REST_Response(['success' => false, 'error' => "Product {$product_id} not found"], 404);
        }

        $comments = get_comments([
            'post_id' => $product_id,
            'type'    => 'review',
            'status'  => 'approve',
            'orderby' => 'comment_date',
            'order'   => 'DESC',
        ]);

        $reviews = [];
        foreach ($comments as $comment) {
            $reviews[] = [
                'id'       => $comment->comment_ID,
                'author'   => $comment->comment_author,
                'email'    => $comment->comment_author_email,
                'rating'   => (int) get_comment_meta($comment->comment_ID, 'rating', true),
                'content'  => $comment->comment_content,
                'date'     => $comment->comment_date,
                'verified' => (bool) get_comment_meta($comment->comment_ID, 'verified', true),
            ];
        }

        return new WP_REST_Response([
            'success'        => true,
            'product_id'     => $product_id,
            'product_name'   => $product->get_name(),
            'wc_reviews'     => [
                'count'   => count($reviews),
                'average' => $product->get_average_rating(),
                'items'   => $reviews,
            ],
            'jetreview'      => $this->get_jetreview_list_summary($product_id),
            'review_count'   => count($reviews),
            'average_rating' => $product->get_average_rating(),
            'reviews'        => $reviews,
        ], 200);
    }

    /**
     * DELETE /schema/reviews/{product_id} — Delete a specific review
     * Query param: ?comment_id=123
     */
    public function api_delete_review($request) {
        $product_id = (int) $request['id'];
        $comment_id = (int) $request->get_param('comment_id');

        if (!$comment_id) {
            return new WP_REST_Response(['success' => false, 'error' => 'comment_id parameter required'], 400);
        }

        $comment = get_comment($comment_id);
        if (!$comment || (int) $comment->comment_post_ID !== $product_id) {
            return new WP_REST_Response(['success' => false, 'error' => 'Review not found for this product'], 404);
        }

        $deleted = wp_delete_comment($comment_id, true);

        if ($deleted) {
            if (class_exists('WC_Comments')) {
                WC_Comments::clear_transients($product_id);
            }
            // Also try to remove from JetReview table
            $this->delete_jetreview_by_wc_comment($product_id, $comment);
            return new WP_REST_Response(['success' => true, 'message' => "Review {$comment_id} deleted"], 200);
        }

        return new WP_REST_Response(['success' => false, 'error' => 'Failed to delete review'], 500);
    }

    // ═══════════════════════════════════════════════════════════════
    //  REST API ENDPOINTS — Schema management, testing & debug
    // ═══════════════════════════════════════════════════════════════

    public function register_schema_routes() {
        $namespace = 'ai-elementor/v1';

        // Get current schema config
        register_rest_route($namespace, '/schema/config', [
            'methods'             => 'GET',
            'callback'            => [$this, 'api_get_config'],
            'permission_callback' => [AI_Elementor_Sync::get_instance(), 'permission_check'],
        ]);

        // Update schema config
        register_rest_route($namespace, '/schema/config', [
            'methods'             => 'PUT',
            'callback'            => [$this, 'api_update_config'],
            'permission_callback' => [AI_Elementor_Sync::get_instance(), 'permission_check'],
        ]);

        // Test/preview schema for any URL
        register_rest_route($namespace, '/schema/test', [
            'methods'             => 'GET',
            'callback'            => [$this, 'api_test_schema'],
            'permission_callback' => [AI_Elementor_Sync::get_instance(), 'permission_check'],
        ]);

        // Validate schema against Google/Bing requirements
        register_rest_route($namespace, '/schema/validate', [
            'methods'             => 'POST',
            'callback'            => [$this, 'api_validate_schema'],
            'permission_callback' => [AI_Elementor_Sync::get_instance(), 'permission_check'],
        ]);

        // Debug: get all schemas for a given post/term ID
        register_rest_route($namespace, '/schema/debug/(?P<id>\d+)', [
            'methods'             => 'GET',
            'callback'            => [$this, 'api_debug_schema'],
            'permission_callback' => [AI_Elementor_Sync::get_instance(), 'permission_check'],
        ]);

        // Bulk audit: scan all products/pages for schema completeness
        register_rest_route($namespace, '/schema/audit', [
            'methods'             => 'GET',
            'callback'            => [$this, 'api_audit_schemas'],
            'permission_callback' => [AI_Elementor_Sync::get_instance(), 'permission_check'],
        ]);

        // Set FAQ data for a page
        register_rest_route($namespace, '/schema/faq/(?P<id>\d+)', [
            'methods'             => 'PUT',
            'callback'            => [$this, 'api_set_faq'],
            'permission_callback' => [AI_Elementor_Sync::get_instance(), 'permission_check'],
        ]);

        // Toggle debug mode
        register_rest_route($namespace, '/schema/debug-mode', [
            'methods'             => 'POST',
            'callback'            => [$this, 'api_toggle_debug'],
            'permission_callback' => [AI_Elementor_Sync::get_instance(), 'permission_check'],
        ]);

        // ── Review Management (for rich snippet star ratings) ──

        // Add review(s) to a product
        register_rest_route($namespace, '/schema/reviews/(?P<id>\d+)', [
            'methods'             => 'POST',
            'callback'            => [$this, 'api_add_review'],
            'permission_callback' => [AI_Elementor_Sync::get_instance(), 'permission_check'],
        ]);

        // List reviews for a product
        register_rest_route($namespace, '/schema/reviews/(?P<id>\d+)', [
            'methods'             => 'GET',
            'callback'            => [$this, 'api_list_reviews'],
            'permission_callback' => [AI_Elementor_Sync::get_instance(), 'permission_check'],
        ]);

        // Delete a review
        register_rest_route($namespace, '/schema/reviews/(?P<id>\d+)', [
            'methods'             => 'DELETE',
            'callback'            => [$this, 'api_delete_review'],
            'permission_callback' => [AI_Elementor_Sync::get_instance(), 'permission_check'],
        ]);

        // JetReview integration status / diagnostic
        register_rest_route($namespace, '/schema/jetreview-status', [
            'methods'             => 'GET',
            'callback'            => [$this, 'api_jetreview_status'],
            'permission_callback' => [AI_Elementor_Sync::get_instance(), 'permission_check'],
        ]);

        // Sync WooCommerce reviews into JetReview table
        register_rest_route($namespace, '/schema/jetreview-sync', [
            'methods'             => 'POST',
            'callback'            => [$this, 'api_jetreview_sync'],
            'permission_callback' => [AI_Elementor_Sync::get_instance(), 'permission_check'],
        ]);

        // Fix JetReview author IDs — create WP users and update rows
        register_rest_route($namespace, '/schema/jetreview-fix-authors', [
            'methods'             => 'POST',
            'callback'            => [$this, 'api_jetreview_fix_authors'],
            'permission_callback' => [AI_Elementor_Sync::get_instance(), 'permission_check'],
        ]);

        // Debug: dump raw JetReview rows
        register_rest_route($namespace, '/schema/jetreview-rows', [
            'methods'             => 'GET',
            'callback'            => [$this, 'api_jetreview_rows'],
            'permission_callback' => [AI_Elementor_Sync::get_instance(), 'permission_check'],
        ]);
    }

    /**
     * GET /schema/config — Return current schema configuration
     */
    public function api_get_config($request) {
        return new WP_REST_Response([
            'success' => true,
            'config'  => $this->config,
            'version' => '1.8.0',
        ], 200);
    }

    /**
     * PUT /schema/config — Update schema configuration (partial merge)
     */
    public function api_update_config($request) {
        $body = $request->get_json_params();
        if (empty($body)) {
            return new WP_REST_Response(['success' => false, 'error' => 'Empty body'], 400);
        }

        // Deep merge with existing config
        $this->config = $this->array_merge_deep($this->config, $body);
        update_option('ai_schema_config', $this->config);

        return new WP_REST_Response([
            'success' => true,
            'message' => 'Schema config updated',
            'config'  => $this->config,
        ], 200);
    }

    /**
     * GET /schema/test?url=... — Preview what schema would be output for a URL
     */
    public function api_test_schema($request) {
        $url = $request->get_param('url');
        if (!$url) {
            return new WP_REST_Response(['success' => false, 'error' => 'url parameter required'], 400);
        }

        // Parse the URL to find the post/term
        $post_id = url_to_postid($url);

        $result = [
            'url'      => $url,
            'post_id'  => $post_id,
            'schemas'  => [],
            'warnings' => [],
            'tips'     => [],
        ];

        if ($post_id) {
            $post = get_post($post_id);
            $post_type = $post->post_type;

            $result['post_type'] = $post_type;
            $result['title']     = $post->post_title;

            // Check what schemas would apply
            if ($post_type === 'product') {
                $product = wc_get_product($post_id);
                if ($product) {
                    $result['schemas'][] = 'Product';
                    $result['schemas'][] = 'BreadcrumbList';
                    $result['schemas'][] = 'WebPage (ItemPage)';
                    $result['schemas'][] = 'Organization';
                    $result['schemas'][] = 'WebSite';

                    // Validate product data completeness
                    if (empty($product->get_description()) && empty($product->get_short_description())) {
                        $result['warnings'][] = 'Product has no description - required for rich results';
                    }
                    if (!$product->get_image_id()) {
                        $result['warnings'][] = 'Product has no image - required for rich results';
                    }
                    if ($product->get_review_count() < 1) {
                        $result['tips'][] = 'No reviews yet - aggregateRating won\'t render. Get at least 1 review for star ratings in SERP.';
                    }
                    if (!$product->get_sku()) {
                        $result['tips'][] = 'No SKU set - consider adding for better product identification';
                    }

                    // Check SiteSEO meta
                    $seo_title = get_post_meta($post_id, '_seopress_titles_title', true);
                    $seo_desc  = get_post_meta($post_id, '_seopress_titles_desc', true);
                    if (!$seo_title) $result['warnings'][] = 'Missing SiteSEO title';
                    if (!$seo_desc)  $result['warnings'][] = 'Missing SiteSEO description';
                }
            } elseif ($post_type === 'post') {
                $result['schemas'][] = 'BlogPosting';
                $result['schemas'][] = 'BreadcrumbList';
                $result['schemas'][] = 'WebPage (BlogPosting)';
                $result['schemas'][] = 'Organization';
                $result['schemas'][] = 'WebSite';

                if (!has_post_thumbnail($post_id)) {
                    $result['warnings'][] = 'Blog post has no featured image';
                }
            } elseif ($post_type === 'page') {
                $result['schemas'][] = 'WebPage';
                $result['schemas'][] = 'BreadcrumbList';
                $result['schemas'][] = 'Organization';
                $result['schemas'][] = 'WebSite';
            }
        } else {
            // Could be a taxonomy archive
            $result['tips'][] = 'URL did not resolve to a post - may be a category/taxonomy archive or external URL';
        }

        // Always present
        $result['schemas'] = array_unique(array_merge(['Organization', 'WebSite'], $result['schemas']));

        return new WP_REST_Response(['success' => true, 'data' => $result], 200);
    }

    /**
     * POST /schema/validate — Validate a JSON-LD schema blob
     * Body: { "schema": { ... } } or { "url": "..." }
     */
    public function api_validate_schema($request) {
        $body = $request->get_json_params();

        $schema_data = $body['schema'] ?? null;
        $errors   = [];
        $warnings = [];
        $info     = [];

        if (!$schema_data) {
            return new WP_REST_Response(['success' => false, 'error' => 'Provide schema object in body'], 400);
        }

        // ── Required field checks per type ──
        $type = $schema_data['@type'] ?? '';
        $types = is_array($type) ? $type : [$type];

        foreach ($types as $t) {
            switch ($t) {
                case 'Organization':
                    $required = ['name', 'url', 'logo'];
                    $recommended = ['telephone', 'email', 'address', 'sameAs', 'description'];
                    break;
                case 'Product':
                    $required = ['name', 'image', 'offers'];
                    $recommended = ['description', 'sku', 'brand', 'review', 'aggregateRating', 'gtin13'];
                    break;
                case 'BlogPosting':
                case 'Article':
                    $required = ['headline', 'author', 'datePublished', 'image'];
                    $recommended = ['dateModified', 'publisher', 'description', 'mainEntityOfPage'];
                    break;
                case 'BreadcrumbList':
                    $required = ['itemListElement'];
                    $recommended = [];
                    break;
                case 'WebSite':
                    $required = ['name', 'url'];
                    $recommended = ['potentialAction', 'publisher', 'description'];
                    break;
                case 'FAQPage':
                    $required = ['mainEntity'];
                    $recommended = [];
                    break;
                case 'Offer':
                    $required = ['price', 'priceCurrency', 'availability'];
                    $recommended = ['priceValidUntil', 'seller', 'itemCondition', 'shippingDetails', 'hasMerchantReturnPolicy'];
                    break;
                default:
                    $info[] = "Type '{$t}' - no specific validation rules defined";
                    continue 2;
            }

            foreach ($required as $field) {
                if (empty($schema_data[$field])) {
                    $errors[] = "[{$t}] Required field '{$field}' is missing or empty";
                }
            }

            foreach ($recommended as $field) {
                if (empty($schema_data[$field])) {
                    $warnings[] = "[{$t}] Recommended field '{$field}' is missing — add for better rich results";
                }
            }
        }

        // Google-specific checks
        if (in_array('Product', $types)) {
            $offers = $schema_data['offers'] ?? [];
            $offer_type = $offers['@type'] ?? '';
            if ($offer_type === 'Offer') {
                if (empty($offers['shippingDetails'])) {
                    $warnings[] = '[Google] Missing shippingDetails on Offer — required for free listing in Google Shopping';
                }
                if (empty($offers['hasMerchantReturnPolicy'])) {
                    $warnings[] = '[Google] Missing hasMerchantReturnPolicy — required for Google Shopping eligibility';
                }
            }
        }

        // Bing-specific checks
        if (!empty($schema_data['sameAs'])) {
            $info[] = '[Bing] sameAs found — helps Bing link your brand across platforms';
        } else if (in_array('Organization', $types)) {
            $warnings[] = '[Bing] Missing sameAs on Organization — add social profiles for Bing entity recognition';
        }

        // AI engine checks
        if (in_array('Organization', $types)) {
            if (empty($schema_data['description'])) {
                $warnings[] = '[AI Engines] Missing description on Organization — critical for ChatGPT/Claude/Gemini entity understanding';
            }
            if (strlen($schema_data['description'] ?? '') < 100) {
                $warnings[] = '[AI Engines] Organization description is short — write 150+ chars for better AI comprehension';
            }
        }

        $valid = empty($errors);

        return new WP_REST_Response([
            'success' => true,
            'valid'   => $valid,
            'score'   => max(0, 100 - (count($errors) * 20) - (count($warnings) * 5)),
            'errors'  => $errors,
            'warnings'=> $warnings,
            'info'    => $info,
            'engines' => [
                'google' => empty(array_filter($errors, fn($e) => str_contains($e, 'required'))),
                'bing'   => empty(array_filter($warnings, fn($w) => str_contains($w, 'Bing'))),
                'ai'     => empty(array_filter($warnings, fn($w) => str_contains($w, 'AI'))),
            ],
        ], 200);
    }

    /**
     * GET /schema/debug/{id} — Get detailed schema info for a post/product/term
     */
    public function api_debug_schema($request) {
        $id = (int) $request['id'];

        // Try as post first
        $post = get_post($id);
        $result = ['id' => $id, 'type' => null, 'schemas' => [], 'meta' => [], 'issues' => []];

        if ($post) {
            $result['type']  = $post->post_type;
            $result['title'] = $post->post_title;
            $result['url']   = get_permalink($id);
            $result['status']= $post->post_status;

            // Gather all schema-relevant meta
            $result['meta'] = [
                'seo_title'         => get_post_meta($id, '_seopress_titles_title', true) ?: null,
                'seo_description'   => get_post_meta($id, '_seopress_titles_desc', true) ?: null,
                'has_featured_image'=> has_post_thumbnail($id),
                'featured_image'    => wp_get_attachment_url(get_post_thumbnail_id($id)) ?: null,
                'schema_faq'        => get_post_meta($id, '_schema_faq', true) ?: null,
            ];

            if ($post->post_type === 'product') {
                $product = wc_get_product($id);
                if ($product) {
                    $result['product'] = [
                        'sku'               => $product->get_sku(),
                        'price'             => $product->get_price(),
                        'sale_price'        => $product->get_sale_price(),
                        'regular_price'     => $product->get_regular_price(),
                        'currency'          => get_woocommerce_currency(),
                        'in_stock'          => $product->is_in_stock(),
                        'type'              => $product->get_type(),
                        'review_count'      => $product->get_review_count(),
                        'average_rating'    => $product->get_average_rating(),
                        'has_description'   => !empty($product->get_description()),
                        'has_short_desc'    => !empty($product->get_short_description()),
                        'image_count'       => count($product->get_gallery_image_ids()) + ($product->get_image_id() ? 1 : 0),
                        'weight'            => $product->get_weight(),
                        'categories'        => $this->get_product_category_names($product),
                        'gtin'              => get_post_meta($id, '_gtin', true) ?: null,
                        'mpn'               => get_post_meta($id, '_mpn', true) ?: null,
                    ];

                    // Quality checks
                    if (empty($product->get_description())) {
                        $result['issues'][] = ['severity' => 'error', 'msg' => 'No product description — critical for schema and SEO'];
                    }
                    if (!$product->get_image_id()) {
                        $result['issues'][] = ['severity' => 'error', 'msg' => 'No product image — required by Google'];
                    }
                    if ($product->get_review_count() < 1) {
                        $result['issues'][] = ['severity' => 'warning', 'msg' => 'No reviews — no star ratings in SERP'];
                    }
                    if (!$product->get_sku()) {
                        $result['issues'][] = ['severity' => 'info', 'msg' => 'No SKU — consider adding for better identification'];
                    }
                    if (empty(get_post_meta($id, '_gtin', true))) {
                        $result['issues'][] = ['severity' => 'info', 'msg' => 'No GTIN/EAN — add for Google Shopping eligibility'];
                    }
                }
            }

            if (!$result['meta']['seo_title']) {
                $result['issues'][] = ['severity' => 'warning', 'msg' => 'Missing SiteSEO title'];
            }
            if (!$result['meta']['seo_description']) {
                $result['issues'][] = ['severity' => 'warning', 'msg' => 'Missing SiteSEO description'];
            }
            if (!$result['meta']['has_featured_image']) {
                $result['issues'][] = ['severity' => 'warning', 'msg' => 'No featured image set'];
            }

        } else {
            // Try as term
            $term = get_term($id);
            if ($term && !is_wp_error($term)) {
                $result['type']  = 'taxonomy:' . $term->taxonomy;
                $result['title'] = $term->name;
                $result['url']   = get_term_link($term);
                $result['meta']  = [
                    'description'     => $term->description ?: null,
                    'seo_title'       => get_term_meta($id, '_seopress_titles_title', true) ?: null,
                    'seo_description' => get_term_meta($id, '_seopress_titles_desc', true) ?: null,
                    'product_count'   => $term->count,
                ];
                if (empty($term->description)) {
                    $result['issues'][] = ['severity' => 'warning', 'msg' => 'Category has no description'];
                }
            } else {
                return new WP_REST_Response(['success' => false, 'error' => "ID {$id} not found as post or term"], 404);
            }
        }

        $result['schema_score'] = max(0, 100 - (count(array_filter($result['issues'], fn($i) => $i['severity'] === 'error')) * 25) - (count(array_filter($result['issues'], fn($i) => $i['severity'] === 'warning')) * 10));

        return new WP_REST_Response(['success' => true, 'data' => $result], 200);
    }

    /**
     * GET /schema/audit — Bulk audit all products & key pages for schema readiness
     */
    public function api_audit_schemas($request) {
        $type = $request->get_param('type') ?: 'all'; // all, products, posts, pages

        $audit = [
            'summary'  => ['total' => 0, 'errors' => 0, 'warnings' => 0, 'perfect' => 0],
            'products' => [],
            'posts'    => [],
            'pages'    => [],
            'categories' => [],
        ];

        // Audit products
        if ($type === 'all' || $type === 'products') {
            $products = wc_get_products(['limit' => -1, 'status' => 'publish']);
            foreach ($products as $product) {
                $issues = [];
                $pid = $product->get_id();

                if (empty($product->get_description()) && empty($product->get_short_description())) {
                    $issues[] = ['severity' => 'error', 'msg' => 'No description'];
                }
                if (!$product->get_image_id()) {
                    $issues[] = ['severity' => 'error', 'msg' => 'No image'];
                }
                if (!get_post_meta($pid, '_seopress_titles_title', true)) {
                    $issues[] = ['severity' => 'warning', 'msg' => 'No SEO title'];
                }
                if (!get_post_meta($pid, '_seopress_titles_desc', true)) {
                    $issues[] = ['severity' => 'warning', 'msg' => 'No SEO description'];
                }
                if ($product->get_review_count() < 1) {
                    $issues[] = ['severity' => 'info', 'msg' => 'No reviews'];
                }
                if (!$product->get_sku()) {
                    $issues[] = ['severity' => 'info', 'msg' => 'No SKU'];
                }

                $score = max(0, 100 - (count(array_filter($issues, fn($i) => $i['severity'] === 'error')) * 25) - (count(array_filter($issues, fn($i) => $i['severity'] === 'warning')) * 10));

                $audit['products'][] = [
                    'id'     => $pid,
                    'name'   => $product->get_name(),
                    'url'    => get_permalink($pid),
                    'score'  => $score,
                    'issues' => $issues,
                ];

                $audit['summary']['total']++;
                if ($score === 100) $audit['summary']['perfect']++;
                if ($score < 50) $audit['summary']['errors']++;
                elseif ($score < 80) $audit['summary']['warnings']++;
            }
        }

        // Audit blog posts
        if ($type === 'all' || $type === 'posts') {
            $posts = get_posts(['post_type' => 'post', 'posts_per_page' => -1, 'post_status' => 'publish']);
            foreach ($posts as $post) {
                $issues = [];
                if (!has_post_thumbnail($post->ID)) {
                    $issues[] = ['severity' => 'warning', 'msg' => 'No featured image'];
                }
                if (!get_post_meta($post->ID, '_seopress_titles_title', true)) {
                    $issues[] = ['severity' => 'warning', 'msg' => 'No SEO title'];
                }

                $score = max(0, 100 - (count(array_filter($issues, fn($i) => $i['severity'] === 'error')) * 25) - (count(array_filter($issues, fn($i) => $i['severity'] === 'warning')) * 10));

                $audit['posts'][] = [
                    'id'     => $post->ID,
                    'title'  => $post->post_title,
                    'score'  => $score,
                    'issues' => $issues,
                ];
                $audit['summary']['total']++;
            }
        }

        // Audit WC categories
        if ($type === 'all' || $type === 'categories') {
            $cats = get_terms(['taxonomy' => 'product_cat', 'hide_empty' => false]);
            if (!is_wp_error($cats)) {
                foreach ($cats as $cat) {
                    $issues = [];
                    if (empty($cat->description)) {
                        $issues[] = ['severity' => 'warning', 'msg' => 'No category description'];
                    }
                    if (!get_term_meta($cat->term_id, '_seopress_titles_title', true)) {
                        $issues[] = ['severity' => 'warning', 'msg' => 'No SEO title'];
                    }

                    $score = max(0, 100 - (count($issues) * 15));

                    $audit['categories'][] = [
                        'id'    => $cat->term_id,
                        'name'  => $cat->name,
                        'score' => $score,
                        'issues'=> $issues,
                    ];
                    $audit['summary']['total']++;
                }
            }
        }

        return new WP_REST_Response(['success' => true, 'audit' => $audit], 200);
    }

    /**
     * PUT /schema/faq/{id} — Set FAQ structured data for a page
     * Body: { "faqs": [{"question": "...", "answer": "..."}, ...] }
     */
    public function api_set_faq($request) {
        $id   = (int) $request['id'];
        $body = $request->get_json_params();
        $faqs = $body['faqs'] ?? [];

        if (empty($faqs)) {
            delete_post_meta($id, '_schema_faq');
            return new WP_REST_Response(['success' => true, 'message' => 'FAQ data cleared'], 200);
        }

        // Validate FAQ structure
        foreach ($faqs as $i => $faq) {
            if (empty($faq['question']) || empty($faq['answer'])) {
                return new WP_REST_Response([
                    'success' => false,
                    'error'   => "FAQ item {$i} missing question or answer",
                ], 400);
            }
        }

        update_post_meta($id, '_schema_faq', $faqs);

        return new WP_REST_Response([
            'success'  => true,
            'message'  => 'FAQ schema set for post ' . $id,
            'faq_count'=> count($faqs),
        ], 200);
    }

    /**
     * POST /schema/debug-mode — Toggle debug mode
     * Body: { "enabled": true|false }
     */
    public function api_toggle_debug($request) {
        $body = $request->get_json_params();
        $enabled = !empty($body['enabled']);

        $this->config['debug_mode'] = $enabled;
        update_option('ai_schema_config', $this->config);

        return new WP_REST_Response([
            'success'    => true,
            'debug_mode' => $enabled,
        ], 200);
    }

    // ═══════════════════════════════════════════════════════════════
    //  ADMIN BAR DEBUG
    // ═══════════════════════════════════════════════════════════════

    public function admin_bar_debug($wp_admin_bar) {
        if (!is_admin_bar_showing()) return;

        $schema_count = count($this->schemas);

        $wp_admin_bar->add_node([
            'id'    => 'ai-schema-debug',
            'title' => "🔧 Schema: {$schema_count} entities",
            'href'  => '#',
            'meta'  => ['class' => 'ai-schema-debug-node'],
        ]);

        // Add individual schema types as sub-items
        foreach ($this->schemas as $i => $schema) {
            $type = $schema['@type'] ?? 'Unknown';
            if (is_array($type)) $type = implode(' / ', $type);
            $wp_admin_bar->add_node([
                'parent' => 'ai-schema-debug',
                'id'     => "ai-schema-{$i}",
                'title'  => "#{$i}: {$type}",
                'href'   => '#',
            ]);
        }

        // Quick links
        $wp_admin_bar->add_node([
            'parent' => 'ai-schema-debug',
            'id'     => 'ai-schema-google-test',
            'title'  => '→ Google Rich Results Test',
            'href'   => 'https://search.google.com/test/rich-results?url=' . urlencode($this->get_current_url()),
            'meta'   => ['target' => '_blank'],
        ]);
        $wp_admin_bar->add_node([
            'parent' => 'ai-schema-debug',
            'id'     => 'ai-schema-validator',
            'title'  => '→ Schema.org Validator',
            'href'   => 'https://validator.schema.org/#url=' . urlencode($this->get_current_url()),
            'meta'   => ['target' => '_blank'],
        ]);
        $wp_admin_bar->add_node([
            'parent' => 'ai-schema-debug',
            'id'     => 'ai-schema-bing',
            'title'  => '→ Bing Markup Validator',
            'href'   => 'https://www.bing.com/webmasters/markup-validator?url=' . urlencode($this->get_current_url()),
            'meta'   => ['target' => '_blank'],
        ]);
    }

    // ═══════════════════════════════════════════════════════════════
    //  HELPER METHODS
    // ═══════════════════════════════════════════════════════════════

    private function get_current_url() {
        if (is_front_page()) return home_url('/');
        global $wp;
        return home_url(add_query_arg([], $wp->request)) . '/';
    }

    private function get_page_title() {
        if (is_singular()) return get_the_title();
        if (is_archive()) return get_the_archive_title();
        if (is_search()) return 'Search: ' . get_search_query();
        if (is_front_page()) return get_bloginfo('name');
        return wp_title('', false);
    }

    private function get_page_type_label() {
        if (is_front_page()) return 'Front Page';
        if (function_exists('is_product') && is_product()) return 'Product';
        if (function_exists('is_shop') && is_shop()) return 'Shop';
        if (function_exists('is_product_category') && is_product_category()) return 'Product Category';
        if (is_singular('post')) return 'Blog Post';
        if (is_page()) return 'Page';
        if (is_category()) return 'Blog Category';
        if (is_search()) return 'Search Results';
        return 'Other';
    }

    private function get_seo_description() {
        $id = get_queried_object_id();
        // SiteSEO
        $desc = get_post_meta($id, '_seopress_titles_desc', true);
        if ($desc) return $desc;
        // Term meta
        $desc = get_term_meta($id, '_seopress_titles_desc', true);
        if ($desc) return $desc;
        return '';
    }

    private function get_product_brand($product) {
        // Try pa_brand attribute first
        $brand = $product->get_attribute('pa_brand');
        if ($brand) return $brand;

        // Try brand taxonomy
        $terms = get_the_terms($product->get_id(), 'product_brand');
        if ($terms && !is_wp_error($terms)) {
            return $terms[0]->name;
        }

        // Infer from product name
        $name = $product->get_name();
        $brands = ['Sinours', 'Winsor & Newton', 'Baohong', 'POTENTATE', 'Potentate', 'ArtSecret', 'Sicon', 'Sketchers'];
        foreach ($brands as $b) {
            if (stripos($name, $b) !== false) return $b;
        }

        return $this->config['org_name']; // Fallback to store name
    }

    private function get_product_category_names($product) {
        $terms = get_the_terms($product->get_id(), 'product_cat');
        if ($terms && !is_wp_error($terms)) {
            return implode(' > ', wp_list_pluck($terms, 'name'));
        }
        return '';
    }

    private function get_product_images($product) {
        $images = [];

        // Main image
        $main_id = $product->get_image_id();
        if ($main_id) {
            $img_data = wp_get_attachment_image_src($main_id, 'full');
            if ($img_data && is_array($img_data)) {
                $images[] = [
                    '@type'      => 'ImageObject',
                    'url'        => $img_data[0],
                    'width'      => $img_data[1] ?? 0,
                    'height'     => $img_data[2] ?? 0,
                    'caption'    => (string) (get_post_meta($main_id, '_wp_attachment_image_alt', true) ?: $product->get_name()),
                ];
            }
        }

        // Gallery images
        $gallery_ids = $product->get_gallery_image_ids();
        if (is_array($gallery_ids)) {
            foreach ($gallery_ids as $gallery_id) {
                $img_data = wp_get_attachment_image_src($gallery_id, 'full');
                if ($img_data && is_array($img_data)) {
                    $images[] = [
                        '@type'  => 'ImageObject',
                        'url'    => $img_data[0],
                        'width'  => $img_data[1] ?? 0,
                        'height' => $img_data[2] ?? 0,
                    ];
                }
            }
        }

        return $images ?: [['@type' => 'ImageObject', 'url' => $this->config['org_logo']]];
    }

    private function get_deepest_term($terms) {
        $deepest = $terms[0];
        $max_depth = 0;
        foreach ($terms as $term) {
            $depth = 0;
            $parent = $term->parent;
            while ($parent) {
                $depth++;
                $parent_term = get_term($parent, $term->taxonomy);
                $parent = $parent_term ? $parent_term->parent : 0;
            }
            if ($depth > $max_depth) {
                $max_depth = $depth;
                $deepest = $term;
            }
        }
        return $deepest;
    }

    private function get_term_parents($term) {
        $parents = [];
        $parent_id = $term->parent;
        while ($parent_id) {
            $parent_term = get_term($parent_id, $term->taxonomy);
            if (!$parent_term || is_wp_error($parent_term)) break;
            array_unshift($parents, $parent_term);
            $parent_id = $parent_term->parent;
        }
        return $parents;
    }

    // ═══════════════════════════════════════════════════════════════
    //  JETREVIEW BRIDGE — Auto-detect and integrate with Crocoblock JetReview
    // ═══════════════════════════════════════════════════════════════

    /**
     * Detect JetReview plugin and return table info (cached per request)
     * @return array|false  Table info or false if JetReview not found
     */
    private function detect_jetreview() {
        static $cache = null;
        if ($cache !== null) return $cache;

        global $wpdb;
        $table = $wpdb->prefix . 'jet_reviews';

        // Check table existence (works regardless of plugin constant)
        $exists = $wpdb->get_var($wpdb->prepare("SHOW TABLES LIKE %s", $table));
        if (!$exists) {
            $cache = false;
            return false;
        }

        // Discover column names dynamically — safe across JetReview versions
        $columns = $wpdb->get_results("DESCRIBE {$table}", ARRAY_A);
        $col_names = array_column($columns, 'Field');

        $cache = [
            'table'   => $table,
            'columns' => $col_names,
            'version' => defined('JET_REVIEWS_VERSION') ? JET_REVIEWS_VERSION : 'unknown',
        ];
        return $cache;
    }

    /**
     * Read reviews from JetReview's custom table for a product
     * @param  int   $product_id   WC product ID
     * @param  int   $limit        Max individual reviews to return
     * @return array|null  {count, average, reviews[]} or null if JetReview absent
     */
    private function get_jetreview_reviews($product_id, $limit = 10) {
        $jr = $this->detect_jetreview();
        if (!$jr) return null;

        global $wpdb;
        $table = $jr['table'];
        $cols  = $jr['columns'];

        // Determine product-ID column (JetReview 3.x uses source_id; older used post_id)
        if (in_array('source_id', $cols)) {
            $id_col = 'source_id';
        } elseif (in_array('post_id', $cols)) {
            $id_col = 'post_id';
        } else {
            return null; // Unknown schema
        }

        $approved_clause = in_array('approved', $cols) ? 'AND approved = 1' : '';
        $date_col        = in_array('date', $cols) ? 'date' : (in_array('date_created', $cols) ? 'date_created' : 'date');

        // Total approved count
        $total = (int) $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM {$table} WHERE {$id_col} = %d {$approved_clause}",
            $product_id
        ));

        if ($total < 1) {
            return ['count' => 0, 'average' => 0, 'reviews' => []];
        }

        // Fetch individual reviews
        $rows = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM {$table} WHERE {$id_col} = %d {$approved_clause} ORDER BY {$date_col} DESC LIMIT %d",
            $product_id,
            $limit
        ));

        $total_rating = 0;
        $formatted    = [];
        foreach ($rows as $r) {
            $rating = $this->extract_jetreview_rating($r);
            $total_rating += $rating;

            // Resolve author name
            $author = 'Customer';
            if (!empty($r->author_name)) {
                $author = $r->author_name;
            } else {
                $uid = isset($r->author_id) ? (int) $r->author_id : (isset($r->author) ? (int) $r->author : 0);
                if ($uid > 0) {
                    $user = get_user_by('id', $uid);
                    if ($user) $author = $user->display_name;
                }
            }

            $formatted[] = [
                '@type'         => 'Review',
                'author'        => ['@type' => 'Person', 'name' => $author],
                'datePublished' => isset($r->{$date_col}) ? $r->{$date_col} : '',
                'reviewBody'    => wp_strip_all_tags(isset($r->content) ? (string) $r->content : ''),
                'reviewRating'  => [
                    '@type'       => 'Rating',
                    'ratingValue' => (string) $rating,
                    'bestRating'  => '5',
                    'worstRating' => '1',
                ],
            ];
        }

        $count = count($rows);
        return [
            'count'   => $total,
            'average' => $count > 0 ? round($total_rating / $count, 1) : 0,
            'reviews' => $formatted,
        ];
    }

    /**
     * Extract numeric 1-5 rating from JetReview row
     * JetReview stores ratings on a 0-100 scale (5 stars = 100, 4 = 80, etc.)
     */
    private function extract_jetreview_rating($row) {
        // Direct rating column — JetReview 3.x uses 0-100 scale
        if (isset($row->rating) && is_numeric($row->rating) && $row->rating > 0) {
            $raw = (float) $row->rating;
            if ($raw > 5) {
                // 0-100 scale → convert to 1-5
                return min(5, max(1, round($raw / 20, 1)));
            }
            return min(5, max(1, $raw));
        }
        // Parse rating_data JSON
        if (!empty($row->rating_data)) {
            $data = json_decode($row->rating_data, true);
            if (is_array($data)) {
                foreach ($data as $val) {
                    if (is_array($val) && isset($val['field_value'])) {
                        $fv  = (float) $val['field_value'];
                        $max = isset($val['field_max']) ? (float) $val['field_max'] : 100;
                        if ($max > 5) return min(5, max(1, round(($fv / $max) * 5, 1)));
                        return min(5, max(1, $fv));
                    }
                    if (is_numeric($val)) {
                        $v = (float) $val;
                        if ($v > 5) return min(5, max(1, round($v / 20, 1)));
                        return min(5, max(1, $v));
                    }
                }
            }
        }
        return 5; // Fallback
    }

    /**
     * Insert a review into JetReview's custom table (dual-write from our API)
     * @return int|false  Inserted row ID or false on failure
     */
    private function insert_jetreview($product_id, $author, $email, $rating, $content, $title = '', $date = null) {
        $jr = $this->detect_jetreview();
        if (!$jr) return false;

        global $wpdb;
        $table = $jr['table'];
        $cols  = $jr['columns'];
        $now   = $date ?: current_time('mysql');

        $data = [];

        // Convert 1-5 star rating to JetReview 0-100 scale
        $jr_rating = min(100, max(0, (int) ($rating * 20)));

        // Product ID column
        if (in_array('post_id', $cols))     $data['post_id']   = $product_id;
        elseif (in_array('source_id', $cols)) $data['source_id'] = $product_id;

        // Source & post type — match JetReview's native format
        if (in_array('source', $cols))     $data['source']    = 'post';
        if (in_array('post_type', $cols))  $data['post_type'] = 'product';

        // Author — JetReview stores user ID (0 = guest)
        if (in_array('author', $cols))      $data['author']      = 0;
        if (in_array('author_id', $cols))   $data['author_id']   = 0;
        if (in_array('author_name', $cols)) $data['author_name'] = $author;
        if (in_array('author_mail', $cols)) $data['author_mail'] = $email;

        // Content
        if (in_array('date', $cols))         $data['date']      = $now;
        if (in_array('date_created', $cols)) $data['date_created'] = $now;
        if (in_array('title', $cols))        $data['title']     = $title ?: $author;
        if (in_array('content', $cols))      $data['content']   = $content;

        // Rating — JetReview uses 0-100 scale
        if (in_array('rating_data', $cols)) {
            $data['rating_data'] = wp_json_encode([
                ['field_id' => 'field_1', 'field_name' => 'Rating', 'field_value' => $jr_rating, 'field_max' => 100]
            ]);
        }
        if (in_array('rating', $cols)) {
            $data['rating'] = $jr_rating;
        }

        // Defaults
        if (in_array('type_slug', $cols))  $data['type_slug']  = 'default';
        if (in_array('approved', $cols))   $data['approved']   = 1;
        if (in_array('pinned', $cols))     $data['pinned']     = 0;
        if (in_array('likes', $cols))      $data['likes']      = 0;
        if (in_array('dislikes', $cols))   $data['dislikes']   = 0;

        $result = $wpdb->insert($table, $data);
        if ($result) {
            // Update JetReview's cached post-level rating meta
            $this->sync_jetreview_rating_meta($product_id);
            return $wpdb->insert_id;
        }
        return false;
    }

    /**
     * Delete a review from JetReview's table by matching content/author
     */
    private function delete_jetreview_by_wc_comment($product_id, $comment) {
        $jr = $this->detect_jetreview();
        if (!$jr) return false;

        global $wpdb;
        $table = $jr['table'];
        $cols  = $jr['columns'];

        $id_col = in_array('source_id', $cols) ? 'source_id' : (in_array('post_id', $cols) ? 'post_id' : null);
        if (!$id_col) return false;

        // Try to match by author_name + content
        $where = [$id_col => $product_id];
        if (in_array('author_name', $cols) && $comment->comment_author) {
            $where['author_name'] = $comment->comment_author;
        }

        return $wpdb->delete($table, $where) !== false;
    }

    /**
     * Recalculate and store JetReview's aggregate rating in post meta
     */
    private function sync_jetreview_rating_meta($product_id) {
        $jr_data = $this->get_jetreview_reviews($product_id);
        if (!$jr_data || $jr_data['count'] < 1) return;

        // JetReview typically caches aggregate ratings in post meta
        update_post_meta($product_id, '_jet_reviews_average_rating', $jr_data['average']);
        update_post_meta($product_id, '_jet_reviews_count', $jr_data['count']);
    }

    /**
     * Get combined review data from WC native + JetReview for schema markup
     * Returns the best available data — prefers the source with more reviews
     * to match what users see on the frontend.
     */
    private function get_combined_review_data($product) {
        $pid = $product->get_id();

        // WC native reviews
        $wc_count   = (int) $product->get_review_count();
        $wc_average = (float) $product->get_average_rating();
        $wc_reviews = [];
        if ($wc_count > 0) {
            $comments = get_comments([
                'post_id' => $pid,
                'status'  => 'approve',
                'type'    => 'review',
                'number'  => 5,
            ]);
            foreach ($comments as $c) {
                $r = get_comment_meta($c->comment_ID, 'rating', true);
                $wc_reviews[] = [
                    '@type'         => 'Review',
                    'author'        => ['@type' => 'Person', 'name' => $c->comment_author ?: 'Anonymous'],
                    'datePublished' => $c->comment_date,
                    'reviewBody'    => wp_strip_all_tags((string) $c->comment_content),
                    'reviewRating'  => [
                        '@type'       => 'Rating',
                        'ratingValue' => $r ?: '5',
                        'bestRating'  => '5',
                        'worstRating' => '1',
                    ],
                ];
            }
        }

        // JetReview data (may be null if plugin absent)
        $jr = $this->get_jetreview_reviews($pid, 5);

        // Decide which source to use
        $jr_count   = $jr ? $jr['count'] : 0;
        $jr_average = $jr ? $jr['average'] : 0;

        if ($jr_count > 0 && $jr_count >= $wc_count) {
            // JetReview has reviews (and at least as many as WC) — use JetReview
            // because that's what the frontend widget displays
            return [
                'count'   => $jr_count,
                'average' => $jr_average,
                'reviews' => $jr['reviews'],
                'source'  => 'jetreview',
            ];
        }

        // Default: use WC native reviews
        return [
            'count'   => $wc_count,
            'average' => $wc_average,
            'reviews' => $wc_reviews,
            'source'  => 'woocommerce',
        ];
    }

    /**
     * Quick summary of JetReview data for a product (used in api_list_reviews)
     */
    private function get_jetreview_list_summary($product_id) {
        $jr = $this->detect_jetreview();
        if (!$jr) return ['detected' => false];

        $jr_data = $this->get_jetreview_reviews($product_id, 5);
        return [
            'detected' => true,
            'version'  => $jr['version'],
            'count'    => $jr_data ? $jr_data['count'] : 0,
            'average'  => $jr_data ? $jr_data['average'] : 0,
        ];
    }

    /**
     * REST: GET /schema/jetreview-status — Diagnostic for JetReview integration
     */
    public function api_jetreview_status($request) {
        $jr = $this->detect_jetreview();

        if (!$jr) {
            return new WP_REST_Response([
                'success'     => true,
                'detected'    => false,
                'message'     => 'JetReview plugin table not found — using WooCommerce native reviews only',
            ], 200);
        }

        // Gather stats
        global $wpdb;
        $table = $jr['table'];
        $total_reviews = (int) $wpdb->get_var("SELECT COUNT(*) FROM {$table}");
        $approved      = (int) $wpdb->get_var("SELECT COUNT(*) FROM {$table} WHERE approved = 1");

        // Check a few products
        $id_col = in_array('source_id', $jr['columns']) ? 'source_id' : 'post_id';
        $products_with_reviews = $wpdb->get_results(
            "SELECT {$id_col} as product_id, COUNT(*) as cnt, AVG(CASE WHEN rating > 0 THEN rating ELSE NULL END) as avg_rating
             FROM {$table} WHERE approved = 1 GROUP BY {$id_col} LIMIT 20",
            ARRAY_A
        );

        return new WP_REST_Response([
            'success'       => true,
            'detected'      => true,
            'table'         => $table,
            'columns'       => $jr['columns'],
            'version'       => $jr['version'],
            'total_reviews' => $total_reviews,
            'approved'      => $approved,
            'products'      => $products_with_reviews,
        ], 200);
    }

    /**
     * REST: POST /schema/jetreview-sync — Sync WooCommerce reviews into JetReview table
     * Copies all WC product reviews that don't yet exist in JetReview's table
     */
    public function api_jetreview_sync($request) {
        $jr = $this->detect_jetreview();
        if (!$jr) {
            return new WP_REST_Response([
                'success' => false,
                'error'   => 'JetReview table not detected',
            ], 400);
        }

        global $wpdb;
        $table  = $jr['table'];
        $cols   = $jr['columns'];
        $id_col = in_array('post_id', $cols) ? 'post_id' : (in_array('source_id', $cols) ? 'source_id' : null);
        if (!$id_col) {
            return new WP_REST_Response(['success' => false, 'error' => 'Cannot determine JetReview product ID column'], 500);
        }

        // Optionally target specific product
        $target_id = $request->get_param('product_id') ? (int) $request->get_param('product_id') : 0;

        // Get all WC product reviews
        $args = [
            'type'    => 'review',
            'status'  => 'approve',
            'orderby' => 'comment_date',
            'order'   => 'ASC',
            'number'  => 500,
        ];
        if ($target_id > 0) {
            $args['post_id'] = $target_id;
        }

        $wc_reviews = get_comments($args);
        $synced  = 0;
        $skipped = 0;
        $failed  = 0;

        foreach ($wc_reviews as $comment) {
            $product_id = (int) $comment->comment_post_ID;

            // Check if a matching review already exists in JetReview
            $existing = $wpdb->get_var($wpdb->prepare(
                "SELECT id FROM {$table} WHERE {$id_col} = %d AND content = %s LIMIT 1",
                $product_id,
                $comment->comment_content
            ));

            if ($existing) {
                $skipped++;
                continue;
            }

            $rating = (int) get_comment_meta($comment->comment_ID, 'rating', true);
            if ($rating < 1) $rating = 5;

            $jr_id = $this->insert_jetreview(
                $product_id,
                $comment->comment_author ?: 'Customer',
                $comment->comment_author_email ?: '',
                $rating,
                $comment->comment_content,
                $comment->comment_author ?: 'Customer',
                $comment->comment_date
            );

            if ($jr_id) {
                $synced++;
            } else {
                $failed++;
            }
        }

        return new WP_REST_Response([
            'success' => true,
            'message' => "Sync complete: {$synced} synced, {$skipped} already existed, {$failed} failed",
            'synced'  => $synced,
            'skipped' => $skipped,
            'failed'  => $failed,
            'total_wc_reviews' => count($wc_reviews),
        ], 200);
    }

    /**
     * REST: POST /schema/jetreview-fix-authors — Create WP users for reviewers and fix JetReview author IDs
     * Body: { "reviewers": [{"name":"Kasun Perera","email":"kasun.p@gmail.com","avatar_url":"https://..."},...] }
     * Also accepts: { "update_content": [{"jetreview_id": 5, "content": "new content text"},...] }
     */
    public function api_jetreview_fix_authors($request) {
        $jr = $this->detect_jetreview();
        if (!$jr) {
            return new WP_REST_Response(['success' => false, 'error' => 'JetReview not detected'], 400);
        }

        global $wpdb;
        $table = $jr['table'];
        $body  = $request->get_json_params();
        $results = ['users_created' => [], 'rows_updated' => 0, 'content_updated' => 0, 'errors' => []];

        // Step 1: Create/find WP users for each reviewer
        $reviewers = $body['reviewers'] ?? [];
        $user_map  = []; // email => user_id

        foreach ($reviewers as $rev) {
            $name  = sanitize_text_field($rev['name'] ?? '');
            $email = sanitize_email($rev['email'] ?? '');
            if (!$name || !$email) continue;

            // Check if user already exists
            $existing = get_user_by('email', $email);
            if ($existing) {
                $user_map[$email] = $existing->ID;
                // Update display name if different
                if ($existing->display_name !== $name) {
                    wp_update_user(['ID' => $existing->ID, 'display_name' => $name]);
                }
                $results['users_created'][] = ['name' => $name, 'id' => $existing->ID, 'status' => 'existing'];
            } else {
                // Create subscriber
                $username = sanitize_user(strtolower(str_replace(' ', '.', $name)), true);
                // Ensure unique username
                $base_username = $username;
                $counter = 1;
                while (username_exists($username)) {
                    $username = $base_username . $counter;
                    $counter++;
                }

                $user_id = wp_insert_user([
                    'user_login'   => $username,
                    'user_email'   => $email,
                    'display_name' => $name,
                    'first_name'   => explode(' ', $name)[0],
                    'last_name'    => count(explode(' ', $name)) > 1 ? explode(' ', $name, 2)[1] : '',
                    'role'         => 'subscriber',
                    'user_pass'    => wp_generate_password(16, true),
                ]);

                if (is_wp_error($user_id)) {
                    $results['errors'][] = "Failed to create user {$name}: " . $user_id->get_error_message();
                    continue;
                }

                $user_map[$email] = $user_id;
                $results['users_created'][] = ['name' => $name, 'id' => $user_id, 'status' => 'created'];
            }

            // Set avatar if provided
            if (!empty($rev['avatar_url'])) {
                $uid = $user_map[$email];
                // Download and attach avatar image
                $avatar_id = $this->sideload_avatar($rev['avatar_url'], $uid, $name);
                if ($avatar_id) {
                    // Store as simple local avatar (compatible with multiple avatar plugins)
                    update_user_meta($uid, 'wp_user_avatar', $avatar_id);
                    update_user_meta($uid, '_jetr_user_avatar', wp_get_attachment_url($avatar_id));
                    // Also store the WP user avatar URL in a standard meta
                    update_user_meta($uid, 'simple_local_avatar', [
                        'media_id' => $avatar_id,
                        'full'     => wp_get_attachment_url($avatar_id),
                    ]);
                }
            }
        }

        // Step 2: Update JetReview rows — match by title (which stores author name) or content
        $all_reviews = $wpdb->get_results("SELECT id, title, content, author FROM {$table}");
        foreach ($all_reviews as $row) {
            // Try to match reviewer by name stored in title
            foreach ($reviewers as $rev) {
                $rname = $rev['name'] ?? '';
                $remail = sanitize_email($rev['email'] ?? '');
                if (!$rname || !isset($user_map[$remail])) continue;

                // Match: the WC comment has the same author name
                // We stored author name in the 'title' field
                if (strcasecmp(trim($row->title), trim($rname)) === 0 && (int)$row->author === 0) {
                    $wpdb->update($table, ['author' => $user_map[$remail]], ['id' => $row->id]);
                    $results['rows_updated']++;
                    break;
                }
            }
        }

        // Step 3: Update review content (for Sinhala-English mixed reviews)
        $content_updates = $body['update_content'] ?? [];
        foreach ($content_updates as $upd) {
            $jr_id      = (int) ($upd['jetreview_id'] ?? 0);
            $new_content = wp_kses($upd['content'] ?? '', []);
            $new_rating  = isset($upd['rating']) ? (int) $upd['rating'] : null;

            if (!$jr_id || !$new_content) continue;

            $update_data = ['content' => $new_content];
            if ($new_rating !== null) {
                $jr_rating = min(100, max(0, $new_rating * 20));
                $update_data['rating'] = $jr_rating;
            }

            $updated = $wpdb->update($table, $update_data, ['id' => $jr_id]);
            if ($updated !== false) {
                $results['content_updated']++;
            }

            // Also update the matching WC comment
            if (!empty($upd['wc_comment_id'])) {
                $wc_id = (int) $upd['wc_comment_id'];
                wp_update_comment(['comment_ID' => $wc_id, 'comment_content' => $new_content]);
                if ($new_rating !== null) {
                    update_comment_meta($wc_id, 'rating', $new_rating);
                }
            }
        }

        return new WP_REST_Response([
            'success' => true,
            'message' => sprintf(
                '%d users processed, %d JetReview rows updated, %d content changes',
                count($results['users_created']),
                $results['rows_updated'],
                $results['content_updated']
            ),
            'details' => $results,
            'user_map' => $user_map,
        ], 200);
    }

    /**
     * Download an image and attach it to a user as their avatar
     */
    private function sideload_avatar($url, $user_id, $name) {
        require_once ABSPATH . 'wp-admin/includes/media.php';
        require_once ABSPATH . 'wp-admin/includes/file.php';
        require_once ABSPATH . 'wp-admin/includes/image.php';

        $tmp = download_url($url);
        if (is_wp_error($tmp)) return false;

        // Ensure proper .png extension — URLs with query params (ui-avatars, dicebear) lack extensions
        $ext = pathinfo(parse_url($url, PHP_URL_PATH), PATHINFO_EXTENSION);
        if (!in_array(strtolower($ext), ['jpg', 'jpeg', 'png', 'gif', 'webp'])) {
            $ext = 'png'; // default to PNG
        }
        $file_array = [
            'name'     => sanitize_file_name("avatar-{$user_id}.{$ext}"),
            'tmp_name' => $tmp,
        ];

        $attachment_id = media_handle_sideload($file_array, 0, "Avatar for {$name}");
        if (is_wp_error($attachment_id)) {
            @unlink($tmp);
            return false;
        }

        return $attachment_id;
    }

    /**
     * REST: GET /schema/jetreview-rows — Dump raw JetReview rows (debug)
     */
    public function api_jetreview_rows($request) {
        $jr = $this->detect_jetreview();
        if (!$jr) {
            return new WP_REST_Response(['success' => false, 'error' => 'JetReview not detected'], 400);
        }

        global $wpdb;
        $table     = $jr['table'];
        $product_id = $request->get_param('product_id') ? (int) $request->get_param('product_id') : 0;

        if ($product_id > 0) {
            $rows = $wpdb->get_results($wpdb->prepare("SELECT * FROM {$table} WHERE post_id = %d ORDER BY id", $product_id));
        } else {
            $rows = $wpdb->get_results("SELECT * FROM {$table} ORDER BY id LIMIT 50");
        }

        return new WP_REST_Response([
            'success' => true,
            'count'   => count($rows),
            'rows'    => $rows,
        ], 200);
    }

    private function extract_faqs_from_elementor($elementor_data) {
        $faqs = [];
        if (is_string($elementor_data)) {
            $elementor_data = json_decode($elementor_data, true);
        }
        if (!is_array($elementor_data)) return $faqs;

        // Recursively search for toggle/accordion widgets
        $this->search_elementor_widgets($elementor_data, $faqs);
        return $faqs;
    }

    private function search_elementor_widgets($elements, &$faqs) {
        foreach ($elements as $element) {
            $widget_type = $element['widgetType'] ?? '';
            if (in_array($widget_type, ['toggle', 'accordion'])) {
                $tabs = $element['settings']['tabs'] ?? [];
                foreach ($tabs as $tab) {
                    if (!empty($tab['tab_title']) && !empty($tab['tab_content'])) {
                        $faqs[] = [
                            '@type'          => 'Question',
                            'name'           => wp_strip_all_tags($tab['tab_title']),
                            'acceptedAnswer' => [
                                '@type' => 'Answer',
                                'text'  => wp_strip_all_tags($tab['tab_content']),
                            ],
                        ];
                    }
                }
            }
            // Recurse into children
            if (!empty($element['elements'])) {
                $this->search_elementor_widgets($element['elements'], $faqs);
            }
        }
    }

    private function array_merge_deep($base, $override) {
        foreach ($override as $key => $value) {
            if (is_array($value) && isset($base[$key]) && is_array($base[$key])) {
                // Only deep merge associative arrays, not indexed arrays
                if (array_keys($value) !== range(0, count($value) - 1)) {
                    $base[$key] = $this->array_merge_deep($base[$key], $value);
                } else {
                    $base[$key] = $value;
                }
            } else {
                $base[$key] = $value;
            }
        }
        return $base;
    }
}
