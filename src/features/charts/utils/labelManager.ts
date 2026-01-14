
export interface Label {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    text: string;
    priority?: number;
    visible?: boolean;
}

export class LabelManager {
    static checkCollision(a: Label, b: Label): boolean {
        return (
            a.x < b.x + b.width &&
            a.x + a.width > b.x &&
            a.y < b.y + b.height &&
            a.y + a.height > b.y
        );
    }

    static resolveCollisions(labels: Label[], containerWidth: number, containerHeight: number): Label[] {
        // Simple greedy strategy:
        // 1. Sort by priority (if any) or existing order
        // 2. Place higher priority first
        // 3. If collision, hide lower priority (or try to move if we get advanced)

        const placed: Label[] = [];
        const result: Label[] = labels.map(l => ({ ...l, visible: true }));

        // Sort by priority (high to low)
        result.sort((a, b) => (b.priority || 0) - (a.priority || 0));

        for (let i = 0; i < result.length; i++) {
            const current = result[i];

            // Check boundary
            if (current.x < 0 || current.x + current.width > containerWidth ||
                current.y < 0 || current.y + current.height > containerHeight) {
                // Try to nudge inside? For now, just hide or keep as is (clipping might handle it)
                // Let's hide if completely out, but usually we just want to avoid overlap
            }

            let collision = false;
            for (const other of placed) {
                if (this.checkCollision(current, other)) {
                    collision = true;
                    break;
                }
            }

            if (collision) {
                current.visible = false;
            } else {
                placed.push(current);
            }
        }

        return result;
    }
}
