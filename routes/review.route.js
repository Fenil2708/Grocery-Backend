import { Router } from 'express';
import auth from '../middlewares/auth.js';
import { addReview, deleteReview, getProductReviews } from '../controllers/review.controller.js';

const reviewRouter = Router();

// Get all reviews for a specific product
reviewRouter.get('/:productId', getProductReviews);

// Add a new review for a product (authenticated users only)
reviewRouter.post('/', auth, addReview);

// Delete a review (only the reviewer can delete)
reviewRouter.delete('/:id', auth, deleteReview);

export default reviewRouter;

