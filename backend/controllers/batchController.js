const Batch = require('../models/Batch');
const mongoose = require('mongoose');

const createBatch = async (req, res) => {
    try {
        const { batchName } = req.body;
        if (!batchName) {
            return res.status(400).json({ message: "Batch name missing!" });
        }
        const newBatch = new Batch({ batchName });
        await newBatch.save();
        res.status(201).json({ message: "Batch created successfully!", batch: newBatch });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getAllBatches = async (req, res) => {
    try {
        const batches = await Batch.find().sort({ createdAt: -1 });
        res.status(200).json(batches);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteBatch = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: "Batch id missing!" });
        }
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid batch id" });
        }

        const deleted = await Batch.findByIdAndDelete(id);
        if (!deleted) {
            return res.status(404).json({ message: "Batch not found" });
        }

        return res.status(200).json({ message: "Batch deleted successfully!" });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// ✅ इथून फंक्शन्स बाहेर पाठवली जातात
module.exports = { createBatch, getAllBatches, deleteBatch };
