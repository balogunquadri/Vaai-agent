import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { LeadDocument } from "../models/Lead";
import { CampaignLaunchDocument } from "../models/CampaignLaunch";

let io: Server | null = null;

export function attachRealtime(server: HttpServer) {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket: Socket) => {
    const userId = socket.handshake.query.userId as string;
    if (userId) {
      socket.join(`user:${userId}`);
    }
  });
}

export function emitLeadUpdate(userId: string, lead: LeadDocument) {
  io?.to(`user:${userId}`).emit("lead:update", lead);
}

export function emitCampaignLaunchUpdate(userId: string, launch: CampaignLaunchDocument) {
  io?.to(`user:${userId}`).emit("campaignLaunch:update", launch);
}
