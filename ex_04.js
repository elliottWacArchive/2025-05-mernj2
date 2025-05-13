const { MongoClient } = require("mongodb");

const url = "mongodb://localhost:27042";

const client = new MongoClient(url);

async function connectToDatabase() {
    try {
        await client.connect();
        console.log("Connection successfull.");

        await client.close();
    } catch (error) {
        console.log("Connection failed.");
    }
}

connectToDatabase();
