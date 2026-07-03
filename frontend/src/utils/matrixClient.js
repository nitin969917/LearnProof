import * as sdk from "matrix-js-sdk";

let client = null;

/**
 * Initializes and starts the Matrix client using the authenticated credentials
 */
export const initMatrixClient = async (credentials) => {
    if (!credentials || !credentials.userId || !credentials.accessToken) {
        console.warn("Matrix client initialization skipped: missing credentials.");
        return null;
    }

    // Stop existing client if any
    if (client) {
        try {
            client.stopClient();
        } catch (e) {
            console.error("Failed to stop previous Matrix client:", e);
        }
        client = null;
    }

    try {
        client = sdk.createClient({
            baseUrl: credentials.homeserverUrl || "http://localhost:8009",
            accessToken: credentials.accessToken,
            userId: credentials.userId,
        });

        // Start the client sync loop
        await client.startClient({ initialSyncLimit: 20 });
        console.log("Matrix client started syncing for:", credentials.userId);
        return client;
    } catch (err) {
        console.error("Failed to start Matrix client:", err);
        client = null;
        return null;
    }
};

/**
 * Returns the currently active Matrix client instance
 */
export const getMatrixClient = () => {
    return client;
};

/**
 * Stops and clears the Matrix client connection
 */
export const disconnectMatrixClient = () => {
    if (client) {
        try {
            client.stopClient();
            console.log("Matrix client stopped.");
        } catch (e) {
            console.error("Error stopping Matrix client:", e);
        }
        client = null;
    }
};
