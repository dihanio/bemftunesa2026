import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Check if the application is running
    const uptime = process.uptime();

    // Check environment
    const nodeEnv = process.env.NODE_ENV || "development";

    // Check API connectivity (optional)
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    let apiStatus = "unknown";

    if (apiUrl) {
      try {
        const response = await fetch(`${apiUrl}/health`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          signal: AbortSignal.timeout(5000), // 5 second timeout
        });
        apiStatus = response.ok ? "connected" : "disconnected";
      } catch (error) {
        apiStatus = "disconnected";
      }
    }

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: Math.floor(uptime),
      environment: nodeEnv,
      service: "public-frontend",
      version: process.env.npm_package_version || "1.0.0",
      dependencies: {
        api: apiStatus,
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024), // MB
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024), // MB
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 },
    );
  }
}
