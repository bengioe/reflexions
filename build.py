import os
import json
import datetime
import markdown2

os.system("cp -R src/static/* docs/")

conv = {"date": lambda v: v, "title": lambda v: v}
date2obj = lambda v: datetime.datetime.strptime(v["date"], "%Y-%m-%dT%H:%M:%S")
all_items = []

for item in os.listdir("src/items"):
    data = {}
    with open(f"src/items/{item}", "r") as f:
        line = f.readline()
        data["title"] = data["name"] = item
        while line.startswith("#"):
            k, v = line[1:].split(" ", 1)
            v = conv[k](v.strip())
            data[k] = v
            line = f.readline()
        data["body"] = line + f.read()
    all_items.append(data)


all_items.sort(key=lambda v: -date2obj(v).timestamp())


def insert_recent(n=3):
    return "\n".join(f"- [{i['title']}](?ii={i['name']})" for i in all_items[:n])


mder = markdown2.Markdown()

for item in all_items:
    print(item["name"], item["title"])
    item["body"] = mder.convert(eval(f'f"""{item["body"]}"""'))
    with open(f"docs/items/{item['name']}", "w") as f:
        json.dump(item, f)
