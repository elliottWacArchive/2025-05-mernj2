#!/bin/bash

# Configuration
DB_HOST="localhost"
DB_PORT="27042"
DB_NAME="mern-pool"
COLLECTION="students"
BACKUP_DIR="backup"

if [ $# -ne 1 ]; then
    echo "Usage: $0 [save|restore]"
    exit 1
fi

save_collection() {
    mkdir -p $BACKUP_DIR
    
    mongodump --host $DB_HOST --port $DB_PORT --db $DB_NAME --collection $COLLECTION --out $BACKUP_DIR
    
    if [ $? -eq 0 ]; then
        echo "Backup saved in folder backup."
    else
        echo "Error: Backup failed."
        exit 1
    fi
}

restore_collection() {
    if [ ! -d "$BACKUP_DIR" ]; then
        echo "Error: Backup folder not found."
        exit 1
    fi
    
    mongosh --host $DB_HOST --port $DB_PORT --quiet --eval "db.getSiblingDB('$DB_NAME').$COLLECTION.deleteMany({})"
    
    mongorestore --host $DB_HOST --port $DB_PORT --db $DB_NAME --collection $COLLECTION $BACKUP_DIR/$DB_NAME/$COLLECTION.bson
    
    if [ $? -eq 0 ]; then
        echo "Database restored from backup folder."
        rm -rf $BACKUP_DIR
    else
        echo "Error: Restore failed."
        exit 1
    fi
}

case "$1" in
    save)
        save_collection
        ;;
    restore)
        restore_collection
        ;;
    *)
        echo "Usage: $0 [save|restore]"
        exit 1
        ;;
esac

exit 0