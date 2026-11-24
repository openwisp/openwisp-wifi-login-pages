"""Check CI test commands without running frontend or browser tests."""

import os
import subprocess
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


class CiEntrypointTests(unittest.TestCase):
    def run_script(self, *arguments, status=0):
        with tempfile.TemporaryDirectory() as directory:
            fake = Path(directory) / "yarn"
            fake.write_text('#!/bin/sh\nprintf "%s\\n" "$@"\nexit "$STATUS"\n')
            fake.chmod(0o755)
            return subprocess.run(
                [str(ROOT / "runtests"), *arguments],
                cwd=ROOT,
                env={
                    **os.environ,
                    "PATH": f"{directory}:{os.environ['PATH']}",
                    "STATUS": str(status),
                },
                capture_output=True,
                text=True,
            )

    def test_ci_modes(self):
        for argument, command in (
            ("--coverage", "coverage"),
            ("--es5", "test-es5"),
            ("--browser", "browser-test"),
        ):
            with self.subTest(argument=argument):
                result = self.run_script(argument)
                self.assertEqual(result.returncode, 0, result.stderr)
                self.assertEqual(result.stdout.splitlines(), [command])

    def test_rejects_unsupported_arguments(self):
        for argument in (
            "--config=other",
            "--setupFiles=other.js",
            "../test.js",
            "client/test.js;id",
        ):
            with self.subTest(argument=argument):
                result = self.run_script(argument)
                self.assertEqual(result.returncode, 2)
                self.assertIn("unsupported", result.stderr.lower())
                self.assertEqual(result.stdout, "")

    def test_returns_runner_status(self):
        self.assertEqual(self.run_script("--coverage", status=17).returncode, 17)

    def test_default_mode_and_conflicting_arguments(self):
        self.assertEqual(self.run_script().stdout.splitlines(), ["test"])
        for arguments in (
            ("--coverage", "--es5"),
            ("--coverage", "client/utils/continuation.test.js"),
        ):
            with self.subTest(arguments=arguments):
                result = self.run_script(*arguments)
                self.assertEqual(result.returncode, 2)
                self.assertIn("unsupported", result.stderr.lower())
                self.assertEqual(result.stdout, "")

    def test_focused_unit_test_path(self):
        result = self.run_script("client/utils/continuation.test.js", "--runInBand")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(
            result.stdout.splitlines(),
            [
                "jest",
                "--runTestsByPath",
                "client/utils/continuation.test.js",
                "--runInBand",
            ],
        )
