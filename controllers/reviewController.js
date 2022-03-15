const { StatusCodes } = require('http-status-codes');
const { NotFoundError, BadRequestError } = require('../errors');
const Product = require('../models/Product');
const { checkPermissions } = require('../utils');
const Review = require('../models/Review');

const getAllReviews = async (req, res) => {
  const reviews = await Review.find({})
    .populate({
      path: 'product',
      select: 'name company price',
    })
    .populate({
      path: 'user',
      select: 'name',
    });
  res.status(StatusCodes.OK).json({ reviews, count: reviews.length });
};
const createReview = async (req, res) => {
  const { product: productId } = req.body;
  req.body.user = req.user.userId;

  const isProductValid = await Product.findOne({ _id: productId });

  if (!isProductValid) {
    throw new NotFoundError(`No product found with id: ${productId}`);
  }

  const alredySubmitted = await Review.findOne({
    product: productId,
    user: req.user.userId,
  });

  if (alredySubmitted) {
    throw new BadRequestError('Already submitted review for this product');
  }

  const review = await Review.create(req.body);
  res.status(StatusCodes.CREATED).json({ review });
};
const getSingleReview = async (req, res) => {
  const { id: reviewId } = req.params;

  const review = await Review.findOne({ _id: reviewId });

  if (!review) {
    throw new NotFoundError(`No review found with id: ${reviewId}`);
  }
  res.status(StatusCodes.OK).json({ review });
};
const updateReview = async (req, res) => {
  const { id: reviewId } = req.params;
  const { title, rating, comment } = req.body;

  const review = await Review.findOne({ _id: reviewId });

  if (!review) {
    throw new NotFoundError(`No review found with id: ${reviewId}`);
  }

  checkPermissions(req.user, review.user);

  review.title = title;
  review.rating = rating;
  review.comment = comment;

  await review.save();
  res.status(StatusCodes.OK).json({ review });
};
const deleteReview = async (req, res) => {
  const { id: reviewId } = req.params;

  const review = await Review.findOne({ _id: reviewId });

  if (!review) {
    throw new NotFoundError(`No review found with id: ${reviewId}`);
  }

  checkPermissions(req.user, review.user);

  await review.remove();
  res.status(StatusCodes.OK).json({ msg: 'Success! Review removed' });
};

const getSingleProductReviews = async (req, res) => {
  const { id: productId } = req.params;

  const reviews = await Review.find({ product: productId }).populate({
    path: 'user',
    select: 'name',
  });

  res.status(StatusCodes.OK).json({ reviews, count: reviews.length });
};

module.exports = {
  getAllReviews,
  createReview,
  getSingleReview,
  updateReview,
  deleteReview,
  getSingleProductReviews,
};
