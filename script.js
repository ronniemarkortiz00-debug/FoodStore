const scriptURL = "https://script.google.com/macros/s/AKfycbzwIEvwyD3d--RjTqsgP9zbFAVSZFEMZZoWIJ9lhID_RkQ-zyFSOmDQbMhuuRXAOO8p5w/exec";
let isLogin = true;
let cart = [];
let orderHistory = [];

// ---------- LOGIN / REGISTER ----------
function toggleForm() {
  const box = document.querySelector(".login-box");

  // Fade out first
  box.classList.add("fade-out");

  setTimeout(() => {
    isLogin = !isLogin;
    document.getElementById("title").innerText = isLogin ? "Login" : "Register";
    document.getElementById("submitBtn").innerText = isLogin ? "Login" : "Register";
    document.getElementById("switchText").innerHTML = isLogin
      ? `Don't have an account? <span onclick="toggleForm()">Register</span>`
      : `Already have an account? <span onclick="toggleForm()">Login</span>`;

    // Remove fade-out and add fade-in
    box.classList.remove("fade-out");
    box.classList.add("fade-in");

    setTimeout(() => box.classList.remove("fade-in"), 400);

  }, 300);
}


function submitForm() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  if (!username || !password) { showError("Fill all fields"); return; }
  const action = isLogin ? "login" : "register";

  fetch(scriptURL, { method: "POST", body: JSON.stringify({ action, username, password }) })
    .then(res => res.json())
    .then(data => {
      if (action === "login") {
        if (data.status === "success") window.location.href = "store.html?user=" + encodeURIComponent(username);
        else showError("Invalid login");
      } else if (action === "register") {
        if (data.status === "exists") showError("Username already exists");
        else { alert("Account created! You can now login."); toggleForm(); }
      }
    })
    .catch(() => showError("Connection error"));
}

function showError(msg) {
  let err = document.getElementById("error");
  if (!err) { 
    err = document.createElement("div"); 
    err.id = "error"; 
    err.className = "error"; 
    document.querySelector(".box").appendChild(err); 
  }
  err.innerText = msg;
}

// ---------- STORE + CART ----------
function displayUser() { 
  const user = getUser(); 

  if (!user) {
    window.location.replace("index.html");
    return;
  }

  document.getElementById("user").innerText = "Hello, " + user;
}

// ADD TO CART
function add(product, price) { cart.push({ product, price }); displayCart(); }

// REMOVE FROM CART
function removeItem(index) { cart.splice(index, 1); displayCart(); }

// DISPLAY CART
function displayCart() {
  const list = document.getElementById("cartList");
  list.innerHTML = "";
  let total = 0;

  // Count quantities per product
  let groupedCart = {};
  cart.forEach(item => {
    if (groupedCart[item.product]) groupedCart[item.product].quantity += 1;
    else groupedCart[item.product] = { price: item.price, quantity: 1 };
  });

  Object.keys(groupedCart).forEach((product, i) => {
    const item = groupedCart[product];
    list.innerHTML += `<li>${product} x${item.quantity} - ₱${item.price} each 
      <button class="remove-btn" onclick="removeGroupedItem('${product}')">Remove</button></li>`;
    total += item.price * item.quantity;
  });

  if (document.getElementById("total")) document.getElementById("total").innerText = "Total: ₱" + total;
}

// Remove all of a grouped item
function removeGroupedItem(product) {
  cart = cart.filter(item => item.product !== product);
  displayCart();
}

// BUY / SAVE ORDER
function buy() {
  const user = getUser();
  if (cart.length === 0) { alert("Cart is empty!"); return; }

  // Group items
  let groupedCart = {};
  cart.forEach(item => {
    if (groupedCart[item.product]) groupedCart[item.product].quantity += 1;
    else groupedCart[item.product] = { price: item.price, quantity: 1 };
  });

  // Create products string: "Burger x3, Pizza x2"
  const productsString = Object.keys(groupedCart).map(p => `${p} x${groupedCart[p].quantity}`).join(", ");
  const totalPrice = Object.keys(groupedCart).reduce((sum, p) => sum + groupedCart[p].price * groupedCart[p].quantity, 0);

  // Send to Google Sheet
  fetch(scriptURL, { 
    method: "POST", 
    body: JSON.stringify({ 
      action: "order", 
      username: user, 
      products: productsString, 
      total: totalPrice 
    }) 
  })
  .then(() => { 
    alert("Order saved!"); 
    cart = []; 
    displayCart(); 
    fetchOrderHistory(); 
  })
  .catch(() => alert("Error sending order"));
}

// ---------- ORDER HISTORY ----------
function fetchOrderHistory() {
  const user = getUser();
  fetch(scriptURL)
    .then(res => res.json())
    .then(data => {
      // Filter orders for current user
      orderHistory = data.filter(order => order.username === user);
      displayHistory();
    })
    .catch(() => {
      const list = document.getElementById("historyList");
      if (list) list.innerHTML = "<li>Failed to load order history.</li>";
    });
}
function logout() {
  if (confirm("Are you sure you want to log out?")) {
    // remove user from URL by going back to login
    window.location.replace("index.html");
  }
}
function displayHistory() {
  const list = document.getElementById("historyList");
  if (!list) return;
  list.innerHTML = "";
  orderHistory.forEach(order => {
    list.innerHTML += `<li>${order.products} - Total: ₱${order.total} (${new Date(order.date).toLocaleString()})</li>`;
  });
}
localStorage.setItem("user", username);
window.location.href = "store.html";
function getUser() {
  return localStorage.getItem("user");
}
function logout() {
  localStorage.removeItem("user");
  window.location.replace("index.html");
}
