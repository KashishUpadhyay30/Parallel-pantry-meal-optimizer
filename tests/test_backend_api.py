"""
Integration Tests for FastAPI Backend REST Endpoints
Validates pantry CRUD, C++ optimizer bridge, performance metrics, and dynamic re-optimization.
"""

import unittest
from fastapi.testclient import TestClient
from backend.main import app

class TestBackendAPI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_root_endpoint(self):
        resp = self.client.get("/")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["status"], "online")

    def test_get_pantry(self):
        resp = self.client.get("/pantry")
        self.assertEqual(resp.status_code, 200)
        items = resp.json()
        self.assertIsInstance(items, list)
        self.assertGreater(len(items), 0)

    def test_pantry_crud_flow(self):
        # 1. Add item
        new_item = {
            "ingredient_name": "Test Honeycomb",
            "quantity": 250.0,
            "unit": "g",
            "days_to_expiry": 3,
            "estimated_unit_cost": 0.02,
            "category": "Pantry",
            "perishability_hazard": 3.0
        }
        res_add = self.client.post("/pantry", json=new_item)
        self.assertEqual(res_add.status_code, 201)
        added_data = res_add.json()
        item_id = added_data["id"]
        self.assertEqual(added_data["ingredient_name"], "Test Honeycomb")

        # 2. Update item
        res_up = self.client.put(f"/pantry/{item_id}", json={"quantity": 180.0, "days_to_expiry": 1})
        self.assertEqual(res_up.status_code, 200)
        self.assertEqual(res_up.json()["quantity"], 180.0)

        # 3. Delete item
        res_del = self.client.delete(f"/pantry/{item_id}")
        self.assertEqual(res_del.status_code, 200)

    def test_optimize_endpoint_parallel(self):
        req_payload = {
            "algorithm": "parallel",
            "num_threads": 4,
            "dataset_tier": "small",
            "population_size": 40,
            "generations": 30,
            "target_calories": 2000.0,
            "target_protein": 130.0,
            "target_carbs": 220.0,
            "target_fat": 65.0
        }
        resp = self.client.post("/optimize", json=req_payload)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["algorithm"], "OpenMP Parallel Island GA")
        self.assertEqual(len(data["recommendations"]), 4)
        self.assertGreater(data["nutrition_satisfaction_percent"], 50.0)

    def test_performance_and_experiments(self):
        resp = self.client.get("/performance")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIsInstance(data, list)
        self.assertEqual(len(data), 4)

        resp_exp = self.client.get("/experiments")
        self.assertEqual(resp_exp.status_code, 200)
        self.assertEqual(resp_exp.json()["total_scenarios"], 4)

    def test_simulate_pantry_change(self):
        sim_payload = {
            "action": "spoil_warning",
            "ingredient_name": "Spinach"
        }
        resp = self.client.post("/simulate-pantry-change", json=sim_payload)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("dynamic_reoptimization", data)
        self.assertEqual(len(data["dynamic_reoptimization"]["recommendations"]), 4)

if __name__ == "__main__":
    unittest.main()
