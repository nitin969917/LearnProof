import CalendarCard from "./CalendarCard";
import XPChart from "./XPChart";
import CompletedSection from "./CompletedSection";
import ContinueWatching from "./ContinueWatching";
import PlaylistSection from "./PlaylistSection";
import DailyTasksCard from "./DailyTasksCard";

const DashboardHome = () => (
    <div className="p-4 sm:p-6 flex flex-col lg:flex-row gap-6 lg:items-start">
        {/* Left column (Flexible) */}
        <div className="flex-1 min-w-0 space-y-6">
            <PlaylistSection />
            <ContinueWatching />
            <CompletedSection />
        </div>

        {/* Right column (Fixed width on large screens, grid on tablet) */}
        <div className="w-full lg:w-[350px] shrink-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
            <DailyTasksCard />
            <CalendarCard />
            <div className="md:col-span-2 lg:col-span-1">
                <XPChart />
            </div>
        </div>
    </div>
);

export default DashboardHome;