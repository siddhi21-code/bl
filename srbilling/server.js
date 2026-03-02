const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const db = new sqlite3.Database("./billing.db");

// Create Table
db.run(`
  CREATE TABLE IF NOT EXISTS bills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer TEXT,
    product TEXT,
    qty INTEGER,
    price REAL,
    total REAL,
    date TEXT
  )
`);

// Create Bill API
app.post("/create-bill", (req, res) => {
  const { customer, product, qty, price } = req.body;
  const total = qty * price;
  const date = new Date().toLocaleString();

  db.run(
    `INSERT INTO bills (customer, product, qty, price, total, date)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [customer, product, qty, price, total, date]
  );

  // ===== Printer Code =====
  const escpos = require("escpos");
  escpos.USB = require("escpos-usb");

  const device = new escpos.USB();
  const printer = new escpos.Printer(device);

  device.open(function () {
    printer
      .text("Siddhi Billing Software")
      .text("---------------------------")
      .text("Customer: " + customer)
      .text("Product: " + product)
      .text("Qty: " + qty)
      .text("Price: " + price)
      .text("Total: " + total)
      .text("---------------------------")
      .text("Thank You!")
      .cut()
      .close();
  });

  res.json({ message: "Bill Created & Printed", total });
});

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});