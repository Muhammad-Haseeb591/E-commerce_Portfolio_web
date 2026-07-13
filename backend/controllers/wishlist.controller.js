const mongoose = require('mongoose');
const User = require("../models/User");
const Product = require('../models/Product');


const addToFavourite = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.userId; // 🔧 was req.user.id — protect middleware sets req.userId directly

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: 'Product ID invalid hai.' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product nahi mila.' });
    }

    const user = await User.findById(userId)
    .populate("favourites");
    if (!user) {
      return res.status(404).json({ success: false, message: 'User nahi mila.' });
    }

    const alreadyFavourite = user.favourites.some(
      (favId) => favId.toString() === productId
    );

    if (alreadyFavourite) {
      return res.status(400).json({ success: false, message: 'Yeh product pehle se favourites me hai.' });
    }

    user.favourites.push(productId);
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Favourite me add ho gaya.',
      favourites: user.favourites,
    });
  } catch (error) {
    console.error('Add to favourite error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};


const removeFromFavourite = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.userId; // 🔧 was req.user.id

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: 'Product ID invalid hai.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User nahi mila.' });
    }

    const isFavourite = user.favourites.some(
      (favId) => favId.toString() === productId
    );

    if (!isFavourite) {
      return res.status(400).json({ success: false, message: 'This product is not in the Favourite.' });
    }

    user.favourites = user.favourites.filter(
      (favId) => favId.toString() !== productId
    );

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Favourite se remove ho gaya.',
      favourites: user.favourites,
    });
  } catch (error) {
    console.error('Remove from favourite error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};


const toggleFavourite = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.userId; // 🔧 was req.user.id — THIS was line 91, the exact crash site

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: 'Product ID invalid hai.' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product nahi mila.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User nahi mila.' });
    }

    const index = user.favourites.findIndex(
      (favId) => favId.toString() === productId
    );

    let isFavourite;

    if (index > -1) {
      user.favourites.splice(index, 1);
      isFavourite = false;
    } else {
      user.favourites.push(productId);
      isFavourite = true;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: isFavourite ? 'Favourites me add ho gaya.' : 'Favourites se remove ho gaya.',
      isFavourite,
      favourites: user.favourites,
    });
  } catch (error) {
    console.error('Toggle favourite error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};


const getFavourites = async (req, res) => {
  try {
    const userId = req.userId; // 🔧 was req.user.id

    const user = await User.findById(userId).populate('favourites');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User nahi mila.' });
    }

    return res.status(200).json({
      success: true,
      count: user.favourites.length,
      favourites: user.favourites,
    });
  } catch (error) {
    console.error('Get favourites error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};


module.exports = {
  addToFavourite,
  removeFromFavourite,
  toggleFavourite,
  getFavourites,
};