import React, { useState, useRef } from 'react';
import FileUploader from './components/FileUpLoader';
import DataPreview from './components/DataPreview';
import ColumnMapper from './components/ColumnMapper';
import MappedDataPreview from './components/MappedDataPreview';
import { parseCsvFile, parseOfxFile, parseJsonFile, parseXmlFile, parseExcelFile } from './utils/Parser';


const App: React.FC = () => {
    const [data, setData] = useState<Record<string, string | undefined>[]>([]);
    const [mappedData, setMappedData] = useState<Record<string, string>[]>([]);
    const [fileName, setFileName] = useState<string>('');
    const [error, setError] = useState<string>('');
    const mappedDataRef = useRef<HTMLDivElement>(null);

    const handleFileUpload = async (file: File) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const result = e.target?.result;
                if (!result) throw new Error('Aucun contenu trouvé dans le fichier.');

                let parsedData: Record<string, string | undefined>[] = [];

                // Gérer les fichiers CSV
                if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
                    parsedData = parseCsvFile(result as string);
                }
                // Gérer les fichiers OFX
                else if (file.name.endsWith('.ofx')) {
                    parsedData = await parseOfxFile(result as string);
                }
                // Gérer les fichiers JSON
                else if (file.type === 'application/json' || file.name.endsWith('.json')) {
                    parsedData = parseJsonFile(result as string);
                }
                // Gérer les fichiers XML
                else if (file.type === 'text/xml' || file.name.endsWith('.xml')) {
                    parsedData = parseXmlFile(result as string);
                }
                // Gérer les fichiers Excel
                else if (
                    file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                    file.name.endsWith('.xlsx')
                ) {
                    parsedData = await parseExcelFile(result as ArrayBuffer);
                } else {
                    throw new Error('Format de fichier non supporté');
                }

                // Mettre à jour l'état avec les données parsées
                setData(parsedData);
                setFileName(file.name);
                setError('');
            } catch (err) {
                console.error('Erreur lors de l\'import du fichier :', err);
                setError(err instanceof Error ? err.message : 'Erreur lors de l\'import du fichier');
            }
        };

        // Lire le fichier en fonction de son format
        if (file.name.endsWith('.ofx') || file.type.includes('text')) {
            reader.readAsText(file, 'UTF-8');
        } else {
            reader.readAsArrayBuffer(file);
        }
    };

    const handleMappingComplete = (mapping: Record<string, string>) => {
        const newData = data.map((item) => {
            const mappedRow: Record<string, string> = {};
            for (const customColumn in mapping) {
                mappedRow[customColumn] = item[mapping[customColumn]] || '';
            }
            return mappedRow;
        });
        setMappedData(newData);

        if (mappedDataRef.current) {
            mappedDataRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="p-4">
            <h1 className="text-3xl font-bold text-center text-blue-500">CSV Mapper</h1>
            <FileUploader onFileUpload={handleFileUpload} />
            {fileName && <p className="text-center">File selected: {fileName}</p>}
            {error && <p className="text-red-500 text-center">{error}</p>}

            {data.length > 0 && (
                <>
                    <DataPreview data={data} title="Aperçu des 5 premières lignes (Données brutes)" />
                    <ColumnMapper
                        csvColumns={Object.keys(data[0])}
                        onMappingComplete={handleMappingComplete}
                        resetTrigger={data.length > 0 && mappedData.length === 0}
                    />
                </>
            )}

            {mappedData.length > 0 && (
                <div ref={mappedDataRef}>
                    <MappedDataPreview mappedData={mappedData} />
                </div>
            )}
        </div>
    );
};

export default App;
