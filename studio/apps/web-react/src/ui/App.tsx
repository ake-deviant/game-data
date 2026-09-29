import { useState } from 'react';
import { createCommanderComposition } from '../composition/createCommanderComposition';
import { updateCommanderComposition } from '../composition/updateCommanderComposition';
import { createPawnComposition } from '../composition/createPawnComposition';
import { updatePawnComposition } from '../composition/updatePawnComposition';
import { CommanderForm } from './CommanderForm';
import { EditCommanderForm } from './EditCommanderForm';
import { CreatePawnForm } from './CreatePawnForm';
import { EditPawnForm } from './EditPawnForm';
import { PawnList } from './PawnList';
import { PublishView } from './PublishView';
import { GridStudioView } from './GridStudioView';
import { gridCatalogComposition } from '../composition/gridCatalogComposition';
import { Icon, type IconName } from './ui-kit';
import type { PawnRole } from '@game-data/presentation';

type Module = 'commanders' | 'pawns' | 'grids';
type CommanderView = 'create' | 'edit' | 'publish';
type PawnView = 'catalog' | 'create' | 'edit';
type GridView = 'new' | 'load';

interface ModuleDef<V extends string> {
  id: Module;
  label: string;
  icon: IconName;
  views: { id: V; label: string; icon: IconName; soon?: boolean }[];
}

const commandersModule: ModuleDef<CommanderView> = {
  id: 'commanders',
  label: 'Commandants',
  icon: 'spark',
  views: [
    { id: 'create',  label: 'Créer',   icon: 'spark' },
    { id: 'edit',    label: 'Modifier', icon: 'identity' },
    { id: 'publish', label: 'Proposer en production', icon: 'upload' },
  ],
};

const pawnsModule: ModuleDef<PawnView> = {
  id: 'pawns',
  label: 'Pions',
  icon: 'shield',
  views: [
    { id: 'catalog', label: 'Catalogue', icon: 'shield' },
    { id: 'create',  label: 'Créer',     icon: 'spark' },
    { id: 'edit',    label: 'Modifier',  icon: 'identity' },
  ],
};

const pawnRoles: { id: PawnRole; label: string }[] = [
  { id: 'soldier',   label: 'Soldat' },
  { id: 'officer',   label: 'Officier' },
  { id: 'commander', label: 'Commandant' },
];

function ComingSoon({ label }: { label: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-slate-900/65 shadow-2xl shadow-black/10">
      <div className="grid place-items-center py-24 text-center">
        <div className="grid size-14 place-items-center rounded-2xl border border-white/[0.07] bg-white/[0.03] text-slate-600">
          <Icon name="spark" className="size-6" />
        </div>
        <p className="mt-5 text-base font-semibold text-slate-300">{label}</p>
        <p className="mt-2 text-sm text-slate-500">Cette fonctionnalité est en cours de développement.</p>
        <span className="mt-4 inline-flex items-center rounded-full border border-amber-400/20 bg-amber-400/[0.07] px-3 py-1 text-xs font-semibold text-amber-400/70">
          À venir
        </span>
      </div>
    </div>
  );
}

export function App() {
  const [createComposition] = useState(createCommanderComposition);
  const [editComposition] = useState(updateCommanderComposition);
  const [pawnComposition] = useState(createPawnComposition);
  const [editPawnComposition] = useState(updatePawnComposition);
  const [gridComposition] = useState(gridCatalogComposition);
  const [activeModule, setActiveModule] = useState<Module>('commanders');
  const [commanderView, setCommanderView] = useState<CommanderView>('create');
  const [pawnView, setPawnView] = useState<PawnView>('catalog');
  const [pawnRole, setPawnRole] = useState<PawnRole>('soldier');
  const [gridView, setGridView] = useState<GridView>('new');

  const modules = [commandersModule, pawnsModule, { id: 'grids', label: 'Grilles', icon: 'grid' }] as const;
  const showRoleNav = activeModule === 'pawns' && (pawnView === 'create' || pawnView === 'edit');

  return (
    <div className="min-h-screen bg-[#090d18] text-slate-200">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(245,158,11,0.08),transparent_28%),radial-gradient(circle_at_90%_20%,rgba(56,189,248,0.05),transparent_24%)]" />

      {/* Top navbar */}
      <header className="sticky top-0 z-20 border-b border-white/[0.06] bg-[#090d18]/90 backdrop-blur-xl">
        <div className="flex h-14 items-center gap-6 px-6">
          <div className="flex items-center gap-3 shrink-0">
            <div className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-amber-300 to-amber-500 text-slate-950 shadow-lg shadow-amber-500/20">
              <Icon name="spark" className="size-3.5" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white leading-none">Game Data Studio</h1>
              <p className="text-[10px] text-slate-500 leading-none mt-0.5">Outil local · données de jeu</p>
            </div>
          </div>

          <div className="h-5 w-px bg-white/[0.08] shrink-0" />

          <nav className="flex items-center gap-1">
            {modules.map((mod) => {
              const isActive = activeModule === mod.id;
              return (
                <button
                  key={mod.id}
                  type="button"
                  onClick={() => setActiveModule(mod.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                    isActive
                      ? 'bg-amber-400/[0.12] text-amber-300 border border-amber-400/20'
                      : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <Icon name={mod.icon} className="size-4 shrink-0" />
                  {mod.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sub-nav */}
        <div className="bg-[#05080f] border-t border-white/[0.04]">
          <div className="flex items-center gap-0 px-6">
              {activeModule === 'grids' && (
                <>
                  <button type="button" onClick={() => { setGridView('new'); gridComposition.controller.select(''); }} className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${gridView === 'new' ? 'border-amber-400 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
                    <Icon name="spark" className="size-3" /> Nouvelle
                  </button>
                  <button type="button" onClick={() => setGridView('load')} className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${gridView === 'load' ? 'border-amber-400 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
                    <Icon name="upload" className="size-3" /> Gérer
                  </button>
                </>
              )}
              {activeModule === 'commanders' && commandersModule.views.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setCommanderView(v.id)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                    commanderView === v.id ? 'border-amber-400 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Icon name={v.icon} className="size-3" />
                  {v.label}
                </button>
              ))}
              {activeModule === 'pawns' && pawnsModule.views.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setPawnView(v.id)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                    v.soon
                      ? 'border-transparent text-slate-600 cursor-default'
                      : pawnView === v.id
                        ? 'border-amber-400 text-white'
                        : 'border-transparent text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Icon name={v.icon} className="size-3" />
                  {v.label}
                  {v.soon && (
                    <span className="ml-1 rounded-full bg-slate-800 px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-slate-600">
                      bientôt
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Role sub-nav — visible only when creating a pawn */}
            {showRoleNav && (
              <div className="flex items-center gap-1 border-b border-white/[0.04] bg-slate-950/30 px-6 py-1.5">
                <span className="mr-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600">Rôle</span>
                {pawnRoles.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setPawnRole(r.id)}
                    className={`rounded-lg px-3 py-1 text-[11px] font-semibold transition ${
                      pawnRole === r.id
                        ? 'bg-white/[0.08] text-slate-100 border border-white/[0.12]'
                        : 'text-slate-500 hover:bg-white/[0.04] hover:text-slate-300 border border-transparent'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            )}
          </div>

      </header>

      {/* Content */}
      <main className={`px-6 py-8 ${activeModule === 'grids' ? 'w-full' : 'max-w-4xl'}`}>
        {activeModule === 'grids' && <GridStudioView {...gridComposition} view={gridView} />}
        {activeModule === 'commanders' && (
          <>
            {commanderView === 'create'  && <CommanderForm {...createComposition} />}
            {commanderView === 'edit'    && <EditCommanderForm {...editComposition} />}
            {commanderView === 'publish' && <PublishView />}
          </>
        )}
        {activeModule === 'pawns' && (
          <>
            {pawnView === 'catalog' && <PawnList />}
            {pawnView === 'create'  && <CreatePawnForm key={pawnRole} role={pawnRole} {...pawnComposition} />}
            {pawnView === 'edit'    && <EditPawnForm key={pawnRole} role={pawnRole} {...editPawnComposition} />}
          </>
        )}
      </main>
    </div>
  );
}
