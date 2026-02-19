const Template = require('../../models/templateModel');

// Get all templates for admin
exports.getAllTemplates = async (req, res) => {
  try {
    const { category, page = 1, limit = 10 } = req.query;

    let filter = {};
    if (category) {
      filter.category = category;
    }

    const skip = (page - 1) * limit;

    const templates = await Template.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Template.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: templates,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: templates.length,
        totalRecords: total
      }
    });
  } catch (error) {
    console.error('Admin get templates error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch templates'
    });
  }
};

// Create new template
exports.createTemplate = async (req, res) => {
  try {
    const { name, category, imageUrl, description } = req.body;

    if (!name || !category || !imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Name, category, and image URL are required'
      });
    }

    const template = new Template({
      name,
      category,
      imageUrl,
      description
    });

    await template.save();

    res.status(201).json({
      success: true,
      message: 'Template created successfully',
      data: template
    });
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create template'
    });
  }
};

// Update template
exports.updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, imageUrl, description, isActive } = req.body;

    const template = await Template.findByIdAndUpdate(
      id,
      { name, category, imageUrl, description, isActive },
      { new: true, runValidators: true }
    );

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Template updated successfully',
      data: template
    });
  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update template'
    });
  }
};

// Delete template
exports.deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;

    const template = await Template.findByIdAndDelete(id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete template'
    });
  }
};

// Toggle template status
exports.toggleTemplateStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const template = await Template.findById(id);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    template.isActive = !template.isActive;
    await template.save();

    res.status(200).json({
      success: true,
      message: `Template ${template.isActive ? 'activated' : 'deactivated'} successfully`,
      data: template
    });
  } catch (error) {
    console.error('Toggle template status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update template status'
    });
  }
};