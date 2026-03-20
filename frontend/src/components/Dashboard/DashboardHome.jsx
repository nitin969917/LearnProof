import CalendarCard from "./CalendarCard";
import XPChart from "./XPChart";
import CompletedSection from "./CompletedSection";
import ContinueWatching from "./ContinueWatching";
import PlaylistSection from "./PlaylistSection";
import DailyTasksCard from "./DailyTasksCard";

const DashboardHome = () => (
    <div className="p-4 sm:p-6 flex flex-col lg:flex-row gap-6">
        {/* Left column (Flexible) */}
        <div className="flex-1 min-w-0 space-y-6">
            <PlaylistSection />
            <ContinueWatching />
            <CompletedSection />
        </div>

        {/* Right column (Fixed width on large screens) */}
        <div className="w-full lg:w-[350px] space-y-6 shrink-0">
            <DailyTasksCard />
            <CalendarCard />
            <XPChart />
        </div>
    </div>
);

export default DashboardHome;