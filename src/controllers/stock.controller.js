import { asyncHandler, ApiResponse } from '../utils/index.js';
import { addStockService } from '../services/stock.service.js';

/**
 * @desc    Add new stock by ticker (fetches name & exchange from Alpaca Markets)
 * @route   POST /api/v1/stocks
 * @access  Public
 */
export const addStock = asyncHandler(async (req, res) => {
  const { ticker } = req.body;
  const { stock, isNew } = await addStockService(ticker);

  const statusCode = isNew ? 201 : 200;
  const message = isNew ? 'Stock added successfully from Alpaca' : 'Stock already exists in database';

  return new ApiResponse(statusCode, { stock }, message).send(res);
});

export default {
  addStock,
};

