
import { describe, it, expect } from 'vitest';
import { parseCSV } from './csvParser';

describe('parseCSV Utility', () => {

    it('should parse simple comma-separated CSV', () => {
        const input = `Category,Val1,Val2
A,10,20
B,30,40`;
        const result = parseCSV(input);

        expect(result.labels).toEqual(['A', 'B']);
        expect(result.datasets).toHaveLength(2);
        expect(result.datasets[0].label).toBe('Val1');
        expect(result.datasets[0].data).toEqual([10, 30]);
        expect(result.datasets[1].label).toBe('Val2');
        expect(result.datasets[1].data).toEqual([20, 40]);
    });

    it('should parse simple semicolon-separated CSV', () => {
        const input = `Category;Val1;Val2
A;10;20
B;30;40`;
        const result = parseCSV(input);

        expect(result.labels).toEqual(['A', 'B']);
        expect(result.datasets[0].data).toEqual([10, 30]);
        expect(result.datasets[1].data).toEqual([20, 40]);
    });

    it('should handle quoted values containing delimiters', () => {
        const input = `City,"Population, 2020",Area
"New York, NY",8000,300
"San Francisco, CA",900,50`;
        const result = parseCSV(input);

        expect(result.labels).toEqual(['New York, NY', 'San Francisco, CA']);
        expect(result.datasets[0].label).toBe('Population, 2020');
        expect(result.datasets[0].data).toEqual([8000, 900]);
        expect(result.datasets[1].data).toEqual([300, 50]);
    });

    it('should handle numbers with commas as decimal separators when using semicolon delimiter', () => {
        const input = `Produto;Preco
Cafe;10,50
Leite;5,20`;
        const result = parseCSV(input);

        expect(result.labels).toEqual(['Cafe', 'Leite']);
        expect(result.datasets[0].data).toEqual([10.50, 5.20]);
    });

    it('should handle jagged rows (missing columns) gracefully', () => {
        const input = `Cat,Val1,Val2
A,10,20
B,30`; // Missing last value
        const result = parseCSV(input);

        expect(result.labels).toEqual(['A', 'B']);
        expect(result.datasets[0].data).toEqual([10, 30]);
        expect(result.datasets[1].data).toEqual([20, 0]); // Should fill with 0
    });

    it('should handle jagged rows (extra columns) gracefully', () => {
        const input = `Cat,Val1
A,10
B,30,999`; // Extra value ignored
        const result = parseCSV(input);

        expect(result.labels).toEqual(['A', 'B']);
        expect(result.datasets).toHaveLength(1);
        expect(result.datasets[0].data).toEqual([10, 30]);
    });

    it('should handle empty input', () => {
        expect(parseCSV('')).toEqual({ labels: [], datasets: [] });
        expect(parseCSV('   ')).toEqual({ labels: [], datasets: [] });
    });
});
