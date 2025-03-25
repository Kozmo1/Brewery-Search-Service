import { SearchController } from "../searchController";
import { Request, Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import axios from "axios";
import { validationResult, ValidationError } from "express-validator";

// Mock axios for API calls
jest.mock("axios", () => ({
	get: jest.fn(),
}));

// Mock express-validator
jest.mock("express-validator", () => ({
	validationResult: jest.fn(),
}));

// Type the mocked validationResult
const mockedValidationResult =
	validationResult as unknown as jest.MockedFunction<
		() => {
			isEmpty: () => boolean;
			array: () => ValidationError[];
		}
	>;

describe("SearchController", () => {
	let searchController: SearchController;
	let mockRequest: Partial<AuthRequest>;
	let mockResponse: Partial<Response>;
	let mockNext: jest.Mock;

	// Set up fresh controller and mocks before each test
	beforeEach(() => {
		searchController = new SearchController();
		mockRequest = {
			query: {},
			headers: { authorization: "Bearer mock-token" },
			user: { id: 1, email: "test@example.com" },
		};
		mockResponse = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};
		mockNext = jest.fn();

		// Clear mocks to keep tests isolated
		jest.clearAllMocks();
		// Keep console logs quiet during tests
		jest.spyOn(console, "error").mockImplementation(() => {});
		jest.spyOn(console, "log").mockImplementation(() => {});
	});

	describe("searchInventory", () => {
		// Test searching inventory with filters
		it("should search inventory with filters", async () => {
			// Mock validation passing
			mockedValidationResult.mockReturnValue({
				isEmpty: () => true,
				array: () => [],
			});
			// Mock API response
			(axios.get as jest.Mock).mockResolvedValue({
				data: [
					{
						Id: 1,
						Name: "Hoppy Beer",
						Type: "Beer",
						Description: "A hoppy delight",
						TasteProfile: { PrimaryFlavor: "Hoppy" },
					},
					{
						Id: 2,
						Name: "Sweet Ale",
						Type: "Beer",
						Description: "Sweet taste",
						TasteProfile: { Sweetness: "High" },
					},
				],
			});

			mockRequest.query = {
				query: "beer",
				type: "Beer",
				flavor: "Hoppy",
				page: "1",
				limit: "1",
			};

			await searchController.searchInventory(
				mockRequest as Request,
				mockResponse as Response,
				mockNext
			);

			// Check the API call
			expect(axios.get).toHaveBeenCalledWith(
				"http://localhost:5089/api/inventory",
				expect.any(Object)
			);
			// Expect filtered and paginated results
			expect(mockResponse.status).toHaveBeenCalledWith(200);
			expect(mockResponse.json).toHaveBeenCalledWith({
				results: [
					{
						Id: 1,
						Name: "Hoppy Beer",
						Type: "Beer",
						Description: "A hoppy delight",
						TasteProfile: { PrimaryFlavor: "Hoppy" },
					},
				],
				total: 1,
			});
		});

		// Test validation failure
		it("should return 400 if validation fails", async () => {
			// Mock validation failing
			mockedValidationResult.mockReturnValue({
				isEmpty: () => false,
				array: () => [
					{
						msg: "Page must be a positive integer",
					} as ValidationError,
				],
			});

			mockRequest.query = { page: "-1" };

			await searchController.searchInventory(
				mockRequest as Request,
				mockResponse as Response,
				mockNext
			);

			// Expect the error response
			expect(mockResponse.status).toHaveBeenCalledWith(400);
			expect(mockResponse.json).toHaveBeenCalledWith({
				errors: [{ msg: "Page must be a positive integer" }],
			});
		});

		// Test API error
		it("should handle API error", async () => {
			// Mock validation passing
			mockedValidationResult.mockReturnValue({
				isEmpty: () => true,
				array: () => [],
			});
			// Mock an API error
			(axios.get as jest.Mock).mockRejectedValue({
				response: { status: 500, data: { message: "Server error" } },
			});

			mockRequest.query = { query: "beer" };

			await searchController.searchInventory(
				mockRequest as Request,
				mockResponse as Response,
				mockNext
			);

			// Expect the error response
			expect(mockResponse.status).toHaveBeenCalledWith(500);
			expect(mockResponse.json).toHaveBeenCalledWith({
				message: "Server error",
				error: undefined,
			});
		});

		// Test error without response
		it("should handle error without response", async () => {
			// Mock validation passing
			mockedValidationResult.mockReturnValue({
				isEmpty: () => true,
				array: () => [],
			});
			// Mock a raw error
			(axios.get as jest.Mock).mockRejectedValue(
				new Error("Network error")
			);

			mockRequest.query = { query: "beer" };

			await searchController.searchInventory(
				mockRequest as Request,
				mockResponse as Response,
				mockNext
			);

			// Expect the fallback error response
			expect(mockResponse.status).toHaveBeenCalledWith(500);
			expect(mockResponse.json).toHaveBeenCalledWith({
				message: "Error searching inventory",
				error: "Network error",
			});
		});
	});

	describe("searchOrders", () => {
		// Test searching orders with filters
		it("should search orders with filters", async () => {
			// Mock validation passing
			mockedValidationResult.mockReturnValue({
				isEmpty: () => true,
				array: () => [],
			});
			// Mock API response with string fields
			(axios.get as jest.Mock).mockResolvedValue({
				data: [
					{
						Id: "1",
						UserId: "1",
						TotalPrice: "10.99",
						Status: "Pending",
					},
					{
						Id: "2",
						UserId: "2",
						TotalPrice: "15.50",
						Status: "Shipped",
					},
				],
			});

			mockRequest.query = {
				query: "1",
				status: "Pending",
				page: "1",
				limit: "1",
			};

			await searchController.searchOrders(
				mockRequest as AuthRequest,
				mockResponse as Response,
				mockNext
			);

			// Check the API call
			expect(axios.get).toHaveBeenCalledWith(
				"http://localhost:5089/api/order",
				expect.any(Object)
			);
			// Expect filtered and paginated results
			expect(mockResponse.status).toHaveBeenCalledWith(200);
			expect(mockResponse.json).toHaveBeenCalledWith({
				results: [
					{ Id: 1, UserId: 1, TotalPrice: 10.99, Status: "Pending" },
				],
				total: 1,
			});
		});

		// Test validation failure
		it("should return 400 if validation fails", async () => {
			// Mock validation failing
			mockedValidationResult.mockReturnValue({
				isEmpty: () => false,
				array: () => [
					{
						msg: "Limit must be a positive integer",
					} as ValidationError,
				],
			});

			mockRequest.query = { limit: "-5" };

			await searchController.searchOrders(
				mockRequest as AuthRequest,
				mockResponse as Response,
				mockNext
			);

			// Expect the error response
			expect(mockResponse.status).toHaveBeenCalledWith(400);
			expect(mockResponse.json).toHaveBeenCalledWith({
				errors: [{ msg: "Limit must be a positive integer" }],
			});
		});

		// Test no user provided
		it("should filter orders by user ID when authenticated", async () => {
			// Mock validation passing
			mockedValidationResult.mockReturnValue({
				isEmpty: () => true,
				array: () => [],
			});
			// Mock API response
			(axios.get as jest.Mock).mockResolvedValue({
				data: [
					{
						Id: "1",
						UserId: "1",
						TotalPrice: "10.99",
						Status: "Pending",
					},
					{
						Id: "2",
						UserId: "2",
						TotalPrice: "15.50",
						Status: "Shipped",
					},
				],
			});

			mockRequest.user = { id: 1, email: "test@example.com" };
			mockRequest.query = {};

			await searchController.searchOrders(
				mockRequest as AuthRequest,
				mockResponse as Response,
				mockNext
			);

			// Expect only user’s orders
			expect(mockResponse.status).toHaveBeenCalledWith(200);
			expect(mockResponse.json).toHaveBeenCalledWith({
				results: [
					{ Id: 1, UserId: 1, TotalPrice: 10.99, Status: "Pending" },
				],
				total: 1,
			});
		});

		// Test API error
		it("should handle API error", async () => {
			// Mock validation passing
			mockedValidationResult.mockReturnValue({
				isEmpty: () => true,
				array: () => [],
			});
			// Mock an API error
			(axios.get as jest.Mock).mockRejectedValue({
				response: { status: 500, data: { message: "Server error" } },
			});

			mockRequest.query = { status: "Pending" };

			await searchController.searchOrders(
				mockRequest as AuthRequest,
				mockResponse as Response,
				mockNext
			);

			// Expect the error response
			expect(mockResponse.status).toHaveBeenCalledWith(500);
			expect(mockResponse.json).toHaveBeenCalledWith({
				message: "Server error",
				error: undefined,
			});
		});

		// Test error without response
		it("should handle error without response", async () => {
			// Mock validation passing
			mockedValidationResult.mockReturnValue({
				isEmpty: () => true,
				array: () => [],
			});
			// Mock a raw error
			(axios.get as jest.Mock).mockRejectedValue(
				new Error("Network error")
			);

			mockRequest.query = { status: "Pending" };

			await searchController.searchOrders(
				mockRequest as AuthRequest,
				mockResponse as Response,
				mockNext
			);

			// Expect the fallback error response
			expect(mockResponse.status).toHaveBeenCalledWith(500);
			expect(mockResponse.json).toHaveBeenCalledWith({
				message: "Error searching orders",
				error: "Network error",
			});
		});
	});

	describe("searchUsers", () => {
		// Test searching users with query
		it("should search users with query", async () => {
			// Mock validation passing
			mockedValidationResult.mockReturnValue({
				isEmpty: () => true,
				array: () => [],
			});
			// Mock API response
			(axios.get as jest.Mock).mockResolvedValue({
				data: [
					{ Id: 1, Name: "Joel", Email: "joel@example.com" },
					{ Id: 2, Name: "Mike", Email: "mike@example.com" },
				],
			});

			mockRequest.query = { query: "joel", page: "1", limit: "1" };

			await searchController.searchUsers(
				mockRequest as AuthRequest,
				mockResponse as Response,
				mockNext
			);

			// Check the API call
			expect(axios.get).toHaveBeenCalledWith(
				"http://localhost:5089/api/user",
				expect.any(Object)
			);
			// Expect filtered and paginated results
			expect(mockResponse.status).toHaveBeenCalledWith(200);
			expect(mockResponse.json).toHaveBeenCalledWith({
				results: [{ Id: 1, Name: "Joel", Email: "joel@example.com" }],
				total: 1,
			});
		});

		// Test no authentication
		it("should return 401 if no user is authenticated", async () => {
			mockRequest.user = undefined;

			await searchController.searchUsers(
				mockRequest as AuthRequest,
				mockResponse as Response,
				mockNext
			);

			// Expect the auth error
			expect(mockResponse.status).toHaveBeenCalledWith(401);
			expect(mockResponse.json).toHaveBeenCalledWith({
				message: "Authentication required",
			});
		});

		// Test validation failure
		it("should return 400 if validation fails", async () => {
			// Mock validation failing
			mockedValidationResult.mockReturnValue({
				isEmpty: () => false,
				array: () => [
					{
						msg: "Page must be a positive integer",
					} as ValidationError,
				],
			});

			mockRequest.query = { page: "-1" };

			await searchController.searchUsers(
				mockRequest as AuthRequest,
				mockResponse as Response,
				mockNext
			);

			// Expect the error response
			expect(mockResponse.status).toHaveBeenCalledWith(400);
			expect(mockResponse.json).toHaveBeenCalledWith({
				errors: [{ msg: "Page must be a positive integer" }],
			});
		});

		// Test API error
		it("should handle API error", async () => {
			// Mock validation passing
			mockedValidationResult.mockReturnValue({
				isEmpty: () => true,
				array: () => [],
			});
			// Mock an API error
			(axios.get as jest.Mock).mockRejectedValue({
				response: { status: 500, data: { message: "Server error" } },
			});

			mockRequest.query = { query: "joel" };

			await searchController.searchUsers(
				mockRequest as AuthRequest,
				mockResponse as Response,
				mockNext
			);

			// Expect the error response
			expect(mockResponse.status).toHaveBeenCalledWith(500);
			expect(mockResponse.json).toHaveBeenCalledWith({
				message: "Server error",
				error: undefined,
			});
		});

		// Test error without response
		it("should handle error without response", async () => {
			// Mock validation passing
			mockedValidationResult.mockReturnValue({
				isEmpty: () => true,
				array: () => [],
			});
			// Mock a raw error
			(axios.get as jest.Mock).mockRejectedValue(
				new Error("Network error")
			);

			mockRequest.query = { query: "joel" };

			await searchController.searchUsers(
				mockRequest as AuthRequest,
				mockResponse as Response,
				mockNext
			);

			// Expect the fallback error response
			expect(mockResponse.status).toHaveBeenCalledWith(500);
			expect(mockResponse.json).toHaveBeenCalledWith({
				message: "Error searching users",
				error: "Network error",
			});
		});
	});

	describe("searchReviews", () => {
		// Test searching reviews with query
		it("should search reviews with query", async () => {
			// Mock validation passing
			mockedValidationResult.mockReturnValue({
				isEmpty: () => true,
				array: () => [],
			});
			// Mock API response with string fields
			(axios.get as jest.Mock).mockResolvedValue({
				data: [
					{
						Id: "1",
						UserId: "1",
						ProductId: "1",
						ReviewRating: "4",
						ReviewMessage: "Great beer",
						CreatedAt: "2023-01-01",
					},
					{
						Id: "2",
						UserId: "2",
						ProductId: "2",
						ReviewRating: "3",
						ReviewMessage: "Okay ale",
						CreatedAt: "2023-01-02",
					},
				],
			});

			mockRequest.query = { query: "great", page: "1", limit: "1" };

			await searchController.searchReviews(
				mockRequest as Request,
				mockResponse as Response,
				mockNext
			);

			// Check the API call
			expect(axios.get).toHaveBeenCalledWith(
				"http://localhost:5089/api/reviews",
				expect.any(Object)
			);
			// Expect filtered and paginated results
			expect(mockResponse.status).toHaveBeenCalledWith(200);
			expect(mockResponse.json).toHaveBeenCalledWith({
				results: [
					{
						Id: 1,
						UserId: 1,
						ProductId: 1,
						ReviewRating: 4,
						ReviewMessage: "Great beer",
						CreatedAt: "2023-01-01",
					},
				],
				total: 1,
			});
		});

		// Test validation failure
		it("should return 400 if validation fails", async () => {
			// Mock validation failing
			mockedValidationResult.mockReturnValue({
				isEmpty: () => false,
				array: () => [
					{
						msg: "Limit must be a positive integer",
					} as ValidationError,
				],
			});

			mockRequest.query = { limit: "-5" };

			await searchController.searchReviews(
				mockRequest as Request,
				mockResponse as Response,
				mockNext
			);

			// Expect the error response
			expect(mockResponse.status).toHaveBeenCalledWith(400);
			expect(mockResponse.json).toHaveBeenCalledWith({
				errors: [{ msg: "Limit must be a positive integer" }],
			});
		});

		// Test API error
		it("should handle API error", async () => {
			// Mock validation passing
			mockedValidationResult.mockReturnValue({
				isEmpty: () => true,
				array: () => [],
			});
			// Mock an API error
			(axios.get as jest.Mock).mockRejectedValue({
				response: { status: 500, data: { message: "Server error" } },
			});

			mockRequest.query = { query: "great" };

			await searchController.searchReviews(
				mockRequest as Request,
				mockResponse as Response,
				mockNext
			);

			// Expect the error response
			expect(mockResponse.status).toHaveBeenCalledWith(500);
			expect(mockResponse.json).toHaveBeenCalledWith({
				message: "Server error",
				error: undefined,
			});
		});

		// Test error without response
		it("should handle error without response", async () => {
			// Mock validation passing
			mockedValidationResult.mockReturnValue({
				isEmpty: () => true,
				array: () => [],
			});
			// Mock a raw error
			(axios.get as jest.Mock).mockRejectedValue(
				new Error("Network error")
			);

			mockRequest.query = { query: "great" };

			await searchController.searchReviews(
				mockRequest as Request,
				mockResponse as Response,
				mockNext
			);

			// Expect the fallback error response
			expect(mockResponse.status).toHaveBeenCalledWith(500);
			expect(mockResponse.json).toHaveBeenCalledWith({
				message: "Error searching reviews",
				error: "Network error",
			});
		});
	});
});
