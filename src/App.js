import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef } from 'react';
import Papa from 'papaparse';
import { parse as parseOfx } from 'ofx-js';
import * as XLSX from 'xlsx';
import ColumnMapper from './component/ColumnMapper';
const App = () => {
    const [data, setData] = useState([]);
    const [mappedData, setMappedData] = useState([]);
    const [fileName, setFileName] = useState('');
    const [error, setError] = useState('');
    const mappedDataRef = useRef(null); // Référence pour le tableau des données mappées
    // Fonction de reset
    const resetFields = () => {
        setData([]);
        setMappedData([]);
        setFileName('');
        setError('');
    };
    // Gestion de l'import de fichier
    const handleFileUpload = (event) => {
        const file = event.target.files?.[0];
        if (file) {
            resetFields(); // Réinitialise les champs
            setFileName(file.name);
            setError('');
            const reader = new FileReader();
            reader.onload = async (e) => {
                const text = e.target?.result;
                try {
                    let parsedData = [];
                    if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
                        parsedData = parseCsvFile(text);
                    }
                    else if (file.name.endsWith('.ofx')) {
                        parsedData = await parseOfxFile(text);
                    }
                    else if (file.type === 'application/json' || file.name.endsWith('.json')) {
                        parsedData = parseJsonFile(text);
                    }
                    else if (file.type === 'text/xml' || file.name.endsWith('.xml')) {
                        parsedData = parseXmlFile(text);
                    }
                    else if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                        file.name.endsWith('.xlsx')) {
                        parsedData = await parseExcelFile(text);
                    }
                    else {
                        throw new Error('Unsupported file type');
                    }
                    if (parsedData.length === 0) {
                        throw new Error('No data found in the file');
                    }
                    setData(parsedData);
                }
                catch (err) {
                    setError(err instanceof Error ? err.message : 'Failed to parse file');
                    setData([]);
                }
            };
            if (file.type.includes('text') || file.name.endsWith('.json') || file.name.endsWith('.xml')) {
                reader.readAsText(file);
            }
            else {
                reader.readAsArrayBuffer(file);
            }
        }
    };
    // Fonction pour valider le mapping
    const handleMappingComplete = (mapping) => {
        console.log('Mapping configuré :', mapping);
        const newData = data.map((item) => {
            const mappedRow = {};
            for (const customColumn in mapping) {
                mappedRow[customColumn] = item[mapping[customColumn]] || '';
            }
            return mappedRow;
        });
        setMappedData(newData);
        // Scroll vers le tableau des données mappées
        if (mappedDataRef.current) {
            mappedDataRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };
    // Parser pour les fichiers CSV
    const parseCsvFile = (text) => {
        const result = Papa.parse(text, {
            header: true,
            skipEmptyLines: true,
            delimiter: ',',
            quoteChar: '"',
            dynamicTyping: true,
        });
        if (result.errors.length > 0) {
            console.error('CSV parsing errors:', result.errors);
            throw new Error('Invalid CSV format');
        }
        return result.data;
    };
    // Parser pour les fichiers OFX
    const parseOfxFile = async (text) => {
        const ofxData = await parseOfx(text);
        if (!ofxData.OFX?.BANKMSGSRSV1?.STMTTRNRS?.STMTRS?.BANKTRANLIST?.STMTTRN) {
            throw new Error('Invalid OFX format');
        }
        return ofxData.OFX.BANKMSGSRSV1.STMTTRNRS.STMTRS.BANKTRANLIST.STMTTRN;
    };
    // Parser pour les fichiers JSON
    const parseJsonFile = (text) => {
        try {
            const jsonData = JSON.parse(text);
            if (!Array.isArray(jsonData)) {
                throw new Error('JSON file must contain an array of objects');
            }
            return jsonData;
        }
        catch (err) {
            throw new Error('Invalid JSON format');
        }
    };
    // Parser pour les fichiers XML
    const parseXmlFile = (text) => {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, 'text/xml');
        const rows = xmlDoc.getElementsByTagName('row');
        if (rows.length === 0) {
            throw new Error('Invalid XML format');
        }
        return Array.from(rows).map((row) => {
            const obj = {};
            Array.from(row.children).forEach((child) => {
                obj[child.tagName] = child.textContent || '';
            });
            return obj;
        });
    };
    // Parser pour les fichiers Excel
    const parseExcelFile = async (buffer) => {
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        return jsonData;
    };
    // Export des données en CSV
    const exportToCSV = () => {
        const csv = Papa.unparse(mappedData);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'mapped_data.csv';
        a.click();
        URL.revokeObjectURL(url);
    };
    return (_jsxs("div", { className: "p-4", children: [_jsx("h1", { className: "text-3xl font-bold text-center text-blue-500", children: "CSV Mapper" }), _jsxs("div", { className: "flex flex-col gap-4 mb-4", children: [_jsxs("label", { className: "bg-purple-500 text-white px-4 py-2 rounded text-center cursor-pointer", children: ["Import File", _jsx("input", { type: "file", accept: ".csv,.ofx,.json,.xml,.xlsx", onChange: handleFileUpload, className: "hidden" })] }), fileName && _jsxs("p", { className: "text-center", children: ["File selected: ", fileName] }), error && _jsx("p", { className: "text-red-500 text-center", children: error })] }), data.length > 0 && (_jsx(ColumnMapper, { csvColumns: Object.keys(data[0]), onMappingComplete: handleMappingComplete, resetTrigger: data.length > 0 && mappedData.length === 0 })), data.length > 0 && (_jsxs("div", { className: "mt-4", children: [_jsx("h2", { className: "text-xl font-bold mb-2", children: "Aper\u00E7u des 10 premi\u00E8res lignes (Donn\u00E9es brutes)" }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full bg-white border border-gray-300", children: [_jsx("thead", { children: _jsx("tr", { className: "bg-gray-100", children: Object.keys(data[0]).map((key) => (_jsx("th", { className: "p-2 border border-gray-300", children: key }, key))) }) }), _jsx("tbody", { children: data.slice(0, 10).map((row, index) => (_jsx("tr", { className: "hover:bg-gray-50", children: Object.values(row).map((value, i) => (_jsx("td", { className: "p-2 border border-gray-300", children: value }, i))) }, index))) })] }) })] })), _jsx("div", { className: "flex gap-4 my-4", children: _jsx("button", { onClick: exportToCSV, disabled: mappedData.length === 0, className: "bg-green-500 text-white px-4 py-2 rounded disabled:bg-green-300", children: "Export to CSV" }) }), mappedData.length > 0 && (_jsxs("div", { ref: mappedDataRef, children: [_jsx("h2", { className: "text-xl font-bold mb-2", children: "Aper\u00E7u des 10 premi\u00E8res lignes (Donn\u00E9es mapp\u00E9es)" }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full bg-white border border-gray-300", children: [_jsx("thead", { children: _jsx("tr", { className: "bg-gray-100", children: Object.keys(mappedData[0]).map((column) => (_jsx("th", { className: "p-2 border border-gray-300", children: column }, column))) }) }), _jsx("tbody", { children: mappedData.slice(0, 10).map((row, index) => (_jsx("tr", { className: "hover:bg-gray-50", children: Object.values(row).map((value, i) => (_jsx("td", { className: "p-2 border border-gray-300", children: value }, i))) }, index))) })] }) })] }))] }));
};
export default App;
