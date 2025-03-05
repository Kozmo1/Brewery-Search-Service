import express from "express";
import cors from "cors";
import dotenv from "dotenv-safe";
import searchRoutes from "./ports/rest/routes/search";
import { config } from "./config/config";


const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

dotenv.config({
    allowEmptyValues: true,
    path: `.env.${process.env.NODE_ENV || "local"}`,
    example: ".env.example",
});
const PORT = config.port;
app.use("healthcheck", (req, res) => {
    res.send("Saurons eye is watching you");
});

app.use("/search", searchRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});