#!/usr/bin/env bun

/**
 * This script sets up the D1 database for the @celestial-rose/stack.
 * It creates a new D1 database and updates the wrangler.jsonc files with the database ID and name.
 * It also updates the package.json file to use the same database name in the migrate scripts.
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

// Create the scripts directory if it doesn't exist
if (!fs.existsSync("scripts")) {
    fs.mkdirSync("scripts");
}

console.log("🌹 Setting up @celestial-rose/stack D1 database...");

// Function to get user input
async function prompt(question: string, defaultValue?: string): Promise<string> {
    const defaultText = defaultValue ? ` (default: ${defaultValue})` : "";
    process.stdout.write(`${question}${defaultText}: `);

    const result = await new Promise<string>((resolve) => {
        process.stdin.once("data", (data) => {
            resolve(data.toString().trim());
        });
    });

    return result || defaultValue || "";
}

try {
    // Check if the user is logged in to Cloudflare
    console.log("Checking Cloudflare login status...");
    try {
        execSync("bunx wrangler whoami", { stdio: "pipe" });
        console.log("✅ You are logged in to Cloudflare");
    } catch (_error) {
        console.log("❌ You are not logged in to Cloudflare");
        console.log("Please login to Cloudflare using:");
        console.log("bunx wrangler login");
        process.exit(1);
    }

    // Prompt for database name
    const dbName = await prompt("Enter the database name", "celestial-db");

    // Create a new D1 database
    console.log(`Creating D1 database with name: ${dbName}...`);
    const result = execSync(`bunx wrangler d1 create ${dbName}`).toString();
    console.log(result);

    // Extract the database ID from the result
    const databaseIdMatch = result.match(/"database_id":\s*"([^"]+)"/);
    if (!databaseIdMatch) {
        throw new Error("Could not extract database ID from wrangler output");
    }

    const databaseId = databaseIdMatch[1];
    console.log(`Database ID: ${databaseId}`);

    // Copy wrangler example files to their real versions if they don't exist
    const wranglerFiles: string[] = ["wrangler.jsonc", "packages/api/wrangler.jsonc", "packages/web/wrangler.jsonc"];

    // Update the wrangler.jsonc files with the database ID and name
    for (const realFile of wranglerFiles) {
        const exampleFile = `${realFile}.example`;
        const examplePath = path.join(process.cwd(), exampleFile);
        const realPath = path.join(process.cwd(), realFile);

        if (fs.existsSync(examplePath) && !fs.existsSync(realPath)) {
            console.log(`Copying ${exampleFile} to ${realFile}...`);
            fs.copyFileSync(examplePath, realPath);
        }
    }

    for (const wranglerFile of wranglerFiles) {
        console.log(`Updating ${wranglerFile}...`);
        const wranglerPath = path.join(process.cwd(), wranglerFile);

        if (fs.existsSync(wranglerPath)) {
            let wranglerContent = fs.readFileSync(wranglerPath, "utf-8");
            wranglerContent = wranglerContent.replace(/"database_id"\s*:\s*"[^"]*"/, `"database_id": "${databaseId}"`);
            wranglerContent = wranglerContent.replace(/"database_name"\s*:\s*"[^"]*"/, `"database_name": "${dbName}"`);
            fs.writeFileSync(wranglerPath, wranglerContent);
        }
    }

    // Update package.json to replace [DB-NAME] with the actual database name in migrate commands
    console.log("Updating package.json migrate commands...");
    const packageJsonPath = path.join(process.cwd(), "package.json");

    if (fs.existsSync(packageJsonPath)) {
        let packageJsonContent = fs.readFileSync(packageJsonPath, "utf-8");
        packageJsonContent = packageJsonContent.replace(/\[DB-NAME\]/g, dbName);
        fs.writeFileSync(packageJsonPath, packageJsonContent);
        console.log("✅ Updated migrate commands in package.json");
    }

    console.log("✅ D1 database setup complete!");
    console.log(`Database name: ${dbName}`);
    console.log(`Database ID: ${databaseId}`);
    console.log("Next steps:");
    console.log("1. Run `bun dev` to start the development server");
    console.log("2. Visit http://localhost:3000 to see your app");
    process.exit(0);
} catch (error) {
    console.error("❌ Error setting up D1 database:", error instanceof Error ? error.message : String(error));
    process.exit(1);
}
