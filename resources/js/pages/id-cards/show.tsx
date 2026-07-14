import { FormEventHandler, useState, useRef, useEffect, useCallback } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import InputError from '@/components/input-error';
import { id_cards } from '@/lib/routes-helpers';
import { ArrowLeft, Minus, Plus, Bold, RotateCcw, Save, Download, Crop, Undo2 } from 'lucide-react';

/* ─── Types ──────────────────────────────────────────────── */
interface IdCard {
    id: number; code: string; first_name: string; last_name: string;
    email: string; phone: string | null; group: string; department: string;
    position: string | null; guardian_name: string | null;
    guardian_phone: string | null; address: string | null;
    photo_path: string | null; barcode_path: string | null;
    signature_path: string | null; notes: string | null;
    created_by?: { name: string };
}
interface Props { idCard: IdCard; }
interface ElemStyle { x: number; y: number; fontSize: number; width: number; color: string; bold: boolean; }
interface ImgStyle  { x: number; y: number; w: number; h: number; }

type FrontKey = 'firstName' | 'lastName' | 'positionTitle' | 'contactBlock';
type BackKey  = 'guardianName' | 'guardianPhone' | 'address';
type ImgKey   = 'barcode' | 'signature';

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
    signature: { x: 30, y: 55, w: 28, h:  9 },  // front card, below contact area
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

/* ─── Component ──────────────────────────────────────────── */
export default function Show({ idCard }: Props) {
    const cardRef  = useRef<HTMLDivElement>(null);
    const photoRef = useRef<HTMLDivElement>(null);
    const [activeTab, setActiveTab] = useState<'front' | 'back'>('front');

    /* Persisted layouts */
    const loadPos = <T extends object>(k: string, d: T): T => {
        try { const r = localStorage.getItem(`idc-${k}-${idCard.id}`); if (r) return Object.fromEntries(Object.keys(d).map(key => [key, JSON.parse(r)[key] ?? (d as any)[key]])) as T; } catch {}
        return { ...d };
    };
    const [frontPos, setFrontPos] = useState<Record<FrontKey, ElemStyle>>(() => loadPos('front', FRONT_DEFAULTS));
    const [backPos,  setBackPos]  = useState<Record<BackKey,  ElemStyle>>(() => loadPos('back',  BACK_DEFAULTS));
    const [imgPos,   setImgPos]   = useState<Record<ImgKey,   ImgStyle>> (() => loadPos('img',   IMG_DEFAULTS));
    useEffect(() => { try { localStorage.setItem(`idc-front-${idCard.id}`, JSON.stringify(frontPos)); } catch {} }, [frontPos, idCard.id]);
    useEffect(() => { try { localStorage.setItem(`idc-back-${idCard.id}`,  JSON.stringify(backPos));  } catch {} }, [backPos,  idCard.id]);
    useEffect(() => { try { localStorage.setItem(`idc-img-${idCard.id}`,   JSON.stringify(imgPos));   } catch {} }, [imgPos,   idCard.id]);

    /* Photo crop */
    const [cropMode,     setCropMode]     = useState(false);
    const [photoCropPos, setPhotoCropPos] = useState<{x:number;y:number}>(() => {
        try { const r = localStorage.getItem(`idc-crop-${idCard.id}`); if (r) return JSON.parse(r); } catch {}
        return { x: 50, y: 50 };
    });
    const cropHistRef = useRef<Array<{x:number;y:number}>>([]);
    const cropDragRef = useRef<{mx:number;my:number;cx:number;cy:number}|null>(null);
    useEffect(() => { try { localStorage.setItem(`idc-crop-${idCard.id}`, JSON.stringify(photoCropPos)); } catch {} }, [photoCropPos, idCard.id]);

    /* Selection */
    type SelState = { kind:'front';key:FrontKey }|{ kind:'back';key:BackKey }|{ kind:'img';key:ImgKey }|null;
    const [sel, setSel] = useState<SelState>(null);

    /* Drag/resize */
    type DragKind = { kind:'front';key:FrontKey }|{ kind:'back';key:BackKey }|{ kind:'img';key:ImgKey };
    const pendingRef    = useRef<{dk:DragKind;mx:number;my:number;ex:number;ey:number}|null>(null);
    const draggingRef   = useRef<DragKind|null>(null);
    const resizePendRef = useRef<{key:ImgKey;mx:number;my:number;ew:number;eh:number}|null>(null);
    const resizingRef   = useRef<ImgKey|null>(null);
    const [, setTick]   = useState(0);

    /* Previews */
    const [photoPreview,     setPhotoPreview]     = useState<string|null>(idCard.photo_path     ? `/storage/${idCard.photo_path}`     : null);
    const [barcodePreview,   setBarcodePreview]   = useState<string|null>(idCard.barcode_path   ? `/storage/${idCard.barcode_path}`   : null);
    const [signaturePreview, setSignaturePreview] = useState<string|null>(idCard.signature_path ? `/storage/${idCard.signature_path}` : null);

    /* Form */
    const { data, setData, post, processing, errors } = useForm({
        code: idCard.code, first_name: idCard.first_name, last_name: idCard.last_name,
        email: idCard.email, phone: idCard.phone ?? '', group: idCard.group,
        department: idCard.department, position: idCard.position ?? '',
        guardian_name: idCard.guardian_name ?? '', guardian_phone: idCard.guardian_phone ?? '',
        address: idCard.address ?? '', photo: null as File|null, barcode: null as File|null,
        signature: null as File|null, notes: idCard.notes ?? '', _method: 'PUT',
    });

    /* Global mouse/touch events */
    useEffect(() => {
        const rect = () => cardRef.current?.getBoundingClientRect();

        const move = (cx: number, cy: number) => {
            /* Crop drag */
            if (cropDragRef.current && photoRef.current) {
                const pr = photoRef.current.getBoundingClientRect();
                const dx = ((cx - cropDragRef.current.mx) / pr.width)  * 100;
                const dy = ((cy - cropDragRef.current.my) / pr.height) * 100;
                setPhotoCropPos({ x: Math.max(0,Math.min(100,cropDragRef.current.cx-dx)), y: Math.max(0,Math.min(100,cropDragRef.current.cy-dy)) });
                return;
            }
            /* Resize */
            if (resizePendRef.current && resizingRef.current) {
                const r = rect(); if (!r) return;
                const dw = ((cx - resizePendRef.current.mx) / r.width)  * 100;
                const dh = ((cy - resizePendRef.current.my) / r.height) * 100;
                const k  = resizePendRef.current.key;
                setImgPos(p => ({ ...p, [k]: { ...p[k], w: Math.max(3,Math.min(90,resizePendRef.current!.ew+dw)), h: Math.max(2,Math.min(90,resizePendRef.current!.eh+dh)) } }));
                return;
            }
            /* Drag */
            if (!pendingRef.current) return;
            const r = rect(); if (!r) return;
            const dx = ((cx - pendingRef.current.mx) / r.width)  * 100;
            const dy = ((cy - pendingRef.current.my) / r.height) * 100;
            if (!draggingRef.current && Math.hypot(cx-pendingRef.current.mx, cy-pendingRef.current.my) > 5) {
                draggingRef.current = pendingRef.current.dk; setTick(t=>t+1);
            }
            if (!draggingRef.current) return;
            const { dk, ex, ey } = pendingRef.current;
            const nx = Math.max(0,Math.min(90,ex+dx)), ny = Math.max(0,Math.min(95,ey+dy));
            if (dk.kind==='front') setFrontPos(p=>({...p,[dk.key]:{...p[dk.key],x:nx,y:ny}}));
            else if (dk.kind==='back') setBackPos(p=>({...p,[dk.key]:{...p[dk.key],x:nx,y:ny}}));
            else setImgPos(p=>({...p,[dk.key]:{...p[dk.key],x:nx,y:ny}}));
        };

        const onMM = (e:MouseEvent) => move(e.clientX,e.clientY);
        const onTM = (e:TouchEvent) => { e.preventDefault(); const t=e.touches[0]; move(t.clientX,t.clientY); };
        const onUp = () => {
            pendingRef.current=null; draggingRef.current=null;
            resizePendRef.current=null; resizingRef.current=null;
            cropDragRef.current=null;
            setTick(t=>t+1);
        };
        window.addEventListener('mousemove',onMM); window.addEventListener('mouseup',onUp);
        window.addEventListener('touchmove',onTM,{passive:false}); window.addEventListener('touchend',onUp);
        return ()=>{ window.removeEventListener('mousemove',onMM); window.removeEventListener('mouseup',onUp); window.removeEventListener('touchmove',onTM); window.removeEventListener('touchend',onUp); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[]);

    const startDrag = (dk:DragKind, ex:number, ey:number, e:React.MouseEvent|React.TouchEvent) => {
        e.stopPropagation();
        if (e.type==='mousedown') (e as React.MouseEvent).preventDefault();
        setSel({kind:dk.kind,key:dk.key} as SelState);
        pendingRef.current = { dk, mx:'clientX' in e?e.clientX:(e as React.TouchEvent).touches[0].clientX, my:'clientY' in e?e.clientY:(e as React.TouchEvent).touches[0].clientY, ex, ey };
    };
    const startResize = (key:ImgKey, e:React.MouseEvent) => {
        e.preventDefault(); e.stopPropagation();
        resizePendRef.current = { key, mx:e.clientX, my:e.clientY, ew:imgPos[key].w, eh:imgPos[key].h };
        resizingRef.current = key;
    };

    /* Toolbar */
    const getTextPos = (): ElemStyle|null => {
        if (!sel||sel.kind==='img') return null;
        return sel.kind==='front' ? frontPos[sel.key as FrontKey] : backPos[sel.key as BackKey];
    };
    const updateTextPos = (upd:Partial<ElemStyle>) => {
        if (!sel||sel.kind==='img') return;
        if (sel.kind==='front') setFrontPos(p=>({...p,[sel.key]:{...p[sel.key as FrontKey],...upd}}));
        if (sel.kind==='back')  setBackPos(p =>({...p,[sel.key]:{...p[sel.key as BackKey], ...upd}}));
    };
    const changeFontSize = (d:number) => {
        const pos=getTextPos(); if (!pos) return;
        updateTextPos({fontSize:Math.max(1,Math.min(20,+(pos.fontSize+d).toFixed(1)))});
    };
    const currentLabel = (): string => {
        if (!sel) return '';
        if (sel.kind==='front') return FRONT_NAMES[sel.key as FrontKey];
        if (sel.kind==='back')  return BACK_NAMES[sel.key as BackKey];
        return IMG_NAMES[sel.key as ImgKey];
    };

    /* Reset */
    const resetAll = () => {
        setFrontPos({...FRONT_DEFAULTS}); setBackPos({...BACK_DEFAULTS}); setImgPos({...IMG_DEFAULTS});
        setPhotoCropPos({x:50,y:50}); cropHistRef.current=[];
        ['front','back','img','crop'].forEach(k=>{ try{localStorage.removeItem(`idc-${k}-${idCard.id}`);}catch{} });
    };

    /* File uploads */
    const mkFile = (field:'photo'|'barcode'|'signature', setP:(v:string)=>void) =>
        (e:React.ChangeEvent<HTMLInputElement>) => {
            const f=e.target.files?.[0]; if (!f) return;
            setData(field,f);
            const r=new FileReader(); r.onload=ev=>setP(ev.target?.result as string); r.readAsDataURL(f);
        };

    /* Save */
    const doSave = () => {
        const fd=new FormData(); fd.append('_method','PUT');
        (['code','first_name','last_name','email','phone','group','department','position','guardian_name','guardian_phone','address','notes'] as const)
            .forEach(k=>fd.append(k,(data as any)[k]));
        if(data.photo)     fd.append('photo',data.photo);
        if(data.barcode)   fd.append('barcode',data.barcode);
        if(data.signature) fd.append('signature',data.signature);
        post(id_cards.update(idCard.id),{data:fd,preserveScroll:true} as any);
    };
    const submit:FormEventHandler = e=>{ e.preventDefault(); doSave(); };

    /* Export JPEG */
    const exportJpeg = useCallback(async () => {
        if (!cardRef.current) return;
        try {
            const { toJpeg } = await import('html-to-image');
            const dataUrl = await toJpeg(cardRef.current, { quality: 0.96, pixelRatio: 3 });
            const a = document.createElement('a');
            a.download = `${data.first_name}_${data.last_name}_${activeTab}.jpg`;
            a.href = dataUrl; a.click();
        } catch(e) { console.error(e); }
    }, [activeTab, data.first_name, data.last_name]);

    /* Text helpers */
    const getFrontText = (k:FrontKey):string => k==='firstName'?data.first_name:k==='lastName'?data.last_name:k==='positionTitle'?data.position:'';
    const getBackText  = (k:BackKey): string => k==='guardianName'?data.guardian_name:k==='guardianPhone'?data.guardian_phone:data.address;
    const dept=data.department||'admin';

    /* Text element renderer */
    const renderTextElem = (kind:'front'|'back', key:FrontKey|BackKey, pos:ElemStyle, text:string, isContact:boolean) => {
        const isSel = sel?.kind===kind && sel.key===key;
        const dk:DragKind = kind==='front' ? {kind:'front',key:key as FrontKey} : {kind:'back',key:key as BackKey};
        const lc=`${(pos.fontSize*4.2).toFixed(1)}cqw`, cc=`${(pos.fontSize*0.7).toFixed(1)}cqw`;
        const isGuardian = kind==='back' && (key==='guardianName'||key==='guardianPhone');
        const isAddr     = kind==='back' && key==='address';
        return (
            <div key={key} className="absolute"
                style={{ left:`${pos.x}%`,top:`${pos.y}%`,width:`${pos.width}%`, cursor:draggingRef.current?.key===key?'grabbing':isSel?'move':'pointer', zIndex:isSel?10:2 }}
                onMouseDown={e=>startDrag(dk,pos.x,pos.y,e)} onTouchStart={e=>startDrag(dk,pos.x,pos.y,e)}
                onClick={e=>{e.stopPropagation();setSel({kind,key} as SelState);}}
            >
                <span className="pointer-events-none absolute inset-0 rounded" style={{outline:isSel?'2px dashed #3b82f6':'2px dashed transparent',outlineOffset:'4px',transition:'outline-color 0.1s'}}/>
                {isContact ? (
                    <div style={{display:'flex',flexDirection:'column',gap:`${(pos.fontSize*.18).toFixed(1)}cqw`}}>
                        {data.phone&&<div style={{display:'grid',gridTemplateColumns:`${lc} ${cc} 1fr`,fontSize:`${pos.fontSize}cqw`,fontWeight:pos.bold?800:400,color:pos.color,lineHeight:1.2}}><span>Contact</span><span style={{textAlign:'center'}}>:</span><span style={{wordBreak:'break-word'}}>{data.phone}</span></div>}
                        {data.email&&<div style={{display:'grid',gridTemplateColumns:`${lc} ${cc} 1fr`,fontSize:`${pos.fontSize}cqw`,fontWeight:pos.bold?800:400,color:pos.color,lineHeight:1.2}}><span>Email</span><span style={{textAlign:'center'}}>:</span><span style={{wordBreak:'break-all'}}>{data.email}</span></div>}
                        {data.group&&<div style={{display:'grid',gridTemplateColumns:`${lc} ${cc} 1fr`,fontSize:`${pos.fontSize}cqw`,fontWeight:pos.bold?800:400,color:pos.color,lineHeight:1.2}}><span>Group</span><span style={{textAlign:'center'}}>:</span><span style={{wordBreak:'break-word'}}>{data.group}</span></div>}
                    </div>
                ) : (
                    <p style={{
                        fontSize:`${pos.fontSize}cqw`, color:pos.color,
                        fontWeight:pos.bold?'800':'400', lineHeight:1.15, margin:0,
                        textTransform: isGuardian?'capitalize':'uppercase',
                        textAlign:     (isGuardian||isAddr)?'center':undefined,
                        letterSpacing: isGuardian?'0.02em':'-0.02em',
                        wordBreak:'break-word',
                        whiteSpace: isAddr?'pre-line':undefined,
                    }}>
                        {text||<span style={{opacity:.2}}>—</span>}
                    </p>
                )}
            </div>
        );
    };

    /* Image element renderer */
    const renderImgElem = (key:ImgKey, src:string|null) => {
        if (!src) return null;
        const pos=imgPos[key], isSel=sel?.kind==='img'&&sel.key===key;
        const dk:DragKind={kind:'img',key};
        return (
            <div key={key} className="absolute overflow-hidden"
                style={{left:`${pos.x}%`,top:`${pos.y}%`,width:`${pos.w}%`,height:`${pos.h}%`,cursor:draggingRef.current?.key===key?'grabbing':isSel?'move':'pointer',zIndex:isSel?10:3}}
                onMouseDown={e=>startDrag(dk,pos.x,pos.y,e)} onTouchStart={e=>startDrag(dk,pos.x,pos.y,e)}
                onClick={e=>{e.stopPropagation();setSel({kind:'img',key});}}
            >
                <span className="pointer-events-none absolute inset-0 rounded z-10" style={{outline:isSel?'2px dashed #3b82f6':'2px dashed transparent',outlineOffset:'2px'}}/>
                <img src={src} alt={key} draggable={false} className="absolute inset-0 pointer-events-none" style={{width:'100%',height:'100%',objectFit:'contain'}}/>
                {isSel&&<div className="absolute bottom-0 right-0 z-20 h-4 w-4 translate-x-1/2 translate-y-1/2 rounded-full border-2 border-blue-500 bg-white shadow-md" style={{cursor:'se-resize'}} onMouseDown={e=>startResize(key,e)}/>}
            </div>
        );
    };

    const textPos = getTextPos();

    return (
        <>
            <Head title={`${data.first_name} ${data.last_name}`}/>

            <div className="flex h-full flex-col overflow-hidden">

                {/* ── Top bar ── */}
                <div className="flex flex-shrink-0 flex-wrap items-center gap-2 border-b bg-background px-4 py-2 min-h-[44px]">
                    {cropMode ? (
                        /* Crop mode bar */
                        <>
                            <button className="flex items-center gap-1.5 text-sm font-medium text-blue-600" onMouseDown={e=>{e.preventDefault();setCropMode(false);cropDragRef.current=null;}}>
                                <Crop className="h-4 w-4"/> Done Cropping
                            </button>
                            <div className="h-5 w-px bg-border"/>
                            <span className="text-xs text-muted-foreground">Drag photo to reposition crop</span>
                            {cropHistRef.current.length>0&&(
                                <>
                                    <div className="h-5 w-px bg-border"/>
                                    <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground" onMouseDown={e=>{e.preventDefault();const p=cropHistRef.current.pop();if(p)setPhotoCropPos(p);}}>
                                        <Undo2 className="h-3.5 w-3.5"/> Undo
                                    </button>
                                </>
                            )}
                            <div className="flex-1"/>
                        </>
                    ) : sel ? (
                        /* Element selected bar */
                        <>
                            <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mr-1" onMouseDown={e=>{e.preventDefault();setSel(null);}}>
                                <ArrowLeft className="h-4 w-4"/> Done
                            </button>
                            <div className="h-5 w-px bg-border"/>
                            <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground px-1">{currentLabel()}</span>
                            <div className="h-5 w-px bg-border"/>
                            {sel.kind!=='img'&&textPos ? (
                                <>
                                    <button className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted" onMouseDown={e=>{e.preventDefault();changeFontSize(-.5);}}><Minus className="h-3 w-3"/></button>
                                    <span className="w-9 text-center font-mono text-xs tabular-nums">{textPos.fontSize.toFixed(1)}</span>
                                    <button className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted" onMouseDown={e=>{e.preventDefault();changeFontSize(.5);}}><Plus className="h-3 w-3"/></button>
                                    <div className="h-5 w-px bg-border"/>
                                    <button className={`flex h-7 w-7 items-center justify-center rounded-md ${textPos.bold?'bg-primary text-primary-foreground':'hover:bg-muted'}`} onMouseDown={e=>{e.preventDefault();updateTextPos({bold:!textPos.bold});}}><Bold className="h-3 w-3"/></button>
                                    <div className="h-5 w-px bg-border"/>
                                    {SWATCHES.map(({value,label})=>(
                                        <button key={value} title={label} onMouseDown={e=>{e.preventDefault();updateTextPos({color:value});}} className="h-5 w-5 flex-shrink-0 rounded-full hover:scale-110 transition-transform" style={{background:value,border:'1px solid rgba(0,0,0,0.18)',outline:textPos.color===value?'2.5px solid #3b82f6':'2.5px solid transparent',outlineOffset:'1px'}}/>
                                    ))}
                                </>
                            ) : sel.kind==='img' ? (
                                <span className="text-xs font-mono text-muted-foreground">{imgPos[sel.key as ImgKey].w.toFixed(0)}%×{imgPos[sel.key as ImgKey].h.toFixed(0)}% <span className="opacity-50">(drag ◼ to resize)</span></span>
                            ) : null}
                            <div className="flex-1"/>
                        </>
                    ) : (
                        /* Default bar */
                        <>
                            <Link href={id_cards.index()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                                <ArrowLeft className="h-4 w-4"/> All Cards
                            </Link>
                            <div className="h-5 w-px bg-border"/>
                            <span className="text-sm font-semibold">{data.first_name||'First'} {data.last_name||'Last'}</span>
                            <div className="flex-1"/>
                            <Button variant="outline" size="sm" onClick={exportJpeg} type="button">
                                <Download className="mr-1.5 h-3.5 w-3.5"/> Export JPEG
                            </Button>
                        </>
                    )}
                    <Button size="sm" onClick={doSave} disabled={processing}>
                        <Save className="mr-1.5 h-3.5 w-3.5"/>{processing?'Saving…':'Save'}
                    </Button>
                </div>

                {/* ── Main split ── */}
                <div className="flex flex-1 overflow-hidden">

                    {/* ── Canvas ── */}
                    <div className="flex flex-1 flex-col items-center gap-3 overflow-auto bg-neutral-200 px-4 py-4 dark:bg-neutral-800">

                        {/* Front / Back tab */}
                        <div className="flex rounded-lg bg-muted p-1">
                            {(['front','back'] as const).map(tab=>(
                                <button key={tab} onClick={()=>{setActiveTab(tab);setSel(null);setCropMode(false);}}
                                    className={`rounded-md px-4 py-1.5 text-sm font-medium capitalize transition-colors ${activeTab===tab?'bg-background shadow-sm text-foreground':'text-muted-foreground hover:text-foreground'}`}>
                                    {tab} Side
                                </button>
                            ))}
                        </div>

                        {/* Card canvas */}
                        <div ref={cardRef} className="relative flex-shrink-0 select-none overflow-hidden rounded-[2rem] shadow-2xl"
                            style={{width:'min(430px, 100%)',containerType:'inline-size'} as React.CSSProperties}
                            onClick={()=>{if(!cropMode)setSel(null);}}>
                            <img src={activeTab==='front'?`/${dept}-template-front.png`:`/${dept}-template-back.png`} alt="template" className="block h-auto w-full pointer-events-none" draggable={false}/>

                            <div className="absolute inset-0">
                                {activeTab==='front'&&(
                                    <>
                                        {/* Photo with crop support */}
                                        <div ref={photoRef}
                                            className="absolute overflow-hidden rounded-[1.5rem] bg-white"
                                            style={{left:'8%',top:'17%',width:'44%',height:'29%',cursor:cropMode&&photoPreview?'crosshair':'default',outline:cropMode?'2px solid #3b82f6':undefined,outlineOffset:'2px'}}
                                            onDoubleClick={e=>{e.stopPropagation();if(photoPreview){cropHistRef.current.push({...photoCropPos});setCropMode(true);setSel(null);}}}
                                            onMouseDown={e=>{if(cropMode&&photoPreview){e.preventDefault();e.stopPropagation();cropDragRef.current={mx:e.clientX,my:e.clientY,cx:photoCropPos.x,cy:photoCropPos.y};}}}
                                        >
                                            {photoPreview
                                                ?<img src={photoPreview} alt="Photo" className="h-full w-full object-cover pointer-events-none" draggable={false} style={{objectPosition:`${photoCropPos.x}% ${photoCropPos.y}%`}}/>
                                                :<div className="flex h-full w-full items-center justify-center"><span style={{fontSize:'2.5cqw',color:'#94a3b8',fontWeight:700,textTransform:'uppercase'}}>No Photo</span></div>}
                                            {cropMode&&photoPreview&&(
                                                <div className="pointer-events-none absolute inset-0 flex items-end justify-center pb-1">
                                                    <span style={{fontSize:'1.8cqw',color:'#fff',background:'rgba(59,130,246,.75)',padding:'1px 5px',borderRadius:'4px',fontWeight:700}}>DRAG TO CROP</span>
                                                </div>
                                            )}
                                        </div>
                                        {/* Double-click hint */}
                                        {!cropMode&&photoPreview&&(
                                            <div className="pointer-events-none absolute" style={{left:'8%',top:'47%',width:'44%',textAlign:'center'}}>
                                                <span style={{fontSize:'1.5cqw',color:'rgba(255,255,255,.55)',fontWeight:600}}>double-click to crop</span>
                                            </div>
                                        )}

                                        {renderImgElem('barcode',barcodePreview)}
                                        {renderImgElem('signature',signaturePreview)}

                                        {(Object.keys(frontPos) as FrontKey[]).map(k=>
                                            renderTextElem('front',k,frontPos[k],getFrontText(k),k==='contactBlock')
                                        )}
                                    </>
                                )}

                                {activeTab==='back'&&(
                                    <>
                                        {(Object.keys(backPos) as BackKey[]).map(k=>
                                            renderTextElem('back',k,backPos[k],getBackText(k),false)
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col items-center gap-1 text-center">
                            <p className="text-[11px] text-muted-foreground/60">Click to select · drag to move · drag ◼ to resize images · double-click photo to crop</p>
                            <button onClick={resetAll} className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"><RotateCcw className="h-3 w-3"/> Reset all</button>
                        </div>
                    </div>

                    {/* ── Form panel — changes with active tab ── */}
                    <div className="w-[360px] flex-shrink-0 overflow-auto border-l bg-background">
                        <form onSubmit={submit}>
                            <div className="space-y-4 p-5">

                                {/* Department always visible */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="dept">Department</Label>
                                    <select id="dept" value={data.department} onChange={e=>setData('department',e.target.value)} disabled={processing}
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                                        <option value="admin">Admin</option><option value="hr">HR</option>
                                        <option value="finance">Finance</option><option value="nurse">Nurse</option>
                                    </select>
                                </div>

                                {activeTab==='front' ? (
                                    <>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-b pb-1">Front Card Fields</p>

                                        <div className="space-y-1.5">
                                            <Label htmlFor="code">ID Code</Label>
                                            <Input id="code" value={data.code} onChange={e=>setData('code',e.target.value)} disabled={processing} className="font-mono text-sm"/>
                                            <InputError message={errors.code}/>
                                            <p className="text-xs text-muted-foreground">Changing code regenerates barcode</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1.5">
                                                <Label htmlFor="first_name">First Name</Label>
                                                <Input id="first_name" value={data.first_name} onChange={e=>setData('first_name',e.target.value)} disabled={processing}/>
                                                <InputError message={errors.first_name}/>
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label htmlFor="last_name">Last Name</Label>
                                                <Input id="last_name" value={data.last_name} onChange={e=>setData('last_name',e.target.value)} disabled={processing}/>
                                                <InputError message={errors.last_name}/>
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label htmlFor="position">Position / Title</Label>
                                            <Input id="position" value={data.position} onChange={e=>setData('position',e.target.value)} disabled={processing} placeholder="e.g., Nurse, Staff, Doctor"/>
                                            <InputError message={errors.position}/>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1.5">
                                                <Label htmlFor="email">Email</Label>
                                                <Input id="email" type="email" value={data.email} onChange={e=>setData('email',e.target.value)} disabled={processing}/>
                                                <InputError message={errors.email}/>
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label htmlFor="phone">Phone</Label>
                                                <Input id="phone" value={data.phone} onChange={e=>setData('phone',e.target.value)} disabled={processing}/>
                                                <InputError message={errors.phone}/>
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label htmlFor="group">Group</Label>
                                            <Input id="group" value={data.group} onChange={e=>setData('group',e.target.value)} disabled={processing}/>
                                            <InputError message={errors.group}/>
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label>Photo <span className="text-muted-foreground font-normal text-xs">(double-click on card to crop)</span></Label>
                                            <input type="file" accept="image/*" onChange={mkFile('photo',setPhotoPreview)} disabled={processing} className="block w-full cursor-pointer text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"/>
                                            <InputError message={errors.photo}/>
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label>Barcode Image</Label>
                                            <input type="file" accept="image/*" onChange={mkFile('barcode',setBarcodePreview)} disabled={processing} className="block w-full cursor-pointer text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"/>
                                            {barcodePreview&&<img src={barcodePreview} alt="barcode" className="mt-1 h-12 w-auto rounded border"/>}
                                            <InputError message={errors.barcode}/>
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label>Signature Image <span className="text-muted-foreground font-normal text-xs">(appears on front card)</span></Label>
                                            <input type="file" accept="image/*" onChange={mkFile('signature',setSignaturePreview)} disabled={processing} className="block w-full cursor-pointer text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"/>
                                            {signaturePreview&&<img src={signaturePreview} alt="signature" className="mt-1 h-12 w-auto rounded border"/>}
                                            <InputError message={errors.signature}/>
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label htmlFor="notes">Notes</Label>
                                            <Textarea id="notes" value={data.notes} onChange={e=>setData('notes',e.target.value)} disabled={processing} rows={2} placeholder="Additional notes…"/>
                                            <InputError message={errors.notes}/>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-b pb-1">Back Card Fields</p>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1.5">
                                                <Label htmlFor="guardian_name">Guardian Name</Label>
                                                <Input id="guardian_name" value={data.guardian_name} onChange={e=>setData('guardian_name',e.target.value)} disabled={processing} placeholder="Juan dela Cruz"/>
                                                <InputError message={errors.guardian_name}/>
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label htmlFor="guardian_phone">Guardian Phone</Label>
                                                <Input id="guardian_phone" value={data.guardian_phone} onChange={e=>setData('guardian_phone',e.target.value)} disabled={processing}/>
                                                <InputError message={errors.guardian_phone}/>
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label htmlFor="address">Address <span className="text-muted-foreground font-normal text-xs">(Enter for new line, centered)</span></Label>
                                            <Textarea id="address" value={data.address} onChange={e=>setData('address',e.target.value)} disabled={processing} rows={3} placeholder={"#15 Street Name\nCity, Province"}/>
                                            <InputError message={errors.address}/>
                                        </div>
                                    </>
                                )}

                                <Button type="submit" disabled={processing} className="w-full">
                                    <Save className="mr-1.5 h-3.5 w-3.5"/>{processing?'Saving…':'Save Changes'}
                                </Button>
                            </div>
                        </form>
                    </div>

                </div>
            </div>
        </>
    );
}

Show.layout = {
    breadcrumbs: [
        { title: 'ID Cards', href: id_cards.index() },
        { title: 'Edit' },
    ],
};
