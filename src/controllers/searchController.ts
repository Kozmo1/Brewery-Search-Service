import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import axios from "axios";
import { config } from "../config/config";
import { AuthRequest } from "../middleware/auth";

interface InventoryItem {
	id: number;
	name: string;
	type: string;
	description: string;
	tasteProfile: TasteProfile;
}
interface Order {
	id: number;
	user: string;
	totalPrice: number;
	status: string;
}
interface User {
	id: number;
	name: string;
	email: string;
}
interface ContentItem {
	id: number;
	title: string;
	type: string;
	body: string;
}
interface Review {
	id: number;
	userId: number;
	productId: number;
	reviewRating: number;
	reviewMessage: string;
}
interface TasteProfile {
	primaryFlavor?: string;
	sweetness?: string;
	bitterness?: string;
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
				`${this.breweryApiUrl}/api/inventory`
			);
			let results = response.data;

			if (query)
				results = results.filter(
					(item) =>
						item.name
							.toLowerCase()
							.includes((query as string).toLowerCase()) ||
						item.description
							.toLowerCase()
							.includes((query as string).toLowerCase())
				);
			if (type)
				results = results.filter(
					(item) =>
						item.type.toLowerCase() ===
						(type as string).toLowerCase()
				);
			if (flavor) {
				const f = (flavor as string).toLowerCase();
				results = results.filter(
					(item) =>
						item.tasteProfile?.primaryFlavor?.toLowerCase() === f ||
						item.tasteProfile?.sweetness?.toLowerCase() === f ||
						item.tasteProfile?.bitterness?.toLowerCase() === f
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
				`${this.breweryApiUrl}/api/order`
			);
			let results = response.data;

			if (req.user)
				results = results.filter(
					(order) => req.user && order.user === req.user.id
				);
			if (query) {
				const q = (query as string).toLowerCase();
				results = results.filter(
					(order) =>
						order.id.toString() === q ||
						order.user.toLowerCase().includes(q)
				);
			}
			if (status)
				results = results.filter(
					(order) =>
						order.status.toLowerCase() ===
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
				`${this.breweryApiUrl}/api/auth`
			);
			let results = response.data;

			if (query) {
				const q = (query as string).toLowerCase();
				results = results.filter(
					(user) =>
						user.name.toLowerCase().includes(q) ||
						user.email.toLowerCase().includes(q)
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

	async searchContent(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			res.status(400).json({ errors: errors.array() });
			return;
		}

		const { query, type, page = "1", limit = "10" } = req.query;
		try {
			const response = await axios.get<ContentItem[]>(
				`${this.breweryApiUrl}/api/content`
			);
			let results = response.data;

			if (query) {
				const q = (query as string).toLowerCase();
				results = results.filter(
					(item) =>
						item.title.toLowerCase().includes(q) ||
						item.body.toLowerCase().includes(q)
				);
			}
			if (type)
				results = results.filter(
					(item) =>
						item.type.toLowerCase() ===
						(type as string).toLowerCase()
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
				"Error searching content:",
				error.response?.data || error.message
			);
			res.status(error.response?.status || 500).json({
				message:
					error.response?.data?.message || "Error searching content",
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
				`${this.breweryApiUrl}/api/reviews`
			);
			let results = response.data;

			if (query) {
				const q = (query as string).toLowerCase();
				results = results.filter(
					(review) =>
						review.reviewMessage.toLowerCase().includes(q) ||
						review.reviewRating.toString() === q
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
