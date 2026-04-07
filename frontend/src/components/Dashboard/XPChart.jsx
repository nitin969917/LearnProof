import { useEffect, useState } from "react";
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useAuth } from '../../context/AuthContext';
import toast from "react-hot-toast";

const XPChart = () => {
    const { token } = useAuth();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!token) return;
        const fetchXPData = async () => {
            try {
                const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/activity/`, {
                    idToken: token,
                });
                setData(res.data.graph || []);
            }
            catch (err) {
                toast.error("Failed to load XP chart data.");
                console.error("Failed to fetch XP chart data: ", err);
            }
            finally {
                setLoading(false);
            }
        }

        fetchXPData();
    }, [token]);

    if (loading) {
        return (
            <div className="w-full h-64 sm:h-72 p-2 pb-8 bg-white dark:bg-gray-800 rounded-xl border border-orange-200 dark:border-gray-700 shadow-sm animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 w-1/2 rounded mb-3"></div>
                <div className="h-48 bg-gray-100 dark:bg-gray-700 rounded"></div>
            </div>
        );
    }

    return (
        <div className="w-full h-64 sm:h-72 p-2 pb-8 bg-white dark:bg-gray-800 rounded-xl border border-orange-200 dark:border-gray-700 shadow-sm">
            <h2 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-100" >XP Chart</h2>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: "currentColor" }} className="text-gray-500 dark:text-gray-400" />
                    <YAxis allowDecimals={false} tick={{ fill: "currentColor" }} className="text-gray-500 dark:text-gray-400" />
                    <Tooltip
                        contentStyle={{ backgroundColor: "var(--tooltip-bg, #fff)", borderColor: "#f97316", color: "var(--tooltip-text, #000)" }}
                        itemStyle={{ color: "var(--tooltip-text, #000)" }}
                        cursor={{ fill: "var(--tooltip-cursor, #fef3c7)", opacity: 0.5 }}
                    />
                    <Bar dataKey="activity_count" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default XPChart;