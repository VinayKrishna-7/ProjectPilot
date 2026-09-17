import mongoose from 'mongoose';
import { JqlParseResult, JqlSuggestion } from '@taskflow/shared';
import { User } from '../models/User';

export type TokenType =
  | 'IDENTIFIER'
  | 'STRING'
  | 'NUMBER'
  | 'OPERATOR'
  | 'AND'
  | 'OR'
  | 'NOT'
  | 'ORDER_BY'
  | 'SORT_ORDER'
  | 'LPAREN'
  | 'RPAREN'
  | 'COMMA'
  | 'EOF';

export interface Token {
  type: TokenType;
  value: string;
  position: number;
}

export interface AstNode {
  type: 'binary' | 'unary' | 'comparison';
  operator?: string;
  left?: AstNode | string;
  right?: AstNode | any;
  field?: string;
  value?: any;
}

const ALLOWED_FIELDS: Record<string, string> = {
  status: 'status',
  priority: 'priority',
  type: 'type',
  assignee: 'assignee',
  reporter: 'reporter',
  sprint: 'sprint',
  label: 'labels',
  key: 'key',
  title: 'title',
  storypoints: 'storyPoints',
};

const VALID_STATUSES = ['todo', 'in_progress', 'review', 'done'];
const VALID_PRIORITIES = ['lowest', 'low', 'medium', 'high', 'highest'];
const VALID_TYPES = ['task', 'bug', 'story', 'epic'];

export class JqlService {
  /** Tokenizes raw JQL text into a stream of tokens */
  tokenize(input: string): Token[] {
    const tokens: Token[] = [];
    let i = 0;

    while (i < input.length) {
      const char = input[i];

      if (/\s/.test(char)) {
        i++;
        continue;
      }

      if (char === '(') {
        tokens.push({ type: 'LPAREN', value: '(', position: i++ });
        continue;
      }
      if (char === ')') {
        tokens.push({ type: 'RPAREN', value: ')', position: i++ });
        continue;
      }
      if (char === ',') {
        tokens.push({ type: 'COMMA', value: ',', position: i++ });
        continue;
      }

      // Check for 2-character operators: !=, <=, >=
      if (input.slice(i, i + 2) === '!=') {
        tokens.push({ type: 'OPERATOR', value: '!=', position: i });
        i += 2;
        continue;
      }
      if (input.slice(i, i + 2) === '<=') {
        tokens.push({ type: 'OPERATOR', value: '<=', position: i });
        i += 2;
        continue;
      }
      if (input.slice(i, i + 2) === '>=') {
        tokens.push({ type: 'OPERATOR', value: '>=', position: i });
        i += 2;
        continue;
      }

      // Check 1-char operators: =, ~, >, <
      if (['=', '~', '>', '<'].includes(char)) {
        tokens.push({ type: 'OPERATOR', value: char, position: i++ });
        continue;
      }

      // Quoted string
      if (char === '"' || char === "'") {
        const quote = char;
        let str = '';
        const start = i++;
        while (i < input.length && input[i] !== quote) {
          str += input[i++];
        }
        if (i < input.length) i++; // consume closing quote
        tokens.push({ type: 'STRING', value: str, position: start });
        continue;
      }

      // Numbers
      if (/\d/.test(char)) {
        let numStr = '';
        const start = i;
        while (i < input.length && /[\d.]/.test(input[i])) {
          numStr += input[i++];
        }
        tokens.push({ type: 'NUMBER', value: numStr, position: start });
        continue;
      }

      // Identifiers and Keywords
      if (/[a-zA-Z_]/.test(char)) {
        let word = '';
        const start = i;
        while (i < input.length && /[a-zA-Z0-9_-]/.test(input[i])) {
          word += input[i++];
        }

        const upper = word.toUpperCase();
        if (upper === 'AND') {
          tokens.push({ type: 'AND', value: 'AND', position: start });
        } else if (upper === 'OR') {
          tokens.push({ type: 'OR', value: 'OR', position: start });
        } else if (upper === 'NOT') {
          tokens.push({ type: 'NOT', value: 'NOT', position: start });
        } else if (upper === 'ORDER') {
          // Check for ORDER BY
          let j = i;
          while (j < input.length && /\s/.test(input[j])) j++;
          if (input.slice(j, j + 2).toUpperCase() === 'BY') {
            i = j + 2;
            tokens.push({ type: 'ORDER_BY', value: 'ORDER BY', position: start });
          } else {
            tokens.push({ type: 'IDENTIFIER', value: word, position: start });
          }
        } else if (upper === 'ASC' || upper === 'DESC') {
          tokens.push({ type: 'SORT_ORDER', value: upper, position: start });
        } else if (upper === 'IN') {
          tokens.push({ type: 'OPERATOR', value: 'in', position: start });
        } else {
          tokens.push({ type: 'IDENTIFIER', value: word, position: start });
        }
        continue;
      }

      // Unrecognized character
      i++;
    }

    tokens.push({ type: 'EOF', value: '', position: i });
    return tokens;
  }

  /** Parses and compiles a JQL string into a Mongo query and sort */
  async parseAndCompile(
    jql: string,
    projectId: string,
    currentUserId?: string
  ): Promise<JqlParseResult> {
    if (!jql || !jql.trim()) {
      return { valid: true, mongoQuery: { project: projectId }, sort: { position: 1 } };
    }

    try {
      const tokens = this.tokenize(jql.trim());
      let idx = 0;

      const peek = () => tokens[idx] || { type: 'EOF', value: '', position: 0 };
      const consume = () => tokens[idx++];

      let sortClause: { field: string; direction: 1 | -1 } | null = null;

      // Parse expression
      const parseComparison = (): AstNode => {
        const token = consume();
        if (token.type !== 'IDENTIFIER') {
          throw new Error(`Expected field name at character ${token.position}`);
        }
        const fieldName = token.value.toLowerCase();
        if (!ALLOWED_FIELDS[fieldName]) {
          throw new Error(
            `Unknown field "${token.value}". Allowed fields: ${Object.keys(ALLOWED_FIELDS).join(', ')}`
          );
        }

        const opToken = consume();
        if (opToken.type !== 'OPERATOR') {
          throw new Error(`Expected comparison operator after "${token.value}" at character ${opToken.position}`);
        }

        if (opToken.value.toLowerCase() === 'in') {
          // Expect ( val1, val2 )
          const lparen = consume();
          if (lparen.type !== 'LPAREN') {
            throw new Error(`Expected "(" after IN operator at character ${lparen.position}`);
          }
          const values: string[] = [];
          while (peek().type !== 'RPAREN' && peek().type !== 'EOF') {
            const valToken = consume();
            if (valToken.type === 'STRING' || valToken.type === 'IDENTIFIER' || valToken.type === 'NUMBER') {
              values.push(valToken.value);
            }
            if (peek().type === 'COMMA') consume();
          }
          if (peek().type === 'RPAREN') consume();
          return {
            type: 'comparison',
            field: fieldName,
            operator: 'in',
            value: values,
          };
        }

        const valToken = consume();
        if (
          valToken.type !== 'STRING' &&
          valToken.type !== 'IDENTIFIER' &&
          valToken.type !== 'NUMBER'
        ) {
          throw new Error(`Expected value after "${opToken.value}" at character ${valToken.position}`);
        }

        return {
          type: 'comparison',
          field: fieldName,
          operator: opToken.value,
          value: valToken.value,
        };
      };

      const parsePrimary = (): AstNode => {
        if (peek().type === 'LPAREN') {
          consume(); // '('
          const expr = parseOr();
          if (peek().type === 'RPAREN') {
            consume(); // ')'
          }
          return expr;
        }
        if (peek().type === 'NOT') {
          consume();
          return { type: 'unary', operator: 'NOT', left: parsePrimary() };
        }
        return parseComparison();
      };

      const parseAnd = (): AstNode => {
        let node = parsePrimary();
        while (peek().type === 'AND') {
          consume();
          const right = parsePrimary();
          node = { type: 'binary', operator: 'AND', left: node, right };
        }
        return node;
      };

      const parseOr = (): AstNode => {
        let node = parseAnd();
        while (peek().type === 'OR') {
          consume();
          const right = parseAnd();
          node = { type: 'binary', operator: 'OR', left: node, right };
        }
        return node;
      };

      let ast: AstNode | null = null;
      if (peek().type !== 'ORDER_BY' && peek().type !== 'EOF') {
        ast = parseOr();
      }

      if (peek().type === 'ORDER_BY') {
        consume(); // 'ORDER BY'
        const sortFieldToken = consume();
        const field = ALLOWED_FIELDS[sortFieldToken.value.toLowerCase()] || 'position';
        let dir: 1 | -1 = 1;
        if (peek().type === 'SORT_ORDER') {
          const orderToken = consume();
          dir = orderToken.value.toUpperCase() === 'DESC' ? -1 : 1;
        }
        sortClause = { field, direction: dir };
      }

      // Compile AST to Mongo
      const compileNode = async (node: AstNode): Promise<any> => {
        if (node.type === 'binary') {
          const l = await compileNode(node.left as AstNode);
          const r = await compileNode(node.right as AstNode);
          return node.operator === 'AND' ? { $and: [l, r] } : { $or: [l, r] };
        }

        if (node.type === 'unary') {
          const inner = await compileNode(node.left as AstNode);
          return { $nor: [inner] };
        }

        if (node.type === 'comparison') {
          const field = ALLOWED_FIELDS[node.field!] || node.field!;
          let val = node.value;

          // Replace 'me' or 'currentUser' with current user id
          if (
            (node.field === 'assignee' || node.field === 'reporter') &&
            typeof val === 'string' &&
            ['me', 'currentuser'].includes(val.toLowerCase())
          ) {
            val = currentUserId;
          } else if (
            (node.field === 'assignee' || node.field === 'reporter') &&
            typeof val === 'string' &&
            val.includes('@')
          ) {
            const user = await User.findOne({ email: val.toLowerCase() });
            val = user ? user._id : null;
          }

          if (node.operator === '=') {
            if (val === 'unassigned' || val === 'null') return { [field]: null };
            return { [field]: val };
          }
          if (node.operator === '!=') {
            if (val === 'unassigned' || val === 'null') return { [field]: { $ne: null } };
            return { [field]: { $ne: val } };
          }
          if (node.operator === 'in') {
            const inVals = Array.isArray(val) ? val : [val];
            return { [field]: { $in: inVals } };
          }
          if (node.operator === '~') {
            return { [field]: { $regex: val, $options: 'i' } };
          }
          if (node.operator === '>') {
            return { [field]: { $gt: isNaN(Number(val)) ? val : Number(val) } };
          }
          if (node.operator === '<') {
            return { [field]: { $lt: isNaN(Number(val)) ? val : Number(val) } };
          }
          if (node.operator === '>=') {
            return { [field]: { $gte: isNaN(Number(val)) ? val : Number(val) } };
          }
          if (node.operator === '<=') {
            return { [field]: { $lte: isNaN(Number(val)) ? val : Number(val) } };
          }
        }

        return {};
      };

      const compiledQuery = ast ? await compileNode(ast) : {};
      const finalMongoQuery = {
        project: projectId,
        ...compiledQuery,
      };

      const finalSort: Record<string, 1 | -1> = sortClause
        ? { [sortClause.field]: sortClause.direction }
        : { position: 1 };

      return {
        valid: true,
        ast,
        mongoQuery: finalMongoQuery,
        sort: finalSort,
      };
    } catch (err: any) {
      return {
        valid: false,
        error: err.message,
      };
    }
  }

  /** Provides intelligent autocomplete suggestions based on query cursor */
  getSuggestions(query: string): JqlSuggestion[] {
    const trimmed = query.trim();
    if (!trimmed) {
      return Object.keys(ALLOWED_FIELDS).map((f) => ({
        value: f,
        description: `Filter by ${f}`,
        category: 'field',
      }));
    }

    const tokens = this.tokenize(trimmed);
    const lastToken = tokens[tokens.length - 2] || tokens[0]; // before EOF

    if (!lastToken) return [];

    if (lastToken.type === 'IDENTIFIER') {
      const lower = lastToken.value.toLowerCase();
      if (ALLOWED_FIELDS[lower]) {
        return [
          { value: '=', description: 'Equals', category: 'operator' },
          { value: '!=', description: 'Does not equal', category: 'operator' },
          { value: 'in', description: 'In list of values', category: 'operator' },
          { value: '~', description: 'Contains text', category: 'operator' },
        ];
      }
    }

    if (lastToken.type === 'OPERATOR') {
      const prevToken = tokens[tokens.length - 3];
      if (prevToken && prevToken.type === 'IDENTIFIER') {
        const field = prevToken.value.toLowerCase();
        if (field === 'status') {
          return VALID_STATUSES.map((s) => ({ value: s, description: `Status: ${s}`, category: 'value' }));
        }
        if (field === 'priority') {
          return VALID_PRIORITIES.map((p) => ({ value: p, description: `Priority: ${p}`, category: 'value' }));
        }
        if (field === 'type') {
          return VALID_TYPES.map((t) => ({ value: t, description: `Type: ${t}`, category: 'value' }));
        }
        if (field === 'assignee') {
          return [
            { value: 'me', description: 'Assigned to current user', category: 'value' },
            { value: 'unassigned', description: 'No assignee', category: 'value' },
          ];
        }
      }
    }

    // Default: AND, OR, ORDER BY
    return [
      { value: 'AND', description: 'Logical AND condition', category: 'keyword' },
      { value: 'OR', description: 'Logical OR condition', category: 'keyword' },
      { value: 'ORDER BY', description: 'Sort results by field', category: 'keyword' },
    ];
  }
}

export const jqlService = new JqlService();
