import { Server } from "socket.io";

let io;

export const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: [
                process.env.FRONTEND_URL, 
                process.env.ADMIN_URL, 
                "http://localhost:3000", 
                "http://localhost:3001"
            ].filter(Boolean),
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    console.log("Socket.io initialized with origins:", [
        process.env.FRONTEND_URL, 
        process.env.ADMIN_URL, 
        "http://localhost:3000", 
        "http://localhost:3001"
    ].filter(Boolean));

    io.on("connection", (socket) => {
        console.log("A user connected:", socket.id);

        socket.on("join", (userId) => {
            socket.join(userId);
            console.log(`User ${userId} joined their notification room`);
        });

        socket.on("join-admin", (adminId) => {
            socket.join("admin-room");
            if (adminId) {
                socket.join(adminId.toString());
            }
            console.log(`Admin ${adminId || ''} joined the admin notification rooms`);
        });

        socket.on("disconnect", () => {
            console.log("User disconnected:", socket.id);
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};
