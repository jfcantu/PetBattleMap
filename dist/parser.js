// Pet Battle Script Parser
class PBSParser {
    constructor(script) {
        this.script = script;
        this.lines = script.split('\n').map(line => line.trimEnd());
        this.currentLine = 0;
    }

    parse() {
        const ast = [];
        while (this.currentLine < this.lines.length) {
            const node = this.parseLine();
            if (node) {
                ast.push(node);
            }
            this.currentLine++;
        }
        return ast;
    }

    parseLine() {
        const line = this.lines[this.currentLine];

        // Skip empty lines and comments
        if (!line.trim() || line.trim().startsWith('#')) {
            return null;
        }

        const indent = this.getIndentLevel(line);
        const trimmedLine = line.trim();

        // Parse separator/organizer
        if (trimmedLine === '--') {
            return { type: 'separator', indent };
        }

        // Parse if statement
        if (trimmedLine.startsWith('if ')) {
            return this.parseIfBlock(indent);
        }

        // Parse endif
        if (trimmedLine === 'endif') {
            return { type: 'endif', indent };
        }

        // Parse actions with optional conditions
        return this.parseAction(trimmedLine, indent);
    }

    parseIfBlock(indent) {
        const line = this.lines[this.currentLine].trim();
        const conditionMatch = line.match(/^if\s+\[(.*)\]$/);

        if (!conditionMatch) {
            return { type: 'error', message: 'Invalid if statement', line: this.currentLine };
        }

        const condition = conditionMatch[1].trim();
        const ifNode = {
            type: 'if',
            condition: this.parseCondition(condition),
            conditionRaw: condition,
            indent,
            children: [],
            line: this.currentLine
        };

        // Parse children until endif
        const startLine = this.currentLine;
        this.currentLine++;

        while (this.currentLine < this.lines.length) {
            const childLine = this.lines[this.currentLine].trim();

            if (childLine === 'endif') {
                ifNode.endLine = this.currentLine;
                break;
            }

            const childNode = this.parseLine();
            if (childNode && childNode.type !== 'endif') {
                ifNode.children.push(childNode);
            }

            this.currentLine++;
        }

        return ifNode;
    }

    parseAction(line, indent) {
        // Check for inline condition [...]
        const conditionMatch = line.match(/^(.+?)\s*\[(.*)\]$/);

        let action = line;
        let condition = null;

        if (conditionMatch) {
            action = conditionMatch[1].trim();
            condition = this.parseCondition(conditionMatch[2].trim());
        }

        // Parse action type and arguments
        const actionType = this.getActionType(action);
        const args = this.getActionArgs(action);

        return {
            type: 'action',
            actionType,
            action,
            args,
            condition,
            conditionRaw: conditionMatch ? conditionMatch[2].trim() : null,
            indent,
            line: this.currentLine
        };
    }

    getActionType(action) {
        if (action.startsWith('ability(') || action.startsWith('use(')) {
            return 'ability';
        } else if (action.startsWith('change(')) {
            return 'change';
        } else if (action === 'quit') {
            return 'quit';
        } else if (action === 'standby') {
            return 'standby';
        } else if (action === 'catch') {
            return 'catch';
        } else if (action.startsWith('test(')) {
            return 'test';
        }
        return 'unknown';
    }

    getActionArgs(action) {
        const match = action.match(/\(([^)]+)\)/);
        return match ? match[1] : null;
    }

    parseCondition(conditionStr) {
        // Parse condition into structured format
        // This is a simplified parser for common condition patterns

        const parts = {
            raw: conditionStr,
            operator: null,
            left: null,
            right: null
        };

        // Find comparison operators
        const operators = ['!=', '>=', '<=', '!~', '~', '=', '>', '<', '&'];

        for (const op of operators) {
            if (conditionStr.includes(op)) {
                const splitIndex = conditionStr.indexOf(op);
                parts.operator = op;
                parts.left = conditionStr.substring(0, splitIndex).trim();
                parts.right = conditionStr.substring(splitIndex + op.length).trim();
                break;
            }
        }

        return parts;
    }

    getIndentLevel(line) {
        let indent = 0;
        for (let char of line) {
            if (char === ' ') indent++;
            else if (char === '\t') indent += 4;
            else break;
        }
        return indent;
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PBSParser;
}
