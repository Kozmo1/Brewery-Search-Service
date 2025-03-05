import express, { NextFunction, Request, Response } from "express";
import { query } from "express-validator";
import { verifyToken } from "../../../middleware/auth";
import { SearchController } from "../../../controllers/searchController";

const router = express.Router();  
const searchController = new SearchController();

router.get("/inventory", verifyToken,
    query("query").optional(),
    query("type").optional(),
    query("flavor").optional(), 
    (req: Request, res: Response, next: NextFunction) => searchController.searchInventory(req, res, next)
);

router.get("/orders", verifyToken,
    query("query").optional(),
    query("status").optional(),
    (req: Request, res: Response, next: NextFunction) => searchController.searchOrders(req, res, next)
);

router.get("/users", verifyToken,
    query("query").optional(),
    (req: Request, res: Response, next: NextFunction) => searchController.searchUsers(req, res, next)
);

router.get("/content", verifyToken,
    query("query").optional(),
    query("type").optional(),
    (req: Request, res: Response, next: NextFunction) => searchController.searchContent(req, res, next)
);

export = router;
