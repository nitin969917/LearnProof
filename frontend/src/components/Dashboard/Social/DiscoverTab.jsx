import { useState, useEffect } from 'react';
import { Search, MapPin, GraduationCap, ArrowRight, UserCheck } from 'lucide-react';
import socialApi from '../../../api/socialApi.js';

export default function DiscoverTab({ onViewProfile }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Auto-search after 300ms typing delay
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const delayDebounce = setTimeout(() => {
      handleSearch();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const response = await socialApi.get(`/users/search?q=${encodeURIComponent(query)}`);
      setResults(response.data);
    } catch (err) {
      console.error('Failed to search', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      {/* Search Input Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Find Connections & Friends</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">Search by name, college, department or location.</p>
        
        <div className="relative flex items-center">
          <Search className="absolute left-4 text-gray-400 pointer-events-none" size={20} />
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a name, college, major, or location..."
            className="w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-750 rounded-xl pl-12 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-orange-500 text-base transition-all"
          />
        </div>
      </div>

      {/* Results Section */}
      <div className="flex flex-col gap-4">
        {loading && (
          <div className="text-center py-12 text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent mx-auto mb-2"></div>
            <span>Searching community...</span>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.map((student) => (
              <div 
                key={student.id} 
                onClick={() => onViewProfile(student.id)}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm hover:shadow-md transition-all cursor-pointer flex gap-4 items-center group"
              >
                <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 bg-orange-100 dark:bg-orange-950 flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold text-xl">
                  {student.profilePicture ? (
                    <img src={student.profilePicture} alt={student.name} className="w-full h-full object-cover" />
                  ) : (
                    student.name?.[0]?.toUpperCase() || '?'
                  )}
                </div>
                
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-orange-500 transition-colors text-base truncate">{student.name}</h3>
                  {student.department && (
                    <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-xs mt-0.5 truncate">
                      <GraduationCap size={14} className="text-orange-400" />
                      <span>{student.department}</span>
                    </div>
                  )}
                  {student.collegeName && (
                    <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-xs mt-0.5 truncate">
                      <MapPin size={14} className="text-orange-400" />
                      <span>{student.collegeName}</span>
                    </div>
                  )}
                </div>
                
                <div className="bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 p-2.5 rounded-full opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                  <ArrowRight size={18} />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && query && results.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-12 text-center text-gray-500 dark:text-gray-400">
             <UserCheck size={36} className="mx-auto mb-2 text-gray-300 dark:text-gray-600" />
             <p className="font-semibold mb-1">No users found</p>
             <p className="text-xs">Try searching for another name, department, or keywords.</p>
          </div>
        )}

        {!query && (
          <div className="bg-white/50 dark:bg-gray-800/50 border border-dashed border-gray-250 dark:border-gray-700 rounded-2xl p-12 text-center text-gray-500 dark:text-gray-500">
             <Search size={32} className="mx-auto mb-2 opacity-50" />
             <p className="text-sm">Start searching above to locate people in the community.</p>
          </div>
        )}
      </div>
    </div>
  );
}
