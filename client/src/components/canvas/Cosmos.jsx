import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import * as PIXI from "pixi.js";
import io from "socket.io-client";
import axios from "axios";

const Cosmos = ({ setIsAuthenticated }) => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const canvasRef = useRef(null);
  const appRef = useRef(null);
  const userContainerRef = useRef(null);
  const otherUsersRef = useRef({});
  const socketRef = useRef(null);
  const proximityRingRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [showCopyToast, setShowCopyToast] = useState(false);

  const [position, setPosition] = useState({ x: 500, y: 400 });
  const [showPanel, setShowPanel] = useState("users");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [inProximity, setInProximity] = useState(false);
  const [proximityUser, setProximityUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [showProximityBanner, setShowProximityBanner] = useState(true);

  const SPEED = 5;
  const BOUNDS = { minX: 50, maxX: 1200, minY: 50, maxY: 700 };
  const keysPressed = useRef({});

  const sendMessage = () => {
    if (!inputMessage.trim()) return;
    if (!inProximity || !proximityUser) {
      alert("Not connected to anyone!");
      return;
    }

    socketRef.current.emit("chat:message", {
      toSocketId: proximityUser.withSocketId,
      message: inputMessage,
    });

    setInputMessage("");
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText("abc-123");
    setShowCopyToast(true);
    setTimeout(() => setShowCopyToast(false), 2000);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const [isInputFocused, setIsInputFocused] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();

      if (isInputFocused) return;

      keysPressed.current[key] = true;
      if (
        [
          "arrowup",
          "arrowdown",
          "arrowleft",
          "arrowright",
          "w",
          "a",
          "s",
          "d",
        ].includes(key)
      ) {
        e.preventDefault();
      }
    };

    const handleKeyUp = (e) => {
      const key = e.key.toLowerCase();
      if (isInputFocused) return;
      keysPressed.current[key] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isInputFocused]);

  // Initialize Socket.IO
  useEffect(() => {
    socketRef.current = io("http://localhost:5000");

    socketRef.current.on("connect", () => {
      console.log("Connected to server");
      socketRef.current.emit("user:join", {
        userId: user.id,
        name: user.name,
        color: user.color,
      });
    });

    socketRef.current.on("users:list", (users) => {
      setOnlineUsers(users);
    });

    socketRef.current.on("user:joined", (otherUser) => {
      setOnlineUsers((prev) => [...prev, otherUser]);
    });

    socketRef.current.on("user:moved", ({ socketId, position }) => {
      const otherUserSprite = otherUsersRef.current[socketId];
      if (otherUserSprite) {
        otherUserSprite.x = position.x;
        otherUserSprite.y = position.y;
      }
    });

    socketRef.current.on("user:left", (socketId) => {
      setOnlineUsers((prev) => prev.filter((u) => u.socketId !== socketId));
      if (otherUsersRef.current[socketId]) {
        otherUsersRef.current[socketId].destroy();
        delete otherUsersRef.current[socketId];
      }
    });

    socketRef.current.on("chat:message", (data) => {
      console.log("Message received:", data);
      setMessages((prev) => [...prev, data]);
    });

    socketRef.current.on("proximity:enter", async (data) => {
      setInProximity(true);
      setProximityUser(data);
      try {
        const response = await axios.get(
          `http://localhost:5000/api/messages/history/${data.withUserId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );
        if (response.data.success) {
          setMessages(response.data.messages);
        }
      } catch (error) {
        console.log("No chat history found");
      }
      if (userContainerRef.current && !proximityRingRef.current) {
        const ring = new PIXI.Graphics();
        ring.lineStyle(3, 0x4caf50, 1);
        ring.drawCircle(0, 0, 35);
        userContainerRef.current.addChildAt(ring, 0);
        proximityRingRef.current = ring;
        let pulse = 0;
        const animateRing = () => {
          if (!proximityRingRef.current) return;
          pulse += 0.05;
          const scale = 1 + Math.sin(pulse) * 0.15;
          proximityRingRef.current.scale.set(scale);
          requestAnimationFrame(animateRing);
        };
        animateRing();
        setShowProximityBanner(true);
      }
    });

    socketRef.current.on("proximity:leave", () => {
      setInProximity(false);
      setProximityUser(null);
      setMessages([]);
      if (proximityRingRef.current) {
        proximityRingRef.current.destroy();
        proximityRingRef.current = null;
      }
      setShowProximityBanner(true);
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  // Initialize PixiJS
  useEffect(() => {
    if (!canvasRef.current) return;

    const app = new PIXI.Application({
      width: window.innerWidth - 320,
      height: window.innerHeight - 56,
      backgroundColor: 0x0a0a0f,
      antialias: true,
    });
    canvasRef.current.appendChild(app.view);
    appRef.current = app;

    // Grid
    const gridGraphics = new PIXI.Graphics();
    for (let i = 0; i < 2000; i += 40) {
      for (let j = 0; j < 2000; j += 40) {
        gridGraphics.beginFill(0x2a2a3a);
        gridGraphics.drawCircle(i, j, 2);
        gridGraphics.endFill();
      }
    }
    app.stage.addChild(gridGraphics);

    // User avatar
    const container = new PIXI.Container();
    container.x = position.x;
    container.y = position.y;
    const avatar = new PIXI.Graphics();
    const colorNum = parseInt(user.color?.replace("#", "") || "FF6B6B", 16);
    avatar.beginFill(colorNum);
    avatar.drawCircle(0, 0, 25);
    avatar.endFill();
    avatar.beginFill(0xffffff, 0.2);
    avatar.drawCircle(-8, -8, 8);
    avatar.endFill();
    avatar.lineStyle(2, 0xffffff, 0.4);
    avatar.drawCircle(0, 0, 25);
    container.addChild(avatar);
    const initials = new PIXI.Text(user.name?.[0]?.toUpperCase() || "?", {
      fontSize: 20,
      fontWeight: "bold",
      fill: "#FFFFFF",
      dropShadow: true,
      dropShadowColor: "#000000",
      dropShadowAlpha: 0.5,
    });
    initials.anchor.set(0.5);
    container.addChild(initials);
    const nameText = new PIXI.Text(user.name || "You", {
      fontSize: 12,
      fill: "#FFFFFF",
      dropShadow: true,
      dropShadowColor: "#000000",
      dropShadowAlpha: 0.5,
    });
    nameText.anchor.set(0.5);
    nameText.y = 40;
    container.addChild(nameText);
    app.stage.addChild(container);
    userContainerRef.current = container;

    const handleResize = () => {
      app.renderer.resize(window.innerWidth - 320, window.innerHeight - 56);
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      app.destroy(true);
    };
  }, []);

  // Create other users when onlineUsers changes
  useEffect(() => {
    if (!appRef.current) return;
    onlineUsers.forEach((otherUser) => {
      if (
        otherUser.userId !== user.id &&
        !otherUsersRef.current[otherUser.socketId]
      ) {
        const container = new PIXI.Container();
        container.x = otherUser.position?.x || 500;
        container.y = otherUser.position?.y || 400;
        const avatar = new PIXI.Graphics();
        const colorNum = parseInt(
          otherUser.color?.replace("#", "") || "FF6B6B",
          16,
        );
        avatar.beginFill(colorNum);
        avatar.drawCircle(0, 0, 20);
        avatar.endFill();
        avatar.beginFill(0xffffff, 0.2);
        avatar.drawCircle(-8, -8, 8);
        avatar.endFill();
        avatar.lineStyle(2, 0xffffff, 0.4);
        avatar.drawCircle(0, 0, 25);
        container.addChild(avatar);
        const initials = new PIXI.Text(
          otherUser.name?.[0]?.toUpperCase() || "?",
          {
            fontSize: 20,
            fontWeight: "bold",
            fill: "#FFFFFF",
            dropShadow: true,
            dropShadowColor: "#000000",
            dropShadowAlpha: 0.5,
          },
        );
        initials.anchor.set(0.5);
        container.addChild(initials);
        const nameText = new PIXI.Text(otherUser.name || "User", {
          fontSize: 12,
          fill: "#FFFFFF",
          dropShadow: true,
          dropShadowColor: "#000000",
          dropShadowAlpha: 0.5,
        });
        nameText.anchor.set(0.5);
        nameText.y = 40;
        container.addChild(nameText);
        appRef.current.stage.addChild(container);
        otherUsersRef.current[otherUser.socketId] = container;
      }
    });
  }, [onlineUsers, user.id]);

  // Animation loop for movement
  useEffect(() => {
    let animationId;
    const animate = () => {
      let newX = position.x;
      let newY = position.y;
      if (keysPressed.current["arrowup"] || keysPressed.current["w"])
        newY -= SPEED;
      if (keysPressed.current["arrowdown"] || keysPressed.current["s"])
        newY += SPEED;
      if (keysPressed.current["arrowleft"] || keysPressed.current["a"])
        newX -= SPEED;
      if (keysPressed.current["arrowright"] || keysPressed.current["d"])
        newX += SPEED;
      newX = Math.max(BOUNDS.minX, Math.min(BOUNDS.maxX, newX));
      newY = Math.max(BOUNDS.minY, Math.min(BOUNDS.maxY, newY));
      if (newX !== position.x || newY !== position.y) {
        setPosition({ x: newX, y: newY });
        if (userContainerRef.current) {
          userContainerRef.current.x = newX;
          userContainerRef.current.y = newY;
        }
        if (socketRef.current) {
          socketRef.current.emit("user:move", { x: newX, y: newY });
        }
      }
      animationId = requestAnimationFrame(animate);
    };
    animate();
    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [position.x, position.y]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsAuthenticated(false);
    navigate("/login");
  };

  return (
    <div className="h-screen bg-gradient-to-br from-[#0A0A0F] to-[#0F0F1A] flex flex-col">
      <div className="h-14 glass border-b border-white/10 flex items-center justify-between px-6 z-10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-16xl">
              <img src="/image.png" alt="Cosmos Logo" className="w-12 h-8" />
            </span>
            <span className="text-white font-bold text-lg bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Cosmos
            </span>
          </div>
          <button
            onClick={copyRoomCode}
            className="group flex items-center gap-2 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full transition-all duration-300"
          >
            <span className="text-gray-400 text-sm group-hover:text-white transition">
              Room: abc-123
            </span>
            <span className="text-gray-500 text-xs"></span>
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-green-500/10 px-3 py-1.5 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-gray-300 text-sm">
              {onlineUsers.length} online
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="text-red-400 hover:text-red-300 transition-all px-3 py-1.5 rounded-full hover:bg-red-500/10"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Copy Toast */}
      {showCopyToast && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-green-500 text-black px-4 py-2 rounded-full text-sm font-semibold shadow-lg z-50 animate-fade-in">
          Room code copied!
        </div>
      )}

      {/* Canvas Area */}
      <div className="flex-1 relative overflow-hidden">
        <div ref={canvasRef} className="w-full h-full" />

        {/* Proximity Banner */}
        {inProximity && showProximityBanner && (
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-green-500 to-green-600 text-black px-4 py-2 rounded-full font-bold shadow-lg z-50 animate-fade-in flex items-center gap-3">
            <span>
              CONNECTED! You can now chat with {proximityUser?.withName}
            </span>
            <button
              onClick={() => setShowProximityBanner(false)}
              className="ml-2 w-6 h-6 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center transition"
            >
              ✕
            </button>
          </div>
        )}

        {/* Movement Controls */}
        <div className="absolute top-4 left-4 glass rounded-full px-4 py-2 text-xs text-gray-400"></div>
      </div>

      {/* Right Panel */}
      <div className="absolute right-0 top-14 bottom-0 w-80 glass-panel border-l border-white/10 flex flex-col z-20 animate-slide-in">
        <div className="p-4 border-b border-white/10">
          <div className="flex gap-2">
            <button
              onClick={() => setShowPanel("users")}
              className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 ${
                showPanel === "users"
                  ? "bg-gradient-to-r from-green-500/20 to-green-600/20 text-green-400 shadow-lg"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              👥 Users
            </button>
            <button
              onClick={() => setShowPanel("chat")}
              className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 ${
                showPanel === "chat"
                  ? "bg-gradient-to-r from-green-500/20 to-green-600/20 text-green-400 shadow-lg"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              💬 Chat
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {showPanel === "users" ? (
            <div>
              <div className="text-white text-sm font-semibold mb-3 flex items-center gap-2">
                <span> Online Explorers</span>
                <span className="text-xs text-gray-500">
                  ({onlineUsers.length})
                </span>
              </div>
              {onlineUsers.map((otherUser) => (
                <div
                  key={otherUser.socketId}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300 mb-2 group"
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg group-hover:scale-110 transition-transform duration-300"
                    style={{ backgroundColor: otherUser.color || "#FF6B6B" }}
                  >
                    {otherUser.name?.[0]?.toUpperCase()}
                  </div>
                  <span className="text-white text-sm flex-1 font-medium">
                    {otherUser.name}{" "}
                    {otherUser.userId === user.id && (
                      <span className="text-green-400 text-xs ml-1">(You)</span>
                    )}
                  </span>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-green-400 text-xs">Online</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col h-full">
              {inProximity && proximityUser ? (
                <>
                  <div className="bg-gradient-to-r from-green-500/20 to-green-600/20 p-3 rounded-xl mb-4 border border-green-500/30">
                    <p className="text-green-400 font-semibold text-center">
                      💬 Connected with {proximityUser.withName}
                    </p>
                  </div>

                  <div className="flex-1 overflow-y-auto mb-4 space-y-2">
                    {messages.length === 0 ? (
                      <div className="text-center text-gray-500 text-sm mt-8 animate-fade-in">
                        <p className="text-4xl mb-2">💭</p>
                        <p>No messages yet. Say hi!</p>
                      </div>
                    ) : (
                      messages.map((msg, idx) => (
                        <div
                          key={idx}
                          className={`flex ${msg.fromUserId === user.id ? "justify-end" : "justify-start"} animate-fade-in`}
                        >
                          <div
                            className="max-w-[80%] p-3 rounded-2xl shadow-lg transition-all hover:scale-[1.02]"
                            style={{
                              backgroundColor:
                                msg.fromUserId === user.id
                                  ? "#4CAF50"
                                  : "#2A2A3A",
                              color: "white",
                              borderBottomRightRadius:
                                msg.fromUserId === user.id ? "4px" : "16px",
                              borderBottomLeftRadius:
                                msg.fromUserId === user.id ? "16px" : "4px",
                            }}
                          >
                            <div className="text-xs opacity-75 mb-1">
                              {msg.fromName}
                            </div>
                            <div className="text-sm break-words">
                              {msg.message}
                            </div>
                            <div className="text-xs opacity-50 mt-1">
                              {msg.timestamp
                                ? new Date(msg.timestamp).toLocaleTimeString()
                                : "just now"}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="flex gap-2 mt-auto">
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                      onFocus={() => setIsInputFocused(true)}
                      onBlur={() => setIsInputFocused(false)}
                      placeholder="Type a message..."
                      className="flex-1 bg-[#0A0A0F] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 transition-all"
                    />
                    <button
                      onClick={sendMessage}
                      className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-5 py-2.5 rounded-xl transition-all duration-300 transform hover:scale-105"
                    >
                      Send
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center text-gray-500 mt-8 animate-fade-in">
                  <p className="text-5xl mb-4">💬</p>
                  <p className="font-medium">Move closer to someone</p>
                  <p className="text-sm mt-2 text-gray-600">
                    to start chatting
                  </p>
                  <div className="mt-6 w-12 h-12 mx-auto border-2 border-green-500/30 rounded-full animate-pulse"></div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Cosmos;
