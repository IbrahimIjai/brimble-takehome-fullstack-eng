const CADDY_ADMIN = process.env.CADDY_ADMIN_URL || "http://caddy:2019";

export async function registerRoute(deploymentId: string, port: number): Promise<void> {
    const upstream = `host.docker.internal:${port}`;
    const route = {
        "@id": `deployment-${deploymentId}`,
        match: [
            {
                host: [`${deploymentId}.localhost`],
            },
        ],
        handle: [
            {
                handler: "reverse_proxy",
                upstreams: [{ dial: upstream }],
                flush_interval: -1,
            },
        ],
    };
    const url = `${CADDY_ADMIN}/config/apps/http/servers/srv0/routes/0`;

    try {
        const res = await fetch(url, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Origin": "http://caddy:2019",
                "Host": "caddy:2019"
            },
            body: JSON.stringify(route),
        });

        if (!res.ok) {
            const body = await res.text();
            throw new Error(`Caddy admin API error ${res.status}: ${body}`);
        }

        console.log(`Caddy route registered: /app/${deploymentId} → ${upstream}`);
    } catch (err) {
        console.error(`Failed to register Caddy route for ${deploymentId}:`, err);
    }
}

export async function unregisterRoute(deploymentId: string): Promise<void> {
    const url = `${CADDY_ADMIN}/id/deployment-${deploymentId}`;

    try {
        const res = await fetch(url, {
            method: "DELETE",
            headers: {
                "Origin": "http://caddy:2019",
                "Host": "caddy:2019"
            }
        });
        if (!res.ok && res.status !== 404) {
            const body = await res.text();
            console.error(`Failed to unregister Caddy route: ${res.status} ${body}`);
        } else {
            console.log(`Caddy route removed: /app/${deploymentId}`);
        }
    } catch (err) {
        console.error(`Error unregistering Caddy route for ${deploymentId}:`, err);
    }
}
