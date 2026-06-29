const { GoogleGenerativeAI } = require("@google/generative-ai");
const ChatLog = require("../models/ChatLog");

// Wisdomy AI System Instructions & Engineering Personality guidelines
const WISDOMY_SYSTEM_INSTRUCTION = `You are "Wisdomy AI", the official AI Chatbot and Student Companion for the Netwisdome engineering learning platform.
Netwisdome offers premium, hands-on, industry-aligned training programs in MATLAB, Simulink, Embedded C, control systems, and electronics to bridge the academic-industry gap for modern engineering students.

Your character guidelines:
1. Act as a super smart, technically brilliant, extremely friendly, and witty engineering college friend. You love to joke around, tease the student gently (especially when they ask simple things, act lazy, or make funny mistakes), but you are ultimately their biggest cheerleader, motivator, and supporter.
2. Specialization: Focus deeply on MATLAB, Simulink, Embedded C, Electronics, Control Systems, Programming, and Engineering Career guidance. 
3. Never encourage cheating: If a student asks you to solve their exam, practical assignment, or test questions directly, refuse to do so in a friendly, teasing way (e.g. "Aha! Trying to get me to do your homework? 😜 No way, boss! Netwisdome engineers use their own brains! But I can explain the concepts so you can crush it yourself! 🧠⚡").
4. Explain concepts clearly: Break down complex mathematical/engineering concepts into easy-to-understand explanations with bullet points and clean formatting.
5. Use code snippets: Provide clear, well-documented code examples in MATLAB, C, or block layout concepts where helpful.
6. Use friendly student-style communication: Use light engineering slang, emojis (🚀, 🧠, ⚡, 💻, 😜, 😂, ⚙️), and friendly terms like "bro", "boss", "champ", "yaar" naturally where appropriate.
7. If asked about your creators, state that you were proudly developed by the Netwisdome team to support modern engineering students.`;

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Utility to parse base64 image strings from frontend FileReader
 */
function parseBase64Image(dataURI) {
  const matches = dataURI.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-+.]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error("Invalid base64 image data URI format");
  }
  return {
    mimeType: matches[1],
    data: matches[2]
  };
}

/**
 * Handle student chat request
 * POST /api/ai/chat
 */
exports.handleChat = async (req, res) => {
  try {
    const { message, studentId, image } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: "studentId is required for session logs.",
      });
    }

    // Get active generative model
    const model = genAI.getGenerativeModel({
      model: "gemini-flash-latest",
      systemInstruction: WISDOMY_SYSTEM_INSTRUCTION
    });

    // Setup input parts for Gemini (supports multimodal image input!)
    let parts = [];
    
    if (image) {
      try {
        const { mimeType, data } = parseBase64Image(image);
        parts.push({
          inlineData: {
            mimeType,
            data
          }
        });
        parts.push({ text: `Analyze this image in depth according to user request: ${message}` });
      } catch (err) {
        console.error("Base64 image parsing error:", err.message);
        parts.push({ text: message });
      }
    } else {
      parts.push({ text: message });
    }

    // Call Gemini API
    const result = await model.generateContent(parts);
    const responseText = result.response.text();

    // Save User Transaction to MongoDB
    await ChatLog.create({
      studentId,
      sender: 'user',
      text: message,
      imageAttached: !!image
    });

    // Save Wisdomy Transaction to MongoDB
    await ChatLog.create({
      studentId,
      sender: 'wisdomy',
      text: responseText
    });

    res.status(200).json({
      success: true,
      reply: responseText,
    });

  } catch (error) {
    console.error("Wisdomy AI Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "AI failed",
    });
  }
};

/**
 * Get Persistent Chat History
 * GET /api/ai/history/:studentId
 */
exports.getChatHistory = async (req, res) => {
  try {
    const { studentId } = req.params;
    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: "studentId parameter is required."
      });
    }

    // Load the last 30 messages, sorted ascending so they display chronologically
    const history = await ChatLog.find({ studentId })
      .sort({ timestamp: -1 })
      .limit(30);

    // Reverse to chronological order
    const orderedHistory = history.reverse();

    res.status(200).json({
      success: true,
      history: orderedHistory
    });

  } catch (error) {
    console.error("History Fetch Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to load chat history"
    });
  }
};

/**
 * Generate customized Proactive Learning Alerts
 * POST /api/ai/proactive-alert
 */
exports.handleProactiveAlert = async (req, res) => {
  try {
    const { studentId, studentName, pendingCount, completedCount } = req.body;

    if (!studentId || !studentName) {
      return res.status(400).json({
        success: false,
        message: "studentId and studentName are required."
      });
    }

    // Get active generative model
    const model = genAI.getGenerativeModel({
      model: "gemini-flash-latest",
      systemInstruction: WISDOMY_SYSTEM_INSTRUCTION
    });

    // Compose a highly tailored prompt based on actual student progress
    const prompt = `Generate a customized proactive, welcoming, and teasing student alert.
The student's name is ${studentName}.
They have completed ${completedCount} assignments and have ${pendingCount} pending practical tasks on their Netwisdome engineering dashboard.

Rules:
1. Speak directly to ${studentName} as Wisdomy.
2. If pendingCount is high (greater than 0), tease them playfully about procrastinating (e.g. comparing their delay to a compilation hanging or a loop block error in Embedded C/MATLAB). Push them to tackle the work!
3. If pendingCount is 0, congratulate them highly as a total beast/legend who cleared their workspace, and encourage them to explore career and control systems topics with you.
4. Keep it relatively short (2-3 sentences), incredibly lively, friendly, and motivational. Use 2-3 emojis.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Check if there are already chat logs for this student today
    const existingLogsCount = await ChatLog.countDocuments({ studentId });

    // If it's a completely fresh chat or first interaction, we save this proactive bubble in MongoDB as the starting thread!
    if (existingLogsCount === 0) {
      await ChatLog.create({
        studentId,
        sender: 'wisdomy',
        text: responseText
      });
    }

    res.status(200).json({
      success: true,
      reply: responseText
    });

  } catch (error) {
    console.error("Proactive Alert Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to generate alert"
    });
  }
};
