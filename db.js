import fs from 'fs';

class Database {
    constructor(name) {
        this.fileName = `./data/${name}.json`
        this.db = [];
        this.read();
    }

    read() {
        try {
            const fileData = fs.readFileSync(this.fileName);
            return this.db = JSON.parse(fileData);
        } catch (error) {
            console.log('Error reading file', error);
        }

        return []
    }

    write() {
        fs.writeFileSync(this.fileName, JSON.stringify(this.db));
    }
};

class UsersDB extends Database {
    constructor() {
        super('user');
    }

    find(id) {
        return this.db.find(user => user.id === id);
    }

    create(user) {
        this.db.push(user);
        this.write();
    }
};

class OAuthClientDB extends Database {
    constructor() {
        super('oauth-client');
    }

    find(id) {
        return this.db.find(client => client.id === id);
    }

    create(client) {
        this.db.push(client);
        this.write();
    }
}

export const usersDB = new UsersDB();
export const oAuthClientDB = new OAuthClientDB()
