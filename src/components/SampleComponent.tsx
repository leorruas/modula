import React from 'react';

export const SampleComponent = ({ title }: { title: string }) => {
    return (
        <div>
            <h1>{title}</h1>
            <button onClick={() => console.log('clicked')}>Click me</button>
        </div>
    );
};
