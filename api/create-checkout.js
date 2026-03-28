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

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { cart } = req.body;
  if (!cart || !Array.isArray(cart) || cart.length === 0) {
    return res.status(400).json({ error: 'Panier vide' });
  }

  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
  const origin = req.headers.origin || 'https://viflorcrepon.vercel.app';

  const line_items = [];
  for (const item of cart) {
    const product = PRODUCTS[item.id];
    if (!product) continue;
    line_items.push({
      price_data: {
        currency: 'eur',
        product_data: { name: product.name },
        unit_amount: product.price,
      },
      quantity: item.qty,
    });
  }

  if (line_items.length === 0) {
    return res.status(400).json({ error: 'Produits invalides' });
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items,
    mode: 'payment',
    success_url: `${origin}/merci.html?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/?cancelled=1`,
    billing_address_collection: 'required',
    shipping_address_collection: { allowed_countries: ['FR', 'BE', 'CH', 'LU'] },
    locale: 'fr',
  });

  res.json({ url: session.url });
};
