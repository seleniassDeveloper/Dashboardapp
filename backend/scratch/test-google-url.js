import { google } from "googleapis";
import dotenv from "dotenv";
dotenv.config();

const clientId = process.env.GOOGLE_CLIENT_ID || "test-client-id";
const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "test-client-secret";
const redirectUri = "http://localhost:3001/api/public/google/oauth-callback/aura-studio";

console.log("--- TEST 1: Positional arguments ---");
const client1 = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
console.log("URL 1:", client1.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: ["https://www.googleapis.com/auth/calendar"],
  state: "test-state"
}));

console.log("--- TEST 2: Options object ---");
const client2 = new google.auth.OAuth2({ clientId, clientSecret, redirectUri });
console.log("URL 2:", client2.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: ["https://www.googleapis.com/auth/calendar"],
  state: "test-state"
}));
