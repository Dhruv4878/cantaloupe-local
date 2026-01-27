/**
 * Utility script to clean up orphaned pending subscriptions and credit transactions
 * Run this once to fix any existing users who might be affected by the bug
 */

require('dotenv').config();
const mongoose = require('mongoose');
const UserSubscription = require('./src/models/UserSubscription');
const Transaction = require('./src/models/Transaction');

async function cleanupOrphanedRecords() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    let cleanedUp = 0;

    // 1. Clean up orphaned pending subscriptions with paid plans
    const pendingSubscriptions = await UserSubscription.find({
      payment_status: 'pending',
      is_active: false
    }).populate('plan_id');

    console.log(`Found ${pendingSubscriptions.length} pending subscriptions`);

    for (const subscription of pendingSubscriptions) {
      // Skip Free plans
      if (subscription.plan_id?.name === 'Free') {
        continue;
      }

      // Check if there's a related cancelled or failed transaction
      const relatedTransaction = await Transaction.findOne({
        user_id: subscription.user_id,
        $or: [
          { 'gateway_response.notes.subscriptionId': subscription._id.toString() },
          { 'gateway_response.receipt': `sub_${subscription._id}` }
        ],
        status: { $in: ['cancelled', 'failed'] }
      });

      if (relatedTransaction) {
        // This is an orphaned subscription from a cancelled/failed payment
        await UserSubscription.findByIdAndDelete(subscription._id);
        console.log(`Cleaned up orphaned subscription: ${subscription._id} (Plan: ${subscription.plan_id?.name}, User: ${subscription.user_id})`);
        cleanedUp++;
      } else {
        // Check if subscription is older than 1 hour with no successful transaction
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        if (subscription.createdAt < oneHourAgo) {
          const successfulTransaction = await Transaction.findOne({
            user_id: subscription.user_id,
            $or: [
              { 'gateway_response.notes.subscriptionId': subscription._id.toString() },
              { 'gateway_response.receipt': `sub_${subscription._id}` }
            ],
            status: 'completed'
          });

          if (!successfulTransaction) {
            // This is likely an abandoned subscription
            await UserSubscription.findByIdAndDelete(subscription._id);
            console.log(`Cleaned up abandoned subscription: ${subscription._id} (Plan: ${subscription.plan_id?.name}, User: ${subscription.user_id})`);
            cleanedUp++;
          }
        }
      }
    }

    // 2. Clean up orphaned pending credit transactions
    const pendingCreditTransactions = await Transaction.find({
      transaction_type: 'credit_purchase',
      status: 'pending'
    });

    console.log(`Found ${pendingCreditTransactions.length} pending credit transactions`);

    for (const transaction of pendingCreditTransactions) {
      // Check if transaction is older than 1 hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      if (transaction.createdAt < oneHourAgo) {
        // Mark as cancelled instead of deleting to maintain audit trail
        transaction.status = 'cancelled';
        transaction.failure_reason = 'Abandoned payment - auto-cancelled by cleanup';
        await transaction.save();
        console.log(`Cleaned up abandoned credit transaction: ${transaction._id} (User: ${transaction.user_id})`);
        cleanedUp++;
      }
    }

    console.log(`Cleanup completed. Processed ${cleanedUp} orphaned records.`);

  } catch (error) {
    console.error('Cleanup error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the cleanup
cleanupOrphanedRecords();