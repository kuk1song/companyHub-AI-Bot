import { useState, useEffect } from 'react';

const Stats = () => {
    const [stats, setStats] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch('http://localhost:3000/api/stats');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setStats(data);
            } catch (error) {
                console.error('Error fetching stats:', error);
                setError(error.message);
            }
        };

        fetchStats();
    }, []);

    if (error) return <div className="card">Error loading stats: {error}</div>;
    if (!stats) return <div className="card">Loading stats...</div>;

    return (
        <div className="card">
            <h2>Statistics</h2>
            <div className="stats-container">
                <h3>Knowledge Base Stats</h3>
                <p>Total Documents: {stats.totalDocuments || 0}</p>
                <p>Processed Files: {stats.processedFiles || 0}</p>
                {stats.documentTypes && (
                    <div className="document-types">
                        {Object.entries(stats.documentTypes).map(([type, count]) => (
                            <div key={type} className="type-item">
                                <span>{type}:</span>
                                <span>{count}</span>
                            </div>
                        ))}
                    </div>
                )}
                {stats.lastUpdated && (
                    <small>Last updated: {new Date(stats.lastUpdated).toLocaleString()}</small>
                )}
            </div>
        </div>
    );
};

export default Stats;