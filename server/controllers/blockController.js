const BlockedSite = require('../models/BlockedSite');
const User = require('../models/User');

exports.addSite = async (req, res) => {
  try {
    const { siteURL, profile } = req.body;

    const existing = await BlockedSite.findOne({
      userId: req.user.id,
      siteURL: siteURL.toLowerCase()
    });

    if (existing) {
      return res.status(400).json({ message: 'Site already blocked' });
    }

    const site = await BlockedSite.create({
      userId: req.user.id,
      siteURL: siteURL.toLowerCase(),
      profile: profile || 'normal'
    });

    res.status(201).json(site);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getList = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const sites = await BlockedSite.find({ userId: req.user.id })
      .sort({ createdAt: -1 });

    res.json({
      sites,
      blockingProfile: user.blockingProfile,
      breakAttempts: user.breakAttempts
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.removeSite = async (req, res) => {
  try {
    const site = await BlockedSite.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!site) {
      return res.status(404).json({ message: 'Site not found' });
    }

    res.json({ message: 'Site removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { profile } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { blockingProfile: profile },
      { new: true }
    ).select('-password');

    res.json({ blockingProfile: user.blockingProfile });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.resetBreakAttempts = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, {
      breakAttempts: 0,
      blockingProfile: 'normal'
    });
    res.json({ message: 'Break attempts reset' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};