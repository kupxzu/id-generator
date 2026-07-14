import { FormEventHandler, useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import InputError from '@/components/input-error';
import Heading from '@/components/heading';
import { id_cards } from '@/lib/routes-helpers';

export default function Create() {
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const { data, setData, post, processing, errors } = useForm({
        code: '',
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        group: 'employee',
        photo: null as File | null,
        notes: '',
    });

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('photo', file);
            const reader = new FileReader();
            reader.onload = (e) => {
                setPhotoPreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        
        const formData = new FormData();
        formData.append('code', data.code);
        formData.append('first_name', data.first_name);
        formData.append('last_name', data.last_name);
        formData.append('email', data.email);
        formData.append('phone', data.phone);
        formData.append('group', data.group);
        formData.append('notes', data.notes);
        if (data.photo) {
            formData.append('photo', data.photo);
        }

        post(id_cards.store(), {
            data: formData,
            preserveScroll: true,
        } as any);
    };

    return (
        <>
            <Head title="Create ID Card" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="max-w-4xl">
                    <Heading title="Create New ID Card" description="Fill in the details to generate a new ID card" />

                    <form onSubmit={submit} className="mt-8 space-y-6">
                        {/* Code Input */}
                        <div className="space-y-2">
                            <Label htmlFor="code">ID Code *</Label>
                            <Input
                                id="code"
                                type="text"
                                placeholder="e.g., 1234-123456-123"
                                value={data.code}
                                onChange={(e) => setData('code', e.target.value)}
                                disabled={processing}
                                className="font-mono"
                            />
                            <InputError message={errors.code} />
                            <p className="text-xs text-muted-foreground">The code will be used to generate the barcode</p>
                        </div>

                        {/* Name Fields */}
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="first_name">First Name *</Label>
                                <Input
                                    id="first_name"
                                    type="text"
                                    value={data.first_name}
                                    onChange={(e) => setData('first_name', e.target.value)}
                                    disabled={processing}
                                />
                                <InputError message={errors.first_name} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="last_name">Last Name / Family Name *</Label>
                                <Input
                                    id="last_name"
                                    type="text"
                                    value={data.last_name}
                                    onChange={(e) => setData('last_name', e.target.value)}
                                    disabled={processing}
                                />
                                <InputError message={errors.last_name} />
                            </div>
                        </div>

                        {/* Contact Information */}
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email *</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    disabled={processing}
                                />
                                <InputError message={errors.email} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    value={data.phone}
                                    onChange={(e) => setData('phone', e.target.value)}
                                    disabled={processing}
                                />
                                <InputError message={errors.phone} />
                            </div>
                        </div>

                        {/* Group */}
                        <div className="space-y-2">
                            <Label htmlFor="group">Group / Category *</Label>
                            <Input
                                id="group"
                                type="text"
                                value={data.group}
                                onChange={(e) => setData('group', e.target.value)}
                                disabled={processing}
                            />
                            <InputError message={errors.group} />
                        </div>

                        {/* Photo Upload */}
                        <div className="space-y-2">
                            <Label>Photo</Label>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handlePhotoChange}
                                        disabled={processing}
                                        className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-foreground hover:file:bg-primary/90"
                                    />
                                    <InputError message={errors.photo} />
                                </div>
                                {photoPreview && (
                                    <div className="flex items-center gap-2">
                                        <img
                                            src={photoPreview}
                                            alt="Preview"
                                            className="h-24 w-24 rounded-lg border border-border object-cover"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea
                                id="notes"
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                                disabled={processing}
                                placeholder="Additional information or remarks..."
                            />
                            <InputError message={errors.notes} />
                        </div>

                        {/* Submit Button */}
                        <div className="flex gap-2">
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Creating...' : 'Create ID Card'}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => window.history.back()}
                                disabled={processing}
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}

Create.layout = {
    breadcrumbs: [
        {
            title: 'ID Cards',
            href: id_cards.index(),
        },
        {
            title: 'Create',
        },
    ],
};
