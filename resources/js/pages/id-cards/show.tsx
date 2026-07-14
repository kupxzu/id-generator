import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import Heading from '@/components/heading';
import { id_cards } from '@/lib/routes-helpers';

interface IdCard {
    id: number;
    code: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
    group: string;
    photo_path: string | null;
    barcode_path: string | null;
    notes: string | null;
    created_by: {
        name: string;
    };
    created_at: string;
    updated_at: string;
}

interface Props {
    idCard: IdCard;
}

export default function Show({ idCard }: Props) {
    return (
        <>
            <Head title={`${idCard.first_name} ${idCard.last_name}`} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="max-w-2xl">
                    <Heading
                        title={idCard.first_name + ' ' + idCard.last_name}
                        description="ID Card Preview"
                    />

                    <div className="relative w-full overflow-hidden rounded-3xl border border-slate-300 bg-white shadow-2xl">
                        <img
                            src="/admin-template-front.png"
                            alt="ID Template"
                            className="h-auto w-full object-cover"
                        />

                        <div className="absolute inset-0">
                            {/* Photo Placeholder */}
                            <div className="absolute left-[9%] top-[17%] h-[30%] w-[27%] overflow-hidden rounded-[2rem] bg-white">
                                {idCard.photo_path ? (
                                    <img
                                        src={`/storage/${idCard.photo_path}`}
                                        alt="ID Photo"
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-xs font-bold uppercase tracking-[0.25em] text-slate-600">
                                        upload image here
                                    </div>
                                )}
                            </div>

                            {/* Name and Family Name */}
                            <div className="absolute right-[10%] top-[24%] w-[40%] text-white">
                                <p className="text-5xl font-extrabold uppercase tracking-tight text-white leading-tight">
                                    {idCard.first_name}
                                </p>
                                <p className="mt-1 text-5xl font-extrabold uppercase tracking-tight text-white leading-tight">
                                    {idCard.last_name}
                                </p>
                            </div>

                            {/* Barcode block */}
                            <div className="absolute left-[4%] top-[60%] h-[33%] w-[12%] overflow-hidden bg-transparent">
                                {idCard.barcode_path ? (
                                    <img
                                        src={`/storage/${idCard.barcode_path}`}
                                        alt="Barcode"
                                        className="h-full w-full object-contain rotate-90"
                                    />
                                ) : null}
                            </div>

                            {/* Contact Details */}
                            <div className="absolute left-[22%] top-[68%] w-[54%] text-slate-900">
                                {idCard.phone && (
                                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-700">
                                        Contact
                                    </p>
                                )}
                                {idCard.phone && (
                                    <p className="mt-1 text-lg font-bold text-slate-900">{idCard.phone}</p>
                                )}
                                <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-700">
                                    Email
                                </p>
                                <p className="mt-1 text-lg font-bold text-slate-900">{idCard.email}</p>
                                <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-700">
                                    Employee
                                </p>
                                <p className="mt-1 text-lg font-bold text-slate-900">{idCard.group}</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex gap-2">
                        <Link href={id_cards.edit(idCard.id)}>
                            <Button>Edit</Button>
                        </Link>
                        <Link href={id_cards.index()}>
                            <Button variant="outline">Back to List</Button>
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}

Show.layout = {
    breadcrumbs: [
        {
            title: 'ID Cards',
            href: id_cards.index(),
        },
        {
            title: 'View',
        },
    ],
};
