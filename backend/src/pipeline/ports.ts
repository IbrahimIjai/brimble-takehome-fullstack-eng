const START_PORT = 4000;
const END_PORT = 5000;

const usedPorts = new Set<number>();

export function allocatePort(): number {
  for (let port = START_PORT; port <= END_PORT; port++) {
    if (!usedPorts.has(port)) {
      usedPorts.add(port);
      return port;
    }
  }
  throw new Error("No available ports — too many concurrent deployments");
}

export function releasePort(port: number): void {
  usedPorts.delete(port);
}

export function initUsedPorts(ports: number[]): void {
  for (const port of ports) {
    usedPorts.add(port);
  }
}
