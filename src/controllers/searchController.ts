import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import axios from "axios";
import { config } from "../config/config";
import { AuthRequest } from "../middleware/auth";

interface TasteProfile {
	PrimaryFlavor?: string;
	Sweetness?: string;
	Bitterness?: string;
}

interface InventoryItem {
	Id: number;
	Name: string;
	Type: string;
	Description: string;
	TasteProfile: TasteProfile;
}

interface Order {
	Id: number;
	UserId: number;
	TotalPrice: number;
	Status: string;
}

interface User {
	Id: number;
	Name: string;
	Email: string;
}

interface Review {
	Id: number;
	UserId: number;
	ProductId: number;
	ReviewRating: number;
	ReviewMessage: string;
	CreatedAt: string;
}

export class SearchController {
	private readonly breweryApiUrl = config.breweryApiUrl;

	private paginate<T>(items: T[], page: number, limit: number): T[] {
		const start = (page - 1) * limit;
		return items.slice(start, start + limit);
	}

	async searchInventory(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			res.status(400).json({ errors: errors.array() });
			return;
		}

		const { query, type, flavor, page = "1", limit = "10" } = req.query;
		try {
			const response = await axios.get<InventoryItem[]>(
				`${this.breweryApiUrl}/api/inventory`,
				{ headers: { Authorization: req.headers.authorization } }
			);
			let results = response.data;

			if (query)
				results = results.filter(
					(item) =>
						item.Name.toLowerCase().includes(
							(query as string).toLowerCase()
						) ||
						item.Description.toLowerCase().includes(
							(query as string).toLowerCase()
						)
				);
			if (type)
				results = results.filter(
					(item) =>
						item.Type.toLowerCase() ===
						(type as string).toLowerCase()
				);
			if (flavor) {
				const f = (flavor as string).toLowerCase();
				results = results.filter(
					(item) =>
						item.TasteProfile?.PrimaryFlavor?.toLowerCase() === f ||
						item.TasteProfile?.Sweetness?.toLowerCase() === f ||
						item.TasteProfile?.Bitterness?.toLowerCase() === f
				);
			}

			const paginatedResults = this.paginate(
				results,
				parseInt(page as string),
				parseInt(limit as string)
			);
			res.status(200).json({
				results: paginatedResults,
				total: results.length,
			});
		} catch (error: any) {
			console.error(
				"Error searching inventory:",
				error.response?.data || error.message
			);
			res.status(error.response?.status || 500).json({
				message:
					error.response?.data?.message ||
					"Error searching inventory",
				error: error.response?.data?.errors || error.message,
			});
		}
	}

	async searchOrders(
		req: AuthRequest,
		res: Response,
		next: NextFunction
	): Promise<void> {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			res.status(400).json({ errors: errors.array() });
			return;
		}

		const { query, status, page = "1", limit = "10" } = req.query;
		try {
			const response = await axios.get<Order[]>(
				`${this.breweryApiUrl}/api/order`,
				{ headers: { Authorization: req.headers.authorization } }
			);
			let results = response.data;

			results = results.map((order) => ({
				...order,
				Id: parseInt(order.Id as unknown as string),
				UserId: parseInt(order.UserId as unknown as string),
				TotalPrice: parseFloat(order.TotalPrice as unknown as string),
			}));

			if (req.user)
				results = results.filter(
					(order) => req.user && order.UserId === req.user.id
				);

			if (query) {
				const q = (query as string).toLowerCase();
				results = results.filter(
					(order) =>
						order.Id.toString() === q ||
						order.UserId.toString() === q
				);
			}
			if (status)
				results = results.filter(
					(order) =>
						order.Status.toLowerCase() ===
						(status as string).toLowerCase()
				);

			const paginatedResults = this.paginate(
				results,
				parseInt(page as string),
				parseInt(limit as string)
			);
			res.status(200).json({
				results: paginatedResults,
				total: results.length,
			});
		} catch (error: any) {
			console.error(
				"Error searching orders:",
				error.response?.data || error.message
			);
			res.status(error.response?.status || 500).json({
				message:
					error.response?.data?.message || "Error searching orders",
				error: error.response?.data?.errors || error.message,
			});
		}
	}

	async searchUsers(
		req: AuthRequest,
		res: Response,
		next: NextFunction
	): Promise<void> {
		if (!req.user) {
			res.status(401).json({ message: "Authentication required" });
			return;
		}

		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			res.status(400).json({ errors: errors.array() });
			return;
		}

		const { query, page = "1", limit = "10" } = req.query;
		try {
			const response = await axios.get<User[]>(
				`${this.breweryApiUrl}/api/user`,
				{ headers: { Authorization: req.headers.authorization } }
			);
			let results = response.data;

			if (query) {
				const q = (query as string).toLowerCase();
				results = results.filter(
					(user) =>
						user.Name.toLowerCase().includes(q) ||
						user.Email.toLowerCase().includes(q)
				);
			}

			const paginatedResults = this.paginate(
				results,
				parseInt(page as string),
				parseInt(limit as string)
			);
			res.status(200).json({
				results: paginatedResults,
				total: results.length,
			});
		} catch (error: any) {
			console.error(
				"Error searching users:",
				error.response?.data || error.message
			);
			res.status(error.response?.status || 500).json({
				message:
					error.response?.data?.message || "Error searching users",
				error: error.response?.data?.errors || error.message,
			});
		}
	}

	async searchReviews(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			res.status(400).json({ errors: errors.array() });
			return;
		}

		const { query, page = "1", limit = "10" } = req.query;
		try {
			const response = await axios.get<Review[]>(
				`${this.breweryApiUrl}/api/reviews`,
				{ headers: { Authorization: req.headers.authorization } }
			);
			let results = response.data;

			// Convert string fields to numbers
			results = results.map((review) => ({
				...review,
				Id: parseInt(review.Id as unknown as string),
				UserId: parseInt(review.UserId as unknown as string),
				ProductId: parseInt(review.ProductId as unknown as string),
				ReviewRating: parseFloat(
					review.ReviewRating as unknown as string
				),
			}));

			console.log("Processed reviews:", results); // Debug log

			if (query) {
				const q = (query as string).toLowerCase();
				results = results.filter(
					(review) =>
						review.ReviewMessage.toLowerCase().includes(q) ||
						review.ReviewRating.toString() === q
				);
				console.log("After query filter:", results); // Debug log
			}

			const paginatedResults = this.paginate(
				results,
				parseInt(page as string),
				parseInt(limit as string)
			);
			res.status(200).json({
				results: paginatedResults,
				total: results.length,
			});
		} catch (error: any) {
			console.error(
				"Error searching reviews:",
				error.response?.data || error.message
			);
			res.status(error.response?.status || 500).json({
				message:
					error.response?.data?.message || "Error searching reviews",
				error: error.response?.data?.errors || error.message,
			});
		}
	}
}
