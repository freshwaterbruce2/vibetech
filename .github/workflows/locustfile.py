from locust import HttpUser, task, between
import os

class LearningSystemUser(HttpUser):
    """Load testing for Learning System API"""

    wait_time = between(1, 3)

    def on_start(self):
        """Setup: Get auth token"""
        self.token = os.getenv("DATABASE_API_TOKEN", "test-token")
        self.headers = {"Authorization": f"Bearer {self.token}"}

    @task(3)
    def get_health(self):
        """Health check (no auth required)"""
        self.client.get("/api/health")

    @task(5)
    def get_mistakes(self):
        """Get mistakes list"""
        self.client.get("/api/mistakes?limit=50", headers=self.headers)

    @task(3)
    def get_mistakes_filtered(self):
        """Get filtered mistakes"""
        self.client.get(
            "/api/mistakes?platform=node&severity=high&limit=20",
            headers=self.headers
        )

    @task(4)
    def get_knowledge(self):
        """Get knowledge entries"""
        self.client.get("/api/knowledge?limit=50", headers=self.headers)

    @task(2)
    def get_knowledge_filtered(self):
        """Get filtered knowledge"""
        self.client.get(
            "/api/knowledge?category=best_practices&limit=20",
            headers=self.headers
        )

    @task(1)
    def get_statistics(self):
        """Get statistics"""
        self.client.get("/api/statistics", headers=self.headers)

    @task(1)
    def get_metrics(self):
        """Get Prometheus metrics (no auth)"""
        self.client.get("/metrics")

    @task(1)
    def post_mistake(self):
        """Log a mistake"""
        self.client.post(
            "/api/mistakes",
            json={
                "type": "load_test",
                "description": "Load testing mistake",
                "severity": "low",
                "platform": "testing",
                "app_source": "locust"
            },
            headers=self.headers
        )
