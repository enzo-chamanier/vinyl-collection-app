import axios from "axios";

export class CoverArtService {
    private itunesApiUrl = "https://itunes.apple.com/search";

    async getCoverArt(artist: string, album: string): Promise<string | null> {
        try {
            const term = `${artist} ${album}`;
            const response = await axios.get(this.itunesApiUrl, {
                params: {
                    term,
                    media: "music",
                    entity: "album",
                    limit: 1,
                },
            });

            if (response.data.results && response.data.results.length > 0) {
                const artworkUrl100 = response.data.results[0].artworkUrl100;
                if (artworkUrl100) {
                    return artworkUrl100.replace("100x100bb", "600x600bb");
                }
            }
            return null;
        } catch (error) {
            console.error("Error fetching cover art from iTunes:", error);
            return null;
        }
    }

    async searchAlbum(artist: string, album: string): Promise<any | null> {
        try {
            const term = `${artist} ${album}`;
            const response = await axios.get(this.itunesApiUrl, {
                params: {
                    term,
                    media: "music",
                    entity: "album",
                    limit: 1,
                },
            });

            if (response.data.results && response.data.results.length > 0) {
                return this.mapItunesResult(response.data.results[0]);
            }
            return null;
        } catch (error) {
            console.error("Error searching album on iTunes:", error);
            return null;
        }
    }

    async searchByUpc(upc: string): Promise<any | null> {
        try {
            const response = await axios.get(this.itunesApiUrl, {
                params: {
                    term: upc,
                    media: "music",
                    entity: "album",
                    limit: 1,
                },
            });

            if (response.data.results && response.data.results.length > 0) {
                return this.mapItunesResult(response.data.results[0]);
            }
            return null;
        } catch (error) {
            console.error("Error searching UPC on iTunes:", error);
            return null;
        }
    }

    private mapItunesResult(result: any) {
        const artworkUrl = result.artworkUrl100 ? result.artworkUrl100.replace("100x100bb", "600x600bb") : null;
        const year = result.releaseDate ? new Date(result.releaseDate).getFullYear() : new Date().getFullYear();

        return {
            id: result.collectionId,
            title: result.collectionName,
            artists: [{ name: result.artistName }],
            year: year,
            genres: [result.primaryGenreName],
            images: artworkUrl ? [{ uri: artworkUrl }] : [],
            uri: result.collectionViewUrl,
            formats: [], // iTunes doesn't give format details easily, default to empty
            discCount: 1,
            format: "vinyl" // Default, user can change
        };
    }
}

export const coverArtService = new CoverArtService();
