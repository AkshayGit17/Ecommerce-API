const Order = require('../models/Order');
const Product = require('../models/Product');
const { StatusCodes } = require('http-status-codes');
const { NotFoundError, BadRequestError } = require('../errors');
const { checkPermissions } = require('../utils');

const getAllOders = async (req, res) => {
  const orders = await Order.find({});
  res.status(StatusCodes.OK).json({ orders, count: orders.length });
};
const getSingleOrder = async (req, res) => {
  const { id: orderId } = req.params;

  const order = await Order.findOne({ _id: orderId });

  if (!order) {
    throw new NotFoundError(`No order found with id: ${orderId}`);
  }

  checkPermissions(req.user, order.user);

  res.status(StatusCodes.OK).json({ order });
};
const getCurrentUserOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user.userId });

  if (orders.length === 0) {
    throw new NotFoundError('You dont have any orders');
  }

  res.status(StatusCodes.OK).json({ orders, count: orders.length });
};

const fakeStripeAPI = async (amount, currency) => {
  return { client_secret: 'someRandomValue', amount };
};

const createOrder = async (req, res) => {
  const { tax, shippingFee, items: cartItems } = req.body;

  if (!cartItems || cartItems.length === 0) {
    throw new BadRequestError('No cart items provided');
  }

  if (!tax || !shippingFee) {
    throw new BadRequestError('Please provide tax and shipping fee');
  }

  let orderItems = [];
  let subtotal = 0;

  for (const item of cartItems) {
    const product = await Product.findOne({ _id: item.product });

    if (!product) {
      throw new NotFoundError(`No product found with id: ${item.product}`);
    }

    const { name, image, price, _id } = product;

    const singleOrderItem = {
      name,
      image,
      price,
      amount: item.amount,
      product: _id,
    };

    orderItems = [...orderItems, singleOrderItem];
    subtotal += item.amount * price;
  }
  const total = subtotal + shippingFee + tax;

  const paymentIntent = await fakeStripeAPI({
    amount: total,
    currency: 'inr',
  });

  const order = await Order.create({
    tax,
    shippingFee,
    subtotal,
    total,
    orderItems,
    user: req.user.userId,
    clientSecret: paymentIntent.client_secret,
  });

  res
    .status(StatusCodes.CREATED)
    .json({ order, clientSecret: order.clientSecret });
};
const updateOrder = async (req, res) => {
  const { id: orderId } = req.params;
  const { paymentIntentId } = req.body;

  const order = await Order.findOne({ _id: orderId });

  if (!order) {
    throw new NotFoundError(`No order found with id: ${orderId}`);
  }

  checkPermissions(req.user, order.user);

  order.paymentIntentId = paymentIntentId;
  order.status = 'paid';
  await order.save();

  res.status(StatusCodes.OK).json({ order });
};

module.exports = {
  getAllOders,
  getSingleOrder,
  getCurrentUserOrders,
  createOrder,
  updateOrder,
};
