import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';

const MEMORY_BANK_PATH = 'C:\\dev\\projects\\active\\web-apps\\memory-bank';
const RECENT_TASKS_PATH = `${MEMORY_BANK_PATH}\\quick-access\\recent-tasks.json`;
const LAST_SESSION_PATH = `${MEMORY_BANK_PATH}\\quick-access\\last-session.json`;

interface Task {
  content: string;
  project?: string;
  category?: string;
  status: string;
  timestamp: string;
  complexity?: string;
}

interface GetRecentTasksArgs {
  limit?: number;
  project?: string;
}

interface SaveTaskArgs {
  content: string;
  project?: string;
  category?: string;
  status?: string;
}

export async function getRecentTasks(args: GetRecentTasksArgs) {
  try {
    if (!existsSync(RECENT_TASKS_PATH)) {
      return {
        content: [
          {
            type: 'text',
            text: 'No recent tasks found. Memory bank is empty.',
          },
        ],
      };
    }

    const data = await readFile(RECENT_TASKS_PATH, 'utf-8');
    let tasks: Task[] = JSON.parse(data);

    // Filter by project if specified
    if (args.project) {
      tasks = tasks.filter((t) => t.project === args.project);
    }

    // Limit results
    const limit = args.limit || 5;
    tasks = tasks.slice(0, limit);

    const results = ['📝 **Recent Tasks**:\n'];

    tasks.forEach((task, index) => {
      const statusEmoji = task.status === 'completed' ? '✅' : task.status === 'in_progress' ? '🔄' : '⏳';
      const projectTag = task.project ? `[${task.project}]` : '';
      const categoryTag = task.category ? `(${task.category})` : '';

      results.push(
        `${index + 1}. ${statusEmoji} ${task.content} ${projectTag} ${categoryTag}\n   ${new Date(task.timestamp).toLocaleString()}`
      );
    });

    return {
      content: [
        {
          type: 'text',
          text: results.join('\n'),
        },
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text',
          text: `Error retrieving recent tasks: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
}

export async function getSessionContext() {
  try {
    if (!existsSync(LAST_SESSION_PATH)) {
      return {
        content: [
          {
            type: 'text',
            text: 'No previous session found. This is a fresh start!',
          },
        ],
      };
    }

    const data = await readFile(LAST_SESSION_PATH, 'utf-8');
    const session = JSON.parse(data);

    const results = [
      '🔄 **Last Session Context**:\n',
      `📅 Date: ${new Date(session.timestamp).toLocaleString()}`,
      `📁 Project: ${session.project || 'Unknown'}`,
      `📝 Activity: ${session.activity || 'No description'}`,
      '',
      '💡 **Resume Work**:',
      session.next_steps || 'No next steps recorded',
    ];

    return {
      content: [
        {
          type: 'text',
          text: results.join('\n'),
        },
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text',
          text: `Error retrieving session context: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
}

export async function saveTask(args: SaveTaskArgs) {
  try {
    let tasks: Task[] = [];

    if (existsSync(RECENT_TASKS_PATH)) {
      const data = await readFile(RECENT_TASKS_PATH, 'utf-8');
      tasks = JSON.parse(data);
    }

    const newTask: Task = {
      content: args.content,
      project: args.project,
      category: args.category || 'general',
      status: args.status || 'pending',
      timestamp: new Date().toISOString(),
    };

    // Add to beginning of array
    tasks.unshift(newTask);

    // Keep only last 50 tasks
    tasks = tasks.slice(0, 50);

    await writeFile(RECENT_TASKS_PATH, JSON.stringify(tasks, null, 2), 'utf-8');

    return {
      content: [
        {
          type: 'text',
          text: `✅ Task saved to memory bank:\n"${args.content}"`,
        },
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text',
          text: `Error saving task: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
}
