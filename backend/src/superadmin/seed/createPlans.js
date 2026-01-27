const mongoose = require('mongoose');
require('dotenv').config();
const Plan = require('../../models/Plan');

async function createDefaultPlans() {
  await mongoose.connect(process.env.MONGO_URI);

  const free = await Plan.findOne({ name: 'Free' });
  if (!free) {
    await Plan.create({
      name: 'Free',
      price_monthly: 0,
      price_yearly: null,
      features: {
        ai_post_generation: true,
        caption_generator: true,
        hashtag_generator: true,
        platforms_allowed: 1,
        content_calendar: false,
        posts_per_month: 5,
        smart_scheduling: false,
        advanced_ai_content: false,
        priority_support: false,
      },
      status: 'active',
      recommended: false,
    });
    console.log('Free plan created');
  }

  const starter = await Plan.findOne({ name: 'Starter' });
  if (!starter) {
    await Plan.create({
      name: 'Starter',
      price_monthly: 599,
      price_yearly: null,
      features: {
        ai_post_generation: true,
        caption_generator: true,
        hashtag_generator: true,
        platforms_allowed: 1,
        content_calendar: true,
        posts_per_month: 25,
        smart_scheduling: false,
        advanced_ai_content: false,
        priority_support: false,
      },
      status: 'active',
      recommended: false,
    });
    console.log('Starter plan created');
  }

  const pro = await Plan.findOne({ name: 'Pro' });
  if (!pro) {
    await Plan.create({
      name: 'Pro',
      price_monthly: 1699,
      price_yearly: null,
      features: {
        ai_post_generation: true,
        caption_generator: true,
        hashtag_generator: true,
        platforms_allowed: 'unlimited',
        content_calendar: true,
        posts_per_month: 'unlimited',
        smart_scheduling: true,
        advanced_ai_content: true,
        priority_support: true,
      },
      status: 'active',
      recommended: true,
    });
    console.log('Pro plan created');
  }

  mongoose.disconnect();
}

createDefaultPlans().catch((e) => { console.error(e); process.exit(1); });