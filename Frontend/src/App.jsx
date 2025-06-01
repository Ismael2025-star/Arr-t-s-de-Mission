import React, { useState } from 'react'
import axios from 'axios';
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  // Language and theme state
  const [lang, setLang] = useState('fr')
  const [theme, setTheme] = useState('light')

  // Dummy user role for demo (to be replaced by real auth)
  const [role, setRole] = useState(null) // "secretaire", "ministre", "autorite", "admin"

  // Language switcher
  const switchLang = () => setLang(lang === 'fr' ? 'en' : 'fr')
  // Theme switcher
  const switchTheme = () => setTheme(theme === 'light' ? 'dark' : 'light')

  // Dummy login (replace with real auth)
  const loginAs = (r) => setRole(r)

  // --- Mission Order Form State ---
  const [missionForm, setMissionForm] = useState({
    title: '',
    start: '',
    end: '',
    location: '',
    amount: '',
    financier: '',
    personnes: [
      { ministere: '', direction: '', nom: '', fonction: '', debut: '', fin: '' }
    ],
    file: null,
  });
  const [total, setTotal] = useState(0);

  // --- Update Form State ---
  const updateMissionForm = (field, value) => {
    setMissionForm(f => ({ ...f, [field]: value }));
  };
  const updatePersonnes = (personnes) => {
    setMissionForm(f => ({ ...f, personnes }));
  };
  // --- Calculate Total Allocation ---
  React.useEffect(() => {
    setTotal(Number(missionForm.amount) * missionForm.personnes.length);
  }, [missionForm.amount, missionForm.personnes.length]);

  // --- Handle File Input ---
  const handleFile = e => updateMissionForm('file', e.target.files[0]);

  // --- Handle Form Submit ---
  const handleMissionSubmit = async e => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', missionForm.title);
    formData.append('start', missionForm.start);
    formData.append('end', missionForm.end);
    formData.append('location', missionForm.location);
    formData.append('amount', missionForm.amount);
    formData.append('financier', missionForm.financier);
    formData.append('personnes', JSON.stringify(missionForm.personnes));
    if (missionForm.file) formData.append('file', missionForm.file);
    try {
      await axios.post('http://localhost:3000/api/missions', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert(lang === 'fr' ? 'Arrêté de Mission soumis avec succès !' : 'Mission Order submitted successfully!');
      // Optionally reset form here
    } catch (err) {
      alert((lang === 'fr' ? 'Erreur lors de la soumission :' : 'Submission error:') + '\n' + (err?.response?.data?.message || err.message));
    }
  };

  return (
    <div
      className={
        theme === 'dark'
          ? 'dark bg-gray-900 min-h-screen text-white'
          : 'bg-white min-h-screen text-gray-900'
      }
    >
      <header className="flex justify-between items-center p-4 border-b">
        <h1 className="text-2xl font-bold">
          {lang === 'fr'
            ? 'Système de Gestion des Arrêtés de Mission'
            : 'Mission Order Management System'}
        </h1>
        <div className="flex gap-2">
          <button
            onClick={switchLang}
            className="px-2 py-1 border rounded"
          >
            {lang === 'fr' ? 'EN' : 'FR'}
          </button>
          <button
            onClick={switchTheme}
            className="px-2 py-1 border rounded"
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </header>
      <main className="p-4">
        {!role ? (
          <div className="space-y-2">
            <p>
              {lang === 'fr'
                ? 'Se connecter en tant que :'
                : 'Login as:'}
            </p>
            <div className="flex gap-2">
              <button onClick={() => loginAs('secretaire')} className="btn">{lang === 'fr' ? 'Secrétaire' : 'Secretary'}</button>
              <button onClick={() => loginAs('ministre')} className="btn">{lang === 'fr' ? 'Ministre' : 'Minister'}</button>
              <button onClick={() => loginAs('autorite')} className="btn">{lang === 'fr' ? 'Autorité' : 'Authority'}</button>
              <button onClick={() => loginAs('admin')} className="btn">Admin</button>
            </div>
          </div>
        ) : (
          <div>
            <p>
              {lang === 'fr'
                ? `Connecté en tant que : ${role}`
                : `Logged in as: ${role}`}
            </p>
            {/* Role-based dashboard placeholder */}
            {role === 'secretaire' && (
              <div className="mt-4">
                <h2 className="text-xl font-semibold mb-2">{lang === 'fr' ? 'Soumettre un Arrêté de Mission' : 'Submit Mission Order'}</h2>
                {/* Mission Order Submission Form */}
                <form className="space-y-4 p-4 border rounded bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white" onSubmit={handleMissionSubmit}>
                  <div>
                    <label className="block mb-1 font-medium">{lang === 'fr' ? 'Intitulé de la mission' : 'Mission Title'}</label>
                    <input type="text" className="w-full p-2 border rounded" required value={missionForm.title} onChange={e => updateMissionForm('title', e.target.value)} />
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block mb-1 font-medium">{lang === 'fr' ? 'Date de début' : 'Start Date'}</label>
                      <input type="date" className="w-full p-2 border rounded" required value={missionForm.start} onChange={e => updateMissionForm('start', e.target.value)} />
                    </div>
                    <div className="flex-1">
                      <label className="block mb-1 font-medium">{lang === 'fr' ? 'Date de fin' : 'End Date'}</label>
                      <input type="date" className="w-full p-2 border rounded" required value={missionForm.end} onChange={e => updateMissionForm('end', e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">{lang === 'fr' ? 'Lieu' : 'Location'}</label>
                    <input type="text" className="w-full p-2 border rounded" required value={missionForm.location} onChange={e => updateMissionForm('location', e.target.value)} />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">{lang === 'fr' ? 'Montant alloué par personne' : 'Amount per Person'}</label>
                    <input type="number" className="w-full p-2 border rounded" required value={missionForm.amount} onChange={e => updateMissionForm('amount', e.target.value)} />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">{lang === 'fr' ? 'Nom/Fonction du Financier' : 'Finance Officer Name/Role'}</label>
                    <input type="text" className="w-full p-2 border rounded" required value={missionForm.financier} onChange={e => updateMissionForm('financier', e.target.value)} />
                  </div>
                  {/* Dynamic Personnes Concernées section */}
                  <div>
                    <label className="block mb-1 font-medium">{lang === 'fr' ? 'Personnes Concernées' : 'Participants'}</label>
                    <PersonnesSection lang={lang} personnes={missionForm.personnes} setPersonnes={updatePersonnes} />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">{lang === 'fr' ? 'Document scanné (PDF/Image)' : 'Scanned Document (PDF/Image)'}</label>
                    <input type="file" accept=".pdf,image/*" className="w-full" required onChange={handleFile} />
                  </div>
                  <div className="font-bold text-lg">
                    {lang === 'fr' ? 'Total alloué :' : 'Total Allocation:'} {total} FCFA
                  </div>
                  <button type="submit" className="btn w-full">{lang === 'fr' ? 'Soumettre' : 'Submit'}</button>
                </form>
              </div>
            )}
            {role === 'ministre' && (
              <div className="mt-4">
                <h2 className="text-xl font-semibold mb-2">{lang === 'fr' ? 'Tableau de bord des Approbations' : 'Approval Dashboard'}</h2>
                <ApprovalDashboard lang={lang} />
              </div>
            )}
            {role === 'autorite' && (
              <div className="mt-4">
                <h2 className="text-xl font-semibold mb-2">{lang === 'fr' ? 'Consultation et Suivi' : 'View & Track Orders'}</h2>
                <AuthorityDashboard lang={lang} />
              </div>
            )}
            {role === 'admin' && (
              <div className="mt-4">
                <h2 className="text-xl font-semibold mb-2">{lang === 'fr' ? 'Gestion des Utilisateurs' : 'User Management'}</h2>
                <AdminDashboard lang={lang} />
              </div>
            )}
            <button
              className="mt-4 btn"
              onClick={() => setRole(null)}
            >
              {lang === 'fr' ? 'Déconnexion' : 'Logout'}
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

// Add PersonnesSection component
function PersonnesSection({ lang, personnes, setPersonnes }) {
  const addPersonne = () => {
    setPersonnes([
      ...personnes,
      { ministere: '', direction: '', nom: '', fonction: '', debut: '', fin: '' }
    ]);
  };
  const removePersonne = (idx) => {
    setPersonnes(personnes.filter((_, i) => i !== idx));
  };
  const updatePersonne = (idx, field, value) => {
    setPersonnes(personnes.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  };
  return (
    <div className="space-y-2">
      {personnes.map((p, idx) => (
        <div key={idx} className="flex flex-wrap gap-2 items-end border p-2 rounded mb-2 bg-white dark:bg-gray-700">
          <input type="text" placeholder={lang === 'fr' ? 'Ministère' : 'Ministry'} className="p-1 border rounded flex-1" value={p.ministere} onChange={e => updatePersonne(idx, 'ministere', e.target.value)} required />
          <input type="text" placeholder={lang === 'fr' ? 'Direction' : 'Department'} className="p-1 border rounded flex-1" value={p.direction} onChange={e => updatePersonne(idx, 'direction', e.target.value)} required />
          <input type="text" placeholder={lang === 'fr' ? 'Nom' : 'Name'} className="p-1 border rounded flex-1" value={p.nom} onChange={e => updatePersonne(idx, 'nom', e.target.value)} required />
          <input type="text" placeholder={lang === 'fr' ? 'Fonction' : 'Role'} className="p-1 border rounded flex-1" value={p.fonction} onChange={e => updatePersonne(idx, 'fonction', e.target.value)} required />
          <input type="date" placeholder={lang === 'fr' ? 'Début' : 'Start'} className="p-1 border rounded" value={p.debut} onChange={e => updatePersonne(idx, 'debut', e.target.value)} required />
          <input type="date" placeholder={lang === 'fr' ? 'Fin' : 'End'} className="p-1 border rounded" value={p.fin} onChange={e => updatePersonne(idx, 'fin', e.target.value)} required />
          {personnes.length > 1 && (
            <button type="button" className="text-red-500 ml-2" onClick={() => removePersonne(idx)}>-</button>
          )}
        </div>
      ))}
      <button type="button" className="btn" onClick={addPersonne}>{lang === 'fr' ? '+ Ajouter' : '+ Add'}</button>
    </div>
  );
}

// Add ApprovalDashboard component
function ApprovalDashboard({ lang }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  React.useEffect(() => {
    axios.get('http://localhost:3000/api/missions/pending')
      .then(res => setOrders(res.data))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);
  if (loading) return <div>{lang === 'fr' ? 'Chargement...' : 'Loading...'}</div>;
  if (!orders.length) return <div>{lang === 'fr' ? 'Aucun ordre en attente.' : 'No pending orders.'}</div>;
  return (
    <div className="space-y-4">
      {orders.map(order => (
        <div key={order.id} className="border rounded p-4 bg-white dark:bg-gray-700">
          <div className="font-bold">{order.title}</div>
          <div>{lang === 'fr' ? 'Lieu' : 'Location'}: {order.location}</div>
          <div>{lang === 'fr' ? 'Dates' : 'Dates'}: {order.start} - {order.end}</div>
          <div>{lang === 'fr' ? 'Montant total' : 'Total Amount'}: {order.total} FCFA</div>
          <div className="flex gap-2 mt-2">
            <button className="btn bg-green-600 text-white">{lang === 'fr' ? 'Approuver' : 'Approve'}</button>
            <button className="btn bg-red-600 text-white">{lang === 'fr' ? 'Rejeter' : 'Reject'}</button>
          </div>
        </div>
      ))}
    </div>
  );
}

// Add AuthorityDashboard component
function AuthorityDashboard({ lang }) {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState('');
  React.useEffect(() => {
    axios.get('http://localhost:3000/api/missions')
      .then(res => setOrders(res.data))
      .catch(() => setOrders([]));
  }, []);
  const filtered = orders.filter(o =>
    o.title.toLowerCase().includes(search.toLowerCase()) ||
    o.location.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div>
      <input
        type="text"
        placeholder={lang === 'fr' ? 'Recherche...' : 'Search...'}
        className="p-2 border rounded mb-4 w-full"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <div className="space-y-4">
        {filtered.map(order => (
          <div key={order.id} className="border rounded p-4 bg-white dark:bg-gray-700">
            <div className="font-bold">{order.title}</div>
            <div>{lang === 'fr' ? 'Lieu' : 'Location'}: {order.location}</div>
            <div>{lang === 'fr' ? 'Dates' : 'Dates'}: {order.start} - {order.end}</div>
            <div>{lang === 'fr' ? 'Statut' : 'Status'}: {order.status}</div>
            <a href={order.fileUrl} className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">{lang === 'fr' ? 'Télécharger le document' : 'Download Document'}</a>
          </div>
        ))}
      </div>
    </div>
  );
}

// Add AdminDashboard component
function AdminDashboard({ lang }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  React.useEffect(() => {
    axios.get('http://localhost:3000/api/users')
      .then(res => setUsers(res.data))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);
  if (loading) return <div>{lang === 'fr' ? 'Chargement...' : 'Loading...'}</div>;
  return (
    <div className="space-y-4">
      {users.map(user => (
        <div key={user.id} className="border rounded p-4 bg-white dark:bg-gray-700 flex justify-between items-center">
          <div>
            <div className="font-bold">{user.username}</div>
            <div>{lang === 'fr' ? 'Rôle' : 'Role'}: {user.role}</div>
            <div>{lang === 'fr' ? 'Statut' : 'Status'}: {user.active ? (lang === 'fr' ? 'Actif' : 'Active') : (lang === 'fr' ? 'Inactif' : 'Inactive')}</div>
          </div>
          <div className="flex gap-2">
            <button className="btn bg-yellow-500 text-white">{lang === 'fr' ? 'Modifier' : 'Edit'}</button>
            <button className="btn bg-red-600 text-white">{lang === 'fr' ? (user.active ? 'Désactiver' : 'Activer') : (user.active ? 'Deactivate' : 'Activate')}</button>
          </div>
        </div>
      ))}
      {/* TODO: Add user creation form/modal */}
    </div>
  );
}

export default App
