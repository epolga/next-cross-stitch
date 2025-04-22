"use client";
import { useState, useEffect } from "react";
import styles from "./page.module.css";

interface Design {
    designId: number;
    albumId: number;
    caption: string;
    description: string;
    nDownloaded: number;
    notes: string;
    width: number;
    height: number;
    text: string;
    nPage: number;
}

export default function Home() {
    const [designs, setDesigns] = useState<Design[]>([]);
    const [isLoading, setIsLoading] = useState(true);


    useEffect(() => {
        async function fetchDesigns() {
            try {
                /*
                const res = await fetch("/api/all-designs");
                if (!res.ok) throw new Error("Failed to fetch designs");
                const { designs } = await res.json();
                 */
                const designs: any [] = []
                setDesigns(designs);
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchDesigns();
    }, []);

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Latest Designs</h1>
            {isLoading ? (
                <p>Loading designs...</p>
            ) : designs.length === 0 ? (
                <p>No designs found.</p>
            ) : (
                <div className={styles.designGrid}>
                    {designs.map((design) => (
                        <div key={design.designId} className={styles.designCard}>
                            <h3 className={styles.designCaption}>{design.caption}</h3>
                            <p>{design.description}</p>
                            <p>Downloads: {design.nDownloaded}</p>
                            <p>Size: {design.width}x{design.height}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
