/**
 * Workflow Engine Server
 * Orchestrates multi-step workflows across NOVA and Vibe
 *
 * Port: 5003
 * Created: 2025-11-10
 * Part of P3.4: Automation & Workflows
 */

import cors from 'cors';
import express from 'express';
import sqlite3 from 'sqlite3';
import { WebSocket } from 'ws';

const app = express();
const PORT = 5003;
const DATABASE_PATH = 'D:\\databases\\database.db';

app.use(cors());
app.use(express.json());

// Database connection
function getDb() {
    return new sqlite3.Database(DATABASE_PATH);
}

// Workflow State Machine
class WorkflowEngine {
    constructor() {
        this.activeWorkflows = new Map(); // workflow_id => state
        this.ipcBridgeWs = null;
        this.connectToIPCBridge();
    }

    connectToIPCBridge() {
        // Connect to IPC Bridge for sending commands
        try {
            this.ipcBridgeWs = new WebSocket('ws://localhost:5004');

            this.ipcBridgeWs.on('open', () => {
                console.log('[OK] Connected to IPC Bridge');
            });

            this.ipcBridgeWs.on('error', (err) => {
                console.log('[WARN] IPC Bridge not available:', err.message);
            });
        } catch (error) {
            console.log('[WARN] Could not connect to IPC Bridge');
        }
    }

    async startWorkflow(templateId, context = {}) {
        const db = getDb();

        return new Promise((resolve, reject) => {
            // Get template
            db.get(
                'SELECT * FROM workflow_templates WHERE id = ?',
                [templateId],
                async (err, template) => {
                    if (err) {
                        db.close();
                        return reject(err);
                    }

                    if (!template) {
                        db.close();
                        return reject(new Error('Template not found'));
                    }

                    const steps = JSON.parse(template.steps);

                    // Create workflow instance
                    db.run(
                        `INSERT INTO workflow_instances
                         (template_id, workflow_name, state_data, status)
                         VALUES (?, ?, ?, ?)`,
                        [templateId, template.name, JSON.stringify(context), 'in_progress'],
                        function (err) {
                            if (err) {
                                db.close();
                                return reject(err);
                            }

                            const workflowId = this.lastID;

                            // Create pending steps
                            const stmt = db.prepare(
                                `INSERT INTO workflow_steps
                                 (workflow_id, step_index, step_name, app_source, status)
                                 VALUES (?, ?, ?, ?, ?)`
                            );

                            steps.forEach((step, index) => {
                                stmt.run(
                                    workflowId,
                                    index,
                                    step.name,
                                    step.app,
                                    'pending'
                                );
                            });

                            stmt.finalize();

                            // Update template usage
                            db.run(
                                'UPDATE workflow_templates SET usage_count = usage_count + 1 WHERE id = ?',
                                [templateId]
                            );

                            db.close();

                            // Store in active workflows
                            this.activeWorkflows.set(workflowId, {
                                id: workflowId,
                                templateId,
                                steps,
                                currentStep: 0,
                                context
                            });

                            resolve({
                                workflowId,
                                name: template.name,
                                steps: steps.length,
                                status: 'started'
                            });
                        }
                    );
                }
            );
        });
    }

    async executeNextStep(workflowId) {
        const workflow = this.activeWorkflows.get(workflowId);
        if (!workflow) {
            throw new Error('Workflow not found');
        }

        const step = workflow.steps[workflow.currentStep];
        if (!step) {
            // Workflow complete
            return this.completeWorkflow(workflowId);
        }

        const db = getDb();

        return new Promise((resolve, reject) => {
            // Update step status to in_progress
            const stepStartTime = new Date().toISOString();

            db.run(
                `UPDATE workflow_steps
                 SET status = ?, started_at = ?
                 WHERE workflow_id = ? AND step_index = ?`,
                ['in_progress', stepStartTime, workflowId, workflow.currentStep],
                async (err) => {
                    if (err) {
                        db.close();
                        return reject(err);
                    }

                    // Execute step (simulated for now)
                    console.log(`[STEP] ${step.name} (${step.app}) - ${step.action}`);

                    // Simulate step execution
                    await new Promise(resolve => setTimeout(resolve, 500));

                    // Mark step complete
                    const stepEndTime = new Date().toISOString();
                    const duration = 1; // seconds (simulated)

                    db.run(
                        `UPDATE workflow_steps
                         SET status = ?, completed_at = ?, duration_seconds = ?,
                             output_data = ?
                         WHERE workflow_id = ? AND step_index = ?`,
                        [
                            'completed',
                            stepEndTime,
                            duration,
                            JSON.stringify({ result: 'success', simulated: true }),
                            workflowId,
                            workflow.currentStep
                        ],
                        (err) => {
                            db.close();

                            if (err) return reject(err);

                            // Move to next step
                            workflow.currentStep++;

                            // Update workflow instance
                            const db2 = getDb();
                            db2.run(
                                `UPDATE workflow_instances
                                 SET current_step = ?, updated_at = CURRENT_TIMESTAMP
                                 WHERE id = ?`,
                                [workflow.currentStep, workflowId],
                                (err) => {
                                    db2.close();
                                    if (err) return reject(err);

                                    resolve({
                                        workflowId,
                                        step: step.name,
                                        status: 'completed',
                                        nextStep: workflow.currentStep < workflow.steps.length
                                            ? workflow.steps[workflow.currentStep].name
                                            : 'complete'
                                    });
                                }
                            );
                        }
                    );
                }
            );
        });
    }

    async completeWorkflow(workflowId) {
        const db = getDb();

        return new Promise((resolve, reject) => {
            db.run(
                `UPDATE workflow_instances
                 SET status = ?, completed_at = CURRENT_TIMESTAMP
                 WHERE id = ?`,
                ['completed', workflowId],
                (err) => {
                    db.close();

                    if (err) return reject(err);

                    this.activeWorkflows.delete(workflowId);

                    resolve({
                        workflowId,
                        status: 'completed',
                        message: 'Workflow completed successfully'
                    });
                }
            );
        });
    }
}

const engine = new WorkflowEngine();

// API Endpoints

app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'workflow-engine',
        version: '1.0.0',
        active_workflows: engine.activeWorkflows.size
    });
});

// Get all workflow templates
app.get('/api/templates', (req, res) => {
    const db = getDb();

    db.all('SELECT * FROM workflow_templates ORDER BY category, name', (err, templates) => {
        db.close();

        if (err) {
            return res.status(500).json({ error: err.message });
        }

        res.json({
            templates: templates.map(t => ({
                ...t,
                steps: JSON.parse(t.steps)
            })),
            count: templates.length
        });
    });
});

// Start a workflow
app.post('/api/workflows/start', async (req, res) => {
    try {
        const { template_id, context } = req.body;

        if (!template_id) {
            return res.status(400).json({ error: 'template_id required' });
        }

        const result = await engine.startWorkflow(template_id, context || {});
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Execute next step in workflow
app.post('/api/workflows/:id/next', async (req, res) => {
    try {
        const workflowId = parseInt(req.params.id);
        const result = await engine.executeNextStep(workflowId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get workflow status
app.get('/api/workflows/:id', (req, res) => {
    const workflowId = parseInt(req.params.id);
    const db = getDb();

    db.get(
        'SELECT * FROM workflow_instances WHERE id = ?',
        [workflowId],
        (err, workflow) => {
            if (err) {
                db.close();
                return res.status(500).json({ error: err.message });
            }

            if (!workflow) {
                db.close();
                return res.status(404).json({ error: 'Workflow not found' });
            }

            // Get steps
            db.all(
                'SELECT * FROM workflow_steps WHERE workflow_id = ? ORDER BY step_index',
                [workflowId],
                (err, steps) => {
                    db.close();

                    if (err) {
                        return res.status(500).json({ error: err.message });
                    }

                    res.json({
                        ...workflow,
                        state_data: JSON.parse(workflow.state_data || '{}'),
                        steps: steps.map(s => ({
                            ...s,
                            output_data: s.output_data ? JSON.parse(s.output_data) : null
                        }))
                    });
                }
            );
        }
    );
});

// Get active workflows
app.get('/api/workflows/active', (req, res) => {
    const db = getDb();

    db.all(
        `SELECT * FROM workflow_instances
         WHERE status IN ('pending', 'in_progress')
         ORDER BY started_at DESC`,
        (err, workflows) => {
            db.close();

            if (err) {
                return res.status(500).json({ error: err.message });
            }

            res.json({
                workflows,
                count: workflows.length
            });
        }
    );
});

// Workflow history
app.get('/api/workflows/history', (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    const db = getDb();

    db.all(
        `SELECT wi.*, wt.name as template_name, wt.category
         FROM workflow_instances wi
         JOIN workflow_templates wt ON wi.template_id = wt.id
         ORDER BY wi.started_at DESC LIMIT ?`,
        [limit],
        (err, workflows) => {
            db.close();

            if (err) {
                return res.status(500).json({ error: err.message });
            }

            res.json({
                workflows,
                count: workflows.length
            });
        }
    );
});

// Start server
app.listen(PORT, () => {
    console.log(`\n[OK] Workflow Engine`);
    console.log(`[OK] Listening on http://127.0.0.1:${PORT}`);
    console.log(`[OK] Database: ${DATABASE_PATH}`);
    console.log(`\n[OK] Endpoints:`);
    console.log(`     GET  /api/health`);
    console.log(`     GET  /api/templates`);
    console.log(`     POST /api/workflows/start`);
    console.log(`     POST /api/workflows/:id/next`);
    console.log(`     GET  /api/workflows/:id`);
    console.log(`     GET  /api/workflows/active`);
    console.log(`     GET  /api/workflows/history`);
    console.log(`\n`);
});
