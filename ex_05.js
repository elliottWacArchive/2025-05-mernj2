const express = require("express");
const { MongoClient } = require("mongodb");
const bodyParser = require("body-parser");

const app = express();
const port = 3000;

const url = "mongodb://localhost:27042";
const dbName = "mern-pool";

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Ajouter un étudiant</title>
    </head>
    <body>
        <h1>Ajouter un nouvel étudiant</h1>
        <form action="/submit" method="POST">
        <div>
            <label for="firstname">Prénom :</label>
            <input type="text" id="firstname" name="firstname" required>
        </div>
        <div>
            <label for="lastname">Nom :</label>
            <input type="text" id="lastname" name="lastname" required>
        </div>
        <div>
            <label for="email">Email :</label>
            <input type="email" id="email" name="email" required>
        </div>
        <div>
            <label for="phone">Téléphone :</label>
            <input type="text" id="phone" name="phone" required>
        </div>
        <button type="submit">Enregistrer</button>
        </form>
    </body>
    </html>
    `);
});

app.post("/submit", async (req, res) => {
    const { firstname, lastname, email, phone } = req.body;

    const client = new MongoClient(url);

    try {
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection("students");

        const maxIdStudent = await collection
            .find()
            .sort({ id: -1 })
            .limit(1)
            .toArray();
        const newId = maxIdStudent.length > 0 ? maxIdStudent[0].id + 1 : 1;

        const student = {
            id: newId,
            lastname,
            firstname,
            email,
            phone,
            validated: "in progress",
            admin: false,
        };

        await collection.insertOne(student);

        res.send("Collection saved.");
    } catch (error) {
        console.error("Erreur lors de la sauvegarde:", error);
        res.send("Failed to save the collection.");
    } finally {
        await client.close();
    }
});

app.listen(port, () => {
    console.log(`Serveur démarré sur http://localhost:${port}`);
});
