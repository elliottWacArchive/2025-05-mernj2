const express = require("express");
const { MongoClient } = require("mongodb");

const app = express();
const port = 3000;

const url = "mongodb://localhost:27042";
const dbName = "mern-pool";

app.get("/", async (req, res) => {
    const client = new MongoClient(url);

    try {
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection("students");

        const students = await collection
            .find({ validated: "in progress" })
            .sort({ lastname: 1 })
            .toArray();

        let html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Liste des étudiants en attente</title>
            <style>
                h1 { color: #333; }
                table { border-collapse: collapse; width: 100%; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
            </style>
        </head>
        <body>
            <h1>Etudiants en attente</h1>
        `;

        if (students.length === 0) {
            html += "<p>Aucun étudiant en attente.</p>";
        } else {
            html += `
            <table>
                <tr>
                    <th>Nom</th>
                    <th>Prénom</th>
                    <th>Email</th>
                    <th>Téléphone</th>
                    <th>Statut</th>
                </tr>
            `;

            students.forEach((student) => {
                html += `
                <tr>
                    <td>${student.lastname}</td>
                    <td>${student.firstname}</td>
                    <td>${student.email}</td>
                    <td>${student.phone}</td>
                    <td>${student.validated}</td>
                </tr>
                `;
            });

            html += "</table>";
        }

        html += `
        </body>
        </html>
        `;

        res.send(html);
    } catch (error) {
        console.error("Erreur :", error);
        res.status(500).send("Erreur.");
    } finally {
        await client.close();
    }
});

app.listen(port, () => {
    console.log(`Serveur démarré sur http://localhost:${port}`);
});
