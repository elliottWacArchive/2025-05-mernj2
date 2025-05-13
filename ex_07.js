const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const bodyParser = require("body-parser");

const app = express();
const port = 3000;

const url = "mongodb://localhost:27042";
const dbName = "mern-pool";

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

async function connectDB() {
    const client = new MongoClient(url);
    await client.connect();
    return client;
}

app.get("/", async (req, res) => {
    const client = await connectDB();

    try {
        const db = client.db(dbName);
        const collection = db.collection("students");

        const filter = {};

        if (req.query.id_min) {
            filter.id = { $gte: parseInt(req.query.id_min) };
        }
        if (req.query.id_max) {
            filter.id = { ...filter.id, $lte: parseInt(req.query.id_max) };
        }

        if (req.query.validated && req.query.validated !== "all") {
            filter.validated = req.query.validated;
        }

        if (req.query.admin && req.query.admin !== "all") {
            filter.admin = req.query.admin === "true";
        }

        if (req.query.search) {
            const searchRegex = new RegExp(req.query.search, "i");
            filter.$or = [
                { firstname: searchRegex },
                { lastname: searchRegex },
                { email: searchRegex },
                { phone: searchRegex },
            ];
        }

        const sortField = req.query.sort || "id";
        const sortOrder = req.query.order === "desc" ? -1 : 1;
        const sort = {};
        sort[sortField] = sortOrder;

        const students = await collection.find(filter).sort(sort).toArray();

        // Construction de l'interface utilisateur
        let html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Gestion des étudiants</title>
            <style>
                body { font-family: Arial, sans-serif; }
                h1, h2 { color: #333; }
                table { border-collapse: collapse; width: 100%; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; cursor: pointer; }
                form { margin: 20px 0; padding: 15px; background: #f5f5f5; border-radius: 5px; }
                input, select, button { margin: 5px; padding: 8px; }
                .action-btn { padding: 5px 10px; margin-right: 5px; text-decoration: none; border-radius: 5px; }
                .edit-btn { background-color: green; color: white; }
                .delete-btn { background-color: red; color: white; }
                .add-btn { background-color: blue; color: white; padding: 10px 15px; display: inline-block; margin-top: 20px; }
                .filter-section { display: flex; flex-wrap: wrap; align-items: center; }
                .filter-item { margin-right: 15px; }
            </style>
        </head>
        <body>
            <h1>Gestion Administrative des Étudiants</h1>
            
            <!-- Recherche et filtres -->
            <form method="GET" action="/">
                <h2>Filtres et recherche</h2>
                <div class="filter-section">
                    <div class="filter-item">
                        <label>Recherche globale:</label>
                        <input type="text" name="search" value="${
                            req.query.search || ""
                        }">
                    </div>
                    
                    <div class="filter-item">
                        <label>ID minimum:</label>
                        <input type="number" name="id_min" value="${
                            req.query.id_min || ""
                        }">
                    </div>
                    
                    <div class="filter-item">
                        <label>ID maximum:</label>
                        <input type="number" name="id_max" value="${
                            req.query.id_max || ""
                        }">
                    </div>
                    
                    <div class="filter-item">
                        <label>Statut de validation:</label>
                        <select name="validated">
                            <option value="all" ${
                                !req.query.validated ||
                                req.query.validated === "all"
                                    ? "selected"
                                    : ""
                            }>Tous</option>
                            <option value="in progress" ${
                                req.query.validated === "in progress"
                                    ? "selected"
                                    : ""
                            }>En cours</option>
                            <option value="validated" ${
                                req.query.validated === "validated"
                                    ? "selected"
                                    : ""
                            }>Validé</option>
                            <option value="rejected" ${
                                req.query.validated === "rejected"
                                    ? "selected"
                                    : ""
                            }>Rejeté</option>
                        </select>
                    </div>
                    
                    <div class="filter-item">
                        <label>Admin:</label>
                        <select name="admin">
                            <option value="all" ${
                                !req.query.admin || req.query.admin === "all"
                                    ? "selected"
                                    : ""
                            }>Tous</option>
                            <option value="true" ${
                                req.query.admin === "true" ? "selected" : ""
                            }>Oui</option>
                            <option value="false" ${
                                req.query.admin === "false" ? "selected" : ""
                            }>Non</option>
                        </select>
                    </div>
                    
                    <div class="filter-item">
                        <label>Trier par:</label>
                        <select name="sort">
                            <option value="id" ${
                                sortField === "id" ? "selected" : ""
                            }>ID</option>
                            <option value="lastname" ${
                                sortField === "lastname" ? "selected" : ""
                            }>Nom</option>
                            <option value="firstname" ${
                                sortField === "firstname" ? "selected" : ""
                            }>Prénom</option>
                        </select>
                    </div>
                    
                    <div class="filter-item">
                        <label>Ordre:</label>
                        <select name="order">
                            <option value="asc" ${
                                req.query.order !== "desc" ? "selected" : ""
                            }>Ascendant</option>
                            <option value="desc" ${
                                req.query.order === "desc" ? "selected" : ""
                            }>Descendant</option>
                        </select>
                    </div>
                    
                    <div class="filter-item">
                        <button type="submit">Appliquer les filtres</button>
                        <a href="/">Réinitialiser</a>
                    </div>
                </div>
            </form>
            
            <!-- Bouton pour ajouter un étudiant -->
            <a href="/add" class="action-btn add-btn">Ajouter un nouvel étudiant</a>
            
            <!-- Tableau des étudiants -->
            <table>
                <tr>
                    <th>ID</th>
                    <th>Nom</th>
                    <th>Prénom</th>
                    <th>Email</th>
                    <th>Téléphone</th>
                    <th>Statut</th>
                    <th>Admin</th>
                    <th>Actions</th>
                </tr>`;

        if (students.length === 0) {
            html +=
                '<tr><td colspan="8" style="text-align: center;">Aucun étudiant trouvé</td></tr>';
        } else {
            students.forEach((student) => {
                html += `
                <tr>
                    <td>${student.id}</td>
                    <td>${student.lastname}</td>
                    <td>${student.firstname}</td>
                    <td>${student.email}</td>
                    <td>${student.phone}</td>
                    <td>${student.validated}</td>
                    <td>${student.admin ? "Oui" : "Non"}</td>
                    <td>
                        <a href="/edit/${
                            student.id
                        }" class="action-btn edit-btn">Modifier</a>
                        <a href="/delete/${
                            student.id
                        }" class="action-btn delete-btn" onclick="return confirm('Êtes-vous sûr de vouloir supprimer cet étudiant?')">Supprimer</a>
                    </td>
                </tr>`;
            });
        }

        html += `
            </table>
        </body>
        </html>`;

        res.send(html);
    } catch (error) {
        console.error("Erreur :", error);
        res.status(500).send("Erreur.");
    } finally {
        await client.close();
    }
});

// Route pour afficher le formulaire d'ajout
app.get("/add", (req, res) => {
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Ajouter un étudiant</title>
        <style>
            body { font-family: Arial, sans-serif;}
            h1 { color: #333; }
            form { max-width: 500px; margin: 20px 0; }
            div { margin-bottom: 15px; }
            label { display: block; margin-bottom: 5px; }
            input, select { width: 100%; padding: 8px; box-sizing: border-box; }
            button { padding: 10px 15px; background-color: green; color: white; border: none; cursor: pointer; }
            a { display: inline-block; margin-top: 10px; color: blue; text-decoration: none; }
        </style>
    </head>
    <body>
        <h1>Ajouter un nouvel étudiant</h1>
        <form action="/add" method="POST">
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
            <div>
                <label for="validated">Statut de validation :</label>
                <select id="validated" name="validated">
                    <option value="in progress">En cours</option>
                    <option value="validated">Validé</option>
                    <option value="rejected">Rejeté</option>
                </select>
            </div>
            <div>
                <label for="admin">Admin :</label>
                <select id="admin" name="admin">
                    <option value="false">Non</option>
                    <option value="true">Oui</option>
                </select>
            </div>
            <button type="submit">Enregistrer</button>
        </form>
        <a href="/">Retour à la liste</a>
    </body>
    </html>`;

    res.send(html);
});

// Route pour traiter l'ajout d'un étudiant
app.post("/add", async (req, res) => {
    const client = await connectDB();

    try {
        const db = client.db(dbName);
        const collection = db.collection("students");

        const { firstname, lastname, email, phone, validated, admin } =
            req.body;

        const maxIdStudent = await collection
            .find()
            .sort({ id: -1 })
            .limit(1)
            .toArray();
        const newId = maxIdStudent.length > 0 ? maxIdStudent[0].id + 1 : 1;

        const student = {
            id: newId,
            firstname,
            lastname,
            email,
            phone,
            validated,
            admin: admin === "true",
        };

        await collection.insertOne(student);

        res.redirect("/");
    } catch (error) {
        console.error("Erreur lors de l'ajout :", error);
        res.status(500).send(
            "Une erreur est survenue lors de l'ajout de l'étudiant."
        );
    } finally {
        await client.close();
    }
});

app.get("/edit/:id", async (req, res) => {
    const client = await connectDB();

    try {
        const studentId = parseInt(req.params.id);
        const db = client.db(dbName);
        const collection = db.collection("students");

        const student = await collection.findOne({ id: studentId });

        if (!student) {
            return res.status(404).send("Étudiant non trouvé.");
        }

        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Modifier un étudiant</title>
            <style>
                body { font-family: Arial, sans-serif;}
                h1 { color: #333; }
                form { max-width: 500px; margin: 20px 0; }
                div { margin-bottom: 15px; }
                label { display: block; margin-bottom: 5px; }
                input, select { width: 100%; padding: 8px; box-sizing: border-box; }
                button { padding: 10px 15px; background-color: green; color: white; border: none; cursor: pointer; }
                a { display: inline-block; margin-top: 10px; color: blue; text-decoration: none; }
            </style>
        </head>
        <body>
            <h1>Modifier l'étudiant</h1>
            <form action="/edit/${student.id}" method="POST">
                <div>
                    <label for="firstname">Prénom :</label>
                    <input type="text" id="firstname" name="firstname" value="${
                        student.firstname
                    }" required>
                </div>
                <div>
                    <label for="lastname">Nom :</label>
                    <input type="text" id="lastname" name="lastname" value="${
                        student.lastname
                    }" required>
                </div>
                <div>
                    <label for="email">Email :</label>
                    <input type="email" id="email" name="email" value="${
                        student.email
                    }" required>
                </div>
                <div>
                    <label for="phone">Téléphone :</label>
                    <input type="text" id="phone" name="phone" value="${
                        student.phone
                    }" required>
                </div>
                <div>
                    <label for="validated">Statut de validation :</label>
                    <select id="validated" name="validated">
                        <option value="in progress" ${
                            student.validated === "in progress"
                                ? "selected"
                                : ""
                        }>En cours</option>
                        <option value="validated" ${
                            student.validated === "validated" ? "selected" : ""
                        }>Validé</option>
                        <option value="rejected" ${
                            student.validated === "rejected" ? "selected" : ""
                        }>Rejeté</option>
                    </select>
                </div>
                <div>
                    <label for="admin">Admin :</label>
                    <select id="admin" name="admin">
                        <option value="false" ${
                            !student.admin ? "selected" : ""
                        }>Non</option>
                        <option value="true" ${
                            student.admin ? "selected" : ""
                        }>Oui</option>
                    </select>
                </div>
                <button type="submit">Mettre à jour</button>
            </form>
            <a href="/">Retour à la liste</a>
        </body>
        </html>`;

        res.send(html);
    } catch (error) {
        console.error("Erreur :", error);
        res.status(500).send(
            "Une erreur est survenue lors du chargement des données."
        );
    } finally {
        await client.close();
    }
});

app.post("/edit/:id", async (req, res) => {
    const client = await connectDB();

    try {
        const studentId = parseInt(req.params.id);
        const db = client.db(dbName);
        const collection = db.collection("students");

        const { firstname, lastname, email, phone, validated, admin } =
            req.body;

        await collection.updateOne(
            { id: studentId },
            {
                $set: {
                    firstname,
                    lastname,
                    email,
                    phone,
                    validated,
                    admin: admin === "true",
                },
            }
        );

        res.redirect("/");
    } catch (error) {
        console.error("Erreur lors de la modification :", error);
        res.status(500).send(
            "Une erreur est survenue lors de la modification de l'étudiant."
        );
    } finally {
        await client.close();
    }
});

app.get("/delete/:id", async (req, res) => {
    const client = await connectDB();

    try {
        const studentId = parseInt(req.params.id);
        const db = client.db(dbName);
        const collection = db.collection("students");

        await collection.deleteOne({ id: studentId });

        res.redirect("/");
    } catch (error) {
        console.error("Erreur lors de la suppression :", error);
        res.status(500).send(
            "Une erreur est survenue lors de la suppression de l'étudiant."
        );
    } finally {
        await client.close();
    }
});

app.listen(port, () => {
    console.log(`Serveur démarré sur http://localhost:${port}`);
});
