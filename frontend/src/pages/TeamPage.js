import React, { useEffect, useState } from 'react';
import { teamAPI } from '../utils/api';
import MemberCard from '../components/team/MemberCard';
import TeamFilters from '../components/team/TeamFilters';
import Spinner from '../components/shared/Spinner';
import EmptyState from '../components/shared/EmptyState';

export default function TeamPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ search: '', role: '', status: '', project: '', active: false });

  useEffect(() => {
    setLoading(true);
    teamAPI.getAll()
      .then(r => { setMembers(r.data.users); setLoading(false); })
      .catch(err => { setError(err.response?.data?.message || 'Failed to load team.'); setLoading(false); });
  }, []);

  // Filtering logic
  const filtered = members.filter(m => {
    if (filters.search && !(`${m.name} ${m.email}`.toLowerCase().includes(filters.search.toLowerCase()))) return false;
    if (filters.role && m.role !== filters.role) return false;
    if (filters.status && m.status !== filters.status) return false;
    if (filters.project && !(m.projects?.some(p => p._id === filters.project))) return false;
    if (filters.active && m.status !== 'active') return false;
    return true;
  });

  return (
    <div
      style={{
        padding: '24px 8px',
        maxWidth: 1200,
        margin: '0 auto',
        width: '100%',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 32,
            fontWeight: 800,
            margin: 0,
            flex: 1,
            minWidth: 180,
            textAlign: 'left',
          }}
        >
          Team Members
        </h1>
        <div style={{ minWidth: 220, flex: 2 }}>
          <TeamFilters filters={filters} setFilters={setFilters} />
        </div>
      </div>
      {loading ? (
        <Spinner />
      ) : error ? (
        <EmptyState message={error} />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))',
            gap: 20,
            width: '100%',
          }}
        >
          {filtered.length === 0 ? (
            <EmptyState message="No team members found." />
          ) : (
            filtered.map((member) => <MemberCard key={member._id} member={member} />)
          )}
        </div>
      )}
      <style>{`
        @media (max-width: 700px) {
          .team-filters {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 10px !important;
          }
        }
      `}</style>
    </div>
  );
}
