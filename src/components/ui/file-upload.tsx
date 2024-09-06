import { cn } from "@/lib/utils";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { IconUpload } from "@tabler/icons-react";
import { useDropzone } from "react-dropzone";
import { Button, buttonVariants } from "./button";
import { Badge } from "./badge";
import { toast } from "sonner";
import { Skeleton } from "./skeleton";
import { AlertCircle, Check, CheckCircle, Loader2, SearchCode } from "lucide-react";

const mainVariant = {
    initial: {
        x: 0,
        y: 0,
    },
    animate: {
        x: 0,
        y: 0,
        opacity: 0.9,
    },
};

const secondaryVariant = {
    initial: {
        opacity: 0,
    },
    animate: {
        opacity: 1,
    },
};

export const FileUpload = ({
    value,
    onValueChange,
    status
}: {
    value: File[],
    onValueChange: React.Dispatch<React.SetStateAction<File[]>>,
    status: "idle" | "processing" | "passed" | "failed"
}) => {

    const handleClick = () => {
        inputRef.current?.click();
    };

    const { getRootProps, acceptedFiles, inputRef } = useDropzone({
        multiple: false,
        maxFiles: 1,
        accept: {
            'application/json': ['.json']
        },
        onDrop: (acceptedFiles) => {
            onValueChange(acceptedFiles)
        },
        onDropRejected: (error) => {
            toast.error(error[0].errors[0].message)
        },
    });

    const file = value?.[0] ?? null

    return (
        <div className="w-[36rem] mx-auto">
            <div className="w-full" {...getRootProps()}>
                <p className="font-mono opacity-50 mb-2 text-xs"><span className="dark:opacity-50">Drag and drop here to import an existing Flowcala</span> JSON <span className="dark:opacity-50">file.</span></p>
                <motion.div
                    className={cn(
                        "group/file block cursor-pointer w-full relative"
                    )}
                >
                    <input
                        ref={inputRef}
                        id="file-upload-handle"
                        type="file"
                        className="hidden"
                    />
                    <div className="flex flex-col items-center justify-center">
                        <div className="relative w-[36rem] mx-auto">
                            <motion.div
                                key={`file-${file?.name ?? 'placeholder'}`}
                                className={cn(
                                    "relative overflow-hidden z-40 hover:border-primary min-h-[92px] bg-background border flex flex-col items-start justify-start p-4 w-full mx-auto rounded-md",
                                )}
                            >
                                <div className="flex justify-between w-full items-center gap-4">
                                    {file ? (
                                        <React.Fragment>
                                            <motion.p
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                layout
                                                className="text-base text-foreground truncate max-w-xs underline underline-offset-2"
                                            >
                                                {file.name}
                                            </motion.p>
                                            <motion.p
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                layout
                                                className="rounded-lg font-medium tabular-nums text-muted-foreground px-2 py-1 w-fit flex-shrink-0 text-sm shadow-input"
                                            >
                                                {(file.size / 1024).toFixed(2)} KB
                                            </motion.p>
                                        </React.Fragment>
                                    ) : (
                                        <React.Fragment>
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                layout
                                            >
                                                <Skeleton className="animate-none h-5 w-48" />
                                            </motion.div>
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                layout
                                            >
                                                <Skeleton className="animate-none h-5 w-12" />
                                            </motion.div>
                                        </React.Fragment>
                                    )}
                                </div>

                                <div className="flex text-sm md:flex-row flex-col items-start md:items-center w-full mt-2 justify-between ">
                                    {file ? (
                                        <React.Fragment>
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                layout
                                            >
                                                {status === "idle" || status === "processing" && <Skeleton className="h-[22px] w-32" />}
                                                {status === "failed" && <Badge variant="destructive" className="shadow-none">Invalid schema <AlertCircle className="ml-2 h-2.5 w-2.5" /></Badge>}
                                                {status === "passed" && <Badge variant="success" className="shadow-none">Schema verified <CheckCircle className="ml-2 h-2.5 w-2.5" /></Badge>}
                                            </motion.div>

                                            <motion.p
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                layout
                                                className="text-muted-foreground"
                                            >
                                                modified{" "}
                                                {new Date(file.lastModified).toLocaleDateString()}
                                            </motion.p>
                                        </React.Fragment>
                                    ) : (
                                        <React.Fragment>
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                layout
                                            >
                                                <Skeleton className="animate-none h-4 w-20" />
                                            </motion.div>

                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                layout
                                            >
                                                <Skeleton className="animate-none h-[15px] w-24" />
                                            </motion.div>
                                        </React.Fragment>
                                    )}
                                </div>
                                {!file && (
                                    <div className="absolute inset-0 rounded-md bg-backgroud/50 backdrop-blur-sm flex items-center justify-center">
                                        <Button variant="secondary">Import</Button>
                                    </div>
                                )}
                                {status === "processing" && (
                                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center rounded-md justify-center">
                                        <Loader2 className="h-4 w-4 animate-spin opacity-50" />
                                    </div>
                                )}
                            </motion.div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};