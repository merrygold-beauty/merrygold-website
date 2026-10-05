// Every URL in the live WordPress sitemap at merrygoldbeautyclinic.com,
// captured 2026-09-15 from /wp-sitemap.xml. The new site must 301 each one to a
// real page, or whatever ranking these URLs hold is lost at launch.

export const LEGACY_WORDPRESS_PATHS = [
  // Pages
  '/', '/about-me/', '/treatments/', '/shop/', '/cart/', '/checkout/', '/my-account/', '/sample-page/', '/home-clone/',

  // Posts
  '/2026/03/26/hello-world/',
  '/2026/05/22/laser-hair-removal-in-east-london/',
  '/2026/05/23/the-ultimate-guide-to-dermaplaning-benefits-for-skin-achieve-a-london-glow/',
  '/2026/05/24/professional-skincare-in-east-ham-a-guide-to-advanced-clinical-treatments/',
  '/2026/05/25/microneedling-for-acne-scars-a-comprehensive-guide-to-skin-resurfacing/',
  '/2026/05/27/medical-grade-laser-hair-removal-a-london-case-study-in-permanent-smoothness/',

  // WooCommerce products: retail range
  '/product/organic-golden-glow-body-oil/', '/product/flawless-glow-brightening-black-serum/', '/product/revive-your-radiance/',
  '/product/flawless-glow-herbal-toning-soap-100g/', '/product/flawless-glow-extra-brightening-cream/', '/product/3d-false-eyelashes/',
  '/product/flawless-glow-extra-brightening-serum-100ml/',

  // WooCommerce products: services
  '/product/patch-test/', '/product/consultation/',
  '/product/laser-hair-removal-face/', '/product/ladies-laser-hair-removal-full-body/', '/product/ladies-laser-hair-removal-combinaton/',
  '/product/mens-laser-hair-removal/',
  '/product/ladies-waxing-hollywood-leg/', '/product/ladies-waxing-brazilian-leg/', '/product/ladies-waxing-extended-bikini-leg/',
  '/product/ladies-waxing-bikini-leg/', '/product/ladies-waxing-hollywood-leg-underarm/', '/product/ladies-waxing-brazilian-leg-underarm/',
  '/product/ladies-waxing-extended-bikini-leg-underarm/', '/product/ladies-waxing-bikini-leg-underarm/', '/product/ladies-waxing-leg-underarm/',
  '/product/ladies-waxing-underarm-hollywood/', '/product/ladies-waxing-underarm-brazilian/', '/product/ladies-waxing-underarm-bikini/',
  '/product/ladies-waxing-hollywood/', '/product/ladies-waxing-brazilian/', '/product/ladies-waxing-bikini/',
  '/product/ladies-waxing-hollywood-hot-wax/', '/product/ladies-waxing-brazilian-hot-wax/', '/product/ladies-waxing-bikini-hot-wax/',
  '/product/ladies-waxing-hollywood-strip-wax/', '/product/ladies-waxing-brazilian-strip-wax/', '/product/ladies-waxing-bikini-strip-wax/',
  '/product/ladies-waxing-leg/', '/product/ladies-waxing-arm/', '/product/ladies-waxing-face/', '/product/ladies-waxing-upper-body/',
  '/product/ladies-waxing-full-body/', '/product/ladies-waxing-buttocks/', '/product/ladies-waxing-underarm/',
  '/product/mens-waxing/', '/product/mens-waxing-hollywood/', '/product/mens-waxing-brazilian/', '/product/mens-waxing-intimate/',
  '/product/mens-waxing-back-shoulders/', '/product/mens-waxing-abdomen/', '/product/mens-waxing-back/', '/product/mens-waxing-shoulders/',
  '/product/mens-waxing-chest/', '/product/mens-waxing-leg/',
  '/product/facials/', '/product/facial/', '/product/facial-classic/', '/product/facial-mens/', '/product/facial-microdermabrasion/',
  '/product/facial-face-peel/', '/product/facial-skin-peel/', '/product/facial-dermaplaning/', '/product/facial-led-light-therapy/',
  '/product/facial-skin-rejuvenation/', '/product/facial-pigmentation-treatment/', '/product/facial-dermapen/', '/product/facial-micro-needling/',
  '/product/facial-anti-ageing/', '/product/facial-deep-cleansing/', '/product/facial-gold/', '/product/facial-mini/', '/product/facial-hydrating/',
  '/product/facial-bb-glow/', '/product/facial-acne-treatment/', '/product/facial-luxury/', '/product/facial-million-dollar/',
  '/product/facial-chemical-peel/',
  '/product/microblading-brows/', '/product/powder-brows/', '/product/microshading-brows/', '/product/ombre-brows/',
  '/product/combination-brows/', '/product/semi-permanent-makeup-eyeliner/', '/product/semi-permanent-makeup-lip-colour/',
  '/product/spmu-top-ups/',
  '/product/eyelash-extensions-classic/', '/product/eyelash-extensions-classic-volume-infills/', '/product/eyelash-extensions-volume/',
  '/product/eyelash-extensions-hybrid/', '/product/eyelash-extensions-hybrid-infills/', '/product/eyelash-extensions-party-lashes/',
  '/product/eyelash-extensions-strip-lashes/', '/product/eyelash-extensions-infills/', '/product/eyelash-extensions-removal/',
  '/product/eyelash-extensions-bottom-lashes/', '/product/eyelash-extensions-bottom-lash-infills/', '/product/eyelash-extensions-classic-infills/',
  '/product/eyelash-extensions-mega-volume/', '/product/eyelash-extensions-mega-volume-infills/',
  '/product/eyebrow-eyelash-tinting/', '/product/eyelash-tint/', '/product/eyebrow-threading/', '/product/eyebrow-waxing/',
  '/product/eyebrow-shape/', '/product/lash-lift/', '/product/lash-lift-tint/', '/product/definition-brows/', '/product/eyebrow-wax-tint/',
  '/product/eyebrow-shape-tint/', '/product/eyebrow-thread-tint/', '/product/eye-trio-eyebrow-eyelash-tint-with-eyebrow-shape/',
  '/product/brow-lamination/', '/product/brow-lamination-tint/',
  '/product/makeup/', '/product/day-makeup/', '/product/party-makeup-without-lash/', '/product/festival-makeup/', '/product/evening-makeup/',
  '/product/makeup-incl-strip-lashes/', '/product/eye-makeup/', '/product/eye-makeup-incl-strip-lashes/', '/product/wedding-makeup/',
  '/product/bridal-makeup/', '/product/bridal-hair-makeup/', '/product/makeup-hair-up/', '/product/bridal-trial-makeup-bridal-makeup-hair/',
  '/product/natural-makeup/', '/product/pre-wedding-makeup/', '/product/red-carpet-glam/', '/product/makeup-2/',
  '/product/makeup-pre-wedding/', '/product/makeup-red-carpet-glam/', '/product/facial-threading/',

  // Taxonomies and archives
  '/category/uncategorized/',
  '/tag/laser-hair-removal/', '/tag/pain-free-hair-removal/', '/tag/hair-removal-guide/', '/tag/aesthetic-treatments/', '/tag/all-skin-tones/',
  '/tag/alma-lasers/', '/tag/skincare/', '/tag/dermaplaning/', '/tag/skin-exfoliation/', '/tag/peach-fuzz/', '/tag/radiant-skin/',
  '/tag/skincare-tips/', '/tag/beauty-treatments/', '/tag/london-glow/', '/tag/facial-treatments/', '/tag/east-ham/',
  '/tag/clinical-treatments/', '/tag/chemical-peel/', '/tag/microneedling/', '/tag/hydrafacial/', '/tag/hyperpigmentation/',
  '/tag/london-skincare/', '/tag/skin-health/', '/tag/acne-scars/', '/tag/skin-resurfacing/', '/tag/collagen-induction-therapy/',
  '/tag/skincare-guide/', '/tag/skin-confidence/', '/tag/atrophic-scarring/', '/tag/medical-grade-laser/', '/tag/soprano-titanium/',
  '/tag/permanent-hair-removal/', '/tag/ingrown-hairs/', '/tag/london-beauty/', '/tag/skincare-treatments/', '/tag/safe-for-all-skin-tones/',
  '/product-category/uncategorized/', '/product-category/skincare/', '/product-category/eye-lashes/', '/product-category/patch-test/',
  '/product-category/laser-hair-removal/', '/product-category/ladies-waxing-packages/', '/product-category/ladies-waxing/',
  '/product-category/mens-waxing/', '/product-category/facials/', '/product-category/semi-permanent-makeup/',
  '/product-category/eyelash-extension-semi-permanent-lashes/', '/product-category/makeup/', '/product-category/facial-threading/',
  '/author/ojikutu/', '/author/sitemanager/'
];
