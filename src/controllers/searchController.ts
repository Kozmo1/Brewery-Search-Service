import { AuthRequest } from "../middleware/auth";
import { Request, Response, NextFunction } from "express";
import axios from "axios";
import { config } from "../config/config";
import { validationResult } from "express-validator";

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
    id: number
    name: string;
    email: string;
}

interface ContentItem {
    id: number;
    title: string;
    type: string;
    body: string;
}

interface TasteProfile {
    primaryFlavor?: string;
    sweetness?: string;
    bitterness?: string;
}

export class SearchController {
    private readonly breweryApiUrl = config.breweryApiUrl;
    public async searchInventory(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }
        const { query, type, flavor } = req.query;

        try {
            const response = await axios.get<InventoryItem[]>(`${this.breweryApiUrl}/api/inventory`);
            let results = response.data;
            if (query) {
                const q = (query as string).toLowerCase();
                results = results.filter(item => 
                    item.name.toLowerCase().includes(q) || 
                    item.description.toLowerCase().includes(q));
            };
            if (type) {
                results = results.filter(item => item.type.toLowerCase() === (type as string).toLowerCase());
            }
            if (flavor) {
                const f = (flavor as string).toLowerCase();
                results = results.filter(item =>
                    item.tasteProfile.primaryFlavor?.toLowerCase() === f || 
                    item.tasteProfile.sweetness?.toLowerCase() === f ||
                    item.tasteProfile.bitterness?.toLowerCase() === f
                );
            }
            res.status(200).json({results});
        } catch (error: any) {
            console.error("Error searching inventory:", error.response?.data || error.message);
            res.status(error.response?.status || 500).json({
                message: error.response?.data?.message || "Error searching inventory",
                error: error.response?.data?.errors || error.message
            });
        }
    }


    public async searchOrders(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }

        const { query, status } = req.query;

        try {
            const response = await axios.get<Order[]>(`${this.breweryApiUrl}/api/order`);
            let results = response.data;

            if (query) {
                const q = (query as string).toLowerCase();
                results = results.filter(order =>
                    order.id.toString() === q ||
                    order.user.toLowerCase().includes(q)
                );
            }
            if (status) {
                results = results.filter(order => order.status.toLowerCase() === (status as string).toLowerCase());
            }
            if (req.user) {
                results = results.filter(order => req.user && order.user === req.user.id);
            }

            res.status(200).json({ results });
        } catch (error: any) {
            console.error("Error searching orders:", error.response?.data || error.message);
            res.status(error.response?.status || 500).json({
                message: error.response?.data?.message || "Error searching orders",
                error: error.response?.data?.errors || error.message
            });
        }
    }

    public async searchUsers(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        if (!req.user) {
            res.status(401).json({ message: "Authentication required for user search" });
            return;
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }

        const { query } = req.query;

        try {
            const response = await axios.get<User[]>(`${this.breweryApiUrl}/api/auth`);
            let results = response.data;

            if (query) {
                const q = (query as string).toLowerCase();
                results = results.filter(user =>
                    user.name.toLowerCase().includes(q) ||
                    user.email.toLowerCase().includes(q)
                );
            }

            res.status(200).json({ results });
        } catch (error: any) {
            console.error("Error searching users:", error.response?.data || error.message);
            res.status(error.response?.status || 500).json({
                message: error.response?.data?.message || "Error searching users",
                error: error.response?.data?.errors || error.message
            });
        }
    }

    public async searchContent(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }

        const { query, type } = req.query;

        try {
            const response = await axios.get<ContentItem[]>(`${this.breweryApiUrl}/api/content`);
            let results = response.data;

            if (query) {
                const q = (query as string).toLowerCase();
                results = results.filter(item =>
                    item.title.toLowerCase().includes(q) ||
                    item.body.toLowerCase().includes(q)
                );
            }
            if (type) {
                results = results.filter(item => item.type.toLowerCase() === (type as string).toLowerCase());
            }

            res.status(200).json({ results });
        } catch (error: any) {
            console.error("Error searching content:", error.response?.data || error.message);
            res.status(error.response?.status || 500).json({
                message: error.response?.data?.message || "Error searching content",
                error: error.response?.data?.errors || error.message
            });
        }
    }
}