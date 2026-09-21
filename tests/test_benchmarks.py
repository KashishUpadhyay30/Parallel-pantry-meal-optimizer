"""
Integration and Verification Tests for Phase 5 & 6: Benchmarks and Tables
Validates benchmark JSON/CSV outputs, table schema, and positive speedup metrics.
"""

import os
import json
import csv
import unittest

class TestHPCBenchmarks(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        cls.tables_dir = os.path.join(cls.base_dir, "results", "tables")
        cls.csv_path = os.path.join(cls.tables_dir, "benchmark_results_summary.csv")
        cls.json_path = os.path.join(cls.tables_dir, "benchmark_results_summary.json")
        cls.md_path = os.path.join(cls.tables_dir, "benchmark_results_table.md")

    def test_benchmark_files_exist(self):
        self.assertTrue(os.path.exists(self.csv_path), f"Missing {self.csv_path}")
        self.assertTrue(os.path.exists(self.json_path), f"Missing {self.json_path}")
        self.assertTrue(os.path.exists(self.md_path), f"Missing {self.md_path}")

    def test_benchmark_json_schema(self):
        with open(self.json_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        self.assertEqual(len(data), 4, "Expected 4 benchmark scenarios")
        for sc in data:
            self.assertIn("scenario", sc)
            self.assertIn("sequential", sc)
            self.assertIn("parallel_runs", sc)
            self.assertEqual(len(sc["parallel_runs"]), 4, "Expected 4 thread configurations (1, 2, 4, 8)")
            for pr in sc["parallel_runs"]:
                self.assertIn("speedup", pr)
                self.assertIn("efficiency_percent", pr)
                self.assertIn("karp_flatt_serial_fraction", pr)
                self.assertGreater(pr["mean_time_ms"], 0.0)

    def test_speedup_scaling_trends(self):
        with open(self.json_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        stress_sc = data[3] # Scenario 4
        # Multi-threading on high load should yield speedup > 1.5x on 4 threads
        t4_run = [r for r in stress_sc["parallel_runs"] if r["num_threads"] == 4][0]
        self.assertGreater(t4_run["speedup"], 1.5, "Parallel speedup on stress load should exceed 1.5x")

if __name__ == "__main__":
    unittest.main()
