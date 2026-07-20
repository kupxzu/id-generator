import { useState, useRef, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Minus, Plus, Bold, RotateCcw, Save } from 'lucide-react';
import { id_cards, id_templates } from '@/lib/routes-helpers';

/* ─── Types ──────────────────────────────────────────────── */
interface ElemStyle { x: number; y: number; fontSize: number; width: number; color: string; bold: boolean; }
interface ImgStyle  { x: number; y: number; w: number; h: number; }

type FrontKey = 'firstName' | 'lastName' | 'positionTitle' | 'contactBlock';
type BackKey  = 'guardianName' | 'guardianPhone' | 'address';
type ImgKey   = 'barcode' | 'signature';

interface TemplateRecord {
    front_layout?: Record<FrontKey, ElemStyle>;
    back_layout?:  Record<BackKey,  ElemStyle>;
    img_layout?:   Record<ImgKey,   ImgStyle>;
}
interface Props {
    templates: Record<string, TemplateRecord>;
}

/* ─── Constants ──────────────────────────────────────────── */
const DEPTS = ['admin', 'hr', 'finance', 'nurse'] as const;
type Dept = typeof DEPTS[number];

const DEPT_LABELS: Record<Dept, string> = { admin: 'Admin', hr: 'HR', finance: 'Finance', nurse: 'Nurse' };

const FRONT_DEFAULTS: Record<FrontKey, ElemStyle> = {
    firstName:     { x: 55, y: 24, fontSize: 6,   width: 42, color: '#ffffff', bold: true  },
    lastName:      { x: 55, y: 31, fontSize: 7,   width: 42, color: '#ffffff', bold: true  },
    positionTitle: { x: 55, y: 40, fontSize: 6,   width: 42, color: '#ffffff', bold: false },
    contactBlock:  { x: 19, y: 70, fontSize: 4,   width: 79, color: '#1e293b', bold: true  },
};
const BACK_DEFAULTS: Record<BackKey, ElemStyle> = {
    guardianName:  { x: 10, y: 28, fontSize: 3.5, width: 80, color: '#1e293b', bold: true  },
    guardianPhone: { x: 10, y: 35, fontSize: 3.5, width: 80, color: '#1e293b', bold: false },
    address:       { x: 10, y: 42, fontSize: 3.5, width: 80, color: '#1e293b', bold: false },
};
const IMG_DEFAULTS: Record<ImgKey, ImgStyle> = {
    barcode:   { x: 2,  y: 40, w: 15, h: 55 },
    signature: { x: 30, y: 55, w: 28, h:  9 },
};

const FRONT_NAMES: Record<FrontKey, string> = { firstName: 'First Name', lastName: 'Last Name', positionTitle: 'Position', contactBlock: 'Contact Info' };
const BACK_NAMES:  Record<BackKey,  string> = { guardianName: 'Guardian Name', guardianPhone: 'Guardian Phone', address: 'Address' };
const IMG_NAMES:   Record<ImgKey,   string> = { barcode: 'Barcode', signature: 'Signature' };
const SWATCHES = [
    { value: '#ffffff', label: 'White' }, { value: '#000000', label: 'Black' },
    { value: '#1e293b', label: 'Slate' }, { value: '#64748b', label: 'Gray'  },
    { value: '#ef4444', label: 'Red'   }, { value: '#f59e0b', label: 'Amber' },
    { value: '#10b981', label: 'Green' }, { value: '#3b82f6', label: 'Blue'  },
];

const SAMPLE_BARCODE_URL = `/barcode-image?code=${encodeURIComponent('SAMPLE-CODE-123')}`;

type DeptLayout = {
    front: Record<FrontKey, ElemStyle>;
    back:  Record<BackKey,  ElemStyle>;
    img:   Record<ImgKey,   ImgStyle>;
};

const mkLayout = (t: TemplateRecord | undefined): DeptLayout => ({
    front: (t?.front_layout as Record<FrontKey, ElemStyle> | undefined) ?? { ...FRONT_DEFAULTS },
    back:  (t?.back_layout  as Record<BackKey,  ElemStyle> | undefined) ?? { ...BACK_DEFAULTS  },
    img:   (t?.img_layout   as Record<ImgKey,   ImgStyle>  | undefined) ?? { ...IMG_DEFAULTS   },
});

/* ─── Component ──────────────────────────────────────────── */
export default function Templates({ templates }: Props) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [activeDept, setActiveDept] = useState<Dept>('admin');
    const [activeTab,  setActiveTab]  = useState<'front' | 'back'>('front');
    const [saving,  setSaving]  = useState(false);
    const [savedDept, setSavedDept] = useState<Dept | null>(null);

    /* All 4 department layouts in one state */
    const [layouts, setLayouts] = useState<Record<Dept, DeptLayout>>(() => ({
        admin:   mkLayout(templates['admin']),
        hr:      mkLayout(templates['hr']),
        finance: mkLayout(templates['finance']),
        nurse:   mkLayout(templates['nurse']),
    }));

    /* Derived current dept positions */
    const frontPos = layouts[activeDept].front;
    const backPos  = layouts[activeDept].back;
    const imgPos   = layouts[activeDept].img;

    const setFrontPos = (upd: (p: Record<FrontKey, ElemStyle>) => Record<FrontKey, ElemStyle>) =>
        setLayouts(l => ({ ...l, [activeDept]: { ...l[activeDept], front: upd(l[activeDept].front) } }));
    const setBackPos = (upd: (p: Record<BackKey, ElemStyle>) => Record<BackKey, ElemStyle>) =>
        setLayouts(l => ({ ...l, [activeDept]: { ...l[activeDept], back: upd(l[activeDept].back) } }));
    const setImgPos = (upd: (p: Record<ImgKey, ImgStyle>) => Record<ImgKey, ImgStyle>) =>
        setLayouts(l => ({ ...l, [activeDept]: { ...l[activeDept], img: upd(l[activeDept].img) } }));

    /* Selection */
    type SelState = { kind: 'front'; key: FrontKey } | { kind: 'back'; key: BackKey } | { kind: 'img'; key: ImgKey } | null;
    const [sel, setSel] = useState<SelState>(null);

    /* Drag / resize refs */
    type DragKind = { kind: 'front'; key: FrontKey } | { kind: 'back'; key: BackKey } | { kind: 'img'; key: ImgKey };
    const pendingRef    = useRef<{ dk: DragKind; mx: number; my: number; ex: number; ey: number } | null>(null);
    const draggingRef   = useRef<DragKind | null>(null);
    const resizePendRef = useRef<{ key: ImgKey; mx: number; my: number; ew: number; eh: number } | null>(null);
    const resizingRef   = useRef<ImgKey | null>(null);
    const [, setTick]   = useState(0);

    /* Global mouse/touch events — re-registers when activeDept changes */
    useEffect(() => {
        const rect = () => cardRef.current?.getBoundingClientRect();
        const move = (cx: number, cy: number) => {
            if (resizePendRef.current && resizingRef.current) {
                const r = rect(); if (!r) return;
                const dw = ((cx - resizePendRef.current.mx) / r.width)  * 100;
                const dh = ((cy - resizePendRef.current.my) / r.height) * 100;
                const k  = resizePendRef.current.key;
                setImgPos(p => ({ ...p, [k]: { ...p[k], w: Math.max(3, Math.min(90, resizePendRef.current!.ew + dw)), h: Math.max(2, Math.min(90, resizePendRef.current!.eh + dh)) } }));
                return;
            }
            if (!pendingRef.current) return;
            const r = rect(); if (!r) return;
            const dx = ((cx - pendingRef.current.mx) / r.width)  * 100;
            const dy = ((cy - pendingRef.current.my) / r.height) * 100;
            if (!draggingRef.current && Math.hypot(cx - pendingRef.current.mx, cy - pendingRef.current.my) > 5) {
                draggingRef.current = pendingRef.current.dk; setTick(t => t + 1);
            }
            if (!draggingRef.current) return;
            const { dk, ex, ey } = pendingRef.current;
            const nx = Math.max(0, Math.min(90, ex + dx)), ny = Math.max(0, Math.min(95, ey + dy));
            if (dk.kind === 'front') setFrontPos(p => ({ ...p, [dk.key]: { ...p[dk.key], x: nx, y: ny } }));
            else if (dk.kind === 'back') setBackPos(p => ({ ...p, [dk.key]: { ...p[dk.key], x: nx, y: ny } }));
            else setImgPos(p => ({ ...p, [dk.key]: { ...p[dk.key], x: nx, y: ny } }));
        };
        const onMM = (e: MouseEvent) => move(e.clientX, e.clientY);
        const onTM = (e: TouchEvent) => { e.preventDefault(); const t = e.touches[0]; move(t.clientX, t.clientY); };
        const onUp = () => { pendingRef.current = null; draggingRef.current = null; resizePendRef.current = null; resizingRef.current = null; setTick(t => t + 1); };
        window.addEventListener('mousemove', onMM); window.addEventListener('mouseup', onUp);
        window.addEventListener('touchmove', onTM, { passive: false }); window.addEventListener('touchend', onUp);
        return () => { window.removeEventListener('mousemove', onMM); window.removeEventListener('mouseup', onUp); window.removeEventListener('touchmove', onTM); window.removeEventListener('touchend', onUp); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeDept]);

    const startDrag = (dk: DragKind, ex: number, ey: number, e: React.MouseEvent | React.TouchEvent) => {
        e.stopPropagation();
        if (e.type === 'mousedown') (e as React.MouseEvent).preventDefault();
        setSel({ kind: dk.kind, key: dk.key } as SelState);
        pendingRef.current = { dk, mx: 'clientX' in e ? e.clientX : (e as React.TouchEvent).touches[0].clientX, my: 'clientY' in e ? e.clientY : (e as React.TouchEvent).touches[0].clientY, ex, ey };
    };
    const startResize = (key: ImgKey, e: React.MouseEvent) => {
        e.preventDefault(); e.stopPropagation();
        resizePendRef.current = { key, mx: e.clientX, my: e.clientY, ew: imgPos[key].w, eh: imgPos[key].h };
        resizingRef.current = key;
    };

    /* Toolbar helpers */
    const getTextPos = (): ElemStyle | null => {
        if (!sel || sel.kind === 'img') return null;
        return sel.kind === 'front' ? frontPos[sel.key as FrontKey] : backPos[sel.key as BackKey];
    };
    const updateTextPos = (upd: Partial<ElemStyle>) => {
        if (!sel || sel.kind === 'img') return;
        if (sel.kind === 'front') setFrontPos(p => ({ ...p, [sel.key]: { ...p[sel.key as FrontKey], ...upd } }));
        if (sel.kind === 'back')  setBackPos(p  => ({ ...p, [sel.key]: { ...p[sel.key as BackKey],  ...upd } }));
    };
    const changeFontSize = (d: number) => {
        const pos = getTextPos(); if (!pos) return;
        updateTextPos({ fontSize: Math.max(1, Math.min(20, +(pos.fontSize + d).toFixed(1))) });
    };
    const currentLabel = (): string => {
        if (!sel) return '';
        if (sel.kind === 'front') return FRONT_NAMES[sel.key as FrontKey];
        if (sel.kind === 'back')  return BACK_NAMES[sel.key as BackKey];
        return IMG_NAMES[sel.key as ImgKey];
    };

    const resetCurrent = () =>
        setLayouts(l => ({ ...l, [activeDept]: mkLayout(templates[activeDept]) }));

    const saveCurrent = () => {
        const layout = layouts[activeDept];
        setSaving(true);
        router.put(id_templates.update(activeDept), {
            front_layout: layout.front,
            back_layout:  layout.back,
            img_layout:   layout.img,
        }, {
            preserveScroll: true,
            onSuccess: () => { setSavedDept(activeDept); setTimeout(() => setSavedDept(null), 2000); },
            onFinish: () => setSaving(false),
        });
    };

    /* Placeholder text for canvas preview */
    const getFrontText = (k: FrontKey): string => {
        if (k === 'firstName') return 'JUAN';
        if (k === 'lastName') return 'DELA CRUZ';
        if (k === 'positionTitle') return 'Staff / Nurse';
        return '';
    };
    const getBackText = (k: BackKey): string => {
        if (k === 'guardianName') return 'Maria Dela Cruz';
        if (k === 'guardianPhone') return '09XX-XXX-XXXX';
        return '#15 Sample Street\nCity, Province';
    };

    /* Text element renderer */
    const renderTextElem = (kind: 'front' | 'back', key: FrontKey | BackKey, pos: ElemStyle, text: string, isContact: boolean) => {
        const isSel = sel?.kind === kind && sel.key === key;
        const dk: DragKind = kind === 'front' ? { kind: 'front', key: key as FrontKey } : { kind: 'back', key: key as BackKey };
        const lc = `${(pos.fontSize * 4.2).toFixed(1)}cqw`, cc = `${(pos.fontSize * 0.7).toFixed(1)}cqw`;
        const isGuardian = kind === 'back' && (key === 'guardianName' || key === 'guardianPhone');
        const isAddr     = kind === 'back' && key === 'address';
        return (
            <div key={key} className="absolute"
                style={{ left: `${pos.x}%`, top: `${pos.y}%`, width: `${pos.width}%`, cursor: draggingRef.current?.key === key ? 'grabbing' : isSel ? 'move' : 'pointer', zIndex: isSel ? 10 : 2 }}
                onMouseDown={e => startDrag(dk, pos.x, pos.y, e)} onTouchStart={e => startDrag(dk, pos.x, pos.y, e)}
                onClick={e => { e.stopPropagation(); setSel({ kind, key } as SelState); }}
            >
                <span className="pointer-events-none absolute inset-0 rounded" style={{ outline: isSel ? '2px dashed #3b82f6' : '2px dashed transparent', outlineOffset: '4px', transition: 'outline-color 0.1s' }} />
                {isContact ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: `${(pos.fontSize * .18).toFixed(1)}cqw` }}>
                        {['Contact : 09XX-XXX-XXXX', 'Email : sample@email.com', 'Group : Staff'].map((row, i) => {
                            const [label, ...rest] = row.split(' : ');
                            return (
                                <div key={i} style={{ display: 'grid', gridTemplateColumns: `${lc} ${cc} 1fr`, fontSize: `${pos.fontSize}cqw`, fontWeight: pos.bold ? 800 : 400, color: pos.color, lineHeight: 1.2 }}>
                                    <span>{label}</span><span style={{ textAlign: 'center' }}>:</span><span style={{ wordBreak: 'break-word' }}>{rest.join(' : ')}</span>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p style={{ fontSize: `${pos.fontSize}cqw`, color: pos.color, fontWeight: pos.bold ? '800' : '400', lineHeight: 1.15, margin: 0, textTransform: isGuardian ? 'capitalize' : 'uppercase', textAlign: (isGuardian || isAddr) ? 'center' : undefined, letterSpacing: isGuardian ? '0.02em' : '-0.02em', wordBreak: 'break-word', whiteSpace: isAddr ? 'pre-line' : undefined }}>
                        {text || <span style={{ opacity: .2 }}>—</span>}
                    </p>
                )}
            </div>
        );
    };

    /* Image element renderer — always shows a placeholder even without src */
    const renderImgElem = (key: ImgKey, src: string | null) => {
        const pos = imgPos[key], isSel = sel?.kind === 'img' && sel.key === key;
        const dk: DragKind = { kind: 'img', key };
        return (
            <div key={key} className="absolute overflow-hidden"
                style={{ left: `${pos.x}%`, top: `${pos.y}%`, width: `${pos.w}%`, height: `${pos.h}%`, cursor: draggingRef.current?.key === key ? 'grabbing' : isSel ? 'move' : 'pointer', zIndex: isSel ? 10 : 3 }}
                onMouseDown={e => startDrag(dk, pos.x, pos.y, e)} onTouchStart={e => startDrag(dk, pos.x, pos.y, e)}
                onClick={e => { e.stopPropagation(); setSel({ kind: 'img', key }); }}
            >
                <span className="pointer-events-none absolute inset-0 rounded z-10" style={{ outline: isSel ? '2px dashed #3b82f6' : '1px dashed rgba(120,120,120,0.5)', outlineOffset: '2px' }} />
                {src
                    ? <img src={src} alt={key} draggable={false} className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    : <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded">
                        <span style={{ fontSize: '1.6cqw', color: 'rgba(80,80,80,0.6)', fontWeight: 700, textTransform: 'uppercase' }}>{key}</span>
                      </div>
                }
                {isSel && <div className="absolute bottom-0 right-0 z-20 h-4 w-4 translate-x-1/2 translate-y-1/2 rounded-full border-2 border-blue-500 bg-white shadow-md" style={{ cursor: 'se-resize' }} onMouseDown={e => startResize(key, e)} />}
            </div>
        );
    };

    const textPos = getTextPos();

    return (
        <>
            <Head title="ID Card Templates" />
            <div className="flex h-full flex-col overflow-hidden">

                {/* ── Top bar ── */}
                <div className="flex flex-shrink-0 flex-wrap items-center gap-2 border-b bg-background px-4 py-2 min-h-[44px]">
                    {sel ? (
                        <>
                            <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mr-1" onMouseDown={e => { e.preventDefault(); setSel(null); }}>
                                <ArrowLeft className="h-4 w-4" /> Done
                            </button>
                            <div className="h-5 w-px bg-border" />
                            <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground px-1">{currentLabel()}</span>
                            <div className="h-5 w-px bg-border" />
                            {sel.kind !== 'img' && textPos ? (
                                <>
                                    <button className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted" onMouseDown={e => { e.preventDefault(); changeFontSize(-.5); }}><Minus className="h-3 w-3" /></button>
                                    <span className="w-9 text-center font-mono text-xs tabular-nums">{textPos.fontSize.toFixed(1)}</span>
                                    <button className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted" onMouseDown={e => { e.preventDefault(); changeFontSize(.5); }}><Plus className="h-3 w-3" /></button>
                                    <div className="h-5 w-px bg-border" />
                                    <button className={`flex h-7 w-7 items-center justify-center rounded-md ${textPos.bold ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`} onMouseDown={e => { e.preventDefault(); updateTextPos({ bold: !textPos.bold }); }}><Bold className="h-3 w-3" /></button>
                                    <div className="h-5 w-px bg-border" />
                                    {SWATCHES.map(({ value, label }) => (
                                        <button key={value} title={label} onMouseDown={e => { e.preventDefault(); updateTextPos({ color: value }); }} className="h-5 w-5 flex-shrink-0 rounded-full hover:scale-110 transition-transform" style={{ background: value, border: '1px solid rgba(0,0,0,0.18)', outline: textPos.color === value ? '2.5px solid #3b82f6' : '2.5px solid transparent', outlineOffset: '1px' }} />
                                    ))}
                                </>
                            ) : sel.kind === 'img' ? (
                                <span className="text-xs font-mono text-muted-foreground">{imgPos[sel.key as ImgKey].w.toFixed(0)}%×{imgPos[sel.key as ImgKey].h.toFixed(0)}% <span className="opacity-50">(drag ◼ to resize)</span></span>
                            ) : null}
                            <div className="flex-1" />
                        </>
                    ) : (
                        <>
                            <Link href={id_cards.index()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                                <ArrowLeft className="h-4 w-4" /> ID Cards
                            </Link>
                            <div className="h-5 w-px bg-border" />
                            <span className="text-sm font-semibold">Department Templates</span>
                            <div className="flex-1" />
                            <button onClick={resetCurrent} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-2">
                                <RotateCcw className="h-3 w-3" /> Reset {DEPT_LABELS[activeDept]}
                            </button>
                        </>
                    )}
                    <Button size="sm" onClick={saveCurrent} disabled={saving}>
                        <Save className="mr-1.5 h-3.5 w-3.5" />
                        {saving ? 'Saving…' : savedDept === activeDept ? '✓ Saved' : `Save ${DEPT_LABELS[activeDept]}`}
                    </Button>
                </div>

                {/* ── Main split ── */}
                <div className="flex flex-1 overflow-hidden">

                    {/* ── Canvas ── */}
                    <div className="flex flex-1 flex-col items-center gap-3 overflow-auto bg-neutral-200 px-4 py-4 dark:bg-neutral-800">

                        {/* Department tabs */}
                        <div className="flex rounded-lg bg-muted p-1">
                            {DEPTS.map(d => (
                                <button key={d}
                                    onClick={() => { setActiveDept(d); setSel(null); }}
                                    className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${activeDept === d ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                                    {DEPT_LABELS[d]}
                                </button>
                            ))}
                        </div>

                        {/* Front / Back tabs */}
                        <div className="flex rounded-lg bg-muted p-1">
                            {(['front', 'back'] as const).map(tab => (
                                <button key={tab} onClick={() => { setActiveTab(tab); setSel(null); }}
                                    className={`rounded-md px-4 py-1.5 text-sm font-medium capitalize transition-colors ${activeTab === tab ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                                    {tab} Side
                                </button>
                            ))}
                        </div>

                        {/* Card canvas */}
                        <div ref={cardRef} className="relative flex-shrink-0 select-none overflow-hidden rounded-[2rem] shadow-2xl"
                            style={{ width: 'min(430px, 100%)', containerType: 'inline-size' } as React.CSSProperties}
                            onClick={() => setSel(null)}>
                            <img src={activeTab === 'front' ? `/${activeDept}-template-front.png` : `/${activeDept}-template-back.png`} alt="template" className="block h-auto w-full pointer-events-none" draggable={false} />

                            <div className="absolute inset-0">
                                {activeTab === 'front' && (
                                    <>
                                        {/* Placeholder photo */}
                                        <div className="absolute overflow-hidden rounded-[1.5rem] bg-slate-300 flex items-center justify-center"
                                            style={{ left: '8%', top: '17%', width: '44%', height: '29%' }}>
                                            <span style={{ fontSize: '2.5cqw', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Photo</span>
                                        </div>

                                        {renderImgElem('barcode', SAMPLE_BARCODE_URL)}
                                        {renderImgElem('signature', null)}

                                        {(Object.keys(frontPos) as FrontKey[]).map(k =>
                                            renderTextElem('front', k, frontPos[k], getFrontText(k), k === 'contactBlock')
                                        )}
                                    </>
                                )}
                                {activeTab === 'back' && (
                                    <>
                                        {(Object.keys(backPos) as BackKey[]).map(k =>
                                            renderTextElem('back', k, backPos[k], getBackText(k), false)
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col items-center gap-1 text-center">
                            <p className="text-[11px] text-muted-foreground/60">Click to select · drag to move · drag ◼ to resize images</p>
                            <p className="text-[11px] text-muted-foreground/80 font-medium">Saving applies to all <span className="font-bold">{DEPT_LABELS[activeDept]}</span> department ID cards</p>
                        </div>
                    </div>

                    {/* ── Side panel ── */}
                    <div className="w-[280px] flex-shrink-0 overflow-auto border-l bg-background p-5 space-y-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-b pb-2">
                            {DEPT_LABELS[activeDept]} · {activeTab === 'front' ? 'Front' : 'Back'} Elements
                        </p>

                        <p className="text-xs text-muted-foreground">
                            Click any element on the card to select it, then drag to reposition. Use the top toolbar to change font size, weight, and color.
                        </p>

                        <div className="space-y-1.5">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                {activeTab === 'front' ? 'Front' : 'Back'} Elements
                            </p>
                            {activeTab === 'front' ? (
                                <ul className="space-y-1">
                                    {(Object.keys(frontPos) as FrontKey[]).map(k => (
                                        <li key={k}
                                            onClick={() => setSel({ kind: 'front', key: k })}
                                            className={`cursor-pointer rounded-md px-2 py-1.5 text-sm transition-colors ${sel?.kind === 'front' && sel.key === k ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>
                                            {FRONT_NAMES[k]}
                                        </li>
                                    ))}
                                    <p className="pt-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Images</p>
                                    {(Object.keys(imgPos) as ImgKey[]).map(k => (
                                        <li key={k}
                                            onClick={() => setSel({ kind: 'img', key: k })}
                                            className={`cursor-pointer rounded-md px-2 py-1.5 text-sm transition-colors ${sel?.kind === 'img' && sel.key === k ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>
                                            {IMG_NAMES[k]}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <ul className="space-y-1">
                                    {(Object.keys(backPos) as BackKey[]).map(k => (
                                        <li key={k}
                                            onClick={() => setSel({ kind: 'back', key: k })}
                                            className={`cursor-pointer rounded-md px-2 py-1.5 text-sm transition-colors ${sel?.kind === 'back' && sel.key === k ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>
                                            {BACK_NAMES[k]}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div className="border-t pt-4 space-y-2">
                            <Button onClick={saveCurrent} disabled={saving} className="w-full">
                                <Save className="mr-1.5 h-3.5 w-3.5" />
                                {saving ? 'Saving…' : savedDept === activeDept ? '✓ Saved!' : `Save ${DEPT_LABELS[activeDept]} Template`}
                            </Button>
                            <p className="text-[10px] text-muted-foreground text-center">
                                Only saves <span className="font-bold">{DEPT_LABELS[activeDept]}</span> layout.
                                Switch tabs to configure other departments.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

Templates.layout = {
    breadcrumbs: [
        { title: 'ID Cards', href: id_cards.index() },
        { title: 'Templates' },
    ],
};
