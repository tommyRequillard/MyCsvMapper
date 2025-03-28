export const convertToOFX = (mappedData: Record<string, string>[]): string => {
    // En-tête OFX
    const ofxHeader = `OFXHEADER:100
DATA:OFXSGML
VERSION:102
SECURITY:NONE
ENCODING:USASCII
CHARSET:1252
COMPRESSION:NONE
OLDFILEUID:NONE
NEWFILEUID:NONE

<OFX>
    <BANKMSGSRSV1>
        <STMTTRNRS>
            <STMTRS>`;

    // Corps OFX (transactions)
    const ofxBody = mappedData
        .map((transaction) => {
            return `
                <STMTTRN>
                    <TRNTYPE>${transaction.TRNTYPE || 'CREDIT'}</TRNTYPE>
                    <DTPOSTED>${transaction.DTPOSTED || new Date().toISOString().split('T')[0].replace(/-/g, '')}</DTPOSTED>
                    <TRNAMT>${transaction.TRNAMT || '0.00'}</TRNAMT>
                    <NAME>${transaction.NAME || 'Unknown'}</NAME>
                </STMTTRN>`;
        })
        .join('');

    // Pied de page OFX
    const ofxFooter = `
            </STMTRS>
        </STMTTRNRS>
    </BANKMSGSRSV1>
</OFX>`;

    // Combiner en un seul fichier OFX
    return ofxHeader + ofxBody + ofxFooter;
};

export const downloadOFX = (mappedData: Record<string, string>[]) => {
    const ofxContent = convertToOFX(mappedData);
    const blob = new Blob([ofxContent], { type: 'text/xml' });
    const url = URL.createObjectURL(blob);

    // Créer un lien de téléchargement
    const link = document.createElement('a');
    link.href = url;
    link.download = 'mapped_data.ofx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};
