import { config } from "../../config/config";

// Mock dotenv-safe to control env loading in tests
jest.mock("dotenv-safe", () => ({
	config: jest.fn((options) => {
		// Return empty parsed object if no file or path is weird
		if (!options.path || options.path.includes("nonexistent")) {
			return { parsed: {} };
		}
		return { parsed: process.env };
	}),
}));

describe("config", () => {
	// Reset modules before each test to reload config fresh
	beforeEach(() => {
		jest.resetModules();
	});

	// Test fallback values when env vars are missing
	it("should use fallback values if environment variables are not set", () => {
		// Stash the original env to restore later
		const originalEnv = { ...process.env };
		// Clear out env vars to hit fallbacks
		delete process.env.NODE_ENV;
		delete process.env.BREWERY_API_URL;
		delete process.env.PORT;
		delete process.env.JWT_SECRET;

		// Load config with no env vars
		const { config } = require("../../config/config");

		// Check each fallback kicks in
		expect(config.environment).toBe("development");
		expect(config.breweryApiUrl).toBe("http://localhost:5089");
		expect(config.port).toBe(3007);
		expect(config.jwtSecret).toBe("");

		// Restore the original env
		process.env = originalEnv;
	});

	// Test env vars overriding defaults
	it("should use environment variables when they are set", () => {
		// Store the original env
		const originalEnv = { ...process.env };
		// Set some custom values
		process.env.NODE_ENV = "production";
		process.env.BREWERY_API_URL = "https://api.brewery.com";
		process.env.PORT = "5000";
		process.env.JWT_SECRET = "custom-secret";

		// Load config with env vars
		const { config } = require("../../config/config");

		// Make sure it picks up the custom stuff
		expect(config.environment).toBe("production");
		expect(config.breweryApiUrl).toBe("https://api.brewery.com");
		expect(config.port).toBe(5000);
		expect(config.jwtSecret).toBe("custom-secret");

		// Restore the original env
		process.env = originalEnv;
	});

	// Test handling a missing .env file
	it("should handle missing .env file gracefully", () => {
		// Keep the original env safe
		const originalEnv = { ...process.env };
		// Set NODE_ENV to something odd and clear others
		process.env.NODE_ENV = "nonexistent";
		delete process.env.BREWERY_API_URL;
		delete process.env.PORT;
		delete process.env.JWT_SECRET;

		// Load config with no .env file
		const { config } = require("../../config/config");

		// Verify it uses NODE_ENV and falls back for the rest
		expect(config.environment).toBe("nonexistent");
		expect(config.breweryApiUrl).toBe("http://localhost:5089");
		expect(config.port).toBe(3007);
		expect(config.jwtSecret).toBe("");

		// Restore the original env
		process.env = originalEnv;
	});
});
