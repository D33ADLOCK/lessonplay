import type {
  CircuitComponent,
  CircuitEvidence,
  CircuitGraph,
} from "../contracts/circuit";

function componentEdges(
  component: CircuitComponent,
): readonly (readonly [string, string])[] {
  if (component.kind === "cell") {
    return [];
  }
  if (component.kind === "switch" && !component.closed) {
    return [];
  }
  return [component.terminalIds];
}

export function evaluateCircuit(graph: CircuitGraph): CircuitEvidence {
  const terminalOwners = new Map<string, CircuitComponent>();
  for (const component of graph.components) {
    for (const terminalId of component.terminalIds) {
      if (terminalOwners.has(terminalId)) {
        return invalid(`Terminal "${terminalId}" is declared more than once.`);
      }
      terminalOwners.set(terminalId, component);
    }
  }

  const adjacency = new Map<string, Set<string>>();
  const connect = (from: string, to: string): void => {
    const neighbors = adjacency.get(from) ?? new Set<string>();
    neighbors.add(to);
    adjacency.set(from, neighbors);
  };

  for (const connection of graph.connections) {
    if (
      connection.from === connection.to ||
      !terminalOwners.has(connection.from) ||
      !terminalOwners.has(connection.to)
    ) {
      return invalid("The circuit contains an unsupported connection.");
    }
    connect(connection.from, connection.to);
    connect(connection.to, connection.from);
  }

  for (const component of graph.components) {
    for (const [from, to] of componentEdges(component)) {
      connect(from, to);
      connect(to, from);
    }
  }

  const cell = graph.components.find((component) => component.kind === "cell");
  if (!cell) return invalid("The circuit needs one cell.");

  const [start, target] = cell.terminalIds;
  const visited = new Set<string>([start]);
  const parent = new Map<string, string>();
  const queue = [start];
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break;
    for (const neighbor of adjacency.get(current) ?? []) {
      if (neighbor === target) {
        parent.set(target, current);
        const path = reconstructPath(target, parent);
        const traversedEdges = new Set(
          path.slice(1).map((terminalId, index) =>
            edgeKey(path[index] ?? "", terminalId),
          ),
        );
        const activatedDeviceIds = graph.components
          .filter(
            (component) =>
              component.kind === "lamp" &&
              traversedEdges.has(
                edgeKey(component.terminalIds[0], component.terminalIds[1]),
              ),
          )
          .map((component) => component.id);
        return {
          classification: "complete",
          energizedTerminalIds: path,
          gapTerminalIds: [],
          activatedDeviceIds,
          reason: "A closed path returns to the cell.",
        };
      }
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        parent.set(neighbor, current);
        queue.push(neighbor);
      }
    }
  }

  return {
    classification: "open",
    energizedTerminalIds: [...visited],
    gapTerminalIds: graph.components
      .flatMap((component) => [...component.terminalIds])
      .filter((terminalId) => !visited.has(terminalId)),
    activatedDeviceIds: [],
    reason: "The path does not return to the cell.",
  };
}

function reconstructPath(
  target: string,
  parent: ReadonlyMap<string, string>,
): string[] {
  const path = [target];
  let current = target;
  while (parent.has(current)) {
    current = parent.get(current) ?? current;
    path.push(current);
  }
  return path.reverse();
}

function edgeKey(from: string, to: string): string {
  return [from, to].sort().join("::");
}

function invalid(reason: string): CircuitEvidence {
  return {
    classification: "invalid",
    energizedTerminalIds: [],
    gapTerminalIds: [],
    activatedDeviceIds: [],
    reason,
  };
}
