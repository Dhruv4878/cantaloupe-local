const Template = require('../../models/templateModel');

// Get all templates (public endpoint)
exports.getAllTemplates = async (req, res) => {
  try {
    const { category } = req.query;

    let filter = { isActive: true };
    if (category) {
      filter.category = category;
    }

    const templates = await Template.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch templates'
    });
  }
};

// Get templates by category
exports.getTemplatesByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    const templates = await Template.find({
      category: category,
      isActive: true
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('Get templates by category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch templates'
    });
  }
};

// Get all categories with template counts
exports.getCategories = async (req, res) => {
  try {
    const categories = [
      'Quotes & Motivation',
      'Business & Corporate',
      'Product & Promotion',
      'Offers & Sales',
      'Festivals',
      'Educational',
      'Testimonials',
      'Personal Brand',
      'Real Estate',
      'Hospitality',
      'Healthcare',
      'Events'
    ];

    const categoriesWithCounts = await Promise.all(
      categories.map(async (category) => {
        const count = await Template.countDocuments({
          category: category,
          isActive: true
        });
        return {
          name: category,
          count: count
        };
      })
    );

    res.status(200).json({
      success: true,
      data: categoriesWithCounts
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories'
    });
  }
};