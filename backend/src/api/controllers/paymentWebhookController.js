const subscriptionService = require('../../services/subscriptionService');
const paymentService = require('../../services/paymentService');
const Transaction = require('../../models/Transaction');
const User = require('../../models/userModel');
const { CREDIT_PACKS } = require('./creditController');

const emailService = require('../../services/emailService');

// POST /api/webhook/payment
async function paymentWebhook(req, res) {
  try {
    // Get user ID from authenticated request
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Generic handler that supports both internal test webhooks and Razorpay's payload
    const body = req.body;

    // If Razorpay sends signature header, verify
    const signature = req.headers['x-razorpay-signature'];
    if (signature) {
      const raw = JSON.stringify(body);
      const ok = paymentService.verifyRazorpaySignature(raw, signature);
      if (!ok) return res.status(400).send('signature-mismatch');

      const event = body.event;

      if (event === 'payment.captured' || event === 'payment.authorized') {
        const payload = body.payload?.payment?.entity;
        const notes = payload?.notes || {};

        // Handle credit purchases
        if (notes.type === 'credit_purchase') {
          await handleCreditPurchase(payload, 'completed');
          return res.status(200).json({ ok: true });
        }

        // Handle subscription payments
        const orderId = payload?.order_id;
        const paymentId = payload?.id;

        if (orderId && paymentId) {
          // Find and update existing pending transaction (more specific matching)
          const existingTransaction = await Transaction.findOne({
            'gateway_response.id': orderId,
            status: 'pending',
            transaction_type: { $ne: 'credit_purchase' } // Exclude credit purchases
          });

          if (existingTransaction) {
            // Update existing transaction
            existingTransaction.status = 'completed';
            existingTransaction.gateway_response = {
              ...existingTransaction.gateway_response,
              ...payload,
              razorpay_payment_id: paymentId
            };
            existingTransaction.payment_id = paymentId; // Store payment ID for display
            await existingTransaction.save();

            console.log('Updated existing subscription transaction:', {
              transactionId: existingTransaction._id,
              orderId: orderId,
              paymentId: paymentId,
              userId: existingTransaction.user_id
            });

            // Activate subscription if subscription ID is available
            const receipt = notes.receipt || notes.subscriptionId || notes.subscription_id;
            let subscriptionId = null;
            if (receipt && receipt.toString().startsWith('sub_')) {
              subscriptionId = receipt.toString().split('sub_')[1];
            }

            if (subscriptionId) {
              const activatedSub = await subscriptionService.activateSubscription({
                subscriptionId,
                paymentStatus: 'completed',
                paymentMode: notes.payment_mode || 'monthly',
                gateway: 'razorpay'
              });

              // Send success email
              if (activatedSub) {
                try {
                  const user = await User.findById(activatedSub.user_id);
                  const plan = await require('../../models/Plan').findById(activatedSub.plan_id);
                  if (user && plan) {
                    const endDate = new Date(activatedSub.end_date).toLocaleDateString();
                    await emailService.sendSubscriptionSuccessEmail(user, plan, endDate);
                  }
                } catch (emailErr) {
                  console.error('Failed to send subscription email:', emailErr);
                }
              }
            }
          } else {
            // Fallback: create new transaction if no pending found
            console.log('No existing subscription transaction found, creating new one:', {
              orderId: orderId,
              paymentId: paymentId,
              userId: notes.userId
            });
            await Transaction.create({
              user_id: notes.userId || null,
              plan_id: notes.planId || null,
              amount: payload?.amount / 100,
              currency: payload?.currency,
              gateway_response: payload,
              status: 'completed',
              payment_id: paymentId // Store payment ID for display
            });
          }
        }

        return res.status(200).json({ ok: true });
      }

      if (event === 'payment.failed') {
        const payload = body.payload?.payment?.entity;
        const notes = payload?.notes || {};

        // Handle failed credit purchases
        if (notes.type === 'credit_purchase') {
          await handleCreditPurchase(payload, 'failed');
          return res.status(200).json({ ok: true });
        }

        // Handle failed subscription payments
        const orderId = payload?.order_id;

        if (orderId) {
          // Find and update existing pending transaction (more specific matching)
          const existingTransaction = await Transaction.findOne({
            'gateway_response.id': orderId,
            status: 'pending',
            transaction_type: { $ne: 'credit_purchase' } // Exclude credit purchases
          });

          if (existingTransaction) {
            // Update existing transaction to failed
            existingTransaction.status = 'failed';
            existingTransaction.gateway_response = {
              ...existingTransaction.gateway_response,
              ...payload
            };
            existingTransaction.failure_reason = payload?.error_description || 'Payment failed';
            await existingTransaction.save();

            // Clean up pending subscription for failed payments
            const receipt = notes.receipt || notes.subscriptionId || notes.subscription_id;
            if (receipt && receipt.toString().startsWith('sub_')) {
              const subscriptionId = receipt.toString().split('sub_')[1];
              const UserSubscription = require('../../models/UserSubscription');

              const pendingSubscription = await UserSubscription.findOne({
                _id: subscriptionId,
                payment_status: 'pending',
                is_active: false
              });

              if (pendingSubscription) {
                await UserSubscription.findByIdAndDelete(subscriptionId);
                console.log('Pending subscription removed due to payment failure:', subscriptionId);
              }
            }

            // DO NOT suspend the plan for failed payments - keep existing subscription active
          } else {
            // Fallback: create new failed transaction
            await Transaction.create({
              user_id: notes.userId || null,
              plan_id: notes.planId || null,
              amount: payload?.amount / 100,
              currency: payload?.currency,
              gateway_response: payload,
              status: 'failed',
              failure_reason: payload?.error_description || 'Payment failed'
            });
          }
        }

        return res.status(200).json({ ok: true });
      }

      return res.status(200).json({ ok: true });
    }

    // Fallback: support internal test webhooks
    const { subscriptionId, status, payment, creditPurchase } = body;
    console.log('Webhook fallback handler - received:', { subscriptionId, status, payment, creditPurchase, userId });

    // Handle credit purchase webhooks
    if (creditPurchase) {
      const { packId, credits } = creditPurchase;
      const paymentId = payment?.razorpay_payment_id; // Get payment ID from payment object

      // Find existing pending credit transaction by order ID (more specific)
      let existingTransaction = null;
      const orderId = payment?.razorpay_order_id || payment?.order_id;

      if (orderId) {
        existingTransaction = await Transaction.findOne({
          user_id: userId,
          transaction_type: 'credit_purchase',
          status: 'pending',
          'gateway_response.id': orderId // Match by specific order ID
        });
      }

      // Fallback: if no order ID, try to match by pack ID and recent timestamp (last 10 minutes)
      if (!existingTransaction) {
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
        existingTransaction = await Transaction.findOne({
          user_id: userId,
          transaction_type: 'credit_purchase',
          status: 'pending',
          'gateway_response.pack_id': packId,
          createdAt: { $gte: tenMinutesAgo } // Only match recent transactions
        }).sort({ createdAt: -1 }); // Get the most recent one
      }

      if (existingTransaction) {
        // Update existing transaction
        existingTransaction.status = status === 'success' ? 'completed' : 'failed';
        existingTransaction.gateway_response = {
          ...existingTransaction.gateway_response,
          ...payment,
          razorpay_payment_id: paymentId
        };

        // Store payment ID for successful payments
        if (status === 'success' && paymentId) {
          existingTransaction.payment_id = paymentId;
        }

        if (status !== 'success') {
          existingTransaction.failure_reason = 'Payment failed or cancelled';
        }
        await existingTransaction.save();
        console.log('Updated existing credit transaction:', {
          transactionId: existingTransaction._id,
          orderId: orderId,
          paymentId: paymentId,
          status: status,
          matchedBy: orderId ? 'orderId' : 'packId+timestamp'
        });
      } else {
        // Create new transaction (fallback)
        console.log('No existing transaction found, creating new one:', {
          userId,
          packId,
          orderId,
          paymentId,
          status
        });
        const newTransaction = {
          user_id: userId,
          amount: payment?.amount || 0,
          currency: payment?.currency || 'INR',
          gateway_response: {
            ...(payment || body),
            razorpay_payment_id: paymentId
          },
          status: status === 'success' ? 'completed' : 'failed',
          transaction_type: 'credit_purchase',
          failure_reason: status !== 'success' ? 'Payment failed or cancelled' : null
        };

        // Store payment ID for successful payments
        if (status === 'success' && paymentId) {
          newTransaction.payment_id = paymentId;
        }

        await Transaction.create(newTransaction);
        console.log('Created new credit transaction (no pending found):', {
          paymentId: paymentId,
          status: status
        });
      }

      // Process credit purchase if successful
      if (status === 'success') {
        const finalAmount = payment?.amount || 0; // Assume internal webhook sends Rupees
        await processCreditPurchase(userId, packId, credits, payment, finalAmount);
      }

      return res.json({ ok: true });
    }

    // Handle subscription webhooks
    if (!subscriptionId || !status) {
      console.error('Missing subscriptionId or status:', { subscriptionId, status });
      return res.status(400).json({ message: 'invalid payload' });
    }

    // Find existing pending subscription transaction by subscription ID (more specific)
    let existingTransaction = null;
    const orderId = payment?.razorpay_order_id || payment?.order_id;

    // First try to match by order ID if available
    if (orderId) {
      existingTransaction = await Transaction.findOne({
        user_id: userId,
        'gateway_response.id': orderId,
        status: 'pending',
        transaction_type: { $ne: 'credit_purchase' } // Exclude credit purchases
      });
    }

    // Fallback: match by subscription ID and recent timestamp (last 10 minutes)
    if (!existingTransaction && subscriptionId) {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      existingTransaction = await Transaction.findOne({
        user_id: userId,
        plan_id: payment?.planId || null,
        status: 'pending',
        transaction_type: { $ne: 'credit_purchase' },
        $or: [
          { 'gateway_response.receipt': `sub_${subscriptionId}` },
          { 'gateway_response.notes.subscriptionId': subscriptionId }
        ],
        createdAt: { $gte: tenMinutesAgo } // Only match recent transactions
      }).sort({ createdAt: -1 }); // Get the most recent one
    }

    const paymentId = payment?.razorpay_payment_id; // Get payment ID from payment object

    if (existingTransaction) {
      existingTransaction.status = status === 'success' ? 'completed' : 'failed';
      existingTransaction.gateway_response = {
        ...(payment || body),
        razorpay_payment_id: paymentId
      };

      // Store payment ID for successful payments
      if (status === 'success' && paymentId) {
        existingTransaction.payment_id = paymentId;
      }

      if (status !== 'success') {
        existingTransaction.failure_reason = 'Payment failed or cancelled';
      }
      await existingTransaction.save();

      console.log('Updated existing subscription transaction:', {
        transactionId: existingTransaction._id,
        subscriptionId: subscriptionId,
        orderId: orderId,
        paymentId: paymentId,
        status: status,
        matchedBy: orderId ? 'orderId' : 'subscriptionId+timestamp'
      });
    } else {
      const newTransaction = {
        user_id: userId,
        plan_id: payment?.planId || null,
        amount: payment?.amount || 0,
        currency: payment?.currency || 'INR',
        gateway_response: {
          ...(payment || body),
          razorpay_payment_id: paymentId
        },
        status: status === 'success' ? 'completed' : 'failed',
        failure_reason: status !== 'success' ? 'Payment failed or cancelled' : null
      };

      // Store payment ID for successful payments
      if (status === 'success' && paymentId) {
        newTransaction.payment_id = paymentId;
      }

      await Transaction.create(newTransaction);

      console.log('Created new subscription transaction (no pending found):', {
        subscriptionId: subscriptionId,
        orderId: orderId,
        paymentId: paymentId,
        status: status,
        userId: userId
      });
    }

    if (status === 'success') {
      console.log('Activating subscription:', { subscriptionId, paymentMode: payment?.payment_mode, gateway: payment?.gateway });
      const activatedSub = await subscriptionService.activateSubscription({
        subscriptionId,
        paymentStatus: 'completed',
        paymentMode: payment?.payment_mode || 'monthly',
        gateway: payment?.gateway || 'manual'
      });
      console.log('Subscription activated successfully:', {
        id: activatedSub?._id,
        is_active: activatedSub?.is_active,
        payment_status: activatedSub?.payment_status,
        end_date: activatedSub?.end_date
      });

      // Send success email
      if (activatedSub) {
        try {
          const user = await User.findById(activatedSub.user_id);
          const plan = await require('../../models/Plan').findById(activatedSub.plan_id);
          if (user && plan) {
            const endDate = new Date(activatedSub.end_date).toLocaleDateString();
            const orderId = payment?.razorpay_order_id || payment?.order_id || 'N/A';
            await emailService.sendSubscriptionSuccessEmail(user, plan, endDate, orderId);
          }
        } catch (emailErr) {
          console.error('Failed to send subscription email:', emailErr);
        }
      }
    } else {
      // Clean up pending subscription for failed/cancelled payments
      const UserSubscription = require('../../models/UserSubscription');
      const pendingSubscription = await UserSubscription.findOne({
        _id: subscriptionId,
        payment_status: 'pending',
        is_active: false
      });

      if (pendingSubscription) {
        await UserSubscription.findByIdAndDelete(subscriptionId);
        console.log('Pending subscription removed due to payment failure/cancellation:', subscriptionId);
      }
    }
    // DO NOT suspend plan for failed payments - keep existing subscription

    return res.json({ ok: true });
  } catch (err) {
    console.error('Webhook error:', err);
    return res.status(500).json({ message: err.message });
  }
}

// Helper function to handle credit purchases from Razorpay webhooks
async function handleCreditPurchase(payload, status) {
  const notes = payload?.notes || {};
  const userId = notes.userId;
  const packId = notes.packId;
  const credits = parseInt(notes.credits);
  const orderId = payload?.order_id;
  const paymentId = payload?.id; // Razorpay payment ID

  if (!userId || !packId || !credits) {
    console.error('Missing credit purchase data:', { userId, packId, credits });
    return;
  }

  // Find existing pending transaction by order ID (stored in gateway_response.id)
  let existingTransaction = null;
  if (orderId) {
    existingTransaction = await Transaction.findOne({
      'gateway_response.id': orderId, // This is where we store the Razorpay order ID
      status: 'pending',
      transaction_type: 'credit_purchase'
    });
  }

  if (existingTransaction) {
    // Update existing transaction
    existingTransaction.status = status;
    existingTransaction.gateway_response = {
      ...existingTransaction.gateway_response,
      ...payload,
      razorpay_payment_id: paymentId // Store payment ID for successful payments
    };

    // Store payment ID in a separate field for easy access (this shows in transaction logs)
    if (status === 'completed' && paymentId) {
      existingTransaction.payment_id = paymentId; // This will show as Transaction ID in logs
    }

    if (status !== 'completed') {
      existingTransaction.failure_reason = payload?.error_description || 'Payment failed';
    }

    await existingTransaction.save();
    console.log('Updated existing credit transaction:', {
      transactionId: existingTransaction._id,
      orderId: orderId,
      paymentId: paymentId,
      status: status
    });
  } else {
    // Create new transaction record (fallback)
    const newTransaction = {
      user_id: userId,
      amount: payload?.amount / 100,
      currency: payload?.currency,
      gateway_response: {
        ...payload,
        razorpay_payment_id: paymentId
      },
      status: status,
      transaction_type: 'credit_purchase',
      failure_reason: status !== 'completed' ? (payload?.error_description || 'Payment failed') : null
    };

    // Store payment ID for successful payments
    if (status === 'completed' && paymentId) {
      newTransaction.payment_id = paymentId;
    }

    await Transaction.create(newTransaction);
    console.log('Created new credit transaction (no pending found):', {
      orderId: orderId,
      paymentId: paymentId,
      status: status
    });
  }

  // If payment successful, add credits to user
  if (status === 'completed') {
    const amountInRupees = payload.amount ? payload.amount / 100 : 0; // Razorpay sends Paisa
    await processCreditPurchase(userId, packId, credits, payload, amountInRupees);
  }
}

// Helper function to process successful credit purchase
async function processCreditPurchase(userId, packId, credits, paymentData, finalAmount) {
  try {
    const user = await User.findById(userId);
    if (!user) {
      console.error('User not found for credit purchase:', userId);
      return;
    }

    // Add credits to user's account
    const currentCredits = user.creditLimit || 0;
    const newCreditLimit = currentCredits + credits;

    user.creditLimit = newCreditLimit;
    await user.save();

    console.log(`Credits added successfully: User ${userId} now has ${newCreditLimit} credits (added ${credits})`);

    // Send success email
    try {
      const orderId = paymentData.order_id || paymentData.razorpay_order_id || 'N/A';
      await emailService.sendCreditPurchaseSuccessEmail(user, credits, finalAmount, orderId);
    } catch (emailErr) {
      console.error('Failed to send credit purchase email:', emailErr);
    }

  } catch (error) {
    console.error('Error processing credit purchase:', error);
    throw error;
  }
}

module.exports = { paymentWebhook };
