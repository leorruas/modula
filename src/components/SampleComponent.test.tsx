import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SampleComponent } from './SampleComponent';

describe('SampleComponent', () => {
    it('renders the title', () => {
        render(<SampleComponent title="Hello Vitest" />);
        expect(screen.getByText('Hello Vitest')).toBeDefined();
    });

    it('renders the button', () => {
        render(<SampleComponent title="Hello Vitest" />);
        expect(screen.getByRole('button', { name: /click me/i })).toBeDefined();
    });
});
