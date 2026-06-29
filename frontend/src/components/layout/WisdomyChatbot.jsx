import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { 
  MessageSquare, 
  X, 
  Send, 
  Lock,
  Camera,
  AlertCircle
} from "lucide-react";
import "./WisdomyChatbot.css";
import { getStoredUserInfo } from "../../utils/userInfo";

const WisdomyChatbot = () => {
  const location = useLocation();
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const isHiddenRoute = location.pathname === "/" || location.pathname === "/admin";

  // Route check
  const isStudentRoute = location.pathname.startsWith("/student");
  const isDisabledRoute = 
    location.pathname.includes("/assignment-detail/") || 
    location.pathname.includes("/mcq-test/");

  // States
  const [isOpen, setIsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [attachedImage, setAttachedImage] = useState(null); // base64 string
  const [user, setUser] = useState(null);

  // Initialize chatbot history and proactive alert
  useEffect(() => {
    if (!isStudentRoute) return;

    const userInfo = getStoredUserInfo();
    if (userInfo) {
      setUser(userInfo);
      const studentId = userInfo._id?.toString();
      const studentName = userInfo.name || "Student";
      const studentBatchId = userInfo.batchId?._id?.toString() || userInfo.batchId?.toString() || "";

      fetchStudentProgressAndInit(studentId, studentName, studentBatchId);
    } else {
      // Fallback greeting if userInfo is not loaded
      setMessages([{
        sender: "wisdomy",
        text: `Heyya, future engineering champ! 🚀 I'm **Wisdomy AI**, your Netwisdome companion! Let's learn MATLAB, Simulink, and Embedded C today! 😎`,
        timestamp: new Date()
      }]);
    }
  }, [isStudentRoute]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, isOpen]);

  // Fetch real-time completed/pending tasks and load chat history from MongoDB
  const fetchStudentProgressAndInit = async (studentId, studentName, studentBatchId) => {
    try {
      // 1. Fetch persistent chat history from MongoDB
      let historyFetched = false;
      const historyUrls = [
        `/api/ai/history/${studentId}`,
        `http://localhost:5055/api/ai/history/${studentId}`,
        `http://localhost:5000/api/ai/history/${studentId}`
      ];

      for (const url of historyUrls) {
        try {
          const res = await axios.get(url);
          if (res.data && res.data.success) {
            const parsedHistory = res.data.history.map(item => ({
              sender: item.sender,
              text: item.text,
              image: item.imageAttached ? "/placeholder-attached" : null, // Indicate image attached in database
              timestamp: new Date(item.timestamp)
            }));
            
            if (parsedHistory.length > 0) {
              setMessages(parsedHistory);
              historyFetched = true;
            }
            break;
          }
        } catch (e) {
          continue; // Try next URL fallback
        }
      }

      // 2. If no logs exist, fetch exact stats to trigger a proactive welcome alert!
      if (!historyFetched) {
        let pendingCount = 1;
        let completedCount = 0;

        try {
          const [asgnRes, subRes] = await Promise.all([
            axios.get('/api/assignments/all'),
            axios.get('/api/assignments/submissions/all')
          ]);

          const list = asgnRes.data || [];
          const submissions = subRes.data || [];

          // Count assignments for this student's batch
          const batchAssignments = list.filter(asgn => {
            const targetBatch = asgn.batchId?._id?.toString() || asgn.batchId?.toString();
            return targetBatch === studentBatchId;
          });

          // Count student's submissions
          const subCount = submissions.filter(sub => {
            const subStudent = sub.studentId?.toString();
            return subStudent === studentId;
          }).length;

          completedCount = subCount;
          pendingCount = Math.max(0, batchAssignments.length - subCount);
        } catch (e) {
          console.warn("Failed to retrieve real-time assignments stats, using defaults.", e.message);
        }

        // Call backend proactive alert endpoint
        const alertUrls = [
          "/api/ai/proactive-alert",
          "http://localhost:5055/api/ai/proactive-alert",
          "http://localhost:5000/api/ai/proactive-alert"
        ];

        for (const url of alertUrls) {
          try {
            const res = await axios.post(url, {
              studentId,
              studentName,
              pendingCount,
              completedCount
            });
            if (res.data && res.data.success) {
              setMessages([{
                sender: "wisdomy",
                text: res.data.reply,
                timestamp: new Date()
              }]);
              break;
            }
          } catch (e) {
            continue;
          }
        }
      }
    } catch (err) {
      console.error("Initialization error:", err.message);
      setMessages([{
        sender: "wisdomy",
        text: `Hey there, ${studentName}! 🚀 I'm **Wisdomy AI**, your Netwisdome buddy! Let's conquer some MATLAB, Simulink, and Embedded C challenges today! 💻🧠⚡`,
        timestamp: new Date()
      }]);
    }
  };

  // Convert uploaded image to Base64
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please upload a valid image file (PNG/JPG/JPEG)");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAttachedImage(reader.result); // Base64 Data URI
    };
    reader.readAsDataURL(file);
  };

  // Trigger camera file selector
  const triggerFileSelector = () => {
    fileInputRef.current?.click();
  };

  // Call Backend API Flow
  const callBackendAI = async (studentMsg, attachedImg) => {
    const studentId = user?._id?.toString() || "guest_student";
    const endpoints = [
      "/api/ai/chat",
      "http://localhost:5055/api/ai/chat",
      "http://localhost:5000/api/ai/chat"
    ];

    let lastError = null;

    for (const url of endpoints) {
      try {
        const response = await axios.post(url, {
          message: studentMsg,
          studentId,
          image: attachedImg // pass base64 screenshot
        });

        if (response.data && response.data.success) {
          return response.data.reply;
        }
      } catch (error) {
        lastError = error;
        console.warn(`Failed to connect to ${url}:`, error.message);
        continue;
      }
    }

    const errorMsg = lastError?.response?.data?.message || lastError?.message || "Connection refused";
    throw new Error(errorMsg);
  };

  // Handle message send
  const handleSend = async (textToSend) => {
    const messageText = textToSend || input;
    if (!messageText.trim() && !attachedImage) return;

    // Capture states locally
    const imgToSend = attachedImage;
    const msgText = messageText || "Troubleshoot this attached screenshot/diagram.";

    // Render user message visually in thread immediately
    const userMsg = {
      sender: "user",
      text: msgText,
      image: imgToSend, // locally render base64 preview
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setAttachedImage(null); // Clear preview chip
    setIsTyping(true);

    try {
      const reply = await callBackendAI(msgText, imgToSend);

      setMessages(prev => [
        ...prev,
        {
          sender: "wisdomy",
          text: reply,
          timestamp: new Date()
        }
      ]);
    } catch (error) {
      console.error("Wisdomy AI response error:", error);
      setMessages(prev => [
        ...prev,
        {
          sender: "wisdomy",
          text: `⚠️ **System Connection Error**: "${error.message}". \n\nPlease verify that the Netwisdome backend server is running and the \`GEMINI_API_KEY\` is loaded correctly in the backend \`.env\`! 🔌❌`,
          timestamp: new Date()
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // Simple Custom Markdown Parser
  const parseMarkdown = (text) => {
    if (!text) return "";
    
    let html = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt bridge;");

    // Code blocks
    html = html.replace(/```(?:[a-zA-Z0-9]+)?\n([\s\S]*?)\n```/g, '<pre class="chat-code-block"><code>$1</code></pre>');

    // Inline code
    html = html.replace(/`([^`\n]+)`/g, '<code class="chat-inline-code">$1</code>');

    // Bold
    html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

    // Bullet points
    html = html.replace(/^\s*-\s+(.+)$/gm, "<li>$1</li>");
    html = html.replace(/(<li>.*<\/li>)/s, "<ul>$1</ul>");

    // Paragraph breaks
    html = html.replace(/\n/g, "<br />");

    return { __html: html };
  };

  const handleQuickPrompt = (promptText) => {
    handleSend(promptText);
  };

  if (isHiddenRoute) {
    return null;
  }

  return (
    <div className="wisdomy-chatbot-wrapper">
      {/* Hidden file input for screenshot analysis */}
      <input 
        type="file" 
        accept="image/*" 
        ref={fileInputRef} 
        style={{ display: "none" }} 
        onChange={handleImageChange} 
      />

      {/* 1. FLOATING CHAT BUTTON */}
      <button 
        className={`wisdomy-float-btn ${isOpen ? "active" : ""} ${isDisabledRoute ? "disabled-lock" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        title={isDisabledRoute ? "Academic Integrity Mode Active!" : "Chat with Wisdomy AI!"}
      >
        {isDisabledRoute ? (
          <Lock className="lock-icon-pulse" size={24} />
        ) : isOpen ? (
          <X size={26} />
        ) : (
          <div className="btn-inner">
            <MessageSquare size={24} />
            <span className="pulse-ring"></span>
          </div>
        )}
      </button>

      {/* 2. CHAT WINDOW CONTAINER */}
      {isOpen && (
        <div className="wisdomy-chat-window animate-slide-up">
          {/* Header */}
          <div className="wisdomy-header">
            <div className="wisdomy-brand">
              <div className="avatar-wrap">
                <span className="avatar-initial">W</span>
                <span className="online-dot"></span>
              </div>
              <div className="brand-text">
                <h3>Wisdomy AI</h3>
                <span>Netwisdome Companion</span>
              </div>
            </div>
            
            <div className="header-actions">
              <button className="header-btn close" onClick={() => setIsOpen(false)}>
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Active Assessment Block (Disabled Mode) */}
          {isDisabledRoute ? (
            <div className="disabled-overlay animate-fade-in">
              <div className="overlay-card">
                <div className="overlay-icon">
                  <Lock size={48} />
                </div>
                <h3>Academic Integrity Mode Active 🔒</h3>
                <p className="funny-notice">
                  Aha! Trying to get Wisdomy to solve your active assessment? 😜 Nice try, boss! Netwisdome engineers use their own brilliant minds!
                </p>
                <p className="encouragement">
                  I'm officially sleeping to keep this exam 100% fair. Go crush it, show MATLAB who's boss, and I'll be waiting to celebrate with you! 🧠⚡
                </p>
                <button className="dismiss-btn" onClick={() => setIsOpen(false)}>
                  I'll do it myself! 💪
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Messages Feed */}
              <div className="chat-messages">
                {messages.map((msg, index) => (
                  <div key={index} className={`message-row ${msg.sender}`}>
                    <div className="message-bubble">
                      {/* Render uploaded image if present in message history */}
                      {msg.image && msg.image !== "/placeholder-attached" && (
                        <div className="message-image-wrap">
                          <img src={msg.image} alt="Uploaded screenshot" className="chat-message-img" />
                        </div>
                      )}
                      {msg.image === "/placeholder-attached" && (
                        <div className="message-image-placeholder">
                          📷 *[Screenshot Analyzed]*
                        </div>
                      )}
                      
                      <div 
                        className="message-text" 
                        dangerouslySetInnerHTML={parseMarkdown(msg.text)}
                      />
                      <span className="message-time">
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="message-row wisdomy typing">
                    <div className="message-bubble">
                      <div className="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompts List */}
              {messages.length === 1 && !isTyping && (
                <div className="quick-prompts-container">
                  <button className="prompt-chip" onClick={() => handleQuickPrompt("Tease me! 😜")}>
                    Tease me! 😜
                  </button>
                  <button className="prompt-chip" onClick={() => handleQuickPrompt("MATLAB vs Python 🥊")}>
                    MATLAB vs Python 🥊
                  </button>
                  <button className="prompt-chip" onClick={() => handleQuickPrompt("Simulink is hard! 😭")}>
                    Simulink is hard! 😭
                  </button>
                  <button className="prompt-chip" onClick={() => handleQuickPrompt("Embedded C Help 💻")}>
                    Embedded C Help 💻
                  </button>
                </div>
              )}

              {/* Image Preview thumbnail (shows right above input area when attached) */}
              {attachedImage && (
                <div className="attached-preview-wrapper animate-slide-up">
                  <div className="attached-thumbnail-card">
                    <img src={attachedImage} alt="Attachment thumbnail preview" />
                    <button className="remove-preview-btn" onClick={() => setAttachedImage(null)} title="Remove attachment">
                      <X size={12} />
                    </button>
                  </div>
                  <span className="attached-label">Screenshot Ready to Troubleshoot! 📷</span>
                </div>
              )}

              {/* Input form */}
              <form className="chat-input-area" onSubmit={(e) => { e.preventDefault(); handleSend(); }}>
                <button 
                  type="button" 
                  className="camera-btn" 
                  onClick={triggerFileSelector}
                  title="Upload screenshot or diagram"
                  disabled={isTyping}
                >
                  <Camera size={20} />
                </button>
                
                <input
                  type="text"
                  placeholder="Ask Wisdomy something..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isTyping}
                />
                
                <button type="submit" className="send-btn" disabled={(!input.trim() && !attachedImage) || isTyping}>
                  <Send size={18} />
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default WisdomyChatbot;
