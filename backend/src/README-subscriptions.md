Subscription & Payment Module — Quick Guide

Endpoints:

- GET /public/plans -> returns active plans (public, used by frontend pricing page)
- POST /api/user/subscribe -> { plan_id, payment_mode } (requires user auth)
- POST /api/webhook/payment -> webhook endpoint for payment gateways
- GET /api/user/subscription -> returns active subscription for the user

Super-Admin endpoints (protected):

- POST /super-admin/plans
- PUT /super-admin/plans/:id
- DELETE /super-admin/plans/:id
- GET /super-admin/plans
- PATCH /super-admin/plans/:id/status

Testing webhooks (dev):

- Send a POST to /api/webhook/payment with shape:
  {
  "subscriptionId": "<id>",
  "status": "success",
  "payment": { "amount": 599, "currency": "INR", "payment_mode": "monthly", "gateway": "manual", "userId": "...", "planId": "..." }
  }

Notes:

- Use the seeder at backend/src/superadmin/seed/createPlans.js to create initial Starter and Pro plans.
- Payment integration uses Razorpay when RAZORPAY_KEY_ID and RAZORPAY_SECRET are provided; otherwise, a mock order is returned for development convenience.
- Feature access middleware is available at backend/src/api/middlewares/checkFeatureAccess.js
- Monthly usage is enforced by backend/src/models/UserUsage.js and incremented on each POST /posts when applicable.
