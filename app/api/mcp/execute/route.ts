import { NextResponse } from "next/server";
import { executeMcpTool } from "@/lib/mcpApps";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, platformId, toolName, args } = body;

    if (!userId || !platformId || !toolName) {
      return NextResponse.json(
        { error: "Missing required parameters: userId, platformId, toolName" },
        { status: 400 }
      );
    }

    try {
      const result = await executeMcpTool(userId, platformId, toolName, args || {});
      return NextResponse.json({
        success: true,
        result,
      });
    } catch (err: any) {
      console.error(`MCP tool execution error [${platformId} -> ${toolName}]:`, err.message);
      return NextResponse.json(
        { success: false, error: err.message || "Failed to execute tool" },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("MCP execution endpoint failed:", error);
    return NextResponse.json(
      { error: "Internal server error during MCP execution", details: error.message },
      { status: 500 }
    );
  }
}
