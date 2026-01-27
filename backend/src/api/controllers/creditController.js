const User = require('../../models/userModel');
const Transaction = require('../../models/Transaction');
const paymentService = require('../../services/paymentService');

// Credit pack configurations
const CREDIT_PACKS = {
  starter: { credits: 10, price: 199 },
  growth: { credits: 30, price: 499 },
  power: { credits: 50, price: 749 },
  agency: { credits: 100, price: 1299 },
};

// POST /api/credits/purchase
async function purchaseCredits(req, res) {
  try {
    console.log('Credit purchase request received:', req.body);

    const userId = req.user?.id;
    if (!userId) {
      console.log('User not authenticated');
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const { packId } = req.body;

    if (!packId || !CREDIT_PACKS[packId]) {
      console.log('Invalid pack ID:', packId);
      return res.status(400).json({ message: 'Invalid credit pack selected' });
    }

    const pack = CREDIT_PACKS[packId];
    console.log('Selected pack:', pack);

    const user = await User.findById(userId);

    if (!user) {
      console.log('User not found:', userId);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('User found:', user.email);

    // Create payment order using the same service as monthly plans
    const timestamp = Date.now().toString().slice(-6); // Last 6 digits to keep receipt short
    const shortPackId = packId.substring(0, 4); // Limit pack ID to 4 chars
    const receipt = `cr_${shortPackId}_${timestamp}`;
    console.log('Receipt generated:', receipt, 'Length:', receipt.length);

    const notes = {
      userId: userId,
      packId: packId,
      credits: pack.credits,
      type: 'credit_purchase',
      userEmail: user.email,
    };

    console.log('Creating order with:', { amount: pack.price, receipt, notes });

    const order = await paymentService.createOrder({
      amount: pack.price,
      currency: 'INR',
      receipt,
      notes
    });

    console.log('Order created:', order);

    // Create pending transaction record
    const transactionData = {
      user_id: userId,
      amount: pack.price,
      currency: 'INR',
      gateway_response: {
        id: order.id, // Store order ID for webhook matching
        order_id: order.id,
        pack_id: packId,
        credits: pack.credits,
      },
      status: 'pending',
      transaction_type: 'credit_purchase',
    };

    console.log('Creating transaction with:', transactionData);

    await Transaction.create(transactionData);

    console.log('Transaction created successfully');

    const response = {
      order,
      pack: {
        id: packId,
        credits: pack.credits,
        price: pack.price,
      },
    };

    console.log('Sending response:', response);

    res.json(response);
  } catch (error) {
    console.error('Credit purchase error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      message: 'Failed to create credit purchase order',
      error: error.message
    });
  }
}

module.exports = {
  purchaseCredits,
  CREDIT_PACKS,
};