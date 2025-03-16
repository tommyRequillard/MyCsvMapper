import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from 'react';
const ColumnMapper = ({ csvColumns, onMappingComplete, resetTrigger }) => {
    const [customColumns, setCustomColumns] = useState([]);
    const [mapping, setMapping] = useState({});
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
    const updateCustomColumnName = (index, newName) => {
        setCustomColumns((prev) => {
            const updated = [...prev];
            updated[index] = newName;
            return updated;
        });
    };
    // Mappe une colonne personnalisée à une colonne du fichier CSV
    const handleMappingChange = (customColumn, csvColumn) => {
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
    return (_jsxs("div", { className: "bg-gray-50 p-4 rounded-lg shadow-md", children: [_jsx("h2", { className: "text-xl font-bold mb-4", children: "Configuration des colonnes" }), _jsx("div", { className: "space-y-3", children: customColumns.map((customColumn, index) => (_jsxs("div", { className: "flex items-center space-x-4", children: [_jsx("input", { type: "text", value: customColumn, onChange: (e) => updateCustomColumnName(index, e.target.value), className: "w-32 p-2 border border-gray-300 rounded-md" }), _jsxs("select", { value: mapping[customColumn] || '', onChange: (e) => handleMappingChange(customColumn, e.target.value), className: "flex-1 p-2 border border-gray-300 rounded-md", children: [_jsx("option", { value: "", children: "S\u00E9lectionnez une colonne" }), csvColumns.map((csvColumn) => (_jsx("option", { value: csvColumn, children: csvColumn }, csvColumn)))] })] }, index))) }), _jsx("button", { onClick: addCustomColumn, className: "mt-4 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors", children: "Ajouter une colonne" }), _jsx("button", { onClick: validateMapping, className: "mt-4 bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors ml-4", children: "Valider le mapping" })] }));
};
export default ColumnMapper;
