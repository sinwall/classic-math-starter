// 'use client'
import React from 'react'

type ReaderProps = {
    book_id: string,
    n_sections: number,
    sections_id: string[],
    sections_name: string[],
}

const ReaderContext = React.createContext<ReaderProps | null>(null);

export type {ReaderProps};
export {ReaderContext};