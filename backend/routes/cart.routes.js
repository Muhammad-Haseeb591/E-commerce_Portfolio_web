const router = require("express").Router();
const { getCart, saveCart } = require("../controllers/cart.controller.js");
const { protect } = require("../middleware/auth.middleware");

router.get("/", protect, getCart);
router.post("/save", protect, saveCart);

module.exports = router;