<?php
/**
 * Elementor Iconify Icon Widget Extension
 *
 * Adds support for Iconify icons (e.g., tabler:rocket) in Elementor templates via ai-elementor-sync.
 */

defined('ABSPATH') || exit();

add_action('elementor/widgets/widgets_registered', function($widgets_manager) {
    class Iconify_Icon_Widget extends \Elementor\Widget_Base {
        public function get_name() {
            return 'iconify-icon';
        }
        public function get_title() {
            return __('Iconify Icon', 'ai-elementor-sync');
        }
        public function get_icon() {
            return 'eicon-star';
        }
        public function get_categories() {
            return ['general'];
        }
        public function get_keywords() {
            return ['icon', 'iconify', 'svg', 'tabler', 'premium'];
        }
        protected function register_controls() {
            $this->start_controls_section('section_icon', [
                'label' => __('Icon', 'ai-elementor-sync'),
            ]);
            $this->add_control('iconify_icon', [
                'label' => __('Iconify Icon Name', 'ai-elementor-sync'),
                'type' => \Elementor\Controls_Manager::TEXT,
                'default' => 'tabler:star',
                'placeholder' => 'tabler:rocket',
            ]);
            $this->add_control('icon_size', [
                'label' => __('Size (px)', 'ai-elementor-sync'),
                'type' => \Elementor\Controls_Manager::NUMBER,
                'default' => 48,
            ]);
            $this->add_control('icon_color', [
                'label' => __('Color', 'ai-elementor-sync'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'default' => '#1A1A2E',
            ]);
            $this->add_control('align', [
                'label' => __('Alignment', 'ai-elementor-sync'),
                'type' => \Elementor\Controls_Manager::CHOOSE,
                'options' => [
                    'left' => ['title' => __('Left', 'ai-elementor-sync'), 'icon' => 'eicon-text-align-left'],
                    'center' => ['title' => __('Center', 'ai-elementor-sync'), 'icon' => 'eicon-text-align-center'],
                    'right' => ['title' => __('Right', 'ai-elementor-sync'), 'icon' => 'eicon-text-align-right'],
                ],
                'default' => 'center',
            ]);
            $this->end_controls_section();
        }
        protected function render() {
            $icon = esc_attr($this->get_settings('iconify_icon'));
            $size = intval($this->get_settings('icon_size'));
            $color = esc_attr($this->get_settings('icon_color'));
            $align = esc_attr($this->get_settings('align') ?: 'center');
            echo "<div style='text-align: {$align}; line-height: 1;'><span class='iconify' data-icon='{$icon}' data-width='{$size}' data-height='{$size}' style='color: {$color}; display: inline-block; vertical-align: middle;'></span></div>";
        }
    }
    $widgets_manager->register(new Iconify_Icon_Widget());
});
