import React, { useState, useEffect } from 'react';
import { Target, CheckCircle2, Circle, Plus, X, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const DailyTasksCard = () => {
    const { user } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [newTask, setNewTask] = useState("");

    // Load tasks from local storage on mount
    useEffect(() => {
        if (user?.uid) {
            const savedTasks = localStorage.getItem(`learnproof_tasks_${user.uid}`);
            if (savedTasks) {
                try {
                    setTasks(JSON.parse(savedTasks));
                } catch (e) {
                    console.error("Failed to parse saved tasks", e);
                }
            }
        }
    }, [user]);

    // Save tasks to local storage whenever they change
    useEffect(() => {
        if (user?.uid) {
            localStorage.setItem(`learnproof_tasks_${user.uid}`, JSON.stringify(tasks));
        }
    }, [tasks, user]);

    const handleAddTask = (e) => {
        e.preventDefault();
        if (!newTask.trim()) return;

        const task = {
            id: Date.now().toString(),
            text: newTask.trim(),
            completed: false,
            createdAt: new Date().toISOString()
        };

        setTasks([task, ...tasks]);
        setNewTask("");
    };

    const toggleTask = (id) => {
        setTasks(tasks.map(task =>
            task.id === id ? { ...task, completed: !task.completed } : task
        ));
    };

    const deleteTask = (id) => {
        setTasks(tasks.filter(task => task.id !== id));
    };

    const completedCount = tasks.filter(t => t.completed).length;
    const progress = tasks.length === 0 ? 0 : Math.round((completedCount / tasks.length) * 100);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-orange-100 dark:border-gray-700 overflow-hidden transform transition-all duration-300 hover:shadow-md dark:shadow-gray-900/50">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-orange-50 dark:border-gray-700 bg-gradient-to-r from-orange-50/50 dark:from-gray-800 to-white dark:to-gray-800">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <Target className="text-orange-500 w-5 h-5" />
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Daily Goals</h2>
                    </div>
                    <span className="text-xs font-medium px-2.5 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full">
                        {completedCount}/{tasks.length} Done
                    </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 mt-2 overflow-hidden">
                    <div
                        className="bg-gradient-to-r from-orange-400 to-amber-500 h-1.5 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            </div>

            <div className="p-4 sm:p-5">
                {/* Add Task Input */}
                <form onSubmit={handleAddTask} className="relative mb-4">
                    <input
                        type="text"
                        value={newTask}
                        onChange={(e) => setNewTask(e.target.value)}
                        placeholder="Add a new goal..."
                        className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100 text-sm py-2.5 px-4 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all placeholder-gray-400 dark:placeholder-gray-500"
                    />
                    <button
                        type="submit"
                        disabled={!newTask.trim()}
                        className="absolute right-1.5 top-1.5 bottom-1.5 p-1 text-white bg-orange-500 rounded-md hover:bg-orange-600 disabled:opacity-50 disabled:bg-gray-400 transition-colors"
                    >
                        <Plus size={16} />
                    </button>
                </form>

                {/* Tasks List */}
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                    {tasks.length === 0 ? (
                        <div className="text-center py-6 text-gray-400 dark:text-gray-500 flex flex-col items-center">
                            <Target size={24} className="mb-2 opacity-20" />
                            <p className="text-sm">No goals set yet.</p>
                            <p className="text-xs mt-1">What do you want to learn today?</p>
                        </div>
                    ) : (
                        tasks.map((task) => (
                            <div
                                key={task.id}
                                className={`group flex items-center justify-between p-3 rounded-lg border transition-all duration-200 cursor-pointer ${task.completed
                                    ? 'bg-gray-50 dark:bg-gray-700/50 border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-500'
                                    : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-orange-200 dark:hover:border-orange-500/50 hover:shadow-sm text-gray-700 dark:text-gray-200'
                                    }`}
                                onClick={() => toggleTask(task.id)}
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <button
                                        className={`flex-shrink-0 transition-colors duration-200 ${task.completed ? 'text-green-500' : 'text-gray-300 dark:text-gray-600 group-hover:text-orange-400'
                                            }`}
                                    >
                                        {task.completed ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                                    </button>
                                    <span className={`text-sm truncate transition-all duration-200 ${task.completed ? 'line-through opacity-70' : 'font-medium'
                                        }`}>
                                        {task.text}
                                    </span>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteTask(task.id);
                                    }}
                                    className="p-1.5 text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-all duration-200"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default DailyTasksCard;
