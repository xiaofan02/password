import React, { useState, useEffect } from 'react';
import { Plus, Search, Trash2, LogOut, Lock } from 'lucide-react';

interface PasswordEntry {
  id: string;
  site: string;
  username: string;
  password: string;
  notes: string;
  category: 'network' | 'website' | 'application' | 'other';
  visibility: 'private' | 'shared';
  owner_id: number;
}

export default function PasswordVault() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [entries, setEntries] = useState<PasswordEntry[]>([]);
  const [search, setSearch] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const fetchEntries = async () => {
    const res = await fetch('/api/passwords', { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setEntries(data);
  };

  useEffect(() => {
    if (token) fetchEntries();
  }, [token]);

  const login = async (e: React.FormEvent, isRegister = false) => {
    e.preventDefault();
    const res = await fetch(`/api/${isRegister ? 'register' : 'login'}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (data.token) {
      localStorage.setItem('token', data.token);
      setToken(data.token);
    } else {
      alert(data.error || 'Failed');
    }
  };

  const addEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    await fetch('/api/passwords', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        site: formData.get('site'),
        username: formData.get('username'),
        password: formData.get('password'),
        notes: formData.get('notes'),
        category: formData.get('category'),
        visibility: formData.get('visibility'),
      }),
    });
    (e.target as HTMLFormElement).reset();
    fetchEntries();
  };

  const deleteEntry = async (id: string) => {
    await fetch(`/api/passwords/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    fetchEntries();
  };

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-neutral-100">
        <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-sm">
          <h1 className="text-2xl font-bold mb-4">Login / Register</h1>
          <input className="w-full p-2 border rounded mb-2" placeholder="Username" onChange={e => setUsername(e.target.value)} />
          <input className="w-full p-2 border rounded mb-4" type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} />
          <div className="flex gap-2">
            <button onClick={e => login(e)} className="flex-1 bg-black text-white p-2 rounded">Login</button>
            <button onClick={e => login(e, true)} className="flex-1 bg-neutral-200 p-2 rounded">Register</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Password Vault</h1>
        <button onClick={() => { localStorage.removeItem('token'); setToken(null); }} className="flex items-center gap-2 text-neutral-600"><LogOut size={16} /> Logout</button>
      </div>
      
      <div className="mb-8 bg-white p-6 rounded-2xl shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Add New Entry</h2>
        <form onSubmit={addEntry} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input name="site" placeholder="Site" className="p-2 border rounded" required />
          <input name="username" placeholder="Username" className="p-2 border rounded" required />
          <input name="password" type="password" placeholder="Password" className="p-2 border rounded" required />
          <input name="notes" placeholder="Notes" className="p-2 border rounded" />
          <select name="category" className="p-2 border rounded">
            <option value="website">Website</option>
            <option value="network">Network</option>
            <option value="application">Application</option>
            <option value="other">Other</option>
          </select>
          <select name="visibility" className="p-2 border rounded">
            <option value="private">Private</option>
            <option value="shared">Shared</option>
          </select>
          <button type="submit" className="bg-black text-white p-2 rounded flex items-center justify-center gap-2 md:col-span-2">
            <Plus size={16} /> Add
          </button>
        </form>
      </div>

      <div className="mb-8 flex items-center gap-2 bg-white p-4 rounded-2xl shadow-sm">
        <Search className="text-neutral-400" />
        <input placeholder="Search..." className="w-full p-2" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="grid gap-4">
        {entries.filter(e => e.site.toLowerCase().includes(search.toLowerCase())).map(entry => (
          <div key={entry.id} className="bg-white p-6 rounded-2xl shadow-sm flex justify-between items-center">
            <div>
              <h3 className="font-bold text-lg">{entry.site} {entry.visibility === 'private' && <Lock size={14} className="inline text-neutral-400" />}</h3>
              <p className="text-neutral-600">{entry.username}</p>
              <p className="text-neutral-400 text-sm">{entry.category} - {entry.notes}</p>
            </div>
            <button onClick={() => deleteEntry(entry.id)} className="text-red-500"><Trash2 /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
