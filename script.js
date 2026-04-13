const scriptURL = "https://script.google.com/macros/s/AKfycbwGfebo0DPLVhxZ5nsQ-nBKbpQ5OGKRV6EwjErfYyoA49D8LoeYHEO__1EIVJyVLQ9Iow/exec";

let isLogin = true;
let cart = [];
let orderHistory = [];
let gcashPaid = false;

// ---------- LOGIN / REGISTER ----------
function toggleForm() {
  const box = document.querySelector(".login-box");

  box.classList.add("fade-out");

  setTimeout(() => {
    isLogin = !isLogin;
    document.getElementById("title").innerText = isLogin ? "Login" : "Register";
    document.getElementById("submitBtn").innerText = isLogin ? "Login" : "Register";
    document.getElementById("switchText").innerHTML = isLogin
      ? `Don't have an account? <span onclick="toggleForm()">Register</span>`
      : `Already have an account? <span onclick="toggleForm()">Login</span>`;

    box.classList.remove("fade-out");
    box.classList.add("fade-in");

    setTimeout(() => box.classList.remove("fade-in"), 400);
  }, 300);
}

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
    headers: { "Content-Type": "application/json" }, // ✅ FIX
    body: JSON.stringify({ action, username, password })
  })
    .then(res => res.json())
    .then(data => {
      if (action === "login") {
        if (data.status === "success") {
          window.location.href = "store.html?user=" + encodeURIComponent(username);
        } else {
          showError("Invalid login");
        }
      } else {
        if (data.status === "exists") {
          showError("Username already exists");
        } else {
          alert("Account created!");
          toggleForm();
        }
      }
    })
    .catch(err => {
      console.log(err);
      showError("Connection error");
    });
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

// ---------- USER ----------
function getUser() {
  return new URLSearchParams(window.location.search).get("user");
}

function displayUser() {
  const user = getUser();
  if (document.getElementById("user")) {
    document.getElementById("user").innerText = "Hello, " + user;
  }
}

// ---------- CART ----------
function add(product, price) {
  cart.push({ product, price });
  displayCart();
}

function removeGroupedItem(product) {
  cart = cart.filter(item => item.product !== product);
  displayCart();
}

function displayCart() {
  const list = document.getElementById("cartList");
  list.innerHTML = "";

  let total = 0;
  let groupedCart = {};

  cart.forEach(item => {
    if (groupedCart[item.product]) {
      groupedCart[item.product].quantity += 1;
    } else {
      groupedCart[item.product] = {
        price: item.price,
        quantity: 1
      };
    }
  });

  Object.keys(groupedCart).forEach(product => {
    const item = groupedCart[product];

    list.innerHTML += `
      <li>
        ${product} x${item.quantity} - ₱${item.price}
        <button onclick="removeGroupedItem('${product}')">Remove</button>
      </li>
    `;

    total += item.price * item.quantity;
  });

  if (document.getElementById("total")) {
    document.getElementById("total").innerText = "Total: ₱" + total;
  }
}

// ---------- QR ----------
function generateQR(total) {
  const qrImage = document.getElementById("qrImage");
  const data = `GCash Payment - ₱${total}`;

  qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(data)}`;
  document.getElementById("gcashQR").style.display = "block";
}

function confirmGCash() {
  gcashPaid = true;
  alert("Payment confirmed! Click BUY again.");
}

// ---------- RECEIPT ----------
function showReceipt(user, products, total, paymentMethod, change, gcashNumber) {
  document.getElementById("receipt").style.display = "block";

  document.getElementById("rUser").innerText = "Customer: " + user;
  document.getElementById("rItems").innerText = "Items: " + products;
  document.getElementById("rTotal").innerText = "Total: ₱" + total;

  if (paymentMethod === "cash") {
    document.getElementById("rPayment").innerText =
      "Payment: Cash | Change: ₱" + change.toFixed(2);
  } else {
    document.getElementById("rPayment").innerText =
      "Payment: GCash (" + gcashNumber + ")";
  }

  document.getElementById("rDate").innerText =
    "Date: " + new Date().toLocaleString();
}

function printReceipt() {
  const content = document.getElementById("receipt").innerHTML;
  const win = window.open("", "", "width=400,height=600");

  win.document.write("<html><body>");
  win.document.write(content);
  win.document.write("</body></html>");
  win.document.close();
  win.print();
}

// ---------- BUY ----------
function buy() {
  const user = getUser();

  if (cart.length === 0) {
    alert("Cart is empty!");
    return;
  }

  const paymentMethod = document.getElementById("paymentMethod").value;
  const cashGiven = parseFloat(document.getElementById("cashGiven").value) || 0;
  const gcashNumber = document.getElementById("gcashNumber").value.trim();

  let groupedCart = {};

  cart.forEach(item => {
    if (groupedCart[item.product]) {
      groupedCart[item.product].quantity += 1;
    } else {
      groupedCart[item.product] = {
        price: item.price,
        quantity: 1
      };
    }
  });

  const productsString = Object.keys(groupedCart)
    .map(p => `${p} x${groupedCart[p].quantity}`)
    .join(", ");

  const totalPrice = Object.keys(groupedCart)
    .reduce((sum, p) => sum + groupedCart[p].price * groupedCart[p].quantity, 0);

  let change = 0;

  if (paymentMethod === "cash") {
    if (cashGiven < totalPrice) {
      alert("Insufficient cash!");
      return;
    }
    change = cashGiven - totalPrice;
  }

  if (paymentMethod === "gcash") {
    if (!gcashNumber) {
      alert("Enter GCash number!");
      return;
    }

    if (!gcashPaid) {
      generateQR(totalPrice);
      alert("Scan QR then click DONE");
      return;
    }
  }

  if (!confirm(`Total: ₱${totalPrice}\nProceed?`)) return;

  fetch(scriptURL, {
    method: "POST",
    headers: { "Content-Type": "application/json" }, // ✅ FIX
    body: JSON.stringify({
      action: "order",
      username: user,
      products: productsString,
      total: totalPrice,
      paymentMethod,
      cashGiven,
      change,
      gcashNumber
    })
  })
    .then(() => {
      alert("Order saved!");

      showReceipt(user, productsString, totalPrice, paymentMethod, change, gcashNumber);

      cart = [];
      gcashPaid = false;

      displayCart();
      fetchOrderHistory();
    })
    .catch(() => alert("Error sending order"));
}

// ---------- HISTORY ----------
function fetchOrderHistory() {
  const user = getUser();

  fetch(scriptURL)
    .then(res => res.json())
    .then(data => {
      orderHistory = data.filter(o => o.username === user);
      displayHistory();
    });
}

function displayHistory() {
  const list = document.getElementById("historyList");
  if (!list) return;

  list.innerHTML = "";

  orderHistory.forEach(order => {
    list.innerHTML += `
      <li>
        ${order.products}<br>
        Total: ₱${order.total}<br>
        Payment: ${order.paymentMethod}<br>
        <small>${new Date(order.date).toLocaleString()}</small>
      </li>
    `;
  });
}

// ---------- PAYMENT ----------
function togglePaymentFields() {
  const method = document.getElementById("paymentMethod").value;

  document.getElementById("cashField").style.display =
    method === "cash" ? "block" : "none";

  document.getElementById("gcashField").style.display =
    method === "gcash" ? "block" : "none";

  document.getElementById("gcashQR").style.display = "none";
}

// ---------- LOGOUT ----------
function logout() {
  if (confirm("Are you sure you want to log out?")) {
    window.location.href = "index.html";
  }
}
