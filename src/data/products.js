import extraBrighteningSerumImg from '../assets/images/flawless-glow-extra-brightening-Serum-100ml.jpg';
import extraBrighteningCreamImg from '../assets/images/flawless-glow-extra-brightening-cream-225ml.jpg';
import brighteningBlackSerumImg from '../assets/images/flawless-glow-brightening-black-serum.jpg';
import reviveYourRadianceImg from '../assets/images/revive-your-radiance-210ml.jpg';
import goldenGlowBodyOilImg from '../assets/images/organic-golden-glow-body-oil-100ml.jpg';
import falseEyelashesImg from '../assets/images/3d-false-eyelashes.jpg';

const INGREDIENTS_IN_CLINIC = 'Ingredient list available in clinic.';

export const products = [
  {
    id: 'flawless-glow-extra-brightening-serum',
    slug: 'flawless-glow-extra-brightening-serum',
    name: 'Flawless Glow Extra Brightening Serum 100ml',
    subtitle: '100ml facial serum',
    price: 35,
    priceDisplay: '£35',
    volume: '100ml',
    category: 'Serums',
    image: extraBrighteningSerumImg,
    badge: '',
    description: 'A brightening facial serum from the MerryGold Flawless Glow range.',
    actives: [],
    benefits: [],
    howToUse: '',
    ingredients: INGREDIENTS_IN_CLINIC
  },
  {
    id: 'flawless-glow-extra-brightening-cream',
    slug: 'flawless-glow-extra-brightening-cream',
    name: 'Flawless Glow Extra Brightening Cream',
    subtitle: '225ml brightening cream',
    price: 40,
    priceDisplay: '£40',
    volume: '225ml',
    category: 'Moisturisers',
    image: extraBrighteningCreamImg,
    badge: '',
    description: 'A brightening cream from the MerryGold Flawless Glow range.',
    actives: [],
    benefits: [],
    howToUse: '',
    ingredients: INGREDIENTS_IN_CLINIC
  },
  {
    id: 'flawless-glow-brightening-black-serum',
    slug: 'flawless-glow-brightening-black-serum',
    name: 'Flawless Glow Brightening Black Scrub',
    subtitle: 'Brightening scrub',
    price: 14.99,
    priceDisplay: '£14.99',
    volume: '210ml',
    category: 'Exfoliators',
    image: brighteningBlackSerumImg,
    badge: '',
    description: 'Exfoliate and brighten glow naturally. Brightens skin and reveals a radiant natural glow. Exfoliates gently, removing dead skin cells for smooth skin. Natural ingredients, enriched with herbal goodness. Improves texture and leaves skin soft, refreshed and renewed.',
    actives: [],
    benefits: [
      'Brightens skin and reveals a radiant natural glow',
      'Exfoliates gently, removing dead skin cells for smooth skin',
      'Natural ingredients, enriched with herbal goodness',
      'Improves texture and leaves skin soft, refreshed and renewed'
    ],
    howToUse: '',
    ingredients: INGREDIENTS_IN_CLINIC
  },
  {
    id: 'revive-your-radiance',
    slug: 'revive-your-radiance',
    name: 'Revive Your Radiance',
    subtitle: '210ml exfoliator',
    price: 14.99,
    priceDisplay: '£14.99',
    volume: '210ml',
    category: 'Exfoliators',
    image: reviveYourRadianceImg,
    badge: '',
    description: 'Exfoliate and brighten your skin. Natural, organic ingredients.',
    actives: [],
    benefits: [
      'Exfoliate and brighten your skin',
      'Natural, organic ingredients'
    ],
    howToUse: '',
    ingredients: INGREDIENTS_IN_CLINIC
  },
  {
    id: 'organic-golden-glow-body-oil',
    slug: 'organic-golden-glow-body-oil',
    name: 'Organic Golden Glow Body Oil',
    subtitle: '100ml body oil',
    price: 20,
    priceDisplay: '£20',
    volume: '100ml',
    category: 'Body',
    image: goldenGlowBodyOilImg,
    badge: '',
    description: 'Nourish, glow, naturally. Deep nourishment.',
    actives: [],
    benefits: [
      'Nourish, glow, naturally',
      'Deep nourishment'
    ],
    howToUse: '',
    ingredients: INGREDIENTS_IN_CLINIC
  },
  {
    id: '3d-false-eyelashes',
    slug: '3d-false-eyelashes',
    name: '3D False Eyelashes',
    subtitle: 'False eyelashes',
    price: 20,
    priceDisplay: '£20',
    volume: '',
    category: 'Lashes',
    image: falseEyelashesImg,
    badge: '',
    description: 'A pair of 3D false eyelashes from the MerryGold range.',
    actives: [],
    benefits: [],
    howToUse: '',
    ingredients: INGREDIENTS_IN_CLINIC
  }
];
