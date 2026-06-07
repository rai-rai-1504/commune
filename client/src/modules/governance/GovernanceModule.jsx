import React, { useState } from 'react';
import { useStore } from '../../store/useStore';

const CATEGORY_META = {
  transit:        { icon: '🚇', color: 'blue',  label: 'Transit' },
  zoning:         { icon: '🗺️', color: 'amber', label: 'Zoning' },
  budget:         { icon: '💰', color: 'green', label: 'Budget' },
  infrastructure: { icon: '🏗️', color: 'blue',  label: 'Infrastructure' },
  general:        { icon: '📋', color: 'gray',  label: 'General' },
};

function fmtTime(ms) {
  if (ms <= 0) return 'Expired';
  const h = Math.floor(ms / 3600000);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ${h % 24}h left`;
  if (h > 0) return `${h}h ${Math.floor((ms % 3600000) / 60000)}m left`;
  return `${Math.floor(ms / 60000)}m left`;
}

export default function GovernanceModule() {
  const { proposals, vote, createProposal, username, city, presence } = useStore();
  const [tab, setTab] = useState('open');
  const [showCreate, setShowCreate] = useState(false);

  const open   = proposals.filter(p => p.status === 'open');
  const closed = proposals.filter(p => p.status !== 'open');
  const needVote = open.filter(p =>
    !p.votes.for.includes(username) &&
    !p.votes.against.includes(username) &&
    !p.votes.abstain.includes(username)
  ).length;

  const shown = tab === 'open' ? open : tab === 'closed' ? closed : proposals;

  return (
    <div style={{ display:'flex', flex:1, overflow:'hidden' }}>

      {/* ── Left sidebar ── */}
      <div className="side-panel">
        <div className="panel-section">
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:20 }}>🏛️</span>
            <div>
              <div className="panel-title">City Council</div>
              <div className="panel-sub">Nova Arcadia</div>
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div style={{ padding:'10px 12px', borderBottom:'1px solid var(--border)' }}>
          <StatRow label="Open proposals" value={open.length} color="var(--accent)" />
          <StatRow label="Need your vote"  value={needVote}  color={needVote>0?'var(--amber)':'var(--green)'} />
          <StatRow label="Citizens online" value={presence.length} />
          {city && <StatRow label="Treasury" value={`₡${Math.round(city.stats.treasury/1000)}k`} color={(city.stats.treasury>300000)?'var(--green)':'var(--amber)'} />}
        </div>

        {/* Tab filter */}
        <div style={{ padding:'8px 12px', borderBottom:'1px solid var(--border)' }}>
          <div className="panel-label">View</div>
          {[
            { id:'open',   icon:'🟢', label:'Open',   count: open.length },
            { id:'closed', icon:'✅', label:'Closed', count: closed.length },
            { id:'all',    icon:'📋', label:'All',    count: proposals.length },
          ].map(t => (
            <button key={t.id} className={`tool-btn ${tab===t.id?'active':''}`} onClick={() => setTab(t.id)}>
              <span>{t.icon}</span> {t.label}
              <span style={{ marginLeft:'auto', fontSize:11, opacity:0.6 }}>{t.count}</span>
            </button>
          ))}
        </div>

        {/* Online players */}
        <div style={{ padding:'10px 12px', flex:1, overflowY:'auto' }}>
          <div className="panel-label">Players Online</div>
          {presence.map(p => (
            <div key={p.id} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
              <div style={{ width:26, height:26, borderRadius:'50%', background:p.color+'22', color:p.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, border:`1.5px solid ${p.color}44`, flexShrink:0 }}>
                {p.username.slice(0,2).toUpperCase()}
              </div>
              <div style={{ minWidth:0 }}>
                <div style={{ fontSize:12, color: p.username===username?'var(--accent)':'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  @{p.username}{p.username===username&&<span style={{ fontSize:10, color:'var(--text3)', marginLeft:4 }}>(you)</span>}
                </div>
              </div>
            </div>
          ))}
          {!presence.length && <div style={{ fontSize:11, color:'var(--text3)' }}>No one online</div>}
        </div>

        <div style={{ padding:'10px 12px', borderTop:'1px solid var(--border)' }}>
          <button className="btn primary full" onClick={() => setShowCreate(true)}>+ New Proposal</button>
        </div>
      </div>

      {/* ── Main content ── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>
        {/* Header */}
        <div style={{ padding:'16px 22px 12px', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <div style={{ fontSize:17, fontWeight:600, color:'var(--text)' }}>
                {tab==='open'?'Active Proposals':tab==='closed'?'Resolved Proposals':'All Proposals'}
              </div>
              <div style={{ fontSize:12, color:'var(--text2)', marginTop:2 }}>
                {shown.length} proposal{shown.length!==1?'s':''}{tab==='open'&&needVote>0&&<span style={{ color:'var(--amber)', marginLeft:8 }}>· {needVote} need your vote</span>}
              </div>
            </div>
            <button className="btn primary" onClick={() => setShowCreate(true)}>+ Propose</button>
          </div>
        </div>

        {/* List */}
        <div style={{ flex:1, overflowY:'auto', padding:'14px 22px' }}>
          {shown.length === 0 && (
            <div style={{ textAlign:'center', padding:'48px 0', color:'var(--text3)' }}>
              <div style={{ fontSize:32, marginBottom:10 }}>🗳️</div>
              No proposals here yet.<br />Be the first to propose something!
            </div>
          )}
          {shown.map(p => (
            <ProposalCard key={p.id} proposal={p} username={username} onVote={vote} treasury={city?.stats?.treasury || 0} />
          ))}
        </div>
      </div>

      {showCreate && <CreateModal onClose={() => setShowCreate(false)} treasury={city?.stats?.treasury||0} />}
    </div>
  );
}

function StatRow({ label, value, color }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--text2)', marginBottom:5 }}>
      <span>{label}</span>
      <span style={{ fontWeight:600, color: color || 'var(--text)' }}>{value}</span>
    </div>
  );
}

function ProposalCard({ proposal: p, username, onVote, treasury }) {
  const [expanded, setExpanded] = useState(false);
  const total = p.votes.for.length + p.votes.against.length + p.votes.abstain.length;
  const forPct  = total ? Math.round((p.votes.for.length / total) * 100) : 0;
  const agrPct  = total ? Math.round((p.votes.against.length / total) * 100) : 0;
  const myVote  = p.votes.for.includes(username) ? 'for' : p.votes.against.includes(username) ? 'against' : p.votes.abstain.includes(username) ? 'abstain' : null;
  const isOpen  = p.status === 'open';
  const passed  = p.status === 'passed';
  const failed  = p.status === 'failed';
  const meta    = CATEGORY_META[p.category] || CATEGORY_META.general;
  const timeMs  = p.expiresAt - Date.now();
  const isUrgent = isOpen && timeMs < 86400000;
  const canAfford = p.cost === 0 || p.cost <= treasury;

  return (
    <div style={{
      background:'var(--bg2)', border:`1px solid ${isUrgent?'rgba(226,75,74,0.4)':passed?'rgba(29,158,117,0.3)':failed?'rgba(226,75,74,0.2)':'var(--border)'}`,
      borderRadius:'var(--radius-lg)', padding:'16px 18px', marginBottom:12,
      borderLeft: passed?'3px solid var(--green)': failed?'3px solid var(--red)': isUrgent?'3px solid var(--red)': myVote?'3px solid var(--accent2)': '1px solid var(--border)',
    }}>
      {/* Header row */}
      <div style={{ display:'flex', alignItems:'flex-start', gap:12, marginBottom:10 }}>
        <span style={{ fontSize:22, marginTop:2, flexShrink:0 }}>{meta.icon}</span>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:7, flexWrap:'wrap', marginBottom:3 }}>
            <span style={{ fontSize:14, fontWeight:600, color:'var(--text)', lineHeight:1.3 }}>{p.title}</span>
            <span className={`badge ${meta.color}`}>{meta.label}</span>
            {passed && <span className="badge green">Passed ✓</span>}
            {failed && <span className="badge red">Failed ✗</span>}
            {isUrgent && isOpen && <span className="badge red">⏰ Urgent</span>}
            {!canAfford && isOpen && <span className="badge red">⚠️ Unaffordable</span>}
          </div>
          <div style={{ fontSize:11, color:'var(--text3)' }}>
            By @{p.proposedBy} · {new Date(p.createdAt).toLocaleDateString()}
            {isOpen && <span style={{ color: isUrgent?'var(--red)':'var(--text3)', marginLeft:6 }}>· {fmtTime(timeMs)}</span>}
          </div>
        </div>
        {p.cost > 0 && (
          <div style={{ textAlign:'right', flexShrink:0 }}>
            <div style={{ fontSize:14, fontWeight:700, color: canAfford?'var(--amber)':'var(--red)' }}>₡{p.cost>=1000000?(p.cost/1000000).toFixed(1)+'M':Math.round(p.cost/1000)+'k'}</div>
            <div style={{ fontSize:10, color:'var(--text3)' }}>{canAfford?'affordable':'over budget'}</div>
          </div>
        )}
      </div>

      {/* Description (collapsible) */}
      <div style={{ position:'relative', marginBottom:12 }}>
        <p style={{
          fontSize:12, color:'var(--text2)', lineHeight:1.65,
          borderLeft:'2px solid var(--border)', paddingLeft:10,
          overflow:'hidden', maxHeight: expanded?'none':'3.5em',
        }}>{p.description}</p>
        {p.description.length > 100 && (
          <button onClick={() => setExpanded(x=>!x)} style={{ background:'none', border:'none', color:'var(--accent)', fontSize:11, cursor:'pointer', padding:'2px 10px' }}>
            {expanded?'Show less':'Read more'}
          </button>
        )}
      </div>

      {/* Vote bars */}
      <div style={{ marginBottom:10 }}>
        <VoteBar label={`For (${p.votes.for.length})`} pct={forPct} color="var(--green)" />
        <VoteBar label={`Against (${p.votes.against.length})`} pct={agrPct} color="var(--red)" />
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'var(--text3)', marginTop:5 }}>
          <span>{total} vote{total!==1?'s':''} cast</span>
          {isOpen && total > 0 && (
            p.votes.for.length > p.votes.against.length
              ? <span style={{ color:'var(--green)' }}>▲ Currently passing</span>
              : p.votes.against.length > p.votes.for.length
              ? <span style={{ color:'var(--red)' }}>▼ Currently failing</span>
              : <span style={{ color:'var(--amber)' }}>⬌ Tied</span>
          )}
        </div>
      </div>

      {/* Voter tags */}
      {total > 0 && (
        <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginBottom:10 }}>
          {p.votes.for.map(u => <Voter key={u} name={u} type="for" />)}
          {p.votes.against.map(u => <Voter key={u} name={u} type="against" />)}
          {p.votes.abstain.map(u => <Voter key={u} name={u} type="abstain" />)}
        </div>
      )}

      {/* Actions */}
      {isOpen && (
        <div style={{ display:'flex', gap:7, alignItems:'center', flexWrap:'wrap' }}>
          {myVote ? (
            <>
              <div style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:6, background:'rgba(29,158,117,0.1)', border:'1px solid rgba(29,158,117,0.2)', fontSize:12, color:'var(--green)', flexShrink:0 }}>
                ✓ Voted {myVote}
              </div>
              <button className="btn sm" onClick={() => onVote(p.id,'for')} style={myVote==='for'?{opacity:0.4,pointerEvents:'none'}:{}}>For</button>
              <button className="btn sm danger" onClick={() => onVote(p.id,'against')} style={myVote==='against'?{opacity:0.4,pointerEvents:'none'}:{}}>Against</button>
              <button className="btn sm" onClick={() => onVote(p.id,'abstain')} style={myVote==='abstain'?{opacity:0.4,pointerEvents:'none'}:{}}>Abstain</button>
            </>
          ) : (
            <>
              <button className="btn success" onClick={() => onVote(p.id,'for')}>✓ Vote For</button>
              <button className="btn danger"  onClick={() => onVote(p.id,'against')}>✗ Vote Against</button>
              <button className="btn sm"      onClick={() => onVote(p.id,'abstain')}>Abstain</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function VoteBar({ label, pct, color }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5 }}>
      <span style={{ fontSize:11, color, width:80, flexShrink:0 }}>{label}</span>
      <div style={{ flex:1, height:6, background:'var(--border)', borderRadius:3, overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${pct}%`, background:color, borderRadius:3, transition:'width 0.4s ease' }} />
      </div>
      <span style={{ fontSize:11, color:'var(--text3)', width:30, textAlign:'right' }}>{pct}%</span>
    </div>
  );
}

function Voter({ name, type }) {
  const styles = {
    for:     { bg:'rgba(29,158,117,0.15)',  color:'#5DCAA5', prefix:'✓' },
    against: { bg:'rgba(226,75,74,0.15)',   color:'#F09595', prefix:'✗' },
    abstain: { bg:'var(--bg4)',             color:'var(--text3)', prefix:'–' },
  };
  const s = styles[type];
  return (
    <span style={{ fontSize:10, padding:'2px 8px', borderRadius:4, background:s.bg, color:s.color }}>
      {s.prefix} @{name}
    </span>
  );
}

const DURATIONS = [
  { value:1, label:'1 day' }, { value:3, label:'3 days' },
  { value:7, label:'7 days' }, { value:14, label:'2 weeks' },
];

function CreateModal({ onClose, treasury }) {
  const { createProposal, username } = useStore();
  const [form, setForm] = useState({ title:'', description:'', category:'general', durationDays:3, cost:0 });
  const s = (k) => (v) => setForm(f => ({ ...f, [k]: v }));
  const valid = form.title.trim().length >= 5 && form.description.trim().length >= 10;

  function submit() {
    if (!valid) return;
    createProposal({ ...form, proposedBy: username });
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ width:480 }}>
        <div className="modal-header">
          <div className="modal-title">New Proposal</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="form-group">
          <label className="form-label">Title * <span style={{ color:'var(--text3)', fontWeight:400 }}>(min 5 chars)</span></label>
          <input className="form-input" placeholder="e.g. Build a riverside park in District 4" value={form.title} onChange={e => s('title')(e.target.value)} autoFocus />
        </div>

        <div className="form-group">
          <label className="form-label">Description * <span style={{ color:'var(--text3)', fontWeight:400 }}>(min 10 chars)</span></label>
          <textarea className="form-input" placeholder="Describe the proposal, benefits, and any trade-offs in detail…" value={form.description} onChange={e => s('description')(e.target.value)} style={{ minHeight:100 }} />
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select className="form-input" value={form.category} onChange={e => s('category')(e.target.value)}>
              {Object.entries(CATEGORY_META).map(([k,v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Voting Period</label>
            <select className="form-input" value={form.durationDays} onChange={e => s('durationDays')(parseInt(e.target.value))}>
              {DURATIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">
            Estimated Cost (₡)
            <span style={{ marginLeft:8, fontSize:10, color: form.cost > treasury ? 'var(--red)' : 'var(--text3)', fontWeight:400 }}>
              Treasury: ₡{Math.round(treasury/1000)}k {form.cost > treasury && '— over budget!'}
            </span>
          </label>
          <input className="form-input" type="number" min={0} step={5000} value={form.cost} onChange={e => s('cost')(parseInt(e.target.value)||0)} />
        </div>

        <div style={{ background:'var(--bg3)', borderRadius:8, padding:'10px 12px', fontSize:11, color:'var(--text2)', marginBottom:4 }}>
          💡 Proposals pass automatically when all online players have voted and the <strong>For</strong> votes outnumber <strong>Against</strong>. Passed infrastructure proposals affect city happiness and treasury.
        </div>

        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn primary" onClick={submit} disabled={!valid} style={!valid?{opacity:0.45}:{}}>
            Submit Proposal →
          </button>
        </div>
      </div>
    </div>
  );
}
