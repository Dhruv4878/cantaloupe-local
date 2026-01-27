/**
 * Utility script to fix both credit and subscription transaction issues
 * This script will:
 * 1. Find pending transactions that are older than 1 hour and mark them as cancelled
 * 2. Identify potential duplicate transactions and log them for manual review
 * 3. Handle both credit_purchase and subscription transaction types
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Transaction = require('./src/models/Transaction');

async function fixAllTransactions() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    let cleanedUp = 0;

    // 1. Find and cancel old pending transactions (both credit and subscription)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const oldPendingTransactions = await Transaction.find({
      status: 'pending',
      createdAt: { $lt: oneHourAgo }
    });

    console.log(`Found ${oldPendingTransactions.length} old pending transactions`);

    for (const tx of oldPendingTransactions) {
      tx.status = 'cancelled';
      tx.failure_reason = 'Auto-cancelled: Transaction abandoned (older than 1 hour)';
      await tx.save();
      console.log(`Cancelled old pending transaction: ${tx._id} (User: ${tx.user_id}, Type: ${tx.transaction_type || 'subscription'})`);
      cleanedUp++;
    }

    // 2. Find potential duplicate credit transactions
    console.log('\n=== CHECKING CREDIT TRANSACTIONS ===');
    const creditTransactions = await Transaction.find({
      transaction_type: 'credit_purchase'
    }).sort({ createdAt: -1 });

    const creditDuplicates = findDuplicates(creditTransactions, 'credit');

    // 3. Find potential duplicate subscription transactions  
    console.log('\n=== CHECKING SUBSCRIPTION TRANSACTIONS ===');
    const subscriptionTransactions = await Transaction.find({
      $or: [
        { transaction_type: 'subscription' },
        { transaction_type: { $exists: false } } // Old transactions without type
      ]
    }).sort({ createdAt: -1 });

    const subscriptionDuplicates = findDuplicates(subscriptionTransactions, 'subscription');

    // 4. Display results
    const allDuplicates = [...creditDuplicates, ...subscriptionDuplicates];

    if (allDuplicates.length > 0) {
      console.log('\n=== POTENTIAL DUPLICATE TRANSACTIONS ===');
      console.log('Please review these manually:');
      allDuplicates.forEach((dup, index) => {
        console.log(`${index + 1}. User: ${dup.user_id} (${dup.type})`);
        console.log(`   Transaction 1: ${dup.transaction1} (${dup.status1})`);
        console.log(`   Transaction 2: ${dup.transaction2} (${dup.status2})`);
        console.log(`   Amount: ₹${dup.amount}, Identifier: ${dup.identifier}, Time diff: ${dup.timeDiff}`);
        console.log('');
      });
    } else {
      console.log('\nNo potential duplicate transactions found.');
    }

    // 5. Summary
    console.log('\n=== SUMMARY ===');
    console.log(`Cancelled ${cleanedUp} old pending transactions`);
    console.log(`Found ${creditDuplicates.length} potential duplicate credit transactions`);
    console.log(`Found ${subscriptionDuplicates.length} potential duplicate subscription transactions`);

  } catch (error) {
    console.error('Error fixing transactions:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

function findDuplicates(transactions, type) {
  const potentialDuplicates = [];
  const seen = new Map();
  const timeWindow = 5 * 60 * 1000; // 5 minutes

  for (const tx of transactions) {
    let key, identifier;

    if (type === 'credit') {
      key = `${tx.user_id}_${tx.amount}_${tx.gateway_response?.pack_id}`;
      identifier = tx.gateway_response?.pack_id || 'unknown';
    } else {
      key = `${tx.user_id}_${tx.amount}_${tx.plan_id}`;
      identifier = tx.plan_id || 'unknown';
    }

    if (seen.has(key)) {
      const existingTx = seen.get(key);
      const timeDiff = Math.abs(new Date(tx.createdAt) - new Date(existingTx.createdAt));

      if (timeDiff <= timeWindow) {
        potentialDuplicates.push({
          transaction1: existingTx._id,
          transaction2: tx._id,
          user_id: tx.user_id,
          amount: tx.amount,
          identifier: identifier,
          timeDiff: Math.round(timeDiff / 1000) + 's',
          status1: existingTx.status,
          status2: tx.status,
          type: type
        });
      }
    }

    seen.set(key, tx);
  }

  return potentialDuplicates;
}

// Run the fix
fixAllTransactions();