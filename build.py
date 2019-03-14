import os
import json
import datetime
import markdown2

os.system("cp -R src/static/* docs/")

date2obj = lambda v: datetime.datetime.strptime(v["date"], "%Y-%m-%dT%H:%M:%S")
all_items = []

for item in os.listdir("src/items"):
    if "#" in item:
        continue
    data = {"asides": []}
    with open(f"src/items/{item}", "r") as f:
        line = f.readline()
        data["title"] = data["name"] = item
        target = "body"
        while line:
            if line.startswith("#"):
                k, v = (line[1:].strip().split(" ", 1) + [True])[:2]
                if k == "aside":
                    target = "aside:" + v
                    data["asides"].append(target)
                elif k == "body":
                    target = "body"
                else:
                    data[k] = v
            else:
                data[target] = data.get(target, "") + line
            line = f.readline()
    all_items.append(data)


all_items.sort(key=lambda v: -date2obj(v).timestamp())


def insert_recent(n=3, date=False):
    return "\n".join(
        f"- {i['date'].split('T')[0] if date else ''} [{i['title']}](?ii={i['name']})"
        for i in all_items[:n]
    )


mder = markdown2.Markdown(extras=["cuddled-lists", "code-friendly"])

for item in all_items:
    print(item["name"], item["title"])
    for target in ["body"] + item["asides"]:
        print(f"  {target}")
        if item.get("eval_python", False):
            item[target] = eval(f'f"""{item[target]}"""')
        item[target] = mder.convert(item[target])
    with open(f"docs/items/{item['name']}", "w") as f:
        json.dump(item, f)
