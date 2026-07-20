import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import Heading from '@/components/heading';
import { id_cards, id_templates } from '@/lib/routes-helpers';
import { useState } from 'react';
import { Input } from '@/components/ui/input';

type Dept = 'admin' | 'hr' | 'finance' | 'nurse';

const DEPT_COLORS: Record<Dept, string> = {
    admin:   'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    hr:      'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    finance: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    nurse:   'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
};

interface IdCard {
    id: number;
    code: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
    group: string;
    department: string;
    position: string | null;
    photo_path: string | null;
    created_at: string;
}

interface Props {
    idCards: {
        data: IdCard[];
        current_page: number;
        last_page: number;
        total: number;
    };
    department: string;
}

const DEPT_TABS = [
    { value: '',        label: 'All'     },
    { value: 'admin',   label: 'Admin'   },
    { value: 'hr',      label: 'HR'      },
    { value: 'finance', label: 'Finance' },
    { value: 'nurse',   label: 'Nurse'   },
];

export default function Index({ idCards, department }: Props) {
    const [search, setSearch] = useState('');

    const filteredCards = idCards.data.filter(
        (card) =>
            card.first_name.toLowerCase().includes(search.toLowerCase()) ||
            card.last_name.toLowerCase().includes(search.toLowerCase()) ||
            card.code.toLowerCase().includes(search.toLowerCase()) ||
            card.email.toLowerCase().includes(search.toLowerCase())
    );

    const switchDept = (dept: string) => {
        router.get(id_cards.index(), dept ? { department: dept } : {}, { preserveState: false });
    };

    return (
        <>
            <Head title="ID Cards Management" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="w-full">
                    <div className="flex items-center justify-between">
                        <Heading
                            title={department ? `${department.charAt(0).toUpperCase() + department.slice(1)} Department` : 'ID Cards Management'}
                            description="Create, view, and manage ID cards"
                        />
                        <div className="flex items-center gap-2">
                            <Link href={id_templates.index()}>
                                <Button variant="outline">Templates</Button>
                            </Link>
                            <Link href={id_cards.create()}>
                                <Button>Create New ID Card</Button>
                            </Link>
                        </div>
                    </div>

                    {/* Department tabs */}
                    <div className="mt-4 flex gap-1 rounded-lg bg-muted p-1 w-fit">
                        {DEPT_TABS.map((tab) => (
                            <button
                                key={tab.value}
                                onClick={() => switchDept(tab.value)}
                                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                                    department === tab.value
                                        ? 'bg-background shadow-sm text-foreground'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Search Bar */}
                    <div className="mt-4">
                        <Input
                            type="text"
                            placeholder="Search by name, code, or email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="max-w-md"
                        />
                    </div>

                    {/* ID Cards Table */}
                    {filteredCards.length > 0 ? (
                        <div className="mt-4 overflow-hidden rounded-lg border border-border">
                            <table className="w-full">
                                <thead className="border-b border-border bg-muted">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-semibold">Photo</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold">Code</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold">Department</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold">Position</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold">Email</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredCards.map((card) => (
                                        <tr key={card.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                                            <td className="px-4 py-3">
                                                {card.photo_path ? (
                                                    <img src={`/storage/${card.photo_path}`} alt={card.first_name} className="h-10 w-10 rounded-full object-cover object-top" />
                                                ) : (
                                                    <div className="h-10 w-10 rounded-full bg-muted" />
                                                )}
                                            </td>
                                            <td className="px-4 py-3 font-mono text-sm font-semibold">{card.code}</td>
                                            <td className="px-4 py-3 font-semibold">{card.first_name} {card.last_name}</td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${DEPT_COLORS[card.department as Dept] ?? 'bg-muted text-muted-foreground'}`}>
                                                    {card.department}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-muted-foreground">{card.position || '—'}</td>
                                            <td className="px-4 py-3 text-sm text-muted-foreground">{card.email}</td>
                                            <td className="px-4 py-3">
                                                <Link href={id_cards.show(card.id)}>
                                                    <Button size="sm" variant="ghost">View</Button>
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="mt-6 rounded-lg border border-border border-dashed p-12 text-center">
                            <p className="text-muted-foreground">
                                {search ? 'No ID cards found matching your search.' : 'No ID cards in this department yet.'}
                            </p>
                            {!search && (
                                <Link href={id_cards.create()}>
                                    <Button className="mt-4">Create New ID Card</Button>
                                </Link>
                            )}
                        </div>
                    )}

                    {idCards.total > 0 && (
                        <div className="mt-4 text-center text-sm text-muted-foreground">
                            Showing {filteredCards.length} of {idCards.total} ID cards
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

Index.layout = {
    breadcrumbs: [{ title: 'ID Cards', href: id_cards.index() }],
};
