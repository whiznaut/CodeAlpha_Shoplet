const apiUrl = 'http://localhost:3000/api';
let cart = [];

function loadProducts() {
  fetch(`${apiUrl}/products`)
    .then(response => response.json())
    .then(products => {
      const productList = document.getElementById('content');
      productList.innerHTML = '';
      products.forEach(product => {
        const productElement = document.createElement('div');
        productElement.className = 'product';
        productElement.innerHTML = `
          <img src="${product.image}" alt="${product.name}">
          <h2>${product.name}</h2>
          <p>$${product.price}</p>
          <button class="add-to-cart" data-product-id="${product._id}">Add to Cart</button>
        `;
        productElement.addEventListener('click', (e) => {
          if (e.target.className !== 'add-to-cart') {
            showProductDetails(product);
          }
        });
        productList.appendChild(productElement);
      });
      document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', (e) => {
          e.stopPropagation();
          addToCart(e.target.dataset.productId);
        });
      });
    });
}

function showProductDetails(product) {
  const modal = document.getElementById('product-modal');
  const modalBody = document.getElementById('modal-body');
  modalBody.innerHTML = `
    <img src="${product.image}" alt="${product.name}" style="width: 100%; max-height: 500px; object-fit: contain;">
    <h2>${product.name}</h2>
    <p>${product.description}</p>
    <p>$${product.price}</p>
    <h3>Reviews</h3>
    <p>${product.reviews}</p>
    <button class="add-to-cart" data-product-id="${product._id}">Add to Cart</button>
  `;
  modal.style.display = "block";

  const span = document.getElementsByClassName("close")[0];
  span.onclick = function() {
    modal.style.display = "none";
  }

  window.onclick = function(event) {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  }

  const addToCartButton = modalBody.querySelector('.add-to-cart');
  if (addToCartButton) {
    addToCartButton.addEventListener('click', (e) => {
      e.stopPropagation();
      addToCart(e.target.dataset.productId);
    });
  }
}

function addToCart(productId) {
  fetch(`${apiUrl}/products/${productId}`)
    .then(response => response.json())
    .then(product => {
      const existingProductIndex = cart.findIndex(p => p._id.toString() === product._id.toString());

      if (existingProductIndex > -1) {
        cart[existingProductIndex].quantity += 1;
      } else {
        product.quantity = 1;
        cart.push(product);
      }

      updateCartCount();
      saveCartToLocalStorage();
    })
    .catch(error => {
      console.error("Error adding product to cart:", error);
    });
}

function updateCartCount() {
  document.getElementById('cart-count').textContent = cart.length;
}

function loadPage(page) {
  const content = document.getElementById('content');
  content.innerHTML = '';

  if (page === 'cart') {
    const cartPage = document.createElement('div');
    cartPage.id = 'cart-page';
    const cartItemsDiv = document.createElement('div');
    cartItemsDiv.id = 'cart-items';
    cartPage.appendChild(cartItemsDiv);

    if (cart.length === 0) {
      cartItemsDiv.innerHTML = `
        <p>Your cart is empty. Add some products to your cart before proceeding to checkout.</p>
      `;
      const cartSummaryDiv = document.createElement('div');
      cartSummaryDiv.className = 'cart-summary';
      cartSummaryDiv.innerHTML = `
        <button onclick="loadPage('')">Continue Shopping</button>
      `;
      cartPage.appendChild(cartSummaryDiv);
    } else {
      cart.forEach((product, index) => {
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
          <img src="${product.image}" alt="${product.name}">
          <h3>${product.name}</h3>
          <div class="quantity-control">
            <button onclick="changeQuantity(${index}, -1)">-</button>
            <input type="text" value="${product.quantity}" readonly>
            <button onclick="changeQuantity(${index}, 1)">+</button>
          </div>
          <p>$${product.price * product.quantity}</p>
          <button onclick="removeFromCart(${index})">Remove</button>
        `;
        cartItemsDiv.appendChild(cartItem);
      });

      const cartSummaryDiv = document.createElement('div');
      cartSummaryDiv.className = 'cart-summary';
      cartSummaryDiv.innerHTML = `
        <h2>Summary</h2>
        <p>Total: $<span id="total-amount">${calculateTotalAmount()}</span></p>
        <button onclick="showCheckoutForm()">Proceed to Checkout</button>
      `;
      cartPage.appendChild(cartSummaryDiv);
    }
    
    content.appendChild(cartPage);
  } else {
    loadProducts();
  }
}

function changeQuantity(index, delta) {
  cart[index].quantity += delta;
  if (cart[index].quantity <= 0) {
    removeFromCart(index);
  } else {
    updateCartCount();
    saveCartToLocalStorage();
    loadPage('cart');
  }
}

function removeFromCart(index) {
  cart.splice(index, 1);
  updateCartCount();
  saveCartToLocalStorage();
  loadPage('cart');
}

function calculateTotalAmount() {
  return cart.reduce((total, product) => total + product.price * product.quantity, 0).toFixed(2);
}

function saveCartToLocalStorage() {
  localStorage.setItem('cart', JSON.stringify(cart));
}

function loadCartFromLocalStorage() {
  const savedCart = localStorage.getItem('cart');
  if (savedCart) {
    cart = JSON.parse(savedCart);
    updateCartCount();
  }
}

function showCheckoutForm() {
  const cartPage = document.getElementById('cart-page');
  
  const existingForm = document.getElementById('checkout-form');
  if (existingForm) {
    return;
  }

  const checkoutFormDiv = document.createElement('div');
  checkoutFormDiv.className = 'checkout-form';
  checkoutFormDiv.innerHTML = `
    <h2>Checkout</h2>
    <form id="checkout-form">
      <label for="name">Name:</label>
      <input type="text" id="name" name="name" required>
      
      <label for="address">Address:</label>
      <input type="text" id="address" name="address" required>

      <label for="email">Email:</label>
      <input type="email" id="email" name="email" required>

      <label for="phone">Phone:</label>
      <input type="tel" id="phone" name="phone" required>

      <p>Total: $${calculateTotalAmount()}</p>
      <div class="button-container">
        <button type="submit">Complete Purchase</button>
      </div>
    </form>
  `;

  cartPage.appendChild(checkoutFormDiv);

  document.getElementById('checkout-form').addEventListener('submit', handleCheckout);
}

function completeCheckout() {
  const order = {
    products: cart.map(product => ({
      _id: product._id,
      quantity: product.quantity
    })),
    totalAmount: calculateTotalAmount()
  };

  fetch(`${apiUrl}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(order)
  })
    .then(response => response.json())
    .then(data => {
      console.log('Order successfully saved:', data);
      alert('Thank you for your purchase!');
      cart = [];
      updateCartCount();
      saveCartToLocalStorage();
      loadPage('');
    })
    .catch(error => {
      console.error('Error completing purchase:', error);
    });
}

function handleCheckout(event) {
  event.preventDefault();

  const form = event.target;
  const order = {
    name: form.name.value,
    address: form.address.value,
    email: form.email.value,
    phone: form.phone.value,
    products: cart.map(product => ({
      _id: product._id,
      quantity: product.quantity
    })),
    totalAmount: calculateTotalAmount()
  };

  fetch(`${apiUrl}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(order)
  })
    .then(response => response.json())
    .then(data => {
      console.log('Order successfully saved:', data);
      alert('Thank you for your purchase!');
      cart = [];
      updateCartCount();
      saveCartToLocalStorage();
      loadPage('');
    })
    .catch(error => {
      console.error('Error completing purchase:', error);
    });
}

window.onload = () => {
  loadCartFromLocalStorage();
  const hash = window.location.hash.substring(1);
  const page = hash || '';
  loadPage(page);
  
  document.querySelectorAll('nav a').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const page = e.target.getAttribute('href').substring(1);
      loadPage(page);
      window.location.hash = page;
    });
  });
}
