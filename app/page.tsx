"use client";
import { useState, useEffect } from "react";
import styles from "./page.module.css";

interface Design {

    DesignID: number;
    AlbumID: number;
    Caption: string;
    Description: string;
    NDownloaded: number;
    Notes: string;
    Width: number;
    Height: number;
    Text: string;
    NPage: number;
}

export default function Home() {
    const [designs, setDesigns] = useState<Design[]>([]);
    const [isLoading, setIsLoading] = useState(true);


    useEffect(() => {
        async function fetchDesigns() {
            try {
               const res = await fetch("/api/all-designs");
               if (!res.ok) throw new Error("Failed to fetch designs");
               const designs = await res.json();

               setDesigns(designs);
               console.log(designs);
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
                        <div key={design.DesignID} className={styles.designCard}>
                            <h3 className={styles.DesignCaption}>{design.Caption}</h3>
                            <p>{design.Description}</p>
                            <p>Downloads: {design.NDownloaded}</p>
                            <p>Size: {design.Width}x{design.Height}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
