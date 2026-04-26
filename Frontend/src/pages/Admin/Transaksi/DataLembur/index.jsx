import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Layout from '../../../../layout';
import { Breadcrumb, ButtonOne } from '../../../../components';
import { getDataPegawai, getMe } from '../../../../config/redux/action';

const DataLembur = () => {
    const [pegawaiId, setPegawaiId] = useState('');
    const [overtimeDate, setOvertimeDate] = useState('');
    const [overtimeHours, setOvertimeHours] = useState('');
    const [reason, setReason] = useState('');
    const [overtimeEntries, setOvertimeEntries] = useState([]);

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { isError, user } = useSelector((state) => state.auth);
    const { dataPegawai } = useSelector((state) => state.dataPegawai);

    const employeeOptions = useMemo(
        () => dataPegawai.map((pegawai) => ({ id: pegawai.id, name: pegawai.nama_pegawai })),
        [dataPegawai]
    );

    const fetchOvertimeEntries = async () => {
        try {
            const response = await axios.get('http://localhost:5000/data_lembur');
            setOvertimeEntries(response.data);
        } catch (error) {
            setOvertimeEntries([]);
        }
    };

    const validateForm = () => {
        if (!pegawaiId || !overtimeDate || !overtimeHours || !reason.trim()) {
            return 'Semua field wajib diisi';
        }

        const numericHours = Number(overtimeHours);
        if (!Number.isFinite(numericHours) || numericHours < 1 || numericHours > 6) {
            return 'Jam lembur harus antara 1 sampai 6 jam';
        }

        const selectedDate = new Date(`${overtimeDate}T00:00:00`);
        if (Number.isNaN(selectedDate.getTime())) {
            return 'Tanggal lembur tidak valid';
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (selectedDate > today) {
            return 'Tanggal lembur tidak boleh di masa depan';
        }

        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);
        if (selectedDate < sevenDaysAgo) {
            return 'Tanggal lembur tidak boleh lebih dari 7 hari ke belakang';
        }

        if (reason.trim().length < 10) {
            return 'Alasan lembur minimal 10 karakter';
        }

        return null;
    };

    const resetForm = () => {
        setPegawaiId('');
        setOvertimeDate('');
        setOvertimeHours('');
        setReason('');
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const validationError = validateForm();
        if (validationError) {
            Swal.fire({
                icon: 'error',
                title: 'Validasi Gagal',
                text: validationError
            });
            return;
        }

        try {
            const response = await axios.post('http://localhost:5000/data_lembur', {
                pegawai_id: Number(pegawaiId),
                overtime_date: overtimeDate,
                overtime_hours: Number(overtimeHours),
                reason: reason.trim()
            });

            Swal.fire({
                icon: 'success',
                title: 'Berhasil',
                text: response.data.msg
            });

            resetForm();
            fetchOvertimeEntries();
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Gagal',
                text: error.response?.data?.msg || 'Gagal menyimpan data lembur'
            });
        }
    };

    useEffect(() => {
        dispatch(getDataPegawai());
        dispatch(getMe());
        fetchOvertimeEntries();
    }, [dispatch]);

    useEffect(() => {
        if (isError) {
            navigate('/login');
        }
        if (user && user.hak_akses !== 'admin') {
            navigate('/dashboard');
        }
    }, [isError, user, navigate]);

    return (
        <Layout>
            <Breadcrumb pageName='Data Lembur Pegawai' />

            <div className='rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark'>
                <div className='border-b border-stroke py-4 px-6.5 dark:border-strokedark'>
                    <h3 className='font-medium text-black dark:text-white'>Input Lembur Pegawai</h3>
                </div>
                <form onSubmit={handleSubmit} className='p-6.5'>
                    <div className='mb-4.5'>
                        <label className='mb-2.5 block text-black dark:text-white'>
                            Pegawai <span className='text-meta-1'>*</span>
                        </label>
                        <select
                            value={pegawaiId}
                            onChange={(event) => setPegawaiId(event.target.value)}
                            className='w-full rounded border border-stroke bg-transparent py-3 px-5 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary'
                            required
                        >
                            <option value=''>Pilih Pegawai</option>
                            {employeeOptions.map((pegawai) => (
                                <option key={pegawai.id} value={pegawai.id}>{pegawai.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className='mb-4.5'>
                        <label className='mb-2.5 block text-black dark:text-white'>
                            Tanggal Lembur <span className='text-meta-1'>*</span>
                        </label>
                        <input
                            type='date'
                            value={overtimeDate}
                            onChange={(event) => setOvertimeDate(event.target.value)}
                            className='w-full rounded border border-stroke bg-transparent py-3 px-5 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary'
                            required
                        />
                    </div>

                    <div className='mb-4.5'>
                        <label className='mb-2.5 block text-black dark:text-white'>
                            Jam Lembur <span className='text-meta-1'>*</span>
                        </label>
                        <input
                            type='number'
                            min='1'
                            max='6'
                            value={overtimeHours}
                            onChange={(event) => setOvertimeHours(event.target.value)}
                            className='w-full rounded border border-stroke bg-transparent py-3 px-5 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary'
                            placeholder='Masukkan jam lembur (1-6)'
                            required
                        />
                    </div>

                    <div className='mb-6'>
                        <label className='mb-2.5 block text-black dark:text-white'>
                            Alasan Lembur <span className='text-meta-1'>*</span>
                        </label>
                        <textarea
                            rows={4}
                            value={reason}
                            onChange={(event) => setReason(event.target.value)}
                            className='w-full rounded border border-stroke bg-transparent py-3 px-5 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary'
                            placeholder='Minimal 10 karakter'
                            required
                        />
                    </div>

                    <ButtonOne type='submit'>
                        <span>Submit untuk Payroll</span>
                    </ButtonOne>
                </form>
            </div>

            <div className='rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1 mt-6'>
                <h3 className='font-medium text-black dark:text-white mb-4'>Riwayat Lembur</h3>
                <div className='max-w-full overflow-x-auto py-2'>
                    <table className='w-full table-auto'>
                        <thead>
                            <tr className='bg-gray-2 text-left dark:bg-meta-4'>
                                <th className='py-3 px-4 font-medium text-black dark:text-white'>Pegawai</th>
                                <th className='py-3 px-4 font-medium text-black dark:text-white'>Tanggal</th>
                                <th className='py-3 px-4 font-medium text-black dark:text-white'>Jam</th>
                                <th className='py-3 px-4 font-medium text-black dark:text-white'>Alasan</th>
                                <th className='py-3 px-4 font-medium text-black dark:text-white'>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {overtimeEntries.map((entry) => (
                                <tr key={entry.id}>
                                    <td className='border-b border-[#eee] py-3 px-4 dark:border-strokedark'>{entry.nama_pegawai}</td>
                                    <td className='border-b border-[#eee] py-3 px-4 dark:border-strokedark'>{entry.overtime_date}</td>
                                    <td className='border-b border-[#eee] py-3 px-4 dark:border-strokedark'>{entry.overtime_hours}</td>
                                    <td className='border-b border-[#eee] py-3 px-4 dark:border-strokedark'>{entry.reason}</td>
                                    <td className='border-b border-[#eee] py-3 px-4 dark:border-strokedark'>{entry.status}</td>
                                </tr>
                            ))}
                            {overtimeEntries.length === 0 && (
                                <tr>
                                    <td colSpan='5' className='text-center py-4 text-bodydark2'>Belum ada data lembur</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </Layout>
    );
};

export default DataLembur;
