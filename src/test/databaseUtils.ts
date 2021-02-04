import { DataTypes, Sequelize } from 'sequelize';
import { User } from '../lib';

const sqlite = new Sequelize('sqlite::memory:');

// tslint:disable-next-line:variable-name
const UserModel = sqlite.define('User', {
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
    return await UserModel.sync();
};

export const getUserByEmail = (model: any) => async (email: string) => {
    const user = await model.findOne({ where: { email } });
    if (!user) {
        return;
    }
    const authistUser: User & { password: string } = {
        password: user.password,
        email: user.email,
        providerData: {},
        uid: String(user.id),
    };
    return authistUser;
};

export const getUserById = (model: any) => async (id: string) => {
    const user = await model.findOne({ where: { id: Number(id) } });
    if (!user) {
        return;
    }
    const authistUser: User = {
        email: user.email,
        providerData: {},
        uid: String(user.id),
    };
    return authistUser;
};

export const updateUser = (model: any) => async (data: { password?: string }, user: User) => {
    const foundUser = await model.findOne({ where: { id: Number(user.uid) } });
    if (!foundUser) {
        return;
    }
    if (data.password) {
        foundUser.password = data.password;
    }
    await foundUser.save();
};
