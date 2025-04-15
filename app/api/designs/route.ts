import { NextResponse } from 'next/server';

// Mock designs (100 designs, sorted by designId descending)
const designs = Array.from({ length: 100 }, (_, i) => ({
    designId: 100 - i, // 100, 99, ..., 1
    albumId: Math.floor(Math.random() * 10) + 1, // Random album 1-10
    caption: `Design ${100 - i}`,
    description: `Description for design ${100 - i}`,
    nDownloaded: Math.floor(Math.random() * 1000), // 0-999
    notes: '',
    width: 200 + Math.floor(Math.random() * 100), // 200-299
    height: 200 + Math.floor(Math.random() * 100), // 200-299
    text: '',
    nPage: 1,
}));

export async function GET() {
    try {
        // Return last 40 designs (mimics LIMIT 40)
        const last40Designs = designs.slice(0, 40).map(design => ({
            designId: design.designId,
            albumId: design.albumId,
            caption: design.caption,
            description: design.description,
            nDownloaded: design.nDownloaded,
            notes: design.notes,
            width: design.width,
            height: design.height,
            text: design.text,
            nPage: design.nPage,
        }));

        return NextResponse.json({
            designs: last40Designs,
            total: designs.length,
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
