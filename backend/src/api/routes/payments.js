const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const paymentWebhookController = require('../controllers/paymentWebhookController');
const creditController = require('../controllers/creditController');

// Get Razorpay public key
router.get('/razorpay-key', (req, res) => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  if (!keyId) {
    return res.status(500).json({ message: 'Razorpay key not configured' });
  }
  return res.json({ keyId });
});

// Credit purchase endpoint
router.post('/credits/purchase', authMiddleware, creditController.purchaseCredits);

// Payment cancellation endpoint
router.post('/cancel', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { orderId, subscriptionId, creditOrderId } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!orderId && !subscriptionId && !creditOrderId) {
      return res.status(400).json({ message: 'orderId, subscriptionId, or creditOrderId required' });
    }

    const Transaction = require('../../models/Transaction');
    const UserSubscription = require('../../models/UserSubscription');

    let cancelledTransaction = null;

    // Handle credit purchase cancellation
    if (creditOrderId) {
      const pendingCreditTransaction = await Transaction.findOne({
        user_id: userId,
        'gateway_response.id': creditOrderId,
        status: 'pending',
        transaction_type: 'credit_purchase'
      });

      if (pendingCreditTransaction) {
        pendingCreditTransaction.status = 'cancelled';
        pendingCreditTransaction.failure_reason = 'Payment cancelled by user';
        await pendingCreditTransaction.save();
        cancelledTransaction = pendingCreditTransaction;

        console.log('Credit transaction cancelled:', {
          transactionId: pendingCreditTransaction._id,
          creditOrderId,
          userId
        });
      }
    }

    // Handle subscription cancellation
    if (orderId || subscriptionId) {
      // Find pending transaction by order ID or subscription ID
      let query = { user_id: userId, status: 'pending' };

      if (orderId) {
        query['gateway_response.id'] = orderId;
      } else if (subscriptionId) {
        // For subscription cancellation, find by subscription ID in gateway response
        query['$or'] = [
          { 'gateway_response.notes.subscriptionId': subscriptionId },
          { 'gateway_response.receipt': `sub_${subscriptionId}` }
        ];
      }

      const pendingTransaction = await Transaction.findOne(query);

      if (pendingTransaction) {
        // Update transaction status to cancelled
        pendingTransaction.status = 'cancelled';
        pendingTransaction.failure_reason = 'Payment cancelled by user';
        await pendingTransaction.save();
        cancelledTransaction = pendingTransaction;

        // Also remove the pending subscription to prevent interference
        if (subscriptionId) {
          await UserSubscription.findByIdAndDelete(subscriptionId);
          console.log('Pending subscription removed:', subscriptionId);
        }

        console.log('Subscription transaction cancelled:', {
          transactionId: pendingTransaction._id,
          orderId,
          subscriptionId,
          userId
        });
      } else {
        // If no transaction found but subscriptionId provided, still clean up pending subscription
        if (subscriptionId) {
          const pendingSubscription = await UserSubscription.findOne({
            _id: subscriptionId,
            user_id: userId,
            payment_status: 'pending',
            is_active: false
          });

          if (pendingSubscription) {
            await UserSubscription.findByIdAndDelete(subscriptionId);
            console.log('Pending subscription removed (no transaction found):', subscriptionId);
          }
        }
      }
    }

    if (cancelledTransaction) {
      return res.json({
        message: 'Payment cancelled successfully',
        transactionId: cancelledTransaction._id
      });
    } else {
      return res.status(404).json({ message: 'No pending transaction found' });
    }

  } catch (err) {
    console.error('Payment cancellation error:', err);
    return res.status(500).json({ message: err.message });
  }
});

// Razorpay will POST here - protected with auth middleware
router.post('/webhook/payment', authMiddleware, express.json({ type: '*/*' }), paymentWebhookController.paymentWebhook);

module.exports = router;