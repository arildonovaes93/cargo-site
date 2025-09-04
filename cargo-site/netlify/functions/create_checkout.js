// netlify/functions/create_checkout.js
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// CORS helper
const cors = (origin = '*') => ({
  'Access-Control-Allow-Origin': origin,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
});

exports.handler = async (event) => {
  const originHeader = event.headers && (event.headers.origin || `https://${event.headers.host}`);

  // Preflight (CORS)
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: cors(originHeader), body: '' };
  }

  // Somente POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: cors(originHeader), body: 'Method Not Allowed' };
  }

  try {
    // Exemplo: pagamento fixo de R$ 10,00 (1000 centavos)
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: { name: 'Plano CarGo' },
            unit_amount: 1000 // R$ 10,00
          },
          quantity: 1
        }
      ],
      success_url: `${originHeader}/pay.html?status=success`,
      cancel_url: `${originHeader}/pay.html?status=cancel`
    });

    return {
      statusCode: 200,
      headers: { ...cors(originHeader), 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: session.url })
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      headers: cors(originHeader),
      body: 'Erro ao criar sessão de checkout.'
    };
  }
};
