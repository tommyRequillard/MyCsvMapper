import React, { useState } from 'react';

interface ColumnMapperProps {
    csvColumns: string[];
    onMappingComplete: (mapping: Record<string, string>) => void;
    resetTrigger: boolean; // Nouvelle prop pour déclencher une réinitialisation
}

const ColumnMapper: React.FC<ColumnMapperProps> = ({ csvColumns, onMappingComplete, resetTrigger }) => {
    const [customColumns, setCustomColumns] = useState<string[]>([]);
    const [mapping, setMapping] = useState<Record<string, string>>({});

    // Réinitialise les colonnes personnalisées et le mapping lorsque resetTrigger change
    React.useEffect(() => {
        if (resetTrigger) {
            setCustomColumns([]);
            setMapping({});
        }
    }, [resetTrigger]);

    // Ajoute une nouvelle colonne personnalisée
    const addCustomColumn = () => {
        setCustomColumns((prev) => [...prev, ``]);
    };

    // Modifie le nom d'une colonne personnalisée
    const updateCustomColumnName = (index: number, newName: string) => {
        setCustomColumns((prev) => {
            const updated = [...prev];
            updated[index] = newName;
            return updated;
        });
    };

    // Mappe une colonne personnalisée à une colonne du fichier CSV
    const handleMappingChange = (customColumn: string, csvColumn: string) => {
        setMapping((prev) => ({ ...prev, [customColumn]: csvColumn }));
    };

    // Valide et retourne le mapping
    const validateMapping = () => {
        // Vérifie que toutes les colonnes personnalisées ont été mappées
        const missingColumns = customColumns.filter((col) => !mapping[col]);

        if (missingColumns.length > 0) {
            alert(`Veuillez mapper les colonnes suivantes : ${missingColumns.join(', ')}`);
            return;
        }

        onMappingComplete(mapping);
    };

    return (
        <div className="bg-gray-50 p-4 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">Configuration des colonnes</h2>
            <div className="space-y-3">
                {customColumns.map((customColumn, index) => (
                    <div key={index} className="flex items-center space-x-4">
                        {/* Champ texte pour renommer la colonne personnalisée */}
                        <input
                            type="text"
                            value={customColumn}
                            onChange={(e) => updateCustomColumnName(index, e.target.value)}
                            className="w-32 p-2 border border-gray-300 rounded-md"
                        />
                        {/* Sélecteur pour mapper la colonne personnalisée */}
                        <select
                            value={mapping[customColumn] || ''}
                            onChange={(e) => handleMappingChange(customColumn, e.target.value)}
                            className="flex-1 p-2 border border-gray-300 rounded-md"
                        >
                            <option value="">Sélectionnez une colonne</option>
                            {csvColumns.map((csvColumn) => (
                                <option key={csvColumn} value={csvColumn}>
                                    {csvColumn}
                                </option>
                            ))}
                        </select>
                    </div>
                ))}
            </div>
            {/* Bouton pour ajouter une nouvelle colonne personnalisée */}
            <button
                onClick={addCustomColumn}
                className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
            >
                Ajouter une colonne
            </button>
            {/* Bouton pour valider le mapping */}
            <button
                onClick={validateMapping}
                className="mt-4 bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors ml-4"
            >
                Valider le mapping
            </button>
        </div>
    );
};

export default ColumnMapper;
