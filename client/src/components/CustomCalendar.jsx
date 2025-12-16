import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, addMonths, subMonths, isSameMonth, isSameDay, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const CustomCalendar = ({ selectedDate, onChange, onClose }) => {
    // Initialize with selected date or today
    const [currentMonth, setCurrentMonth] = useState(() => {
        return selectedDate ? parseISO(selectedDate) : new Date();
    });

    const onDateClick = (day) => {
        onChange(format(day, 'yyyy-MM-dd'));
        onClose();
    };

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    // Generate days
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const dateFormat = "d";
    const days = [];
    let day = startDate;
    let formattedDate = "";

    const rows = [];
    let daysInRow = [];

    const dayList = eachDayOfInterval({ start: startDate, end: endDate });

    // Header (Days of week)
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="bg-card border border-border rounded-xl shadow-2xl p-4 w-72 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <button onClick={prevMonth} className="p-1 hover:text-accent transition-colors">
                    <ChevronLeft size={20} />
                </button>
                <span className="font-bold text-lg text-white">
                    {format(currentMonth, 'MMMM yyyy')}
                </span>
                <button onClick={nextMonth} className="p-1 hover:text-accent transition-colors">
                    <ChevronRight size={20} />
                </button>
            </div>

            {/* Days Header */}
            <div className="grid grid-cols-7 mb-2 text-center">
                {weekDays.map(day => (
                    <div key={day} className="text-xs text-text-muted font-bold uppercase tracking-wide">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
                {dayList.map((dayItem, i) => {
                    const isSelected = selectedDate ? isSameDay(dayItem, parseISO(selectedDate)) : false;
                    const isCurrentMonth = isSameMonth(dayItem, monthStart);

                    return (
                        <div
                            key={i}
                            className={`
                                text-center p-2 rounded-lg cursor-pointer text-sm transition-all
                                ${!isCurrentMonth ? 'text-text-muted opacity-30' : 'text-text'}
                                ${isSelected ? 'bg-accent text-white font-bold shadow-lg shadow-accent/20' : 'hover:bg-border'}
                            `}
                            onClick={() => onDateClick(dayItem)}
                        >
                            {format(dayItem, 'd')}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CustomCalendar;
