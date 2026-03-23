import { NextRequest, NextResponse } from 'next/server'
import { readFileSync } from 'fs'

type TextFootnoteResponse = {
    text: string,
    footnote: string
}

interface RouteParams{
    book_id: string,
    // section_id: string
}

// const paragraphs_tsv = readFileSync('public/texts/paragraphs.tsv', 'utf-8').split('\n').map(line => line.split('\t'));

async function GET(
    req: NextRequest, 
    context: { params: Promise<RouteParams> }
): Promise<NextResponse<TextFootnoteResponse>> {
    const params: RouteParams = await context.params;
    const book_id: string = params.book_id;
    // const section_id: string = params.section_id;
    if (book_id === 'boo') {
        return new NextResponse('', { status: 404})
    } else {
        return NextResponse.json({
            text: book_id,
            footnote: readFileSync('public/abc.txt', 'utf-8')
        })
    }
}

export {GET}