import React, { useState, useEffect } from 'react';
import { getWorkspaces, getTeamMembers, ClickUpMember } from '../utils/clickup';
import { UserIdentity } from '../utils/storage';

interface Props {
  onSelect: (user: UserIdentity) => void;
}

const UserPicker: React.FC<Props> = ({ onSelect }) => {
  const [members, setMembers] = useState<ClickUpMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const workspaces = await getWorkspaces();
        if (workspaces.length === 0) throw new Error('No ClickUp workspaces found.');
        const data = await getTeamMembers(workspaces[0].id);
        setMembers(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load team members');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSelect = (member: ClickUpMember) => {
    onSelect({
      id: String(member.id),
      username: member.username,
      email: member.email,
      profilePicture: member.profilePicture,
    });
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#37352f] mb-1 tracking-tight">Who's tracking today?</h1>
          <p className="text-[#a4a4a2] text-sm">Select your name to get started.</p>
        </div>

        {loading && (
          <div className="flex items-center gap-3 text-[#a4a4a2]">
            <div className="w-5 h-5 border-2 border-[#e9e9e7] border-t-[#37352f] rounded-full animate-spin shrink-0" />
            <span className="text-sm">Loading team members...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
            <p className="font-semibold mb-1">Could not load team</p>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-2">
            {members.map(member => {
              const initials = (member.username || member.email).charAt(0).toUpperCase();
              return (
                <button
                  key={member.id}
                  onClick={() => handleSelect(member)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-[#e9e9e7] hover:border-[#37352f] hover:bg-[#f7f7f5] transition-all text-left active:scale-[0.99]"
                >
                  {member.profilePicture ? (
                    <img
                      src={member.profilePicture}
                      alt=""
                      className="w-9 h-9 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-[#37352f] flex items-center justify-center text-white text-sm font-bold shrink-0">
                      {initials}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-[#37352f] truncate">
                      {member.username || member.email}
                    </div>
                    {member.username && (
                      <div className="text-xs text-[#a4a4a2] truncate">{member.email}</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserPicker;
