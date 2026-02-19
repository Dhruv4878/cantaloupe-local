// backend/server.js
require("dotenv").config();

const app = require('./src/app');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('MongoDB Connected Successfully...');
        mongoose.connection.on('connected', () => {
            console.log('MONGO connected to', mongoose.connection.host, mongoose.connection.name);
        });

        // Initialize Scheduler
        const schedulerService = require('./src/services/schedulerService');
        schedulerService.initScheduler();

        app.listen(PORT, () => {
            console.log(`🚀 Server is running on port ${PORT}`);
        });
    }).catch(err => {
        console.error('Failed to connect to MongoDB', err);
        process.exit(1);
    });