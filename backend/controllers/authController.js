const User = require('../models/User');
const Batch = require('../models/Batch');
const mongoose = require('mongoose');
const { sendStudentEnrollmentEmail } = require('../utils/mailer');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');

/**
 * Helper function to resolve a Batch ID from a batchName or standard ID string.
 * @param {string|mongoose.Types.ObjectId} batchId - The batch name or batch object ID.
 * @returns {object} Resolves to { value: batchId } or { error: errorMessage }.
 */
const resolveBatchId = async (batchId) => {
    if (batchId === undefined) return { value: undefined };
    if (batchId === null || batchId === '') return { value: null };

    const normalized = String(batchId).trim();
    if (!normalized) return { value: null };

    const batchQuery = [{ batchName: normalized }];
    if (mongoose.isValidObjectId(normalized)) {
        batchQuery.push({ _id: normalized });
    }

    const foundBatch = await Batch.findOne({ $or: batchQuery });

    if (!foundBatch) {
        return { error: "Invalid batch selected" };
    }

    return { value: foundBatch._id };
};

/**
 * Registers a new student account, checks if the email is already in use,
 * resolves the specified batch, and dispatches a welcome/credentials email to the student.
 */
exports.registerStudent = async (req, res) => {
    try {
        const { name, email, password, batchId, certificateStatus } = req.body;
        const plainPassword = password;

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: "Email already exists!" });

        const batchResolution = await resolveBatchId(batchId);
        if (batchResolution.error) {
            return res.status(400).json({ message: batchResolution.error });
        }

        const newUser = new User({
            name,
            email,
            password,
            batchId: batchResolution.value,
            role: 'student'
        });

        await newUser.save();
        const batch = batchResolution.value
            ? await Batch.findById(batchResolution.value).select('batchName').lean()
            : null;

        sendStudentEnrollmentEmail({
            name: newUser.name,
            email: newUser.email,
            password: plainPassword,
            batchId: batchResolution.value || null,
            batchName: batch?.batchName || 'Unassigned'
        })
        .then(() => {
            console.log("✅ Enrollment email sent:", newUser.email);
        })
        .catch((mailError) => {
            console.error("❌ Enrollment email failed:", mailError.message);
        });

        res.status(201).json({ message: "Student Registered Successfully!" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Authenticates student login credentials.
 * Queries for matches on plaintext passwords (legacy) and returns user info.
 */
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email, password }).populate('batchId');

        if (!user) return res.status(401).json({ message: "Invalid Email or Password" });

        res.status(200).json({
            message: "Login Successful",
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                batchId: user.batchId?._id || user.batchId,
                batchName: user.batchId?.batchName || ''
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Retrieves a list of all registered student accounts (excluding admin accounts)
 * with their associated batch details, sorted chronologically by creation date.
 */
exports.getStudents = async (req, res) => {
    try {
        const students = await User.find({ role: { $ne: 'admin' } })
            .populate('batchId', 'batchName')
            .sort({ createdAt: -1 });

        res.status(200).json(students);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Retrieves a student profile by their unique MongoDB Object ID.
 */
exports.getStudentById = async (req, res) => {
    try {
        const { id } = req.params;
        const student = await User.findOne({ _id: id, role: { $ne: 'admin' } })
            .populate('batchId', 'batchName');
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }
        return res.status(200).json({ student });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

/**
 * Deletes a student profile from the database by their unique MongoDB Object ID.
 */
exports.deleteStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedStudent = await User.findOneAndDelete({ _id: id, role: { $ne: 'admin' } });

        if (!deletedStudent) {
            return res.status(404).json({ message: "Student not found" });
        }

        res.status(200).json({ message: "Student deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Updates an existing student profile's details including name, email, password,
 * batch assignments, and certificate validation status.
 */
exports.updateStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, password, batchId, certificateStatus } = req.body;

        const student = await User.findOne({ _id: id, role: { $ne: 'admin' } });
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        if (email && email !== student.email) {
            const existing = await User.findOne({ email, _id: { $ne: id } });
            if (existing) return res.status(400).json({ message: "Email already exists!" });
        }

        let finalBatchId;
        if (batchId !== undefined) {
            const batchResolution = await resolveBatchId(batchId);
            if (batchResolution.error) {
                return res.status(400).json({ message: batchResolution.error });
            }
            finalBatchId = batchResolution.value;
        }

        if (name !== undefined) student.name = name;
        if (email !== undefined) student.email = email;
        if (password !== undefined && password !== '') student.password = password;
        if (batchId !== undefined) student.batchId = finalBatchId;
        if (certificateStatus !== undefined) {
            const normalized = String(certificateStatus).toLowerCase();
            if (!['pending', 'issued'].includes(normalized)) {
                return res.status(400).json({ message: "Invalid certificate status" });
            }
            student.certificateStatus = normalized;
            student.certificateIssuedAt = normalized === 'issued' ? new Date() : null;
        }

        await student.save();
        const updated = await User.findById(student._id).populate('batchId', 'batchName');
        res.status(200).json({ message: "Student updated successfully", student: updated });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Checks if at least one Admin account has been registered in the database.
 * Used by the frontend to toggle setup/login screens.
 */
exports.checkAdminSetup = async (req, res) => {
    try {
        const count = await Admin.countDocuments();
        res.status(200).json({ isSetup: count > 0 });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Performs a one-time setup and registration of the main administrative credentials.
 * If an admin already exists, the server blocks further registrations.
 * Hashing is secured using bcryptjs.
 */
exports.registerAdmin = async (req, res) => {
    try {
        const { email, password, confirmPassword } = req.body;

        if (!email || !password || !confirmPassword) {
            return res.status(400).json({ message: "All fields are required" });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ message: "Passwords do not match" });
        }

        const count = await Admin.countDocuments();
        if (count > 0) {
            return res.status(400).json({ message: "Admin registration is restricted. An admin already exists." });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newAdmin = new Admin({
            email,
            password: hashedPassword
        });

        await newAdmin.save();
        res.status(201).json({ message: "Admin Registered Successfully!" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Authenticates admin credentials using bcryptjs verification.
 */
exports.loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(401).json({ message: "Invalid Email or Password" });
        }

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid Email or Password" });
        }

        res.status(200).json({
            message: "Login Successful",
            user: {
                _id: admin._id,
                name: "Admin",
                email: admin.email,
                role: "admin"
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
