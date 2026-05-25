const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db.js');
const assignmentRoutes = require('./routes/assignmentRoutes');
const authRoutes = require('./routes/authRoutes');
const batchRoutes = require('./routes/batchRoutes');
const courseRoutes = require('./routes/courseRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const notesRoutes = require('./routes/notesRoutes');
const { verifySMTPConnection } = require('./utils/mailer');

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/assignments', assignmentRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api', attendanceRoutes);
app.use('/api', notesRoutes);

app.get('/', (req, res) => {
  res.send('API is running and Netwisdome Backend is Connected!');
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    verifySMTPConnection();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
