// Define Liveblocks types for your application
// https://liveblocks.io/docs/api-reference/liveblocks-react#Typing-your-data
declare global {
  interface Liveblocks {
    // Each user's Presence, for useMyPresence, useOthers, etc.
    Presence: {
      cursor: { x: number; y: number } | null;
      thinking: boolean;
    };

    // The Storage tree for the room, for useMutation, useStorage, etc.
    // Storage: {
    //   // Example, a conflict-free list
    //   animals: LiveList<string>;
    // };

    // Custom user info set when authenticating with a secret key
    UserMeta: {
      id: string;
      info: {
        name: string;
        avatar: string;
        color: string;
      };
    };

    // Custom events, for useBroadcastEvent, useEventListener
    RoomEvent:
      | {
          type: "AI_STATUS";
          message: string;
          status: "started" | "processing" | "completed" | "error";
          text?: string;
        }
      | { type: "AI_ACTIONS"; actions: import("@/lib/ai-canvas-actions").CanvasAction[] };

    // Custom metadata set on threads, for useThreads, useCreateThread, etc.
    // ThreadMetadata: {
    //   // Example, attaching coordinates to a thread
    //   // x: number;
    //   // y: number;
    // };
    //

    // Custom room info set with resolveRoomsInfo, for useRoomInfo
    // RoomInfo: {
    //   // Example, rooms with a title and url
    //   // title: string;
    //   // url: string;
    // };

    // Custom feed message data for ai-chat feed
    FeedMessageData: {
      sender: string;
      role: "user" | "assistant";
      content: string;
      timestamp: number;
    };
  }
}

export {};
