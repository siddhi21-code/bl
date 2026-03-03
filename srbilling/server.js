const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const escpos = require("escpos");
escpos.USB = require("escpos-usb");

const app = express();
app.use(express.json());
app.use(express.static("public"));

const db = new sqlite3.Database("./database.db");

// Create Table
db.run(`
CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product TEXT,
    price REAL,
    qty INTEGER,
    total REAL,
    date TEXT
)
`);

// Add Invoice
app.post("/addInvoice", (req, res) => {
    const { product, price, qty, total, date } = req.body;

    db.run(
        "INSERT INTO invoices (product, price, qty, total, date) VALUES (?, ?, ?, ?, ?)",
        [product, price, qty, total, date],
        function (err) {
            if (err) return res.status(500).json(err);
            res.json({ message: "Saved Successfully" });
        }
    );
});

// Get All Invoices
app.get("/getInvoices", (req, res) => {
    db.all("SELECT * FROM invoices ORDER BY id DESC", [], (err, rows) => {
        if (err) return res.status(500).json(err);
        res.json(rows);
    });
});

// Print Invoice
app.post("/print", (req, res) => {
    const { product, total } = req.body;

    const device = new escpos.USB();
    const printer = new escpos.Printer(device);

    device.open(() => {
        printer
            .align("CT")
            .text("SRBilling")
            .text("--------------------------")
            .align("LT")
            .text("Product: " + product)
            .text("Total: ₹" + total)
            .text("--------------------------")
            .cut()
            .close();
    });

    res.json({ message: "Printed" });
});

app.listen(5000, () => {
    console.log("SRBilling running on http://localhost:5000");
});