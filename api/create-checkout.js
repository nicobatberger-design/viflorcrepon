const Stripe = require('stripe');

const PRODUCTS = {
  'rose-corail-socle':       { name: 'Rose Corail sur Socle',        price: 3500 },
  'bouquet-rond-corail':     { name: 'Bouquet Rond Corail Blanc',     price: 6500 },
  'bouquet-cascade-violet':  { name: 'Bouquet Cascade Violet',        price: 9500 },
  'couronne-murale-rose':    { name: 'Couronne Murale Rose',          price: 5500 },
  'couronne-bleue-fee':      { name: 'Couronne Bleue Fee',            price: 6000 },
  'arbre-lampe-violet':      { name: 'Arbre Lampe Violet',            price: 7500 },
  'coeur-pied-orange':       { name: 'Coeur sur Pied Orange',         price: 7000 },
  'welcome-baby-coeur':      { name: 'Welcome Baby Coeur',            price: 5000 },
  'escarpin-fleuri':         { name: 'Escarpin Fleuri',               price: 4500 },
  'fee-doree-rondin':        { name: 'Fee Doree Rondin',              price: 4000 },
  'bouquet-chaussure-doree': { name: 'Bouquet Chaussure Doree',       price: 5500 },
  'fontaine-presentoir':     { name: 'Fontaine Presentoir',           price: 8500 },
};

const ALLOWED_ORIGINS = [
  'https://viflorcrepon.vercel.app',
  'https://viflorcrepon.com',
  'https://www.viflorcrepon.com',
];

const MAX_QTY_PER_ITEM = 20;
const MAX_ITEMS_IN_CART = 10;

module.exports = async (req, res) => {
  const requestOrigin = req.headers.origin || '';
  const safeOrigin = ALLOWED_ORIGINS.includes(requestOrigin)
    ? requestOrigin
    : 'https://viflorcrepon.vercel.app';

  res.setHeader('Access-Control-Allow-Origin', safeOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { cart } = req.body;
  if (!cart || !Array.isArray(cart) || cart.length === 0) {
    return res.status(400).json({ error: 'Panier vide' });
  }
  if (cart.length > MAX_ITEMS_IN_CART) {
    return res.status(400).json({ error: 'Trop de produits dans le panier' });
  }

  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

  const line_items = [];
  for (const item of cart) {
    if (!item.id || typeof item.id !== 'string') {
      return res.status(400).json({ error: 'Produit invalide' });
    }
    const qty = parseInt(item.qty, 10);
    if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY_PER_ITEM) {
      return res.status(400).json({ error: `Quantite invalide (1-${MAX_QTY_PER_ITEM})` });
    }
    const product = PRODUCTS[item.id];
    if (!product) continue;
    line_items.push({
      price_data: {
        currency: 'eur',
        product_data: { name: product.name },
        unit_amount: product.price,
      },
      quantity: qty,
    });
  }

  if (line_items.length === 0) {
    return res.status(400).json({ error: 'Produits invalides' });
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items,
    mode: 'payment',
    success_url: `${safeOrigin}/merci.html?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${safeOrigin}/?cancelled=1`,
    billing_address_collection: 'required',
    shipping_address_collection: { allowed_countries: ['FR', 'BE', 'CH', 'LU'] },
    shipping_options: [
      {
        shipping_rate_data: {
          type: 'fixed_amount',
          fixed_amount: { amount: 590, currency: 'eur' },
          display_name: 'Mondial Relay — Petit colis (≤ 2kg)',
          delivery_estimate: { minimum: { unit: 'business_day', value: 3 }, maximum: { unit: 'business_day', value: 5 } },
        },
      },
      {
        shipping_rate_data: {
          type: 'fixed_amount',
          fixed_amount: { amount: 890, currency: 'eur' },
          display_name: 'Mondial Relay — Colis moyen (≤ 5kg)',
          delivery_estimate: { minimum: { unit: 'business_day', value: 3 }, maximum: { unit: 'business_day', value: 5 } },
        },
      },
      {
        shipping_rate_data: {
          type: 'fixed_amount',
          fixed_amount: { amount: 1290, currency: 'eur' },
          display_name: 'Mondial Relay — Grand colis (≤ 10kg)',
          delivery_estimate: { minimum: { unit: 'business_day', value: 4 }, maximum: { unit: 'business_day', value: 7 } },
        },
      },
      {
        shipping_rate_data: {
          type: 'fixed_amount',
          fixed_amount: { amount: 0, currency: 'eur' },
          display_name: 'Retrait en main propre — Gratuit',
          delivery_estimate: { minimum: { unit: 'business_day', value: 1 }, maximum: { unit: 'business_day', value: 3 } },
        },
      },
    ],
    locale: 'fr',
  });

  res.json({ url: session.url });
};
