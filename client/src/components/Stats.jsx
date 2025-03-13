import { useState, useEffect } from 'react';

const Stats = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchStats = async () => {
        try {
            const API_URL = 'http://localhost:3000';
            console.log('Fetching stats from:', `${API_URL}/api/stats`);
            
            const response = await fetch(`${API_URL}/api/stats`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Received stats:', data);
            setStats(data);
        } catch (error) {
            console.error('Error loading stats:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    // Handle loading state
    if (loading) {
        return <div>Loading stats...</div>;
    }

    // Handle empty data state
    if (!stats) {
        return <div>No documents processed yet.</div>;
    }

    // Handle error state
    if (error) {
        return <div className="error">Error: {error}</div>;
    }

    // Show stats info
    return (
        <div className="stats">
            <h2>Document Statistics</h2>
            <div className="stats-content">
                <p>Total Documents: {stats.documentCount || 0}</p>
                <p>Last Updated: {stats.lastUpdated ? new Date(stats.lastUpdated).toLocaleString() : 'Never'}</p>
                <p>Status: {stats.status}</p>
            </div>
        </div>
    );
};

export default Stats;