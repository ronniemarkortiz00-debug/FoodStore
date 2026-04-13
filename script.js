const scriptURL = "https://script.google.com/macros/s/AKfycbxhPLNfGvoS-R1uW0Hhsdkcu2W1xF7iTRUkwt5XzsW8D0tQUlVp13ZK5Ys5uZjjNCrUlQ/exec";

let isLogin = true;
let cart = [];
let orderHistory = [];

/* ---------------- LOGIN / REGISTER ---------------- */
function submitForm() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!username || !password) {
    showError("Fill all fields");
    return;
  }

  const action = isLogin ? "login" : "register";

  fetch(scriptURL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ action, username, password })
  })
    .then(res => res.json())
    .then(data => {

      // LOGIN
      if (action === "login") {
        if (data.status === "success") {
          localStorage.setItem("user", username); // ✅ SAVE LOGIN
          window.location.href = "store.html";
        } else {
          showError("Invalid login");
        }
      }

      // REGISTER
      if (action === "register") {
        if (data.status === "exists") {
          showError("Username already exists");
        } else {
          alert("Account created! You can now login.");
          toggleForm();
        }
      }

    })
    .catch(() => showError("Connection error"));
}

/* ---------------- ERROR ---------------- */
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

/* ---------------- USER ---------------- */
function getUser() {
  return localStorage.getItem("user");
}

function displayUser() {
  const user = getUser();

  if (!user) {
    window.location.replace("index.html");
    return;
  }

  document.getElementById("user").innerText = "Hello, " + user;
}

/* ---------------- CART ---------------- */
function add(product, price) {
  cart.push({ product, price });
  displayCart();
}

function displayCart() {
  const list = document.getElementById("cartList");
  list.innerHTML = "";

  let total = 0;

  cart.forEach((item, index) => {
    list.innerHTML += `
      <li>
        ${item.product} - ₱${item.price}
        <button onclick="removeItem(${index})">Remove</button>
      </li>
    `;
    total += item.price;
  });

  document.getElementById("total").innerText = "Total: ₱" + total;
}

function removeItem(index) {
  cart.splice(index, 1);
  displayCart();
}

/* ---------------- BUY ---------------- */
function buy() {
  const user = getUser();

  if (!user) {
    alert("Login first");
    return;
  }

  if (cart.length === 0) {
    alert("Cart empty");
    return;
  }

  const products = cart.map(i => i.product).join(", ");
  const total = cart.reduce((sum, i) => sum + i.price, 0);

  fetch(scriptURL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      action: "order",
      username: user,
      products: products,
      total: total
    })
  })
    .then(() => {
      alert("Order saved!");
      cart = [];
      displayCart();
    })
    .catch(() => alert("Error saving order"));
}

/* ---------------- ORDER HISTORY ---------------- */
function fetchOrderHistory() {
  const user = getUser();

  fetch(scriptURL)
    .then(res => res.json())
    .then(data => {
      const list = document.getElementById("historyList");
      list.innerHTML = "";

      data
        .filter(o => o.username === user)
        .forEach(o => {
          list.innerHTML += `<li>${o.products} - ₱${o.total}</li>`;
        });
    });
}

/* ---------------- LOGOUT ---------------- */
function logout() {
  localStorage.removeItem("user");
  window.location.replace("index.html");
}
