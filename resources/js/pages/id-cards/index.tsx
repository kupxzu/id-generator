import { Head, Link, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Heading from '@/components/heading';
import { id_cards } from '@/lib/routes-helpers';
import { useState } from 'react';
import { Input } from '@/components/ui/input';

interface IdCard {
    id: number;
    code: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
    group: string;
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
}

export default function Index({ idCards }: Props) {
    const [search, setSearch] = useState('');

    const filteredCards = idCards.data.filter(
        (card) =>
            card.first_name.toLowerCase().includes(search.toLowerCase()) ||
            card.last_name.toLowerCase().includes(search.toLowerCase()) ||
            card.code.toLowerCase().includes(search.toLowerCase()) ||
            card.email.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <>
            <Head title="ID Cards Management" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="w-full">
                    <div className="flex items-center justify-between">
                        <Heading
                            title="ID Cards Management"
                            description="Create, view, and manage ID cards"
                        />
                        <Link href={id_cards.create()}>
                            <Button>Create New ID Card</Button>
                        </Link>
                    </div>

                    {/* Search Bar */}
                    <div className="mt-6">
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
                        <div className="mt-6 overflow-hidden rounded-lg border border-border">
                            <table className="w-full">
                                <thead className="border-b border-border bg-muted">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-sm font-semibold">Photo</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold">Code</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold">Group</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredCards.map((card) => (
                                        <tr
                                            key={card.id}
                                            className="border-b border-border hover:bg-muted/50 transition-colors"
                                        >
                                            <td className="px-6 py-4">
                                                {card.photo_path ? (
                                                    <img
                                                        src={`/storage/${card.photo_path}`}
                                                        alt={card.first_name}
                                                        className="h-10 w-10 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="h-10 w-10 rounded-full bg-muted" />
                                                )}
                                            </td>
                                            <td className="px-6 py-4 font-mono text-sm font-semibold">
                                                {card.code}
                                            </td>
                                            <td className="px-6 py-4 font-semibold">
                                                {card.first_name} {card.last_name}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-muted-foreground">
                                                {card.email}
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant="secondary">{card.group}</Badge>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Link href={id_cards.show(card.id)}>
                                                    <Button size="sm" variant="ghost">
                                                        View
                                                    </Button>
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
                                {search ? 'No ID cards found matching your search.' : 'No ID cards created yet.'}
                            </p>
                            {!search && (
                                <Link href={id_cards.create()}>
                                    <Button className="mt-4">Create Your First ID Card</Button>
                                </Link>
                            )}
                        </div>
                    )}

                    {/* Pagination Info */}
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
    breadcrumbs: [
        {
            title: 'ID Cards',
            href: id_cards.index(),
        },
    ],
};
