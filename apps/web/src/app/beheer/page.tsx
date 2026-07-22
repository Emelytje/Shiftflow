'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { getToken } from '@/lib/auth';
import {
  Company,
  Employee,
  Department,
  Location,
  fetchCompany,
  updateCompany,
  fetchEmployees,
  createEmployee,
  updateEmployee,
  fetchDepartments,
  createDepartment,
  deleteDepartment,
  fetchLocations,
  createLocation,
  deleteLocation,
} from '@/lib/admin';

type Tab = 'bedrijf' | 'medewerkers' | 'afdelingen' | 'vestigingen';
const TABS: { key: Tab; label: string }[] = [
  { key: 'bedrijf', label: 'Bedrijf' },
  { key: 'medewerkers', label: 'Medewerkers' },
  { key: 'afdelingen', label: 'Afdelingen' },
  { key: 'vestigingen', label: 'Vestigingen' },
];

const ROLES = ['EMPLOYEE', 'TEAM_LEAD', 'MANAGER', 'HR', 'ACCOUNTING', 'OWNER'];

export default function AdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('bedrijf');
  const [company, setCompany] = useState<Company | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [c, e, d, l] = await Promise.all([
        fetchCompany(),
        fetchEmployees(),
        fetchDepartments(),
        fetchLocations(),
      ]);
      setCompany(c);
      setEmployees(e);
      setDepartments(d);
      setLocations(l);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Laden mislukt');
    }
  }, []);

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }
    load();
  }, [load, router]);

  // ── Bedrijf ──
  async function saveCompany() {
    if (!company) return;
    setMsg('');
    setError('');
    try {
      await updateCompany({
        name: company.name,
        logoUrl: company.logoUrl,
        primaryColor: company.primaryColor,
        accentColor: company.accentColor,
        vatNumber: company.vatNumber,
        address: company.address,
      });
      setMsg('Bedrijfsgegevens opgeslagen ✓');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Opslaan mislukt');
    }
  }

  // ── Medewerker toevoegen ──
  const [newEmp, setNewEmp] = useState({ firstName: '', lastName: '', email: '', role: 'EMPLOYEE', contractHoursPerWeek: '' });
  const [tempPw, setTempPw] = useState('');
  async function addEmployee() {
    setMsg('');
    setError('');
    setTempPw('');
    try {
      const res = await createEmployee({
        email: newEmp.email,
        firstName: newEmp.firstName,
        lastName: newEmp.lastName,
        role: newEmp.role,
        contractHoursPerWeek: newEmp.contractHoursPerWeek ? Number(newEmp.contractHoursPerWeek) : undefined,
      });
      setTempPw(res.tempPassword);
      setNewEmp({ firstName: '', lastName: '', email: '', role: 'EMPLOYEE', contractHoursPerWeek: '' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Toevoegen mislukt');
    }
  }
  async function toggleActive(emp: Employee) {
    await updateEmployee(emp.id, { isActive: !emp.isActive });
    await load();
  }

  // ── Afdeling / vestiging ──
  const [newDept, setNewDept] = useState({ name: '', color: '#38BDF8' });
  const [newLoc, setNewLoc] = useState({ name: '', address: '' });
  async function addDept() {
    if (!newDept.name) return;
    await createDepartment(newDept);
    setNewDept({ name: '', color: '#38BDF8' });
    await load();
  }
  async function addLoc() {
    if (!newLoc.name) return;
    await createLocation(newLoc);
    setNewLoc({ name: '', address: '' });
    await load();
  }

  return (
    <AppShell>
      <div className="p-6">
        <h1 className="text-2xl font-semibold">Beheer</h1>
        <p className="text-sm text-white/50">Beheer je bedrijf, medewerkers, afdelingen en vestigingen</p>

        {msg && <p className="mt-4 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">{msg}</p>}
        {error && <p className="mt-4 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}

        {/* Tabs */}
        <div className="mt-5 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setMsg(''); setError(''); setTempPw(''); }}
              className={`rounded-xl px-4 py-2 text-sm transition ${tab === t.key ? 'bg-sky-500/20 text-sky-300' : 'text-white/70 hover:bg-white/5'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Bedrijf */}
        {tab === 'bedrijf' && company && (
          <div className="glass mt-5 max-w-xl p-6">
            <div className="space-y-4">
              <div>
                <label className="label">Bedrijfsnaam</label>
                <input className="input" value={company.name} onChange={(e) => setCompany({ ...company, name: e.target.value })} />
              </div>
              <div>
                <label className="label">Logo-URL</label>
                <input className="input" value={company.logoUrl ?? ''} onChange={(e) => setCompany({ ...company, logoUrl: e.target.value })} placeholder="https://…/logo.png" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Hoofdkleur</label>
                  <input type="color" className="input h-11 p-1" value={company.primaryColor} onChange={(e) => setCompany({ ...company, primaryColor: e.target.value })} />
                </div>
                <div>
                  <label className="label">Accentkleur</label>
                  <input type="color" className="input h-11 p-1" value={company.accentColor} onChange={(e) => setCompany({ ...company, accentColor: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">BTW-nummer</label>
                  <input className="input" value={company.vatNumber ?? ''} onChange={(e) => setCompany({ ...company, vatNumber: e.target.value })} />
                </div>
                <div>
                  <label className="label">Adres</label>
                  <input className="input" value={company.address ?? ''} onChange={(e) => setCompany({ ...company, address: e.target.value })} />
                </div>
              </div>
              <button onClick={saveCompany} className="btn-primary">Opslaan</button>
            </div>
          </div>
        )}

        {/* Medewerkers */}
        {tab === 'medewerkers' && (
          <div className="mt-5 grid gap-5 lg:grid-cols-3">
            <div className="glass p-5">
              <h2 className="font-semibold">Nieuwe medewerker</h2>
              <div className="mt-3 space-y-3">
                <input className="input" placeholder="Voornaam" value={newEmp.firstName} onChange={(e) => setNewEmp({ ...newEmp, firstName: e.target.value })} />
                <input className="input" placeholder="Achternaam" value={newEmp.lastName} onChange={(e) => setNewEmp({ ...newEmp, lastName: e.target.value })} />
                <input className="input" placeholder="E-mail" value={newEmp.email} onChange={(e) => setNewEmp({ ...newEmp, email: e.target.value })} />
                <select className="input" value={newEmp.role} onChange={(e) => setNewEmp({ ...newEmp, role: e.target.value })}>
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
                <input className="input" type="number" placeholder="Contracturen/week" value={newEmp.contractHoursPerWeek} onChange={(e) => setNewEmp({ ...newEmp, contractHoursPerWeek: e.target.value })} />
                <button onClick={addEmployee} className="btn-primary w-full">Toevoegen</button>
              </div>
              {tempPw && (
                <div className="mt-4 rounded-lg border border-amber-400/30 bg-amber-500/10 p-3 text-sm text-amber-200">
                  Tijdelijk wachtwoord (deel dit met de medewerker):
                  <code className="mt-1 block rounded bg-black/30 px-2 py-1 text-white">{tempPw}</code>
                </div>
              )}
            </div>

            <div className="glass overflow-x-auto p-5 lg:col-span-2">
              <h2 className="font-semibold">Medewerkers ({employees.length})</h2>
              <table className="mt-3 w-full min-w-[480px] text-sm">
                <thead>
                  <tr className="text-left text-white/50">
                    <th className="pb-2 font-medium">Naam</th>
                    <th className="pb-2 font-medium">Rol</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((e) => (
                    <tr key={e.id} className="border-t border-white/10">
                      <td className="py-2">
                        <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full align-middle" style={{ background: e.color }} />
                        {e.firstName} {e.lastName}
                        <span className="ml-1 text-white/40">{e.email}</span>
                      </td>
                      <td className="py-2 text-white/70">{e.role}</td>
                      <td className="py-2">
                        <span className={e.isActive ? 'text-emerald-300' : 'text-white/40'}>{e.isActive ? 'Actief' : 'Inactief'}</span>
                      </td>
                      <td className="py-2 text-right">
                        <button onClick={() => toggleActive(e)} className="rounded-lg border border-white/15 px-2.5 py-1 text-xs text-white/70 hover:bg-white/10">
                          {e.isActive ? 'Deactiveren' : 'Activeren'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Afdelingen */}
        {tab === 'afdelingen' && (
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <div className="glass p-5">
              <h2 className="font-semibold">Nieuwe afdeling</h2>
              <div className="mt-3 flex items-end gap-3">
                <div className="flex-1">
                  <label className="label">Naam</label>
                  <input className="input" value={newDept.name} onChange={(e) => setNewDept({ ...newDept, name: e.target.value })} placeholder="Bv. Keuken" />
                </div>
                <div>
                  <label className="label">Kleur</label>
                  <input type="color" className="input h-11 w-16 p-1" value={newDept.color} onChange={(e) => setNewDept({ ...newDept, color: e.target.value })} />
                </div>
                <button onClick={addDept} className="btn-primary">Toevoegen</button>
              </div>
            </div>
            <div className="glass p-5">
              <h2 className="font-semibold">Afdelingen ({departments.length})</h2>
              <div className="mt-3 space-y-2">
                {departments.map((d) => (
                  <div key={d.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                    <span className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ background: d.color }} />
                      {d.name}
                      {d.location && <span className="text-xs text-white/40">· {d.location.name}</span>}
                    </span>
                    <button onClick={() => deleteDepartment(d.id).then(load)} className="text-xs text-red-300 hover:underline">Verwijderen</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Vestigingen */}
        {tab === 'vestigingen' && (
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <div className="glass p-5">
              <h2 className="font-semibold">Nieuwe vestiging</h2>
              <div className="mt-3 space-y-3">
                <input className="input" placeholder="Naam" value={newLoc.name} onChange={(e) => setNewLoc({ ...newLoc, name: e.target.value })} />
                <input className="input" placeholder="Adres (optioneel)" value={newLoc.address} onChange={(e) => setNewLoc({ ...newLoc, address: e.target.value })} />
                <button onClick={addLoc} className="btn-primary">Toevoegen</button>
              </div>
            </div>
            <div className="glass p-5">
              <h2 className="font-semibold">Vestigingen ({locations.length})</h2>
              <div className="mt-3 space-y-2">
                {locations.map((l) => (
                  <div key={l.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                    <span>📍 {l.name}{l.address && <span className="ml-1 text-xs text-white/40">{l.address}</span>}</span>
                    <button onClick={() => deleteLocation(l.id).then(load)} className="text-xs text-red-300 hover:underline">Verwijderen</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
