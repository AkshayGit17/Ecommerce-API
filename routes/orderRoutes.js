const express = require('express');
const router = express.Router();

const {
  getAllOders,
  getCurrentUserOrders,
  getSingleOrder,
  createOrder,
  updateOrder,
} = require('../controllers/orderController');

const {
  authenticateUser,
  authorizePermissions,
} = require('../middleware/authentication');

router
  .route('/')
  .get(authenticateUser, authorizePermissions('admin'), getAllOders)
  .post(authenticateUser, createOrder);

router.route('/showAllMyOrders').get(authenticateUser, getCurrentUserOrders);

router
  .route('/:id')
  .get(authenticateUser, getSingleOrder)
  .patch(authenticateUser, updateOrder);

module.exports = router;
