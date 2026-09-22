const TOKEN_BOUNDARIES = new Set([' ', '\t', '\r', '\n']);
const SHELL_OPERATORS = new Set([';', '|', '&', '>', '<', '(', ')']);
const COMMAND_SEPARATORS = new Set([';', '|', '||', '&', '&&', '(', ')']);
const POSIX_SHELLS = new Set(['bash', 'sh', 'zsh', 'dash', 'ksh', 'fish']);
const COMMAND_WRAPPERS = new Set(['env', 'command', 'cmd', 'powershell', 'pwsh', 'wsl', ...POSIX_SHELLS]);
// Upper bound on the tokens produced while unwrapping nested commands.
// Nesting that needs more is treated as unanalyzable rather than expanded.
const EXPANSION_TOKEN_BUDGET = 4000;
const MAX_SUBSTITUTION_DEPTH = 16;
// Words that run the command after them, once their own options are skipped.
const COMMAND_PREFIXES = new Set(['sudo', 'doas', 'command', 'env', 'wsl', 'nohup', 'nice', 'timeout', 'time', 'exec']);
const ENV_ASSIGNMENT = /^[a-z_][a-z0-9_]*=/;
// find actions that run the tokens after them as a command.
const FIND_EXEC_ACTIONS = new Set(['-exec', '-execdir', '-ok', '-okdir']);
// xargs options that take the next token as their value (GNU and BSD).
const XARGS_VALUE_OPTIONS = new Set(['a', 'd', 'E', 'I', 'J', 'L', 'n', 'P', 'R', 'S', 's']);
const XARGS_LONG_VALUE_OPTIONS = new Set([
  '--arg-file', '--delimiter', '--max-args', '--max-chars', '--max-procs', '--process-slot-var'
]);
// Pathspecs that cover the whole working tree.
const WHOLE_TREE_PATHSPECS = new Set(['.', './', ':/', '*']);

function tokenizeShellCommand(command) {
  const tokens = [];
  let current = '';
  let quote = '';
  let escaped = false;

  const pushCurrent = () => {
    if (!current) return;
    tokens.push(current);
    current = '';
  };

  const input = String(command || '');
  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    if (escaped) {
      current += character;
      escaped = false;
      continue;
    }
    if (quote) {
      if (character === quote) quote = '';
      else if (character === '`') escaped = true;
      else current += character;
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      continue;
    }
    if (character === '`') {
      escaped = true;
      continue;
    }
    if (TOKEN_BOUNDARIES.has(character)) {
      pushCurrent();
      if (character === '\n' || character === '\r') tokens.push(';');
      continue;
    }
    if (SHELL_OPERATORS.has(character)) {
      pushCurrent();
      const canPair = character === '|' || character === '&' || character === '>' || character === '<';
      if (canPair && input[index + 1] === character) {
        tokens.push(character + character);
        index += 1;
      } else {
        tokens.push(character);
      }
      continue;
    }
    current += character;
  }
  pushCurrent();
  return tokens;
}

// Commands run by `...` and $(...) substitution, including inside double
// quotes. Single-quoted text is literal in POSIX shells and PowerShell.
function commandSubstitutions(command) {
  const input = String(command || '');
  const found = [];
  let doubleQuoted = false;
  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    if (character === "'" && !doubleQuoted) {
      const end = input.indexOf("'", index + 1);
      if (end < 0) break;
      index = end;
    } else if (character === '"') {
      doubleQuoted = !doubleQuoted;
    } else if (character === '`') {
      const end = input.indexOf('`', index + 1);
      if (end < 0) break;
      found.push(input.slice(index + 1, end));
      index = end;
    } else if (character === '$' && input[index + 1] === '(') {
      let depth = 0;
      let cursor = index + 1;
      for (; cursor < input.length; cursor += 1) {
        if (input[cursor] === '(') depth += 1;
        else if (input[cursor] === ')' && --depth === 0) break;
      }
      found.push(input.slice(index + 2, cursor));
      index = cursor;
    }
  }
  return found;
}

function tokenizeWithSubstitutions(command, budget, depth = 0) {
  const tokens = tokenizeShellCommand(command);
  for (const substitution of commandSubstitutions(command)) {
    if (budget.exceeded) break;
    if (depth >= MAX_SUBSTITUTION_DEPTH) {
      budget.exceeded = true;
      break;
    }
    const nested = tokenizeWithSubstitutions(substitution, budget, depth + 1);
    budget.remaining -= nested.length;
    if (budget.remaining < 0) {
      budget.exceeded = true;
      break;
    }
    tokens.push(';', ...nested);
  }
  return tokens;
}

function normalizeToken(token) {
  return String(token || '').trim().toLowerCase();
}

function commandName(token) {
  const normalized = normalizeToken(token);
  const slash = Math.max(normalized.lastIndexOf('/'), normalized.lastIndexOf('\\'));
  let name = slash >= 0 ? normalized.slice(slash + 1) : normalized;
  for (const suffix of ['.exe', '.cmd', '.bat', '.ps1']) {
    if (name.endsWith(suffix)) {
      name = name.slice(0, -suffix.length);
      break;
    }
  }
  return name;
}

function segmentEnd(tokens, start) {
  let end = start;
  while (end < tokens.length && !COMMAND_SEPARATORS.has(normalizeToken(tokens[end]))) end += 1;
  return end;
}

function xargsCommandStart(tokens, index, end) {
  let cursor = index + 1;
  while (cursor < end) {
    const token = String(tokens[cursor] || '');
    if (!token.startsWith('-') || token === '-') return cursor;
    if (token === '--') return cursor + 1;
    if (token.startsWith('--')) {
      cursor += XARGS_LONG_VALUE_OPTIONS.has(token) ? 2 : 1;
      continue;
    }
    // Short options can be bundled (-0n1); a value option with nothing
    // attached takes the next token.
    let takesNext = false;
    for (let offset = 1; offset < token.length; offset += 1) {
      if (!XARGS_VALUE_OPTIONS.has(token[offset])) continue;
      takesNext = offset === token.length - 1;
      break;
    }
    cursor += takesNext ? 2 : 1;
  }
  return end;
}

function segmentStart(tokens, index) {
  let start = index;
  while (start > 0 && !COMMAND_SEPARATORS.has(normalizeToken(tokens[start - 1]))) start -= 1;
  return start;
}

function isCommandStringFlag(wrapper, flag) {
  if (flag === '-c' || flag === '/c' || flag === '-command') return true;
  if (wrapper === 'cmd') return flag === '/k';
  // POSIX shells accept -c bundled with other options, as in `bash -lc`.
  return POSIX_SHELLS.has(wrapper) && /^-[a-z]*c[a-z]*$/.test(flag);
}

function expandWrappedCommands(tokens, budget) {
  const expanded = [...tokens];
  const pushNested = nested => {
    if (nested.length === 0 || budget.exceeded) return;
    budget.remaining -= nested.length;
    if (budget.remaining < 0) {
      budget.exceeded = true;
      return;
    }
    expanded.push(';', ...expandWrappedCommands(nested, budget));
  };
  for (let index = 0; index < tokens.length - 1 && !budget.exceeded; index += 1) {
    const token = normalizeToken(tokens[index]);
    if (FIND_EXEC_ACTIONS.has(token)) {
      pushNested(tokens.slice(index + 1, segmentEnd(tokens, index + 1)));
      continue;
    }
    if (commandName(token) === 'xargs' && (index === 0 || COMMAND_SEPARATORS.has(normalizeToken(tokens[index - 1])))) {
      const end = segmentEnd(tokens, index + 1);
      pushNested(tokens.slice(xargsCommandStart(tokens, index, end), end));
      continue;
    }
    if (!token.startsWith('-') && !token.startsWith('/')) continue;
    // The nearest wrapper before the flag owns it: `nohup bash -c "..."`.
    const wrapper = tokens.slice(segmentStart(tokens, index), index)
      .map(commandName)
      .reverse()
      .find(name => COMMAND_WRAPPERS.has(name));
    if (!wrapper || !isCommandStringFlag(wrapper, token)) continue;
    pushNested(tokenizeWithSubstitutions(tokens.slice(index + 1, segmentEnd(tokens, index + 1)).join(' '), budget));
  }
  return expanded;
}

function commandEntries(tokens) {
  const entries = [];
  let expectCommand = true;
  let afterPrefix = false;
  for (let index = 0; index < tokens.length; index += 1) {
    const token = normalizeToken(tokens[index]);
    if (!token) continue;
    if (COMMAND_SEPARATORS.has(token)) {
      expectCommand = true;
      afterPrefix = false;
      continue;
    }
    if (!expectCommand) continue;
    // `command -v name` only looks the name up; it does not run it.
    if (afterPrefix && token === '-v' && entries.at(-1)?.name === 'command') {
      expectCommand = false;
      afterPrefix = false;
      continue;
    }
    // `FOO=1 cmd`, and the options or durations of a prefix such as
    // `nice -n 5 cmd` or `timeout 10 cmd`, come before the real command.
    if (ENV_ASSIGNMENT.test(token)) continue;
    if (afterPrefix && (token.startsWith('-') || /^\d/.test(token))) continue;
    const name = commandName(token);
    if (!name) continue;
    entries.push({ name, index });
    afterPrefix = COMMAND_PREFIXES.has(name);
    expectCommand = afterPrefix;
  }
  return entries;
}

function commandArguments(tokens, index) {
  const args = [];
  for (let cursor = index + 1; cursor < tokens.length; cursor += 1) {
    const token = normalizeToken(tokens[cursor]);
    if (COMMAND_SEPARATORS.has(token)) break;
    if (token) args.push(token);
  }
  return args;
}

function includesAny(values, expected) {
  return values.some(value => expected.has(value));
}

// powershell and pwsh take -EncodedCommand, its -e/-ec aliases or any
// unambiguous prefix of it, led by - or /.
function isEncodedCommandFlag(arg) {
  const name = arg.replace(/^(?:--|-|\/)/, '');
  if (name === arg) return false;
  return name === 'e' || name === 'ec' || (name.length >= 2 && 'encodedcommand'.startsWith(name));
}

function highRisk(category, reason) {
  return { level: 'high', requiresApproval: true, category, reason };
}

function classifyDelegatedShellCommand(command) {
  const budget = { remaining: EXPANSION_TOKEN_BUDGET, exceeded: false };
  const initialTokens = tokenizeWithSubstitutions(command, budget);
  if (initialTokens.length === 0) return highRisk('invalid', '命令为空或无法解析。');

  const tokens = expandWrappedCommands(initialTokens, budget);
  if (budget.exceeded) return highRisk('invalid', '命令嵌套过深，无法完成本地风险判定。');
  const entries = commandEntries(tokens);
  const names = new Set(entries.map(entry => entry.name));

  if (names.has('sudo') || names.has('doas') || names.has('runas')) {
    return highRisk('elevation', '命令请求提升系统权限。');
  }

  const destructiveFiles = new Set(['rm', 'rmdir', 'rd', 'del', 'erase', 'ri', 'remove-item', 'rp', 'remove-itemproperty']);
  if (includesAny(entries.map(entry => entry.name), destructiveFiles)
      || entries.some(entry => entry.name === 'find' && commandArguments(tokens, entry.index).includes('-delete'))) {
    return highRisk('file_delete', '命令会删除文件、目录或系统属性。');
  }

  const diskAndSystem = new Set([
    'format', 'diskpart', 'dd', 'clear-disk', 'initialize-disk', 'format-volume',
    'shutdown', 'restart-computer', 'stop-computer', 'set-executionpolicy',
    'bcdedit', 'cipher', 'reg', 'sc'
  ]);
  for (const entry of entries) {
    if (entry.name.startsWith('mkfs')) return highRisk('disk', '命令会修改磁盘或文件系统。');
    if (!diskAndSystem.has(entry.name)) continue;
    const args = commandArguments(tokens, entry.index);
    if (entry.name === 'reg' && args[0] !== 'delete') continue;
    if (entry.name === 'sc' && args[0] !== 'delete' && args[0] !== 'stop') continue;
    return highRisk('system', '命令会修改磁盘、系统配置或电源状态。');
  }

  for (const entry of entries) {
    const args = commandArguments(tokens, entry.index);
    if (entry.name === 'git') {
      const operation = args[0] || '';
      if (operation === 'reset' && args.includes('--hard')) return highRisk('git_destructive', '命令会丢弃本地 Git 修改。');
      if (operation === 'clean' && args.some(arg => arg.startsWith('-') && arg.includes('f'))) return highRisk('git_destructive', '命令会永久删除未跟踪文件。');
      if (operation === 'push') {
        const refspecs = args.slice(1).filter(arg => !arg.startsWith('-'));
        // Short options bundle (`-fu`), and a leading + forces one refspec.
        if (args.some(arg => arg === '--force' || arg.startsWith('--force-with-lease') || /^-[a-z0-9]*f[a-z0-9]*$/.test(arg))
            || refspecs.some(arg => arg.startsWith('+'))) {
          return highRisk('git_remote', '命令会强制改写远程 Git 历史。');
        }
        // Pushing an empty source (`:branch`) deletes the remote branch.
        if (args.some(arg => arg === '--delete' || arg === '--mirror' || arg === '--prune' || /^-[a-z0-9]*d[a-z0-9]*$/.test(arg))
            || refspecs.some(arg => arg.length > 1 && arg.startsWith(':'))) {
          return highRisk('git_remote', '命令会删除远程 Git 分支或引用。');
        }
      }
      if (operation === 'restore' && !args.includes('--staged')) return highRisk('git_destructive', '命令可能丢弃本地文件修改。');
      if (operation === 'branch' && includesAny(args, new Set(['-d', '--delete']))) return highRisk('git_destructive', '命令会删除 Git 分支。');
      // `git checkout -- <path>` and whole-tree pathspecs discard local
      // edits just like restore.
      if (operation === 'checkout' && (args.includes('--') || args.includes('-f') || args.includes('--force')
          || args.slice(1).some(arg => WHOLE_TREE_PATHSPECS.has(arg)))) {
        return highRisk('git_destructive', '命令会丢弃本地文件修改。');
      }
      // Dropped stashes are unrecoverable: they hold uncommitted work.
      if (operation === 'stash' && includesAny(args, new Set(['drop', 'clear']))) {
        return highRisk('git_destructive', '命令会永久丢弃暂存（stash）的修改。');
      }
      // Only forced worktree removal deletes in-progress builder work; a plain
      // remove fails safely on dirty worktrees.
      if (operation === 'worktree' && args[1] === 'remove' && includesAny(args, new Set(['-f', '--force']))) {
        return highRisk('git_destructive', '命令会强制删除任务工作树及其未提交修改。');
      }
      if (operation === 'filter-branch' || operation === 'filter-repo') {
        return highRisk('git_destructive', '命令会改写全部 Git 历史。');
      }
    }
    if (entry.name === 'docker') {
      const operation = args[0] || '';
      if (operation === 'system' && args[1] === 'prune') return highRisk('container_delete', '命令会批量删除 Docker 资源。');
      if (operation === 'volume' && (args[1] === 'rm' || args[1] === 'prune')) return highRisk('container_delete', '命令会删除 Docker 数据卷。');
    }
    if (entry.name === 'kubectl' && args[0] === 'delete') return highRisk('cluster_delete', '命令会删除集群资源。');
    if (entry.name === 'terraform' && args[0] === 'destroy') return highRisk('infrastructure_delete', '命令会销毁基础设施资源。');
    if (entry.name === 'start-process' && args.includes('-verb') && args.includes('runas')) {
      return highRisk('elevation', '命令请求提升系统权限。');
    }
    if ((entry.name === 'powershell' || entry.name === 'pwsh') && args.some(isEncodedCommandFlag)) {
      return highRisk('dynamic_execution', '命令以编码形式执行，无法检查实际内容。');
    }
  }

  const hasPipe = tokens.some(token => token === '|');
  const downloaders = new Set(['curl', 'wget', 'iwr', 'invoke-webrequest']);
  const interpreters = new Set(['sh', 'bash', 'powershell', 'pwsh', 'iex', 'invoke-expression']);
  if (hasPipe && includesAny(entries.map(entry => entry.name), downloaders)
      && includesAny(entries.map(entry => entry.name), interpreters)) {
    return highRisk('remote_execution', '命令会下载远程内容并直接执行。');
  }
  if (names.has('invoke-expression') || names.has('iex')) {
    return highRisk('dynamic_execution', '命令会动态执行生成的代码。');
  }

  for (let index = 0; index < tokens.length - 1; index += 1) {
    if (tokens[index] !== '>' && tokens[index] !== '>>') continue;
    const target = normalizeToken(tokens[index + 1]);
    if (target.startsWith('/dev/sd') || target.startsWith('\\\\.\\physicaldrive')) {
      return highRisk('disk', '命令会直接写入磁盘设备。');
    }
  }

  return { level: 'normal', requiresApproval: false, category: 'normal', reason: '' };
}

module.exports = { classifyDelegatedShellCommand };
