#!/usr/bin/env python3
"""Fetch the CP 1919 pulsar data and write it as cp1919.json.

The data is the plot from Harold Craft's 1970 thesis, as a CSV that
pachadotdev published (see README.md, "Data notes"). Its columns are
x (sample, 1..300), y (pulse, 1..80) and z (the sample value). The page wants
`{"pulses": [[300 samples] x 80]}`, pulse 1 first.

    python3 fetch_cp1919.py                   # fetch the pinned CSV, write cp1919.json
    python3 fetch_cp1919.py --source my.csv   # a local file or another URL
    python3 fetch_cp1919.py --out other.json

Only the standard library is used. A broken CSV (bad header, a value that is
not a number, a duplicate or missing cell) stops with an error instead of
writing a wrong file.
"""

import argparse
import csv
import io
import json
import sys
import urllib.error
import urllib.request
from pathlib import Path

# Pinned to a commit: the repo moved the file once already (cp1919.csv at the
# root became dev/cp1919.csv), and `main` may move it again.
SOURCE = (
    "https://raw.githubusercontent.com/pachadotdev/cp1919/"
    "9837036a4f81c5e454019a40ea0d8eb96b06fc5f/dev/cp1919.csv"
)
OUT = Path(__file__).with_name("cp1919.json")

# Prettier's line width. The file is committed Prettier-formatted, so we write
# it that way and a re-run leaves no diff.
WIDTH = 80


def read_source(source: str) -> str:
    if source.startswith(("http://", "https://")):
        request = urllib.request.Request(
            source, headers={"User-Agent": "fetch_cp1919.py"}
        )
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                return response.read().decode("utf-8")
        except urllib.error.URLError as error:
            sys.exit(f"could not fetch {source}: {error}")
    try:
        return Path(source).read_text(encoding="utf-8")
    except OSError as error:
        sys.exit(f"could not read {source}: {error.strerror}")


def parse_pulses(text: str) -> list[list[float]]:
    reader = csv.DictReader(io.StringIO(text, newline=""))
    if reader.fieldnames != ["x", "y", "z"]:
        sys.exit(f'expected the header "x,y,z", got {reader.fieldnames}')

    cells: dict[tuple[int, int], float] = {}
    for line, row in enumerate(reader, start=2):
        try:
            x, y, z = int(row["x"]), int(row["y"]), float(row["z"])
        except (TypeError, ValueError):
            sys.exit(f"line {line}: not numbers: {row}")
        if (y, x) in cells:
            sys.exit(f"line {line}: duplicate cell x={x} y={y}")
        cells[(y, x)] = z

    if not cells:
        sys.exit("the CSV has no rows")
    n_pulses = max(y for y, _ in cells)
    n_samples = max(x for _, x in cells)
    missing = [
        (y, x)
        for y in range(1, n_pulses + 1)
        for x in range(1, n_samples + 1)
        if (y, x) not in cells
    ]
    if missing or min(min(y for y, _ in cells), min(x for _, x in cells)) < 1:
        sys.exit(
            f"the grid is not a full 1..{n_samples} x 1..{n_pulses} block; first gap (y, x): {missing[:1]}"
        )

    return [
        [cells[(y, x)] for x in range(1, n_samples + 1)] for y in range(1, n_pulses + 1)
    ]


def format_json(pulses: list[list[float]]) -> str:
    """json.dumps(indent=2) puts every number on its own line (a 700 KB file).
    Prettier fills number arrays up to WIDTH columns, so do the same."""
    lines = ["{", '  "pulses": [']
    for i, pulse in enumerate(pulses):
        lines.append("    [")
        indent = " " * 6
        line = indent
        for j, value in enumerate(pulse):
            token = json.dumps(value) + ("," if j < len(pulse) - 1 else "")
            if line == indent:
                line += token
            elif len(line) + 1 + len(token) <= WIDTH:
                line += " " + token
            else:
                lines.append(line)
                line = indent + token
        lines.append(line)
        lines.append("    ]" + ("," if i < len(pulses) - 1 else ""))
    lines += ["  ]", "}"]
    return "\n".join(lines) + "\n"


def main() -> None:
    # `__doc__` is None under `python -OO`, which strips docstrings.
    parser = argparse.ArgumentParser(description=(__doc__ or "").split("\n")[0])
    parser.add_argument(
        "--source", default=SOURCE, help="CSV URL or path (default: the pinned commit)"
    )
    parser.add_argument(
        "--out",
        type=Path,
        default=OUT,
        help=f"output file (default: {OUT.name} next to this script)",
    )
    args = parser.parse_args()

    pulses = parse_pulses(read_source(args.source))
    args.out.write_text(format_json(pulses), encoding="utf-8")
    print(f"wrote {args.out}: {len(pulses)} pulses x {len(pulses[0])} samples")


if __name__ == "__main__":
    main()
