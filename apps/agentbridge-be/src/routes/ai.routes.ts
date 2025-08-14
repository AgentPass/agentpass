import { Router } from "express";
import {
  chatStream,
  generateCompletionHandler,
  generateObjectHandler,
  generateTemplateHandler,
  getAIConfig,
  streamAIAgentChatHandler,
  streamCompletionHandler,
} from "../controllers/ai.controller.js";
import { rateLimitMiddleware } from "../middlewares/rate-limit.middleware.js";
import { adminSessionMiddleware } from "../middlewares/session.middleware.js";

const router = Router();

// Apply authentication middleware to all AI routes
router.use(adminSessionMiddleware);

// Apply rate limiting to prevent abuse
const aiRateLimit = rateLimitMiddleware({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 requests per minute
  message: "Too many AI requests, please try again later",
});

// Chat endpoint with streaming support
router.post("/chat", aiRateLimit, chatStream);

// AI Agent Chat with centralized prompts (internal use)
router.post("/agent-chat", aiRateLimit, streamAIAgentChatHandler);

// Simple text completion endpoint
router.post("/completion", aiRateLimit, generateCompletionHandler);

// Streaming text completion with reasoning support
router.post("/stream-completion", aiRateLimit, streamCompletionHandler);

// Structured object generation endpoint
router.post("/generate-object", aiRateLimit, generateObjectHandler);

// Generate agent-optimized response template
router.post("/generate-template", aiRateLimit, generateTemplateHandler);

// Get AI configuration (available providers, models, etc.)
router.get("/config", getAIConfig);

// Simple test endpoint to verify OpenAI connection
router.get("/test", async (req, res) => {
  try {
    console.log("🧪 Testing OpenAI connection...");

    const { generateText } = await import("ai");
    const { openai } = await import("@ai-sdk/openai");

    const model = openai("gpt-4o");

    console.log("🔄 Calling generateText with simple test...");
    const result = await generateText({
      model,
      prompt: "Say hello in one word",
      maxRetries: 1,
    });

    console.log("✅ Test successful:", result.text);

    res.json({
      success: true,
      response: result.text,
      usage: result.usage,
    });
  } catch (error) {
    console.error("❌ Test failed:", error);

    // Enhanced error logging for the test endpoint
    if (error && typeof error === "object") {
      const errorObj = error as {
        status?: number;
        statusCode?: number;
        code?: number;
        message?: string;
        error?: { message?: string };
      };
      const statusCode = errorObj.status || errorObj.statusCode || errorObj.code;
      const message = errorObj.message || errorObj.error?.message || String(error);

      console.error(`🔍 Test error - Status: ${statusCode}, Message: ${message}`);

      if (statusCode === 429 || message.includes("429") || message.includes("quota") || message.includes("exceeded")) {
        console.error("💳 QUOTA EXCEEDED: You need to add billing/credits to your OpenAI account");
        return res.status(429).json({
          success: false,
          error: "QUOTA_EXCEEDED",
          message:
            "You've exceeded your OpenAI quota. Please check your billing at https://platform.openai.com/account/billing",
        });
      }
    }

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
