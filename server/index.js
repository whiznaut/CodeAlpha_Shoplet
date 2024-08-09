const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const Product = require('./models/product');
const Order = require('./models/order');


const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

mongoose.connect('mongodb://localhost/shoplet', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('Database connection error:', err);
});

// Product routes
app.get('/api/products', (req, res) => {
  Product.find()
    .then(products => res.json(products))
    .catch(err => res.status(500).json({ error: err.message }));
});

app.get('/api/products/:id', (req, res) => {
  const { id } = req.params;
  Product.findById(id)
    .then(product => res.json(product))
    .catch(err => res.status(500).json({ error: err.message }));
});

// Order routes
app.post('/api/orders', (req, res) => {
  const { name, address, email, phone, products, totalAmount } = req.body;

  const formattedProducts = products.map(p => ({
    product: p._id,
    quantity: p.quantity
  }));

  const newOrder = new Order({
    name,
    address,
    email,
    phone,
    products: formattedProducts,
    totalAmount
  });

  newOrder.save()
    .then(order => res.json(order))
    .catch(err => res.status(500).json({ error: err.message }));
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
