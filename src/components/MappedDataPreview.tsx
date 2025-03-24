import React from 'react';
import Papa from 'papaparse';

interface MappedDataPreviewProps {
    mappedData: Record<string, string>[];
}

const MappedDataPreview: React.FC<MappedDataPreviewProps> = ({ mappedData }) => {
    const handleExportToCsv = () => {
        const csv = Papa.unparse(mappedData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'mapped_data.csv';
        link.click();
        URL.revokeObjectURL(link.href);
    };

    if (mappedData.length === 0) return null;

    return (
        <div className="mt-4">
            <h2 className="text-xl font-bold mb-2">Aperçu des 5ère lignes de données Mappées</h2>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-300">
                    <thead>
                        <tr className="bg-gray-100">
                            {Object.keys(mappedData[0]).map((key) => (
                                <th key={key} className="p-2 border border-gray-300">
                                    {key}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {mappedData.slice(0, 5).map((row, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                                {Object.values(row).map((value, i) => (
                                    <td key={i} className="p-2 border border-gray-300">
                                        {value}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <button
                className="bg-green-500 text-white px-4 py-2 rounded mt-4"
                onClick={handleExportToCsv}
            >
                Exporter en CSV
            </button>
        </div>
    );
};

export default MappedDataPreview;
