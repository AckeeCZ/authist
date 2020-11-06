import { DataTypes, Sequelize } from 'sequelize';

const sqlite = new Sequelize('sqlite::memory:');

// tslint:disable-next-line:variable-name
const User = sqlite.define('User', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    name: {
        type: DataTypes.STRING,
    },
});

export const initDb = async () => {
    return await User.sync();
};
