// Flow Visualizer for Pet Battle Scripts
class FlowVisualizer {
    constructor(containerId, blizzardAPI) {
        this.container = document.getElementById(containerId);
        this.api = blizzardAPI;
    }

    async visualize(ast) {
        // Clear previous visualization
        this.container.innerHTML = '';

        if (!ast || ast.length === 0) {
            this.container.innerHTML = '<div style="padding: 20px; text-align: center; color: #999;">No script to visualize. Enter a script and click "Visualize".</div>';
            return;
        }

        // Create flow diagram
        const flowDiv = document.createElement('div');
        flowDiv.className = 'flow-diagram';

        await this.renderNodes(ast, flowDiv, 0);

        this.container.appendChild(flowDiv);
    }

    async renderNodes(nodes, container, indentLevel) {
        for (let index = 0; index < nodes.length; index++) {
            const node = nodes[index];

            if (node.type === 'if') {
                await this.renderIfNode(node, container, indentLevel);
            } else if (node.type === 'action') {
                await this.renderActionNode(node, container, indentLevel);
            } else if (node.type === 'separator') {
                this.renderSeparator(container, indentLevel);
            } else if (node.type === 'error') {
                this.renderErrorNode(node, container, indentLevel);
            }

            // Add connector between nodes (except for last node and separators)
            if (index < nodes.length - 1 && node.type !== 'separator') {
                this.renderConnector(container, indentLevel);
            }
        }
    }

    async renderIfNode(node, container, indentLevel) {
        // Create if condition node
        const ifBlock = document.createElement('div');
        ifBlock.className = 'if-block';
        ifBlock.style.marginLeft = `${indentLevel * 30}px`;

        const conditionNode = document.createElement('div');
        conditionNode.className = 'node condition';
        const conditionParts = await this.describeConditionFormatted(node.condition);
        const description = `<div class="formatted-condition"><div class="condition-if">IF</div><div class="condition-parts">${conditionParts}</div></div>`;

        const nodeId = `node-${Math.random().toString(36).substr(2, 9)}`;
        const childrenId = `children-${Math.random().toString(36).substr(2, 9)}`;

        conditionNode.innerHTML = `
            <div class="node-header" onclick="toggleIfNode('${nodeId}', '${childrenId}')">
                <span class="toggle-icon">▼</span>
                <span class="node-type">Condition</span>
            </div>
            <div class="node-content">if [${this.escapeHtml(node.conditionRaw)}]</div>
            <div id="${nodeId}" class="node-body">
                <div class="node-description">${description}</div>
            </div>
        `;

        ifBlock.appendChild(conditionNode);

        // Add connector
        const connector = document.createElement('div');
        connector.className = 'connector';
        connector.id = `connector-${childrenId}`;
        ifBlock.appendChild(connector);

        // Create children container
        const childrenContainer = document.createElement('div');
        childrenContainer.className = 'if-children';
        childrenContainer.id = childrenId;

        // Render children with increased indent
        await this.renderNodes(node.children, childrenContainer, indentLevel + 1);

        ifBlock.appendChild(childrenContainer);

        // Add endif marker
        const endifNode = document.createElement('div');
        endifNode.className = 'node control';
        endifNode.style.marginLeft = `${indentLevel * 30}px`;
        endifNode.innerHTML = `
            <div class="node-header">
                <span class="node-type">Control</span>
            </div>
            <div class="node-content">endif</div>
        `;
        ifBlock.appendChild(endifNode);

        container.appendChild(ifBlock);
    }

    async renderActionNode(node, container, indentLevel) {
        const actionNode = document.createElement('div');
        actionNode.className = `node action action-${node.actionType}`;
        actionNode.style.marginLeft = `${indentLevel * 30}px`;

        let actionLabel = this.getActionLabel(node);
        let conditionLabel = node.conditionRaw ? ` [${node.conditionRaw}]` : '';
        let description = await this.describeActionWithFormatting(node);

        const nodeId = `node-${Math.random().toString(36).substr(2, 9)}`;

        // Extract round number from condition if present
        const roundBadge = this.extractRoundBadge(node.conditionRaw);

        actionNode.innerHTML = `
            <div class="node-header" onclick="toggleNode('${nodeId}')">
                <span class="toggle-icon">▼</span>
                <span class="node-type">${this.capitalizeFirst(node.actionType)}</span>
                ${roundBadge}
            </div>
            <div class="node-content">${this.escapeHtml(actionLabel)}${this.escapeHtml(conditionLabel)}</div>
            <div id="${nodeId}" class="node-body">
                <div class="node-description">${description}</div>
            </div>
        `;

        container.appendChild(actionNode);
    }

    renderErrorNode(node, container, indentLevel) {
        const errorNode = document.createElement('div');
        errorNode.className = 'node';
        errorNode.style.borderColor = '#f44336';
        errorNode.style.background = '#ffebee';
        errorNode.style.marginLeft = `${indentLevel * 30}px`;

        errorNode.innerHTML = `
            <div class="node-type">Error</div>
            <div class="node-content">${this.escapeHtml(node.message)}</div>
        `;

        container.appendChild(errorNode);
    }

    renderSeparator(container, indentLevel) {
        const separator = document.createElement('div');
        separator.className = 'separator-line';
        separator.style.marginLeft = `${indentLevel * 30}px`;
        container.appendChild(separator);
    }

    renderConnector(container, indentLevel) {
        const connector = document.createElement('div');
        connector.className = 'connector';
        connector.style.marginLeft = `${indentLevel * 30 + 20}px`;
        container.appendChild(connector);
    }

    getActionLabel(node) {
        // Return the raw script action as it appears in the source
        return node.action;
    }

    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    async describeAction(node) {
        let baseDescription = '';

        switch (node.actionType) {
            case 'ability':
                baseDescription = await this.describeAbility(node.args);
                break;
            case 'change':
                if (node.args === 'next') {
                    baseDescription = 'Change to next pet';
                } else {
                    baseDescription = await this.describeChangePet(node.args);
                }
                break;
            case 'standby':
                baseDescription = 'Pass this turn';
                break;
            case 'quit':
                baseDescription = 'Forfeit the battle';
                break;
            case 'catch':
                baseDescription = 'Attempt to catch the enemy pet';
                break;
            case 'test':
                baseDescription = `Print debug message: ${node.args}`;
                break;
            default:
                baseDescription = node.action;
        }

        if (node.condition) {
            const conditionDesc = await this.describeCondition(node.condition);
            return `${baseDescription} if ${conditionDesc}`;
        }

        return baseDescription;
    }

    async describeActionWithFormatting(node) {
        let baseDescription = '';

        switch (node.actionType) {
            case 'ability':
                baseDescription = await this.describeAbility(node.args);
                break;
            case 'change':
                if (node.args === 'next') {
                    baseDescription = 'Change to next pet';
                } else {
                    baseDescription = await this.describeChangePet(node.args);
                }
                break;
            case 'standby':
                baseDescription = 'Pass this turn';
                break;
            case 'quit':
                baseDescription = 'Forfeit the battle';
                break;
            case 'catch':
                baseDescription = 'Attempt to catch the enemy pet';
                break;
            case 'test':
                baseDescription = `Print debug message: ${node.args}`;
                break;
            default:
                baseDescription = node.action;
        }

        if (node.condition) {
            const conditionParts = await this.describeConditionFormatted(node.condition);
            return `<div class="formatted-condition"><div class="condition-if">IF</div><div class="condition-parts">${conditionParts}</div><div class="condition-then">THEN</div><div class="condition-action">${baseDescription}</div></div>`;
        }

        return `<span style="font-style: normal;">${baseDescription}</span>`;
    }

    async describeConditionFormatted(condition) {
        if (!condition || !condition.raw) {
            return '';
        }

        // Handle complex conditions with & (AND) operator
        if (condition.raw.includes(' & ')) {
            const parts = condition.raw.split(' & ');
            const descriptions = await Promise.all(parts.map(part => this.describeSimpleCondition(part.trim())));
            const html = descriptions.map((desc, i) => {
                const partHtml = `<div class="condition-part with-bullet">${this.highlightNOT(desc)}</div>`;
                const andHtml = i < descriptions.length - 1 ? '<div class="condition-and">AND</div>' : '';
                return partHtml + andHtml;
            }).join('');
            return html;
        }

        const desc = await this.describeSimpleCondition(condition.raw);
        return `<div class="condition-part">${this.highlightNOT(desc)}</div>`;
    }

    highlightNOT(text) {
        // Replace "NOT" with styled span
        return text.replace(/\bNOT\b/g, '<span style="color: #f44336; font-weight: 700;">NOT</span>');
    }

    async describeAbility(args) {
        if (!this.api) {
            return `Use ability ${args}`;
        }

        // Handle slot numbers like #1, #2
        if (args.startsWith('#')) {
            return `Use ability in slot ${args}`;
        }

        // Parse ability args - could be "772", "AbilityName:ID", "AbilityName", etc.
        const parts = args.split(':');

        // If format is "Name:ID"
        if (parts.length > 1) {
            const providedName = parts[0];
            const abilityId = parts[1];

            if (/^\d+$/.test(abilityId)) {
                let actualName = await this.api.getPetAbilityName(abilityId);
                if (actualName && actualName.includes(':')) {
                    actualName = actualName.split(':')[0];
                }

                // Check for name mismatch
                if (actualName && actualName !== providedName) {
                    const warning = `<span class="name-mismatch-warning" title="Name mismatch: script says '${providedName}' but API says '${actualName}'">⚠️</span>`;
                    return `Use ability <span class="entity-ability">${providedName} (${abilityId})</span> ${warning}`;
                }

                return `Use ability <span class="entity-ability">${providedName} (${abilityId})</span>`;
            }
        }

        // If it's just a numeric ID
        const abilityId = args;
        if (/^\d+$/.test(abilityId)) {
            let abilityName = await this.api.getPetAbilityName(abilityId);
            if (abilityName) {
                if (abilityName.includes(':')) {
                    abilityName = abilityName.split(':')[0];
                }
                return `Use ability <span class="entity-ability">${abilityName} (${abilityId})</span>`;
            }
            // ID not found in API
            const warning = `<span class="name-mismatch-warning" title="Ability ID ${abilityId} not found in Blizzard API data">⚠️</span>`;
            return `Use ability <span class="entity-ability">${abilityId}</span> ${warning}`;
        }

        // Fallback to displaying args as-is (ability name without ID)
        const warning = `<span class="name-mismatch-warning" title="No ability ID provided - cannot verify name against Blizzard API">⚠️</span>`;
        return `Use ability <span class="entity-ability">${args}</span> ${warning}`;
    }

    async describeChangePet(args) {
        if (!this.api) {
            return `Change to pet ${args}`;
        }

        // Parse pet args - could be "1227", "PetName:ID", etc.
        const parts = args.split(':');

        // If format is "Name:ID"
        if (parts.length > 1) {
            const providedName = parts[0];
            const petId = parts[1];

            if (/^\d+$/.test(petId)) {
                const actualName = await this.api.getPetName(petId);

                // Check for name mismatch
                if (actualName && actualName !== providedName) {
                    const warning = `<span class="name-mismatch-warning" title="Name mismatch: script says '${providedName}' but API says '${actualName}'">⚠️</span>`;
                    return `Change to pet <span class="entity-friendly">${providedName} (${petId})</span> ${warning}`;
                }

                return `Change to pet <span class="entity-friendly">${providedName} (${petId})</span>`;
            }
        }

        // If it's just a numeric ID
        const petId = args;
        if (/^\d+$/.test(petId)) {
            const petName = await this.api.getPetName(petId);
            if (petName) {
                return `Change to pet <span class="entity-friendly">${petName} (${petId})</span>`;
            }
            return `Change to pet ${petId}`;
        }

        // Fallback
        return `Change to pet ${args}`;
    }

    async describeCondition(condition) {
        if (!condition || !condition.raw) {
            return '';
        }

        // Handle complex conditions with & (AND) operator
        if (condition.raw.includes(' & ')) {
            const parts = condition.raw.split(' & ');
            const descriptions = await Promise.all(parts.map(part => this.describeSimpleCondition(part.trim())));
            return descriptions.join(' AND ');
        }

        return await this.describeSimpleCondition(condition.raw);
    }

    async describeSimpleCondition(conditionStr) {
        // Handle negation with !
        let negated = false;
        if (conditionStr.startsWith('!')) {
            negated = true;
            conditionStr = conditionStr.substring(1);
        }

        // Parse a single condition like "enemy(#3).active" or "enemy.hpp > 50"
        const operators = ['!=', '>=', '<=', '!~', '~', '=', '>', '<'];

        for (const op of operators) {
            const opIndex = conditionStr.indexOf(op);
            if (opIndex > 0) {
                const left = conditionStr.substring(0, opIndex).trim();
                const right = conditionStr.substring(opIndex + op.length).trim();

                return await this.buildConditionDescription(left, op, right, negated);
            }
        }

        // No operator found - likely a boolean property
        return await this.describeBooleanSelector(conditionStr, negated);
    }

    async buildConditionDescription(left, operator, right, negated) {
        // Parse the left side (selector)
        const parsed = await this.parseSelector(left);

        if (!parsed) {
            const desc = `${left} ${this.describeOperator(operator)} ${right}`;
            return this.capitalizeFirst(desc);
        }

        // Handle global selectors (weather, round)
        if (parsed.type === 'global') {
            const opWord = this.getOperatorWord(operator);
            let desc = '';
            if (parsed.target === 'weather') {
                desc = `Weather ${opWord} ${right}`;
            } else if (parsed.target === 'round') {
                desc = `Round ${opWord} ${right}`;
            }
            return desc;
        }

        // Handle ability conditions
        if (parsed.type === 'ability') {
            const actualAbilityName = await this.getAbilityName(parsed.abilityId);
            let abilityDisplay;
            let warning = '';

            if (parsed.abilityProvidedName) {
                // Script provided "Name:ID" format
                if (actualAbilityName && actualAbilityName !== parsed.abilityProvidedName) {
                    warning = ` <span class="name-mismatch-warning" title="Name mismatch: script says '${parsed.abilityProvidedName}' but API says '${actualAbilityName}'">⚠️</span>`;
                }
                abilityDisplay = `<span class="entity-ability">${parsed.abilityProvidedName} (${parsed.abilityId})</span>`;
            } else {
                // Script provided ID only, look up the name
                abilityDisplay = actualAbilityName ? `<span class="entity-ability">${actualAbilityName} (${parsed.abilityId})</span>` : parsed.abilityId;
            }

            if (parsed.property === 'usable') {
                let isReady = (operator === '=' && right !== 'false') || (operator === '!=' && right === 'false');
                if (negated) isReady = !isReady;
                const verb = isReady ? 'is ready' : 'is NOT ready';
                return `${this.highlightEntity(this.capitalizeFirst(parsed.target), parsed.targetType)}${parsed.targetWarning || ''}'s ability ${abilityDisplay} ${verb}${warning}`;
            }

            const propertyName = this.getPropertyName(parsed.property);
            const opWord = this.getOperatorWord(operator);
            return `${this.highlightEntity(this.capitalizeFirst(parsed.target), parsed.targetType)}${parsed.targetWarning || ''} ability ${abilityDisplay} ${propertyName} ${opWord} ${right}${warning}`;
        }

        // Handle aura conditions
        if (parsed.type === 'aura') {
            const actualAuraName = await this.getAuraName(parsed.auraId);
            let auraDisplay;
            let warning = '';

            if (parsed.auraProvidedName) {
                // Script provided "Name:ID" format
                if (actualAuraName && actualAuraName !== parsed.auraProvidedName) {
                    warning = ` <span class="name-mismatch-warning" title="Name mismatch: script says '${parsed.auraProvidedName}' but API says '${actualAuraName}'">⚠️</span>`;
                }
                auraDisplay = `<span class="entity-aura">${parsed.auraProvidedName} (${parsed.auraId})</span>`;
            } else {
                // Script provided ID only, look up the name
                if (actualAuraName) {
                    auraDisplay = `<span class="entity-aura">${actualAuraName} (${parsed.auraId})</span>`;
                } else if (/^\d+$/.test(parsed.auraId)) {
                    // Numeric ID but not found in API
                    warning = ` <span class="name-mismatch-warning" title="Aura ID ${parsed.auraId} not found in Blizzard API data">⚠️</span>`;
                    auraDisplay = `<span class="entity-aura">${parsed.auraId}</span>`;
                } else {
                    // Name without ID
                    warning = ` <span class="name-mismatch-warning" title="No aura ID provided - cannot verify name against Blizzard API">⚠️</span>`;
                    auraDisplay = `<span class="entity-aura">${parsed.auraId}</span>`;
                }
            }

            if (parsed.property === 'exists') {
                let hasAura = (operator === '=' && right !== 'false') || (operator === '!=' && right === 'false');
                if (negated) hasAura = !hasAura;
                const verb = hasAura ? 'has' : 'does NOT have';
                return `${this.highlightEntity(this.capitalizeFirst(parsed.target), parsed.targetType)}${parsed.targetWarning || ''} ${verb} aura ${auraDisplay}${warning}`;
            }

            // Special handling for duration
            if (parsed.property === 'duration') {
                const targetEntity = this.highlightEntity(this.capitalizeFirst(parsed.target), parsed.targetType);
                const comparison = this.getAuraDurationPhrase(operator, right);
                return `${targetEntity}${parsed.targetWarning || ''} aura ${auraDisplay} ${comparison}${warning}`;
            }

            const propertyName = this.getPropertyName(parsed.property);
            const opWord = this.getOperatorWord(operator);
            return `${this.highlightEntity(this.capitalizeFirst(parsed.target), parsed.targetType)}${parsed.targetWarning || ''} aura ${auraDisplay} ${propertyName} ${opWord} ${right}${warning}`;
        }

        // Special handling for different property types
        if (operator === '=' || operator === '!=') {
            // Boolean-like comparisons (but NOT usable for abilities - that's handled above)
            if (parsed.type !== 'ability' &&
                (parsed.property === 'active' || parsed.property === 'dead' ||
                 parsed.property === 'exists' || parsed.property === 'played' ||
                 parsed.property === 'usable')) {

                let isTrue = (operator === '=' && right !== 'false') ||
                              (operator === '!=' && right === 'false');
                if (negated) isTrue = !isTrue;
                const verb = this.getBooleanVerb(parsed.property, isTrue);
                return `${this.highlightEntity(this.capitalizeFirst(parsed.target), parsed.targetType)}${parsed.targetWarning || ''} ${verb}`;
            }
        }

        // Special handling for hpp (health percentage)
        if (parsed.property === 'hpp') {
            const targetEntity = this.highlightEntity(this.capitalizeFirst(parsed.target), parsed.targetType);
            const comparison = this.getHealthPercentagePhrase(operator, right);
            return `${targetEntity}${parsed.targetWarning || ''}'s health ${comparison}`;
        }

        // Special handling for hp (health points)
        if (parsed.property === 'hp') {
            const targetEntity = this.highlightEntity(this.capitalizeFirst(parsed.target), parsed.targetType);
            const comparison = this.getHealthPointsPhrase(operator, right);
            return `${targetEntity}${parsed.targetWarning || ''}'s health ${comparison}`;
        }

        // Numeric/string comparisons
        const propertyName = this.getPropertyName(parsed.property);
        const opWord = this.getOperatorWord(operator);

        return `${this.highlightEntity(this.capitalizeFirst(parsed.target), parsed.targetType)}${parsed.targetWarning || ''}'s ${propertyName} ${opWord} ${right}`;
    }

    async parseSelector(selector) {
        // Parse selectors like "self(#3).active", "enemy.hpp", "enemy.aura(217).exists"
        if (!selector) return null;

        // Handle ability patterns: self(#2).ability(Name:321).usable
        const abilityMatch = selector.match(/^(self|enemy|ally)(\([^)]+\))?\.ability\(([^)]+)\)\.(.+)$/);
        if (abilityMatch) {
            const targetType = abilityMatch[1];
            const targetData = await this.getTargetName(targetType, abilityMatch[2] ? abilityMatch[2].slice(1, -1) : '');
            const abilityArg = abilityMatch[3];
            const property = abilityMatch[4];

            // Parse ability argument (could be "ID" or "Name:ID")
            const abilityParts = abilityArg.split(':');
            const abilityData = {
                raw: abilityArg,
                id: abilityParts.length > 1 ? abilityParts[1] : abilityArg,
                providedName: abilityParts.length > 1 ? abilityParts[0] : null
            };

            return {
                target: targetData.name,
                targetWarning: targetData.warning,
                targetType: targetType,
                type: 'ability',
                abilityId: abilityData.id,
                abilityProvidedName: abilityData.providedName,
                property: property
            };
        }

        // Handle aura patterns: enemy.aura(217).exists or enemy.aura(AuraName:217).exists
        const auraMatch = selector.match(/^(self|enemy|ally)(\([^)]+\))?\.aura\(([^)]+)\)\.(.+)$/);
        if (auraMatch) {
            const targetType = auraMatch[1];
            const targetData = await this.getTargetName(targetType, auraMatch[2] ? auraMatch[2].slice(1, -1) : '');
            const auraArg = auraMatch[3];
            const property = auraMatch[4];

            // Parse aura argument (could be "ID" or "Name:ID")
            const auraParts = auraArg.split(':');
            const auraData = {
                raw: auraArg,
                id: auraParts.length > 1 ? auraParts[1] : auraArg,
                providedName: auraParts.length > 1 ? auraParts[0] : null
            };

            return {
                target: targetData.name,
                targetWarning: targetData.warning,
                targetType: targetType,
                type: 'aura',
                auraId: auraData.id,
                auraProvidedName: auraData.providedName,
                property: property
            };
        }

        // Handle regular patterns: self(#3).active, enemy.hpp, self.speed.fast
        const targetMatch = selector.match(/^(self|enemy|ally)(\([^)]+\))?\.(.+)$/);
        if (targetMatch) {
            const targetType = targetMatch[1];
            const targetData = await this.getTargetName(targetType, targetMatch[2] ? targetMatch[2].slice(1, -1) : '');
            let property = targetMatch[3];

            // Handle nested properties like "speed.fast" or "speed.slow"
            // Convert them to just "fast" or "slow" since the speed comparison is implied
            if (property === 'speed.fast') {
                property = 'fast';
            } else if (property === 'speed.slow') {
                property = 'slow';
            }

            return {
                target: targetData.name,
                targetWarning: targetData.warning,
                targetType: targetType,
                type: 'pet',
                property: property
            };
        }

        // Weather or round
        if (selector === 'weather' || selector === 'round') {
            return {
                target: selector === 'weather' ? 'weather' : 'round',
                targetType: 'global',
                type: 'global',
                property: null
            };
        }

        return null;
    }

    async getTargetName(target, arg) {
        if (!arg) {
            if (target === 'self') return { name: 'your active pet', warning: '' };
            if (target === 'enemy') return { name: 'enemy active pet', warning: '' };
            return { name: 'ally active pet', warning: '' };
        }

        if (arg.startsWith('#')) {
            const num = arg.substring(1);
            const prefix = target === 'self' ? 'your' : target;
            return { name: `${prefix} pet #${num}`, warning: '' };
        }

        // Determine prefix
        const prefix = target === 'self' ? 'your pet' : target === 'enemy' ? 'enemy pet' : 'ally pet';

        // Handle "Name:ID" format
        if (arg.includes(':')) {
            const parts = arg.split(':');
            const providedName = parts[0];
            const id = parts[1];

            // Check for name mismatch with pet list
            if (/^\d+$/.test(id)) {
                const actualName = await this.api.getPetName(id);
                if (actualName && actualName !== providedName) {
                    const warning = ` <span class="name-mismatch-warning" title="Name mismatch: script says '${providedName}' but API says '${actualName}'">⚠️</span>`;
                    return { name: `${prefix} ${providedName} (${id})`, warning };
                }
            }

            return { name: `${prefix} ${providedName} (${id})`, warning: '' };
        }

        // Try to look up pet name by ID
        if (/^\d+$/.test(arg)) {
            const petName = await this.api.getPetName(arg);
            if (petName) {
                return { name: `${prefix} ${petName} (${arg})`, warning: '' };
            }
        }

        return { name: `${target}(${arg})`, warning: '' };
    }

    async describeBooleanSelector(selector, negated = false) {
        const parsed = await this.parseSelector(selector);
        if (!parsed) return this.capitalizeFirst(selector);

        if (parsed.type === 'ability') {
            const actualAbilityName = await this.getAbilityName(parsed.abilityId);
            let abilityDisplay;
            let warning = '';

            if (parsed.abilityProvidedName) {
                // Script provided "Name:ID" format
                if (actualAbilityName && actualAbilityName !== parsed.abilityProvidedName) {
                    warning = ` <span class="name-mismatch-warning" title="Name mismatch: script says '${parsed.abilityProvidedName}' but API says '${actualAbilityName}'">⚠️</span>`;
                }
                abilityDisplay = `<span class="entity-ability">${parsed.abilityProvidedName} (${parsed.abilityId})</span>`;
            } else {
                // Script provided ID only, look up the name
                abilityDisplay = actualAbilityName ? `<span class="entity-ability">${actualAbilityName} (${parsed.abilityId})</span>` : parsed.abilityId;
            }

            if (parsed.property === 'usable') {
                const verb = negated ? 'is NOT ready' : 'is ready';
                return `${this.highlightEntity(this.capitalizeFirst(parsed.target), parsed.targetType)}${parsed.targetWarning || ''}'s ability ${abilityDisplay} ${verb}${warning}`;
            }

            const verb = this.getBooleanVerb(parsed.property, !negated);
            return `${this.highlightEntity(this.capitalizeFirst(parsed.target), parsed.targetType)}${parsed.targetWarning || ''}'s ability ${abilityDisplay} ${verb}${warning}`;
        }

        if (parsed.type === 'aura') {
            const actualAuraName = await this.getAuraName(parsed.auraId);
            let auraDisplay;
            let warning = '';

            if (parsed.auraProvidedName) {
                // Script provided "Name:ID" format
                if (actualAuraName && actualAuraName !== parsed.auraProvidedName) {
                    warning = ` <span class="name-mismatch-warning" title="Name mismatch: script says '${parsed.auraProvidedName}' but API says '${actualAuraName}'">⚠️</span>`;
                }
                auraDisplay = `<span class="entity-aura">${parsed.auraProvidedName} (${parsed.auraId})</span>`;
            } else {
                // Script provided ID only (or name only), look up the name
                if (actualAuraName) {
                    auraDisplay = `<span class="entity-aura">${actualAuraName} (${parsed.auraId})</span>`;
                } else if (/^\d+$/.test(parsed.auraId)) {
                    // Numeric ID but not found in API
                    warning = ` <span class="name-mismatch-warning" title="Aura ID ${parsed.auraId} not found in Blizzard API data">⚠️</span>`;
                    auraDisplay = `<span class="entity-aura">${parsed.auraId}</span>`;
                } else {
                    // Name without ID
                    warning = ` <span class="name-mismatch-warning" title="No aura ID provided - cannot verify name against Blizzard API">⚠️</span>`;
                    auraDisplay = `<span class="entity-aura">${parsed.auraId}</span>`;
                }
            }

            const verb = negated ? 'does NOT have' : 'has';
            return `${this.highlightEntity(this.capitalizeFirst(parsed.target), parsed.targetType)}${parsed.targetWarning || ''} ${verb} aura ${auraDisplay}${warning}`;
        }

        const verb = this.getBooleanVerb(parsed.property, !negated);
        return `${this.highlightEntity(this.capitalizeFirst(parsed.target), parsed.targetType)}${parsed.targetWarning || ''} ${verb}`;
    }

    highlightEntity(text, type) {
        // Highlight entities with specific colors
        if (type === 'self') {
            return `<span class="entity-friendly">${text}</span>`;
        } else if (type === 'enemy') {
            return `<span class="entity-enemy">${text}</span>`;
        } else if (type === 'ally') {
            return `<span class="entity-ally">${text}</span>`;
        }
        return text;
    }

    async getAbilityName(abilityId) {
        if (!this.api) return null;
        return await this.api.getPetAbilityName(String(abilityId));
    }

    async getAuraName(auraId) {
        if (!this.api) return null;

        // Aura name is the ability name of auraId + 1
        const abilityId = String(parseInt(auraId) + 1);
        let name = await this.api.getPetAbilityName(abilityId);

        // Strip ":ID" suffix if present (e.g., "Wind-up:458" -> "Wind-up")
        if (name && name.includes(':')) {
            name = name.split(':')[0];
        }

        return name;
    }

    getBooleanVerb(property, isTrue) {
        const verbs = {
            'active': isTrue ? 'is active' : 'is NOT active',
            'dead': isTrue ? 'is dead' : 'is alive',
            'exists': isTrue ? 'exists' : 'does NOT exist',
            'played': isTrue ? 'has been played' : 'has NOT been played',
            'usable': isTrue ? 'is usable' : 'is NOT usable',
            'strong': isTrue ? 'is strong' : 'is NOT strong',
            'weak': isTrue ? 'is weak' : 'is NOT weak',
            'collected': isTrue ? 'is collected' : 'is NOT collected',
            'fast': isTrue ? 'is faster than the enemy active pet' : 'is NOT faster than the enemy active pet',
            'slow': isTrue ? 'is slower than the enemy active pet' : 'is NOT slower than the enemy active pet'
        };

        return verbs[property] || (isTrue ? `is ${property}` : `is NOT ${property}`);
    }

    getPropertyName(property) {
        const names = {
            'hp': 'health',
            'hpp': 'health %',
            'level': 'level',
            'speed': 'speed',
            'type': 'type',
            'duration': 'duration'
        };

        return names[property] || property;
    }

    getOperatorWord(operator) {
        const words = {
            '=': 'is',
            '!=': 'is not',
            '>': 'is greater than',
            '>=': 'is greater than or equal to',
            '<': 'is less than',
            '<=': 'is less than or equal to',
            '~': 'contains',
            '!~': 'does not contain'
        };

        return words[operator] || operator;
    }

    describeValue(value) {
        // Remove quotes from strings
        if (value.startsWith('"') && value.endsWith('"')) {
            return value.slice(1, -1);
        }
        if (value.startsWith("'") && value.endsWith("'")) {
            return value.slice(1, -1);
        }

        return value;
    }

    getAuraDurationPhrase(operator, value) {
        const num = parseInt(value);
        const rounds = num === 1 ? 'round' : 'rounds';

        const phrases = {
            '<': `has less than ${num} ${rounds} remaining`,
            '<=': `has ${num} ${rounds} or less remaining`,
            '>': `has more than ${num} ${rounds} remaining`,
            '>=': `has ${num} ${rounds} or more remaining`,
            '=': `has exactly ${num} ${rounds} remaining`,
            '!=': `does NOT have ${num} ${rounds} remaining`
        };

        return phrases[operator] || `duration ${operator} ${value}`;
    }

    getHealthPercentagePhrase(operator, value) {
        const num = parseInt(value);

        const phrases = {
            '<': `is below ${num}%`,
            '<=': `is at or below ${num}%`,
            '>': `is above ${num}%`,
            '>=': `is at or above ${num}%`,
            '=': `is exactly ${num}%`,
            '!=': `is NOT ${num}%`
        };

        return phrases[operator] || `${operator} ${value}%`;
    }

    getHealthPointsPhrase(operator, value) {
        const num = parseInt(value);

        const phrases = {
            '<': `is less than ${num}`,
            '<=': `is at most ${num}`,
            '>': `is greater than ${num}`,
            '>=': `is at least ${num}`,
            '=': `is exactly ${num}`,
            '!=': `is NOT ${num}`
        };

        return phrases[operator] || `${operator} ${value}`;
    }

    extractRoundBadge(conditionRaw) {
        if (!conditionRaw) return '';

        // Match patterns like "round=7", "round>=3", "round<10", etc.
        const roundMatch = conditionRaw.match(/\bround\s*(=|!=|>=|<=|>|<)\s*(\d+)/);
        if (roundMatch) {
            const operator = roundMatch[1];
            const roundNum = roundMatch[2];

            // For simple equality, just show the round number
            if (operator === '=') {
                return `<span class="round-badge">R${roundNum}</span>`;
            }
            // For other operators, show operator too
            return `<span class="round-badge">R${operator}${roundNum}</span>`;
        }

        return '';
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FlowVisualizer;
}
