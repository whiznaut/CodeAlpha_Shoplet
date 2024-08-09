const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  image: String,
  reviews: String,
});

module.exports = mongoose.model('Product', productSchema);
