import { useState } from 'react';
import { useT } from '../../core/store.js';
import { useStaff } from './useStaff.js';
import { useHomework } from '../homework/useHomework.js';
import { useChat } from '../chat/useChat.js';
import { useBookstore } from '../bookstore/useBookstore.js';
import { useMarketplace } from '../marketplace/useMarketplace.js';
import { useBuffet } from '../buffet/useBuffet.js';
import { Modal, Stat } from '../../ui/kit.jsx';
import { sfx } from '../../audio/sfx.js';

export default function StaffCabinet() {
  const t = useT();
  const staff = useStaff();
  const homework = useHomework();
  const chat = useChat();
  const bookstore = useBookstore();
  const marketplace = useMarketplace();
  const buffet = useBuffet();

  const [tab, setTab] = useState('overview');
  const [showProfile, setShowProfile] = useState(false);

  const tabs = [
    ['overview', '📊'],
    ['ai', '🤖'],
    ['profile', '👤'],
  ];

  const moduleStates = {
    homework: homework.list() || [],
    chats: { rooms: chat.rooms || [] },
    bookstore: { listings: bookstore.catalog || [], orders: bookstore.orders || [] },
    marketplace: { listings: marketplace.catalog || [], orders: marketplace.orders || [] },
    buffet: { orders: buffet.orders || [] },
  };

  const stats = staff.getDashboard(moduleStates);

  return (
    <div className="p-3 sm:p-5 space-y-5">
      <header className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xs font-black uppercase tracking-wide text-primary">{t('staff.subtitle')}</div>
            <h1 className="h2 mt-1">🏫 {t('staff.title')}</h1>
            <p className="mt-2 text-sm text-ink/60 max-w-2xl">
              {staff.role === 'admin' ? t('staff.desc.admin') : t('staff.desc.teacher')}
            </p>
          </div>
          <button className="btn-ghost !py-2" onClick={() => { sfx.click(); setShowProfile(true); }}>
            ✏️ {t('staff.editProfile')}
          </button>
        </div>
      </header>

      <div className="flex gap-2 flex-wrap">
        {tabs.map(([id, icon]) => (
          <button
            key={id}
            onClick={() => { sfx.click(); setTab(id); }}
            className={`btn !py-2 ${tab === id ? 'btn-primary' : 'btn-ghost'}`}
          >
            {icon} {t('staff.tab.' + id)}
          </button>
        ))}
      </div>

      {tab === 'overview' && <OverviewTab stats={stats} staff={staff} t={t} />}
      {tab === 'ai' && <AiTab staff={staff} t={t} />}
      {tab === 'profile' && <ProfileTab staff={staff} t={t} />}

      <Modal open={showProfile} onClose={() => setShowProfile(false)}>
        <ProfileForm staff={staff} t={t} onClose={() => setShowProfile(false)} />
      </Modal>
    </div>
  );
}

function OverviewTab({ stats, staff, t }) {
  const isAdmin = staff.role === 'admin';

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat icon="📝" label={t('staff.stat.hwTotal')} value={stats.homework.total} />
        <Stat icon="✅" label={t('staff.stat.hwDone')} value={stats.homework.completed} />
        <Stat icon="⏰" label={t('staff.stat.hwOverdue')} value={stats.homework.overdue} />
        <Stat icon="💬" label={t('staff.stat.chatRooms')} value={stats.chats.rooms} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-5 space-y-3">
          <div className="font-black">{t('staff.section.homework')}</div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-ink/60">{t('staff.stat.hwTotal')}</span>
              <span className="font-bold">{stats.homework.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink/60">{t('staff.stat.hwDone')}</span>
              <span className="font-bold text-emerald-600">{stats.homework.completed}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink/60">{t('staff.stat.hwOverdue')}</span>
              <span className="font-bold text-rose-600">{stats.homework.overdue}</span>
            </div>
          </div>
        </div>

        <div className="card p-5 space-y-3">
          <div className="font-black">{t('staff.section.chats')}</div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-ink/60">{t('staff.stat.chatRooms')}</span>
              <span className="font-bold">{stats.chats.rooms}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink/60">{t('staff.stat.chatMessages')}</span>
              <span className="font-bold">{stats.chats.messages}</span>
            </div>
          </div>
        </div>

        {isAdmin && (
          <>
            <div className="card p-5 space-y-3">
              <div className="font-black">{t('staff.section.bookstore')}</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-ink/60">{t('staff.stat.bsPending')}</span>
                  <span className="font-bold text-amber-600">{stats.bookstore.pending}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink/60">{t('staff.stat.bsOrders')}</span>
                  <span className="font-bold">{stats.bookstore.orders}</span>
                </div>
              </div>
            </div>

            <div className="card p-5 space-y-3">
              <div className="font-black">{t('staff.section.marketplace')}</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-ink/60">{t('staff.stat.mpPending')}</span>
                  <span className="font-bold text-amber-600">{stats.marketplace.pending}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink/60">{t('staff.stat.mpOrders')}</span>
                  <span className="font-bold">{stats.marketplace.orders}</span>
                </div>
              </div>
            </div>

            <div className="card p-5 space-y-3">
              <div className="font-black">{t('staff.section.buffet')}</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-ink/60">{t('staff.stat.bufPending')}</span>
                  <span className="font-bold text-amber-600">{stats.buffet.pendingOrders}</span>
                </div>
              </div>
            </div>
          </>
        )}

        {!isAdmin && (
          <div className="card p-5 space-y-3">
            <div className="font-black">{t('staff.section.myActivity')}</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-ink/60">{t('staff.stat.myListings')}</span>
                <span className="font-bold">{stats.bookstore.myListings + stats.marketplace.myListings}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink/60">{t('staff.stat.myOrders')}</span>
                <span className="font-bold">{stats.buffet.myOrders}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AiTab({ staff, t }) {
  const config = staff.getAiConfig();
  const [selectedProf, setSelectedProf] = useState(staff.profile?.aiProfession || staff.role);

  const professions = [
    { id: 'teacher', icon: '🧑‍🏫', label: t('staff.ai.prof.teacher') },
    { id: 'admin', icon: '🛠️', label: t('staff.ai.prof.admin') },
    { id: 'psychologist', icon: '🧠', label: t('staff.ai.prof.psychologist') },
    { id: 'librarian', icon: '📚', label: t('staff.ai.prof.librarian') },
  ];

  const currentConfig = staff.getAiConfig(selectedProf);

  return (
    <div className="space-y-5">
      <div className="card p-5 space-y-3">
        <div className="font-black">{t('staff.ai.selectProf')}</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {professions.map((prof) => (
            <button
              key={prof.id}
              onClick={() => { sfx.click(); setSelectedProf(prof.id); }}
              className={`card p-4 text-center transition-all ${
                selectedProf === prof.id ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-soft'
              }`}
            >
              <div className="text-3xl mb-2">{prof.icon}</div>
              <div className="text-sm font-bold">{prof.label}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="card p-5 space-y-3">
        <div className="font-black">{t('staff.ai.config')}</div>
        <div className="text-sm text-ink/60">{t('staff.ai.maxTokens')}: {currentConfig.maxTokens}</div>
        <div className="text-xs font-mono bg-soft p-3 rounded-lg whitespace-pre-wrap">
          {currentConfig.system}
        </div>
      </div>

      <div className="card p-5 space-y-3">
        <div className="font-black">{t('staff.ai.starters')}</div>
        <div className="space-y-2">
          {currentConfig.starters.map(([title, prompt], idx) => (
            <div key={idx} className="bg-soft p-3 rounded-lg">
              <div className="font-bold text-sm mb-1">{title}</div>
              <div className="text-xs text-ink/60">{prompt}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProfileTab({ staff, t }) {
  const profile = staff.profile;

  if (!profile) {
    return (
      <div className="card p-5 text-center">
        <div className="text-4xl mb-3">👤</div>
        <div className="font-black mb-2">{t('staff.profile.empty')}</div>
        <div className="text-sm text-ink/60">{t('staff.profile.emptyDesc')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="card p-5 space-y-3">
        <div className="font-black">{t('staff.profile.info')}</div>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-ink/60 text-xs font-bold uppercase mb-1">{t('staff.profile.name')}</div>
            <div className="font-semibold">{profile.name || '—'}</div>
          </div>
          <div>
            <div className="text-ink/60 text-xs font-bold uppercase mb-1">{t('staff.profile.role')}</div>
            <div className="font-semibold">{profile.role === 'admin' ? t('staff.role.admin') : t('staff.role.teacher')}</div>
          </div>
          <div>
            <div className="text-ink/60 text-xs font-bold uppercase mb-1">{t('staff.profile.subjects')}</div>
            <div className="font-semibold">{profile.subjects?.join(', ') || '—'}</div>
          </div>
          <div>
            <div className="text-ink/60 text-xs font-bold uppercase mb-1">{t('staff.profile.classes')}</div>
            <div className="font-semibold">{profile.classes?.join(', ') || '—'}</div>
          </div>
          <div>
            <div className="text-ink/60 text-xs font-bold uppercase mb-1">{t('staff.profile.aiProf')}</div>
            <div className="font-semibold">{profile.aiProfession || '—'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileForm({ staff, t, onClose }) {
  const [name, setName] = useState(staff.profile?.name || '');
  const [subjects, setSubjects] = useState(staff.profile?.subjects?.join(', ') || '');
  const [classes, setClasses] = useState(staff.profile?.classes?.join(', ') || '');
  const [aiProf, setAiProf] = useState(staff.profile?.aiProfession || staff.role);

  const save = () => {
    sfx.click();
    const res = staff.updateProfile({
      name: name.trim(),
      subjects: subjects.split(',').map((s) => s.trim()).filter(Boolean),
      classes: classes.split(',').map((s) => s.trim()).filter(Boolean),
      aiProfession: aiProf,
    });
    if (res.ok) {
      sfx.levelUp();
      onClose();
    }
  };

  return (
    <div className="space-y-4">
      <div className="font-black text-lg">{t('staff.profile.edit')}</div>
      <label className="block space-y-1">
        <span className="text-xs font-black text-ink/65">{t('staff.profile.name')}</span>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label className="block space-y-1">
        <span className="text-xs font-black text-ink/65">{t('staff.profile.subjects')}</span>
        <input className="input" value={subjects} onChange={(e) => setSubjects(e.target.value)} placeholder="математика, русский" />
      </label>
      <label className="block space-y-1">
        <span className="text-xs font-black text-ink/65">{t('staff.profile.classes')}</span>
        <input className="input" value={classes} onChange={(e) => setClasses(e.target.value)} placeholder="5А, 6Б" />
      </label>
      <label className="block space-y-1">
        <span className="text-xs font-black text-ink/65">{t('staff.profile.aiProf')}</span>
        <select className="input" value={aiProf} onChange={(e) => setAiProf(e.target.value)}>
          <option value="teacher">{t('staff.ai.prof.teacher')}</option>
          <option value="admin">{t('staff.ai.prof.admin')}</option>
          <option value="psychologist">{t('staff.ai.prof.psychologist')}</option>
          <option value="librarian">{t('staff.ai.prof.librarian')}</option>
        </select>
      </label>
      <div className="flex gap-2">
        <button className="btn-primary flex-1" onClick={save}>{t('common.save')}</button>
        <button className="btn-ghost flex-1" onClick={onClose}>{t('common.cancel')}</button>
      </div>
    </div>
  );
}
