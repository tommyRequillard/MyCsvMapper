import React from 'react';

interface DataPreviewProps {
    data: Record<string, string | undefined>[];
    title: string;
}

const DataPreview: React.FC<DataPreviewProps> = ({ data, title }) => {
    if (data.length === 0) return null;

    return (
        <div className="mt-4">
            <h2 className="text-xl font-bold mb-2">{title}</h2>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-300">
                    <thead>
                        <tr className="bg-gray-100">
                            {Object.keys(data[0]).map((key) => (
                                <th key={key} className="p-2 border border-gray-300">
                                    {key}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.slice(0, 5).map((row, index) => (
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
        </div>
    );
};

export default DataPreview;
