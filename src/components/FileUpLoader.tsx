import React, { ChangeEvent } from 'react';

interface FileUploaderProps {
    onFileUpload: (file: File) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFileUpload }) => {
    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            onFileUpload(file);
        }
    };

    return (
        <div className="flex flex-col gap-4 mb-4">
            <label className="bg-purple-500 text-white px-4 py-2 rounded text-center cursor-pointer">
                Import File
                <input
                    type="file"
                    accept=".csv,.ofx,.json,.xml,.xlsx"
                    onChange={handleFileChange}
                    className="hidden"
                />
            </label>
        </div>
    );
};

export default FileUploader;
