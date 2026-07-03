import { useMemo, useState } from 'react';
import { CHARACTERS as RAW_CHARACTERS } from '../game/characters.js';
import { BOSSES as RAW_BOSSES } from '../game/bosses.js';
import type { CharacterMeta, SkillMeta } from '../types';
import { ModelPreviewCanvas } from './ModelPreviewCanvas';

type GalleryKind = 'character' | 'boss';

interface BossMeta {
  id: number;
  round: number;
  name: string;
  subtitle?: string;
  color: string;
  shape: 'square' | 'triangle' | 'circle';
  maxHp: number;
  maxMana?: number;
  speed?: number;
  desc?: string;
  appearance?: { style?: string; weapon?: string; telegraph?: string };
  basic?: SkillMeta;
  skill1?: SkillMeta;
  skill2?: SkillMeta;
  ultimate?: SkillMeta;
}

type GalleryItem =
  | { kind: 'character'; id: string; modelId: string; name: string; color: string; subtitle: string; data: CharacterMeta }
  | { kind: 'boss'; id: string; modelId: number; name: string; color: string; subtitle: string; data: BossMeta };

const CHARACTERS = RAW_CHARACTERS as unknown as CharacterMeta[];
const BOSSES = RAW_BOSSES as unknown as BossMeta[];

const SKILL_SLOTS: Array<{ key: 'basic' | 'skill1' | 'skill2' | 'ultimate'; label: string }> = [
  { key: 'basic', label: '普攻' },
  { key: 'skill1', label: '技能 1' },
  { key: 'skill2', label: '技能 2' },
  { key: 'ultimate', label: '大絕' },
];

function buildItems(): GalleryItem[] {
  return [
    ...CHARACTERS.map((char) => ({
      kind: 'character' as const,
      id: char.id,
      modelId: char.id,
      name: char.name,
      color: char.color,
      subtitle: char.role || '玩家角色',
      data: char,
    })),
    ...BOSSES.map((boss) => ({
      kind: 'boss' as const,
      id: String(boss.id),
      modelId: boss.id,
      name: boss.name,
      color: boss.color,
      subtitle: `ROUND ${boss.round}${boss.subtitle ? ` · ${boss.subtitle}` : ''}`,
      data: boss,
    })),
  ];
}

function resolveInitialItem(items: GalleryItem[]): GalleryItem {
  const params = new URLSearchParams(window.location.search);
  const kind = params.get('kind') as GalleryKind | null;
  const id = params.get('id');
  const round = Number(params.get('round'));

  if (kind === 'character' && id) {
    const item = items.find((entry) => entry.kind === 'character' && entry.id === id);
    if (item) return item;
  }

  if (kind === 'boss') {
    if (id) {
      const item = items.find((entry) => entry.kind === 'boss' && entry.id === id);
      if (item) return item;
    }
    if (Number.isFinite(round)) {
      const item = items.find((entry) => entry.kind === 'boss' && entry.data.round === round);
      if (item) return item;
    }
  }

  return items.find((entry) => entry.kind === 'character') || items[0];
}

function shapeIcon(shape?: string) {
  if (shape === 'square') return '■';
  if (shape === 'triangle') return '▲';
  return '●';
}

function getDescription(item: GalleryItem) {
  if (item.kind === 'character') return item.data.desc;
  return item.data.appearance?.style || item.data.desc || item.data.subtitle || '尚未提供描述。';
}

function getStats(item: GalleryItem) {
  const data = item.data;
  const parts = [`HP ${data.maxHp}`];
  if ('maxMana' in data && data.maxMana != null) parts.push(`MP ${data.maxMana}`);
  if (data.speed != null) parts.push(`移速 ${data.speed}`);
  return parts.join(' · ');
}

function getSkillRows(item: GalleryItem) {
  return SKILL_SLOTS.map(({ key, label }) => ({ label, skill: item.data[key] })).filter((row) => row.skill);
}

function syncUrl(item: GalleryItem) {
  const params = new URLSearchParams(window.location.search);
  params.set('gallery', 'models');
  params.set('kind', item.kind);
  params.set('id', item.id);
  params.delete('round');
  if (item.kind === 'boss') params.set('round', String(item.data.round));
  window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
}

export function ModelGalleryScreen() {
  const items = useMemo(buildItems, []);
  const [selected, setSelected] = useState<GalleryItem>(() => resolveInitialItem(items));
  const [kind, setKind] = useState<GalleryKind>(selected.kind);

  const visibleItems = items.filter((item) => item.kind === kind);
  const skillRows = getSkillRows(selected);

  function selectItem(item: GalleryItem) {
    setSelected(item);
    setKind(item.kind);
    syncUrl(item);
  }

  function selectKind(nextKind: GalleryKind) {
    setKind(nextKind);
    if (selected.kind !== nextKind) {
      const nextItem = items.find((item) => item.kind === nextKind);
      if (nextItem) selectItem(nextItem);
    }
  }

  return (
    <section id="screen-model-gallery" className="screen active model-gallery-screen">
      <div className="model-gallery-shell">
        <header className="model-gallery-head">
          <div>
            <h1>模型展示</h1>
            <p className="subtitle">檢視所有角色與 Boss 的 3D 模型成果</p>
          </div>
          <button className="btn ghost" onClick={() => { window.location.href = window.location.pathname; }}>回主選單</button>
        </header>

        <div className="model-gallery-tabs" role="tablist" aria-label="模型類型">
          <button className={'btn' + (kind === 'character' ? ' primary' : '')} onClick={() => selectKind('character')}>角色</button>
          <button className={'btn' + (kind === 'boss' ? ' primary' : '')} onClick={() => selectKind('boss')}>Boss</button>
        </div>

        <div className="model-gallery-layout">
          <aside className="model-gallery-list" aria-label="模型清單">
            {visibleItems.map((item) => (
              <button
                key={`${item.kind}-${item.id}`}
                type="button"
                className={'model-gallery-card' + (selected.kind === item.kind && selected.id === item.id ? ' selected' : '')}
                onClick={() => selectItem(item)}
              >
                <span className="model-gallery-mark" style={{ color: item.color }}>{shapeIcon(item.data.shape)}</span>
                <span className="model-gallery-card-text">
                  <span className="model-gallery-card-name">{item.name}</span>
                  <span className="model-gallery-card-sub">{item.subtitle}</span>
                </span>
              </button>
            ))}
          </aside>

          <main className="model-gallery-main">
            <div className="model-preview-wrap">
              <ModelPreviewCanvas modelId={selected.modelId} />
            </div>

            <section className="model-gallery-detail">
              <div className="model-gallery-title-row">
                <div>
                  <div className="model-gallery-kicker">{selected.kind === 'boss' ? selected.subtitle : '玩家角色'}</div>
                  <h2>{selected.name}</h2>
                </div>
                <span className="model-gallery-badge" style={{ borderColor: selected.color, color: selected.color }}>
                  {shapeIcon(selected.data.shape)}
                </span>
              </div>

              <div className="model-gallery-stats">{getStats(selected)}</div>
              <p className="model-gallery-desc">{getDescription(selected)}</p>

              {selected.kind === 'character' && selected.data.talent && (
                <div className="model-gallery-note"><b>天賦 · {selected.data.talent.name}</b>{selected.data.talent.desc}</div>
              )}
              {selected.kind === 'boss' && selected.data.appearance?.weapon && (
                <div className="model-gallery-note"><b>外觀武器</b>{selected.data.appearance.weapon}</div>
              )}

              <div className="model-gallery-skills">
                {skillRows.map(({ label, skill }) => (
                  <div className="model-gallery-skill" key={label}>
                    <span>{label}</span>
                    <b>{skill?.name}</b>
                    {skill?.type && <em>{skill.type}</em>}
                  </div>
                ))}
              </div>
            </section>
          </main>
        </div>
      </div>
    </section>
  );
}
