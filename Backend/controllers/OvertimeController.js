import { Op, fn, col } from 'sequelize';
import DataPegawai from '../models/DataPegawaiModel.js';
import OvertimeEntry from '../models/OvertimeEntryModel.js';

let isOvertimeTableSynced = false;

const ensureOvertimeTable = async () => {
    if (!isOvertimeTableSynced) {
        await OvertimeEntry.sync();
        isOvertimeTableSynced = true;
    }
};

const validateOvertimePayload = ({ pegawai_id, overtime_date, overtime_hours, reason }) => {
    if (!pegawai_id || !overtime_date || !overtime_hours || !reason) {
        return 'Semua field wajib diisi';
    }

    const parsedHours = Number(overtime_hours);
    if (!Number.isFinite(parsedHours) || parsedHours < 1 || parsedHours > 6) {
        return 'Jam lembur harus antara 1 sampai 6 jam';
    }

    const parsedDate = new Date(`${overtime_date}T00:00:00`);
    if (Number.isNaN(parsedDate.getTime())) {
        return 'Format tanggal lembur tidak valid';
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (parsedDate > today) {
        return 'Tanggal lembur tidak boleh di masa depan';
    }

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    if (parsedDate < sevenDaysAgo) {
        return 'Tanggal lembur tidak boleh lebih dari 7 hari ke belakang';
    }

    if (String(reason).trim().length < 10) {
        return 'Alasan lembur minimal 10 karakter';
    }

    return null;
};

const getMonthRange = (dateString) => {
    const date = new Date(`${dateString}T00:00:00`);
    const year = date.getFullYear();
    const month = date.getMonth();
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);

    const toDateOnly = (value) => value.toISOString().slice(0, 10);
    return {
        monthStart: toDateOnly(monthStart),
        monthEnd: toDateOnly(monthEnd)
    };
};

export const createOvertimeEntry = async (req, res) => {
    try {
        await ensureOvertimeTable();

        const { pegawai_id, overtime_date, overtime_hours, reason } = req.body;
        const validationError = validateOvertimePayload({ pegawai_id, overtime_date, overtime_hours, reason });
        if (validationError) {
            return res.status(400).json({ msg: validationError });
        }

        const pegawai = await DataPegawai.findOne({
            where: { id: pegawai_id },
            attributes: ['id', 'nama_pegawai']
        });
        if (!pegawai) {
            return res.status(404).json({ msg: 'Pegawai tidak ditemukan' });
        }

        const duplicateEntry = await OvertimeEntry.findOne({
            where: {
                pegawai_id: pegawai_id,
                overtime_date: overtime_date
            }
        });
        if (duplicateEntry) {
            return res.status(400).json({ msg: 'Lembur untuk pegawai dan tanggal tersebut sudah ada' });
        }

        const { monthStart, monthEnd } = getMonthRange(overtime_date);
        const monthlyOvertime = await OvertimeEntry.findOne({
            attributes: [[fn('COALESCE', fn('SUM', col('overtime_hours')), 0), 'total']],
            where: {
                pegawai_id: pegawai_id,
                overtime_date: {
                    [Op.between]: [monthStart, monthEnd]
                }
            },
            raw: true
        });

        const currentMonthlyHours = Number(monthlyOvertime?.total ?? 0);
        const newMonthlyHours = currentMonthlyHours + Number(overtime_hours);
        if (newMonthlyHours > 60) {
            return res.status(400).json({ msg: 'Total lembur bulanan tidak boleh melebihi 60 jam' });
        }

        await OvertimeEntry.create({
            pegawai_id: pegawai_id,
            nama_pegawai: pegawai.nama_pegawai,
            overtime_date: overtime_date,
            overtime_hours: Number(overtime_hours),
            reason: String(reason).trim(),
            status: 'submitted'
        });

        return res.status(201).json({ msg: 'Data lembur berhasil disimpan' });
    } catch (error) {
        return res.status(500).json({ msg: error.message });
    }
};

export const getOvertimeEntries = async (req, res) => {
    try {
        await ensureOvertimeTable();
        const entries = await OvertimeEntry.findAll({
            order: [['overtime_date', 'DESC'], ['id', 'DESC']]
        });
        return res.status(200).json(entries);
    } catch (error) {
        return res.status(500).json({ msg: error.message });
    }
};
