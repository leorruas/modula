/**
 * Robust CSV Parser
 * Handles:
 * - Quoted values (ignoring delimiters inside)
 * - Auto-detection of delimiters (comma, semicolon)
 * - Mixed types (numbers, strings)
 */

interface ParsedData {
    labels: string[];
    datasets: {
        label: string;
        data: number[];
    }[];
}

export const parseCSV = (content: string): ParsedData => {
    const text = content.trim();
    if (!text) return { labels: [], datasets: [] };

    // 1. Detect Delimiter
    const firstLine = text.split('\n')[0];
    const commaCount = (firstLine.match(/,/g) || []).length;
    const semicolonCount = (firstLine.match(/;/g) || []).length;
    const delimiter = semicolonCount > commaCount ? ';' : ',';

    // 2. Tokenizer (handles quotes)
    const tokenize = (line: string): string[] => {
        const tokens: string[] = [];
        let current = '';
        let insideQuote = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"') {
                if (insideQuote && line[i + 1] === '"') {
                    // Double quote escape: "" becomes "
                    current += '"';
                    i++;
                } else {
                    // Toggle quote state
                    insideQuote = !insideQuote;
                }
            } else if (char === delimiter && !insideQuote) {
                // Found delimiter outside quotes -> push token
                tokens.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        tokens.push(current.trim());
        return tokens;
    };

    // 3. Parse Lines
    const rawLines = text.split(/\r?\n/);
    if (rawLines.length < 2) return { labels: [], datasets: [] };

    // Header
    const headers = tokenize(rawLines[0]).map(h => h.replace(/^"|"$/g, '').trim()); // Remove surrounding quotes from headers

    const labels: string[] = [];
    const datasetsData: number[][] = headers.slice(1).map(() => []);

    for (let i = 1; i < rawLines.length; i++) {
        const line = rawLines[i].trim();
        if (!line) continue;

        const parts = tokenize(line).map(p => p.replace(/^"|"$/g, '')); // Remove surrounding quotes

        // First column is always the label (Category)
        labels.push(parts[0] || `Row ${i}`);

        // Remaining columns are data
        for (let j = 1; j < headers.length; j++) {
            // If parts[j] exists, parse it. If not (jagged row), use 0.
            let rawVal = parts[j] || '0';

            // Handle currency symbols or spaces if reasonable
            // e.g. "R$ 1.200,50" -> would need locale awareness, but for now we look for standard numbers
            // Simple replace of comma to dot if using semicolon delimiter? 
            // Let's stick to standard float parsing for now, stripping non-numeric chars except dot/minus/comma?

            // Basic cleanup: remove symbols like $
            // If delimiter is semicolon, we MIGHT assume comma is decimal separator? 
            // It's safer to try JS Number() first.

            // First try standard parseFloat
            let val = parseFloat(rawVal);

            // If the raw value contains a comma and is NOT a standard number (or if we suspect comma is decimal)
            // AND we didn't just parse a standard float successfully (or if we did, check if comma part was lost)
            // Example: parseFloat("10,50") -> 10. The ,50 is lost.
            // So we should check if comma replacement yields a different valid number.

            if (rawVal.includes(',')) {
                const asDecimal = parseFloat(rawVal.replace(',', '.'));
                if (!isNaN(asDecimal)) {
                    // If the standard parse was partial (e.g. 10 from 10,50) or NaN, prefer the comma-version
                    // If standard parse matched fully (rare if comma present unless it's 1,234.00 style which parseFloat handles poorly anyway for thousands)
                    // Let's bias towards comma-as-decimal if delimiter is semicolon OR if standard parse seems truncated.
                    // Simple heuristic: if replaced value is valid, use it.
                    val = asDecimal;
                }
            }

            if (isNaN(val)) val = 0;

            datasetsData[j - 1].push(val);
        }
    }

    const datasets = headers.slice(1).map((header, index) => ({
        label: header,
        data: datasetsData[index]
    }));

    return { labels, datasets };
};
