db.createCollection("students", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: [
                "id",
                "lastname",
                "firstname",
                "email",
                "phone",
                "validated",
                "admin",
            ],
            properties: {
                id: {
                    bsonType: "int",
                    description: "must be an int",
                },
                lastname: {
                    bsonType: "string",
                    description: "must be a string",
                },
                firstname: {
                    bsonType: "string",
                    description: "must be a string",
                },
                email: {
                    bsonType: "string",
                    pattern: "^[\\w.-]+@([\\w-]+\\.)+[\\w-]{2,4}$",
                    description: "must be a valid email",
                },
                phone: {
                    bsonType: "string",
                    pattern: "^\\+?\\d{10,15}$",
                    description: "must be a valid phone number",
                },
                validated: {
                    enum: ["in progress", "validated", "rejected"],
                    description: "must be one of the enum values",
                },
                admin: {
                    bsonType: "bool",
                    description: "must be a boolean",
                },
            },
        },
    },
    validationLevel: "strict",
    validationAction: "error",
});

db.students.insertOne({
    id: 1,
    lastname: "Ramet",
    firstname: "Elliott",
    email: "elliott.ramet@epitech.eu",
    phone: "+33612345678",
    validated: "validated",
    admin: false,
});
