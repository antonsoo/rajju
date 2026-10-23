"""Independent source arithmetic and numerical-area integration; no app imports."""
import json
import math
import sys
from fractions import Fraction as F


def close(actual, expected, name, tolerance=2e-10):
    if not math.isclose(float(actual), float(expected), rel_tol=tolerance, abs_tol=tolerance):
        raise AssertionError(f"{name}: {actual} != {expected}")


def integrate_gained(radius):
    # Integrate one protruding segment in polar coordinates rather than using
    # the app's circular-segment formula. The other three are congruent.
    angle = math.acos(0.5 / radius)
    count = 2048
    delta = angle / count
    def f(theta):
        return radius * radius - (0.5 / math.cos(theta)) ** 2
    total = f(0) + f(angle)
    for i in range(1, count):
        total += (4 if i % 2 else 2) * f(i * delta)
    return 4 * total * delta / 3


def expected_circle(side, rule, kept, back):
    projection = math.sqrt(2) / 2 - 0.5
    fraction = 1 / 3 if rule == "third" else ((math.pi ** -0.5 - 0.5) / projection if rule == "equal" else kept / 1000)
    radius = 0.5 + fraction * projection
    # Direct transcription of the removal rule on printed p. 27: remove
    # 28 twenty-ninths of one eighth, then a sixth less its own eighth.
    factor = 1 - F(28, 8 * 29) - (F(1, 8 * 29 * 6) - F(1, 8 * 29 * 6 * 8)) if back == "detailed" else F(13, 15)
    circle_area = math.pi * radius * radius
    new_side = 2 * radius * float(factor)
    gained = integrate_gained(radius)
    return {
        "kept": fraction, "radius": radius * side, "diameter": 2 * radius * side,
        "circleAreaRatio": circle_area, "returnedSide": new_side * side,
        "returnedAreaRatio": new_side * new_side,
        "gainedRatio": gained, "lostRatio": 1 + gained - circle_area,
        "circleErrorPercent": 100 * (circle_area - 1),
        "returnErrorPercent": 100 * (new_side * new_side - 1),
        "returnErrorFromCirclePercent": 100 * (new_side * new_side / circle_area - 1),
        "factor": str(factor),
    }


def verify_models(data):
    for m in data["circle"]:
        expected = expected_circle(m["side"], m["rule"], m["thousandths"], m["returnRule"])
        for key, value in expected.items():
            if key == "factor":
                assert m["returnFactor"] == value
            else:
                close(m[key], value, key)
    stages = [F(1), 1 + F(1, 3), 1 + F(1, 3) + F(1, 3 * 4), 1 + F(1, 3) + F(1, 3 * 4) - F(1, 3 * 4 * 34)]
    for m in data["diagonal"]:
        ratio = stages[m["stage"]]
        assert F(m["ratio"]) == ratio
        assert F(m["area"]) == ratio * ratio
        assert F(m["areaError"]) == ratio * ratio - 2
        assert F(m["relativeAreaError"]) == (ratio * ratio - 2) / 2
        close(m["diagonal"], float(ratio) * m["side"], "cord length")
        close(m["lengthError"], (float(ratio) - math.sqrt(2)) * m["side"], "length error")
        close(m["areaErrorPpm"], float((ratio * ratio - 2) / 2 * 1000000), "relative area ppm")
    return {"circle_cases": len(data["circle"]), "diagonal_cases": len(data["diagonal"]), "area_oracle": "Simpson integration in polar coordinates", "arithmetic": "independent rational transcription"}


def verify_rendered(data):
    count = 0
    for record in data["constructions"]:
        state = record["state"]
        if state["lesson"] == "circle":
            expected = expected_circle(state["side"], state["rule"], state["kept"], state["returnRule"])
            drawn = record["svg"]
            close(drawn["radius"] / drawn["scale"], expected["radius"] / state["side"], "actual SVG radius")
            close(drawn["squareWidth"] / drawn["scale"], 1, "actual square width")
            close(drawn["returnedWidth"] / drawn["returnScale"], expected["returnedSide"] / state["side"], "actual SVG return width")
            csv = {(r["scope"], r["quantity"]): r for r in record["csv"]}
            for scope, quantity, key in [("circle", "radius", "radius"), ("circle", "area_error_percent", "circleErrorPercent"), ("return", "side", "returnedSide"), ("return", "area_error_percent", "returnErrorPercent"), ("return", "circle_area_error_percent", "returnErrorFromCirclePercent")]:
                close(csv[(scope, quantity)]["value"], expected[key], f"browser CSV {quantity}")
        else:
            ratio = [F(1), F(4, 3), F(17, 12), F(577, 408)][state["stage"]]
            drawn = record["svg"]
            points = drawn["points"]
            length = math.dist(points[0], points[1])
            close(length / drawn["scale"], float(ratio), "actual SVG numerical cord")
            area = abs(sum(points[i][0] * points[(i+1)%4][1] - points[(i+1)%4][0] * points[i][1] for i in range(4))) / 2
            close(area / drawn["scale"] ** 2, float(ratio ** 2), "actual polygon area")
            csv = {r["quantity"]: r["value"] for r in record["csv"] if r["scope"] == "diagonal"}
            assert F(csv["ratio"]) == ratio
            assert F(csv["relative_area_error"]) == (ratio * ratio - 2) / 2
        count += 1
    return {"rendered_constructions": count, "checked": ["SVG coordinates", "actual downloaded CSV", "reference area semantics"]}


if __name__ == "__main__":
    data = json.load(sys.stdin)
    result = verify_rendered(data) if "--rendered" in sys.argv else verify_models(data)
    print(json.dumps(result, indent=2))
