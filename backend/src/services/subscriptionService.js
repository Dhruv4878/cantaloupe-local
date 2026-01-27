const UserSubscription = require('../models/UserSubscription');
const Transaction = require('../models/Transaction');
const Plan = require('../models/Plan');

async function createPendingSubscription({ user_id, plan_id, payment_mode, gateway }) {
  const sub = await UserSubscription.create({ user_id, plan_id, payment_mode, gateway, payment_status: 'pending', is_active: false });
  return sub;
}

async function activateSubscription({ subscriptionId, userId, planId, paymentStatus = 'completed', paymentMode = 'monthly', gateway = 'razorpay' }) {
  const now = new Date();
  const start = now;
  const end = new Date(now);

  if (paymentMode === 'monthly') {
    end.setDate(end.getDate() + 30);
  } else if (paymentMode === 'yearly') {
    end.setDate(end.getDate() + 365);
  }

  // First, get the subscription to find the user_id
  const subscription = await UserSubscription.findById(subscriptionId);
  if (!subscription) {
    throw new Error('Subscription not found');
  }

  const user_id = subscription.user_id;

  // Deactivate all other subscriptions for this user
  await UserSubscription.updateMany(
    { user_id: user_id, _id: { $ne: subscriptionId }, is_active: true },
    { is_active: false }
  );

  // Now activate the current subscription
  const sub = await UserSubscription.findByIdAndUpdate(
    subscriptionId,
    {
      is_active: true,
      payment_status: paymentStatus,
      start_date: start,
      end_date: end,
      payment_mode: paymentMode,
      gateway,
    },
    { new: true }
  );

  return sub;
}

async function getActiveSubscriptionByUser(userId) {
  return UserSubscription.findOne({ user_id: userId, is_active: true }).populate('plan_id');
}

async function recordTransaction(data) {
  return Transaction.create(data);
}

async function deactivateExpiredSubscriptions() {
  const now = new Date();
  const res = await UserSubscription.updateMany({ end_date: { $lte: now }, is_active: true }, { is_active: false });
  return res;
}

module.exports = { createPendingSubscription, activateSubscription, getActiveSubscriptionByUser, recordTransaction, deactivateExpiredSubscriptions };
