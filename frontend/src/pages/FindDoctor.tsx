/* MediQue.ph — Find a doctor (search + specialty filter, server-side). */

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getDoctors, getSpecialties } from '../api';
import { Btn, Chip, DoctorCard, EmptyState } from '../components';
import { I, SpecIcon } from '../icons';
import type { Doctor, Specialty } from '../types';

export default function FindDoctor() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialSpec = searchParams.get('specialty');
  const [q, setQ] = useState('');
  const [spec, setSpec] = useState(initialSpec || 'all');
  const [specs, setSpecs] = useState<Specialty[]>([]);
  const [results, setResults] = useState<Doctor[] | null>(null);

  useEffect(() => { if (initialSpec) setSpec(initialSpec); }, [initialSpec]);

  useEffect(() => {
    getSpecialties().then(setSpecs).catch(() => { /* transient — chips stay minimal */ });
  }, []);

  useEffect(() => {
    let stale = false;
    getDoctors({ specialty: spec !== 'all' ? spec : undefined, q: q || undefined })
      .then((r) => { if (!stale) setResults(r); })
      .catch(() => { /* transient — keep previous results */ });
    return () => { stale = true; };
  }, [q, spec]);

  const chips: { id: string; name: string; icon?: string }[] = [{ id: 'all', name: 'All' }, ...specs];
  const specName = specs.find((s) => s.id === spec)?.name ?? '';

  return (
    <div className="screen-body fade-in app-pad">
      <div className="container" style={{ maxWidth: 1040, paddingTop: 28, paddingBottom: 60 }}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 'clamp(24px, 3.4vw, 30px)' }}>Find a doctor</h1>
          <p className="muted" style={{ fontSize: 15.5, marginTop: 6 }}>Search MakatiMed doctors by name or specialty, and see each day’s availability before you book.</p>
        </div>

        <div className="input-wrap" style={{ marginBottom: 16 }}>
          <span className="lead-icon">{I.search({ size: 19 })}</span>
          <input className="input" placeholder="Search doctors or specialties…" value={q} onChange={(e) => setQ(e.target.value)} style={{ minHeight: 52, fontSize: 15.5 }} />
          {q && <button className="pw-toggle" style={{ right: 8 }} onClick={() => setQ('')}>{I.x({ size: 18 })}</button>}
        </div>

        <div className="scroll-row" style={{ marginBottom: 24 }}>
          {chips.map((c) => <Chip key={c.id} selected={spec === c.id} onClick={() => setSpec(c.id)} icon={c.icon ? <SpecIcon name={c.icon} size={15} /> : null}>{c.name}</Chip>)}
        </div>

        {results && (
          <>
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
              <span className="muted" style={{ fontSize: 14, fontWeight: 500 }}>{results.length} doctor{results.length !== 1 ? 's' : ''} {spec !== 'all' ? 'in ' + specName : 'available'}</span>
            </div>

            {results.length ? (
              <div className="results-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 18 }}>
                {results.map((d) => <DoctorCard key={d.id} doctor={d} onClick={() => navigate('/doctors/' + d.id)} />)}
              </div>
            ) : (
              <EmptyState icon={I.search({ size: 30 })} title="No doctors found" body={`We couldn't find a match for "${q || specName}". Try a different specialty or name.`}
                action={<Btn variant="secondary" onClick={() => { setQ(''); setSpec('all'); }}>Clear filters</Btn>} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
