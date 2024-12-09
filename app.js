require('dotenv').config();  // Load environment variables from .env file
const { SerialPort } = require('serialport');
const { MongoClient } = require('mongodb');
const moment = require('moment-timezone');  // To handle time conversion to IST

// Load variables from .env file
const mongoURI = process.env.MONGO_URI;
const dbName = process.env.DB_NAME;
const collectionName = process.env.COLLECTION_NAME;
const portName = process.env.PORT_NAME || 'COM4';  // Default to COM4 if not specified
const baudRate = parseInt(process.env.BAUD_RATE) || 115200;  // Default to 115200 if not specified

// MongoDB Setup
async function connectMongoDB() {
    const client = new MongoClient(mongoURI);
    try {
        await client.connect();
        console.log("Connected to MongoDB");
        const db = client.db(dbName);
        return db.collection(collectionName);
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        process.exit(1); // Exit the process if MongoDB connection fails
    }
}

// Convert current timestamp to IST, and return separate date, time, and timestamp
function getISTTimestamp() {
    const momentTime = moment().tz('Asia/Kolkata');  // Get current time in IST

    const timestamp = momentTime.toDate();  // Get the full timestamp (Date object)
    const date = momentTime.format('YYYY-MM-DD');  // Format: 2024-12-08
    const time = momentTime.format('hh:mm:ss A');  // Format: 12:34:56 PM

    return { timestamp, date, time };  // Return the three separate values
}

// Serial Port Setup
const port = new SerialPort({ path: portName, baudRate: baudRate });

// Listen for data from Arduino
port.on('data', async (data) => {
    const dataStr = data.toString().trim();
    console.log('Received data:', dataStr);

    // Split the incoming data (assuming it's CSV)
    const sensorValues = dataStr.split(',');

    if (sensorValues.length === 6) {
        // Validate data
        const [voltage, current, power, energy, frequency, pf] = sensorValues.map(val => parseFloat(val));

        if (!isNaN(voltage) && !isNaN(current) && !isNaN(power) && !isNaN(energy) && !isNaN(frequency) && !isNaN(pf)) {
            // Get the current timestamp in IST
            const { timestamp, date, time } = getISTTimestamp();

            // Save the data to MongoDB
            const collection = await connectMongoDB();
            const record = {
                voltage,
                current,
                power,
                energy,
                frequency,
                pf,
                timestamp,  // Store the complete timestamp as a Date object
                date,       // Store the date as a string (YYYY-MM-DD)
                time,       // Store the time as a string (HH:mm:ss A)
            };

            try {
                await collection.insertOne(record);
                console.log("Data saved to MongoDB:", record);
            } catch (err) {
                console.error("Error inserting data into MongoDB:", err);
            }
        } else {
            console.error("Invalid data received from Arduino.");
        }
    } else {
        console.error("Invalid data format.");
    }
});

// Handle errors on the serial port
port.on('error', (err) => {
    console.error("Error on serial port:", err);
});

// Open the serial port
port.on('open', () => {
    console.log(`Serial port ${portName} opened. Listening for data...`);
});
