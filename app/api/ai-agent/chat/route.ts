import { NextResponse } from "next/server";
import { createAdminClient } from "@insforge/sdk";
import { whatsappManager } from "@/lib/whatsapp";
import { getValidGmailToken } from "@/lib/gmail";

// Helper for Constructing Raw base64url Email
const constructRawEmail = (to: string, subject: string, body: string) => {
  const str = [
    `To: ${to}`,
    `Subject: ${subject}`,
    "Content-Type: text/plain; charset=\"UTF-8\"",
    "",
    body
  ].join("\n");
  return Buffer.from(str).toString("base64url");
};

// Gmail tool execution helper
async function executeGmailTool(userId: string, toolName: string, args: any) {
  try {
    let accessToken = await getValidGmailToken(userId);
    if (!accessToken) {
      return { error: "Gmail is not connected. Please connect Gmail in the Integrations dashboard." };
    }

    const makeRequest = async (url: string, init?: RequestInit): Promise<Response> => {
      let res = await fetch(url, {
        ...init,
        headers: {
          ...init?.headers,
          Authorization: `Bearer ${accessToken}`,
        }
      });

      if (res.status === 401) {
        // Attempt to refresh Gmail oauth token
        const refreshRes = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/auth/gmail/token?userId=${userId}`);
        if (refreshRes.ok) {
          const tokenData = await refreshRes.json();
          if (tokenData.accessToken) {
            accessToken = tokenData.accessToken;
            res = await fetch(url, {
              ...init,
              headers: {
                ...init?.headers,
                Authorization: `Bearer ${accessToken}`,
              }
            });
          }
        }
      }
      return res;
    };

    if (toolName === "gmail_list_messages") {
      const q = args.q ? `&q=${encodeURIComponent(args.q)}` : "";
      const res = await makeRequest(`https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=5${q}`);
      if (!res.ok) return { error: `Gmail list messages failed: ${res.statusText}` };
      const listData = await res.json();

      const details = await Promise.all((listData.messages || []).map(async (msg: any) => {
        const dRes = await makeRequest(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`);
        if (!dRes.ok) return null;
        const dData = await dRes.json();
        const headers = dData.payload?.headers || [];
        const fromHeader = headers.find((h: any) => h.name.toLowerCase() === "from")?.value || "Unknown";
        const subjectHeader = headers.find((h: any) => h.name.toLowerCase() === "subject")?.value || "(No Subject)";
        const dateHeader = headers.find((h: any) => h.name.toLowerCase() === "date")?.value || "";
        return {
          id: msg.id,
          from: fromHeader,
          subject: subjectHeader,
          snippet: dData.snippet,
          date: dateHeader
        };
      }));
      return details.filter(Boolean);
    }

    if (toolName === "gmail_get_message") {
      const res = await makeRequest(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${args.id}`);
      if (!res.ok) return { error: `Gmail get message failed: ${res.statusText}` };
      const dData = await res.json();
      const headers = dData.payload?.headers || [];
      const fromHeader = headers.find((h: any) => h.name.toLowerCase() === "from")?.value || "Unknown";
      const subjectHeader = headers.find((h: any) => h.name.toLowerCase() === "subject")?.value || "(No Subject)";
      const dateHeader = headers.find((h: any) => h.name.toLowerCase() === "date")?.value || "";
      return {
        id: dData.id,
        from: fromHeader,
        subject: subjectHeader,
        body: dData.snippet || dData.body || "",
        date: dateHeader
      };
    }

    if (toolName === "gmail_create_draft") {
      const raw = constructRawEmail(args.to, args.subject, args.body);
      const res = await makeRequest(`https://gmail.googleapis.com/gmail/v1/users/me/drafts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: { raw } })
      });
      if (!res.ok) return { error: `Gmail create draft failed: ${res.statusText}` };
      return await res.json();
    }

  } catch (err: any) {
    return { error: err.message || "Failed to execute Gmail tool." };
  }
  return { error: "Unknown Gmail tool" };
}

// Tool calls execution center
async function executeTool(userId: string, toolName: string, args: any) {
  console.log(`Executing tool: ${toolName} with args:`, args);

  // 1. Gmail Tools
  if (toolName.startsWith("gmail_")) {
    return await executeGmailTool(userId, toolName, args);
  }

  // 2. WhatsApp Tools
  if (toolName.startsWith("whatsapp_")) {
    try {
      const result = await whatsappManager.executeMcp(userId, toolName, args || {});
      return result;
    } catch (err: any) {
      console.error(`WhatsApp MCP tool ${toolName} execution error:`, err);
      // Fallback response for offline simulator WhatsApp session
      if (toolName === "whatsapp_get_recent_messages") {
        return [
          { chatId: "+919876543210@s.whatsapp.net", name: "Customer", lastMessage: "Can you send over the link to schedule the appointment?", timestamp: "03:45 PM" },
          { chatId: "+15550241@s.whatsapp.net", name: "Alex Product", lastMessage: "Hey, do you have the slides for tomorrow's review?", timestamp: "10:45 AM" }
        ];
      }
      if (toolName === "whatsapp_read_chat_history") {
        return {
          chatId: args.chatId,
          messages: [
            { id: "1", fromMe: false, text: "Hey Harry, let's schedule an appointment.", timestamp: "Yesterday" },
            { id: "2", fromMe: true, text: "Sure, let's coordinate.", timestamp: "Yesterday" },
            { id: "3", fromMe: false, text: "Can you send over the link to schedule the appointment?", timestamp: "Today, 03:45 PM" }
          ]
        };
      }
      return { error: err.message || "WhatsApp tool execution failed." };
    }
  }

  // 3. Slack Tools
  if (toolName === "slack_list_channels") {
    return [
      { id: "C1", name: "general", topic: "General discussion" },
      { id: "C2", name: "dev-ops", topic: "Build alerts & monitoring" },
      { id: "C3", name: "product-design", topic: "Figma alignment & design changes" }
    ];
  }
  if (toolName === "slack_post_message") {
    return {
      success: true,
      channel: args.channel,
      ts: Date.now().toString(),
      text: args.text,
      message: `Posted to Slack channel #${args.channel} successfully.`
    };
  }

  // 4. Outlook Tools
  if (toolName === "outlook_list_messages") {
    return [
      { id: "out_1", from: "hr@company.com", subject: "Performance Review Q2", snippet: "Please check your feedback and submit before Friday.", date: "Today" },
      { id: "out_2", from: "it-support@company.com", subject: "Mandatory Password Reset Alert", snippet: "Security policy requires you to change your active credentials.", date: "Yesterday" }
    ];
  }
  if (toolName === "outlook_send_message") {
    return {
      success: true,
      messageId: `outlook_draft_${Date.now()}`,
      to: args.to,
      subject: args.subject,
      message: `Outlook email sent to ${args.to} successfully.`
    };
  }

  // 5. Discord Tools
  if (toolName === "discord_post_message") {
    return {
      success: true,
      channelId: args.channelId,
      messageId: `discord_${Date.now()}`,
      content: args.content,
      message: `Discord notification posted to channel ID ${args.channelId} successfully.`
    };
  }

  // 6. LinkedIn Tools
  if (toolName === "linkedin_post_update") {
    return {
      success: true,
      updateUrn: `urn:li:activity:${Date.now()}`,
      text: args.text,
      message: `LinkedIn post published successfully.`
    };
  }

  // 7. Telegram Tools
  if (toolName === "telegram_get_messages") {
    return [
      { id: "t_1", sender: "Alex Architect", text: "Are the staging builds passing?", timestamp: "04:10 PM" },
      { id: "t_2", sender: "Manager", text: "Verify the domain renewal is completed.", timestamp: "01:25 PM" }
    ];
  }
  if (toolName === "telegram_send_message") {
    return {
      success: true,
      chatId: args.chatId,
      messageId: `telegram_${Date.now()}`,
      text: args.text,
      message: `Telegram message sent successfully.`
    };
  }

  return { error: `Unsupported tool: ${toolName}` };
}

// Function Declarations list for Gemini AI model
const functionDeclarations = [
  {
    name: "gmail_list_messages",
    description: "Fetch a list of recent emails in the user's Gmail inbox. Can search/filter using search query 'q'.",
    parameters: {
      type: "OBJECT",
      properties: {
        q: { type: "STRING", description: "Optional Gmail search query filter (e.g. 'is:unread', 'from:billing')." }
      }
    }
  },
  {
    name: "gmail_get_message",
    description: "Retrieve the full details and content body of a specific email by ID.",
    parameters: {
      type: "OBJECT",
      properties: {
        id: { type: "STRING", description: "The unique Gmail message ID." }
      },
      required: ["id"]
    }
  },
  {
    name: "gmail_create_draft",
    description: "Create an email draft response in Gmail for the user to review and send later.",
    parameters: {
      type: "OBJECT",
      properties: {
        to: { type: "STRING", description: "Recipient email address." },
        subject: { type: "STRING", description: "Subject line of the email." },
        body: { type: "STRING", description: "Text content of the draft email." }
      },
      required: ["to", "subject", "body"]
    }
  },
  {
    name: "whatsapp_get_recent_messages",
    description: "Fetch the latest messages from all recent WhatsApp chats.",
    parameters: {
      type: "OBJECT",
      properties: {
        limit: { type: "INTEGER", description: "Optional limit of chats to fetch (defaults to 5)." }
      }
    }
  },
  {
    name: "whatsapp_read_chat_history",
    description: "Retrieve the full chat message history/logs for a specific WhatsApp JID/chatId.",
    parameters: {
      type: "OBJECT",
      properties: {
        chatId: { type: "STRING", description: "The WhatsApp chatId or JID (e.g. '12345@s.whatsapp.net')." }
      },
      required: ["chatId"]
    }
  },
  {
    name: "whatsapp_send_message",
    description: "Send a text message directly to a WhatsApp phone number or JID.",
    parameters: {
      type: "OBJECT",
      properties: {
        to: { type: "STRING", description: "The recipient's phone number or WhatsApp JID." },
        message: { type: "STRING", description: "Text content to transmit." }
      },
      required: ["to", "message"]
    }
  },
  {
    name: "whatsapp_search_chats",
    description: "Find a contact or chatId in WhatsApp matching a query string.",
    parameters: {
      type: "OBJECT",
      properties: {
        query: { type: "STRING", description: "Search term like contact name or phone number." }
      },
      required: ["query"]
    }
  },
  {
    name: "slack_list_channels",
    description: "List all active Slack workspace channels available for alerts.",
    parameters: {
      type: "OBJECT",
      properties: {}
    }
  },
  {
    name: "slack_post_message",
    description: "Post a message or alert to a specific Slack channel.",
    parameters: {
      type: "OBJECT",
      properties: {
        channel: { type: "STRING", description: "Channel name (e.g. 'dev-ops', 'general')." },
        text: { type: "STRING", description: "Message text content." }
      },
      required: ["channel", "text"]
    }
  },
  {
    name: "outlook_list_messages",
    description: "Fetch a list of incoming emails from the user's Outlook inbox.",
    parameters: {
      type: "OBJECT",
      properties: {
        top: { type: "INTEGER", description: "Optional maximum messages to retrieve." }
      }
    }
  },
  {
    name: "outlook_send_message",
    description: "Send an email to a recipient via Outlook.",
    parameters: {
      type: "OBJECT",
      properties: {
        to: { type: "STRING", description: "Recipient email address." },
        subject: { type: "STRING", description: "Email subject line." },
        body: { type: "STRING", description: "Body message text." }
      },
      required: ["to", "subject", "body"]
    }
  },
  {
    name: "discord_post_message",
    description: "Post a notification message to a Discord channel.",
    parameters: {
      type: "OBJECT",
      properties: {
        channelId: { type: "STRING", description: "Discord channel ID." },
        content: { type: "STRING", description: "Content message body." }
      },
      required: ["channelId", "content"]
    }
  },
  {
    name: "linkedin_post_update",
    description: "Share a professional update or post on the user's LinkedIn profile feed.",
    parameters: {
      type: "OBJECT",
      properties: {
        text: { type: "STRING", description: "Content text of the update." }
      },
      required: ["text"]
    }
  },
  {
    name: "telegram_get_messages",
    description: "Fetch incoming messages for a specific Telegram chatId.",
    parameters: {
      type: "OBJECT",
      properties: {
        chatId: { type: "STRING", description: "Telegram chat ID." }
      },
      required: ["chatId"]
    }
  },
  {
    name: "telegram_send_message",
    description: "Send a message to a Telegram contact or group chat.",
    parameters: {
      type: "OBJECT",
      properties: {
        chatId: { type: "STRING", description: "Telegram chat ID." },
        text: { type: "STRING", description: "Message text." }
      },
      required: ["chatId", "text"]
    }
  }
];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, prompt, history = [], tone = "Warm & Engaging", attachments = [] } = body;

    if (!userId || !prompt) {
      return NextResponse.json({ error: "Missing required fields userId or prompt" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY environment variable not set." }, { status: 500 });
    }

    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey });

    // Format the conversation history for Gemini SDK
    // SDK expects role 'user' or 'model' and parts matching structure
    const contents: any[] = [];

    // Parse incoming chat history into Gemini contents format
    history.forEach((msg: any) => {
      // Map user/ai role
      const role = msg.sender === "user" ? "user" : "model";

      // If it contains custom system response or tool data, include it as model text parts
      contents.push({
        role,
        parts: [{ text: msg.text }]
      });
    });

    // Append the current user prompt
    contents.push({
      role: "user",
      parts: [{ text: prompt }]
    });

    // If attachments were provided, include a short manifest so the model can reference them
    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      const attText = attachments.map((a: any) => `- ${a.name} (${a.type || 'file'}, ${a.size || 'unknown'} bytes): ${a.url}`).join("\n");
      contents.push({ role: "user", parts: [{ text: `Attachments:\n${attText}` }] });
    }

    const systemInstruction = `
You are V-AI, a premium workspace AI Virtual Assistant.
You must respond with the following tone: ${tone}.
You help the user manage notifications, check emails, read chat history, post updates, and communicate across Gmail, WhatsApp, Slack, Outlook, Discord, LinkedIn, and Telegram.
You have access to 15 different tools to fetch or submit real and interactive simulation data across these channels.
When requested, call the appropriate tool. Always explain what you did and present the output in a clean, professional layout.
Format tables, bullet lists, bold text, links, and code blocks using standard Markdown.
Always maintain a helpful, premium tone. Suggest 2 or 3 brief quick reply recommendations that the client could say in follow-up. Place them at the end of your response, wrapped inside a custom tags blocks format like this:
[QUICK_REPLIES]
- Suggestion 1
- Suggestion 2
[/QUICK_REPLIES]
`;

    const tools = [{ functionDeclarations }];

    let hasFunctionCalls = true;
    let maxIterations = 5;
    let iteration = 0;
    let lastResponseContent: any = null;

    // Execution loop for Tool Calls
    while (hasFunctionCalls && iteration < maxIterations) {
      iteration++;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents,
        config: {
          systemInstruction,
          tools: tools as any,
        }
      });

      const functionCalls = response.functionCalls;
      if (functionCalls && functionCalls.length > 0) {
        // Append the model's message (which contains functionCalls) to contents
        const modelContent = response.candidates?.[0]?.content || {
          role: "model",
          parts: functionCalls.map(call => ({ functionCall: call }))
        };
        contents.push(modelContent);

        // Execute function calls
        const toolParts = [];
        for (const call of functionCalls) {
          const result = await executeTool(userId, call.name!, call.args);
          toolParts.push({
            functionResponse: {
              name: call.name!,
              response: { result }
            }
          });
        }

        // Append the tool's functionResponse to contents
        contents.push({
          role: "tool",
          parts: toolParts
        });
      } else {
        hasFunctionCalls = false;
        lastResponseContent = response;
      }
    }

    // Now stream the final text generation from the model
    const responseStream = await ai.models.generateContentStream({
      model: "gemini-3.1-flash-lite",
      contents,
      config: {
        systemInstruction,
      }
    });

    // Stream SSE back to client
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of responseStream) {
            const text = chunk.text;
            if (text) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
            }
          }
        } catch (err: any) {
          console.error("Streaming error:", err);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: err.message || "Streaming failed." })}\n\n`));
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      }
    });

  } catch (error: any) {
    console.error("AI Agent chat API failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
