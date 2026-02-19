'use client';

import type React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { destroy, result, status } from '@/routes/layanan';
import { BreadcrumbItem, Layanan, SharedData } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { ArrowLeft, FileText, Save, Upload, X } from 'lucide-react';
import { useEffect, useState } from 'react';

type Props = { service: Layanan };

export default function DetailLayananPage({ service }: Props) {
    const { flash } = usePage<SharedData>().props;
    const { toast } = useToast();

    // const [status, setStatus] = useState(service.status);
    const [isSaving, setIsSaving] = useState(false);

    // prepare server urls for existing result documents
    const serverResultUrls: Array<string | null> = Array.isArray(
        service.result_document,
    )
        ? service.result_document.map((p) => `/storage/${p}`)
        : service.result_document
          ? [`/storage/${service.result_document}`]
          : [];

    const [resultFiles, setResultFiles] = useState<Array<File | null>>(
        serverResultUrls.length > 0
            ? new Array(serverResultUrls.length).fill(null)
            : [null],
    );
    const [resultPreviews, setResultPreviews] = useState<Array<string | null>>(
        serverResultUrls.length > 0 ? serverResultUrls : [null],
    );

    const [selectedUserPreview, setSelectedUserPreview] = useState<
        string | null
    >(null);

    const handleStatusChange = (kodeLayanan: string, newStatus: string) => {
        router.put(
            status.url(kodeLayanan),
            { status: newStatus },
            {
                onSuccess: () => {
                    //
                },
                onError: (errors) => {
                    console.error('Error updating status:', errors);
                },
            },
        );
    };

    const handleSave = () => {
        const hasFile = resultFiles.some((f) => f);
        if (!hasFile) return;

        setIsSaving(true);

        const fd = new FormData();
        resultFiles.forEach((f) => {
            if (f) fd.append('fileResultService[]', f);
        });

        router.post(result.url(service.kode_layanan), fd, {
            forceFormData: true,
            onSuccess: () => {
                setIsSaving(false);
            },
            onError: () => {
                setIsSaving(false);
            },
        });
    };

    const handleResultFileChange = (
        index: number,
        e: React.ChangeEvent<HTMLInputElement>,
    ) => {
        if (!e.target.files || !e.target.files[0]) return;
        const file = e.target.files[0];
        if (file.type !== 'application/pdf') return;

        const url = URL.createObjectURL(file);

        setResultFiles((prev) => {
            const copy = [...prev];
            copy[index] = file;
            return copy;
        });

        setResultPreviews((prev) => {
            const copy = [...prev];
            copy[index] = url;
            return copy;
        });
    };

    const addResultFile = () => {
        if (resultFiles.length >= 3) return;
        setResultFiles((prev) => [...prev, null]);
        setResultPreviews((prev) => [...prev, null]);
    };

    const removeFiles = (idx: number) => {
        resultPreviews.forEach((p) => p && URL.revokeObjectURL(p));
        setResultFiles((prev) => {
            const copy = [...prev];
            copy.splice(idx, 1);
            return copy;
        });

        setResultPreviews((prev) => {
            const copy = [...prev];
            copy.splice(idx, 1);
            return copy;
        });
    };

    const removeResultFile = (index: number) => {
        setResultPreviews((prev) => {
            const copy = [...prev];
            if (copy[index]) URL.revokeObjectURL(copy[index]!);
            copy.splice(index, 1);
            return copy;
        });
        setResultFiles((prev) => {
            const copy = [...prev];
            copy.splice(index, 1);
            return copy;
        });
    };

    const handleDelete = (kodeLayanan: string) => {
        router.delete(destroy.url(kodeLayanan), {
            onError: (errors) => {
                console.error('Error updating status:', errors);
            },
        });
    };

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: service.user?.name,
            href: dashboard().url,
        },
    ];

    useEffect(() => {
        if (flash.success) {
            toast({ title: 'Berhasil', description: flash.success });
        }
    }, [flash.success]);

    useEffect(() => {
        return () => {
            resultPreviews.forEach((p) => {
                if (p && p.startsWith('blob:')) URL.revokeObjectURL(p);
            });
        };
    }, [resultPreviews]);

    useEffect(() => {
        if (flash.success) {
            setResultFiles(
                serverResultUrls.length > 0
                    ? new Array(serverResultUrls.length).fill(null)
                    : [null],
            );
            setResultPreviews(
                serverResultUrls.length > 0 ? serverResultUrls : [null],
            );
        }
    }, [flash.success]);

    const disableSave = isSaving || !resultFiles.some((f) => f);

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'Proses':
                return 'bg-blue-100 text-blue-800 border-blue-300';
            case 'Selesai':
                return 'bg-green-100 text-green-800 border-green-300';
            case 'Menunggu':
                return 'bg-purple-100 text-purple-800 border-purple-300';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={service.user?.name} />
            <div className="m-3 flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl bg-gradient-to-tr from-white via-background to-blue-100 p-4">
                <div className="max-w-7xl flex-1 overflow-auto">
                    <div className="mb-6 flex items-center gap-4">
                        <Button
                            onClick={() => window.history.back()}
                            variant="ghost"
                            size="icon"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">
                                Detail Layanan #{service.kode_layanan}
                            </h1>
                            <p className="text-muted-foreground">
                                Kelola permintaan layanan administrasi
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                        <div className="space-y-6 lg:col-span-2">
                            <Card className="gap-4">
                                <CardHeader>
                                    <CardTitle className="text-xl font-bold">
                                        Informasi Pemohon
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label className="text-sm font-medium text-muted-foreground">
                                                Nama Lengkap
                                            </Label>
                                            <p className="text-base font-medium">
                                                {service.user.name}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">
                                                Jabatan
                                            </label>
                                            <p className="text-base font-medium">
                                                {service.user.jabatan}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">
                                                Tanggal Pengajuan
                                            </label>
                                            <p className="text-base font-medium">
                                                {new Date(
                                                    service.created_at,
                                                ).toLocaleDateString('id-ID', {
                                                    weekday: 'long',
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                })}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">
                                                Kategori
                                            </label>
                                            <p className="text-base font-medium">
                                                {service.kategori.nama_kategori}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="gap-4">
                                <CardHeader>
                                    <CardTitle className="text-xl font-bold">
                                        Detail Permintaan
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-muted-foreground">
                                            Deskripsi Layanan
                                        </label>
                                        <div className="rounded-md border border-border bg-muted/30 p-4 text-sm leading-relaxed">
                                            {service.detail}
                                        </div>
                                    </div>

                                    {(() => {
                                        const docs = Array.isArray(
                                            service.supporting_documents,
                                        )
                                            ? service.supporting_documents
                                            : service.supporting_documents
                                              ? [service.supporting_documents]
                                              : [];

                                        if (docs.length === 0) return null;

                                        return (
                                            <div>
                                                <label className="mb-2 block text-sm font-medium text-muted-foreground">
                                                    Dokumen Pendukung (User)
                                                </label>
                                                <div className="space-y-4">
                                                    {docs.map((path, i) => (
                                                        <div
                                                            key={i}
                                                            className="group flex cursor-pointer items-center gap-3 rounded-md border border-border bg-card p-3 transition-colors hover:bg-muted/50"
                                                        >
                                                            <div className="rounded bg-red-100 p-2 text-red-600">
                                                                <FileText className="h-5 w-5" />
                                                            </div>
                                                            <div className="max-w-full flex-1 overflow-hidden">
                                                                <p className="text-sm font-medium transition-colors group-hover:text-primary">
                                                                    {path
                                                                        .split(
                                                                            '/',
                                                                        )
                                                                        .pop()}
                                                                </p>
                                                            </div>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-primary"
                                                                onClick={() =>
                                                                    setSelectedUserPreview(
                                                                        selectedUserPreview ===
                                                                            `/storage/${path}`
                                                                            ? null
                                                                            : `/storage/${path}`,
                                                                    )
                                                                }
                                                            >
                                                                {selectedUserPreview ===
                                                                `/storage/${path}`
                                                                    ? 'Tutup Preview'
                                                                    : 'Lihat Preview'}
                                                            </Button>
                                                        </div>
                                                    ))}

                                                    {selectedUserPreview && (
                                                        <div className="flex aspect-[16/9] w-full items-center justify-center overflow-hidden rounded-md border bg-muted">
                                                            <iframe
                                                                src={
                                                                    selectedUserPreview
                                                                }
                                                                className="h-full w-full"
                                                                title="Result Preview"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </CardContent>
                            </Card>
                        </div>

                        <div className="space-y-6">
                            <Card className="min-h-full">
                                <CardHeader>
                                    <CardTitle>Tindak Lanjut</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">
                                            Status Layanan
                                        </Label>

                                        <select
                                            value={service.status}
                                            onChange={(e) =>
                                                handleStatusChange(
                                                    service.kode_layanan,
                                                    e.target.value,
                                                )
                                            }
                                            className={`mt-1.5 w-full cursor-pointer rounded-md border border-input px-3 py-1.5 font-medium text-foreground transition-colors ${getStatusStyles(service.status)}`}
                                        >
                                            <option value="Proses">
                                                Proses
                                            </option>
                                            <option value="Selesai">
                                                Selesai
                                            </option>
                                            <option value="Menunggu">
                                                Menunggu
                                            </option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">
                                            Upload Dokumen Hasil
                                        </Label>

                                        <div className="mt-1.5 space-y-4">
                                            {resultFiles.map((_, idx) => (
                                                <div key={idx}>
                                                    {!resultPreviews[idx] ? (
                                                        <div className="relative flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-input p-4 text-center hover:bg-muted/50">
                                                            <input
                                                                type="file"
                                                                accept=".pdf"
                                                                onChange={(e) =>
                                                                    handleResultFileChange(
                                                                        idx,
                                                                        e,
                                                                    )
                                                                }
                                                                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                                                            />
                                                            <Upload className="mb-2 h-6 w-6 text-muted-foreground" />
                                                            <p className="text-xs font-medium text-foreground">
                                                                Upload Hasil
                                                                (PDF)
                                                            </p>

                                                            <div
                                                                className="z-50 mt-2.5 rounded bg-gray-200 px-1 py-0.5 text-gray-600 transition-opacity hover:bg-gray-300"
                                                                onClick={() =>
                                                                    removeFiles(
                                                                        idx,
                                                                    )
                                                                }
                                                            >
                                                                <X className="h-5 w-5 text-red-500" />
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            <div className="flex items-center justify-between rounded-md border bg-muted/20 p-2">
                                                                <div className="flex items-center gap-2">
                                                                    <FileText className="h-4 w-4 text-red-600" />
                                                                    <span className="text-xs font-medium">
                                                                        Dokumen
                                                                        Hasil
                                                                    </span>
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    {resultPreviews[
                                                                        idx
                                                                    ] && (
                                                                        <a
                                                                            href={
                                                                                resultPreviews[
                                                                                    idx
                                                                                ] ??
                                                                                undefined
                                                                            }
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            download={
                                                                                resultPreviews[
                                                                                    idx
                                                                                ] &&
                                                                                resultPreviews[
                                                                                    idx
                                                                                ].startsWith(
                                                                                    'blob:',
                                                                                )
                                                                                    ? (resultFiles[
                                                                                          idx
                                                                                      ]
                                                                                          ?.name ??
                                                                                      `result-${idx + 1}.pdf`)
                                                                                    : resultPreviews[
                                                                                            idx
                                                                                        ]
                                                                                      ? resultPreviews[
                                                                                            idx
                                                                                        ]
                                                                                            .split(
                                                                                                '/',
                                                                                            )
                                                                                            .pop()
                                                                                      : undefined
                                                                            }
                                                                        >
                                                                            <Badge
                                                                                variant="secondary"
                                                                                className="h-6"
                                                                            >
                                                                                Download
                                                                            </Badge>
                                                                        </a>
                                                                    )}
                                                                    {service.status !=
                                                                        'Selesai' && (
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-6 w-6"
                                                                            onClick={() =>
                                                                                removeResultFile(
                                                                                    idx,
                                                                                )
                                                                            }
                                                                        >
                                                                            <X className="h-3 w-3" />
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <div className="aspect-video w-full overflow-hidden rounded-md border bg-muted">
                                                                <iframe
                                                                    src={
                                                                        resultPreviews[
                                                                            idx
                                                                        ] ??
                                                                        undefined
                                                                    }
                                                                    className="h-full w-full"
                                                                    title={`Result Preview ${idx}`}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}

                                            {service.status != 'Selesai' && (
                                                <div className="flex justify-center">
                                                    <div className="text-center">
                                                        <Badge
                                                            onClick={
                                                                addResultFile
                                                            }
                                                            className={
                                                                resultFiles.length >=
                                                                3
                                                                    ? `mt-2 cursor-pointer bg-gray-300 text-gray-600`
                                                                    : `mt-2 cursor-pointer bg-indigo-900 text-white hover:bg-indigo-800`
                                                            }
                                                        >
                                                            Tambah file
                                                        </Badge>
                                                        <p className="mt-1 text-xs text-muted-foreground">
                                                            Maksimal 3 file
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <Button
                                        className="w-full"
                                        onClick={handleSave}
                                        disabled={disableSave}
                                    >
                                        {isSaving ? (
                                            'Menyimpan...'
                                        ) : (
                                            <>
                                                <Save className="mr-2 h-4 w-4" />{' '}
                                                Simpan Perubahan
                                            </>
                                        )}
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* <Card className="border-red-200 bg-red-50/30">
                                <CardContent className="pt-6">
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button
                                                variant="destructive"
                                                className="w-full"
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />{' '}
                                                Hapus Layanan
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>
                                                    Hapus Layanan
                                                </AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Apakah Anda yakin ingin
                                                    menghapus layanan ini?
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <div className="mt-4 flex justify-end gap-3">
                                                <AlertDialogCancel>
                                                    Batal
                                                </AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={() =>
                                                        handleDelete(
                                                            service.kode_layanan,
                                                        )
                                                    }
                                                    className="bg-red-600 hover:bg-red-700"
                                                >
                                                    Ya, Hapus
                                                </AlertDialogAction>
                                            </div>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </CardContent>
                            </Card> */}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
