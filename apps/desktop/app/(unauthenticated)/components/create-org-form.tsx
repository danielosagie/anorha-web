'use client';

import { useOrganizationList } from '@clerk/nextjs';
import { Button } from '@repo/design-system/components/ui/button';
import { Input } from '@repo/design-system/components/ui/input';
import { Label } from '@repo/design-system/components/ui/label';
import { Loader2, Upload } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface CreateOrgFormProps {
    onComplete: () => void;
}

export function CreateOrgForm({ onComplete }: CreateOrgFormProps) {
    const { createOrganization, isLoaded } = useOrganizationList();
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Auto-generate slug from name
    useEffect(() => {
        const generatedSlug = name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric chars with hyphens
            .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
        setSlug(generatedSlug);
    }, [name]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isLoaded || !createOrganization) return;

        if (!name.trim()) {
            toast.error('Please enter an organization name');
            return;
        }

        setIsSubmitting(true);

        try {
            await createOrganization({ name, slug });
            toast.success('Organization created successfully!');
            onComplete();
        } catch (err: any) {
            console.error('Failed to create organization:', err);
            // Clerk errors are usually arrays
            const errorMessage = err.errors?.[0]?.message || err.message || 'Failed to create organization';
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="w-full space-y-6">
            {/* Logo Upload Placeholder */}
            <div className="space-y-2">
                <Label>Logo</Label>
                <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50 text-gray-400">
                        <Upload className="h-6 w-6" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <Button type="button" variant="outline" size="sm" className="w-fit">
                            Upload
                        </Button>
                        <p className="text-xs text-muted-foreground">
                            Recommended size 1:1, up to 10MB.
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="orgName">Name</Label>
                    <Input
                        id="orgName"
                        placeholder="Organization name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={isSubmitting}
                        className="bg-white"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="orgSlug">Slug</Label>
                    <Input
                        id="orgSlug"
                        placeholder="my-org"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        disabled={isSubmitting}
                        className="bg-white font-mono text-sm"
                    />
                </div>
            </div>

            <Button
                type="submit"
                className="w-full bg-[#647653] hover:bg-[#546346] text-white"
                disabled={isSubmitting}
            >
                {isSubmitting ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                    </>
                ) : (
                    'Create organization'
                )}
            </Button>

            <div className="text-center pt-2">
                <p className="text-xs text-muted-foreground">
                    Secured by <span className="font-semibold">Clerk</span>
                </p>
            </div>
        </form>
    );
}
