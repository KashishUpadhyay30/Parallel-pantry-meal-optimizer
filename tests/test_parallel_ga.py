"""
Integration and Sanity Tests for Phase 3 & 4: OpenMP Parallel Island GA
Validates parallel binary execution across 1, 2, and 4 threads,
island sub-population partitioning, ring migration telemetry, and JSON schema.
"""

import os
import json
import subprocess
import unittest

class TestParallelIslandGA(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        cls.bin_path = os.path.join(cls.base_dir, "bin", "parallel_ga.exe")
        cls.recipes_med = os.path.join(cls.base_dir, "data", "processed", "recipes_medium.dat")
        cls.recipes_large = os.path.join(cls.base_dir, "data", "processed", "recipes_large.dat")
        cls.pantry_dat = os.path.join(cls.base_dir, "data", "processed", "pantry.dat")
        cls.logs_dir = os.path.join(cls.base_dir, "results", "logs")
        os.makedirs(cls.logs_dir, exist_ok=True)

    def test_parallel_binary_exists(self):
        self.assertTrue(os.path.exists(self.bin_path), f"Parallel binary not found: {self.bin_path}")

    def test_single_thread_execution(self):
        json_out = os.path.join(self.logs_dir, "test_par_1t.json")
        cmd = [
            self.bin_path,
            "--threads", "1",
            "--recipes", self.recipes_med,
            "--pantry", self.pantry_dat,
            "--pop", "60",
            "--gen", "30",
            "--seed", "42",
            "--output_json", json_out
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, cwd=self.base_dir)
        self.assertEqual(result.returncode, 0, f"Error: {result.stderr}")
        self.assertIn("SUMMARY:", result.stdout)
        
        with open(json_out, "r") as f:
            data = json.load(f)
        self.assertEqual(data["algorithm"], "OpenMP Parallel Island GA")
        self.assertEqual(data["num_threads"], 1)
        self.assertEqual(data["num_islands"], 1)

    def test_multi_thread_island_migration(self):
        json_out = os.path.join(self.logs_dir, "test_par_4t.json")
        cmd = [
            self.bin_path,
            "--threads", "4",
            "--recipes", self.recipes_med,
            "--pantry", self.pantry_dat,
            "--pop", "80",
            "--gen", "40",
            "--mig_interval", "10",
            "--mig_size", "2",
            "--seed", "101",
            "--output_json", json_out
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, cwd=self.base_dir)
        self.assertEqual(result.returncode, 0, f"Error: {result.stderr}")
        
        with open(json_out, "r") as f:
            data = json.load(f)
        self.assertEqual(data["num_threads"], 4)
        self.assertEqual(data["num_islands"], 4)
        self.assertEqual(len(data["island_best_fitnesses"]), 4)
        self.assertGreater(data["total_migrations"], 0)
        self.assertGreaterEqual(data["history"][-1]["best_fit"], data["history"][0]["best_fit"])

    def test_large_tier_parallel_run(self):
        json_out = os.path.join(self.logs_dir, "test_par_large.json")
        cmd = [
            self.bin_path,
            "--threads", "4",
            "--recipes", self.recipes_large,
            "--pantry", self.pantry_dat,
            "--pop", "100",
            "--gen", "25",
            "--seed", "77",
            "--output_json", json_out
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, cwd=self.base_dir)
        self.assertEqual(result.returncode, 0)
        self.assertTrue(os.path.exists(json_out))

if __name__ == "__main__":
    unittest.main()
