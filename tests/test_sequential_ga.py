"""
Integration and Sanity Tests for Phase 2: Sequential GA
Validates compilation artifacts, executable execution, deterministic behavior,
convergence progression, and JSON telemetry schema.
"""

import os
import json
import subprocess
import unittest

class TestSequentialGA(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        cls.bin_path = os.path.join(cls.base_dir, "bin", "sequential_ga.exe")
        cls.recipes_small = os.path.join(cls.base_dir, "data", "processed", "recipes_small.dat")
        cls.recipes_med = os.path.join(cls.base_dir, "data", "processed", "recipes_medium.dat")
        cls.recipes_large = os.path.join(cls.base_dir, "data", "processed", "recipes_large.dat")
        cls.pantry_dat = os.path.join(cls.base_dir, "data", "processed", "pantry.dat")
        cls.logs_dir = os.path.join(cls.base_dir, "results", "logs")
        os.makedirs(cls.logs_dir, exist_ok=True)

    def test_binary_exists(self):
        self.assertTrue(os.path.exists(self.bin_path), f"Binary not found: {self.bin_path}")

    def test_execution_small_tier(self):
        json_out = os.path.join(self.logs_dir, "test_seq_small.json")
        cmd = [
            self.bin_path,
            "--recipes", self.recipes_small,
            "--pantry", self.pantry_dat,
            "--pop", "50",
            "--gen", "40",
            "--seed", "123",
            "--output_json", json_out
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, cwd=self.base_dir)
        self.assertEqual(result.returncode, 0, f"Error: {result.stderr}")
        self.assertIn("SUMMARY:", result.stdout)
        self.assertTrue(os.path.exists(json_out))

        with open(json_out, "r") as f:
            data = json.load(f)
        self.assertEqual(data["algorithm"], "Sequential GA")
        self.assertEqual(len(data["history"]), 40)
        self.assertGreater(data["execution_time_ms"], 0.0)
        self.assertGreaterEqual(data["history"][-1]["best_fit"], data["history"][0]["best_fit"])

    def test_deterministic_reproducibility(self):
        json1 = os.path.join(self.logs_dir, "test_rep1.json")
        json2 = os.path.join(self.logs_dir, "test_rep2.json")

        cmd1 = [self.bin_path, "--recipes", self.recipes_med, "--pantry", self.pantry_dat, "--pop", "60", "--gen", "30", "--seed", "999", "--output_json", json1]
        cmd2 = [self.bin_path, "--recipes", self.recipes_med, "--pantry", self.pantry_dat, "--pop", "60", "--gen", "30", "--seed", "999", "--output_json", json2]

        subprocess.run(cmd1, check=True, cwd=self.base_dir)
        subprocess.run(cmd2, check=True, cwd=self.base_dir)

        with open(json1, "r") as f1, open(json2, "r") as f2:
            d1 = json.load(f1)
            d2 = json.load(f2)

        self.assertAlmostEqual(d1["best_fitness"], d2["best_fitness"], places=4)
        self.assertEqual(d1["selected_recipes"], d2["selected_recipes"])

    def test_execution_large_tier(self):
        json_out = os.path.join(self.logs_dir, "test_seq_large.json")
        cmd = [
            self.bin_path,
            "--recipes", self.recipes_large,
            "--pantry", self.pantry_dat,
            "--pop", "80",
            "--gen", "30",
            "--seed", "42",
            "--output_json", json_out
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, cwd=self.base_dir)
        self.assertEqual(result.returncode, 0)
        self.assertTrue(os.path.exists(json_out))

if __name__ == "__main__":
    unittest.main()
