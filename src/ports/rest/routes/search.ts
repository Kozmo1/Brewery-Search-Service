import express, { NextFunction, Request, Response } from "express";
import { query } from "express-validator";
import { verifyToken, AuthRequest } from "../../../middleware/auth";
import { SearchController } from "../../../controllers/searchController";

const router = express.Router();
const searchController = new SearchController();

router.get(
	"/inventory",
	query("query").optional().isString().withMessage("Query must be a string"),
	query("type").optional().isString().withMessage("Type must be a string"),
	query("flavor")
		.optional()
		.isString()
		.withMessage("Flavor must be a string"),
	query("page")
		.optional()
		.isInt({ min: 1 })
		.withMessage("Page must be a positive integer"),
	query("limit")
		.optional()
		.isInt({ min: 1 })
		.withMessage("Limit must be a positive integer"),
	(req: Request, res: Response, next: NextFunction) =>
		searchController.searchInventory(req, res, next)
);

router.get(
	"/orders",
	verifyToken,
	query("query").optional().isString().withMessage("Query must be a string"),
	query("status")
		.optional()
		.isString()
		.withMessage("Status must be a string"),
	query("page")
		.optional()
		.isInt({ min: 1 })
		.withMessage("Page must be a positive integer"),
	query("limit")
		.optional()
		.isInt({ min: 1 })
		.withMessage("Limit must be a positive integer"),
	(req: AuthRequest, res: Response, next: NextFunction) =>
		searchController.searchOrders(req, res, next)
);

router.get(
	"/users",
	verifyToken,
	query("query").optional().isString().withMessage("Query must be a string"),
	query("page")
		.optional()
		.isInt({ min: 1 })
		.withMessage("Page must be a positive integer"),
	query("limit")
		.optional()
		.isInt({ min: 1 })
		.withMessage("Limit must be a positive integer"),
	(req: AuthRequest, res: Response, next: NextFunction) =>
		searchController.searchUsers(req, res, next)
);

router.get(
	"/reviews",
	query("query").optional().isString().withMessage("Query must be a string"),
	query("page")
		.optional()
		.isInt({ min: 1 })
		.withMessage("Page must be a positive integer"),
	query("limit")
		.optional()
		.isInt({ min: 1 })
		.withMessage("Limit must be a positive integer"),
	(req: Request, res: Response, next: NextFunction) =>
		searchController.searchReviews(req, res, next)
);

export = router;
