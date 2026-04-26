import { Sequelize } from 'sequelize';
import db from '../config/Database.js';

const { DataTypes } = Sequelize;

const OvertimeEntry = db.define('overtime_entries', {
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
    },
    pegawai_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    nama_pegawai: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    overtime_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    overtime_hours: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    reason: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    status: {
        type: DataTypes.STRING(30),
        allowNull: false,
        defaultValue: 'submitted'
    }
}, {
    freezeTableName: true
});

export default OvertimeEntry;
