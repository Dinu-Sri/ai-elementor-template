<?php
// Enqueue Iconify JS on frontend for Elementor pages
defined('ABSPATH') || exit();

add_action('wp_enqueue_scripts', function() {
    if (class_exists('Elementor\Plugin')) {
        wp_enqueue_script(
            'iconify',
            'https://code.iconify.design/3/3.1.1/iconify.min.js',
            [],
            null,
            true
        );
    }
});
