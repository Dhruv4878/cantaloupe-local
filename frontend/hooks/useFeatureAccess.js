"use client";

import { useState, useEffect } from 'react';

export function useFeatureAccess() {
  const [planData, setPlanData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlanData();
  }, []);

  const fetchPlanData = async () => {
    try {
      const token = sessionStorage.getItem('authToken');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/subscription/current`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPlanData(data);
      }
    } catch (error) {
      console.error('Error fetching plan data:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasFeature = (featureName) => {
    if (!planData?.plan) return false;

    // Map feature names to plan feature keys
    const featureMap = {
      'content_calendar': planData.plan.contentCalendar,
      'smart_scheduling': planData.plan.smartScheduling,
      'ai_post_generation': planData.plan.aiPostGeneration,
      'caption_generator': planData.plan.captionGenerator,
      'hashtag_generator': planData.plan.hashtagGenerator,
      'priority_support': planData.plan.prioritySupport,
    };

    return featureMap[featureName] || false;
  };

  const canUseCredits = () => {
    // Credits can be used for AI features regardless of plan
    const hasCredits = planData?.user?.creditLimit > 0;
    const creditsUsed = planData?.usage?.creditsUsed || 0;
    const availableCredits = (planData?.user?.creditLimit || 0) - creditsUsed;

    return hasCredits && availableCredits > 0;
  };

  const hasMonthlyPosts = () => {
    if (!planData?.plan) return false;

    const monthlyLimit = planData.plan.postsPerMonth || 0;
    const monthlyUsed = planData.plan.monthlyPostsUsed || 0;

    return monthlyLimit > 0 && monthlyUsed < monthlyLimit;
  };

  const canGeneratePost = () => {
    // Can generate if has monthly posts available OR has credits
    return hasMonthlyPosts() || canUseCredits();
  };

  const getPlanName = () => {
    return planData?.plan?.planName || 'Free';
  };

  const isFeatureAvailable = (featureName) => {
    // For AI features, check both plan features and credits
    const aiFeatures = ['ai_post_generation', 'caption_generator', 'hashtag_generator'];

    if (aiFeatures.includes(featureName)) {
      return hasFeature(featureName) || canUseCredits();
    }

    // For other features, only check plan
    return hasFeature(featureName);
  };

  return {
    planData,
    loading,
    hasFeature,
    canUseCredits,
    hasMonthlyPosts,
    canGeneratePost,
    getPlanName,
    isFeatureAvailable,
    refreshPlanData: fetchPlanData
  };
}