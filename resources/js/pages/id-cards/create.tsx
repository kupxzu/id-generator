import { FormEventHandler, useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import InputError from '@/components/input-error';
import { id_cards } from '@/lib/routes-helpers';

/* ─── Types ──────────────────────────────────────────────── */
interface ElemStyle { x: number; y: number; fontSize: number; width: number; color: string; bold: boolean; }
interface ImgStyle  { x: number; y: number; w: number; h: number; }
type FrontKey = 'firstName' | 'lastName' | 'positionTitle' | 'contactBlock';
type ImgKey   = 'barcode' | 'signature';
interface TemplateRecord {
    front_layout?: Record<FrontKey, ElemStyle>;
    img_layout?:   Record<ImgKey,   ImgStyle>;
}
interface Props {
    templates?: Record<string, TemplateRecord>;
}

const FRONT_DEFAULTS: Record<FrontKey, ElemStyle> = {
    firstName:     { x: 55, y: 24, fontSize: 6,   width: 42, color: '#ffffff', bold: true  },
    lastName:      { x: 55, y: 31, fontSize: 7,   width: 42, color: '#ffffff', bold: true  },
    positionTitle: { x: 55, y: 40, fontSize: 6,   width: 42, color: '#ffffff', bold: false },
    contactBlock:  { x: 19, y: 70, fontSize: 4,   width: 79, color: '#1e293b', bold: true  },
};
const IMG_DEFAULTS: Record<ImgKey, ImgStyle> = {
    barcode:   { x: 2,  y: 40, w: 15, h: 55 },
    signature: { x: 30, y: 55, w: 28, h:  9 },
};

/* ─── Component ──────────────────────────────────────────── */
export default function Create({ templates = {} }: Props) {
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);

    const { data, setData, post, processing, errors } = useForm({
        code:       '',
        first_name: '',
        last_name:  '',
        email:      '',
        phone:      '',
        group:      'employee',
        department: 'admin',
        position:   '',
        photo:      null as File | null,
        notes:      '',
    });

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setData('photo', file);
        const reader = new FileReader();
        reader.onload = ev => setPhotoPreview(ev.target?.result as string);
        reader.readAsDataURL(file);
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        const fd = new FormData();
        fd.append('code',       data.code);
        fd.append('first_name', data.first_name);
        fd.append('last_name',  data.last_name);
        fd.append('email',      data.email);
        fd.append('phone',      data.phone);
        fd.append('group',      data.group);
        fd.append('department', data.department);
        fd.append('position',   data.position);
        fd.append('notes',      data.notes);
        if (data.photo) fd.append('photo', data.photo);
        post(id_cards.store(), { data: fd, preserveScroll: true } as any);
    };

    /* Resolve template layout for selected department */
    const tmpl = templates[data.department];
    const fl   = (tmpl?.front_layout as Record<FrontKey, ElemStyle> | undefined) ?? FRONT_DEFAULTS;
    const il   = (tmpl?.img_layout   as Record<ImgKey,   ImgStyle>  | undefined) ?? IMG_DEFAULTS;
    const barcodeSrc = data.code.trim()
        ? `/barcode-image?code=${encodeURIComponent(data.code.trim())}`
        : null;
    const lc = (fs: number) => `${(fs * 4.2).toFixed(1)}cqw`;
    const cc = (fs: number) => `${(fs * 0.7).toFixed(1)}cqw`;

    return (
        <>
            <Head title="Create ID Card" />
            <div className="flex h-full flex-1 overflow-hidden">

                {/* ── Form column ── */}
                <div className="flex-1 overflow-auto p-5 min-w-0">
                    <h1 className="text-lg font-semibold leading-none">Create New ID Card</h1>
                    <p className="mt-1 mb-5 text-sm text-muted-foreground">Fill in the details to generate a new ID card</p>

                    <form onSubmit={submit} className="space-y-3 max-w-lg">

                        {/* Code */}
                        <div className="space-y-1">
                            <Label htmlFor="code">ID Code *</Label>
                            <Input id="code" type="text" placeholder="e.g., 1234-123456-123"
                                value={data.code} onChange={e => setData('code', e.target.value)}
                                disabled={processing} className="font-mono"/>
                            <InputError message={errors.code}/>
                        </div>

                        {/* Name */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label htmlFor="first_name">First Name *</Label>
                                <Input id="first_name" value={data.first_name} onChange={e => setData('first_name', e.target.value)} disabled={processing}/>
                                <InputError message={errors.first_name}/>
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="last_name">Last Name *</Label>
                                <Input id="last_name" value={data.last_name} onChange={e => setData('last_name', e.target.value)} disabled={processing}/>
                                <InputError message={errors.last_name}/>
                            </div>
                        </div>

                        {/* Position */}
                        <div className="space-y-1">
                            <Label htmlFor="position">Position / Title</Label>
                            <Input id="position" value={data.position} onChange={e => setData('position', e.target.value)}
                                disabled={processing} placeholder="e.g., Nurse, Staff, Doctor"/>
                            <InputError message={errors.position}/>
                        </div>

                        {/* Contact */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label htmlFor="email">Email *</Label>
                                <Input id="email" type="email" value={data.email} onChange={e => setData('email', e.target.value)} disabled={processing}/>
                                <InputError message={errors.email}/>
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="phone">Phone</Label>
                                <Input id="phone" type="tel" value={data.phone} onChange={e => setData('phone', e.target.value)} disabled={processing}/>
                                <InputError message={errors.phone}/>
                            </div>
                        </div>

                        {/* Department + Group */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label htmlFor="department">Department *</Label>
                                <select id="department" value={data.department} onChange={e => setData('department', e.target.value)} disabled={processing}
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                                    <option value="admin">Admin</option>
                                    <option value="hr">HR</option>
                                    <option value="finance">Finance</option>
                                    <option value="nurse">Nurse</option>
                                </select>
                                <InputError message={errors.department}/>
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="group">Group / Category *</Label>
                                <Input id="group" value={data.group} onChange={e => setData('group', e.target.value)} disabled={processing}/>
                                <InputError message={errors.group}/>
                            </div>
                        </div>

                        {/* Photo */}
                        <div className="space-y-1">
                            <Label>Photo</Label>
                            <input type="file" accept="image/*" onChange={handlePhotoChange} disabled={processing}
                                className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"/>
                            <InputError message={errors.photo}/>
                        </div>

                        {/* Notes */}
                        <div className="space-y-1">
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea id="notes" value={data.notes} onChange={e => setData('notes', e.target.value)}
                                disabled={processing} rows={2} placeholder="Additional information or remarks..."/>
                            <InputError message={errors.notes}/>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-1">
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Creating…' : 'Create ID Card'}
                            </Button>
                            <Button type="button" variant="outline" onClick={() => window.history.back()} disabled={processing}>
                                Cancel
                            </Button>
                        </div>
                    </form>
                </div>

                {/* ── Live Preview column ── */}
                <div className="w-[340px] flex-shrink-0 border-l bg-neutral-100 dark:bg-neutral-800 flex flex-col items-center gap-3 overflow-auto p-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground self-start">Live Preview · Front</p>

                    {/* Card canvas */}
                    <div className="relative w-full select-none overflow-hidden rounded-[2rem] shadow-xl"
                        style={{ containerType: 'inline-size' } as React.CSSProperties}>
                        <img src={`/${data.department}-template-front.png`} alt="template"
                            className="block h-auto w-full pointer-events-none" draggable={false}/>

                        <div className="absolute inset-0">
                            {/* Photo slot */}
                            <div className="absolute overflow-hidden rounded-[1.5rem] bg-white"
                                style={{ left: '8%', top: '17%', width: '44%', height: '29%' }}>
                                {photoPreview
                                    ? <img src={photoPreview} alt="Photo"
                                        className="h-full w-full object-cover pointer-events-none" draggable={false}/>
                                    : <div className="flex h-full w-full items-center justify-center">
                                        <span style={{ fontSize: '2.5cqw', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>No Photo</span>
                                      </div>
                                }
                            </div>

                            {/* Barcode */}
                            {barcodeSrc && (
                                <div className="absolute overflow-hidden"
                                    style={{ left: `${il.barcode.x}%`, top: `${il.barcode.y}%`, width: `${il.barcode.w}%`, height: `${il.barcode.h}%` }}>
                                    <img src={barcodeSrc} alt="barcode" draggable={false}
                                        className="absolute inset-0 w-full h-full object-contain pointer-events-none"/>
                                </div>
                            )}

                            {/* First Name */}
                            <div className="absolute" style={{ left: `${fl.firstName.x}%`, top: `${fl.firstName.y}%`, width: `${fl.firstName.width}%` }}>
                                <p style={{ fontSize: `${fl.firstName.fontSize}cqw`, color: fl.firstName.color, fontWeight: fl.firstName.bold ? 800 : 400, lineHeight: 1.15, margin: 0, textTransform: 'uppercase', letterSpacing: '-0.02em', wordBreak: 'break-word' }}>
                                    {data.first_name || <span style={{ opacity: .15 }}>—</span>}
                                </p>
                            </div>

                            {/* Last Name */}
                            <div className="absolute" style={{ left: `${fl.lastName.x}%`, top: `${fl.lastName.y}%`, width: `${fl.lastName.width}%` }}>
                                <p style={{ fontSize: `${fl.lastName.fontSize}cqw`, color: fl.lastName.color, fontWeight: fl.lastName.bold ? 800 : 400, lineHeight: 1.15, margin: 0, textTransform: 'uppercase', letterSpacing: '-0.02em', wordBreak: 'break-word' }}>
                                    {data.last_name || <span style={{ opacity: .15 }}>—</span>}
                                </p>
                            </div>

                            {/* Position */}
                            <div className="absolute" style={{ left: `${fl.positionTitle.x}%`, top: `${fl.positionTitle.y}%`, width: `${fl.positionTitle.width}%` }}>
                                <p style={{ fontSize: `${fl.positionTitle.fontSize}cqw`, color: fl.positionTitle.color, fontWeight: fl.positionTitle.bold ? 800 : 400, lineHeight: 1.15, margin: 0, textTransform: 'uppercase', letterSpacing: '-0.02em', wordBreak: 'break-word' }}>
                                    {data.position || <span style={{ opacity: .15 }}>—</span>}
                                </p>
                            </div>

                            {/* Contact block */}
                            {(data.phone || data.email || data.group) && (
                                <div className="absolute" style={{ left: `${fl.contactBlock.x}%`, top: `${fl.contactBlock.y}%`, width: `${fl.contactBlock.width}%` }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: `${(fl.contactBlock.fontSize * .18).toFixed(1)}cqw` }}>
                                        {data.phone && (
                                            <div style={{ display: 'grid', gridTemplateColumns: `${lc(fl.contactBlock.fontSize)} ${cc(fl.contactBlock.fontSize)} 1fr`, fontSize: `${fl.contactBlock.fontSize}cqw`, fontWeight: fl.contactBlock.bold ? 800 : 400, color: fl.contactBlock.color, lineHeight: 1.2 }}>
                                                <span>Contact</span><span style={{ textAlign: 'center' }}>:</span><span style={{ wordBreak: 'break-word' }}>{data.phone}</span>
                                            </div>
                                        )}
                                        {data.email && (
                                            <div style={{ display: 'grid', gridTemplateColumns: `${lc(fl.contactBlock.fontSize)} ${cc(fl.contactBlock.fontSize)} 1fr`, fontSize: `${fl.contactBlock.fontSize}cqw`, fontWeight: fl.contactBlock.bold ? 800 : 400, color: fl.contactBlock.color, lineHeight: 1.2 }}>
                                                <span>Email</span><span style={{ textAlign: 'center' }}>:</span><span style={{ wordBreak: 'break-all' }}>{data.email}</span>
                                            </div>
                                        )}
                                        {data.group && (
                                            <div style={{ display: 'grid', gridTemplateColumns: `${lc(fl.contactBlock.fontSize)} ${cc(fl.contactBlock.fontSize)} 1fr`, fontSize: `${fl.contactBlock.fontSize}cqw`, fontWeight: fl.contactBlock.bold ? 800 : 400, color: fl.contactBlock.color, lineHeight: 1.2 }}>
                                                <span>Group</span><span style={{ textAlign: 'center' }}>:</span><span style={{ wordBreak: 'break-word' }}>{data.group}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <p className="text-[10px] text-muted-foreground/60 text-center">
                        Preview updates as you type · Full editor available after saving
                    </p>
                </div>

            </div>
        </>
    );
}

Create.layout = {
    breadcrumbs: [
        { title: 'ID Cards', href: id_cards.index() },
        { title: 'Create' },
    ],
};
