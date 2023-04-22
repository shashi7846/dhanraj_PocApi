const express = require("express");
const bodyParser = require("body-parser");
const MongoClient = require("mongodb").MongoClient;
const bcrypt = require("bcrypt");
const URL =
  "mongodb+srv://shashikanth7846:Shashi123@cluster0.5qu4jls.mongodb.net/?retryWrites=true&w=majority";
const app = express();
const port = 5000;
const cors = require("cors");
const jwt = require("jsonwebtoken");
// Middleware to parse JSON request bodies
app.use(bodyParser.json());
app.use(cors());

const DB = "banking";
const balances = new Map();
// Connect to MongoDB and start the server
app.post("/register", async function (req, res) {
  try {
    let connection = await MongoClient.connect(URL);
    let db = connection.db(DB);

    let uniqueEmail = await db
      .collection("users")
      .findOne({ email: req.body.email });
    if (uniqueEmail) {
      res.json({
        message: "email is already in exist",
      });
    } else {
      let salt = await bcrypt.genSalt(10);
      let hash = await bcrypt.hash(req.body.password, salt);
      // securing the password by encrypting
      req.body.password = hash;

      let users = await db.collection("users").insertOne(req.body);
      await connection.close();
      res.json({
        message: "User is Registered",
      });
    }
  } catch (error) {
    console.log(error);
  }
});

//posting the login details

app.post("/login", async function (req, res) {
  try {
    let connection = await MongoClient.connect(URL);
    let db = connection.db(DB);

    let user = await db.collection("users").findOne({ email: req.body.email });

    if (user) {
      let isPassword = await bcrypt.compare(req.body.password, user.password);
      if (isPassword) {
        let token = jwt.sign({ _id: user._id }, "asdfghjklzxcvbnm");
        res.json({
          message: "allow",
          token,
          id: user._id,
        });
      } else {
        res.json({
          message: "email or password is incorrect",
        });
      }
    } else {
      res.json({
        message: "email or password is incorrect",
      });
    }
  } catch (error) {
    console.log(error);
  }
});

app.get("/user/:id", async function (req, res) {
  try {
    let connection = await MongoClient.connect(URL);
    let db = connection.db(DB);
    let user = await db.collection("users").findOne({ email: req.params.id });
    res.json(user);
    await connection.close();
  } catch (error) {
    console.log(error);
  }
});

//new chatgpt's suggestion
app.post("/api/balance/:userId", (req, res) => {
  const userId = req.params.userId;
  console.log(userId);
  const balance = req.body.balance;
  if (balances.has(userId)) {
    return res.status(400).json({ message: "User balance already exists" });
  }
  if (typeof balance !== "number") {
    return res.status(400).json({ message: "Invalid balance value" });
  }
  balances.set(userId, balance);
  return res.json({ message: "Balance created" });
});

//GET balance for a specific user
app.get("/api/balance/:userId", (req, res) => {
  const userId = req.params.userId;
  if (!balances.has(userId)) {
    return res.status(404).json({ message: "User not found" });
  }
  const balance = balances.get(userId);
  return res.json({ balance });
});

// PUT balance for a specific user
app.put("/api/balance/:userId", (req, res) => {
  const userId = req.params.userId;
  const newBalance = req.body.balance;
  if (typeof newBalance !== "number") {
    return res.status(400).json({ message: "Invalid balance value" });
  }
  balances.set(userId, newBalance);
  return res.json({ message: "Balance updated" });
});

///

app.post("/deposit/:id", async function (req, res) {
  try {
    let connection = await MongoClient.connect(URL);
    let db = connection.db(DB);

    await db.collection("users").insertOne(req.body);
    await connection.close();
    res.json({
      message: "Deposited",
    });
  } catch (error) {
    console.log(error);
  }
});

app.get("/", (req, res) => res.status(200).send("this is bankpoc"));
app.listen(port, () => console.log(`listening on the port ${port}`));
